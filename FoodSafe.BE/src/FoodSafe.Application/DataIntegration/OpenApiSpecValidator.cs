using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.OpenApi;
using Microsoft.OpenApi.Models;
using Microsoft.OpenApi.Readers;
using Volo.Abp.Validation;

namespace FoodSafe.DataIntegration;

/// <summary>Metadata extracted from a validated OpenAPI document (FR-50-05).</summary>
public sealed record ParsedApiSpec(
    ApiSpecFormat Format,
    string OpenApiVersion,
    string Title,
    string SpecVersion,
    string? Description);

/// <summary>
/// Validates an uploaded partner API specification (FR-50-05): it must be a
/// syntactically valid OpenAPI 2.0 or 3.0 document (JSON or YAML) carrying the
/// required <c>info.title</c> and <c>info.version</c>. On success it returns the
/// parsed <see cref="ParsedApiSpec"/> metadata; on any problem it throws
/// <see cref="AbpValidationException"/> (mapped to HTTP 400) with a Vietnamese
/// message — never a leaked 500.
/// </summary>
public static partial class OpenApiSpecValidator
{
    /// <summary>Largest spec document we accept (2 MB of text).</summary>
    public const int MaxContentBytes = ApiSpecConsts.MaxContentBytes;

    public static ParsedApiSpec Parse(string? content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            throw Invalid(
                "Nội dung đặc tả trống. Vui lòng tải lên tệp OpenAPI (JSON hoặc YAML).");
        }

        var byteCount = Encoding.UTF8.GetByteCount(content);
        if (byteCount > MaxContentBytes)
        {
            throw Invalid(
                $"Tệp đặc tả quá lớn ({byteCount / 1024} KB). " +
                $"Giới hạn là {MaxContentBytes / 1024} KB.");
        }

        var format = DetectFormat(content);

        OpenApiDocument document;
        OpenApiDiagnostic diagnostic;
        try
        {
            document = new OpenApiStringReader().Read(content, out diagnostic);
        }
        catch (Exception ex)
        {
            throw Invalid($"Không đọc được tài liệu OpenAPI: {ex.Message}");
        }

        if (diagnostic.Errors.Count > 0)
        {
            throw Invalid(
                $"Tài liệu OpenAPI không hợp lệ: {diagnostic.Errors[0].Message}");
        }

        if (document.Info is null
            || string.IsNullOrWhiteSpace(document.Info.Title)
            || string.IsNullOrWhiteSpace(document.Info.Version))
        {
            throw Invalid(
                "Tài liệu OpenAPI thiếu trường bắt buộc 'info.title' hoặc 'info.version'.");
        }

        var declaredVersion = ExtractDeclaredVersion(content, format)
            ?? MapVersion(diagnostic.SpecificationVersion);

        return new ParsedApiSpec(
            format,
            declaredVersion,
            document.Info.Title.Trim(),
            document.Info.Version.Trim(),
            string.IsNullOrWhiteSpace(document.Info.Description)
                ? null
                : document.Info.Description.Trim());
    }

    /// <summary>JSON if the whole document parses as JSON, otherwise YAML.</summary>
    private static ApiSpecFormat DetectFormat(string content)
    {
        try
        {
            using var _ = JsonDocument.Parse(content);
            return ApiSpecFormat.Json;
        }
        catch (JsonException)
        {
            return ApiSpecFormat.Yaml;
        }
    }

    /// <summary>
    /// Reads the declared <c>openapi</c>/<c>swagger</c> version string exactly as
    /// written (e.g. "3.0.3"), which the normalized reader diagnostic does not
    /// preserve. Falls back to the reader's detected major version.
    /// </summary>
    private static string? ExtractDeclaredVersion(string content, ApiSpecFormat format)
    {
        if (format == ApiSpecFormat.Json)
        {
            try
            {
                using var doc = JsonDocument.Parse(content);
                var root = doc.RootElement;
                if (root.ValueKind == JsonValueKind.Object)
                {
                    if (root.TryGetProperty("openapi", out var o)
                        && o.ValueKind == JsonValueKind.String)
                    {
                        return o.GetString();
                    }
                    if (root.TryGetProperty("swagger", out var s)
                        && s.ValueKind == JsonValueKind.String)
                    {
                        return s.GetString();
                    }
                }
            }
            catch (JsonException)
            {
                // fall through to the mapped major version
            }
            return null;
        }

        var match = VersionLine().Match(content);
        return match.Success ? match.Groups[1].Value : null;
    }

    private static string MapVersion(OpenApiSpecVersion version) => version switch
    {
        OpenApiSpecVersion.OpenApi2_0 => "2.0",
        _ => "3.0",
    };

    private static AbpValidationException Invalid(string message) => new(message);

    [GeneratedRegex(
        @"(?m)^\s*(?:openapi|swagger)\s*:\s*[""']?([\w.\-]+)",
        RegexOptions.IgnoreCase)]
    private static partial Regex VersionLine();
}
