import fs from 'node:fs/promises'
import path from 'node:path'

const projectRoot = process.cwd()
const sourceRoot = path.join(projectRoot, 'docs', 'awesome-gpt-image-2-prompts-main')
const galleryIndexPath = path.join(projectRoot, 'public', 'prompt-gallery', 'index.json')
const promptTranslationsPath = path.join(sourceRoot, 'data', 'prompt_zh_translations.json')
const MAX_CHUNK_LENGTH = 900
const CONCURRENCY = 3
const RETRY_LIMIT = 3

async function main() {
  const gallery = JSON.parse(await fs.readFile(galleryIndexPath, 'utf8'))
  const cache = await readTranslationCache()
  const examples = Array.isArray(gallery.examples) ? gallery.examples : []

  const candidates = examples
    .filter((example) => shouldTranslatePrompt(example))
    .map((example) => ({
      key: createPromptTranslationKey(example),
      sourceUrl: example.sourceUrl || '',
      imageDir: example.imageDir || '',
      titleZh: example.titleZh || '',
      titleEn: example.titleEn || '',
      promptOriginal: example.promptOriginal || '',
      existing: cache.get(createPromptTranslationKey(example)) ?? null,
    }))
    .filter((item) => item.key && item.promptOriginal)
    .filter((item) => !isCachedTranslationCurrent(item.existing, item.promptOriginal))

  if (!candidates.length) {
    console.log('Prompt gallery translation cache is already up to date.')
    return
  }

  console.log(`Translating ${candidates.length} prompt examples to zh-CN...`)

  const queue = [...candidates]
  const failures = []
  let completed = 0

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      while (queue.length > 0) {
        const item = queue.shift()
        if (!item) return

        try {
          const promptZh = await translatePrompt(item.promptOriginal)
          cache.set(item.key, {
            key: item.key,
            sourceUrl: item.sourceUrl,
            imageDir: item.imageDir,
            titleZh: item.titleZh,
            titleEn: item.titleEn,
            promptOriginal: item.promptOriginal,
            promptZh,
            updatedAt: new Date().toISOString(),
            provider: 'google-translate-auto',
          })
          completed += 1
          if (completed % 10 === 0 || completed === candidates.length) {
            console.log(`Translated ${completed}/${candidates.length}`)
          }
        } catch (error) {
          failures.push({
            key: item.key,
            titleEn: item.titleEn,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }
    }),
  )

  await writeTranslationCache(cache)

  if (failures.length) {
    console.warn(`Translation completed with ${failures.length} failures.`)
    for (const failure of failures.slice(0, 20)) {
      console.warn(`- ${failure.titleEn || failure.key}: ${failure.error}`)
    }
    process.exitCode = 1
    return
  }

  console.log(`Translation cache updated: ${candidates.length} prompts translated.`)
}

async function readTranslationCache() {
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

async function writeTranslationCache(cache) {
  const entries = Array.from(cache.values()).sort((left, right) => left.key.localeCompare(right.key))
  const payload = {
    generatedAt: new Date().toISOString(),
    total: entries.length,
    entries,
  }

  await fs.writeFile(promptTranslationsPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

function shouldTranslatePrompt(example) {
  if (!example || typeof example !== 'object') return false
  if (typeof example.promptOriginal !== 'string' || !example.promptOriginal.trim()) return false
  if (typeof example.promptZh === 'string' && example.promptZh.trim()) return false
  return !containsCjk(example.promptOriginal)
}

function createPromptTranslationKey(example) {
  return String(example.sourceUrl || example.imageDir || example.titleEn || example.id || '').trim()
}

function isCachedTranslationCurrent(existing, promptOriginal) {
  if (!existing) return false
  if (typeof existing.promptZh !== 'string' || !existing.promptZh.trim()) return false
  return normalizePrompt(existing.promptOriginal) === normalizePrompt(promptOriginal)
}

async function translatePrompt(prompt) {
  const chunks = splitPrompt(prompt, MAX_CHUNK_LENGTH)
  const translated = []

  for (const chunk of chunks) {
    translated.push(await translateChunkWithRetry(chunk))
  }

  return translated.join('').trim()
}

async function translateChunkWithRetry(chunk) {
  let lastError = null
  for (let attempt = 1; attempt <= RETRY_LIMIT; attempt += 1) {
    try {
      return await translateChunk(chunk)
    } catch (error) {
      lastError = error
      await sleep(300 * attempt)
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

async function translateChunk(chunk) {
  if (!chunk) return chunk

  const { maskedText, placeholders } = maskProtectedTokens(chunk)
  const query = new URLSearchParams({
    client: 'gtx',
    sl: 'en',
    tl: 'zh-CN',
    dt: 't',
    q: maskedText,
  })

  const response = await fetch(`https://translate.googleapis.com/translate_a/single?${query.toString()}`)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const payload = await response.json()
  const translated = Array.isArray(payload?.[0])
    ? payload[0].map((item) => (Array.isArray(item) ? item[0] || '' : '')).join('')
    : ''

  if (!translated) {
    throw new Error('Empty translation response')
  }

  return unmaskProtectedTokens(translated, placeholders)
}

function maskProtectedTokens(text) {
  const placeholders = []
  const protectedPatterns = [
    /\{argument\s+name="[^"]+"\s+default="[^"]*"\}/g,
    /https?:\/\/[^\s)]+/g,
  ]

  let maskedText = text
  for (const pattern of protectedPatterns) {
    maskedText = maskedText.replace(pattern, (token) => {
      const placeholder = `__PROMPT_TOKEN_${placeholders.length}__`
      placeholders.push({ placeholder, token })
      return placeholder
    })
  }

  return { maskedText, placeholders }
}

function unmaskProtectedTokens(text, placeholders) {
  return placeholders.reduce(
    (current, item) => current.replaceAll(item.placeholder, item.token),
    text,
  )
}

function splitPrompt(text, maxLength) {
  const chunks = []
  let remaining = text

  while (remaining.length > maxLength) {
    const splitIndex = findSplitIndex(remaining, maxLength)
    chunks.push(remaining.slice(0, splitIndex))
    remaining = remaining.slice(splitIndex)
  }

  if (remaining) {
    chunks.push(remaining)
  }

  return chunks
}

function findSplitIndex(text, maxLength) {
  const slice = text.slice(0, maxLength)
  const separators = ['\n\n', '\n', '. ', '; ', ': ', ', ']

  for (const separator of separators) {
    const index = slice.lastIndexOf(separator)
    if (index >= Math.floor(maxLength * 0.45)) {
      return index + separator.length
    }
  }

  return maxLength
}

function containsCjk(value) {
  return /[\u3400-\u9fff]/.test(String(value || ''))
}

function normalizePrompt(prompt) {
  return String(prompt || '').replace(/\s+/g, ' ').trim()
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
