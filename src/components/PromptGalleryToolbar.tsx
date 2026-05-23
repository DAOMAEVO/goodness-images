interface PromptGalleryToolbarProps {
  query: string
  onQueryChange: (value: string) => void
  compact?: boolean
}

export default function PromptGalleryToolbar({
  query,
  onQueryChange,
  compact = false,
}: PromptGalleryToolbarProps) {
  return (
    <section
      className={`rounded-[28px] bg-[#101014]/80 shadow-[0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl ${
        compact ? 'p-2.5' : 'p-3'
      }`}
    >
      <div className={`flex gap-3 ${compact ? 'flex-col' : 'flex-col xl:flex-row xl:items-center'}`}>
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">搜索提示词案例</span>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/36"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z" />
          </svg>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="搜索标题、作者、分类或提示词"
            className={`w-full border border-white/10 bg-[#141418] text-sm text-white outline-none transition placeholder:text-white/28 focus:border-[#ff3db6] focus:ring-2 focus:ring-[#ff4eb7]/16 ${
              compact
                ? 'rounded-full py-2.5 pl-11 pr-4'
                : 'rounded-[20px] py-3 pl-11 pr-4'
            }`}
          />
        </label>
      </div>
    </section>
  )
}
