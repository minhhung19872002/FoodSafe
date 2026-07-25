# System Architecture — FoodSafe

## Decision

FoodSafe is a **modular monolith with Clean Architecture dependencies and feature-oriented application modules**. It is deployed as one ASP.NET Core API/background-process host, one React SPA, PostgreSQL 15, Redis 7, private MinIO object storage, and ClamAV malware scanning. This meets the integration and operational requirements without premature distributed-system complexity.

```text
Browser
  ├─ Internal Vietnamese SPA
  └─ Public portal
          │ HTTPS / versioned JSON API
ASP.NET Core + ABP modular monolith
  ├─ Identity / permissions / audit
  ├─ Feature application services
  ├─ Domain model and workflows
  ├─ Integration endpoints and jobs
  └─ File authorization and streaming
      ├─ PostgreSQL 15 (system of record)
      ├─ Redis 7 (cache/distributed coordination)
      ├─ MinIO (file objects; metadata remains in PostgreSQL)
      ├─ ClamAV (internal synchronous upload scanning)
      └─ SMTP / external partner APIs
```

## Trust boundaries

- The browser is untrusted. UI permissions improve usability but never authorize.
- Every internal operation checks functional permission, organization scope, administrative-area scope, ownership when relevant, workflow status, and administrative level.
- Object keys are server-generated and never accepted as download authorization.
- Partner traffic is authenticated, replay-resistant, idempotent, rate-limited, correlated, and audited.
- Public APIs return explicit safe projections and cannot reuse internal DTOs accidentally.

## Runtime decisions

- PostgreSQL is the authoritative database because the approved schema uses PostgreSQL types, indexes, constraints, and extensions.
- EF Core migrations are the executable application schema history. The approved SQL remains the requirements/design reference and is validated against mappings.
- ABP Identity and OpenIddict provide established password hashing, account lockout, permissions, auditing, and token protocol support.
- Background jobs handle retryable integration, file scanning, certificate expiry, and expensive report preparation.
- OpenAPI is generated from versioned application contracts.
- Health endpoints distinguish liveness from readiness and cover required dependencies.

## Deployment shape

Local development and the initial production topology use Docker Compose-compatible containers. Production places an HTTPS reverse proxy in front of the SPA/API, uses externalized secrets, persistent backed-up PostgreSQL/MinIO volumes, and restricts administrative endpoints such as Hangfire and OpenAPI.

## Quality attributes

- Security: ATTT level-2 controls, least privilege, auditability, safe files, no client-authoritative scope.
- Reliability: transactions around aggregate changes, optimistic concurrency, idempotent integration, retry history, health checks.
- Performance: bounded pagination, indexed filters, projections, cached dashboard aggregates, asynchronous exports.
- Maintainability: contracts first, feature folders, domain transition methods, no entity exposure or mechanical generic service layer.
- Accessibility: semantic Vietnamese UI, keyboard support, visible focus, text plus color for statuses.
