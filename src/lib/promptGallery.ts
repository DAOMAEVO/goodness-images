export interface PromptArgument {
  name: string
  defaultValue: string
}

export interface PromptExample {
  id: string
  titleZh: string
  titleEn: string
  category: string
  author: string
  sourceUrl: string
  caseAnchor: string
  imageDir: string
  imagePaths: string[]
  thumbnailPath?: string
  remoteImageUrls: string[]
  promptOriginal: string
  promptZh: string | null
  promptsOriginal: string[]
  promptsZh: string[]
  requiresReference: boolean
  arguments: PromptArgument[]
  addedAt: string | null
}

export interface PromptGalleryIndex {
  generatedAt: string
  sourceRepo: string
  total: number
  categories: string[]
  examples: PromptExample[]
}

let galleryCache: Promise<PromptGalleryIndex> | null = null

export function loadPromptGallery() {
  if (!galleryCache) {
    const url = resolvePromptAsset('prompt-gallery/index.json')
    galleryCache = fetch(url).then(async (response) => {
      if (!response.ok) {
        throw new Error(`提示词库加载失败：${response.status}`)
      }
      return response.json() as Promise<PromptGalleryIndex>
    })
  }

  return galleryCache
}

export function resolvePromptAsset(path: string) {
  const base = import.meta.env.BASE_URL || '/'
  return `${base}${path.replace(/^\/+/, '')}`
}

export function getExampleImages(example: PromptExample) {
  if (example.imagePaths.length > 0) {
    return example.imagePaths.map(resolvePromptAsset)
  }

  return [
    ...example.remoteImageUrls,
  ]
}

export function getExampleCoverImage(example: PromptExample) {
  if (example.thumbnailPath) {
    return resolvePromptAsset(example.thumbnailPath)
  }

  return getExampleImages(example)[0]
}

export function getExampleDisplayTitle(example: PromptExample) {
  return example.titleZh || example.titleEn || '未命名案例'
}

export function getExampleSecondaryTitle(example: PromptExample) {
  const titleZh = normalizeText(example.titleZh)
  const titleEn = normalizeText(example.titleEn)
  if (!titleZh || !titleEn || titleZh === titleEn) {
    return ''
  }

  const promptOriginal = normalizeText(example.promptOriginal)
  const promptZh = normalizeText(example.promptZh)
  if (isPromptDuplicate(titleEn, promptOriginal) || isPromptDuplicate(titleEn, promptZh)) {
    return ''
  }

  return example.titleEn
}

function isPromptDuplicate(value: string, prompt: string) {
  if (!value || !prompt) return false
  return value === prompt || prompt.startsWith(value) || value.startsWith(prompt)
}

function normalizeText(value: string | null | undefined) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

export function hasPromptContent(example: PromptExample) {
  return Boolean(
    example.promptOriginal?.trim() ||
      example.promptsOriginal.some((prompt) => prompt.trim()),
  )
}

export function hasLocalExampleImage(example: PromptExample) {
  return example.imagePaths.length > 0 || Boolean(example.thumbnailPath)
}

export function isDisplayablePromptExample(example: PromptExample) {
  return hasPromptContent(example) && hasLocalExampleImage(example)
}

export function getExampleReusablePrompt(example: PromptExample) {
  return example.promptOriginal
}

export function getPromptPreview(prompt: string, maxLength = 180) {
  const compact = prompt.replace(/\s+/g, ' ').trim()
  return compact.length > maxLength ? `${compact.slice(0, maxLength)}...` : compact
}
