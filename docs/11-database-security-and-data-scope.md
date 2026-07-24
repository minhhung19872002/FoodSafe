# Database Security and Data Scope — FoodSafe

> Chi cục An toàn vệ sinh thực phẩm tỉnh Quảng Ninh  
> Phiên bản: 1.0 — Ngày tạo: 2026-07-25  
> Cấp độ hệ thống: Cấp 2 theo Nghị định 85/2016/NĐ-CP

---

## 1. Security Classification

### 1.1 Classification Levels

| Level | Vietnamese | Description | Examples in FoodSafe |
|-------|-----------|-------------|---------------------|
| **PUBLIC** | Công khai | Accessible to anonymous users via public portal | Business lookup, product lookup, published alerts, news |
| **INTERNAL** | Nội bộ | Accessible only to authenticated staff of any level | Inspection plans, most reporting, testing results |
| **CONFIDENTIAL** | Bảo mật | Restricted to higher-level roles or specific owners | Food poisoning case victim data, audit logs, error notifications |
| **RESTRICTED** | Tối mật | Accessible only to SystemAdmin / ProvinceAdmin | API credentials, password history, integration configs |

### 1.2 Table Classification Matrix

| Table | Classification | Sensitive Columns | Rationale |
|-------|---------------|-------------------|-----------|
| `organizations` | INTERNAL | — | Org hierarchy, visible to all authenticated users |
| `app_user_profiles` | CONFIDENTIAL | `position`, `department`, `password_expires_at` | Personal staff data |
| `countries` | PUBLIC | — | Reference catalog |
| `regions` | PUBLIC | — | Reference catalog |
| `provinces` | PUBLIC | — | Reference catalog |
| `districts` | PUBLIC | — | Reference catalog |
| `communes` | PUBLIC | — | Reference catalog |
| `product_groups` | PUBLIC | — | Reference catalog |
| `business_types` | PUBLIC | — | Reference catalog |
| `business_classifications` | PUBLIC | — | Reference catalog |
| `ad_types` | PUBLIC | — | Reference catalog |
| `document_types` | INTERNAL | — | Admin-managed reference |
| `testing_centers` | PUBLIC | — | Disclosed on public portal |
| `testing_services` | PUBLIC | — | Disclosed on public portal |
| `businesses` | PUBLIC (selected columns) | `representative_id_card`, `tax_code` | ID card and tax code are PII/financial; public portal exposes only name, address, license status |
| `business_product_groups` | INTERNAL | — | Relational join |
| `business_handlers` | CONFIDENTIAL | `id_card_number`, `health_certificate_number` | CMND/CCCD is highly sensitive PII |
| `products` | PUBLIC (selected columns) | — | Product name, registration status are public |
| `self_declarations` | INTERNAL | — | Regulatory filing; accessible to licensing staff |
| `product_registrations` | INTERNAL | — | Contains registration number (UNIQUE) |
| `advertisement_registrations` | INTERNAL | — | Regulatory |
| `ad_reg_products` | INTERNAL | — | Relational join |
| `eligibility_certificates` | INTERNAL | — | Regulatory certificate data |
| `cfs_certificates` | INTERNAL | — | Export regulatory |
| `export_food_certificates` | INTERNAL | — | Export regulatory |
| `inspection_plans` | INTERNAL | `rejected_reason` | Working documents |
| `inspection_plan_items` | INTERNAL | — | Business-to-plan mapping |
| `inspection_results` | INTERNAL | `violation_description`, `recommendations` | Enforcement records |
| `inspection_violations` | INTERNAL | — | Violation detail |
| `food_poisoning_cases` | CONFIDENTIAL | `victim_name`, `victim_age`, `victim_gender`, `victim_phone`, `victim_address`, `victim_occupation` | Direct PII of food poisoning victims |
| `poisoning_case_error_reports` | CONFIDENTIAL | — | Correction workflow records |
| `food_poisoning_incidents` | INTERNAL | `source_analysis`, `cause_analysis` | Incident investigation data |
| `poisoning_incident_error_reports` | INTERNAL | — | Correction workflow records |
| `ndtp_reports` | INTERNAL | — | Monthly food poisoning report |
| `ndtp_report_error_notifications` | INTERNAL | — | Report correction tracking |
| `atp_work_reports` | INTERNAL | — | Semi-annual/annual ATTP work report |
| `atp_work_report_error_notifications` | INTERNAL | — | Report correction tracking |
| `action_month_reports` | INTERNAL | — | Action month report |
| `action_month_report_error_notifications` | INTERNAL | — | Report correction tracking |
| `atp_alerts` | PUBLIC (when Published) | — | Alerts are intentionally public |
| `atp_news` | PUBLIC (when Published) | — | News is intentionally public |
| `news_linked_alerts` | INTERNAL | — | Relational join |
| `risk_analyses` | INTERNAL | — | Technical risk analysis documents |
| `testing_results` | INTERNAL | — | Lab result data |
| `regulatory_documents` | INTERNAL | — | Directive documents |
| `public_alert_submissions` | CONFIDENTIAL | `submitter_name`, `submitter_phone`, `submitter_email` | Anonymous tipster PII must be protected |
| `file_attachments` | Inherits from parent | — | Classification follows the entity it belongs to |
| `status_history` | CONFIDENTIAL | — | Workflow audit trail; must not be tampered |
| `cached_dashboard_stats` | INTERNAL | — | Aggregated statistics only |
| `api_specs` | RESTRICTED | `auth_config_encrypted` | API credentials; AES-256 encrypted at rest |
| `data_sharing_histories` | CONFIDENTIAL | `request_payload`, `response_payload` | May contain PII from external systems |
| `password_history` | RESTRICTED | `password_hash` | bcrypt hashes; highest restriction |

