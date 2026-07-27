using Volo.Abp.Application.Services;

namespace FoodSafe.Security;

public sealed class CurrentUserContextDto
{
    public Guid Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public Guid? OrganizationId { get; set; }
    public string? OrganizationName { get; set; }
    public string[] Roles { get; set; } = [];
    public string[] Permissions { get; set; } = [];
    public bool PasswordMustChange { get; set; }
}

public interface ICurrentUserContextAppService : IApplicationService
{
    Task<CurrentUserContextDto> GetAsync();
}
