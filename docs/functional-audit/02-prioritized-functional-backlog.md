# Functional Audit — Prioritized Backlog (Step 4)

**Baseline**: `78322f2` + working tree · 2026-07-28 · derived from [01-functional-gap-matrix.md](01-functional-gap-matrix.md)

Priorities per audit mandate: P0 unauthorized/cross-unit access, data loss, invalid workflow, unusable main flow, editable-after-submit; P1 missing required customer function; P2 search/validation/audit-log gaps; P3 polish.

## P0 — none open

Both prior P0s are implemented **and** browser-verified at this baseline: server-side password-expiry gate (SEC-04, `6dab46e`) and encrypted outbound credentials + auth-header injection (FR-50/51, `3fe7325`). Executed security probes (doc 74) show no unauthorized/cross-unit access path, no invalid workflow transition, no post-submit editability.

## P1 — missing required customer functions (all in Group F)

| # | Item | Requirement IDs | Status | Batch |
|---|---|---|---|---|
| P1-A | **Outbound share sends real typed data** — replace the content-free envelope with per-type payload builders that load the actual records (Strategy per CLAUDE.md §15.6), versioned envelope aligned to TT 31/2026 pending the official partner field map | FR-51..57-02, INT-02 (software side) | **SELECTED — this session** | Batch F-1 |
| P1-B | **Retry failed communication (Thử lại)** — BE `RetryAsync` + FE button; only failed outbound calls; endpoint must be active; re-sends the identical stored payload | FR-51..57 common function | **SELECTED — this session** | Batch F-1 |
| P1-C | **Immutable attempt history** — correlation id + attempt number + SHA-256 payload checksum on `ApiCallLog`; retries append new rows, never overwrite (docs/01 §STT 51–57 "Lịch sử attempt") | FR-51..57 common function | **SELECTED — this session** | Batch F-1 |
| P1-D | History **time-range filter** in UI (BE already supports FromDate/ToDate) | FR-51..57-03 | **SELECTED — this session** | Batch F-1 |
| P1-E | **Inbound partner surface** — partner accounts, API-key issuance (reuse P0-2 encryption), inbound auth, per-type receive endpoints writing `Inbound` logs | INT-03, FR-50 inbound direction | Next batch | Batch F-2 |

## P2

1. FR-50-05 — OpenAPI spec-file upload + published partner API specification document.
2. INT-01 hardening — Polly retry/circuit-breaker on the named outbound client, endpoint health probe.
3. INT-02 remainder — exact TT 31/2026 field mapping/signing per partner (**blocked on the official partner schema — external dependency, not infrastructure; not started until the spec exists**).
4. Real-HTTP backend regression suite (`WebApplicationFactory` + Testcontainers PostgreSQL) porting the doc-74 probes.
5. NFR-01..06 reproduction — local k6 run ≥30 VUs with CPU capture.
6. Evidence completion for built features: FR-03-02 audit-log detail, FR-05-04/05 profile+avatar, FR-34-08 / FR-35-08 formatted views, FR-40-08 breakdown exports.
7. Concurrent-update (optimistic-concurrency) dedicated spec.
8. FR-LIC-01 official NĐ15/2018 decree-form PDF template fidelity.
9. FR-38-03/04 document-type catalog integration (currently hard-coded list).
10. SEC-08 CAPTCHA staging run with real Turnstile keys (config exercise).

## P3

- Suite determinism hardening under load (doc 77 P1-5) — test-infra, not product.
- Keyboard/tab-order dedicated accessibility spec (UI-04).
- Per-partner health/status indicator on endpoint rows.

## Selected implementation batch — "F-1: STT 51–57 share completion"

Scope: P1-A + P1-B + P1-C + P1-D. Rationale: the only remaining P1-class functional gap cluster; makes liên thông actually carry data and satisfies the retry/attempt-history functions the YCKT lists as common to all seven history screens. INT-03 (P1-E) is a larger new subsystem and follows as Batch F-2.

Plan:
1. **Domain**: `ApiCallLog` + `EndpointId`, `CorrelationId`, `AttemptNumber`, `PayloadChecksum` (+ factory params, EF mapping, migration on `di_api_call_logs`).
2. **Application**: `ISharedDataPayloadBuilder` strategy per `SharedDataType` (7 builders — Alert, InspectionResult, FoodPoisoning, License×4 record kinds, Product, News, Business) producing a versioned envelope `{schemaVersion, dataType, generatedAt, source, organizationId, note, recordCount, records[]}` from real org-scoped entities (specific record when `EntityId` given, latest N otherwise). `RetryAsync(logId)`: Share permission + data-scope check; original must be Outbound+failed; endpoint resolved via stored `EndpointId`, must be Active; re-send the **stored** request body verbatim; append a new log row (attempt n+1, same correlation, same checksum).
3. **HttpApi**: `POST /api/v1/app/data-sharing/retry/{logId}`.
4. **FE**: retry button (Thử lại, Share-permission-gated, failed rows only) + attempt/correlation surfaced in detail; time-range picker wired to FromDate/ToDate; types mirror DTOs.
5. **Tests** (real stack, no interception): extend/add Playwright specs — typed-payload share proves real record fields land in the recorded request body at a real receiver; retry of a deterministic failed call (postman-echo `/status/503`) appends attempt #2 with matching checksum; retry rejected for successful logs (VN error), for no-permission user (403), and for inactive endpoints; history time filter; persistence after reload. BE: mapping test for new columns.
