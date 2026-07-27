namespace FoodSafe.Security;

public sealed record OrganizationScopeNode(
    Guid Id,
    Guid? ParentId,
    Guid? ProvinceId,
    Guid? DistrictId,
    Guid? CommuneId);

public static class OrganizationHierarchyScope
{
    public static HashSet<Guid> Expand(
        Guid rootId,
        IReadOnlyCollection<OrganizationScopeNode> organizations)
    {
        if (organizations.All(x => x.Id != rootId))
        {
            throw new InvalidOperationException("The scope root organization does not exist.");
        }

        var result = new HashSet<Guid> { rootId };
        var queue = new Queue<Guid>();
        queue.Enqueue(rootId);
        var byParent = organizations
            .Where(x => x.ParentId.HasValue)
            .GroupBy(x => x.ParentId!.Value)
            .ToDictionary(x => x.Key, x => x.Select(item => item.Id).ToArray());

        while (queue.TryDequeue(out var parentId))
        {
            if (!byParent.TryGetValue(parentId, out var children)) continue;
            foreach (var child in children.Where(result.Add)) queue.Enqueue(child);
        }

        return result;
    }
}
