using FoodSafe.AlertsAndTesting;
using FoodSafe.BusinessManagement;
using FoodSafe.Catalogs;
using FoodSafe.DataIntegration;
using FoodSafe.FileManagement;
using FoodSafe.FoodPoisoning;
using FoodSafe.Inspection;
using FoodSafe.Licensing;
using FoodSafe.Reporting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Volo.Abp;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Timing;

namespace FoodSafe.Data;

/// <summary>
/// Seeds realistic Vietnamese demo data for every module so all screens
/// have content. Runs only when configuration "Seed:EnableDemoData" is
/// "true". Idempotent: every entity uses a fixed GUID and is skipped when
/// it already exists.
/// </summary>
public sealed class DemoDataSeedContributor : IDataSeedContributor, ITransientDependency
{
    // --- Fixed GUIDs referencing E2E base data ---
    static readonly Guid ProvinceId = E2eTestDataSeedContributor.ProvinceQuangNinhId;
    static readonly Guid CommuneId = E2eTestDataSeedContributor.CommuneBachDangId;
    static readonly Guid OrgProvinceId = E2eTestDataSeedContributor.OrgProvinceId;
    static readonly Guid OrgCommuneId = E2eTestDataSeedContributor.OrgCommuneId;
    static readonly Guid ProvinceAdminId = E2eTestDataSeedContributor.UserProvinceAdminId;
    static readonly Guid CommuneStaffId = E2eTestDataSeedContributor.UserReadonlyId;

    // --- Fixed GUIDs seeded by MasterCatalogDataSeedContributor ---
    static readonly Guid CountryVietnamId = Guid.Parse("7e5ccdd0-7eab-4bd4-a10a-e8c39c301001");
    static readonly Guid DocTypeDecisionId = Guid.Parse("7e5ccdd0-7eab-4bd4-a10a-e8c39c303004");
    static readonly Guid DocTypeDispatchId = Guid.Parse("7e5ccdd0-7eab-4bd4-a10a-e8c39c303006");
    static readonly Guid DocTypePlanId = Guid.Parse("7e5ccdd0-7eab-4bd4-a10a-e8c39c303007");

    // --- Fixed demo catalog GUIDs (pattern de300000-0000-4000-8xxx-...) ---
    static readonly Guid TypeManufacturingId = DemoId(0x8001, 1);
    static readonly Guid TypeTradingId = DemoId(0x8001, 2);
    static readonly Guid TypeFoodServiceId = DemoId(0x8001, 3);
    static readonly Guid TypeCollectiveKitchenId = DemoId(0x8001, 4);
    static readonly Guid GroupSeafoodId = DemoId(0x8002, 1);
    static readonly Guid GroupCondimentId = DemoId(0x8002, 2);
    static readonly Guid GroupConfectioneryId = DemoId(0x8002, 3);
    static readonly Guid GroupMeatId = DemoId(0x8002, 4);
    static readonly Guid ClassHighRiskId = DemoId(0x8003, 1);
    static readonly Guid ClassMediumRiskId = DemoId(0x8003, 2);
    static readonly Guid ClassLowRiskId = DemoId(0x8003, 3);
    static readonly Guid AdTypeOnlinePressId = DemoId(0x8004, 1);
    static readonly Guid AdTypeSocialMediaId = DemoId(0x8004, 2);
    static readonly Guid DemoTestingCenterId = DemoId(0x8005, 1);
    static readonly Guid CountryChinaId = DemoId(0x8006, 1);
    static readonly Guid CountryJapanId = DemoId(0x8006, 2);
    static readonly Guid CountryKoreaId = DemoId(0x8006, 3);

    private readonly E2eTestDataSeedContributor _e2eSeeder;
    private readonly IServiceProvider _serviceProvider;
    private readonly IConfiguration _configuration;
    private readonly IClock _clock;
    private readonly IDataFilter _dataFilter;

    // Repositories are resolved lazily via the scoped service provider to
    // keep the constructor manageable — this contributor touches every module.
    public DemoDataSeedContributor(
        E2eTestDataSeedContributor e2eSeeder,
        IServiceProvider serviceProvider,
        IConfiguration configuration,
        IClock clock,
        IDataFilter dataFilter)
    {
        _e2eSeeder = e2eSeeder;
        _serviceProvider = serviceProvider;
        _configuration = configuration;
        _clock = clock;
        _dataFilter = dataFilter;
    }

    public async Task SeedAsync(DataSeedContext context)
    {
        if (!string.Equals(
                _configuration["Seed:EnableDemoData"], "true",
                StringComparison.OrdinalIgnoreCase))
            return;

        // Base areas and organizations must exist regardless of contributor
        // ordering; this call is idempotent. It must stay on the base-data
        // overload: demo content must not create the E2E fixture accounts,
        // which cannot be seeded outside Development without Seed:TestPassword.
        await _e2eSeeder.ForceSeedBaseDataAsync();

        var now = _clock.Now;

        // Existence checks must also see soft-deleted rows: an operator who
        // deleted a demo record must not get it re-created (and re-inserting
        // a soft-deleted id violates the primary key).
        using (_dataFilter.Disable<ISoftDelete>())
        {
            await SeedCatalogsAsync(now);
            await SeedBusinessesAsync(now);
            await SeedLicensingAsync(now);
            await SeedInspectionsAsync(now);
            await SeedFoodPoisoningAsync(now);
            await SeedReportsAsync(now);
            await SeedAlertsAndTestingAsync(now);
            await SeedDataIntegrationAsync(now);
        }
    }

    // ---------------------------------------------------------------
    // Catalogs (business types, product groups, classifications...)
    // ---------------------------------------------------------------

    private async Task SeedCatalogsAsync(DateTime now)
    {
        await InsertCatalogIfMissingAsync(TypeManufacturingId, "SXCB", () => BusinessType.Create(
            TypeManufacturingId, "SXCB", "Sản xuất, chế biến thực phẩm", null, 1, true));
        await InsertCatalogIfMissingAsync(TypeTradingId, "KDTP", () => BusinessType.Create(
            TypeTradingId, "KDTP", "Kinh doanh thực phẩm", null, 2, true));
        await InsertCatalogIfMissingAsync(TypeFoodServiceId, "DVAU", () => BusinessType.Create(
            TypeFoodServiceId, "DVAU", "Dịch vụ ăn uống", null, 3, true));
        await InsertCatalogIfMissingAsync(TypeCollectiveKitchenId, "BATT", () => BusinessType.Create(
            TypeCollectiveKitchenId, "BATT", "Bếp ăn tập thể", null, 4, true));

        await InsertCatalogIfMissingAsync(GroupSeafoodId, "THUYSAN", () => ProductGroup.Create(
            GroupSeafoodId, "THUYSAN", "Thủy sản và sản phẩm thủy sản", 1, null, null, 1, true));
        await InsertCatalogIfMissingAsync(GroupCondimentId, "GIAVI", () => ProductGroup.Create(
            GroupCondimentId, "GIAVI", "Nước mắm và gia vị", 1, null, null, 2, true));
        await InsertCatalogIfMissingAsync(GroupConfectioneryId, "BANHKEO", () => ProductGroup.Create(
            GroupConfectioneryId, "BANHKEO", "Bánh kẹo và đồ ngọt", 1, null, null, 3, true));
        await InsertCatalogIfMissingAsync(GroupMeatId, "THITCB", () => ProductGroup.Create(
            GroupMeatId, "THITCB", "Thịt và sản phẩm chế biến từ thịt", 1, null, null, 4, true));

        await InsertCatalogIfMissingAsync(ClassHighRiskId, "NC-CAO", () => BusinessClassification.Create(
            ClassHighRiskId, "NC-CAO", "Nguy cơ cao",
            "Cơ sở sản xuất, chế biến thực phẩm quy mô lớn hoặc phục vụ nhóm nhạy cảm",
            BusinessRiskLevel.High, null, 1, true));
        await InsertCatalogIfMissingAsync(ClassMediumRiskId, "NC-TB", () => BusinessClassification.Create(
            ClassMediumRiskId, "NC-TB", "Nguy cơ trung bình",
            "Cơ sở sản xuất nhỏ lẻ, dịch vụ ăn uống có địa điểm cố định",
            BusinessRiskLevel.Medium, null, 2, true));
        await InsertCatalogIfMissingAsync(ClassLowRiskId, "NC-THAP", () => BusinessClassification.Create(
            ClassLowRiskId, "NC-THAP", "Nguy cơ thấp",
            "Cơ sở kinh doanh thực phẩm bao gói sẵn",
            BusinessRiskLevel.Low, null, 3, true));

        await InsertIfMissingAsync(AdTypeOnlinePressId, () => AdvertisementType.Create(
            AdTypeOnlinePressId, "BAODIENTU", "Báo điện tử", null, 1, true));
        await InsertIfMissingAsync(AdTypeSocialMediaId, () => AdvertisementType.Create(
            AdTypeSocialMediaId, "MXH", "Mạng xã hội", null, 2, true));

        await InsertIfMissingAsync(DemoTestingCenterId, () => TestingCenter.Create(
            DemoTestingCenterId, "TTKN-QN",
            "Trung tâm Kiểm soát bệnh tật tỉnh Quảng Ninh - Khoa Xét nghiệm",
            "651 Lê Thánh Tông, phường Bạch Đằng, TP Hạ Long",
            ProvinceId, CommuneId,
            "Nguyễn Thị Lan", "0203 3825 447", "ttkn@quangninhcdc.vn",
            "VILAS 675", "Kiểm nghiệm vi sinh, hóa lý thực phẩm và nước",
            now.AddYears(2), null, 1, true));

        await InsertIfMissingAsync(DemoId(0x8005, 2), () => TestingService.Create(
            DemoId(0x8005, 2), DemoTestingCenterId, "KN-VS",
            "Kiểm nghiệm vi sinh vật (Coliforms, E.coli, Salmonella)",
            "Mẫu", "TCVN 4884-1:2015 / ISO 4833-1", 850_000m, 5, null, 1, true));
        await InsertIfMissingAsync(DemoId(0x8005, 3), () => TestingService.Create(
            DemoId(0x8005, 3), DemoTestingCenterId, "KN-HL",
            "Kiểm nghiệm hóa lý (pH, độ ẩm, hàm lượng protein)",
            "Mẫu", "TCVN 4594:1988", 620_000m, 4, null, 2, true));
        await InsertIfMissingAsync(DemoId(0x8005, 4), () => TestingService.Create(
            DemoId(0x8005, 4), DemoTestingCenterId, "KN-KLN",
            "Kiểm nghiệm kim loại nặng (Pb, Cd, Hg, As)",
            "Chỉ tiêu", "AOAC 999.10 / ICP-MS", 480_000m, 7, null, 3, true));
        await InsertIfMissingAsync(DemoId(0x8005, 5), () => TestingService.Create(
            DemoId(0x8005, 5), DemoTestingCenterId, "KN-BVTV",
            "Kiểm nghiệm dư lượng thuốc bảo vệ thực vật",
            "Mẫu", "EN 15662:2018 (QuEChERS)", 1_950_000m, 10, null, 4, true));

        // Countries and document types referenced below; ensured here so this
        // contributor does not depend on MasterCatalogDataSeedContributor order.
        await InsertIfMissingAsync(CountryVietnamId, () => Country.Create(
            CountryVietnamId, "VN", "Việt Nam", "VNM", "Vietnam"));
        await InsertIfMissingAsync(CountryChinaId, () => Country.Create(
            CountryChinaId, "CN", "Trung Quốc", "CHN", "China", 1));
        await InsertIfMissingAsync(CountryJapanId, () => Country.Create(
            CountryJapanId, "JP", "Nhật Bản", "JPN", "Japan", 2));
        await InsertIfMissingAsync(CountryKoreaId, () => Country.Create(
            CountryKoreaId, "KR", "Hàn Quốc", "KOR", "South Korea", 3));

        await InsertIfMissingAsync(DocTypeDecisionId, () => DocumentType.Create(
            DocTypeDecisionId, "QUYETDINH", "Quyết định", null, 4, true));
        await InsertIfMissingAsync(DocTypeDispatchId, () => DocumentType.Create(
            DocTypeDispatchId, "CONGVAN", "Công văn", null, 6, true));
        await InsertIfMissingAsync(DocTypePlanId, () => DocumentType.Create(
            DocTypePlanId, "KEHOACH", "Kế hoạch", null, 7, true));
    }

