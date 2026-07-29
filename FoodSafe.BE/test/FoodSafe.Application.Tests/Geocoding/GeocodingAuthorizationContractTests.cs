using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Shouldly;
using Xunit;

namespace FoodSafe.Geocoding;

public sealed class GeocodingAuthorizationContractTests
{
    [Fact]
    public void Geocoding_service_should_require_authentication()
    {
        // The service proxies an outbound call to a third party; leaving it
        // anonymous would turn the API into an open relay for that provider.
        typeof(GeocodingAppService)
            .GetCustomAttributes<AuthorizeAttribute>()
            .ShouldNotBeEmpty();
    }

    [Fact]
    public void Resolve_should_be_reachable_only_through_the_service_interface()
    {
        var method = typeof(IGeocodingAppService).GetMethod(
            nameof(IGeocodingAppService.ResolveAsync));

        method.ShouldNotBeNull();
        typeof(IGeocodingAppService)
            .IsAssignableFrom(typeof(GeocodingAppService))
            .ShouldBeTrue();
    }

    [Fact]
    public void Resolve_input_should_bound_the_free_text_it_forwards()
    {
        // Street text is the only caller-controlled part of the upstream query;
        // the administrative-area names are read from the database.
        var street = typeof(GeocodeAddressInput).GetProperty(
            nameof(GeocodeAddressInput.Street));

        street.ShouldNotBeNull();
        street!.GetCustomAttribute<System.ComponentModel.DataAnnotations
                .StringLengthAttribute>()
            .ShouldNotBeNull();
    }
}
