[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$auditJson = dotnet list FoodSafe.sln package --vulnerable --include-transitive --format json
if ($LASTEXITCODE -ne 0) {
    throw 'dotnet package vulnerability audit failed to execute.'
}

$audit = $auditJson | ConvertFrom-Json
$allowList = @{
    'Volo.Abp.Account.Web|https://github.com/advisories/GHSA-vfm5-cr22-jg3m' =
        'Self-registration is disabled and both register routes are rejected with 404.'
    'AutoMapper|https://github.com/advisories/GHSA-rvv3-g6hj-g44x' =
        'ABP 9.3 requires AutoMapper 14; JSON depth is bounded and application maps are flat with MaxDepth(8).'
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
