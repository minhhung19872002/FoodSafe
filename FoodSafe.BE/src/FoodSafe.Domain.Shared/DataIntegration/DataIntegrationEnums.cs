namespace FoodSafe.DataIntegration;

public enum ApiCallDirection : short
{
    Inbound = 1,
    Outbound = 2,
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
