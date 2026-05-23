import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { addImageFromFile, removeMultipleTasks, submitTask, updateTaskInStore, useStore } from '../store'
import { DEFAULT_PARAMS } from '../types'
import { normalizeImageSize } from '../lib/size'
import Select from './Select'
import SizePickerModal from './SizePickerModal'

const API_MAX_IMAGES = 16

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return isMobile
}

interface InputBarProps {
  desktopCollapsed: boolean
  onToggleDesktopCollapsed: () => void
  onSubmitNavigate?: () => void
}

export default function InputBar({
  desktopCollapsed,
  onToggleDesktopCollapsed,
  onSubmitNavigate,
}: InputBarProps) {
  const prompt = useStore((s) => s.prompt)
  const setPrompt = useStore((s) => s.setPrompt)
  const inputImages = useStore((s) => s.inputImages)
  const moveInputImage = useStore((s) => s.moveInputImage)
  const removeInputImage = useStore((s) => s.removeInputImage)
  const clearInputImages = useStore((s) => s.clearInputImages)
  const params = useStore((s) => s.params)
  const setParams = useStore((s) => s.setParams)
  const settings = useStore((s) => s.settings)
  const settingsMode = useStore((s) => s.settingsMode)
  const setShowSettings = useStore((s) => s.setShowSettings)
  const setLightboxImageId = useStore((s) => s.setLightboxImageId)
  const setConfirmDialog = useStore((s) => s.setConfirmDialog)
  const selectedTaskIds = useStore((s) => s.selectedTaskIds)
  const setSelectedTaskIds = useStore((s) => s.setSelectedTaskIds)
  const clearSelection = useStore((s) => s.clearSelection)
  const tasks = useStore((s) => s.tasks)
  const filterStatus = useStore((s) => s.filterStatus)
  const filterFavorite = useStore((s) => s.filterFavorite)
  const searchQuery = useStore((s) => s.searchQuery)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showSizePicker, setShowSizePicker] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState(false)
  const [submitHover, setSubmitHover] = useState(false)
  const [attachHover, setAttachHover] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragImageIndex, setDragImageIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [touchDragPreview, setTouchDragPreview] = useState<{ src: string; x: number; y: number } | null>(null)
  const [outputCompressionInput, setOutputCompressionInput] = useState(
    params.output_compression == null ? '' : String(params.output_compression),
  )
  const [nInput, setNInput] = useState(String(params.n))
  const dragCounter = useRef(0)
  const touchDragRef = useRef<{ index: number | null; startX: number; startY: number; moved: boolean }>({
    index: null,
    startX: 0,
    startY: 0,
    moved: false,
  })
  const suppressImageClickRef = useRef(false)
  const isMobile = useIsMobile()

  const filteredTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => b.createdAt - a.createdAt)
    const query = searchQuery.trim().toLowerCase()

    return sorted.filter((task) => {
      if (filterFavorite && !task.isFavorite) return false
      const matchStatus = filterStatus === 'all' || task.status === filterStatus
      if (!matchStatus) return false
      if (!query) return true
      const promptText = (task.prompt || '').toLowerCase()
      const paramText = JSON.stringify(task.params).toLowerCase()
      return promptText.includes(query) || paramText.includes(query)
    })
  }, [tasks, searchQuery, filterStatus, filterFavorite])

  const canSubmit = Boolean(prompt.trim() && settings.apiKey)
  const atImageLimit = inputImages.length >= API_MAX_IMAGES

  useEffect(() => {
    setOutputCompressionInput(
      params.output_compression == null ? '' : String(params.output_compression),
    )
  }, [params.output_compression])

  useEffect(() => {
    setNInput(String(params.n))
  }, [params.n])

  useEffect(() => {
    if (settings.apiMode === 'responses' && params.moderation !== 'auto') {
      setParams({ moderation: 'auto' })
    }
  }, [params.moderation, setParams, settings.apiMode])

  useEffect(() => {
    if (settings.codexCli && params.quality !== 'auto') {
      setParams({ quality: 'auto' })
    }
  }, [params.quality, setParams, settings.codexCli])

  useEffect(() => {
    const element = textareaRef.current
    if (!element) return
    element.style.height = '0px'
    const nextHeight = Math.min(Math.max(element.scrollHeight, 150), 320)
    element.style.height = `${nextHeight}px`
  }, [prompt, inputImages.length])

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items
      if (!items) return
      const imageFiles: File[] = []
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) imageFiles.push(file)
        }
      }
      if (imageFiles.length > 0) {
        event.preventDefault()
        void handleFiles(imageFiles)
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  })

  useEffect(() => {
    const handleDragEnter = (event: DragEvent) => {
      event.preventDefault()
      dragCounter.current += 1
      if (event.dataTransfer?.types.includes('Files')) {
        setIsDragging(true)
      }
    }

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault()
    }

    const handleDragLeave = (event: DragEvent) => {
      event.preventDefault()
      dragCounter.current -= 1
      if (dragCounter.current <= 0) {
        dragCounter.current = 0
        setIsDragging(false)
      }
    }

    const handleDrop = (event: DragEvent) => {
      event.preventDefault()
      dragCounter.current = 0
      setIsDragging(false)
      const files = event.dataTransfer?.files
      if (files?.length) {
        void handleFiles(files)
      }
    }

    document.addEventListener('dragenter', handleDragEnter)
    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('dragleave', handleDragLeave)
    document.addEventListener('drop', handleDrop)

    return () => {
      document.removeEventListener('dragenter', handleDragEnter)
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('dragleave', handleDragLeave)
      document.removeEventListener('drop', handleDrop)
    }
  }, [inputImages.length])

  const handleFiles = async (files: FileList | File[]) => {
    try {
      const currentCount = useStore.getState().inputImages.length
      if (currentCount >= API_MAX_IMAGES) {
        useStore.getState().showToast(`参考图上限为 ${API_MAX_IMAGES} 张`, 'error')
        return
      }

      const remaining = API_MAX_IMAGES - currentCount
      const accepted = Array.from(files).filter((file) => file.type.startsWith('image/'))
      const toAdd = accepted.slice(0, remaining)
      const dropped = accepted.length - toAdd.length

      for (const file of toAdd) {
        await addImageFromFile(file)
      }

      if (dropped > 0) {
        useStore.getState().showToast(`已达到上限，${dropped} 张图片未添加`, 'error')
      }
    } catch (error) {
      useStore
        .getState()
        .showToast(`图片添加失败：${error instanceof Error ? error.message : String(error)}`, 'error')
    }
  }

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    await handleFiles(event.target.files || [])
    event.target.value = ''
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      handleSubmit()
    }
  }

  const handleSubmit = useCallback(() => {
    if (!settings.apiKey) {
      setShowSettings(true)
      return
    }
    if (!prompt.trim()) return
    onSubmitNavigate?.()
    void submitTask()
  }, [onSubmitNavigate, prompt, setShowSettings, settings.apiKey])

  const handleSelectAllToggle = useCallback(() => {
    if (selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0) {
      clearSelection()
    } else {
      setSelectedTaskIds(filteredTasks.map((task) => task.id))
    }
  }, [clearSelection, filteredTasks, selectedTaskIds.length, setSelectedTaskIds])

  const handleToggleFavorite = useCallback(() => {
    const selectedTasks = tasks.filter((task) => selectedTaskIds.includes(task.id))
    const allFavorite = selectedTasks.length > 0 && selectedTasks.every((task) => task.isFavorite)
    const nextFavoriteState = !allFavorite

    setConfirmDialog({
      title: nextFavoriteState ? '批量收藏' : '批量取消收藏',
      message: nextFavoriteState
        ? `确定要收藏选中的 ${selectedTaskIds.length} 条记录吗？`
        : `确定要取消收藏选中的 ${selectedTaskIds.length} 条记录吗？`,
      confirmText: nextFavoriteState ? '确认收藏' : '确认取消',
      action: () => {
        selectedTaskIds.forEach((id) => {
          updateTaskInStore(id, { isFavorite: nextFavoriteState })
        })
        clearSelection()
      },
    })
  }, [clearSelection, selectedTaskIds, setConfirmDialog, tasks])

  const handleDeleteSelected = useCallback(() => {
    setConfirmDialog({
      title: '批量删除',
      message: `确定要删除选中的 ${selectedTaskIds.length} 条记录吗？`,
      action: () => {
        void removeMultipleTasks(selectedTaskIds)
      },
    })
  }, [selectedTaskIds, setConfirmDialog])

  const commitOutputCompression = useCallback(() => {
    if (outputCompressionInput.trim() === '') {
      setOutputCompressionInput('')
      setParams({ output_compression: null })
      return
    }

    const nextValue = Number(outputCompressionInput)
    if (Number.isNaN(nextValue)) {
      setOutputCompressionInput(
        params.output_compression == null ? '' : String(params.output_compression),
      )
      return
    }

    setOutputCompressionInput(String(nextValue))
    setParams({ output_compression: nextValue })
  }, [outputCompressionInput, params.output_compression, setParams])

  const commitN = useCallback(() => {
    const nextValue = Number(nInput)
    const normalizedValue =
      nInput.trim() === '' ? DEFAULT_PARAMS.n : Number.isNaN(nextValue) ? params.n : nextValue
    setNInput(String(normalizedValue))
    setParams({ n: normalizedValue })
  }, [nInput, params.n, setParams])

  const selectionToolbar =
    selectedTaskIds.length > 0 ? (
      <div className="pointer-events-auto mb-3 flex justify-center lg:mb-4">
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-[#111117]/94 p-1.5 shadow-[0_18px_45px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <ToolbarIconButton title="取消选择" onClick={clearSelection}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
          </ToolbarIconButton>
          <ToolbarDivider />
          <ToolbarIconButton
            title={
              selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0
                ? '取消全选'
                : '全选当前可见'
            }
            onClick={handleSelectAllToggle}
          >
            {selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0 ? (
              <>
                <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
                <path d="m8.5 12 2.4 2.4L15.8 9.5" />
              </>
            ) : (
              <path strokeDasharray="4 3" d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z" />
            )}
          </ToolbarIconButton>
          <ToolbarDivider />
          <ToolbarIconButton title="收藏/取消收藏" onClick={handleToggleFavorite} tone="amber">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.05 2.93c.3-.92 1.6-.92 1.9 0l1.52 4.67a1 1 0 0 0 .95.7h4.91c.97 0 1.38 1.24.59 1.81l-3.98 2.88a1 1 0 0 0-.36 1.12l1.52 4.67c.3.92-.76 1.69-1.54 1.12l-3.97-2.89a1 1 0 0 0-1.18 0l-3.97 2.89c-.78.57-1.84-.2-1.54-1.12l1.52-4.67a1 1 0 0 0-.36-1.12L2.07 10.1c-.79-.57-.38-1.81.59-1.81h4.91a1 1 0 0 0 .95-.7l1.52-4.67Z"
            />
          </ToolbarIconButton>
          <ToolbarDivider />
          <ToolbarIconButton title="删除选中" onClick={handleDeleteSelected} tone="red">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7 18.1 19.1A2 2 0 0 1 16.1 21H7.9a2 2 0 0 1-2-1.9L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" />
          </ToolbarIconButton>
        </div>
      </div>
    ) : null

  const parameterFields = (
    <div className="grid grid-cols-2 gap-3">
      <Field label="尺寸">
        <button
          type="button"
          onClick={() => setShowSizePicker(true)}
          className="panel-field panel-button justify-between text-left font-mono"
          title="选择尺寸"
        >
          <span>{normalizeImageSize(params.size) || DEFAULT_PARAMS.size}</span>
          <ChevronIcon />
        </button>
      </Field>

      <Field label="质量">
        <Select
          value={settings.codexCli ? 'auto' : params.quality}
          onChange={(value) => {
            if (!settings.codexCli) setParams({ quality: value as typeof params.quality })
          }}
          options={[
            { label: 'auto', value: 'auto' },
            { label: 'low', value: 'low' },
            { label: 'medium', value: 'medium' },
            { label: 'high', value: 'high' },
          ]}
          disabled={settings.codexCli}
          className="panel-field text-sm text-white"
        />
      </Field>

      <Field label="格式">
        <Select
          value={params.output_format}
          onChange={(value) => setParams({ output_format: value as typeof params.output_format })}
          options={[
            { label: 'PNG', value: 'png' },
            { label: 'JPEG', value: 'jpeg' },
            { label: 'WebP', value: 'webp' },
          ]}
          className="panel-field text-sm text-white"
        />
      </Field>

      <Field label="压缩率">
        <input
          value={outputCompressionInput}
          onChange={(event) => setOutputCompressionInput(event.target.value)}
          onBlur={commitOutputCompression}
          disabled={params.output_format === 'png'}
          type="number"
          min={0}
          max={100}
          placeholder="0 - 100"
          className={`panel-field ${params.output_format === 'png' ? 'cursor-not-allowed opacity-45' : ''}`}
        />
      </Field>

      <Field label="审核">
        <Select
          value={settings.apiMode === 'responses' ? 'auto' : params.moderation}
          onChange={(value) => {
            if (settings.apiMode !== 'responses') {
              setParams({ moderation: value as typeof params.moderation })
            }
          }}
          options={[
            { label: 'auto', value: 'auto' },
            { label: 'low', value: 'low' },
          ]}
          disabled={settings.apiMode === 'responses'}
          className="panel-field text-sm text-white"
        />
      </Field>

      <Field label="数量">
        <input
          value={nInput}
          onChange={(event) => setNInput(event.target.value)}
          onBlur={commitN}
          type="number"
          min={1}
          max={4}
          className="panel-field"
        />
      </Field>
    </div>
  )

  const hintText = settings.codexCli
    ? 'Codex CLI 模式下质量固定为 auto。'
    : settings.apiMode === 'responses'
    ? 'Responses API 下审核参数固定为 auto。'
    : '支持拖入参考图、Ctrl/⌘ + Enter 快速生成。'

  const resetImageDragState = useCallback(() => {
    setDragImageIndex(null)
    setDragOverIndex(null)
    setTouchDragPreview(null)
    touchDragRef.current = {
      index: null,
      startX: 0,
      startY: 0,
      moved: false,
    }
  }, [])

  const getTouchDropIndex = useCallback((touch: { clientX: number; clientY: number }) => {
    const target = document
      .elementFromPoint(touch.clientX, touch.clientY)
      ?.closest<HTMLElement>('[data-input-image-index]')

    if (!target) return null

    const index = Number(target.dataset.inputImageIndex)
    if (!Number.isInteger(index)) return null

    const rect = target.getBoundingClientRect()
    return touch.clientX < rect.left + rect.width / 2 ? index : index + 1
  }, [])

  const imageThumbs = inputImages.length > 0 && (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="panel-label">参考图</span>
        <button
          type="button"
          onClick={() =>
            setConfirmDialog({
              title: '清空参考图',
              message: `确定要清空全部 ${inputImages.length} 张参考图吗？`,
              action: () => clearInputImages(),
            })
          }
          className="text-xs text-white/45 transition hover:text-red-200"
        >
          全部清空
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {inputImages.map((image, index) => (
          <div
            key={image.id}
            data-input-image-index={index}
            className={`group relative transition-opacity ${dragImageIndex === index ? 'opacity-45' : ''}`}
            draggable
            onDragStart={(event) => {
              setDragImageIndex(index)
              event.dataTransfer.effectAllowed = 'move'
              event.dataTransfer.setData('text/plain', String(index))
            }}
            onDragOver={(event) => {
              event.preventDefault()
              event.dataTransfer.dropEffect = 'move'
              if (dragImageIndex === null || dragImageIndex === index) return
              const rect = event.currentTarget.getBoundingClientRect()
              const dropIndex = event.clientX < rect.left + rect.width / 2 ? index : index + 1
              setDragOverIndex(dropIndex)
            }}
            onDrop={(event) => {
              event.preventDefault()
              if (dragImageIndex === null) return
              const rect = event.currentTarget.getBoundingClientRect()
              const rawDropIndex = event.clientX < rect.left + rect.width / 2 ? index : index + 1
              const nextIndex = dragImageIndex < rawDropIndex ? rawDropIndex - 1 : rawDropIndex
              moveInputImage(dragImageIndex, nextIndex)
              setDragImageIndex(null)
              setDragOverIndex(null)
            }}
            onDragEnd={() => {
              setDragImageIndex(null)
              setDragOverIndex(null)
            }}
            onTouchStart={(event) => {
              const touch = event.touches[0]
              touchDragRef.current = {
                index,
                startX: touch.clientX,
                startY: touch.clientY,
                moved: false,
              }
            }}
            onTouchMove={(event) => {
              const current = touchDragRef.current
              if (current.index === null) return

              const touch = event.touches[0]
              const deltaX = touch.clientX - current.startX
              const deltaY = touch.clientY - current.startY

              if (!current.moved && Math.hypot(deltaX, deltaY) < 8) return

              current.moved = true
              suppressImageClickRef.current = true
              event.preventDefault()
              setDragImageIndex(current.index)
              setTouchDragPreview({
                src: image.dataUrl,
                x: touch.clientX,
                y: touch.clientY,
              })

              const nextDropIndex = getTouchDropIndex(touch)
              setDragOverIndex(nextDropIndex)
            }}
            onTouchEnd={() => {
              const current = touchDragRef.current
              if (current.index !== null && current.moved && dragOverIndex !== null) {
                const nextIndex = current.index < dragOverIndex ? dragOverIndex - 1 : dragOverIndex
                moveInputImage(current.index, nextIndex)
              }

              window.setTimeout(() => {
                suppressImageClickRef.current = false
              }, 0)
              resetImageDragState()
            }}
            onTouchCancel={() => {
              suppressImageClickRef.current = false
              resetImageDragState()
            }}
          >
            {dragOverIndex === index && dragImageIndex !== index ? (
              <div className="pointer-events-none absolute -left-1 top-1/2 z-10 h-12 w-0.5 -translate-y-1/2 rounded-full bg-[#ff4eb7]" />
            ) : null}
            <button
              type="button"
              onClick={() => {
                if (suppressImageClickRef.current) return
                setLightboxImageId(image.id, inputImages.map((item) => item.id))
              }}
              className="h-16 w-full cursor-grab overflow-hidden rounded-[18px] border border-white/10 bg-black/30 active:cursor-grabbing"
            >
              <img src={image.dataUrl} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
            </button>
            <button
              type="button"
              onClick={() => removeInputImage(index)}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#17171f] text-white/80 opacity-0 transition group-hover:opacity-100"
              title="移除参考图"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
            {dragOverIndex === inputImages.length && index === inputImages.length - 1 && dragImageIndex !== index ? (
              <div className="pointer-events-none absolute -right-1 top-1/2 z-10 h-12 w-0.5 -translate-y-1/2 rounded-full bg-[#ff4eb7]" />
            ) : null}
          </div>
        ))}
      </div>
      {touchDragPreview ? createPortal(
        <div
          className="pointer-events-none fixed z-[140] h-16 w-16 overflow-hidden rounded-[18px] border border-white/20 shadow-[0_18px_40px_rgba(0,0,0,0.35)] opacity-90"
          style={{
            left: touchDragPreview.x,
            top: touchDragPreview.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <img src={touchDragPreview.src} alt="" className="h-full w-full object-cover" />
        </div>,
        document.body,
      ) : null}
    </div>
  )

  const promptField = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="prompt-input" className="panel-label">
          提示词
        </label>
        <span className="text-[11px] text-white/30">Ctrl/⌘ + Enter</span>
      </div>
      <textarea
        id="prompt-input"
        ref={textareaRef}
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="描述你想生成的画面、镜头、光线、人物状态或材质细节…"
        className="min-h-[150px] w-full resize-none rounded-[24px] border border-white/10 bg-[#141418] px-4 py-4 text-sm leading-7 text-white placeholder:text-white/24 focus:border-[#ff3db6] focus:outline-none focus:ring-2 focus:ring-[#ff4eb7]/18"
      />
    </div>
  )

  const panelBody = (
    <div className="space-y-5">
      {promptField}
      {imageThumbs}
      {parameterFields}
      <div className="rounded-[20px] border border-white/10 bg-black/18 px-4 py-3 text-xs leading-6 text-white/52">
        {hintText}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => !atImageLimit && fileInputRef.current?.click()}
          onMouseEnter={() => setAttachHover(true)}
          onMouseLeave={() => setAttachHover(false)}
          className={`panel-action ${atImageLimit ? 'cursor-not-allowed opacity-45' : ''}`}
          title={atImageLimit ? `已达上限 ${API_MAX_IMAGES} 张` : '添加参考图'}
        >
          <span>添加参考图</span>
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          onMouseEnter={() => setSubmitHover(true)}
          onMouseLeave={() => setSubmitHover(false)}
          disabled={settings.apiKey ? !canSubmit : false}
          className={`panel-submit ${settings.apiKey ? '' : 'bg-white/15 text-white'} ${
            settings.apiKey && !canSubmit ? 'cursor-not-allowed opacity-45' : ''
          }`}
          title={settings.apiKey ? '生成图像' : '请先配置 API'}
        >
          <span>{settings.apiKey ? '开始生成' : '配置 API'}</span>
        </button>
      </div>

      {!settings.apiKey && submitHover ? (
        <div className="rounded-[18px] border border-[#ff96d5]/20 bg-[#ff4eb7]/12 px-4 py-3 text-xs text-[#ffd2eb]">
          还没有配置 API Key。点击“配置 API”即可在设置中完成接入。
        </div>
      ) : null}

      {atImageLimit && attachHover ? (
        <div className="rounded-[18px] border border-red-400/18 bg-red-500/10 px-4 py-3 text-xs text-red-100">
          参考图已达到 {API_MAX_IMAGES} 张上限，请先移除部分图片。
        </div>
      ) : null}
    </div>
  )

  return (
    <>
      {isDragging && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 backdrop-blur-md">
          <div className="rounded-[32px] border border-[#ff8dcf]/24 bg-[#111117]/92 px-10 py-9 text-center shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
            <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full border ${atImageLimit ? 'border-red-300/30 bg-red-500/10 text-red-200' : 'border-[#ff95d4]/30 bg-[#ff4eb7]/14 text-[#ffd3eb]'}`}>
              <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {atImageLimit ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M18.36 18.36A9 9 0 0 0 5.64 5.64m12.72 12.72A9 9 0 0 1 5.64 5.64m12.72 12.72L5.64 5.64" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M4 16 8.59 11.41a2 2 0 0 1 2.82 0L16 16m-2-2 1.59-1.59a2 2 0 0 1 2.82 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
                )}
              </svg>
            </div>
            <h3 className="mt-5 text-lg font-semibold text-white">
              {atImageLimit ? '参考图数量已满' : '释放以添加参考图'}
            </h3>
            <p className="mt-2 text-sm text-white/55">
              {atImageLimit ? `最多支持 ${API_MAX_IMAGES} 张参考图。` : '支持 JPG、PNG、WebP 等常见图片格式。'}
            </p>
          </div>
        </div>
      )}

      {showSizePicker && (
        <SizePickerModal
          currentSize={params.size}
          onSelect={(size) => setParams({ size })}
          onClose={() => setShowSizePicker(false)}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />

      <aside className="hidden self-start lg:sticky lg:top-[5.5rem] lg:block">
        <div data-input-bar className="space-y-4">
          {selectionToolbar}

          {desktopCollapsed ? (
            <div className="neo-panel overflow-hidden px-3 py-4">
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={onToggleDesktopCollapsed}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-white/72 transition hover:border-[#ff91d2]/40 hover:bg-[#ff4eb7]/12 hover:text-white"
                  title="展开控制面板"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 5 7 7-7 7" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => !atImageLimit && fileInputRef.current?.click()}
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-white/72 transition hover:border-white/18 hover:text-white ${atImageLimit ? 'cursor-not-allowed opacity-40' : ''}`}
                  title="添加参考图"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m-7-7h14" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={settings.apiKey ? !canSubmit : false}
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ff4eb7,#ff7fc8)] text-white shadow-[0_14px_34px_rgba(255,78,183,0.32)] transition ${settings.apiKey && !canSubmit ? 'cursor-not-allowed opacity-45' : 'hover:brightness-110'}`}
                  title={settings.apiKey ? '开始生成' : '配置 API'}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0-5 5m5-5H6" />
                  </svg>
                </button>

                {settingsMode === 'custom' && (
                <button
                  type="button"
                  onClick={() => setShowSettings(true)}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-white/72 transition hover:border-white/18 hover:text-white"
                  title="设置"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.33 4.32c.42-1.76 2.92-1.76 3.35 0a1.72 1.72 0 0 0 2.57 1.06c1.54-.94 3.31.83 2.37 2.37a1.72 1.72 0 0 0 1.07 2.57c1.75.42 1.75 2.92 0 3.34a1.72 1.72 0 0 0-1.07 2.58c.94 1.54-.83 3.3-2.37 2.36a1.72 1.72 0 0 0-2.57 1.07c-.43 1.75-2.93 1.75-3.35 0a1.72 1.72 0 0 0-2.57-1.07c-1.54.94-3.31-.82-2.37-2.36a1.72 1.72 0 0 0-1.06-2.58c-1.76-.42-1.76-2.92 0-3.34a1.72 1.72 0 0 0 1.06-2.57c-.94-1.54.83-3.31 2.37-2.37.99.61 2.3.07 2.57-1.06Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                </button>
                )}
              </div>
            </div>
          ) : (
            <div data-input-bar className="neo-panel overflow-hidden px-4 py-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">创作控制台</h2>
                </div>
                <button
                  type="button"
                  onClick={onToggleDesktopCollapsed}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-white/70 transition hover:border-[#ff91d2]/40 hover:bg-[#ff4eb7]/12 hover:text-white"
                  title="收起控制面板"
                >
                  <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m15 19-7-7 7-7" />
                  </svg>
                </button>
              </div>

              {panelBody}
            </div>
          )}
        </div>
      </aside>

      <div className="lg:hidden">
        <div data-input-bar className="fixed inset-x-0 bottom-0 z-30 px-3 pb-3">
          {selectionToolbar}
          <div className="rounded-[28px] border border-white/10 bg-[#111117]/92 shadow-[0_24px_70px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-3 px-4 py-4">
              <button
                type="button"
                onClick={() => setMobileExpanded((value) => !value)}
                className="flex min-w-0 flex-1 items-center justify-between text-left"
              >
                <div>
                  <div className="text-sm font-medium text-white">
                    {mobileExpanded ? '收起控制面板' : '展开控制面板'}
                  </div>
                </div>
                <svg
                  className={`h-5 w-5 flex-shrink-0 text-white/55 transition-transform ${mobileExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 9 6 6 6-6" />
                </svg>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={settings.apiKey ? !canSubmit : false}
                  className={`rounded-full bg-[linear-gradient(135deg,#ff4eb7,#ff7fc8)] px-4 py-2 text-sm font-medium text-white ${settings.apiKey && !canSubmit ? 'opacity-45' : ''}`}
                >
                  生成
                </button>
              </div>
            </div>

            {mobileExpanded ? (
              <div className="space-y-5 border-t border-white/8 px-4 pb-4 pt-4">
                {panelBody}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="panel-label">{label}</span>
      {children}
    </label>
  )
}

function ActionIcon({ children }: { children: ReactNode }) {
  return (
    <svg className="h-4.5 w-4.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {children}
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg className="h-4 w-4 text-white/42" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 5 7 7-7 7" />
    </svg>
  )
}

function ToolbarIconButton({
  children,
  onClick,
  title,
  tone = 'default',
}: {
  children: ReactNode
  onClick: () => void
  title: string
  tone?: 'default' | 'amber' | 'red'
}) {
  const toneClass =
    tone === 'amber'
      ? 'text-yellow-300 hover:bg-yellow-400/12 hover:text-yellow-100'
      : tone === 'red'
      ? 'text-red-200 hover:bg-red-500/12 hover:text-red-100'
      : 'text-white/68 hover:bg-white/8 hover:text-white'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-full transition ${toneClass}`}
      title={title}
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {children}
      </svg>
    </button>
  )
}

function ToolbarDivider() {
  return <div className="h-5 w-px bg-white/10" />
}
