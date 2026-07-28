# Production Readiness Review — System Overview

**Date:** 2026-07-28 · **Reviewed HEAD:** `6b6ff6a` (branch `feat/integration-completion`) · **Reviewer:** Solution Architect / QA Lead / Security Reviewer / Release Manager (combined gate role)
**Runtime verified:** full Docker Compose stack healthy at review time (api, frontend, postgres, redis, minio, clamav, mailpit — all `healthy`).

## 1. What the system is

**FoodSafe** — food-safety management system for Chi cục An toàn vệ sinh thực phẩm tỉnh Quảng Ninh (provincial food-safety authority). A Level-2 information system under Nghị định 85/2016/NĐ-CP, covering licensing, inspection, food-poisoning surveillance, statutory reporting, public transparency portal, and inter-agency data exchange (Bộ Y tế / Sở NN / Sở CT per Thông tư 31/2026/TT-BCT). Requirement source: YCKT (Mẫu số 03), 42 pp., 469 extracted atomic requirements (`docs/audit/60`).

## 2. Architecture

```
Citizen / Officer browser
   │  HTTPS (prod) / HTTP (dev)
   ▼
nginx (FoodSafe.FE container, :8080) ── serves React SPA, proxies /api + /swagger
   ▼
ASP.NET Core 9 + ABP Framework 9 (FoodSafe.HttpApi.Host)
   │  Clean Architecture + DDD: Domain.Shared / Domain / Application.Contracts /
   │  Application / EntityFrameworkCore / HttpApi / HttpApi.Client / DbMigrator
   ▼
PostgreSQL 15 (EF Core, snake_case tables, soft delete)     Redis 7 (declared; currently unused by BE code — G-23)
MinIO (S3-compatible private bucket `foodsafe-files`)        ClamAV (upload malware scanning)
Mailpit (dev SMTP; prod SMTP via env)
```

- **Backend pattern:** ABP AppService layer (no MediatR/CQRS), aggregate roots with guard-clause invariants, domain events, static factory methods, Value Objects; repository + specification patterns; ABP unit-of-work per request.
- **Frontend:** React 19 + TypeScript + Vite; Ant Design 5; TanStack Query v5 (server state); Zustand (auth store); React Hook Form + Zod; React Router v7 with route-level lazy chunks; Leaflet maps; Recharts statistics. Feature-folder architecture (`src/features/<context>/{api,components,pages,types}`), Container/Presenter and adapter patterns per project rules.
- **Database:** ~44+ custom tables plus ABP infrastructure tables; organization-scoped aggregates; polymorphic `file_attachments`; audit columns + ABP audit logging; EF migrations executed by the dedicated **DbMigrator** container before the API starts (`Database__AutoMigrate=false` — migrations never run implicitly in the API).

## 3. Authentication

- Cookie-based ABP/OpenIddict login (`POST /api/account/login`) with: antiforgery token requirement (XSRF cookie + header), **Cloudflare Turnstile CAPTCHA enforced server-side by `LoginCaptchaMiddleware`** (empty-token short-circuit; production config validation forbids test keys), account lockout (5 attempts / 30 min), password policy ≥8 chars with complexity, **90-day password expiry enforced server-side** (`PasswordExpiryMiddleware` blocks every business API for expired accounts and whitelists only the change-password surface), forgot/reset via emailed token (CAPTCHA-gated).
- Sessions are server-tracked (ABP identity sessions): logout revokes the session server-side (verified — a second browser holding the same cookie is signed out). HttpOnly cookies; Secure flag active under HTTPS (prod).

## 4. Authorization

