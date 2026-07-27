<#
.SYNOPSIS
    Creates a verified PostgreSQL dump (and a MinIO object mirror) of the running
    FoodSafe Docker Compose stack.

.DESCRIPTION
    Implements the backup half of docs/40-disaster-recovery-guide.md for a
    Compose-hosted deployment:

      * pg_dump in custom format (--format=custom --no-owner --no-privileges),
        executed inside the `postgres` service container so no credential ever
        reaches the host command line;
      * a row-count inventory of every public base table, so a later restore can
        be checked against "row counts match the backup inventory";
      * an `mc mirror` copy of the MinIO bucket plus a JSON object inventory and
        SHA-256 checksums;
      * a manifest.json recording start/end time, source, restore point, object
        count/size, checksum and outcome (docs/40 "Backup controls");
      * verification that the dump is non-empty and is a readable pg_restore
        archive;
      * optional age-based pruning (-RetentionDays).

    PREREQUISITES
      * Docker Desktop running and the FoodSafe stack up:
            cd FoodSafe.BE
            docker compose --env-file .env up -d
      * FoodSafe.BE/.env present (it is gitignored). It is read ONLY for the
        non-secret POSTGRES_DB / POSTGRES_USER names.
      * Free space on the destination drive >= database size + bucket size.
      * Windows PowerShell 5.1 or later.

    CREDENTIAL HANDLING
      This script never reads, prints, or passes POSTGRES_PASSWORD,
      MINIO_ROOT_USER or MINIO_ROOT_PASSWORD. pg_dump and mc read them from the
      environment of their own container, which Compose already populated from
      .env. No secret is written into the backup folder or the process command
      line.

    WHAT THIS SCRIPT DOES *NOT* DO - docs/40 promises these; they remain manual
    or unimplemented and must not be assumed:
      * No encryption at rest and no off-host transfer. The operator must copy
        the run folder to encrypted, access-controlled, off-host storage.
      * No WAL archiving, therefore no point-in-time recovery. This is a logical
        full backup; it meets the documented 24-hour RPO only when scheduled at
        least daily.
      * No backup of the ASP.NET data-protection key ring (Docker volume
        foodsafe_data_protection_keys) or of
        FoodSafe.BE/secrets/foodsafe-data-protection.pfx. docs/40 requires the
        key ring and its certificate to live in SEPARATE protected stores, so
        copying them beside the database dump is deliberately not done here.
      * No backup-freshness alerting (docs/39 requires an alert when the newest
        verified backup is older than 24 hours). Wire this script's exit code
        into the scheduler / monitoring system.
      * Mirroring MinIO to a filesystem does not preserve S3 object metadata or
        versions. Production must use server-side replication or `mc mirror`
        into a versioned MinIO/S3 target, as docs/40 states.

.PARAMETER Destination
    Root folder for backups. Defaults to $env:FOODSAFE_BACKUP_ROOT, otherwise
    D:\FoodSafeBackups (this machine's storage policy prefers the D: drive).
    Every run creates a timestamped sub-folder.

.PARAMETER RetentionDays
    When greater than 0, deletes run folders older than N days after a
    successful backup. docs/40 documents 30-day retention for the daily full
    backup, so scheduled jobs should pass -RetentionDays 30. Default 0 means
    never delete, so an interactive run cannot destroy backup history.

.PARAMETER SkipMinio
    Back up PostgreSQL only. The run folder is then NOT a complete recovery
    point: file attachments are missing.

.EXAMPLE
    .\scripts\Backup-FoodSafeDatabase.ps1

.EXAMPLE
    .\scripts\Backup-FoodSafeDatabase.ps1 -Destination D:\FoodSafeBackups -RetentionDays 30 -Label nightly

.NOTES
    Exit codes: 0 = backup created and verified; 1 = failure.
#>
[CmdletBinding()]
param(
    [string]$Destination = $(if ($env:FOODSAFE_BACKUP_ROOT) { $env:FOODSAFE_BACKUP_ROOT } else { 'D:\FoodSafeBackups' }),
    [string]$ComposeFile,
    [string]$EnvFile,
    [string]$PostgresService = 'postgres',
    [string]$MinioService = 'minio',
    [string]$MinioBucket = 'foodsafe-files',
    [string]$Database,
    [string]$User,
    [string]$Label,
    [int]$RetentionDays = 0,
    [switch]$SkipMinio,
    [switch]$NoMinioChecksums
)

$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

function Write-Step {
    param([string]$Message)
    Write-Host "==> $Message"
}

function Stop-WithError {
    param([string]$Message, [string[]]$Detail)
    $ErrorActionPreference = 'Continue'
    Write-Error $Message
    if ($Detail) {
        foreach ($line in $Detail) { Write-Host "    $line" }
    }
    exit 1
}

# Native calls are wrapped so a non-zero exit code or stderr output never turns
# into an opaque PowerShell exception.
function Invoke-Native {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string[]]$Arguments
    )

    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $output = & $FilePath @Arguments 2>&1 | ForEach-Object { "$_" }
    $code = $LASTEXITCODE
    $ErrorActionPreference = $previous

    return [pscustomobject]@{
        ExitCode = $code
        Output   = @($output)
    }
}

