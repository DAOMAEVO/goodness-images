import { useStore } from '../store'
import Select from './Select'

interface SearchBarProps {
  compact?: boolean
}

export default function SearchBar({ compact = false }: SearchBarProps) {
  const searchQuery = useStore((s) => s.searchQuery)
  const setSearchQuery = useStore((s) => s.setSearchQuery)
  const filterStatus = useStore((s) => s.filterStatus)
  const setFilterStatus = useStore((s) => s.setFilterStatus)
  const filterFavorite = useStore((s) => s.filterFavorite)
  const setFilterFavorite = useStore((s) => s.setFilterFavorite)

  const searchInput = (
    <div className="relative min-w-0 flex-1">
      <svg
        className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35 ${
          compact ? 'h-3.5 w-3.5' : 'h-4 w-4'
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-4.35-4.35m1.6-5.4a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
        />
      </svg>
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        type="text"
        placeholder="搜索提示词、尺寸、格式或状态…"
        className={`w-full border border-white/10 bg-[#141418] text-white placeholder:text-white/24 focus:border-[#ff3db6] focus:outline-none focus:ring-2 focus:ring-[#ff4eb7]/18 ${
          compact
            ? 'h-10 rounded-full py-2 pl-10 pr-3 text-[13px]'
            : 'rounded-[20px] py-3 pl-11 pr-4 text-sm'
        }`}
      />
    </div>
  )

  const favoriteButton = (
    <button
      onClick={() => setFilterFavorite(!filterFavorite)}
      className={`inline-flex items-center justify-center gap-2 border text-sm font-medium transition ${
        compact
          ? 'h-10 rounded-full px-3.5'
          : 'h-12 rounded-[18px] px-4'
      } ${
        filterFavorite
          ? 'border-[#ff7fc8]/50 bg-[#ff4eb7]/16 text-[#ffd2eb]'
          : 'border-white/10 bg-white/6 text-white/65 hover:border-white/16 hover:text-white'
      }`}
      title={filterFavorite ? '取消只看收藏' : '只看收藏'}
    >
      <svg className="h-4 w-4" fill={filterFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11.05 2.93c.3-.92 1.6-.92 1.9 0l1.52 4.67a1 1 0 0 0 .95.7h4.91c.97 0 1.38 1.24.59 1.81l-3.98 2.88a1 1 0 0 0-.36 1.12l1.52 4.67c.3.92-.76 1.69-1.54 1.12l-3.97-2.89a1 1 0 0 0-1.18 0l-3.97 2.89c-.78.57-1.84-.2-1.54-1.12l1.52-4.67a1 1 0 0 0-.36-1.12L2.07 10.1c-.79-.57-.38-1.81.59-1.81h4.91a1 1 0 0 0 .95-.7l1.52-4.67Z"
        />
      </svg>
      <span className={compact ? 'hidden 2xl:inline' : 'hidden sm:inline'}>收藏</span>
    </button>
  )

  const statusSelect = (
    <div className={compact ? 'w-[8.75rem] flex-shrink-0' : 'flex w-full gap-3 xl:w-[14rem]'}>
      <Select
        value={filterStatus}
        onChange={(value) => setFilterStatus(value as typeof filterStatus)}
        options={[
          { label: '全部状态', value: 'all' },
          { label: '已完成', value: 'done' },
          { label: '生成中', value: 'running' },
          { label: '失败', value: 'error' },
        ]}
        className={`border border-white/10 bg-white/[0.08] text-white ${
          compact
            ? 'h-10 rounded-full px-3.5 py-2 text-[13px]'
            : 'rounded-[18px] px-4 py-3 text-sm'
        }`}
      />
    </div>
  )

  if (compact) {
    return (
      <div
        data-no-drag-select
        className="flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
      >
        {searchInput}
        {favoriteButton}
        {statusSelect}
      </div>
    )
  }

  return (
    <div className="neo-panel overflow-hidden px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {searchInput}
          {favoriteButton}
        </div>

        {statusSelect}
      </div>
    </div>
  )
}
