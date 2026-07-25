using Volo.Abp;
using Volo.Abp.Domain.Entities;

namespace FoodSafe.FileManagement;

public sealed class DocumentOwner : Entity<Guid>
{
    public Guid? OrganizationId { get; private set; }
    public string OwnerType { get; private set; } = string.Empty;
    public DateTime CreationTime { get; private set; }

    private DocumentOwner()
    {
    }

    private DocumentOwner(Guid id) : base(id)
    {
    }

    public static DocumentOwner Create(
        Guid id,
        Guid? organizationId,
        string ownerType,
        DateTime creationTime)
    {
        Check.NotNullOrWhiteSpace(ownerType, nameof(ownerType), 100);
        return new DocumentOwner(id)
        {
            OrganizationId = organizationId,
            OwnerType = ownerType.Trim(),
            CreationTime = creationTime
        };
    }
}
