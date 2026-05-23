import { useEffect, useMemo, useState } from 'react'
import type { PromptExample, PromptGalleryIndex } from '../lib/promptGallery'
import {
  getExampleDisplayTitle,
  getExampleReusablePrompt,
  getExampleSecondaryTitle,
  isDisplayablePromptExample,
  loadPromptGallery,
} from '../lib/promptGallery'
import { useStore } from '../store'
import PromptExampleCard from './PromptExampleCard'
import PromptGalleryCategoryTabs from './PromptGalleryCategoryTabs'
import PromptExampleDetail from './PromptExampleDetail'

interface PromptGalleryPageProps {
  query: string
  selectedCategory: string
  onCategoryChange: (value: string) => void
}

export default function PromptGalleryPage({
  query,
  selectedCategory,
  onCategoryChange,
}: PromptGalleryPageProps) {
  const setPrompt = useStore((s) => s.setPrompt)
  const showToast = useStore((s) => s.showToast)
  const [gallery, setGallery] = useState<PromptGalleryIndex | null>(null)
  const [loadError, setLoadError] = useState('')
  const [selectedExample, setSelectedExample] = useState<PromptExample | null>(null)

  useEffect(() => {
    let cancelled = false
    loadPromptGallery()
      .then((data) => {
        if (!cancelled) setGallery(data)
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : String(error))
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const categories = gallery?.categories ?? []

  const filteredExamples = useMemo(() => {
    const examples = gallery?.examples ?? []
    const normalizedQuery = query.trim().toLowerCase()

    return examples
      .filter(isDisplayablePromptExample)
      .filter((example) => selectedCategory === 'all' || example.category === selectedCategory)
      .filter((example) => {
        if (!normalizedQuery) return true
        const reusablePrompt = getExampleReusablePrompt(example)
        const haystack = [
          getExampleDisplayTitle(example),
          getExampleSecondaryTitle(example),
          example.category,
          example.author,
          reusablePrompt,
          example.promptZh,
          ...example.promptsOriginal,
          ...example.promptsZh,
        ].join('\n').toLowerCase()
        return haystack.includes(normalizedQuery)
      })
      .sort((a, b) => scoreExample(b) - scoreExample(a))
  }, [gallery?.examples, query, selectedCategory])

  const handleReuse = (example: PromptExample) => {
    const reusablePrompt = getExampleReusablePrompt(example)
    if (!reusablePrompt) {
      showToast('这个案例没有可复用提示词', 'error')
      return
    }
    setPrompt(reusablePrompt)
    showToast('已复用提示词到输入框', 'success')
    setSelectedExample(null)
  }

  if (loadError) {
    return (
      <div className="neo-panel px-6 py-14 text-center">
        <h2 className="text-xl font-semibold text-white">提示词库加载失败</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-red-100/80">{loadError}</p>
        <p className="mt-3 text-xs text-white/42">
          请先运行 npm run build:prompt-gallery 生成索引。
        </p>
      </div>
    )
  }

  if (!gallery) {
    return (
      <div className="neo-panel px-6 py-16 text-center">
        <div className="mx-auto h-10 w-10 rounded-full border border-[#ff93d4]/28 border-t-[#ff78c7] animate-spin" />
        <p className="mt-4 text-sm text-white/55">正在加载提示词案例...</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-5">
        <PromptGalleryCategoryTabs
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
          categories={categories}
        />

        {filteredExamples.length ? (
          <div className="grid grid-cols-1 justify-items-center gap-4 sm:[grid-template-columns:repeat(auto-fit,minmax(290px,290px))] sm:justify-center">
            {filteredExamples.map((example) => (
              <div key={example.id} className="w-full max-w-[290px]">
                <PromptExampleCard
                  example={example}
                  onOpen={() => setSelectedExample(example)}
                  onReuse={() => handleReuse(example)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="neo-panel px-6 py-16 text-center">
            <h2 className="text-xl font-semibold text-white">没有找到匹配案例</h2>
            <p className="mt-2 text-sm text-white/50">换个关键词或切换分类再试试。</p>
          </div>
        )}
      </div>

      {selectedExample ? (
        <PromptExampleDetail
          example={selectedExample}
          onClose={() => setSelectedExample(null)}
          onReuse={() => handleReuse(selectedExample)}
        />
      ) : null}
    </>
  )
}

function scoreExample(example: PromptExample) {
  let score = 0
  if (getExampleReusablePrompt(example)) score += 2
  if (example.promptZh) score += 1
  if (example.imagePaths.length > 0 || example.remoteImageUrls.length > 0) score += 1
  return score
}
