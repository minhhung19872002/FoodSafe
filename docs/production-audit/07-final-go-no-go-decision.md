# 07 — Final Go / No-Go Decision (Release Manager, Independent)

**Role:** Final release manager — independent review of all prior audit evidence; no prior conclusion trusted without tracing it to an executed artifact or the source tree.
**Date:** 2026-07-28
**Git HEAD inspected:** `a853674` (branch `feat/integration-completion`)
**Working tree:** DIRTY — uncommitted INT-03 (Batch F-2) work in progress: `PartnerAccount.cs`, `PartnerApiKey.cs`, `InboundSubmission.cs`, `PartnerAccountDtos.cs`, `InboundReceiveDtos.cs`, +16 lines in `DataIntegrationEnums.cs` (new `PartnerAccountStatus`, `InboundSubmissionStatus` enums). A parallel session is actively building INT-03; nothing in this report counts that WIP as delivered.
**Inputs reviewed:** docs/testing/71–75, docs/implementation/77, docs/production-audit/00–10, docs/functional-audit/00–04, the verification registry, the e2e spec tree on disk, and the full commit history `fe3dbd2..a853674` (90 commits).

> **Naming note:** this folder already contains `07-runtime-production-drill.md`. This file was produced at the requested path `07-final-go-no-go-decision.md`; the numbering collision is cosmetic and flagged as documentation issue D-2 below.

> **POST-DECISION UPDATE (2026-07-28, later the same day):** blocker **M-1 (INT-03 inbound partner surface) is CLOSED** — delivered and VERIFIED per the testing policy at commit `52d35c1` (registry F-019f). See §8 for the executed evidence. The body of this document is preserved as written at `a853674`; where it says INT-03 is "WIP/uncommitted", §8 supersedes it.

---

## Decision summary

| Question | Answer |
|---|---|
| **Can this system pass customer UAT?** | **YES — GO for UAT** on the full delivered scope (STT 1–49 + Group F outbound), with 3 pre-UAT conditions (§5.1). |
| **Can this system go production?** | **NO-GO today — on missing mandatory scope only.** No product defect, no open security vulnerability, and no data-corruption risk blocks production. The sole blocking category is *missing mandatory customer requirement*: the INT-03 inbound partner surface (in progress, uncommitted) and the formal compliance deliverables. Once those land, the decision converts to **GO WITH CONDITIONS** (at-deploy operational items only), consistent with doc 08's re-audit. |

---

## 1. What I independently verified (and what I accepted)

The audits in docs 71–75 were executed at `fe3dbd2` (2026-07-27). **They are stale as a decision basis on their own** — 90 commits of remediation landed after them. My review therefore reconciled the audit findings against the post-audit history:

**Independently verified this session (not accepted on faith):**
- Every remediation claim in docs 77/08 traces to a real commit present in `fe3dbd2..a853674`: P0-1 password expiry (`8b9c20f` + middleware), P0-2 encrypted outbound credentials (`3fe7325`), SSRF guard (`6dab46e`), CAPTCHA malformed-body fix (`00b5ba7`), SVG-XSS fix (`7183986`), soft-delete unique indexes (`8719f66`), non-destructive migration (`7464844`), backup/DR (`8ece317`), prod frontend + HTTPS (`6b46040`), Hangfire authz (`9a3f301`), AutoMapper revert (`9bca58f`), Batch F-1 typed payloads + retry (`71f35e2`), the P1-1a..1m evidence sweep (13 pinned commits), P1-2 anonymous cert download (`2c09c4d`), P1-3 share-UI fix (`9cfcf11`), P1-4 CAPTCHA enforcement spec (`ee00412`).
- All 75 Playwright spec files cited as evidence — including every new evidence spec (`password-expiry-enforcement`, `login-captcha-enforcement`, `data-integration-credentials/share/retry`, `citizen-moderation`, `excel-exports`, `inspection-attachments`, `identity-user-lifecycle`, `ndtp-rollup-aggregation`, `atp-work-auto-aggregation`, etc.) — **exist on disk**.
- The verification registry records **34/34 features + F-019c/d/e VERIFIED, stamped at `8be91bc`**, two commits behind HEAD (`1e0c833` seed fix, `a853674` chore). Registry re-stamp history is consistent with the run log (283/283 at `4662fad`; 283/1 at `17ea0ae` and `8be91bc`).
- The uncommitted working tree confirms **INT-03 is NOT delivered at HEAD** — it is mid-build.
- The one currently-red spec (`business-list-filters.spec.ts` pagination) was statically triaged (§3, T-1).