function Invoke-Compose {
    param([Parameter(Mandatory = $true)][string[]]$Arguments)
    $all = @('compose', '--file', $script:ComposeFilePath, '--env-file', $script:EnvFilePath) + $Arguments
    return Invoke-Native -FilePath 'docker' -Arguments $all
}

function Invoke-ComposeChecked {
    param(
        [Parameter(Mandatory = $true)][string[]]$Arguments,
        [Parameter(Mandatory = $true)][string]$FailureMessage
    )
    $result = Invoke-Compose -Arguments $Arguments
    if ($result.ExitCode -ne 0) {
        Stop-WithError -Message "$FailureMessage (docker compose exit $($result.ExitCode))." -Detail $result.Output
    }
    return $result
}

# Windows PowerShell cannot pass multi-line arguments to native executables
# reliably, so container scripts are written readably and flattened to one line.
function ConvertTo-ShellOneLiner {
    param([Parameter(Mandatory = $true)][string]$Script)
    $parts = $Script -split "`n" |
        ForEach-Object { $_.Trim() } |
        Where-Object { $_ -and -not $_.StartsWith('#') }
    return ($parts -join '; ')
}

function Get-EnvFileValue {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Name
    )

    if (-not (Test-Path -LiteralPath $Path)) { return $null }
    foreach ($line in Get-Content -LiteralPath $Path) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith('#')) { continue }
        $index = $trimmed.IndexOf('=')
        if ($index -lt 1) { continue }
        if ($trimmed.Substring(0, $index).Trim() -ne $Name) { continue }
        return $trimmed.Substring($index + 1).Trim().Trim('"').Trim("'")
    }
    return $null
}

# Runs SQL inside the postgres container. The statement is base64-encoded so no
# quoting survives the Windows -> docker -> sh -> psql hand-off, and the
# password is read from the container's own POSTGRES_PASSWORD.
function Invoke-PostgresQuery {
    param(
        [Parameter(Mandatory = $true)][string]$Sql,
        [string]$Separator = '|',
        [string]$TargetDatabase,
        [switch]$AllowFailure
    )

    if (-not $TargetDatabase) { $TargetDatabase = $script:DatabaseName }
    $encoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($Sql))

    $shell = ConvertTo-ShellOneLiner @'
set -e
Q=$(mktemp)
trap 'rm -f "$Q"' EXIT INT TERM
printf '%s' "$4" | base64 -d > "$Q"
PGPASSWORD="$POSTGRES_PASSWORD" psql --username "$1" --dbname "$2" --no-align --tuples-only --quiet --field-separator "$3" --file "$Q"
'@

    $result = Invoke-Compose -Arguments @(
        'exec', '-T', $script:PostgresServiceName,
        'sh', '-c', $shell, 'foodsafe-backup',
        $script:DatabaseUser, $TargetDatabase, $Separator, $encoded
    )
    if ($result.ExitCode -ne 0 -and -not $AllowFailure) {
        Stop-WithError -Message "PostgreSQL query failed (exit $($result.ExitCode))." -Detail $result.Output
    }
    return @($result.Output | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' })
}

# ---------------------------------------------------------------------------
# Resolve configuration
# ---------------------------------------------------------------------------

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = Join-Path $repoRoot 'FoodSafe.BE'

if (-not $ComposeFile) { $ComposeFile = Join-Path $backendRoot 'docker-compose.yml' }
if (-not $EnvFile) { $EnvFile = Join-Path $backendRoot '.env' }

