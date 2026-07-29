using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace FoodSafe.FoodPoisoning;

[RemoteService(false)]
[Authorize(FoodSafePermissions.FoodPoisoning.Incidents.View)]
public class FoodPoisoningIncidentPdfAppService : ApplicationService, IFoodPoisoningIncidentPdfAppService
{
    private const string IssuingAgency = "CHI CỤC AN TOÀN VỆ SINH THỰC PHẨM TỈNH QUẢNG NINH";

    private readonly FoodPoisoningIncidentAppService _incidentAppService;

    public FoodPoisoningIncidentPdfAppService(FoodPoisoningIncidentAppService incidentAppService)
    {
        _incidentAppService = incidentAppService;
    }

    public async Task<byte[]> GenerateIncidentClosurePdfAsync(Guid incidentId)
    {
        var dto = await _incidentAppService.GetAsync(incidentId);
        if (dto.Status != PoisoningIncidentStatus.Concluded)
            throw new BusinessException(FoodSafeDomainErrorCodes.FoodPoisoning.IncidentNotConcluded);
        return BuildPdf(dto, Clock.Now);
    }

    private static byte[] BuildPdf(FoodPoisoningIncidentDto inc, DateTime now)
    {
        QuestPDF.Settings.License = LicenseType.Community;

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
                    col.Item().PaddingTop(12).Text("PHIẾU KẾT THÚC VỤ NGỘ ĐỘC THỰC PHẨM")
                        .Bold().AlignCenter().FontSize(14);
                    col.Item().Text($"Mã vụ: {inc.IncidentCode}")
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

                    SectionHeader(col, "I. THÔNG TIN VỤ NGỘ ĐỘC");
                    LabelValue(col, "Mã vụ:", inc.IncidentCode);
                    LabelValue(col, "Ngày xảy ra:", inc.OccurrenceDate?.ToString("dd/MM/yyyy HH:mm"));
                    LabelValue(col, "Ngày kết thúc:", inc.EndDate?.ToString("dd/MM/yyyy HH:mm"));
                    LabelValue(col, "Địa điểm:", inc.LocationDescription);
                    LabelValue(col, "Thực phẩm nghi ngờ:", inc.SuspectedFood);
                    LabelValue(col, "Nguồn thực phẩm:", inc.FoodSource);
                    LabelValue(col, "Loại dịch vụ:", inc.FoodServiceType);

                    SectionHeader(col, "II. SỐ LIỆU THỐNG KÊ");
                    col.Item().PaddingBottom(6).Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn();
                            cols.RelativeColumn();
                            cols.RelativeColumn();
                            cols.RelativeColumn();
                            cols.RelativeColumn();
                        });

                        static IContainer HeaderCell(IContainer c) =>
                            c.Background("#1677FF").Padding(5);

                        static IContainer DataCell(IContainer c) =>
                            c.BorderBottom(0.5f).BorderColor("#dddddd").Padding(5);

                        table.Header(h =>
                        {
                            h.Cell().Element(HeaderCell).AlignCenter().Text("Phơi nhiễm").Bold().FontColor("#FFFFFF");
                            h.Cell().Element(HeaderCell).AlignCenter().Text("Mắc").Bold().FontColor("#FFFFFF");
                            h.Cell().Element(HeaderCell).AlignCenter().Text("Nhập viện").Bold().FontColor("#FFFFFF");
                            h.Cell().Element(HeaderCell).AlignCenter().Text("Tử vong").Bold().FontColor("#FFFFFF");
                            h.Cell().Element(HeaderCell).AlignCenter().Text("Số ca").Bold().FontColor("#FFFFFF");
                        });

                        table.Cell().Element(DataCell).AlignCenter().Text(inc.ExposedCount.ToString());
                        table.Cell().Element(DataCell).AlignCenter().Text(inc.AffectedCount.ToString());
                        table.Cell().Element(DataCell).AlignCenter().Text(inc.HospitalizedCount.ToString());
                        table.Cell().Element(DataCell).AlignCenter().Text(inc.DeathCount.ToString());
                        table.Cell().Element(DataCell).AlignCenter().Text(inc.CaseCount.ToString());
                    });

                    SectionHeader(col, "III. NGUYÊN NHÂN VÀ ĐIỀU TRA");
                    LabelValue(col, "Đánh giá nguyên nhân:", CauseLabel(inc.CauseAssessmentValue));
                    LabelValue(col, "Tác nhân gây bệnh:", inc.CausativeAgent);
                    LabelValue(col, "Mầm bệnh:", inc.Pathogen);
                    LabelValue(col, "Đội điều tra:", inc.InvestigationTeam);

                    SectionHeader(col, "IV. BIỆN PHÁP");
                    LabelValue(col, "Biện pháp kiểm soát:", inc.ControlMeasures);
                    LabelValue(col, "Biện pháp phòng ngừa:", inc.PreventionMeasures);

                    SectionHeader(col, "V. KẾT LUẬN");
                    col.Item().PaddingBottom(6).Text(inc.Conclusion.IsNullOrWhiteSpace() ? "—" : inc.Conclusion);

                    if (!inc.Notes.IsNullOrWhiteSpace())
                    {
                        SectionHeader(col, "VI. GHI CHÚ");
                        col.Item().PaddingBottom(6).Text(inc.Notes);
                    }

                    col.Item().PaddingTop(8).Row(row =>
                    {
                        row.ConstantItem(170).Text("Trạng thái:").Bold();
                        row.RelativeItem().Text("Đã kết luận");
                    });

                    if (inc.ReportedAt.HasValue)
                    {
                        col.Item().PaddingBottom(3).Row(row =>
                        {
                            row.ConstantItem(170).Text("Ngày gửi báo cáo:").Bold();
                            row.RelativeItem().Text(inc.ReportedAt.Value.ToString("dd/MM/yyyy HH:mm"));
                        });
                    }
                    if (inc.VerifiedAt.HasValue)
                    {
                        col.Item().PaddingBottom(3).Row(row =>
                        {
                            row.ConstantItem(170).Text("Ngày xác minh:").Bold();
                            row.RelativeItem().Text(inc.VerifiedAt.Value.ToString("dd/MM/yyyy HH:mm"));
                        });
                    }
                    if (inc.ConcludedAt.HasValue)
                    {
                        col.Item().PaddingBottom(3).Row(row =>
                        {
                            row.ConstantItem(170).Text("Ngày kết luận:").Bold();
                            row.RelativeItem().Text(inc.ConcludedAt.Value.ToString("dd/MM/yyyy HH:mm"));
                        });
                    }

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

    private static string CauseLabel(CauseAssessment? cause) => cause switch
    {
        CauseAssessment.Confirmed => "Xác nhận",
        CauseAssessment.Probable => "Có thể",
        CauseAssessment.Suspected => "Nghi ngờ",
        CauseAssessment.Unknown => "Không xác định",
        _ => "—"
    };
}
