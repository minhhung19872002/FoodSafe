using AutoMapper;

namespace FoodSafe.Catalogs;

public sealed class GeographicCatalogAutoMapperProfile : Profile
{
    public GeographicCatalogAutoMapperProfile()
    {
        CreateMap<Country, CountryDto>().MaxDepth(8);
        CreateMap<Region, RegionDto>().MaxDepth(8);
        CreateMap<Province, ProvinceDto>().MaxDepth(8);
        CreateMap<Commune, CommuneDto>().MaxDepth(8);
    }
}
