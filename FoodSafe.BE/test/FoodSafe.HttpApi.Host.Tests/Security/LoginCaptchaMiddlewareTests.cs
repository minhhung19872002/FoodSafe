using System.Net;
using System.Text;
using FoodSafe.Security;
using Microsoft.AspNetCore.Http;
using Shouldly;
using Xunit;

namespace FoodSafe;

public sealed class LoginCaptchaMiddlewareTests
{
    [Fact]
    public async Task Login_Should_Reject_Missing_Captcha()
    {
        var nextCalled = false;
        var middleware = new LoginCaptchaMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        });
        var context = CreateLoginContext(
            """{"userNameOrEmailAddress":"admin","password":"secret"}""");

        await middleware.InvokeAsync(context, new StubVerifier(false));

        context.Response.StatusCode.ShouldBe(StatusCodes.Status400BadRequest);
        nextCalled.ShouldBeFalse();
        context.Response.Body.Position = 0;
        using var reader = new StreamReader(context.Response.Body);
        (await reader.ReadToEndAsync()).ShouldContain("FoodSafe:Captcha:0001");
    }

    [Fact]
    public async Task Login_Should_Continue_After_Captcha_Verification()
    {
        var nextCalled = false;
        var middleware = new LoginCaptchaMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        });
        var context = CreateLoginContext(
            """{"captchaToken":"verified-token","userNameOrEmailAddress":"admin","password":"secret"}""");

        await middleware.InvokeAsync(context, new StubVerifier(true));

        nextCalled.ShouldBeTrue();
        context.Response.StatusCode.ShouldBe(StatusCodes.Status200OK);
    }

    private static DefaultHttpContext CreateLoginContext(string json)
    {
        var context = new DefaultHttpContext();
        context.Request.Method = HttpMethods.Post;
        context.Request.Path = "/api/account/login";
        context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(json));
        context.Request.ContentLength = context.Request.Body.Length;
        context.Response.Body = new MemoryStream();
        context.Connection.RemoteIpAddress = IPAddress.Loopback;
        return context;
    }

    private sealed class StubVerifier(bool result) : ICaptchaVerifier
    {
        public Task<bool> VerifyAsync(
            string token,
            string? remoteIpAddress,
            CancellationToken cancellationToken)
        {
            token.ShouldBe(result ? "verified-token" : string.Empty);
            remoteIpAddress.ShouldBe(IPAddress.Loopback.ToString());
            return Task.FromResult(result);
        }
    }
}
