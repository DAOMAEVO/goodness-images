[CmdletBinding()]
param(
    [string]$ImageName = "goodness-images",
    [string]$ImageTag = "vps",
    [string]$Platform = "linux/amd64",
    [string]$OutputDir = "",
    [string]$SystemApiUrl = "",
    [string]$SystemApiKey = "",
    [string]$SystemApiMode = "",
    [string]$SystemModel = "",
    [string]$SystemTimeout = "",
    [string]$SystemCodexCli = "",
    [switch]$SkipZip
)

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$entry = Join-Path $scriptRoot "package-for-vps.ps1"

& $entry `
    -ImageName $ImageName `
    -ImageTag $ImageTag `
    -Platform $Platform `
    -OutputDir $OutputDir `
    -SystemApiUrl $SystemApiUrl `
    -SystemApiKey $SystemApiKey `
    -SystemApiMode $SystemApiMode `
    -SystemModel $SystemModel `
    -SystemTimeout $SystemTimeout `
    -SystemCodexCli $SystemCodexCli `
    -SkipZip:$SkipZip

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
