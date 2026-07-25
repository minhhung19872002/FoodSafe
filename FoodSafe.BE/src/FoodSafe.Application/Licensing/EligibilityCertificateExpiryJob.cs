using FoodSafe.BusinessManagement;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Linq;
using Volo.Abp.Threading;
using Volo.Abp.Timing;
using Volo.Abp.Uow;

namespace FoodSafe.Licensing;

public interface IEligibilityCertificateExpiryJob
{
    Task ExecuteAsync();
}

public class EligibilityCertificateExpiryJob(
    IRepository<EligibilityCertificate, Guid> certificates,
    IRepository<Business, Guid> businesses,
    ICancellationTokenProvider cancellationTokens,
    IAsyncQueryableExecuter asyncExecuter,
    IClock clock) :
    IEligibilityCertificateExpiryJob,
    ITransientDependency
{
    [UnitOfWork]
    public virtual async Task ExecuteAsync()
    {
        var today = clock.Now.Date;
        var query = await certificates.GetQueryableAsync();
        var expired = await asyncExecuter.ToListAsync(
            query.Where(x =>
                x.Status == LicenseStatus.Active &&
                x.ExpiryDate.HasValue &&
                x.ExpiryDate.Value < today),
            cancellationTokens.Token);
        foreach (var certificate in expired)
            certificate.SynchronizeExpiry(today);
        if (expired.Count == 0)
            return;
        await certificates.UpdateManyAsync(
            expired,
            autoSave: true,
            cancellationToken: cancellationTokens.Token);

        var businessIds = expired.Select(x => x.BusinessId)
            .Distinct().ToArray();
        var activeQuery = await certificates.GetQueryableAsync();
        var activeBusinessIds = await asyncExecuter.ToListAsync(
            activeQuery.Where(x =>
                    businessIds.Contains(x.BusinessId) &&
                    x.Status != LicenseStatus.Revoked &&
                    (!x.ExpiryDate.HasValue || x.ExpiryDate.Value >= today))
                .Select(x => x.BusinessId)
                .Distinct(),
            cancellationTokens.Token);
        var businessQuery = await businesses.GetQueryableAsync();
        var affectedBusinesses = await asyncExecuter.ToListAsync(
            businessQuery.Where(x => businessIds.Contains(x.Id)),
            cancellationTokens.Token);
        var activeSet = activeBusinessIds.ToHashSet();
        foreach (var business in affectedBusinesses)
            business.SetCertificateFlags(
                activeSet.Contains(business.Id),
                business.HasVsattpCommitment);
        await businesses.UpdateManyAsync(
            affectedBusinesses,
            autoSave: true,
            cancellationToken: cancellationTokens.Token);
    }
}
