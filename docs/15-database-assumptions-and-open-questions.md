# Database Assumptions and Open Questions — FoodSafe

> Chi cục An toàn vệ sinh thực phẩm tỉnh Quảng Ninh  
> Phiên bản: 1.0 — Ngày tạo: 2026-07-25  
> Tài liệu này cần xác nhận từ stakeholder trước khi implement các module liên quan

---

## Assumptions Made

### ASM-001: PDF Source Document

**Assumption**: The original PDF source document (`Mẫu số 03. YCKT (1).pdf`, 42 pages) could not be parsed directly during this audit. The existing functional requirements document (`docs/01-functional-requirements.md`) claims to be derived from this PDF. This audit treats `01-functional-requirements.md` as an accurate and complete extraction.

**Scope of impact**: All 57 functional requirements, the entire domain model, all state machines.

**Risk**: Low — the functional requirements document is comprehensive, internally consistent, uses domain-appropriate Vietnamese terminology, and references specific regulatory documents (Nghị định 85/2016/NĐ-CP, Thông tư 31/2026/TT-BCT, Thông tư 46/2018/TT-BYT) correctly.

**Mitigation**: Before Phase 2 implementation, a project stakeholder should review `01-functional-requirements.md` against the original PDF and flag any gaps or misinterpretations.

---

### ASM-002: License Number Uniqueness Scope

**Assumption**: `registration_number` (in `product_registrations`), `declaration_number` (in `self_declarations`), and `certificate_number` (in `eligibility_certificates`, `cfs_certificates`, `export_food_certificates`) are unique **globally** across the system — not unique per business or per issuing authority.

**Rationale**: These are government-issued document numbers. In Vietnamese administrative practice, government-issued numbers (số đăng ký, số chứng nhận) are assigned sequentially by the issuing authority and are globally unique identifiers. A registration number should unambiguously identify exactly one document in the country.

**Implementation**: UNIQUE constraints applied at table level:
```sql
UNIQUE (registration_number)
UNIQUE (declaration_number)
UNIQUE (certificate_number)
```

**Risk if wrong**: If uniqueness is per-business (e.g., two businesses can have `REG-001` independently), the UNIQUE constraints would need to change to composite uniqueness:
```sql
UNIQUE (business_id, registration_number)
```
This would require a schema migration before the Licensing module goes live.

**Stakeholder question**: Confirm whether license and registration numbers in Quảng Ninh's ATVSTP system are globally unique or only unique per business.

---

### ASM-003: Food Poisoning Case Without Incident Is Valid

**Assumption**: A `food_poisoning_cases` record can exist without being linked to a `food_poisoning_incidents` record. The `incident_id` FK is **nullable**. A single case (ca ngộ độc nhỏ lẻ) is a valid standalone record that may or may not later be grouped into a formal poisoning incident (vụ ngộ độc).

**Rationale**: The functional requirements distinguish between "Ca Ngộ độc nhỏ lẻ" (STT 31) and "Vụ Ngộ độc" (STT 32) as separate entities. A case is initially reported independently; an incident is formed when multiple cases are related. Some cases may never be grouped into an incident.

**Implementation**: `food_poisoning_cases.incident_id UUID NULL REFERENCES food_poisoning_incidents(id)`

**Risk if wrong**: If every case must belong to an incident (even a singleton incident), then `incident_id` should be `NOT NULL`. This would require: (a) mandatory incident creation before case creation, or (b) auto-creation of a singleton incident for each case.

**Stakeholder question**: Can a food poisoning case exist without an associated incident? Or must the user always create an incident first and then add cases to it?

---

### ASM-004: InspectionPlan "Rejected" Transition Returns to Draft

**Assumption**: When a DistrictAdmin rejects a commune's inspection plan (Submitted → Rejected), the plan transitions back to `Draft` status (not to a separate `Rejected` terminal status). The `rejected_reason` column captures the reason for rejection, and the submitter can modify and re-submit the plan.

