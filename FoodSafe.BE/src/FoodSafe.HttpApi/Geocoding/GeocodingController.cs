using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.Geocoding;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize]
[Route("api/v1/app/geocoding")]
public sealed class GeocodingController(
    IGeocodingAppService service) : AbpControllerBase
{
    /// <summary>
    /// Resolves an address to coordinates. Returns 204 when the provider finds
    /// no match, so the client can tell "no result" apart from an error.
    /// </summary>
    [HttpPost("resolve")]
    public async Task<ActionResult<GeocodeResultDto>> ResolveAsync(
        [FromBody] GeocodeAddressInput input)
    {
        var result = await service.ResolveAsync(input);
        return result is null ? NoContent() : Ok(result);
    }
}
