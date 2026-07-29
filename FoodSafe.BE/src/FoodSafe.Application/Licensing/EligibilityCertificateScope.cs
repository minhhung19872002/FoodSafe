using FoodSafe.BusinessManagement;
using FoodSafe.Security;

namespace FoodSafe.Licensing;

/// <summary>
/// Nguồn duy nhất của bộ lọc "cơ sở trong phạm vi dữ liệu" cho giấy chứng nhận
/// đủ điều kiện — dùng chung giữa AppService và DataScopeChecker để hai nơi
/// không bao giờ lệch nhau khi quy tắc scope thay đổi.
/// </summary>
internal static class EligibilityCertificateScope
{
    internal static IQueryable<Guid> AllowedBusinessIds(
        IQueryable<Business> businesses,
        IQueryable<BusinessProductGroup> links,
        CurrentDataScope scope)
    {
        var businessIds = scope.BusinessIds ?? new HashSet<Guid>();
        var businessTypeIds = scope.BusinessTypeIds ?? new HashSet<Guid>();
        var productGroupIds = scope.ProductGroupIds ?? new HashSet<Guid>();
        return businesses.Where(x =>
                scope.OrganizationIds.Contains(x.OrganizationId) ||
                businessIds.Contains(x.Id) ||
                (x.BusinessTypeId.HasValue &&
                 businessTypeIds.Contains(x.BusinessTypeId.Value)) ||
                (x.AddressProvinceId.HasValue &&
                 scope.ProvinceIds.Contains(x.AddressProvinceId.Value)) ||
                (x.AddressCommuneId.HasValue &&
                 scope.CommuneIds.Contains(x.AddressCommuneId.Value)) ||
                links.Any(link =>
                    link.BusinessId == x.Id &&
                    productGroupIds.Contains(link.ProductGroupId)))
            .Select(x => x.Id);
    }
}
