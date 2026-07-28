using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace FoodSafe.DataIntegration;

public class PartnerAccountDto : EntityDto<Guid>
{
    public Guid OrganizationId { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string ExternalSystem { get; set; } = null!;
    public string? Description { get; set; }
    public PartnerAccountStatus Status { get; set; }
    public List<SharedDataType> AllowedDataTypes { get; set; } = [];
    public int ActiveKeyCount { get; set; }
    public DateTime CreationTime { get; set; }
}

public class CreatePartnerAccountDto
{
    [Required]
    [StringLength(PartnerAccountConsts.MaxCodeLength)]
    [RegularExpression("^[a-zA-Z0-9_-]+$",
        ErrorMessage = "Mã đối tác chỉ gồm chữ, số, gạch ngang, gạch dưới.")]
    public string Code { get; set; } = null!;

    [Required]
    [StringLength(PartnerAccountConsts.MaxNameLength)]
    public string Name { get; set; } = null!;

    [Required]
    [StringLength(PartnerAccountConsts.MaxExternalSystemLength)]
    public string ExternalSystem { get; set; } = null!;

    [Required]
    [MinLength(1, ErrorMessage = "Chọn ít nhất một loại dữ liệu được phép.")]
    public List<SharedDataType> AllowedDataTypes { get; set; } = [];

    [StringLength(PartnerAccountConsts.MaxDescriptionLength)]
    public string? Description { get; set; }
}

public class UpdatePartnerAccountDto
{
    [Required]
    [StringLength(PartnerAccountConsts.MaxNameLength)]
    public string Name { get; set; } = null!;

    [Required]
    [StringLength(PartnerAccountConsts.MaxExternalSystemLength)]
    public string ExternalSystem { get; set; } = null!;

    [Required]
    [MinLength(1, ErrorMessage = "Chọn ít nhất một loại dữ liệu được phép.")]
    public List<SharedDataType> AllowedDataTypes { get; set; } = [];

    [StringLength(PartnerAccountConsts.MaxDescriptionLength)]
    public string? Description { get; set; }
}

public class PartnerAccountFilterDto : PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public PartnerAccountStatus? Status { get; set; }
}

public class PartnerApiKeyDto : EntityDto<Guid>
{
    public Guid PartnerAccountId { get; set; }
    public string KeyPrefix { get; set; } = null!;
    public string? Description { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public DateTime CreationTime { get; set; }
}

public class IssuePartnerApiKeyDto
{
    public DateTime? ExpiresAt { get; set; }

    [StringLength(256)]
    public string? Description { get; set; }
}

/// <summary>Returned exactly once at issuance; the raw key is never retrievable again.</summary>
public class IssuedPartnerApiKeyDto : PartnerApiKeyDto
{
    public string RawKey { get; set; } = null!;
}

public class InboundSubmissionDto : EntityDto<Guid>
{
    public Guid PartnerAccountId { get; set; }
    public string PartnerName { get; set; } = null!;
    public Guid OrganizationId { get; set; }
    public SharedDataType DataType { get; set; }
    public string SchemaVersion { get; set; } = null!;
    public string RequestId { get; set; } = null!;
    public string? CorrelationId { get; set; }
    public int RecordCount { get; set; }
    public DateTime ReceivedAt { get; set; }
    public InboundSubmissionStatus Status { get; set; }
    public string? RejectReason { get; set; }
}

public class InboundSubmissionDetailDto : InboundSubmissionDto
{
    public string Payload { get; set; } = null!;
}

public class InboundSubmissionFilterDto : PagedAndSortedResultRequestDto
{
    public Guid? PartnerAccountId { get; set; }
    public SharedDataType? DataType { get; set; }
    public InboundSubmissionStatus? Status { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}

public interface IPartnerAccountAppService : IApplicationService
{
    Task<PagedResultDto<PartnerAccountDto>> GetListAsync(PartnerAccountFilterDto input);
    Task<PartnerAccountDto> GetAsync(Guid id);
    Task<PartnerAccountDto> CreateAsync(CreatePartnerAccountDto input);
    Task<PartnerAccountDto> UpdateAsync(Guid id, UpdatePartnerAccountDto input);
    Task ToggleStatusAsync(Guid id);
    Task DeleteAsync(Guid id);

    Task<List<PartnerApiKeyDto>> GetKeysAsync(Guid id);
    Task<IssuedPartnerApiKeyDto> IssueKeyAsync(Guid id, IssuePartnerApiKeyDto input);
    Task RevokeKeyAsync(Guid id, Guid keyId);

    Task<PagedResultDto<InboundSubmissionDto>> GetSubmissionsAsync(InboundSubmissionFilterDto input);
    Task<InboundSubmissionDetailDto> GetSubmissionAsync(Guid submissionId);
}
