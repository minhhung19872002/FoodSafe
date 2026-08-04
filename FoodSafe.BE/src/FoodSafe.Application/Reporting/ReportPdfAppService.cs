using FoodSafe.Permissions;
using FoodSafe.Security;
using FoodSafe.Settings;
using Microsoft.AspNetCore.Authorization;
using QuestPDF.Elements.Table;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Settings;
using Volo.Abp.Threading;

namespace FoodSafe.Reporting;

[RemoteService(false)]
public class ReportPdfAppService : ApplicationService, IReportPdfAppService
{
    private readonly IRepository<NdtpReport, Guid> _ndtpReports;
    private readonly IRepository<AtpWorkReport, Guid> _atpReports;
    private readonly IRepository<ActionMonthReport, Guid> _amrReports;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;
    private readonly ReportNameEnricher _nameEnricher;

    public ReportPdfAppService(
        IRepository<NdtpReport, Guid> ndtpReports,
        IRepository<AtpWorkReport, Guid> atpReports,
        IRepository<ActionMonthReport, Guid> amrReports,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens,
        ReportNameEnricher nameEnricher)
    {
        _ndtpReports = ndtpReports;
        _atpReports = atpReports;
        _amrReports = amrReports;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
        _nameEnricher = nameEnricher;
    }

    // ── Public methods ────────────────────────────────────────────────────────

    [Authorize(FoodSafePermissions.Reporting.NdtpReports.View)]
    public async Task<ReportPdfDto> GenerateNdtpReportPdfAsync(Guid reportId)
    {
        var entity = await GetScopedNdtpAsync(reportId);
        var dto = ToNdtpDto(entity);
        await _nameEnricher.EnrichAsync([dto], _cancellationTokens.Token);
        var issuingAgency = await SettingProvider.GetOrNullAsync(FoodSafeSettings.Documents.IssuingAgency) ?? "";

        QuestPDF.Settings.License = LicenseType.Community;
        return new ReportPdfDto
        {
            Content = BuildNdtpPdf(dto, issuingAgency),
            FileName = $"bao-cao-ndtp-{dto.PeriodYear}-thang{dto.PeriodMonth:D2}.pdf",
        };
    }

    [Authorize(FoodSafePermissions.Reporting.AtpWorkReports.View)]
    public async Task<ReportPdfDto> GenerateAtpWorkReportPdfAsync(Guid reportId)
    {
        var entity = await GetScopedAtpAsync(reportId);
        var dto = ToAtpDto(entity);
        await _nameEnricher.EnrichAsync([dto], _cancellationTokens.Token);
        var issuingAgency = await SettingProvider.GetOrNullAsync(FoodSafeSettings.Documents.IssuingAgency) ?? "";

        QuestPDF.Settings.License = LicenseType.Community;
        return new ReportPdfDto
        {
            Content = BuildAtpWorkPdf(dto, issuingAgency),
            FileName = $"bao-cao-attp-{dto.PeriodYear}.pdf",
        };
    }

    [Authorize(FoodSafePermissions.Reporting.ActionMonthReports.View)]
    public async Task<ReportPdfDto> GenerateActionMonthReportPdfAsync(Guid reportId)
    {
        var entity = await GetScopedAmrAsync(reportId);
        var dto = ToAmrDto(entity);
        await _nameEnricher.EnrichAsync([dto], _cancellationTokens.Token);
        var issuingAgency = await SettingProvider.GetOrNullAsync(FoodSafeSettings.Documents.IssuingAgency) ?? "";

        QuestPDF.Settings.License = LicenseType.Community;
        return new ReportPdfDto
        {
            Content = BuildAmrPdf(dto, issuingAgency),
            FileName = $"bao-cao-thang-hanh-dong-{dto.PeriodYear}.pdf",
        };
    }

    // ── Scope helpers ─────────────────────────────────────────────────────────

