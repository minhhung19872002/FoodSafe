using FoodSafe.Catalogs;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Timing;

namespace FoodSafe.Data;

/// <summary>
/// Seeds the reference catalogs an operator needs before any facility can be
/// registered: facility business types, the two-level product-group tree,
/// facility risk classifications, and the Quảng Ninh district tier.
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
    // Shared with E2eTestDataSeedContributor on purpose. Both contributors may
    // create the province and the Hạ Long district, and contributor execution
    // order is not guaranteed. Reusing the identifiers keeps whichever runs
    // second on its existing-record path instead of violating the unique code
    // index (uq_cat_provinces_code / uq_cat_districts_code).
    static readonly Guid ProvinceQuangNinhId = Guid.Parse("e2e00000-0000-4000-8001-000000000001");
    static readonly Guid DistrictHaLongId = Guid.Parse("e2e00000-0000-4000-8002-000000000001");
    static readonly Guid RegionDongBacBoId = Guid.Parse("7e5ccdd0-7eab-4bd4-a10a-e8c39c302002");

    private readonly IRepository<Region, Guid> _regions;
    private readonly IRepository<Province, Guid> _provinces;
    private readonly IRepository<District, Guid> _districts;
    private readonly IRepository<BusinessType, Guid> _businessTypes;
    private readonly IRepository<BusinessClassification, Guid> _classifications;
    private readonly IRepository<ProductGroup, Guid> _productGroups;
    private readonly IClock _clock;

    public ReferenceCatalogDataSeedContributor(
        IRepository<Region, Guid> regions,
        IRepository<Province, Guid> provinces,
        IRepository<District, Guid> districts,
        IRepository<BusinessType, Guid> businessTypes,
        IRepository<BusinessClassification, Guid> classifications,
        IRepository<ProductGroup, Guid> productGroups,
        IClock clock)
    {
        _regions = regions;
        _provinces = provinces;
        _districts = districts;
        _businessTypes = businessTypes;
        _classifications = classifications;
        _productGroups = productGroups;
        _clock = clock;
    }

    public async Task SeedAsync(DataSeedContext context)
    {
        await SeedBusinessTypesAsync();
        await SeedBusinessClassificationsAsync();
        await SeedProductGroupsAsync();
        await SeedQuangNinhDistrictsAsync();
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

    private async Task SeedQuangNinhDistrictsAsync()
    {
        await EnsureQuangNinhProvinceAsync();

        // General Statistics Office district codes for province 22 (Quảng Ninh).
        // Hoành Bồ (204) is intentionally absent: it was merged into Hạ Long in 2020.
        var seeds = new (string Code, string Name, DistrictType Type, int SortOrder)[]
        {
            ("193", "Thành phố Hạ Long", DistrictType.ProvincialCity, 1),
            ("194", "Thành phố Móng Cái", DistrictType.ProvincialCity, 2),
            ("195", "Thành phố Cẩm Phả", DistrictType.ProvincialCity, 3),
            ("196", "Thành phố Uông Bí", DistrictType.ProvincialCity, 4),
            ("205", "Thành phố Đông Triều", DistrictType.ProvincialCity, 5),
            ("206", "Thị xã Quảng Yên", DistrictType.Town, 6),
            ("198", "Huyện Bình Liêu", DistrictType.RuralDistrict, 7),
            ("199", "Huyện Tiên Yên", DistrictType.RuralDistrict, 8),
            ("200", "Huyện Đầm Hà", DistrictType.RuralDistrict, 9),
            ("201", "Huyện Hải Hà", DistrictType.RuralDistrict, 10),
            ("202", "Huyện Ba Chẽ", DistrictType.RuralDistrict, 11),
            ("203", "Huyện Vân Đồn", DistrictType.RuralDistrict, 12),
            ("207", "Huyện Cô Tô", DistrictType.RuralDistrict, 13)
        };

        foreach (var seed in seeds)
        {
            if (await _districts.AnyAsync(x => x.Code == seed.Code))
            {
                continue;
            }

            var id = seed.Code == "193" ? DistrictHaLongId : DeterministicId(0x308, seed.SortOrder);
            var entity = District.Create(id, seed.Code, seed.Name, ProvinceQuangNinhId, seed.Type, seed.SortOrder);
            entity.CreationTime = _clock.Now;
            await _districts.InsertAsync(entity, autoSave: true);
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
