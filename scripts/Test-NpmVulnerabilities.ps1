[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$ErrorActionPreference = 'Continue'
$auditJson = npm audit --omit=dev --json 2>$null
$auditExitCode = $LASTEXITCODE
$ErrorActionPreference = 'Stop'
if ($auditExitCode -notin @(0, 1)) {
    throw "npm audit failed to execute (exit $auditExitCode)."
}

$audit = $auditJson | ConvertFrom-Json
$allowList = @{
    'react-router|https://github.com/advisories/GHSA-qwww-vcr4-c8h2' =
        'FoodSafe is a client-only SPA and does not enable React Router RSC mode or server actions.'
}

$unexpected = [System.Collections.Generic.List[object]]::new()
$mitigated = [System.Collections.Generic.List[object]]::new()

foreach ($property in $audit.vulnerabilities.PSObject.Properties) {
    $packageName = $property.Name
    foreach ($via in @(
        $property.Value.via | Where-Object { $_ -isnot [string] }
    )) {
        $key = "$packageName|$($via.url)"
        $finding = [pscustomobject]@{
            Package = $packageName
            Severity = $via.severity
            Advisory = $via.url
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

if ($mitigated.Count -gt 0) {
    Write-Host 'Explicitly mitigated advisories:'
    $mitigated | Format-Table Package, Severity, Advisory, Mitigation -AutoSize
}

if ($unexpected.Count -gt 0) {
    Write-Error 'Unexpected vulnerable production npm packages were found.'
    $unexpected | Format-Table Package, Severity, Advisory -AutoSize
    exit 1
}

Write-Host 'Production npm vulnerability gate passed.'
exit 0
