import { useStore } from '../store'
import { useCloseOnEscape } from '../hooks/useCloseOnEscape'

export default function ConfirmDialog() {
  const confirmDialog = useStore((s) => s.confirmDialog)
  const setConfirmDialog = useStore((s) => s.setConfirmDialog)

  const handleClose = () => setConfirmDialog(null)

  const handleCancel = () => {
    confirmDialog?.cancelAction?.()
    handleClose()
  }

  useCloseOnEscape(Boolean(confirmDialog), handleClose)

  if (!confirmDialog) return null

  const isDestructive =
    confirmDialog.title.includes('删除') || confirmDialog.title.includes('清空')
  const confirmText = confirmDialog.confirmText ?? (isDestructive ? '确认删除' : '确认')

  return (
    <div
      data-no-drag-select
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-md animate-overlay-in" />
      <div
        className="relative z-10 w-full max-w-md rounded-[30px] border border-white/10 bg-[#111117]/95 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] ring-1 ring-white/6 animate-confirm-in"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 inline-flex items-center rounded-full border border-[#ff9bd7]/20 bg-[#ff4eb7]/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#ffd3eb]">
          Confirm
        </div>
        <h3 className="text-xl font-semibold text-white">{confirmDialog.title}</h3>
        <p
          className={`mt-3 text-sm leading-7 text-white/66 ${
            confirmDialog.messageAlign === 'center' ? 'text-center' : ''
          }`}
        >
          {confirmDialog.message}
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 rounded-[18px] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/72 transition hover:bg-white/10 hover:text-white"
          >
            取消
          </button>
          <button
            onClick={() => {
              confirmDialog.action()
              setConfirmDialog(null)
            }}
            className={`flex-1 rounded-[18px] px-4 py-3 text-sm font-medium text-white transition ${
              isDestructive
                ? 'bg-[linear-gradient(135deg,#ff6a8d,#ff4f5e)] hover:brightness-110'
                : 'bg-[linear-gradient(135deg,#ff4eb7,#ff7fc8)] hover:brightness-110'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
