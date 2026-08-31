function tabClass(active) {
  return `rounded-full px-4 py-1.5 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-library ${
    active
      ? 'bg-library-fill text-white'
      : 'border border-ink/20 text-ink/70 hover:border-library hover:text-library'
  }`
}

export default function TabBar({ tabs, active, onChange, ariaLabel }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={active === tab.key}
          title={tab.title}
          onClick={() => onChange(tab.key)}
          className={tabClass(active === tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