    // ---------------------------------------------------------------
    // Businesses, products, handlers, product-group links
    // ---------------------------------------------------------------

    private async Task SeedBusinessesAsync(DateTime now)
    {
        await SeedBusinessAsync(1, OrgProvinceId, "CS-QN-0001",
            "Công ty TNHH Thủy sản Hạ Long", TypeManufacturingId, ClassHighRiskId,
            "5700123456", "Nguyễn Văn Hải", "0203 3826 111",
            "Số 15 đường Trần Quốc Nghiễn", 20.9512, 107.0812,
            now.AddYears(-8), 120, true, false);
        await SeedBusinessAsync(2, OrgProvinceId, "CS-HL-0002",
            "Cơ sở sản xuất Chả mực Bà Tỵ", TypeManufacturingId, ClassMediumRiskId,
            "5700234567", "Phạm Thị Tỵ", "0912 345 678",
            "Số 82 phố Giếng Đồn", 20.9534, 107.0768,
            now.AddYears(-12), 12, true, false);
        await SeedBusinessAsync(3, OrgProvinceId, "CS-HL-0003",
            "Nhà hàng Hải sản Biển Xanh", TypeFoodServiceId, ClassMediumRiskId,
            "5700345678", "Trần Văn Long", "0987 654 321",
            "Số 6 đường Hạ Long, khu du lịch Bãi Cháy", 20.9581, 107.0453,
            now.AddYears(-5), 25, false, true);
        await SeedBusinessAsync(4, OrgProvinceId, "CS-QN-0004",
            "Công ty CP Nước mắm Cái Rồng", TypeManufacturingId, ClassHighRiskId,
            "5700456789", "Lê Thị Hương", "0203 3874 222",
            "Khu 3, thị trấn Cái Rồng", 21.0631, 107.4212,
            now.AddYears(-20), 45, true, false);
        await SeedBusinessAsync(5, OrgCommuneId, "CS-BD-0005",
            "Bếp ăn tập thể Trường Tiểu học Bạch Đằng", TypeCollectiveKitchenId,
            ClassHighRiskId, null, "Hoàng Thị Mai", "0203 3625 118",
            "Số 25 đường 25 Tháng 4", 20.9498, 107.0834,
            now.AddYears(-3), 8, false, true);
        await InsertIfMissingAsync(BusinessId(6), () =>
        {
            var business = Business.Create(
                BusinessId(6), OrgCommuneId, "CS-BD-0006",
                "Cửa hàng thực phẩm Minh Phương", TypeTradingId, ClassLowRiskId,
                null, "Vũ Minh Phương", null, "0905 112 233", null, null,
                "Số 144 đường Lê Thánh Tông", ProvinceId, CommuneId,
                20.9521, 107.0879, now.AddYears(-2), 3, null);
            business.SetStatus(BusinessStatus.Suspended,
                "Vi phạm điều kiện bảo quản thực phẩm, chờ khắc phục",
                now.AddDays(-20));
            return business;
        });
        await SeedBusinessAsync(7, OrgProvinceId, "CS-QN-0007",
            "Công ty TNHH Bánh kẹo Hồng Hạnh", TypeManufacturingId, ClassMediumRiskId,
            "5700567890", "Đỗ Hồng Hạnh", "0203 3835 666",
            "Lô B4, KCN Cái Lân", 20.9701, 107.0335,
            now.AddYears(-10), 60, true, false);
        await SeedBusinessAsync(8, OrgProvinceId, "CS-HL-0008",
            "Cơ sở Giò chả Ông Toàn", TypeManufacturingId, ClassMediumRiskId,
            null, "Bùi Văn Toàn", "0936 778 899",
            "Số 12 phố Cao Thắng", 20.9556, 107.0921,
            now.AddYears(-15), 6, true, false);

        await SeedBusinessProductGroupAsync(BusinessId(1), GroupSeafoodId);
        await SeedBusinessProductGroupAsync(BusinessId(1), GroupCondimentId);
        await SeedBusinessProductGroupAsync(BusinessId(2), GroupSeafoodId);
        await SeedBusinessProductGroupAsync(BusinessId(2), GroupMeatId);
        await SeedBusinessProductGroupAsync(BusinessId(3), GroupSeafoodId);
        await SeedBusinessProductGroupAsync(BusinessId(4), GroupCondimentId);
        await SeedBusinessProductGroupAsync(BusinessId(5), GroupMeatId);
        await SeedBusinessProductGroupAsync(BusinessId(6), GroupConfectioneryId);
        await SeedBusinessProductGroupAsync(BusinessId(7), GroupConfectioneryId);
        await SeedBusinessProductGroupAsync(BusinessId(8), GroupMeatId);

        await SeedProductAsync(11, BusinessId(1), OrgProvinceId,
            "Chả mực giã tay Hạ Long", GroupSeafoodId, "Hạ Long Xanh", "500g", 6);
        await SeedProductAsync(12, BusinessId(1), OrgProvinceId,
            "Ruốc tôm Hạ Long", GroupSeafoodId, "Hạ Long Xanh", "200g", 9);
        await SeedProductAsync(13, BusinessId(1), OrgProvinceId,
            "Nước mắm sá sùng", GroupCondimentId, "Hạ Long Xanh", "500ml", 24);
        await SeedProductAsync(21, BusinessId(2), OrgProvinceId,
            "Chả mực Bà Tỵ loại đặc biệt", GroupSeafoodId, "Bà Tỵ", "500g", 3);
        await SeedProductAsync(22, BusinessId(2), OrgProvinceId,
            "Chả cá thu", GroupSeafoodId, "Bà Tỵ", "300g", 3);
        await SeedProductAsync(31, BusinessId(3), OrgProvinceId,
            "Hải sản tươi sống chế biến tại chỗ", GroupSeafoodId, "Biển Xanh", null, null);
        await SeedProductAsync(32, BusinessId(3), OrgProvinceId,
            "Nước chấm hải sản đóng chai", GroupCondimentId, "Biển Xanh", "250ml", 6);
        await SeedProductAsync(41, BusinessId(4), OrgProvinceId,
            "Nước mắm Cái Rồng 40 độ đạm", GroupCondimentId, "Cái Rồng", "500ml", 36);
        await SeedProductAsync(42, BusinessId(4), OrgProvinceId,
            "Mắm tép Cái Rồng", GroupCondimentId, "Cái Rồng", "300g", 12);
        await SeedProductAsync(51, BusinessId(5), OrgCommuneId,
            "Suất ăn trưa học sinh", GroupMeatId, null, null, null);
        await SeedProductAsync(52, BusinessId(5), OrgCommuneId,
            "Suất ăn giáo viên", GroupMeatId, null, null, null);
        await SeedProductAsync(61, BusinessId(6), OrgCommuneId,
            "Bánh quy bơ nhập khẩu", GroupConfectioneryId, "Danisa", "454g", 12);
        await SeedProductAsync(62, BusinessId(6), OrgCommuneId,
            "Kẹo dẻo trái cây", GroupConfectioneryId, "Haribo", "160g", 18);
        await SeedProductAsync(71, BusinessId(7), OrgProvinceId,
            "Bánh trung thu Hồng Hạnh", GroupConfectioneryId, "Hồng Hạnh", "800g", 2);
        await SeedProductAsync(72, BusinessId(7), OrgProvinceId,
            "Kẹo lạc truyền thống", GroupConfectioneryId, "Hồng Hạnh", "250g", 8);
        await SeedProductAsync(81, BusinessId(8), OrgProvinceId,
            "Giò lụa", GroupMeatId, "Ông Toàn", "500g", 1);
        await SeedProductAsync(82, BusinessId(8), OrgProvinceId,
            "Chả quế", GroupMeatId, "Ông Toàn", "500g", 1);

        await SeedHandlerAsync(1, BusinessId(1), "Nguyễn Văn Hải",
            "Giám đốc", "GCN-TH-2026-0101", "GKSK-2026-0101", now);
        await SeedHandlerAsync(2, BusinessId(1), "Trịnh Thu Thảo",
            "Quản đốc xưởng chế biến", "GCN-TH-2026-0102", "GKSK-2026-0102", now);
        await SeedHandlerAsync(3, BusinessId(2), "Phạm Thị Tỵ",
            "Chủ cơ sở", "GCN-TH-2026-0201", "GKSK-2026-0201", now);
        await SeedHandlerAsync(4, BusinessId(4), "Lê Thị Hương",
            "Giám đốc sản xuất", "GCN-TH-2026-0401", "GKSK-2026-0401", now);
        await SeedHandlerAsync(5, BusinessId(5), "Hoàng Thị Mai",
            "Bếp trưởng", "GCN-TH-2026-0501", "GKSK-2026-0501", now);
    }

