using AutoMapper;

namespace FoodSafe.Organizations;

public sealed class OrganizationApplicationAutoMapperProfile : Profile
{
    public OrganizationApplicationAutoMapperProfile()
    {
        CreateMap<Organization, OrganizationDto>().MaxDepth(8);
    }
}
