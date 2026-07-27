<#
.SYNOPSIS
    Restores a Backup-FoodSafeDatabase.ps1 dump into the running FoodSafe Docker
    Compose stack and verifies the result.

.DESCRIPTION
    Implements the logical-restore half of docs/40-disaster-recovery-guide.md:

        createdb FoodSafe_Restore
        pg_restore --exit-on-error --single-transaction --no-owner --no-privileges
                   --dbname FoodSafe_Restore FoodSafe.dump

    It additionally verifies the archive checksum against manifest.json, then
    after the restore reports the public table count, the EF migration history
    head, key table row counts, and - when the backup's table-rowcounts.csv is
    available - compares every table's row count against the backup inventory
    ("Row counts and critical aggregate samples match the backup inventory").

    THIS SCRIPT CAN DESTROY DATA.
    It refuses to touch a database that already exists unless you pass
    -ConfirmDropDatabase with the exact database name. Restoring over the live
    application database additionally requires -AllowLiveDatabaseOverwrite.
    The default target is a FRESH database, FoodSafe_Restore, because docs/40
    says: "Use a fresh database. Do not overwrite the only copy of a failed
    database."

    PREREQUISITES
      * Docker Desktop running and the FoodSafe stack up (at least the
        `postgres` service; `minio` too when using -RestoreMinio).
      * FoodSafe.BE/.env present (gitignored). Read ONLY for the non-secret
        POSTGRES_DB / POSTGRES_USER names.
      * A run folder produced by scripts/Backup-FoodSafeDatabase.ps1.
      * When restoring over the live database, stop the services that hold
        connections first:
            docker compose --env-file .env stop api
        otherwise DROP DATABASE fails while sessions are open.

    CREDENTIAL HANDLING
      No credential is read, printed or passed by this script. pg_restore, psql
      and mc read them from their own container environment.

    NOT IMPLEMENTED HERE - docs/40 promises these and they remain manual:
      * No decryption step (backups produced by the companion script are not
        encrypted) and no fetch from off-host storage.
      * No point-in-time recovery: without WAL archiving the only recovery point
        is the moment the dump was taken.
      * Does not restore the ASP.NET data-protection key ring or its
        certificate; docs/40 requires those to come from separate protected
        sources.
      * Does not run the functional acceptance checks in docs/40 "Restore
        acceptance checks" (sign-in, scoped reads, cross-scope denial, SMTP
        recovery mail, ingress health). Those are executed against the recovered
        environment after this script finishes.

.PARAMETER DumpPath
    Path to the .dump file to restore. Omit and pass -Latest to use the newest
    run folder under -BackupRoot.

.PARAMETER TargetDatabase
    Database to create and restore into. Default FoodSafe_Restore (a fresh
    database, as docs/40 requires).

.PARAMETER ConfirmDropDatabase
    Safety gate. Must exactly equal -TargetDatabase before an EXISTING database
    is dropped and recreated. Without it the script exits with code 2 and
    changes nothing.

.PARAMETER AllowLiveDatabaseOverwrite
    Second safety gate, required in addition to -ConfirmDropDatabase when the
    target is the live application database from .env (POSTGRES_DB).

.PARAMETER RestoreMinio
    Also mirror the backup's minio\objects folder back into the bucket. Requires
    -ConfirmMinioOverwrite with the exact bucket name. Existing objects with the
    same key are overwritten; objects absent from the backup are NOT deleted.

.EXAMPLE
    # Rehearsal: restore the newest backup into a fresh database.
    .\scripts\Restore-FoodSafeDatabase.ps1 -Latest

