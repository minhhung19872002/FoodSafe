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

    /// <summary>
    /// Outbound-auth credential, ENCRYPTED AT REST (ciphertext produced by the
    /// application layer via <c>IStringEncryptionService</c>). It is never
    /// exposed through a DTO; only <see cref="HasCredential"/> is surfaced.
    /// Null when the endpoint needs no credential (e.g. <see cref="ApiAuthType.None"/>).
    /// </summary>
    public string? EncryptedCredential { get; private set; }

    /// <summary>True when a credential is stored, without revealing its value.</summary>
    public bool HasCredential => !string.IsNullOrWhiteSpace(EncryptedCredential);

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

    /// <summary>
    /// Stores an already-encrypted credential (or clears it when the value is
    /// blank). Encryption is an application-layer concern; the domain only
    /// persists the opaque ciphertext.
    /// </summary>
    public void SetEncryptedCredential(string? encryptedValue)
        => EncryptedCredential = string.IsNullOrWhiteSpace(encryptedValue) ? null : encryptedValue;

    public void Activate() => Status = ApiEndpointStatus.Active;

    public void Deactivate() => Status = ApiEndpointStatus.Inactive;
}
