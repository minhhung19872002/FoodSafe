namespace FoodSafe.Organizations;

public static class OrganizationTreeBuilder
{
    public static List<OrganizationTreeNodeDto> Build(
        IReadOnlyCollection<OrganizationDto> organizations)
    {
        var nodes = organizations.ToDictionary(
            item => item.Id,
            item => new OrganizationTreeNodeDto
            {
                Id = item.Id,
                Code = item.Code,
                Name = item.Name,
                Level = item.Level,
                IsActive = item.IsActive
            });

        var roots = new List<OrganizationTreeNodeDto>();
        foreach (var item in organizations.OrderBy(x => x.Code))
        {
            var node = nodes[item.Id];
            if (item.ParentId.HasValue &&
                nodes.TryGetValue(item.ParentId.Value, out var parent))
            {
                parent.Children.Add(node);
            }
            else
            {
                roots.Add(node);
            }
        }

        return roots;
    }
}
