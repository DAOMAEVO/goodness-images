import { useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, ReactNode, TouchEvent as ReactTouchEvent } from 'react'
import type { TaskRecord } from '../types'
import { ensureImageCached, getCachedImage, retryTask, updateTaskInStore, useStore } from '../store'
import { ParamValue } from '../lib/paramDisplay'
import { formatImageRatio } from '../lib/size'

interface Props {
  task: TaskRecord
  onReuse: () => void
  onEditOutputs: () => void
  onDelete: () => void
  onClick: (event: ReactMouseEvent | ReactTouchEvent) => void
  isSelected?: boolean
}

export default function TaskCard({
  task,
  onReuse,
  onEditOutputs,
  onDelete,
  onClick,
  isSelected,
}: Props) {
  const [thumbSrc, setThumbSrc] = useState('')
  const [coverRatio, setCoverRatio] = useState('')
  const [coverSize, setCoverSize] = useState('')
  const [now, setNow] = useState(Date.now())
  const [menuOpen, setMenuOpen] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [swipeStartedSelected, setSwipeStartedSelected] = useState(false)
  const [swipeActionActive, setSwipeActionActive] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const swipeResetTimerRef = useRef<number | null>(null)
  const suppressClickUntilRef = useRef(0)
  const horizontalSwipeRef = useRef(false)
  const toggleTaskSelection = useStore((s) => s.toggleTaskSelection)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(
    () => () => {
      if (swipeResetTimerRef.current != null) {
        window.clearTimeout(swipeResetTimerRef.current)
      }
    },
    [],
  )

  useEffect(() => {
    if (task.status !== 'running') return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [task.status])

  useEffect(() => {
    setCoverRatio('')
    setCoverSize('')

    if (!task.outputImages?.[0]) {
      setThumbSrc('')
      return
    }

    const cached = getCachedImage(task.outputImages[0])
    if (cached) {
      setThumbSrc(cached)
      return
    }

    ensureImageCached(task.outputImages[0]).then((url) => {
      if (url) setThumbSrc(url)
    })
  }, [task.outputImages])

  useEffect(() => {
    if (!thumbSrc) return

    let cancelled = false
    const image = new Image()
    image.onload = () => {
      if (cancelled || image.naturalWidth <= 0 || image.naturalHeight <= 0) return
      setCoverRatio(formatImageRatio(image.naturalWidth, image.naturalHeight))
      setCoverSize(`${image.naturalWidth}×${image.naturalHeight}`)
    }
    image.src = thumbSrc

    if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
      setCoverRatio(formatImageRatio(image.naturalWidth, image.naturalHeight))
      setCoverSize(`${image.naturalWidth}×${image.naturalHeight}`)
    }

    return () => {
      cancelled = true
    }
  }, [thumbSrc])

  const handleTouchStart = (event: ReactTouchEvent) => {
    if (swipeResetTimerRef.current != null) {
      window.clearTimeout(swipeResetTimerRef.current)
      swipeResetTimerRef.current = null
    }

    touchStartRef.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    }
    horizontalSwipeRef.current = false
    setSwipeStartedSelected(Boolean(isSelected))
    setSwipeActionActive(false)
    setIsSwiping(true)
  }

  const handleTouchMove = (event: ReactTouchEvent) => {
    if (!touchStartRef.current) return
    const deltaX = event.touches[0].clientX - touchStartRef.current.x
    const deltaY = event.touches[0].clientY - touchStartRef.current.y

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      horizontalSwipeRef.current = true
      event.preventDefault()
      const boundedOffset = Math.max(-64, Math.min(64, deltaX))
      setSwipeOffset(boundedOffset)
      setSwipeActionActive(Math.abs(deltaX) >= 42)
    }
  }

  const handleTouchEnd = (event: ReactTouchEvent) => {
    setIsSwiping(false)
    setSwipeOffset(0)
    if (!touchStartRef.current) return

    const deltaX = event.changedTouches[0].clientX - touchStartRef.current.x
    touchStartRef.current = null
    const isSwipeAction = horizontalSwipeRef.current && Math.abs(deltaX) > 42
    horizontalSwipeRef.current = false
    setSwipeActionActive(isSwipeAction)

    swipeResetTimerRef.current = window.setTimeout(() => {
      setSwipeActionActive(false)
      swipeResetTimerRef.current = null
    }, 220)

    if (isSwipeAction) {
      suppressClickUntilRef.current = Date.now() + 320
      event.preventDefault()
      event.stopPropagation()
      toggleTaskSelection(task.id)
    }
  }

  const handleTouchCancel = () => {
    touchStartRef.current = null
    horizontalSwipeRef.current = false
    setIsSwiping(false)
    setSwipeOffset(0)
    setSwipeActionActive(false)
  }

  const duration = useMemo(() => {
    let seconds: number
    if (task.status === 'running') {
      seconds = Math.floor((now - task.createdAt) / 1000)
    } else if (task.elapsed != null) {
      seconds = Math.floor(task.elapsed / 1000)
    } else {
      return '00:00'
    }

    const minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
    const remainingSeconds = String(seconds % 60).padStart(2, '0')
    return `${minutes}:${remainingSeconds}`
  }, [now, task.createdAt, task.elapsed, task.status])

  const aggregateActualParams = task.outputImages?.length
    ? { ...task.actualParams, n: task.outputImages.length }
    : task.actualParams

  const displayTitle = createCardTitle(task)
  const rawPromptPreview = task.prompt?.trim() || '这条记录还没有提示词'
  const promptPreview = rawPromptPreview === displayTitle ? '' : rawPromptPreview
  const isSwipeReady = Math.abs(swipeOffset) >= 42
  const showSwipeAction = isSwipeReady || swipeActionActive

  const swipeBackgroundClass = showSwipeAction
    ? swipeStartedSelected
      ? 'bg-white/14'
      : 'bg-[#ff4eb7]/35'
    : 'bg-white/8'

  return (
    <div className="relative w-full">
      <div
        className={`absolute inset-0 flex items-center rounded-[28px] transition-opacity duration-200 ${
          isSwiping || swipeOffset || swipeActionActive ? 'opacity-100' : 'opacity-0'
        } ${swipeBackgroundClass} ${swipeOffset > 0 ? 'justify-start pl-6' : 'justify-end pr-6'}`}
      >
        <svg
          className={`h-8 w-8 transition-transform duration-150 ${
            showSwipeAction ? 'scale-110 text-white' : 'scale-90 text-white/60'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {swipeStartedSelected && showSwipeAction ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M6 18 18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} d="m5 13 4 4L19 7" />
          )}
        </svg>
      </div>

      <div
        className={`group relative cursor-pointer overflow-hidden rounded-[28px] border bg-[#101014] shadow-[0_16px_40px_rgba(0,0,0,0.26)] transition-[transform,border-color,box-shadow] duration-300 ${
          task.status === 'running'
            ? 'border-[#ff73c4]/55 shadow-[0_20px_50px_rgba(255,78,183,0.18)]'
            : isSelected
            ? 'border-[#ff6ec6]/75 shadow-[0_0_0_1px_rgba(255,78,183,0.48),0_22px_55px_rgba(255,78,183,0.2)]'
            : 'border-white/8 hover:border-[#ff82cc]/40 hover:shadow-[0_24px_60px_rgba(0,0,0,0.3)]'
        }`}
        style={{ transform: swipeOffset ? `translateX(${swipeOffset}px)` : undefined }}
        onClick={(event) => {
          if (Date.now() < suppressClickUntilRef.current) {
            event.preventDefault()
            event.stopPropagation()
            return
          }
          onClick(event)
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        <div className="relative h-[200px] overflow-hidden bg-[#0c0c12]">
          {task.status === 'done' && thumbSrc ? (
            <>
              <img
                src={thumbSrc}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                loading="lazy"
                alt={displayTitle}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,6,10,0.15),transparent_42%,rgba(6,6,10,0.82))]" />
            </>
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,78,183,0.25),_transparent_45%),linear-gradient(180deg,#12121a,#09090d)]" />
          )}

          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
            <div className="flex flex-wrap items-center gap-2">
              <MetaPill>{task.status === 'running' ? duration : coverRatio || duration}</MetaPill>
              {task.status === 'done' && coverSize ? <MetaPill tone="muted">{coverSize}</MetaPill> : null}
              {task.outputImages.length > 1 ? <MetaPill tone="pink">{task.outputImages.length} 张</MetaPill> : null}
            </div>

            <div className="flex items-center gap-2">
              {isSelected ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#ff9bd7]/50 bg-[#ff4eb7]/25 text-white shadow-[0_8px_18px_rgba(255,78,183,0.3)]">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} d="m5 13 4 4L19 7" />
                  </svg>
                </span>
              ) : null}

              <div ref={menuRef} className="relative" onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((value) => !value)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/32 text-white/80 backdrop-blur-sm transition hover:border-[#ff9bd7]/45 hover:bg-[#ff4eb7]/18 hover:text-white lg:opacity-0 lg:group-hover:opacity-100"
                  title="更多操作"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.9" />
                    <circle cx="12" cy="12" r="1.9" />
                    <circle cx="12" cy="19" r="1.9" />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-11 z-20 min-w-[11.5rem] overflow-hidden rounded-2xl border border-white/10 bg-[#111117]/96 p-1.5 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur-xl animate-dropdown-down">
                    <MenuItem
                      label={task.isFavorite ? '取消收藏' : '收藏记录'}
                      tone="pink"
                      onClick={() => {
                        updateTaskInStore(task.id, { isFavorite: !task.isFavorite })
                        setMenuOpen(false)
                      }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.05 2.93c.3-.92 1.6-.92 1.9 0l1.52 4.67a1 1 0 0 0 .95.7h4.91c.97 0 1.38 1.24.59 1.81l-3.98 2.88a1 1 0 0 0-.36 1.12l1.52 4.67c.3.92-.76 1.69-1.54 1.12l-3.97-2.89a1 1 0 0 0-1.18 0l-3.97 2.89c-.78.57-1.84-.2-1.54-1.12l1.52-4.67a1 1 0 0 0-.36-1.12L2.07 10.1c-.79-.57-.38-1.81.59-1.81h4.91a1 1 0 0 0 .95-.7l1.52-4.67Z"
                      />
                    </MenuItem>
                    <MenuItem label="复用配置" tone="blue" onClick={() => { onReuse(); setMenuOpen(false) }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 0 1 8 8v2M3 10l6 6m-6-6 6-6" />
                    </MenuItem>
                    {task.status === 'error' ? (
                      <MenuItem
                        label="重试任务"
                        tone="blue"
                        onClick={() => {
                          void retryTask(task)
                          setMenuOpen(false)
                        }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.58m14.84 2A8 8 0 0 0 4.58 9M4.58 9H9m11 11v-5h-.58m0 0a8 8 0 0 1-14.84-2M19.42 15H15" />
                      </MenuItem>
                    ) : null}
                    <MenuItem
                      label="编辑输出"
                      tone="green"
                      onClick={() => {
                        onEditOutputs()
                        setMenuOpen(false)
                      }}
                      disabled={!task.outputImages?.length}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.4-9.4a2 2 0 1 1 2.8 2.8L11.8 15H9v-2.8l8.6-8.6Z" />
                    </MenuItem>
                    <MenuItem label="删除记录" tone="red" onClick={() => { onDelete(); setMenuOpen(false) }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7 18.1 19.1A2 2 0 0 1 16.1 21H7.9a2 2 0 0 1-2-1.9L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" />
                    </MenuItem>
                  </div>
                )}
              </div>
            </div>
          </div>

          {task.status === 'running' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-[radial-gradient(circle,_rgba(255,78,183,0.18),_transparent_50%)] text-white">
              <div className="h-10 w-10 rounded-full border border-[#ff93d4]/28 border-t-[#ff78c7] animate-spin" />
              <div className="text-xs font-medium tracking-[0.16em] text-[#ffd0ea]">生成中</div>
            </div>
          )}

          {task.status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-5 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-red-400/25 bg-red-500/12 text-red-200">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m0 3h.01M10.29 3.86 1.82 18A2 2 0 0 0 3.53 21h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                </svg>
              </div>
              <p className="line-clamp-4 text-xs leading-5 text-red-100/85">
                {task.error || '这次生成失败了，请打开详情查看报错原因。'}
              </p>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 hidden translate-y-3 px-2.5 pb-2.5 pt-8 opacity-0 transition duration-300 lg:block lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
            <div className="rounded-[20px] border border-white/10 bg-black/42 p-2.5 backdrop-blur-xl shadow-[0_14px_40px_rgba(0,0,0,0.26)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-white">{displayTitle}</h3>
                  {promptPreview ? (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/66">{promptPreview}</p>
                  ) : null}
                </div>
                <StatusBadge status={task.status} />
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <ParamValue task={task} paramKey="quality" className="rounded-full bg-white/8 px-2 py-1 text-[10px]" />
                <ParamValue task={task} paramKey="size" className="rounded-full bg-white/8 px-2 py-1 text-[10px]" />
                <ParamValue task={task} paramKey="output_format" className="rounded-full bg-white/8 px-2 py-1 text-[10px]" />
                <ParamValue
                  task={task}
                  paramKey="n"
                  className="rounded-full bg-white/8 px-2 py-1 text-[10px]"
                  actualParams={aggregateActualParams}
                />
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 px-2.5 pb-2.5 pt-8 lg:hidden">
            <div className="rounded-[18px] border border-white/10 bg-black/48 p-2.5 backdrop-blur-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-[13px] font-semibold text-white">{displayTitle}</h3>
                  {promptPreview ? (
                    <p className="mt-1 line-clamp-2 text-[11px] leading-4.5 text-white/62">{promptPreview}</p>
                  ) : null}
                </div>
                <StatusBadge status={task.status} compact />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function createCardTitle(task: TaskRecord) {
  if (!task.prompt?.trim()) {
    return task.status === 'running' ? '生成中的草图' : '未命名作品'
  }

  const firstLine = task.prompt
    .trim()
    .split(/\n+/)[0]
    .split(/[，。,.!?！？]/)[0]
    .trim()

  return firstLine.length > 24 ? `${firstLine.slice(0, 24)}…` : firstLine
}

function MenuItem({
  children,
  label,
  onClick,
  tone,
  disabled,
}: {
  children: ReactNode
  label: string
  onClick: () => void
  tone: 'pink' | 'blue' | 'green' | 'red'
  disabled?: boolean
}) {
  const toneClass =
    tone === 'pink'
      ? 'hover:bg-[#ff4eb7]/12 hover:text-[#ffd3eb]'
      : tone === 'blue'
      ? 'hover:bg-[#70d6ff]/10 hover:text-[#c7f0ff]'
      : tone === 'green'
      ? 'hover:bg-emerald-400/10 hover:text-emerald-100'
      : 'hover:bg-red-500/10 hover:text-red-100'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm text-white/72 transition ${
        disabled ? 'cursor-not-allowed opacity-40' : toneClass
      }`}
    >
      <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {children}
      </svg>
      <span>{label}</span>
    </button>
  )
}

