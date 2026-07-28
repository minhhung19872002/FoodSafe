# Dependency Security Policy — FoodSafe

## Automated gate

CI audits the complete NuGet dependency graph, audits production npm
dependencies, validates the EF model, and builds the deployable images. Any
newly reported NuGet advisory fails
`scripts/Test-NuGetVulnerabilities.ps1` unless it has a narrow, documented
mitigation entry.

Direct security-floor references prevent vulnerable transitive versions of
Scriban, MailKit/MimeKit, Newtonsoft.Json, and SQLitePCLRaw from being selected by the ABP 9.3
dependency graph. ABP 9.3's template integration is binary-incompatible with
Scriban 7, so FoodSafe recompiles that small integration against Scriban 7.2.5
and applies a public-property-only template member filter. Password-reset
email rendering is exercised live in the container gate. Dependabot checks
NuGet, npm, and GitHub Actions weekly.

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
`MaxDepth(8)`. The CI exception is limited to this package/advisory pair and
is applied in three narrowly scoped places that must be removed together when
upgrading to an ABP line compatible with AutoMapper 15.1.1 or later:

- `FoodSafe.BE/common.props`: a `NuGetAuditSuppress` for
  `GHSA-rvv3-g6hj-g44x` only, so the restore-replayed NU1903 does not fail
  the warnings-as-errors CI build. NuGet auditing itself remains enabled and
  any other advisory still fails the build.
- `scripts/Test-NuGetVulnerabilities.ps1`: the allow-list entry for this
  package/advisory pair. `dotnet list package --vulnerable` ignores
  `NuGetAuditSuppress`, so this gate keeps detecting and reporting the
  finding as an explicitly mitigated risk on every run.
- `.trivyignore`: the `CVE-2026-32933` entry (found in the API/migrator image
  `.deps.json`), with an enforced `exp:` date so the exception cannot outlive
  its review.
