import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import { copyBlobToClipboard, getClipboardFailureMessage } from '../lib/clipboard'
import { useStore } from '../store'

export default function ImageContextMenu() {
  const [menuInfo, setMenuInfo] = useState<{ src: string; x: number; y: number } | null>(null)
  const showToast = useStore((s) => s.showToast)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isEmbeddedPage()) return

    const onContextMenu = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target?.tagName !== 'IMG') return

      const imageTarget = target as HTMLImageElement
      if (!imageTarget.src) return

      event.preventDefault()
      setMenuInfo({
        src: imageTarget.src,
        x: event.clientX,
        y: event.clientY,
      })
    }

    window.addEventListener('contextmenu', onContextMenu)
    return () => window.removeEventListener('contextmenu', onContextMenu)
  }, [])

  useEffect(() => {
    if (!menuInfo) return

    const close = (event: Event) => {
      if (menuRef.current && event.target instanceof Node && menuRef.current.contains(event.target)) {
        return
      }
      if (event.target instanceof Element && event.target.closest('[data-lightbox-root]')) {
        window.dispatchEvent(new Event('image-context-menu-dismiss-lightbox-click'))
      }
      setMenuInfo(null)
    }

    window.addEventListener('mousedown', close, { capture: true })
    window.addEventListener('touchstart', close, { capture: true })
    window.addEventListener('wheel', close, { capture: true })
    window.addEventListener('scroll', close, { capture: true })
    window.addEventListener('resize', close)

    return () => {
      window.removeEventListener('mousedown', close, { capture: true })
      window.removeEventListener('touchstart', close, { capture: true })
      window.removeEventListener('wheel', close, { capture: true })
      window.removeEventListener('scroll', close, { capture: true })
      window.removeEventListener('resize', close)
    }
  }, [menuInfo])

  if (!menuInfo) return null

  const handleCopy = async (event: ReactMouseEvent) => {
    event.stopPropagation()
    setMenuInfo(null)
    try {
      const response = await fetch(menuInfo.src)
      const blob = await response.blob()
      await copyBlobToClipboard(blob)
      showToast('图片已复制', 'success')
    } catch (error) {
      showToast(getClipboardFailureMessage('复制失败', error), 'error')
    }
  }

  const handleDownload = async (event: ReactMouseEvent) => {
    event.stopPropagation()
    setMenuInfo(null)
    try {
      const response = await fetch(menuInfo.src)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      const ext = blob.type.split('/')[1] || 'png'
      anchor.download = `image-${Date.now()}.${ext}`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)
      showToast('已开始下载', 'success')
    } catch {
      showToast('下载失败', 'error')
    }
  }

  let left = menuInfo.x
  let top = menuInfo.y
  const menuWidth = 152
  const menuHeight = 116

  if (left + menuWidth > window.innerWidth) {
    left -= menuWidth
  }
  if (top + menuHeight > window.innerHeight) {
    top -= menuHeight
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] w-[152px] overflow-hidden rounded-[22px] border border-white/10 bg-[#111117]/95 p-1.5 shadow-[0_18px_45px_rgba(0,0,0,0.36)] backdrop-blur-xl animate-fade-in"
      style={{ left, top }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <MenuAction onClick={handleCopy} label="复制图片">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z" />
      </MenuAction>
      <MenuAction onClick={handleDownload} label="下载图片">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4-4 4m0 0-4-4m4 4V4" />
      </MenuAction>
    </div>
  )
}

function MenuAction({
  children,
  label,
  onClick,
}: {
  children: ReactNode
  label: string
  onClick: (event: ReactMouseEvent) => void | Promise<void>
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm text-white/72 transition hover:bg-[#ff4eb7]/10 hover:text-[#ffd2eb]"
    >
      <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {children}
      </svg>
      <span>{label}</span>
    </button>
  )
}

function isEmbeddedPage() {
  try {
    return window.self !== window.top
  } catch {
    return true
  }
}