---

## 2. Data Scope Rules

### 2.1 Organization Hierarchy Model

FoodSafe uses a three-level organizational hierarchy that determines which data a user can read, create, or modify:

```
Tỉnh Quảng Ninh (Province)
├── Huyện Đông Triều (District)
│   ├── Xã Bình Khê (Commune)
│   ├── Xã Đức Chính (Commune)
│   └── ... (more communes)
├── TP. Hạ Long (District-level city)
│   ├── Phường Bãi Cháy (Commune-level ward)
│   └── ...
└── ... (12 districts + cities)
```

Each `organizations` row has a `level` column (`Province`, `District`, `Commune`) and a nullable `parent_id` that forms the hierarchy.

Every domain entity that is org-scoped carries an `organization_id UUID NOT NULL` column. This column is set at creation time from the authenticated user's own organization and **cannot be modified by client input after creation**.

### 2.2 Data Scope Resolution

Data scope is resolved entirely on the server in the AppService layer. The resolution algorithm is:

```
1. Read CurrentUser.OrganizationId from the authenticated token (OpenIddict claim)
2. Query organizations table to determine the level of CurrentUser's org
3. Resolve the visible org set:
   - Province level  → all org IDs (no filter, or include all)
   - District level  → CurrentUser.OrgId + all commune IDs where parent_id = CurrentUser.OrgId
   - Commune level   → CurrentUser.OrgId only
4. Apply WHERE organization_id IN (visible_org_ids) on every query
```

**Key invariant**: The client never supplies an `organizationId` filter that the server trusts. Even if the request body contains `organizationId`, the server recomputes it from the authenticated identity. If the supplied ID falls outside the user's visible set, the server returns 403 Forbidden — it never silently returns an empty set (which would be exploitable for probing).

### 2.3 Scope by Operation Type

| Operation | Scope Enforcement |
|-----------|-------------------|
| **List** | Filter: `organization_id IN (visible_org_ids)` — mandatory, cannot be bypassed |
| **GetById** | After loading, check `organization_id IN (visible_org_ids)` — throw 403 if not in scope |
| **Create** | Always set `organization_id = CurrentUser.OrganizationId` — ignore any client-supplied value |
| **Update** | Load entity, check org scope, then apply changes |
| **Delete (soft)** | Load entity, check org scope, set `is_deleted = true` |
| **Export** | Apply same filter as List before generating file; never export outside scope |
| **Report aggregation** | Aggregate only over `visible_org_ids`; aggregate functions receive pre-filtered IQueryable |
| **Dashboard stats** | `cached_dashboard_stats` is keyed by `organization_id`; each org only sees its own cache entry |
| **Status transitions** | Load entity, check org scope, then check workflow permission |
| **File download** | Check parent entity's org scope before serving the file from MinIO |

### 2.4 Special Cases

**Cross-org Approval (Plans.Approve)**
A DistrictAdmin can approve an inspection plan submitted by a commune within their district. The AppService must:
1. Load the plan and check `plan.OrganizationId` belongs to a commune under the district admin's organization.
2. Verify the district admin holds `Plans.Approve` permission.

**Public Portal Reads**
Public portal endpoints bypass org-scope checks but apply a `published = true` / `status = Published` filter and a column projection that excludes all sensitive columns (no PII, no internal notes).

