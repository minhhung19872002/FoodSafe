using AutoMapper;

namespace FoodSafe.Licensing;

public sealed class LicensingAutoMapperProfile : Profile
{
    public LicensingAutoMapperProfile()
    {
        CreateMap<ProductRegistration, ProductRegistrationDto>();
        CreateMap<CfsCertificate, CfsCertificateDto>();
        CreateMap<ExportFoodCertificate, ExportFoodCertificateDto>();
        CreateMap<AdvertisementRegistration,
                AdvertisementRegistrationDto>()
            .ForMember(x => x.Products, options => options.Ignore())
            .ForMember(x => x.BusinessName, options => options.Ignore())
            .ForMember(
                x => x.AdvertisementTypeName,
                options => options.Ignore())
            .ForMember(x => x.DaysUntilExpiry, options => options.Ignore());
        CreateMap<EligibilityCertificate, EligibilityCertificateDto>()
            .ForMember(x => x.BusinessName, options => options.Ignore())
            .ForMember(x => x.DaysUntilExpiry, options => options.Ignore());
    }
}
