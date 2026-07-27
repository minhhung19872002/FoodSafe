# Test Policy — FoodSafe

## Core principle

Every feature must be verified through the real application stack before it can be
considered complete. A passing unit test, mocked API test, or intercepted Playwright
test is not sufficient evidence.

## Verification stack

```
React frontend (Playwright browser)
→ real HTTP request
→ ASP.NET Core API
→ authentication and authorization
→ application layer
→ Entity Framework Core
→ real PostgreSQL database
→ real HTTP response
→ rendered frontend result
```

## Feature statuses

| Status         | Meaning                                      |
|----------------|----------------------------------------------|
| NOT_STARTED    | No work has begun                            |
| IN_PROGRESS    | Implementation in progress                   |
| READY_FOR_TEST | Code complete, awaiting verification         |
| FAILED         | Verification ran and found defects           |
| VERIFIED       | Passed real runtime acceptance               |
| DIRTY          | Previously verified but affected by a change |
| BLOCKED        | Cannot be tested due to external dependency  |

## Retest levels

- **Level 0** — No retest: docs, comments, formatting only
- **Level 1** — Visual smoke: CSS, spacing, layout changes
- **Level 2** — Full feature: code change within one feature
- **Level 3** — Dependent regression: shared dependency changed
- **Level 4** — Full regression: release candidate or architecture change

## What is prohibited in acceptance tests

- API interception (`page.route`, `route.fulfill`, MSW for FoodSafe APIs)
- Fake authentication (injected tokens, fake localStorage, fake permissions)
- Mocked DbContext, repositories, or application services
- EF Core InMemory as acceptance evidence

## Evidence required for VERIFIED status

Each verified feature must record: Git commit, date, environment, tested endpoints,
test accounts used, API interception = No, positive/negative flows, validation,
permissions, organization isolation, workflow transitions, persistence after reload.
