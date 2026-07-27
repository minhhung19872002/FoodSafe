using FoodSafe.Permissions;
using Hangfire.Dashboard;
using Volo.Abp.Authorization.Permissions;

namespace FoodSafe.Security;

/// <summary>
/// Defense-in-depth authorization for the Hangfire dashboard (C-8, doc 04 §3.7).
/// The dashboard is already restricted to loopback requests by
/// <see cref="Hangfire.Dashboard.LocalRequestsOnlyAuthorizationFilter"/> (B-5), so the
/// primary exposure vector is closed. This filter adds a second, independent control:
/// even a request that originates on the server host must be an authenticated principal
/// holding the <see cref="FoodSafePermissions.SystemAdministration.Default"/> permission.
/// Both filters run and both must pass, so a reverse-proxy misconfiguration that lets an
/// external request appear loopback (or a future decision to expose the dashboard) cannot
/// leak background-job internals to a non-administrator.
/// </summary>
public sealed class HangfireAdminAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        var httpContext = context.GetHttpContext();

        if (httpContext.User?.Identity?.IsAuthenticated != true)
        {
            return false;
        }

        // Resolve the permission checker from the request scope; Hangfire's filter
        // pipeline is synchronous, so bridge to the async ABP API deliberately.
        var permissionChecker = httpContext.RequestServices
            .GetRequiredService<IPermissionChecker>();

        return permissionChecker
            .IsGrantedAsync(FoodSafePermissions.SystemAdministration.Default)
            .GetAwaiter()
            .GetResult();
    }
}
