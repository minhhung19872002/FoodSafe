using System.Net;
using System.Text;
using FoodSafe.Security;
using Microsoft.AspNetCore.Http;
using Shouldly;
using Xunit;

namespace FoodSafe;

/// <summary>
/// Tests that LoginCaptchaMiddleware enforces CAPTCHA on the password-reset path.
///
/// Coverage per the B8 acceptance requirement:
///  1. Missing CAPTCHA token is rejected.
///  2. Empty CAPTCHA token is rejected.
///  3. Invalid CAPTCHA token is rejected.
///  4. CAPTCHA-provider failure is handled safely (fails closed).
///  5. Valid CAPTCHA token allows the request to continue.
///  6. Password-reset code is not generated when CAPTCHA fails (next not called).
///  7. Error responses do not expose secrets or provider details.
///  8. The login endpoint remains protected (cross-check).
///  9. The password-reset endpoint is protected.
/// 10. Unrelated public endpoints are not accidentally blocked.
/// </summary>
public sealed class PasswordResetCaptchaTests
{
    private const string PasswordResetPath = "/api/account/send-password-reset-code";

    // ──────────────────────────────────────────────────────────────────────
    // 1. Missing token is rejected
    // ──────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task PasswordReset_Rejects_Request_With_No_CaptchaToken_Field()
    {
        var nextCalled = false;
        var middleware = new LoginCaptchaMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        });
        var context = CreateContext(
            """{"email":"user@example.vn","appName":"FoodSafe"}""",
            PasswordResetPath);

        await middleware.InvokeAsync(context, new RejectingVerifier());

        context.Response.StatusCode.ShouldBe(StatusCodes.Status400BadRequest);
        nextCalled.ShouldBeFalse();
    }

    // ──────────────────────────────────────────────────────────────────────
    // 2. Empty token is rejected
    // ──────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task PasswordReset_Rejects_Empty_CaptchaToken()
    {
        var nextCalled = false;
        var middleware = new LoginCaptchaMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        });
        var context = CreateContext(
            """{"email":"user@example.vn","captchaToken":"","appName":"FoodSafe"}""",
            PasswordResetPath);

        await middleware.InvokeAsync(context, new RejectingVerifier());

        context.Response.StatusCode.ShouldBe(StatusCodes.Status400BadRequest);
        nextCalled.ShouldBeFalse();
    }

    // ──────────────────────────────────────────────────────────────────────
    // 3. Invalid token (non-empty but provider rejects) is rejected
    // ──────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task PasswordReset_Rejects_Invalid_CaptchaToken()
    {
        var nextCalled = false;
        var middleware = new LoginCaptchaMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        });
        var context = CreateContext(
            """{"email":"user@example.vn","captchaToken":"invalid-token","appName":"FoodSafe"}""",
            PasswordResetPath);

        await middleware.InvokeAsync(context, new RejectingVerifier());

        context.Response.StatusCode.ShouldBe(StatusCodes.Status400BadRequest);
        nextCalled.ShouldBeFalse();
    }

    // ──────────────────────────────────────────────────────────────────────
    // 4. Provider failure is handled safely (fails closed)
    //    The real TurnstileCaptchaVerifier catches HttpRequestException and
    //    returns false. The middleware must treat false as a rejection.
    // ──────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task PasswordReset_Provider_Failure_Is_Treated_As_Rejection()
    {
        var nextCalled = false;
        var middleware = new LoginCaptchaMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        });
        var context = CreateContext(
            """{"email":"user@example.vn","captchaToken":"any-token"}""",
            PasswordResetPath);

        // Verifier returns false — equivalent to provider returning an error.
        await middleware.InvokeAsync(context, new RejectingVerifier());

        context.Response.StatusCode.ShouldBe(StatusCodes.Status400BadRequest);
        nextCalled.ShouldBeFalse();
    }

    // ──────────────────────────────────────────────────────────────────────
    // 5. Valid token allows request to continue
    // ──────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task PasswordReset_Allows_Request_With_Valid_CaptchaToken()
    {
        var nextCalled = false;
        var middleware = new LoginCaptchaMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        });
        var context = CreateContext(
            """{"email":"user@example.vn","captchaToken":"valid-token","appName":"FoodSafe"}""",
            PasswordResetPath);

        await middleware.InvokeAsync(context, new AcceptingVerifier());

        nextCalled.ShouldBeTrue();
        context.Response.StatusCode.ShouldBe(StatusCodes.Status200OK);
    }

    // ──────────────────────────────────────────────────────────────────────
    // 6. Password-reset code is NOT generated when CAPTCHA fails.
    //    The downstream handler (next delegate) represents the ABP account
    //    service that generates the password-reset email. It must not run
    //    when CAPTCHA is rejected.
    // ──────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task PasswordReset_Downstream_Not_Called_On_Captcha_Failure()
    {
        var downstreamCalled = false;
        var middleware = new LoginCaptchaMiddleware(_ =>
        {
            downstreamCalled = true;
            return Task.CompletedTask;
        });
        var context = CreateContext(
            """{"email":"admin@foodsafe.vn","captchaToken":"tampered"}""",
            PasswordResetPath);

        await middleware.InvokeAsync(context, new RejectingVerifier());

        downstreamCalled.ShouldBeFalse();
    }

    // ──────────────────────────────────────────────────────────────────────
    // 7. Error response does not expose secrets or provider details
    // ──────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task PasswordReset_Error_Response_Contains_Only_Safe_Fields()
    {
        var nextCalled = false;
        var middleware = new LoginCaptchaMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        });
        var context = CreateContext(
            """{"email":"user@example.vn"}""",
            PasswordResetPath);

        await middleware.InvokeAsync(context, new RejectingVerifier());

        context.Response.Body.Position = 0;
        using var reader = new StreamReader(context.Response.Body);
        var body = await reader.ReadToEndAsync();

        // Must contain the standard FoodSafe error code.
        body.ShouldContain("FoodSafe:Captcha:0001");

        // Must NOT expose any provider-specific secret or internal identifier.
        body.ShouldNotContain("SecretKey", Case.Insensitive);
        body.ShouldNotContain("siteverify", Case.Insensitive);
        body.ShouldNotContain("cloudflare", Case.Insensitive);

        nextCalled.ShouldBeFalse();
    }

    // ──────────────────────────────────────────────────────────────────────
    // 8. Login endpoint remains protected (must not have been weakened when
    //    the password-reset path was added)
    // ──────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_Endpoint_Remains_Protected_After_PasswordReset_Was_Added()
    {
        var nextCalled = false;
        var middleware = new LoginCaptchaMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        });
        var context = CreateContext(
            """{"userNameOrEmailAddress":"admin","password":"secret"}""",
            "/api/account/login");

        await middleware.InvokeAsync(context, new RejectingVerifier());

        context.Response.StatusCode.ShouldBe(StatusCodes.Status400BadRequest);
        nextCalled.ShouldBeFalse();
    }

    // ──────────────────────────────────────────────────────────────────────
    // 9. Password-reset path is in the protected list
    //    A passing CAPTCHA token on this path must reach downstream.
    // ──────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task PasswordReset_Path_Is_In_Protected_List()
    {
        var nextCalled = false;
        var middleware = new LoginCaptchaMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        });
        var context = CreateContext(
            """{"email":"user@example.vn","captchaToken":"good-token"}""",
            PasswordResetPath);

        await middleware.InvokeAsync(context, new AcceptingVerifier());

        nextCalled.ShouldBeTrue();
    }

    // ──────────────────────────────────────────────────────────────────────
    // 10. Unrelated public endpoints are NOT blocked
    // ──────────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("/api/v1/public/businesses", "GET")]
    [InlineData("/api/v1/public/businesses", "POST")]
    [InlineData("/health", "GET")]
    [InlineData("/api/v1/some/other/endpoint", "POST")]
    public async Task Unprotected_Endpoints_Are_Not_Blocked(string path, string method)
    {
        var nextCalled = false;
        var middleware = new LoginCaptchaMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        });

        var context = new DefaultHttpContext();
        context.Request.Method = method;
        context.Request.Path = path;
        context.Request.Body = new MemoryStream(
            Encoding.UTF8.GetBytes("""{"any":"payload"}"""));
        context.Response.Body = new MemoryStream();
        context.Connection.RemoteIpAddress = IPAddress.Loopback;

        await middleware.InvokeAsync(context, new RejectingVerifier());

        nextCalled.ShouldBeTrue();
    }

    [Fact]
    public async Task Get_Request_To_PasswordReset_Path_Is_Not_Intercepted()
    {
        // The middleware only intercepts POST.
        var nextCalled = false;
        var middleware = new LoginCaptchaMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        });

        var context = new DefaultHttpContext();
        context.Request.Method = HttpMethods.Get;
        context.Request.Path = PasswordResetPath;
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context, new RejectingVerifier());

        nextCalled.ShouldBeTrue();
    }

    // ──────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────

    private static DefaultHttpContext CreateContext(string json, string path)
    {
        var context = new DefaultHttpContext();
        context.Request.Method = HttpMethods.Post;
        context.Request.Path = path;
        context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(json));
        context.Request.ContentLength = context.Request.Body.Length;
        context.Response.Body = new MemoryStream();
        context.Connection.RemoteIpAddress = IPAddress.Loopback;
        return context;
    }

    private sealed class AcceptingVerifier : ICaptchaVerifier
    {
        public Task<bool> VerifyAsync(
            string token,
            string? remoteIpAddress,
            CancellationToken cancellationToken)
            => Task.FromResult(true);
    }

    private sealed class RejectingVerifier : ICaptchaVerifier
    {
        public Task<bool> VerifyAsync(
            string token,
            string? remoteIpAddress,
            CancellationToken cancellationToken)
            => Task.FromResult(false);
    }
}
