namespace FoodSafe.Reporting;

/// <summary>
/// Các trường định danh + tên hiển thị chung của 3 loại báo cáo,
/// cho phép enrich tên đơn vị/người thao tác theo lô.
/// </summary>
public interface IReportActorsDto
{
    Guid OrganizationId { get; }
    Guid? SubmittedById { get; }
    Guid? VerifiedById { get; }
    Guid? ReturnedById { get; }
    Guid? CompletedById { get; }

    string? OrganizationName { get; set; }
    string? SubmittedByName { get; set; }
    string? VerifiedByName { get; set; }
    string? ReturnedByName { get; set; }
    string? CompletedByName { get; set; }
}
