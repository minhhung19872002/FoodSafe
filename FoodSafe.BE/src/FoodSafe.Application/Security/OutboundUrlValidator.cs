using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;
using Volo.Abp;

namespace FoodSafe.Security;

/// <summary>
/// Server-Side Request Forgery (SSRF) guard for the DataIntegration outbound
/// HTTP surface (blocker B-5). Partner endpoint URLs are operator-supplied and
/// are probed / posted to by the server, so they must never be allowed to reach
/// loopback, private, link-local, or cloud-metadata addresses.
/// </summary>
/// <remarks>
/// Two layers of defence:
/// <list type="number">
///   <item><description><see cref="Validate"/> — syntactic gate at write time and
///   before every send: absolute http/https only, no embedded credentials, and a
///   literal-IP host must be public.</description></item>
///   <item><description><see cref="CreateGuardedHttpClient"/> — an
///   <see cref="HttpClient"/> whose connect callback re-resolves the host and
///   refuses to open a socket to any disallowed IP. Because the check runs on the
///   actual connect target, it also defeats DNS-rebinding (TOCTOU) attacks that a
///   name-based pre-check cannot.</description></item>
/// </list>
/// </remarks>
public static class OutboundUrlValidator
{
    /// <summary>
    /// Validates that <paramref name="url"/> is a well-formed absolute http/https
    /// URL with no embedded credentials and, when the host is a literal IP, that
    /// the IP is publicly routable. Throws <see cref="UserFriendlyException"/>
    /// (Vietnamese message) otherwise.
    /// </summary>
    public static Uri Validate(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)
            || !Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            throw new UserFriendlyException(
                "URL điểm kết nối không hợp lệ. Cần một URL tuyệt đối, ví dụ https://doi-tac.gov.vn/api.");
        }

        if (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)
        {
            throw new UserFriendlyException(
                "URL điểm kết nối chỉ được dùng giao thức http hoặc https.");
        }

        if (!string.IsNullOrEmpty(uri.UserInfo))
        {
            throw new UserFriendlyException(
                "URL điểm kết nối không được chứa thông tin đăng nhập (user:pass@host).");
        }

        // If the host is a literal IP, reject private/reserved ranges up front.
        // Hostnames are resolved and re-checked at connect time by the guarded client.
        if (IPAddress.TryParse(uri.Host, out var literal) && IsBlocked(literal))
        {
            throw new UserFriendlyException(
                "URL điểm kết nối trỏ tới địa chỉ nội bộ/không được phép.");
        }

        return uri;
    }

    /// <summary>
    /// Creates an <see cref="HttpClient"/> that refuses to connect to any host
    /// resolving to a private, loopback, link-local, or reserved address. The
    /// returned client is intended to be long-lived and shared.
    /// </summary>
    /// <summary>Upper bound for a partner response we are willing to buffer (2 MB).</summary>
    public const long MaxResponseBytes = 2 * 1024 * 1024;

    public static HttpClient CreateGuardedHttpClient(TimeSpan timeout)
    {
        return new HttpClient(CreateGuardedHandler(), disposeHandler: true)
        {
            Timeout = timeout,
            // Cap how much partner response is buffered (oversized replies fail).
            MaxResponseContentBufferSize = MaxResponseBytes
        };
    }

    /// <summary>
    /// Builds the hardened <see cref="SocketsHttpHandler"/> used by
    /// <see cref="CreateGuardedHttpClient"/>. Exposed to the test project so the
    /// redirect and DNS-lifetime SSRF caps can be locked by regression tests
    /// without a reachable server (the connect guard blocks every address a test
    /// listener could bind to).
    /// </summary>
    internal static SocketsHttpHandler CreateGuardedHandler()
    {
        return new SocketsHttpHandler
        {
            // Bound how long a stale DNS answer can be reused before re-resolution.
            PooledConnectionLifetime = TimeSpan.FromMinutes(2),
            // Never follow redirects: a partner response must not be able to
            // steer the (possibly credentialed) request to another host. A 3xx
            // is recorded as the call outcome instead.
            AllowAutoRedirect = false,
            ConnectCallback = GuardedConnectAsync
        };
    }

    private static async ValueTask<Stream> GuardedConnectAsync(
        SocketsHttpConnectionContext context,
        CancellationToken cancellationToken)
    {
        var host = context.DnsEndPoint.Host;
        var port = context.DnsEndPoint.Port;

        IPAddress[] resolved = IPAddress.TryParse(host, out var literal)
            ? new[] { literal }
            : await Dns.GetHostAddressesAsync(host, cancellationToken)
                .ConfigureAwait(false);

        var allowed = resolved.Where(ip => !IsBlocked(ip)).ToArray();
        if (allowed.Length == 0)
        {
            throw new IOException(
                "SSRF guard: host resolves only to disallowed (private/reserved) addresses.");
        }

        var socket = new Socket(SocketType.Stream, ProtocolType.Tcp) { NoDelay = true };
        try
        {
            // Connect only to the validated addresses — never re-resolves the name,
            // so a rebinding answer cannot substitute a private IP after the check.
            await socket.ConnectAsync(allowed, port, cancellationToken).ConfigureAwait(false);
            return new NetworkStream(socket, ownsSocket: true);
        }
        catch
        {
            socket.Dispose();
            throw;
        }
    }

    /// <summary>
    /// Returns <see langword="true"/> when <paramref name="address"/> is not a
    /// publicly routable unicast address (loopback, private, link-local, CGNAT,
    /// multicast, or otherwise reserved).
    /// </summary>
    internal static bool IsBlocked(IPAddress address)
    {
        // Unwrap IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1) so the IPv4 rules apply.
        if (address.IsIPv4MappedToIPv6)
        {
            address = address.MapToIPv4();
        }

        if (IPAddress.IsLoopback(address))
        {
            return true;
        }

        if (address.AddressFamily == AddressFamily.InterNetwork)
        {
            var b = address.GetAddressBytes();

            // 0.0.0.0/8 "this network" / unspecified
            if (b[0] == 0) return true;
            // 10.0.0.0/8 private
            if (b[0] == 10) return true;
            // 100.64.0.0/10 carrier-grade NAT
            if (b[0] == 100 && b[1] >= 64 && b[1] <= 127) return true;
            // 127.0.0.0/8 loopback (covered by IsLoopback, kept for completeness)
            if (b[0] == 127) return true;
            // 169.254.0.0/16 link-local (includes 169.254.169.254 cloud metadata)
            if (b[0] == 169 && b[1] == 254) return true;
            // 172.16.0.0/12 private
            if (b[0] == 172 && b[1] >= 16 && b[1] <= 31) return true;
            // 192.0.0.0/24 IETF protocol assignments; 192.0.2.0/24 TEST-NET-1
            if (b[0] == 192 && b[1] == 0 && (b[2] == 0 || b[2] == 2)) return true;
            // 192.168.0.0/16 private
            if (b[0] == 192 && b[1] == 168) return true;
            // 198.18.0.0/15 benchmarking
            if (b[0] == 198 && (b[1] == 18 || b[1] == 19)) return true;
            // 224.0.0.0/4 multicast and 240.0.0.0/4 reserved (incl. 255.255.255.255)
            if (b[0] >= 224) return true;

            return false;
        }

        if (address.AddressFamily == AddressFamily.InterNetworkV6)
        {
            if (address.IsIPv6LinkLocal || address.IsIPv6Multicast
                || address.IsIPv6SiteLocal)
            {
                return true;
            }

            var b = address.GetAddressBytes();

            // :: unspecified
            if (b.All(x => x == 0)) return true;
            // fc00::/7 unique local addresses
            if ((b[0] & 0xFE) == 0xFC) return true;

            return false;
        }

        // Unknown address family — refuse by default.
        return true;
    }
}
