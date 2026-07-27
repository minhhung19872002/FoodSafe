# 74 — Independent Security Verification (Executable Evidence)

**Auditor:** Independent release-acceptance audit (Claude)
**Date:** 2026-07-27
**Stack under test:** Docker Compose — PostgreSQL 15, Redis 7, MinIO, ClamAV, ABP/.NET 9 API, React/nginx frontend at `http://127.0.0.1:8080`
**Git HEAD at audit time:** `fe3dbd2`
**Method:** Real HTTP requests against the live API through the nginx frontend proxy. Real cookie-based login via `/api/account/login` with antiforgery token. **No API interception, no token injection, no mocking.** Every result below is reproducible from the scripts in the session scratchpad (`sec-probe*.ps1`).

> This document records what I executed and observed myself. It does not rely on any prior report. Where an item could not be proven by execution against the running stack, it is explicitly marked NOT RUNTIME-VERIFIED.

---

## 0. Test identities (real seeded accounts)

From `E2eTestDataSeedContributor` (Development seed). All share password `Admin@2026!`.

| Login | Role | Home org | Org level |
|---|---|---|---|
| `admin` | admin (global DataScope.All) | Chi cục (Province org) | Province |
| `province.admin@foodsafe.local` | ProvinceAdmin | Chi cục (Province org) | Province |
| `district.staff@foodsafe.local` | DistrictStaff | Phòng Y tế TP Hạ Long | District |
| `readonly@foodsafe.local` | CommuneStaff | Trạm Y tế Bạch Đằng | Commune |
| `noperm@foodsafe.local` | *(no roles)* | Province org | Province |

Organization hierarchy: **Province (…001) → District (…002) → Commune (…003)**. Data-scope expands *downward* (an org sees itself and descendants).

Each identity's server-side context was confirmed live via `GET /api/v1/app/current-user-context` — role, `organizationId`, and permission list are returned from server state, not client-supplied (satisfies the intent of **SEC-17**).

---

## 1. Authentication enforcement (SEC-10..12, SEC-15)

### 1.1 Unauthenticated access → 401 (executed)

`GET` with no session against protected endpoints:

| Endpoint | Result |
|---|---|
| `/api/v1/app/business` | **401** |
| `/api/v1/app/organization` | **401** |
| `/api/v1/app/inspection-plan` | **401** |
| `/api/v1/app/self-declaration` | **401** |
| `/api/v1/app/audit-log` | **401** |
| `/api/v1/administration/users` | **401** |
| `/api/v1/app/system-settings` | **401** |

**PASS** — no protected business endpoint is reachable anonymously; unauthorized `/api/*` returns 401 (not an HTML 302 redirect), which is the correct API behavior.

### 1.2 Invalid credentials → rejected (executed)

`POST /api/account/login` with a wrong password for `admin` returns `result = 2` (InvalidUserNameOrPassword), not a session. **PASS** (SEC-02..07 negative path).

---

## 2. Function-level authorization / RBAC (SEC-14, SEC-15)

### 2.1 No-permission user → 403 (executed)

Authenticated as `noperm` (valid session, zero roles/permissions):

| Endpoint | Result |
|---|---|
| `/api/v1/app/business` | **403** |
| `/api/v1/app/organization` | **403** |
| `/api/v1/app/inspection-plan` | **403** |
| `/api/v1/administration/users` | **403** |
| `/api/v1/app/audit-log` | **403** |

**PASS** — a fully authenticated but unauthorized user is denied by the server on every function. This is real function authorization, not UI hiding (the request never reached data). Satisfies **SEC-15** and the intent of **SEC-14** (authorization is server-enforced, independent of any client rendering).

### 2.2 Authorized user → 200 (executed)

`admin` receives **200** with real data on `business` (16 records), `organization`, `administration/users`, and `audit-log`. Baseline confirms the endpoints function when authorized.

---

## 3. Data-scope / organization isolation (SEC-16, SEC-17) — the critical control

This is the highest-risk requirement class and was tested end-to-end with a real write.

### 3.1 List-level scoping (executed)

Same `GET /api/v1/app/business`, different identities. All 16 seeded businesses belong to the Province org (…001):

| Identity | `totalCount` returned | Interpretation |
|---|---|---|
| `admin` (global) | 16 | sees all |
| `province.admin` (…001) | 16 | sees own org + descendants |
| `district.staff` (…002) | **0** | Province data is *above* it → correctly hidden |
| `readonly` / commune (…003) | **0** | correctly hidden |

**PASS** — list results are filtered server-side by the caller's organization subtree.

### 3.2 Object-level scoping / IDOR read (executed)

Direct `GET /api/v1/app/business/{id}` for a **Province-owned** business, by ID:

| Identity | Result |
|---|---|
| `admin` | 200 |
| `province.admin` | 200 |
| `district.staff` | **403** |
| `readonly` (commune) | **403** |

**PASS** — guessing/holding a valid ID from another org does **not** grant access. Object-level authorization is enforced, not just list filtering.

### 3.3 Cross-module IDOR (executed)

`district.staff` requesting a **Province-owned self-declaration** by ID → **403**. Confirms scoping is a shared cross-cutting control (`ICurrentDataScopeProvider`), not re-implemented per module and missed somewhere.

### 3.4 Write path — create scoping and hierarchy (executed, real persistence)

| Action | Identity | Target org | Result | Expected |
|---|---|---|---|---|
| Create business | `district.staff` | own District org | **200** (persisted, id returned) | ✅ own-org write allowed |
| Create business | `district.staff` | Province org (up-tree) | **403** | ✅ cross-org create denied |
| Create business | `readonly` | Province org | **403** | ✅ cross-org create denied |
| Create business | `readonly` | own Commune org | **200** | ✅ own-org write allowed |

