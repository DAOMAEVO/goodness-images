import { useCallback, useEffect, useRef, useState } from 'react'

interface Option {
  label: string
  value: string | number
}

interface SelectProps {
  value: string | number
  onChange: (value: string | number) => void
  options: Option[]
  disabled?: boolean
  className?: string
}

export default function Select({
  value,
  onChange,
  options,
  disabled,
  className,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const selectedOption = options.find((option) => option.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = useCallback(
    (event: React.MouseEvent) => {
      if (disabled) return
      event.stopPropagation()

      if (!isOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        const spaceAbove = rect.top
        const spaceBelow = window.innerHeight - rect.bottom
        const estimatedMenuHeight = Math.min(options.length * 40 + 16, 260)
        setOpenUp(spaceAbove > spaceBelow && spaceAbove > estimatedMenuHeight)
      }

      setIsOpen((value) => !value)
    },
    [disabled, isOpen, options.length],
  )

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        ref={triggerRef}
        onClick={handleToggle}
        className={`flex w-full cursor-pointer select-none items-center justify-between gap-2 ${className ?? ''} ${
          disabled ? '!cursor-not-allowed !opacity-45' : ''
        }`}
      >
        <span className="truncate">{selectedOption?.label ?? value}</span>
        <svg
          className={`h-4 w-4 flex-shrink-0 text-white/42 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 9 6 6 6-6" />
        </svg>
      </div>

      {isOpen ? (
        <div
          className={`absolute z-50 w-full overflow-hidden rounded-[22px] border border-white/10 bg-[#15151b] p-1.5 shadow-[0_18px_45px_rgba(0,0,0,0.42)] ring-1 ring-white/6 ${
            openUp ? 'bottom-full mb-2 animate-dropdown-up' : 'top-full mt-2 animate-dropdown-down'
          }`}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`w-full rounded-2xl px-3 py-2.5 text-left text-sm transition ${
                option.value === value
                  ? 'bg-[#ff4eb7]/12 text-[#ffd2eb]'
                  : 'text-white/70 hover:bg-white/6 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
