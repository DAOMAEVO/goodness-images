import { constants as fsConstants } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'

const projectRoot = process.cwd()
const sourceRoot = path.join(projectRoot, 'docs', 'awesome-gpt-image-2-prompts-main')
const recordsPath = path.join(sourceRoot, 'data', 'ingested_tweets.json')
const promptTranslationsPath = path.join(sourceRoot, 'data', 'prompt_zh_translations.json')
const outputRoot = path.join(projectRoot, 'public', 'prompt-gallery')
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])
const categoryOrder = [
  '电商',
  '广告创意',
  '人像与摄影',
  '海报与插画',
  '角色设计',
  'UI 与社交媒体',
  '模型对比与社区',
]
const categoryLabelMap = {
  'E-commerce Cases': '电商',
  'Ad Creative Cases': '广告创意',
  'Portrait & Photography Cases': '人像与摄影',
  'Poster & Illustration Cases': '海报与插画',
  'Character Design Cases': '角色设计',
  'UI & Social Media Mockup Cases': 'UI 与社交媒体',
  'Comparison & Community Examples': '模型对比与社区',
}

async function main() {
  await ensurePathExists(sourceRoot, 'Prompt source directory')
  const source = JSON.parse(await fs.readFile(recordsPath, 'utf8'))
  const records = Array.isArray(source.records) ? source.records : []
  const readmeCache = new Map()
  const categoryByAnchor = extractMenuCategoryMap(await readReadme(readmeCache, 'README.md'))
  const zhReadme = await readReadme(readmeCache, 'README_zh-CN.md')
  const zhCategoryByImageDir = extractImageDirCategoryMap(zhReadme)
  const zhCaseMeta = extractZhCaseMeta(zhReadme)
  const promptTranslationCache = await readPromptTranslationCache()

  await resetOutputDirectory()

  const examples = []
  const usedExampleIds = new Set()
  for (const record of records) {
    const readmeFile = record.readme_file || 'README.md'
    const readme = await readReadme(readmeCache, readmeFile)
    const sectionLookup = getSectionLookup(readmeCache, readmeFile, readme, 'source')
    const zhSectionLookup = getSectionLookup(readmeCache, 'README_zh-CN.md', zhReadme, 'localized')
    const sectionMeta = resolveSectionMeta(record, '', sectionLookup)
    const imageDir = resolveImageDir(record) || sectionMeta?.primaryImageDir || ''
    const section = resolveSectionMeta(record, imageDir, sectionLookup)
    const zhSection = resolveSectionMeta(record, imageDir, zhSectionLookup)
    const images = imageDir ? await copyExampleImages(imageDir) : []
    const promptText = resolvePromptText(record)
    const promptsOriginal = section?.prompts?.length ? section.prompts : promptText ? [promptText] : []
    const promptOriginal = promptsOriginal[0] ?? ''
    const promptTranslationKey = createPromptTranslationKey({
      sourceUrl: record.tweet_url || '',
      imageDir,
      titleEn: resolveEnglishTitle(record),
      id: createExampleId(record, imageDir),
    })
    const promptsZhFromReadme = extractLocalizedPrompts(zhSection?.prompts ?? [], promptsOriginal)
    const cachedPromptZh = resolveCachedPromptZh(promptTranslationCache, promptTranslationKey, promptOriginal)
    const promptsZh = promptsZhFromReadme.length
      ? promptsZhFromReadme
      : cachedPromptZh
        ? [cachedPromptZh]
        : []
    const promptZh = promptsZh[0] ?? null
    const localizedCase = resolveZhCase(record, imageDir, zhCaseMeta)
    const remoteImageUrls = Array.isArray(record.media_urls)
      ? record.media_urls.filter((url) => typeof url === 'string' && url)
      : []

    const id = createUniqueExampleId(createExampleId(record, imageDir), usedExampleIds)

    examples.push({
      id,
      titleZh: localizedCase?.title || '',
      titleEn: resolveEnglishTitle(record),
      category: resolveCategory(record, imageDir, zhCategoryByImageDir, categoryByAnchor),
      author: localizedCase?.author || record.author_handle || '',
      sourceUrl: localizedCase?.sourceUrl || record.tweet_url || '',
      caseAnchor: record.case_anchor || '',
      imageDir,
      imagePaths: images,
      remoteImageUrls,
      promptOriginal,
      promptZh,
      promptsOriginal,
      promptsZh,
      requiresReference: detectRequiresReference(promptOriginal),
      arguments: extractArguments(promptOriginal),
      addedAt: record.added_at || null,
    })
  }

  const categories = Array.from(new Set(examples.map((example) => example.category))).sort(
    (left, right) => categoryRank(left) - categoryRank(right) || left.localeCompare(right),
  )

  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceRepo: source.repo || 'awesome-gpt-image-2-prompts',
    total: examples.length,
    categories,
    examples,
  }

  await fs.writeFile(
    path.join(outputRoot, 'index.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  )

  console.log(`Prompt gallery built: ${examples.length} examples, ${categories.length} categories`)
}

async function ensurePathExists(targetPath, label) {
  try {
    await fs.access(targetPath, fsConstants.R_OK)
  } catch {
    throw new Error(`${label} not found: ${targetPath}`)
  }
}

async function resetOutputDirectory() {
  await fs.rm(outputRoot, { recursive: true, force: true })
  await fs.mkdir(outputRoot, { recursive: true })
}

async function readReadme(cache, readmeFile) {
  if (!cache.has(readmeFile)) {
    cache.set(readmeFile, await fs.readFile(path.join(sourceRoot, readmeFile), 'utf8'))
  }
  return cache.get(readmeFile)
}

async function readPromptTranslationCache() {
  try {
    const raw = await fs.readFile(promptTranslationsPath, 'utf8')
    const parsed = JSON.parse(raw)
    const entries = Array.isArray(parsed?.entries) ? parsed.entries : []
    return new Map(
      entries
        .filter((entry) => entry && typeof entry.key === 'string')
        .map((entry) => [entry.key, entry]),
    )
  } catch {
    return new Map()
  }
}

function getSectionLookup(cache, readmeFile, readme, mode = 'source') {
  const key = `${readmeFile}:sections:${mode}`
  if (cache.has(key)) return cache.get(key)

  const byImageDir = new Map()
  const bySourceUrl = new Map()
  const byCaseAnchor = new Map()
  const urlCounts = new Map()
  for (const section of splitCaseSections(readme)) {
    const meta = extractSectionMeta(section)
    if (!meta) continue

    if (meta.sourceUrl) {
      urlCounts.set(meta.sourceUrl, (urlCounts.get(meta.sourceUrl) || 0) + 1)
    }

    if (meta.sourceUrl && !bySourceUrl.has(meta.sourceUrl)) {
      bySourceUrl.set(meta.sourceUrl, meta)
    }

    if (meta.caseAnchor && !byCaseAnchor.has(meta.caseAnchor)) {
      byCaseAnchor.set(meta.caseAnchor, meta)
    }

    const { imageDirs, prompts } = meta
    for (const imageDir of imageDirs) {
      if (!byImageDir.has(imageDir) || shouldReplaceSection(byImageDir.get(imageDir), meta, imageDir, mode)) {
        byImageDir.set(imageDir, meta)
      }
    }
  }

  const lookup = { byImageDir, bySourceUrl, byCaseAnchor, urlCounts }
  cache.set(key, lookup)
  return lookup
}

function splitCaseSections(readme) {
  const starts = []
  const regex = /^<!-- Case .*? -->/gm
  let match = regex.exec(readme)
  while (match) {
    starts.push(match.index)
    match = regex.exec(readme)
  }

  return starts.map((start, index) => {
    const end = starts[index + 1] ?? readme.length
    return readme.slice(start, end)
  })
}

function extractImageDirs(section) {
  const imageDirs = new Set()
  const regex = /src=["'](?:\.\/)?(images\/[^"']+)["']/g
  let match = regex.exec(section)
  while (match) {
    imageDirs.add(normalizePath(path.posix.dirname(match[1])))
    match = regex.exec(section)
  }
  return Array.from(imageDirs)
}

function extractPromptBlocks(section) {
  const prompts = []
  const regex = /\*+\s*(?:Prompt|提示词)\s*[:：]\s*\*+\s*```[^\n`]*\n([\s\S]*?)```/gi
  let match = regex.exec(section)
  while (match) {
    const prompt = match[1].trim()
    if (prompt) prompts.push(prompt)
    match = regex.exec(section)
  }
  return prompts
}

function extractSectionMeta(section) {
  const imageDirs = extractImageDirs(section)
  const prompts = extractPromptBlocks(section)
  const titleMatch = section.match(/^###\s+Case\s+(\d+):\s+\[(.+?)\]\((https?:\/\/[^)]+)\)/m)
  const commentMatch = section.match(/^<!--\s*(Case\s+.+?)\s*-->$/m)
  const caseAnchorMatch = section.match(/^\s*-\s*\[[^\]]+\]\((#[^)]+)\)\s*$/m)

  return {
    caseNumber: titleMatch ? Number(titleMatch[1]) : null,
    title: titleMatch?.[2]?.trim() || '',
    sourceUrl: titleMatch?.[3] || '',
    caseAnchor: caseAnchorMatch?.[1] || '',
    comment: commentMatch?.[1] || '',
    imageDirs,
    primaryImageDir: imageDirs[0] || '',
    prompts,
  }
}

async function copyExampleImages(imageDir) {
  const sourceDir = path.join(sourceRoot, imageDir)
  try {
    await fs.access(sourceDir, fsConstants.R_OK)
  } catch {
    return []
  }

  const files = await fs.readdir(sourceDir, { withFileTypes: true })
  const outputPaths = []
  for (const file of files) {
    if (!file.isFile()) continue
    const ext = path.extname(file.name).toLowerCase()
    if (!imageExtensions.has(ext)) continue

    const relativeDir = normalizePath(imageDir).replace(/^images\//, '')
    const destDir = path.join(outputRoot, relativeDir)
    await fs.mkdir(destDir, { recursive: true })
    await fs.copyFile(path.join(sourceDir, file.name), path.join(destDir, file.name))
    outputPaths.push(normalizePath(path.posix.join('prompt-gallery', relativeDir, file.name)))
  }

  return outputPaths.sort()
}

function createExampleId(record, imageDir) {
  const seed = record.case_anchor || imageDir || record.tweet_url || record.title || String(Date.now())
  return seed.replace(/^#/, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
}

function createUniqueExampleId(baseId, usedIds) {
  const fallbackId = 'prompt-gallery-example'
  const normalizedBase = baseId || fallbackId
  let id = normalizedBase
  let suffix = 2

  while (usedIds.has(id)) {
    id = `${normalizedBase}-${suffix}`
    suffix += 1
  }

  usedIds.add(id)
  return id
}

function detectRequiresReference(prompt) {
  return /uploaded image|reference image|use the uploaded|input image|参考图|上传/i.test(prompt)
}

function extractArguments(prompt) {
  const args = []
  const regex = /\{argument\s+name="([^"]+)"\s+default="([^"]*)"\}/g
  let match = regex.exec(prompt)
  while (match) {
    args.push({ name: match[1], defaultValue: match[2] })
    match = regex.exec(prompt)
  }
  return args
}

function normalizePath(value) {
  return String(value).replaceAll('\\', '/')
}

function resolveImageDir(record) {
  if (typeof record.image_dir === 'string' && record.image_dir.trim()) {
    return normalizePath(record.image_dir.trim())
  }

  if (typeof record.image_path === 'string' && record.image_path.trim()) {
    return normalizePath(path.posix.dirname(record.image_path.trim()))
  }

  if (typeof record.folder_name === 'string' && record.folder_name.trim()) {
    return normalizePath(path.posix.join('images', record.folder_name.trim()))
  }

  return ''
}

function resolveSectionMeta(record, imageDir, sectionLookup) {
  const sourceUrl = typeof record.tweet_url === 'string' ? record.tweet_url.trim() : ''
  const caseAnchor = typeof record.case_anchor === 'string' ? record.case_anchor.trim() : ''
  const urlCount = sourceUrl ? sectionLookup.urlCounts.get(sourceUrl) || 0 : 0
  const sourceMeta = sourceUrl && sectionLookup.bySourceUrl.has(sourceUrl)
    ? sectionLookup.bySourceUrl.get(sourceUrl)
    : null

  if (sourceMeta && (!imageDir || sourceMeta.primaryImageDir === imageDir || urlCount === 1)) {
    return sourceMeta
  }

  if (imageDir && sectionLookup.byImageDir.has(imageDir)) {
    return sectionLookup.byImageDir.get(imageDir)
  }

  if (sourceMeta) {
    return sourceMeta
  }

  if (caseAnchor && sectionLookup.byCaseAnchor.has(caseAnchor)) {
    return sectionLookup.byCaseAnchor.get(caseAnchor)
  }

  return null
}

function createPromptTranslationKey({ sourceUrl, imageDir, titleEn, id }) {
  return String(sourceUrl || imageDir || titleEn || id || '').trim()
}

function resolveCachedPromptZh(cache, key, promptOriginal) {
  if (!key || !promptOriginal) return null
  const entry = cache.get(key)
  if (!entry) return null
  if (normalizePrompt(entry.promptOriginal) !== normalizePrompt(promptOriginal)) return null
  if (typeof entry.promptZh !== 'string' || !entry.promptZh.trim()) return null
  return entry.promptZh.trim()
}

function resolveEnglishTitle(record) {
  if (typeof record.suggested_title === 'string' && record.suggested_title.trim()) {
    return record.suggested_title.trim()
  }

  if (typeof record.title === 'string' && record.title.trim()) {
    return record.title.trim()
  }

  return ''
}

function resolvePromptText(record) {
  if (typeof record.prompt_text === 'string' && record.prompt_text.trim()) {
    return record.prompt_text.trim()
  }

  if (typeof record.title === 'string' && record.title.trim() && isPromptStoredInTitle(record)) {
    return record.title.trim()
  }

  return ''
}

function isPromptStoredInTitle(record) {
  return Boolean(
    typeof record.suggested_title === 'string' &&
      record.suggested_title.trim() &&
      typeof record.prompt_text !== 'string',
  )
}

function shouldReplaceSection(currentSection, nextSection, imageDir, mode) {
  if (!currentSection) return true
  if (mode !== 'localized') return false

  const currentScore = scoreLocalizedSection(currentSection, imageDir)
  const nextScore = scoreLocalizedSection(nextSection, imageDir)

  return nextScore >= currentScore
}

function scoreLocalizedSection(section, imageDir) {
  const imageCaseNumber = extractCaseNumber(imageDir)
  const sectionCaseNumber = Number.isFinite(section?.caseNumber) ? section.caseNumber : null
  const caseNumberScore =
    imageCaseNumber != null && sectionCaseNumber != null && imageCaseNumber === sectionCaseNumber
      ? 10
      : 0

  return caseNumberScore + scoreLocalizedPrompts(section?.prompts ?? [])
}

function scoreLocalizedPrompts(prompts) {
  if (!prompts.length) return 0
  if (prompts.some((prompt) => containsCjk(prompt))) return 2
  return 1
}

function extractLocalizedPrompts(prompts, promptsOriginal) {
  const sourceSet = new Set(promptsOriginal.map((prompt) => normalizePrompt(prompt)))

  return prompts.filter((prompt) => {
    const normalizedPrompt = normalizePrompt(prompt)
    if (!normalizedPrompt) return false
    if (sourceSet.has(normalizedPrompt)) return false
    if (containsCjk(prompt)) return true
    return true
  })
}

function normalizePrompt(prompt) {
  return String(prompt || '').replace(/\s+/g, ' ').trim()
}

function containsCjk(value) {
  return /[\u3400-\u9fff]/.test(String(value || ''))
}

function extractCaseNumber(value) {
  const match = String(value || '').match(/case(\d+)/i)
  return match ? Number(match[1]) : null
}

function normalizeCategory(category) {
  const value = String(category || '').trim()
  const categoryMap = {
    portrait: 'Portrait & Photography Cases',
    poster: 'Poster & Illustration Cases',
    ui: 'UI & Social Media Mockup Cases',
    character: 'Character Design Cases',
    comparison: 'Comparison & Community Examples',
  }
  return categoryMap[value.toLowerCase()] || value || 'Uncategorized'
}

function resolveCategory(record, imageDir, zhCategoryByImageDir, categoryByAnchor) {
  if (imageDir && zhCategoryByImageDir.has(imageDir)) {
    return zhCategoryByImageDir.get(imageDir)
  }

  if (record.case_anchor && categoryByAnchor.has(record.case_anchor)) {
    return categoryByAnchor.get(record.case_anchor)
  }

  const normalized = normalizeCategory(record.category)
  return categoryLabelMap[normalized] || normalized
}

function extractMenuCategoryMap(readme) {
  const lines = readme.split(/\r?\n/)
  const categoryByAnchor = new Map()
  let inMenu = false
  let currentCategory = ''

  for (const line of lines) {
    if (!inMenu) {
      if (line.trim() === '## 📑 Menu') inMenu = true
      continue
    }

    if (/^##\s+/.test(line)) break

    const topLevelMatch = line.match(/^- \[[^\]]*?([A-Za-z& \-]+Cases|Comparison & Community Examples)\]\(#[^)]+\)$/)
    if (topLevelMatch) {
      currentCategory = categoryLabelMap[topLevelMatch[1].trim()] || ''
      continue
    }

    const caseMatch = line.match(/^\s{2}- \[.+?\]\((#[^)]+)\)$/)
    if (caseMatch && currentCategory) {
      categoryByAnchor.set(caseMatch[1], currentCategory)
    }
  }

  return categoryByAnchor
}

function extractImageDirCategoryMap(readme) {
  const lines = readme.split(/\r?\n/)
  const imageDirCategoryMap = new Map()
  let currentCategory = ''

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)$/)
    if (headingMatch) {
      const heading = headingMatch[1].trim()
      currentCategory = categoryOrder.includes(heading) ? heading : ''
      continue
    }

    if (!currentCategory) continue

    const imageMatch = line.match(/src=["'](?:\.\/)?(images\/[^"']+)["']/)
    if (imageMatch) {
      const imageDir = normalizePath(path.posix.dirname(imageMatch[1]))
      if (!imageDirCategoryMap.has(imageDir)) {
        imageDirCategoryMap.set(imageDir, currentCategory)
      }
    }
  }

  return imageDirCategoryMap
}

function categoryRank(category) {
  const index = categoryOrder.indexOf(category)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

function extractZhCaseMeta(readme) {
  const lines = readme.split(/\r?\n/)
  const byImageDir = new Map()
  const bySourceUrl = new Map()
  let currentCategory = ''

  for (let index = 0; index < lines.length; index++) {
    const headingMatch = lines[index].match(/^##\s+(.+)$/)
    if (headingMatch) {
      const heading = headingMatch[1].trim()
      currentCategory = categoryOrder.includes(heading) ? heading : ''
      continue
    }

    if (!currentCategory) continue

    const caseMatch = lines[index].match(
      /^### Case (\d+): \[(.+?)\]\((https?:\/\/[^)]+)\) \(by \[@([^\]]+)\]\((https?:\/\/[^)]+)\)\)/,
    )
    if (!caseMatch) continue

    let imageDir = ''
    for (let offset = index + 1; offset < Math.min(index + 20, lines.length); offset++) {
      const imageMatch = lines[offset].match(/src=["'](?:\.\/)?(images\/[^"']+)["']/)
      if (imageMatch) {
        imageDir = normalizePath(path.posix.dirname(imageMatch[1]))
        break
      }
    }

    const meta = {
      caseNumber: Number(caseMatch[1]),
      title: caseMatch[2].trim(),
      sourceUrl: caseMatch[3],
      author: caseMatch[4].trim(),
      category: currentCategory,
      imageDir,
    }

    if (imageDir) byImageDir.set(imageDir, meta)
    if (meta.sourceUrl) bySourceUrl.set(meta.sourceUrl, meta)
  }

  return { byImageDir, bySourceUrl }
}

function resolveZhCase(record, imageDir, zhCaseMeta) {
  if (imageDir && zhCaseMeta.byImageDir.has(imageDir)) {
    return zhCaseMeta.byImageDir.get(imageDir)
  }

  if (record.tweet_url && zhCaseMeta.bySourceUrl.has(record.tweet_url)) {
    return zhCaseMeta.bySourceUrl.get(record.tweet_url)
  }

  return null
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
