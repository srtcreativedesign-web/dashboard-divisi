param([Parameter(Mandatory = $true)][string]$NodePath, [Parameter(Mandatory = $true)][string]$PhpPath)
$ErrorActionPreference = 'Stop'
$runnerPath = Join-Path $PSScriptRoot 'erp-upload-ops.mjs'
if (!(Test-Path -LiteralPath $NodePath -PathType Leaf)) { exit 1 }
if (!(Test-Path -LiteralPath $PhpPath -PathType Leaf)) { exit 1 }
$env:ERP_UPLOAD_PHP_BINARY = $PhpPath
$maintenanceProcess = Start-Process -FilePath $NodePath -ArgumentList @(('"' + $runnerPath + '"'), 'maintain') -WindowStyle Hidden -Wait -PassThru
exit $maintenanceProcess.ExitCode
