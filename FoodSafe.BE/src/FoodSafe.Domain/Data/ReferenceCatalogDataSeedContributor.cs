using FoodSafe.Catalogs;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Timing;

namespace FoodSafe.Data;

/// <summary>
/// Seeds the reference catalogs an operator needs before any facility can be
/// registered: facility business types, the two-level product-group tree,
/// and facility risk classifications.
///
/// Sources: Nghị định 15/2018/NĐ-CP (phụ lục II–IV — phân công quản lý nhà nước
/// giữa Bộ Y tế / Bộ NN&amp;PTNT / Bộ Công Thương) for the product groups, and the
/// General Statistics Office administrative codes for Quảng Ninh (province 22).
///
/// Every insert is guarded by a code lookup, so the contributor is idempotent
/// and safe to re-run on an existing database.
/// </summary>
public sealed class ReferenceCatalogDataSeedContributor : IDataSeedContributor, ITransientDependency
{
    // Shared with E2eTestDataSeedContributor on purpose. Reusing the province
    // identifier keeps whichever contributor runs second on its existing-record
    // path instead of violating the unique code index (uq_cat_provinces_code).
    static readonly Guid ProvinceQuangNinhId = Guid.Parse("e2e00000-0000-4000-8001-000000000001");
    static readonly Guid RegionDongBacBoId = Guid.Parse("7e5ccdd0-7eab-4bd4-a10a-e8c39c302002");

    // Stable ID for the Quảng Ninh CDC testing centre — used both here and in
    // the TestingService seeds that reference it as their parent center.
    static readonly Guid TestingCenterCdcId = DeterministicId(0x30a, 1);

    private readonly IRepository<Region, Guid> _regions;
    private readonly IRepository<Province, Guid> _provinces;
    private readonly IRepository<BusinessType, Guid> _businessTypes;
    private readonly IRepository<BusinessClassification, Guid> _classifications;
    private readonly IRepository<ProductGroup, Guid> _productGroups;
    private readonly IRepository<AdvertisementType, Guid> _advertisementTypes;
    private readonly IRepository<TestingCenter, Guid> _testingCenters;
    private readonly IRepository<TestingService, Guid> _testingServices;
    private readonly IClock _clock;

    public ReferenceCatalogDataSeedContributor(
        IRepository<Region, Guid> regions,
        IRepository<Province, Guid> provinces,
        IRepository<BusinessType, Guid> businessTypes,
        IRepository<BusinessClassification, Guid> classifications,
        IRepository<ProductGroup, Guid> productGroups,
        IRepository<AdvertisementType, Guid> advertisementTypes,
        IRepository<TestingCenter, Guid> testingCenters,
        IRepository<TestingService, Guid> testingServices,
        IClock clock)
    {
        _regions = regions;
        _provinces = provinces;
        _businessTypes = businessTypes;
        _classifications = classifications;
        _productGroups = productGroups;
        _advertisementTypes = advertisementTypes;
        _testingCenters = testingCenters;
        _testingServices = testingServices;
        _clock = clock;
    }

    public async Task SeedAsync(DataSeedContext context)
    {
        await SeedBusinessTypesAsync();
        await SeedBusinessClassificationsAsync();
        await SeedProductGroupsAsync();
        await SeedAdvertisementTypesAsync();
        await SeedTestingCenterAsync();
        await SeedTestingServicesAsync();
    }

