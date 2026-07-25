using ClosedXML.Excel;
using Shouldly;
using Volo.Abp;
using Xunit;

namespace FoodSafe.FileManagement;

public sealed class ProductAttachmentValidationTests
{
    [Fact]
    public void Pdf_with_matching_signature_and_mime_should_be_accepted()
    {
        var result = ProductAttachmentAppService.Validate(
            "%PDF-1.7 test"u8.ToArray(),
            "chung-nhan.pdf",
            "application/pdf");

        result.Extension.ShouldBe(".pdf");
        result.OriginalName.ShouldBe("chung-nhan.pdf");
    }

    [Fact]
    public void Path_traversal_and_executable_files_should_be_rejected()
    {
        Should.Throw<UserFriendlyException>(() =>
            ProductAttachmentAppService.Validate(
                "%PDF-1.7"u8.ToArray(),
                "../secret.pdf",
                "application/pdf"));
        Should.Throw<UserFriendlyException>(() =>
            ProductAttachmentAppService.Validate(
                "MZ"u8.ToArray(),
                "payload.exe",
                "application/octet-stream"));
        Should.Throw<UserFriendlyException>(() =>
            ProductAttachmentAppService.Validate(
                "%PDF-1.7"u8.ToArray(),
                "unsafe\r\nname.pdf",
                "application/pdf"));
    }

    [Fact]
    public void Spoofed_mime_and_signature_should_be_rejected()
    {
        Should.Throw<UserFriendlyException>(() =>
            ProductAttachmentAppService.Validate(
                "not a pdf"u8.ToArray(),
                "document.pdf",
                "application/pdf"));
        Should.Throw<UserFriendlyException>(() =>
            ProductAttachmentAppService.Validate(
                "%PDF-1.7"u8.ToArray(),
                "document.pdf",
                "image/png"));
    }

    [Fact]
    public void Real_xlsx_should_be_accepted_as_open_xml()
    {
        using var workbook = new XLWorkbook();
        workbook.AddWorksheet("Data").Cell("A1").Value = "FoodSafe";
        using var output = new MemoryStream();
        workbook.SaveAs(output);

        var result = ProductAttachmentAppService.Validate(
            output.ToArray(),
            "san-pham.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        result.Extension.ShouldBe(".xlsx");
    }
}
