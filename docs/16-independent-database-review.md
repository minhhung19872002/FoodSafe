# Independent Database Architecture Review — FoodSafe

**Review role:** Independent Principal Database Architect  
**Primary source:** `Mẫu số 03. YCKT (1).pdf`  
**Design reviewed:** `01` through `13`, with `03-database-schema.sql` treated as the implementable database design  
**Excluded from the independent pass:** `14-database-review-report.md` was not opened or used  
**Code changes:** None

> **Resolution update — 2026-07-25:** Every finding was re-verified against the
> original PDF, functional requirements, state machines, and permission matrix.
> Section 4 records 14 Accepted, 11 Partially accepted, and 2 Rejected findings.
> Schema/design corrections were applied only for the 14 Accepted findings.

## 1. Executive conclusion

The schema has broad functional coverage, but it is **not ready for production migration**. Its principal weakness is not the number of tables; it is the absence of database-enforced boundaries between organization scope, geographic scope, parent ownership, workflow submissions, attachments, and integration attempts.

The most consequential defects are:

- a child row can carry an `organization_id` different from its parent and thereby cross an authorization boundary;
- submitted reports are overwritten in place, so prior officially submitted content cannot be reconstructed;
- upward reporting has no persisted recipient, approval chain, or aggregation lineage;
- attachment ownership is polymorphic and unenforced;
- integration retry and idempotency structures cannot provide the complete, partner-scoped history required by the source;
- several source-required business concepts are reduced to booleans or free text.

### Severity summary

| Severity | Count |
|---|---:|
| Critical | 4 |
| High | 15 |
| Medium | 8 |
| Low | 0 |
| **Total** | **27** |

## 2. Review method and interpretation

The PDF was read first, page by page, before inspecting the design. Persistent requirements were extracted from:

- system administration, organization and geographic catalogs;
- facilities, products, licenses, inspection plans and results;
- food-poisoning cases, incidents and upward reports;
- alerts, news, risk analysis, testing and regulatory documents;
- public lookup and public submissions;
- API specifications and complete inbound/outbound exchange history;
- server-side authorization, database integrity, audit, attachments and retention.

The review distinguishes:

- **database guarantees** in executable DDL;
- **application intentions** described in Markdown but not enforced by the schema;
- **source requirements** that need durable data even when the PDF describes them as a function.

Page references use the PDF page number, counting the first displayed page as page 1.

## 3. Findings

### IDB-001 — Organization scope can contradict parent ownership

- **Severity:** Critical
- **PDF reference:** Page 6, requirement 15 (server-side data-domain authorization); pages 20–21, STT 19–20; pages 22–28, STT 21–28
- **Affected tables/entities:** `products`, all declaration/certificate tables, `inspection_results`, `testing_results`, `atp_alerts`, `food_poisoning_cases`, `food_poisoning_incidents`, reports, and other rows containing both `organization_id` and a parent FK
- **Failure scenario:** A product references a business owned by organization A but stores organization B in `products.organization_id`. Organization-B filtering then exposes and permits operations on an A-owned business product. The same pattern can place a license, inspection result, test result, or report in a scope unrelated to its parent.
- **Recommended correction:** Choose an authoritative ownership path. Prefer deriving scope through the parent where practical. Where denormalized `organization_id` is retained for performance, enforce equality with composite foreign keys, for example `(business_id, organization_id) -> businesses(id, organization_id)`, backed by a matching unique key. Apply the same pattern to every parent/child scope pair.
- **Confidence:** High

### IDB-002 — Submitted report content is not versioned

- **Severity:** Critical
- **PDF reference:** Pages 31–34, STT 33–35: draft, approve/send, no editing after send, error notification, return and permitted correction
- **Affected tables/entities:** `ndtp_reports`, `atp_work_reports`, `action_month_reports`, `status_history`, `file_attachments`
- **Failure scenario:** Version 1 is submitted, returned, edited, and submitted again. `submission_version` increments, but all report fields remain on the same mutable row. `status_history` records only status numbers and comments; it does not preserve the field values submitted in version 1. An auditor cannot reproduce what the lower-level unit originally approved and sent.
- **Recommended correction:** Introduce immutable report submission tables, such as `ndtp_report_versions`, with one snapshot per submission cycle, including content, computed figures, submitter, submitting organization, recipient organization, timestamps, and a content hash. Keep the report header as the current workflow aggregate. Attachments must reference the immutable version row by FK rather than an optional integer.
- **Confidence:** High

### IDB-003 — Upward reporting and aggregation lineage are not persisted

- **Severity:** Critical
- **PDF reference:** Pages 31–35, STT 33–35: commune/ward sends upward; upper level follows, verifies, returns, and aggregates province-wide reports
- **Affected tables/entities:** `ndtp_reports`, `atp_work_reports`, `action_month_reports`
- **Failure scenario:** A commune report is submitted, but the database does not record which upper organization received it. A province report stores totals but cannot identify the subordinate reports, cases, incidents, inspections, or source snapshot included. Recalculation after source records change yields figures different from the approved report.
- **Recommended correction:** Persist `submitted_to_organization_id`, workflow assignment/approval records, and report aggregation membership. Add typed link tables from each submitted aggregate version to subordinate report versions and/or source records, including inclusion timestamps and source version/hash. Enforce that the recipient is an authorized ancestor or configured management focal point.
- **Confidence:** High

