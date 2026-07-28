using System.ComponentModel.DataAnnotations;
using FoodSafe.AlertsAndTesting;
using Volo.Abp.Application.Dtos;

namespace FoodSafe.Application.Contracts.AlertsAndTesting;

public class TestingResultDto
{
    public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    public string SampleCode { get; set; } = string.Empty;
    public string SampleName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid TestingCenterId { get; set; }
    public string? TestingCenterName { get; set; }
    public Guid? TestingServiceId { get; set; }
    public string? TestingServiceName { get; set; }
    public Guid? BusinessId { get; set; }
    public string? BusinessName { get; set; }
    public Guid? ProductId { get; set; }
    public string? ProductName { get; set; }
    public DateTime SampleDate { get; set; }
    public DateTime? SubmissionDate { get; set; }
    public DateTime? ResultDate { get; set; }
    public TestingResultOutcome Outcome { get; set; }
    public string? FailedCriteria { get; set; }
    public string? CertificateNumber { get; set; }
    public Guid? InspectionResultId { get; set; }
    public bool IsPublic { get; set; }
    public DateTime CreationTime { get; set; }
}

public class CreateUpdateTestingResultDto
{
    [Required, StringLength(100)]
    public string SampleCode { get; set; } = string.Empty;

    [Required, StringLength(500)]
    public string SampleName { get; set; } = string.Empty;

    public string? Description { get; set; }
    public Guid TestingCenterId { get; set; }
    public Guid? TestingServiceId { get; set; }
    public Guid? BusinessId { get; set; }
    public Guid? ProductId { get; set; }
    public DateTime SampleDate { get; set; }
    public DateTime? SubmissionDate { get; set; }
    public DateTime? ResultDate { get; set; }
    public TestingResultOutcome Outcome { get; set; }
    public string? FailedCriteria { get; set; }

    [StringLength(100)]
    public string? CertificateNumber { get; set; }

    public Guid? InspectionResultId { get; set; }
    public bool IsPublic { get; set; }
}

public class TestingResultFilterDto : PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public Guid? BusinessId { get; set; }
    public Guid? TestingCenterId { get; set; }
    public TestingResultOutcome? Outcome { get; set; }
}