    // ---------------------------------------------------------------
    // Licensing (self declarations, registrations, certificates)
    // ---------------------------------------------------------------

    private async Task SeedLicensingAsync(DateTime now)
    {
        // Self declarations — active, expired and revoked
        await SeedSelfDeclarationAsync(1, BusinessId(1), OrgProvinceId, ProductId(11),
            "TCB-QN-2026-0015", "Chả mực giã tay Hạ Long",
            "Công ty TNHH Thủy sản Hạ Long", now.AddMonths(-9), null, now);
        await SeedSelfDeclarationAsync(2, BusinessId(1), OrgProvinceId, ProductId(13),
            "TCB-QN-2026-0016", "Nước mắm sá sùng",
            "Công ty TNHH Thủy sản Hạ Long", now.AddMonths(-7), now.AddMonths(17), now);
        await SeedSelfDeclarationAsync(3, BusinessId(2), OrgProvinceId, ProductId(21),
            "TCB-QN-2025-0102", "Chả mực Bà Tỵ loại đặc biệt",
            "Cơ sở sản xuất Chả mực Bà Tỵ", now.AddMonths(-11), now.AddMonths(-1), now);
        await SeedSelfDeclarationAsync(4, BusinessId(4), OrgProvinceId, ProductId(41),
            "TCB-QN-2026-0031", "Nước mắm Cái Rồng 40 độ đạm",
            "Công ty CP Nước mắm Cái Rồng", now.AddMonths(-6), null, now);
        await SeedSelfDeclarationAsync(5, BusinessId(7), OrgProvinceId, ProductId(71),
            "TCB-QN-2026-0048", "Bánh trung thu Hồng Hạnh",
            "Công ty TNHH Bánh kẹo Hồng Hạnh", now.AddMonths(-3), now.AddMonths(21), now);
        await InsertWithOwnerAsync(DemoId(0x8020, 6), OrgProvinceId, "self-declaration", () =>
        {
            var declaration = SelfDeclaration.Create(
                DemoId(0x8020, 6), BusinessId(8), OrgProvinceId, ProductId(81),
                "TCB-QN-2026-0052", now.AddMonths(-2), "Giò lụa",
                "Cơ sở Giò chả Ông Toàn", null, null, null, now);
            declaration.Revoke(
                "Sản phẩm không đạt chỉ tiêu kiểm nghiệm định kỳ",
                now.AddMonths(-1), ProvinceAdminId);
            return declaration;
        });

        // Product registrations
        await SeedProductRegistrationAsync(1, BusinessId(1), OrgProvinceId, ProductId(12),
            "DKSP-QN-2026-0042", "Ruốc tôm Hạ Long",
            now.AddMonths(-8), now.AddMonths(28), now, null);
        await SeedProductRegistrationAsync(2, BusinessId(4), OrgProvinceId, ProductId(41),
            "DKSP-QN-2025-0117", "Nước mắm Cái Rồng 40 độ đạm",
            now.AddMonths(-10), now.AddDays(-10), now, null);
        await SeedProductRegistrationAsync(3, BusinessId(6), OrgCommuneId, ProductId(61),
            "DKSP-QN-2026-0055", "Bánh quy bơ nhập khẩu",
            now.AddMonths(-5), now.AddMonths(31), now, null);
        await SeedProductRegistrationAsync(4, BusinessId(7), OrgProvinceId, ProductId(72),
            "DKSP-QN-2026-0063", "Kẹo lạc truyền thống",
            now.AddMonths(-4), null, now, null);
        await SeedProductRegistrationAsync(5, BusinessId(2), OrgProvinceId, ProductId(22),
            "DKSP-QN-2026-0021", "Chả cá thu",
            now.AddMonths(-6), now.AddMonths(30), now,
            "Hồ sơ công bố có dấu hiệu giả mạo kết quả kiểm nghiệm");

        // Eligibility certificates — valid, expiring soon, expired, revoked
        await SeedEligibilityCertificateAsync(1, BusinessId(1), OrgProvinceId,
            "GCN-ATTP-QN-2026-015", now.AddMonths(-10), now.AddMonths(26), now, null);
        await SeedEligibilityCertificateAsync(2, BusinessId(2), OrgProvinceId,
            "GCN-ATTP-HL-2025-078", now.AddMonths(-11), now.AddDays(25), now, null);
        await SeedEligibilityCertificateAsync(3, BusinessId(4), OrgProvinceId,
            "GCN-ATTP-QN-2026-023", now.AddMonths(-8), now.AddMonths(28), now, null);
        await SeedEligibilityCertificateAsync(4, BusinessId(5), OrgCommuneId,
            "GCN-ATTP-BD-2025-011", now.AddMonths(-12), now.AddDays(-20), now, null);
        await SeedEligibilityCertificateAsync(5, BusinessId(7), OrgProvinceId,
            "GCN-ATTP-QN-2026-031", now.AddMonths(-6), now.AddMonths(30), now, null);
        await SeedEligibilityCertificateAsync(6, BusinessId(8), OrgProvinceId,
            "GCN-ATTP-HL-2026-005", now.AddMonths(-9), now.AddMonths(27), now,
            "Cơ sở bị xử phạt vi phạm hành chính lần thứ hai về điều kiện vệ sinh");

        // CFS certificates
        await SeedCfsCertificateAsync(1, BusinessId(1), OrgProvinceId, ProductId(11),
            CountryJapanId, "CFS-QN-2026-008", now.AddMonths(-5), now.AddMonths(19), now);
        await SeedCfsCertificateAsync(2, BusinessId(1), OrgProvinceId, ProductId(12),
            CountryKoreaId, "CFS-QN-2026-011", now.AddMonths(-4), now.AddMonths(20), now);
        await SeedCfsCertificateAsync(3, BusinessId(4), OrgProvinceId, ProductId(41),
            CountryChinaId, "CFS-QN-2025-032", now.AddMonths(-11), now.AddMonths(-5), now);
        await SeedCfsCertificateAsync(4, BusinessId(7), OrgProvinceId, ProductId(71),
            CountryJapanId, "CFS-QN-2026-015", now.AddMonths(-2), now.AddMonths(22), now);

        // Export food certificates
        await SeedExportFoodCertificateAsync(1, BusinessId(1), OrgProvinceId, ProductId(11),
            CountryJapanId, "GXK-QN-2026-021", now.AddMonths(-3), now.AddMonths(9),
            "LOT-2026-04A", 2500m, "kg", now);
        await SeedExportFoodCertificateAsync(2, BusinessId(4), OrgProvinceId, ProductId(41),
            CountryChinaId, "GXK-QN-2025-089", now.AddMonths(-7), now.AddDays(-7),
            "LOT-2025-11C", 12000m, "lít", now);
        await SeedExportFoodCertificateAsync(3, BusinessId(7), OrgProvinceId, ProductId(71),
            CountryKoreaId, "GXK-QN-2026-034", now.AddMonths(-1), now.AddMonths(11),
            "LOT-2026-06B", 1800m, "hộp", now);
        await SeedExportFoodCertificateAsync(4, BusinessId(2), OrgProvinceId, ProductId(21),
            null, "GXK-QN-2026-027", now.AddMonths(-2), now.AddMonths(10),
            "LOT-2026-05A", 500m, "kg", now);

        // Advertisement registrations
        await SeedAdvertisementRegistrationAsync(1, BusinessId(1), OrgProvinceId,
            AdTypeOnlinePressId, "XNQC-QN-2026-005", now.AddMonths(-6), now.AddMonths(18),
            "Quảng cáo chả mực giã tay và ruốc tôm Hạ Long",
            "Báo điện tử Quảng Ninh", [ProductId(11), ProductId(12)], now, null);
        await SeedAdvertisementRegistrationAsync(2, BusinessId(4), OrgProvinceId,
            AdTypeSocialMediaId, "XNQC-QN-2025-041", now.AddMonths(-9), now.AddMonths(-3),
            "Quảng cáo nước mắm truyền thống Cái Rồng",
            "Facebook, Zalo", [ProductId(41)], now, null);
        await SeedAdvertisementRegistrationAsync(3, BusinessId(7), OrgProvinceId,
            AdTypeOnlinePressId, "XNQC-QN-2026-012", now.AddMonths(-2), now.AddMonths(22),
            "Quảng cáo bánh trung thu và kẹo lạc truyền thống Hồng Hạnh",
            "Báo điện tử Quảng Ninh, Đài PTTH Quảng Ninh", [ProductId(71), ProductId(72)], now, null);
        await SeedAdvertisementRegistrationAsync(4, BusinessId(2), OrgProvinceId,
            AdTypeSocialMediaId, "XNQC-HL-2026-003", now.AddMonths(-5), now.AddMonths(19),
            "Quảng cáo chả mực Bà Tỵ loại đặc biệt",
            "Facebook", [ProductId(21)], now,
            "Nội dung quảng cáo sai lệch so với hồ sơ đã đăng ký");
    }

