using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Services;

namespace FoodSafe.BusinessManagement;

public sealed class ExcelDownloadDto
{
    public byte[] Content { get; set; } = [];
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
}

public sealed class ExcelImportErrorDto
{
    public int RowNumber { get; set; }
    public string Field { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public sealed class ExcelImportPreviewDto
{
    public string? ConfirmationToken { get; set; }
    public int TotalRows { get; set; }
    public int ValidCount { get; set; }
    public int ErrorCount { get; set; }
    public IReadOnlyList<ExcelImportErrorDto> Errors { get; set; } = [];
}

public sealed class ConfirmExcelImportDto
{
    [Required, StringLength(100)]
    public string ConfirmationToken { get; set; } = string.Empty;
}

public sealed class ExcelImportResultDto
{
    public int ImportedCount { get; set; }
}

public interface IBusinessExcelAppService : IApplicationService
{
    Task<ExcelDownloadDto> GetTemplateAsync();
    Task<ExcelImportPreviewDto> PreviewAsync(
        byte[] content,
        string fileName);
    Task<ExcelImportResultDto> ConfirmAsync(ConfirmExcelImportDto input);
    Task<ExcelDownloadDto> ExportAsync(BusinessListInput input);
}

public interface IProductExcelAppService : IApplicationService
{
    Task<ExcelDownloadDto> GetTemplateAsync();
    Task<ExcelImportPreviewDto> PreviewAsync(
        byte[] content,
        string fileName);
    Task<ExcelImportResultDto> ConfirmAsync(ConfirmExcelImportDto input);
    Task<ExcelDownloadDto> ExportAsync(ProductListInput input);
}

public interface ISelfDeclarationExcelAppService : IApplicationService
{
    Task<ExcelDownloadDto> ExportAsync(SelfDeclarationListInput input);
}
