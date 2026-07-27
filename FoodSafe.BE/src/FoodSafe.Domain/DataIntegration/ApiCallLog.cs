using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.DataIntegration;

public class ApiCallLog : CreationAuditedAggregateRoot<Guid>
{
    public Guid OrganizationId { get; private set; }
    public ApiCallDirection Direction { get; private set; }
    public string ExternalSystemName { get; private set; } = null!;
    public string EndpointUrl { get; private set; } = null!;
    public string HttpMethod { get; private set; } = null!;
    public string? RequestHeaders { get; private set; }
    public string? RequestBody { get; private set; }
    public int? ResponseStatusCode { get; private set; }
    public string? ResponseBody { get; private set; }
    public DateTime CalledAt { get; private set; }
    public long DurationMs { get; private set; }
    public bool IsSuccess { get; private set; }
    public string? ErrorMessage { get; private set; }
    public SharedDataType DataType { get; private set; } = SharedDataType.Other;

    private ApiCallLog() { }

    public static ApiCallLog Create(
        Guid id,
        Guid organizationId,
        ApiCallDirection direction,
        string externalSystemName,
        string endpointUrl,
        string httpMethod,
        DateTime calledAt,
        long durationMs,
        bool isSuccess,
        string? requestHeaders = null,
        string? requestBody = null,
        int? responseStatusCode = null,
        string? responseBody = null,
        string? errorMessage = null,
        SharedDataType dataType = SharedDataType.Other)
    {
        Check.NotNullOrWhiteSpace(externalSystemName, nameof(externalSystemName));
        Check.NotNullOrWhiteSpace(endpointUrl, nameof(endpointUrl));
        Check.NotNullOrWhiteSpace(httpMethod, nameof(httpMethod));

        return new ApiCallLog
        {
            Id = id,
            OrganizationId = organizationId,
            Direction = direction,
            ExternalSystemName = externalSystemName,
            EndpointUrl = endpointUrl,
            HttpMethod = httpMethod,
            CalledAt = calledAt,
            DurationMs = durationMs,
            IsSuccess = isSuccess,
            RequestHeaders = requestHeaders,
            RequestBody = requestBody,
            ResponseStatusCode = responseStatusCode,
            ResponseBody = responseBody,
            ErrorMessage = errorMessage,
            DataType = dataType,
        };
    }
}
