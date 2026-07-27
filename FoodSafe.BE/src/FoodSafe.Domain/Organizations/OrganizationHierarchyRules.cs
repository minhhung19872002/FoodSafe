using Volo.Abp;

namespace FoodSafe.Organizations;

public static class OrganizationHierarchyRules
{
    public static void ValidateShape(
        OrganizationLevel level,
        Guid? parentId,
        Guid? provinceId,
        Guid? districtId,
        Guid? communeId)
    {
        var valid = level switch
        {
            OrganizationLevel.Province =>
                parentId is null && districtId is null && communeId is null,
            OrganizationLevel.District =>
                parentId is not null && provinceId is not null &&
                districtId is not null && communeId is null,
            OrganizationLevel.Commune =>
                parentId is not null && provinceId is not null &&
                districtId is not null && communeId is not null,
            _ => false
        };

        if (!valid)
        {
            throw new BusinessException(FoodSafeDomainErrorCodes.Organization.InvalidGeography);
        }
    }

    public static void ValidateParent(Organization child, Organization? parent)
    {
        if (child.Level == OrganizationLevel.Province)
        {
            if (parent is not null)
            {
                throw new BusinessException(FoodSafeDomainErrorCodes.Organization.InvalidParent);
            }

            return;
        }

        if (parent is null || (short)parent.Level != (short)child.Level - 1)
        {
            throw new BusinessException(FoodSafeDomainErrorCodes.Organization.InvalidParent);
        }

        var geographyMatches = child.Level switch
        {
            OrganizationLevel.District =>
                child.ProvinceId == parent.ProvinceId,
            OrganizationLevel.Commune =>
                child.ProvinceId == parent.ProvinceId &&
                child.DistrictId == parent.DistrictId,
            _ => false
        };

        if (!geographyMatches)
        {
            throw new BusinessException(FoodSafeDomainErrorCodes.Organization.InvalidGeography);
        }
    }
}
