using AutoMapper;

namespace FoodSafe.Catalogs;

public sealed class GeographicCatalogAutoMapperProfile : Profile
{
    public GeographicCatalogAutoMapperProfile()
    {
        CreateMap<Country, CountryDto>();
        CreateMap<Region, RegionDto>();
        CreateMap<Province, ProvinceDto>();
        CreateMap<District, DistrictDto>();
        CreateMap<Commune, CommuneDto>();
    }
}
