# API Contracts — FoodSafe

> API-first design — DTOs được định nghĩa trước, implement sau  
> Base URL: `/api/v1/app/` (ABP Application Services pattern)
> Auth: Bearer JWT (OpenIddict)
> Version policy: the major API version is explicit in the URL; supported versions are advertised with `api-supported-versions`.

---

## Conventions

### Response Format (ABP default)
```json
// List
{
  "totalCount": 100,
  "items": [...]
}

// Single
{
  "id": "uuid",
  "...": "..."
}

// Error
{
  "error": {
    "code": "FoodSafe:Business:0001",
    "message": "Cơ sở đã tồn tại với mã số này",
    "details": null,
    "data": {}
  }
}
```

Routing/version-negotiation failures use RFC 9457 Problem Details
(`application/problem+json`). Application failures use the ABP remote-error
shape above. Every API response includes `X-Correlation-Id`; error bodies also
include a `correlationId` field so an incident can be traced without exposing
stack traces or implementation details.

### Pagination
```
GET /api/v1/app/businesses?skipCount=0&maxResultCount=20&sorting=name ASC
```

### Date Format: ISO 8601 (server), dd/MM/yyyy (display in FE)

---

## MODULE: BusinessManagement

### GET /api/v1/app/businesses
**Query:** `skipCount, maxResultCount, sorting, keyword, businessTypeId, businessClassificationId, organizationId, status, hasExpiredLicense`  
**Response:** `PagedResultDto<BusinessListItemDto>`

```typescript
interface BusinessListItemDto {
  id: string
  code: string
  name: string
  businessTypeName: string
  businessClassificationName: string
  address: string  // formatted: street, commune, district
  contactPhone: string
  status: BusinessStatus  // 1=Active, 2=Inactive, 3=Suspended
  hasEligibilityCertificate: boolean
  hasValidLicense: boolean         // computed
  licenseExpiryWarning: boolean    // sắp hết hạn
  latitude: number | null
  longitude: number | null
  organizationName: string
  creationTime: string
}
```

### GET /api/v1/app/businesses/{id}
**Response:** `BusinessDetailDto`

```typescript
interface BusinessDetailDto extends BusinessListItemDto {
  taxCode: string
  representativeName: string
  representativeIdCard: string
  contactName: string
  contactEmail: string
  addressStreet: string
  addressCommuneId: string
  addressCommuneName: string
  addressDistrictId: string
  addressDistrictName: string
  addressProvinceId: string
  addressProvinceName: string
  establishedDate: string | null  // YYYY-MM-DD
  employeeCount: number | null
  productGroups: ProductGroupBriefDto[]
  handlers: BusinessHandlerDto[]
  notes: string
}
```

### POST /api/v1/app/businesses
**Body:** `CreateBusinessDto`

```typescript
interface CreateBusinessDto {
  code?: string
  name: string                        // required
  businessTypeId: string              // required
  businessClassificationId?: string
  taxCode?: string
  representativeName?: string
  representativeIdCard?: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  addressStreet: string               // required
  addressCommuneId: string            // required
  addressDistrictId: string           // required
  addressProvinceId: string           // required
  latitude?: number
  longitude?: number
  establishedDate?: string
  employeeCount?: number
  productGroupIds: string[]
  notes?: string
}
```

### PUT /api/v1/app/businesses/{id}
**Body:** `UpdateBusinessDto` (same as Create, all optional except validated fields)

### DELETE /api/v1/app/businesses/{id}

### POST /api/v1/app/businesses/import
**Body:** `FormData` (file: Excel)  
**Response:** `ImportResultDto`

```typescript
interface ImportResultDto {
  totalRows: number
  successCount: number
  errorCount: number
  errors: { rowNumber: number; message: string }[]
}
```