    private async Task SeedBusinessTypesAsync()
    {
        var seeds = new (string Code, string Name, string Description, int SortOrder)[]
        {
            ("SX-CB", "Cơ sở sản xuất, chế biến thực phẩm",
                "Cơ sở sản xuất, chế biến thực phẩm phục vụ tiêu dùng trong nước", 1),
            ("KD-TP", "Cơ sở kinh doanh thực phẩm",
                "Cửa hàng, đại lý, cơ sở bán buôn, bán lẻ thực phẩm", 2),
            ("DV-AU", "Cơ sở dịch vụ ăn uống",
                "Nhà hàng, quán ăn, căng tin, cơ sở chế biến suất ăn sẵn", 3),
            ("BATT", "Bếp ăn tập thể",
                "Bếp ăn trường học, khu công nghiệp, bệnh viện, cơ quan", 4),
            ("TADP", "Cơ sở kinh doanh thức ăn đường phố",
                "Hộ kinh doanh thức ăn đường phố, hàng rong", 5),
            ("SX-NUDC", "Cơ sở sản xuất nước uống đóng chai, nước khoáng thiên nhiên",
                "Thuộc phạm vi quản lý của ngành Y tế", 6),
            ("SX-TPBVSK", "Cơ sở sản xuất thực phẩm bảo vệ sức khỏe",
                "Thực phẩm chức năng, thực phẩm dinh dưỡng y học, chế độ ăn đặc biệt", 7),
            ("SX-PGTP", "Cơ sở sản xuất phụ gia thực phẩm, chất hỗ trợ chế biến",
                "Phụ gia thực phẩm và chất hỗ trợ chế biến thực phẩm", 8),
            ("KD-DCBG", "Cơ sở kinh doanh dụng cụ, vật liệu bao gói chứa đựng thực phẩm",
                "Dụng cụ, vật liệu tiếp xúc trực tiếp với thực phẩm", 9),
            ("CHO-ST", "Chợ, siêu thị, trung tâm thương mại",
                "Cơ sở kinh doanh thực phẩm tập trung", 10),
            ("SX-NLTS", "Cơ sở sản xuất, sơ chế nông lâm thủy sản",
                "Thuộc phạm vi quản lý của ngành Nông nghiệp", 11),
            ("GIET-MO", "Cơ sở giết mổ gia súc, gia cầm",
                "Cơ sở giết mổ tập trung và nhỏ lẻ", 12)
        };

        foreach (var seed in seeds)
        {
            if (await _businessTypes.AnyAsync(x => x.Code == seed.Code))
            {
                continue;
            }

            var entity = BusinessType.Create(
                DeterministicId(0x304, seed.SortOrder),
                seed.Code,
                seed.Name,
                seed.Description,
                seed.SortOrder,
                true);
            entity.CreationTime = _clock.Now;
            await _businessTypes.InsertAsync(entity, autoSave: true);
        }
    }

    private async Task SeedBusinessClassificationsAsync()
    {
        var seeds = new (string Code, string Name, string Criteria, BusinessRiskLevel Risk, int SortOrder)[]
        {
            ("LOAI-A", "Loại A — Tốt",
                "Cơ sở đáp ứng đầy đủ điều kiện bảo đảm an toàn thực phẩm; không có lỗi nghiêm trọng hoặc lỗi nặng. Tần suất thanh kiểm tra: 01 lần/năm.",
                BusinessRiskLevel.Low, 1),
            ("LOAI-B", "Loại B — Đạt",
                "Cơ sở cơ bản đáp ứng điều kiện bảo đảm an toàn thực phẩm; còn tồn tại lỗi nhẹ hoặc lỗi nặng nhưng đã có biện pháp khắc phục. Tần suất thanh kiểm tra: 02 lần/năm.",
                BusinessRiskLevel.Medium, 2),
            ("LOAI-C", "Loại C — Chưa đạt",
                "Cơ sở không đáp ứng điều kiện bảo đảm an toàn thực phẩm; có lỗi nghiêm trọng phải khắc phục và tái kiểm tra. Tần suất thanh kiểm tra: 03 lần/năm trở lên.",
                BusinessRiskLevel.High, 3)
        };

        foreach (var seed in seeds)
        {
            if (await _classifications.AnyAsync(x => x.Code == seed.Code))
            {
                continue;
            }

            var entity = BusinessClassification.Create(
                DeterministicId(0x305, seed.SortOrder),
                seed.Code,
                seed.Name,
                seed.Criteria,
                seed.Risk,
                null,
                seed.SortOrder,
                true);
            entity.CreationTime = _clock.Now;
            await _classifications.InsertAsync(entity, autoSave: true);
        }
    }