### IDB-004 — Attachments have no enforceable owner

- **Severity:** Critical
- **PDF reference:** Pages 21–28, STT 21–28 (attachments to declarations, licenses and inspection plans); page 12, requirement 39 (files in electronic records)
- **Affected tables/entities:** `file_attachments` and every attachable entity
- **Failure scenario:** A row can declare `entity_type='eligibility_certificate'`, use a nonexistent or another organization's `entity_id`, and independently set `organization_id` to an organization visible to the uploader. No FK proves that the parent exists or that the attachment scope matches the parent. Parent deletion also leaves undetectable orphans.
- **Recommended correction:** Replace the polymorphic owner with typed attachment link tables or a common `document_owners` supertype that every attachable aggregate references. Enforce parent existence and organization equality with FKs. Use immutable attachment versions and a uniqueness rule for `storage_path`/object key and checksum as appropriate.
- **Confidence:** High

### IDB-005 — “Management focal point” scope is missing

- **Severity:** High
- **PDF reference:** Page 20, STT 20; pages 22, 27–30, STT 22 and 27–32: data permission by managed geography **or management focal point** (`địa bàn quản lý hoặc theo đầu mối quản lý`)
- **Affected tables/entities:** `organizations`, `app_user_profiles`, `businesses`, licenses, inspections, poisoning records, alerts
- **Failure scenario:** A provincial department is responsible for selected facility categories or facilities across multiple communes. A single `organization_id` and a strict parent tree can model geographic ownership only. Granting the department a higher tree level overexposes unrelated records; keeping it at one locality hides records it is responsible for.
- **Recommended correction:** Model jurisdiction separately from organizational identity. Add effective-dated scope assignments for organization/user to geography, business, business type, product group, or explicit facility, with scope type and operation rights. Resolve authorization from these assignments, not solely from the organization tree.
- **Confidence:** High

### IDB-006 — Organization hierarchy and geographic hierarchy can be internally inconsistent

- **Severity:** High
- **PDF reference:** Pages 17–19, STT 6 and 8–11; pages 31–35, reporting by administrative level
- **Affected tables/entities:** `organizations`, `cat_provinces`, `cat_districts`, `cat_communes`
- **Failure scenario:** A level-3 organization can point to a level-1 parent, point to district X while its parent represents district Y, point to itself, or participate in a cycle. Recursive scope resolution may omit data, expose the wrong subtree, or loop.
- **Recommended correction:** Enforce level/parent rules and geographic consistency. Use a trigger or closure-table maintenance procedure to reject cycles and require valid parent levels. Either derive geography from the organization hierarchy or enforce composite relationships to the same province/district.
- **Confidence:** High

### IDB-007 — Address components can describe different places

- **Severity:** High
- **PDF reference:** Pages 18–21, STT 10–20; page 27 onward, management and reporting by geography
- **Affected tables/entities:** `businesses`, `cat_testing_centers`, `food_poisoning_cases`, `food_poisoning_incidents`, `public_alert_submissions`
- **Failure scenario:** A business stores commune A, district B, and province C even though commune A belongs to another district and province. Authorization and statistics use different columns and produce contradictory results.
- **Recommended correction:** Store only the most specific geographic FK and derive ancestors, or add composite candidate keys and composite FKs that enforce commune-to-district-to-province consistency. Add coordinate range checks and, if spatial querying is required, use a PostGIS point with a GiST index.
- **Confidence:** High

### IDB-008 — Product and license ownership relationships are not constrained

- **Severity:** High
- **PDF reference:** Pages 20–26, STT 20–26: products and licenses belong to the applicable food business
- **Affected tables/entities:** `self_declarations`, `product_registrations`, `advertisement_registration_products`, `cfs_certificates`, `export_food_certificates`, `products`
- **Failure scenario:** A license for business A can reference a product belonging to business B. An advertisement registration for A can include B's product. With organization mismatch from IDB-001, this also becomes a cross-tenant authorization leak.
- **Recommended correction:** Add a unique key on `products(id, business_id, organization_id)` and use composite FKs from every product-bearing document. For advertisement products, carry and constrain the registration's business/organization or use a trigger if a composite FK cannot be expressed cleanly.
- **Confidence:** High

### IDB-009 — Testing services can belong to a different testing center than the result

- **Severity:** High
- **PDF reference:** Pages 19 and 34–35, STT 16–17 and 37
- **Affected tables/entities:** `testing_results`, `testing_result_services`, `cat_testing_services`
- **Failure scenario:** A result issued by testing center A links to a service catalog row owned by testing center B. Reports and invoices attribute an impossible service/center combination.
- **Recommended correction:** Include `testing_center_id` in the junction and enforce `(testing_service_id, testing_center_id) -> cat_testing_services(id, testing_center_id)` plus `(testing_result_id, testing_center_id) -> testing_results(id, testing_center_id)`, or replace the junction with result-line rows as recommended in IDB-013.
- **Confidence:** High

