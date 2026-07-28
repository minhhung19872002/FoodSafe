# Functional Audit — Gap Matrix (Steps 2–3)

> **ADDENDUM (2026-07-28, Phase-0 baseline freeze):** this matrix is preserved as written at baseline `78322f2`. Rows superseded by later delivered work:
> - **INT-03** (§2, "NOT_IMPLEMENTED") — **CLOSED**: delivered at `52d35c1`, VERIFIED as registry F-019f at `adb30eb`.
> - **FR-50-05** (§2, "PARTIAL") — **CLOSED**: partner spec + OpenAPI published at `0776230`/`aad87c1`; in-app specification management delivered at `5bc0d86`, VERIFIED as registry F-019g.
> - The Batch F-1 "selected batch" rows (typed payloads, retry, attempt history, time filter) — **CLOSED** at `71f35e2` (registry F-019e).
> Current per-requirement status now lives in `docs/audit/CURRENT_REQUIREMENT_GAP_ANALYSIS.md` + `CURRENT_REQUIREMENT_TRACEABILITY_MATRIX.md`.

**Baseline**: commit `78322f2` + valid dirty working tree (see [00-audit-baseline.md](00-audit-baseline.md))
**Date**: 2026-07-28
**Requirement source of truth**: `docs/Mẫu số 03. YCKT (1).pdf` (42 pages, 469 atomic items — extraction in `docs/audit/60-customer-requirement-baseline.md`; PDF page rendering unavailable in this environment, so the doc-60 extraction + `docs/01-functional-requirements.md` decomposition — cross-checked in `docs/audit/63-yckt-cross-check-findings.md` — serve as the item inventory. No percentage from prior docs was accepted without evidence.)

**Evidence basis** (not trusted claims — each verified how it was produced):
- `docs/testing/73` — executed requirement→browser-test matrix (full Playwright runs at `fe3dbd2`, 229/6 then 234/1, zero API interception, grep-confirmed) **plus** its 2026-07-28 working-tree addenda (P1-1 batches, SEC-04, F-034 anonymous download, F-019c/d) whose commits are all ancestors of this baseline.
- `docs/testing/74` — executed security probes (401/403/IDOR/CSRF/scope).
- `docs/implementation/77` — code-grounded corrections to audit over-statements (e.g. the 10 FR-4x-03/04 "MISSING" verdicts were false; anonymous PDF endpoints existed and are now browser-proven).
- This session: source inspection of `FoodSafe.BE/src/**/DataIntegration/**`, `FoodSafe.FE/src/features/data-integration/**`; fresh test baseline (BE 618/618 after repairing 3 stale mapping assertions, FE unit 112/112, tsc/lint/build clean — see doc 03).

Classification scale (per audit mandate): COMPLETE, MOSTLY_COMPLETE, PARTIAL, STUB_OR_MOCK, DOCUMENTED_ONLY, NOT_IMPLEMENTED, BLOCKED_BY_SOFTWARE, DEFERRED_INFRASTRUCTURE, NOT_APPLICABLE.
DEFERRED_INFRASTRUCTURE is used **only** for genuinely external server/DNS/TLS/hosting work — never for missing BE/FE logic.

---

## 1. Group-level classification (57 groups, 372 FR items)

| Group | STT | Items | Classification | Evidence / residual gap |
|---|---|---|---|---|
| A — Quản trị hệ thống | 1–5 | 33 | **COMPLETE** (31) / MOSTLY_COMPLETE (2) | Full browser evidence incl. user delete, random password, permission filter, Excel export, audit-log search/export, CAPTCHA gate, password expiry gate (SEC-04, `password-expiry-enforcement.spec.ts` 4/4). Residual: FR-03-02 audit-log detail drawer, FR-05-04/05 profile edit + avatar — implemented, no executed spec (evidence-only gap). |
| B — Danh mục | 6–18 | 57 | **COMPLETE** | All catalog CRUD + geography + org CRUD + unit accounts + Excel exports browser-verified (`catalogs-`, `geography-`, `organizations-`, `identity-*`, `excel-exports` specs). |
| C — Quản lý ATTP | 19–40 | 216 | **COMPLETE** (211) / MOSTLY_COMPLETE (5) | All lifecycles browser-verified end-to-end at `fe3dbd2`+patches: businesses/products (incl. import/export, map, filters+sort), 5 licensing flows + revocation + retention + attachments, inspection plan→approve→result→Excel + attachments, poisoning cases/incidents + map, NDTP/ATTP/Action-Month reports incl. all workflow buttons, roll-up + auto-aggregation, error notifications, alerts/news + citizen moderation, risk analysis + publish + public exposure, testing results, documents + attachments + print/export, dashboard (filters, compliance widget, chart PNG), statistics + 4 Excel exports. Residual MOSTLY_COMPLETE: FR-34-08, FR-35-08 (formatted views — built, unverified), FR-40-08 (further breakdown exports — built, unverified), FR-LIC-01 decree-form PDF template fidelity (PDF is generated; not yet the official NĐ15 form layout), FR-38-03/04 document-type list hard-coded (works; catalog integration gap). |
| E — Cổng công khai | 41–49 | 32 | **COMPLETE** | Public search all types, anonymous certificate PDF download for all 5 types from a cookie-less context (working-tree strengthened `certificate-pdf-verification.spec.ts` 5/5), warned businesses, news/alerts, citizen submission via real captcha-gated endpoints, document lookup. |
| F — Tích hợp dữ liệu | 50–57 | 34 | **PARTIAL** | See §2 — the only group with real functional build gaps left. |

