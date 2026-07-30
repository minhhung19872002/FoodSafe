using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Services;

namespace FoodSafe.Catalogs;

/// <summary>
/// Tải file mẫu và import Excel cho toàn bộ danh mục dùng chung.
/// </summary>
public interface IMasterCatalogExcelAppService : IApplicationService
{
    Task<ExcelDownloadDto> GetTemplateAsync(MasterCatalogKind kind);

    Task<ExcelImportPreviewDto> PreviewAsync(
        MasterCatalogKind kind,
        byte[] content,
        string fileName);

    Task<ExcelImportResultDto> ConfirmAsync(ConfirmExcelImportDto input);
}
