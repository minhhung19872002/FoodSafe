using Shouldly;
using Volo.Abp.Validation;
using Xunit;

namespace FoodSafe.DataIntegration;

/// <summary>
/// Exercises the real OpenAPI reader against genuine documents (FR-50-05) — no
/// mocks. Every rejection must be an <see cref="AbpValidationException"/> so the
/// HTTP layer surfaces a clean 400 rather than a leaked 500.
/// </summary>
public sealed class OpenApiSpecValidatorTests
{
    private const string ValidV3Json = """
        {
          "openapi": "3.0.3",
          "info": { "title": "Partner Sharing API", "version": "1.2.0",
                    "description": "API chia sẻ dữ liệu ATTP" },
          "paths": {}
        }
        """;

    private const string ValidV2Yaml = """
        swagger: "2.0"
        info:
          title: Legacy Partner API
          version: "1.0.0"
        paths: {}
        """;

    [Fact]
    public void Parse_accepts_openapi_3_json_and_extracts_metadata()
    {
        var parsed = OpenApiSpecValidator.Parse(ValidV3Json);

        parsed.Format.ShouldBe(ApiSpecFormat.Json);
        parsed.OpenApiVersion.ShouldBe("3.0.3");
        parsed.Title.ShouldBe("Partner Sharing API");
        parsed.SpecVersion.ShouldBe("1.2.0");
        parsed.Description.ShouldBe("API chia sẻ dữ liệu ATTP");
    }

    [Fact]
    public void Parse_accepts_swagger_2_yaml_and_detects_format_and_version()
    {
        var parsed = OpenApiSpecValidator.Parse(ValidV2Yaml);

        parsed.Format.ShouldBe(ApiSpecFormat.Yaml);
        parsed.OpenApiVersion.ShouldBe("2.0");
        parsed.Title.ShouldBe("Legacy Partner API");
        parsed.SpecVersion.ShouldBe("1.0.0");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("    ")]
    public void Parse_rejects_empty_content(string? content)
    {
        Should.Throw<AbpValidationException>(() => OpenApiSpecValidator.Parse(content));
    }

    [Fact]
    public void Parse_rejects_json_that_is_not_an_openapi_document()
    {
        Should.Throw<AbpValidationException>(
            () => OpenApiSpecValidator.Parse("{\"hello\":\"world\"}"));
    }

    [Fact]
    public void Parse_rejects_document_missing_required_info_title()
    {
        const string missingTitle = """
            { "openapi": "3.0.0", "info": { "version": "1.0.0" }, "paths": {} }
            """;

        Should.Throw<AbpValidationException>(
            () => OpenApiSpecValidator.Parse(missingTitle));
    }

    [Fact]
    public void Parse_rejects_document_missing_required_info_version()
    {
        const string missingVersion = """
            { "openapi": "3.0.0", "info": { "title": "No Version" }, "paths": {} }
            """;

        Should.Throw<AbpValidationException>(
            () => OpenApiSpecValidator.Parse(missingVersion));
    }

    [Fact]
    public void Parse_rejects_content_over_the_size_limit()
    {
        var oversized = new string('x', OpenApiSpecValidator.MaxContentBytes + 1);

        Should.Throw<AbpValidationException>(
            () => OpenApiSpecValidator.Parse(oversized));
    }
}