## 2. Group F (STT 50–57) — item-level classification

| Req | Requirement | Classification | Grounding (source inspected this session) |
|---|---|---|---|
| FR-50-01..04/06 | API-spec CRUD, filter, activate/deactivate, test connection | **COMPLETE** | Browser-verified (`data-integration*` specs); encrypted credential store + auth-header injection proven against a real receiver (F-019c 6/6, commit `3fe7325`). |
| FR-50-05 | Partner-facing API spec / OpenAPI upload | **PARTIAL** | Test-connection exists; no OpenAPI spec-file upload, no published partner spec document. |
| FR-51..57-01 | Per-type share-history screens | **MOSTLY_COMPLETE** | FE tabs per `SharedDataType` + list; browser-verified for Alert type (F-019d). |
| FR-51..57-02 | Outbound send/share per type | **PARTIAL** | Engine + auth + UI verified (`data-integration-share.spec.ts` 3/3) **but the payload carries no business data** — `DataSharingAppService.ShareAsync` serializes only `{dataType, entityId, note, organizationId, sharedAt, source}` (`DataSharingAppService.cs:74-82`). A partner receives an empty envelope. **← selected batch** |
| FR-51..57-03 | Search/filter history (partner, time, result, direction) | **MOSTLY_COMPLETE** | BE filter supports all (incl. FromDate/ToDate, `ApiCallLogAppService.cs:34-52`); FE has type tabs + direction + result + text filter but **no time-range picker**. **← selected batch** |
| FR-51..57-04 | Detail view (request payload, response, time, error) | **COMPLETE** | Detail modal renders headers/body/response/error (`DataIntegrationPage.tsx:710-796`), backed by scoped `GetAsync`. |
| FR-51..57 Retry | Retry failed communication | **NOT_IMPLEMENTED** | Zero occurrences of retry/Thử lại in BE (`DataSharingAppService` has only `ShareAsync`) and FE. **← selected batch** |
| FR-51..57 Attempt history | Immutable per-attempt evidence: attempt no., checksum, no overwrite (docs/01 §STT51–57) | **PARTIAL** | Each call is one immutable `ApiCallLog` row, but no correlation id, attempt number, or payload checksum — retries could not be linked to their envelope. **← selected batch** |
| FR-51..57 Excel export | Export history | **COMPLETE** | `ApiCallLogExcelAppService` + FE "Xuất Excel" (browser-verified under P1-1a). |
| INT-01 | Bộ Y tế connectivity | **PARTIAL** | Outbound engine + auth reach a real external receiver; no resilience (retry/circuit-breaker) and no real ministry endpoint (the endpoint itself is an external dependency, the hardening is software — backlog P2). |
| INT-02 | TT 31/2026 + NĐ 37/2026 protocol payloads | **PARTIAL** | The software side — typed per-type payloads carrying real records in a versioned envelope — is buildable now (**← selected batch**). Exact partner field-mapping/signing requires the official partner schema (external dependency — NOT infrastructure; tracked as blocked-external remainder). |
| INT-03 | Partner accounts + inbound API sessions | **NOT_IMPLEMENTED** | No partner-account aggregate, no inbound auth, no inbound controller; `ApiCallDirection.Inbound` is dormant. Software work — next batch after this one. |

