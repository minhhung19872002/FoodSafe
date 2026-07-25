# Database History and Audit Strategy — FoodSafe

> Chi cục An toàn vệ sinh thực phẩm tỉnh Quảng Ninh  
> Phiên bản: 1.0 — Ngày tạo: 2026-07-25  
> Hệ thống thông tin cấp độ 2 — lưu trữ kiểm toán bắt buộc

---

## 1. Overview

### 1.1 Why History Matters

FoodSafe is a Level-2 government information system under Nghị định 85/2016/NĐ-CP. This classification imposes strict legal obligations:

1. **Traceability**: Every modification to official records (inspection results, food poisoning cases, licenses, reports) must be attributable to a specific user, timestamp, and action.
2. **Non-repudiation**: A submitted report or verified inspection result must not be retroactively altered; the original version must be preserved.
3. **Accountability for government staff**: In the event of a legal dispute or state audit, the system must prove who entered data, when they entered it, and what changes were made.
4. **Error correction governance**: When a report is returned for correction, both the original submission and the correction must be preserved — the system must not overwrite history.
5. **Integration integrity**: Every data exchange with external agencies (Bộ Y tế, Sở NN, Sở CT) must be logged with full request/response payloads for dispute resolution.

### 1.2 History Mechanisms Used

FoodSafe uses five complementary mechanisms. Each serves a different purpose and operates at a different layer:

| # | Mechanism | Layer | Scope | Automation |
|---|-----------|-------|-------|------------|
| 1 | **ABP AuditLog** | Infrastructure | All authenticated operations | Automatic (ABP middleware) |
| 2 | **ABP EntityChange / PropertyChange** | Infrastructure | EF Core tracked entities | Automatic (ABP DbContext) |
| 3 | **`status_history` table** | Domain | All workflow transitions | Manual (called from Domain entities) |
| 4 | **Error notification tables** | Domain | Correction requests per report/case type | Manual (called from AppService) |
| 5 | **Soft delete (`is_deleted`)** | Infrastructure | All domain entities | Automatic (ABP soft-delete filter) |
| 6 | **Typed `document_owners` + immutable report submissions** | Domain | Enforceable attachment ownership and files sealed per submission | FK + insert-only snapshots |

---

## 2. What Is Versioned vs Immutable vs Soft-Deleted

### 2.1 Immutable Records

Once a record reaches certain terminal or semi-terminal states, it transitions to **immutable** — no further edits are permitted at the application layer. The database does not enforce this (no `CHECK` triggers for immutability), so the AppService must enforce it via workflow guards:

| Entity | Immutable After | Enforcement |
|--------|----------------|-------------|
| `ndtp_reports` | `status = Submitted` (until Returned) | Domain guard in `NdtpReport.Submit()` |
| `ndtp_reports` | `status = Completed` (permanently) | Domain guard; no transition out of Completed |
| `atp_work_reports` | Same pattern as ndtp_reports | Same |
| `action_month_reports` | Same pattern as ndtp_reports | Same |
| `food_poisoning_cases` | `status = Verified` (permanently) | Domain guard in `FoodPoisoningCase.Verify()` |
| `food_poisoning_incidents` | `status = Concluded` (permanently) | Domain guard |
| `inspection_results` | Once linked to a Completed inspection plan | Guard in `InspectionResult.Finalize()` |
| `atp_alerts` | `status = Published` (content locked; only Recall allowed) | Domain guard |
| `data_sharing_histories` | Always (insert-only table) | No Update endpoint exists; repository has no UpdateAsync |

**Important**: "Immutable" means the **content** cannot be changed. The **status** may still transition (e.g., Submitted → Returned allows a new correction cycle). When a record is returned for correction, a new draft cycle begins — the original submission is preserved in `status_history`.

### 2.2 Soft-Deleted Records

All domain entities that carry `is_deleted BOOLEAN NOT NULL DEFAULT FALSE` are soft-deleted rather than hard-deleted. This applies to every custom table (approximately 44 tables).

**Why no hard delete:**
- Government records have legal retention requirements
- A deleted business may still be referenced by historical inspection results
- ABP's `ISoftDelete` filter automatically excludes `is_deleted = TRUE` rows from all queries
- The filter can be disabled in specific AppService methods that need to view deleted records (e.g., audit queries)

**Hard delete is permitted only for:**
- `cached_dashboard_stats` — regenerated data, no legal significance
- `status_history` — never; immutable
- `data_sharing_histories` — never; immutable
- ABP internal tables — managed by ABP

