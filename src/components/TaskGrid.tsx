import { useEffect, useMemo, useRef, useState } from 'react'
import { editOutputs, removeTask, reuseConfig, useStore } from '../store'
import TaskCard from './TaskCard'

export default function TaskGrid() {
  const tasks = useStore((s) => s.tasks)
  const searchQuery = useStore((s) => s.searchQuery)
  const filterStatus = useStore((s) => s.filterStatus)
  const filterFavorite = useStore((s) => s.filterFavorite)
  const setDetailTaskId = useStore((s) => s.setDetailTaskId)
  const setConfirmDialog = useStore((s) => s.setConfirmDialog)
  const selectedTaskIds = useStore((s) => s.selectedTaskIds)
  const setSelectedTaskIds = useStore((s) => s.setSelectedTaskIds)
  const clearSelection = useStore((s) => s.clearSelection)
  const hasOverlayOpen = useStore((s) =>
    Boolean(s.detailTaskId || s.lightboxImageId || s.showSettings || s.confirmDialog),
  )

  const gridRef = useRef<HTMLDivElement>(null)
  const [selectionBox, setSelectionBox] = useState<{
    startX: number
    startY: number
    currentX: number
    currentY: number
  } | null>(null)
  const isDragging = useRef(false)
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const hasDragged = useRef(false)
  const suppressClickUntil = useRef(0)
  const startedOnCard = useRef(false)
  const startedWithCtrl = useRef(false)
  const initialSelection = useRef<string[]>([])
  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform)

  const filteredTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => b.createdAt - a.createdAt)
    const query = searchQuery.trim().toLowerCase()

    return sorted.filter((task) => {
      if (filterFavorite && !task.isFavorite) return false
      const matchStatus = filterStatus === 'all' || task.status === filterStatus
      if (!matchStatus) return false

      if (!query) return true
      const prompt = (task.prompt || '').toLowerCase()
      const paramString = JSON.stringify(task.params).toLowerCase()
      return prompt.includes(query) || paramString.includes(query)
    })
  }, [tasks, searchQuery, filterStatus, filterFavorite])

  const handleDelete = (task: (typeof tasks)[number]) => {
    setConfirmDialog({
      title: '删除作品',
      message: '删除后将无法恢复，这条生成记录及其关联图片都会一并移除。确定继续吗？',
      action: () => removeTask(task),
    })
  }

  const beginSelection = (
    target: HTMLElement,
    clientX: number,
    clientY: number,
    isCtrl: boolean,
  ) => {
    startedOnCard.current = Boolean(target.closest('.task-card-wrapper'))
    startedWithCtrl.current = isCtrl
    initialSelection.current = [...useStore.getState().selectedTaskIds]

    isDragging.current = true
    hasDragged.current = false
    dragStart.current = { x: clientX, y: clientY }
    document.body.classList.add('select-none')
    document.body.classList.add('drag-selecting')
    setSelectionBox({
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
    })
  }

  const updateSelectionFromPoint = (clientX: number, clientY: number) => {
    const start = dragStart.current
    if (!start || !gridRef.current) return

    const minX = Math.min(start.x, clientX)
    const maxX = Math.max(start.x, clientX)
    const minY = Math.min(start.y, clientY)
    const maxY = Math.max(start.y, clientY)

    const cards = gridRef.current.querySelectorAll('.task-card-wrapper')
    const nextSelected = new Set(initialSelection.current)
    const initialSelected = new Set(initialSelection.current)

    cards.forEach((card) => {
      const rect = card.getBoundingClientRect()
      const taskId = card.getAttribute('data-task-id')
      if (!taskId) return

      const isIntersecting =
        minX < rect.right && maxX > rect.left && minY < rect.bottom && maxY > rect.top

      if (isIntersecting) {
        if (initialSelected.has(taskId)) {
          nextSelected.delete(taskId)
        } else {
          nextSelected.add(taskId)
        }
      } else if (!initialSelected.has(taskId)) {
        nextSelected.delete(taskId)
      }
    })

    setSelectedTaskIds(Array.from(nextSelected))
  }

  useEffect(() => {
    const handleDocumentMouseDown = (event: MouseEvent) => {
      if (hasOverlayOpen) return
      if (event.button !== 0) return
      const target = event.target as HTMLElement | null
      if (!target) return
      if (target.closest('[data-input-bar]')) return
      if (target.closest('[data-no-drag-select]')) return
      if (target.closest('button, a, input, textarea, select')) return

      const isCtrl = isMac ? event.metaKey : event.ctrlKey
      beginSelection(target, event.clientX, event.clientY, isCtrl)
    }

    const handleDocumentMouseMove = (event: MouseEvent) => {
      if (!isDragging.current || !dragStart.current) return

      const start = dragStart.current
      const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y)
      if (distance < 6 && !hasDragged.current) return

      hasDragged.current = true
      setSelectionBox({
        startX: start.x,
        startY: start.y,
        currentX: event.clientX,
        currentY: event.clientY,
      })
      updateSelectionFromPoint(event.clientX, event.clientY)
      event.preventDefault()
    }

    const handleDocumentMouseUp = () => {
      if (isDragging.current) {
        document.body.classList.remove('select-none')
        document.body.classList.remove('drag-selecting')
      }

      if (
        isDragging.current &&
        !hasDragged.current &&
        !startedOnCard.current &&
        !startedWithCtrl.current
      ) {
        clearSelection()
      }

      if (isDragging.current && hasDragged.current) {
        suppressClickUntil.current = Date.now() + 250
      }

      isDragging.current = false
      dragStart.current = null
      setSelectionBox(null)
    }

    document.addEventListener('mousedown', handleDocumentMouseDown)
    document.addEventListener('mousemove', handleDocumentMouseMove)
    document.addEventListener('mouseup', handleDocumentMouseUp)

    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown)
      document.removeEventListener('mousemove', handleDocumentMouseMove)
      document.removeEventListener('mouseup', handleDocumentMouseUp)
    }
  }, [clearSelection, hasOverlayOpen, isMac, setSelectedTaskIds])

  if (!filteredTasks.length) {
    const isFiltered = Boolean(searchQuery || filterFavorite || filterStatus !== 'all')

    return (
      <div className="neo-panel overflow-hidden px-6 py-16 text-center">
        <div className="mx-auto flex max-w-md flex-col items-center">
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-2 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
            <img
              src="/image_emp.webp"
              alt="空状态插图"
              className="h-28 w-28 object-cover sm:h-32 sm:w-32"
            />
          </div>
          <h3 className="mt-5 text-xl font-semibold text-white">
            {isFiltered ? '暂时没有符合条件的作品' : '你的画廊还在等待第一张作品'}
          </h3>
          <p className="mt-2 text-sm leading-7 text-gray-400">
            {isFiltered
              ? '可以试试放宽关键词、切换状态筛选，或关闭“仅看收藏”后再看看。'
              : '在右侧控制台输入提示词并开始生成，新作品会自动整理到这里。'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-[50vh]" data-task-grid-root>
      <div
        ref={gridRef}
        className="grid grid-cols-1 justify-items-center gap-4 sm:[grid-template-columns:repeat(auto-fit,minmax(290px,290px))] sm:justify-center"
      >
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="task-card-wrapper w-full max-w-[290px]"
            data-task-id={task.id}
          >
            <TaskCard
              task={task}
              onClick={(event) => {
                if (Date.now() < suppressClickUntil.current) {
                  event.preventDefault()
                  return
                }
                suppressClickUntil.current = 0

                const isCtrl = isMac ? event.metaKey : event.ctrlKey
                if (isCtrl) {
                  useStore.getState().toggleTaskSelection(task.id)
                } else if (selectedTaskIds.length > 0) {
                  clearSelection()
                  setDetailTaskId(task.id)
                } else {
                  setDetailTaskId(task.id)
                }
              }}
              onReuse={() => reuseConfig(task)}
              onEditOutputs={() => editOutputs(task)}
              onDelete={() => handleDelete(task)}
              isSelected={selectedTaskIds.includes(task.id)}
            />
          </div>
        ))}
      </div>

      {selectionBox && (
        <div
          className="pointer-events-none fixed z-[100] border border-[#ff7fc8]/60 bg-[#ff4eb7]/20 shadow-[0_0_0_1px_rgba(255,78,183,0.14)]"
          style={{
            left: Math.min(selectionBox.startX, selectionBox.currentX),
            top: Math.min(selectionBox.startY, selectionBox.currentY),
            width: Math.abs(selectionBox.currentX - selectionBox.startX),
            height: Math.abs(selectionBox.currentY - selectionBox.startY),
          }}
        />
      )}
    </div>
  )
}
