using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Text.Json;
using FoodSafe.BusinessManagement;
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

namespace FoodSafe.Catalogs;

/// <summary>
/// Tải file mẫu và import Excel cho toàn bộ danh mục dùng chung. Việc ghi dữ
/// liệu luôn đi qua <see cref="IMasterCatalogAppService"/> để giữ nguyên các
/// invariant của domain (trùng mã, phân cấp nhóm sản phẩm, địa giới...).
/// </summary>
[RemoteService(false)]
public class MasterCatalogExcelAppService :
    ApplicationService,
    IMasterCatalogExcelAppService
{
    private const int LookupPageSize = 2000;
    private const int MaximumImportRows = 2000;

    private readonly IMasterCatalogAppService _catalogs;
    private readonly ICurrentUser _currentUser;
    private readonly IDistributedCache<MasterCatalogImportSession, string> _sessions;
    private readonly IRepository<Country, Guid> _countries;
    private readonly IRepository<Region, Guid> _regions;
    private readonly IRepository<Province, Guid> _provinces;
    private readonly IRepository<Commune, Guid> _communes;
    private readonly IRepository<ProductGroup, Guid> _productGroups;
    private readonly IRepository<BusinessType, Guid> _businessTypes;
    private readonly IRepository<BusinessClassification, Guid> _classifications;
    private readonly IRepository<AdvertisementType, Guid> _advertisementTypes;
    private readonly IRepository<DocumentType, Guid> _documentTypes;
    private readonly IRepository<TestingCenter, Guid> _testingCenters;
    private readonly IRepository<TestingService, Guid> _testingServices;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public MasterCatalogExcelAppService(
        IMasterCatalogAppService catalogs,
        ICurrentUser currentUser,
        IDistributedCache<MasterCatalogImportSession, string> sessions,
        IRepository<Country, Guid> countries,
        IRepository<Region, Guid> regions,
        IRepository<Province, Guid> provinces,
        IRepository<Commune, Guid> communes,
        IRepository<ProductGroup, Guid> productGroups,
        IRepository<BusinessType, Guid> businessTypes,
        IRepository<BusinessClassification, Guid> classifications,
        IRepository<AdvertisementType, Guid> advertisementTypes,
        IRepository<DocumentType, Guid> documentTypes,
        IRepository<TestingCenter, Guid> testingCenters,
        IRepository<TestingService, Guid> testingServices,
        ICancellationTokenProvider cancellationTokens)
    {
        _catalogs = catalogs;
        _currentUser = currentUser;
        _sessions = sessions;
        _countries = countries;
        _regions = regions;
        _provinces = provinces;
        _communes = communes;
        _productGroups = productGroups;
        _businessTypes = businessTypes;
        _classifications = classifications;
        _advertisementTypes = advertisementTypes;
        _documentTypes = documentTypes;
        _testingCenters = testingCenters;
        _testingServices = testingServices;
        _cancellationTokens = cancellationTokens;
    }

    [Authorize(FoodSafePermissions.Catalogs.Create)]
    public async Task<ExcelDownloadDto> GetTemplateAsync(MasterCatalogKind kind)
    {
        var definition = MasterCatalogExcelWorkbook.GetDefinition(kind);
        var references = await LoadReferencesAsync(kind);
        return new ExcelDownloadDto
        {
            Content = MasterCatalogExcelWorkbook.CreateTemplate(
                kind,
                references.ToLookups()),
            FileName = $"mau-import-{definition.FileSlug}.xlsx"
        };
    }

    [Authorize(FoodSafePermissions.Catalogs.Create)]
    public async Task<ExcelImportPreviewDto> PreviewAsync(
        MasterCatalogKind kind,
        byte[] content,
        string fileName)
    {
        var fileError = BusinessExcelAppService.ValidateFile(content, fileName);
        if (fileError is not null)
        {
            return ErrorPreview(fileError);
        }

        CatalogWorkbookReadResult workbook;
        try
        {
            workbook = MasterCatalogExcelWorkbook.Read(kind, content);
        }
        catch (Exception exception) when (
            exception is not OperationCanceledException)
        {
            return ErrorPreview(
                "Không thể đọc workbook. Hãy sử dụng đúng file mẫu .xlsx.");
        }

        var errors = workbook.Errors.ToList();
        if (errors.Count > 0)
        {
            return Preview(null, workbook.Rows.Count, 0, errors);
        }
        if (workbook.Rows.Count == 0)
        {
            return ErrorPreview("File không có dòng dữ liệu.");
        }
        if (workbook.Rows.Count > MaximumImportRows)
        {
            return ErrorPreview(
                $"File vượt quá {MaximumImportRows} dòng. Hãy chia nhỏ file.");
        }

        var references = await LoadReferencesAsync(kind);
        var candidates = new List<(int RowNumber, object Input)>();
        foreach (var row in workbook.Rows)
        {
            var parsed = ParseRow(kind, row, references, errors);
            if (parsed is not null)
            {
                candidates.Add((row.RowNumber, parsed));
            }
        }

        ValidateCodeUniqueness(kind, workbook.Rows, errors);
        await ValidateExistingCodesAsync(kind, workbook.Rows, candidates, errors);

        var invalidRows = errors
            .Where(x => x.RowNumber > 1)
            .Select(x => x.RowNumber)
            .ToHashSet();
        var validRows = candidates
            .Where(x => !invalidRows.Contains(x.RowNumber))
            .Select(x => JsonSerializer.Serialize(x.Input, x.Input.GetType()))
            .ToList();

        string? token = null;
        if (errors.Count == 0 && validRows.Count > 0)
        {
            token = Guid.NewGuid().ToString("N");
            await _sessions.SetAsync(
                token,
                new MasterCatalogImportSession
                {
                    UserId = _currentUser.GetId(),
                    Kind = kind,
                    Payloads = validRows
                },
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15)
                },
                token: _cancellationTokens.Token);
        }

        return Preview(token, workbook.Rows.Count, validRows.Count, errors);
    }

    [Authorize(FoodSafePermissions.Catalogs.Create)]
    [UnitOfWork]
    public async Task<ExcelImportResultDto> ConfirmAsync(
        ConfirmExcelImportDto input)
    {
        var session = await _sessions.GetAsync(
            input.ConfirmationToken,
            token: _cancellationTokens.Token);
        if (session is null || session.UserId != _currentUser.GetId())
        {
            throw new BusinessException("FoodSafe:CatalogImport:Expired")
                .WithData(
                    "Message",
                    "Phiên preview đã hết hạn hoặc không thuộc tài khoản hiện tại.");
        }

        await _sessions.RemoveAsync(
            input.ConfirmationToken,
            token: _cancellationTokens.Token);

        foreach (var payload in session.Payloads)
        {
            await CreateAsync(session.Kind, payload);
        }
        return new ExcelImportResultDto { ImportedCount = session.Payloads.Count };
    }

    private Task CreateAsync(MasterCatalogKind kind, string payload) => kind switch
    {
        MasterCatalogKind.Country =>
            _catalogs.CreateCountryAsync(Deserialize<UpsertCountryDto>(payload)),
        MasterCatalogKind.Region =>
            _catalogs.CreateRegionAsync(Deserialize<UpsertRegionDto>(payload)),
        MasterCatalogKind.ProductGroup =>
            _catalogs.CreateProductGroupAsync(
                Deserialize<UpsertProductGroupDto>(payload)),
        MasterCatalogKind.BusinessType =>
            _catalogs.CreateBusinessTypeAsync(
                Deserialize<UpsertMasterCatalogDto>(payload)),
        MasterCatalogKind.BusinessClassification =>
            _catalogs.CreateBusinessClassificationAsync(
                Deserialize<UpsertBusinessClassificationDto>(payload)),
        MasterCatalogKind.AdvertisementType =>
            _catalogs.CreateAdvertisementTypeAsync(
                Deserialize<UpsertMasterCatalogDto>(payload)),
        MasterCatalogKind.DocumentType =>
            _catalogs.CreateDocumentTypeAsync(
                Deserialize<UpsertMasterCatalogDto>(payload)),
        MasterCatalogKind.TestingCenter =>
            _catalogs.CreateTestingCenterAsync(
                Deserialize<UpsertTestingCenterDto>(payload)),
        MasterCatalogKind.TestingService =>
            _catalogs.CreateTestingServiceAsync(
                Deserialize<UpsertTestingServiceDto>(payload)),
        _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, null)
    };

    private static T Deserialize<T>(string payload) =>
        JsonSerializer.Deserialize<T>(payload)
        ?? throw new BusinessException("FoodSafe:CatalogImport:Corrupted");

    private object? ParseRow(
        MasterCatalogKind kind,
        CatalogRow row,
        CatalogReferenceData references,
        ICollection<ExcelImportErrorDto> errors)
    {
        var rowErrors = new List<ExcelImportErrorDto>();
        var definition = MasterCatalogExcelWorkbook.GetDefinition(kind);
        foreach (var column in definition.Columns.Where(x => x.Required))
        {
            if (string.IsNullOrWhiteSpace(row.Get(column.Field)))
            {
                rowErrors.Add(Error(
                    row.RowNumber,
                    column.Header,
                    $"\"{column.Header}\" là bắt buộc."));
            }
        }

        object? input = kind switch
        {
            MasterCatalogKind.Country => new UpsertCountryDto
            {
                CodeAlpha2 = row.Get("CodeAlpha2").ToUpperInvariant(),
                CodeAlpha3 = EmptyToNull(row.Get("CodeAlpha3"))?.ToUpperInvariant(),
                NameVi = row.Get("NameVi"),
                NameEn = EmptyToNull(row.Get("NameEn")),
                SortOrder = ParseSortOrder(row, rowErrors),
                IsActive = ParseActive(row, rowErrors)
            },
            MasterCatalogKind.Region => new UpsertRegionDto
            {
                Code = NormalizeCode(row.Get("Code")),
                Name = row.Get("Name"),
                Description = EmptyToNull(row.Get("Description")),
                SortOrder = ParseSortOrder(row, rowErrors),
                IsActive = ParseActive(row, rowErrors)
            },
            MasterCatalogKind.ProductGroup => new UpsertProductGroupDto
            {
                Code = NormalizeCode(row.Get("Code")),
                Name = row.Get("Name"),
                Level = ParseLevel(row, rowErrors),
                ParentId = ResolveParentGroup(row, references, rowErrors),
                Description = EmptyToNull(row.Get("Description")),
                SortOrder = ParseSortOrder(row, rowErrors),
                IsActive = ParseActive(row, rowErrors)
            },
            MasterCatalogKind.BusinessClassification =>
                new UpsertBusinessClassificationDto
                {
                    Code = NormalizeCode(row.Get("Code")),
                    Name = row.Get("Name"),
                    RiskLevel = ParseRiskLevel(row, rowErrors),
                    Criteria = row.Get("Criteria"),
                    Description = EmptyToNull(row.Get("Description")),
                    SortOrder = ParseSortOrder(row, rowErrors),
                    IsActive = ParseActive(row, rowErrors)
                },
            MasterCatalogKind.TestingCenter => BuildTestingCenter(
                row, references, rowErrors),
            MasterCatalogKind.TestingService => new UpsertTestingServiceDto
            {
                Code = NormalizeCode(row.Get("Code")),
                Name = row.Get("Name"),
                TestingCenterId = ResolveLookupId(
                    row,
                    "TestingCenterName",
                    "Trung tâm kiểm nghiệm*",
                    references.TestingCenters,
                    rowErrors) ?? Guid.Empty,
                Unit = row.Get("Unit"),
                Method = row.Get("Method"),
                Price = ParseDecimal(row, "Price", "Đơn giá (VND)", rowErrors),
                TurnaroundDays = ParseInteger(
                    row, "TurnaroundDays", "Thời gian trả KQ (ngày)", 0, 3650,
                    rowErrors),
                Description = EmptyToNull(row.Get("Description")),
                SortOrder = ParseSortOrder(row, rowErrors),
                IsActive = ParseActive(row, rowErrors)
            },
            _ => new UpsertMasterCatalogDto
            {
                Code = NormalizeCode(row.Get("Code")),
                Name = row.Get("Name"),
                Description = EmptyToNull(row.Get("Description")),
                SortOrder = ParseSortOrder(row, rowErrors),
                IsActive = ParseActive(row, rowErrors)
            }
        };

        if (input is not null)
        {
            var validationResults = new List<ValidationResult>();
            if (!Validator.TryValidateObject(
                    input,
                    new ValidationContext(input),
                    validationResults,
                    validateAllProperties: true))
            {
                rowErrors.AddRange(validationResults.Select(result => Error(
                    row.RowNumber,
                    result.MemberNames.FirstOrDefault() ?? "Dòng",
                    result.ErrorMessage ?? "Dữ liệu không hợp lệ.")));
            }
        }

        foreach (var error in rowErrors)
        {
            errors.Add(error);
        }
        return rowErrors.Count == 0 ? input : null;
    }

    private UpsertTestingCenterDto BuildTestingCenter(
        CatalogRow row,
        CatalogReferenceData references,
        ICollection<ExcelImportErrorDto> rowErrors)
    {
        var provinceId = ResolveLookupId(
            row, "ProvinceName", "Tỉnh/Thành phố*", references.Provinces, rowErrors);
        Guid? communeId = null;
        var communeName = row.Get("CommuneName");
        if (!string.IsNullOrWhiteSpace(communeName))
        {
            communeId = ResolveLookupId(
                row, "CommuneName", "Phường/Xã", references.Communes, rowErrors);
            if (communeId.HasValue &&
                provinceId.HasValue &&
                references.CommuneProvinces.TryGetValue(
                    communeId.Value, out var owner) &&
                owner != provinceId.Value)
            {
                rowErrors.Add(Error(
                    row.RowNumber,
                    "Phường/Xã",
                    $"\"{communeName}\" không thuộc tỉnh/thành phố đã chọn."));
            }
        }

        return new UpsertTestingCenterDto
        {
            Code = NormalizeCode(row.Get("Code")),
            Name = row.Get("Name"),
            Address = row.Get("Address"),
            ProvinceId = provinceId ?? Guid.Empty,
            CommuneId = communeId,
            ContactPerson = EmptyToNull(row.Get("ContactPerson")),
            Phone = EmptyToNull(row.Get("Phone")),
            Email = EmptyToNull(row.Get("Email")),
            AccreditationNumber = row.Get("AccreditationNumber"),
            AccreditationScope = row.Get("AccreditationScope"),
            AccreditationExpiresAt = ParseDate(
                row, "AccreditationExpiresAt", "Hết hạn công nhận*", rowErrors),
            Description = EmptyToNull(row.Get("Description")),
            SortOrder = ParseSortOrder(row, rowErrors),
            IsActive = ParseActive(row, rowErrors)
        };
    }

    private static string CodeField(MasterCatalogKind kind) =>
        kind == MasterCatalogKind.Country ? "CodeAlpha2" : "Code";

    private static string CodeHeader(MasterCatalogKind kind) =>
        MasterCatalogExcelWorkbook.GetDefinition(kind).Columns
            .First(x => x.Field == CodeField(kind))
            .Header;

    // Trùng mã trong cùng file không bị domain phát hiện (mỗi dòng là một lệnh
    // Create riêng) nên phải chặn ngay ở bước preview.
    private static void ValidateCodeUniqueness(
        MasterCatalogKind kind,
        IReadOnlyList<CatalogRow> rows,
        ICollection<ExcelImportErrorDto> errors)
    {
        var codeField = CodeField(kind);
        var header = CodeHeader(kind);

        // Mã dịch vụ kiểm nghiệm chỉ cần duy nhất trong cùng một trung tâm.
        var duplicates = rows
            .Where(x => !string.IsNullOrWhiteSpace(x.Get(codeField)))
            .GroupBy(
                x => kind == MasterCatalogKind.TestingService
                    ? $"{x.Get("TestingCenterName").Trim()}|{x.Get(codeField).Trim()}"
                    : x.Get(codeField).Trim(),
                StringComparer.OrdinalIgnoreCase)
            .Where(group => group.Count() > 1)
            .SelectMany(group => group.Select(row => row.RowNumber))
            .ToHashSet();

        foreach (var rowNumber in duplicates.OrderBy(x => x))
        {
            errors.Add(Error(rowNumber, header, $"{header} bị trùng trong file."));
        }
    }

    // Nếu để domain phát hiện trùng mã ở bước Confirm thì cả UnitOfWork bị rollback
    // và người dùng không biết dòng nào sai — phải báo ngay tại preview.
    private async Task ValidateExistingCodesAsync(
        MasterCatalogKind kind,
        IReadOnlyList<CatalogRow> rows,
        IReadOnlyList<(int RowNumber, object Input)> candidates,
        ICollection<ExcelImportErrorDto> errors)
    {
        var codeField = CodeField(kind);
        var header = CodeHeader(kind);
        var codes = rows
            .Select(x => x.Get(codeField).Trim().ToUpperInvariant())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct()
            .ToArray();
        if (codes.Length == 0) return;

        // Dịch vụ kiểm nghiệm: mã chỉ trùng khi cùng trung tâm, nên so theo cặp
        // (TestingCenterId, Code) lấy từ DTO đã phân giải được ở bước ParseRow.
        if (kind == MasterCatalogKind.TestingService)
        {
            var existing = await AsyncExecuter.ToListAsync(
                (await _testingServices.GetQueryableAsync())
                    .Where(x => codes.Contains(x.Code))
                    .Select(x => new ValueTuple<Guid, string>(x.TestingCenterId, x.Code)),
                _cancellationTokens.Token);
            var taken = existing.ToHashSet();
            foreach (var candidate in candidates)
            {
                if (candidate.Input is not UpsertTestingServiceDto service) continue;
                if (taken.Contains((service.TestingCenterId, service.Code)))
                {
                    errors.Add(Error(
                        candidate.RowNumber,
                        header,
                        $"{header} đã tồn tại trong trung tâm kiểm nghiệm này."));
                }
            }
            return;
        }

        var existingCodes = (await LoadExistingCodesAsync(kind, codes))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        foreach (var row in rows)
        {
            var code = row.Get(codeField).Trim();
            if (!string.IsNullOrWhiteSpace(code) && existingCodes.Contains(code))
            {
                errors.Add(Error(row.RowNumber, header, $"{header} đã tồn tại."));
            }
        }
    }

    private async Task<List<string>> LoadExistingCodesAsync(
        MasterCatalogKind kind,
        string[] codes)
    {
        var ct = _cancellationTokens.Token;
        return kind switch
        {
            MasterCatalogKind.Country => await AsyncExecuter.ToListAsync(
                (await _countries.GetQueryableAsync())
                    .Where(x => codes.Contains(x.CodeAlpha2))
                    .Select(x => x.CodeAlpha2),
                ct),
            MasterCatalogKind.Region => await AreaCodesAsync(_regions),
            MasterCatalogKind.ProductGroup => await MasterCodesAsync(_productGroups),
            MasterCatalogKind.BusinessType => await MasterCodesAsync(_businessTypes),
            MasterCatalogKind.BusinessClassification =>
                await MasterCodesAsync(_classifications),
            MasterCatalogKind.AdvertisementType =>
                await MasterCodesAsync(_advertisementTypes),
            MasterCatalogKind.DocumentType => await MasterCodesAsync(_documentTypes),
            MasterCatalogKind.TestingCenter => await MasterCodesAsync(_testingCenters),
            _ => []
        };

        async Task<List<string>> MasterCodesAsync<TEntity>(
            IRepository<TEntity, Guid> repository)
            where TEntity : MasterCatalog =>
            await AsyncExecuter.ToListAsync(
                (await repository.GetQueryableAsync())
                    .Where(x => codes.Contains(x.Code))
                    .Select(x => x.Code),
                ct);

        async Task<List<string>> AreaCodesAsync<TEntity>(
            IRepository<TEntity, Guid> repository)
            where TEntity : AdministrativeArea =>
            await AsyncExecuter.ToListAsync(
                (await repository.GetQueryableAsync())
                    .Where(x => codes.Contains(x.Code))
                    .Select(x => x.Code),
                ct);
    }

    private Guid? ResolveParentGroup(
        CatalogRow row,
        CatalogReferenceData references,
        ICollection<ExcelImportErrorDto> rowErrors)
    {
        var name = row.Get("ParentName");
        if (string.IsNullOrWhiteSpace(name)) return null;
        return ResolveLookupId(
            row, "ParentName", "Nhóm cha", references.ParentProductGroups, rowErrors);
    }

    private static Guid? ResolveLookupId(
        CatalogRow row,
        string field,
        string header,
        IReadOnlyDictionary<string, Guid> lookup,
        ICollection<ExcelImportErrorDto> rowErrors)
    {
        var name = row.Get(field).Trim();
        if (string.IsNullOrWhiteSpace(name)) return null;
        if (lookup.TryGetValue(name, out var id)) return id;
        rowErrors.Add(Error(
            row.RowNumber,
            header,
            $"\"{name}\" không tồn tại trong hệ thống."));
        return null;
    }

    private static short ParseLevel(
        CatalogRow row,
        ICollection<ExcelImportErrorDto> rowErrors)
    {
        var raw = row.Get("Level");
        if (short.TryParse(raw, out var level) && level is 1 or 2)
        {
            if (level == 2 && string.IsNullOrWhiteSpace(row.Get("ParentName")))
            {
                rowErrors.Add(Error(
                    row.RowNumber,
                    "Nhóm cha",
                    "Nhóm cấp 2 phải chọn nhóm cha."));
            }
            if (level == 1 && !string.IsNullOrWhiteSpace(row.Get("ParentName")))
            {
                rowErrors.Add(Error(
                    row.RowNumber,
                    "Nhóm cha",
                    "Nhóm cấp 1 không được có nhóm cha."));
            }
            return level;
        }
        if (!string.IsNullOrWhiteSpace(raw))
        {
            rowErrors.Add(Error(row.RowNumber, "Cấp*", "Cấp chỉ nhận giá trị 1 hoặc 2."));
        }
        return 1;
    }

    private static BusinessRiskLevel ParseRiskLevel(
        CatalogRow row,
        ICollection<ExcelImportErrorDto> rowErrors)
    {
        var raw = row.Get("RiskLevel").Trim();
        if (string.IsNullOrWhiteSpace(raw)) return BusinessRiskLevel.Medium;
        if (RiskLevelNames.TryGetValue(raw, out var level)) return level;
        rowErrors.Add(Error(
            row.RowNumber,
            "Rủi ro*",
            "Rủi ro chỉ nhận giá trị Cao, Trung bình hoặc Thấp."));
        return BusinessRiskLevel.Medium;
    }

    private static DateTime ParseDate(
        CatalogRow row,
        string field,
        string header,
        ICollection<ExcelImportErrorDto> rowErrors)
    {
        var raw = row.Get(field).Trim();
        if (string.IsNullOrWhiteSpace(raw)) return default;
        string[] formats = ["dd/MM/yyyy", "d/M/yyyy", "yyyy-MM-dd", "MM/dd/yyyy"];
        if (DateTime.TryParseExact(
                raw,
                formats,
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out var parsed))
        {
            return DateTime.SpecifyKind(parsed, DateTimeKind.Utc);
        }
        rowErrors.Add(Error(
            row.RowNumber,
            header,
            $"{header} phải theo định dạng dd/MM/yyyy."));
        return default;
    }

    private static int ParseSortOrder(
        CatalogRow row,
        ICollection<ExcelImportErrorDto> rowErrors) =>
        ParseInteger(row, "SortOrder", "Thứ tự", 0, int.MaxValue, rowErrors);

    private static int ParseInteger(
        CatalogRow row,
        string field,
        string header,
        int minimum,
        int maximum,
        ICollection<ExcelImportErrorDto> rowErrors)
    {
        var raw = row.Get(field).Trim();
        if (string.IsNullOrWhiteSpace(raw)) return 0;
        if (int.TryParse(
                raw,
                NumberStyles.Integer,
                CultureInfo.InvariantCulture,
                out var parsed) &&
            parsed >= minimum &&
            parsed <= maximum)
        {
            return parsed;
        }
        rowErrors.Add(Error(
            row.RowNumber,
            header,
            $"{header} phải là số nguyên từ {minimum} đến {maximum}."));
        return 0;
    }

    private static decimal ParseDecimal(
        CatalogRow row,
        string field,
        string header,
        ICollection<ExcelImportErrorDto> rowErrors)
    {
        var raw = row.Get(field).Trim().Replace(",", string.Empty);
        if (string.IsNullOrWhiteSpace(raw)) return 0;
        if (decimal.TryParse(
                raw,
                NumberStyles.Float,
                CultureInfo.InvariantCulture,
                out var parsed) &&
            parsed >= 0)
        {
            return parsed;
        }
        rowErrors.Add(Error(row.RowNumber, header, $"{header} phải là số không âm."));
        return 0;
    }

    private static bool ParseActive(
        CatalogRow row,
        ICollection<ExcelImportErrorDto> rowErrors)
    {
        var raw = row.Get("IsActive").Trim();
        if (string.IsNullOrWhiteSpace(raw)) return true;
        if (TrueValues.Contains(raw)) return true;
        if (FalseValues.Contains(raw)) return false;
        rowErrors.Add(Error(
            row.RowNumber,
            "Trạng thái",
            "Trạng thái chỉ nhận giá trị \"Có\" hoặc \"Không\"."));
        return true;
    }

    private async Task<CatalogReferenceData> LoadReferencesAsync(
        MasterCatalogKind kind)
    {
        var provinces = new List<(Guid Id, string Name)>();
        var communes = new List<(Guid Id, string Name, Guid ProvinceId)>();
        var parentGroups = new List<(Guid Id, string Name)>();
        var testingCenters = new List<(Guid Id, string Name)>();
        var ct = _cancellationTokens.Token;

        if (kind == MasterCatalogKind.TestingCenter)
        {
            provinces = await AsyncExecuter.ToListAsync(
                (await _provinces.GetQueryableAsync())
                    .Where(x => x.IsActive)
                    .OrderBy(x => x.SortOrder).ThenBy(x => x.Name)
                    .Take(LookupPageSize)
                    .Select(x => new ValueTuple<Guid, string>(x.Id, x.Name)),
                ct);
            communes = await AsyncExecuter.ToListAsync(
                (await _communes.GetQueryableAsync())
                    .Where(x => x.IsActive)
                    .OrderBy(x => x.SortOrder).ThenBy(x => x.Name)
                    .Take(LookupPageSize)
                    .Select(x => new ValueTuple<Guid, string, Guid>(
                        x.Id, x.Name, x.ProvinceId)),
                ct);
        }
        if (kind == MasterCatalogKind.ProductGroup)
        {
            parentGroups = await AsyncExecuter.ToListAsync(
                (await _productGroups.GetQueryableAsync())
                    .Where(x => x.IsActive && x.Level == 1)
                    .OrderBy(x => x.SortOrder).ThenBy(x => x.Name)
                    .Take(LookupPageSize)
                    .Select(x => new ValueTuple<Guid, string>(x.Id, x.Name)),
                ct);
        }
        if (kind == MasterCatalogKind.TestingService)
        {
            testingCenters = await AsyncExecuter.ToListAsync(
                (await _testingCenters.GetQueryableAsync())
                    .Where(x => x.IsActive)
                    .OrderBy(x => x.SortOrder).ThenBy(x => x.Name)
                    .Take(LookupPageSize)
                    .Select(x => new ValueTuple<Guid, string>(x.Id, x.Name)),
                ct);
        }

        return new CatalogReferenceData(
            kind, provinces, communes, parentGroups, testingCenters);
    }

    private static ExcelImportPreviewDto Preview(
        string? token,
        int totalRows,
        int validCount,
        IReadOnlyCollection<ExcelImportErrorDto> errors) =>
        new()
        {
            ConfirmationToken = token,
            TotalRows = totalRows,
            ValidCount = validCount,
            ErrorCount = errors.Count,
            Errors = errors
                .OrderBy(x => x.RowNumber)
                .ThenBy(x => x.Field)
                .ToList()
        };

    private static ExcelImportPreviewDto ErrorPreview(string message) =>
        new()
        {
            ErrorCount = 1,
            Errors = [Error(0, "File", message)]
        };

    private static ExcelImportErrorDto Error(int row, string field, string message) =>
        new() { RowNumber = row, Field = field, Message = message };

    private static string NormalizeCode(string value) =>
        value.Trim().ToUpperInvariant();

    private static string? EmptyToNull(string value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static readonly HashSet<string> TrueValues =
        new(StringComparer.OrdinalIgnoreCase)
            { "Có", "Co", "true", "1", "x", "Hoạt động" };

    private static readonly HashSet<string> FalseValues =
        new(StringComparer.OrdinalIgnoreCase)
            { "Không", "Khong", "false", "0", "Ngừng" };

    private static readonly Dictionary<string, BusinessRiskLevel> RiskLevelNames =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["Cao"] = BusinessRiskLevel.High,
            ["Trung bình"] = BusinessRiskLevel.Medium,
            ["Trung binh"] = BusinessRiskLevel.Medium,
            ["Thấp"] = BusinessRiskLevel.Low,
            ["Thap"] = BusinessRiskLevel.Low
        };

    private sealed record CatalogReferenceData(
        MasterCatalogKind Kind,
        IReadOnlyList<(Guid Id, string Name)> ProvinceItems,
        IReadOnlyList<(Guid Id, string Name, Guid ProvinceId)> CommuneItems,
        IReadOnlyList<(Guid Id, string Name)> ParentGroupItems,
        IReadOnlyList<(Guid Id, string Name)> TestingCenterItems)
    {
        internal IReadOnlyDictionary<string, Guid> Provinces { get; } =
            ToMap(ProvinceItems);

        internal IReadOnlyDictionary<string, Guid> Communes { get; } =
            ToMap(CommuneItems.Select(x => (x.Id, x.Name)).ToList());

        internal IReadOnlyDictionary<string, Guid> ParentProductGroups { get; } =
            ToMap(ParentGroupItems);

        internal IReadOnlyDictionary<string, Guid> TestingCenters { get; } =
            ToMap(TestingCenterItems);

        internal IReadOnlyDictionary<Guid, Guid> CommuneProvinces { get; } =
            CommuneItems
                .GroupBy(x => x.Id)
                .ToDictionary(x => x.Key, x => x.First().ProvinceId);

        internal IReadOnlyList<CatalogLookup> ToLookups() => Kind switch
        {
            MasterCatalogKind.TestingCenter =>
            [
                new CatalogLookup("province", "Tỉnh/Thành phố",
                    ProvinceItems.Select(x => x.Name).Distinct().ToList()),
                new CatalogLookup("commune", "Phường/Xã",
                    CommuneItems.Select(x => x.Name).Distinct().ToList())
            ],
            MasterCatalogKind.ProductGroup =>
            [
                new CatalogLookup("product-group", "Nhóm cha (cấp 1)",
                    ParentGroupItems.Select(x => x.Name).Distinct().ToList())
            ],
            MasterCatalogKind.TestingService =>
            [
                new CatalogLookup("testing-center", "Trung tâm kiểm nghiệm",
                    TestingCenterItems.Select(x => x.Name).Distinct().ToList())
            ],
            MasterCatalogKind.BusinessClassification =>
            [
                new CatalogLookup("risk-level", "Rủi ro",
                    ["Cao", "Trung bình", "Thấp"])
            ],
            _ => []
        };

        // Tên trùng nhau thì lấy bản ghi đầu tiên — dòng import sẽ báo lỗi rõ
        // hơn nếu người dùng nhập tên không phân biệt được.
        private static IReadOnlyDictionary<string, Guid> ToMap(
            IReadOnlyList<(Guid Id, string Name)> items) =>
            items
                .GroupBy(x => x.Name.Trim(), StringComparer.OrdinalIgnoreCase)
                .ToDictionary(
                    group => group.Key,
                    group => group.First().Id,
                    StringComparer.OrdinalIgnoreCase);
    }
}

public sealed class MasterCatalogImportSession
{
    public Guid UserId { get; set; }
    public MasterCatalogKind Kind { get; set; }
    public List<string> Payloads { get; set; } = [];
}
