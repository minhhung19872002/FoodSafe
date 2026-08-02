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
    public Guid? AddressCommuneId { get; private set; }
    public double? AddressLatitude { get; private set; }
    public double? AddressLongitude { get; private set; }
    public BusinessStatus Status { get; private set; }
    public string? SuspensionReason { get; private set; }
    public DateTime? SuspendedAt { get; private set; }
    public bool HasEligibilityCertificate { get; private set; }
    public bool HasVsattpCommitment { get; private set; }
    public EligibilityExemptionReason? EligibilityExemptionReason { get; private set; }
    public QualityCertificationType? QualityCertificationType { get; private set; }
    public string? QualityCertificationNumber { get; private set; }
    public DateTime? QualityCertificationExpiry { get; private set; }
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
            addressCommuneId, addressLatitude,
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
        Guid? addressCommuneId,
        double? addressLatitude,
        double? addressLongitude,
        DateTime? establishedDate,
        int? employeeCount,
        string? notes)
    {
        Check.NotNullOrWhiteSpace(name, nameof(name), 500);
        ValidateAddress(addressProvinceId, addressCommuneId);
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

    /// <summary>
    /// Records why the business is exempt from the food-safety eligibility
    /// certificate under Clause 1, Article 12 of Decree 15/2018/ND-CP.
    /// Quality-system details are only kept for the point-k exemption
    /// (a valid GMP/HACCP/ISO 22000/IFS/BRC/FSSC 22000 certification).
    /// </summary>
    public void SetEligibilityExemption(
        EligibilityExemptionReason? reason,
        QualityCertificationType? qualityCertificationType,
        string? qualityCertificationNumber,
        DateTime? qualityCertificationExpiry)
    {
        if (reason is null)
        {
            EligibilityExemptionReason = null;
            QualityCertificationType = null;
            QualityCertificationNumber = null;
            QualityCertificationExpiry = null;
            return;
        }

        if (!Enum.IsDefined(reason.Value))
            throw new BusinessException(
                FoodSafeDomainErrorCodes.Business.InvalidEligibilityExemptionReason);

        if (reason.Value ==
            BusinessManagement.EligibilityExemptionReason.QualitySystemCertified)
        {
            if (qualityCertificationType is null ||
                string.IsNullOrWhiteSpace(qualityCertificationNumber))
                throw new BusinessException(
                    FoodSafeDomainErrorCodes.Business.QualityCertificationRequired);
            if (!Enum.IsDefined(qualityCertificationType.Value))
                throw new BusinessException(
                    FoodSafeDomainErrorCodes.Business.InvalidQualityCertificationType);

            EligibilityExemptionReason = reason;
            QualityCertificationType = qualityCertificationType;
            QualityCertificationNumber =
                Check.Length(
                    qualityCertificationNumber.Trim(),
                    nameof(qualityCertificationNumber),
                    maxLength: 100);
            QualityCertificationExpiry = qualityCertificationExpiry;
            return;
        }

        EligibilityExemptionReason = reason;
        QualityCertificationType = null;
        QualityCertificationNumber = null;
        QualityCertificationExpiry = null;
    }

    public void ConfirmVsattpCommitment()
    {
        HasVsattpCommitment = true;
    }

    private static void ValidateAddress(
        Guid? provinceId,
        Guid? communeId)
    {
        if (communeId.HasValue && !provinceId.HasValue)
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
