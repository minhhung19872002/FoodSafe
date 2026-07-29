using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace FoodSafe.Hubs;

[Authorize]
public class NotificationHub(ILogger<NotificationHub> logger) : Hub
{
    public override Task OnConnectedAsync()
    {
        logger.LogInformation(
            "[SignalR] User {UserId} connected (connectionId={ConnectionId})",
            Context.UserIdentifier, Context.ConnectionId);
        return base.OnConnectedAsync();
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        if (exception is not null)
            logger.LogWarning(exception,
                "[SignalR] User {UserId} disconnected with error (connectionId={ConnectionId})",
                Context.UserIdentifier, Context.ConnectionId);
        else
            logger.LogInformation(
                "[SignalR] User {UserId} disconnected (connectionId={ConnectionId})",
                Context.UserIdentifier, Context.ConnectionId);

        return base.OnDisconnectedAsync(exception);
    }
}
