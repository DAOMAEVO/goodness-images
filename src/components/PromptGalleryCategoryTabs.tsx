interface PromptGalleryCategoryTabsProps {
  selectedCategory: string
  onCategoryChange: (value: string) => void
  categories: string[]
}

export default function PromptGalleryCategoryTabs({
  selectedCategory,
  onCategoryChange,
  categories,
}: PromptGalleryCategoryTabsProps) {
  return (
    <div className="sticky top-[4.9rem] z-20 pb-3 pt-1 lg:top-[5.85rem]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[linear-gradient(180deg,rgba(8,8,13,0.96)_0%,rgba(8,8,13,0.86)_72%,rgba(8,8,13,0)_100%)]" />
      <div className="relative mx-auto w-full max-w-[1210px] overflow-x-auto">
        <div className="flex min-w-max items-center gap-4">
          <CategoryTab
            active={selectedCategory === 'all'}
            label="全部"
            onClick={() => onCategoryChange('all')}
          />
          {categories.map((category) => (
            <CategoryTab
              key={category}
              active={selectedCategory === category}
              label={category}
              onClick={() => onCategoryChange(category)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function CategoryTab({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-11 flex-shrink-0 items-center rounded-full px-5 text-[14px] font-medium transition ${
        active
          ? 'bg-white text-[#09090d] shadow-[0_12px_30px_rgba(255,255,255,0.14)]'
          : 'bg-transparent text-white/62 hover:text-white'
      }`}
      aria-pressed={active}
    >
      {label}
    </button>
  )
}