    // ---------------------------------------------------------------
    // Inspection plans and results
    // ---------------------------------------------------------------

    private async Task SeedInspectionsAsync(DateTime now)
    {
        // Draft plan for the upcoming mid-autumn festival campaign
        await InsertIfMissingAsync(DemoId(0x8030, 1), () =>
        {
            var plan = InspectionPlan.Create(
                DemoId(0x8030, 1), OrgProvinceId, "KH-QN-2026-01",
                $"Kế hoạch kiểm tra ATTP dịp Tết Trung thu năm {now.Year}",
                InspectionPlanType.Periodic, now.Year,
                now.AddDays(20), now.AddDays(50),
                "Kiểm tra các cơ sở sản xuất, kinh doanh bánh kẹo trên địa bàn tỉnh",
                "Bảo đảm an toàn thực phẩm các sản phẩm phục vụ Tết Trung thu");
            plan.AddBusiness(DemoId(0x8031, 11), BusinessId(7), 1, now.AddDays(22), ProvinceAdminId, null);
            plan.AddBusiness(DemoId(0x8031, 12), BusinessId(6), 2, now.AddDays(30), ProvinceAdminId, null);
            plan.AddBusiness(DemoId(0x8031, 13), BusinessId(2), 3, now.AddDays(38), null, null);
            return plan;
        });

        // Approved plan already in progress
        await InsertIfMissingAsync(DemoId(0x8030, 2), () =>
        {
            var plan = InspectionPlan.Create(
                DemoId(0x8030, 2), OrgProvinceId, "KH-HL-2026-02",
                $"Kế hoạch thanh kiểm tra cơ sở dịch vụ ăn uống TP Hạ Long năm {now.Year}",
                InspectionPlanType.Annual, now.Year,
                now.AddDays(-90), now.AddDays(90),
                "Thanh kiểm tra định kỳ các cơ sở dịch vụ ăn uống, bếp ăn tập thể",
                "Phòng ngừa ngộ độc thực phẩm tại khu du lịch và trường học");
            plan.AddBusiness(DemoId(0x8031, 21), BusinessId(3), 1, now.AddDays(-60), ProvinceAdminId, null);
            plan.AddBusiness(DemoId(0x8031, 22), BusinessId(5), 2, now.AddDays(-10), ProvinceAdminId, null);
            plan.AddBusiness(DemoId(0x8031, 23), BusinessId(8), 3, now.AddDays(40), null, null);
            plan.Submit(ProvinceAdminId, now.AddDays(-80));
            plan.Approve(ProvinceAdminId, now.AddDays(-75));
            plan.MarkInProgress();
            plan.Items[0].MarkCompleted();
            plan.UpdateItemStatus(DemoId(0x8031, 22), InspectionPlanItemStatus.InProgress);
            return plan;
        });

        // Scheduled inspection with violations, finalized
        await InsertIfMissingAsync(DemoId(0x8032, 1), () =>
        {
            var result = InspectionResult.Create(
                DemoId(0x8032, 1), BusinessId(3), OrgProvinceId,
                DemoId(0x8030, 2), DemoId(0x8031, 21),
                now.AddDays(-60), InspectionType.Scheduled,
                "Trần Thị Huyện", "Trần Thị Huyện, Lê Văn Xem",
                InspectionOverallResult.Fail, true,
                "Vi phạm điều kiện vệ sinh khu chế biến và hồ sơ nhân sự",
                null, "68/QĐ-XPHC", now.AddDays(-55), true, now.AddDays(-20),
                "Yêu cầu khắc phục toàn bộ vi phạm trước đợt kiểm tra lại", null);
            result.AddViolation(DemoId(0x8033, 1), "VP-01",
                "Khu vực chế biến không bảo đảm vệ sinh, dụng cụ sống chín dùng chung",
                "Điểm a Khoản 1 Điều 15 Nghị định 115/2018/NĐ-CP", 4_000_000m,
                "Bố trí lại khu chế biến, tách riêng dụng cụ sống chín", now.AddDays(-30));
            result.AddViolation(DemoId(0x8033, 2), "VP-02",
                "Nhân viên trực tiếp chế biến không có giấy khám sức khỏe định kỳ",
                "Khoản 2 Điều 9 Nghị định 115/2018/NĐ-CP", 2_500_000m,
                "Tổ chức khám sức khỏe cho toàn bộ nhân viên", now.AddDays(15));
            result.MarkViolationRemedied(DemoId(0x8033, 1), now.AddDays(-25),
                "Đã cải tạo khu chế biến, nghiệm thu đạt yêu cầu");
            result.SetInspectors([(ProvinceAdminId, true), (CommuneStaffId, false)]);
            result.SetFollowUpResult(FollowUpResult.Passed);
            result.Finalize(ProvinceAdminId, now.AddDays(-15));
            return result;
        });

        // Unscheduled inspection, passed, finalized
        await InsertIfMissingAsync(DemoId(0x8032, 2), () =>
        {
            var result = InspectionResult.Create(
                DemoId(0x8032, 2), BusinessId(1), OrgProvinceId, null, null,
                now.AddDays(-100), InspectionType.Unscheduled,
                "Nguyễn Văn Tỉnh", "Nguyễn Văn Tỉnh, Trần Thị Huyện",
                InspectionOverallResult.Pass, false, null, null, null, null,
                false, null,
                "Duy trì tốt điều kiện sản xuất, khuyến khích áp dụng HACCP", null);
            result.SetInspectors([(ProvinceAdminId, true), (CommuneStaffId, false)]);
            result.Finalize(ProvinceAdminId, now.AddDays(-95));
            return result;
        });

        // Recent inspection, conditional pass, not yet finalized
        await InsertIfMissingAsync(DemoId(0x8032, 3), () =>
        {
            var result = InspectionResult.Create(
                DemoId(0x8032, 3), BusinessId(5), OrgCommuneId, null, null,
                now.AddDays(-30), InspectionType.Unscheduled,
                "Lê Văn Xem", "Lê Văn Xem",
                InspectionOverallResult.ConditionalPass, false, null, null,
                null, null, true, now.AddDays(30),
                "Bổ sung lưu mẫu thức ăn 24 giờ đúng quy định", null);
            result.SetInspectors([(CommuneStaffId, true)]);
            return result;
        });
    }

    // ---------------------------------------------------------------
    // Food poisoning incident and cases
    // ---------------------------------------------------------------