**Accepted from executed, artifact-pinned prior runs (not re-executed):** the Playwright suite results (four independent full runs recorded: 229/6 → 234/1 at `fe3dbd2`; **282/282** post-Batch-F-1; **283/283** post-merge at `4662fad`; 283/1 at `17ea0ae` and `8be91bc` with the single pre-existing pagination red), the doc-74 adversarial security probes, and the doc-05 k6 load result. These were executed by two separate independent auditors with commands, durations, and artifacts recorded, and their claims are mutually corroborating.

---

## 2. Reconciliation: the doc-75 NOT-READY verdict is superseded

Doc 75's `NOT_READY_FOR_PRODUCTION` was correct **at `fe3dbd2`** but its four pillars have since collapsed:

| Doc-75 blocker (at `fe3dbd2`) | Status at `a853674` |
|---|---|
| Data-integration outbound (STT 50–57) "non-operational" | **Closed for outbound.** Encrypted credentials + auth-header injection proven at a real receiver (F-019c 6/6); UI share → history row browser-proven (F-019d 3/3); typed payloads carrying real records + retry with immutable attempt history (F-019e 3/3, migration `20260728001241`). Remaining: inbound (INT-03) + per-partner TT-31 mapping (INT-02, external-blocked). |
| 10 public document-serving requirements "unimplemented" | **False positive** (see §6) — endpoints existed at `fe3dbd2`; anonymous browser download now verified (F-034 5/5, cookie-less context). |
| ~55 features with no executed evidence | **Closed** by the P1-1a..1m sweep — each batch has a pinned commit, a green spec run, and a registry entry. Residual evidence-only gaps are minor (§3, E-1). |
| Transport/CAPTCHA/IPv6/perf unproven | **Materially closed:** prod stack builds; HTTP→301→HTTPS, TLS 1.2/1.3, HSTS, IPv4+IPv6 listeners runtime-verified (B-1); CAPTCHA enforcement proven over real HTTP (`login-captcha-enforcement` 6/6) with only the real-key staging run residual; k6 green on dev hardware. Production-host confirmation remains an at-deploy step. |

Additionally, all six critical blockers (B-1..B-6) and eight conditions (C-1..C-8) from doc 08's original NO-GO are closed or documented accepted-risk, each with a CI-gated regression. I found no claimed fix that lacks a corresponding commit and verification artifact.

---

## 3. Classification of every remaining issue

Categories: **1** Product defect · **2** Test defect · **3** Missing evidence · **4** Missing implementation · **5** Infrastructure/deployment · **6** Requirement ambiguity · **7** Documentation issue.

