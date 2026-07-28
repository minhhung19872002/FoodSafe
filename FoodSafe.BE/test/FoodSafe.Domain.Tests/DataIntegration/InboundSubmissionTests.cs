using Shouldly;
using Volo.Abp;
using Xunit;

namespace FoodSafe.DataIntegration;

/// <summary>
/// Officer disposition of partner data received through the inbound API
/// (INT-03): Received → Processed / Rejected, both terminal.
/// </summary>
public sealed class InboundSubmissionTests
{
    private static readonly Guid OfficerId = Guid.NewGuid();
    private static readonly DateTime Now = new(2026, 7, 28, 9, 30, 0, DateTimeKind.Utc);

    private static InboundSubmission CreateSubmission() =>
        InboundSubmission.Create(
            Guid.NewGuid(),
            partnerAccountId: Guid.NewGuid(),
            organizationId: Guid.NewGuid(),
            dataType: SharedDataType.Alert,
            schemaVersion: "1.0",
            requestId: "REQ-0001",
            payload: "{\"items\":[]}",
            recordCount: 1,
            receivedAt: Now.AddMinutes(-5));

    [Fact]
    public void Create_should_start_awaiting_disposition()
    {
        var submission = CreateSubmission();

        submission.Status.ShouldBe(InboundSubmissionStatus.Received);
        submission.ProcessedById.ShouldBeNull();
        submission.ProcessedAt.ShouldBeNull();
        submission.RejectReason.ShouldBeNull();
    }

    [Fact]
    public void MarkProcessed_should_record_the_deciding_officer_and_time()
    {
        var submission = CreateSubmission();

        submission.MarkProcessed(OfficerId, Now);

        submission.Status.ShouldBe(InboundSubmissionStatus.Processed);
        submission.ProcessedById.ShouldBe(OfficerId);
        submission.ProcessedAt.ShouldBe(Now);
        submission.RejectReason.ShouldBeNull();
    }

    [Fact]
    public void Reject_should_store_a_trimmed_reason_with_the_officer_and_time()
    {
        var submission = CreateSubmission();

        submission.Reject(OfficerId, Now, "  Sai định dạng dữ liệu  ");

        submission.Status.ShouldBe(InboundSubmissionStatus.Rejected);
        submission.RejectReason.ShouldBe("Sai định dạng dữ liệu");
        submission.ProcessedById.ShouldBe(OfficerId);
        submission.ProcessedAt.ShouldBe(Now);
    }

    [Fact]
    public void Reject_should_require_a_reason()
    {
        var submission = CreateSubmission();

        Should.Throw<ArgumentException>(
            () => submission.Reject(OfficerId, Now, "   "));
        submission.Status.ShouldBe(InboundSubmissionStatus.Received);
    }

    [Fact]
    public void MarkProcessed_should_refuse_a_second_disposition()
    {
        var submission = CreateSubmission();
        submission.MarkProcessed(OfficerId, Now);

        var ex = Should.Throw<BusinessException>(
            () => submission.MarkProcessed(Guid.NewGuid(), Now.AddMinutes(1)));

        ex.Code.ShouldBe(
            FoodSafeDomainErrorCodes.DataIntegration.SubmissionAlreadyDisposed);
        submission.ProcessedById.ShouldBe(OfficerId);
        submission.ProcessedAt.ShouldBe(Now);
    }

    [Fact]
    public void Reject_should_refuse_to_overturn_an_approval()
    {
        var submission = CreateSubmission();
        submission.MarkProcessed(OfficerId, Now);

        var ex = Should.Throw<BusinessException>(
            () => submission.Reject(OfficerId, Now.AddMinutes(1), "Đổi ý"));

        ex.Code.ShouldBe(
            FoodSafeDomainErrorCodes.DataIntegration.SubmissionAlreadyDisposed);
        submission.Status.ShouldBe(InboundSubmissionStatus.Processed);
        submission.RejectReason.ShouldBeNull();
    }

    [Fact]
    public void MarkProcessed_should_refuse_to_overturn_a_rejection()
    {
        var submission = CreateSubmission();
        submission.Reject(OfficerId, Now, "Thiếu trường bắt buộc");

        Should.Throw<BusinessException>(
            () => submission.MarkProcessed(OfficerId, Now.AddMinutes(1)));

        submission.Status.ShouldBe(InboundSubmissionStatus.Rejected);
        submission.RejectReason.ShouldBe("Thiếu trường bắt buộc");
    }
}