    private async Task SeedFoodPoisoningAsync(DateTime now)
    {
        var incidentId = DemoId(0x8040, 1);
        await InsertIfMissingAsync(incidentId, () =>
        {
            var incident = FoodPoisoningIncident.Create(
                incidentId, OrgProvinceId, "VNĐ-QN-2026-001",
                now.AddDays(-45), now.AddDays(-43),
                "Vụ ngộ độc tập thể sau tiệc cưới tại nhà hàng hải sản");
            incident.SetLocation(
                "Nhà hàng Hải sản Biển Xanh, khu du lịch Bãi Cháy",
                CommuneId, ProvinceId, 20.9581, 107.0453);
            incident.SetStatistics(120, 32, 9, 1);
            incident.SetFoodInfo("Hàu sống, tôm hấp", "Nhà hàng Hải sản Biển Xanh",
                "Tiệc cưới");
            incident.SetCauseInfo(CauseAssessment.Confirmed,
                "Vi khuẩn trong hải sản sống", "Vibrio parahaemolyticus");
            incident.SetInvestigationInfo(
                "Đoàn điều tra liên ngành Chi cục ATVSTP và Phòng Y tế TP Hạ Long",
                "Đình chỉ hoạt động nhà hàng, thu hồi thực phẩm nghi ngờ, lấy mẫu kiểm nghiệm",
                "Tăng cường kiểm tra nguồn gốc hải sản sống tại khu du lịch");
            incident.Submit(ProvinceAdminId, now.AddDays(-44));
            incident.Verify(ProvinceAdminId, now.AddDays(-43));
            incident.Conclude(ProvinceAdminId, now.AddDays(-30),
                "Nguyên nhân do hàu sống nhiễm Vibrio parahaemolyticus; " +
                "nhà hàng đã bị xử phạt và buộc khắc phục điều kiện bảo quản");
            return incident;
        });

        await SeedPoisoningCaseAsync(1, OrgProvinceId, "CA-QN-2026-001", now.AddDays(-44),
            now.AddDays(-45), incidentId, "Nguyễn Văn Bình", 34, VictimGender.Male,
            "Hàu sống", "Đau bụng dữ dội, tiêu chảy cấp, sốt cao",
            "Bệnh viện Đa khoa tỉnh Quảng Ninh", TreatmentResult.Hospitalized,
            PoisoningCaseStatus.Verified, now);
        await SeedPoisoningCaseAsync(2, OrgProvinceId, "CA-QN-2026-002", now.AddDays(-44),
            now.AddDays(-45), incidentId, "Trần Thị Thu", 29, VictimGender.Female,
            "Hàu sống, tôm hấp", "Buồn nôn, tiêu chảy, mất nước nhẹ",
            "Trạm Y tế Phường Bạch Đằng", TreatmentResult.Recovered,
            PoisoningCaseStatus.Verified, now);
        await SeedPoisoningCaseAsync(3, OrgProvinceId, "CA-QN-2026-003", now.AddDays(-44),
            now.AddDays(-45), incidentId, "Phạm Văn Cường", 68, VictimGender.Male,
            "Hàu sống", "Tiêu chảy cấp, sốc nhiễm khuẩn trên nền bệnh gan mạn",
            "Bệnh viện Đa khoa tỉnh Quảng Ninh", TreatmentResult.Deceased,
            PoisoningCaseStatus.Verified, now);
        await SeedPoisoningCaseAsync(4, OrgCommuneId, "CA-BD-2026-004", now.AddDays(-15),
            now.AddDays(-15), null, "Lê Gia Bảo", 8, VictimGender.Male,
            "Sữa chua không rõ nguồn gốc bán trước cổng trường",
            "Đau bụng, nôn nhiều lần",
            "Trạm Y tế Phường Bạch Đằng", TreatmentResult.Recovered,
            PoisoningCaseStatus.Reported, now);
        await SeedPoisoningCaseAsync(5, OrgProvinceId, "CA-QN-2026-005", now.AddDays(-5),
            now.AddDays(-6), null, "Đặng Văn Sơn", 41, VictimGender.Male,
            "Rượu ngâm rễ cây không rõ nguồn gốc", "Đau đầu, mờ mắt, lơ mơ",
            "Bệnh viện Đa khoa tỉnh Quảng Ninh", TreatmentResult.Hospitalized,
            PoisoningCaseStatus.Draft, now);
    }

    // ---------------------------------------------------------------
    // Reports (NĐTP, ATTP work reports, action month)
    // ---------------------------------------------------------------

    private async Task SeedReportsAsync(DateTime now)
    {
        var lastMonth = now.AddMonths(-1);
        await InsertIfMissingAsync(DemoId(0x8050, 1), () =>
        {
            var report = NdtpReport.Create(
                DemoId(0x8050, 1), OrgProvinceId, lastMonth.Year, lastMonth.Month);
            report.UpdateStats(3, 3, 2, 1, 1, 32, 9, 1);
            report.UpdateNarrative(
                "Tuyên truyền phòng chống ngộ độc hải sản sống tại khu du lịch; " +
                "giám sát bếp ăn trường học đầu năm học",
                "Thói quen ăn hải sản sống của khách du lịch; thức ăn đường phố trước cổng trường",
                "Đề nghị tăng cường kiểm tra đột xuất các nhà hàng hải sản trong mùa du lịch");
            report.Submit(ProvinceAdminId, now.AddDays(-12));
            report.Verify(ProvinceAdminId, now.AddDays(-10));
            return report;
        });
        await InsertIfMissingAsync(DemoId(0x8050, 2), () =>
        {
            var report = NdtpReport.Create(
                DemoId(0x8050, 2), OrgCommuneId, now.Year, now.Month);
            report.UpdateStats(1, 1, 0, 0, 0, 0, 0, 0);
            report.UpdateNarrative(
                "Giám sát ca ngộ độc lẻ tại trường tiểu học, truy xuất nguồn gốc thực phẩm",
                "Hàng rong không rõ nguồn gốc quanh trường học", null);
            return report;
        });

        await InsertIfMissingAsync(DemoId(0x8051, 1), () =>
        {
            var report = AtpWorkReport.Create(
                DemoId(0x8051, 1), OrgProvinceId,
                ReportPeriodType.FullYear, now.Year - 1, null);
            report.UpdateBusinessStats(1250, 86, 34, 890);
            report.UpdateLicensingStats(45, 210, 28, 96, 12, 18);
            report.UpdateInspectionStats(24, 640, 72, 58, 486_000_000m);
            report.UpdatePoisoningStats(18, 2, 74, 1);
            report.UpdateCommunicationStats(36, 2400, 52, 15);
            report.UpdateNarrative(
                $"Công tác bảo đảm ATTP năm {now.Year - 1} được triển khai đồng bộ trên toàn tỉnh",
                "Hoàn thành 100% kế hoạch thanh kiểm tra; không để xảy ra vụ ngộ độc lớn",
                "Nhân lực tuyến xã còn mỏng; thiết bị kiểm nghiệm nhanh còn thiếu",
                "Kiến nghị bổ sung biên chế và kinh phí mua test nhanh",
                "Tập trung số hóa dữ liệu cơ sở và tăng kiểm tra đột xuất");
            report.Submit(ProvinceAdminId, now.AddMonths(-6));
            report.Verify(ProvinceAdminId, now.AddMonths(-6).AddDays(3));
            report.Complete(ProvinceAdminId, now.AddMonths(-5));
            return report;
        });
        await InsertIfMissingAsync(DemoId(0x8051, 2), () =>
        {
            var report = AtpWorkReport.Create(
                DemoId(0x8051, 2), OrgProvinceId,
                ReportPeriodType.HalfYear, now.Year, 1);
            report.UpdateBusinessStats(320, 22, 8, 240);
            report.UpdateLicensingStats(12, 58, 6, 24, 2, 4);
            report.UpdateInspectionStats(6, 145, 18, 14, 112_000_000m);
            report.UpdatePoisoningStats(4, 1, 35, 1);
            report.UpdateCommunicationStats(10, 650, 14, 4);
            report.UpdateNarrative(
                $"Báo cáo công tác ATTP 6 tháng đầu năm {now.Year} của TP Hạ Long",
                "Xử lý kịp thời vụ ngộ độc tập thể tại khu du lịch Bãi Cháy",
                "Một số cơ sở nhỏ lẻ chưa chấp hành khám sức khỏe định kỳ", null, null);
            report.Submit(ProvinceAdminId, now.AddDays(-20));
            return report;
        });

        await InsertIfMissingAsync(DemoId(0x8052, 1), () =>
        {
            var report = ActionMonthReport.Create(
                DemoId(0x8052, 1), OrgProvinceId, now.Year);
            report.UpdateHeader(
                $"Tháng hành động vì an toàn thực phẩm năm {now.Year}",
                $"15/4/{now.Year} - 15/5/{now.Year}");
            report.UpdateCommunicationStats(28, 12, 45, 3200, 1500, 8000);
            report.UpdateInspectionStats(210, 26, 19, 156_000_000m);
            report.UpdateOtherStats(34);
            report.UpdateNarrative(
                "Tổ chức lễ phát động cấp tỉnh, ra quân kiểm tra liên ngành 3 cấp",
                "Một số địa bàn vùng sâu triển khai tuyên truyền còn chậm",
                "Cần phối hợp sớm hơn với ngành giáo dục về bếp ăn trường học",
                "Duy trì các đoàn kiểm tra liên ngành sau tháng hành động");
            report.Submit(ProvinceAdminId, now.AddMonths(-2));
            report.Verify(ProvinceAdminId, now.AddMonths(-2).AddDays(5));
            return report;
        });
    }