**Accessing soft-deleted records:**
```csharp
using (_dataFilter.Disable<ISoftDelete>())
{
    var deletedBusiness = await _businessRepo.GetAsync(id);
}
```
This pattern is used only by SystemAdmin audit queries.

### 2.3 Status History

The `status_history` table is a **generic polymorphic** audit table that records every workflow state transition for any entity in the system.

**Schema:**
```sql
CREATE TABLE status_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type     VARCHAR(100) NOT NULL,   -- e.g., 'NdtpReport', 'FoodPoisoningCase'
    entity_id       UUID NOT NULL,
    from_status     VARCHAR(50),             -- NULL for initial creation
    to_status       VARCHAR(50) NOT NULL,
    changed_by_id   UUID NOT NULL,           -- references AbpUsers(Id)
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    reason          TEXT,                    -- required for Return, Recall, Reject
    notes           TEXT
);

CREATE INDEX idx_status_history_entity ON status_history (entity_type, entity_id, changed_at);
```

**Entities that receive status_history records:**

| Entity Type | Tracked Transitions |
|-------------|---------------------|
| `NdtpReport` | Draft→Submitted, Submitted→Verified, Verified→Returned, Returned→Draft (re-submit), Verified→Completed |
| `AtpWorkReport` | Same pattern |
| `ActionMonthReport` | Same pattern |
| `FoodPoisoningCase` | Draft→Reported, Reported→Verified |
| `FoodPoisoningIncident` | Draft→Reported, Reported→Verified, Verified→Concluded |
| `InspectionPlan` | Draft→Submitted, Submitted→Approved, Submitted→Rejected(→Draft), Approved→InProgress, InProgress→Completed, any→Cancelled |
| `AtpAlert` | Draft→Published, Published→Recalled |
| `AtpNews` | Draft→Published, Published→Recalled |
| `PublicAlertSubmission` | Pending→UnderReview, UnderReview→ConvertedToAlert, UnderReview→Dismissed |

**Writing to status_history** happens in the Domain entity's transition method or immediately after in the AppService, never deferred to a background job (to guarantee the record is written atomically with the status change):

```csharp
// In Domain entity
public void Submit(Guid userId)
{
    if (Status != ReportStatus.Draft)
        throw new BusinessException(FoodSafeErrorCodes.Report.CannotSubmitNonDraft);
    
    var previousStatus = Status;
    Status = ReportStatus.Submitted;
    SubmittedAt = Clock.Now;
    SubmittedById = userId;
    
    AddDomainEvent(new ReportSubmittedEvent(Id, userId, previousStatus));
}

// In AppService, after SaveChangesAsync
await _statusHistoryRepo.InsertAsync(new StatusHistory(
    entityType: "NdtpReport",
    entityId: report.Id,
    fromStatus: previousStatus.ToString(),
    toStatus: ReportStatus.Submitted.ToString(),
    changedById: CurrentUser.GetId()
));
```

### 2.4 Error Notification Pattern

When a verifying officer returns a report for correction (status → Returned), they must provide a reason. This reason is recorded in a dedicated error notification table for each report type. The pattern creates a structured correction audit trail that is separate from the generic `status_history`.

**Tables:**
- `ndtp_report_error_notifications` — corrections for monthly food poisoning reports
- `atp_work_report_error_notifications` — corrections for ATTP work reports (6-month / annual)
- `action_month_report_error_notifications` — corrections for action month reports

**Schema pattern (identical for all three):**
```sql
CREATE TABLE ndtp_report_error_notifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id           UUID NOT NULL REFERENCES ndtp_reports(id),
    notification_reason TEXT NOT NULL,
    notified_by_id      UUID NOT NULL,   -- references AbpUsers(Id)
    notified_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at         TIMESTAMPTZ,     -- set when report re-submitted
    resolution_notes    TEXT,
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    -- ABP audit columns
    creation_time       TIMESTAMPTZ NOT NULL DEFAULT now(),
    creator_id          UUID
);
```

The error notification is created in the same transaction as the Return status transition. When the report is subsequently re-submitted (Draft → Submitted cycle 2), `resolved_at` is set and `resolution_notes` can be added.

---

## 3. Audit Log Strategy

### 3.1 ABP Built-in Coverage

ABP Framework automatically writes to `AbpAuditLogs` for every HTTP request made by an authenticated user. Each audit log record contains:

- `HttpMethod`, `Url`, `HttpStatusCode`
- `UserId`, `UserName`, `ImpersonatorUserId`
- `ClientIpAddress`, `BrowserInfo`
- `ExecutionTime`, `ExecutionDuration`
- `Exceptions` (serialized exception if request failed)
- List of `AbpAuditLogActions` (service + method name, parameters, execution time)
- List of `AbpEntityChanges` (entity type, entity ID, change type: Created/Updated/Deleted)
- For each `AbpEntityChange`: list of `AbpEntityPropertyChanges` (property name, old value, new value)

