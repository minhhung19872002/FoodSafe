using Asp.Versioning;
using FoodSafe.BusinessManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.DataIntegration;

/// <summary>
/// Partner-facing inbound receive API (INT-03). Authentication is by partner
/// API key (X-Api-Key header), NOT by cookie session — the endpoint is
/// anonymous at the ASP.NET level and every security decision is made by
/// <see cref="IPartnerInboundAppService"/>, whose outcome maps 1:1 to an HTTP
/// status here. Required headers: X-Api-Key, X-Request-Id (idempotency),
/// X-Timestamp (replay window). Optional: X-Correlation-Id.
/// </summary>
[RemoteService]
[ApiVersion(ApiContract.Version)]
[AllowAnonymous]
[Route("api/v1/partner")]
public sealed class PartnerInboundController(
    IPartnerInboundAppService service) : AbpControllerBase
{
    /// <summary>
    /// Poll the status of a previously submitted request (FUNC-INT-002).
    /// Auth: X-Api-Key header (same rules as POST submissions).
    /// Returns 200 with status on success, 401 on bad key, 404 if not found.
    /// </summary>
    [HttpGet("submissions/{requestId}")]
    public async Task<IActionResult> GetStatusAsync(string requestId)
    {
        var context = new InboundRequestContext
        {
            ApiKey = Header("X-Api-Key"),
            Path = HttpContext.Request.Path.ToString(),
            ClientIp = HttpContext.Connection.RemoteIpAddress?.ToString(),
        };

        try
        {
            var result = await service.GetSubmissionStatusAsync(requestId, context);
            return Ok(result);
        }
        catch (Volo.Abp.Authorization.AbpAuthorizationException)
        {
            return StatusCode(401, ErrorBody(new InboundReceiveOperationDto
            {
                Outcome = InboundReceiveOutcome.Unauthorized,
                ErrorCode = "InvalidApiKey",
                ErrorMessage = "Invalid API key.",
            }));
        }
        catch (Volo.Abp.Domain.Entities.EntityNotFoundException)
        {
            return NotFound(new { error = new { code = "NotFound", message = "Submission not found." } });
        }
    }

    [HttpPost("submissions/{dataType}")]
    public async Task<IActionResult> ReceiveAsync(
        string dataType, [FromBody] InboundEnvelopeDto envelope)
    {
        var context = new InboundRequestContext
        {
            ApiKey = Header("X-Api-Key"),
            RequestId = Header("X-Request-Id"),
            Timestamp = Header("X-Timestamp"),
            CorrelationId = Header("X-Correlation-Id"),
            Path = HttpContext.Request.Path.ToString(),
            ClientIp = HttpContext.Connection.RemoteIpAddress?.ToString(),
        };

        var operation = await service.ReceiveAsync(dataType, context, envelope);
        return operation.Outcome switch
        {
            InboundReceiveOutcome.Accepted => Ok(operation.Result),
            InboundReceiveOutcome.Duplicate => Ok(operation.Result),
            InboundReceiveOutcome.Unauthorized => StatusCode(
                401, ErrorBody(operation)),
            InboundReceiveOutcome.Forbidden => StatusCode(
                403, ErrorBody(operation)),
            _ => BadRequest(ErrorBody(operation)),
        };
    }

    private string? Header(string name) =>
        HttpContext.Request.Headers.TryGetValue(name, out var value)
            ? value.ToString()
            : null;

    private static object ErrorBody(InboundReceiveOperationDto operation) =>
        new
        {
            error = new
            {
                code = operation.ErrorCode,
                message = operation.ErrorMessage,
            },
        };
}