    private async Task<NdtpReport> GetScopedNdtpAsync(Guid id)
    {
        var scope = await _dataScopeProvider.GetAsync(DataScopeOperation.View, _cancellationTokens.Token);
        var query = await _ndtpReports.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
            query = query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));
        return await AsyncExecuter.FirstOrDefaultAsync(query.Where(x => x.Id == id), _cancellationTokens.Token)
               ?? throw new BusinessException(FoodSafeDomainErrorCodes.Report.NotFound);
    }

    private async Task<AtpWorkReport> GetScopedAtpAsync(Guid id)
    {
        var scope = await _dataScopeProvider.GetAsync(DataScopeOperation.View, _cancellationTokens.Token);
        var query = await _atpReports.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
            query = query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));
        return await AsyncExecuter.FirstOrDefaultAsync(query.Where(x => x.Id == id), _cancellationTokens.Token)
               ?? throw new BusinessException(FoodSafeDomainErrorCodes.Report.NotFound);
    }

    private async Task<ActionMonthReport> GetScopedAmrAsync(Guid id)
    {
        var scope = await _dataScopeProvider.GetAsync(DataScopeOperation.View, _cancellationTokens.Token);
        var query = await _amrReports.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
            query = query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));
        return await AsyncExecuter.FirstOrDefaultAsync(query.Where(x => x.Id == id), _cancellationTokens.Token)
               ?? throw new BusinessException(FoodSafeDomainErrorCodes.Report.NotFound);
    }

    // ── DTO mappers ───────────────────────────────────────────────────────────

    private static NdtpReportDto ToNdtpDto(NdtpReport e) => new()
    {
        Id = e.Id,
        OrganizationId = e.OrganizationId,
        PeriodYear = e.PeriodYear,
        PeriodMonth = e.PeriodMonth,
        CaseCount = e.CaseCount,
        CaseAffected = e.CaseAffected,
        CaseHospitalized = e.CaseHospitalized,
        CaseDeaths = e.CaseDeaths,
        IncidentCount = e.IncidentCount,
        IncidentAffected = e.IncidentAffected,
        IncidentHospitalized = e.IncidentHospitalized,
        IncidentDeaths = e.IncidentDeaths,
        LargeScaleIncidentCount = e.LargeScaleIncidentCount,
        PreventionActivities = e.PreventionActivities,
        RiskFactors = e.RiskFactors,
        Recommendations = e.Recommendations,
        Status = e.Status,
        SubmissionVersion = e.SubmissionVersion,
        SubmittedById = e.SubmittedById,
        SubmittedAt = e.SubmittedAt,
        VerifiedById = e.VerifiedById,
        VerifiedAt = e.VerifiedAt,
        ReturnedById = e.ReturnedById,
        ReturnedAt = e.ReturnedAt,
        ReturnReason = e.ReturnReason,
        CompletedById = e.CompletedById,
        CompletedAt = e.CompletedAt,
        Notes = e.Notes,
        CreationTime = e.CreationTime,
    };

    private static AtpWorkReportDto ToAtpDto(AtpWorkReport e) => new()
    {
        Id = e.Id,
        OrganizationId = e.OrganizationId,
        PeriodType = e.PeriodType,
        PeriodYear = e.PeriodYear,
        PeriodHalf = e.PeriodHalf,
        TotalBusinesses = e.TotalBusinesses,
        NewBusinesses = e.NewBusinesses,
        InactiveBusinesses = e.InactiveBusinesses,
        BusinessesWithCertificate = e.BusinessesWithCertificate,
        DkcbIssued = e.DkcbIssued,
        SelfDeclarationsReceived = e.SelfDeclarationsReceived,
        AdRegistrationsIssued = e.AdRegistrationsIssued,
        EligibilityCertificatesIssued = e.EligibilityCertificatesIssued,
        CfsIssued = e.CfsIssued,
        ExportCertificatesIssued = e.ExportCertificatesIssued,
        TotalInspectionPlans = e.TotalInspectionPlans,
        BusinessesInspected = e.BusinessesInspected,
        ViolationsFound = e.ViolationsFound,
        FinesIssued = e.FinesIssued,
        FineTotalAmount = e.FineTotalAmount,
        PoisoningCaseCount = e.PoisoningCaseCount,
        PoisoningIncidentCount = e.PoisoningIncidentCount,
        TotalAffected = e.TotalAffected,
        TotalDeaths = e.TotalDeaths,
        TrainingSessions = e.TrainingSessions,
        TrainingParticipants = e.TrainingParticipants,
        MediaAppearances = e.MediaAppearances,
        DocumentsIssued = e.DocumentsIssued,
        Overview = e.Overview,
        Achievements = e.Achievements,
        Limitations = e.Limitations,
        Solutions = e.Solutions,
        NextPeriodPlan = e.NextPeriodPlan,
        Status = e.Status,
        SubmissionVersion = e.SubmissionVersion,
        SubmittedById = e.SubmittedById,
        SubmittedAt = e.SubmittedAt,
        VerifiedById = e.VerifiedById,
        VerifiedAt = e.VerifiedAt,
        ReturnedById = e.ReturnedById,
        ReturnedAt = e.ReturnedAt,
        ReturnReason = e.ReturnReason,
        CompletedById = e.CompletedById,
        CompletedAt = e.CompletedAt,
        Notes = e.Notes,
        CreationTime = e.CreationTime,
    };

    private static ActionMonthReportDto ToAmrDto(ActionMonthReport e) => new()
    {
        Id = e.Id,
        OrganizationId = e.OrganizationId,
        PeriodYear = e.PeriodYear,
        ActionMonthTheme = e.ActionMonthTheme,
        ActionMonthDates = e.ActionMonthDates,
        MediaArticles = e.MediaArticles,
        BroadcastPrograms = e.BroadcastPrograms,
        PropagandaSessions = e.PropagandaSessions,
        Participants = e.Participants,
        PostersDistributed = e.PostersDistributed,
        LeafletsDistributed = e.LeafletsDistributed,
        BusinessesInspected = e.BusinessesInspected,
        ViolationsFound = e.ViolationsFound,
        FinesIssued = e.FinesIssued,
        FineAmount = e.FineAmount,
        NewSelfDeclarations = e.NewSelfDeclarations,
        Achievements = e.Achievements,
        Limitations = e.Limitations,
        LessonsLearned = e.LessonsLearned,
        NextSteps = e.NextSteps,
        Status = e.Status,
        SubmissionVersion = e.SubmissionVersion,
        SubmittedById = e.SubmittedById,
        SubmittedAt = e.SubmittedAt,
        VerifiedById = e.VerifiedById,
        VerifiedAt = e.VerifiedAt,
        ReturnedById = e.ReturnedById,
        ReturnedAt = e.ReturnedAt,
        ReturnReason = e.ReturnReason,
        CompletedById = e.CompletedById,
        CompletedAt = e.CompletedAt,
        Notes = e.Notes,
        CreationTime = e.CreationTime,
    };

    // ── QuestPDF layout helpers ───────────────────────────────────────────────

    private static string StatusLabel(ReportStatus s) => s switch
    {
        ReportStatus.Draft => "Nháp",
        ReportStatus.Submitted => "Đã gửi",
        ReportStatus.Verified => "Đã xác minh",
        ReportStatus.Returned => "Trả lại",
        ReportStatus.Completed => "Hoàn thành",
        _ => s.ToString(),
    };

    private static string PeriodTypeLabel(ReportPeriodType t) => t switch
    {
        ReportPeriodType.HalfYear => "6 tháng",
        ReportPeriodType.FullYear => "Năm",
        _ => t.ToString(),
    };

    // Shared layout helpers (static so lambdas can call them without capturing)
    private static void AddPageHeader(
        PageDescriptor page,
        string title,
        string periodLabel,
        string? orgName,
        string issuingAgency)
    {
        page.Header().Column(col =>
        {
            col.Item().Row(row =>
            {
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM")
                        .Bold().AlignCenter().FontSize(12);
                    c.Item().Text("Độc lập - Tự do - Hạnh phúc")
                        .AlignCenter().FontSize(11);
                    c.Item().Text("───────────────")
                        .AlignCenter().FontSize(10);
                });
            });

            col.Item().PaddingTop(8).Text(issuingAgency)
                .Bold().AlignCenter().FontSize(11);

            if (!string.IsNullOrWhiteSpace(orgName) && orgName != issuingAgency)
                col.Item().Text(orgName).AlignCenter().FontSize(10).Italic();

            col.Item().PaddingTop(12).Text(title)
                .Bold().AlignCenter().FontSize(14);
            col.Item().PaddingTop(2).Text(periodLabel)
                .AlignCenter().FontSize(11).Italic();
            col.Item().PaddingTop(4).LineHorizontal(1).LineColor("#1677FF");
        });
    }

    private static void AddPageFooter(PageDescriptor page)
    {
        page.Footer().AlignCenter().Text(text =>
        {
            text.Span("Trang ").FontSize(9);
            text.CurrentPageNumber().FontSize(9);
            text.Span(" / ").FontSize(9);
            text.TotalPages().FontSize(9);
        });
    }

    private static void AddStatusMeta(
        ColumnDescriptor col,
        ReportStatus status,
        DateTime? submittedAt,
        DateTime? verifiedAt)
    {
        col.Item().PaddingTop(8).Text(text =>
        {
            text.Span("Trạng thái: ").Bold().FontSize(9);
            text.Span(StatusLabel(status)).FontSize(9);
            if (submittedAt.HasValue)
                text.Span($"  |  Ngày gửi: {submittedAt.Value:dd/MM/yyyy}").FontSize(9).FontColor("#888888");
            if (verifiedAt.HasValue)
                text.Span($"  |  Ngày xác minh: {verifiedAt.Value:dd/MM/yyyy}").FontSize(9).FontColor("#888888");
        });
    }

    private static void AddSignatureBlock(ColumnDescriptor col)
    {
        col.Item().PaddingTop(28).Row(row =>
        {
            row.RelativeItem().Column(c =>
            {
                c.Item().AlignCenter().Text("Người lập báo cáo").Bold().FontSize(10);
                c.Item().AlignCenter().Text("(Ký, ghi rõ họ tên)").FontSize(9).FontColor("#888888");
                c.Item().Height(40);
            });
            row.RelativeItem().Column(c =>
            {
                c.Item().AlignCenter().Text("Thủ trưởng đơn vị").Bold().FontSize(10);
                c.Item().AlignCenter().Text("(Ký, đóng dấu, ghi rõ họ tên)").FontSize(9).FontColor("#888888");
                c.Item().Height(40);
            });
        });
    }

    // ── PDF builders ──────────────────────────────────────────────────────────

    private static byte[] BuildNdtpPdf(NdtpReportDto r, string issuingAgency)
    {
        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(t => t.FontSize(11).FontFamily("Arial"));

                AddPageHeader(page,
                    "BÁO CÁO TÌNH HÌNH NGỘ ĐỘC THỰC PHẨM",
                    $"Tháng {r.PeriodMonth:D2}/{r.PeriodYear}",
                    r.OrganizationName,
                    issuingAgency);

                page.Content().PaddingTop(12).Column(col =>
                {
                    col.Item().PaddingBottom(6)
                        .Text("I. SỐ LIỆU NGỘ ĐỘC THỰC PHẨM").Bold().FontSize(12);

                    // 5-column stats table — explicit row/column positioning
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(c =>
                        {
                            c.RelativeColumn(3);
                            c.RelativeColumn(1);
                            c.RelativeColumn(1);
                            c.RelativeColumn(1);
                            c.RelativeColumn(1);
                        });

                        static void Th(ITableCellContainer cell, string text) =>
                            cell.Background("#1677FF").Padding(4).AlignCenter()
                                .Text(text).Bold().FontColor("#FFFFFF").FontSize(10);

                        static void TdL(ITableCellContainer cell, string text) =>
                            cell.Border(1).BorderColor("#DDDDDD").Padding(4)
                                .Text(text).Bold().FontSize(10);

                        static void TdV(ITableCellContainer cell, string text) =>
                            cell.Border(1).BorderColor("#DDDDDD").Padding(4)
                                .AlignRight().Text(text).FontSize(10);

                        // Row 1 — headers
                        Th(table.Cell().Row(1).Column(1), "Chỉ tiêu");
                        Th(table.Cell().Row(1).Column(2), "Số vụ/Ca");
                        Th(table.Cell().Row(1).Column(3), "Số mắc");
                        Th(table.Cell().Row(1).Column(4), "Nhập viện");
                        Th(table.Cell().Row(1).Column(5), "Tử vong");

                        // Row 2 — ca lẻ
                        TdL(table.Cell().Row(2).Column(1), "Ca ngộ độc lẻ");
                        TdV(table.Cell().Row(2).Column(2), r.CaseCount.ToString("N0"));
                        TdV(table.Cell().Row(2).Column(3), r.CaseAffected.ToString("N0"));
                        TdV(table.Cell().Row(2).Column(4), r.CaseHospitalized.ToString("N0"));
                        TdV(table.Cell().Row(2).Column(5), r.CaseDeaths.ToString("N0"));

                        // Row 3 — vụ tập thể
                        TdL(table.Cell().Row(3).Column(1), "Vụ ngộ độc tập thể");
                        TdV(table.Cell().Row(3).Column(2), r.IncidentCount.ToString("N0"));
                        TdV(table.Cell().Row(3).Column(3), r.IncidentAffected.ToString("N0"));
                        TdV(table.Cell().Row(3).Column(4), r.IncidentHospitalized.ToString("N0"));
                        TdV(table.Cell().Row(3).Column(5), r.IncidentDeaths.ToString("N0"));

                        // Row 4 — tổng cộng
                        TdL(table.Cell().Row(4).Column(1), "Tổng cộng");
                        TdV(table.Cell().Row(4).Column(2), (r.CaseCount + r.IncidentCount).ToString("N0"));
                        TdV(table.Cell().Row(4).Column(3), (r.CaseAffected + r.IncidentAffected).ToString("N0"));
                        TdV(table.Cell().Row(4).Column(4), (r.CaseHospitalized + r.IncidentHospitalized).ToString("N0"));
                        TdV(table.Cell().Row(4).Column(5), (r.CaseDeaths + r.IncidentDeaths).ToString("N0"));
                    });

                    // Chỉ tiêu thống kê riêng ngành y tế (TT 20/2019, TT 23/2025/TT-BYT).
                    col.Item().PaddingTop(4).Text(
                            $"Trong đó, số vụ ngộ độc lớn (≥ 30 người mắc): {r.LargeScaleIncidentCount:N0}")
                        .FontSize(10).Italic();

                    if (!string.IsNullOrWhiteSpace(r.PreventionActivities))
                    {
                        col.Item().PaddingTop(12)
                            .Text("II. HOẠT ĐỘNG PHÒNG CHỐNG NGỘ ĐỘC").Bold().FontSize(12);
                        col.Item().PaddingTop(4).Text(r.PreventionActivities);
                    }

                    if (!string.IsNullOrWhiteSpace(r.RiskFactors))
                    {
                        col.Item().PaddingTop(12)
                            .Text("III. YẾU TỐ NGUY CƠ").Bold().FontSize(12);
                        col.Item().PaddingTop(4).Text(r.RiskFactors);
                    }

                    if (!string.IsNullOrWhiteSpace(r.Recommendations))
                    {
                        col.Item().PaddingTop(12)
                            .Text("IV. KIẾN NGHỊ").Bold().FontSize(12);
                        col.Item().PaddingTop(4).Text(r.Recommendations);
                    }

                    col.Item().PaddingTop(16).LineHorizontal(0.5f).LineColor("#cccccc");
                    AddStatusMeta(col, r.Status, r.SubmittedAt, r.VerifiedAt);
                    AddSignatureBlock(col);
                });

                AddPageFooter(page);
            });
        }).GeneratePdf();
    }

    private static byte[] BuildAtpWorkPdf(AtpWorkReportDto r, string issuingAgency)
    {
        var periodLabel = r.PeriodType == ReportPeriodType.HalfYear && r.PeriodHalf.HasValue
            ? $"{PeriodTypeLabel(r.PeriodType)} {(r.PeriodHalf == 1 ? "đầu" : "cuối")} năm {r.PeriodYear}"
            : $"{PeriodTypeLabel(r.PeriodType)} {r.PeriodYear}";

        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(t => t.FontSize(11).FontFamily("Arial"));

                AddPageHeader(page,
                    "BÁO CÁO CÔNG TÁC AN TOÀN THỰC PHẨM",
                    periodLabel,
                    r.OrganizationName,
                    issuingAgency);

                page.Content().PaddingTop(12).Column(col =>
                {
                    // I. Business stats
                    col.Item().PaddingBottom(6)
                        .Text("I. TÌNH HÌNH CƠ SỞ SẢN XUẤT KINH DOANH").Bold().FontSize(12);
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(c => { c.RelativeColumn(4); c.RelativeColumn(2); });

                        static void Row(ITableCellContainer label, ITableCellContainer val, string l, string v)
                        {
                            label.Border(1).BorderColor("#DDDDDD").Padding(4).Text(l).FontSize(10);
                            val.Border(1).BorderColor("#DDDDDD").Padding(4).AlignRight().Text(v).FontSize(10);
                        }

                        Row(table.Cell(), table.Cell(), "Tổng số cơ sở", r.TotalBusinesses.ToString("N0"));
                        Row(table.Cell(), table.Cell(), "Cơ sở mới", r.NewBusinesses.ToString("N0"));
                        Row(table.Cell(), table.Cell(), "Cơ sở ngừng hoạt động", r.InactiveBusinesses.ToString("N0"));
                        Row(table.Cell(), table.Cell(), "Cơ sở có giấy chứng nhận", r.BusinessesWithCertificate.ToString("N0"));
                    });

                    // II. Certification
                    col.Item().PaddingTop(10).PaddingBottom(6)
                        .Text("II. CẤP PHÉP & CHỨNG NHẬN").Bold().FontSize(12);
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(c => { c.RelativeColumn(4); c.RelativeColumn(2); });

                        static void Row(ITableCellContainer label, ITableCellContainer val, string l, string v)
                        {
                            label.Border(1).BorderColor("#DDDDDD").Padding(4).Text(l).FontSize(10);
                            val.Border(1).BorderColor("#DDDDDD").Padding(4).AlignRight().Text(v).FontSize(10);
                        }

                        Row(table.Cell(), table.Cell(), "Giấy ĐKCB cấp", r.DkcbIssued.ToString("N0"));
                        Row(table.Cell(), table.Cell(), "Bản tự công bố nhận được", r.SelfDeclarationsReceived.ToString("N0"));
                        Row(table.Cell(), table.Cell(), "Đăng ký quảng cáo cấp", r.AdRegistrationsIssued.ToString("N0"));
                        Row(table.Cell(), table.Cell(), "Giấy đủ điều kiện cấp", r.EligibilityCertificatesIssued.ToString("N0"));
                        Row(table.Cell(), table.Cell(), "Giấy CFS cấp", r.CfsIssued.ToString("N0"));
                        Row(table.Cell(), table.Cell(), "Giấy xuất khẩu thực phẩm cấp", r.ExportCertificatesIssued.ToString("N0"));
                    });

                    // III. Inspection
                    col.Item().PaddingTop(10).PaddingBottom(6)
                        .Text("III. THANH KIỂM TRA").Bold().FontSize(12);
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(c => { c.RelativeColumn(4); c.RelativeColumn(2); });

                        static void Row(ITableCellContainer label, ITableCellContainer val, string l, string v)
                        {
                            label.Border(1).BorderColor("#DDDDDD").Padding(4).Text(l).FontSize(10);
                            val.Border(1).BorderColor("#DDDDDD").Padding(4).AlignRight().Text(v).FontSize(10);
                        }

                        Row(table.Cell(), table.Cell(), "Tổng số đoàn/kế hoạch", r.TotalInspectionPlans.ToString("N0"));
                        Row(table.Cell(), table.Cell(), "Cơ sở được kiểm tra", r.BusinessesInspected.ToString("N0"));
                        Row(table.Cell(), table.Cell(), "Số vi phạm phát hiện", r.ViolationsFound.ToString("N0"));
                        Row(table.Cell(), table.Cell(), "Số quyết định phạt", r.FinesIssued.ToString("N0"));
                        Row(table.Cell(), table.Cell(), "Tổng tiền phạt (VND)", r.FineTotalAmount.ToString("N0"));
                    });

                    // IV. Poisoning
                    col.Item().PaddingTop(10).PaddingBottom(6)
                        .Text("IV. NGỘ ĐỘC THỰC PHẨM").Bold().FontSize(12);
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(c => { c.RelativeColumn(4); c.RelativeColumn(2); });

                        static void Row(ITableCellContainer label, ITableCellContainer val, string l, string v)
                        {
                            label.Border(1).BorderColor("#DDDDDD").Padding(4).Text(l).FontSize(10);
                            val.Border(1).BorderColor("#DDDDDD").Padding(4).AlignRight().Text(v).FontSize(10);
                        }

                        Row(table.Cell(), table.Cell(), "Số ca ngộ độc", r.PoisoningCaseCount.ToString("N0"));
                        Row(table.Cell(), table.Cell(), "Số vụ ngộ độc tập thể", r.PoisoningIncidentCount.ToString("N0"));
                        Row(table.Cell(), table.Cell(), "Tổng số người mắc", r.TotalAffected.ToString("N0"));
                        Row(table.Cell(), table.Cell(), "Số người tử vong", r.TotalDeaths.ToString("N0"));
                    });

                    // V. Training
                    col.Item().PaddingTop(10).PaddingBottom(6)
                        .Text("V. TRUYỀN THÔNG & TẬP HUẤN").Bold().FontSize(12);
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(c => { c.RelativeColumn(4); c.RelativeColumn(2); });

                        static void Row(ITableCellContainer label, ITableCellContainer val, string l, string v)
                        {
                            label.Border(1).BorderColor("#DDDDDD").Padding(4).Text(l).FontSize(10);
                            val.Border(1).BorderColor("#DDDDDD").Padding(4).AlignRight().Text(v).FontSize(10);
                        }

                        Row(table.Cell(), table.Cell(), "Số lớp tập huấn", r.TrainingSessions.ToString("N0"));
                        Row(table.Cell(), table.Cell(), "Số học viên", r.TrainingParticipants.ToString("N0"));
                        Row(table.Cell(), table.Cell(), "Xuất hiện trên truyền thông", r.MediaAppearances.ToString("N0"));
                        Row(table.Cell(), table.Cell(), "Số văn bản ban hành", r.DocumentsIssued.ToString("N0"));
                    });

                    // Narrative sections
                    if (!string.IsNullOrWhiteSpace(r.Overview))
                    {
                        col.Item().PaddingTop(12).Text("VI. ĐÁNH GIÁ CHUNG").Bold().FontSize(12);
                        col.Item().PaddingTop(4).Text(r.Overview);
                    }
                    if (!string.IsNullOrWhiteSpace(r.Achievements))
                    {
                        col.Item().PaddingTop(8).Text("Kết quả đạt được:").Bold();
                        col.Item().PaddingTop(4).Text(r.Achievements);
                    }
                    if (!string.IsNullOrWhiteSpace(r.Limitations))
                    {
                        col.Item().PaddingTop(8).Text("Tồn tại, hạn chế:").Bold();
                        col.Item().PaddingTop(4).Text(r.Limitations);
                    }
                    if (!string.IsNullOrWhiteSpace(r.Solutions))
                    {
                        col.Item().PaddingTop(8).Text("Giải pháp:").Bold();
                        col.Item().PaddingTop(4).Text(r.Solutions);
                    }
                    if (!string.IsNullOrWhiteSpace(r.NextPeriodPlan))
                    {
                        col.Item().PaddingTop(8).Text("Kế hoạch kỳ tới:").Bold();
                        col.Item().PaddingTop(4).Text(r.NextPeriodPlan);
                    }

                    col.Item().PaddingTop(16).LineHorizontal(0.5f).LineColor("#cccccc");
                    AddStatusMeta(col, r.Status, r.SubmittedAt, r.VerifiedAt);
                    AddSignatureBlock(col);
                });

                AddPageFooter(page);
            });
        }).GeneratePdf();
    }

    private static byte[] BuildAmrPdf(ActionMonthReportDto r, string issuingAgency)
    {
        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(t => t.FontSize(11).FontFamily("Arial"));

                AddPageHeader(page,
                    "BÁO CÁO THÁNG HÀNH ĐỘNG QUỐC GIA VỀ AN TOÀN THỰC PHẨM",
                    $"Năm {r.PeriodYear}",
                    r.OrganizationName,
                    issuingAgency);

                page.Content().PaddingTop(12).Column(col =>
                {
                    if (!string.IsNullOrWhiteSpace(r.ActionMonthTheme))
                    {
                        col.Item().Row(row =>
                        {
                            row.ConstantItem(150).Text("Chủ đề năm:").Bold();
                            row.RelativeItem().Text(r.ActionMonthTheme);
                        });
                        col.Item().PaddingBottom(4);
                    }
                    if (!string.IsNullOrWhiteSpace(r.ActionMonthDates))
                    {
                        col.Item().Row(row =>
                        {
                            row.ConstantItem(150).Text("Thời gian triển khai:").Bold();
                            row.RelativeItem().Text(r.ActionMonthDates);
                        });
                        col.Item().PaddingBottom(8);
                    }

                    // I. Media/propaganda activities
                    col.Item().PaddingBottom(6)
                        .Text("I. HOẠT ĐỘNG TRUYỀN THÔNG, TUYÊN TRUYỀN").Bold().FontSize(12);
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(c => { c.RelativeColumn(4); c.RelativeColumn(2); });

                        static void Row(ITableCellContainer label, ITableCellContainer val, string l, string v)
                        {
                            label.Border(1).BorderColor("#DDDDDD").Padding(4).Text(l).FontSize(10);
                            val.Border(1).BorderColor("#DDDDDD").Padding(4).AlignRight().Text(v).FontSize(10);
                        }

                        Row(table.Cell(), table.Cell(), "Số bài viết báo/tạp chí", r.MediaArticles.ToString("N0"));
                        Row(table.Cell(), table.Cell(), "Số chương trình phát thanh/truyền hình", r.BroadcastPrograms.ToString("N0"));
                        Row(table.Cell(), table.Cell(), "Số buổi tuyên truyền/phổ biến", r.PropagandaSessions.ToString("N0"));
                        Row(table.Cell(), table.Cell(), "Số người tham dự", r.Participants.ToString("N0"));
                        Row(table.Cell(), table.Cell(), "Số áp phích phát hành", r.PostersDistributed.ToString("N0"));
                        Row(table.Cell(), table.Cell(), "Số tờ rơi phát hành", r.LeafletsDistributed.ToString("N0"));
                    });

                    // II. Inspection
                    col.Item().PaddingTop(10).PaddingBottom(6)
                        .Text("II. THANH KIỂM TRA").Bold().FontSize(12);
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(c => { c.RelativeColumn(4); c.RelativeColumn(2); });

                        static void Row(ITableCellContainer label, ITableCellContainer val, string l, string v)
                        {
                            label.Border(1).BorderColor("#DDDDDD").Padding(4).Text(l).FontSize(10);
                            val.Border(1).BorderColor("#DDDDDD").Padding(4).AlignRight().Text(v).FontSize(10);
                        }

                        Row(table.Cell(), table.Cell(), "Số cơ sở được kiểm tra", r.BusinessesInspected.ToString("N0"));
                        Row(table.Cell(), table.Cell(), "Số vi phạm phát hiện", r.ViolationsFound.ToString("N0"));
                        Row(table.Cell(), table.Cell(), "Số quyết định phạt", r.FinesIssued.ToString("N0"));
                        Row(table.Cell(), table.Cell(), "Tổng tiền phạt (VND)", r.FineAmount.ToString("N0"));
                    });

                    col.Item().PaddingTop(10).Row(infoRow =>
                    {
                        infoRow.ConstantItem(250).Text("Số bản tự công bố sản phẩm mới:").Bold();
                        infoRow.RelativeItem().Text(r.NewSelfDeclarations.ToString("N0"));
                    });

                    // Narrative
                    if (!string.IsNullOrWhiteSpace(r.Achievements))
                    {
                        col.Item().PaddingTop(12).Text("III. KẾT QUẢ ĐẠT ĐƯỢC").Bold().FontSize(12);
                        col.Item().PaddingTop(4).Text(r.Achievements);
                    }
                    if (!string.IsNullOrWhiteSpace(r.Limitations))
                    {
                        col.Item().PaddingTop(8).Text("IV. TỒN TẠI, HẠN CHẾ").Bold().FontSize(12);
                        col.Item().PaddingTop(4).Text(r.Limitations);
                    }
                    if (!string.IsNullOrWhiteSpace(r.LessonsLearned))
                    {
                        col.Item().PaddingTop(8).Text("V. BÀI HỌC KINH NGHIỆM").Bold().FontSize(12);
                        col.Item().PaddingTop(4).Text(r.LessonsLearned);
                    }
                    if (!string.IsNullOrWhiteSpace(r.NextSteps))
                    {
                        col.Item().PaddingTop(8).Text("VI. PHƯƠNG HƯỚNG NHIỆM VỤ TIẾP THEO").Bold().FontSize(12);
                        col.Item().PaddingTop(4).Text(r.NextSteps);
                    }

                    col.Item().PaddingTop(16).LineHorizontal(0.5f).LineColor("#cccccc");
                    AddStatusMeta(col, r.Status, r.SubmittedAt, r.VerifiedAt);
                    AddSignatureBlock(col);
                });

                AddPageFooter(page);
            });
        }).GeneratePdf();
    }
}
