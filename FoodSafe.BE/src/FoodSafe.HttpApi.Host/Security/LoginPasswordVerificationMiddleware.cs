using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Volo.Abp.Identity;
using IdentityOptions = Microsoft.AspNetCore.Identity.IdentityOptions;

namespace FoodSafe.Security;

public sealed class LoginPasswordVerificationMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(
        HttpContext context,
        IdentityUserManager userManager,
        IOptions<IdentityOptions> identityOptions)
    {
        if (!HttpMethods.IsPost(context.Request.Method) ||
            !context.Request.Path.Equals(
                "/api/account/login",
                StringComparison.OrdinalIgnoreCase))
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

        string? userNameOrEmailAddress = null;
        string? password = null;
        try
        {
            using var document = JsonDocument.Parse(body);
            if (document.RootElement.ValueKind == JsonValueKind.Object)
            {
                foreach (var property in document.RootElement.EnumerateObject())
                {
                    if (property.Value.ValueKind != JsonValueKind.String)
                    {
                        continue;
                    }

                    if (property.Name.Equals(
                            "userNameOrEmailAddress",
                            StringComparison.OrdinalIgnoreCase))
                    {
                        userNameOrEmailAddress = property.Value.GetString();
                    }
                    else if (property.Name.Equals(
                                 "password",
                                 StringComparison.OrdinalIgnoreCase))
                    {
                        password = property.Value.GetString();
                    }
                }
            }
        }
        catch (JsonException)
        {
            await next(context);
            return;
        }

        if (string.IsNullOrEmpty(userNameOrEmailAddress) ||
            string.IsNullOrEmpty(password))
        {
            await next(context);
            return;
        }

        var user = await userManager.FindByNameAsync(userNameOrEmailAddress)
                   ?? await userManager.FindByEmailAsync(userNameOrEmailAddress);

        if (user is null)
        {
            await next(context);
            return;
        }

        if (!user.IsActive)
        {
            await RespondAsync(context, 6, "AccountDeactivated");
            return;
        }

        if (await userManager.CheckPasswordAsync(user, password))
        {
            await next(context);
            return;
        }

        await identityOptions.SetAsync();
        (await userManager.AccessFailedAsync(user)).CheckErrors();

        if (await userManager.IsLockedOutAsync(user))
        {
            user.SetIsActive(false);
            (await userManager.UpdateAsync(user)).CheckErrors();
            await RespondAsync(context, 7, "AccountDeactivatedByFailedAttempts");
            return;
        }

        await RespondAsync(context, 2, "InvalidUserNameOrPassword");
    }

    private static async Task RespondAsync(
        HttpContext context,
        int result,
        string description)
    {
        context.Response.StatusCode = StatusCodes.Status200OK;
        context.Response.ContentType = "application/json; charset=utf-8";
        await context.Response.WriteAsJsonAsync(
            new { result, description },
            context.RequestAborted);
    }
}
