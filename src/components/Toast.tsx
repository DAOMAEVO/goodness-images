import { createPortal } from 'react-dom'
import { useStore } from '../store'

export default function Toast() {
  const toast = useStore((s) => s.toast)

  if (!toast) return null

  const icon =
    toast.type === 'success' ? (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="m5 13 4 4L19 7" />
    ) : toast.type === 'error' ? (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18 18 6M6 6l12 12" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    )

  const accentClass =
    toast.type === 'success'
      ? 'from-emerald-400/22 to-emerald-300/8 text-emerald-100'
      : toast.type === 'error'
      ? 'from-red-500/20 to-red-400/8 text-red-100'
      : 'from-[#ff4eb7]/18 to-[#ffb0d9]/10 text-[#ffd5ed]'

  return createPortal(
    <div className="fixed bottom-5 left-1/2 z-[10000] -translate-x-1/2 pointer-events-none toast-enter">
      <div
        className={`flex max-w-[calc(100vw-32px)] items-center gap-3 rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(17,17,23,0.96),rgba(17,17,23,0.88))] px-5 py-3 text-sm shadow-[0_18px_45px_rgba(0,0,0,0.3)] backdrop-blur-xl ring-1 ring-white/6 sm:max-w-[min(30rem,70vw)]`}
      >
        <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${accentClass}`}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {icon}
          </svg>
        </span>
        <span className="leading-6 text-white/78">{toast.message}</span>
      </div>
    </div>,
    document.body,
  )
}