if (-not (Get-Command 'docker' -ErrorAction SilentlyContinue)) {
    Stop-WithError -Message 'docker was not found on PATH. Start Docker Desktop and retry.'
}
if (-not (Test-Path -LiteralPath $ComposeFile)) {
    Stop-WithError -Message "Compose file not found: $ComposeFile"
}
if (-not (Test-Path -LiteralPath $EnvFile)) {
    Stop-WithError -Message "Compose environment file not found: $EnvFile. Copy FoodSafe.BE/.env.example to FoodSafe.BE/.env and fill it in (it is gitignored)."
}

$script:ComposeFilePath = (Resolve-Path -LiteralPath $ComposeFile).Path
$script:EnvFilePath = (Resolve-Path -LiteralPath $EnvFile).Path
$script:PostgresServiceName = $PostgresService

if (-not $Database) { $Database = Get-EnvFileValue -Path $script:EnvFilePath -Name 'POSTGRES_DB' }
if (-not $Database) { $Database = $env:POSTGRES_DB }
if (-not $Database) { $Database = 'FoodSafe' }

if (-not $User) { $User = Get-EnvFileValue -Path $script:EnvFilePath -Name 'POSTGRES_USER' }
if (-not $User) { $User = $env:POSTGRES_USER }
if (-not $User) { $User = 'foodsafe' }

$script:DatabaseName = $Database
$script:DatabaseUser = $User

$startedAt = Get-Date
$stamp = $startedAt.ToString('yyyyMMdd-HHmmss')
if ($Label) {
    $runName = "$stamp-$($Label -replace '[^A-Za-z0-9\-_]', '-')"
}
else {
    $runName = $stamp
}
$runFolder = Join-Path $Destination $runName
$dumpFileName = "FoodSafe-$($Database -replace '[^A-Za-z0-9\-_]', '-')-$stamp.dump"
$dumpPath = Join-Path $runFolder $dumpFileName

Write-Step "FoodSafe backup $runName"
Write-Host "    compose file : $script:ComposeFilePath"
Write-Host "    database     : $Database (user $User, service $PostgresService)"
Write-Host "    destination  : $runFolder"

# ---------------------------------------------------------------------------
# Stack health
# ---------------------------------------------------------------------------