    // ---------------------------------------------------------------
    // Alerts, news, documents, risk analyses, testing results
    // ---------------------------------------------------------------

    private async Task SeedAlertsAndTestingAsync(DateTime now)
    {
        await InsertIfMissingAsync(DemoId(0x8060, 1), () =>
        {
            var alert = AtpAlert.Create(
                DemoId(0x8060, 1), OrgProvinceId,
                "Cảnh báo bánh trung thu chứa phẩm màu ngoài danh mục cho phép",
                "Qua kiểm nghiệm mẫu giám sát, phát hiện một số lô bánh trung thu " +
                "trôi nổi trên thị trường sử dụng phẩm màu Rhodamine B. Đề nghị người " +
                "dân chỉ mua sản phẩm có nguồn gốc rõ ràng, còn hạn sử dụng.",
                AlertCategory.Chemical, AlertSeverity.High, AlertSource.Internal,
                alertNumber: "CB-QN-2026-001",
                affectedArea: "TP Hạ Long và các địa bàn lân cận",
                affectedProducts: "Bánh trung thu không rõ nguồn gốc");
            alert.Publish(ProvinceAdminId, now.AddMonths(-3));
            return alert;
        });
        await InsertIfMissingAsync(DemoId(0x8060, 2), () =>
        {
            var alert = AtpAlert.Create(
                DemoId(0x8060, 2), OrgProvinceId,
                "Cảnh báo ngộ độc methanol từ rượu ngâm không rõ nguồn gốc",
                "Đã ghi nhận trường hợp ngộ độc nặng sau khi sử dụng rượu ngâm rễ cây " +
                "không rõ nguồn gốc. Tuyệt đối không sử dụng rượu không có nhãn mác, " +
                "không rõ xuất xứ.",
                AlertCategory.Chemical, AlertSeverity.Critical, AlertSource.Internal,
                alertNumber: "CB-QN-2026-002",
                affectedArea: "Toàn tỉnh Quảng Ninh",
                affectedProducts: "Rượu ngâm, rượu thủ công không nhãn mác");
            alert.Publish(ProvinceAdminId, now.AddDays(-20));
            return alert;
        });
        await InsertIfMissingAsync(DemoId(0x8060, 3), () => AtpAlert.Create(
            DemoId(0x8060, 3), OrgCommuneId,
            "Phản ánh cơ sở kinh doanh thực phẩm không rõ nguồn gốc",
            "Người dân phản ánh một cửa hàng trên địa bàn phường bày bán bánh kẹo " +
            "nhập lậu không nhãn phụ tiếng Việt. Đang xác minh thông tin.",
            AlertCategory.FoodSafety, AlertSeverity.Medium, AlertSource.PublicReport,
            businessId: BusinessId(6),
            reporterName: "Người dân phường Bạch Đằng",
            reporterPhone: "0904 555 777"));

        await InsertIfMissingAsync(DemoId(0x8061, 1), () =>
        {
            var news = AtpNews.Create(
                DemoId(0x8061, 1), OrgProvinceId,
                "Tăng cường kiểm tra an toàn thực phẩm dịp Tết Trung thu",
                "Chi cục An toàn vệ sinh thực phẩm tỉnh Quảng Ninh triển khai đợt cao " +
                "điểm kiểm tra các cơ sở sản xuất, kinh doanh bánh trung thu trên toàn " +
                "tỉnh, tập trung vào nguồn gốc nguyên liệu và phụ gia thực phẩm.",
                summary: "Đợt cao điểm kiểm tra bánh trung thu trên toàn tỉnh",
                category: "Hoạt động chuyên môn",
                tags: "trung thu, kiểm tra, bánh kẹo",
                isFeatured: true);
            news.LinkAlert(DemoId(0x8065, 1), DemoId(0x8060, 1));
            news.Publish(ProvinceAdminId, now.AddDays(-75));
            return news;
        });
        await InsertIfMissingAsync(DemoId(0x8061, 2), () =>
        {
            var news = AtpNews.Create(
                DemoId(0x8061, 2), OrgProvinceId,
                $"Kết quả Tháng hành động vì an toàn thực phẩm năm {now.Year}",
                "Toàn tỉnh đã kiểm tra 210 cơ sở, xử phạt 19 trường hợp vi phạm với " +
                "tổng số tiền 156 triệu đồng; tổ chức 45 buổi tuyên truyền với hơn " +
                "3.200 lượt người tham dự.",
                summary: "210 cơ sở được kiểm tra trong tháng hành động",
                category: "Tin hoạt động");
            news.Publish(ProvinceAdminId, now.AddMonths(-1));
            return news;
        });
        await InsertIfMissingAsync(DemoId(0x8061, 3), () =>
        {
            var news = AtpNews.Create(
                DemoId(0x8061, 3), OrgProvinceId,
                "Khuyến cáo phòng chống ngộ độc thực phẩm mùa nắng nóng",
                "Thời tiết nắng nóng làm thực phẩm dễ ôi thiu. Người dân cần ăn chín " +
                "uống sôi, bảo quản thực phẩm đúng nhiệt độ, không sử dụng hải sản " +
                "sống và rượu không rõ nguồn gốc.",
                summary: "Các biện pháp phòng ngộ độc thực phẩm trong mùa hè",
                category: "Khuyến cáo",
                tags: "mùa hè, ngộ độc, khuyến cáo",
                isFeatured: true);
            news.LinkAlert(DemoId(0x8065, 2), DemoId(0x8060, 2));
            news.Publish(ProvinceAdminId, now.AddDays(-15));
            return news;
        });
        await InsertIfMissingAsync(DemoId(0x8061, 4), () => AtpNews.CreateCitizenSubmission(
            DemoId(0x8061, 4), OrgCommuneId,
            "Phản ánh quán ăn vỉa hè không bảo đảm vệ sinh",
            "Khu vực chợ đêm có nhiều quán ăn vỉa hè bày bán thức ăn không che đậy, " +
            "gần cống thoát nước. Đề nghị cơ quan chức năng kiểm tra.",
            "Trần Văn Dân", "0909 123 456"));

        await InsertIfMissingAsync(DemoId(0x8062, 1), () =>
        {
            var document = AdministrativeDocument.Create(
                DemoId(0x8062, 1), OrgProvinceId, DocTypeDecisionId,
                "68/QĐ-ATTP",
                "Quyết định thành lập đoàn kiểm tra liên ngành ATTP dịp Tết Trung thu",
                now.AddMonths(-3), "Chi cục An toàn vệ sinh thực phẩm tỉnh Quảng Ninh",
                now.AddMonths(-3), null,
                "Thành lập 3 đoàn kiểm tra liên ngành cấp tỉnh");
            document.SetPublic(true);
            return document;
        });
        await InsertIfMissingAsync(DemoId(0x8062, 2), () =>
        {
            var document = AdministrativeDocument.Create(
                DemoId(0x8062, 2), OrgProvinceId, DocTypePlanId,
                "12/KH-ATTP",
                $"Kế hoạch triển khai Tháng hành động vì an toàn thực phẩm năm {now.Year}",
                now.AddMonths(-4), "UBND tỉnh Quảng Ninh",
                now.AddMonths(-4), null,
                "Phân công nhiệm vụ các sở, ngành, địa phương trong tháng hành động");
            document.SetPublic(true);
            return document;
        });
        await InsertIfMissingAsync(DemoId(0x8062, 3), () => AdministrativeDocument.Create(
            DemoId(0x8062, 3), OrgProvinceId, DocTypeDispatchId,
            "245/CV-PYT",
            "Công văn tăng cường phòng chống ngộ độc thực phẩm mùa nắng nóng",
            now.AddMonths(-1), "Phòng Y tế TP Hạ Long",
            now.AddMonths(-1), null,
            "Yêu cầu các trạm y tế giám sát chặt bếp ăn tập thể và thức ăn đường phố"));

        await InsertIfMissingAsync(DemoId(0x8063, 1), () =>
        {
            var analysis = RiskAnalysis.Create(
                DemoId(0x8063, 1), OrgProvinceId,
                "Phân tích nguy cơ ô nhiễm vi sinh trong hải sản tươi sống mùa hè",
                "Kết quả giám sát 40 mẫu hải sản sống tại các nhà hàng khu du lịch cho " +
                "thấy 15% mẫu nhiễm Vibrio parahaemolyticus vượt ngưỡng. Nguy cơ ngộ độc " +
                "tăng cao trong các tháng nắng nóng.",
                AlertCategory.Biological, RiskLevel.High,
                productGroupIds: null,
                relatedProducts: "Hàu sống, tôm, mực tươi sống",
                evidence: "Kết quả kiểm nghiệm giám sát quý gần nhất; vụ ngộ độc VNĐ-QN-2026-001",
                recommendations: "Khuyến cáo nhà hàng chỉ phục vụ hải sản nấu chín trong các đợt nắng nóng");
            analysis.Publish(ProvinceAdminId, now.AddDays(-25));
            return analysis;
        });
        await InsertIfMissingAsync(DemoId(0x8063, 2), () => RiskAnalysis.Create(
            DemoId(0x8063, 2), OrgProvinceId,
            "Đánh giá nguy cơ tồn dư kim loại nặng trong nhuyễn thể hai mảnh vỏ",
            "Đang tổng hợp kết quả quan trắc vùng nuôi nhuyễn thể tại Vân Đồn để đánh " +
            "giá tồn dư cadimi và chì trong ngao, hàu thương phẩm.",
            AlertCategory.Chemical, RiskLevel.Medium,
            productGroupIds: null,
            relatedProducts: "Ngao, hàu, tu hài nuôi tại Vân Đồn"));

        await InsertIfMissingAsync(DemoId(0x8064, 1), () => TestingResult.Create(
            DemoId(0x8064, 1), OrgProvinceId, "MAU-2026-0152",
            "Mẫu chả mực", DemoTestingCenterId, now.AddDays(-70),
            TestingResultOutcome.Fail,
            description: "Mẫu giám sát định kỳ lấy tại cơ sở sản xuất",
            businessId: BusinessId(2), productId: ProductId(21),
            submissionDate: now.AddDays(-69), resultDate: now.AddDays(-60),
            failedCriteria: "Hàn the (borax) vượt ngưỡng cho phép"));
        await InsertIfMissingAsync(DemoId(0x8064, 2), () =>
        {
            var testingResult = TestingResult.Create(
                DemoId(0x8064, 2), OrgProvinceId, "MAU-2026-0153",
                "Mẫu hàu sống", DemoTestingCenterId, now.AddDays(-60),
                TestingResultOutcome.Fail,
                description: "Mẫu lấy trong đợt thanh kiểm tra nhà hàng hải sản",
                businessId: BusinessId(3),
                submissionDate: now.AddDays(-59), resultDate: now.AddDays(-50),
                failedCriteria: "Vibrio parahaemolyticus dương tính",
                inspectionResultId: DemoId(0x8032, 1));
            testingResult.SetPublic(true);
            return testingResult;
        });
        await InsertIfMissingAsync(DemoId(0x8064, 3), () =>
        {
            var testingResult = TestingResult.Create(
                DemoId(0x8064, 3), OrgProvinceId, "MAU-2026-0201",
                "Mẫu nước mắm 40 độ đạm", DemoTestingCenterId, now.AddDays(-40),
                TestingResultOutcome.Pass,
                description: "Kiểm nghiệm định kỳ phục vụ công bố sản phẩm",
                businessId: BusinessId(4), productId: ProductId(41),
                submissionDate: now.AddDays(-39), resultDate: now.AddDays(-30),
                certificateNumber: "KQKN-QN-2026-0201");
            testingResult.SetPublic(true);
            return testingResult;
        });
        await InsertIfMissingAsync(DemoId(0x8064, 4), () => TestingResult.Create(
            DemoId(0x8064, 4), OrgProvinceId, "MAU-2026-0230",
            "Mẫu bánh trung thu", DemoTestingCenterId, now.AddDays(-20),
            TestingResultOutcome.Pass,
            description: "Mẫu giám sát thị trường trước Tết Trung thu",
            businessId: BusinessId(7), productId: ProductId(71),
            submissionDate: now.AddDays(-19), resultDate: now.AddDays(-10),
            certificateNumber: "KQKN-QN-2026-0230"));
    }

