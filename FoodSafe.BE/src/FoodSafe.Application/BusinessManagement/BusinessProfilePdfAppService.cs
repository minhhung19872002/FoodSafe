using FoodSafe.Licensing;
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

namespace FoodSafe.BusinessManagement;

[RemoteService(false)]
[Authorize(FoodSafePermissions.BusinessManagement.Businesses.View)]
public class BusinessProfilePdfAppService :
    ApplicationService,
    IBusinessProfilePdfAppService
{
    private const string IssuingAgency =
        "CHI CỤC AN TOÀN VỆ SINH THỰC PHẨM TỈNH QUẢNG NINH";

    private readonly IRepository<Business, Guid> _businesses;
    private readonly IRepository<BusinessProductGroup> _businessProductGroups;
    private readonly IRepository<Product, Guid> _products;
    private readonly IRepository<SelfDeclaration, Guid> _selfDeclarations;
    private readonly IRepository<EligibilityCertificate, Guid> _eligibilityCertificates;
    private readonly IRepository<VsattpCommitment, Guid> _commitments;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public BusinessProfilePdfAppService(
        IRepository<Business, Guid> businesses,
        IRepository<BusinessProductGroup> businessProductGroups,
        IRepository<Product, Guid> products,
        IRepository<SelfDeclaration, Guid> selfDeclarations,
        IRepository<EligibilityCertificate, Guid> eligibilityCertificates,
        IRepository<VsattpCommitment, Guid> commitments,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens)
    {
        _businesses = businesses;
        _businessProductGroups = businessProductGroups;
        _products = products;
        _selfDeclarations = selfDeclarations;
        _eligibilityCertificates = eligibilityCertificates;
        _commitments = commitments;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<BusinessProfilePdfDto> GenerateProfilePdfAsync(Guid businessId)
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.View, _cancellationTokens.Token);

        var businessQuery = await _businesses.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
        {
            var productGroupQuery =
                await _businessProductGroups.GetQueryableAsync();
            var organizationIds = scope.OrganizationIds;
            var provinceIds = scope.ProvinceIds;
            var communeIds = scope.CommuneIds;
            var businessIds = scope.BusinessIds ?? new HashSet<Guid>();
            var businessTypeIds =
                scope.BusinessTypeIds ?? new HashSet<Guid>();
            var productGroupIds =
                scope.ProductGroupIds ?? new HashSet<Guid>();

            businessQuery = businessQuery.Where(x =>
                organizationIds.Contains(x.OrganizationId) ||
                businessIds.Contains(x.Id) ||
                (x.BusinessTypeId.HasValue &&
                 businessTypeIds.Contains(x.BusinessTypeId.Value)) ||
                (x.AddressProvinceId.HasValue &&
                 provinceIds.Contains(x.AddressProvinceId.Value)) ||
                (x.AddressCommuneId.HasValue &&
                 communeIds.Contains(x.AddressCommuneId.Value)) ||
                productGroupQuery.Any(link =>
                    link.BusinessId == x.Id &&
                    productGroupIds.Contains(link.ProductGroupId)));
        }

        var business = await AsyncExecuter.FirstOrDefaultAsync(
                           businessQuery.Where(x => x.Id == businessId),
                           _cancellationTokens.Token)
                       ?? throw new UserFriendlyException(
                           "Không tìm thấy cơ sở hoặc bạn không có quyền truy cập.");

        // Load related data
        var productQuery = await _products.GetQueryableAsync();
        var products = await AsyncExecuter.ToListAsync(
            productQuery
                .Where(x => x.BusinessId == businessId)
                .OrderBy(x => x.Name),
            _cancellationTokens.Token);

        var selfDeclarationQuery = await _selfDeclarations.GetQueryableAsync();
        var selfDeclarations = await AsyncExecuter.ToListAsync(
            selfDeclarationQuery
                .Where(x => x.BusinessId == businessId)
                .OrderByDescending(x => x.DeclarationDate),
            _cancellationTokens.Token);

        var certQuery = await _eligibilityCertificates.GetQueryableAsync();
        var certs = await AsyncExecuter.ToListAsync(
            certQuery
                .Where(x => x.BusinessId == businessId)
                .OrderByDescending(x => x.IssueDate),
            _cancellationTokens.Token);

        var commitmentQuery = await _commitments.GetQueryableAsync();
        var commitments = await AsyncExecuter.ToListAsync(
            commitmentQuery
                .Where(x => x.BusinessId == businessId)
                .OrderByDescending(x => x.CommitmentDate),
            _cancellationTokens.Token);

        var slug = businessId.ToString("N")[..8];
        var fileName = $"ho-so-co-so-{slug}.pdf";
        var bytes = BuildPdf(business, products, selfDeclarations, certs, commitments);

        return new BusinessProfilePdfDto
        {
            Content = bytes,
            FileName = fileName,
        };
    }

    // ── Private ──────────────────────────────────────────────────────────────

    private static byte[] BuildPdf(
        Business business,
        List<Product> products,
        List<SelfDeclaration> selfDeclarations,
        List<EligibilityCertificate> certs,
        List<VsattpCommitment> commitments)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var statusLabel = business.Status switch
        {
            BusinessStatus.Active => "Đang hoạt động",
            BusinessStatus.Inactive => "Ngừng hoạt động",
            BusinessStatus.Suspended => "Đình chỉ hoạt động",
            _ => business.Status.ToString()
        };

        var now = DateTime.Now;

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(t => t.FontSize(11).FontFamily("Arial"));

                // ── Header ──────────────────────────────────────────────────
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
                            c.Item()
                                .Text("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM")
                                .Bold().FontSize(10).AlignCenter();
                            c.Item().Text("Độc lập - Tự do - Hạnh phúc")
                                .AlignCenter().FontSize(10);
                            c.Item().Text("──────────────")
                                .AlignCenter().FontSize(9);
                        });
                    });

                    col.Item().PaddingTop(12)
                        .Text("HỒ SƠ CƠ SỞ KINH DOANH THỰC PHẨM")
                        .Bold().AlignCenter().FontSize(14);

                    col.Item().PaddingTop(6)
                        .LineHorizontal(1).LineColor("#1677FF");
                });

                // ── Content ─────────────────────────────────────────────────
                page.Content().PaddingTop(12).Column(col =>
                {
                    // ── Section 1: Thông tin cơ sở ──────────────────────────
                    col.Item().PaddingBottom(6)
                        .Text("I. THÔNG TIN CƠ SỞ")
                        .Bold().FontSize(12);

                    void InfoRow(string label, string? value)
                    {
                        col.Item().Row(r =>
                        {
                            r.ConstantItem(190).Text(label)
                                .Bold().FontSize(11);
                            r.RelativeItem()
                                .Text(value ?? "—").FontSize(11);
                        });
                        col.Item().PaddingBottom(3);
                    }

                    InfoRow("Tên cơ sở:", business.Name);
                    InfoRow("Mã cơ sở:", business.Code);
                    InfoRow("Mã số thuế:", business.TaxCode);
                    InfoRow("Người đại diện pháp luật:",
                        business.RepresentativeName);
                    InfoRow("Số CCCD/CMND người đại diện:",
                        business.RepresentativeIdCard);
                    InfoRow("Địa chỉ:", business.AddressStreet);
                    InfoRow("Điện thoại:", business.ContactPhone);
                    InfoRow("Email:", business.ContactEmail);
                    InfoRow("Website:", business.ContactWebsite);
                    if (business.EstablishedDate.HasValue)
                        InfoRow("Ngày thành lập:",
                            business.EstablishedDate.Value.ToString(
                                "dd/MM/yyyy"));
                    if (business.EmployeeCount.HasValue)
                        InfoRow("Số lao động:",
                            business.EmployeeCount.Value.ToString());

                    col.Item().Row(r =>
                    {
                        r.ConstantItem(190).Text("Trạng thái:")
                            .Bold().FontSize(11);
                        r.RelativeItem().Text(statusLabel)
                            .Bold().FontSize(11);
                    });
                    col.Item().PaddingBottom(3);

                    col.Item().Row(r =>
                    {
                        r.ConstantItem(190).Text("Giấy chứng nhận đủ điều kiện:")
                            .Bold().FontSize(11);
                        r.RelativeItem()
                            .Text(business.HasEligibilityCertificate
                                ? "Đã có"
                                : "Chưa có")
                            .FontSize(11);
                    });
                    col.Item().PaddingBottom(3);

                    col.Item().Row(r =>
                    {
                        r.ConstantItem(190).Text("Cam kết VSATTP:")
                            .Bold().FontSize(11);
                        r.RelativeItem()
                            .Text(business.HasVsattpCommitment
                                ? "Đã ký cam kết"
                                : "Chưa ký")
                            .FontSize(11);
                    });
                    col.Item().PaddingBottom(3);

                    col.Item().PaddingTop(8)
                        .LineHorizontal(0.5f).LineColor("#cccccc");

                    // ── Section 2: Giấy phép / Chứng nhận ───────────────────
                    col.Item().PaddingTop(10).PaddingBottom(6)
                        .Text("II. GIẤY CHỨNG NHẬN ĐỦ ĐIỀU KIỆN AN TOÀN THỰC PHẨM")
                        .Bold().FontSize(12);

                    if (certs.Count == 0)
                    {
                        col.Item().PaddingBottom(4)
                            .Text("Chưa có giấy chứng nhận.")
                            .FontSize(11).Italic();
                    }
                    else
                    {
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(c =>
                            {
                                c.ConstantColumn(30);   // STT
                                c.RelativeColumn(2);    // Số chứng nhận
                                c.RelativeColumn(1.5f); // Ngày cấp
                                c.RelativeColumn(1.5f); // Ngày hết hạn
                                c.RelativeColumn(2);    // Cơ quan cấp
                                c.RelativeColumn(1);    // Trạng thái
                            });

                            static void Th(ITableCellContainer cell, string text) =>
                                cell.Background("#1677FF").Padding(4)
                                    .Text(text).Bold().FontColor("#ffffff")
                                    .FontSize(10).AlignCenter();

                            Th(table.Cell().Row(1).Column(1), "STT");
                            Th(table.Cell().Row(1).Column(2), "Số chứng nhận");
                            Th(table.Cell().Row(1).Column(3), "Ngày cấp");
                            Th(table.Cell().Row(1).Column(4), "Hết hạn");
                            Th(table.Cell().Row(1).Column(5), "Cơ quan cấp");
                            Th(table.Cell().Row(1).Column(6), "Trạng thái");

                            uint tableRow = 2;
                            var idx = 1;
                            foreach (var cert in certs)
                            {
                                var bg = idx % 2 == 0 ? "#f5f5f5" : "#ffffff";

                                static void Td(ITableCellContainer cell,
                                    string bg, string text, bool center = false)
                                {
                                    var t = cell.Background(bg).Padding(4)
                                        .Text(text).FontSize(10);
                                    if (center) t.AlignCenter();
                                }

                                var licenseStatusLabel = cert.Status switch
                                {
                                    LicenseStatus.Active => "Còn hiệu lực",
                                    LicenseStatus.Expired => "Hết hạn",
                                    LicenseStatus.Revoked => "Thu hồi",
                                    _ => cert.Status.ToString()
                                };

                                Td(table.Cell().Row(tableRow).Column(1),
                                    bg, idx.ToString(), center: true);
                                Td(table.Cell().Row(tableRow).Column(2),
                                    bg, cert.CertificateNumber);
                                Td(table.Cell().Row(tableRow).Column(3),
                                    bg, cert.IssueDate.ToString("dd/MM/yyyy"),
                                    center: true);
                                Td(table.Cell().Row(tableRow).Column(4), bg,
                                    cert.ExpiryDate.HasValue
                                        ? cert.ExpiryDate.Value.ToString(
                                            "dd/MM/yyyy")
                                        : "—",
                                    center: true);
                                Td(table.Cell().Row(tableRow).Column(5),
                                    bg, cert.CertifyingAuthority ?? "—");
                                Td(table.Cell().Row(tableRow).Column(6),
                                    bg, licenseStatusLabel, center: true);

                                tableRow++;
                                idx++;
                            }
                        });
                    }

                    col.Item().PaddingTop(8)
                        .LineHorizontal(0.5f).LineColor("#cccccc");

                    // ── Section 3: Sản phẩm ─────────────────────────────────
                    col.Item().PaddingTop(10).PaddingBottom(6)
                        .Text("III. DANH SÁCH SẢN PHẨM")
                        .Bold().FontSize(12);

                    if (products.Count == 0)
                    {
                        col.Item().PaddingBottom(4)
                            .Text("Chưa có sản phẩm nào được đăng ký.")
                            .FontSize(11).Italic();
                    }
                    else
                    {
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(c =>
                            {
                                c.ConstantColumn(30);   // STT
                                c.RelativeColumn(3);    // Tên sản phẩm
                                c.RelativeColumn(1.5f); // Thương hiệu
                                c.RelativeColumn(2);    // Nhà sản xuất
                                c.RelativeColumn(1);    // Trạng thái
                            });

                            static void Th(ITableCellContainer cell, string text) =>
                                cell.Background("#1677FF").Padding(4)
                                    .Text(text).Bold().FontColor("#ffffff")
                                    .FontSize(10).AlignCenter();

                            Th(table.Cell().Row(1).Column(1), "STT");
                            Th(table.Cell().Row(1).Column(2), "Tên sản phẩm");
                            Th(table.Cell().Row(1).Column(3), "Thương hiệu");
                            Th(table.Cell().Row(1).Column(4), "Nhà sản xuất");
                            Th(table.Cell().Row(1).Column(5), "Trạng thái");

                            uint tableRow = 2;
                            var idx = 1;
                            foreach (var product in products)
                            {
                                var bg = idx % 2 == 0 ? "#f5f5f5" : "#ffffff";

                                static void Td(ITableCellContainer cell,
                                    string bg, string text, bool center = false)
                                {
                                    var t = cell.Background(bg).Padding(4)
                                        .Text(text).FontSize(10);
                                    if (center) t.AlignCenter();
                                }

                                var productStatusLabel = product.Status switch
                                {
                                    ProductStatus.Active => "Đang KD",
                                    ProductStatus.Inactive => "Ngừng KD",
                                    _ => product.Status.ToString()
                                };

                                Td(table.Cell().Row(tableRow).Column(1),
                                    bg, idx.ToString(), center: true);
                                Td(table.Cell().Row(tableRow).Column(2),
                                    bg, product.Name);
                                Td(table.Cell().Row(tableRow).Column(3),
                                    bg, product.BrandName ?? "—");
                                Td(table.Cell().Row(tableRow).Column(4),
                                    bg, product.Manufacturer ?? "—");
                                Td(table.Cell().Row(tableRow).Column(5),
                                    bg, productStatusLabel, center: true);

                                tableRow++;
                                idx++;
                            }
                        });
                    }

                    col.Item().PaddingTop(8)
                        .LineHorizontal(0.5f).LineColor("#cccccc");

                    // ── Section 4: Tự công bố sản phẩm ─────────────────────
                    if (selfDeclarations.Count > 0)
                    {
                        col.Item().PaddingTop(10).PaddingBottom(6)
                            .Text("IV. TỰ CÔNG BỐ SẢN PHẨM")
                            .Bold().FontSize(12);

                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(c =>
                            {
                                c.ConstantColumn(30);   // STT
                                c.RelativeColumn(1.5f); // Số tự công bố
                                c.RelativeColumn(2.5f); // Tên sản phẩm
                                c.RelativeColumn(1.5f); // Ngày công bố
                                c.RelativeColumn(1.5f); // Hết hạn
                                c.RelativeColumn(1);    // Trạng thái
                            });

                            static void Th(ITableCellContainer cell, string text) =>
                                cell.Background("#1677FF").Padding(4)
                                    .Text(text).Bold().FontColor("#ffffff")
                                    .FontSize(10).AlignCenter();

                            Th(table.Cell().Row(1).Column(1), "STT");
                            Th(table.Cell().Row(1).Column(2), "Số công bố");
                            Th(table.Cell().Row(1).Column(3), "Tên sản phẩm");
                            Th(table.Cell().Row(1).Column(4), "Ngày công bố");
                            Th(table.Cell().Row(1).Column(5), "Hết hạn");
                            Th(table.Cell().Row(1).Column(6), "Trạng thái");

                            uint tableRow = 2;
                            var idx = 1;
                            foreach (var sd in selfDeclarations)
                            {
                                var bg = idx % 2 == 0 ? "#f5f5f5" : "#ffffff";

                                static void Td(ITableCellContainer cell,
                                    string bg, string text, bool center = false)
                                {
                                    var t = cell.Background(bg).Padding(4)
                                        .Text(text).FontSize(10);
                                    if (center) t.AlignCenter();
                                }

                                var sdStatusLabel = sd.Status switch
                                {
                                    LicenseStatus.Active => "Còn hiệu lực",
                                    LicenseStatus.Expired => "Hết hạn",
                                    LicenseStatus.Revoked => "Thu hồi",
                                    _ => sd.Status.ToString()
                                };

                                Td(table.Cell().Row(tableRow).Column(1),
                                    bg, idx.ToString(), center: true);
                                Td(table.Cell().Row(tableRow).Column(2),
                                    bg, sd.DeclarationNumber);
                                Td(table.Cell().Row(tableRow).Column(3),
                                    bg, sd.ProductName);
                                Td(table.Cell().Row(tableRow).Column(4),
                                    bg, sd.DeclarationDate.ToString("dd/MM/yyyy"),
                                    center: true);
                                Td(table.Cell().Row(tableRow).Column(5), bg,
                                    sd.ExpiryDate.HasValue
                                        ? sd.ExpiryDate.Value.ToString(
                                            "dd/MM/yyyy")
                                        : "—",
                                    center: true);
                                Td(table.Cell().Row(tableRow).Column(6),
                                    bg, sdStatusLabel, center: true);

                                tableRow++;
                                idx++;
                            }
                        });

                        col.Item().PaddingTop(8)
                            .LineHorizontal(0.5f).LineColor("#cccccc");
                    }

                    // ── Section 5: Cam kết VSATTP ────────────────────────────
                    if (commitments.Count > 0)
                    {
                        var sectionNumber = selfDeclarations.Count > 0
                            ? "V."
                            : "IV.";

                        col.Item().PaddingTop(10).PaddingBottom(6)
                            .Text($"{sectionNumber} CAM KẾT VỆ SINH AN TOÀN THỰC PHẨM")
                            .Bold().FontSize(12);

                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(c =>
                            {
                                c.ConstantColumn(30);   // STT
                                c.RelativeColumn(2);    // Ngày cam kết
                                c.RelativeColumn(1.5f); // Trạng thái
                                c.RelativeColumn(2);    // Ngày xác nhận
                                c.RelativeColumn(2.5f); // Ghi chú
                            });

                            static void Th(ITableCellContainer cell, string text) =>
                                cell.Background("#1677FF").Padding(4)
                                    .Text(text).Bold().FontColor("#ffffff")
                                    .FontSize(10).AlignCenter();

                            Th(table.Cell().Row(1).Column(1), "STT");
                            Th(table.Cell().Row(1).Column(2), "Ngày cam kết");
                            Th(table.Cell().Row(1).Column(3), "Trạng thái");
                            Th(table.Cell().Row(1).Column(4), "Ngày xác nhận");
                            Th(table.Cell().Row(1).Column(5), "Ghi chú");

                            uint tableRow = 2;
                            var idx = 1;
                            foreach (var commitment in commitments)
                            {
                                var bg = idx % 2 == 0 ? "#f5f5f5" : "#ffffff";

                                static void Td(ITableCellContainer cell,
                                    string bg, string text, bool center = false)
                                {
                                    var t = cell.Background(bg).Padding(4)
                                        .Text(text).FontSize(10);
                                    if (center) t.AlignCenter();
                                }

                                var commitStatusLabel =
                                    commitment.Status switch
                                    {
                                        VsattpCommitmentStatus.Submitted =>
                                            "Đã nộp",
                                        VsattpCommitmentStatus.Confirmed =>
                                            "Đã xác nhận",
                                        _ => commitment.Status.ToString()
                                    };

                                Td(table.Cell().Row(tableRow).Column(1),
                                    bg, idx.ToString(), center: true);
                                Td(table.Cell().Row(tableRow).Column(2),
                                    bg,
                                    commitment.CommitmentDate.ToString(
                                        "dd/MM/yyyy"),
                                    center: true);
                                Td(table.Cell().Row(tableRow).Column(3),
                                    bg, commitStatusLabel, center: true);
                                Td(table.Cell().Row(tableRow).Column(4), bg,
                                    commitment.ConfirmedAt.HasValue
                                        ? commitment.ConfirmedAt.Value.ToString(
                                            "dd/MM/yyyy")
                                        : "—",
                                    center: true);
                                Td(table.Cell().Row(tableRow).Column(5),
                                    bg, commitment.Notes ?? "—");

                                tableRow++;
                                idx++;
                            }
                        });
                    }
                });

                // ── Footer ──────────────────────────────────────────────────
                page.Footer().Row(footerRow =>
                {
                    footerRow.RelativeItem().Text(
                            $"Ngày in: {now:dd/MM/yyyy HH:mm}")
                        .FontSize(9).Italic();
                    footerRow.RelativeItem().AlignRight().Text(text =>
                    {
                        text.Span("Trang ").FontSize(9);
                        text.CurrentPageNumber().FontSize(9);
                        text.Span(" / ").FontSize(9);
                        text.TotalPages().FontSize(9);
                    });
                });
            });
        });

        return doc.GeneratePdf();
    }
}
