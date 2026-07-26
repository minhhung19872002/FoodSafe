using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Services;

namespace FoodSafe.Licensing;

public interface IExportFoodCertificateExcelAppService :
    IApplicationService
{
    Task<ExcelDownloadDto> ExportAsync(
        ExportFoodCertificateListInput input);
}

public sealed class ExportFoodCertificateExcelRow
{
    /// <summary>Cơ sở sản xuất kinh doanh</summary>
    public string BusinessName { get; set; } = string.Empty;

    /// <summary>Số giấy chứng nhận xuất khẩu</summary>
    public string CertificateNumber { get; set; } = string.Empty;

    /// <summary>Ngày cấp</summary>
    public DateTime IssueDate { get; set; }

    /// <summary>Sản phẩm xuất khẩu</summary>
    public string? LinkedProductName { get; set; }

    /// <summary>Quốc gia nhập khẩu</summary>
    public string? DestinationCountryName { get; set; }

    /// <summary>Ngày hết hạn</summary>
    public DateTime? ExpiryDate { get; set; }

    /// <summary>Số lô hàng</summary>
    public string? LotNumber { get; set; }

    /// <summary>Số lượng</summary>
    public decimal? Quantity { get; set; }

    /// <summary>Đơn vị tính</summary>
    public string? QuantityUnit { get; set; }

    /// <summary>Trạng thái hiệu lực</summary>
    public LicenseStatus Status { get; set; }

    /// <summary>Số ngày còn lại</summary>
    public int? DaysUntilExpiry { get; set; }

    /// <summary>Lý do thu hồi</summary>
    public string? RevokeReason { get; set; }

    /// <summary>Ghi chú</summary>
    public string? Notes { get; set; }
}
