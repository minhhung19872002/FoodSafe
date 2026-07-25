using System.Net;
using System.Text;
using FoodSafe.Security;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Shouldly;
using Xunit;

namespace FoodSafe;

public sealed class TurnstileCaptchaVerifierTests
{
    [Fact]
    public async Task Development_Should_Accept_A_Successful_Verification()
    {
        string? submittedForm = null;
        var verifier = CreateVerifier(
            """{"success":true,"action":"different","hostname":"different.example"}""",
            false,
            request =>
            {
                submittedForm = request.Content!.ReadAsStringAsync().GetAwaiter().GetResult();
            });

        var result = await verifier.VerifyAsync(
            "valid-token",
            "127.0.0.1",
            CancellationToken.None);

        result.ShouldBeTrue();
        submittedForm.ShouldNotBeNull();
        submittedForm.ShouldContain("secret=production-secret-key");
        submittedForm.ShouldContain("response=valid-token");
        submittedForm.ShouldContain("remoteip=127.0.0.1");
        submittedForm.ShouldContain("idempotency_key=");
    }

    [Theory]
    [InlineData("different", "foodsafe.example.gov.vn")]
    [InlineData("login", "attacker.example")]
    public async Task Production_Should_Require_The_Configured_Action_And_Hostname(
        string action,
        string hostname)
    {
        var verifier = CreateVerifier(
            $$"""{"success":true,"action":"{{action}}","hostname":"{{hostname}}"}""",
            true);

        var result = await verifier.VerifyAsync(
            "valid-token",
            null,
            CancellationToken.None);

        result.ShouldBeFalse();
    }

    [Fact]
    public async Task Verification_Should_Fail_Closed_When_Provider_Response_Is_Invalid()
    {
        var verifier = CreateVerifier("not-json", false);

        var result = await verifier.VerifyAsync(
            "valid-token",
            null,
            CancellationToken.None);

        result.ShouldBeFalse();
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public async Task Verification_Should_Reject_Missing_Tokens_Without_A_Provider_Call(
        string token)
    {
        var providerCalled = false;
        var verifier = CreateVerifier(
            """{"success":true}""",
            false,
            _ => providerCalled = true);

        var result = await verifier.VerifyAsync(
            token,
            null,
            CancellationToken.None);

        result.ShouldBeFalse();
        providerCalled.ShouldBeFalse();
    }

    private static TurnstileCaptchaVerifier CreateVerifier(
        string responseBody,
        bool production,
        Action<HttpRequestMessage>? inspectRequest = null)
    {
        var handler = new StubHandler(request =>
        {
            inspectRequest?.Invoke(request);
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    responseBody,
                    Encoding.UTF8,
                    "application/json")
            };
        });
        var options = Options.Create(new CaptchaOptions
        {
            SiteKey = "production-site-key",
            SecretKey = "production-secret-key",
            Action = "login",
            ExpectedHostname = "foodsafe.example.gov.vn"
        });

        return new TurnstileCaptchaVerifier(
            new HttpClient(handler),
            options,
            new StubHostEnvironment(production),
            NullLogger<TurnstileCaptchaVerifier>.Instance);
    }

    private sealed class StubHandler(
        Func<HttpRequestMessage, HttpResponseMessage> respond) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            return Task.FromResult(respond(request));
        }
    }

    private sealed class StubHostEnvironment(bool production) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } =
            production ? Environments.Production : Environments.Development;
        public string ApplicationName { get; set; } = "FoodSafe.Tests";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public IFileProvider ContentRootFileProvider { get; set; } =
            new NullFileProvider();
    }
}
