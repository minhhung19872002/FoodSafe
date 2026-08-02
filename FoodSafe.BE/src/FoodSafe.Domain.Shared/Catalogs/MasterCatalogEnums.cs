namespace FoodSafe.Catalogs;

public enum BusinessRiskLevel : short
{
    High = 1,
    Medium = 2,
    Low = 3
}

/// <summary>
/// Các danh mục dùng chung hỗ trợ import/xuất Excel theo mẫu.
/// </summary>
public enum MasterCatalogKind
{
    Country = 1,
    Region = 2,
    ProductGroup = 3,
    BusinessType = 4,
    BusinessClassification = 5,
    AdvertisementType = 6,
    DocumentType = 7,
    TestingCenter = 8,
    TestingService = 9,
    ViolationType = 10
}
