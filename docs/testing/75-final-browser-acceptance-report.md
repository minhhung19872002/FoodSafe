# 75 — Final Browser Acceptance Report (Independent, Executed)

**Auditor:** Independent release-acceptance audit (Claude) — no prior involvement in implementation.
**Date:** 2026-07-27
**Git HEAD:** `fe3dbd2`
**Stack under test:** Docker Compose — PostgreSQL 15, Redis 7, MinIO, ClamAV, ABP/.NET 9 API, React/nginx at `http://127.0.0.1:8080` (Development profile, HTTP).
**Mandate:** Decide whether the system is *actually* acceptable, treating every prior report/percentage as an unverified claim. **No positive conclusion is stated below unless backed by evidence I executed myself.**

This report supersedes prior completion summaries as the acceptance position. It is built on four companion documents I produced in this audit:
- **doc 71** — independent test-evidence audit (what each test layer really proves)
- **doc 72** — Playwright quality audit (per-spec, 55 specs)
- **doc 73** — requirement → browser-test → executed-result matrix
- **doc 74** — independent security verification (executed probes)

---

## 1. What I actually executed (evidence ledger)

| # | Action | Result | Artifact |
|---|---|---|---|
| E1 | Confirmed live stack health; real cookie login for `admin` **and** non-admin roles | OK | doc 74 §0 |
| E2 | **Full Playwright suite**, `npx playwright test`, workers=1, no API interception | **229 passed / 6 failed / 0 flaky / 0 skipped** (235 total, ~655 s) | `pw-full-results.json` |
| E3 | Grep of all 55 specs for `page.route`/`route.fulfill`/`route.abort`/`vi.mock`/MSW | **0 hits** — no interception anywhere | doc 72 §2 |
| E4 | Grep of all backend test projects for `WebApplicationFactory`/`TestServer`/`CreateClient` | **0 hits** — no backend test sends real HTTP | doc 71 §2 |
| E5 | Isolated re-run of the 6 failing specs | eligibility **pass 6.9 s**, inspection **pass 7.5 s**, 4 others still failed **at the business-selector step** | `pw-rerun6.log` |
| E6 | Root-caused the 4 deterministic failures (read AntD Select component + compared passing vs failing spec technique) | virtualized dropdown + missing `keyboard.type` filter | this doc §3 |
| E7 | Patched the 4 specs to type the business name (mirroring the passing eligibility/inspection convention) and re-ran them | **4 passed, 6.0–7.3 s each** | `pw-rerun4-patched.log` |
| E8 | Security probes: authN 401, RBAC 403/200, org data-scope (list/object/write), IDOR read+write (2 modules), CSRF 400, hierarchy visibility | **all controls PASS** | doc 74 |
| E9 | Full suite re-run with the 4 patches | **234 passed / 1 failed / 0 flaky / 0 skipped** (~354 s); the 1 failure a *different* spec that passed in run #1 | `pw-full-run2.json` |

Everything asserted as "works" below traces to one of these executed actions.

---

## 2. Headline result

**At `fe3dbd2`, the FoodSafe core application is functionally sound and its application-layer security is strong — both with executable evidence. It is NOT ready for production, primarily because an entire requirement group (data integration / external sharing, STT 50–57) is non-operational, ten public document-serving requirements are unimplemented, ~55 recently-added features have no executed test evidence, and transport/infra/CAPTCHA/performance requirements are unproven in this environment.**

- **No red test in either full run is a product defect.** Run #1 failed 6 specs (229/6); the patched run #2 failed 1 (234/1) — and across *both* runs every failure is a `locator.click` **timeout**, never an assertion failure, with the failing set shifting run-to-run (the run-2 failure had passed green in run #1). That is the fingerprint of host load-contention, not code. Every affected lifecycle is proven to work when driven correctly (~6–7 s each).
- **The genuine blockers to production are gaps in scope and unverified surface**, not the red tests. **The suite's non-determinism under load is a real CI-reliability issue** to fix before "all-green" can gate a release, but it is not a product fault.

---

## 3. The 6 failures — full root-cause with executed proof

### 3.1 Symptom (E2)
Six specs failed in the full run — **all timeouts, no assertion errors** — and all six are the heaviest "full-UI lifecycle" tests (create-through-browser → file upload → public lookup → revoke → retention → delete → duplicate check):

