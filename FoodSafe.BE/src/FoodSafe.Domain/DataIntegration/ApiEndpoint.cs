using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.DataIntegration;

public class ApiEndpoint : FullAuditedAggregateRoot<Guid>
{
    public Guid OrganizationId { get; private set; }
    public string Name { get; private set; } = null!;
    public string Url { get; private set; } = null!;
    public string HttpMethod { get; private set; } = null!;
    public string ExternalSystem { get; private set; } = null!;
    public string? Description { get; private set; }
    public ApiAuthType AuthType { get; private set; }
    public ApiEndpointStatus Status { get; private set; }

    private ApiEndpoint() { }

    public static ApiEndpoint Create(
        Guid id,
        Guid organizationId,
        string name,
        string url,
        string httpMethod,
        string externalSystem,
        ApiAuthType authType,
        string? description = null)
    {
        Check.NotNullOrWhiteSpace(name, nameof(name));
        Check.NotNullOrWhiteSpace(url, nameof(url));
        Check.NotNullOrWhiteSpace(httpMethod, nameof(httpMethod));
        Check.NotNullOrWhiteSpace(externalSystem, nameof(externalSystem));

        return new ApiEndpoint
        {
            Id = id,
            OrganizationId = organizationId,
            Name = name,
            Url = url,
            HttpMethod = httpMethod,
            ExternalSystem = externalSystem,
            AuthType = authType,
            Description = description,
            Status = ApiEndpointStatus.Active,
        };
    }

    public void Update(
        string name,
        string url,
        string httpMethod,
        string externalSystem,
        ApiAuthType authType,
        string? description)
    {
        Check.NotNullOrWhiteSpace(name, nameof(name));
        Check.NotNullOrWhiteSpace(url, nameof(url));
        Check.NotNullOrWhiteSpace(httpMethod, nameof(httpMethod));
        Check.NotNullOrWhiteSpace(externalSystem, nameof(externalSystem));

        Name = name;
        Url = url;
        HttpMethod = httpMethod;
        ExternalSystem = externalSystem;
        AuthType = authType;
        Description = description;
    }

    public void Activate() => Status = ApiEndpointStatus.Active;

    public void Deactivate() => Status = ApiEndpointStatus.Inactive;
}