$running = Invoke-ComposeChecked -Arguments @('ps', '--status', 'running', '--services') `
    -FailureMessage 'Unable to query the Compose stack'
$runningServices = @($running.Output | ForEach-Object { $_.Trim() } | Where-Object { $_ })

if ($runningServices -notcontains $PostgresService) {
    Stop-WithError -Message "Compose service '$PostgresService' is not running. Start the stack first: docker compose --env-file .env up -d" -Detail $runningServices
}
if (-not $SkipMinio -and $runningServices -notcontains $MinioService) {
    Stop-WithError -Message "Compose service '$MinioService' is not running. Start the stack, or re-run with -SkipMinio (database only, incomplete recovery point)." -Detail $runningServices
}

try {
    New-Item -ItemType Directory -Path $runFolder -Force | Out-Null
}
catch {
    Stop-WithError -Message "Cannot create destination folder '$runFolder': $($_.Exception.Message)"
}

# ---------------------------------------------------------------------------
# 1. Source metadata and restore point
# ---------------------------------------------------------------------------

Write-Step 'Reading source metadata'
$serverVersion = @(Invoke-PostgresQuery -Sql 'SHOW server_version')[0]
$restorePointUtc = @(Invoke-PostgresQuery -Sql "SELECT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')")[0] + ' UTC'
$tableCount = [int]@(Invoke-PostgresQuery -Sql "SELECT count(*) FROM pg_tables WHERE schemaname = 'public'")[0]

$migrationRows = @(Invoke-PostgresQuery -Sql 'SELECT max("MigrationId") FROM "__EFMigrationsHistory"' -AllowFailure)
if ($migrationRows.Count -gt 0) { $migrationId = $migrationRows[0] } else { $migrationId = '(unavailable)' }

Write-Host "    server       : PostgreSQL $serverVersion"
Write-Host "    restore point: $restorePointUtc"
Write-Host "    public tables: $tableCount"
Write-Host "    migration    : $migrationId"

Write-Step 'Capturing row-count inventory'
$rowCountSql = "SELECT t.table_name, (xpath('/row/cnt/text()', query_to_xml(format('select count(*) as cnt from %I.%I', t.table_schema, t.table_name), false, true, '')))[1]::text::bigint FROM information_schema.tables t WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE' ORDER BY 1"
$rowCounts = @(Invoke-PostgresQuery -Sql $rowCountSql -Separator ',')
if ($rowCounts.Count -eq 0) {
    Stop-WithError -Message "Database '$Database' reports no base tables in schema public. Refusing to record an empty backup as valid."
}
$rowCountPath = Join-Path $runFolder 'table-rowcounts.csv'
Set-Content -LiteralPath $rowCountPath -Value (@('table_name,row_count') + $rowCounts) -Encoding ASCII

$totalRows = [int64]0
foreach ($line in $rowCounts) {
    $parts = $line.Split(',')
    if ($parts.Length -ge 2) { $totalRows += [int64]$parts[1].Trim() }
}
Write-Host "    inventory    : $($rowCounts.Count) tables, $totalRows rows -> table-rowcounts.csv"

# ---------------------------------------------------------------------------
# 2. pg_dump inside the container, verify, copy out
# ---------------------------------------------------------------------------

$remoteDir = "/tmp/foodsafe-backup-$stamp"
$remoteDump = "$remoteDir/$dumpFileName"

Write-Step 'Running pg_dump (custom format)'
$dumpScript = ConvertTo-ShellOneLiner @'
set -e
rm -rf "$1"
mkdir -p "$1"
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump --username "$3" --dbname "$4" --format=custom --no-owner --no-privileges --file "$2"
'@
$dump = Invoke-Compose -Arguments @(
    'exec', '-T', $PostgresService,
    'sh', '-c', $dumpScript, 'foodsafe-backup',
    $remoteDir, $remoteDump, $User, $Database
)
if ($dump.ExitCode -ne 0) {
    Stop-WithError -Message "pg_dump failed (exit $($dump.ExitCode))." -Detail $dump.Output
}

Write-Step 'Verifying the archive is non-empty and readable'
$verifyScript = ConvertTo-ShellOneLiner @'
set -e
test -s "$1"
wc -c < "$1"
pg_restore --list "$1" | grep -v '^;' | grep -c . || true
'@
$verify = Invoke-Compose -Arguments @(
    'exec', '-T', $PostgresService,
    'sh', '-c', $verifyScript, 'foodsafe-backup', $remoteDump
)
if ($verify.ExitCode -ne 0) {
    Stop-WithError -Message 'The dump is empty or is not a readable pg_restore archive.' -Detail $verify.Output
}
$verifyLines = @($verify.Output | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$remoteBytes = [int64]$verifyLines[0]
if ($verifyLines.Count -gt 1) { $tocEntries = [int]$verifyLines[1] } else { $tocEntries = 0 }
if ($remoteBytes -le 0 -or $tocEntries -le 0) {
    Stop-WithError -Message "The dump failed verification (bytes=$remoteBytes, archive entries=$tocEntries)."
}

Write-Step 'Copying the dump to the destination'
Invoke-ComposeChecked -Arguments @('cp', "$($PostgresService):$remoteDump", $dumpPath) `
    -FailureMessage 'Copying the dump out of the container failed' | Out-Null
Invoke-Compose -Arguments @('exec', '-T', $PostgresService, 'rm', '-rf', $remoteDir) | Out-Null

if (-not (Test-Path -LiteralPath $dumpPath)) {
    Stop-WithError -Message "The dump was not written to '$dumpPath'."
}
$dumpItem = Get-Item -LiteralPath $dumpPath
if ($dumpItem.Length -le 0) {
    Stop-WithError -Message "The copied dump '$dumpPath' is empty."
}
if ($dumpItem.Length -ne $remoteBytes) {
    Stop-WithError -Message "Copy size mismatch: the container reported $remoteBytes bytes, the host file has $($dumpItem.Length) bytes."
}

$dumpSha256 = (Get-FileHash -LiteralPath $dumpPath -Algorithm SHA256).Hash
$dumpMb = [math]::Round($dumpItem.Length / 1MB, 2)
Write-Host "    dump         : $dumpFileName"
Write-Host "    size         : $($dumpItem.Length) bytes ($dumpMb MB), $tocEntries archive entries"
Write-Host "    sha256       : $dumpSha256"

# ---------------------------------------------------------------------------
# 3. MinIO bucket mirror and object inventory
# ---------------------------------------------------------------------------