    private async Task SeedProductGroupsAsync()
    {
        // Level 1 — phân công quản lý nhà nước theo Nghị định 15/2018/NĐ-CP.
        var parents = new (string Code, string Name, string Description, int SortOrder)[]
        {
            ("BYT", "Nhóm sản phẩm thuộc quản lý của Bộ Y tế",
                "Phụ lục II Nghị định 15/2018/NĐ-CP", 1),
            ("BNN", "Nhóm sản phẩm thuộc quản lý của Bộ Nông nghiệp và Phát triển nông thôn",
                "Phụ lục III Nghị định 15/2018/NĐ-CP", 2),
            ("BCT", "Nhóm sản phẩm thuộc quản lý của Bộ Công Thương",
                "Phụ lục IV Nghị định 15/2018/NĐ-CP", 3)
        };

        foreach (var parent in parents)
        {
            if (await _productGroups.AnyAsync(x => x.Code == parent.Code))
            {
                continue;
            }

            var entity = ProductGroup.Create(
                DeterministicId(0x306, parent.SortOrder),
                parent.Code,
                parent.Name,
                level: 1,
                parentId: null,
                description: parent.Description,
                sortOrder: parent.SortOrder,
                isActive: true);
            entity.CreationTime = _clock.Now;
            await _productGroups.InsertAsync(entity, autoSave: true);
        }

        // Level 2 — nhóm chi tiết. ParentCode phải tồn tại ở bước trên.
        var children = new (string ParentCode, string Code, string Name, int SortOrder)[]
        {
            ("BYT", "BYT-NUDC", "Nước uống đóng chai", 1),
            ("BYT", "BYT-NKTN", "Nước khoáng thiên nhiên", 2),
            ("BYT", "BYT-TPBVSK", "Thực phẩm bảo vệ sức khỏe", 3),
            ("BYT", "BYT-TPDDYH", "Thực phẩm dinh dưỡng y học", 4),
            ("BYT", "BYT-TPCDAD", "Thực phẩm dùng cho chế độ ăn đặc biệt", 5),
            ("BYT", "BYT-SPDDTN", "Sản phẩm dinh dưỡng dùng cho trẻ đến 36 tháng tuổi", 6),
            ("BYT", "BYT-TCVC", "Thực phẩm tăng cường vi chất dinh dưỡng", 7),
            ("BYT", "BYT-PGTP", "Phụ gia thực phẩm, chất hỗ trợ chế biến thực phẩm", 8),
            ("BYT", "BYT-DCBG", "Dụng cụ, vật liệu bao gói chứa đựng thực phẩm", 9),
            ("BYT", "BYT-NDA", "Nước đá dùng liền", 10),

            ("BNN", "BNN-NGCOC", "Ngũ cốc và sản phẩm từ ngũ cốc", 11),
            ("BNN", "BNN-THIT", "Thịt và các sản phẩm từ thịt", 12),
            ("BNN", "BNN-TSAN", "Thủy sản và sản phẩm thủy sản", 13),
            ("BNN", "BNN-RAUQUA", "Rau, củ, quả và sản phẩm rau, củ, quả", 14),
            ("BNN", "BNN-TRUNG", "Trứng và các sản phẩm từ trứng", 15),
            ("BNN", "BNN-SUANL", "Sữa tươi nguyên liệu", 16),
            ("BNN", "BNN-MATONG", "Mật ong và các sản phẩm từ mật ong", 17),
            ("BNN", "BNN-MUOI", "Muối", 18),
            ("BNN", "BNN-GIAVI", "Gia vị", 19),
            ("BNN", "BNN-DUONG", "Đường", 20),
            ("BNN", "BNN-CHE", "Chè", 21),
            ("BNN", "BNN-CAFE", "Cà phê", 22),
            ("BNN", "BNN-CACAO", "Ca cao", 23),
            ("BNN", "BNN-HATTIEU", "Hạt tiêu", 24),
            ("BNN", "BNN-DIEU", "Hạt điều", 25),
            ("BNN", "BNN-TPBDG", "Thực phẩm biến đổi gen", 26),
            ("BNN", "BNN-NSKHAC", "Nông sản thực phẩm khác", 27),

            ("BCT", "BCT-BIA", "Bia", 28),
            ("BCT", "BCT-RUOU", "Rượu, cồn và đồ uống có cồn", 29),
            ("BCT", "BCT-NGK", "Nước giải khát", 30),
            ("BCT", "BCT-SUACB", "Sữa chế biến", 31),
            ("BCT", "BCT-DTV", "Dầu thực vật", 32),
            ("BCT", "BCT-BOTTB", "Bột và tinh bột", 33),
            ("BCT", "BCT-BANHKEO", "Bánh, mứt, kẹo", 34)
        };

        foreach (var child in children)
        {
            if (await _productGroups.AnyAsync(x => x.Code == child.Code))
            {
                continue;
            }

            var parent = await _productGroups.FirstOrDefaultAsync(x => x.Code == child.ParentCode);
            if (parent is null)
            {
                continue;
            }

            var entity = ProductGroup.Create(
                DeterministicId(0x307, child.SortOrder),
                child.Code,
                child.Name,
                level: 2,
                parentId: parent.Id,
                description: null,
                sortOrder: child.SortOrder,
                isActive: true);
            entity.CreationTime = _clock.Now;
            await _productGroups.InsertAsync(entity, autoSave: true);
        }
    }

    private async Task EnsureQuangNinhProvinceAsync()
    {
        if (await _provinces.AnyAsync(x => x.Code == "22"))
        {
            return;
        }

        // The province FK needs its region; MasterCatalogDataSeedContributor may
        // not have run yet on a fresh database.
        if (!await _regions.AnyAsync(x => x.Id == RegionDongBacBoId))
        {
            var region = Region.Create(RegionDongBacBoId, "DBB", "Đông Bắc Bộ", null, 2);
            region.CreationTime = _clock.Now;
            await _regions.InsertAsync(region, autoSave: true);
        }

        var province = Province.Create(
            ProvinceQuangNinhId, "22", "Quảng Ninh", RegionDongBacBoId, "QN", 1);
        province.CreationTime = _clock.Now;
        await _provinces.InsertAsync(province, autoSave: true);
    }