This covers **all authenticated HTTP operations** without any additional code.

### 3.2 Entity Change Tracking

ABP's `AbpEntityChanges` + `AbpEntityPropertyChanges` tables record before/after values for every EF Core-tracked entity modification. This is enabled by default when the entity implements `IHasModificationTime` or is an `AggregateRoot`.

**What gets tracked:**
- Field changes: old value → new value for each changed property
- Create events: all initial field values
- Soft-delete events: `is_deleted` changing from `false` to `true`

**What is excluded from tracking** (configured via `[DisableAuditing]`):
- `password_hash` in `password_history`
- `auth_config_encrypted` in `api_specs`
- `victim_phone`, `victim_address` in `food_poisoning_cases`
- `id_card_number` in `business_handlers`
- `representative_id_card` in `businesses`

**Enabling detailed tracking in EF Core:**
```csharp
// In FoodSafeDbContext.OnModelCreating
builder.Entity<FoodPoisoningCase>(b =>
{
    b.Property(e => e.VictimPhone).HasColumnName("victim_phone");
    // ABP automatically uses [DisableAuditing] attribute
});
```

### 3.3 Retention Policy

The minimum audit log retention is **2 years** as implied by Nghị định 85/2016/NĐ-CP for Level-2 systems. For domain records (reports, cases, inspections), Vietnamese government archival rules (Luật Lưu trữ 2011, Thông tư 09/2011/TT-BNV) require longer retention depending on record type:

| Record Type | Minimum Retention | Archival Category |
|-------------|------------------|-------------------|
| `AbpAuditLogs` | 2 years | System audit |
| `AbpEntityChanges` | 2 years | System audit |
| `status_history` | 5 years | Workflow audit |
| `ndtp_reports` (and error notifications) | 5 years | Government report |
| `food_poisoning_cases` | 10 years | Health record |
| `food_poisoning_incidents` | 10 years | Health record |
| `inspection_results` | 5 years | Enforcement record |
| `data_sharing_histories` | 2 years | Integration audit |
| `password_history` | 3 years after user deletion | Security record |

**Enforcement mechanisms:**
1. **Scheduled cleanup job** (Hangfire): Runs monthly, deletes `AbpAuditLogs` older than 2 years and `AbpEntityChanges` older than 2 years.
2. **Archival pipeline** (Phase 2+): Domain records approaching retention limits are flagged `is_archived = true` and moved to a cold-storage schema before deletion.
3. **No DELETE endpoints** for records with retention requirements — the AppService simply does not expose a Delete operation for `status_history`, `data_sharing_histories`, or error notification tables.

### 3.4 What ABP Does NOT Cover

The following actions are not automatically captured by ABP AuditLog and require **custom logging**:

| Gap | Description | Solution |
|-----|-------------|---------|
| **Hangfire background job executions** | License expiry checks, report reminders, integration retry jobs run without a user HTTP context | Write a custom `IJobExecutionLogger` that logs job type, trigger time, entity IDs affected, and outcome to a custom `background_job_logs` table or to ABP audit log with a synthetic "user" = system |
| **Scheduled status transitions** | License auto-expiry changes `status = Expired` with no user actor | Set `actor = 'SYSTEM_SCHEDULER'` in a custom audit event; include entity ID and reason |
| **MinIO file operations** | File upload/download is not an EF Core operation; ABP does not track it | Log file access in the `FileAttachmentAppService` using `ILogger` + a structured log event; correlate with the audit log request via correlation ID |
| **External API calls** | Outbound calls to Bộ Y tế are tracked in `data_sharing_histories` but not in `AbpAuditLogs` | `data_sharing_histories` serves as the audit trail; ensure it is written before the HTTP call is made (record `status = Sending`) |
| **Login failures** | ABP logs successful logins; failed logins may not create an audit record | Configure ASP.NET Core Identity's `IUserClaimsPrincipalFactory` or OpenIddict events to log failures |

---

## 4. File Version Tracking

### 4.1 The Problem

When a report goes through multiple correction cycles, each cycle may have different file attachments:

```
Cycle 1: Draft (user uploads files v1) → Submit → Return (verifier requires corrections)
Cycle 2: Draft (user uploads files v2, possibly replacing v1) → Submit → Verify → Complete
```

Without versioning, it is impossible to know which files were attached at the time of the first submission versus the second submission. This matters for legal audit purposes.

### 4.2 Solution: typed document owners and immutable submission owners