**Rationale**: The state machine in `docs/04-state-machines.md` shows: `Draft → Submitted → Approved → InProgress → Completed | Cancelled`. The "Approve" path implies a rejection path exists, but it is not explicitly shown. The most common government workflow pattern for plan approval is: reject → revise → resubmit. A terminal `Rejected` status would prevent resubmission, which seems impractical for a planning workflow.

**Implementation current state**: The `inspection_plans.status` enum includes `Draft`, `Submitted`, `Approved`, `InProgress`, `Completed`, `Cancelled`. The `Rejected` transition simply resets `status = Draft` and sets `rejected_reason`.

**Risk if wrong**: If `Rejected` is a separate terminal status, the enum must be extended to add `Rejected`, and the state machine diagram must be updated. A rejected plan could not be resubmitted (a new plan would need to be created).

**Impact on schema**: Minor — add `Rejected` to the status enum; `rejected_reason` column is already present either way.

**Stakeholder question**: When a DistrictAdmin rejects a commune's inspection plan, can the commune revise and resubmit the same plan? Or must they create a new plan?

---

### ASM-005: License Expiry by Background Job (Not DB Trigger)

**Assumption**: License expiry (`status` changing from `Active` to `Expired`) is handled by a Hangfire background job that runs nightly (or on demand), checks `expiry_date <= CURRENT_DATE`, and updates the `status` column. No PostgreSQL trigger or generated column is used.

**Rationale**: ABP Framework's preferred pattern for scheduled state transitions is Hangfire background jobs. DB triggers are difficult to audit, cannot be debugged in the application layer, and bypass ABP's audit log middleware. The job approach allows: (a) emitting a domain event when expiry occurs, (b) logging the transition to `status_history` with actor = `SYSTEM_SCHEDULER`, (c) triggering notifications.

**Implementation**: Hangfire recurring job `LicenseExpiryCheckJob` (daily at 01:00 AM) queries:
```sql
SELECT id, status, expiry_date FROM product_registrations
WHERE status = 'Active' AND expiry_date < CURRENT_DATE AND is_deleted = FALSE;
-- Same for eligibility_certificates, cfs_certificates, export_food_certificates
```

**Risk if wrong**: If a PostgreSQL trigger is required (e.g., for compliance reasons that require the DB to enforce expiry regardless of application state), a `BEFORE UPDATE` or `BEFORE INSERT` trigger would need to be added. This adds complexity and may interfere with ABP's EF Core change tracking.

**Stakeholder question**: Is there a compliance requirement that mandates database-level enforcement of license expiry, or is application-layer enforcement (Hangfire job) sufficient?

---

### ASM-006: businesses.tax_code Can Be NULL

**Assumption**: A business (`businesses`) can be registered in the system without a tax code (`tax_code IS NULL`). This applies to small household businesses (hộ kinh doanh cá thể) or newly registered businesses that have not yet received a tax identification number.

**Rationale**: In Vietnamese practice, small food production establishments (hộ gia đình, tổ hợp tác) may operate under a household business license without a full tax code. Requiring `tax_code NOT NULL` would prevent registering these establishments.

**Implementation**: `tax_code VARCHAR(20) NULL UNIQUE` — the UNIQUE constraint uses a partial unique index:
```sql
CREATE UNIQUE INDEX idx_businesses_tax_code ON businesses (tax_code)
    WHERE tax_code IS NOT NULL;
```
This allows multiple `NULL` values (multiple businesses without a tax code) while still preventing two businesses from sharing the same non-null tax code.

**Risk if wrong**: If all businesses in Quảng Ninh's ATVSTP system are required to have a tax code, change to `tax_code VARCHAR(20) NOT NULL UNIQUE`. This is a simple constraint change with no migration complexity.

**Stakeholder question**: Are there businesses in the system that do not have a tax code? If yes, should `tax_code` remain nullable?

---

### ASM-007: Public Portal Does Not Require User Accounts

**Assumption**: The public portal (Nhóm E, STT 41–49) is fully anonymous — all visitors can access public lookup and search features without creating an account or logging in. Only "Gửi Phản ánh" (STT 49, `public_alert_submissions`) requires submitter contact information (name, phone, email), which is collected in the form itself rather than through an account.

