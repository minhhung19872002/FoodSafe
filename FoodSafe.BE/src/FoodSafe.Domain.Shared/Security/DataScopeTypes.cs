namespace FoodSafe.Security;

public enum ManagementScopeType : short
{
    Geography = 1,
    Business = 2,
    BusinessType = 3,
    ProductGroup = 4,

    /// <summary>
    /// Phạm vi theo đơn vị quản lý: người được cấp đọc/ghi được dữ liệu của mọi
    /// cơ sở thuộc đơn vị đó, theo các quyền được tick trên bản ghi phân quyền.
    /// </summary>
    Organization = 5
}

public enum DataScopeOperation
{
    View,
    Create,
    Edit,
    Delete
}