.EXAMPLE
    # Real recovery over the live database, after stopping the API.
    .\scripts\Restore-FoodSafeDatabase.ps1 -DumpPath D:\FoodSafeBackups\20260727-232626\FoodSafe-FoodSafe-20260727-232626.dump `
        -TargetDatabase FoodSafe -ConfirmDropDatabase FoodSafe -AllowLiveDatabaseOverwrite

.NOTES
    Exit codes: 0 = restored and verified; 1 = failure; 2 = refused by a safety
    gate (nothing was changed).
#>
[CmdletBinding()]
param(
    [string]$DumpPath,
    [switch]$Latest,
    [string]$BackupRoot = $(if ($env:FOODSAFE_BACKUP_ROOT) { $env:FOODSAFE_BACKUP_ROOT } else { 'D:\FoodSafeBackups' }),
    [string]$TargetDatabase = 'FoodSafe_Restore',
    [string]$ConfirmDropDatabase,
    [switch]$AllowLiveDatabaseOverwrite,
    [string]$ComposeFile,
    [string]$EnvFile,
    [string]$PostgresService = 'postgres',
    [string]$MinioService = 'minio',
    [string]$MinioBucket = 'foodsafe-files',
    [string]$User,
    [string]$RowCountInventory,
    [switch]$SkipInventoryComparison,
    [switch]$RestoreMinio,
    [string]$ConfirmMinioOverwrite
)

$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# Helpers (kept in step with Backup-FoodSafeDatabase.ps1)
# ---------------------------------------------------------------------------

function Write-Step {
    param([string]$Message)
    Write-Host "==> $Message"
}

function Stop-WithError {
    param([string]$Message, [string[]]$Detail, [int]$Code = 1)
    $ErrorActionPreference = 'Continue'
    Write-Error $Message
    if ($Detail) {
        foreach ($line in $Detail) { Write-Host "    $line" }
    }
    exit $Code
}

function Stop-Refused {
    param([string]$Message, [string[]]$Detail)
    $ErrorActionPreference = 'Continue'
    Write-Error "REFUSED: $Message"
    if ($Detail) {
        foreach ($line in $Detail) { Write-Host "    $line" }
    }
    Write-Host '    Nothing was changed.'
    exit 2
}

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

# SQL is base64-encoded so no quoting survives the Windows -> docker -> sh ->
# psql hand-off; the password comes from the container's own environment.
function Invoke-PostgresQuery {
    param(
        [Parameter(Mandatory = $true)][string]$Sql,
        [string]$Separator = '|',
        [Parameter(Mandatory = $true)][string]$TargetDatabase,
        [switch]$AllowFailure
    )

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
        'sh', '-c', $shell, 'foodsafe-restore',
        $script:DatabaseUser, $TargetDatabase, $Separator, $encoded
    )
    if ($result.ExitCode -ne 0 -and -not $AllowFailure) {
        Stop-WithError -Message "PostgreSQL query failed against '$TargetDatabase' (exit $($result.ExitCode))." -Detail $result.Output
    }
    return [pscustomobject]@{
        ExitCode = $result.ExitCode
        Rows     = @($result.Output | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' })
        Output   = $result.Output
    }
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

$liveDatabase = Get-EnvFileValue -Path $script:EnvFilePath -Name 'POSTGRES_DB'
if (-not $liveDatabase) { $liveDatabase = 'FoodSafe' }

if (-not $User) { $User = Get-EnvFileValue -Path $script:EnvFilePath -Name 'POSTGRES_USER' }
if (-not $User) { $User = $env:POSTGRES_USER }
if (-not $User) { $User = 'foodsafe' }
$script:DatabaseUser = $User

# ---------------------------------------------------------------------------
# Resolve the dump to restore
# ---------------------------------------------------------------------------

if (-not $DumpPath -and -not $Latest) {
    Stop-WithError -Message 'Specify -DumpPath <file.dump>, or -Latest to restore the newest backup under -BackupRoot.'
}

if (-not $DumpPath) {
    if (-not (Test-Path -LiteralPath $BackupRoot)) {
        Stop-WithError -Message "Backup root '$BackupRoot' does not exist."
    }
    $candidate = Get-ChildItem -LiteralPath $BackupRoot -Recurse -Filter '*.dump' -File -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if (-not $candidate) {
        Stop-WithError -Message "No .dump file found under '$BackupRoot'. Run scripts\Backup-FoodSafeDatabase.ps1 first."
    }
    $DumpPath = $candidate.FullName
}

if (-not (Test-Path -LiteralPath $DumpPath)) {
    Stop-WithError -Message "Dump file not found: $DumpPath"
}
$dumpItem = Get-Item -LiteralPath $DumpPath
if ($dumpItem.Length -le 0) {
    Stop-WithError -Message "Dump file '$DumpPath' is empty. It is not a usable backup."
}

$startedAt = Get-Date
Write-Step 'FoodSafe restore'
Write-Host "    dump         : $($dumpItem.FullName)"
Write-Host "    size         : $($dumpItem.Length) bytes ($([math]::Round($dumpItem.Length / 1MB, 2)) MB)"
Write-Host "    target db    : $TargetDatabase (user $User, service $PostgresService)"
Write-Host "    live db      : $liveDatabase (from $($script:EnvFilePath))"

# ---------------------------------------------------------------------------
# Integrity: compare against the backup manifest when present
# ---------------------------------------------------------------------------

Write-Step 'Checking archive integrity'
$actualSha = (Get-FileHash -LiteralPath $DumpPath -Algorithm SHA256).Hash
Write-Host "    sha256       : $actualSha"

$runFolder = Split-Path -Parent $dumpItem.FullName
$manifestPath = Join-Path $runFolder 'manifest.json'
$manifest = $null
if (Test-Path -LiteralPath $manifestPath) {
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    $expectedSha = $manifest.database.sha256
    if ($expectedSha -and $expectedSha -ne $actualSha) {
        Stop-WithError -Message "Checksum mismatch. manifest.json records $expectedSha but the file hashes to $actualSha. The backup is corrupt or was modified - do not restore it."
    }
    Write-Host "    manifest     : $($manifest.backupId) (restore point $($manifest.restorePoint), $($manifest.database.publicTableCount) tables / $($manifest.database.totalRows) rows)"
    Write-Host "    migration    : $($manifest.database.latestMigrationId)"
}
else {
    Write-Warning "No manifest.json beside the dump; the checksum could not be compared against a recorded value."
}

if (-not $RowCountInventory) {
    $defaultInventory = Join-Path $runFolder 'table-rowcounts.csv'
    if (Test-Path -LiteralPath $defaultInventory) { $RowCountInventory = $defaultInventory }
}

# ---------------------------------------------------------------------------
# Safety gates
# ---------------------------------------------------------------------------

$running = Invoke-ComposeChecked -Arguments @('ps', '--status', 'running', '--services') `
    -FailureMessage 'Unable to query the Compose stack'
