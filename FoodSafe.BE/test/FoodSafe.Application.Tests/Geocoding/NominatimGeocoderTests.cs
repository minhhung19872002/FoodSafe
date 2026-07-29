using System.Diagnostics;
using System.Net;
using System.Text;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Shouldly;
using Xunit;

namespace FoodSafe.Geocoding;

public sealed class NominatimGeocoderTests
{
    private const string OneMatch = """
        [{"lat":"20.9556","lon":"107.0921","display_name":"Phường Hồng Hà, Hạ Long, Quảng Ninh"}]
        """;

    [Fact]
    public async Task Should_Parse_The_First_Match()
    {
        var geocoder = CreateGeocoder(OneMatch, out _);

        var point = await geocoder.GeocodeAsync(GeocodeQuery.Text("Số 12 phố Cao Thắng"));

        point.ShouldNotBeNull();
        point!.Latitude.ShouldBe(20.9556, 0.00001);
        point.Longitude.ShouldBe(107.0921, 0.00001);
        point.MatchedAddress.ShouldBe("Phường Hồng Hà, Hạ Long, Quảng Ninh");
    }

    [Fact]
    public async Task Should_Send_The_Query_Restricted_To_Vietnam()
    {
        var geocoder = CreateGeocoder(OneMatch, out var requests);

        await geocoder.GeocodeAsync(GeocodeQuery.Text("Số 12 phố Cao Thắng"));

        var url = requests.Single().RequestUri!.ToString();
        url.ShouldContain("format=jsonv2");
        url.ShouldContain("limit=1");
        url.ShouldContain("countrycodes=vn");
        // The query is form-urlencoded, so spaces arrive as '+'.
        url.ShouldContain("q=");
        Uri.UnescapeDataString(url.Replace('+', ' '))
            .ShouldContain("Số 12 phố Cao Thắng");
    }

    [Fact]
    public async Task Should_Send_A_Road_Lookup_As_A_Structured_Search()
    {
        // Free-text with all three administrative levels reliably returns
        // nothing on Vietnamese OSM data; the structured form does not.
        var geocoder = CreateGeocoder(OneMatch, out var requests);

        await geocoder.GeocodeAsync(
            GeocodeQuery.Road("Cao Thắng", "Quảng Ninh"));

        var url = Uri.UnescapeDataString(
            requests.Single().RequestUri!.ToString().Replace('+', ' '));
        url.ShouldContain("street=Cao Thắng");
        url.ShouldContain("state=Quảng Ninh");
        url.ShouldNotContain("q=");
    }

    [Fact]
    public async Task Should_Return_Null_When_The_Provider_Finds_Nothing()
    {
        var geocoder = CreateGeocoder("[]", out _);

        var point = await geocoder.GeocodeAsync(GeocodeQuery.Text("Địa chỉ không tồn tại"));

        point.ShouldBeNull();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Should_Not_Call_The_Provider_For_An_Empty_Query(string query)
    {
        var geocoder = CreateGeocoder(OneMatch, out var requests);

        var point = await geocoder.GeocodeAsync(GeocodeQuery.Text(query));

        point.ShouldBeNull();
        requests.ShouldBeEmpty();
    }

    [Fact]
    public async Task Should_Not_Call_The_Provider_When_Disabled()
    {
        var geocoder = CreateGeocoder(
            OneMatch,
            out var requests,
            options => options.Enabled = false);

        var point = await geocoder.GeocodeAsync(GeocodeQuery.Text("Số 12 phố Cao Thắng"));

        point.ShouldBeNull();
        requests.ShouldBeEmpty();
    }

    [Fact]
    public async Task Should_Degrade_Quietly_When_The_Provider_Is_Unreachable()
    {
        // A geocoder outage must never block saving a business — the user can
        // still drop the pin by hand.
        var geocoder = new NominatimGeocoder(
            new HttpClient(new ThrowingHandler()),
            Options.Create(new GeocodingOptions
            {
                MinimumRequestIntervalMilliseconds = 0
            }),
            NullLogger<NominatimGeocoder>.Instance);

        var point = await geocoder.GeocodeAsync(GeocodeQuery.Text("Số 12 phố Cao Thắng"));

        point.ShouldBeNull();
    }

    [Fact]
    public async Task Should_Degrade_Quietly_On_A_Malformed_Response()
    {
        var geocoder = CreateGeocoder("not-json", out _);

        var point = await geocoder.GeocodeAsync(GeocodeQuery.Text("Số 12 phố Cao Thắng"));

        point.ShouldBeNull();
    }

    [Fact]
    public async Task Should_Space_Consecutive_Calls_By_The_Configured_Interval()
    {
        // The public OpenStreetMap instance bans deployments that exceed one
        // request per second, so the gap is a correctness requirement.
        const int intervalMs = 250;
        var geocoder = CreateGeocoder(
            OneMatch,
            out _,
            options => options.MinimumRequestIntervalMilliseconds = intervalMs);

        await geocoder.GeocodeAsync(GeocodeQuery.Text("địa chỉ một"));
        var stopwatch = Stopwatch.StartNew();
        await geocoder.GeocodeAsync(GeocodeQuery.Text("địa chỉ hai"));
        stopwatch.Stop();

        stopwatch.ElapsedMilliseconds.ShouldBeGreaterThanOrEqualTo(
            intervalMs - 50);
    }

    private static NominatimGeocoder CreateGeocoder(
        string responseBody,
        out List<HttpRequestMessage> requests,
        Action<GeocodingOptions>? configure = null)
    {
        var captured = new List<HttpRequestMessage>();
        requests = captured;

        var handler = new StubHandler(request =>
        {
            captured.Add(request);
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    responseBody,
                    Encoding.UTF8,
                    "application/json")
            };
        });

        var options = new GeocodingOptions
        {
            MinimumRequestIntervalMilliseconds = 0
        };
        configure?.Invoke(options);

        return new NominatimGeocoder(
            new HttpClient(handler),
            Options.Create(options),
            NullLogger<NominatimGeocoder>.Instance);
    }

    private sealed class StubHandler(
        Func<HttpRequestMessage, HttpResponseMessage> respond) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            Task.FromResult(respond(request));
    }

    private sealed class ThrowingHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            throw new HttpRequestException("provider unreachable");
    }
}
