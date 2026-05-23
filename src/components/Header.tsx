import { useState, type ReactNode } from 'react'
import { useStore } from '../store'
import { useVersionCheck } from '../hooks/useVersionCheck'
import HelpModal from './HelpModal'
import PromptGalleryToolbar from './PromptGalleryToolbar'
import SearchBar from './SearchBar'

export type AppView = 'workspace' | 'prompt-gallery'

interface HeaderProps {
  activeView: AppView
  onViewChange: (view: AppView) => void
  promptGalleryToolbar?: {
    query: string
    onQueryChange: (value: string) => void
  }
}

export default function Header({ activeView, onViewChange, promptGalleryToolbar }: HeaderProps) {
  const setShowSettings = useStore((s) => s.setShowSettings)
  const settingsMode = useStore((s) => s.settingsMode)
  const setSettingsMode = useStore((s) => s.setSettingsMode)
  const { hasUpdate, latestRelease, dismiss } = useVersionCheck()
  const [showHelp, setShowHelp] = useState(false)
  const homeHref = import.meta.env.BASE_URL || '/'

  const brand = (
    <a
      href={homeHref}
      className="flex shrink-0 items-center gap-3 transition hover:opacity-95"
      aria-label="返回应用首页"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-blush-200 transition hover:border-blush-400/40 hover:bg-blush-400/10 hover:text-white">
        <img src="/logo.png" alt="GPT 生图 Logo" className="h-6 w-6 object-contain" />
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="bg-[linear-gradient(90deg,#fff_0%,#fb23c2_100%)] bg-clip-text font-display text-lg font-semibold tracking-tight text-transparent">
            GPT 生图
          </span>
          {hasUpdate && latestRelease && (
            <a
              href={latestRelease.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => {
                event.stopPropagation()
                dismiss()
              }}
              className="rounded-full border border-[#ff6cbc]/40 bg-[#ff4eb7]/18 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#ffd0ea] transition hover:border-[#ff8ace]/60 hover:bg-[#ff4eb7]/26"
              title={`新版本 ${latestRelease.tag}`}
            >
              New
            </a>
          )}
        </div>
        <p className="text-[11px] uppercase tracking-[0.26em] text-white/35">image workspace</p>
      </div>
    </a>
  )

  const viewSwitch = (
    <div className="inline-flex items-center rounded-full border border-white/10 bg-white/6 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <ViewButton
        active={activeView === 'workspace'}
        label="作品"
        onClick={() => onViewChange('workspace')}
      />
      <ViewButton
        active={activeView === 'prompt-gallery'}
        label="提示词库"
        onClick={() => onViewChange('prompt-gallery')}
      />
    </div>
  )

  const actions = (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="inline-flex items-center rounded-full border border-white/12 bg-[#101116] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_28px_rgba(0,0,0,0.22)]">
        <button
          onClick={() => setSettingsMode('public')}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            settingsMode === 'public'
              ? 'bg-white text-[#090a0d] shadow-[0_8px_20px_rgba(0,0,0,0.28)]'
              : 'text-white/58 hover:text-white'
          }`}
          aria-pressed={settingsMode === 'public'}
          title="使用系统内置配置"
        >
          公共
        </button>
        <button
          onClick={() => setSettingsMode('custom')}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            settingsMode === 'custom'
              ? 'bg-white text-[#090a0d] shadow-[0_8px_20px_rgba(0,0,0,0.28)]'
              : 'text-white/58 hover:text-white'
          }`}
          aria-pressed={settingsMode === 'custom'}
          title="使用自定义配置"
        >
          自定义
        </button>
      </div>

      <IconButton onClick={() => setShowHelp(true)} title="操作指南">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.2 9a3 3 0 0 1 5.6 1.4c0 1.8-2.4 2.6-2.8 2.8v1" />
        <path d="M12 16.8h.01" />
      </IconButton>

      {settingsMode === 'custom' && (
        <IconButton onClick={() => setShowSettings(true)} title="设置">
          <path d="M10.4 3.8c.3-1.2 2-1.2 2.3 0a1.35 1.35 0 0 0 2 .84c1.1-.67 2.37.6 1.7 1.7a1.35 1.35 0 0 0 .84 2c1.2.3 1.2 2 0 2.3a1.35 1.35 0 0 0-.84 2c.67 1.1-.6 2.37-1.7 1.7a1.35 1.35 0 0 0-2 .84c-.3 1.2-2 1.2-2.3 0a1.35 1.35 0 0 0-2-.84c-1.1.67-2.37-.6-1.7-1.7a1.35 1.35 0 0 0-.84-2c-1.2-.3-1.2-2 0-2.3a1.35 1.35 0 0 0 .84-2c-.67-1.1.6-2.37 1.7-1.7a1.35 1.35 0 0 0 2-.84Z" />
          <circle cx="12" cy="12" r="3" />
        </IconButton>
      )}
    </div>
  )

  return (
    <>
      <header className="safe-area-top sticky top-0 z-40 border-b border-white/8 bg-[#08080d]/78 backdrop-blur-2xl">
        <div className="safe-area-x mx-auto max-w-[1780px]">
          <div className="lg:hidden">
            <div className="flex h-16 items-center justify-between">
              {brand}
              {actions}
            </div>
            <div className="flex pb-3">
              {viewSwitch}
            </div>
            {activeView === 'prompt-gallery' && promptGalleryToolbar ? (
              <div className="pb-3">
                <PromptGalleryToolbar
                  query={promptGalleryToolbar.query}
                  onQueryChange={promptGalleryToolbar.onQueryChange}
                />
              </div>
            ) : null}
          </div>

          <div className="hidden h-20 grid-cols-[auto_minmax(18rem,40rem)_auto] items-center gap-6 lg:grid">
            <div className="flex min-w-0 items-center gap-5">
              {brand}
              {viewSwitch}
            </div>
            <div className="min-w-0">
              {activeView === 'workspace' ? (
                <SearchBar compact />
              ) : promptGalleryToolbar ? (
                <PromptGalleryToolbar
                  query={promptGalleryToolbar.query}
                  onQueryChange={promptGalleryToolbar.onQueryChange}
                  compact
                />
              ) : null
            }
            </div>
            <div className="flex items-center gap-3 justify-self-end">
              {actions}
            </div>
          </div>
        </div>
      </header>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </>
  )
}

function ViewButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active
          ? 'bg-[#ff4eb7] text-white shadow-[0_8px_24px_rgba(255,78,183,0.28)]'
          : 'text-white/55 hover:text-white'
      }`}
      aria-pressed={active}
    >
      {label}
    </button>
  )
}

function IconButton({
  children,
  onClick,
  title,
}: {
  children: ReactNode
  onClick: () => void
  title: string
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70 transition hover:border-blush-400/35 hover:bg-blush-400/10 hover:text-white"
      title={title}
    >
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.85}
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        {children}
      </svg>
    </button>
  )
}