### IDB-010 — Inspection result relationships permit impossible combinations

- **Severity:** High
- **PDF reference:** Pages 27–29, STT 27–28
- **Affected tables/entities:** `inspection_plans`, `inspection_plan_items`, `inspection_results`
- **Failure scenario:** `inspection_results.plan_id` can reference plan A, `plan_item_id` an item in plan B, and `business_id` a third business. Multiple active results can also be created for the same plan item without an explicit follow-up/revision distinction.
- **Recommended correction:** Make `plan_item_id` authoritative for planned inspections and derive plan/business, or add composite FKs that require the result tuple to match the plan item. Add a uniqueness rule for one primary result per plan item and explicitly model follow-up visits as separate visit/result rows.
- **Confidence:** High

### IDB-011 — Food-safety commitment is reduced to an untraceable boolean

- **Severity:** High
- **PDF reference:** Pages 20–21, STT 19: add/edit/delete the confirmation that the facility submitted its VSATTP commitment
- **Affected tables/entities:** `businesses.has_vsattp_commitment`
- **Failure scenario:** The flag is true, but the database cannot answer when the commitment was submitted, which form/version was used, who received it, its validity, whether it was withdrawn/replaced, or which attachment is the evidence.
- **Recommended correction:** Create a `business_food_safety_commitments` aggregate with business, organization, commitment number/type, signed/submitted/effective dates, receiving authority, status, supersession/version, audit fields, and typed attachments. Treat any current-status boolean as a derived cache only.
- **Confidence:** High

### IDB-012 — Risk management domain is materially incomplete

- **Severity:** High
- **PDF reference:** Pages 34–35, STT 36: risk assessment, testing information, risk forecasting, risk-group list, risk list, testing-center information and public warnings
- **Affected tables/entities:** `risk_analyses`, `testing_results`, catalogs
- **Failure scenario:** Named risks and risk groups are stored only as free-text content/category. Forecast periods, affected geography, evidence sources, linked tests, likelihood/impact scoring, and revisions cannot be searched, related, or aggregated reliably.
- **Recommended correction:** Add typed `risk_groups`, `risks`, `risk_assessments`, `risk_forecasts`, and evidence/link tables to testing results, products, businesses and geography. Preserve publication versions separately from the editable assessment.
- **Confidence:** High

### IDB-013 — Laboratory outcomes are stored as narrative rather than result lines

- **Severity:** High
- **PDF reference:** Pages 19 and 34–35, STT 17 and 37
- **Affected tables/entities:** `testing_results`, `testing_result_services`
- **Failure scenario:** A sample uses several services/parameters, but `testing_result_services` records only the selected services, while values, units, methods, thresholds, uncertainty and per-parameter pass/fail are collapsed into `result_details` and `failed_parameters` text. The system cannot validate or aggregate individual food-safety indicators.
- **Recommended correction:** Replace or supplement the junction with `testing_result_lines`: service/parameter, method snapshot, measured value (numeric/text), unit, detection limit, permissible limit, qualifier, outcome, and notes. Snapshot catalog attributes so later catalog edits do not alter historical interpretation.
- **Confidence:** High

### IDB-014 — Workflow immutability is only an application convention

- **Severity:** High
- **PDF reference:** Pages 31–34, STT 33–35: submitted/approved reports cannot be edited; pages 29–31: verified poisoning records and published/withdrawn content
- **Affected tables/entities:** reports, `food_poisoning_cases`, `food_poisoning_incidents`, `inspection_plans`, `atp_alerts`, `atp_news`, `risk_analyses`
- **Failure scenario:** A service defect, import script, administrator, or integration process directly updates content while the row is Submitted, Verified, Completed, Published, Recalled or Concluded. The DDL accepts the change, and only a mutable audit subsystem may show it later.
- **Recommended correction:** Prefer immutable version rows for official submissions/publications. Add database triggers or restricted stored procedures that reject protected-field changes in locked states. Grant the application account only the transition operations it needs.
- **Confidence:** High

### IDB-015 — Workflow state fields do not enforce their evidence

- **Severity:** High
- **PDF reference:** Pages 27–35, STT 27–36
- **Affected tables/entities:** inspection plans; reports; poisoning cases/incidents; alerts/news; declarations/certificates
- **Failure scenario:** A row can be `Submitted` with no submitter/time, `Verified` with no verifier/time, `Published` with `is_public=false`, `Recalled` with no actor/time, or `Revoked` with only a reason but no revocation timestamp. Conversely, timestamps can be populated while the row is still Draft.
- **Recommended correction:** Add state-dependent checks for actor, timestamp, reason and publication flags. Longer term, persist transitions as typed workflow events and derive current status. Add user FKs or immutable principal references as addressed in IDB-024.
- **Confidence:** High

### IDB-016 — Correction notices cannot identify or close a submission cycle reliably

- **Severity:** High
- **PDF reference:** Pages 31–34, STT 33–35: report an error after sending, upper level decides whether correction is allowed, return to lower level
- **Affected tables/entities:** all three `*_error_notifications` report tables; poisoning error-report tables
- **Failure scenario:** Several returns occur, but a notice has no submission-version FK, no target organization, no resolved timestamp, and no resolution version. `from_organization_id` is not constrained to the report's hierarchy. A notice can be marked Corrected without a response, responder or time.
- **Recommended correction:** Link each notice to the immutable submitted version and both sender/recipient organizations. Persist requested fields, authorization decision, decision actor/time, resolution version/time, and enforce state-dependent evidence.
- **Confidence:** High

