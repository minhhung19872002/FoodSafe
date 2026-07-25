# Dependency Security Policy — FoodSafe

## Automated gate

CI audits the complete NuGet dependency graph, audits production npm
dependencies, validates the EF model, and builds the deployable images. Any
newly reported NuGet advisory fails
`scripts/Test-NuGetVulnerabilities.ps1` unless it has a narrow, documented
mitigation entry.

Direct security-floor references prevent vulnerable transitive versions of
Scriban, Newtonsoft.Json, and SQLitePCLRaw from being selected by the ABP 9.3
dependency graph. Dependabot checks NuGet, npm, and GitHub Actions weekly.

## Temporary mitigated advisory

`Volo.Abp.Account.Web` 9.3.7 is reported under
`GHSA-vfm5-cr22-jg3m` for an open redirect in the self-registration flow. The
upstream patched line starts at ABP 10, which requires a separately planned
framework/runtime upgrade.

FoodSafe does not offer self-registration:

- `Abp.Account.IsSelfRegistrationEnabled` is forced to `false`.
- `/Account/Register` and `/api/account/register` are rejected with `404`
  before routing.
- Live container checks verified the effective setting and both route guards.

The NuGet allowlist is restricted to that package/advisory pair. It must be removed
when FoodSafe upgrades to a patched ABP line. It does not permit any other
advisory or package.

## Temporary React Router mitigation

React Router 7.18.1 is reported under `GHSA-qwww-vcr4-c8h2` for a CSRF bypass
that is specific to its React Server Components action handler. FoodSafe is a
Vite-built client-only SPA: it has no React Router server, RSC mode, action
endpoint, SSR runtime, or server-action deserializer. Downgrading would
reintroduce several advisories that affect older router releases, and no newer
stable release is available at the time of this audit.

`scripts/Test-NpmVulnerabilities.ps1` therefore permits only that exact
package/advisory pair and fails for any other production npm advisory. Remove
the entry as soon as an unaffected stable React Router release is available.

## Temporary AutoMapper mitigation

ABP 9.3.7 is binary-compatible with AutoMapper 14 and fails at runtime with
the patched AutoMapper 15 line. AutoMapper 14 is reported under
`GHSA-rvv3-g6hj-g44x` for stack exhaustion from an object graph tens of
thousands of levels deep.

FoodSafe's HTTP JSON parser rejects deep request graphs at its framework depth
limit, and FoodSafe does not map request DTOs through AutoMapper. Its
application mappings are entity-to-flat-response-DTO projections and specify
`MaxDepth(8)`. The CI exception is limited to this package/advisory pair.
Remove it when upgrading to an ABP line compatible with AutoMapper 15.1.1 or
later.