`file_attachments.document_owner_id` has a real FK to `document_owners`.
Every attachable aggregate uses the shared-primary-key owner pattern and, for
org-scoped data, a composite FK also enforces organization equality.

For reports, the mutable header is not the owner of sealed evidence. Each
`*_report_submissions` row is an immutable owner. Files included in submission
version N reference that submission row's owner. A later correction creates a
new snapshot/owner, so version-N files cannot be confused with current draft
files. `storage_path` is unique and file checksum/scan/retention metadata remain
on `file_attachments`.

---

## 5. Report Workflow History

### 5.1 Status History for Reports

Every status transition for every report type is written to `status_history`. This provides a complete timeline:

**Example timeline for an NDTP report:**

| Timestamp | from_status | to_status | changed_by | reason |
|-----------|------------|-----------|------------|--------|
| 2026-01-05 08:00 | NULL | Draft | user_a | (creation) |
| 2026-01-10 14:32 | Draft | Submitted | user_a | |
| 2026-01-12 09:15 | Submitted | Returned | verifier_b | Thiếu số liệu tháng 12 |
| 2026-01-14 10:00 | Returned | Draft | user_a | |
| 2026-01-15 11:30 | Draft | Submitted | user_a | |
| 2026-01-15 16:45 | Submitted | Verified | verifier_b | |
| 2026-01-16 08:00 | Verified | Completed | verifier_b | |

This history is accessible via `GET /api/ndtp-reports/{id}/status-history` (ProvinceAdmin+).

### 5.2 Error Notifications

Error notifications complement `status_history` by providing structured correction details:

- When `status` changes to `Returned`, one `ndtp_report_error_notifications` record is created in the same transaction
- `notification_reason` is a required free-text field (min 20 characters) to prevent empty returns
- The error notification is linked to the report via `report_id` FK
- After re-submission, `resolved_at` is set (not deleted)
- Multiple error notification records can exist for a single report (one per return cycle)

### 5.3 Re-submission Tracking

The report header retains `submission_version` and current workflow evidence.
Every `Submit()` transaction inserts one row into the corresponding immutable
`ndtp_report_submissions`, `atp_work_report_submissions`, or
`action_month_report_submissions` table. The unique `(report_id,
submission_version)` key prevents duplicate cycle numbers; `content_snapshot`
and `content_sha256` preserve exactly what was sent, to whom, by whom, and when.

---

## 6. Integration History

### 6.1 data_sharing_histories Coverage

Every outbound and inbound integration envelope is recorded in
`data_sharing_histories`; each concrete call is an insert-only
`data_sharing_attempts` row. The envelope may update only overall delivery and
scheduling fields and is never deleted.

**Schema:**
```sql
CREATE TABLE data_sharing_histories (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_spec_id         UUID NOT NULL REFERENCES api_specs(id),
    direction           VARCHAR(10) NOT NULL,     -- 'Outbound' | 'Inbound'
    data_type           VARCHAR(50) NOT NULL,     -- 'Alert' | 'InspectionResult' | etc.
    entity_id           UUID,                     -- source entity in FoodSafe
    external_entity_id  VARCHAR(200),             -- partner system's entity ID
    idempotency_key     VARCHAR(200),             -- for inbound deduplication
    status              VARCHAR(30) NOT NULL,     -- Sending/Success/Failed/ManualReview
    http_status_code    INTEGER,
    request_payload     TEXT,                     -- for small payloads (<1MB); else NULL
    response_payload    TEXT,                     -- for small payloads (<1MB); else NULL
    payload_storage_path VARCHAR(500),            -- MinIO path if payload too large
    payload_checksum    VARCHAR(64),              -- SHA-256 of request_payload
    error_message       TEXT,
    retry_count         INTEGER NOT NULL DEFAULT 0,
    next_retry_at       TIMESTAMPTZ,
    sent_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at        TIMESTAMPTZ,
    -- NO is_deleted — this table is immutable
    -- ABP audit (creation only)
    creation_time       TIMESTAMPTZ NOT NULL DEFAULT now(),
    creator_id          UUID
);

CREATE UNIQUE INDEX idx_data_sharing_idempotency ON data_sharing_histories (idempotency_key)
    WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_data_sharing_retry ON data_sharing_histories (next_retry_at)
    WHERE status = 'Failed' AND next_retry_at IS NOT NULL;
```

### 6.2 Payload Storage Strategy

