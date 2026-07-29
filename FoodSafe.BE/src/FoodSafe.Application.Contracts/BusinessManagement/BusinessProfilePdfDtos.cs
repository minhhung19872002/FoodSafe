namespace FoodSafe.BusinessManagement;

public class BusinessProfilePdfDto
{
    public byte[] Content { get; set; } = [];
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/pdf";
}

public interface IBusinessProfilePdfAppService
{
    Task<BusinessProfilePdfDto> GenerateProfilePdfAsync(Guid businessId);
}
