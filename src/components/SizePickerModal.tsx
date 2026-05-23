import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { calculateImageSize, normalizeImageSize, parseRatio, type SizeTier } from '../lib/size'

const TIERS: SizeTier[] = ['1K', '2K', '4K']
const SIZE_LIMIT_TEXT =
  '最终输出会自动规整到模型可接受的尺寸：宽高均为 16 的倍数，最大边长 3840px，宽高比不超过 3:1，总像素限制为 655360 - 8294400。'
const RATIOS = [
  { label: '1:1', value: '1:1' },
  { label: '3:2', value: '3:2' },
  { label: '2:3', value: '2:3' },
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
  { label: '4:3', value: '4:3' },
  { label: '3:4', value: '3:4' },
  { label: '21:9', value: '21:9' },
]

interface Props {
  currentSize: string
  onSelect: (size: string) => void
  onClose: () => void
}

type Mode = 'auto' | 'ratio' | 'resolution'

function parseSize(size: string) {
  const match = size.match(/^\s*(\d+)\s*[xX×]\s*(\d+)\s*$/)
  if (!match) return null
  return { width: match[1], height: match[2] }
}

function findPresetForSize(size: string) {
  const normalized = normalizeImageSize(size)
  for (const tier of TIERS) {
    for (const ratio of RATIOS) {
      if (calculateImageSize(tier, ratio.value) === normalized) {
        return { tier, ratio: ratio.value }
      }
    }
  }
  return null
}