    // ---------------------------------------------------------------
    // Data integration (API endpoints and call logs)
    // ---------------------------------------------------------------

    private async Task SeedDataIntegrationAsync(DateTime now)
    {
        await InsertIfMissingAsync(DemoId(0x8070, 1), () => ApiEndpoint.Create(
            DemoId(0x8070, 1), OrgProvinceId,
            "Đồng bộ dữ liệu cơ sở đủ điều kiện ATTP",
            "https://api.vfa.gov.vn/food-safety/businesses", "POST",
            "Cục An toàn thực phẩm - Bộ Y tế", ApiAuthType.BearerToken,
            "Gửi danh sách cơ sở được cấp giấy chứng nhận đủ điều kiện ATTP theo quy định liên thông"));
        await InsertIfMissingAsync(DemoId(0x8070, 2), () => ApiEndpoint.Create(
            DemoId(0x8070, 2), OrgProvinceId,
            "Tiếp nhận cảnh báo an toàn thực phẩm liên ngành",
            "https://api.congthuong.quangninh.gov.vn/alerts", "GET",
            "Sở Công Thương Quảng Ninh", ApiAuthType.ApiKey,
            "Nhận cảnh báo sản phẩm vi phạm do ngành công thương phát hiện"));

        await SeedApiCallLogAsync(1, ApiCallDirection.Outbound,
            "Cục An toàn thực phẩm - Bộ Y tế",
            "https://api.vfa.gov.vn/food-safety/businesses", "POST",
            now.AddDays(-30), 842, true, 200, SharedDataType.Business, null);
        await SeedApiCallLogAsync(2, ApiCallDirection.Outbound,
            "Cục An toàn thực phẩm - Bộ Y tế",
            "https://api.vfa.gov.vn/food-safety/businesses", "POST",
            now.AddDays(-14), 30015, false, 504,
            SharedDataType.Business, "Hết thời gian chờ phản hồi từ hệ thống Bộ Y tế");
        await SeedApiCallLogAsync(3, ApiCallDirection.Outbound,
            "Cục An toàn thực phẩm - Bộ Y tế",
            "https://api.vfa.gov.vn/food-safety/poisoning-incidents", "POST",
            now.AddDays(-28), 655, true, 200, SharedDataType.FoodPoisoning, null);
        await SeedApiCallLogAsync(4, ApiCallDirection.Inbound,
            "Sở Công Thương Quảng Ninh",
            "https://api.congthuong.quangninh.gov.vn/alerts", "GET",
            now.AddDays(-7), 312, true, 200, SharedDataType.Alert, null);
        await SeedApiCallLogAsync(5, ApiCallDirection.Inbound,
            "Sở Nông nghiệp và PTNT Quảng Ninh",
            "https://api.nongnghiep.quangninh.gov.vn/inspection-results", "GET",
            now.AddDays(-3), 428, true, 200, SharedDataType.InspectionResult, null);
        await SeedApiCallLogAsync(6, ApiCallDirection.Outbound,
            "Cục An toàn thực phẩm - Bộ Y tế",
            "https://api.vfa.gov.vn/food-safety/licenses", "POST",
            now.AddDays(-1), 528, true, 200, SharedDataType.License, null);
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------

    private static Guid DemoId(int block, int seq) =>
        Guid.Parse($"de300000-0000-4000-{block:x4}-{seq:d12}");

    private static Guid BusinessId(int seq) => DemoId(0x8010, seq);

    private static Guid ProductId(int seq) => DemoId(0x8011, seq);

    private IRepository<TEntity, Guid> Repository<TEntity>()
        where TEntity : class, IEntity<Guid> =>
        _serviceProvider.GetRequiredService<IRepository<TEntity, Guid>>();

    private async Task InsertIfMissingAsync<TEntity>(Guid id, Func<TEntity> factory)
        where TEntity : class, IEntity<Guid>
    {
        var repository = Repository<TEntity>();
        if (await repository.AnyAsync(x => x.Id == id))
            return;
        await repository.InsertAsync(factory(), autoSave: true);
    }

    /// <summary>
    /// Reference catalogs carry a UNIQUE Code, and
    /// <see cref="ReferenceCatalogDataSeedContributor"/> seeds the regulatory
    /// taxonomy using its own identifiers. ABP does not guarantee contributor
    /// order, so an id-only existence check would try to insert a code that is
    /// already present and abort the whole migration on the unique index.
    /// Checking the code as well makes whichever contributor runs first win.
    /// </summary>
    private async Task InsertCatalogIfMissingAsync<TEntity>(
        Guid id, string code, Func<TEntity> factory)
        where TEntity : MasterCatalog
    {
        var repository = Repository<TEntity>();
        if (await repository.AnyAsync(x => x.Id == id || x.Code == code))
            return;
        await repository.InsertAsync(factory(), autoSave: true);
    }

    // Some tables (products, self_declarations, product_registrations,
    // eligibility_certificates, cfs_certificates, advertisement_registrations)
    // have an FK on (id, organization_id) -> document_owners. Mirror the
    // AppService create flows: insert the owner row first, same id and
    // organization, with the exact OwnerType constant used by the AppService.
    private async Task InsertWithOwnerAsync<TEntity>(
        Guid id, Guid organizationId, string ownerType, Func<TEntity> factory)
        where TEntity : class, IEntity<Guid>
    {
        var owners = Repository<DocumentOwner>();
        if (!await owners.AnyAsync(x => x.Id == id))
            await owners.InsertAsync(
                DocumentOwner.Create(id, organizationId, ownerType, _clock.Now),
                autoSave: true);
        await InsertIfMissingAsync(id, factory);
    }

    private Task SeedBusinessAsync(
        int seq, Guid organizationId, string code, string name,
        Guid businessTypeId, Guid classificationId, string? taxCode,
        string representativeName, string contactPhone, string street,
        double latitude, double longitude, DateTime establishedDate,
        int employeeCount, bool hasEligibilityCertificate, bool hasVsattpCommitment)
    {
        var id = BusinessId(seq);
        return InsertIfMissingAsync(id, () =>
        {
            var business = Business.Create(
                id, organizationId, code, name, businessTypeId, classificationId,
                taxCode, representativeName, null, contactPhone, null, null,
                street, ProvinceId, CommuneId, latitude, longitude,
                establishedDate, employeeCount, null);
            business.SetCertificateFlags(hasEligibilityCertificate, hasVsattpCommitment);
            return business;
        });
    }

    private async Task SeedBusinessProductGroupAsync(Guid businessId, Guid productGroupId)
    {
        var repository = _serviceProvider
            .GetRequiredService<IRepository<BusinessProductGroup>>();
        if (await repository.AnyAsync(
                x => x.BusinessId == businessId && x.ProductGroupId == productGroupId))
            return;
        await repository.InsertAsync(
            new BusinessProductGroup(businessId, productGroupId), autoSave: true);
    }

    private Task SeedProductAsync(
        int seq, Guid businessId, Guid organizationId, string name,
        Guid productGroupId, string? brandName, string? netWeight, int? expiryMonths)
    {
        var id = ProductId(seq);
        return InsertWithOwnerAsync(id, organizationId, "product", () => Product.Create(
            id, businessId, organizationId, $"SP-{seq:d4}", name, productGroupId,
            brandName, null, CountryVietnamId, netWeight, null, null,
            expiryMonths, "Bảo quản nơi khô ráo, thoáng mát", null, null));
    }

    private Task SeedHandlerAsync(
        int seq, Guid businessId, string fullName, string position,
        string trainingCertificateNumber, string healthCertificateNumber, DateTime now)
    {
        var id = DemoId(0x8012, seq);
        return InsertIfMissingAsync(id, () => BusinessHandler.Create(
            id, businessId, fullName, position, null,
            trainingCertificateNumber, now.AddMonths(-8),
            "Chi cục An toàn vệ sinh thực phẩm tỉnh Quảng Ninh", now.AddMonths(28),
            healthCertificateNumber, now.AddMonths(-4),
            "Bệnh viện Đa khoa tỉnh Quảng Ninh", now.AddMonths(8), null));
    }

    private Task SeedSelfDeclarationAsync(
        int seq, Guid businessId, Guid organizationId, Guid productId,
        string declarationNumber, string productName, string manufacturer,
        DateTime declarationDate, DateTime? expiryDate, DateTime now)
    {
        var id = DemoId(0x8020, seq);
        return InsertWithOwnerAsync(id, organizationId, "self-declaration", () => SelfDeclaration.Create(
            id, businessId, organizationId, productId, declarationNumber,
            declarationDate, productName, manufacturer,
            "Tự công bố sản phẩm theo Nghị định 15/2018/NĐ-CP",
            expiryDate, null, now));
    }

    private Task SeedProductRegistrationAsync(
        int seq, Guid businessId, Guid organizationId, Guid productId,
        string registrationNumber, string productName,
        DateTime registrationDate, DateTime? expiryDate, DateTime now,
        string? revokeReason)
    {
        var id = DemoId(0x8021, seq);
        return InsertWithOwnerAsync(id, organizationId, "product-registration", () =>
        {
            var registration = ProductRegistration.Create(
                id, businessId, organizationId, productId, registrationNumber,
                $"BN-{seq:d4}", registrationDate, registrationDate.AddDays(5),
                expiryDate, productName, null,
                "Chi cục An toàn vệ sinh thực phẩm tỉnh Quảng Ninh", null, now);
            if (revokeReason is not null)
                registration.Revoke(revokeReason, now.AddMonths(-2), ProvinceAdminId);
            return registration;
        });
    }

    private Task SeedEligibilityCertificateAsync(
        int seq, Guid businessId, Guid organizationId, string certificateNumber,
        DateTime issueDate, DateTime expiryDate, DateTime now, string? revokeReason)
    {
        var id = DemoId(0x8022, seq);
        return InsertWithOwnerAsync(id, organizationId, "eligibility-certificate", () =>
        {
            var certificate = EligibilityCertificate.Create(
                id, businessId, organizationId, certificateNumber, issueDate,
                expiryDate, "Chi cục An toàn vệ sinh thực phẩm tỉnh Quảng Ninh",
                "Sản xuất, kinh doanh thực phẩm theo loại hình đã đăng ký", null, now);
            if (revokeReason is not null)
                certificate.Revoke(revokeReason, now.AddMonths(-1), ProvinceAdminId);
            return certificate;
        });
    }

    private Task SeedCfsCertificateAsync(
        int seq, Guid businessId, Guid organizationId, Guid productId,
        Guid destinationCountryId, string certificateNumber,
        DateTime issueDate, DateTime expiryDate, DateTime now)
    {
        var id = DemoId(0x8023, seq);
        return InsertWithOwnerAsync(id, organizationId, "cfs-certificate", () => CfsCertificate.Create(
            id, businessId, organizationId, productId, destinationCountryId,
            certificateNumber, issueDate, expiryDate,
            "Chi cục An toàn vệ sinh thực phẩm tỉnh Quảng Ninh", null, now));
    }

    private Task SeedExportFoodCertificateAsync(
        int seq, Guid businessId, Guid organizationId, Guid productId,
        Guid? destinationCountryId, string certificateNumber,
        DateTime issueDate, DateTime expiryDate, string lotNumber,
        decimal quantity, string quantityUnit, DateTime now)
    {
        // export_food_certificates has no document_owners FK, but the
        // AppService creates an owner row on create; mirror it for attachments.
        var id = DemoId(0x8024, seq);
        return InsertWithOwnerAsync(id, organizationId, "export-food-certificate", () => ExportFoodCertificate.Create(
            id, businessId, organizationId, productId, destinationCountryId,
            certificateNumber, issueDate, expiryDate, lotNumber,
            quantity, quantityUnit, null, now));
    }

    private Task SeedAdvertisementRegistrationAsync(
        int seq, Guid businessId, Guid organizationId, Guid advertisementTypeId,
        string registrationNumber, DateTime registrationDate, DateTime expiryDate,
        string contentDescription, string medium, IEnumerable<Guid> productIds,
        DateTime now, string? revokeReason)
    {
        var id = DemoId(0x8025, seq);
        return InsertWithOwnerAsync(id, organizationId, "advertisement-registration", () =>
        {
            var registration = AdvertisementRegistration.Create(
                id, businessId, organizationId, advertisementTypeId,
                registrationNumber, registrationDate, expiryDate,
                contentDescription, medium, null, productIds, now);
            if (revokeReason is not null)
                registration.Revoke(revokeReason, now.AddMonths(-1), ProvinceAdminId);
            return registration;
        });
    }

    private Task SeedPoisoningCaseAsync(
        int seq, Guid organizationId, string caseCode, DateTime reportDate,
        DateTime occurrenceDate, Guid? incidentId, string victimName,
        int victimAge, VictimGender victimGender, string suspectedFood,
        string symptoms, string medicalFacility, TreatmentResult treatmentResult,
        PoisoningCaseStatus targetStatus, DateTime now)
    {
        var id = DemoId(0x8041, seq);
        return InsertIfMissingAsync(id, () =>
        {
            var poisoningCase = FoodPoisoningCase.Create(
                id, organizationId, caseCode,
                DateOnly.FromDateTime(reportDate), occurrenceDate, incidentId);
            poisoningCase.SetLocation(
                "Phường Bạch Đằng, TP Hạ Long",
                CommuneId, ProvinceId, 20.951, 107.082);
            poisoningCase.SetVictimInfo(victimName, victimAge, victimGender, null, null);
            poisoningCase.SetFoodInfo(suspectedFood, null,
                DateOnly.FromDateTime(occurrenceDate), symptoms,
                occurrenceDate.AddHours(4));
            poisoningCase.SetMedicalInfo(medicalFacility,
                DateOnly.FromDateTime(occurrenceDate.AddDays(1)), treatmentResult);
            poisoningCase.SetReporterInfo("Trần Thị Huyện", "0912 000 111",
                "Phòng Y tế TP Hạ Long", "Cán bộ tiếp nhận");
            if (targetStatus >= PoisoningCaseStatus.Reported)
                poisoningCase.Submit(ProvinceAdminId, reportDate.AddHours(2));
            if (targetStatus >= PoisoningCaseStatus.Verified)
                poisoningCase.Verify(ProvinceAdminId, reportDate.AddDays(1));
            return poisoningCase;
        });
    }

    private Task SeedApiCallLogAsync(
        int seq, ApiCallDirection direction, string externalSystemName,
        string endpointUrl, string httpMethod, DateTime calledAt,
        long durationMs, bool isSuccess, int responseStatusCode,
        SharedDataType dataType, string? errorMessage)
    {
        var id = DemoId(0x8071, seq);
        return InsertIfMissingAsync(id, () => ApiCallLog.Create(
            id, OrgProvinceId, direction, externalSystemName, endpointUrl,
            httpMethod, calledAt, durationMs, isSuccess,
            requestHeaders: "Content-Type: application/json",
            responseStatusCode: responseStatusCode,
            errorMessage: errorMessage,
            dataType: dataType));
    }
}
