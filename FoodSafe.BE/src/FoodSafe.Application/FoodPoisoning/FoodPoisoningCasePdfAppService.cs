using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace FoodSafe.FoodPoisoning;

[RemoteService(false)]
[Authorize(FoodSafePermissions.FoodPoisoning.Cases.View)]
public class FoodPoisoningCasePdfAppService : ApplicationService, IFoodPoisoningCasePdfAppService
{
    private const string IssuingAgency = "CHI CỤC AN TOÀN VỆ SINH THỰC PHẨM TỈNH QUẢNG NINH";

    private readonly FoodPoisoningCaseAppService _caseAppService;

    public FoodPoisoningCasePdfAppService(FoodPoisoningCaseAppService caseAppService)
    {
        _caseAppService = caseAppService;
    }

    public async Task<byte[]> GenerateCasePdfAsync(Guid caseId)
    {
        var dto = await _caseAppService.GetAsync(caseId);
        return BuildPdf(dto, Clock.Now);
    }

    private static byte[] BuildPdf(FoodPoisoningCaseDto c, DateTime now)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var isHospitalized = c.TreatmentResult is TreatmentResult.Hospitalized or TreatmentResult.Deceased;
        var isDeceased = c.TreatmentResult == TreatmentResult.Deceased;

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(t => t.FontSize(11).FontFamily("Arial"));