$runningServices = @($running.Output | ForEach-Object { $_.Trim() } | Where-Object { $_ })
if ($runningServices -notcontains $PostgresService) {
    Stop-WithError -Message "Compose service '$PostgresService' is not running. Start the stack first: docker compose --env-file .env up -d" -Detail $runningServices
}

Write-Step 'Evaluating safety gates'
$existsQuery = Invoke-PostgresQuery -TargetDatabase 'postgres' `
    -Sql ("SELECT count(*) FROM pg_database WHERE datname = '" + $TargetDatabase.Replace("'", "''") + "'")
$targetExists = ([int]$existsQuery.Rows[0]) -gt 0

if ($targetExists) {
    Write-Host "    target       : EXISTS - restoring will DROP and recreate it, destroying its current contents."
    if ($ConfirmDropDatabase -cne $TargetDatabase) {
        Stop-Refused -Message "database '$TargetDatabase' already exists and would be destroyed." -Detail @(
            "Re-run with the explicit confirmation gate:",
            "  -ConfirmDropDatabase $TargetDatabase",
            "(the value must match the target database name exactly, case-sensitive)",
            "Or restore into a fresh database instead: -TargetDatabase FoodSafe_Restore"
        )
    }
    if ($TargetDatabase -ceq $liveDatabase -and -not $AllowLiveDatabaseOverwrite) {
        Stop-Refused -Message "'$TargetDatabase' is the LIVE application database from .env." -Detail @(
            "docs/40 requires restoring into a fresh database. If you really intend to overwrite production data, add:",
            "  -AllowLiveDatabaseOverwrite",
            "and stop the services holding connections first: docker compose --env-file .env stop api"
        )
    }
}
else {
    Write-Host "    target       : does not exist - it will be created."
}

if ($RestoreMinio -and $ConfirmMinioOverwrite -cne $MinioBucket) {
    Stop-Refused -Message "-RestoreMinio overwrites objects in bucket '$MinioBucket'." -Detail @(
        "Re-run with: -ConfirmMinioOverwrite $MinioBucket"
    )
}

# ---------------------------------------------------------------------------
# Restore
# ---------------------------------------------------------------------------

$stamp = $startedAt.ToString('yyyyMMdd-HHmmss')
$remoteDir = "/tmp/foodsafe-restore-$stamp"
$remoteDump = "$remoteDir/restore.dump"

Write-Step 'Copying the dump into the postgres container'
Invoke-ComposeChecked -Arguments @('exec', '-T', $PostgresService, 'mkdir', '-p', $remoteDir) `
    -FailureMessage 'Could not create the staging folder in the container' | Out-Null
