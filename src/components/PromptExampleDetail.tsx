import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { copyTextToClipboard, getClipboardFailureMessage } from '../lib/clipboard'
import type { PromptExample } from '../lib/promptGallery'
import {
  getExampleDisplayTitle,
  getExampleImages,
  getExampleReusablePrompt,
  getExampleSecondaryTitle,
} from '../lib/promptGallery'
import { useStore } from '../store'
import { useCloseOnEscape } from '../hooks/useCloseOnEscape'

interface PromptExampleDetailProps {
  example: PromptExample
  onClose: () => void
  onReuse: () => void
}

export default function PromptExampleDetail({
  example,
  onClose,
  onReuse,
}: PromptExampleDetailProps) {
  const showToast = useStore((s) => s.showToast)
  const images = getExampleImages(example)
  const displayTitle = getExampleDisplayTitle(example)
  const secondaryTitle = getExampleSecondaryTitle(example)
  const reusablePrompt = getExampleReusablePrompt(example)
  const hasPromptZh = Boolean(
    example.promptZh?.trim() &&
      normalizePrompt(example.promptZh) !== normalizePrompt(reusablePrompt),
  )
  const [activeImage, setActiveImage] = useState(0)
  const [activePromptTab, setActivePromptTab] = useState<'original' | 'zh'>('original')
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number } | null>(null)
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set())
  const visibleImages = images.filter((image) => !failedImages.has(image))
  const currentImage = visibleImages[activeImage]
  const currentPrompt = activePromptTab === 'zh' && hasPromptZh ? example.promptZh ?? '' : reusablePrompt
  const currentPromptSegments =
    activePromptTab === 'zh' && hasPromptZh ? example.promptsZh : example.promptsOriginal
  useCloseOnEscape(true, onClose)

  const markImageFailed = useCallback((imageUrl: string) => {
    setFailedImages((current) => {
      const next = new Set(current)
      next.add(imageUrl)
      return next
    })
  }, [])

  useEffect(() => {
    setActiveImage(0)
    setActivePromptTab('original')
    setFailedImages(new Set())
  }, [example.id])

  useEffect(() => {
    if (activeImage > 0 && activeImage >= visibleImages.length) {
      setActiveImage(Math.max(0, visibleImages.length - 1))
    }
  }, [activeImage, visibleImages.length])

  useEffect(() => {
    if (!currentImage) {
      setImageMeta(null)
      return
    }

    let cancelled = false
    const image = new Image()
    image.onload = () => {
      if (!cancelled) {
        setImageMeta({
          width: image.naturalWidth,
          height: image.naturalHeight,
        })
      }
    }
    image.onerror = () => {
      if (!cancelled) {
        setImageMeta(null)
        markImageFailed(currentImage)
      }
    }
    image.src = currentImage

    return () => {
      cancelled = true
    }
  }, [currentImage, markImageFailed])

  const handleCopy = async () => {
    if (!currentPrompt) return
    try {
      await copyTextToClipboard(currentPrompt)
      showToast('提示词已复制', 'success')
    } catch (error) {
      showToast(getClipboardFailureMessage('复制提示词失败', error), 'error')
    }
  }

  const showPreviousImage = () => {
    setActiveImage((current) => (
      visibleImages.length ? (current - 1 + visibleImages.length) % visibleImages.length : 0
    ))
  }

  const showNextImage = () => {
    setActiveImage((current) => (
      visibleImages.length ? (current + 1) % visibleImages.length : 0
    ))
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-3 py-4 sm:px-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/72 backdrop-blur-md animate-fade-in"
        onClick={onClose}
        aria-label="关闭提示词详情"
      />

      <section className="relative grid h-[min(840px,calc(100vh-2rem))] w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-[#101014] shadow-[0_28px_90px_rgba(0,0,0,0.48)] animate-modal-in lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
        <div className="min-h-0 bg-[#07070b]">
          <div className="relative flex h-[34vh] items-center justify-center overflow-hidden p-4 sm:h-[38vh] sm:p-5 lg:h-full lg:p-6">
            {currentImage ? (
              <img
                src={currentImage}
                alt={displayTitle}
                className="max-h-full max-w-full object-contain"
                onError={() => markImageFailed(currentImage)}
              />
            ) : (
              <div className="px-10 text-center text-sm leading-7 text-white/54">
                这个案例暂时没有可预览的效果图。
              </div>
            )}

            {visibleImages.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={showPreviousImage}
                  className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-black/38 text-white/82 shadow-[0_12px_30px_rgba(0,0,0,0.32)] backdrop-blur-xl transition hover:border-white/22 hover:bg-black/58 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#ff7fc8]/70"
                  aria-label="查看上一张效果图"
                  title="上一张"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={showNextImage}
                  className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-black/38 text-white/82 shadow-[0_12px_30px_rgba(0,0,0,0.32)] backdrop-blur-xl transition hover:border-white/22 hover:bg-black/58 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#ff7fc8]/70"
                  aria-label="查看下一张效果图"
                  title="下一张"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </>
            ) : null}

            {visibleImages.length > 1 ? (
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-full border border-white/10 bg-black/40 p-1.5 backdrop-blur-xl">
                {visibleImages.map((image, index) => (
                  <button
                    type="button"
                    key={image}
                    onClick={() => setActiveImage(index)}
                    className={`h-2.5 rounded-full transition ${
                      activeImage === index ? 'w-6 bg-[#ff7fc8]' : 'w-2.5 bg-white/35 hover:bg-white/60'
                    }`}
                    aria-label={`查看第 ${index + 1} 张效果图`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex min-h-0 flex-col bg-[#1a1b20]">
          <header className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#ff8fd0]/24 bg-[#ff4eb7]/12 px-2.5 py-1 text-[11px] font-medium text-[#ffd4eb]">
                  {example.category}
                </span>
                {example.requiresReference ? (
                  <span className="rounded-full border border-amber-300/22 bg-amber-300/10 px-2.5 py-1 text-[11px] font-medium text-amber-100">
                    适合搭配参考图
                  </span>
                ) : null}
              </div>
              <h2 className="mt-3 text-xl font-semibold leading-8 text-white">
                {displayTitle}
              </h2>
              {secondaryTitle ? (
                <p className="mt-1 text-sm leading-6 text-white/42">
                  {secondaryTitle}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-white/55">
                {example.author ? `@${example.author}` : 'Unknown author'}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-white/70 transition hover:border-white/18 hover:bg-white/10 hover:text-white"
              title="关闭"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="space-y-5">
              {example.arguments.length > 0 ? (
                <div className="rounded-[20px] border border-white/10 bg-[#131419] p-4">
                  <h3 className="text-sm font-semibold text-white">模板变量</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {example.arguments.map((item) => (
                      <span
                        key={`${item.name}:${item.defaultValue}`}
                        className="rounded-full bg-black/24 px-3 py-1.5 text-xs text-white/78"
                      >
                        {item.name}: {item.defaultValue}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] tracking-[0.18em] text-[#cfd3dc]">提示词</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {hasPromptZh ? (
                      <div className="flex items-center gap-1 rounded-full border border-white/10 bg-[#14151a] p-1">
                        <button
                          type="button"
                          onClick={() => setActivePromptTab('original')}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                            activePromptTab === 'original'
                              ? 'bg-[#ff4eb7] text-white'
                              : 'text-[#c8ccd5] hover:text-white'
                          }`}
                        >
                          原文
                        </button>
                        <button
                          type="button"
                          onClick={() => setActivePromptTab('zh')}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                            activePromptTab === 'zh'
                              ? 'bg-[#ff4eb7] text-white'
                              : 'text-[#c8ccd5] hover:text-white'
                          }`}
                        >
                          中文译文
                        </button>
                      </div>
                    ) : (
                      <span className="rounded-full border border-white/10 bg-[#14151a] px-3 py-1.5 text-xs text-[#c8ccd5]">
                        仅原文
                      </span>
                    )}
                    {currentPromptSegments.length > 1 ? (
                      <span className="text-xs text-[#c8ccd5]">{currentPromptSegments.length} 段</span>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleCopy}
                      disabled={!currentPrompt}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 transition ${
                        currentPrompt
                          ? 'bg-[#17181d] text-[#f4f6f8] hover:bg-[#1d1f25] hover:text-white'
                          : 'cursor-not-allowed bg-[#14151a] text-white/30'
                      }`}
                      title="复制提示词"
                    >
                      <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
                        <rect x="9" y="9" width="10" height="10" rx="2" />
                        <path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                      </svg>
                    </button>
                  </div>
                </div>
                <pre className="max-h-[42vh] overflow-auto whitespace-pre-wrap rounded-[20px] border border-white/10 bg-[#0f1014] p-4 font-sans text-sm leading-8 text-[#f3f5f7] [color:#f3f5f7]">{currentPrompt || (activePromptTab === 'zh' ? '这个案例暂时还没有中文译文。' : '这个案例未收录可复用提示词。')}</pre>
              </div>

              {imageMeta ? (
                <div>
                  <p className="mb-3 text-[11px] tracking-[0.18em] text-[#cfd3dc]">比例</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-[#17181d] px-3 py-1.5 text-xs font-medium text-[#f4f6f8]">
                      {formatAspectRatio(imageMeta.width, imageMeta.height)}
                    </span>
                    <span className="rounded-full border border-white/10 bg-[#17181d] px-3 py-1.5 text-xs font-medium text-[#d6dae2] [color:#d6dae2]">
                      {imageMeta.width} × {imageMeta.height}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <footer className="grid grid-cols-2 gap-3 border-t border-white/8 px-5 py-4 sm:px-6">
            <a
              href={example.sourceUrl || undefined}
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-[18px] border border-white/10 px-3 py-3 text-center text-sm font-semibold transition ${
                example.sourceUrl
                  ? 'bg-[#17181d] text-[#f4f6f8] hover:bg-[#1d1f25] hover:text-white'
                  : 'pointer-events-none bg-[#14151a] text-white/30'
              }`}
            >
              来源
            </a>
            <button
              type="button"
              onClick={onReuse}
              disabled={!reusablePrompt}
              className={`rounded-[18px] px-3 py-3 text-sm font-semibold transition ${
                reusablePrompt
                  ? 'bg-[linear-gradient(135deg,#ff4eb7,#ff7fc8)] text-white shadow-[0_14px_30px_rgba(255,78,183,0.3)] hover:brightness-110'
                  : 'cursor-not-allowed bg-white/8 text-white/34'
              }`}
            >
              复用
            </button>
          </footer>
        </div>
      </section>
    </div>,
    document.body,
  )
}

function formatAspectRatio(width: number, height: number) {
  const commonRatios: Array<[number, number]> = [
    [1, 1],
    [4, 3],
    [3, 4],
    [3, 2],
    [2, 3],
    [16, 9],
    [9, 16],
    [5, 4],
    [4, 5],
    [21, 9],
  ]
  const actual = width / height

  for (const [w, h] of commonRatios) {
    if (Math.abs(actual - w / h) < 0.02) {
      return `${w}:${h}`
    }
  }

  const divisor = gcd(width, height)
  return `${width / divisor}:${height / divisor}`
}

function normalizePrompt(prompt: string | null | undefined) {
  return String(prompt || '').replace(/\s+/g, ' ').trim()
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)

  while (y !== 0) {
    const remainder = x % y
    x = y
    y = remainder
  }

  return x || 1
}
