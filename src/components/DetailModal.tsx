import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { copyBlobToClipboard, copyTextToClipboard, getClipboardFailureMessage } from '../lib/clipboard'
import { ActualValueBadge, DetailParamValue } from '../lib/paramDisplay'
import { formatImageRatio } from '../lib/size'
import { useCloseOnEscape } from '../hooks/useCloseOnEscape'
import {
  editOutputs,
  ensureImageCached,
  getCachedImage,
  removeTask,
  retryTask,
  reuseConfig,
  showCodexCliPrompt,
  updateTaskInStore,
  useStore,
} from '../store'

export default function DetailModal() {
  const tasks = useStore((s) => s.tasks)
  const detailTaskId = useStore((s) => s.detailTaskId)
  const setDetailTaskId = useStore((s) => s.setDetailTaskId)
  const setLightboxImageId = useStore((s) => s.setLightboxImageId)
  const setConfirmDialog = useStore((s) => s.setConfirmDialog)
  const showToast = useStore((s) => s.showToast)

  const [imageIndex, setImageIndex] = useState(0)
  const [imageSrcs, setImageSrcs] = useState<Record<string, string>>({})
  const [imageRatios, setImageRatios] = useState<Record<string, string>>({})
  const [imageSizes, setImageSizes] = useState<Record<string, string>>({})

  const task = useMemo(
    () => tasks.find((item) => item.id === detailTaskId) ?? null,
    [detailTaskId, tasks],
  )

  useCloseOnEscape(Boolean(task), () => setDetailTaskId(null))

  useEffect(() => {
    setImageIndex(0)
  }, [detailTaskId])

  useEffect(() => {
    if (!task) return
    const ids = [...(task.outputImages || []), ...(task.inputImageIds || [])]
    ids.forEach((id) => {
      const cached = getCachedImage(id)
      if (cached) {
        setImageSrcs((prev) => ({ ...prev, [id]: cached }))
      } else {
        ensureImageCached(id).then((url) => {
          if (url) {
            setImageSrcs((prev) => ({ ...prev, [id]: url }))
          }
        })
      }
    })
  }, [task])

  const currentOutputImageId = task?.outputImages?.[imageIndex] || ''
  const currentOutputImageSrc = currentOutputImageId ? imageSrcs[currentOutputImageId] || '' : ''

  useEffect(() => {
    if (!currentOutputImageId || !currentOutputImageSrc) return

    let cancelled = false
    const image = new Image()
    image.onload = () => {
      if (cancelled || image.naturalWidth <= 0 || image.naturalHeight <= 0) return
      setImageRatios((prev) => ({
        ...prev,
        [currentOutputImageId]: formatImageRatio(image.naturalWidth, image.naturalHeight),
      }))
      setImageSizes((prev) => ({
        ...prev,
        [currentOutputImageId]: `${image.naturalWidth}×${image.naturalHeight}`,
      }))
    }
    image.src = currentOutputImageSrc

    if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
      setImageRatios((prev) => ({
        ...prev,
        [currentOutputImageId]: formatImageRatio(image.naturalWidth, image.naturalHeight),
      }))
      setImageSizes((prev) => ({
        ...prev,
        [currentOutputImageId]: `${image.naturalWidth}×${image.naturalHeight}`,
      }))
    }

    return () => {
      cancelled = true
    }
  }, [currentOutputImageId, currentOutputImageSrc])

  if (!task) return null

  const outputLen = task.outputImages?.length || 0
  const currentImageRatio = currentOutputImageId ? imageRatios[currentOutputImageId] : ''
  const currentImageSize = currentOutputImageId ? imageSizes[currentOutputImageId] : ''
  const currentActualParams = currentOutputImageId
    ? task.actualParamsByImage?.[currentOutputImageId]
    : undefined
  const currentRevisedPrompt = currentOutputImageId
    ? task.revisedPromptByImage?.[currentOutputImageId]?.trim()
    : ''
  const showRevisedPrompt = Boolean(currentRevisedPrompt && currentRevisedPrompt !== task.prompt.trim())
  const promptWarningKind = !currentOutputImageId
    ? null
    : showRevisedPrompt
    ? 'revised'
    : !currentRevisedPrompt
    ? 'missing'
    : null
  const showPromptWarning = Boolean(promptWarningKind)
  const promptWarningMessage =
    promptWarningKind === 'revised'
      ? '接口返回的提示词与原始输入不同。'
      : promptWarningKind === 'missing'
      ? '接口没有返回提示词校验信息。'
      : ''
  const aggregateActualParams = outputLen > 0 ? { ...task.actualParams, n: outputLen } : task.actualParams

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleString('zh-CN')
  }

  const formatDuration = () => {
    if (task.elapsed == null) return null
    const seconds = Math.floor(task.elapsed / 1000)
    const minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
    const remainingSeconds = String(seconds % 60).padStart(2, '0')
    return `${minutes}:${remainingSeconds}`
  }

  const handleReuse = () => {
    reuseConfig(task)
    setDetailTaskId(null)
  }

  const handleEdit = () => {
    editOutputs(task)
    setDetailTaskId(null)
  }

  const handleDelete = () => {
    setDetailTaskId(null)
    setConfirmDialog({
      title: '删除记录',
      message: '确定要删除这条记录吗？关联图片在没有其他引用时也会一并清理。',
      action: () => removeTask(task),
    })
  }

  const handleToggleFavorite = () => {
    updateTaskInStore(task.id, { isFavorite: !task.isFavorite })
  }

  const handleCopyError = async () => {
    const errorText = task.error || '生成失败'
    try {
      await copyTextToClipboard(errorText)
      showToast('报错信息已复制', 'success')
    } catch (error) {
      showToast(getClipboardFailureMessage('复制报错失败', error), 'error')
    }
  }

  const handleCopyPrompt = async () => {
    if (!task.prompt) return
    try {
      await copyTextToClipboard(task.prompt)
      showToast('提示词已复制', 'success')
    } catch (error) {
      showToast(getClipboardFailureMessage('复制提示词失败', error), 'error')
    }
  }

  const handleShowPromptWarning = () => {
    showCodexCliPrompt(
      true,
      promptWarningKind === 'revised'
        ? '接口返回的提示词被改写了'
        : '接口没有返回官方 API 应返回的部分提示词信息',
    )
  }

  const handleCopyInputImage = async () => {
    const imageId = task.inputImageIds?.[0]
    const src = imageId ? imageSrcs[imageId] : ''
    if (!src) return
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      await copyBlobToClipboard(blob)
      showToast('参考图已复制', 'success')
    } catch (error) {
      showToast(getClipboardFailureMessage('复制参考图失败', error), 'error')
    }
  }

  const handleRetry = () => {
    void retryTask(task)
    setDetailTaskId(null)
  }

  return (
    <div
      data-no-drag-select
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={() => setDetailTaskId(null)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-overlay-in" />
      <div
        className="relative z-10 flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[34px] border border-white/10 bg-[#111117]/95 shadow-[0_32px_90px_rgba(0,0,0,0.48)] ring-1 ring-white/6 animate-modal-in md:flex-row"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative flex min-h-[22rem] w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,78,183,0.18),_transparent_45%),linear-gradient(180deg,#12121a,#09090d)] md:min-h-0 md:w-[54%]">
          {task.status === 'done' && outputLen > 0 && (
            <>
              <img
                src={currentOutputImageSrc}
                alt=""
                className="max-h-full max-w-full cursor-pointer object-contain p-6"
                onClick={() => setLightboxImageId(task.outputImages[imageIndex], task.outputImages)}
              />
              <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                {currentImageRatio ? <MetaPill>{currentImageRatio}</MetaPill> : null}
                {currentImageSize ? <MetaPill tone="muted">{currentImageSize}</MetaPill> : null}
                {formatDuration() ? <MetaPill tone="pink">{formatDuration()}</MetaPill> : null}
              </div>

              {outputLen > 1 && (
                <>
                  <button
                    onClick={() => setImageIndex((imageIndex - 1 + outputLen) % outputLen)}
                    className="absolute left-5 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-black/36 p-2 text-white/80 backdrop-blur-sm transition hover:border-[#ff91d2]/38 hover:text-white"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m15 19-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setImageIndex((imageIndex + 1) % outputLen)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-black/36 p-2 text-white/80 backdrop-blur-sm transition hover:border-[#ff91d2]/38 hover:text-white"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 5 7 7-7 7" />
                    </svg>
                  </button>
                  <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/42 px-3 py-1 text-xs text-white/82 backdrop-blur-sm">
                    {imageIndex + 1} / {outputLen}
                  </span>
                </>
              )}
            </>
          )}

          {task.status === 'running' && (
            <div className="flex flex-col items-center gap-4 text-white">
              <div className="h-12 w-12 rounded-full border border-[#ff93d4]/28 border-t-[#ff78c7] animate-spin" />
              <div className="text-sm uppercase tracking-[0.22em] text-[#ffd0ea]">生成中</div>
            </div>
          )}

          {task.status === 'error' && (
            <div className="mx-auto max-w-md px-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-red-400/24 bg-red-500/12 text-red-200">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m0 3h.01M10.29 3.86 1.82 18A2 2 0 0 0 3.53 21h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                </svg>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">生成失败</h3>
              <p className="mt-2 break-all text-sm leading-7 text-red-100/84">
                {task.error || '接口没有返回可用结果。'}
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyError}
                  className="rounded-full border border-red-300/18 bg-red-500/10 px-4 py-2 text-sm text-red-100 transition hover:bg-red-500/16"
                >
                  复制完整报错
                </button>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="rounded-full border border-[#70d6ff]/18 bg-[#70d6ff]/10 px-4 py-2 text-sm text-[#cbf1ff] transition hover:brightness-110"
                >
                  重试任务
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative flex-1 overflow-y-auto p-6 md:p-7">
          <button
            onClick={() => setDetailTaskId(null)}
            className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/6 p-2 text-white/60 transition hover:border-white/16 hover:text-white"
            aria-label="关闭"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="space-y-6">
            <div>
              <div className="panel-kicker">Prompt</div>
              <div className="mt-3 flex items-center gap-2">
                <h3 className="text-xl font-semibold text-white">提示词</h3>
                {task.prompt ? (
                  <RoundIconButton onClick={handleCopyPrompt} title="复制提示词">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z" />
                  </RoundIconButton>
                ) : null}
                {showPromptWarning ? (
                  <RoundIconButton
                    onClick={handleShowPromptWarning}
                    tone="warning"
                    title={promptWarningKind === 'revised' ? '提示词被接口改写' : '提示词信息未返回'}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86 1.82 18A2 2 0 0 0 3.53 21h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                  </RoundIconButton>
                ) : null}
              </div>
              <div className="mt-3 rounded-[24px] border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-white/74">
                {task.prompt || '无提示词'}
              </div>
              {showPromptWarning ? (
                <div className="mt-3 rounded-[22px] border border-amber-300/18 bg-amber-400/10 px-4 py-3 text-sm leading-6 text-amber-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-amber-100">
                        {promptWarningKind === 'revised' ? '提示词已被接口改写' : '未返回提示词校验信息'}
                      </div>
                      <p className="mt-1 text-amber-50/82">{promptWarningMessage}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleShowPromptWarning}
                      className="shrink-0 rounded-full border border-amber-200/18 bg-black/16 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-black/28"
                    >
                      兼容模式说明
                    </button>
                  </div>
                </div>
              ) : null}
              {showRevisedPrompt && currentRevisedPrompt ? (
                <div className="mt-3">
                  <ActualValueBadge
                    value={currentRevisedPrompt}
                    className="max-w-full rounded-[20px] border border-[#ff9bd7]/18 bg-[#ff4eb7]/10 px-3 py-2 text-left text-xs leading-6 text-[#ffd3eb] whitespace-pre-wrap"
                  />
                </div>
              ) : null}
            </div>

            {task.inputImageIds?.length ? (
              <div>
                <div className="flex items-center gap-2">
                  <div className="panel-kicker">Reference</div>
                  <RoundIconButton onClick={handleCopyInputImage} title="复制参考图">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z" />
                  </RoundIconButton>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-3">
                  {task.inputImageIds.map((imageId) => (
                    <button
                      key={imageId}
                      type="button"
                      onClick={() => setLightboxImageId(imageId, task.inputImageIds)}
                      className="overflow-hidden rounded-[18px] border border-white/10 bg-black/24"
                    >
                      <img
                        src={imageSrcs[imageId] || ''}
                        alt=""
                        className="h-16 w-full object-cover transition duration-300 hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <div className="panel-kicker">Parameters</div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <ParameterCard label="尺寸">
                  <DetailParamValue task={task} paramKey="size" className="font-medium" actualParams={currentActualParams} />
                </ParameterCard>
                <ParameterCard label="质量">
                  <DetailParamValue task={task} paramKey="quality" className="font-medium" actualParams={currentActualParams} />
                </ParameterCard>
                <ParameterCard label="格式">
                  <DetailParamValue task={task} paramKey="output_format" className="font-medium" actualParams={currentActualParams} />
                </ParameterCard>
                <ParameterCard label="审核">
                  <DetailParamValue task={task} paramKey="moderation" className="font-medium" actualParams={currentActualParams} />
                </ParameterCard>
                <ParameterCard label="数量">
                  <DetailParamValue task={task} paramKey="n" className="font-medium" actualParams={aggregateActualParams} />
                </ParameterCard>
                {task.params.output_compression != null ? (
                  <ParameterCard label="压缩率">
                    <DetailParamValue task={task} paramKey="output_compression" className="font-medium" actualParams={currentActualParams} />
                  </ParameterCard>
                ) : null}
              </div>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-black/16 px-4 py-3 text-xs leading-6 text-white/46">
              <span>创建于 {formatTime(task.createdAt)}</span>
              {formatDuration() ? <span> · 耗时 {formatDuration()}</span> : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ActionButton onClick={handleReuse} tone="pink">
                复用配置
              </ActionButton>
              {task.status === 'error' ? (
                <ActionButton onClick={handleRetry} tone="blue">
                  重试任务
                </ActionButton>
              ) : (
                <ActionButton onClick={handleEdit} tone="blue" disabled={!outputLen}>
                  编辑输出
                </ActionButton>
              )}
              <ActionButton onClick={handleDelete} tone="red">
                删除记录
              </ActionButton>
              <button
                onClick={handleToggleFavorite}
                className={`rounded-[18px] border px-4 py-3 text-sm font-medium transition ${
                  task.isFavorite
                    ? 'border-[#ff9bd7]/25 bg-[#ff4eb7]/12 text-[#ffd2eb]'
                    : 'border-white/10 bg-white/6 text-white/70 hover:border-[#ff9bd7]/24 hover:text-white'
                }`}
              >
                {task.isFavorite ? '取消收藏' : '收藏记录'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
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
      ? 'border-[#ff9bd7]/24 bg-[#ff4eb7]/12 text-[#ffd2eb]'
      : tone === 'muted'
      ? 'border-white/10 bg-black/24 text-white/78'
      : 'border-white/10 bg-black/28 text-white'

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${toneClass}`}>
      {children}
    </span>
  )
}

function ParameterCard({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/78">
      <div className="text-[11px] uppercase tracking-[0.24em] text-white/34">{label}</div>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function RoundIconButton({
  children,
  onClick,
  title,
  tone = 'default',
}: {
  children: ReactNode
  onClick: () => void
  title: string
  tone?: 'default' | 'warning'
}) {
  const toneClass =
    tone === 'warning'
      ? 'border-amber-300/40 bg-amber-400/12 text-amber-200 hover:border-amber-200/60 hover:bg-amber-400/18 hover:text-amber-100'
      : 'border-white/10 bg-white/6 text-white/54 hover:border-[#ff9bd7]/24 hover:text-white'

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${toneClass}`}
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {children}
      </svg>
    </button>
  )
}

function ActionButton({
  children,
  disabled,
  onClick,
  tone,
}: {
  children: ReactNode
  disabled?: boolean
  onClick: () => void
  tone: 'pink' | 'blue' | 'red'
}) {
  const toneClass =
    tone === 'pink'
      ? 'bg-[linear-gradient(135deg,#ff4eb7,#ff7fc8)] text-white'
      : tone === 'blue'
      ? 'border border-[#70d6ff]/18 bg-[#70d6ff]/10 text-[#cbf1ff]'
      : 'border border-red-400/18 bg-red-500/10 text-red-100'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-[18px] px-4 py-3 text-sm font-medium transition ${
        disabled ? 'cursor-not-allowed opacity-40' : 'hover:brightness-110'
      } ${toneClass}`}
    >
      {children}
    </button>
  )
}
