# Frontend Testing Rules

These rules apply to all files under `FoodSafe.FE/`.

Follow the testing strategy defined in the root `CLAUDE.md`.

## Default frontend verification

Frontend functionality must be verified through the real application:

Playwright browser
→ real React frontend
→ real HTTP request
→ real ASP.NET Core backend
→ real authentication and authorization
→ real PostgreSQL database

Do not create new Vitest unit tests, isolated component tests, or mocked API tests
unless explicitly requested.

Existing lower-level tests may remain, but they do not count as runtime acceptance.

## Prohibited in real acceptance tests

Do not use:

- `page.route()`
- `route.fulfill()`
- `route.abort()`
- FoodSafe API interception
- MSW for FoodSafe business APIs
- `vi.mock()` for API clients
- fake API responses
- manually injected access tokens
- manually injected refresh tokens
- fake localStorage authentication
- fake permission context
- fake organization context
- fake administrative-area context
- hard-coded successful responses

Do not bypass the real login page unless the specific test is not related to
authentication and the stored session was created through a previous real login.

## Required browser scenarios

For each frontend feature, verify applicable scenarios:

- route loads
- navigation entry works
- real login works
- list loads from the real API
- search works
- filtering works
- sorting works
- pagination works
- create works
- validation is displayed
- detail works
- edit works
- lifecycle action works
- export works
- upload and download work
- loading state works
- empty state works
- error state works
- permission denial is displayed correctly
- cross-organization denial is enforced by the backend
- cross-area denial is enforced by the backend
- saved data remains after browser reload
- browser console has no unexpected error
- required network requests succeed

Do not consider a test complete when it only verifies that a heading or component renders.

## Feature status

Before testing a frontend feature, read:

- `docs/testing/01-feature-verification-registry.md`
- `docs/testing/02-impact-map.md`
- `docs/testing/features/<feature>.md`

After successful verification:

- record the frontend route
- record the backend endpoints reached
- record that API interception was `No`
- record persistence after reload
- record authorization and scope results
- record the verified Git commit
- update the registry status to `VERIFIED`

When frontend code affects a previously verified feature:

- change its status to `DIRTY`
- run the required feature or visual retest
- return it to `VERIFIED` only after real browser verification passes

Do not retest unrelated `VERIFIED` features.