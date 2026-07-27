namespace FoodSafe.BusinessManagement;

public enum BusinessStatus : short
{
    Active = 1,
    Inactive = 2,
    Suspended = 3
}

public enum ProductStatus : short
{
    Active = 1,
    Inactive = 2
}

public enum LicenseStatus : short
{
    Active = 1,
    Expired = 2,
    Revoked = 3
}
