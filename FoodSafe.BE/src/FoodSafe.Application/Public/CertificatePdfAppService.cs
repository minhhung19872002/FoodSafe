using FoodSafe.BusinessManagement;
using FoodSafe.Licensing;
using FoodSafe.Settings;
using Microsoft.AspNetCore.Authorization;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Settings;
using Volo.Abp.Threading;

namespace FoodSafe.PublicPortal;

[RemoteService(false)]
[AllowAnonymous]
public class CertificatePdfAppService : ApplicationService, ICertificatePdfAppService
{
    private const string PdfVersion = "1.0";

    private readonly IRepository<EligibilityCertificate, Guid> _eligibility;
    private readonly IRepository<SelfDeclaration, Guid> _selfDeclarations;
    private readonly IRepository<ProductRegistration, Guid> _productRegistrations;
    private readonly IRepository<CfsCertificate, Guid> _cfsCertificates;
    private readonly IRepository<ExportFoodCertificate, Guid> _exportCertificates;
    private readonly IRepository<AdvertisementRegistration, Guid> _adRegistrations;
    private readonly IRepository<Business, Guid> _businesses;
    private readonly IRepository<Product, Guid> _products;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public CertificatePdfAppService(
        IRepository<EligibilityCertificate, Guid> eligibility,
        IRepository<SelfDeclaration, Guid> selfDeclarations,
        IRepository<ProductRegistration, Guid> productRegistrations,
        IRepository<CfsCertificate, Guid> cfsCertificates,
        IRepository<ExportFoodCertificate, Guid> exportCertificates,
        IRepository<AdvertisementRegistration, Guid> adRegistrations,
        IRepository<Business, Guid> businesses,
        IRepository<Product, Guid> products,
        ICancellationTokenProvider cancellationTokens)
    {
        _eligibility = eligibility;
        _selfDeclarations = selfDeclarations;
        _productRegistrations = productRegistrations;
        _cfsCertificates = cfsCertificates;
        _exportCertificates = exportCertificates;
        _adRegistrations = adRegistrations;
        _businesses = businesses;
        _products = products;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<CertificatePdfDto> GetEligibilityCertificatePdfAsync(Guid id)
    {
        var cert = await _eligibility.FindAsync(id, cancellationToken: _cancellationTokens.Token)
            ?? throw new UserFriendlyException("Không tìm thấy giấy đủ điều kiện.");

        var issuingAgency = await SettingProvider.GetOrNullAsync(FoodSafeSettings.Documents.IssuingAgency) ?? "";
        var business = await _businesses.FindAsync(cert.BusinessId, cancellationToken: _cancellationTokens.Token);
        var fields = new CertificateFields
        {
            CertificateTitle = "GIẤY CHỨNG NHẬN CƠ SỞ ĐỦ ĐIỀU KIỆN AN TOÀN THỰC PHẨM",
            CertificateNumber = cert.CertificateNumber,
            BusinessName = business?.Name ?? string.Empty,
            BusinessAddress = business?.AddressStreet ?? string.Empty,
            TaxCode = business?.TaxCode,
            Scope = cert.CertificationScope,
            IssueDate = cert.IssueDate,
            ExpiryDate = cert.ExpiryDate,
            IssuingAuthority = cert.CertifyingAuthority ?? issuingAgency,
            StatusLabel = StatusLabel(cert.EffectiveStatus(Clock.Now.Date)),
            ExtraRows = [],
        };

        return Build(fields, $"giay-du-dieu-kien-{cert.CertificateNumber}.pdf");
    }

    public async Task<CertificatePdfDto> GetSelfDeclarationPdfAsync(Guid id)
    {
        var decl = await _selfDeclarations.FindAsync(id, cancellationToken: _cancellationTokens.Token)
            ?? throw new UserFriendlyException("Không tìm thấy bản tự công bố.");

        var issuingAgency = await SettingProvider.GetOrNullAsync(FoodSafeSettings.Documents.IssuingAgency) ?? "";
        var business = await _businesses.FindAsync(decl.BusinessId, cancellationToken: _cancellationTokens.Token);
        Product? product = decl.ProductId.HasValue
            ? await _products.FindAsync(decl.ProductId.Value, cancellationToken: _cancellationTokens.Token)
            : null;

        var fields = new CertificateFields
        {
            CertificateTitle = "XÁC NHẬN TỰ CÔNG BỐ SẢN PHẨM",
            CertificateNumber = decl.DeclarationNumber,
            BusinessName = business?.Name ?? string.Empty,
            BusinessAddress = business?.AddressStreet ?? string.Empty,
            TaxCode = business?.TaxCode,
            Scope = decl.ProductName,
            IssueDate = decl.DeclarationDate,
            ExpiryDate = decl.ExpiryDate,
            IssuingAuthority = issuingAgency,
            StatusLabel = StatusLabel(decl.EffectiveStatus(Clock.Now.Date)),
            ExtraRows =
            [
                ("Tên sản phẩm", decl.ProductName),
                ("Nhà sản xuất", decl.Manufacturer ?? "—"),
                ("Mục đích sử dụng", decl.Purpose ?? "—"),
            ],
        };

        return Build(fields, $"tu-cong-bo-{decl.DeclarationNumber}.pdf");
    }

    public async Task<CertificatePdfDto> GetProductRegistrationPdfAsync(Guid id)
    {
        var reg = await _productRegistrations.FindAsync(id, cancellationToken: _cancellationTokens.Token)
            ?? throw new UserFriendlyException("Không tìm thấy đăng ký công bố sản phẩm.");

        var issuingAgency = await SettingProvider.GetOrNullAsync(FoodSafeSettings.Documents.IssuingAgency) ?? "";
        var business = await _businesses.FindAsync(reg.BusinessId, cancellationToken: _cancellationTokens.Token);

        var fields = new CertificateFields
        {
            CertificateTitle = "GIẤY XÁC NHẬN ĐĂNG KÝ CÔNG BỐ SẢN PHẨM",
            CertificateNumber = reg.RegistrationNumber,
            BusinessName = business?.Name ?? string.Empty,
            BusinessAddress = business?.AddressStreet ?? string.Empty,
            TaxCode = business?.TaxCode,
            Scope = reg.ProductName,
            IssueDate = reg.RegistrationDate,
            ExpiryDate = reg.ExpiryDate,
            IssuingAuthority = reg.CertifyingAuthority ?? issuingAgency,
            StatusLabel = StatusLabel(reg.EffectiveStatus(Clock.Now.Date)),
            ExtraRows =
            [
                ("Tên sản phẩm", reg.ProductName),
                ("Nhà sản xuất", reg.Manufacturer ?? "—"),
                ("Số tiếp nhận", reg.ReceiptNumber ?? "—"),
            ],
        };

        return Build(fields, $"dang-ky-cong-bo-{reg.RegistrationNumber}.pdf");
    }

    public async Task<CertificatePdfDto> GetCfsCertificatePdfAsync(Guid id)
    {
        var cert = await _cfsCertificates.FindAsync(id, cancellationToken: _cancellationTokens.Token)
            ?? throw new UserFriendlyException("Không tìm thấy giấy CFS.");

        var issuingAgency = await SettingProvider.GetOrNullAsync(FoodSafeSettings.Documents.IssuingAgency) ?? "";
        var business = await _businesses.FindAsync(cert.BusinessId, cancellationToken: _cancellationTokens.Token);
        Product? product = cert.ProductId.HasValue
            ? await _products.FindAsync(cert.ProductId.Value, cancellationToken: _cancellationTokens.Token)
            : null;

        var fields = new CertificateFields
        {
            CertificateTitle = "GIẤY CHỨNG NHẬN LƯU HÀNH TỰ DO (CFS)",
            CertificateNumber = cert.CertificateNumber,
            BusinessName = business?.Name ?? string.Empty,
            BusinessAddress = business?.AddressStreet ?? string.Empty,
            TaxCode = business?.TaxCode,
            Scope = product?.Name ?? "—",
            IssueDate = cert.IssueDate,
            ExpiryDate = cert.ExpiryDate,
            IssuingAuthority = cert.CertifyingAuthority ?? issuingAgency,
            StatusLabel = StatusLabel(cert.EffectiveStatus(Clock.Now.Date)),
            ExtraRows = [],
        };

        return Build(fields, $"cfs-{cert.CertificateNumber}.pdf");
    }

    public async Task<CertificatePdfDto> GetExportFoodCertificatePdfAsync(Guid id)
    {
        var cert = await _exportCertificates.FindAsync(id, cancellationToken: _cancellationTokens.Token)
            ?? throw new UserFriendlyException("Không tìm thấy giấy chứng nhận xuất khẩu thực phẩm.");

        var issuingAgency = await SettingProvider.GetOrNullAsync(FoodSafeSettings.Documents.IssuingAgency) ?? "";
        var business = await _businesses.FindAsync(cert.BusinessId, cancellationToken: _cancellationTokens.Token);
        Product? product = cert.ProductId.HasValue
            ? await _products.FindAsync(cert.ProductId.Value, cancellationToken: _cancellationTokens.Token)
            : null;

        var fields = new CertificateFields
        {
            CertificateTitle = "GIẤY CHỨNG NHẬN XUẤT KHẨU THỰC PHẨM",
            CertificateNumber = cert.CertificateNumber,
            BusinessName = business?.Name ?? string.Empty,
            BusinessAddress = business?.AddressStreet ?? string.Empty,
            TaxCode = business?.TaxCode,
            Scope = product?.Name ?? "—",
            IssueDate = cert.IssueDate,
            ExpiryDate = cert.ExpiryDate,
            IssuingAuthority = issuingAgency,
            StatusLabel = StatusLabel(cert.EffectiveStatus(Clock.Now.Date)),
            ExtraRows =
            [
                ("Số lô hàng", cert.LotNumber ?? "—"),
                ("Số lượng", cert.Quantity.HasValue ? $"{cert.Quantity:N0} {cert.QuantityUnit}" : "—"),
            ],
        };

        return Build(fields, $"gcn-xuat-khau-{cert.CertificateNumber}.pdf");
    }

    public async Task<CertificatePdfDto> GetAdvertisementRegistrationPdfAsync(Guid id)
    {
        var queryable = await _adRegistrations.WithDetailsAsync(x => x.Products);
        var reg = await AsyncExecuter.FirstOrDefaultAsync(
                queryable.Where(x => x.Id == id), _cancellationTokens.Token)
            ?? throw new UserFriendlyException("Không tìm thấy xác nhận nội dung quảng cáo.");

        var issuingAgency = await SettingProvider.GetOrNullAsync(FoodSafeSettings.Documents.IssuingAgency) ?? "";
        var business = await _businesses.FindAsync(reg.BusinessId, cancellationToken: _cancellationTokens.Token);

        var productIds = reg.Products.Select(p => p.ProductId).ToArray();
        var productNames = productIds.Length > 0
            ? (await _products.GetListAsync(p => productIds.Contains(p.Id), cancellationToken: _cancellationTokens.Token))
                .Select(p => p.Name).ToArray()
            : Array.Empty<string>();

        var fields = new CertificateFields
        {
            CertificateTitle = "GIẤY XÁC NHẬN NỘI DUNG QUẢNG CÁO",
            CertificateNumber = reg.RegistrationNumber,
            BusinessName = business?.Name ?? string.Empty,
            BusinessAddress = business?.AddressStreet ?? string.Empty,
            TaxCode = business?.TaxCode,
            Scope = productNames.Length > 0 ? string.Join(", ", productNames) : null,
            IssueDate = reg.RegistrationDate,
            ExpiryDate = reg.ExpiryDate,
            IssuingAuthority = issuingAgency,
            StatusLabel = StatusLabel(reg.EffectiveStatus(Clock.Now.Date)),
            ExtraRows =
            [
                ("Nội dung quảng cáo", reg.ContentDescription ?? "—"),
                ("Phương tiện quảng cáo", reg.Medium ?? "—"),
            ],
        };

        return Build(fields, $"xac-nhan-quang-cao-{reg.RegistrationNumber}.pdf");
    }

    // ── Private ──────────────────────────────────────────────────────────────

    private static string StatusLabel(LicenseStatus status) => status switch
    {
        LicenseStatus.Active => "Còn hiệu lực",
        LicenseStatus.Expired => "Hết hiệu lực",
        LicenseStatus.Revoked => "Đã thu hồi",
        _ => "Không xác định",
    };

    private sealed record CertificateFields
    {
        public required string CertificateTitle { get; init; }
        public required string CertificateNumber { get; init; }
        public required string BusinessName { get; init; }
        public required string BusinessAddress { get; init; }
        public string? TaxCode { get; init; }
        public string? Scope { get; init; }
        public required DateTime IssueDate { get; init; }
        public DateTime? ExpiryDate { get; init; }
        public required string IssuingAuthority { get; init; }
        public required string StatusLabel { get; init; }
        public required IReadOnlyList<(string Label, string Value)> ExtraRows { get; init; }
    }

    private static CertificatePdfDto Build(CertificateFields f, string fileName)
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
                    col.Item().PaddingTop(8).Text(f.IssuingAuthority)
                        .Bold().AlignCenter().FontSize(11);
                    col.Item().PaddingTop(12).Text(f.CertificateTitle)
                        .Bold().AlignCenter().FontSize(14);
                    col.Item().Text($"Số: {f.CertificateNumber}")
                        .AlignCenter().FontSize(11).Italic();
                    col.Item().PaddingTop(4).LineHorizontal(1).LineColor("#1677FF");
                });

                page.Content().PaddingTop(12).Column(col =>
                {
                    // Main certificate body
                    static void LabelValue(ColumnDescriptor col, string label, string value)
                    {
                        col.Item().Row(row =>
                        {
                            row.ConstantItem(155).Text(label).Bold();
                            row.RelativeItem().Text(value);
                        });
                        col.Item().PaddingBottom(4);
                    }

                    LabelValue(col, "Tên cơ sở:", f.BusinessName);
                    LabelValue(col, "Địa chỉ:", f.BusinessAddress.Length > 0 ? f.BusinessAddress : "—");
                    if (!string.IsNullOrWhiteSpace(f.TaxCode))
                        LabelValue(col, "Mã số thuế:", f.TaxCode);
                    if (!string.IsNullOrWhiteSpace(f.Scope))
                        LabelValue(col, "Phạm vi / Sản phẩm:", f.Scope);

                    foreach (var (label, value) in f.ExtraRows)
                        LabelValue(col, label + ":", value);

                    LabelValue(col, "Ngày cấp:", f.IssueDate.ToString("dd/MM/yyyy"));
                    LabelValue(col, "Ngày hết hạn:",
                        f.ExpiryDate.HasValue ? f.ExpiryDate.Value.ToString("dd/MM/yyyy") : "Không xác định");
                    LabelValue(col, "Trạng thái:", f.StatusLabel);

                    col.Item().PaddingTop(16).LineHorizontal(0.5f).LineColor("#cccccc");
                    col.Item().PaddingTop(8).Text(
                        $"Giấy này được tạo tự động từ hệ thống quản lý an toàn thực phẩm tỉnh Quảng Ninh. " +
                        $"Phiên bản tài liệu: {PdfVersion}.")
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

        return new CertificatePdfDto
        {
            Content = doc.GeneratePdf(),
            FileName = fileName,
        };
    }
}
