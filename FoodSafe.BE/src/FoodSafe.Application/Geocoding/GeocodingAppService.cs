using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Authorization;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Threading;

namespace FoodSafe.Geocoding;

[RemoteService(false)]
[Authorize]
public class GeocodingAppService : ApplicationService, IGeocodingAppService
{
    private readonly ILocationResolver _locationResolver;
    private readonly IPermissionChecker _permissionChecker;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public GeocodingAppService(
        ILocationResolver locationResolver,
        IPermissionChecker permissionChecker,
        ICancellationTokenProvider cancellationTokens)
    {
        _locationResolver = locationResolver;
        _permissionChecker = permissionChecker;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<GeocodeResultDto?> ResolveAsync(GeocodeAddressInput input)
    {
        await EnsureCanEditBusinessesAsync();

        var result = await _locationResolver.ResolveAsync(
            input, _cancellationTokens.Token);

        if (result is null)
            return null;

        return new GeocodeResultDto
        {
            Latitude = result.Latitude,
            Longitude = result.Longitude,
            MatchedAddress = result.MatchedAddress,
            Query = result.Query
        };
    }

    private async Task EnsureCanEditBusinessesAsync()
    {
        if (await _permissionChecker.IsGrantedAsync(
                FoodSafePermissions.BusinessManagement.Businesses.Create)
            || await _permissionChecker.IsGrantedAsync(
                FoodSafePermissions.BusinessManagement.Businesses.Edit))
        {
            return;
        }

        throw new AbpAuthorizationException();
    }
}

public sealed class GeocodeCacheItem
{
    public bool Found { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string MatchedAddress { get; set; } = string.Empty;
}
