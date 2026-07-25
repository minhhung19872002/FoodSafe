using AutoMapper;

namespace FoodSafe.Licensing;

public sealed class LicensingAutoMapperProfile : Profile
{
    public LicensingAutoMapperProfile()
    {
        CreateMap<ProductRegistration, ProductRegistrationDto>();
    }
}
