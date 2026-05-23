import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { useCloseOnEscape } from '../hooks/useCloseOnEscape'

interface HelpModalProps {
  onClose: () => void
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return isMobile
}

export default function HelpModal({ onClose }: HelpModalProps) {
  const isMobile = useIsMobile()
  useCloseOnEscape(true, onClose)

  const guides = [
    {
      id: '01',
      title: '多选记录',
      description: isMobile
        ? '在移动端卡片上左右滑动，可以快速切换这条作品的选中状态。'
        : '桌面端支持拖拽框选，也支持按住 Ctrl / Cmd 后逐个点击卡片进行增减选择。',
      hint: isMobile ? '适合快速挑图' : '适合连续挑选多张作品',
    },
    {
      id: '02',
      title: '批量操作',
      description:
        '选中作品后，页面会出现批量工具条，可以统一收藏、删除，或一键选中当前筛选结果。',
      hint: '批量整理会更高效',
    },
    {
      id: '03',
      title: '右侧控制台',
      description:
        '桌面端右侧面板负责提示词、参考图和参数配置；移动端会折叠为底部抽屉。',
      hint: '生成前建议先确认尺寸、模型和参考图',
    },
    {
      id: '04',
      title: '快捷生成',
      description:
        '输入提示词后可以直接点击“开始生成”，也可以使用 Ctrl / Cmd + Enter 快速提交。',
      hint: '适合连续调词和反复试稿',
    },
  ]

  return createPortal(
    <div
      data-no-drag-select
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/72 backdrop-blur-md animate-overlay-in" />

      <div
        className="relative z-10 flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-[32px] border border-[#3e66b7]/70 bg-[radial-gradient(circle_at_top_left,rgba(255,78,183,0.14),transparent_28%),linear-gradient(180deg,rgba(19,19,28,0.98),rgba(12,12,18,0.98))] shadow-[0_30px_90px_rgba(0,0,0,0.52)] ring-1 ring-white/10 animate-modal-in"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-white/10 px-6 pb-6 pt-6 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="panel-kicker text-white/45">Guide</div>
              <h3 className="mt-2 text-2xl font-semibold text-white sm:text-[30px]">操作指南</h3>
              <p className="mt-3 text-sm leading-7 text-white/75 sm:text-[15px]">
                快速了解作品筛选、多选整理和右侧控制台的使用方式，第一次上手也能直接开始生成。
              </p>
            </div>

            <button
              onClick={onClose}
              className="rounded-full border border-white/12 bg-white/8 p-2 text-white/70 transition hover:border-white/20 hover:bg-white/12 hover:text-white"
              aria-label="关闭"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <QuickTip
              label="适用场景"
              value={isMobile ? '移动端浏览与挑图' : '桌面端批量整理与生成'}
            />
            <QuickTip label="快捷键" value="Ctrl / Cmd + Enter 提交生成" />
            <QuickTip label="建议顺序" value="先配参数，再生成，再批量整理" />
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-6 sm:px-7">
          <div className="grid gap-4 lg:grid-cols-2">
            {guides.map((guide) => (
              <GuideBlock
                key={guide.id}
                id={guide.id}
                title={guide.title}
                description={guide.description}
                hint={guide.hint}
              />
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function QuickTip({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="text-[11px] uppercase tracking-[0.24em] text-white/50">{label}</div>
      <div className="mt-2 text-sm font-medium leading-6 text-white/90">{value}</div>
    </div>
  )
}

function GuideBlock({
  description,
  hint,
  id,
  title,
}: {
  description: string
  hint: string
  id: string
  title: string
}) {
  return (
    <section className="group rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.075),rgba(255,255,255,0.04))] p-5 transition hover:border-[#ff8ccf]/30 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.095),rgba(255,255,255,0.05))]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-[#ff9bd7]">{id}</div>
          <h4 className="mt-3 text-lg font-semibold text-white">{title}</h4>
        </div>
        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#ff4eb7] shadow-[0_0_18px_rgba(255,78,183,0.6)]" />
      </div>

      <p className="mt-4 text-sm leading-8 text-white/80">{description}</p>

      <div className="mt-5 inline-flex max-w-full items-center rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs text-white/65">
        {hint}
      </div>
    </section>
  )
}
