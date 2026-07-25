using Volo.Abp.Domain.Entities;

namespace FoodSafe.BusinessManagement;

public sealed class BusinessProductGroup : Entity
{
    public Guid BusinessId { get; private set; }
    public Guid ProductGroupId { get; private set; }

    private BusinessProductGroup()
    {
    }

    public BusinessProductGroup(Guid businessId, Guid productGroupId)
    {
        BusinessId = businessId;
        ProductGroupId = productGroupId;
    }

    public override object[] GetKeys() => [BusinessId, ProductGroupId];
}