### IDB-017 — Integration idempotency is scoped incorrectly and is optional

- **Severity:** High
- **PDF reference:** Page 3, requirement 2.4; pages 39–41, STT 50–57: complete receipt/sharing history for every partner and data type
- **Affected tables/entities:** `data_sharing_histories`, `api_specs`
- **Failure scenario:** Two independent partners legitimately use the same idempotency key and one is rejected because uniqueness is global per direction. Conversely, an inbound row may omit the key entirely and can be processed repeatedly. Reusing an outbound key for a replay is also blocked without a defined operation identity.
- **Recommended correction:** Make inbound idempotency mandatory and unique on `(api_spec_id or partner_id, endpoint/operation, idempotency_key)`. Separate outbound message/correlation identity from inbound idempotency. Persist a durable external event/entity identifier and define replay semantics.
- **Confidence:** High

### IDB-018 — Retry processing overwrites the very history the PDF requires

- **Severity:** High
- **PDF reference:** Page 3, requirement 2.4; pages 39–41, STT 51–57: retained history of received/shared data and detailed lookup
- **Affected tables/entities:** `data_sharing_histories`
- **Failure scenario:** Attempt 1 returns HTTP 500, attempt 2 times out, and attempt 3 succeeds. Updating one row leaves only the latest response/error and a counter. Staff cannot reconstruct the timing, request, response, duration or error of each attempt.
- **Recommended correction:** Split the integration message/envelope from immutable `data_sharing_attempts`. Insert one attempt per transmission/receipt, including attempt number, start/end, endpoint, request/response locations and checksums, outcome and error. Keep overall delivery state on the envelope.
- **Confidence:** High

### IDB-019 — Integration history cannot persist large payloads or cross-system correlation as designed

- **Severity:** High
- **PDF reference:** Page 3, requirement 2.4; pages 39–41, STT 50–57
- **Affected tables/entities:** `data_sharing_histories`, `api_specs`
- **Failure scenario:** A large batch cannot be stored in `request_payload`/`response_payload`, yet the table has no payload object path. A partner callback cannot be correlated because there is no `external_entity_id` or `correlation_id`. `api_spec_id` is nullable, so a call may have no durable partner/API contract identity.
- **Recommended correction:** Add mandatory partner and API-contract-version references, correlation/message IDs, external entity ID, request and response object paths, separate checksums, payload size/content type/schema version, and generated/sent/received timestamps. Make `api_spec_id` mandatory except for a separately modeled unknown-source quarantine flow.
- **Confidence:** High

### IDB-020 — API configuration history is overwritten

- **Severity:** Medium
- **PDF reference:** Pages 39–40, STT 50: manage and view API specifications and connection guidance; page 3, requirement 2.4
- **Affected tables/entities:** `api_specs`, `data_sharing_histories`
- **Failure scenario:** The base URL, contract version, authentication mode or specification document is edited in place. Historical exchange rows still reference the same `api_specs.id`, falsely implying that today's contract/configuration governed an older exchange.
- **Recommended correction:** Version API specifications/configurations immutably. Store a stable API identity plus effective-dated revisions; each integration envelope references the exact revision. Store secrets separately from publishable contract metadata and retain key-rotation identifiers without retaining plaintext.
- **Confidence:** High

### IDB-021 — Duplicate facility and product records remain likely

- **Severity:** Medium
- **PDF reference:** Pages 20–21, STT 19–20: complete facility/product list, Excel import, search and detailed records
- **Affected tables/entities:** `businesses`, `products`
- **Failure scenario:** An inactive business with a tax code can coexist with a new active row using the same tax code because the unique index excludes inactive status. Rows without tax codes can be imported repeatedly with the same name/address. Products have neither a scoped unique code nor an alternate identity rule.
- **Recommended correction:** Preserve a single facility identity independent of lifecycle status. Normalize tax codes and enforce uniqueness across all non-purged historical rows. Define a reviewed duplicate-candidate key for no-tax-code facilities. Add business-scoped product identity (`business_id`, normalized code) and an import staging/deduplication process with source-row provenance.
- **Confidence:** High

### IDB-022 — Soft deletion permits reuse of official document numbers

- **Severity:** Medium
- **PDF reference:** Pages 22–26, STT 21–26; pages 36–38, public certificate lookup
- **Affected tables/entities:** declaration, registration and certificate tables
- **Failure scenario:** A certificate is soft-deleted and a new row is inserted with the same official number because the unique indexes use `WHERE is_deleted = FALSE`. Historical queries and integrations then contain two distinct documents with the same government identifier.
- **Recommended correction:** Do not use soft deletion to release official identifiers. Make the authoritative identifier unique across retained history, optionally scoped by issuing authority/document type where the real numbering domain requires it. Model correction, revocation and supersession explicitly.
- **Confidence:** High

