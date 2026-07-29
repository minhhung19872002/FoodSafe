namespace FoodSafe.Inspection;

public class InspectionBienBanPdfDto
{
    public byte[] Content { get; set; } = [];
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/pdf";
}

public interface IInspectionBienBanPdfAppService
{
    Task<InspectionBienBanPdfDto> GenerateBienBanPdfAsync(Guid inspectionResultId);
}