Invoke-ComposeChecked -Arguments @('cp', $dumpItem.FullName, "$($PostgresService):$remoteDump") `
    -FailureMessage 'Copying the dump into the container failed' | Out-Null

Write-Step 'Validating the archive with pg_restore --list'
$listScript = ConvertTo-ShellOneLiner @'
set -e
test -s "$1"
pg_restore --list "$1" | grep -v '^;' | grep -c . || true
'@
$listResult = Invoke-Compose -Arguments @('exec', '-T', $PostgresService, 'sh', '-c', $listScript, 'foodsafe-restore', $remoteDump)
if ($listResult.ExitCode -ne 0) {
    Invoke-Compose -Arguments @('exec', '-T', $PostgresService, 'rm', '-rf', $remoteDir) | Out-Null
    Stop-WithError -Message 'The staged file is not a readable pg_restore archive.' -Detail $listResult.Output
}
$archiveEntries = [int](@($listResult.Output | ForEach-Object { $_.Trim() } | Where-Object { $_ })[0])
Write-Host "    entries      : $archiveEntries"

if ($targetExists) {
    Write-Step "Dropping and recreating '$TargetDatabase'"
    $terminateSql = "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '" + $TargetDatabase.Replace("'", "''") + "' AND pid <> pg_backend_pid()"
    Invoke-PostgresQuery -TargetDatabase 'postgres' -Sql $terminateSql -AllowFailure | Out-Null

    $dropSql = 'DROP DATABASE IF EXISTS "' + $TargetDatabase.Replace('"', '""') + '"'
    $dropResult = Invoke-PostgresQuery -TargetDatabase 'postgres' -Sql $dropSql -AllowFailure
    if ($dropResult.ExitCode -ne 0) {
        Invoke-Compose -Arguments @('exec', '-T', $PostgresService, 'rm', '-rf', $remoteDir) | Out-Null
        Stop-WithError -Message "DROP DATABASE failed. Stop the services still connected (docker compose --env-file .env stop api) and retry." -Detail $dropResult.Output
    }
}
else {
    Write-Step "Creating '$TargetDatabase'"
}

$createSql = 'CREATE DATABASE "' + $TargetDatabase.Replace('"', '""') + '" OWNER "' + $User.Replace('"', '""') + '" TEMPLATE template0 ENCODING ''UTF8'''
$createResult = Invoke-PostgresQuery -TargetDatabase 'postgres' -Sql $createSql -AllowFailure
if ($createResult.ExitCode -ne 0) {
    Invoke-Compose -Arguments @('exec', '-T', $PostgresService, 'rm', '-rf', $remoteDir) | Out-Null
    Stop-WithError -Message "CREATE DATABASE '$TargetDatabase' failed." -Detail $createResult.Output
}

Write-Step 'Running pg_restore (--exit-on-error --single-transaction)'
$restoreScript = ConvertTo-ShellOneLiner @'
set -e
PGPASSWORD="$POSTGRES_PASSWORD" pg_restore --username "$1" --dbname "$2" --exit-on-error --single-transaction --no-owner --no-privileges "$3"
'@
$restore = Invoke-Compose -Arguments @(
    'exec', '-T', $PostgresService,
    'sh', '-c', $restoreScript, 'foodsafe-restore',
    $User, $TargetDatabase, $remoteDump
)
Invoke-Compose -Arguments @('exec', '-T', $PostgresService, 'rm', '-rf', $remoteDir) | Out-Null

if ($restore.ExitCode -ne 0) {
    Stop-WithError -Message "pg_restore failed (exit $($restore.ExitCode)). The transaction was rolled back; '$TargetDatabase' is empty or partial." -Detail $restore.Output
}

# ---------------------------------------------------------------------------
# Verification
# ---------------------------------------------------------------------------

Write-Step 'Verifying the restored database'
$failures = [System.Collections.Generic.List[string]]::new()

$tableCountQuery = Invoke-PostgresQuery -TargetDatabase $TargetDatabase `
    -Sql "SELECT count(*) FROM pg_tables WHERE schemaname = 'public'"
$restoredTables = [int]$tableCountQuery.Rows[0]
Write-Host "    public tables         : $restoredTables"
if ($restoredTables -le 0) {
    $failures.Add('The restored database contains no tables in schema public.')
}
if ($manifest -and $manifest.database.publicTableCount -and $restoredTables -ne [int]$manifest.database.publicTableCount) {
    $failures.Add("Table count mismatch: backup recorded $($manifest.database.publicTableCount), restored database has $restoredTables.")
}

