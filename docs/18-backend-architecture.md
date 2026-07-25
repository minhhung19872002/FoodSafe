# Backend Architecture — FoodSafe

## Dependency boundaries

```text
Domain.Shared ← Domain ← Application ← HttpApi
                    ↑          ↑
              EF Core infrastructure
HttpApi.Host composes API, persistence, identity, jobs, observability
DbMigrator applies migrations and development-safe seed contributors
```

- **Domain.Shared:** enums, stable error codes, localization resources.
- **Domain:** aggregates, value objects, domain services/events, transition invariants, repository interfaces only where a specialized query is needed.
- **Application.Contracts:** versioned DTOs, validation metadata, permission names, application-service interfaces.
- **Application:** use cases, ordered authorization/scope checks, mapping and transaction boundaries.
- **EntityFrameworkCore:** mappings, migrations, specialized repositories, database constraints.
- **HttpApi:** conventional/versioned controllers generated from application contracts plus explicit file/integration endpoints.
- **Host:** authentication, exception contract, logging, correlation, rate limits, OpenAPI, health and background jobs.

## Feature slice rule

Each feature is completed API-first through contract, domain model, tests, application service, persistence/migration, frontend contract/hooks/UI/tests, adversarial review, and live verification. Arbitrary status updates are prohibited; transitions are explicit commands.

## Data scope

Application services resolve an immutable request scope from authenticated server-side assignments. List and export queries share the same scope predicate. Detail/mutation/download operations load through scoped queries or perform an explicit scope assertion before returning data. Organization hierarchy is not ABP multi-tenancy.

## Persistence rules

- Aggregate roots use optimistic concurrency where concurrent edits matter.
- Legal/evidentiary records are retained or soft-deleted according to the approved audit strategy.
- Submitted reports have immutable versions.
- Official identifiers use database uniqueness constraints with documented scope.
- Important relationships, state evidence, idempotency keys, and retry attempts are database-enforced.
- `CancellationToken` propagates through asynchronous I/O.

## Error and API contract

Validation, authentication, authorization, missing-resource, conflict, concurrency, and unexpected failures have stable machine-readable codes and Vietnamese messages. Production errors do not reveal stack traces or database details. Pagination is bounded and sorting is allow-listed.

## Authentication decision

Use ABP Identity plus OpenIddict. Browser authentication must not persist long-lived bearer tokens in `localStorage`. The target is short-lived access with refresh rotation/revocation in an HttpOnly, Secure, SameSite cookie-compatible flow (or an equivalent server session/BFF if ABP integration requires it). Password reset tokens are single-use and expire no later than eight hours. Account lockout, deactivation, password expiry/history, and audit requirements are enforced and tested.

## Testing boundaries

- Domain tests cover invariants/transitions.
- Application tests cover use cases and negative authorization.
- PostgreSQL integration tests cover mappings, constraints, scoping, concurrency and migrations.
- API tests cover authentication, error contracts, files, rate limits and public/internal separation.
- Architecture tests prevent dependency-boundary violations and entity exposure.

