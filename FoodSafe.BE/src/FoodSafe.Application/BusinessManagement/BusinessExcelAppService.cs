using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.IO.Compression;
using FoodSafe.Catalogs;
using FoodSafe.Permissions;
using FoodSafe.Security;
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
public class BusinessExcelAppService : ApplicationService,
    IBusinessExcelAppService
{
    private const int MaximumFileBytes = 10 * 1024 * 1024;
    private const long MaximumExpandedBytes = 100L * 1024 * 1024;
    private const int MaximumArchiveEntries = 5000;
    private const int ExportPageSize = 1000;
    private const int MaximumExportRows = 50_000;
    private readonly IBusinessAppService _businesses;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICurrentUser _currentUser;
    private readonly IDistributedCache<BusinessImportSession, string> _sessions;
    private readonly IRepository<Business, Guid> _businessRepository;
    private readonly IRepository<BusinessType, Guid> _businessTypes;
    private readonly IRepository<BusinessClassification, Guid> _classifications;
    private readonly IRepository<ProductGroup, Guid> _productGroups;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public BusinessExcelAppService(
        IBusinessAppService businesses,
        ICurrentDataScopeProvider dataScopeProvider,
        ICurrentUser currentUser,
        IDistributedCache<BusinessImportSession, string> sessions,
        IRepository<Business, Guid> businessRepository,
        IRepository<BusinessType, Guid> businessTypes,
        IRepository<BusinessClassification, Guid> classifications,
        IRepository<ProductGroup, Guid> productGroups,
        ICancellationTokenProvider cancellationTokens)
    {
        _businesses = businesses;
        _dataScopeProvider = dataScopeProvider;
        _currentUser = currentUser;
        _sessions = sessions;
        _businessRepository = businessRepository;
        _businessTypes = businessTypes;
        _classifications = classifications;
        _productGroups = productGroups;
        _cancellationTokens = cancellationTokens;
    }

    [Authorize(FoodSafePermissions.BusinessManagement.Businesses.Import)]
    public async Task<ExcelDownloadDto> GetTemplateAsync()
    {
        var catalogs = await LoadCatalogsAsync();
        return new ExcelDownloadDto
        {
            Content = BusinessExcelWorkbook.CreateTemplate(catalogs),
            FileName = "mau-import-co-so.xlsx"
        };
    }

    [Authorize(FoodSafePermissions.BusinessManagement.Businesses.Import)]
    public async Task<ExcelImportPreviewDto> PreviewAsync(
        byte[] content,
        string fileName)
    {
        var fileError = ValidateFile(content, fileName);
        if (fileError is not null)
        {
            return ErrorPreview(fileError);
        }

        WorkbookReadResult workbook;
        try
        {
            workbook = BusinessExcelWorkbook.Read(content);
        }
        catch (Exception exception) when (
            exception is not OperationCanceledException)
        {
            return ErrorPreview(
                "Không thể đọc workbook. Hãy sử dụng đúng file mẫu .xlsx.");
        }

        var errors = workbook.Errors.ToList();
        if (workbook.Rows.Count == 0)
        {
            errors.Add(Error(2, "File", "File không có dòng dữ liệu."));
        }

        var scope = await _dataScopeProvider.GetAsync(DataScopeOperation.Create);
        if (!scope.HomeOrganizationId.HasValue)
        {
            return ErrorPreview(
                "Tài khoản chưa được gắn đơn vị. Không thể import.");
        }
        var organizationId = scope.HomeOrganizationId.Value;

        var catalogs = await LoadCatalogsAsync();
        var typeMap = catalogs.BusinessTypes
            .ToDictionary(x => x.Name, x => x.Id, StringComparer.OrdinalIgnoreCase);
        var classMap = catalogs.Classifications
            .ToDictionary(x => x.Name, x => x.Id, StringComparer.OrdinalIgnoreCase);
        var groupMap = catalogs.ProductGroups
            .ToDictionary(x => x.Name, x => x.Id, StringComparer.OrdinalIgnoreCase);

        var candidates = new List<(int RowNumber, UpsertBusinessDto Input)>();
        foreach (var row in workbook.Rows)
        {
            var parsed = ParseRow(row, errors);
            if (parsed is not null)
            {
                parsed.OrganizationId = organizationId;
                ResolveCatalogNames(
                    row, parsed, typeMap, classMap, groupMap, errors);
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
                new BusinessImportSession
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

    [Authorize(FoodSafePermissions.BusinessManagement.Businesses.Import)]
    [Authorize(FoodSafePermissions.BusinessManagement.Businesses.Create)]
    [UnitOfWork]
    public async Task<ExcelImportResultDto> ConfirmAsync(
        ConfirmExcelImportDto input)
    {
        var session = await _sessions.GetAsync(
            input.ConfirmationToken,
            token: _cancellationTokens.Token);
        if (session is null || session.UserId != _currentUser.GetId())
        {
            throw new BusinessException("FoodSafe:BusinessImport:Expired")
                .WithData(
                    "Message",
                    "Phiên preview đã hết hạn hoặc không thuộc tài khoản hiện tại.");
        }

        await _sessions.RemoveAsync(
            input.ConfirmationToken,
            token: _cancellationTokens.Token);
        foreach (var row in session.Rows)
        {
            await _businesses.CreateAsync(row);
        }
        return new ExcelImportResultDto { ImportedCount = session.Rows.Count };
    }

    [Authorize(FoodSafePermissions.BusinessManagement.Businesses.View)]
    public async Task<ExcelDownloadDto> ExportAsync(BusinessListInput input)
    {
        var rows = new List<BusinessDto>();
        long total;
        do
        {
            var page = await _businesses.GetListAsync(new BusinessListInput
            {
                Filter = input.Filter,
                OrganizationId = input.OrganizationId,
                BusinessTypeId = input.BusinessTypeId,
                BusinessClassificationId = input.BusinessClassificationId,
                Status = input.Status,
                HasEligibilityCertificate = input.HasEligibilityCertificate,
                ProvinceId = input.ProvinceId,
                CommuneId = input.CommuneId,
                Sorting = input.Sorting,
                SkipCount = rows.Count,
                MaxResultCount = ExportPageSize
            });
            total = page.TotalCount;
            if (total > MaximumExportRows)
            {
                throw new BusinessException("FoodSafe:BusinessExport:TooLarge")
                    .WithData("MaximumRows", MaximumExportRows);
            }
            rows.AddRange(page.Items);
        } while (rows.Count < total);

        var catalogs = await LoadCatalogsAsync();
        return new ExcelDownloadDto
        {
            Content = BusinessExcelWorkbook.Export(rows, catalogs),
            FileName = $"danh-sach-co-so-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    private static void ResolveCatalogNames(
        BusinessExcelRow row,
        UpsertBusinessDto dto,
        Dictionary<string, Guid> typeMap,
        Dictionary<string, Guid> classMap,
        Dictionary<string, Guid> groupMap,
        ICollection<ExcelImportErrorDto> errors)
    {
        if (!string.IsNullOrWhiteSpace(row.BusinessType))
        {
            if (typeMap.TryGetValue(row.BusinessType, out var typeId))
                dto.BusinessTypeId = typeId;
            else
                errors.Add(Error(
                    row.RowNumber,
                    "Loại hình",
                    $"Loại hình \"{row.BusinessType}\" không tồn tại."));
        }

        if (!string.IsNullOrWhiteSpace(row.Classification))
        {
            if (classMap.TryGetValue(row.Classification, out var classId))
                dto.BusinessClassificationId = classId;
            else
                errors.Add(Error(
                    row.RowNumber,
                    "Phân loại nguy cơ",
                    $"Phân loại \"{row.Classification}\" không tồn tại."));
        }

        if (!string.IsNullOrWhiteSpace(row.ProductGroups))
        {
            var ids = new List<Guid>();
            foreach (var name in row.ProductGroups.Split(
                         ';',
                         StringSplitOptions.RemoveEmptyEntries |
                         StringSplitOptions.TrimEntries))
            {
                if (groupMap.TryGetValue(name, out var groupId))
                    ids.Add(groupId);
                else
                    errors.Add(Error(
                        row.RowNumber,
                        "Nhóm sản phẩm",
                        $"Nhóm sản phẩm \"{name}\" không tồn tại."));
            }
            dto.ProductGroupIds = ids.Distinct().ToList();
        }
    }

    private async Task ValidateUniquenessAsync(
        IReadOnlyList<(int RowNumber, UpsertBusinessDto Input)> candidates,
        ICollection<ExcelImportErrorDto> errors)
    {
        var duplicateCodes = candidates
            .Where(x => x.Input.Code is not null)
            .GroupBy(x => x.Input.Code!, StringComparer.OrdinalIgnoreCase)
            .Where(x => x.Count() > 1)
            .SelectMany(x => x.Select(row => row.RowNumber))
            .ToHashSet();
        var duplicateTaxCodes = candidates
            .Where(x => x.Input.TaxCode is not null)
            .GroupBy(x => x.Input.TaxCode!, StringComparer.OrdinalIgnoreCase)
            .Where(x => x.Count() > 1)
            .SelectMany(x => x.Select(row => row.RowNumber))
            .ToHashSet();

        var codes = candidates
            .Select(x => x.Input.Code)
            .Where(x => x is not null)
            .Cast<string>()
            .Distinct()
            .ToArray();
        var taxCodes = candidates
            .Select(x => x.Input.TaxCode)
            .Where(x => x is not null)
            .Cast<string>()
            .Distinct()
            .ToArray();
        var query = await _businessRepository.GetQueryableAsync();
        var existingCodes = codes.Length == 0
            ? []
            : (await AsyncExecuter.ToListAsync(
                query.Where(x => x.Code != null && codes.Contains(x.Code))
                    .Select(x => x.Code!),
                _cancellationTokens.Token)).ToHashSet(
                StringComparer.OrdinalIgnoreCase);
        var existingTaxCodes = taxCodes.Length == 0
            ? []
            : (await AsyncExecuter.ToListAsync(
                query.Where(x =>
                        x.TaxCode != null && taxCodes.Contains(x.TaxCode))
                    .Select(x => x.TaxCode!),
                _cancellationTokens.Token)).ToHashSet(
                StringComparer.OrdinalIgnoreCase);

        foreach (var candidate in candidates)
        {
            if (duplicateCodes.Contains(candidate.RowNumber))
                errors.Add(Error(
                    candidate.RowNumber,
                    "Code",
                    "Mã cơ sở bị trùng trong file."));
            else if (candidate.Input.Code is not null &&
                     existingCodes.Contains(candidate.Input.Code))
                errors.Add(Error(
                    candidate.RowNumber,
                    "Code",
                    "Mã cơ sở đã tồn tại."));
            if (duplicateTaxCodes.Contains(candidate.RowNumber))
                errors.Add(Error(
                    candidate.RowNumber,
                    "TaxCode",
                    "Mã số thuế bị trùng trong file."));
            else if (candidate.Input.TaxCode is not null &&
                     existingTaxCodes.Contains(candidate.Input.TaxCode))
                errors.Add(Error(
                    candidate.RowNumber,
                    "TaxCode",
                    "Mã số thuế đã tồn tại."));
        }
    }

    private static UpsertBusinessDto? ParseRow(
        BusinessExcelRow row,
        ICollection<ExcelImportErrorDto> errors)
    {
        var rowErrors = new List<ExcelImportErrorDto>();
        if (string.IsNullOrWhiteSpace(row.Name))
            rowErrors.Add(Error(
                row.RowNumber,
                "Name",
                "Tên cơ sở là bắt buộc."));
        if (string.IsNullOrWhiteSpace(row.Code))
            rowErrors.Add(Error(
                row.RowNumber,
                "Code",
                "Mã cơ sở là bắt buộc khi import."));

        var latitude = ParseOptionalDouble(
            row.Latitude,
            row.RowNumber,
            "Latitude",
            -90,
            90,
            rowErrors);
        var longitude = ParseOptionalDouble(
            row.Longitude,
            row.RowNumber,
            "Longitude",
            -180,
            180,
            rowErrors);
        if (latitude.HasValue != longitude.HasValue)
            rowErrors.Add(Error(
                row.RowNumber,
                "Latitude/Longitude",
                "Phải nhập đồng thời vĩ độ và kinh độ."));

        var input = new UpsertBusinessDto
        {
            Code = Normalize(row.Code),
            Name = row.Name.Trim(),
            TaxCode = Normalize(row.TaxCode),
            AddressStreet = EmptyToNull(row.Address),
            ContactPhone = EmptyToNull(row.Phone),
            ContactEmail = EmptyToNull(row.Email),
            AddressLatitude = latitude,
            AddressLongitude = longitude,
        };
        var context = new ValidationContext(input);
        var validationResults = new List<ValidationResult>();
        if (!Validator.TryValidateObject(
                input,
                context,
                validationResults,
                validateAllProperties: true))
        {
            rowErrors.AddRange(validationResults.Select(result => Error(
                row.RowNumber,
                result.MemberNames.FirstOrDefault() ?? "Row",
                result.ErrorMessage ?? "Dữ liệu không hợp lệ.")));
        }
        foreach (var error in rowErrors)
        {
            errors.Add(error);
        }
        return rowErrors.Count == 0 ? input : null;
    }

    private async Task<CatalogData> LoadCatalogsAsync()
    {
        var ct = _cancellationTokens.Token;
        var typeQuery = await _businessTypes.GetQueryableAsync();
        var classQuery = await _classifications.GetQueryableAsync();
        var groupQuery = await _productGroups.GetQueryableAsync();

        var types = await AsyncExecuter.ToListAsync(
            typeQuery
                .Where(x => x.IsActive && !x.IsDeleted)
                .OrderBy(x => x.SortOrder)
                .Select(x => new CatalogOption(x.Id, x.Name)),
            ct);
        var classifications = await AsyncExecuter.ToListAsync(
            classQuery
                .Where(x => x.IsActive && !x.IsDeleted)
                .OrderBy(x => x.SortOrder)
                .Select(x => new CatalogOption(x.Id, x.Name)),
            ct);
        var groups = await AsyncExecuter.ToListAsync(
            groupQuery
                .Where(x => x.IsActive && !x.IsDeleted)
                .OrderBy(x => x.SortOrder)
                .Select(x => new CatalogOption(x.Id, x.Name)),
            ct);

        return new CatalogData(types, classifications, groups);
    }

    private static double? ParseOptionalDouble(
        string value,
        int row,
        string field,
        double minimum,
        double maximum,
        ICollection<ExcelImportErrorDto> errors)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        if (double.TryParse(
                value,
                NumberStyles.Float,
                CultureInfo.InvariantCulture,
                out var parsed) &&
            parsed >= minimum &&
            parsed <= maximum)
            return parsed;
        errors.Add(Error(
            row,
            field,
            $"{field} phải nằm trong khoảng {minimum} đến {maximum}."));
        return null;
    }

    internal static string? ValidateFile(byte[] content, string fileName)
    {
        if (!Path.GetExtension(fileName).Equals(
                ".xlsx",
                StringComparison.OrdinalIgnoreCase))
            return "Chỉ chấp nhận file Excel định dạng .xlsx.";
        if (content.Length == 0)
            return "File Excel rỗng.";
        if (content.Length > MaximumFileBytes)
            return "File Excel không được vượt quá 10 MB.";
        if (content.Length < 4 || content[0] != (byte)'P' ||
            content[1] != (byte)'K')
            return "Nội dung file không đúng chữ ký workbook .xlsx.";
        try
        {
            using var stream = new MemoryStream(content, writable: false);
            using var archive = new ZipArchive(
                stream,
                ZipArchiveMode.Read,
                leaveOpen: false);
            if (archive.Entries.Count > MaximumArchiveEntries)
                return "Workbook chứa quá nhiều thành phần nén.";
            long expandedBytes = 0;
            foreach (var entry in archive.Entries)
            {
                expandedBytes += entry.Length;
                if (expandedBytes > MaximumExpandedBytes)
                    return "Dung lượng giải nén của workbook vượt quá 100 MB.";
            }
        }
        catch (InvalidDataException)
        {
            return "Cấu trúc nén của workbook .xlsx không hợp lệ.";
        }
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
}

public sealed class BusinessImportSession
{
    public Guid UserId { get; set; }
    public List<UpsertBusinessDto> Rows { get; set; } = [];
}