**SystemAdmin**
SystemAdmin has `organization_id = province_root_org_id` and sees all data. No filtering is applied when `CurrentUser.IsInRole("SystemAdmin")`. This check is performed once at the AppService level; the repository always returns unfiltered data.

---

## 3. Authorization Design

### 3.1 Functional Permission Check

Every AppService method begins with an ABP permission check:

```csharp
await AuthorizationService.CheckAsync(FoodSafePermissions.Businesses.Edit);
```

If the permission is not granted, ABP throws `AbpAuthorizationException` which maps to HTTP 403. No further checks are performed (fail-fast).

Permission grants are stored in `AbpPermissionGrants` and evaluated by ABP's permission system. The permission tree is defined in `FoodSafePermissionDefinitionProvider`.

### 3.2 Organization Scope Check

After the functional permission check, the AppService resolves the org scope and applies it as described in Section 2.2. For single-entity operations (GetById, Update, Delete), a dedicated helper is called:

```csharp
private async Task CheckOrganizationAccessAsync(Guid entityOrgId)
{
    var visibleOrgIds = await _orgScopeService.GetVisibleOrgIdsAsync(CurrentUser.GetOrganizationId());
    if (!visibleOrgIds.Contains(entityOrgId))
        throw new AbpAuthorizationException($"Access denied to organization {entityOrgId}");
}
```

This method is called immediately after loading the entity, before any modifications.

### 3.3 Resource Ownership Check

For entities where additional ownership constraints apply (e.g., only the user who created a Draft report can edit it before submission), a third check is performed:

```csharp
if (report.Status == ReportStatus.Draft && report.CreatorId != CurrentUser.Id)
{
    // Only creator can edit own draft — others in same org can view but not edit
    await AuthorizationService.CheckAsync(FoodSafePermissions.NdtpReports.EditAny);
}
```

The permission `EditAny` is granted only to Admins of the same org, allowing them to edit any draft in their org.

### 3.4 Combining Checks — Ordered Chain

The authorization chain is strictly ordered. Each step must pass before proceeding:

```
Step 1: Authentication
    → Token must be valid (ABP OpenIddict middleware)
    → If anonymous → 401 Unauthorized

Step 2: Functional Permission
    → User must hold the required permission (e.g., Businesses.Edit)
    → If missing → 403 Forbidden

Step 3: Organization Scope
    → Entity's organization_id must be within user's visible org set
    → If outside scope → 403 Forbidden (NOT 404 — to prevent information disclosure)

Step 4: Resource Ownership (where applicable)
    → Additional checks like Draft-owner, Report-verifier-level
    → If fails → 403 Forbidden

Step 5: Workflow Status
    → Entity must be in a state that allows the operation
    → e.g., cannot Edit a Submitted report
    → If fails → 409 Conflict or 422 Unprocessable Entity (business exception)
```

**Note**: Steps 3–5 must never be performed before Step 2. A user with no `Businesses.View` permission must not learn that a business exists (no 403 with entity info, no 404 that reveals existence).

---

## 4. Authorization Gap Analysis

### 4.1 Identified Risks

| Risk ID | Description | Entity | Severity | Mitigation |
|---------|-------------|--------|----------|------------|
| R-01 | SystemAdmin can view all encrypted api_specs including auth credentials | `api_specs` | MEDIUM | Audit log on every access; consider field-level masking in UI |
| R-02 | ProvinceStaff can view food_poisoning_cases for all orgs including victim PII | `food_poisoning_cases` | MEDIUM | Column-level masking for non-CONFIDENTIAL roles; only show victim name to verifying officer |
| R-03 | data_sharing_histories payloads may contain PII from partner systems | `data_sharing_histories` | MEDIUM | Mark columns as sensitive in ABP audit config; restrict view to ProvinceAdmin+ |
| R-04 | File download URLs must not be guessable (MinIO presigned URLs expire) | `file_attachments` | LOW | Use presigned URLs with 15-minute expiry; server validates org scope before generating |
| R-05 | Cross-org approval — DistrictAdmin must only approve communes under own district | `inspection_plans` | HIGH | `CheckOrganizationAccessAsync` must verify parent relationship, not just org membership |
| R-06 | Background jobs run without a user context — audit log shows "system" actor | Background jobs | LOW | Log job type and trigger source as custom audit data |
| R-07 | Public alert submissions — submitter PII visible to district+ staff | `public_alert_submissions` | MEDIUM | Restrict submitter PII columns to ProvinceAdmin+; district staff see anonymized view |
| R-08 | Cached dashboard stats — a bug could leak other orgs' stats | `cached_dashboard_stats` | LOW | Cache key MUST include organization_id; invalidation scoped per org |