    private async Task SeedAdvertisementTypesAsync()
    {
        var seeds = new (string Code, string Name, int SortOrder)[]
        {
            ("BAODIENTU",  "Báo điện tử / Báo trực tuyến", 1),
            ("MXH",        "Mạng xã hội",                  2),
            ("TRUYENHINH", "Truyền hình",                   3),
            ("PHATHTANH",  "Phát thanh",                    4),
            ("NGOAITROI",  "Biển quảng cáo ngoài trời",     5),
        };

        foreach (var seed in seeds)
        {
            if (await _advertisementTypes.AnyAsync(x => x.Code == seed.Code))
            {
                continue;
            }

            var entity = AdvertisementType.Create(
                DeterministicId(0x309, seed.SortOrder),
                seed.Code, seed.Name, null, seed.SortOrder, true);
            entity.CreationTime = _clock.Now;
            await _advertisementTypes.InsertAsync(entity, autoSave: true);
        }
    }

    private async Task SeedTestingCenterAsync()
    {
        const string Code = "TTKN-QN";
        if (await _testingCenters.AnyAsync(x => x.Code == Code))
        {
            return;
        }

        await EnsureQuangNinhProvinceAsync();

        var entity = TestingCenter.Create(
            TestingCenterCdcId, Code,
            "Trung tâm Kiểm soát bệnh tật tỉnh Quảng Ninh - Khoa Xét nghiệm",
            "651 Lê Thánh Tông, phường Bạch Đằng, TP Hạ Long",
            ProvinceQuangNinhId, communeId: null,
            contactPerson: "Phụ trách khoa Xét nghiệm",
            phone: "0203 3825 447",
            email: "kiemnghiem@quangninhcdc.vn",
            accreditationNumber: "VILAS 675",
            accreditationScope: "Kiểm nghiệm vi sinh, hóa lý thực phẩm và nước",
            accreditationExpiresAt: _clock.Now.AddYears(5),
            description: null, sortOrder: 1, isActive: true);
        entity.CreationTime = _clock.Now;
        await _testingCenters.InsertAsync(entity, autoSave: true);
    }

    private async Task SeedTestingServicesAsync()
    {
        // Guard: only insert if center already exists (created above or by DemoData).
        var center = await _testingCenters.FirstOrDefaultAsync(x => x.Code == "TTKN-QN");
        if (center is null) return;

        var centerId = center.Id;

        var seeds = new (string Code, string Name, string Unit, string Standard, decimal Price, int Days, int SortOrder)[]
        {
            ("KN-VS",   "Kiểm nghiệm vi sinh vật (Coliforms, E.coli, Salmonella)",
             "Mẫu", "TCVN 4884-1:2015 / ISO 4833-1", 850_000m,  5, 1),
            ("KN-HL",   "Kiểm nghiệm hóa lý (pH, độ ẩm, hàm lượng protein)",
             "Mẫu", "TCVN 4594:1988",                620_000m,  4, 2),
            ("KN-KLN",  "Kiểm nghiệm kim loại nặng (Pb, Cd, Hg, As)",
             "Chỉ tiêu", "AOAC 999.10 / ICP-MS",     480_000m,  7, 3),
            ("KN-BVTV", "Kiểm nghiệm dư lượng thuốc bảo vệ thực vật",
             "Mẫu", "EN 15662:2018 (QuEChERS)",       1_950_000m, 10, 4),
        };

        foreach (var seed in seeds)
        {
            if (await _testingServices.AnyAsync(x => x.Code == seed.Code))
            {
                continue;
            }

            var entity = TestingService.Create(
                DeterministicId(0x30b, seed.SortOrder),
                centerId, seed.Code, seed.Name,
                seed.Unit, seed.Standard, seed.Price,
                seed.Days, description: null, seed.SortOrder, isActive: true);
            entity.CreationTime = _clock.Now;
            await _testingServices.InsertAsync(entity, autoSave: true);
        }
    }

    /// <summary>
    /// Builds a stable identifier so re-seeding never produces duplicate rows
    /// and fixtures can reference catalog entries by a predictable value.
    /// Follows the existing catalog convention: the final GUID group is
    /// "e8c39c" + a three-digit category + a three-digit sequence, which is
    /// exactly the twelve hex digits the group allows. Categories 301–303 are
    /// already taken by <see cref="MasterCatalogDataSeedContributor"/>.
    /// </summary>
    private static Guid DeterministicId(int category, int sequence) =>
        Guid.Parse($"7e5ccdd0-7eab-4bd4-a10a-e8c39c{category:x3}{sequence:x3}");
}
