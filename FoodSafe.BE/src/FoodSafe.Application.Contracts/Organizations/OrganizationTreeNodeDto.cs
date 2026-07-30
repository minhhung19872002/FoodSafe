namespace FoodSafe.Organizations;

public sealed class OrganizationTreeNodeDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public OrganizationLevel Level { get; set; }
    public bool IsActive { get; set; }

    /// <summary>
    /// Địa bàn của đơn vị. Giao diện dùng để lọc danh sách đơn vị theo
    /// tỉnh/thành phố và phường/xã đang chọn.
    /// </summary>
    public Guid? ProvinceId { get; set; }

    public Guid? CommuneId { get; set; }

    public List<OrganizationTreeNodeDto> Children { get; set; } = [];
}
