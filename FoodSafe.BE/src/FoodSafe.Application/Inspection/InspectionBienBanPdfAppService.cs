using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using QuestPDF.Elements.Table;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;

namespace FoodSafe.Inspection;

[RemoteService(false)]
[Authorize(FoodSafePermissions.Inspection.Results.View)]
public class InspectionBienBanPdfAppService :
    ApplicationService,
    IInspectionBienBanPdfAppService
{
    private const string IssuingAgency = "CHI CỤC AN TOÀN VỆ SINH THỰC PHẨM TỈNH QUẢNG NINH";

    private readonly IRepository<InspectionResult, Guid> _results;
    private readonly IRepository<Business, Guid> _businesses;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public InspectionBienBanPdfAppService(
        IRepository<InspectionResult, Guid> results,
        IRepository<Business, Guid> businesses,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens)
    {
        _results = results;
        _businesses = businesses;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<InspectionBienBanPdfDto> GenerateBienBanPdfAsync(Guid inspectionResultId)
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.View, _cancellationTokens.Token);

        var query = await _results.WithDetailsAsync(x => x.Violations, x => x.Inspectors);
        if (!scope.HasGlobalAccess)
            query = query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));

        var result = await AsyncExecuter.FirstOrDefaultAsync(
                         query.Where(x => x.Id == inspectionResultId),
                         _cancellationTokens.Token)
                     ?? throw new UserFriendlyException("Không tìm thấy kết quả thanh kiểm tra.");

        var business = await _businesses.FindAsync(
            result.BusinessId, cancellationToken: _cancellationTokens.Token);

        var dateSlug = result.InspectionDate.ToString("yyyyMMdd");
        var idSlug = inspectionResultId.ToString("N")[..8];
        var fileName = $"bien-ban-thanh-tra-{dateSlug}-{idSlug}.pdf";

        var bytes = BuildPdf(result, business);

        return new InspectionBienBanPdfDto
        {
            Content = bytes,
            FileName = fileName,
        };
    }

    // ── Private ──────────────────────────────────────────────────────────────

    private static byte[] BuildPdf(InspectionResult result, Business? business)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var inspectionTypeLbl = result.InspectionType switch
        {
            InspectionType.Scheduled => "Theo kế hoạch",
            InspectionType.Unscheduled => "Đột xuất",
            InspectionType.FollowUp => "Tái kiểm tra",
            InspectionType.Emergency => "Khẩn cấp",
            _ => result.InspectionType.ToString()
        };

        var overallResultLbl = result.OverallResult switch
        {
            InspectionOverallResult.Pass => "ĐẠT",
            InspectionOverallResult.Fail => "KHÔNG ĐẠT",
            InspectionOverallResult.ConditionalPass => "ĐẠT CÓ ĐIỀU KIỆN",
            _ => result.OverallResult.ToString()
        };

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(t => t.FontSize(11).FontFamily("Arial"));

                // ── Header ─────────────────────────────────────────────────
                page.Header().Column(col =>
                {
                    col.Item().Row(headerRow =>
                    {
                        headerRow.RelativeItem().Column(c =>
                        {
                            c.Item().Text(IssuingAgency)
                                .Bold().FontSize(10).AlignCenter();
                            c.Item().Text("──────────────")
                                .AlignCenter().FontSize(9);
                        });

                        headerRow.ConstantItem(40);

                        headerRow.RelativeItem().Column(c =>
                        {
                            c.Item().Text("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM")
                                .Bold().FontSize(10).AlignCenter();
                            c.Item().Text("Độc lập - Tự do - Hạnh phúc")
                                .AlignCenter().FontSize(10);
                            c.Item().Text("──────────────")
                                .AlignCenter().FontSize(9);
                        });
                    });

                    col.Item().PaddingTop(12)
                        .Text("BIÊN BẢN THANH KIỂM TRA AN TOÀN THỰC PHẨM")
                        .Bold().AlignCenter().FontSize(14);

                    col.Item().PaddingTop(2).Text(
                            $"Ngày {result.InspectionDate:dd} tháng {result.InspectionDate:MM} năm {result.InspectionDate:yyyy}")
                        .AlignCenter().FontSize(11).Italic();

                    col.Item().PaddingTop(6).LineHorizontal(1).LineColor("#1677FF");
                });

                // ── Content ────────────────────────────────────────────────
                page.Content().PaddingTop(12).Column(col =>
                {
                    // Helper: label + value row
                    void InfoRow(string label, string value)
                    {
                        col.Item().Row(r =>
                        {
                            r.ConstantItem(175).Text(label).Bold().FontSize(11);
                            r.RelativeItem().Text(value).FontSize(11);
                        });
                        col.Item().PaddingBottom(3);
                    }

                    InfoRow("Loại kiểm tra:", inspectionTypeLbl);
                    InfoRow("Cơ sở được kiểm tra:",
                        business?.Name ?? "(Không rõ tên cơ sở)");
                    InfoRow("Địa chỉ:", business?.AddressStreet ?? "—");
                    InfoRow("Trưởng đoàn kiểm tra:", result.TeamLeader ?? "—");

                    if (!string.IsNullOrWhiteSpace(result.TeamMembersText))
                        InfoRow("Thành viên đoàn:", result.TeamMembersText);

                    col.Item().PaddingVertical(8).LineHorizontal(0.5f).LineColor("#cccccc");

                    // ── Violations ─────────────────────────────────────────
                    col.Item().PaddingBottom(6)
                        .Text("I. NỘI DUNG KIỂM TRA VÀ VI PHẠM")
                        .Bold().FontSize(12);

                    if (result.Violations.Count == 0)
                    {
                        col.Item().PaddingBottom(4).Text(
                            result.HasViolation
                                ? result.ViolationDescription ?? "Có vi phạm (không có chi tiết)."
                                : "Không phát hiện vi phạm trong quá trình kiểm tra.")
                            .FontSize(11);
                    }
                    else
                    {
                        if (!string.IsNullOrWhiteSpace(result.ViolationDescription))
                            col.Item().PaddingBottom(4)
                                .Text(result.ViolationDescription).FontSize(11);

                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(c =>
                            {
                                c.ConstantColumn(30);   // STT
                                c.RelativeColumn(3);    // Nội dung vi phạm
                                c.RelativeColumn(2);    // Điều khoản
                                c.RelativeColumn(1.5f); // Tiền phạt
                                c.RelativeColumn(2);    // Biện pháp khắc phục
                            });

                            // Header row
                            static void Th(ITableCellContainer cell, string text) =>
                                cell.Background("#1677FF").Padding(4)
                                    .Text(text).Bold().FontColor("#ffffff")
                                    .FontSize(10).AlignCenter();

                            Th(table.Cell().Row(1).Column(1), "STT");
                            Th(table.Cell().Row(1).Column(2), "Nội dung vi phạm");
                            Th(table.Cell().Row(1).Column(3), "Điều khoản vi phạm");
                            Th(table.Cell().Row(1).Column(4), "Tiền phạt (VND)");
                            Th(table.Cell().Row(1).Column(5), "Biện pháp khắc phục");

                            // Data rows
                            uint tableRow = 2;
                            var idx = 1;
                            foreach (var v in result.Violations)
                            {
                                var bg = idx % 2 == 0 ? "#f5f5f5" : "#ffffff";

                                static void Td(ITableCellContainer cell, string bg, string text,
                                    bool center = false)
                                {
                                    var t = cell.Background(bg).Padding(4)
                                        .Text(text).FontSize(10);
                                    if (center) t.AlignCenter();
                                }

                                Td(table.Cell().Row(tableRow).Column(1), bg,
                                    idx.ToString(), center: true);
                                Td(table.Cell().Row(tableRow).Column(2), bg,
                                    v.Description);
                                Td(table.Cell().Row(tableRow).Column(3), bg,
                                    v.RegulationReference ?? "—");
                                Td(table.Cell().Row(tableRow).Column(4), bg,
                                    v.FineAmount.HasValue
                                        ? v.FineAmount.Value.ToString("N0")
                                        : "—");
                                Td(table.Cell().Row(tableRow).Column(5), bg,
                                    v.RemedyRequired ?? "—");

                                tableRow++;
                                idx++;
                            }
                        });
                    }

                    col.Item().PaddingTop(10);

                    // ── Conclusion ─────────────────────────────────────────
                    col.Item().PaddingBottom(6)
                        .Text("II. KẾT LUẬN").Bold().FontSize(12);

                    col.Item().Row(r =>
                    {
                        r.ConstantItem(175).Text("Kết quả kiểm tra:").Bold().FontSize(11);
                        r.RelativeItem().Text(overallResultLbl).Bold().FontSize(11);
                    });
                    col.Item().PaddingBottom(3);

                    if (result.FineAmount.HasValue && result.FineAmount > 0)
                    {
                        col.Item().Row(r =>
                        {
                            r.ConstantItem(175).Text("Tổng tiền phạt:").Bold().FontSize(11);
                            r.RelativeItem()
                                .Text($"{result.FineAmount.Value:N0} đồng").FontSize(11);
                        });
                        col.Item().PaddingBottom(3);
                    }

                    if (!string.IsNullOrWhiteSpace(result.AdminDecisionNumber))
                    {
                        col.Item().Row(r =>
                        {
                            r.ConstantItem(175)
                                .Text("Số quyết định xử phạt:").Bold().FontSize(11);
                            r.RelativeItem()
                                .Text(result.AdminDecisionNumber).FontSize(11);
                        });
                        col.Item().PaddingBottom(3);
                    }

                    if (result.FollowUpRequired)
                    {
                        col.Item().Row(r =>
                        {
                            r.ConstantItem(175)
                                .Text("Yêu cầu tái kiểm tra:").Bold().FontSize(11);
                            r.RelativeItem().Text(
                                result.FollowUpDate.HasValue
                                    ? $"Có — trước ngày {result.FollowUpDate.Value:dd/MM/yyyy}"
                                    : "Có").FontSize(11);
                        });
                        col.Item().PaddingBottom(3);
                    }

                    if (!string.IsNullOrWhiteSpace(result.Recommendations))
                    {
                        col.Item().PaddingTop(4).Text("Kiến nghị:").Bold().FontSize(11);
                        col.Item().PaddingBottom(4)
                            .Text(result.Recommendations).FontSize(11);
                    }

                    if (!string.IsNullOrWhiteSpace(result.Notes))
                    {
                        col.Item().PaddingTop(4).Text("Ghi chú:").Bold().FontSize(11);
                        col.Item().PaddingBottom(4).Text(result.Notes).FontSize(11);
                    }

                    col.Item().PaddingTop(10).LineHorizontal(0.5f).LineColor("#cccccc");

                    // ── Signature block ────────────────────────────────────
                    col.Item().PaddingTop(16).Row(sigRow =>
                    {
                        sigRow.RelativeItem().Column(c =>
                        {
                            c.Item().Text("ĐẠI DIỆN CƠ SỞ")
                                .Bold().AlignCenter().FontSize(11);
                            c.Item().Text("(Ký, ghi rõ họ tên)")
                                .AlignCenter().FontSize(10).Italic();
                            c.Item().PaddingTop(48).Text(string.Empty);
                        });

                        sigRow.ConstantItem(20);

                        sigRow.RelativeItem().Column(c =>
                        {
                            c.Item().Text(
                                    $"Quảng Ninh, ngày {result.InspectionDate:dd} " +
                                    $"tháng {result.InspectionDate:MM} " +
                                    $"năm {result.InspectionDate:yyyy}")
                                .AlignCenter().FontSize(10).Italic();
                            c.Item().Text("TRƯỞNG ĐOÀN KIỂM TRA")
                                .Bold().AlignCenter().FontSize(11);
                            c.Item().Text("(Ký, ghi rõ họ tên)")
                                .AlignCenter().FontSize(10).Italic();
                            c.Item().PaddingTop(40)
                                .Text(result.TeamLeader ?? string.Empty)
                                .AlignCenter().FontSize(11);
                        });
                    });
                });

                // ── Footer ─────────────────────────────────────────────────
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