**Rationale**: Government public portals in Vietnam are typically anonymous-read by design. Creating a portal user account would create an additional PII management burden and privacy requirement. The submission contact information is stored per-submission in `public_alert_submissions`, not as a user account.

**Implementation**: No `portal_users` table. Public portal endpoints use anonymous HTTP access. The `public_alert_submissions` table stores submitter PII inline.

**Risk if wrong**: If the portal requires user accounts (e.g., for submission history tracking, follow-up communication, spam prevention), a `portal_users` or `portal_sessions` table must be added. This significantly increases scope.

**Stakeholder question**: Does the public portal require user registration, or is anonymous access sufficient? Does a citizen need to be able to check the status of their previously submitted alert?

---

### ASM-008: Virus Scanning Is Asynchronous

**Assumption**: Virus scanning of uploaded files (`file_attachments.virus_scan_status`) is performed **asynchronously** after the file is uploaded. The upload endpoint accepts the file, stores it in MinIO, inserts the `file_attachments` record with `virus_scan_status = 'Pending'`, and returns success to the user. A Hangfire background job then scans the file and updates `virus_scan_status` to `Clean` or `Infected`.

**Rationale**: Virus scanning can take seconds to minutes depending on file size and scanner load. Performing it synchronously would degrade the user experience significantly (especially for large Excel imports or PDF reports). Asynchronous scanning is the industry-standard approach.

**Infected file handling**: If `virus_scan_status = 'Infected'`, the file is quarantined in MinIO (moved to a quarantine bucket) and `is_deleted = TRUE` is set in `file_attachments`. The user and SystemAdmin are notified.

**Risk if wrong**: If synchronous scanning is required (e.g., the security policy mandates no infected file ever reaches the DB record), the upload endpoint must scan before inserting and return an error if infected. This requires a synchronous virus scanning integration (e.g., ClamAV with a socket connection) and complicates the upload flow.

**Stakeholder question**: Is asynchronous virus scanning acceptable (files are accessible for a brief period before scanning completes), or does the security policy require synchronous scanning?

---

### ASM-009: Testing Results Can Reference Multiple Testing Services

**Finding during audit**: The initial schema had `testing_results` missing a FK to `testing_services`. When adding `testing_service_id`, it was assumed that one test result record corresponds to exactly one testing service. However, the domain may require that a single test result references multiple services (e.g., a sample is tested for microbiological AND chemical indicators simultaneously).

**Current implementation**: `testing_service_id UUID NOT NULL REFERENCES testing_services(id)` — one service per result record.

**Alternative**: If multiple services are needed per result, a junction table `testing_result_services(testing_result_id, testing_service_id)` would be required.

**Risk**: Low — if multiple services are needed, the FE would need to display multiple service badges per result, and the DTO changes. The DB change (add junction table, remove FK column) is straightforward but requires migration.

**Stakeholder question**: Can a single testing result record reference multiple testing services? Or is each result always for exactly one service?

---

### ASM-010: data_sharing_histories.status Update on Retry

**Assumption**: The `data_sharing_histories` table, while conceptually insert-only (no business-driven updates), allows the retry lifecycle fields (`status`, `retry_count`, `next_retry_at`, `http_status_code`, `response_payload`, `completed_at`, `error_message`) to be updated by the retry background job. This is the only case where a `data_sharing_histories` record is updated.

**Alternative (stricter immutability)**: Insert a new child record `data_sharing_history_attempts(id, history_id, attempt_number, status, http_status_code, response_payload, attempted_at, error_message)` for each retry attempt. The parent `data_sharing_histories` record would store only the final aggregated status.

**Trade-off**: 
- Current approach: simpler schema, slightly less audit granularity (cannot distinguish attempt 1 from attempt 3 outcomes without reading through the updates)
- Strict approach: more audit granularity, more schema complexity, more storage

**Recommendation for Phase 2+**: Implement the `data_sharing_history_attempts` child table after Phase 1 validation. Phase 1 uses the simpler approach.

**Impact**: Schema change if strict immutability required — add `data_sharing_history_attempts` table, remove retry fields from `data_sharing_histories`.