| ID | Issue | Category | Production blocker? | Rationale |
|---|---|---|---|---|
| **M-1** | **INT-03 inbound partner surface** — partner accounts, API-key issuance, inbound receive endpoints, inbound call logging. NOT_IMPLEMENTED at HEAD; Batch F-2 WIP uncommitted in the tree. | 4 | **YES** | Mandatory YCKT scope for a Level-2 system (STT 50–57 liên thông is two-way). The only remaining *code build* blocking GO. |
| **M-2** | INT-02 per-partner TT 31/2026 field mapping/signing. Software side done (versioned envelope with real records); exact partner schema unavailable. | 4 + 6 | **YES, unless formally deferred** | Cannot be built without the external partner specification. Needs a customer decision: phased delivery vs. hold. This is a contractual disposition, not an engineering one. |
| **M-3** | INT-01 real Bộ Y tế endpoint connectivity + outbound resilience (Polly retry/circuit-breaker, health probe). | 4 (partially external) | Conditional (with M-2) | Transport + auth proven against a real external receiver; the ministry endpoint itself is an external dependency. Resilience hardening is buildable now (P2-3). |
| **M-4** | FR-50-05 partner-facing machine-readable API specification. | 4 | No (fold into F-2) | Natural part of the INT-03 deliverable; small. |
| **M-5** | FR-38-03/04 document-type list hard-coded instead of catalog-driven. Feature works and is browser-verified. | 4 (minor) | No | Functional with the fixed list; catalog integration is a compliance-polish item for sign-off. |
| **M-6** | FR-LIC-01 certificate PDF not confirmed against the official NĐ 15/2018 prescribed form layout. PDFs generate and download correctly. | 4 + 6 | No (sign-off item) | Requires the official form template from the customer — confirm at UAT. |
| **M-7** | Username charset rule (username = email) vs. prescribed account rule. | 6 | No (sign-off item) | Needs customer ruling; if enforced literally, a small identity change follows. |
| **M-8** | ATTT Level-2 security dossier + user manual + admin manual not produced. | 4 (deliverable) | **YES (formal sign-off)** | Mandatory contract deliverables for government acceptance; documentation work, not code. |
| **T-1** | `business-list-filters.spec.ts` › pagination — the only red in the last two full runs (283/1 at `17ea0ae` and `8be91bc`). | 2 | No | Statically triaged: the failing assertion requires the *unfiltered* businesses list to exceed one page (`.ant-pagination-item-2` visible), i.e., it depends on total environment row count. The same test's API half deterministically proves the paging contract (`SkipCount`/`MaxResultCount` with a seeded 3-row cohort), the pager was previously proven green at `f29fedc`, and the registry records the identical failure on clean `origin/main` — the fingerprint of a seed-data-count dependency (likely interacting with the demo-seeder changes, e.g. `1e0c833`), not a product regression. **Must be root-caused and re-greened before UAT** — a red row on a certified feature is not presentable evidence. |
| **T-2** | Load-contention flake in heavy lifecycle specs (historically `reporting-error-notifications`, 1 timeout per full run). | 2 | No | Effectively resolved — 282/282 and 283/283 full-suite green runs are on record; every historical failure was a click-timeout, never a wrong result. Keep P1-5 discipline (dedicated runner) for CI gating. |
| **E-1** | Built-but-unverified minor items: FR-03-02 audit-log detail drawer, FR-05-04/05 profile edit + avatar, FR-34-08/FR-35-08 formatted report views, FR-40-08 further breakdown exports. | 3 | No | View-layer conveniences on verified features. Smoke them during UAT prep or let UAT itself exercise them. |
| **E-2** | Registry stamped at `8be91bc`; HEAD is `a853674` (2 commits: `1e0c833` seed-layer fix touching E2E fixture accounts, `a853674` untracking static libs). | 3 + 7 | No | Level-1 gap. The seed change touches the test harness surface, not product behavior — warrants one full-suite smoke + registry re-stamp at the UAT build commit. |
| **E-3** | No dedicated concurrent-write spec (ABP optimistic concurrency is present and one role-CRUD test exercises the concurrency stamp). | 3 | No | P2 backlog. |
| **E-4** | Keyboard/tab-order (UI-07) spot-checked only, no dedicated spec. | 3 | No | Minor; verify manually during UAT. |
| **I-1** | Production-host deployment: TLS cert + domain, scheduled backups (≤24 h) + staleness alert + MinIO object-restore, external monitoring on `/health/ready`, server-side branch protection. | 5 | No (at-deploy conditions) | All capabilities exist and are CI-rehearsed; scheduling/wiring is environment-side by nature. |
| **I-2** | SEC-08 CAPTCHA with **real** Turnstile keys never exercised (dev uses always-pass test keys; enforcement middleware itself is proven 6/6). | 5 | No (staging gate) | Config exercise on staging; `CaptchaConfiguration.Validate` already forbids test keys in Production. Must be done before or during UAT on staging. |
| **I-3** | NFR-03/04 (CPU/response headroom) unconfirmed on production hardware; k6 green on dev hardware only. | 5 | No (at-deploy condition) | Software proven not the bottleneck; re-run k6 on the prod host at deploy. |
| **I-4** | DBS server-side hardening (DB roles/at-rest/monitoring) on the production host. | 5 | No | Software-adjacent parts done (least-priv connection, encrypted credentials at rest). |
| **I-5** | No real-HTTP backend regression suite (`WebApplicationFactory` + Testcontainers). Runtime authorization is guarded by the Playwright layer + executed probes only. | 3 + 5 (test infra) | No | Genuine regression-risk note, not a defect: enforcement itself passed adversarial probing. P2-4 — build before the maintenance phase. |
| **B-6** | 3 accepted-risk dependency advisories (AutoMapper DoS, Account.Web open-redirect, react-router RSC-CSRF) — all with compensating controls, tracked to ABP 10. | 5 (accepted-risk) | No | Documented, non-exploitable in this deployment; the earlier "fixed via 15.1.3" claim was itself a false fix, correctly reverted (§6.6). |
| **D-1** | Stale documents still in the tree with superseded verdicts: doc 68 ("53 NOT_IMPLEMENTED"), doc 71/75 headline classifications (10 "MISSING" download items; "NOT_READY"). | 7 | No | Real stakeholder hazard: anyone quoting doc 68 or doc 75 §4 without doc 77 §1 and the post-audit history will materially understate readiness. Add supersession banners. |
| **D-2** | `docs/production-audit/` has two files numbered 07 (this decision + the runtime drill). | 7 | No | Renumber at leisure. |