After the District create, hierarchy visibility was verified against the persisted record:

| Reader | Result | Expected |
|---|---|---|
| `district.staff` (creator) | 200 | ✅ |
| `province.admin` (parent org) | 200 | ✅ parent sees descendant |
| `readonly` (commune, different subtree) | **403** | ✅ not a descendant |
| `admin` (global) | 200 | ✅ |
| `district.staff` LIST total | 1 | ✅ persisted + visible |
| `readonly` LIST total | 0 | ✅ isolation maintained |

**PASS** — write authorization is bound to `input.OrganizationId` via `EnsureOrganizationAccessAsync` in `BusinessAppService.CreateAsync`, and the org must be inside the caller's scope. The `CurrentDataScopeProvider` expands the caller's org downward through `OrganizationHierarchyScope.Expand`, so a parent org legitimately sees children while siblings/ancestors are blocked.

### 3.5 IDOR write / tampering (executed)

`readonly` attempting to mutate the District-owned business:

| Attack | Result | Post-check |
|---|---|---|
| `PUT /business/{id}` (rename to "HACKED-BY-READONLY") | **403** | name unchanged |
| `DELETE /business/{id}` | **403** | record intact |

Verified afterward as `admin`: the business name was **still** the original `SEC-DIST-OWN-…`. **PASS** — no cross-org write or delete succeeded; no silent data tampering.

*(Test artifacts created during this probe were deleted afterward as `admin`; the seed DB is left clean.)*

---

## 4. CSRF protection (SEC-13)

`POST /api/account/login` **without** the `RequestVerificationToken` header (antiforgery) → **400**. With the token → success. **PASS** — antiforgery is enforced on state-changing requests. (All authenticated write probes in §3 had to carry the token to reach the endpoint, further confirming enforcement.)

---

## 5. Role-grant accuracy (observed, with a policy caveat)

`province.admin` (ProvinceAdmin role) was probed against administration endpoints:

- Holds `FoodSafe.SystemAdmin.Users.*` (Create/Edit/ManageRoles/ManageScope/Activate/Lock/ResetPassword/ViewActivity) and audit-log view — confirmed in its live permission list.
- `GET /api/v1/administration/users` → 200; `POST` → **400** (validation on a deliberately minimal body, i.e. authorization *passed* because the role holds Create), `GET /api/v1/app/audit-log` → 200.

**Enforcement is correct** — the server honors exactly the grants the role has. However, this surfaces a **policy question, not an enforcement bug**: whether the *ProvinceAdmin* role *should* hold full system user-administration and audit-log rights needs to be reconciled against the permission matrix (`docs/05-permission-matrix.md`, STT 1–3). Flagged as **OBSERVATION O-1** below. The negative controls (`noperm` → 403 everywhere; `readonly` → 403 cross-org writes) prove the permission gate itself works.

---

## 6. Items NOT runtime-verified in this pass (honesty ledger)

These security requirements cannot be positively proven by the black-box probes above and must not be counted as browser/runtime-verified:

| Item | Requirement | Why not proven here | Where to verify |
|---|---|---|---|
| CAPTCHA actually enforced in production | SEC-08 | Dev accepts a Cloudflare **test** secret; every login above used a dummy token that the dev config deliberately accepts. Production enforcement is config-dependent. | Prod config review + a staging login attempt with a bad Turnstile token |
| Password expiry 90 days / no-reuse | SEC-04 | Seed sets a 3650-day window; not exercised | Dedicated backend test / manual aging |
| Session timeout duration | SEC-10 | Cookie present and HttpOnly path works, but timeout value not exercised | Config review + long-idle test |
| Secure cookie flag on HTTPS | SEC-12 | Stack runs on HTTP (`127.0.0.1:8080`); `Secure` flag only asserts under TLS | Staging over HTTPS |
| TLS ≥ 1.2, ciphers, IPv6, DNSSEC | IPV-01..06, DBS-* | Infrastructure/deployment concerns, out of scope for the app black-box | Deployment/ops verification |
| XSS output encoding, response-splitting, XXE | SEC-19/20/23 | Not fuzzed in this pass | Targeted payload tests / SAST |
| DB least-privilege, at-rest encryption, DB audit | DBS-01..10 | Database/infra layer | DBA review — see `docs/production-audit/05-database-readiness.md` |

---

## 7. Findings

**No security *defect* was found in the tested controls.** Authentication, function authorization, organization data scope (list, object, and write), IDOR (read + write, two modules), and CSRF are all correctly enforced server-side against the live stack.

**OBSERVATION O-1 (policy, not a bug):** ProvinceAdmin holds system user-administration + audit-log permissions. Confirm this matches the intended permission matrix before UAT sign-off. If it does not, it is a seed/permission-grant correction (`FoodSafePermissionDataSeedContributor`), not an enforcement fix.

**CAVEAT C-1 (production gap):** CAPTCHA (SEC-08) is bypassed in the audited environment by design. It is untested as an actual control; it must be verified on a staging environment with real Turnstile before production acceptance.

**CAVEAT C-2 (environment):** All results are for the Development-profile stack over HTTP. Transport-layer requirements (Secure cookies, TLS, IPv6) are unproven here by construction and remain deployment-verification items.

---

## 8. Verdict for the security dimension

Application-layer access control (**RBAC + data scope + IDOR + CSRF + authN**): **PASS with executable evidence.** This is the strongest, most independently-confirmed part of the system.

Transport/infra/CAPTCHA security (**SEC-08, SEC-12, IPV, DBS**): **NOT VERIFIED here** — requires a staging/production environment. These gate *production* acceptance but not *UAT* of application functionality.