export default function SizePickerModal({ currentSize, onSelect, onClose }: Props) {
  const currentPreset = findPresetForSize(currentSize)
  const currentParsedSize = parseSize(currentSize)
  const [mode, setMode] = useState<Mode>(() => {
    if (!currentSize || currentSize === 'auto') return 'auto'
    if (currentPreset) return 'ratio'
    return 'resolution'
  })
  const [tier, setTier] = useState<SizeTier>(currentPreset?.tier ?? '1K')
  const [ratio, setRatio] = useState(currentPreset?.ratio ?? '1:1')
  const [customRatio, setCustomRatio] = useState('16:9')
  const [customWidth, setCustomWidth] = useState(currentParsedSize?.width ?? '1024')
  const [customHeight, setCustomHeight] = useState(currentParsedSize?.height ?? '1024')
  const [hintVisible, setHintVisible] = useState(false)
  const hintTimerRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (hintTimerRef.current != null) window.clearTimeout(hintTimerRef.current)
    },
    [],
  )

  const activeRatio = ratio === 'custom' ? customRatio : ratio
  const parsedCustomRatio = parseRatio(customRatio)
  const customRatioValid = ratio !== 'custom' || Boolean(parsedCustomRatio)
  const customRatioClamped = Boolean(
    ratio === 'custom' &&
      parsedCustomRatio &&
      Math.max(parsedCustomRatio.width, parsedCustomRatio.height) /
        Math.min(parsedCustomRatio.width, parsedCustomRatio.height) >
        3,
  )

  const previewSize = useMemo(() => {
    if (mode === 'auto') return 'auto'

    if (mode === 'ratio') {
      const size = calculateImageSize(tier, activeRatio)
      return size ? normalizeImageSize(size) : ''
    }

    const width = parseInt(customWidth, 10)
    const height = parseInt(customHeight, 10)
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      return normalizeImageSize(`${width}x${height}`)
    }
    return ''
  }, [activeRatio, customHeight, customWidth, mode, tier])

  const isClamped = useMemo(() => {
    if (!previewSize || previewSize === 'auto') return false
    if (mode === 'ratio' && ratio === 'custom') return customRatioClamped
    if (mode === 'resolution') {
      const width = parseInt(customWidth, 10)
      const height = parseInt(customHeight, 10)
      if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
        return `${width}x${height}` !== previewSize
      }
    }
    return false
  }, [customHeight, customRatioClamped, customWidth, mode, previewSize, ratio])

  const showHint = () => setHintVisible(true)
  const hideHint = () => {
    setHintVisible(false)
    if (hintTimerRef.current != null) {
      window.clearTimeout(hintTimerRef.current)
      hintTimerRef.current = null
    }
  }
  const startHintTouch = () => {
    hintTimerRef.current = window.setTimeout(() => {
      setHintVisible(true)
      hintTimerRef.current = null
    }, 420)
  }

  const applySize = () => {
    if (!previewSize) return
    onSelect(previewSize)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-overlay-in" />
      <div
        className="relative z-10 w-full max-w-2xl rounded-[34px] border border-white/10 bg-[#111117]/96 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)] ring-1 ring-white/6 animate-modal-in"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="panel-kicker">Size</div>
            <h3 className="mt-2 text-2xl font-semibold text-white">设置图像尺寸</h3>
            <p className="mt-2 text-sm text-white/50">当前值：{currentSize || 'auto'}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/6 p-2 text-white/58 transition hover:border-white/16 hover:text-white"
            aria-label="关闭"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex rounded-[18px] border border-white/10 bg-white/5 p-1.5">
            {[
              ['auto', '自动'],
              ['ratio', '按比例'],
              ['resolution', '自定义宽高'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value as Mode)}
                className={`flex-1 rounded-[14px] px-3 py-2 text-sm transition ${
                  mode === value
                    ? 'bg-[linear-gradient(135deg,#ff4eb7,#ff7fc8)] text-white'
                    : 'text-white/58 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === 'auto' ? (
            <div className="rounded-[28px] border border-white/10 bg-black/18 px-6 py-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#ff9bd7]/24 bg-[#ff4eb7]/12 text-[#ffd3eb]">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7Z" />
                </svg>
              </div>
              <h4 className="mt-4 text-lg font-medium text-white">自动尺寸</h4>
              <p className="mt-2 text-sm leading-7 text-white/54">
                不向模型传递具体分辨率，由模型根据提示词和输入内容自行决定输出尺寸。
              </p>
            </div>
          ) : null}

          {mode === 'ratio' ? (
            <div className="space-y-5">
              <section>
                <div className="panel-label mb-3">基础分辨率</div>
                <div className="grid grid-cols-3 gap-3">
                  {TIERS.map((item) => (
                    <ChoiceButton key={item} active={tier === item} onClick={() => setTier(item)}>
                      {item}
                    </ChoiceButton>
                  ))}
                </div>
              </section>

              <section>
                <div className="panel-label mb-3">图像比例</div>
                <div className="grid grid-cols-4 gap-3">
                  {RATIOS.map((item) => (
                    <ChoiceButton
                      key={item.value}
                      active={ratio === item.value}
                      onClick={() => setRatio(item.value)}
                    >
                      {item.label}
                    </ChoiceButton>
                  ))}
                  <ChoiceButton active={ratio === 'custom'} onClick={() => setRatio('custom')} className="col-span-4">
                    自定义比例
                  </ChoiceButton>
                </div>
              </section>

              {ratio === 'custom' ? (
                <label className="flex flex-col gap-2">
                  <span className="panel-label">输入比例</span>
                  <input
                    value={customRatio}
                    onChange={(event) => setCustomRatio(event.target.value)}
                    placeholder="例如 5:4 / 2.39:1"
                    className={`panel-field ${
                      customRatioValid ? '' : 'border-red-400/28 text-red-100'
                    }`}
                  />
                </label>
              ) : null}
            </div>
          ) : null}

          {mode === 'resolution' ? (
            <div className="space-y-5">
              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4">
                <label className="flex flex-col gap-2">
                  <span className="panel-label">宽度</span>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(event) => setCustomWidth(event.target.value)}
                    className="panel-field"
                    placeholder="1024"
                  />
                </label>
                <div className="pb-3 text-white/24">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </div>
                <label className="flex flex-col gap-2">
                  <span className="panel-label">高度</span>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(event) => setCustomHeight(event.target.value)}
                    className="panel-field"
                    placeholder="1024"
                  />
                </label>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-xs leading-6 text-white/54">
                {SIZE_LIMIT_TEXT}
              </div>
            </div>
          ) : null}

          <div className="rounded-[24px] border border-white/10 bg-black/18 px-4 py-4">
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/30">Preview</div>
            <div className="mt-3 flex items-center gap-3">
              <span className="font-mono text-2xl font-semibold text-white">
                {previewSize || '尺寸无效'}
              </span>
              {isClamped ? (
                <div
                  className="relative"
                  onMouseEnter={showHint}
                  onMouseLeave={hideHint}
                  onTouchStart={startHintTouch}
                  onTouchEnd={hideHint}
                  onTouchCancel={hideHint}
                >
                  <svg className="h-5 w-5 cursor-pointer text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86 1.82 18A2 2 0 0 0 3.53 21h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                  </svg>
                  {hintVisible ? (
                    <div className="absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 rounded-[18px] border border-white/10 bg-[#111117] px-3 py-2 text-center text-xs leading-6 text-white/76 shadow-[0_14px_30px_rgba(0,0,0,0.28)]">
                      {SIZE_LIMIT_TEXT}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-[18px] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/72 transition hover:bg-white/10 hover:text-white"
          >
            取消
          </button>
          <button
            onClick={applySize}
            disabled={!previewSize}
            className="flex-1 rounded-[18px] bg-[linear-gradient(135deg,#ff4eb7,#ff7fc8)] px-4 py-3 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  )
}

function ChoiceButton({
  active,
  children,
  className = '',
  onClick,
}: {
  active: boolean
  children: ReactNode
  className?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[18px] border px-3 py-3 text-sm transition ${
        active
          ? 'border-[#ff9bd7]/24 bg-[#ff4eb7]/12 text-[#ffd3eb]'
          : 'border-white/10 bg-white/5 text-white/62 hover:text-white'
      } ${className}`}
    >
      {children}
    </button>
  )
}
