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
