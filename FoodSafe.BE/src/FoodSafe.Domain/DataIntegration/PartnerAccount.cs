using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.DataIntegration;

/// <summary>
/// A registered external partner (Bộ Y tế / Sở NN / Sở CT / khác) allowed to
/// PUSH data into FoodSafe through the inbound partner API (INT-03).
/// Authentication material lives on <see cref="PartnerApiKey"/> rows; this
/// aggregate owns identity, status and the data types the partner may submit.
/// </summary>
public class PartnerAccount : FullAuditedAggregateRoot<Guid>
{
    public const int MaxCodeLength = PartnerAccountConsts.MaxCodeLength;
    public const int MaxNameLength = PartnerAccountConsts.MaxNameLength;
    public const int MaxExternalSystemLength = PartnerAccountConsts.MaxExternalSystemLength;
    public const int MaxDescriptionLength = PartnerAccountConsts.MaxDescriptionLength;

    public Guid OrganizationId { get; private set; }

    /// <summary>Stable machine code, unique among live partners.</summary>
    public string Code { get; private set; } = null!;

    public string Name { get; private set; } = null!;
    public string ExternalSystem { get; private set; } = null!;
    public string? Description { get; private set; }
    public PartnerAccountStatus Status { get; private set; }

    /// <summary>
    /// Comma-separated <see cref="SharedDataType"/> values the partner may
    /// submit (e.g. "1,3"). Empty means no data type is allowed.
    /// </summary>
    public string AllowedDataTypes { get; private set; } = "";

    private PartnerAccount() { }

    public static PartnerAccount Create(
        Guid id,
        Guid organizationId,
        string code,
        string name,
        string externalSystem,
        IEnumerable<SharedDataType> allowedDataTypes,
        string? description = null)
    {
        Check.NotNullOrWhiteSpace(code, nameof(code), MaxCodeLength);
        Check.NotNullOrWhiteSpace(name, nameof(name), MaxNameLength);
        Check.NotNullOrWhiteSpace(
            externalSystem, nameof(externalSystem), MaxExternalSystemLength);

        var partner = new PartnerAccount
        {
            Id = id,
            OrganizationId = organizationId,
            Code = code.Trim(),
            Name = name.Trim(),
            ExternalSystem = externalSystem.Trim(),
            Description = description,
            Status = PartnerAccountStatus.Active,
        };
        partner.SetAllowedDataTypes(allowedDataTypes);
        return partner;
    }

    public void Update(
        string name,
        string externalSystem,
        IEnumerable<SharedDataType> allowedDataTypes,
        string? description)
    {
        Check.NotNullOrWhiteSpace(name, nameof(name), MaxNameLength);
        Check.NotNullOrWhiteSpace(
            externalSystem, nameof(externalSystem), MaxExternalSystemLength);

        Name = name.Trim();
        ExternalSystem = externalSystem.Trim();
        Description = description;
        SetAllowedDataTypes(allowedDataTypes);
    }

    public void Suspend() => Status = PartnerAccountStatus.Suspended;

    public void Activate() => Status = PartnerAccountStatus.Active;

    public bool IsDataTypeAllowed(SharedDataType dataType) =>
        GetAllowedDataTypes().Contains(dataType);

    public IReadOnlyList<SharedDataType> GetAllowedDataTypes() =>
        AllowedDataTypes
            .Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(value => (SharedDataType)short.Parse(value))
            .ToList();

    private void SetAllowedDataTypes(IEnumerable<SharedDataType> dataTypes)
    {
        var distinct = dataTypes
            .Where(t => t != SharedDataType.Other)
            .Distinct()
            .OrderBy(t => t)
            .ToList();
        AllowedDataTypes = string.Join(
            ',', distinct.Select(t => ((short)t).ToString()));
    }
}
