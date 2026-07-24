# API Contracts — FoodSafe

> API-first design — DTOs được định nghĩa trước, implement sau  
> Base URL: `/api/app/` (ABP Application Services pattern)  
> Auth: Bearer JWT (OpenIddict)

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

### Pagination
```
GET /api/app/businesses?skipCount=0&maxResultCount=20&sorting=name ASC
```

### Date Format: ISO 8601 (server), dd/MM/yyyy (display in FE)

---

## MODULE: BusinessManagement

### GET /api/app/businesses
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

### GET /api/app/businesses/{id}
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

### POST /api/app/businesses
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

### PUT /api/app/businesses/{id}
**Body:** `UpdateBusinessDto` (same as Create, all optional except validated fields)

### DELETE /api/app/businesses/{id}

### POST /api/app/businesses/import
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

### GET /api/app/businesses/export-excel
**Query:** same filters as GetList  
**Response:** Binary (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

### GET /api/app/businesses/{id}/handlers
**Response:** `BusinessHandlerDto[]`

### POST /api/app/businesses/{id}/handlers
**Body:** `CreateBusinessHandlerDto`

### PUT /api/app/businesses/{id}/handlers/{handlerId}

### DELETE /api/app/businesses/{id}/handlers/{handlerId}

---

## MODULE: Products

### GET /api/app/products
**Query:** `skipCount, maxResultCount, sorting, keyword, businessId, productGroupId, status`

### GET /api/app/products/{id}
### POST /api/app/products
### PUT /api/app/products/{id}
### DELETE /api/app/products/{id}

---

## MODULE: SelfDeclarations

### GET /api/app/self-declarations
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

### GET /api/app/self-declarations/{id}
### POST /api/app/self-declarations
### PUT /api/app/self-declarations/{id}
### DELETE /api/app/self-declarations/{id}
### POST /api/app/self-declarations/{id}/revoke

---

## MODULE: Licensing (shared pattern for 5 license types)

### ProductRegistrations
```
GET    /api/app/product-registrations
GET    /api/app/product-registrations/{id}
POST   /api/app/product-registrations
PUT    /api/app/product-registrations/{id}
DELETE /api/app/product-registrations/{id}
POST   /api/app/product-registrations/{id}/revoke
GET    /api/app/product-registrations/export-excel
```

### AdvertisementRegistrations
```
GET    /api/app/advertisement-registrations
GET    /api/app/advertisement-registrations/{id}
POST   /api/app/advertisement-registrations
PUT    /api/app/advertisement-registrations/{id}
DELETE /api/app/advertisement-registrations/{id}
POST   /api/app/advertisement-registrations/{id}/revoke
```

### EligibilityCertificates (DDK)
```
GET    /api/app/eligibility-certificates
GET    /api/app/eligibility-certificates/{id}
POST   /api/app/eligibility-certificates
PUT    /api/app/eligibility-certificates/{id}
DELETE /api/app/eligibility-certificates/{id}
POST   /api/app/eligibility-certificates/{id}/revoke
```

### CfsCertificates
```
GET    /api/app/cfs-certificates
GET    /api/app/cfs-certificates/{id}
POST   /api/app/cfs-certificates
PUT    /api/app/cfs-certificates/{id}
POST   /api/app/cfs-certificates/{id}/revoke
```

### ExportFoodCertificates
```
GET    /api/app/export-food-certificates
GET    /api/app/export-food-certificates/{id}
POST   /api/app/export-food-certificates
PUT    /api/app/export-food-certificates/{id}
POST   /api/app/export-food-certificates/{id}/revoke
```

---

## MODULE: Inspection

### InspectionPlans
```
GET    /api/app/inspection-plans
GET    /api/app/inspection-plans/{id}
POST   /api/app/inspection-plans
PUT    /api/app/inspection-plans/{id}
DELETE /api/app/inspection-plans/{id}
POST   /api/app/inspection-plans/{id}/submit
POST   /api/app/inspection-plans/{id}/approve
POST   /api/app/inspection-plans/{id}/reject
POST   /api/app/inspection-plans/{id}/complete
POST   /api/app/inspection-plans/{id}/cancel
```

**Manage Items:**
```
GET    /api/app/inspection-plans/{id}/items
POST   /api/app/inspection-plans/{id}/items
DELETE /api/app/inspection-plans/{id}/items/{itemId}
```

### InspectionResults
```
GET    /api/app/inspection-results
GET    /api/app/inspection-results/{id}
POST   /api/app/inspection-results
PUT    /api/app/inspection-results/{id}
DELETE /api/app/inspection-results/{id}
```

**Violations:**
```
POST   /api/app/inspection-results/{id}/violations
PUT    /api/app/inspection-results/{id}/violations/{violationId}
DELETE /api/app/inspection-results/{id}/violations/{violationId}
POST   /api/app/inspection-results/{id}/violations/{violationId}/mark-remedied
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
GET    /api/app/food-poisoning-cases
GET    /api/app/food-poisoning-cases/{id}
POST   /api/app/food-poisoning-cases
PUT    /api/app/food-poisoning-cases/{id}
DELETE /api/app/food-poisoning-cases/{id}
POST   /api/app/food-poisoning-cases/{id}/submit
POST   /api/app/food-poisoning-cases/{id}/verify
POST   /api/app/food-poisoning-cases/{id}/error-reports
GET    /api/app/food-poisoning-cases/{id}/error-reports
```

### FoodPoisoningIncidents

```
GET    /api/app/food-poisoning-incidents
GET    /api/app/food-poisoning-incidents/{id}
POST   /api/app/food-poisoning-incidents
PUT    /api/app/food-poisoning-incidents/{id}
DELETE /api/app/food-poisoning-incidents/{id}
POST   /api/app/food-poisoning-incidents/{id}/submit
POST   /api/app/food-poisoning-incidents/{id}/verify
POST   /api/app/food-poisoning-incidents/{id}/conclude
POST   /api/app/food-poisoning-incidents/{id}/error-reports
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
GET    /api/app/ndtp-reports
GET    /api/app/ndtp-reports/{id}
POST   /api/app/ndtp-reports
PUT    /api/app/ndtp-reports/{id}/stats
PUT    /api/app/ndtp-reports/{id}/narrative
DELETE /api/app/ndtp-reports/{id}
POST   /api/app/ndtp-reports/{id}/submit
POST   /api/app/ndtp-reports/{id}/verify
POST   /api/app/ndtp-reports/{id}/return
POST   /api/app/ndtp-reports/{id}/complete
POST   /api/app/ndtp-reports/{id}/error-notifications
GET    /api/app/ndtp-reports/{id}/error-notifications
GET    /api/app/ndtp-reports/{id}/export-pdf
GET    /api/app/ndtp-reports/{id}/export-excel
```

*(AtpWorkReports và ActionMonthReports có pattern tương tự)*

---

## MODULE: AlertsAndTesting

### AtpAlerts

```
GET    /api/app/atp-alerts
GET    /api/app/atp-alerts/{id}
POST   /api/app/atp-alerts
PUT    /api/app/atp-alerts/{id}
DELETE /api/app/atp-alerts/{id}
POST   /api/app/atp-alerts/{id}/publish
POST   /api/app/atp-alerts/{id}/recall
```

### AtpNews

```
GET    /api/app/atp-news
GET    /api/app/atp-news/{id}
POST   /api/app/atp-news
PUT    /api/app/atp-news/{id}
DELETE /api/app/atp-news/{id}
POST   /api/app/atp-news/{id}/publish
POST   /api/app/atp-news/{id}/recall
```

### RiskAnalyses / TestingResults / RegulatoryDocuments

```
GET    /api/app/risk-analyses
POST   /api/app/risk-analyses
PUT    /api/app/risk-analyses/{id}
POST   /api/app/risk-analyses/{id}/publish

GET    /api/app/testing-results
POST   /api/app/testing-results
PUT    /api/app/testing-results/{id}
DELETE /api/app/testing-results/{id}

GET    /api/app/regulatory-documents
POST   /api/app/regulatory-documents
PUT    /api/app/regulatory-documents/{id}
DELETE /api/app/regulatory-documents/{id}
```

### Dashboard & Statistics

```
GET    /api/app/dashboard/summary                    # Widget data
GET    /api/app/statistics/businesses                # Business stats by type/classification
GET    /api/app/statistics/inspections               # Inspection stats
GET    /api/app/statistics/food-poisoning            # Poisoning stats
GET    /api/app/statistics/licenses                  # License stats
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
GET    /api/app/api-specs
GET    /api/app/api-specs/{id}
POST   /api/app/api-specs
PUT    /api/app/api-specs/{id}
DELETE /api/app/api-specs/{id}
POST   /api/app/api-specs/{id}/activate
POST   /api/app/api-specs/{id}/deactivate
POST   /api/app/api-specs/{id}/test-connection

GET    /api/app/data-sharing-histories
GET    /api/app/data-sharing-histories/{id}
POST   /api/app/data-sharing-histories/{id}/retry
```

---

## FILE MANAGEMENT

```
POST   /api/app/files/upload              # Upload file to MinIO
  Body: FormData { file, entityType, entityId, description, isPublic }
  Response: { id, fileName, storagePath, fileSize, mimeType, uploadTime }

DELETE /api/app/files/{id}               # Delete file

GET    /api/app/files/{id}/download      # Download file (streaming)
GET    /api/app/files/{id}/presigned-url # Get MinIO presigned URL (for direct download)

GET    /api/app/files?entityType=x&entityId=y  # List files for entity
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

*(CRUD cho catalogs: các endpoint dưới `/api/app/catalogs/*` — yêu cầu auth)*

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
