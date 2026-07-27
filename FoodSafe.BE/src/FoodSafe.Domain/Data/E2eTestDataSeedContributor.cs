using FoodSafe.Catalogs;
using FoodSafe.Organizations;
using FoodSafe.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using Volo.Abp.Timing;

namespace FoodSafe.Data;

public sealed class E2eTestDataSeedContributor : IDataSeedContributor, ITransientDependency
{
    // --- Fixed GUIDs for deterministic data (RFC 4122 v4 compliant) ---
    // Administrative areas
    static readonly Guid ProvinceQuangNinhId = Guid.Parse("e2e00000-0000-4000-8001-000000000001");
    static readonly Guid DistrictHaLongId = Guid.Parse("e2e00000-0000-4000-8002-000000000001");
    static readonly Guid CommuneBachDangId = Guid.Parse("e2e00000-0000-4000-8003-000000000001");

    // Organizations
    static readonly Guid OrgProvinceId = Guid.Parse("e2e00000-0000-4000-8010-000000000001");
    static readonly Guid OrgDistrictId = Guid.Parse("e2e00000-0000-4000-8010-000000000002");
    static readonly Guid OrgCommuneId = Guid.Parse("e2e00000-0000-4000-8010-000000000003");

    // Test users (not admin — admin is created by ABP)
    static readonly Guid UserProvinceAdminId = Guid.Parse("e2e00000-0000-4000-8020-000000000001");
    static readonly Guid UserDistrictStaffId = Guid.Parse("e2e00000-0000-4000-8020-000000000002");
    static readonly Guid UserReadonlyId = Guid.Parse("e2e00000-0000-4000-8020-000000000003");
    static readonly Guid UserNoPermId = Guid.Parse("e2e00000-0000-4000-8020-000000000004");

    // AppUserProfile IDs
    static readonly Guid ProfileAdminId = Guid.Parse("e2e00000-0000-4000-8030-000000000000");
    static readonly Guid ProfileProvinceAdminId = Guid.Parse("e2e00000-0000-4000-8030-000000000001");
    static readonly Guid ProfileDistrictStaffId = Guid.Parse("e2e00000-0000-4000-8030-000000000002");
    static readonly Guid ProfileReadonlyId = Guid.Parse("e2e00000-0000-4000-8030-000000000003");
    static readonly Guid ProfileNoPermId = Guid.Parse("e2e00000-0000-4000-8030-000000000004");

    // Region: Đông Bắc Bộ (seeded by MasterCatalogDataSeedContributor)
    static readonly Guid RegionDongBacBoId = Guid.Parse("7e5ccdd0-7eab-4bd4-a10a-e8c39c302002");

    const string TestPassword = "Admin@2026!";

    private readonly IRepository<Province, Guid> _provinces;
    private readonly IRepository<District, Guid> _districts;
    private readonly IRepository<Commune, Guid> _communes;
    private readonly IRepository<Organization, Guid> _organizations;
    private readonly IRepository<AppUserProfile, Guid> _profiles;
    private readonly IdentityUserManager _userManager;
    private readonly IIdentityUserRepository _identityUsers;
    private readonly IConfiguration _configuration;
    private readonly IClock _clock;

    public E2eTestDataSeedContributor(
        IRepository<Province, Guid> provinces,
        IRepository<District, Guid> districts,
        IRepository<Commune, Guid> communes,
        IRepository<Organization, Guid> organizations,
        IRepository<AppUserProfile, Guid> profiles,
        IdentityUserManager userManager,
        IIdentityUserRepository identityUsers,
        IConfiguration configuration,
        IClock clock)
    {
        _provinces = provinces;
        _districts = districts;
        _communes = communes;
        _organizations = organizations;
        _profiles = profiles;
        _userManager = userManager;
        _identityUsers = identityUsers;
        _configuration = configuration;
        _clock = clock;
    }

    public async Task SeedAsync(DataSeedContext context)
    {
        var env = _configuration["ASPNETCORE_ENVIRONMENT"]
            ?? _configuration["Hosting:Environment"]
            ?? "Production";

        if (!env.Equals("Development", StringComparison.OrdinalIgnoreCase))
            return;

        var now = _clock.Now;

        await SeedAdministrativeAreasAsync(now);
        await SeedOrganizationsAsync(now);
        await SeedAdminProfileAsync(now);
        await SeedTestUsersAsync(now);
    }

