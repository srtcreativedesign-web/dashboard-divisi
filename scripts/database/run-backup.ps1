param([Parameter(Mandatory=$true)][string]$NodePath)
$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $NodePath -PathType Leaf)) { throw 'Node binary unavailable' }
$backupScript = Join-Path $PSScriptRoot 'erp-db-backup.mjs'
if (-not (Test-Path -LiteralPath $backupScript -PathType Leaf)) { throw 'Backup script unavailable' }
$backupProcess = Start-Process -FilePath $NodePath -ArgumentList ('"' + $backupScript + '" backup') -WorkingDirectory (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path -WindowStyle Hidden -Wait -PassThru
exit $backupProcess.ExitCode