### IDB-023 — Public alert conversion is not one-to-one or mutually consistent

- **Severity:** Medium
- **PDF reference:** Pages 29–30 and 38, STT 29 and 48: citizen alert submission, verification/approval and warning publication
- **Affected tables/entities:** `public_alert_submissions`, `atp_alerts`
- **Failure scenario:** Multiple alerts can reference the same submission. `public_alert_submissions.converted_alert_id` can point to alert A while alert B points back through `public_submission_id`. Status checks only require a non-null ID, not reciprocal identity.
- **Recommended correction:** Select one authoritative FK, normally a nullable unique `atp_alerts.public_submission_id`, and derive the reverse lookup. If one submission may create several alerts, remove the singular reverse column and use a link table with conversion role/status.
- **Confidence:** High

### IDB-024 — Actor and account references are unenforced

- **Severity:** Medium
- **PDF reference:** Pages 5–6, requirements 13–15; pages 15–17, STT 1–5; pages 31–34, approval and correction actors
- **Affected tables/entities:** all `*_by_id`, `creator_id`, `last_modifier_id`, `assigned_to_id`, `user_id`, `uploaded_by_id` columns; `app_user_profiles`; `password_history`
- **Failure scenario:** A workflow transition or attachment can name a nonexistent user UUID. Deleting or recreating an identity can orphan historical actions. Inspector assignments and password history have no database relationship to the account.
- **Recommended correction:** Add FKs to the actual ABP user table where deletion is restricted/soft. For immutable legal history, also snapshot principal name, organization and role at the event time so later account changes do not rewrite historical meaning.
- **Confidence:** High

### IDB-025 — Hard deletes can cascade through legal and evidentiary records

- **Severity:** Medium
- **PDF reference:** Pages 27–29, inspection plans/results and administrative handling; page 15, government ownership and transfer of all formed data
- **Affected tables/entities:** `inspection_plan_items`, `inspection_violations`, `inspection_result_inspectors`, `business_handlers`, `advertisement_registration_products`, `testing_result_services`, `news_linked_alerts`, `business_product_groups`
- **Failure scenario:** A privileged hard delete of an inspection result erases its violations and inspectors; deleting a business erases handler records; deleting a plan erases its membership. This conflicts with the design's own retention intent and removes evidence required to explain historical enforcement.
- **Recommended correction:** Use `ON DELETE RESTRICT` for legally significant aggregates and children, with explicit archival/redaction workflows. Reserve cascade for purely replaceable associations after proving they have no evidentiary value. Add soft-delete/audit fields to child records whose lifecycle must be retained.
- **Confidence:** Medium

### IDB-026 — Important FK access paths are missing while some indexes are redundant

- **Severity:** Medium
- **PDF reference:** Pages 3–4, performance requirements; pages 20–41, search, lookup, reporting and integration-history functions
- **Affected tables/entities:** multiple
- **Failure scenario:** Parent deletion checks and joins scan child tables for unindexed FKs such as `organizations.province_id/district_id`, `businesses.business_classification_id/address_province_id`, `inspection_results.plan_item_id`, `atp_alerts.business_id`, `testing_results.product_id`, `regulatory_documents.document_type_id/replaced_by_id`, and `data_sharing_histories.api_spec_id`. At the same time, write cost is added by indexes already covered by another key.
- **Recommended correction:** Generate an FK-to-index audit from PostgreSQL catalogs and add indexes according to real join/filter paths. Remove confirmed duplicates after workload validation. Clear examples in the current DDL include:
  - `idx_ndtp_reports_org_period`, duplicated by `uq_ndtp_reports_period` with the same key and predicate;
  - `idx_amr_org_year`, duplicated by `uq_action_month_reports`;
  - `idx_pas_tracking`, duplicated by the unique constraint on `tracking_code`;
  - `idx_inspection_plan_items_plan`, whose key is the leading prefix of `uq_ipi_plan_business`.
- **Confidence:** High

### IDB-027 — Generic JSON extension columns can become an uncontrolled shadow schema

- **Severity:** Medium
- **PDF reference:** Page 12, requirements 31–33 (validation, consistency and database integrity); pages 20–41, typed searchable business data
- **Affected tables/entities:** the many aggregates containing `extra_properties JSONB`; `api_specs.auth_config_encrypted`
- **Failure scenario:** A source-required field omitted from the relational model is placed in `extra_properties`. It receives no FK, type/domain constraint, scoped uniqueness, standard index, data dictionary guarantee, or reliable reporting path. Different clients can write incompatible shapes.
- **Recommended correction:** Prohibit business-critical, authorization, workflow, geographic, identifier and reporting fields in `extra_properties`. Define a JSON schema/version and size limit for genuinely optional extensions, validate it at write time, and promote any queried or regulated property to a typed column/table. Keep credential JSON isolated behind a secret-management boundary.
- **Confidence:** Medium

## 4. Finding resolutions

The classifications below were made against all four control sources: the original
42-page PDF, `01-functional-requirements.md`, `04-state-machines.md`, and
`05-permission-matrix.md`. A recommendation is **Accepted** only where the defect
and the proposed correction are supported by those sources. **Partially accepted**
means the risk is real but the proposed model contains unconfirmed scope.
No schema correction was applied for partially accepted or rejected findings.

