using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Services;

namespace FoodSafe.Licensing;

public interface IEligibilityCertificateExcelAppService :
    IApplicationService
{
    Task<ExcelDownloadDto> ExportAsync(
        EligibilityCertificateListInput input);
}