### 4.2 Mitigation Strategy

**R-01**: Add `[Sensitive]` attribute to `auth_config_encrypted` in the entity. ABP audit log automatically masks sensitive properties. UI never renders the raw encrypted value; it shows a redacted placeholder with a "Test Connection" action.

**R-02, R-07**: Implement a UI-level column masking strategy. For roles below CONFIDENTIAL access, victim PII columns are replaced with `[Bảo mật]` in the DTO. The AppService applies a projection based on `CurrentUser.Roles` before returning the DTO.

**R-03**: `DataSharingHistories.View` permission is restricted to ProvinceStaff+ (see permission matrix). Large payloads are stored in MinIO; the DB row contains only a reference path — direct DB access does not expose payload content.

**R-05**: The `CheckOrganizationAccessAsync` method for approval must call `_orgRepository.IsAncestorOf(CurrentUser.OrgId, plan.OrganizationId)` to verify the strict parent-child relationship, not just check whether the commune is "in scope" (which is a weaker check that could be spoofed in edge cases).

---

## 5. Sensitive Data Handling

### 5.1 PII Data

#### Food Poisoning Victim Information (`food_poisoning_cases`)

Columns: `victim_name`, `victim_age`, `victim_gender`, `victim_phone`, `victim_address`, `victim_occupation`

| Requirement | Implementation |
|-------------|---------------|
| **Access control** | Only roles with `Cases.View` permission and org scope |
| **Masking in APIs** | Non-CONFIDENTIAL roles receive masked response: name → initials, phone → last 4 digits |
| **Audit logging** | Every GET on a case containing victim data is logged via ABP AuditLog with entity type + ID |
| **Retention** | Minimum 5 years per Vietnamese health data archival rules (Circular 46/2018/TT-BYT) |
| **Export controls** | Excel/PDF export of victim PII requires `Cases.ExportPII` permission (ProvinceAdmin+) |
| **Encryption at rest** | PostgreSQL tablespace-level encryption recommended for production; application-level not required for these fields |

#### Public Alert Submitter Information (`public_alert_submissions`)

Columns: `submitter_name`, `submitter_phone`, `submitter_email`

| Requirement | Implementation |
|-------------|---------------|
| **Purpose limitation** | Collected only for follow-up contact; must not be used for other purposes |
| **Access control** | Visible to ProvinceAdmin+ only; district staff see anonymized submission content |
| **Data retention** | Delete or anonymize 2 years after submission resolves (Dismissed or ConvertedToAlert) |
| **Public portal** | Submitter identity is never shown on public portal, even if the alert is published |

#### Business Handler Identity (`business_handlers`)

Columns: `id_card_number`, `health_certificate_number`

| Requirement | Implementation |
|-------------|---------------|
| **Access control** | Accessible to staff with `Businesses.View` and in-scope org |
| **Audit logging** | ABP entity change tracking records any modification to `id_card_number` |
| **Validation** | CMND/CCCD format validated server-side (9 or 12 digits) |
| **Masking** | UI masks middle digits (e.g., `012***789`); full value only shown to DistrictAdmin+ |

#### Business Representative Identity (`businesses`)

Columns: `representative_id_card`, `tax_code`

| Requirement | Implementation |
|-------------|---------------|
| **Public portal** | These columns are EXCLUDED from public portal projections |
| **UNIQUE constraint** | `tax_code` has UNIQUE index; `representative_id_card` has no uniqueness requirement |
| **Audit logging** | Changes to `tax_code` and `representative_id_card` tracked via ABP entity property changes |

### 5.2 Encrypted Data

#### API Credentials (`api_specs.auth_config_encrypted`)

- **Algorithm**: AES-256-GCM
- **Key storage**: Stored in `appsettings.json` → `DataProtection:Key` (environment variable in production; never committed to git)
- **Key rotation**: Rotation requires re-encrypting all rows; implement a key version column (`encryption_key_version`) to support graceful rotation
- **Implementation**: Use ASP.NET Core Data Protection API (`IDataProtector`) for encrypt/decrypt
- **Access**: Only the `ApiSpecAppService` decrypts the value; it is never returned as plaintext in DTOs — it is used only for outbound API calls
- **Audit**: Every decryption attempt (i.e., every outbound API call initiation) is logged

#### Password History (`password_history.password_hash`)

- **Algorithm**: bcrypt with cost factor ≥ 12 (ABP Identity default uses ASP.NET Core Identity which uses PBKDF2; password_history should use the same hasher)
- **Storage**: Only the hash is stored; the plaintext password is never persisted
- **Verification**: During password change, the new password is hashed and compared against the last 5 stored hashes using the same hasher's `VerifyHashedPassword` method
- **Retention**: Keep last 5 hashes per user; delete older entries when the 6th hash is added