### IDB-001 resolution — Accepted

- **PDF:** Requirement 15 on page 6 requires server-side data-domain authorization; STT 19–28 make products, licences, and inspections subordinate to managed facilities.
- **Functional requirements:** STT 19–28 consistently describe products, documents, and results as linked to a facility.
- **State machines:** Transitions operate on an already scoped aggregate and do not authorize changing its owning organization.
- **Permission matrix:** creation derives organization from the current user and all reads/updates filter on organization scope.
- **Evidence and action:** Independent `organization_id` plus a simple parent FK allowed contradictory scope. Composite ownership keys/FKs were added for facilities, products, product documents, inspection results, testing results, and linked alerts.

### IDB-002 resolution — Accepted

- **PDF:** STT 33–35 on pages 31–33 says reports may be saved temporarily, become non-editable after official send, and may be corrected only after an authorized return.
- **Functional requirements:** all three report types share Submit/Verify/Return/Resubmit.
- **State machines:** direct editing after Submit is forbidden and repeated submission cycles are explicit.
- **Permission matrix:** only the owning unit submits; a higher unit verifies/returns/completes.
- **Evidence and action:** a counter and status timeline cannot reproduce old field values. Immutable typed submission-snapshot tables, hashes, sender/recipient, actor, and time were added; attachments now bind to the immutable submitted version.

### IDB-003 resolution — Partially accepted

- **PDF:** pages 31–33 require upward delivery and province-wide aggregation.
- **Functional requirements:** automatic aggregation and upper-level follow-up are required.
- **State machines / permissions:** identify higher-level verifiers, but neither defines exact source-membership granularity or whether a configured focal point may receive each report.
- **Decision:** Persisting the recipient is necessary and is also part of IDB-002's accepted submission evidence. The proposed universal aggregation-lineage tables and source hashes require stakeholder rules on what constitutes an included source and were not added.

### IDB-004 resolution — Accepted

- **PDF:** STT 21–28 expressly attach files to declarations, certificates, plans, and results; requirement 32 requires database relationship integrity.
- **Functional requirements:** attachments inherit the owning aggregate and its access scope.
- **State machines:** files submitted with a report must remain associated with that submission cycle.
- **Permission matrix:** file access cannot exceed access to the parent record.
- **Evidence and action:** the former `(entity_type, entity_id)` pair had no FK. It was replaced by a `document_owners` shared-primary-key supertype with organization equality and a real FK from every attachment; storage paths are unique.

### IDB-005 resolution — Accepted

- **PDF:** STT 20, 22, 27–32, and 40 explicitly say scope is by managed geography **or management focal point**.
- **Functional requirements:** the earlier distilled text retained only organization/geographic scope, so it was incomplete.
- **State machines:** higher-level review does not replace ongoing focal-point responsibility.
- **Permission matrix:** the former strict organization tree could not express this second scope axis.
- **Evidence and action:** effective-dated `management_scope_assignments` were added for geographic, facility, facility-type, and product-group scopes, optionally narrowed to a user and operation rights. The functional and permission documents now require union-of-scope evaluation without changing record ownership.

### IDB-006 resolution — Accepted

- **PDF:** STT 6 and 8–11 define administrative hierarchies used by reporting on pages 31–36.
- **Functional requirements:** organizations are exactly Province → District → Commune.
- **State machines / permissions:** cross-level approvals and descendant visibility assume a valid, acyclic tree.
- **Evidence and action:** the row-local level check did not enforce adjacent parent levels, geography, or cycles. A hierarchy validation trigger and parent/geography rules were added.

### IDB-007 resolution — Accepted

- **PDF:** STT 10–20 defines nested administrative geography; STT 27 onward uses it for authorization and statistics.
- **Functional requirements:** facilities, testing centers, incidents, cases, and public submissions are searchable/mappable by location.
- **State machines:** assignment and verification depend on the reported location.
- **Permission matrix:** geographic scoping is unsafe if commune, district, and province contradict one another.
- **Evidence and action:** composite geographic FKs, address-chain checks, and coordinate range/pair checks were added to the affected records.

### IDB-008 resolution — Accepted

- **PDF:** STT 20–26 repeatedly selects products belonging to the applicable facility.
- **Functional requirements:** product registrations, CFS/export certificates, and advertising products are facility/product children.
- **State machines:** licence lifecycle does not permit reassignment to another facility.
- **Permission matrix:** facility scope controls licence create/edit access.
- **Evidence and action:** composite product/facility/organization FKs were added, including ownership columns on the advertising junction.

### IDB-009 resolution — Accepted

- **PDF:** STT 16–17 defines services of each testing center; STT 37 records test results using those services.
- **Functional requirements:** one result may select one or more testing services and a testing center.
- **State machines:** no workflow rule authorizes cross-center service selection.
- **Permission matrix:** catalog permissions do not waive relational consistency.
- **Evidence and action:** the junction now carries `testing_center_id` and has composite FKs to both result and service.

### IDB-010 resolution — Accepted