**Category-1 (product defect) count: 0 confirmed open.** Across every executed run recorded since `fe3dbd2`, no red test has ever been an assertion failure on a wrong business result — every failure was a timeout or an environment-data dependency, and each investigated red either passed in isolation or was fixed as test code. Where reds *did* expose product defects during the evidence sweep (FE delete button never rendered, `DeleteUserAsync` 500, share button unreachable due to permission-allowlist omission, chart PNG blocked by CSP, attachment DTO field mismatch, businesses sort ignored), they were fixed and re-verified at pinned commits — this is the evidence loop working as designed.

---

## 4. Answers to the five mandated questions

### 4.1 Can this system pass customer UAT?

**Yes.** The delivered scope — system administration, catalogs, businesses/products, all 6 licensing lifecycles with revocation/retention/attachments/public lookup, inspection, food poisoning with maps, the full three-report workflow engine with roll-up/auto-aggregation/error notifications, alerts/news with citizen moderation, risk analysis with public exposure, testing results, documents, dashboard/statistics with exports, the public portal incl. anonymous certificate PDF download, and Group F **outbound** integration (credentialed share, typed payloads, retry, history) — carries executed real-stack browser evidence with zero API interception, a 34/34 VERIFIED registry, two fully-green full-suite runs on record, and adversarially-probed security (401/403/IDOR read+write/CSRF/org-scope all enforced server-side). UAT scope must exclude (or mark as in-progress) only: INT-03 inbound, INT-01/02 external-dependent portions, and the M-5/M-6/M-7 sign-off items.

### 4.2 Can this system go production?

**Not today — and for exactly one reason class: mandatory scope that is not yet delivered** (INT-03 inbound surface; formal compliance deliverables M-8; the INT-01/02 disposition). Explicitly: **no known business malfunction, no open security vulnerability, and no data-corruption risk stands against production.** The moment INT-03 lands verified and the customer signs the INT-01/02 phased-delivery disposition, this decision converts to **GO WITH CONDITIONS**, where the conditions are the at-deploy operational items (I-1, I-2, I-3) — matching doc 08's re-audit verdict, which I independently confirm as sound.

### 4.3 What exact items prevent GO?

Blocking (all category-4 mandatory-scope):
1. **M-1** — INT-03 inbound partner surface (finish Batch F-2, currently WIP in the working tree, then verify per the testing policy).
2. **M-2** — INT-02 TT-31 partner mapping: obtain the partner schema **or** obtain the customer's written phased-delivery deferral.
3. **M-8** — ATTT Level-2 dossier + user/admin manuals.
4. **M-6 / M-7** — customer confirmation of the official PDF form and the username-charset ruling (sign-off items that need customer input, cheap once answered).

Not blocking but required at/before deploy: I-1 operational wiring, I-2 CAPTCHA real-key staging probe, I-3 prod-hardware NFR run.

### 4.4 What is the minimum remaining work?

