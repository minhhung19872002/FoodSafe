using System.ComponentModel.DataAnnotations;
using System.Globalization;
using FoodSafe.Catalogs;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Caching.Distributed;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Caching;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;
using Volo.Abp.Uow;
using Volo.Abp.Users;

namespace FoodSafe.BusinessManagement;

[RemoteService(false)]
public class ProductExcelAppService : ApplicationService,
    IProductExcelAppService
{
    private const int ExportPageSize = 1000;
    private const int MaximumExportRows = 50_000;
    private readonly IProductAppService _products;
    private readonly ICurrentUser _currentUser;
    private readonly IDistributedCache<ProductImportSession, string> _sessions;
    private readonly IRepository<Product, Guid> _productRepository;
    private readonly IRepository<ProductGroup, Guid> _productGroups;
    private readonly IRepository<Country, Guid> _countries;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public ProductExcelAppService(
        IProductAppService products,
        ICurrentUser currentUser,
        IDistributedCache<ProductImportSession, string> sessions,
        IRepository<Product, Guid> productRepository,
        IRepository<ProductGroup, Guid> productGroups,
        IRepository<Country, Guid> countries,
        ICancellationTokenProvider cancellationTokens)
    {
        _products = products;
        _currentUser = currentUser;
        _sessions = sessions;
        _productRepository = productRepository;
        _productGroups = productGroups;
        _countries = countries;
        _cancellationTokens = cancellationTokens;
    }

    [Authorize(FoodSafePermissions.BusinessManagement.Products.Import)]
    public async Task<ExcelDownloadDto> GetTemplateAsync()
    {
        var catalogs = await LoadCatalogsAsync();
        return new ExcelDownloadDto
        {
            Content = ProductExcelWorkbook.CreateTemplate(catalogs),
            FileName = "mau-import-san-pham.xlsx"
        };
    }

    [Authorize(FoodSafePermissions.BusinessManagement.Products.Import)]
    public async Task<ExcelImportPreviewDto> PreviewAsync(
        byte[] content,
        string fileName)
    {
        var fileError = BusinessExcelAppService.ValidateFile(content, fileName);
        if (fileError is not null) return ErrorPreview(fileError);

        ProductWorkbookReadResult workbook;
        try
        {
            workbook = ProductExcelWorkbook.Read(content);
        }
        catch (Exception exception) when (
            exception is not OperationCanceledException)
        {
            return ErrorPreview(
                "Không thể đọc workbook. Hãy sử dụng đúng file mẫu .xlsx.");
        }

        var errors = workbook.Errors.ToList();
        if (workbook.Rows.Count == 0)
            errors.Add(Error(2, "File", "File không có dòng dữ liệu."));

        var catalogs = await LoadCatalogsAsync();
        var businessMap = catalogs.Businesses
            .Where(x => !string.IsNullOrWhiteSpace(x.Code))
            .ToDictionary(x => x.Code, x => x.Id,
                StringComparer.OrdinalIgnoreCase);
        var groupMap = catalogs.ProductGroups
            .ToDictionary(x => x.Name, x => x.Id,
                StringComparer.OrdinalIgnoreCase);
        var countryMap = catalogs.Countries
            .ToDictionary(x => x.Name, x => x.Id,
                StringComparer.OrdinalIgnoreCase);

        var candidates = new List<(int RowNumber, UpsertProductDto Input)>();
        foreach (var row in workbook.Rows)
        {
            var parsed = ParseRow(row, errors);
            if (parsed is not null)
            {
                ResolveCatalogNames(
                    row, parsed, businessMap, groupMap, countryMap, errors);
                candidates.Add((row.RowNumber, parsed));
            }
        }

        await ValidateUniquenessAsync(candidates, errors);

        var invalidRows = errors
            .Where(x => x.RowNumber > 1)
            .Select(x => x.RowNumber)
            .ToHashSet();
        var validRows = candidates
            .Where(x => !invalidRows.Contains(x.RowNumber))
            .Select(x => x.Input)
            .ToList();
        string? token = null;
        if (errors.Count == 0 && validRows.Count > 0)
        {
            token = Guid.NewGuid().ToString("N");
            await _sessions.SetAsync(
                token,
                new ProductImportSession
                {
                    UserId = _currentUser.GetId(),
                    Rows = validRows
                },
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15)
                },
                token: _cancellationTokens.Token);
        }
        return new ExcelImportPreviewDto
        {
            ConfirmationToken = token,
            TotalRows = workbook.Rows.Count,
            ValidCount = validRows.Count,
            ErrorCount = errors.Count,
            Errors = errors
                .OrderBy(x => x.RowNumber)
                .ThenBy(x => x.Field)
                .ToList()
        };
    }

    [Authorize(FoodSafePermissions.BusinessManagement.Products.Import)]
    [Authorize(FoodSafePermissions.BusinessManagement.Products.Create)]
    [UnitOfWork]
    public async Task<ExcelImportResultDto> ConfirmAsync(
        ConfirmExcelImportDto input)
    {
        var session = await _sessions.GetAsync(
            input.ConfirmationToken,
            token: _cancellationTokens.Token);
        if (session is null || session.UserId != _currentUser.GetId())
        {
            throw new BusinessException("FoodSafe:ProductImport:Expired")
                .WithData(
                    "Message",
                    "Phiên preview đã hết hạn hoặc không thuộc tài khoản hiện tại.");
        }
        await _sessions.RemoveAsync(
            input.ConfirmationToken,
            token: _cancellationTokens.Token);
        foreach (var row in session.Rows) await _products.CreateAsync(row);
        return new ExcelImportResultDto { ImportedCount = session.Rows.Count };
    }

    [Authorize(FoodSafePermissions.BusinessManagement.Products.View)]
    public async Task<ExcelDownloadDto> ExportAsync(ProductListInput input)
    {
        var rows = new List<ProductDto>();
        long total;
        do
        {
            var page = await _products.GetListAsync(new ProductListInput
            {
                Filter = input.Filter,
                BusinessId = input.BusinessId,
                ProductGroupId = input.ProductGroupId,
                Status = input.Status,
                SkipCount = rows.Count,
                MaxResultCount = ExportPageSize
            });
            total = page.TotalCount;
            if (total > MaximumExportRows)
                throw new BusinessException("FoodSafe:ProductExport:TooLarge")
                    .WithData("MaximumRows", MaximumExportRows);
            rows.AddRange(page.Items);
        } while (rows.Count < total);

        var catalogs = await LoadCatalogsAsync();
        return new ExcelDownloadDto
        {
            Content = ProductExcelWorkbook.Export(rows, catalogs),
            FileName = $"danh-sach-san-pham-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    private static void ResolveCatalogNames(
        ProductExcelRow row,
        UpsertProductDto dto,
        Dictionary<string, Guid> businessMap,
        Dictionary<string, Guid> groupMap,
        Dictionary<string, Guid> countryMap,
        ICollection<ExcelImportErrorDto> errors)
    {
        if (string.IsNullOrWhiteSpace(row.BusinessCode))
        {
            errors.Add(Error(
                row.RowNumber,
                "Mã cơ sở",
                "Mã cơ sở là bắt buộc."));
        }
        else if (businessMap.TryGetValue(row.BusinessCode, out var bizId))
        {
            dto.BusinessId = bizId;
        }
        else
        {
            errors.Add(Error(
                row.RowNumber,
                "Mã cơ sở",
                $"Mã cơ sở \"{row.BusinessCode}\" không tồn tại hoặc nằm ngoài phạm vi dữ liệu."));
        }

        if (!string.IsNullOrWhiteSpace(row.ProductGroup))
        {
            if (groupMap.TryGetValue(row.ProductGroup, out var groupId))
                dto.ProductGroupId = groupId;
            else
                errors.Add(Error(
                    row.RowNumber,
                    "Nhóm sản phẩm",
                    $"Nhóm sản phẩm \"{row.ProductGroup}\" không tồn tại."));
        }

        if (!string.IsNullOrWhiteSpace(row.Country))
        {
            if (countryMap.TryGetValue(row.Country, out var countryId))
                dto.ManufacturingCountryId = countryId;
            else
                errors.Add(Error(
                    row.RowNumber,
                    "Quốc gia",
                    $"Quốc gia \"{row.Country}\" không tồn tại."));
        }
    }

    private async Task ValidateUniquenessAsync(
        IReadOnlyList<(int RowNumber, UpsertProductDto Input)> candidates,
        ICollection<ExcelImportErrorDto> errors)
    {
        var duplicateRows = candidates
            .GroupBy(
                x => (x.Input.BusinessId, x.Input.Code!),
                new ProductCodeKeyComparer())
            .Where(x => x.Count() > 1)
            .SelectMany(x => x.Select(row => row.RowNumber))
            .ToHashSet();
        var businessIds = candidates.Select(x => x.Input.BusinessId)
            .Distinct()
            .ToArray();
        var codes = candidates.Select(x => x.Input.Code)
            .Where(x => x is not null)
            .Cast<string>()
            .Distinct()
            .ToArray();
        var query = await _productRepository.GetQueryableAsync();
        var existing = candidates.Count == 0
            ? []
            : (await AsyncExecuter.ToListAsync(
                query.Where(x =>
                        businessIds.Contains(x.BusinessId) &&
                        x.Code != null &&
                        codes.Contains(x.Code))
                    .Select(x => new { x.BusinessId, x.Code }),
                _cancellationTokens.Token))
            .Select(x => (x.BusinessId, x.Code!))
            .ToHashSet(new ProductCodeKeyComparer());
        foreach (var candidate in candidates)
        {
            var key = (candidate.Input.BusinessId, candidate.Input.Code!);
            if (duplicateRows.Contains(candidate.RowNumber))
                errors.Add(Error(
                    candidate.RowNumber,
                    "Code",
                    "Mã sản phẩm bị trùng trong file của cùng cơ sở."));
            else if (existing.Contains(key))
                errors.Add(Error(
                    candidate.RowNumber,
                    "Code",
                    "Mã sản phẩm đã tồn tại tại cơ sở."));
        }
    }

    private static UpsertProductDto? ParseRow(
        ProductExcelRow row,
        ICollection<ExcelImportErrorDto> errors)
    {
        var rowErrors = new List<ExcelImportErrorDto>();
        if (string.IsNullOrWhiteSpace(row.Code))
            rowErrors.Add(Error(
                row.RowNumber,
                "Code",
                "Mã sản phẩm là bắt buộc khi import."));
        if (string.IsNullOrWhiteSpace(row.Name))
            rowErrors.Add(Error(
                row.RowNumber,
                "Name",
                "Tên sản phẩm là bắt buộc."));
        var expiryMonths = ParseOptionalInt(
            row.ExpiryPeriodMonths,
            row.RowNumber,
            rowErrors);
        var input = new UpsertProductDto
        {
            Code = Normalize(row.Code),
            Name = row.Name.Trim(),
            BrandName = EmptyToNull(row.BrandName),
            Manufacturer = EmptyToNull(row.Manufacturer),
            NetWeight = EmptyToNull(row.NetWeight),
            Specifications = EmptyToNull(row.Specifications),
            Ingredients = EmptyToNull(row.Ingredients),
            ExpiryPeriodMonths = expiryMonths,
            StorageConditions = EmptyToNull(row.StorageConditions),
            UsageInstructions = EmptyToNull(row.UsageInstructions),
            Notes = EmptyToNull(row.Notes)
        };
        var validationResults = new List<ValidationResult>();
        if (!Validator.TryValidateObject(
                input,
                new ValidationContext(input),
                validationResults,
                validateAllProperties: true))
            rowErrors.AddRange(validationResults.Select(result => Error(
                row.RowNumber,
                result.MemberNames.FirstOrDefault() ?? "Row",
                result.ErrorMessage ?? "Dữ liệu không hợp lệ.")));
        foreach (var error in rowErrors) errors.Add(error);
        return rowErrors.Count == 0 ? input : null;
    }

    private async Task<ProductCatalogData> LoadCatalogsAsync()
    {
        var ct = _cancellationTokens.Token;

        var businessOptions = await _products.GetBusinessOptionsAsync();
        var businesses = businessOptions
            .Where(x => !string.IsNullOrWhiteSpace(x.Code))
            .Select(x => new BusinessOption(x.Id, x.Code!, x.Name))
            .ToList();

        var groupQuery = await _productGroups.GetQueryableAsync();
        var groups = await AsyncExecuter.ToListAsync(
            groupQuery
                .Where(x => x.IsActive && !x.IsDeleted)
                .OrderBy(x => x.SortOrder)
                .Select(x => new CatalogOption(x.Id, x.Name)),
            ct);

        var countryQuery = await _countries.GetQueryableAsync();
        var countries = await AsyncExecuter.ToListAsync(
            countryQuery
                .Where(x => x.IsActive && !x.IsDeleted)
                .OrderBy(x => x.SortOrder)
                .Select(x => new CatalogOption(x.Id, x.NameVi)),
            ct);

        return new ProductCatalogData(businesses, groups, countries);
    }

    private static int? ParseOptionalInt(
        string value,
        int row,
        ICollection<ExcelImportErrorDto> errors)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        if (int.TryParse(
                value,
                NumberStyles.Integer,
                CultureInfo.InvariantCulture,
                out var parsed) &&
            parsed >= 0)
            return parsed;
        errors.Add(Error(
            row,
            "ExpiryPeriodMonths",
            "Hạn sử dụng phải là số nguyên không âm."));
        return null;
    }

    private static ExcelImportPreviewDto ErrorPreview(string message) =>
        new()
        {
            ErrorCount = 1,
            Errors = [Error(0, "File", message)]
        };

    private static ExcelImportErrorDto Error(
        int row,
        string field,
        string message) =>
        new() { RowNumber = row, Field = field, Message = message };

    private static string? Normalize(string value) =>
        string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim().ToUpperInvariant();

    private static string? EmptyToNull(string value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private sealed class ProductCodeKeyComparer :
        IEqualityComparer<(Guid BusinessId, string Code)>
    {
        public bool Equals(
            (Guid BusinessId, string Code) x,
            (Guid BusinessId, string Code) y) =>
            x.BusinessId == y.BusinessId &&
            StringComparer.OrdinalIgnoreCase.Equals(x.Code, y.Code);

        public int GetHashCode((Guid BusinessId, string Code) obj) =>
            HashCode.Combine(
                obj.BusinessId,
                StringComparer.OrdinalIgnoreCase.GetHashCode(obj.Code));
    }
}

public sealed class ProductImportSession
{
    public Guid UserId { get; set; }
    public List<UpsertProductDto> Rows { get; set; } = [];
}
