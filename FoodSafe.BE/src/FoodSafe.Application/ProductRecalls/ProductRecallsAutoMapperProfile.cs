using AutoMapper;

namespace FoodSafe.ProductRecalls;

public sealed class ProductRecallsAutoMapperProfile : Profile
{
    public ProductRecallsAutoMapperProfile()
    {
        CreateMap<ProductRecall, ProductRecallDto>()
            .ForMember(x => x.BusinessName, options => options.Ignore());
    }
}