- **RBAC via ABP permissions** (`FoodSafePermissions`, ~180 granular permissions across 20+ groups), enforced with `[Authorize(...)]` at AppService/controller level; **FE mirrors** with `PermissionRoute` + permission-filtered menu/tabs driven by the single-source map `src/app/routePermissions.ts` (added by the UI-fix batch `83ec103`).
- **Data scoping — Organization Unit pattern (not ABP multi-tenancy):** 3-level hierarchy Tỉnh → Huyện/TP → Xã/Phường; aggregates carry `OrganizationId`; AppServices filter by the caller's organization subtree; administrative-area scoping via province/district/commune references. Cross-org and cross-area denial carries executed browser-probe evidence (doc 74).
- Object-level checks verified for attachments (download authorized against the owning entity's scope) and workflow actions (per-status permission checks).

## 5. Main business modules ↔ user-facing features

| Module (bounded context) | Features (registry IDs) |
|---|---|
| Organizations / Geographic & Master Catalogs | F-003, F-004, F-005 |
| BusinessManagement | Businesses + products + Excel import (F-006), Self-declarations (F-007) |
| Licensing | Product registrations (F-008), Ad registrations (F-009), Eligibility (F-010), CFS (F-011), Export food (F-012), certificate PDFs incl. anonymous download (F-034) |
| Inspection | Plans + results + violations + attachments (F-013) |
| FoodPoisoning | Cases + incidents + map (F-014) |
| Reporting | NĐTP / ATTP-work / Action-month with Draft→Submitted→Verified→Returned/Completed state machine, error-notification (báo cáo sai sót) channel, roll-up aggregation (F-015) |
| AlertsAndTesting | Alerts+news incl. citizen submissions moderation (F-016), testing results (F-017), risk analysis (F-018), legal documents (F-031) |
| DataIntegration | Outbound endpoints/credentials/share/retry (F-019, c–e), **inbound partner surface**: partner accounts, hashed API keys, receive endpoint (F-019f), partner API specification management + published OpenAPI (F-019g) |
| System | Identity administration (F-020), audit logs (F-021), settings incl. branding/CAPTCHA/password policy (F-032) |
| Overview | Dashboard (F-022), Statistics + report statistics + Excel exports (F-023) |
| Public portal | Home, general search, 7 certificate lookups, warned businesses, news, legal documents, citizen alert/news submission with tracking codes (F-024–F-030, F-033) |

## 6. User roles

Seeded/managed via ABP identity: `admin` (bootstrap), ProvinceAdmin, DistrictStaff, CommuneStaff (+ deterministic E2E fixtures incl. a no-permission and an expired-password account, Development-only seeding). Roles are configurable at runtime (F-020 role CRUD + permission tree); the permission matrix doc (`docs/05-permission-matrix.md`) defines 7 role archetypes across all features.

## 7. External integrations

| Integration | State |
|---|---|
| **Outbound** data sharing to Bộ Y tế / Sở NN / Sở CT (7 shared data types, STT 51–57) | Engine complete: endpoint config, encrypted credentials (P0-2), typed payload builders, call history + retry with attempt tracking, SSRF-guarded outbound URLs. Proven against a real HTTP receiver; **real ministry endpoints unavailable (INT-01 — external)** |
| **Inbound** partner submissions | Live: `POST /api/v1/partner/submissions/{dataType}` with per-partner hashed API keys (one-time raw display), timestamp/replay window, idempotency, guard matrix returning envelope-coded 400s; submissions stored verbatim pending the official TT 31/2026 field map (**INT-02 — externally blocked**); reviewer disposition workflow not yet built (G-04) |
| Partner-facing API contract | Published: `docs/integration/` (spec, OpenAPI 3.0.3, onboarding guide, examples) + in-app spec management with anonymous download (F-019g), verified by an executable contract test |
| CAPTCHA (Cloudflare Turnstile) | Server-enforced; dev/test keys in non-prod; production validation refuses test keys; staging probe with real keys still owed (I-2) |
| SMTP | Mailpit in dev; production SMTP via environment (not yet provisioned) |

## 8. Where the evidence lives

This review builds on and independently spot-verifies: feature verification registry (34/34 VERIFIED, real-stack Playwright evidence), `docs/production-audit/08-final-production-go-no-go.md` (independent gate at `6326af4`: BE 635/635, Playwright 286/286 zero-interception), `docs/audit/CURRENT_REQUIREMENT_GAP_ANALYSIS.md` (469-item re-audit at `aad87c1`, gap register G-01…G-47), `docs/testing/05-load-test-results.md` (k6 NFR run), UI audit + fix (`testing/ui-audit/`, 323/323), and fresh code inspection performed for this review (security, authorization, backend quality, testing, operations — see the sibling documents).
