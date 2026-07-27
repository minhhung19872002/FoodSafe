using FoodSafe.BusinessManagement;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Linq;
using Volo.Abp.Threading;
using Volo.Abp.Timing;
using Volo.Abp.Uow;

namespace FoodSafe.Licensing;

public interface IProductRegistrationExpiryJob
{
    Task ExecuteAsync();
}

public class ProductRegistrationExpiryJob(
    IRepository<ProductRegistration, Guid> registrations,
    ICancellationTokenProvider cancellationTokens,
    IAsyncQueryableExecuter asyncExecuter,
    IClock clock) :
    IProductRegistrationExpiryJob,
    ITransientDependency
{
    [UnitOfWork]
    public virtual async Task ExecuteAsync()
    {
        var today = clock.Now.Date;
        var query = await registrations.GetQueryableAsync();
        var expired = await asyncExecuter.ToListAsync(
            query.Where(x =>
                x.Status == LicenseStatus.Active &&
                x.ExpiryDate.HasValue &&
                x.ExpiryDate.Value < today),
            cancellationTokens.Token);
        foreach (var registration in expired)
            registration.SynchronizeExpiry(today);
        if (expired.Count > 0)
            await registrations.UpdateManyAsync(
                expired,
                autoSave: true,
                cancellationToken: cancellationTokens.Token);
    }
}
