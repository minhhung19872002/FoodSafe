using Volo.Abp;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Domain.Services;

namespace FoodSafe.Organizations;

public sealed class OrganizationManager : DomainService
{
    private readonly IRepository<Organization, Guid> _repository;

    public OrganizationManager(IRepository<Organization, Guid> repository)
    {
        _repository = repository;
    }

    public async Task<Organization> CreateAsync(
        Guid id,
        string code,
        string name,
        OrganizationLevel level,
        Guid? parentId,
        Guid? provinceId,
        Guid? districtId,
        Guid? communeId,
        string? address,
        string? phone,
        string? email,
        string? leaderName,
        CancellationToken cancellationToken = default)
    {
        await EnsureCodeIsUniqueAsync(code, null, cancellationToken);

        var organization = Organization.Create(
            id, code, name, level, parentId, provinceId, districtId, communeId,
            address, phone, email, leaderName);

        var parent = await GetParentAsync(parentId, cancellationToken);
        OrganizationHierarchyRules.ValidateParent(organization, parent);
        return organization;
    }

    public async Task ChangeAsync(
        Organization organization,
        string code,
        string name,
        OrganizationLevel level,
        Guid? parentId,
        Guid? provinceId,
        Guid? districtId,
        Guid? communeId,
        string? address,
        string? phone,
        string? email,
        string? leaderName,
        bool isActive,
        CancellationToken cancellationToken = default)
    {
        await EnsureCodeIsUniqueAsync(code, organization.Id, cancellationToken);
        await EnsureNoCycleAsync(organization.Id, parentId, cancellationToken);

        organization.Update(
            code, name, level, parentId, provinceId, districtId, communeId,
            address, phone, email, leaderName, isActive);

        var parent = await GetParentAsync(parentId, cancellationToken);
        OrganizationHierarchyRules.ValidateParent(organization, parent);
    }

    public async Task EnsureCanDeleteAsync(
        Guid organizationId,
        CancellationToken cancellationToken = default)
    {
        var query = await _repository.GetQueryableAsync();
        if (await AsyncExecuter.AnyAsync(
                query.Where(x => x.ParentId == organizationId),
                cancellationToken))
        {
            throw new BusinessException(FoodSafeDomainErrorCodes.Organization.HasChildren);
        }
    }

    private async Task EnsureCodeIsUniqueAsync(
        string code,
        Guid? excludedId,
        CancellationToken cancellationToken)
    {
        var normalizedCode = Check.NotNullOrWhiteSpace(code, nameof(code), 50)
            .Trim()
            .ToUpperInvariant();
        var query = await _repository.GetQueryableAsync();
        var exists = await AsyncExecuter.AnyAsync(
            query.Where(x => x.Code == normalizedCode &&
                             (!excludedId.HasValue || x.Id != excludedId.Value)),
            cancellationToken);

        if (exists)
        {
            throw new BusinessException(FoodSafeDomainErrorCodes.Organization.DuplicateCode)
                .WithData("Code", normalizedCode);
        }
    }

    private async Task<Organization?> GetParentAsync(
        Guid? parentId,
        CancellationToken cancellationToken) =>
        parentId.HasValue
            ? await _repository.FindAsync(parentId.Value, cancellationToken: cancellationToken)
            : null;

    private async Task EnsureNoCycleAsync(
        Guid organizationId,
        Guid? proposedParentId,
        CancellationToken cancellationToken)
    {
        var visited = new HashSet<Guid>();
        var currentId = proposedParentId;

        while (currentId.HasValue)
        {
            if (currentId.Value == organizationId || !visited.Add(currentId.Value))
            {
                throw new BusinessException(FoodSafeDomainErrorCodes.Organization.CircularHierarchy);
            }

            var current = await _repository.FindAsync(
                currentId.Value,
                cancellationToken: cancellationToken);
            currentId = current?.ParentId;
        }
    }
}