| Condition | Storage |
|-----------|---------|
| Payload size ≤ 1 MB | Store in `request_payload` / `response_payload` TEXT columns |
| Payload size > 1 MB | Store in MinIO under `integration-payloads/{year}/{month}/{id}.json`; store path in `payload_storage_path`; leave `request_payload` NULL |
| Response not yet received | `response_payload` = NULL, `status` = Sending |
| Sensitive payload | Same as above; MinIO bucket has restricted access |

**Checksum**: `payload_checksum` is the SHA-256 hex of `request_payload` (or of the MinIO object if large). Used for tamper detection in dispute resolution. The checksum is computed before insertion and never updated.

### 6.3 Error and Retry History

The retry lifecycle:

```
Initial attempt: status = Sending → (on HTTP success) status = Success
                                   → (on HTTP error)   status = Failed, retry_count = 0, next_retry_at = now() + 5min

Retry attempt 1: status = Sending → (success) status = Success
                                   → (error)  retry_count = 1, next_retry_at = now() + 30min

Retry attempt 2: retry_count = 2, next_retry_at = now() + 2h

Retry attempt 3: retry_count = 3, next_retry_at = now() + 12h

Retry attempt 4: retry_count = 4 → status = ManualReview (no more auto-retry)
```

Hangfire picks up envelopes where `status = Failed AND next_retry_at <= now()`.
The envelope may update its overall delivery state, but the initial call and
every retry insert an immutable `data_sharing_attempts` row. Attempt rows retain
attempt number, endpoint, request/response and checksums, start/end/duration,
outcome, and error. No retry overwrites an earlier attempt.

---

## 7. Legal and Compliance Requirements

### 7.1 Minimum Retention Periods

| Category | Retention | Legal Basis |
|----------|-----------|-------------|
| System audit logs (`AbpAuditLogs`) | 2 years | Nghị định 85/2016/NĐ-CP, Cấp độ 2 |
| Entity change history | 2 years | Same |
| Workflow status history (`status_history`) | 5 years | Luật Lưu trữ 2011 — Nhóm hồ sơ công vụ |
| Food poisoning reports and cases | 10 years | Thông tư 46/2018/TT-BYT — Lưu trữ hồ sơ y tế |
| Inspection plans and results | 5 years | Luật Thanh tra — hồ sơ thanh tra |
| Licenses (registrations, certificates) | 10 years | Luật Lưu trữ — vĩnh viễn với hồ sơ gốc |
| Integration histories | 2 years | Thông tư 31/2026/TT-BCT |
| Password history | 3 years post-user-deletion | Security best practice |

### 7.2 Immutability Guarantees

Immutability is enforced at two layers:

**Layer 1 — Application controls:**
- Workflow guard methods in Domain entities throw `BusinessException` on illegal transitions
- No Update endpoint exists for `status_history` or `data_sharing_histories`
- `is_deleted` cannot be set to `false` once it is `true` — there is no "restore" endpoint (except SystemAdmin)
- Report content cannot be modified after `status = Submitted` — the AppService checks `CanEdit` before any property is changed

**Layer 2 — Database constraints:**
- Foreign key references to reports/cases are `ON DELETE RESTRICT` — parent records cannot be deleted while child records exist
- All audit tables have no `UPDATE` or `DELETE` permissions granted to the application DB user (`foodsafe_app`):
  ```sql
  REVOKE UPDATE, DELETE ON status_history FROM foodsafe_app;
  REVOKE UPDATE, DELETE ON data_sharing_histories FROM foodsafe_app;
  REVOKE DELETE ON AbpAuditLogs FROM foodsafe_app;
  ```
- The application DB user has `INSERT, SELECT` only on these tables
- Backdating prevention: `changed_at`, `sent_at`, `creation_time` use `DEFAULT now()` and are never set by application code — the DB sets them on insert

### 7.3 Compliance Checklist

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Audit log for all authenticated operations | ✅ | ABP AuditLog middleware |
| Before/after values for data changes | ✅ | ABP EntityChange + PropertyChange |
| Workflow history with actor and timestamp | ✅ | `status_history` table |
| Correction tracking for reports | ✅ | Error notification tables (all 3 report types) |
| File attachment versioning | ✅ | Typed submission `document_owner_id` in `file_attachments` |
| Integration call logging | ✅ | `data_sharing_histories` (insert-only) |
| Soft delete (no hard delete of domain records) | ✅ | `is_deleted` on all domain entities |
| PII access logging | ✅ | ABP AuditLog + `[DisableAuditing]` for hash columns |
| Retention period enforcement | PLANNED | Hangfire cleanup job (Phase 2) |
| Immutable audit tables (DB-level) | PLANNED | REVOKE permissions (Phase 2 security hardening) |
| Database backup with PITR | PLANNED | PostgreSQL streaming replication + WAL archival (deployment) |
