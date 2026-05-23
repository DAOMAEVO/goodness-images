import { spawnSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDir, '..')
const galleryPath = path.join(projectRoot, 'public', 'prompt-gallery', 'index.json')
const publicRoot = path.join(projectRoot, 'public')
const thumbnailRoot = path.join(publicRoot, 'prompt-gallery', '_thumbs')
const tempRoot = path.join(projectRoot, 'node_modules', '.tmp', 'prompt-gallery-thumbs')
const imageExtensions = new Set(['.jpg', '.jpeg', '.png'])
const maxEdge = 640
const jpegQuality = 82

async function main() {
  const gallery = JSON.parse(await fs.readFile(galleryPath, 'utf8'))
  const examples = Array.isArray(gallery.examples) ? gallery.examples : []
  const jobs = await createThumbnailJobs(examples)

  if (!jobs.length) {
    console.log('No local prompt gallery cover images found.')
    return
  }

  await fs.mkdir(tempRoot, { recursive: true })
  const jobsPath = path.join(tempRoot, 'jobs.json')
  const resultPath = path.join(tempRoot, 'results.json')
  const workerPath = path.join(tempRoot, 'generate-thumbnails.ps1')

  await fs.writeFile(jobsPath, `${JSON.stringify(jobs, null, 2)}\n`, 'utf8')
  await fs.writeFile(workerPath, createPowerShellWorker(), 'utf8')

  runPowerShell(workerPath, jobsPath, resultPath)

  const results = JSON.parse(stripBom(await fs.readFile(resultPath, 'utf8')))
  const failed = results.filter((result) => !result.ok)
  if (failed.length) {
    throw new Error(`Thumbnail generation failed for ${failed.length} image(s): ${failed[0].error}`)
  }

  const thumbnailById = new Map(jobs.map((job) => [job.id, normalizePath(path.relative(publicRoot, job.dst))]))
  for (const example of examples) {
    const thumbnailPath = thumbnailById.get(example.id)
    if (thumbnailPath) {
      example.thumbnailPath = thumbnailPath
    }
  }

  gallery.generatedAt = new Date().toISOString()
  gallery.total = examples.length
  await fs.writeFile(galleryPath, `${JSON.stringify(gallery, null, 2)}\n`, 'utf8')

  const totalOriginalBytes = jobs.reduce((sum, job) => sum + job.sourceBytes, 0)
  const totalThumbnailBytes = await sumFileBytes(jobs.map((job) => job.dst))

  console.log(
    JSON.stringify(
      {
        thumbnails: jobs.length,
        originalMB: toMB(totalOriginalBytes),
        thumbnailMB: toMB(totalThumbnailBytes),
        savedMB: toMB(totalOriginalBytes - totalThumbnailBytes),
      },
      null,
      2,
    ),
  )
}

async function createThumbnailJobs(examples) {
  const jobs = []
  const seenTargets = new Set()

  for (const example of examples) {
    const imagePath = firstLocalImagePath(example)
    if (!imagePath) continue

    const sourcePath = path.join(publicRoot, imagePath)
    const sourceStat = await tryStat(sourcePath)
    if (!sourceStat?.isFile()) continue

    const targetPath = createThumbnailPath(imagePath)
    if (seenTargets.has(targetPath)) continue
    seenTargets.add(targetPath)

    jobs.push({
      id: example.id,
      src: sourcePath,
      dst: targetPath,
      sourceBytes: sourceStat.size,
    })
  }

  return jobs
}

function firstLocalImagePath(example) {
  const imagePath = Array.isArray(example.imagePaths) ? example.imagePaths[0] : ''
  if (!imagePath) return ''

  const normalized = normalizePath(imagePath).replace(/^\/+/, '')
  const extension = path.extname(normalized).toLowerCase()
  if (!imageExtensions.has(extension)) return ''

  return normalized
}

function createThumbnailPath(imagePath) {
  const relativeImagePath = normalizePath(imagePath).replace(/^prompt-gallery\//, '')
  const parsed = path.posix.parse(relativeImagePath)
  const thumbnailRelativePath = path.posix.join(
    'prompt-gallery',
    '_thumbs',
    parsed.dir,
    `${parsed.name}.jpg`,
  )

  return path.join(publicRoot, thumbnailRelativePath)
}

function runPowerShell(workerPath, jobsPath, resultPath) {
  const args = [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    workerPath,
    '-JobsPath',
    jobsPath,
    '-ResultPath',
    resultPath,
    '-MaxEdge',
    String(maxEdge),
    '-Quality',
    String(jpegQuality),
  ]
  const result = spawnSync('powershell', args, {
    cwd: projectRoot,
    encoding: 'utf8',
  })

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'PowerShell thumbnail worker failed')
  }
}

function createPowerShellWorker() {
  return String.raw`param(
  [Parameter(Mandatory=$true)][string]$JobsPath,
  [Parameter(Mandatory=$true)][string]$ResultPath,
  [int]$MaxEdge = 640,
  [int]$Quality = 82
)

Add-Type -AssemblyName System.Drawing

$jobs = Get-Content -Raw -Encoding UTF8 -LiteralPath $JobsPath | ConvertFrom-Json
$results = New-Object System.Collections.Generic.List[object]
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' } | Select-Object -First 1

foreach ($job in $jobs) {
  try {
    $targetDir = [System.IO.Path]::GetDirectoryName($job.dst)
    [System.IO.Directory]::CreateDirectory($targetDir) | Out-Null

    $image = [System.Drawing.Image]::FromFile($job.src)
    try {
      $scale = [Math]::Min($MaxEdge / $image.Width, $MaxEdge / $image.Height)
      if ($scale -gt 1) { $scale = 1 }
      $width = [Math]::Max(1, [int]($image.Width * $scale))
      $height = [Math]::Max(1, [int]($image.Height * $scale))
      $bitmap = New-Object System.Drawing.Bitmap($width, $height)
      try {
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        try {
          $graphics.Clear([System.Drawing.Color]::FromArgb(12, 12, 18))
          $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
          $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
          $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
          $graphics.DrawImage($image, 0, 0, $width, $height)
        } finally {
          $graphics.Dispose()
        }

        $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
        $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [int64]$Quality)
        $bitmap.Save($job.dst, $jpegCodec, $encoderParams)
      } finally {
        $bitmap.Dispose()
      }
    } finally {
      $image.Dispose()
    }

    $results.Add([pscustomobject]@{ id = $job.id; dst = $job.dst; ok = $true; error = '' }) | Out-Null
  } catch {
    $results.Add([pscustomobject]@{ id = $job.id; dst = $job.dst; ok = $false; error = $_.Exception.Message }) | Out-Null
  }
}

$json = $results | ConvertTo-Json -Depth 4
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($ResultPath, $json, $utf8NoBom)
`
}

async function tryStat(filePath) {
  try {
    return await fs.stat(filePath)
  } catch {
    return null
  }
}

async function sumFileBytes(filePaths) {
  let total = 0
  for (const filePath of filePaths) {
    const stat = await tryStat(filePath)
    total += stat?.size ?? 0
  }
  return total
}

function normalizePath(value) {
  return String(value).replaceAll('\\', '/')
}

function stripBom(value) {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value
}

function toMB(bytes) {
  return Number((bytes / 1024 / 1024).toFixed(2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
