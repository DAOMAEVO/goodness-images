[CmdletBinding()]
param(
    [string]$ImageName = "gpt-image-playground",
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

$ErrorActionPreference = "Stop"

function Assert-Command {
    param([string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command not found: $Name"
    }
}

function Invoke-Docker {
    param([string[]]$Arguments)

    & docker @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Docker command failed: docker $($Arguments -join ' ')"
    }
}

function Get-SafeFileName {
    param([string]$Value)

    return ($Value -replace '[\\/:*?""<>|]', '-')
}

Assert-Command -Name "docker"

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptRoot
$dockerfile = Join-Path $scriptRoot "Dockerfile"
$bundleDir = if ($OutputDir) { $OutputDir } else { Join-Path $scriptRoot "bundle" }
$imageRef = "{0}:{1}" -f $ImageName, $ImageTag
$bundleName = Get-SafeFileName -Value ("{0}-{1}" -f $ImageName, $ImageTag)
$tarPath = Join-Path $bundleDir "$bundleName.tar"
$shaPath = "$tarPath.sha256"
$zipPath = Join-Path $scriptRoot "$bundleName-bundle.zip"

New-Item -ItemType Directory -Force -Path $bundleDir | Out-Null

$bundleFiles = @(
    "run-on-vps.sh",
    "deploy-gpt-image-playground.sh",
    "docker-compose.vps.yml",
    ".env.vps.example",
    "VPS-DEPLOY.md"
)

foreach ($file in $bundleFiles) {
    Copy-Item -LiteralPath (Join-Path $scriptRoot $file) -Destination (Join-Path $bundleDir $file) -Force
}

$buildArgs = @(
    "buildx",
    "build",
    "--platform", $Platform,
    "--load",
    "-f", $dockerfile,
    "-t", $imageRef,
    "--build-arg", "VITE_SYSTEM_API_URL=$SystemApiUrl",
    "--build-arg", "VITE_SYSTEM_API_KEY=$SystemApiKey",
    "--build-arg", "VITE_SYSTEM_API_MODE=$SystemApiMode",
    "--build-arg", "VITE_SYSTEM_MODEL=$SystemModel",
    "--build-arg", "VITE_SYSTEM_TIMEOUT=$SystemTimeout",
    "--build-arg", "VITE_SYSTEM_CODEX_CLI=$SystemCodexCli",
    $projectRoot
)

Invoke-Docker -Arguments $buildArgs
Invoke-Docker -Arguments @("save", "-o", $tarPath, $imageRef)

$hash = (Get-FileHash -LiteralPath $tarPath -Algorithm SHA256).Hash.ToLowerInvariant()
Set-Content -LiteralPath $shaPath -Value "$hash  $(Split-Path -Leaf $tarPath)" -Encoding utf8

$bundleInfo = @"
image_ref=$imageRef
platform=$Platform
image_tar=$(Split-Path -Leaf $tarPath)
created_at=$(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@
Set-Content -LiteralPath (Join-Path $bundleDir "bundle-info.txt") -Value $bundleInfo -Encoding utf8

if (-not $SkipZip) {
    if (Test-Path $zipPath) {
        Remove-Item -LiteralPath $zipPath -Force
    }

    Compress-Archive -Path (Join-Path $bundleDir "*") -DestinationPath $zipPath -CompressionLevel Optimal
}

Write-Host ""
Write-Host "Bundle ready:"
Write-Host "  Output directory: $bundleDir"
Write-Host "  Image archive:    $tarPath"
Write-Host "  SHA256:           $shaPath"
if (-not $SkipZip) {
    Write-Host "  Zip package:      $zipPath"
}
Write-Host ""
Write-Host "Next:"
Write-Host "  1. Copy the bundle directory or zip package to your VPS."
Write-Host "  2. On the VPS, copy .env.vps.example to .env and adjust values."
Write-Host "  3. Run: chmod +x run-on-vps.sh; ./run-on-vps.sh"
