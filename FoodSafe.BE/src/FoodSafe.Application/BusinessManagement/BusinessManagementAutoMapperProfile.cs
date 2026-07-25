using AutoMapper;

namespace FoodSafe.BusinessManagement;

public sealed class BusinessManagementAutoMapperProfile : Profile
{
    public BusinessManagementAutoMapperProfile()
    {
        CreateMap<Business, BusinessDto>();
        CreateMap<BusinessHandler, BusinessHandlerDto>();
        CreateMap<Product, ProductDto>();
    }
}