| # | Work | Kind | Size |
|---|---|---|---|
| 1 | Finish + verify Batch F-2 (INT-03): partner account aggregate, API-key issuance (reuse P0-2 encryption), inbound auth, inbound receive endpoints writing `Inbound` `ApiCallLog` rows; real-HTTP + browser evidence per policy | Code (only remaining build) | High (subsystem, already underway) |
| 2 | Root-cause + re-green T-1 (pagination spec data dependency); one full-suite run; re-stamp registry at the UAT build commit (closes E-2) | Test/bookkeeping | Low |
| 3 | CAPTCHA real-key probe on staging (I-2) | Config/verification | Low |
| 4 | Compliance documents: dossier + manuals (M-8); collect customer rulings for M-6/M-7; INT-01/02 disposition letter (M-2/M-3) | Documentation/contractual | Medium |
| 5 | At-deploy operational checklist (I-1, I-3) | Ops | Low, environment-side |

No other code work stands between this system and production.

### 4.5 Which previous findings are false positives?

See §6 — the register of seven, each with the disproving evidence.

---

## 5. Conditions attached

### 5.1 Pre-UAT (all cheap)
1. **T-1**: root-cause the pagination-spec red, re-green, and record one clean full-suite run at the UAT build commit.
2. **E-2**: re-stamp the registry to that commit (the `1e0c833` seed change touches E2E fixture seeding — the smoke run in condition 1 covers it).
3. **Scope statement**: hand UAT testers an explicit list of what is in scope (everything in §4.1) and what is pending (INT-03 inbound; INT-01/02 external portions; M-5/M-6/M-7 dispositions), so no tester "discovers" a known gap.

### 5.2 Pre-production (converts NO-GO → GO)
1. M-1 delivered and VERIFIED per the testing policy (real HTTP inbound auth tests + browser evidence for the partner-account admin UI).
2. M-2/M-3 customer disposition in writing (deliver against the published schema, or phased deferral).
3. M-8 deliverables produced; M-6/M-7 rulings collected.
4. I-2 staging CAPTCHA probe executed and recorded.

### 5.3 At-deploy (GO WITH CONDITIONS residuals — doc 08, confirmed)
1. Schedule backups ≤24 h + staleness alert + MinIO object-restore rehearsal in production (B-2 residual).
2. Deploy monitoring/alerting on `/health/ready`; enable branch protection with Code-Owner review (C-7 residual).
3. Confirm NFR-03/04 with a k6 run on production hardware.

---

## 6. False-positive register (previous findings disproven by evidence)

| # | Prior finding | Source | Reality | Disproving evidence |
|---|---|---|---|---|
| 1 | "10 public certificate document view/download requirements (FR-42/43/44/46/47-03/04) are MISSING — no anonymous file-serving endpoint exists" | doc 71 §7.1, doc 75 §4.1 | **False.** `CertificatePdfController` (`[AllowAnonymous]`, all 5 types) existed at `fe3dbd2`; curl-proven then browser-proven from a cookie-less context | doc 77 §1; F-034 5/5; commit `2c09c4d` |
| 2 | "Data-integration outbound (STT 50–57) is effectively non-functional — no operational engine" | doc 75 §4.3 | **Overstated.** A real engine existed (`ShareAsync` → real `SendAsync` + `ApiCallLog`); the genuine gaps (credentials, typed payload, retry, UI evidence) were narrower and are now all closed for outbound | doc 77 §1; `3fe7325`, `9cfcf11`, `71f35e2`; F-019c/d/e specs green |
| 3 | O-1: "ProvinceAdmin holds system user-admin + audit-log permissions — possible misconfiguration" | doc 74 §5 | **Intended design**, explicitly granted in `docs/05-permission-matrix.md` (org-scoped server-side); escalation blocked by `EnsureRoleCanBeAssigned` | doc 77 §1/§5 |
| 4 | The 6 red Playwright specs at `fe3dbd2` (and by implication their 6 feature areas) | doc 73 §2 | **Zero product defects.** 4 were a missing `keyboard.type` against a virtualized AntD Select; 2 were load-contention timeouts; all pass in ~6–7 s driven correctly | doc 75 §3 (executed re-runs, patches) |
| 5 | "53 NOT_IMPLEMENTED requirements" | doc 68 | **Materially stale** even at `fe3dbd2` (~13 genuinely absent then; 2 code gaps at the functional-audit baseline; INT-03 the only build gap now) | doc 71 Problem 3; doc 01-functional-gap-matrix §5 |
| 6 | "B-6 FIXED — AutoMapper pinned to 15.1.3, 591 tests green" | earlier remediation claim | **False fix** — build-verified only; 15.x removes the ctor ABP 9.3.7 calls → app-wide runtime `MissingMethodException`. Correctly reverted to 14.0.0 accepted-risk with compensating controls | doc 08 B-6; `9bca58f`; regression log 2026-07-28 |
| 7 | "`/statistics` route lacks a permission guard" (SEC-L-03) | doc 04 | **Intentional access model** — authenticated + org-scoped by design, pinned by a verification spec | doc 08 C-8; `statistics-verification.spec.ts` |