### GET /api/v1/app/businesses/export-excel
**Query:** same filters as GetList  
**Response:** Binary (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

### GET /api/v1/app/businesses/{id}/handlers
**Response:** `BusinessHandlerDto[]`

### POST /api/v1/app/businesses/{id}/handlers
**Body:** `CreateBusinessHandlerDto`

### PUT /api/v1/app/businesses/{id}/handlers/{handlerId}

### DELETE /api/v1/app/businesses/{id}/handlers/{handlerId}

---

## MODULE: Products

### GET /api/v1/app/products
**Query:** `skipCount, maxResultCount, sorting, keyword, businessId, productGroupId, status`

### GET /api/v1/app/products/{id}
### POST /api/v1/app/products
### PUT /api/v1/app/products/{id}
### DELETE /api/v1/app/products/{id}

---

## MODULE: SelfDeclarations

### GET /api/v1/app/self-declarations
**Query:** `skipCount, maxResultCount, businessId, productId, status, expiringWithinDays`

```typescript
interface SelfDeclarationListItemDto {
  id: string
  businessName: string
  productName: string
  declarationNumber: string
  declarationDate: string
  expiryDate: string | null
  status: LicenseStatus  // 1=Active, 2=Expired, 3=Revoked
  daysUntilExpiry: number | null  // computed
}
```

### GET /api/v1/app/self-declarations/{id}
### POST /api/v1/app/self-declarations
### PUT /api/v1/app/self-declarations/{id}
### DELETE /api/v1/app/self-declarations/{id}
### POST /api/v1/app/self-declarations/{id}/revoke

---

## MODULE: Licensing (shared pattern for 5 license types)

### ProductRegistrations
```
GET    /api/v1/app/product-registrations
GET    /api/v1/app/product-registrations/{id}
POST   /api/v1/app/product-registrations
PUT    /api/v1/app/product-registrations/{id}
DELETE /api/v1/app/product-registrations/{id}
POST   /api/v1/app/product-registrations/{id}/revoke
GET    /api/v1/app/product-registrations/export-excel
```

### AdvertisementRegistrations
```
GET    /api/v1/app/advertisement-registrations
GET    /api/v1/app/advertisement-registrations/{id}
POST   /api/v1/app/advertisement-registrations
PUT    /api/v1/app/advertisement-registrations/{id}
DELETE /api/v1/app/advertisement-registrations/{id}
POST   /api/v1/app/advertisement-registrations/{id}/revoke
```

### EligibilityCertificates (DDK)
```
GET    /api/v1/app/eligibility-certificates
GET    /api/v1/app/eligibility-certificates/{id}
POST   /api/v1/app/eligibility-certificates
PUT    /api/v1/app/eligibility-certificates/{id}
DELETE /api/v1/app/eligibility-certificates/{id}
POST   /api/v1/app/eligibility-certificates/{id}/revoke
```

### CfsCertificates
```
GET    /api/v1/app/cfs-certificates
GET    /api/v1/app/cfs-certificates/{id}
POST   /api/v1/app/cfs-certificates
PUT    /api/v1/app/cfs-certificates/{id}
POST   /api/v1/app/cfs-certificates/{id}/revoke
```

### ExportFoodCertificates
```
GET    /api/v1/app/export-food-certificates
GET    /api/v1/app/export-food-certificates/{id}
POST   /api/v1/app/export-food-certificates
PUT    /api/v1/app/export-food-certificates/{id}
POST   /api/v1/app/export-food-certificates/{id}/revoke
```

---

## MODULE: Inspection

### InspectionPlans
```
GET    /api/v1/app/inspection-plans
GET    /api/v1/app/inspection-plans/{id}
POST   /api/v1/app/inspection-plans
PUT    /api/v1/app/inspection-plans/{id}
DELETE /api/v1/app/inspection-plans/{id}
POST   /api/v1/app/inspection-plans/{id}/submit
POST   /api/v1/app/inspection-plans/{id}/approve
POST   /api/v1/app/inspection-plans/{id}/reject
POST   /api/v1/app/inspection-plans/{id}/complete
POST   /api/v1/app/inspection-plans/{id}/cancel
```

**Manage Items:**
```
GET    /api/v1/app/inspection-plans/{id}/items
POST   /api/v1/app/inspection-plans/{id}/items
DELETE /api/v1/app/inspection-plans/{id}/items/{itemId}
```

### InspectionResults
```
GET    /api/v1/app/inspection-results
GET    /api/v1/app/inspection-results/{id}
POST   /api/v1/app/inspection-results
PUT    /api/v1/app/inspection-results/{id}
DELETE /api/v1/app/inspection-results/{id}
```

**Violations:**
```
POST   /api/v1/app/inspection-results/{id}/violations
PUT    /api/v1/app/inspection-results/{id}/violations/{violationId}
DELETE /api/v1/app/inspection-results/{id}/violations/{violationId}
POST   /api/v1/app/inspection-results/{id}/violations/{violationId}/mark-remedied
```

---

## MODULE: FoodPoisoning

### FoodPoisoningCases

```typescript
interface FoodPoisoningCaseDto {
  id: string
  caseCode: string
  organizationName: string
  reportDate: string
  occurrenceDate: string | null
  locationDescription: string
  communeName: string
  districtName: string
  victimName: string
  victimAge: number | null
  victimGender: number | null  // 1=Nam, 2=Nữ, 3=Khác
  suspectedFood: string
  treatmentResult: number | null  // 1=Khỏi, 2=Nhập viện, 3=Tử vong
  status: PoisoningCaseStatus  // 1=Draft, 2=Reported, 3=Verified
  creationTime: string
}
```

```
GET    /api/v1/app/food-poisoning-cases
GET    /api/v1/app/food-poisoning-cases/{id}
POST   /api/v1/app/food-poisoning-cases
PUT    /api/v1/app/food-poisoning-cases/{id}
DELETE /api/v1/app/food-poisoning-cases/{id}
POST   /api/v1/app/food-poisoning-cases/{id}/submit
POST   /api/v1/app/food-poisoning-cases/{id}/verify
POST   /api/v1/app/food-poisoning-cases/{id}/error-reports
GET    /api/v1/app/food-poisoning-cases/{id}/error-reports
```

### FoodPoisoningIncidents

```
GET    /api/v1/app/food-poisoning-incidents
GET    /api/v1/app/food-poisoning-incidents/{id}
POST   /api/v1/app/food-poisoning-incidents
PUT    /api/v1/app/food-poisoning-incidents/{id}
DELETE /api/v1/app/food-poisoning-incidents/{id}
POST   /api/v1/app/food-poisoning-incidents/{id}/submit
POST   /api/v1/app/food-poisoning-incidents/{id}/verify
POST   /api/v1/app/food-poisoning-incidents/{id}/conclude
POST   /api/v1/app/food-poisoning-incidents/{id}/error-reports
```

---

## MODULE: Reporting

### NdtpReports (Workflow endpoints)

```typescript
interface CreateNdtpReportDto {
  periodYear: number
  periodMonth: number  // 1-12
}

interface UpdateNdtpReportStatsDto {
  caseCount: number
  caseAffected: number
  caseHospitalized: number
  caseDeaths: number
  incidentCount: number
  incidentAffected: number
  incidentHospitalized: number
  incidentDeaths: number
}

interface SubmitReportDto {
  // empty body — workflow action
}

interface ReturnReportDto {
  returnReason: string  // required
}
```

```
GET    /api/v1/app/ndtp-reports
GET    /api/v1/app/ndtp-reports/{id}
POST   /api/v1/app/ndtp-reports
PUT    /api/v1/app/ndtp-reports/{id}/stats
PUT    /api/v1/app/ndtp-reports/{id}/narrative
DELETE /api/v1/app/ndtp-reports/{id}
POST   /api/v1/app/ndtp-reports/{id}/submit
POST   /api/v1/app/ndtp-reports/{id}/verify
POST   /api/v1/app/ndtp-reports/{id}/return
POST   /api/v1/app/ndtp-reports/{id}/complete
POST   /api/v1/app/ndtp-reports/{id}/error-notifications
GET    /api/v1/app/ndtp-reports/{id}/error-notifications
GET    /api/v1/app/ndtp-reports/{id}/export-pdf
GET    /api/v1/app/ndtp-reports/{id}/export-excel
```

*(AtpWorkReports và ActionMonthReports có pattern tương tự)*

---

## MODULE: AlertsAndTesting

### AtpAlerts

```
GET    /api/v1/app/atp-alerts
GET    /api/v1/app/atp-alerts/{id}
POST   /api/v1/app/atp-alerts
PUT    /api/v1/app/atp-alerts/{id}
DELETE /api/v1/app/atp-alerts/{id}
POST   /api/v1/app/atp-alerts/{id}/publish
POST   /api/v1/app/atp-alerts/{id}/recall
```

### AtpNews

```
GET    /api/v1/app/atp-news
GET    /api/v1/app/atp-news/{id}
POST   /api/v1/app/atp-news
PUT    /api/v1/app/atp-news/{id}
DELETE /api/v1/app/atp-news/{id}
POST   /api/v1/app/atp-news/{id}/publish
POST   /api/v1/app/atp-news/{id}/recall
```

### RiskAnalyses / TestingResults / RegulatoryDocuments

```
GET    /api/v1/app/risk-analyses
POST   /api/v1/app/risk-analyses
PUT    /api/v1/app/risk-analyses/{id}
POST   /api/v1/app/risk-analyses/{id}/publish

GET    /api/v1/app/testing-results
POST   /api/v1/app/testing-results
PUT    /api/v1/app/testing-results/{id}
DELETE /api/v1/app/testing-results/{id}

GET    /api/v1/app/regulatory-documents
POST   /api/v1/app/regulatory-documents
PUT    /api/v1/app/regulatory-documents/{id}
DELETE /api/v1/app/regulatory-documents/{id}
```

### Dashboard & Statistics

```
GET    /api/v1/app/dashboard/summary                    # Widget data
GET    /api/v1/app/statistics/businesses                # Business stats by type/classification
GET    /api/v1/app/statistics/inspections               # Inspection stats
GET    /api/v1/app/statistics/food-poisoning            # Poisoning stats
GET    /api/v1/app/statistics/licenses                  # License stats
```

---

## MODULE: Public Portal (không cần auth)

```
GET    /api/public/businesses                # Tra cứu cơ sở công khai
GET    /api/public/businesses/{id}
GET    /api/public/products                  # Tra cứu sản phẩm công khai
GET    /api/public/licenses                  # Tra cứu giấy phép công khai
GET    /api/public/testing-results           # Tra cứu kết quả kiểm nghiệm
GET    /api/public/atp-alerts                # Tra cứu cảnh báo
GET    /api/public/risk-analyses             # Tra cứu phân tích nguy cơ
GET    /api/public/atp-news                  # Tin tức công khai
POST   /api/public/alert-submissions         # Gửi phản ánh (CAPTCHA required)
GET    /api/public/alert-submissions/{trackingCode}  # Tra cứu trạng thái phản ánh
```

---

## MODULE: DataIntegration

```
GET    /api/v1/app/api-specs
GET    /api/v1/app/api-specs/{id}
POST   /api/v1/app/api-specs
PUT    /api/v1/app/api-specs/{id}
DELETE /api/v1/app/api-specs/{id}
POST   /api/v1/app/api-specs/{id}/activate
POST   /api/v1/app/api-specs/{id}/deactivate
POST   /api/v1/app/api-specs/{id}/test-connection

GET    /api/v1/app/data-sharing-histories
GET    /api/v1/app/data-sharing-histories/{id}
POST   /api/v1/app/data-sharing-histories/{id}/retry
```

---

## FILE MANAGEMENT

```
POST   /api/v1/app/files/upload              # Upload file to MinIO
  Body: FormData { file, entityType, entityId, description, isPublic }
  Response: { id, fileName, storagePath, fileSize, mimeType, uploadTime }

DELETE /api/v1/app/files/{id}               # Delete file

GET    /api/v1/app/files/{id}/download      # Download file (streaming)
GET    /api/v1/app/files/{id}/presigned-url # Get MinIO presigned URL (for direct download)

GET    /api/v1/app/files?entityType=x&entityId=y  # List files for entity
```

---

## CATALOG APIs (public endpoints — no auth needed for read)

```
GET    /api/catalogs/countries
GET    /api/catalogs/provinces
GET    /api/catalogs/districts?provinceId=x
GET    /api/catalogs/communes?districtId=x
GET    /api/catalogs/product-groups
GET    /api/catalogs/business-types
GET    /api/catalogs/business-classifications
GET    /api/catalogs/advertisement-types
GET    /api/catalogs/document-types
GET    /api/catalogs/testing-centers
GET    /api/catalogs/testing-services?testingCenterId=x
```

*(CRUD cho catalogs: các endpoint dưới `/api/v1/app/catalogs/*` — yêu cầu auth)*

---

## ABP Identity APIs (built-in)

```
POST   /api/account/login
POST   /api/account/logout
POST   /api/account/change-password
GET    /api/identity/users
POST   /api/identity/users
PUT    /api/identity/users/{id}
DELETE /api/identity/users/{id}
GET    /api/identity/roles
POST   /api/identity/roles
GET    /api/identity/permissions?providerName=R&providerKey={roleName}
PUT    /api/identity/permissions?providerName=R&providerKey={roleName}
```
