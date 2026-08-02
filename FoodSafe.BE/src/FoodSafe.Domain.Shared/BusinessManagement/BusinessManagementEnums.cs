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

public enum VsattpCommitmentStatus : short
{
    Submitted = 1,
    Confirmed = 2
}

/// <summary>
/// Lý do cơ sở được miễn cấp Giấy chứng nhận đủ điều kiện an toàn thực phẩm
/// theo Khoản 1 Điều 12 Nghị định 15/2018/NĐ-CP (điểm a → k).
/// </summary>
public enum EligibilityExemptionReason : short
{
    /// <summary>a) Sản xuất ban đầu nhỏ lẻ.</summary>
    SmallScalePrimaryProduction = 1,

    /// <summary>b) Sản xuất, kinh doanh thực phẩm không có địa điểm cố định.</summary>
    NoFixedLocation = 2,

    /// <summary>c) Sơ chế nhỏ lẻ.</summary>
    SmallScalePreliminaryProcessing = 3,

    /// <summary>d) Kinh doanh thực phẩm nhỏ lẻ.</summary>
    SmallScaleTrading = 4,

    /// <summary>đ) Kinh doanh thực phẩm bao gói sẵn.</summary>
    PrepackagedFoodTrading = 5,

    /// <summary>e) Sản xuất, kinh doanh dụng cụ, vật liệu bao gói, chứa đựng thực phẩm.</summary>
    PackagingMaterialProduction = 6,

    /// <summary>g) Nhà hàng trong khách sạn.</summary>
    HotelRestaurant = 7,

    /// <summary>h) Bếp ăn tập thể không có đăng ký ngành nghề kinh doanh thực phẩm.</summary>
    CollectiveKitchenNoRegistration = 8,

    /// <summary>i) Kinh doanh thức ăn đường phố.</summary>
    StreetFood = 9,

    /// <summary>
    /// k) Cơ sở đã được cấp một trong các Giấy chứng nhận GMP, HACCP, ISO 22000,
    /// IFS, BRC, FSSC 22000 hoặc tương đương còn hiệu lực.
    /// </summary>
    QualitySystemCertified = 10
}

/// <summary>
/// Loại chứng nhận hệ thống quản lý chất lượng ATTP (dùng cho trường hợp miễn
/// theo điểm k Khoản 1 Điều 12 Nghị định 15/2018/NĐ-CP).
/// </summary>
public enum QualityCertificationType : short
{
    Gmp = 1,
    Haccp = 2,
    Iso22000 = 3,
    Ifs = 4,
    Brc = 5,
    Fssc22000 = 6,

    /// <summary>Chứng nhận tương đương khác.</summary>
    Other = 99
}