                page.Header().Column(col =>
                {
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(hdr =>
                        {
                            hdr.Item().Text("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM")
                                .Bold().AlignCenter().FontSize(12);
                            hdr.Item().Text("Độc lập - Tự do - Hạnh phúc")
                                .AlignCenter().FontSize(11);
                            hdr.Item().Text("───────────────").AlignCenter().FontSize(10);
                        });
                    });
                    col.Item().PaddingTop(8).Text(IssuingAgency)
                        .Bold().AlignCenter().FontSize(11);
                    col.Item().PaddingTop(12).Text("BÁO CÁO CA NGỘ ĐỘC THỰC PHẨM")
                        .Bold().AlignCenter().FontSize(14);
                    col.Item().Text($"Mã ca: {c.CaseCode}")
                        .AlignCenter().FontSize(11).Italic();
                    col.Item().PaddingTop(4).LineHorizontal(1).LineColor("#1677FF");
                });

                page.Content().PaddingTop(12).Column(col =>
                {
                    static void SectionHeader(ColumnDescriptor c, string title)
                    {
                        c.Item().PaddingTop(10).PaddingBottom(4)
                            .Text(title).Bold().FontSize(12).FontColor("#1677FF");
                    }

                    static void LabelValue(ColumnDescriptor c, string label, string? value)
                    {
                        c.Item().Row(row =>
                        {
                            row.ConstantItem(170).Text(label).Bold();
                            row.RelativeItem().Text(value.IsNullOrWhiteSpace() ? "—" : value);
                        });
                        c.Item().PaddingBottom(3);
                    }

                    // I. Thông tin ca ngộ độc
                    SectionHeader(col, "I. THÔNG TIN CA NGỘ ĐỘC");
                    LabelValue(col, "Mã ca:", c.CaseCode);
                    LabelValue(col, "Ngày báo cáo:", c.ReportDate.ToString("dd/MM/yyyy"));
                    LabelValue(col, "Ngày xảy ra:", c.OccurrenceDate?.ToString("dd/MM/yyyy HH:mm"));
                    LabelValue(col, "Địa điểm xảy ra:", c.LocationDescription);
                    LabelValue(col, "Thực phẩm nghi ngờ:", c.SuspectedFood);
                    LabelValue(col, "Nguồn thực phẩm:", c.FoodSource);
                    LabelValue(col, "Ngày chế biến:", c.FoodPreparationDate?.ToString("dd/MM/yyyy"));
                    LabelValue(col, "Thời gian khởi phát:", c.OnsetTime?.ToString("dd/MM/yyyy HH:mm"));

                    // II. Thông tin nạn nhân (bảng)
                    SectionHeader(col, "II. THÔNG TIN NẠN NHÂN");

                    col.Item().PaddingBottom(6).Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(3);    // Họ tên
                            cols.RelativeColumn(1);    // Tuổi
                            cols.RelativeColumn(3);    // Triệu chứng
                            cols.RelativeColumn(1.5f); // Nhập viện
                            cols.RelativeColumn(1.5f); // Tử vong
                        });

                        static IContainer HeaderCell(IContainer c) =>
                            c.Background("#1677FF").Padding(5);

                        static IContainer DataCell(IContainer c) =>
                            c.BorderBottom(0.5f).BorderColor("#dddddd").Padding(5);

                        table.Header(h =>
                        {
                            h.Cell().Element(HeaderCell).Text("Họ tên").Bold().FontColor("#FFFFFF");
                            h.Cell().Element(HeaderCell).AlignCenter().Text("Tuổi").Bold().FontColor("#FFFFFF");
                            h.Cell().Element(HeaderCell).Text("Triệu chứng").Bold().FontColor("#FFFFFF");
                            h.Cell().Element(HeaderCell).AlignCenter().Text("Nhập viện").Bold().FontColor("#FFFFFF");
                            h.Cell().Element(HeaderCell).AlignCenter().Text("Tử vong").Bold().FontColor("#FFFFFF");
                        });

                        table.Cell().Element(DataCell)
                            .Text(c.VictimName.IsNullOrWhiteSpace() ? "—" : c.VictimName);
                        table.Cell().Element(DataCell).AlignCenter()
                            .Text(c.VictimAge?.ToString() ?? "—");
                        table.Cell().Element(DataCell)
                            .Text(c.Symptoms.IsNullOrWhiteSpace() ? "—" : c.Symptoms);
                        table.Cell().Element(DataCell).AlignCenter()
                            .Text(isHospitalized ? "Có" : "Không");
                        table.Cell().Element(DataCell).AlignCenter()
                            .Text(isDeceased ? "Có" : "Không");
                    });

                    // III. Tóm tắt
                    SectionHeader(col, "III. TÓM TẮT");
                    LabelValue(col, "Tổng số mắc:", "1");
                    LabelValue(col, "Số nhập viện:", isHospitalized ? "1" : "0");
                    LabelValue(col, "Số tử vong:", isDeceased ? "1" : "0");
                    LabelValue(col, "Cơ sở y tế:", c.MedicalFacility);
                    LabelValue(col, "Ngày điều trị:", c.TreatmentStartDate?.ToString("dd/MM/yyyy"));
                    LabelValue(col, "Kết quả điều trị:", c.TreatmentResult switch
                    {
                        TreatmentResult.Recovered => "Hồi phục",
                        TreatmentResult.Hospitalized => "Nhập viện",
                        TreatmentResult.Deceased => "Tử vong",
                        _ => "—"
                    });

                    // IV. Người báo cáo
                    SectionHeader(col, "IV. THÔNG TIN NGƯỜI BÁO CÁO");
                    LabelValue(col, "Họ tên:", c.ReporterName);
                    LabelValue(col, "Số điện thoại:", c.ReporterPhone);
                    LabelValue(col, "Đơn vị:", c.ReporterOrganization);
                    LabelValue(col, "Quan hệ với nạn nhân:", c.ReporterRelation);

                    // V. Ghi chú / kết quả điều tra
                    if (!c.Notes.IsNullOrWhiteSpace())
                    {
                        SectionHeader(col, "V. GHI CHÚ / KẾT QUẢ ĐIỀU TRA");
                        col.Item().PaddingBottom(6).Text(c.Notes);
                    }

                    // Trạng thái hồ sơ
                    col.Item().PaddingTop(8).Row(row =>
                    {
                        row.ConstantItem(170).Text("Trạng thái hồ sơ:").Bold();
                        row.RelativeItem().Text(c.Status switch
                        {
                            PoisoningCaseStatus.Draft => "Nháp",
                            PoisoningCaseStatus.Reported => "Đã báo cáo",
                            PoisoningCaseStatus.Verified => "Đã xác minh",
                            _ => c.Status.ToString()
                        });
                    });

                    if (c.ReportedAt.HasValue)
                    {
                        col.Item().PaddingBottom(3).Row(row =>
                        {
                            row.ConstantItem(170).Text("Ngày gửi báo cáo:").Bold();
                            row.RelativeItem().Text(c.ReportedAt.Value.ToString("dd/MM/yyyy HH:mm"));
                        });
                    }

                    if (c.VerifiedAt.HasValue)
                    {
                        col.Item().PaddingBottom(3).Row(row =>
                        {
                            row.ConstantItem(170).Text("Ngày xác minh:").Bold();
                            row.RelativeItem().Text(c.VerifiedAt.Value.ToString("dd/MM/yyyy HH:mm"));
                        });
                    }

                    // Khối ký
                    col.Item().PaddingTop(24).Row(row =>
                    {
                        row.RelativeItem().Column(sig =>
                        {
                            sig.Item().AlignCenter().Text("Người lập báo cáo").Bold();
                            sig.Item().PaddingTop(2).AlignCenter()
                                .Text("(Ký, ghi rõ họ tên)").FontSize(9).FontColor("#888888");
                            sig.Item().PaddingTop(50).AlignCenter().Text(string.Empty);
                        });

                        row.ConstantItem(20);

                        row.RelativeItem().Column(sig =>
                        {
                            sig.Item().AlignCenter()
                                .Text($"Quảng Ninh, ngày {now.Day:D2} tháng {now.Month:D2} năm {now.Year}");
                            sig.Item().PaddingTop(4).AlignCenter().Text("Thủ trưởng đơn vị").Bold();
                            sig.Item().PaddingTop(2).AlignCenter()
                                .Text("(Ký, đóng dấu, ghi rõ họ tên)").FontSize(9).FontColor("#888888");
                            sig.Item().PaddingTop(50).AlignCenter().Text(string.Empty);
                        });
                    });

                    col.Item().PaddingTop(16).LineHorizontal(0.5f).LineColor("#cccccc");
                    col.Item().PaddingTop(4)
                        .Text($"Tài liệu được tạo tự động từ hệ thống ATTP tỉnh Quảng Ninh ngày {now:dd/MM/yyyy HH:mm}.")
                        .FontSize(8).FontColor("#888888");
                });

                page.Footer().AlignCenter().Text(text =>
                {
                    text.Span("Trang ").FontSize(9);
                    text.CurrentPageNumber().FontSize(9);
                    text.Span(" / ").FontSize(9);
                    text.TotalPages().FontSize(9);
                });
            });
        });

        return doc.GeneratePdf();
    }
}
