# Feature Verification Registry

## Legend

- **Status**: NOT_STARTED | IN_PROGRESS | READY_FOR_TEST | FAILED | VERIFIED | DIRTY | BLOCKED
- **E2E spec**: Playwright spec file if exists
- **Verified commit**: Git SHA when last verified against real stack

## Registry

| ID    | Feature                        | Status         | E2E Spec                           | Verified Commit | Date       |
|-------|--------------------------------|----------------|------------------------------------|-----------------|------------|
| F-001 | Authentication (Login)         | READY_FOR_TEST | —                                  | —               | —          |
| F-002 | Password Management            | READY_FOR_TEST | —                                  | —               | —          |
| F-003 | Organizations                  | READY_FOR_TEST | —                                  | —               | —          |
| F-004 | Master Catalogs                | READY_FOR_TEST | `e2e/catalogs.spec.ts`             | —               | —          |
| F-005 | Geographic Catalogs            | READY_FOR_TEST | —                                  | —               | —          |
| F-006 | Businesses & Products          | READY_FOR_TEST | `e2e/businesses.spec.ts`           | —               | —          |
| F-007 | Self Declarations              | READY_FOR_TEST | `e2e/self-declarations.spec.ts`    | —               | —          |
| F-008 | Product Registrations          | READY_FOR_TEST | `e2e/product-registrations.spec.ts`| —               | —          |
| F-009 | Advertisement Registrations    | READY_FOR_TEST | `e2e/advertisement-registrations.spec.ts` | —        | —          |
| F-010 | Eligibility Certificates       | READY_FOR_TEST | `e2e/eligibility-certificates.spec.ts` | —           | —          |
| F-011 | CFS Certificates               | READY_FOR_TEST | `e2e/cfs-certificates.spec.ts`     | —               | —          |
| F-012 | Export Food Certificates       | READY_FOR_TEST | `e2e/export-food-certificates.spec.ts` | —           | —          |
| F-013 | Inspection Plans & Results     | READY_FOR_TEST | —                                  | —               | —          |
| F-014 | Food Poisoning Cases           | READY_FOR_TEST | —                                  | —               | —          |
| F-015 | Reporting (NDTP/ATP/Action)    | READY_FOR_TEST | —                                  | —               | —          |
| F-016 | Alerts & News                  | READY_FOR_TEST | —                                  | —               | —          |
| F-017 | Testing Results                | READY_FOR_TEST | —                                  | —               | —          |
| F-018 | Risk Analysis                  | READY_FOR_TEST | —                                  | —               | —          |
| F-019 | Data Integration               | READY_FOR_TEST | —                                  | —               | —          |
| F-020 | Identity Administration        | READY_FOR_TEST | `e2e/identity-administration.spec.ts` | —            | —          |
| F-021 | Audit Logs                     | READY_FOR_TEST | `e2e/audit-logs.spec.ts`           | —               | —          |
| F-022 | Dashboard                      | READY_FOR_TEST | —                                  | —               | —          |
| F-023 | Statistics                     | READY_FOR_TEST | —                                  | —               | —          |
| F-024 | Public Lookup — Business       | READY_FOR_TEST | `e2e/public-lookups.spec.ts`       | —               | —          |
| F-025 | Public Lookup — Self Declaration| READY_FOR_TEST| `e2e/public-lookups.spec.ts`       | —               | —          |
| F-026 | Public Lookup — Product Reg.   | READY_FOR_TEST | `e2e/public-lookups.spec.ts`       | —               | —          |
| F-027 | Public Lookup — Eligibility    | READY_FOR_TEST | `e2e/public-lookups.spec.ts`       | —               | —          |
| F-028 | Public Lookup — CFS            | READY_FOR_TEST | `e2e/public-lookups.spec.ts`       | —               | —          |
| F-029 | Public Lookup — Export Food     | READY_FOR_TEST | `e2e/public-lookups.spec.ts`       | —               | —          |
| F-030 | Public Lookup — Ad Registration| READY_FOR_TEST | `e2e/public-lookups.spec.ts`       | —               | —          |
| F-031 | Documents                      | READY_FOR_TEST | —                                  | —               | —          |
| F-032 | System Settings                | READY_FOR_TEST | —                                  | —               | —          |

## Summary

- Total features: 32
- VERIFIED: 0
- READY_FOR_TEST: 32
- NOT_STARTED: 0
- Features with E2E specs: 17 (F-004, F-006–F-012, F-020, F-021, F-024–F-030)

## Notes

Features with existing Playwright specs are `READY_FOR_TEST` because they have not
been run against the real stack and verified in this registry yet. Running the specs
against a real PostgreSQL backend and recording the commit will move them to `VERIFIED`.
