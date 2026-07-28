# CI Gate Remediation — NU1903 Build Failures and Frontend Trivy Failures

Date: 2026-07-28
Branch: `fix/production-blockers`
Scope: `Application quality gates` job (NU1903 build errors) and
`Dependency and container gates` job (Trivy frontend image scan exit 1).

---

## 1. Diagnosis (completed before any file was modified)

### 1.1 NU1903 — which package, where, and why it fails the build

Evidence: `dotnet restore FoodSafe.sln` +
`dotnet list FoodSafe.sln package --vulnerable --include-transitive --format json`
run locally on this branch.

The complete vulnerable set for the whole solution is exactly two advisories:

| Package | Version | Severity | Advisory | Projects affected |
|---|---|---|---|---|
| `AutoMapper` | 14.0.0 | High | [GHSA-rvv3-g6hj-g44x](https://github.com/advisories/GHSA-rvv3-g6hj-g44x) (CVE-2026-32933) | 14 (all src + test projects) |
| `Volo.Abp.Account.Web` | 9.3.7 | Moderate | [GHSA-vfm5-cr22-jg3m](https://github.com/advisories/GHSA-vfm5-cr22-jg3m) | 2 (HttpApi.Host + its test host) |

- **All 14 NU1903 errors are the single AutoMapper advisory.** AutoMapper is
  *nominally direct*: `common.props` (imported by every project) pins
  `AutoMapper 14.0.0` as a deliberate downgrade-pin, because
  `Volo.Abp.AutoMapper 9.3.7` is ABI-locked to AutoMapper 14 — AutoMapper 15
  removed the `MapperConfiguration(MapperConfigurationExpression)` constructor
  that ABP 9.3.7 calls, so a 15.x pin builds but throws
  `MissingMethodException` at runtime (a previously verified incident, see
  `common.props` comment and doc 08 B-6). The pin therefore appears in every
  project, which is why "many .csproj files" report NU1903.
- **No patched compatible version exists.** Verified against NuGet.org:
  AutoMapper versions jump `14.0.0 → 15.0.1`; the fix line starts at
  15.1.1/16.1.1. There is no patched 14.x. The parent (`Volo.Abp.AutoMapper`)
  has no newer 9.3.x than 9.3.7 (verified via `dotnet package search`); the
  AutoMapper-15-compatible parent line is ABP 10 — a separately planned major
  framework upgrade (docs 43, production-audit 08 B-6).
- **Why the build (not the audit step) fails:** NuGet Audit runs at restore
  time and its warnings are replayed from the assets file during build. The CI
  build step uses `--warnaserror`, which promotes the replayed NU1903 to
  errors. Warnings-as-errors is *not* set globally in props — only on the CI
  build step, which is correct and stays. The dedicated audit gate
  (`scripts/Test-NuGetVulnerabilities.ps1`) already allow-lists exactly this
  package/advisory pair with a documented mitigation, but the build step has
  no equivalent narrow exception, so the same accepted advisory fails CI in a
  second place.
- The moderate `Volo.Abp.Account.Web` advisory is already suppressed narrowly
  via `<NuGetAuditSuppress>` in `FoodSafe.HttpApi.Host.csproj` and produces no
  restore warning; it is documented in doc 43.
- Central Package Management (`Directory.Packages.props`) is **not** used;
  versions are centralized via MSBuild properties in `common.props`
  (`$(AbpVersion)`, `$(MicrosoftNetVersion)`, …). That existing convention is
  kept — introducing CPM is an orthogonal refactor, not required for this fix.

### 1.2 Trivy — frontend image OS vulnerabilities

- Both `FoodSafe.FE/Dockerfile` (dev/CI image) and `FoodSafe.FE/Dockerfile.prod`
  (TLS production image) use runtime base
  `nginxinc/nginx-unprivileged:1.27-alpine`.
- **nginx 1.27 is a retired mainline branch and its image tag is no longer
  rebuilt.** Docker Hub (checked 2026-07-28) shows active weekly rebuilds only
  for `1.30-alpine` (stable, updated 2026-07-20) and `1.31-alpine` (mainline,
  updated 2026-07-27). The `1.27-alpine` tag is frozen, so its Alpine package
  set (musl, musl-utils, libxml2, nghttp2-libs, zlib, …) stopped receiving
  fixes and now carries fixable HIGH/CRITICAL CVEs → Trivy exits 1.
- `Dockerfile.prod` additionally lacks the `apk upgrade --no-cache` step the
  dev Dockerfile has, so even fixes already published in the base image's
  Alpine branch were not applied. **CI scans the `Dockerfile.prod` variant**:
  the compose overlay rebuilds the same `foodsafe-frontend:latest` tag after
  the dev build, so the last-built (prod) image is what the frontend Trivy
  step scans.
- The build stage uses `node:20-alpine`. Node.js 20 reached end-of-life
  2026-04-30 and CI tests with Node 22 (`setup-node`), a mismatch already
  flagged as M-02 in doc 06. Build-stage packages never ship in the runtime
  image, but building on an EOL toolchain that diverges from CI is wrong.
- Cache staleness: CI runners are ephemeral (base pulled fresh each run — the
  staleness is upstream, not cached layers), but `deploy.yml` uses a GHA
  layer cache (`mode=max`) without `pull: true`, and local `docker compose
  build` reuses whatever base tag is already present. Both can keep serving an
  old base digest after the tag moves.
- API/migrator images (`mcr.microsoft.com/dotnet/aspnet:9.0`, Debian-based,
  actively rebuilt by Microsoft) pass their scans; the AutoMapper CVE that
  Trivy finds in their `.deps.json` is covered by the documented
  `.trivyignore` entry.

---

## 2. Fix design

### 2.1 NuGet (NU1903)

Per policy (doc 43) the only compliant option is the narrowest per-advisory
exception, because **no patched compatible version exists** and the parent
upgrade is the tracked ABP 10 migration:

- Add `<NuGetAuditSuppress Include="https://github.com/advisories/GHSA-rvv3-g6hj-g44x" />`
  to `common.props`, next to the AutoMapper 14.0.0 pin and its mitigation
  comment. This is the purpose-built NuGet mechanism for excluding a single
  advisory; the repo already uses it for GHSA-vfm5-cr22-jg3m.
- NuGet auditing stays fully enabled (`NuGetAudit` untouched, no
  `NoWarn=NU1903`, no `TreatWarningsAsErrors` change): any *new* advisory
  still fails the CI build via `--warnaserror` **and** the audit script.
- Defense in depth is preserved: `dotnet list package --vulnerable` ignores
  `NuGetAuditSuppress`, so `Test-NuGetVulnerabilities.ps1` continues to see
  and report the advisory as an explicitly mitigated finding on every run.
- Removal condition (unchanged from doc 43): delete the suppression, the
  audit-script allow-list entry, the `.trivyignore` entry, and the 14.0.0 pin
  together when FoodSafe upgrades to an ABP line compatible with
  AutoMapper ≥ 15.1.1 (ABP 10).

### 2.2 Containers (Trivy)

- Runtime base for both frontend Dockerfiles:
  `nginxinc/nginx-unprivileged:1.27-alpine` → **`1.30-alpine`** (current
  *stable* branch, actively rebuilt; minor-version pin keeps reproducibility
  while tracking patch rebuilds). nginx config syntax used in
  `nginx.conf`/`nginx.prod.conf.template` is unchanged between 1.27 and 1.30.
- Add `apk upgrade --no-cache` to `Dockerfile.prod` (parity with the dev
  image) so fixes published to the Alpine branch between base-image rebuilds
  are applied at build time.
- Build stage: `node:20-alpine` (EOL) → `node:22-alpine` (active LTS, matches
  CI's Node 22), resolving M-02.
- CI (`ci.yml`): `docker compose build` → `docker compose build --pull` for
  both frontend/API build steps so a warm environment can never reuse a stale
  base tag.
- Deploy (`deploy.yml`): add `pull: true` to both `docker/build-push-action`
  steps so the GHA layer cache cannot pin an outdated base digest.
- `.trivyignore`: entry kept (fix requires the ABP 10 upgrade), hardened with
  owner and an enforced `exp:` expiration date per the exception policy.
- Trivy severity gates, `exit-code: 1`, and scanners are untouched. The
  pre-existing `ignore-unfixed: true` on image scans is retained (OS packages
  without an upstream fix are not actionable at image-build time); it is not
  part of this change.

### 2.3 Explicitly rejected approaches

- `NoWarn=NU1903` / disabling NuGet audit / dropping `--warnaserror` — blunt,
  would hide future advisories.
- AutoMapper 15.1.3 pin — builds, but crashes ABP 9.3.7 at runtime
  (documented prior incident).
- ABP 10 upgrade now — correct long-term fix, separately tracked; a major
  framework upgrade is not a CI-gate remediation.
- Weakening Trivy severity/exit-code/scope — prohibited; the frontend image
  genuinely contained fixable vulnerable OS packages.

---

## 3. Verification (see §5 of this doc after execution)

Planned: fresh `dotnet restore` (no NU19xx), `dotnet build --warnaserror`
(Release), `Test-NuGetVulnerabilities.ps1` (passes with mitigated finding
reported), frontend image rebuild from the new base, Trivy vuln scan of the
rebuilt image (HIGH/CRITICAL, exit code 0), and an installed-package check
that patched `libxml2`, `musl`, `musl-utils`, `nghttp2-libs`, `zlib` are
actually present in the runtime image.

## 4. Retest classification (testing policy)

- `common.props` suppression: restore-time metadata only — no runtime
  behavior change (Level 0).
- Frontend runtime base 1.27 → 1.30 + `apk upgrade` in prod image:
  infrastructure change to the serving layer; covered by CI's runtime gate
  `scripts/verify-prod-frontend.sh` (real container: HTTPS/TLS/HSTS/redirect/
  IPv6/healthz) plus the Compose health checks — equivalent of a Level 1
  visual/infra smoke, executed in CI on every run.
- No FoodSafe application code changed; no feature verification is
  invalidated.

## 5. Verification results (executed locally 2026-07-28)

| Check | Command / method | Result |
|---|---|---|
| Forced restore | `dotnet restore FoodSafe.sln --force` | exit 0, **zero NU19xx warnings** (previously 14× NU1903) |
| CI build gate | `dotnet build FoodSafe.sln -c Release --no-restore --warnaserror` | exit 0, 0 errors, 0 warnings |
| Backend tests | `dotnet test -c Release --no-build` | **618/618 passed** (Domain 209, HttpApi.Host 71, Application 320, EFCore 18) |
| Audit gate still sees advisory | `scripts/Test-NuGetVulnerabilities.ps1` | passes; still detects + reports AutoMapper GHSA-rvv3-g6hj-g44x (High) and Volo.Abp.Account.Web GHSA-vfm5-cr22-jg3m (Moderate) as explicitly mitigated — `NuGetAuditSuppress` does not blind this gate |
| Prod frontend image | `docker build --pull -f Dockerfile.prod` → Trivy (vuln, HIGH/CRITICAL, ignore-unfixed, exit-code 1) | exit 0, **0 vulnerabilities** (base now Alpine 3.24.1) |
| Dev frontend image | same, `Dockerfile` | exit 0, 0 vulnerabilities |
| Flagged packages patched | `apk list --installed` in runtime image | libxml2 2.13.9-r2, musl 1.2.6-r2, musl-utils 1.2.6-r2, nghttp2-libs 1.69.0-r0, zlib 1.3.2-r0 |
| Runtime smoke | container from rebuilt dev image | nginx **1.30.4** serves `/healthz` and `/` with HTTP 200 using the unchanged nginx.conf |
| `.trivyignore` `exp:` syntax | Trivy scan of API image with `--ignorefile` | parses, CVE-2026-32933 suppressed, all other targets 0 findings, exit 0 |

Note for future editors: an early draft of the `common.props` comment contained
a literal `--` sequence (from a quoted `dotnet` option) inside the XML comment.
`--` is illegal inside XML comments and, instead of a clean parse error, it
caused MSBuild/NuGet to evaluate every version property as empty (NU1604 for
every property-versioned PackageReference, then NU1107 conflicts on ancient
resolved versions). Never put double hyphens inside MSBuild XML comments.
