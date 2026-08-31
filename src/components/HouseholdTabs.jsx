function tabClass(active) {
  return `rounded-full px-4 py-1.5 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-library ${
    active
      ? 'bg-library-fill text-white'
      : 'border border-ink/20 text-ink/70 hover:border-library hover:text-library'
  }`
}

export default function HouseholdTabs({
  isMine,
  onSelectMine,
  onSelectPartner,
  mineLabel,
  partnerLabel,
  ariaLabel,
}) {
  return (
    <div className="flex gap-2 mb-6" role="tablist" aria-label={ariaLabel}>
      <button
        type="button"
        role="tab"
        aria-selected={isMine}
        onClick={onSelectMine}
        className={tabClass(isMine)}
      >
        {mineLabel}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={!isMine}
        onClick={onSelectPartner}
        className={tabClass(!isMine)}
      >
        {partnerLabel}
      </button>
    </div>
  )
}
