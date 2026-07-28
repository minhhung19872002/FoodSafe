namespace FoodSafe.DataIntegration;

public enum ApiCallDirection : short
{
    Inbound = 1,
    Outbound = 2,
}

/// <summary>Data categories shared with partner systems (STT 51-57).</summary>
public enum SharedDataType : short
{
    Other = 0,
    Alert = 1,
    InspectionResult = 2,
    FoodPoisoning = 3,
    License = 4,
    Product = 5,
    News = 6,
    Business = 7,
}

public enum ApiEndpointStatus : short
{
    Active = 1,
    Inactive = 2,
}

public enum ApiAuthType : short
{
    None = 1,
    ApiKey = 2,
    BearerToken = 3,
    BasicAuth = 4,
}

/// <summary>Lifecycle of a registered inbound partner account (INT-03).</summary>
public enum PartnerAccountStatus : short
{
    Active = 1,
    Suspended = 2,
}

/// <summary>Lifecycle of one received inbound submission (INT-03).</summary>
public enum InboundSubmissionStatus : short
{
    /// <summary>Persisted and awaiting business ingestion (TT 31/2026 mapping).</summary>
    Received = 1,
    Processed = 2,
    Rejected = 3,
}
