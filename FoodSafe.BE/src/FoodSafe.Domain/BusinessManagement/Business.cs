using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.BusinessManagement;

public sealed class Business : FullAuditedAggregateRoot<Guid>
{
    public Guid OrganizationId { get; private set; }
    public string? Code { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public Guid? BusinessTypeId { get; private set; }
    public Guid? BusinessClassificationId { get; private set; }
    public string? TaxCode { get; private set; }
    public string? RepresentativeName { get; private set; }
    public string? RepresentativeIdCard { get; private set; }
    public string? ContactPhone { get; private set; }
    public string? ContactEmail { get; private set; }
    public string? ContactWebsite { get; private set; }
    public string? AddressStreet { get; private set; }
    public Guid? AddressProvinceId { get; private set; }
    public Guid? AddressDistrictId { get; private set; }
    public Guid? AddressCommuneId { get; private set; }
    public double? AddressLatitude { get; private set; }
    public double? AddressLongitude { get; private set; }
    public BusinessStatus Status { get; private set; }
    public string? SuspensionReason { get; private set; }
    public DateTime? SuspendedAt { get; private set; }
    public bool HasEligibilityCertificate { get; private set; }
    public bool HasVsattpCommitment { get; private set; }
    public DateTime? EstablishedDate { get; private set; }
    public int? EmployeeCount { get; private set; }
    public string? Notes { get; private set; }

    private Business()
    {
    }

    private Business(Guid id) : base(id)
    {
    }

    public static Business Create(
        Guid id,
        Guid organizationId,
        string? code,
        string name,
        Guid? businessTypeId,
        Guid? businessClassificationId,
        string? taxCode,
        string? representativeName,
        string? representativeIdCard,
        string? contactPhone,
        string? contactEmail,
        string? contactWebsite,
        string? addressStreet,
        Guid? addressProvinceId,
        Guid? addressDistrictId,
        Guid? addressCommuneId,
        double? addressLatitude,
        double? addressLongitude,
        DateTime? establishedDate,
        int? employeeCount,
        string? notes)
    {
        var business = new Business(id) { OrganizationId = organizationId };
        business.Update(
            code, name, businessTypeId, businessClassificationId, taxCode,
            representativeName, representativeIdCard, contactPhone,
            contactEmail, contactWebsite, addressStreet, addressProvinceId,
            addressDistrictId, addressCommuneId, addressLatitude,
            addressLongitude, establishedDate, employeeCount, notes);
        business.SetStatus(BusinessStatus.Active, null, null);
        return business;
    }

    public void Update(
        string? code,
        string name,
        Guid? businessTypeId,
        Guid? businessClassificationId,
        string? taxCode,
        string? representativeName,
        string? representativeIdCard,
        string? contactPhone,
        string? contactEmail,
        string? contactWebsite,
        string? addressStreet,
        Guid? addressProvinceId,
        Guid? addressDistrictId,
        Guid? addressCommuneId,
        double? addressLatitude,
        double? addressLongitude,
        DateTime? establishedDate,
        int? employeeCount,
        string? notes)
    {
        Check.NotNullOrWhiteSpace(name, nameof(name), 500);
        ValidateAddress(addressProvinceId, addressDistrictId, addressCommuneId);
        ValidateCoordinates(addressLatitude, addressLongitude);
        if (employeeCount < 0)
            throw new BusinessException(FoodSafeDomainErrorCodes.Business.InvalidEmployeeCount);

        Code = Normalize(code)?.ToUpperInvariant();
        Name = name.Trim();
        BusinessTypeId = businessTypeId;
        BusinessClassificationId = businessClassificationId;
        TaxCode = Normalize(taxCode)?.ToUpperInvariant();
        RepresentativeName = Normalize(representativeName);
        RepresentativeIdCard = Normalize(representativeIdCard);
        ContactPhone = Normalize(contactPhone);
        ContactEmail = Normalize(contactEmail);
        ContactWebsite = Normalize(contactWebsite);
        AddressStreet = Normalize(addressStreet);
        AddressProvinceId = addressProvinceId;
        AddressDistrictId = addressDistrictId;
        AddressCommuneId = addressCommuneId;
        AddressLatitude = addressLatitude;
        AddressLongitude = addressLongitude;
        EstablishedDate = establishedDate;
        EmployeeCount = employeeCount;
        Notes = Normalize(notes);
    }

    public void SetStatus(
        BusinessStatus status,
        string? suspensionReason,
        DateTime? suspendedAt)
    {
        if (!Enum.IsDefined(status))
            throw new BusinessException(FoodSafeDomainErrorCodes.Business.InvalidStatus);
        if (status == BusinessStatus.Suspended &&
            string.IsNullOrWhiteSpace(suspensionReason))
            throw new BusinessException(FoodSafeDomainErrorCodes.Business.SuspensionReasonRequired);

        Status = status;
        SuspensionReason = status == BusinessStatus.Suspended
            ? suspensionReason!.Trim()
            : null;
        SuspendedAt = status == BusinessStatus.Suspended
            ? suspendedAt ?? DateTime.UtcNow
            : null;
    }

    public void SetCertificateFlags(
        bool hasEligibilityCertificate,
        bool hasVsattpCommitment)
    {
        HasEligibilityCertificate = hasEligibilityCertificate;
        HasVsattpCommitment = hasVsattpCommitment;
    }

    public void ConfirmVsattpCommitment()
    {
        HasVsattpCommitment = true;
    }

    private static void ValidateAddress(
        Guid? provinceId,
        Guid? districtId,
        Guid? communeId)
    {
        if ((districtId.HasValue && !provinceId.HasValue) ||
            (communeId.HasValue && !districtId.HasValue))
            throw new BusinessException(FoodSafeDomainErrorCodes.Business.InvalidGeography);
    }

    private static void ValidateCoordinates(double? latitude, double? longitude)
    {
        if (latitude.HasValue != longitude.HasValue ||
            latitude is < -90 or > 90 ||
            longitude is < -180 or > 180)
            throw new BusinessException(FoodSafeDomainErrorCodes.Business.InvalidCoordinates);
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
