using Volo.Abp.Account;
using Volo.Abp.Account.Localization;
using Volo.Abp.AutoMapper;
using Volo.Abp.BlobStoring;
using Volo.Abp.FeatureManagement;
using Volo.Abp.Identity;
using Volo.Abp.Localization;
using Volo.Abp.Modularity;
using Volo.Abp.PermissionManagement;
using Volo.Abp.SettingManagement;
using Volo.Abp.VirtualFileSystem;

namespace FoodSafe;

[DependsOn(
    typeof(FoodSafeDomainModule),
    typeof(FoodSafeApplicationContractsModule),
    typeof(AbpAccountApplicationModule),
    typeof(AbpIdentityApplicationModule),
    typeof(AbpPermissionManagementApplicationModule),
    typeof(AbpFeatureManagementApplicationModule),
    typeof(AbpSettingManagementApplicationModule),
    typeof(AbpBlobStoringModule)
)]
public class FoodSafeApplicationModule : AbpModule
{
    public override void ConfigureServices(ServiceConfigurationContext context)
    {
        Configure<AbpAutoMapperOptions>(options =>
        {
            options.AddMaps<FoodSafeApplicationModule>();
        });

        Configure<AbpVirtualFileSystemOptions>(options =>
        {
            options.FileSets.AddEmbedded<FoodSafeApplicationModule>();
        });

        // ABP ships no Vietnamese translation for its account emails, so the
        // subject line fell back to English even though the body is ours.
        Configure<AbpLocalizationOptions>(options =>
        {
            options.Resources
                .Get<AccountResource>()
                .AddVirtualJson("/Localization/Account");
        });
    }
}