### 5.3 Public Portal Data

The public portal exposes the following data to anonymous users:

| Data Type | Exposed Fields | Excluded Fields |
|-----------|---------------|----------------|
| Businesses | `name`, `address` (street + commune + district), `business_type`, `status`, `license_status` | `representative_id_card`, `tax_code`, `representative_name`, all `business_handlers` data |
| Products | `name`, `product_group`, `registration_number`, `registration_status` | All internal notes |
| Licenses | `license_type`, `license_number`, `issue_date`, `expiry_date`, `status` | Issuing officer details |
| Inspection Results | `inspection_date`, `result_summary`, `has_violation` | `violation_description` details, `inspector_ids` |
| Alerts (Published) | All `atp_alerts` columns except `created_by`, `creator_org_id` | Creator identity |
| Testing Results | `test_date`, `result_summary`, `testing_center_name` | `raw_result_data` if present |

Public portal endpoints are served by dedicated controllers (`PublicController`) that use explicit column projections — never the same DTOs as internal API endpoints.

---

## 6. Row-Level Security Considerations

### 6.1 Current Approach: Application-Layer Filtering

FoodSafe currently implements data scoping at the **application layer** (AppService), not at the **database layer** (PostgreSQL RLS). This is a deliberate architectural decision aligned with the ABP Framework pattern.

**Reasons for application-layer approach:**
1. ABP's `IRepository` and `IQueryable` pipeline integrates naturally with application-layer filters
2. Complex org hierarchy lookups (resolving all child orgs) are easier to express in LINQ than PostgreSQL RLS policies
3. ABP's built-in `IDataFilter` (e.g., `ISoftDelete`, `IMultiTenant`) already operates at application layer
4. Easier to debug and test compared to database-level policies

**Risk**: A bug in the AppService could bypass the filter. Mitigation: mandatory unit tests for all AppService filter methods.

### 6.2 PostgreSQL RLS — Recommendation for Phase 2+

For the most sensitive tables, consider adding PostgreSQL RLS as a **defense-in-depth** layer (not the primary control):

```sql
-- Example: Restrict food_poisoning_cases at DB level
ALTER TABLE food_poisoning_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY cases_org_isolation ON food_poisoning_cases
    USING (organization_id = current_setting('app.current_org_id')::uuid);
```

The application would set `SET LOCAL app.current_org_id = '...'` at the start of each transaction.

**Trade-off**: Adds complexity; connection pooling (PgBouncer) may not support session-level settings in transaction mode. This is deferred to Phase 2 security hardening after the application layer is proven stable.

---

## 7. Column-Level Security

### 7.1 Sensitive Columns Masked in Audit Logs

ABP AuditLog records entity property changes. The following columns must be configured as `[Sensitive]` to prevent plaintext values from appearing in audit logs:

| Table | Column | Reason |
|-------|--------|--------|
| `api_specs` | `auth_config_encrypted` | Contains encrypted credentials |
| `password_history` | `password_hash` | Hash must not appear in logs |
| `food_poisoning_cases` | `victim_phone` | PII |
| `food_poisoning_cases` | `victim_address` | PII |
| `business_handlers` | `id_card_number` | PII — CMND/CCCD |
| `businesses` | `representative_id_card` | PII |
| `public_alert_submissions` | `submitter_phone` | PII |
| `public_alert_submissions` | `submitter_email` | PII |

Implementation in ABP:
```csharp
// In entity class
[Audited]
public class FoodPoisoningCase : AggregateRoot<Guid>
{
    [DisableAuditing]  // or use custom sensitive attribute
    public string VictimPhone { get; private set; }
    
    [DisableAuditing]
    public string VictimAddress { get; private set; }
}
```

### 7.2 Columns Excluded from Public API Responses

The following columns must never appear in public-facing API responses regardless of the user's role (they should be excluded at the DTO mapping level):

- `api_specs.auth_config_encrypted` (never returned in any response — write-only effectively)
- `password_history.password_hash` (never returned)
- `app_user_profiles.password_expires_at` (user can see own; admin cannot see others')
- `businesses.representative_id_card` (public portal)
- `businesses.tax_code` (public portal)
- `business_handlers.id_card_number` (masked in responses below CONFIDENTIAL)
- `food_poisoning_cases.victim_*` (masked based on role)
- `public_alert_submissions.submitter_*` (masked based on role)