$minioSummary = [ordered]@{
    included    = $false
    bucket      = $MinioBucket
    objectCount = 0
    totalBytes  = 0
    folder      = $null
    note        = 'Skipped (-SkipMinio). This run is NOT a complete recovery point: file attachments are missing.'
}

if (-not $SkipMinio) {
    Write-Step "Mirroring MinIO bucket '$MinioBucket'"
    $remoteMinioDir = "/tmp/foodsafe-minio-$stamp"

    # mc uses a throwaway config dir so the alias (which holds the root
    # credentials) never persists in the container filesystem.
    $minioScript = ConvertTo-ShellOneLiner @'
set -e
CFG=$(mktemp -d)
trap 'rm -rf "$CFG"' EXIT INT TERM
mc --config-dir "$CFG" --quiet alias set fsbk "http://127.0.0.1:9000" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" > /dev/null
if ! mc --config-dir "$CFG" --quiet ls "fsbk/$2" > /dev/null 2>&1; then echo BUCKET_MISSING; exit 3; fi
rm -rf "$1"
mkdir -p "$1/objects"
mc --config-dir "$CFG" --quiet mirror "fsbk/$2" "$1/objects" > /dev/null
mc --config-dir "$CFG" --json ls --recursive "fsbk/$2" > "$1/minio-inventory.jsonl"
'@
    $minio = Invoke-Compose -Arguments @(
        'exec', '-T', $MinioService,
        'sh', '-c', $minioScript, 'foodsafe-backup', $remoteMinioDir, $MinioBucket
    )
    if ($minio.ExitCode -eq 3) {
        Stop-WithError -Message "MinIO bucket '$MinioBucket' does not exist. Check -MinioBucket, or start the API once so it creates the bucket." -Detail $minio.Output
    }
    if ($minio.ExitCode -ne 0) {
        Stop-WithError -Message "MinIO mirror failed (exit $($minio.ExitCode))." -Detail $minio.Output
    }

    $localMinioDir = Join-Path $runFolder 'minio'
    Invoke-ComposeChecked -Arguments @('cp', "$($MinioService):$remoteMinioDir", $localMinioDir) `
        -FailureMessage 'Copying the MinIO mirror out of the container failed' | Out-Null
    Invoke-Compose -Arguments @('exec', '-T', $MinioService, 'rm', '-rf', $remoteMinioDir) | Out-Null

    $inventoryPath = Join-Path $localMinioDir 'minio-inventory.jsonl'
    $objectCount = 0
    $objectBytes = [int64]0
    if (Test-Path -LiteralPath $inventoryPath) {
        foreach ($line in Get-Content -LiteralPath $inventoryPath) {
            if (-not $line.Trim()) { continue }
            $entry = $line | ConvertFrom-Json
            if ($entry.PSObject.Properties.Name -contains 'size') {
                $objectCount++
                $objectBytes += [int64]$entry.size
            }
        }
    }

    $objectsRoot = Join-Path $localMinioDir 'objects'
    $mirroredFiles = @()
    if (Test-Path -LiteralPath $objectsRoot) {
        $mirroredFiles = @(Get-ChildItem -LiteralPath $objectsRoot -Recurse -File)
    }
    if ($mirroredFiles.Count -ne $objectCount) {
        Write-Warning "MinIO inventory lists $objectCount object(s) but $($mirroredFiles.Count) file(s) were mirrored. Investigate before trusting this recovery point."
    }

    if (-not $NoMinioChecksums -and $mirroredFiles.Count -gt 0) {
        Write-Step "Checksumming $($mirroredFiles.Count) mirrored object(s)"
        $checksumLines = @('relative_path,size_bytes,sha256')
        foreach ($file in $mirroredFiles) {
            $relative = $file.FullName.Substring($objectsRoot.Length).TrimStart('\', '/')
            $hash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
            $checksumLines += ('"{0}",{1},{2}' -f $relative.Replace('"', '""'), $file.Length, $hash)
        }
        Set-Content -LiteralPath (Join-Path $localMinioDir 'minio-checksums.csv') -Value $checksumLines -Encoding ASCII
    }

    $minioSummary.included = $true
    $minioSummary.objectCount = $objectCount
    $minioSummary.totalBytes = $objectBytes
    $minioSummary.folder = 'minio\objects'
    $minioSummary.note = 'Filesystem mirror. S3 object metadata and versions are NOT preserved; production must use server-side replication or mc mirror into a versioned target.'

    Write-Host "    objects      : $objectCount ($([math]::Round($objectBytes / 1MB, 2)) MB)"
}
else {
    Write-Warning 'MinIO was skipped. File attachments are NOT in this backup.'
}

# ---------------------------------------------------------------------------
# 4. Manifest
# ---------------------------------------------------------------------------

$completedAt = Get-Date
$manifest = [ordered]@{
    schemaVersion    = 1
    backupId         = $runName
    outcome          = 'Success'
    startedAtLocal   = $startedAt.ToString('o')
    completedAtLocal = $completedAt.ToString('o')
    durationSeconds  = [math]::Round(($completedAt - $startedAt).TotalSeconds, 1)
    restorePoint     = $restorePointUtc
    source           = [ordered]@{
        composeFile     = $script:ComposeFilePath
        postgresService = $PostgresService
        minioService    = $MinioService
        database        = $Database
        databaseUser    = $User
        postgresVersion = $serverVersion
        machine         = $env:COMPUTERNAME
    }
    database         = [ordered]@{
        dumpFile          = $dumpFileName
        format            = 'custom (pg_dump --format=custom --no-owner --no-privileges)'
        sizeBytes         = $dumpItem.Length
        sha256            = $dumpSha256
        archiveEntries    = $tocEntries
        publicTableCount  = $tableCount
        totalRows         = $totalRows
        latestMigrationId = $migrationId
        rowCountInventory = 'table-rowcounts.csv'
    }
    minio            = $minioSummary
    encryptedAtRest  = $false
    offHostCopy      = $false
    operatorActions  = @(
        'Copy this folder to encrypted, access-controlled, off-host storage (docs/40 Backup controls).',
        'Back up the ASP.NET data-protection key ring and its certificate to a SEPARATE protected store.',
        'Record this backup ID in the deployment / change log.',
        'Rehearse a restore with scripts/Restore-FoodSafeDatabase.ps1 - a copied file is not a valid backup until an isolated restore verifies it.'
    )
}

$manifestPath = Join-Path $runFolder 'manifest.json'
$manifestJson = $manifest | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText($manifestPath, $manifestJson, (New-Object System.Text.UTF8Encoding($false)))

# ---------------------------------------------------------------------------
# 5. Retention
# ---------------------------------------------------------------------------

if ($RetentionDays -gt 0) {
    Write-Step "Pruning run folders older than $RetentionDays day(s)"
    $cutoff = (Get-Date).AddDays(-$RetentionDays)
    $removed = 0
    foreach ($folder in @(Get-ChildItem -LiteralPath $Destination -Directory -ErrorAction SilentlyContinue)) {
        if ($folder.FullName -eq $runFolder) { continue }
        if ($folder.Name -notmatch '^\d{8}-\d{6}') { continue }
        $folderStamp = [datetime]::MinValue
        $parsed = [datetime]::TryParseExact(
            $folder.Name.Substring(0, 15), 'yyyyMMdd-HHmmss',
            [System.Globalization.CultureInfo]::InvariantCulture,
            [System.Globalization.DateTimeStyles]::None, [ref]$folderStamp)
        if (-not $parsed) { continue }
        if ($folderStamp -lt $cutoff) {
            Remove-Item -LiteralPath $folder.FullName -Recurse -Force
            Write-Host "    removed      : $($folder.Name)"
            $removed++
        }
    }
    Write-Host "    pruned       : $removed folder(s)"
}
else {
    Write-Host '    retention    : disabled (-RetentionDays 0). docs/40 documents 30-day retention for scheduled runs.'
}

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

$elapsed = [math]::Round(($completedAt - $startedAt).TotalSeconds, 1)
Write-Host ''
Write-Host "Backup completed in $elapsed s."
Write-Host "  folder    : $runFolder"
Write-Host "  dump      : $dumpFileName ($dumpMb MB, sha256 $($dumpSha256.Substring(0, 16))...)"
Write-Host "  inventory : $($rowCounts.Count) tables / $totalRows rows"
if ($minioSummary.included) {
    Write-Host "  minio     : $($minioSummary.objectCount) object(s)"
}
Write-Host '  reminder  : this copy is NOT encrypted and NOT off-host. Transfer it per docs/40-disaster-recovery-guide.md.'
exit 0
