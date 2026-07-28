using Shouldly;
using Volo.Abp;
using Xunit;

namespace FoodSafe.DataIntegration;

public sealed class ApiSpecificationTests
{
    [Fact]
    public void Create_should_normalize_metadata_and_start_unpublished()
    {
        var orgId = Guid.NewGuid();

        var spec = ApiSpecification.Create(
            Guid.NewGuid(),
            orgId,
            name: "  partner-api  ",
            versionNumber: 1,
            title: "  Partner API  ",
            specVersion: "  1.2.0  ",
            openApiVersion: "  3.0.3  ",
            format: ApiSpecFormat.Json,
            content: "{\"openapi\":\"3.0.3\"}",
            checksum: "abc123",
            sizeBytes: 42,
            description: "  chia sẻ dữ liệu  ");

        spec.OrganizationId.ShouldBe(orgId);
        spec.Name.ShouldBe("partner-api");
        spec.Title.ShouldBe("Partner API");
        spec.SpecVersion.ShouldBe("1.2.0");
        spec.OpenApiVersion.ShouldBe("3.0.3");
        spec.Format.ShouldBe(ApiSpecFormat.Json);
        spec.VersionNumber.ShouldBe(1);
        spec.SizeBytes.ShouldBe(42);
        spec.Description.ShouldBe("chia sẻ dữ liệu");
        spec.IsPublished.ShouldBeFalse();
        spec.PublishedAt.ShouldBeNull();
    }

    [Fact]
    public void Create_should_reject_non_positive_version()
    {
        Should.Throw<ArgumentOutOfRangeException>(() => Build(versionNumber: 0));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_should_reject_blank_name(string name)
    {
        Should.Throw<ArgumentException>(() => Build(name: name));
    }

    [Fact]
    public void Publish_should_stamp_publication_time_then_unpublish_clears_it()
    {
        var spec = Build();
        var now = new DateTime(2026, 7, 28, 10, 0, 0, DateTimeKind.Utc);

        spec.Publish(now);
        spec.IsPublished.ShouldBeTrue();
        spec.PublishedAt.ShouldBe(now);

        spec.Unpublish();
        spec.IsPublished.ShouldBeFalse();
        spec.PublishedAt.ShouldBeNull();
    }

    [Fact]
    public void UpdateDescription_should_null_out_blank_values()
    {
        var spec = Build(description: "original");
        spec.Description.ShouldBe("original");

        spec.UpdateDescription("   ");
        spec.Description.ShouldBeNull();
    }

    private static ApiSpecification Build(
        string name = "partner-api",
        int versionNumber = 1,
        string? description = null) =>
        ApiSpecification.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            name,
            versionNumber,
            title: "Partner API",
            specVersion: "1.0.0",
            openApiVersion: "3.0.0",
            format: ApiSpecFormat.Json,
            content: "{}",
            checksum: "sum",
            sizeBytes: 2,
            description: description);
}
