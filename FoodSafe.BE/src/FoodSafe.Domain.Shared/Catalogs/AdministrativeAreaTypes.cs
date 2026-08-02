namespace FoodSafe.Catalogs;

public enum CommuneType : short
{
    Commune = 1,
    Ward = 2,
    /// <summary>Thị trấn — abolished by the two-tier local government model (Luật 72/2025/QH15, effective 2025-07-01); kept for legacy rows only.</summary>
    Township = 3,
    /// <summary>Đặc khu — commune-level unit introduced by Luật 72/2025/QH15 (e.g. Vân Đồn, Cô Tô).</summary>
    SpecialZone = 4
}
