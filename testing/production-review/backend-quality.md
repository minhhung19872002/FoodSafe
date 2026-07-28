# Production Readiness Review — API & Backend Quality

**Date:** 2026-07-28 · **HEAD:** `6b6ff6a` · Fresh code inspection (file:line), corroborated by 662/662 backend tests and the 286/286 real-stack E2E gate.

## 1. Scorecard

| Area | Verdict | Summary |
|---|---|---|
| API consistency | ✅ (1 gap) | ABP conventions throughout; `[Authorize]` universal; `PagedAndSortedResultRequestDto` everywhere; sorting via explicit allowlist switches (injection-safe). **Gap B-2:** no server-side `MaxResultCount` hard cap — a client can request `MaxResultCount=int.MaxValue` and the server attempts it (defaults are sane 10–50, but the ceiling is unenforced) |
| HTTP status codes | ✅ | Coded ABP envelopes: 400 validation, 401/403 auth (probe-verified), 403 BusinessException, 404 not-found, 429 rate-limit; inbound partner guard matrix returns envelope-coded 400s (fixed `adb30eb`, contract-tested) |
| Validation | ✅ (minor) | Rich DataAnnotations on create/update DTOs (StringLength/Required/Range/Email/Url; lat/long ±90/±180). **Gap:** `UpdateNdtpReportStatsDto` count fields lack `[Range(0, …)]` — negative stats reachable |
| Error handling | ⚠️ | `BusinessException` + error-code constants used consistently; only 2 bare `throw new Exception` (dev migrator tooling). **Gap B-3: ~25+ error codes missing from `en.json`/`vi.json`** (Organization 0001-05, Business 0001-03, SelfDeclaration, ProductRegistration, AdRegistration, EligibilityCertificate, DataScope, DataIntegration 0003-06, Inspection 0016-17 + 3 inline non-constant codes) — users see raw `FoodSafe:Organization:0001` when these fire |
| Pagination/filter/sort | ✅ | Verified per-module in browser suite; filters indexed |
| Transactions | ✅ | ABP per-request UoW (`UseUnitOfWork`); `[UnitOfWork]` on Excel imports and all 5 expiry jobs; inbound handler correctly non-transactional for reads |
| Query efficiency | ⚠️ | See §2 |
| Indexes | ✅ | Partial unique indexes (soft-delete-filtered) on every business identifier: business code/tax code, all 6 certificate/registration numbers, report `(org, year, month)`, plan `(code, org)`, partner code; FK columns indexed; list-filter columns indexed. No obviously missing index found |
| Constraints/duplicates | ⚠️ | All uniqueness DB-backed **except food-poisoning `case_code`** (B-1); partner-code check-then-insert races to an unhandled 500 instead of a coded 409 (DB constraint exists — B-6) |
| Race conditions | ⚠️ | B-1 (silent duplicate) + B-6 (ugly-but-loud) + concurrency stamps not round-tripped outside IdentityAdmin (silent last-write-wins — W-5 in the flow audit) |

## 2. Query-efficiency findings

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| B-4 | Medium | Excel import inserts row-by-row (`await CreateAsync` per row inside UoW) — 500-row import = 500 round trips (works today; slow at scale; import cap should match) | `ProductExcelAppService.cs:146` |
| B-5 | Low-Med | Dashboard issues ~15 separate `CountAsync` per load; no caching in the hot path (a `cached_dashboard_stats` structure exists but this path doesn't use it) — fine at 31ms today (k6), linear-degrades with data volume | `StatisticsAppService.cs:144-174` |
| B-7 | Medium | Expiry jobs `ToListAsync` all expired rows unbatched — memory risk at large volumes | `CfsCertificateExpiryJob.cs:29-34` (+4 siblings) |
| — | ✅ | No classic N+1 select-then-loop-fetch found anywhere else; detail endpoints use bounded extra queries (2–3) |

## 3. Data integrity

- Soft delete uniform; unique indexes correctly `is_deleted = FALSE`-filtered (re-insert after delete works — verified by catalog e2e).
- Cascades correct for child collections (plan items, handlers, error reports/notifications, ad products).
- **B-8 (Medium, hygiene):** `FileAttachment → DocumentOwner` is `Restrict`; soft-deleting parents strands owner rows, attachment rows, and MinIO blobs forever — no orphan-cleanup job. Storage-cost and data-retention issue, not correctness.
- Background jobs: ABP in-process job store (+ Hangfire components present with loopback+admin-gated dashboard). No outbox for multi-step operations — acceptable at this scale; document restart semantics (B-9, Low).

## 4. Top backend risks (ranked)

1. **B-1 — case-code COUNT+1 race, no DB unique constraint** (`FoodPoisoningCaseAppService.cs:197-205`) — the only *silent* duplicate path found. Fix: partial unique index on `(organization_id, case_code)` + retry-on-conflict. **High.**
2. **B-3 — ~25 unlocalized error codes** — users will see machine codes on real validation failures (duplicate org code, duplicate tax code…). Cheap, high-visibility. **High (UX/acceptance).**
3. **B-2 — no MaxResultCount ceiling** — availability guard missing (`AbpPagedResultRequestOptions` or per-DTO clamp). **Medium-High.**
4. **W-5 — concurrency stamps not round-tripped** on the main editing surfaces. **Medium.**
5. B-6 partner-code race → unhandled 500 (catch `DbUpdateException` → coded duplicate). **Medium.**
6. B-4 / B-7 batching for imports and expiry jobs. **Medium.**
7. B-8 attachment/blob orphan cleanup job. **Medium (hygiene).**
8. B-5 dashboard count batching/caching. **Low-Medium.**
9. Negative-value `Range` guards on report-stats DTO. **Low.**
10. B-9 job restart-semantics documentation. **Low.**

**Overall:** a disciplined ABP codebase — authorization, validation, transactions, and indexing are systematically right, and the E2E+probe evidence backs the request path end-to-end. The findings above are targeted engineering debts, all bounded, none architectural.
