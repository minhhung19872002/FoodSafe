# Implementation Roadmap — FoodSafe

## Delivery policy

A slice advances only when its contracts, domain rules, persistence, authorization/scope, UI states, tests, build and review pass. Stable milestones are committed separately. Readiness claims are evidence-based.

## Milestone 1 — Foundation and scope (in progress)

Deliverables:

- Executable PostgreSQL baseline and EF migrations
- Error contract, validation, correlation, logging, health, versioning and rate limiting
- Hardened Identity/OpenIddict authentication and account lifecycle
- Permission, organization and administrative-area scope resolvers
- Geographic catalogs and completed organizations UI/API
- Shared frontend application shell, protected/permission routes and standard states

Remaining risks: reconciling later approved-SQL modules with ABP-owned tables; several open scope decisions in `docs/15`; login CAPTCHA/recovery delivery, API versioning, remaining foundation catalogs and a production backup/restore rehearsal.

## Milestone 2 — Master data, facilities, products and files

Catalog slices precede facilities/products. The file mechanism is completed before attachment-bearing regulatory records. Facility/product import validates the full workbook before transaction commit.

## Milestone 3 — Declarations, registrations and certificates

Implement self-declarations, product/ad registrations, eligibility, CFS and export certificates with scoped official identifiers, lifecycle history, secure attachments and exports.

## Milestone 4 — Inspection, violations, warnings and news

Implement explicit plan/result transitions, violations/actions, publication workflows, public warning intake and editorial public content.

## Milestone 5 — Poisoning and reporting workflows

Implement case/incident correction flows, immutable submitted report versions, upward aggregation lineage, controlled reopen/resubmit and textual/Excel outputs.

## Milestone 6 — Hazard, laboratory, documents, dashboard and statistics

Implement structured testing links/results, publications, document search/files, scoped cached dashboard aggregates, maps/charts and report exports.

## Milestone 7 — Public portal and integrations

Expose safe published projections and secure public downloads. Implement partner/client management, versioned contracts, correlation, idempotency, retries, attempt history and manual review.

## Milestone 8 — Production hardening

Perform full authorization/security/performance reviews, Dockerize API/SPA and dependencies, add CI/CD gates, migration rehearsal, backup/restore rehearsal, deployment/operations/disaster-recovery guides, E2E regression and final readiness assessment.

## Current evidence

| Gate | Result on 2026-07-25 |
|---|---|
| Backend build | Pass, 0 warnings |
| Backend tests | Pass, 25 tests including PostgreSQL migration/constraint integration, request contracts, password policy and root-promotion authorization; coverage remains incomplete |
| Frontend strict production build | Pass |
| Frontend tests | Pass, 9 tests including authentication, forced password change, permissions, catalog form and generated API routes; coverage remains incomplete |
| EF migrations | Pass; four migrations apply cleanly and repeat idempotently, with no pending model changes |
| Docker full stack | Pass; six-service health-gated stack builds and runs, with a one-shot migrator and non-root API/SPA containers |
| Security | Improved but not ready; cookie/CSRF session, lockout, password history/expiry, throttling and foundational data scope are implemented; CAPTCHA/recovery and final review remain |
| Overall | NOT READY |
