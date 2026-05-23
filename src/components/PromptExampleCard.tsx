import type { PromptExample } from '../lib/promptGallery'
import {
  getExampleCoverImage,
  getExampleDisplayTitle,
  getExampleImages,
  getExampleReusablePrompt,
  getExampleSecondaryTitle,
  getPromptPreview,
} from '../lib/promptGallery'

interface PromptExampleCardProps {
  example: PromptExample
  onOpen: () => void
  onReuse: () => void
}

export default function PromptExampleCard({
  example,
  onOpen,
  onReuse,
}: PromptExampleCardProps) {
  const images = getExampleImages(example)
  const cover = getExampleCoverImage(example)
  const displayTitle = getExampleDisplayTitle(example)
  const secondaryTitle = getExampleSecondaryTitle(example)
  const reusablePrompt = getExampleReusablePrompt(example)
  const promptPreview = reusablePrompt
    ? getPromptPreview(reusablePrompt)
    : '这个案例暂时只有效果图或来源信息，原始提示词未收录。'

  return (
    <article
      className="group relative cursor-pointer overflow-hidden rounded-[24px] border border-white/8 bg-[#101014] shadow-[0_16px_40px_rgba(0,0,0,0.22)] transition hover:border-[#ff82cc]/38 hover:shadow-[0_24px_60px_rgba(0,0,0,0.28)]"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen()
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`查看 ${displayTitle} 详情`}
    >
      <div className="relative h-[210px] overflow-hidden bg-[#0c0c12]">
        {cover ? (
          <img
            src={cover}
            alt={displayTitle}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,78,183,0.20),_transparent_46%),linear-gradient(180deg,#15151d,#09090d)] px-8 text-center text-sm leading-6 text-white/52">
            暂无本地效果图
          </div>
        )}

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,6,10,0.08),transparent_45%,rgba(6,6,10,0.86))]" />

        {images.length > 1 ? (
          <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/28 px-2.5 py-1 text-[11px] font-medium text-white/78 backdrop-blur-sm">
            {images.length} 张
          </div>
        ) : null}
      </div>

      {reusablePrompt ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex justify-center px-4">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onReuse()
            }}
            className="pointer-events-auto rounded-full bg-[linear-gradient(135deg,#ff4eb7,#ff7fc8)] px-6 py-3 text-sm font-semibold text-white opacity-0 shadow-[0_16px_36px_rgba(255,78,183,0.32)] transition duration-200 translate-y-4 group-hover:translate-y-0 group-hover:opacity-100 hover:brightness-110 focus:opacity-100"
          >
            复用
          </button>
        </div>
      ) : null}

      <div className="space-y-3 p-4">
        <div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-6 text-white">
            {displayTitle}
          </h3>
          {secondaryTitle ? (
            <p className="mt-1 line-clamp-1 text-[11px] leading-5 text-white/40">
              {secondaryTitle}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-white/42">
            {example.author ? `@${example.author}` : 'Unknown author'}
          </p>
        </div>

        <p className="line-clamp-3 min-h-[3.75rem] text-xs leading-5 text-white/58">
          {promptPreview}
        </p>
      </div>
    </article>
  )
}
