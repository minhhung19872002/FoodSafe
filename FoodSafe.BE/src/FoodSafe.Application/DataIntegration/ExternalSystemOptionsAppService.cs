using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;

namespace FoodSafe.DataIntegration;

/// <summary>
/// Serves the external-system select options (GAP-INT-2 / G-16) so the FE no
/// longer hard-codes the partner list: the canonical ministries plus every
/// distinct value already stored on endpoints and partner accounts.
/// </summary>
[RemoteService(false)]
[Authorize]
public class ExternalSystemOptionsAppService :
    ApplicationService,
    IExternalSystemOptionsAppService
{
    /// <summary>Canonical systems per the integration requirement (INT-01).</summary>
    private static readonly string[] Defaults =
    [
        "Bộ Y tế",
        "Sở Nông nghiệp",
        "Sở Công thương",
    ];

    private readonly IRepository<ApiEndpoint, Guid> _endpoints;
    private readonly IRepository<PartnerAccount, Guid> _partners;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public ExternalSystemOptionsAppService(
        IRepository<ApiEndpoint, Guid> endpoints,
        IRepository<PartnerAccount, Guid> partners,
        ICancellationTokenProvider cancellationTokens)
    {
        _endpoints = endpoints;
        _partners = partners;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<List<string>> GetListAsync()
    {
        var ct = _cancellationTokens.Token;

        var endpointSystems = await AsyncExecuter.ToListAsync(
            (await _endpoints.GetQueryableAsync())
                .Select(x => x.ExternalSystem).Distinct(), ct);
        var partnerSystems = await AsyncExecuter.ToListAsync(
            (await _partners.GetQueryableAsync())
                .Select(x => x.ExternalSystem).Distinct(), ct);

        return Defaults
            .Concat(endpointSystems)
            .Concat(partnerSystems)
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Select(name => name.Trim())
            .Distinct()
            .OrderBy(name => Array.IndexOf(Defaults, name) is var index && index >= 0
                ? index
                : int.MaxValue)
            .ThenBy(name => name, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }
}
