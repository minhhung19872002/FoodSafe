using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.BusinessManagement;

public sealed class BusinessHandler : FullAuditedEntity<Guid>
{
    public Guid BusinessId { get; private set; }
    public string FullName { get; private set; } = string.Empty;
    public string? Position { get; private set; }
    public string? IdCardNumber { get; private set; }
    public string? TrainingCertificateNumber { get; private set; }
    public DateTime? TrainingDate { get; private set; }
    public string? TrainingOrganization { get; private set; }
    public DateTime? TrainingExpiryDate { get; private set; }
    public string? HealthCertificateNumber { get; private set; }
    public DateTime? HealthCheckDate { get; private set; }
    public string? HealthCheckFacility { get; private set; }
    public DateTime? HealthCheckExpiryDate { get; private set; }
    public bool IsActive { get; private set; }
    public string? Notes { get; private set; }

    private BusinessHandler()
    {
    }

    private BusinessHandler(Guid id) : base(id)
    {
    }

    public static BusinessHandler Create(
        Guid id,
        Guid businessId,
        string fullName,
        string? position,
        string? idCardNumber,
        string? trainingCertificateNumber,
        DateTime? trainingDate,
        string? trainingOrganization,
        DateTime? trainingExpiryDate,
        string? healthCertificateNumber,
        DateTime? healthCheckDate,
        string? healthCheckFacility,
        DateTime? healthCheckExpiryDate,
        string? notes)
    {
        var handler = new BusinessHandler(id) { BusinessId = businessId };
        handler.Update(
            fullName, position, idCardNumber, trainingCertificateNumber,
            trainingDate, trainingOrganization, trainingExpiryDate,
            healthCertificateNumber, healthCheckDate, healthCheckFacility,
            healthCheckExpiryDate, true, notes);
        return handler;
    }

    public void Update(
        string fullName,
        string? position,
        string? idCardNumber,
        string? trainingCertificateNumber,
        DateTime? trainingDate,
        string? trainingOrganization,
        DateTime? trainingExpiryDate,
        string? healthCertificateNumber,
        DateTime? healthCheckDate,
        string? healthCheckFacility,
        DateTime? healthCheckExpiryDate,
        bool isActive,
        string? notes)
    {
        Check.NotNullOrWhiteSpace(fullName, nameof(fullName), 200);
        if ((trainingDate.HasValue && trainingExpiryDate < trainingDate) ||
            (healthCheckDate.HasValue && healthCheckExpiryDate < healthCheckDate))
            throw new BusinessException(
                FoodSafeDomainErrorCodes.Business.InvalidCertificateDates);

        FullName = fullName.Trim();
        Position = Normalize(position);
        IdCardNumber = Normalize(idCardNumber);
        TrainingCertificateNumber = Normalize(trainingCertificateNumber);
        TrainingDate = trainingDate;
        TrainingOrganization = Normalize(trainingOrganization);
        TrainingExpiryDate = trainingExpiryDate;
        HealthCertificateNumber = Normalize(healthCertificateNumber);
        HealthCheckDate = healthCheckDate;
        HealthCheckFacility = Normalize(healthCheckFacility);
        HealthCheckExpiryDate = healthCheckExpiryDate;
        IsActive = isActive;
        Notes = Normalize(notes);
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