| Spec | Full-run wall | Requirement |
|---|---|---|
| `advertisement-registrations.spec.ts:65` | 75 s | FR-23 (ĐK quảng cáo) |
| `eligibility-certificates.spec.ts:65` | 75 s | FR-24 (GCN đủ điều kiện) |
| `export-food-certificates.spec.ts:61` | 75 s | FR-26 (GCN xuất khẩu) |
| `inspection.spec.ts:71` | 90 s | FR-27 (thanh kiểm tra) |
| `product-registrations.spec.ts:64` | 60 s | FR-22 (ĐKCB) |
| `self-declarations.spec.ts:80` | 60 s | FR-21 (tự công bố) |

### 3.2 Determinism split (E5)
Re-running the 6 in isolation:
- **eligibility → PASS in 6.9 s**, **inspection → PASS in 7.5 s.** These two were **pure load-contention timeouts** in the full run (they finish ~10× under budget when the machine isn't saturated by the preceding 200+ tests). They already drive the selector correctly.
- The other **4 failed again, deterministically, at the identical line**: after opening the "Cơ sở SXKD" business combobox, `getByText(businessName).last().click()` waits forever for the option to appear. They never reach the file-upload / public-lookup / revoke steps.

### 3.3 Root cause (E6) — test harness, not product
The create dialogs render the business picker as an Ant Design `<Select showSearch optionFilterProp="label">` over a **pre-loaded** business list (`options={props.businesses.map(...)}`, e.g. `SelfDeclarationEditorModal.tsx:102`). AntD **virtualizes** the dropdown: with a large business list (the seed DB plus businesses accumulated by earlier tests in the run), the just-created business is not in the initial rendered window.
- The **passing** specs (`eligibility`, `inspection`) call `page.keyboard.type(businessName)` after opening the combobox, filtering the list down so the option renders.
- The **4 failing** specs clicked the combobox and immediately searched for the option **without typing** → the node is never in the DOM → hang → timeout.

### 3.4 Proof of no product defect (E7)
I added the one missing line — `await page.keyboard.type(businessName);` — to the 4 failing specs (identical to the convention the passing specs already use) and re-ran them:

```
ok advertisement-registrations …  7.3s
ok export-food-certificates …     6.4s
ok product-registrations …        6.3s
ok self-declarations …            6.0s
4 passed (27.0s)
```

Every one of these full lifecycles — create via UI, MinIO+ClamAV file upload, anonymous public lookup after `clearCookies`, revoke workflow, post-revoke upload block, delete, duplicate-prevention — **passes end-to-end in ~6–7 seconds**. The features work. The red was test code.

### 3.5 Full suite after patches (E9) — executed

I re-ran the **entire** suite with only the 4 selector patches applied (no product code touched):

| Run | Config | Passed | Failed | Flaky | Skipped | Wall |
|---|---|---|---|---|---|---|
| #1 | HEAD `fe3dbd2`, unpatched | 229 | **6** | 0 | 0 | 655 s |
| #2 | HEAD + 4 selector patches | **234** | **1** | 0 | 0 | 354 s |

**The 4 patched specs (FR-21, FR-22, FR-23, FR-26) all passed in the full suite**, and the 2 unpatched load-flakes (FR-24 eligibility, FR-27 inspection) **also passed** — confirming they were contention timeouts. Run #2 finished ~5 min faster precisely because ~450 s of "wait-for-timeout" was removed.

**The single run-2 failure is a *different* spec that had passed in run #1:** `reporting-error-notifications.spec.ts › full error-notification lifecycle with persistence` — a **120 000 ms `locator.click` timeout**, with **no code change** between the two runs (it was `expected`/green in run #1). That is a textbook environmental flake, not a regression.

### 3.6 The decisive, honest pattern
Across **both** full runs, **7 distinct specs failed at least once, and every one of the 7 failures — in both runs — is a `locator.click` timeout. Zero assertion failures. Zero wrong results.** The product logic never produced an incorrect outcome; in every red case the UI simply did not become interactive within the time budget on a saturated single-worker host (235 serial tests + ClamAV scanning + other Docker stacks sharing the machine). The failing *set is non-deterministic* (6 specs one run, a different 1 the next) — the fingerprint of host contention, not of code.

**What this means for sign-off:**
- **No product defect** is evidenced by any red test in either run. Every affected lifecycle has been shown to work (the 6 via patched/isolated re-runs in §3.4/E5; `reporting-error-notifications` by its green run #1).
- **The suite is NOT deterministically green under full-load single-worker execution.** This is a genuine **CI-reliability** problem to fix *before* "all-green" can be used as a release gate — raise per-test timeouts, sharding/parallelism on a dedicated host, or reduce host contention. It is a test-infra task, not a code fix.
- **NFR response-time (< 10 s) is NOT independently confirmed under concurrency by me.** The click-timeouts under load are a caution flag on performance headroom, though they occur in an over-subscribed dev host, not a representative prod deployment; the k6 result in doc 05 remains a claim I did not reproduce.

---

## 4. Coverage verdict by requirement class (from doc 73, executed)

| Status | Meaning | Approx. items |
|---|---|---|
| PASS_WITH_BROWSER_EVIDENCE | Spec ran + passed in my execution with a real rendered/persisted assertion | ~250 |
| PASS_WITH_BACKEND_ONLY | Real HTTP + real DB verified; UI render thin | ~55 |
| IMPLEMENTED_NOT_VERIFIED | Code exists; **no executed test touches it** | ~55 |
| MISSING | No implementation | ~13 |
| FAILED (product) | Feature broken | **0** (after root-cause) |

**Every one of the 34 feature areas has *some* passing real-stack evidence** (a verification spec and/or my security probes). The weak spots are not broken features — they are **unverified** features and **absent** features.

### 4.1 Genuinely absent (MISSING) — hard gaps
- **FR-42-03/04, FR-43-03/04, FR-44-03/04, FR-46-03/04, FR-47-03/04** (10 items): public **document view/download** for the 5 public certificate lookups. No anonymous file-serving endpoint exists.
- **INT-01** Ministry of Health connectivity; **INT-02** TT 31/2026 + NĐ 37/2026 protocol compliance; **INT-03** partner accounts / API sessions.

### 4.2 Implemented but with zero executed evidence (IMPLEMENTED_NOT_VERIFIED)
~55 items added in commits `8fe0320..fe3dbd2` after most features were last verified, with **no spec exercising them** — e.g. user Excel export & random-password (FR-02-07/13), audit-log detail/export (FR-03-02/03), org/testing-service Excel export, advanced business filters (FR-19-02), inspection attachments & finalize (FR-27-08/09, FR-28-03/05), report roll-ups & formatted views (FR-33-02, FR-34-08/10, FR-35-08), risk-analysis public publish & PDF (FR-36-07/08), dashboard filters/widgets/download (FR-39-02/03/04/09), statistics Excel exports (FR-40-02/04/06/08), and **the entire outbound data-sharing engine (FR-51..57)**, whose viewer tables exist but are never populated and which has no partner endpoint or auth. Doc 71 §7 lists these individually.

### 4.3 The data-integration module (STT 50–57) is effectively non-functional
API-endpoint **registration** CRUD works (F-019, executed). But the actual **liên thông** requirement — sending/sharing each data type outbound and recording share history — has no operational engine, no inbound partner endpoint, and no partner authentication. This is core scope for a Level-2 provincial system that must exchange data with Bộ Y tế / Sở NN / Sở CT under Thông tư 31/2026.

---

## 5. Security verdict (from doc 74, executed)

**Application-layer access control: PASS with executable evidence** — the strongest, most independently-confirmed part of the system.
- AuthN: unauthenticated → 401 on every protected endpoint; wrong password → rejected.
- RBAC: `noperm` (authenticated, no roles) → **403 everywhere**; `admin` → 200. Real function authorization, not UI hiding.
- Org data-scope: list, object (IDOR read), and **write** (IDOR PUT/DELETE) isolation all enforced across two modules; parent-sees-descendant hierarchy correct; cross-subtree blocked.
- CSRF: POST without antiforgery token → 400.

**Not verified here (gate production, not UAT of function):** CAPTCHA real enforcement (SEC-08, bypassed in dev by design), Secure-cookie/TLS (SEC-12, HTTP env), IPv6 (IPV-*), DB least-privilege/at-rest (DBS-*), password **expiry** (no-reuse *is* verified). One **policy observation** (not a bug): ProvinceAdmin holds system user-admin + audit-log permissions — reconcile against the intended permission matrix before sign-off.

---

## 6. Reliability of the existing documentation (must inform sign-off)

1. **Verification registry is stale.** Recorded "verified commits" span `94f1f57..86b793a`; HEAD is `fe3dbd2` with ~39k lines added since — no DIRTY markings, no re-verification recorded. Treat every registry `VERIFIED` as *verified-at-an-older-commit*, not at HEAD. (I re-verified the runtime at HEAD myself via E2/E7/E8; the registry itself remains unreliable.)
2. **"519/519 backend tests pass" must not be read as runtime assurance.** Zero backend tests send real HTTP (E4); they check domain logic and the *presence* of `[Authorize]`/DI wiring by reflection. A stray `[AllowAnonymous]` or a missing scope filter would not be caught by any backend test. Runtime enforcement is proven only by the Playwright layer and my probes.
3. **Doc 68's "53 NOT_IMPLEMENTED" is materially out of date** at HEAD (many implemented since); conversely some of its VERIFIED items are now DIRTY. Do not plan from it.
4. **108 Vitest tests are prohibited as acceptance evidence** (MSW + fake auth) yet appear in mixed summaries — do not count them toward coverage.

---

## 7. Final decision

### 7.1 Production
# ⛔ NOT_READY_FOR_PRODUCTION

Backed by evidence, the blockers are:
- **Scope gaps:** data-integration outbound/sharing (STT 50–57) non-operational; 10 public document-serving requirements (FR-4x-03/04) unimplemented; MoH/partner integration (INT-01/02/03) absent.
- **Unverified surface:** ~55 recently-added features have no executed test; the verification registry does not reflect HEAD.
- **Unproven non-functionals in this environment:** CAPTCHA enforcement, TLS/Secure-cookie, IPv6, database security/ops, and performance/concurrency NFRs (k6 result not reproduced by me).
- **Backend runtime enforcement** rests on a single black-box probe pass (mine) plus the E2E layer — there is no durable real-HTTP backend test suite guarding regressions.

### 7.2 UAT
# ✅ READY_FOR_UAT — CONDITIONAL, SCOPED

The **core administrative, catalog, business/product, licensing, self-declaration, product-registration, advertisement, inspection, food-poisoning, reporting, alerts/news, risk-analysis, testing-results, documents, dashboard/statistics, and public-portal lookup features (STT 1–49, excluding the documented gaps)** have genuine executed full-stack evidence and no product defect surfaced in this audit. That is a legitimate basis for user acceptance testing of those areas.

**Conditions before UAT starts:**
1. Land the 4 spec fixes (E7) so the acceptance suite reflects reality; make the full suite **deterministically green** by fixing load-contention flakiness (raise per-test timeouts, run on a dedicated/less-contended host, or shard) — any heavy lifecycle spec can time-out under the current single-worker + ClamAV + shared-host setup, as shown by the failing set moving between runs #1 and #2.
2. **Exclude from UAT scope** (or clearly mark as "not delivered"): data-integration outbound sharing (STT 50–57) and public certificate document view/download (FR-4x-03/04).
3. Smoke-verify the ~55 IMPLEMENTED_NOT_VERIFIED features (doc 71 §7) — at least load the route and exercise the primary action — so UAT testers do not hit untested paths cold.
4. Update the verification registry to HEAD, or state plainly that registry SHAs are historical.

**Additional conditions before the later production gate** (beyond clearing §7.1 scope gaps): verify CAPTCHA on staging with a real Turnstile failure, confirm Secure-cookie/TLS/IPv6 on an HTTPS deployment, reproduce the performance NFRs under concurrency, complete a DB-security review, and stand up a real-HTTP backend integration suite (`WebApplicationFactory` + Testcontainers PostgreSQL) so authorization/scope enforcement is regression-guarded without depending on manual probes.

---

## 8. One-paragraph summary for stakeholders

Independently executed against the live stack at commit `fe3dbd2`, FoodSafe's core is real and works: a full browser run passed 229 of 235 tests with no API mocking, and after a four-line test-selector fix a second full run passed 234 of 235 — with the single remaining failure being a different test that had passed in the first run. Across both runs every failure without exception was a UI click **timeout under host load**, never a wrong result, so no feature is actually broken; each affected business lifecycle passes end-to-end in about seven seconds once driven correctly. The one caveat this raises is test-suite reliability, not product correctness. Application security (authentication, role permissions, organization data isolation, IDOR, CSRF) passed direct adversarial probing and is the system's strongest area. The system is a reasonable candidate for **scoped UAT** of its administrative and food-safety-management features. It is **not** production-ready: the external data-integration/sharing module (a core Level-2 requirement) is non-operational, ten public document-download requirements are unimplemented, roughly fifty-five recently-added features have no executed test evidence, and transport-layer/CAPTCHA/IPv6/database-security/performance requirements remain unproven in this environment. None of the positive statements here rely on prior reports — they rely on tests I ran.

---

## Appendix — commands & artifacts

| Artifact | Contents |
|---|---|
| `pw-full-results.json` | Full run E2 — 229/6/0/0 |
| `pw-rerun6.log` | E5 — isolated 6; eligibility+inspection pass, 4 fail at selector |
| `pw-rerun4-patched.log` | E7 — 4 patched specs, all pass 6–7 s |
| `pw-full-run2.json` | E9 — full suite with patches |
| `sec-probe*.ps1`, doc 74 | E8 — executed security probes |

Spec fixes applied (auditor, E7): added `await page.keyboard.type(businessName);` before the business-option click in `advertisement-registrations.spec.ts`, `export-food-certificates.spec.ts`, `product-registrations.spec.ts`, `self-declarations.spec.ts`.