$migrationHead = Invoke-PostgresQuery -TargetDatabase $TargetDatabase `
    -Sql 'SELECT max("MigrationId"), count(*) FROM "__EFMigrationsHistory"' -Separator '|' -AllowFailure
if ($migrationHead.ExitCode -ne 0 -or $migrationHead.Rows.Count -eq 0) {
    $failures.Add('__EFMigrationsHistory is missing from the restored database.')
}
else {
    $parts = $migrationHead.Rows[0].Split('|')
    Write-Host "    EF migration head     : $($parts[0]) ($($parts[1]) migrations)"
    if ($manifest -and $manifest.database.latestMigrationId -and $manifest.database.latestMigrationId -ne '(unavailable)' -and $parts[0] -ne $manifest.database.latestMigrationId) {
        $failures.Add("EF migration head mismatch: backup recorded $($manifest.database.latestMigrationId), restored database has $($parts[0]).")
    }
}

foreach ($keyTable in @('AbpUsers', 'businesses')) {
    $countQuery = Invoke-PostgresQuery -TargetDatabase $TargetDatabase `
        -Sql ('SELECT count(*) FROM "' + $keyTable + '"') -AllowFailure
    if ($countQuery.ExitCode -ne 0 -or $countQuery.Rows.Count -eq 0) {
        $failures.Add("Key table '$keyTable' is missing or unreadable in the restored database.")
        continue
    }
    $label = "    rows in $keyTable"
    Write-Host ($label.PadRight(26) + ": $($countQuery.Rows[0])")
    if ([int]$countQuery.Rows[0] -le 0) {
        Write-Warning "Key table '$keyTable' restored with 0 rows. Confirm this matches the source."
    }
}

if ($RowCountInventory -and -not $SkipInventoryComparison) {
    if (-not (Test-Path -LiteralPath $RowCountInventory)) {
        $failures.Add("Row-count inventory '$RowCountInventory' was not found.")
    }
    else {
        Write-Step "Comparing every table against the backup inventory"
        $expected = @{}
        foreach ($row in Import-Csv -LiteralPath $RowCountInventory) {
            $expected[$row.table_name] = [int64]$row.row_count
        }

        $rowCountSql = "SELECT t.table_name, (xpath('/row/cnt/text()', query_to_xml(format('select count(*) as cnt from %I.%I', t.table_schema, t.table_name), false, true, '')))[1]::text::bigint FROM information_schema.tables t WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE' ORDER BY 1"
        $actualRows = (Invoke-PostgresQuery -TargetDatabase $TargetDatabase -Sql $rowCountSql -Separator ',').Rows

        $actual = @{}
        foreach ($line in $actualRows) {
            $parts = $line.Split(',')
            if ($parts.Length -ge 2) { $actual[$parts[0].Trim()] = [int64]$parts[1].Trim() }
        }

        $mismatches = [System.Collections.Generic.List[string]]::new()
        foreach ($table in $expected.Keys) {
            if (-not $actual.ContainsKey($table)) {
                $mismatches.Add("$table : missing after restore (expected $($expected[$table]) rows)")
            }
            elseif ($actual[$table] -ne $expected[$table]) {
                $mismatches.Add("$table : expected $($expected[$table]), restored $($actual[$table])")
            }
        }
        foreach ($table in $actual.Keys) {
            if (-not $expected.ContainsKey($table)) {
                $mismatches.Add("$table : present after restore but absent from the backup inventory")
            }
        }

        $expectedTotal = ($expected.Values | Measure-Object -Sum).Sum
        $actualTotal = ($actual.Values | Measure-Object -Sum).Sum
        Write-Host "    inventory compared    : $($expected.Count) tables / $expectedTotal rows expected, $($actual.Count) tables / $actualTotal rows restored"

        if ($mismatches.Count -gt 0) {
            foreach ($mismatch in $mismatches) { Write-Host "      MISMATCH $mismatch" }
            $failures.Add("$($mismatches.Count) table(s) do not match the backup row-count inventory.")
        }
        else {
            Write-Host '    inventory result      : every table matches the backup inventory'
        }
    }
}
elseif (-not $RowCountInventory) {
    Write-Warning 'No table-rowcounts.csv inventory was available, so per-table row counts were not compared.'
}

# ---------------------------------------------------------------------------
# Optional MinIO restore
# ---------------------------------------------------------------------------