## 3. Application-level non-functional classification

| Area | Classification | Evidence |
|---|---|---|
| SEC-01..07 password policy/expiry/reset/random | **COMPLETE** | Browser + real-HTTP evidence incl. server-side expiry gate (P0-1) and no-reuse; single-use reset verified in `password-management-verification`. |
| SEC-08 CAPTCHA | **MOSTLY_COMPLETE** | Enforcement middleware proven over real HTTP (6/6, missing token → 400). Residual: real-key staging run (config exercise). |
| SEC-09..11, 13..25 (session, CSRF, authZ, scope, validation, XSS, headers, errors, logs) | **COMPLETE** | Executed adversarial probes (doc 74) + suite: 401 everywhere, noperm→403 everywhere, org/IDOR read+write isolation, CSRF 400, XSS-encoding via React + server validation. |
| SEC-12 Secure cookie under HTTPS | **DEFERRED_INFRASTRUCTURE** (verification) | Code sets HttpOnly; Secure flag verifiable only on a TLS deployment (out of scope per mandate). |
| NFR-01..06 performance/concurrency | **PARTIAL** | k6 artifact exists (doc 05) but not independently reproduced; local reproduction still owed (backlog P2). |
| UI-01..10, DT-01..12 | **COMPLETE** (spot-verified) | Vietnamese Unicode UI, loading states, required-`*` markers, dd/MM/yyyy, friendly VN errors, pagination — all exercised across the 235-test browser suite; keyboard/tab-order spot-checked only (no dedicated spec — minor residual). |
| DBS-01..10 | **DEFERRED_INFRASTRUCTURE** (mostly) | Server-side DB hardening/monitoring is deployment work; software-adjacent parts done (least-priv connection string, encrypted partner credentials at rest per P0-2). |
| IPV-01..06 | **DEFERRED_INFRASTRUCTURE** | Out of scope per mandate. |

## 4. Workflow verification summary (mandate checklist)

All executed via real browser/HTTP at the baseline (doc 73 §3 + registry): user activation/lock/unlock ✓; self-declaration, product-registration, ad-registration, eligibility, CFS, export-certificate lifecycles incl. revoke + post-revoke immutability + duplicate prevention ✓; inspection plan Draft→Submit→Approve + result + finalize ✓; alert/news publish + recall + citizen moderation ✓; poisoning case verification + incident initial/final report + conclude ✓; NDTP monthly / ATTP 6-month+annual / Action-Month: Draft→Submitted→Verified→Completed + Return-with-reason→Draft, post-submit immutability, cross-org denial ✓; risk-analysis publish→public ✓; public warning submission ✓; data-sharing history ✓ (Alert type browser-proven). Concurrent-update protection: optimistic concurrency present on ABP entities; no dedicated concurrent-write spec (residual, P2).

## 5. Roll-up counts (software-assessable, per doc-60 inventory of 452)

| Classification | FR items (of 372) | Non-FR software (of 80) |
|---|---|---|
| COMPLETE | 349 | 63 |
| MOSTLY_COMPLETE (built, evidence-only or minor residual) | 12 | 3 |
| PARTIAL | 9 | 6 |
| NOT_IMPLEMENTED | 2 (retry ×7-type counted once as 1 function + INT-03 surface) | 0 |
| STUB_OR_MOCK / DOCUMENTED_ONLY | 0 | 0 |
| DEFERRED_INFRASTRUCTURE (excluded from software denominator) | 0 | 8 (SEC-12 verify, DBS subset, IPV) |

> Counting note: the 34 Group-F items decompose per §2; "retry" and "attempt history" are common functions across STT 51–57 counted per doc-60 item granularity (4 items per STT). Numbers are grounded estimates at item granularity — the shape, not decimal precision, is the finding.

**P0 gaps: 0** (both prior P0s implemented + browser-verified).
**P1 gaps: 4** — (1) share payload carries no real data (FR-51..57-02 / INT-02 software side), (2) retry not implemented, (3) attempt-history metadata absent, (4) INT-03 inbound partner surface absent. Plus 1 minor UI gap (history time-range filter).
**P2 gaps:** FR-50-05 OpenAPI upload/spec doc, resilience hardening (INT-01), real-HTTP BE regression suite, NFR reproduction, concurrency spec, FR-34-08/35-08/40-08/03-02/05-04/05 evidence, decree-form PDF template, document-type catalog integration, CAPTCHA staging keys.
