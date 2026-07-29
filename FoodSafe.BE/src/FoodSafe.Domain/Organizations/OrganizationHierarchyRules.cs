using Volo.Abp;

namespace FoodSafe.Organizations;

public static class OrganizationHierarchyRules
{
    public static void ValidateShape(
        OrganizationLevel level,
        Guid? parentId,
        Guid? provinceId,
        Guid? communeId)
    {
        var valid = level switch
        {
            OrganizationLevel.Province =>
                parentId is null && communeId is null,
            OrganizationLevel.Commune =>
                parentId is not null && provinceId is not null &&
                communeId is not null,
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

        if (parent is null)
        {
            throw new BusinessException(FoodSafeDomainErrorCodes.Organization.InvalidParent);
        }

        if (parent.Level != (OrganizationLevel)((int)child.Level - 1))
        {
            throw new BusinessException(FoodSafeDomainErrorCodes.Organization.InvalidParent);
        }

        var geographyMatches = child.Level switch
        {
            OrganizationLevel.Commune =>
                child.ProvinceId == parent.ProvinceId,
            _ => false
        };

        if (!geographyMatches)
        {
            throw new BusinessException(FoodSafeDomainErrorCodes.Organization.InvalidGeography);
        }
    }
}
