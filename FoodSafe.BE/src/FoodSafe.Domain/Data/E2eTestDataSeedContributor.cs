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
    // Administrative areas (internal: referenced by DemoDataSeedContributor)
    internal static readonly Guid ProvinceQuangNinhId = Guid.Parse("e2e00000-0000-4000-8001-000000000001");

    // Primary E2E commune — Phường Hồng Gai, real code per NQ 1679/NQ-UBTVQH15
    // and QĐ 19/2025/QĐ-TTg. The code is also seeded by
    // ReferenceCatalogDataSeedContributor; contributor order is not guaranteed,
    // so whichever runs first owns the row and consumers resolve it by code.
    internal const string CommunePrimaryCode = "06685";
    static readonly Guid CommuneHongGaiId = Guid.Parse("e2e00000-0000-4000-8003-000000000001");

    // Organizations (internal: referenced by DemoDataSeedContributor)
    internal static readonly Guid OrgProvinceId = Guid.Parse("e2e00000-0000-4000-8010-000000000001");
    internal static readonly Guid OrgCommuneId = Guid.Parse("e2e00000-0000-4000-8010-000000000003");

    private static readonly (
        Guid CommuneId,
        Guid OrganizationId,
        string CommuneCode,
        string CommuneName,
        string OrganizationCode,
        string OrganizationName)[] AdditionalManagingOrganizations =
    [
        // Real commune codes per NQ 1679/NQ-UBTVQH15 + QĐ 19/2025/QĐ-TTg
        // (in force since 01/07/2025), shared with
        // ReferenceCatalogDataSeedContributor — see CommunePrimaryCode note.
        (
            Guid.Parse("e2e00000-0000-4000-8003-000000000002"),
            Guid.Parse("e2e00000-0000-4000-8010-000000000004"),
            "06688", "Phường Hạ Long",
            "TYT-HL", "Trạm Y tế Phường Hạ Long"),
        (
            Guid.Parse("e2e00000-0000-4000-8003-000000000003"),
            Guid.Parse("e2e00000-0000-4000-8010-000000000005"),
            "06673", "Phường Bãi Cháy",
            "TYT-BC", "Trạm Y tế Phường Bãi Cháy"),
        (
            Guid.Parse("e2e00000-0000-4000-8003-000000000004"),
            Guid.Parse("e2e00000-0000-4000-8010-000000000006"),
            "06793", "Phường Cẩm Phả",
            "TYT-CP", "Trạm Y tế Phường Cẩm Phả"),
        (
            Guid.Parse("e2e00000-0000-4000-8003-000000000005"),
            Guid.Parse("e2e00000-0000-4000-8010-000000000007"),
            "06712", "Phường Móng Cái 1",
            "TYT-MC", "Trạm Y tế Phường Móng Cái 1"),
        (
            Guid.Parse("e2e00000-0000-4000-8003-000000000006"),
            Guid.Parse("e2e00000-0000-4000-8010-000000000008"),
            "06811", "Phường Uông Bí",
            "TYT-UB", "Trạm Y tế Phường Uông Bí")
    ];

    private const string ScopedParentOrganizationCode = "KH-NC-01";

    private static readonly (
        Guid OrganizationId,
        string OrganizationCode,
        string OrganizationName,
        string CommuneCode)[] ScopedManagingOrganizations =
    [
        (
            Guid.Parse("e2e00000-0000-4000-8010-000000000009"),
            "KH-HG-01", "Đơn vị quản lý Hạ Long", "06688"),
        (
            Guid.Parse("e2e00000-0000-4000-8010-000000000010"),
            "KH-BC-01", "Đơn vị quản lý Bãi Cháy", "06673"),
        (
            Guid.Parse("e2e00000-0000-4000-8010-000000000011"),
            "KH-CP-01", "Đơn vị quản lý Cẩm Phả", "06793"),
        (
            Guid.Parse("e2e00000-0000-4000-8010-000000000012"),
            "KH-MC-01", "Đơn vị quản lý Móng Cái 1", "06712"),
        (
            Guid.Parse("e2e00000-0000-4000-8010-000000000013"),
            "KH-UB-01", "Đơn vị quản lý Uông Bí", "06811")
    ];

    // Test users (not admin — admin is created by ABP)
    internal static readonly Guid UserProvinceAdminId = Guid.Parse("e2e00000-0000-4000-8020-000000000001");
    internal static readonly Guid UserReadonlyId = Guid.Parse("e2e00000-0000-4000-8020-000000000003");
    static readonly Guid UserNoPermId = Guid.Parse("e2e00000-0000-4000-8020-000000000004");
    // Deterministic user whose password is already expired (SEC-04 enforcement test).
    internal static readonly Guid UserExpiredPasswordId = Guid.Parse("e2e00000-0000-4000-8020-000000000005");

    // AppUserProfile IDs
    static readonly Guid ProfileAdminId = Guid.Parse("e2e00000-0000-4000-8030-000000000000");
    static readonly Guid ProfileProvinceAdminId = Guid.Parse("e2e00000-0000-4000-8030-000000000001");
    static readonly Guid ProfileReadonlyId = Guid.Parse("e2e00000-0000-4000-8030-000000000003");
    static readonly Guid ProfileNoPermId = Guid.Parse("e2e00000-0000-4000-8030-000000000004");
    static readonly Guid ProfileExpiredPasswordId = Guid.Parse("e2e00000-0000-4000-8030-000000000005");

    // Region: Đông Bắc Bộ (seeded by MasterCatalogDataSeedContributor)
    static readonly Guid RegionDongBacBoId = Guid.Parse("7e5ccdd0-7eab-4bd4-a10a-e8c39c302002");

    // Development-only convenience password. It is a well-known literal that lives in
    // git history, so it must NEVER back a real account outside Development. Kept in
    // sync with the e2e specs' E2E_TEST_USER_PASSWORD default so real-browser login
    // stays deterministic in Development/CI. See ResolveSeedPassword (C-5).
    const string DefaultTestPassword = "Admin@2026!";

    private readonly IRepository<Region, Guid> _regions;
    private readonly IRepository<Province, Guid> _provinces;
    private readonly IRepository<Commune, Guid> _communes;
    private readonly IRepository<Organization, Guid> _organizations;
    private readonly IRepository<AppUserProfile, Guid> _profiles;
    private readonly IdentityUserManager _userManager;
    private readonly IdentityRoleManager _roleManager;
    private readonly IIdentityUserRepository _identityUsers;
    private readonly IConfiguration _configuration;
    private readonly IClock _clock;

    public E2eTestDataSeedContributor(
        IRepository<Region, Guid> regions,
        IRepository<Province, Guid> provinces,
        IRepository<Commune, Guid> communes,
        IRepository<Organization, Guid> organizations,
        IRepository<AppUserProfile, Guid> profiles,
        IdentityUserManager userManager,
        IdentityRoleManager roleManager,
        IIdentityUserRepository identityUsers,
        IConfiguration configuration,
        IClock clock)
    {
        _regions = regions;
        _provinces = provinces;
        _communes = communes;
        _organizations = organizations;
        _profiles = profiles;
        _userManager = userManager;
        _roleManager = roleManager;
        _identityUsers = identityUsers;
        _configuration = configuration;
        _clock = clock;
    }

    public async Task SeedAsync(DataSeedContext context)
    {
        var env = _configuration["ASPNETCORE_ENVIRONMENT"]
            ?? _configuration["Hosting:Environment"]
            ?? "Production";

        var explicitlyEnabled = string.Equals(
            _configuration["Seed:EnableE2eData"], "true",
            StringComparison.OrdinalIgnoreCase);

        if (!env.Equals("Development", StringComparison.OrdinalIgnoreCase) &&
            !explicitlyEnabled)
            return;

        await ForceSeedAsync();
    }

    // Seeds regardless of the environment gate. Idempotent. Includes the E2E
    // test accounts, so it may only be called from the e2e-enabled path — see
    // ForceSeedBaseDataAsync for the demo-data caller.
    public async Task ForceSeedAsync()
    {
        await ForceSeedBaseDataAsync();
        await SeedTestUsersAsync(_clock.Now);
    }

    // Reference data only: administrative areas, organizations and the profile
    // of the real bootstrap admin. Deliberately excludes SeedTestUsersAsync.
    //
    // DemoDataSeedContributor calls this to guarantee its foreign keys exist
    // independent of contributor ordering. Demo content must never drag in the
    // E2E fixture accounts: outside Development those accounts cannot be given
    // the built-in password (C-5), so seeding them aborted the migrator and, via
    // `depends_on: service_completed_successfully`, took the whole stack down.
    public async Task ForceSeedBaseDataAsync()
    {
        var now = _clock.Now;

        await SeedAdministrativeAreasAsync(now);
        await SeedOrganizationsAsync(now);
        await SeedAdminProfileAsync(now);
    }

    private async Task SeedAdministrativeAreasAsync(DateTime now)
    {
        // Fresh databases may run this contributor before
        // MasterCatalogDataSeedContributor; the province FK needs the region.
        if (!await _regions.AnyAsync(x => x.Id == RegionDongBacBoId))
        {
            await _regions.InsertAsync(
                Region.Create(RegionDongBacBoId, "DBB", "Đông Bắc Bộ", null, 2),
                autoSave: true);
        }

        if (!await _provinces.AnyAsync(x => x.Id == ProvinceQuangNinhId))
        {
            var province = Province.Create(
                ProvinceQuangNinhId, "22", "Quảng Ninh",
                RegionDongBacBoId, "QN", 1);
            province.CreationTime = now;
            await _provinces.InsertAsync(province, autoSave: true);
        }

        // The commune code is UNIQUE and also seeded by
        // ReferenceCatalogDataSeedContributor, so check the code as well —
        // whichever contributor runs first wins (see CommunePrimaryCode note).
        if (!await _communes.AnyAsync(x =>
                x.Id == CommuneHongGaiId || x.Code == CommunePrimaryCode))
        {
            var commune = Commune.Create(
                CommuneHongGaiId, CommunePrimaryCode, "Phường Hồng Gai",
                ProvinceQuangNinhId, CommuneType.Ward, 1);
            commune.CreationTime = now;
            await _communes.InsertAsync(commune, autoSave: true);
        }

        foreach (var seed in AdditionalManagingOrganizations)
        {
            if (await _communes.AnyAsync(x =>
                    x.Id == seed.CommuneId || x.Code == seed.CommuneCode))
                continue;

            var commune = Commune.Create(
                seed.CommuneId,
                seed.CommuneCode,
                seed.CommuneName,
                ProvinceQuangNinhId,
                CommuneType.Ward,
                sortOrder: 2);
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
                communeId: null);
            await _organizations.InsertAsync(org, autoSave: true);
        }

        if (!await _organizations.AnyAsync(x => x.Id == OrgCommuneId))
        {
            // Resolve by code: the commune row may have been inserted by
            // ReferenceCatalogDataSeedContributor with its own id.
            var primaryCommune = await _communes.FirstOrDefaultAsync(
                    x => x.Code == CommunePrimaryCode)
                ?? throw new InvalidOperationException(
                    $"Commune {CommunePrimaryCode} must be seeded before organization TYT-BD.");

            var org = Organization.Create(
                OrgCommuneId, "TYT-BD",
                "Trạm Y tế Phường Hồng Gai",
                OrganizationLevel.Commune,
                parentId: OrgProvinceId,
                provinceId: ProvinceQuangNinhId,
                communeId: primaryCommune.Id);
            await _organizations.InsertAsync(org, autoSave: true);
        }

        foreach (var seed in AdditionalManagingOrganizations)
        {
            if (await _organizations.AnyAsync(x =>
                    x.Id == seed.OrganizationId ||
                    x.Code == seed.OrganizationCode))
                continue;

            var commune = await _communes.FirstOrDefaultAsync(
                x => x.Code == seed.CommuneCode);
            if (commune is null)
                throw new InvalidOperationException(
                    $"Commune {seed.CommuneCode} must be seeded before organization {seed.OrganizationCode}.");

            var organization = Organization.Create(
                seed.OrganizationId,
                seed.OrganizationCode,
                seed.OrganizationName,
                OrganizationLevel.Commune,
                parentId: OrgProvinceId,
                provinceId: ProvinceQuangNinhId,
                communeId: commune.Id);
            await _organizations.InsertAsync(organization, autoSave: true);
        }

        var scopedParent = await _organizations.FirstOrDefaultAsync(
            x => x.Code == ScopedParentOrganizationCode);
        if (scopedParent?.ProvinceId is not Guid scopedProvinceId ||
            scopedParent.Level != OrganizationLevel.Province)
            return;

        foreach (var seed in ScopedManagingOrganizations)
        {
            if (await _organizations.AnyAsync(x =>
                    x.Id == seed.OrganizationId ||
                    x.Code == seed.OrganizationCode))
                continue;

            var commune = await _communes.FirstOrDefaultAsync(
                x => x.Code == seed.CommuneCode);
            if (commune is null || commune.ProvinceId != scopedProvinceId)
                throw new InvalidOperationException(
                    $"Commune {seed.CommuneCode} must belong to the parent province before organization {seed.OrganizationCode} is seeded.");

            var organization = Organization.Create(
                seed.OrganizationId,
                seed.OrganizationCode,
                seed.OrganizationName,
                OrganizationLevel.Commune,
                parentId: scopedParent.Id,
                provinceId: scopedProvinceId,
                communeId: commune.Id);
            await _organizations.InsertAsync(organization, autoSave: true);
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
            UserReadonlyId, "readonly@foodsafe.local",
            "Lê Văn Xem", OrgCommuneId,
            ProfileReadonlyId, ["CommuneStaff"], now);

        await EnsureTestUserAsync(
            UserNoPermId, "noperm@foodsafe.local",
            "Phạm Thị Không Quyền", OrgProvinceId,
            ProfileNoPermId, [], now);

        // Password changed 100 days ago under a 90-day policy → expired 10 days ago.
        // Fully permissioned (ProvinceAdmin) so the SEC-04 gate is proven to block
        // even an authorized user, not merely one lacking permissions.
        await EnsureTestUserAsync(
            UserExpiredPasswordId, "expired.pw@foodsafe.local",
            "Đỗ Văn Hết Hạn", OrgProvinceId,
            ProfileExpiredPasswordId, ["ProvinceAdmin"], now,
            passwordChangedAt: now.AddDays(-100),
            passwordValidity: TimeSpan.FromDays(90));
    }

    // Resolves the password for seeded accounts. An operator-set Seed:TestPassword
    // always wins. Absent that, the built-in DefaultTestPassword is allowed ONLY in
    // Development — outside Development (e.g. staging/production with demo or e2e
    // seeding force-enabled) we refuse rather than mint privileged accounts whose
    // password is published in git history (C-5).
    public static string ResolveSeedPassword(string? configuredPassword, string? environment)
    {
        if (!string.IsNullOrWhiteSpace(configuredPassword))
            return configuredPassword;

        var env = environment ?? "Production";
        if (env.Equals("Development", StringComparison.OrdinalIgnoreCase))
            return DefaultTestPassword;

        throw new InvalidOperationException(
            "Refusing to seed accounts with the built-in development password outside the " +
            "Development environment. Set 'Seed:TestPassword' (env Seed__TestPassword) to an " +
            "operator-chosen secret before enabling demo or e2e seeding in this environment.");
    }

    private async Task EnsureTestUserAsync(
        Guid userId,
        string email,
        string fullName,
        Guid organizationId,
        Guid profileId,
        string[] roleNames,
        DateTime now,
        DateTime? passwordChangedAt = null,
        TimeSpan? passwordValidity = null)
    {
        var existingUser = await _userManager.FindByNameAsync(email);
        if (existingUser is not null)
            return;

        var user = new IdentityUser(userId, email, email)
        {
            Name = fullName
        };
        var env = _configuration["ASPNETCORE_ENVIRONMENT"]
            ?? _configuration["Hosting:Environment"];
        var password = ResolveSeedPassword(_configuration["Seed:TestPassword"], env);
        (await _userManager.CreateAsync(user, password)).CheckErrors();

        if (roleNames.Length > 0)
        {
            // Fresh databases may run this contributor before the role/permission
            // seeder; create missing roles so assignment succeeds (permissions
            // are granted by FoodSafePermissionDataSeedContributor afterwards).
            foreach (var roleName in roleNames)
            {
                if (await _roleManager.FindByNameAsync(roleName) is null)
                {
                    var role = new IdentityRole(Guid.NewGuid(), roleName)
                    {
                        IsStatic = true,
                        IsPublic = false,
                        IsDefault = false
                    };
                    role.SetProperty("IsActive", true);
                    (await _roleManager.CreateAsync(role)).CheckErrors();
                }
            }

            (await _userManager.SetRolesAsync(user, roleNames)).CheckErrors();
        }

        var profile = AppUserProfile.Create(
            profileId, user.Id, organizationId, fullName, now);
        profile.RecordPasswordChanged(
            passwordChangedAt ?? now,
            passwordValidity ?? TimeSpan.FromDays(3650));
        await _profiles.InsertAsync(profile, autoSave: true);
    }
}
