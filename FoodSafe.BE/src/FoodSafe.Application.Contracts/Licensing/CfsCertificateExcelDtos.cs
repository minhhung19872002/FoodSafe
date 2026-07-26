using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Services;

namespace FoodSafe.Licensing;

public interface ICfsCertificateExcelAppService :
    IApplicationService
{
    Task<ExcelDownloadDto> ExportAsync(
        CfsCertificateListInput input);
}