---

## Open Questions

### OQ-001: InspectionPlan Approval Hierarchy

**Question**: When a commune submits an inspection plan (`status = Submitted`), who approves it?

**Observed ambiguity**: The permission matrix shows `Plans.Approve` is granted to `SystemAdmin`, `ProvinceAdmin`, and `DistrictAdmin (kế hoạch của xã thuộc huyện)`. This implies a commune's plan is approved by the DistrictAdmin of the commune's parent district.

**Sub-questions**:
1. Does a province-level plan (submitted by ProvinceStaff) get approved by ProvinceAdmin?
2. Does a district-level plan get approved by ProvinceAdmin or the district's own admin?
3. Is there a delegation mechanism (DistrictAdmin can delegate approval to a senior DistrictStaff)?

**Impact on schema**: None — the current schema stores `approved_by_id`, `approved_at`, and the approval permission check is enforced at the AppService level. But the AppService `CheckOrganizationAccessAsync` logic for approval needs clarification.

---

### OQ-002: AtpAlert Auto-integration vs Manual Trigger

**Question**: When an `atp_alert` transitions to `Published`, does the system automatically send it to Bộ Y tế and Sở Công thương via the integration module? Or must a staff member manually trigger the "Share Alert" action?

**Observed ambiguity**: The functional requirements mention both alert publishing (STT 29) and alert sharing history (STT 51), but do not explicitly state whether the share is automatic or manual.

**Impact on schema**: None directly, but affects the `data_sharing_histories` creation logic — whether it is triggered by a domain event handler on `AlertPublishedEvent` or by a separate user action.

**Suggested resolution**: Implement as automatic (domain event handler triggers outbound integration) with the ability to manually re-share if the automatic attempt fails.

---

### OQ-003: Dashboard Statistics Recalculation Frequency

**Question**: How frequently should `cached_dashboard_stats` be refreshed? The current design uses a Hangfire job, but the frequency is not specified.

**Options**:
- Real-time (no cache) — recompute on every dashboard load — **not recommended** at 30 concurrent users
- Every 15 minutes — appropriate for operational dashboards
- Every hour — appropriate if data changes are infrequent
- Nightly — appropriate only if data changes once per day (not suitable for this system)
- Event-driven — invalidate and recompute when a specific entity type changes

**Impact on schema**: None — `cached_dashboard_stats` has `cache_expiry_at TIMESTAMPTZ`. The chosen frequency determines the value written to this column.

**Recommendation**: 15-minute refresh for counts (businesses, cases), hourly for aggregated statistics (inspection completion rates, monthly report aggregates).

---

### OQ-004: FoodPoisoningIncident — Can It Contain Cases From Multiple Organizations?

**Question**: A `food_poisoning_incident` (vụ ngộ độc) may involve victims from multiple communes or districts (e.g., a food festival with attendees from across the province). Can a poisoning incident aggregate cases from multiple organizations?

**Current schema**: `food_poisoning_cases.incident_id` links a case to an incident. The case has its own `organization_id`. The incident has its own `organization_id` (the org that manages/owns the incident).

**Ambiguity**: If a commune staff reports a case and a district admin creates an incident from it, who "owns" the incident? Can the district admin aggregate cases from communes outside their district if those cases are part of the same outbreak?

**Impact on schema**: If cross-org incidents are allowed, the `food_poisoning_incidents.organization_id` must represent the managing org (not necessarily the org of all constituent cases). The `CheckOrganizationAccessAsync` for viewing an incident must then allow access if the user's org is either the incident's org OR owns at least one case linked to the incident.

---

### OQ-005: Report Submission Deadline Enforcement

**Question**: Are there deadline requirements for monthly NDTP reports (e.g., must be submitted by the 5th of the following month)? If so:
1. Should the DB store the deadline?
2. Should the system reject submissions after the deadline?
3. Or should it accept late submissions with a `is_late_submission = true` flag?

**Current schema**: `ndtp_reports` has `report_period_start`, `report_period_end`, `submitted_at` — but no `deadline` or `is_late_submission` column.

