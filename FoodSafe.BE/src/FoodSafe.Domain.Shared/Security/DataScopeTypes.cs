namespace FoodSafe.Security;

public enum ManagementScopeType : short
{
    Geography = 1,
    Business = 2,
    BusinessType = 3,
    ProductGroup = 4
}

public enum DataScopeOperation
{
    View,
    Create,
    Edit,
    Delete
}
