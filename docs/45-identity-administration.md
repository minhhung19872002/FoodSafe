# Identity Administration

## Authorization model

Identity administration uses the `FoodSafe.SystemAdministration` permission
tree. User and role operations have separate view/create/edit/lifecycle
permissions. Role permission assignment is additionally constrained by a
ceiling: an administrator cannot grant a permission they do not possess.

Every user read or mutation is resolved through `ICurrentDataScopeProvider`.
Global administrators can operate across organizations. Other administrators
can see and modify only users whose profile organization is in the allowed
descendant set for the requested operation. Supplemental geographic grants
must remain inside that same effective scope.

## Default roles

The migrator idempotently creates:

- `SystemAdmin`
- `ProvinceAdmin`, `ProvinceStaff`
- `DistrictAdmin`, `DistrictStaff`
- `CommuneAdmin`, `CommuneStaff`

Default roles are static: they cannot be renamed or deleted. The core
`SystemAdmin` role cannot be deactivated. Other roles may be deactivated only
when they have no assigned users. Scoped administrators can assign only an
active default role matching the target organization's level; global
administrators may manage custom roles.

## User lifecycle invariants

- Usernames are normalized email addresses.
- A cryptographically random temporary credential is generated server-side and
  is never returned by the API.
- Creation always sends a time-bound setup/reset link.
- New users must complete a CAPTCHA-protected initial password change.
- Self lock, self deactivation, and self removal of an administrator role are
  rejected.
- Only active and unlocked administrators count toward the final-administrator
  safeguard.
- Role changes and lifecycle changes update the security stamp, invalidating
  existing sessions immediately.
- Optimistic concurrency stamps protect user and role edits.

## SPA behavior

The `/administration/identity` route and navigation entry require
`FoodSafe.SystemAdministration`. Individual controls are rendered only for
their exact child permission. The page provides:

- user search and organization/role/status filters;
- create/edit forms with cascading geographic assignments;
- activate, lock, password reset, and activity actions;
- role search/status management and assigned-user navigation;
- hierarchical permission selection that automatically maintains parent/child
  consistency.

## Verification

The milestone is covered by domain rule tests, proxyability and dependency
architecture tests, API contract tests, CAPTCHA middleware tests, frontend
permission-tree and CSRF-transition tests, clean PostgreSQL migration, and a
live Compose lifecycle. The live lifecycle confirmed setup and reset email
delivery through Mailpit, first-login completion, subsequent cookie login,
forced-change clearance, password history/expiry rotation, and attributed
audit-log retrieval.
