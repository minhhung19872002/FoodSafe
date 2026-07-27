using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.AlertsAndTesting;

public sealed class TestingResult : FullAuditedAggregateRoot<Guid>
{
    public Guid OrganizationId { get; private set; }
    public string SampleCode { get; private set; } = string.Empty;
    public string SampleName { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public Guid TestingCenterId { get; private set; }
    public Guid? TestingServiceId { get; private set; }
    public Guid? BusinessId { get; private set; }
    public Guid? ProductId { get; private set; }
    public DateTime SampleDate { get; private set; }
    public DateTime? SubmissionDate { get; private set; }
    public DateTime? ResultDate { get; private set; }
    public TestingResultOutcome Outcome { get; private set; }
    public string? FailedCriteria { get; private set; }
    public string? CertificateNumber { get; private set; }
    public Guid? InspectionResultId { get; private set; }
    public bool IsPublic { get; private set; }

    private TestingResult() { }

    private TestingResult(Guid id) : base(id) { }

    public static TestingResult Create(
        Guid id,
        Guid organizationId,
        string sampleCode,
        string sampleName,
        Guid testingCenterId,
        DateTime sampleDate,
        TestingResultOutcome outcome,
        string? description = null,
        Guid? testingServiceId = null,
        Guid? businessId = null,
        Guid? productId = null,
        DateTime? submissionDate = null,
        DateTime? resultDate = null,
        string? failedCriteria = null,
        string? certificateNumber = null,
        Guid? inspectionResultId = null)
    {
        Check.NotNullOrWhiteSpace(sampleCode, nameof(sampleCode), 100);
        Check.NotNullOrWhiteSpace(sampleName, nameof(sampleName), 500);
        if (testingCenterId == Guid.Empty)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.TestingResult.TestingCenterRequired);

        return new TestingResult(id)
        {
            OrganizationId = organizationId,
            SampleCode = sampleCode.Trim(),
            SampleName = sampleName.Trim(),
            Description = Normalize(description),
            TestingCenterId = testingCenterId,
            TestingServiceId = testingServiceId,
            BusinessId = businessId,
            ProductId = productId,
            SampleDate = sampleDate,
            SubmissionDate = submissionDate,
            ResultDate = resultDate,
            Outcome = outcome,
            FailedCriteria = Normalize(failedCriteria),
            CertificateNumber = Normalize(certificateNumber),
            InspectionResultId = inspectionResultId,
            IsPublic = false
        };
    }

    public void Update(
        string sampleCode,
        string sampleName,
        Guid testingCenterId,
        DateTime sampleDate,
        TestingResultOutcome outcome,
        string? description,
        Guid? testingServiceId,
        Guid? businessId,
        Guid? productId,
        DateTime? submissionDate,
        DateTime? resultDate,
        string? failedCriteria,
        string? certificateNumber,
        Guid? inspectionResultId)
    {
        Check.NotNullOrWhiteSpace(sampleCode, nameof(sampleCode), 100);
        Check.NotNullOrWhiteSpace(sampleName, nameof(sampleName), 500);
        if (testingCenterId == Guid.Empty)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.TestingResult.TestingCenterRequired);

        SampleCode = sampleCode.Trim();
        SampleName = sampleName.Trim();
        Description = Normalize(description);
        TestingCenterId = testingCenterId;
        TestingServiceId = testingServiceId;
        BusinessId = businessId;
        ProductId = productId;
        SampleDate = sampleDate;
        SubmissionDate = submissionDate;
        ResultDate = resultDate;
        Outcome = outcome;
        FailedCriteria = Normalize(failedCriteria);
        CertificateNumber = Normalize(certificateNumber);
        InspectionResultId = inspectionResultId;
    }

    public void SetPublic(bool isPublic) => IsPublic = isPublic;

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
