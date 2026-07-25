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

Risks: reconciling the large approved SQL with ABP-owned tables; several open scope decisions in `docs/15`; current SPA token storage and disabled CSRF validation.

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
| Backend tests | Pass, 6 tests; coverage materially insufficient |
| Frontend strict production build | Pass |
| Frontend tests | Pass, 1 test; coverage materially insufficient |
| EF migrations | Missing |
| Docker full stack | Missing; infrastructure-only Compose exists |
| Security | Not ready; known High findings in authentication/scope |
| Overall | NOT READY |

