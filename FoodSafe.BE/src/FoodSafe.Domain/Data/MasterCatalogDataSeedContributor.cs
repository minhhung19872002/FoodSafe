using FoodSafe.Catalogs;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Timing;

namespace FoodSafe.Data;

public sealed class MasterCatalogDataSeedContributor : IDataSeedContributor, ITransientDependency
{
    private readonly IRepository<Country, Guid> _countries;
    private readonly IRepository<Region, Guid> _regions;
    private readonly IRepository<DocumentType, Guid> _documentTypes;
    private readonly IClock _clock;

    public MasterCatalogDataSeedContributor(
        IRepository<Country, Guid> countries,
        IRepository<Region, Guid> regions,
        IRepository<DocumentType, Guid> documentTypes,
        IClock clock)
    {
        _countries = countries;
        _regions = regions;
        _documentTypes = documentTypes;
        _clock = clock;
    }

    public async Task SeedAsync(DataSeedContext context)
    {
        if (!await _countries.AnyAsync(x => x.CodeAlpha2 == "VN"))
        {
            var vietnam = Country.Create(
                Guid.Parse("7e5ccdd0-7eab-4bd4-a10a-e8c39c301001"),
                "VN", "Việt Nam", "VNM", "Vietnam");
            vietnam.CreationTime = _clock.Now;
            await _countries.InsertAsync(vietnam, autoSave: true);
        }

        var regions = new (Guid Id, string Code, string Name, int SortOrder)[]
        {
            (Guid.Parse("7e5ccdd0-7eab-4bd4-a10a-e8c39c302001"), "TBB", "Tây Bắc Bộ", 1),
            (Guid.Parse("7e5ccdd0-7eab-4bd4-a10a-e8c39c302002"), "DBB", "Đông Bắc Bộ", 2),
            (Guid.Parse("7e5ccdd0-7eab-4bd4-a10a-e8c39c302003"), "DBSH", "Đồng bằng sông Hồng", 3),
            (Guid.Parse("7e5ccdd0-7eab-4bd4-a10a-e8c39c302004"), "BTB", "Bắc Trung Bộ", 4),
            (Guid.Parse("7e5ccdd0-7eab-4bd4-a10a-e8c39c302005"), "NTB", "Duyên hải Nam Trung Bộ", 5),
            (Guid.Parse("7e5ccdd0-7eab-4bd4-a10a-e8c39c302006"), "TN", "Tây Nguyên", 6),
            (Guid.Parse("7e5ccdd0-7eab-4bd4-a10a-e8c39c302007"), "DNB", "Đông Nam Bộ", 7),
            (Guid.Parse("7e5ccdd0-7eab-4bd4-a10a-e8c39c302008"), "DBSCL", "Đồng bằng sông Cửu Long", 8)
        };

        foreach (var seed in regions)
        {
            if (await _regions.AnyAsync(x => x.Code == seed.Code))
                continue;

            var region = Region.Create(seed.Id, seed.Code, seed.Name, null, seed.SortOrder);
            region.CreationTime = _clock.Now;
            await _regions.InsertAsync(region, autoSave: true);
        }

        var documentTypes = new (Guid Id, string Code, string Name, int SortOrder)[]
        {
            (Guid.Parse("7e5ccdd0-7eab-4bd4-a10a-e8c39c303001"), "LUAT", "Luật", 1),
            (Guid.Parse("7e5ccdd0-7eab-4bd4-a10a-e8c39c303002"), "NGHIDINH", "Nghị định", 2),
            (Guid.Parse("7e5ccdd0-7eab-4bd4-a10a-e8c39c303003"), "THONGTU", "Thông tư", 3),
            (Guid.Parse("7e5ccdd0-7eab-4bd4-a10a-e8c39c303004"), "QUYETDINH", "Quyết định", 4),
            (Guid.Parse("7e5ccdd0-7eab-4bd4-a10a-e8c39c303005"), "CHITHI", "Chỉ thị", 5),
            (Guid.Parse("7e5ccdd0-7eab-4bd4-a10a-e8c39c303006"), "CONGVAN", "Công văn", 6),
            (Guid.Parse("7e5ccdd0-7eab-4bd4-a10a-e8c39c303007"), "KEHOACH", "Kế hoạch", 7),
            (Guid.Parse("7e5ccdd0-7eab-4bd4-a10a-e8c39c303008"), "HUONGDAN", "Hướng dẫn", 8)
        };

        foreach (var seed in documentTypes)
        {
            if (await _documentTypes.AnyAsync(x => x.Code == seed.Code))
                continue;

            var documentType = DocumentType.Create(
                seed.Id, seed.Code, seed.Name, null, seed.SortOrder, true);
            documentType.CreationTime = _clock.Now;
            await _documentTypes.InsertAsync(documentType, autoSave: true);
        }
    }
}
