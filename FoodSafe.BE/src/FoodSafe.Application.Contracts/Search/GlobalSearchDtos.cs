using System.ComponentModel.DataAnnotations;

namespace FoodSafe.Search;

public sealed class GlobalSearchInput
{
    [Required, MinLength(2), MaxLength(100)]
    public string Q { get; set; } = string.Empty;

    public int MaxPerGroup { get; set; } = 5;
}

public sealed class GlobalSearchResultDto
{
    public IReadOnlyList<SearchGroupDto> Groups { get; set; } = [];
}

public sealed class SearchGroupDto
{
    public string EntityType { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public IReadOnlyList<SearchHitDto> Items { get; set; } = [];
}

public sealed class SearchHitDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public string Route { get; set; } = string.Empty;
}
