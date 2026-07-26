using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.AlertsAndTesting;

public sealed class AdministrativeDocument : FullAuditedAggregateRoot<Guid>
{
    public Guid OrganizationId { get; private set; }
    public Guid DocumentTypeId { get; private set; }
    public string DocumentNumber { get; private set; } = string.Empty;
    public string Title { get; private set; } = string.Empty;
    public string? IssuingAuthority { get; private set; }
    public DateTime IssuedDate { get; private set; }
    public DateTime? EffectiveDate { get; private set; }
    public DateTime? ExpiryDate { get; private set; }
    public string? Summary { get; private set; }
    public DocumentStatus Status { get; private set; }
    public bool IsPublic { get; private set; }

    private AdministrativeDocument() { }

    private AdministrativeDocument(Guid id) : base(id) { }

    public static AdministrativeDocument Create(
        Guid id,
        Guid organizationId,
        Guid documentTypeId,
        string documentNumber,
        string title,
        DateTime issuedDate,
        string? issuingAuthority = null,
        DateTime? effectiveDate = null,
        DateTime? expiryDate = null,
        string? summary = null)
    {
        Check.NotNullOrWhiteSpace(documentNumber, nameof(documentNumber), 100);
        Check.NotNullOrWhiteSpace(title, nameof(title), 500);

        return new AdministrativeDocument(id)
        {
            OrganizationId = organizationId,
            DocumentTypeId = documentTypeId,
            DocumentNumber = documentNumber.Trim(),
            Title = title.Trim(),
            IssuingAuthority = Normalize(issuingAuthority),
            IssuedDate = issuedDate,
            EffectiveDate = effectiveDate,
            ExpiryDate = expiryDate,
            Summary = Normalize(summary),
            Status = DocumentStatus.Active,
            IsPublic = false
        };
    }

    public void Update(
        Guid documentTypeId,
        string documentNumber,
        string title,
        DateTime issuedDate,
        string? issuingAuthority,
        DateTime? effectiveDate,
        DateTime? expiryDate,
        string? summary)
    {
        Check.NotNullOrWhiteSpace(documentNumber, nameof(documentNumber), 100);
        Check.NotNullOrWhiteSpace(title, nameof(title), 500);

        DocumentTypeId = documentTypeId;
        DocumentNumber = documentNumber.Trim();
        Title = title.Trim();
        IssuingAuthority = Normalize(issuingAuthority);
        IssuedDate = issuedDate;
        EffectiveDate = effectiveDate;
        ExpiryDate = expiryDate;
        Summary = Normalize(summary);
    }

    public void SetStatus(DocumentStatus status) => Status = status;

    public void SetPublic(bool isPublic) => IsPublic = isPublic;

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
