import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { initStore, useStore } from './store'
import { normalizeBaseUrl } from './lib/api'
import type { ApiMode } from './types'
import type { AppView } from './components/Header'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import TaskGrid from './components/TaskGrid'
import InputBar from './components/InputBar'
import PromptGalleryPage from './components/PromptGalleryPage'
import DetailModal from './components/DetailModal'
import Lightbox from './components/Lightbox'
import SettingsModal from './components/SettingsModal'
import ConfirmDialog from './components/ConfirmDialog'
import Toast from './components/Toast'
import ImageContextMenu from './components/ImageContextMenu'

function getInitialView(): AppView {
  const searchParams = new URLSearchParams(window.location.search)
  return searchParams.get('view') === 'prompt-gallery' || window.location.hash === '#prompt-gallery'
    ? 'prompt-gallery'
    : 'workspace'
}

export default function App() {
  const setSettings = useStore((s) => s.setSettings)
  const setSettingsMode = useStore((s) => s.setSettingsMode)
  const [desktopPanelCollapsed, setDesktopPanelCollapsed] = useState(false)
  const [activeView, setActiveView] = useState<AppView>(getInitialView)
  const [promptGalleryQuery, setPromptGalleryQuery] = useState('')
  const [promptGalleryCategory, setPromptGalleryCategory] = useState('all')

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const nextSettings: {
      baseUrl?: string
      apiKey?: string
      codexCli?: boolean
      apiMode?: ApiMode
    } = {}
    let hasOverrides = false

    const apiUrlParam = searchParams.get('apiUrl')
    if (apiUrlParam !== null) {
      nextSettings.baseUrl = normalizeBaseUrl(apiUrlParam.trim())
      hasOverrides = true
    }

    const apiKeyParam = searchParams.get('apiKey')
    if (apiKeyParam !== null) {
      nextSettings.apiKey = apiKeyParam.trim()
      hasOverrides = true
    }

    const codexCliParam = searchParams.get('codexCli')
    if (codexCliParam !== null) {
      nextSettings.codexCli = codexCliParam.trim().toLowerCase() === 'true'
      hasOverrides = true
    }

    const apiModeParam = searchParams.get('apiMode')
    if (apiModeParam === 'images' || apiModeParam === 'responses') {
      nextSettings.apiMode = apiModeParam
      hasOverrides = true
    }

    if (hasOverrides) {
      setSettings(nextSettings)
      setSettingsMode('custom')
    }

    if (hasOverrides) {
      searchParams.delete('apiUrl')
      searchParams.delete('apiKey')
      searchParams.delete('codexCli')
      searchParams.delete('apiMode')

      const nextSearch = searchParams.toString()
      const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`
      window.history.replaceState(null, '', nextUrl)
    }

    initStore()
  }, [setSettings, setSettingsMode])

  useEffect(() => {
    const preventPageImageDrag = (e: DragEvent) => {
      if ((e.target as HTMLElement | null)?.closest('img')) {
        e.preventDefault()
      }
    }

    document.addEventListener('dragstart', preventPageImageDrag)
    return () => document.removeEventListener('dragstart', preventPageImageDrag)
  }, [])

  useEffect(() => {
    const nextHash = activeView === 'prompt-gallery' ? '#prompt-gallery' : ''
    if (window.location.hash !== nextHash) {
      const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`
      window.history.replaceState(null, '', nextUrl)
    }
  }, [activeView])

  useEffect(() => {
    const syncViewFromHash = () => {
      setActiveView(window.location.hash === '#prompt-gallery' ? 'prompt-gallery' : 'workspace')
    }

    window.addEventListener('hashchange', syncViewFromHash)
    return () => window.removeEventListener('hashchange', syncViewFromHash)
  }, [])

  return (
    <div className="relative isolate min-h-screen bg-obsidian text-gray-100">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[22rem] bg-[linear-gradient(110deg,rgba(109,27,68,0.34)_0%,rgba(109,27,68,0.14)_24%,rgba(9,9,13,0)_58%)]" />
        <div className="absolute bottom-0 right-0 h-[18rem] w-[42rem] bg-[linear-gradient(135deg,rgba(255,142,188,0)_8%,rgba(255,142,188,0.08)_48%,rgba(255,142,188,0.14)_100%)] blur-2xl" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_30%,transparent_70%,rgba(255,255,255,0.02))]" />
      </div>

      <Header
        activeView={activeView}
        onViewChange={setActiveView}
        promptGalleryToolbar={
          activeView === 'prompt-gallery'
            ? {
                query: promptGalleryQuery,
                onQueryChange: setPromptGalleryQuery,
              }
            : undefined
        }
      />

      <main className="safe-area-x relative z-10 mx-auto max-w-[1780px] pb-28 pt-6 lg:pb-10">
        <div
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_var(--composer-width)] lg:items-start"
          style={{ '--composer-width': desktopPanelCollapsed ? '5.75rem' : '22rem' } as CSSProperties}
        >
          <section className="min-w-0 space-y-5">
            {activeView === 'workspace' ? (
              <div className="lg:hidden">
                <SearchBar />
              </div>
            ) : null}

            {activeView === 'workspace' ? (
              <TaskGrid />
            ) : (
              <PromptGalleryPage
                query={promptGalleryQuery}
                selectedCategory={promptGalleryCategory}
                onCategoryChange={setPromptGalleryCategory}
              />
            )}
          </section>

          <InputBar
            desktopCollapsed={desktopPanelCollapsed}
            onToggleDesktopCollapsed={() => setDesktopPanelCollapsed((value) => !value)}
            onSubmitNavigate={() => {
              setActiveView('workspace')
              setDesktopPanelCollapsed(false)
            }}
          />
        </div>
      </main>

      <DetailModal />
      <Lightbox />
      <SettingsModal />
      <ConfirmDialog />
      <Toast />
      <ImageContextMenu />
    </div>
  )
}