The systemic lesson from 1–2 and 6: **absence-of-evidence claims and completion claims were both wrong in places — in both directions.** The executed-evidence loop (real stack, pinned commits, registry) is the only currency this project should trade in, and since `fe3dbd2` it has been.

---

## 8. Addendum (2026-07-28) — M-1 / INT-03 closed at `52d35c1`

The Batch F-2 build that was uncommitted WIP at the time of this decision has been completed, verified against the real stack, and committed as `52d35c1` (`feat(INT-03): inbound partner integration — accounts, hashed API keys, receive endpoint`).

**Delivered scope:** partner accounts (org-scoped, per-partner `SharedDataType` allow-list, Active/Suspended); API keys stored as SHA-256 hash + lookup prefix only (raw key rendered exactly once at issuance, fixed-time verification, expiry/revocation/last-used, rotation = issue + revoke); partner-facing `POST /api/v1/partner/submissions/{dataType}` with ±300 s replay window, schema-version gate, per-partner data-type authorization, database-enforced idempotency (unique live `(partner, request-id)`), and an Inbound `ApiCallLog` row for every attributable attempt; admin submissions browser; permission-gated FE tabs (Đối tác liên thông / Dữ liệu nhận về) on `/data-integration`.

**Executed evidence (zero interception; partner calls from a cookie-less client so auth is provably the `X-Api-Key` header):**
- `e2e/data-integration-partners.spec.ts` **3/3**: UI lifecycle (create → issue key → real partner POST → duplicate delivery idempotent → submission + Vietnamese payload visible in UI and after reload → Inbound history row → UI revoke → 401 → UI rotation works → UI suspend → 401); full guard matrix (401 uniform across unknown/expired/revoked/suspended; 403 `DataTypeNotAllowed`; 400 × unknown-segment/stale-timestamp/missing-headers/bad-schema/empty-records); per-partner idempotency isolation.
- Owed Level-2 regression for the shared outbound-client hardening in the same commit: **DataIntegration Playwright subset 23/23** (F-019 + F-019c/d/e + F-019f). BE: DataIntegration contract 27/27, EF mapping 2/2, `OutboundUrlValidator` 58/58. Migration `20260728064640` applied by the real migrator.
- The evidence loop caught **two real product defects pre-delivery**, both fixed in `52d35c1` and pinned by tests: an ABP-validation path that turned malformed partner envelopes into 500s leaking the ABP error shape, and `\uXXXX`-escaped payload storage that made Vietnamese content unreadable in the officer UI (regression log 2026-07-28).

**Effect on this decision:** §4.3 blocking item 1 and §5.2 pre-production condition 1 are **satisfied**. The remaining pre-production conditions are unchanged and all non-code: M-2/M-3 customer disposition (INT-01/02 external dependencies), M-8 compliance deliverables, M-6/M-7 rulings, I-2 staging CAPTCHA probe. FR-50-05 (M-4, partner-facing machine-readable API spec) remains open as a small documentation task now that the surface is stable.

---

## 7. Bottom line for stakeholders

The FoodSafe application at `a853674` is functionally complete for STT 1–49 plus outbound data sharing, with the strongest evidence posture this project has ever had: 34/34 features verified against the real stack, two fully-green full-suite runs (282/282, 283/283) with zero API interception, all six original production blockers and eight security conditions closed with CI-gated regressions, and application-layer security that passed independent adversarial probing. **Send it to UAT now** (three cheap conditions). **Do not ship to production yet** — not because anything is broken, but because one mandatory subsystem (inbound partner integration, INT-03) is still being built in this very working tree, the TT-31 partner mapping awaits either the external schema or a written customer deferral, and the formal Level-2 compliance deliverables (dossier, manuals, form confirmations) are outstanding. When those close, the decision is GO WITH CONDITIONS, the conditions being ordinary at-deploy operational steps.
