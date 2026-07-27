using System.Text.Json;

namespace FoodSafe.Security;

public sealed class LoginCaptchaMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(
        HttpContext context,
        ICaptchaVerifier captchaVerifier)
    {
        var isProtectedPath =
            context.Request.Path.Equals(
                "/api/account/login",
                StringComparison.OrdinalIgnoreCase) ||
            context.Request.Path.Equals(
                "/api/account/send-password-reset-code",
                StringComparison.OrdinalIgnoreCase) ||
            context.Request.Path.Equals(
                "/api/v1/app/account-security/complete-initial-password-change",
                StringComparison.OrdinalIgnoreCase) ||
            context.Request.Path.Equals(
                "/api/v1/public/alert-reports",
                StringComparison.OrdinalIgnoreCase) ||
            context.Request.Path.Equals(
                "/api/v1/public/news-reports",
                StringComparison.OrdinalIgnoreCase);
        if (!HttpMethods.IsPost(context.Request.Method) || !isProtectedPath)
        {
            await next(context);
            return;
        }

        context.Request.EnableBuffering();
        string body;
        using (var reader = new StreamReader(
                   context.Request.Body,
                   leaveOpen: true))
        {
            body = await reader.ReadToEndAsync(context.RequestAborted);
            context.Request.Body.Position = 0;
        }

        string? token = null;
        try
        {
            using var document = JsonDocument.Parse(body);
            // Only an object body can carry a captchaToken. A non-object root
            // (array, string, number, ...) has no token — and calling
            // EnumerateObject() on it throws InvalidOperationException, so guard
            // the kind explicitly rather than let that escape the middleware.
            if (document.RootElement.ValueKind == JsonValueKind.Object)
            {
                foreach (var property in document.RootElement.EnumerateObject())
                {
                    if (property.Name.Equals(
                            "captchaToken",
                            StringComparison.OrdinalIgnoreCase)
                        && property.Value.ValueKind == JsonValueKind.String)
                    {
                        token = property.Value.GetString();
                        break;
                    }
                }
            }
        }
        catch (JsonException)
        {
            // A protected endpoint received a body that is not valid JSON, so no
            // CAPTCHA token could be present. Reject instead of calling next() —
            // previously this branch bypassed CAPTCHA entirely (SEC-M-01), letting
            // an attacker skip the check by sending a malformed body.
            await RejectAsync(context);
            return;
        }

        var verified = await captchaVerifier.VerifyAsync(
            token ?? string.Empty,
            context.Connection.RemoteIpAddress?.ToString(),
            context.RequestAborted);
        if (verified)
        {
            await next(context);
            return;
        }

        await RejectAsync(context);
    }

    private static async Task RejectAsync(HttpContext context)
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        context.Response.ContentType = "application/json; charset=utf-8";
        await context.Response.WriteAsJsonAsync(
            new
            {
                error = new
                {
                    code = "FoodSafe:Captcha:0001",
                    message = "CAPTCHA verification failed. Please try again.",
                    details = (string?)null,
                    data = new
                    {
                        correlationId =
                            context.Request.Headers["X-Correlation-Id"].FirstOrDefault()
                            ?? context.TraceIdentifier
                    }
                }
            },
            context.RequestAborted);
    }
}
