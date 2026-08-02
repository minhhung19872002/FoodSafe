using AutoMapper;

namespace FoodSafe.Catalogs;

public sealed class MasterCatalogAutoMapperProfile : Profile
{
    public MasterCatalogAutoMapperProfile()
    {
        CreateMap<ProductGroup, ProductGroupDto>();
        CreateMap<BusinessType, MasterCatalogDto>();
        CreateMap<BusinessClassification, BusinessClassificationDto>();
        CreateMap<AdvertisementType, MasterCatalogDto>();
        CreateMap<DocumentType, MasterCatalogDto>();
        CreateMap<TestingCenter, TestingCenterDto>();
        CreateMap<TestingService, TestingServiceDto>();
        CreateMap<ViolationType, ViolationTypeDto>();
    }
}
