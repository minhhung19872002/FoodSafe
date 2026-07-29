using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace FoodSafe.Hubs;

public class AbpUserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection)
    {
        return connection.User?.FindFirst("sub")?.Value
            ?? connection.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }
}