if ($RestoreMinio) {
    $objectsRoot = Join-Path $runFolder 'minio\objects'
    if (-not (Test-Path -LiteralPath $objectsRoot)) {
        $failures.Add("-RestoreMinio was requested but '$objectsRoot' does not exist in the backup folder.")
    }
    elseif ($runningServices -notcontains $MinioService) {
        $failures.Add("-RestoreMinio was requested but Compose service '$MinioService' is not running.")
    }
    else {
        Write-Step "Restoring MinIO bucket '$MinioBucket'"
        $remoteObjects = "/tmp/foodsafe-minio-restore-$stamp"
        Invoke-ComposeChecked -Arguments @('exec', '-T', $MinioService, 'rm', '-rf', $remoteObjects) `
            -FailureMessage 'Could not clear the MinIO staging folder' | Out-Null
        Invoke-ComposeChecked -Arguments @('cp', $objectsRoot, "$($MinioService):$remoteObjects") `
            -FailureMessage 'Copying objects into the MinIO container failed' | Out-Null

        $minioScript = ConvertTo-ShellOneLiner @'
set -e
CFG=$(mktemp -d)
trap 'rm -rf "$CFG" "$1"' EXIT INT TERM
mc --config-dir "$CFG" --quiet alias set fsbk "http://127.0.0.1:9000" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" > /dev/null
mc --config-dir "$CFG" --quiet ls "fsbk/$2" > /dev/null 2>&1 || mc --config-dir "$CFG" --quiet mb "fsbk/$2" > /dev/null
mc --config-dir "$CFG" --quiet mirror --overwrite "$1" "fsbk/$2" > /dev/null
mc --config-dir "$CFG" --json ls --recursive "fsbk/$2" | wc -l
'@
        $minio = Invoke-Compose -Arguments @(
            'exec', '-T', $MinioService,
            'sh', '-c', $minioScript, 'foodsafe-restore', $remoteObjects, $MinioBucket
        )
        if ($minio.ExitCode -ne 0) {
            $failures.Add("MinIO restore failed (exit $($minio.ExitCode)): $($minio.Output -join ' ')")
        }
        else {
            $restoredObjects = @($minio.Output | ForEach-Object { $_.Trim() } | Where-Object { $_ })[-1]
            $expectedObjects = 0
            if ($manifest -and $manifest.minio -and $manifest.minio.objectCount) { $expectedObjects = [int]$manifest.minio.objectCount }
            Write-Host "    objects in bucket     : $restoredObjects (backup recorded $expectedObjects)"
            if ($expectedObjects -gt 0 -and [int]$restoredObjects -lt $expectedObjects) {
                $failures.Add("MinIO object count after restore ($restoredObjects) is lower than the backup inventory ($expectedObjects).")
            }
        }
    }
}

# ---------------------------------------------------------------------------
# Result
# ---------------------------------------------------------------------------

$completedAt = Get-Date
$elapsed = $completedAt - $startedAt
$elapsedText = '{0:N1} s' -f $elapsed.TotalSeconds

Write-Host ''
if ($failures.Count -gt 0) {
    Write-Host "Restore verification FAILED after $elapsedText."
    foreach ($failure in $failures) { Write-Host "  - $failure" }
    Write-Host '  Per docs/40, a failed exercise requires a corrective action with an owner and a date.'
    exit 1
}

Write-Host "Restore completed and verified in $elapsedText."
Write-Host "  target db : $TargetDatabase"
Write-Host "  tables    : $restoredTables"
if ($manifest) {
    Write-Host "  from      : backup $($manifest.backupId), restore point $($manifest.restorePoint)"
}
Write-Host "  RTO note  : docs/40 sets RTO < 4 h and RPO < 24 h. This step took $elapsedText; measure the whole recovery, not only this script."
Write-Host ''
Write-Host 'Remaining docs/40 restore acceptance checks are NOT automated here. Still to do manually:'
if ($RestoreMinio) {
    Write-Host '  - compare MinIO object size and sampled SHA-256 checksums against minio-checksums.csv;'
}
else {
    Write-Host '  - restore MinIO objects (re-run with -RestoreMinio -ConfirmMinioOverwrite <bucket>) and compare object count, size and sampled checksums;'
}
Write-Host '  - restore the data-protection key ring and its certificate from their separate protected stores;'
Write-Host '  - start Redis empty, then API and frontend, and confirm health and ingress checks;'
Write-Host '  - verify sign-in, current-user context, a scoped read, and an expected cross-scope denial;'
Write-Host '  - verify password-recovery mail through production SMTP;'
Write-Host '  - record elapsed recovery time and measured data loss against the RTO/RPO targets.'
exit 0
