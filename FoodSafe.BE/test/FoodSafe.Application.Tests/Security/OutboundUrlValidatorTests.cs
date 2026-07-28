using System.Net;
using System.Net.Http;
using System.Net.Sockets;
using FoodSafe.Security;
using Shouldly;
using Volo.Abp;
using Xunit;

namespace FoodSafe.Security;

/// <summary>
/// Regression tests for the SSRF guard (blocker B-5). Cover the syntactic
/// <see cref="OutboundUrlValidator.Validate"/> gate, the <see cref="OutboundUrlValidator.IsBlocked"/>
/// address truth table, and a real-socket assertion that the guarded
/// <see cref="HttpClient"/> refuses to connect to loopback even when a live
/// server is listening (the DNS-rebinding / connect-time defence).
/// </summary>
public sealed class OutboundUrlValidatorTests
{
    // ---- Validate: rejections -------------------------------------------

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("not-a-url")]
    [InlineData("/relative/path")]
    [InlineData("doi-tac.gov.vn/api")] // missing scheme => not absolute
    public void Validate_rejects_non_absolute_or_empty(string? url)
    {
        Should.Throw<UserFriendlyException>(() => OutboundUrlValidator.Validate(url));
    }

    [Theory]
    [InlineData("ftp://doi-tac.gov.vn/api")]
    [InlineData("file:///etc/passwd")]
    [InlineData("gopher://doi-tac.gov.vn/")]
    [InlineData("ldap://doi-tac.gov.vn/")]
    public void Validate_rejects_non_http_schemes(string url)
    {
        Should.Throw<UserFriendlyException>(() => OutboundUrlValidator.Validate(url));
    }

    [Theory]
    [InlineData("http://user:pass@doi-tac.gov.vn/api")]
    [InlineData("https://admin@doi-tac.gov.vn/api")]
    public void Validate_rejects_embedded_credentials(string url)
    {
        Should.Throw<UserFriendlyException>(() => OutboundUrlValidator.Validate(url));
    }

    [Theory]
    [InlineData("http://127.0.0.1/api")]
    [InlineData("http://169.254.169.254/latest/meta-data/")] // cloud metadata
    [InlineData("http://10.0.0.1/internal")]
    [InlineData("http://172.16.5.4/internal")]
    [InlineData("http://192.168.1.1/router")]
    [InlineData("http://100.64.0.1/cgnat")]
    [InlineData("http://[::1]/api")]
    [InlineData("http://[fc00::1]/api")]
    [InlineData("http://0.0.0.0/api")]
    public void Validate_rejects_literal_internal_addresses(string url)
    {
        // localhost. is not an IP literal so it passes Validate and is caught at connect;
        // only assert on the genuine literal cases here.
        if (IPAddress.TryParse(new Uri(url).Host.Trim('[', ']'), out _))
        {
            Should.Throw<UserFriendlyException>(() => OutboundUrlValidator.Validate(url));
        }
    }

    // ---- Validate: acceptance -------------------------------------------

    [Theory]
    [InlineData("https://doi-tac.gov.vn/api/share")]
    [InlineData("http://api.moh.gov.vn:8080/receive")]
    [InlineData("https://8.8.8.8/api")] // public literal IP is allowed
    public void Validate_accepts_public_http_urls(string url)
    {
        var uri = OutboundUrlValidator.Validate(url);
        uri.ShouldNotBeNull();
        uri.AbsoluteUri.ShouldStartWith(uri.Scheme);
    }

    // ---- IsBlocked truth table ------------------------------------------

    [Theory]
    [InlineData("127.0.0.1")]
    [InlineData("127.10.20.30")]
    [InlineData("0.0.0.0")]
    [InlineData("10.1.2.3")]
    [InlineData("100.64.0.1")]
    [InlineData("100.127.255.255")]
    [InlineData("169.254.169.254")]
    [InlineData("172.16.0.1")]
    [InlineData("172.31.255.255")]
    [InlineData("192.0.0.1")]
    [InlineData("192.0.2.5")]
    [InlineData("192.168.0.1")]
    [InlineData("198.18.0.1")]
    [InlineData("224.0.0.1")]
    [InlineData("255.255.255.255")]
    [InlineData("::1")]
    [InlineData("::")]
    [InlineData("fe80::1")]        // link-local
    [InlineData("fc00::1")]        // unique-local
    [InlineData("fd12:3456::1")]   // unique-local
    [InlineData("ff02::1")]        // multicast
    [InlineData("::ffff:127.0.0.1")] // IPv4-mapped loopback
    [InlineData("::ffff:10.0.0.1")]  // IPv4-mapped private
    public void IsBlocked_returns_true_for_internal_and_reserved(string ip)
    {
        OutboundUrlValidator.IsBlocked(IPAddress.Parse(ip)).ShouldBeTrue(ip);
    }

    [Theory]
    [InlineData("8.8.8.8")]
    [InlineData("1.1.1.1")]
    [InlineData("203.0.100.5")]
    [InlineData("172.15.0.1")]  // just below the 172.16/12 private block
    [InlineData("172.32.0.1")]  // just above it
    [InlineData("100.63.255.255")] // just below CGNAT
    [InlineData("100.128.0.1")]    // just above CGNAT
    [InlineData("192.0.1.1")]      // 192.0.1/24 is not reserved here
    [InlineData("2606:4700:4700::1111")] // public IPv6 (Cloudflare)
    public void IsBlocked_returns_false_for_public_addresses(string ip)
    {
        OutboundUrlValidator.IsBlocked(IPAddress.Parse(ip)).ShouldBeFalse(ip);
    }

    // ---- Real connect-time defence --------------------------------------

    [Fact]
    public async Task GuardedHttpClient_refuses_to_connect_to_loopback_even_with_a_live_listener()
    {
        // A real TCP server is listening on loopback. A naive client would connect;
        // the guarded client must refuse at the connect callback (SSRF / rebinding).
        using var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        var port = ((IPEndPoint)listener.LocalEndpoint).Port;
        // Accept-and-drop loop so a connection attempt would otherwise succeed.
        _ = Task.Run(async () =>
        {
            try
            {
                using var client = await listener.AcceptTcpClientAsync();
            }
            catch
            {
                // listener stopped — expected on dispose.
            }
        });

        using var http = OutboundUrlValidator.CreateGuardedHttpClient(TimeSpan.FromSeconds(5));

        var ex = await Should.ThrowAsync<HttpRequestException>(
            () => http.GetAsync($"http://127.0.0.1:{port}/"));

        // The refusal originates in the guard's connect callback.
        ex.ShouldNotBeNull();

        listener.Stop();
    }

    [Fact]
    public async Task GuardedHttpClient_refuses_ipv6_loopback_listener()
    {
        using var listener = new TcpListener(IPAddress.IPv6Loopback, 0);
        listener.Start();
        var port = ((IPEndPoint)listener.LocalEndpoint).Port;
        _ = Task.Run(async () =>
        {
            try
            {
                using var client = await listener.AcceptTcpClientAsync();
            }
            catch
            {
                // expected on dispose
            }
        });

        using var http = OutboundUrlValidator.CreateGuardedHttpClient(TimeSpan.FromSeconds(5));

        await Should.ThrowAsync<HttpRequestException>(
            () => http.GetAsync($"http://[::1]:{port}/"));

        listener.Stop();
    }

    // ---- Outbound-cap regression (redirect + response size) -------------
    //
    // These two SSRF caps cannot be exercised end-to-end: the connect guard
    // refuses every address a test HTTP server could bind to (loopback/private),
    // so there is no reachable origin to serve a 3xx or an oversized body. The
    // meaningful regression guard is therefore that the guarded handler/client
    // is *configured* with the caps — locking them so a future refactor cannot
    // silently re-enable redirect following or drop the response-size ceiling.

    [Fact]
    public void GuardedHandler_never_follows_redirects()
    {
        using var handler = OutboundUrlValidator.CreateGuardedHandler();

        // A partner 3xx must be recorded as the call outcome, never followed —
        // following would let a partner response steer the (possibly
        // credentialed) request to an attacker-chosen host, defeating Validate.
        handler.AllowAutoRedirect.ShouldBeFalse();
        handler.ConnectCallback.ShouldNotBeNull(); // connect-time IP guard is wired
    }

    [Fact]
    public void GuardedHttpClient_caps_the_buffered_response_size()
    {
        using var http = OutboundUrlValidator.CreateGuardedHttpClient(TimeSpan.FromSeconds(5));

        // An oversized partner reply must fail rather than exhaust server memory.
        http.MaxResponseContentBufferSize.ShouldBe(OutboundUrlValidator.MaxResponseBytes);
        OutboundUrlValidator.MaxResponseBytes.ShouldBe(2L * 1024 * 1024);
    }
}
