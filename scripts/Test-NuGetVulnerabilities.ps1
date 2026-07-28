[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$auditJson = dotnet list FoodSafe.sln package --vulnerable --include-transitive --format json
if ($LASTEXITCODE -ne 0) {
    throw 'dotnet package vulnerability audit failed to execute.'
}

$audit = $auditJson | ConvertFrom-Json
# AutoMapper GHSA-rvv3-g6hj-g44x (CVE-2026-32933) is allow-listed as an
# accepted, mitigated risk. The fix (>= 15.1.1) is ABI-INCOMPATIBLE with ABP
# 9.3.7: Volo.Abp.AutoMapper 9.3.7 calls the AutoMapper 14 constructor
# `MapperConfiguration(MapperConfigurationExpression)` that 15.x removed, so a
# 15.x pin builds but throws MissingMethodException at runtime (every
# ObjectMapper call 500s). AutoMapper is therefore pinned to exactly 14.0.0 in
# common.props. The uncontrolled-recursion DoS is mitigated by (1) System.Text.
# Json MaxDepth=64 bounding request-graph depth before mapping and (2) the only
# recursive profiles being capped with .MaxDepth(8). Real fix tracked: ABP 10
# upgrade (ABP 10 targets AutoMapper 15).
$allowList = @{
    'AutoMapper|https://github.com/advisories/GHSA-rvv3-g6hj-g44x' =
        'Uncontrolled-recursion DoS; fix (>= 15.1.1) is ABI-incompatible with ABP 9.3.7 (MissingMethodException at runtime). Pinned to 14.0.0. Mitigated: System.Text.Json MaxDepth=64 + recursive AutoMapper profiles capped at .MaxDepth(8). Tracked: ABP 10 upgrade (doc 08 B-6).'
    'Volo.Abp.Account.Web|https://github.com/advisories/GHSA-vfm5-cr22-jg3m' =
        'Open redirect in Account registration returnUrl; no fix in ABP 9.3.x (first fixed 10.0.0-rc.2). Not exploitable: self-registration disabled (IsSelfRegistrationEnabled=false) + AppUrlOptions.RedirectAllowedUrls bounds redirects. Tracked: ABP 10 upgrade (doc 04 §3.2.2).'
}

$unexpected = [System.Collections.Generic.List[object]]::new()
$mitigated = [System.Collections.Generic.List[object]]::new()

foreach ($project in $audit.projects) {
    foreach ($framework in @($project.frameworks)) {
        $packages = @($framework.topLevelPackages) + @($framework.transitivePackages)
        foreach ($package in @($packages | Where-Object { $null -ne $_ })) {
            foreach ($vulnerability in @(
                $package.vulnerabilities | Where-Object { $null -ne $_ }
            )) {
                $key = "$($package.id)|$($vulnerability.advisoryurl)"
                $finding = [pscustomobject]@{
                    Project = $project.path
                    Package = $package.id
                    Version = $package.resolvedVersion
                    Severity = $vulnerability.severity
                    Advisory = $vulnerability.advisoryurl
                    Mitigation = $allowList[$key]
                }

                if ($allowList.ContainsKey($key)) {
                    $mitigated.Add($finding)
                }
                else {
                    $unexpected.Add($finding)
                }
            }
        }
    }
}

if ($mitigated.Count -gt 0) {
    Write-Host 'Explicitly mitigated advisories:'
    $mitigated | Format-Table Package, Version, Severity, Advisory, Mitigation -AutoSize
}

if ($unexpected.Count -gt 0) {
    Write-Error 'Unexpected vulnerable NuGet packages were found.'
    $unexpected | Format-Table Project, Package, Version, Severity, Advisory -AutoSize
    exit 1
}

Write-Host 'NuGet vulnerability gate passed.'
exit 0