- **PDF:** STT 27–28 updates a result for each facility in a plan.
- **Functional requirements:** a result may be independent, but a planned result must match its plan item and facility.
- **State machines:** the first valid result advances the matching plan; follow-up is a distinct inspection type.
- **Permission matrix:** plan/result access is scoped to the selected facility and plan.
- **Evidence and action:** planned results now use a composite FK to `(plan_item, plan, business)`, standalone/planned forms are checked, and only one non-follow-up primary result is allowed per plan item.

### IDB-011 resolution — Partially accepted

- **PDF:** STT 19 requires confirmation that a facility submitted its food-safety commitment, but does not enumerate number, validity, withdrawal, supersession, or receiving-authority fields.
- **Functional requirements:** the distilled requirement likewise treats this as a confirmation.
- **State machines / permissions:** no commitment lifecycle or distinct permissions are defined.
- **Decision:** the boolean is insufficient if the commitment document itself must be managed, but the proposed full aggregate is unconfirmed. No schema change was made; a stakeholder question was added.

### IDB-012 resolution — Partially accepted

- **PDF:** STT 36 names assessment, testing information, forecasting, risk groups, risks, testing centers, and public warnings.
- **Functional requirements:** the current risk-analysis document model covers publication but not every named catalog/forecast.
- **State machines / permissions:** only Draft → Published and province-level authoring are defined.
- **Decision:** the coverage gap is real, but scoring, evidence relations, revision semantics, and exact catalogs are not specified. No speculative risk schema was added; the missing business model is now an open question.

### IDB-013 resolution — Rejected

- **PDF:** STT 37 requires management of test results but does not require numeric parameter lines, limits, uncertainty, or qualifiers.
- **Functional requirements:** explicitly permit an overall result and a list of failed indicators, with one or more testing services.
- **State machines / permissions:** add no parameter-level rule.
- **Decision:** result lines may be a valuable later enhancement, but the finding treats an unstated analytic model as mandatory. No correction was applied.

### IDB-014 resolution — Partially accepted

- **PDF:** report immutability after send is explicit; the same blanket database immutability is not stated for every listed aggregate.
- **Functional requirements / state machines:** reports, verified poisoning records, and published content have guarded edit rules.
- **Permission matrix:** transition permissions restrict actors but do not prescribe DB triggers.
- **Decision:** immutable report snapshots were added under accepted IDB-002. Blanket protected-column triggers/stored procedures for all workflows require an agreed transition persistence design and were not added.

### IDB-015 resolution — Accepted

- **PDF:** workflows use identifiable submission, verification, approval, publication, recall, return, revocation, and conclusion actions.
- **Functional requirements:** actor, time, reason, and public visibility are part of those actions.
- **State machines:** define the states and authorized transitions.
- **Permission matrix:** identifies who may perform each transition.
- **Evidence and action:** state-dependent checks now require the corresponding actor/time/reason/visibility evidence for reports, plans, poisoning records, licences, alerts, news, risk publications, and dismissed public submissions.

### IDB-016 resolution — Partially accepted

- **PDF:** a lower unit reports an error and the upper unit decides whether correction is allowed.
- **Functional requirements / state machines:** define Pending/Acknowledged/Corrected but do not define requested-field encoding, resolution-version identity, or a separate target organization column.
- **Permission matrix:** establishes higher-level decision authority only.
- **Decision:** version linkage is desirable once correction-cycle semantics are confirmed, but the proposed full notice model is not source-defined. No correction was applied.

### IDB-017 resolution — Partially accepted

- **PDF:** requires retained integration history, not an idempotency-key protocol.
- **Functional requirements:** add retry and detailed history but do not state which partners supply keys or their operation scope.
- **State machines:** no integration state machine defines replay semantics.
- **Permission matrix:** only limits who can view/manage integration configuration.
- **Decision:** the existing global/direction uniqueness is not robust for multiple partners, but mandatory inbound keys and operation identity require an API contract. No schema change was made; the contract question is recorded.

### IDB-018 resolution — Accepted

- **PDF:** requirement 2.4 and STT 51–57 require retained, searchable details of receive/share history.
- **Functional requirements:** users can inspect response, time, error, outcome, and retry failed exchanges.
- **State machines:** retry changes attempt state without erasing earlier facts.
- **Permission matrix:** authorized integration staff must be able to view the complete history.
- **Evidence and action:** updating one history row destroyed prior attempt details. Immutable `data_sharing_attempts` were added beneath the delivery envelope.

### IDB-019 resolution — Partially accepted

- **PDF:** requires complete history but does not define payload-size thresholds, callback correlation, external entity IDs, or quarantine semantics.
- **Functional requirements:** require request/response details; the security design already anticipates object storage for large payloads.
- **State machines / permissions:** do not settle mandatory API-spec linkage.
- **Decision:** the present documentation is inconsistent about large-payload paths, but the full proposed envelope contract is unconfirmed. No schema correction was applied; integration payload/correlation fields remain an open contract question.

### IDB-020 resolution — Partially accepted

- **PDF:** STT 50 expressly permits add/edit/delete of API specifications.
- **Functional requirements:** API version is captured, but effective dating and immutable revision semantics are not defined.
- **State machines / permissions:** no API-spec publication lifecycle exists; only authorized administrators may edit.
- **Decision:** historical exchanges should identify the governing contract version, but a stable-identity/revision model needs partner-contract rules. No schema correction was applied.

