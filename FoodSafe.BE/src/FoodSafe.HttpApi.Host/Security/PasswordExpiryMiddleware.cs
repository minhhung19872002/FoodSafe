using Volo.Abp.Domain.Repositories;
using Volo.Abp.Linq;
using Volo.Abp.Timing;
using Volo.Abp.Users;

namespace FoodSafe.Security;

/// <summary>
/// Server-side enforcement of the 90-day password-expiry / forced-initial-change
/// policy (SEC-04). The frontend already surfaces <c>PasswordMustChange</c> via the
/// current-user context, but a client can ignore that and call business APIs
/// directly. This middleware blocks every authenticated business request whose
/// principal has an expired password (or a pending mandatory change) until the
/// password is changed — the trust boundary must live on the server, not the SPA.
/// </summary>
public sealed class PasswordExpiryMiddleware(RequestDelegate next)
{
    // Paths an expired / must-change principal may still reach so they can recover:
    // the password-change endpoints themselves, logout, and the read-only bootstrap
    // surfaces the SPA needs to detect the state and render the change-password screen.
    private static readonly string[] AllowedPrefixes =
    [
        "/api/v1/app/account-security",
        "/api/v1/app/current-user-context",
        "/api/account/logout",
        "/api/abp",
        "/api/v1/public",
        "/health"
    ];

    public async Task InvokeAsync(
        HttpContext context,
        ICurrentUser currentUser,
        IRepository<AppUserProfile, Guid> profiles,
        IAsyncQueryableExecuter asyncExecuter,
        IClock clock)
    {
        if (currentUser.Id is not { } userId || IsAllowed(context.Request.Path))
        {
            await next(context);
            return;
        }

        var query = await profiles.GetQueryableAsync();
        var profile = await asyncExecuter.FirstOrDefaultAsync(
            query.Where(p => p.UserId == userId));

        // No domain profile (e.g. the host bootstrap admin) → nothing to enforce.
        if (profile is null ||
            (!profile.MustChangePassword && !profile.IsPasswordExpired(clock.Now)))
        {
            await next(context);
            return;
        }

        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        context.Response.ContentType = "application/json; charset=utf-8";
        await context.Response.WriteAsJsonAsync(
            new
            {
                error = new
                {
                    code = "FoodSafe:Account:PasswordExpired",
                    message =
                        "Mật khẩu của bạn đã hết hạn hoặc cần được thay đổi. "
                        + "Vui lòng đổi mật khẩu để tiếp tục sử dụng hệ thống.",
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

    private static bool IsAllowed(PathString path)
    {
        foreach (var prefix in AllowedPrefixes)
        {
            if (path.StartsWithSegments(prefix, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }
}
