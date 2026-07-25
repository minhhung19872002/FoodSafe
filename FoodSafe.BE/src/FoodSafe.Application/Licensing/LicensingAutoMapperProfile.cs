using AutoMapper;

namespace FoodSafe.Licensing;

public sealed class LicensingAutoMapperProfile : Profile
{
    public LicensingAutoMapperProfile()
    {
        CreateMap<ProductRegistration, ProductRegistrationDto>();
        CreateMap<AdvertisementRegistration,
                AdvertisementRegistrationDto>()
            .ForMember(x => x.Products, options => options.Ignore())
            .ForMember(x => x.BusinessName, options => options.Ignore())
            .ForMember(
                x => x.AdvertisementTypeName,
                options => options.Ignore())
            .ForMember(x => x.DaysUntilExpiry, options => options.Ignore());
    }
}