**Impact on schema**: Add `submission_deadline DATE`, `is_late_submission BOOLEAN` to all three report tables if deadlines are enforced.

---

### OQ-006: Certificate of Free Sale (CFS) vs Export Food Certificate — Overlap

**Question**: `cfs_certificates` and `export_food_certificates` appear to serve similar purposes (both are export-related food safety certifications). Is there a business rule that prevents a product from having both a CFS and an Export Food Certificate simultaneously? Or is it possible/common for a product to have both?

**Current schema**: Both tables are independent; no constraint prevents a product from being linked to both. The `business_id` FK on both tables links them to the business, not the specific product.

**Impact on schema**: If mutual exclusion is required, a CHECK or application-level guard is needed. If a product-level link is required (not just business-level), a `product_id FK` column should be added to both tables.

---

### OQ-007: Testing Center vs Organization Scoping

**Question**: Is a `testing_centers` record scoped to an organization (managed by a specific province/district), or is it a global catalog entry (managed by SystemAdmin/ProvinceAdmin only)?

**Current schema**: `testing_centers` has no `organization_id` column — it is treated as a global catalog.

**Ambiguity**: If districts or communes can register their own testing centers, `testing_centers` needs an `organization_id` FK. If testing centers are province-wide resources (centrally managed), the global catalog approach is correct.

**Impact on schema**: If org-scoped: add `organization_id UUID NOT NULL REFERENCES organizations(id)` to `testing_centers`. If global: no change.

---

### OQ-008: AdRegistration — Is It Scoped to Product or Business?

**Question**: An `advertisement_registrations` record (Đăng ký QC) — is it registered against a specific product, against a product registration, or simply against a business? The domain model suggests it relates to advertising claims for a specific product.

**Current schema**: `advertisement_registrations` has `business_id` FK but no explicit `product_id` or `product_registration_id` FK. The `ad_reg_products` junction table links ad registrations to products.

**Ambiguity**: Is the many-to-many relationship (`ad_reg_products`) correct? Can a single ad registration cover multiple products from the same business? Or is each ad registration always for exactly one product?

**Impact on schema**: If one-to-one (ad reg → product): add `product_id NOT NULL FK` directly to `advertisement_registrations` and remove `ad_reg_products`. If many-to-many: keep `ad_reg_products` as-is. The current many-to-many design is safer.

---

## Known Limitations of This Audit

The following topics were reviewed but **not fully validated** in this audit pass:

1. **EF Core migration generation**: The schema was designed as SQL DDL. The C# entity models in `FoodSafe.Domain` and `FoodSafe.EntityFrameworkCore` have not yet been implemented. Mapping accuracy (column names, types, conventions) will be validated when EF Core migrations are generated.

2. **Performance under load**: The index strategy is based on query pattern analysis from the functional requirements. Actual query performance under 30+ concurrent users with production-scale data (e.g., 5,000+ businesses, 10,000+ inspection results) requires load testing (JMeter or k6) after Phase 1 implementation.

3. **PostgreSQL RLS implementation**: Row-Level Security at the database layer was analyzed but not designed in detail (see `docs/11-database-security-and-data-scope.md` Section 6.2). This remains a Phase 2 security hardening task.

4. **PITR backup configuration**: PostgreSQL Point-In-Time Recovery (streaming replication + WAL archival) is required for production but is a deployment/infrastructure concern outside the scope of schema design.

5. **Full-text search**: FTS (PostgreSQL `tsvector` / Meilisearch) for the public portal was not designed. The current schema supports basic `ILIKE` searches via indexes on `name` columns. FTS is deferred to Phase 2+.

6. **Notification system**: An in-app notification table (`notifications`) was identified as a Phase 2+ concern. When report deadlines approach, when an alert submission is resolved, or when an integration call fails, the system should push notifications to relevant users. This requires a `notifications` table not present in the current schema.

7. **Report template storage**: The system needs to store Word/Excel templates for generating report exports (QuestPDF templates, ClosedXML templates). These are file assets, not DB records, and are stored in MinIO. No schema change is required, but the MinIO bucket structure and template versioning strategy need to be documented.
