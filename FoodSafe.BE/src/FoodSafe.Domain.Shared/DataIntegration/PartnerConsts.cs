namespace FoodSafe.DataIntegration;

/// <summary>Shared length limits for INT-03 partner entities and their DTOs.</summary>
public static class PartnerAccountConsts
{
    public const int MaxCodeLength = 64;
    public const int MaxNameLength = 256;
    public const int MaxExternalSystemLength = 256;
    public const int MaxDescriptionLength = 1000;
}

public static class PartnerApiKeyConsts
{
    /// <summary>Raw keys look like "fsp_&lt;random&gt;"; the prefix (first 12 chars) is the lookup handle.</summary>
    public const int PrefixLength = 12;

    public const int HashLength = 64; // SHA-256 lowercase hex
}

public static class InboundSubmissionConsts
{
    public const int MaxRequestIdLength = 128;
    public const int MaxSchemaVersionLength = 16;
    public const int MaxCorrelationIdLength = 64;
    public const int MaxRejectReasonLength = 1000;
}

/// <summary>Shared length limits for FR-50-05 partner API specifications and DTOs.</summary>
public static class ApiSpecConsts
{
    public const int MaxNameLength = 128;
    public const int MaxTitleLength = 256;
    public const int MaxSpecVersionLength = 64;
    public const int MaxOpenApiVersionLength = 32;
    public const int MaxDescriptionLength = 1024;
    public const int MaxChecksumLength = 64;

    /// <summary>Largest spec document we accept (2 MB of text).</summary>
    public const int MaxContentBytes = 2 * 1024 * 1024;
}
