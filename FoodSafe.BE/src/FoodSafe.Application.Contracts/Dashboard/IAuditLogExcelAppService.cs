using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Services;

namespace FoodSafe.Application.Contracts.Dashboard;

public interface IAuditLogExcelAppService : IApplicationService
{
    Task<ExcelDownloadDto> ExportAsync(GetAuditLogListInput input);
}