    private async Task SeedAdministrativeAreasAsync(DateTime now)
    {
        if (!await _provinces.AnyAsync(x => x.Id == ProvinceQuangNinhId))
        {
            var province = Province.Create(
                ProvinceQuangNinhId, "22", "Quảng Ninh",
                RegionDongBacBoId, "QN", 1);
            province.CreationTime = now;
            await _provinces.InsertAsync(province, autoSave: true);
        }

        if (!await _districts.AnyAsync(x => x.Id == DistrictHaLongId))
        {
            var district = District.Create(
                DistrictHaLongId, "193", "Thành phố Hạ Long",
                ProvinceQuangNinhId, DistrictType.ProvincialCity, 1);
            district.CreationTime = now;
            await _districts.InsertAsync(district, autoSave: true);
        }

        if (!await _communes.AnyAsync(x => x.Id == CommuneBachDangId))
        {
            var commune = Commune.Create(
                CommuneBachDangId, "06547", "Phường Bạch Đằng",
                DistrictHaLongId, CommuneType.Ward, 1);
            commune.CreationTime = now;
            await _communes.InsertAsync(commune, autoSave: true);
        }
    }

    private async Task SeedOrganizationsAsync(DateTime now)
    {
        if (!await _organizations.AnyAsync(x => x.Id == OrgProvinceId))
        {
            var org = Organization.Create(
                OrgProvinceId, "CCATVSTP-QN",
                "Chi cục An toàn vệ sinh thực phẩm tỉnh Quảng Ninh",
                OrganizationLevel.Province,
                parentId: null,
                provinceId: ProvinceQuangNinhId,
                districtId: null,
                communeId: null);
            await _organizations.InsertAsync(org, autoSave: true);
        }

        if (!await _organizations.AnyAsync(x => x.Id == OrgDistrictId))
        {
            var org = Organization.Create(
                OrgDistrictId, "PYT-HL",
                "Phòng Y tế TP Hạ Long",
                OrganizationLevel.District,
                parentId: OrgProvinceId,
                provinceId: ProvinceQuangNinhId,
                districtId: DistrictHaLongId,
                communeId: null);
            await _organizations.InsertAsync(org, autoSave: true);
        }

        if (!await _organizations.AnyAsync(x => x.Id == OrgCommuneId))
        {
            var org = Organization.Create(
                OrgCommuneId, "TYT-BD",
                "Trạm Y tế Phường Bạch Đằng",
                OrganizationLevel.Commune,
                parentId: OrgDistrictId,
                provinceId: ProvinceQuangNinhId,
                districtId: DistrictHaLongId,
                communeId: CommuneBachDangId);
            await _organizations.InsertAsync(org, autoSave: true);
        }
    }

    private async Task SeedAdminProfileAsync(DateTime now)
    {
        var adminEmail = _configuration["Seed:AdminEmail"] ?? "admin@foodsafe.local";
        var adminUser = await _userManager.FindByNameAsync(adminEmail)
                        ?? await _userManager.FindByNameAsync("admin");
        if (adminUser is null)
            return;

        if (await _profiles.AnyAsync(p => p.UserId == adminUser.Id))
            return;

        var profile = AppUserProfile.Create(
            ProfileAdminId, adminUser.Id, OrgProvinceId,
            "Quản trị viên hệ thống", now);
        profile.RecordPasswordChanged(now, TimeSpan.FromDays(3650));
        await _profiles.InsertAsync(profile, autoSave: true);
    }

    private async Task SeedTestUsersAsync(DateTime now)
    {
        await EnsureTestUserAsync(
            UserProvinceAdminId, "province.admin@foodsafe.local",
            "Nguyễn Văn Tỉnh", OrgProvinceId,
            ProfileProvinceAdminId, ["ProvinceAdmin"], now);

        await EnsureTestUserAsync(
            UserDistrictStaffId, "district.staff@foodsafe.local",
            "Trần Thị Huyện", OrgDistrictId,
            ProfileDistrictStaffId, ["DistrictStaff"], now);

        await EnsureTestUserAsync(
            UserReadonlyId, "readonly@foodsafe.local",
            "Lê Văn Xem", OrgCommuneId,
            ProfileReadonlyId, ["CommuneStaff"], now);

        await EnsureTestUserAsync(
            UserNoPermId, "noperm@foodsafe.local",
            "Phạm Thị Không Quyền", OrgProvinceId,
            ProfileNoPermId, [], now);
    }

    private async Task EnsureTestUserAsync(
        Guid userId,
        string email,
        string fullName,
        Guid organizationId,
        Guid profileId,
        string[] roleNames,
        DateTime now)
    {
        var existingUser = await _userManager.FindByNameAsync(email);
        if (existingUser is not null)
            return;

        var user = new IdentityUser(userId, email, email)
        {
            Name = fullName
        };
        (await _userManager.CreateAsync(user, TestPassword)).CheckErrors();

        if (roleNames.Length > 0)
        {
            (await _userManager.SetRolesAsync(user, roleNames)).CheckErrors();
        }

        var profile = AppUserProfile.Create(
            profileId, user.Id, organizationId, fullName, now);
        profile.RecordPasswordChanged(now, TimeSpan.FromDays(3650));
        await _profiles.InsertAsync(profile, autoSave: true);
    }
}