### IDB-021 resolution — Partially accepted

- **PDF:** STT 19–20 requires complete lists, Excel import, validation, search, and detail.
- **Functional requirements:** import preview/validation is explicit; universal product codes and no-tax-code identity rules are not.
- **State machines / permissions:** do not define deduplication identity.
- **Decision:** tax-code reuse across inactive rows is a real identity risk, while fuzzy identity and product keys require business rules. No correction was applied; normalization/deduplication is recorded for stakeholder confirmation.

### IDB-022 resolution — Accepted

- **PDF:** STT 21–26 manages official documents and pages 37–38 expose certificate lookup/download.
- **Functional requirements:** revocation/expiry are explicit lifecycle states; deletion is not evidence that an identifier may be reissued.
- **State machines:** official-number identity survives expiry or revocation.
- **Permission matrix:** delete permission does not authorize identifier reuse.
- **Evidence and action:** partial unique indexes released numbers after soft deletion. Official-number uniqueness now covers retained history, preserving the already documented global or business scope for each document type.

### IDB-023 resolution — Accepted

- **PDF:** STT 29 and 48 describe verification of a citizen warning and publication as an alert.
- **Functional requirements:** internal processing converts a submission into an alert or dismisses it.
- **State machines:** `ConvertToAlert()` creates one alert.
- **Permission matrix:** only authorized staff can publish/convert.
- **Evidence and action:** two independently writable reverse FKs could disagree and allowed multiple alerts. `atp_alerts.public_submission_id` is now the sole, unique authoritative relationship; reverse lookup is derived.

### IDB-024 resolution — Partially accepted

- **PDF:** requirements 13–15 and STT 1–5 require managed user accounts and attributable actions.
- **Functional requirements / state machines / permissions:** identify actors and roles, but ABP owns the account tables outside this standalone DDL.
- **Decision:** referential integrity and immutable actor snapshots are desirable. Adding direct FKs or snapshot columns without the finalized ABP migration order and identity-retention policy would be unsafe. No correction was applied; the identity contract remains open.

### IDB-025 resolution — Partially accepted

- **PDF:** several functions explicitly include delete, while government ownership/transfer requires formed data to remain exportable.
- **Functional requirements:** use soft deletion for aggregates; they do not classify every junction row as permanent evidence.
- **State machines / permissions:** restrict deletes but do not define hard-delete retention.
- **Decision:** cascades on inspection evidence deserve review, but replacing every cascade would also change aggregate deletion semantics not specified by the source. No correction was applied pending a record-class retention schedule.

### IDB-026 resolution — Accepted

- **PDF:** pages 3–4 set response-time and concurrency requirements; STT 19–57 repeatedly requires scoped search, joins, and history lookup.
- **Functional requirements:** identify the actual filter/join paths.
- **State machines / permissions:** add status, organization, parent, and recipient access paths.
- **Evidence and action:** redundant indexes were removed and missing FK-supporting indexes were added for organization geography, business classification/geography, plan items, alerts, testing products, regulatory-document relations, and API histories.

### IDB-027 resolution — Rejected

- **PDF:** requirement 32 mandates integrity for related fields, but does not ban extension metadata.
- **Functional requirements:** no source-required authorization, workflow, geographic, identifier, or reporting field is currently assigned to `extra_properties`.
- **State machines / permissions:** use typed columns for their controlling data.
- **Decision:** this is a governance risk, not a demonstrated defect in the reviewed schema. Existing extension JSON remains optional metadata; no correction was applied.

### Resolution summary

| Classification | Count |
|---|---:|
| Accepted | 14 |
| Partially accepted | 11 |
| Rejected | 2 |
| **Total** | **27** |

## 5. Cross-cutting corrections recommended before implementation

This was the independent reviewer's original combined recommendation. After
source verification, only the accepted subset is authoritative:

1. **Define authoritative ownership.** Establish stable organization, jurisdiction and parent-ownership rules, then enforce them with composite FKs or derived scope.
2. **Introduce immutable report submissions.** Official report submissions need immutable content snapshots.
3. **Replace generic attachment links.** Attachments need supertype-backed ownership with enforceable FKs.
4. **Model workflow events.** Persist submission, verification, return, approval, correction and publication events with actors, organizations, timestamps and version references.
5. **Separate integration envelope from attempts.** Retain every initial call and retry attempt.
6. **Do not normalize unconfirmed domains yet.** Commitment, detailed risk, API revision, aggregation-lineage, and actor-snapshot models remain stakeholder questions.
7. **Re-run index design after relational corrections.** Composite ownership keys and immutable version tables will materially change the required indexes.

## 6. Readiness decision

**Decision after resolution: Ready for stakeholder design validation; not yet a production migration baseline.**

All accepted Critical/High corrections are reflected in the SQL design. Production
baseline approval remains gated by the 11 partially accepted findings whose business
semantics the four control sources do not settle, plus runtime execution of the DDL
against PostgreSQL. The two rejected recommendations must not be implemented unless
new requirements are approved.