function MetaPill({
  children,
  tone = 'default',
}: {
  children: ReactNode
  tone?: 'default' | 'muted' | 'pink'
}) {
  const toneClass =
    tone === 'pink'
      ? 'border-[#ff8fd0]/32 bg-[#ff4eb7]/16 text-[#ffd4eb]'
      : tone === 'muted'
      ? 'border-white/10 bg-black/24 text-white/78'
      : 'border-white/12 bg-black/30 text-white'

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm ${toneClass}`}>
      {children}
    </span>
  )
}

function StatusBadge({
  status,
  compact,
}: {
  status: TaskRecord['status']
  compact?: boolean
}) {
  const config =
    status === 'running'
      ? { label: '生成中', className: 'bg-[#ff4eb7]/16 text-[#ffd1ea] border-[#ff8fd0]/26' }
      : status === 'error'
      ? { label: '失败', className: 'bg-red-500/12 text-red-100 border-red-400/24' }
      : { label: '完成', className: 'bg-emerald-400/10 text-emerald-100 border-emerald-400/22' }

  return (
    <span
      className={`inline-flex items-center rounded-full border py-1 text-[11px] font-medium ${
        compact ? 'px-2.5' : 'px-3'
      } ${config.className}`}
    >
      {config.label}
    </span>
  )
}
