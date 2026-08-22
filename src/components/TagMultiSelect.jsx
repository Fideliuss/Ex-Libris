export default function TagMultiSelect({ tags, selected, onChange, label }) {
  function toggle(tag) {
    onChange(
      selected.includes(tag)
        ? selected.filter((t) => t !== tag)
        : [...selected, tag],
    )
  }

  if (tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      <span className="text-xs text-ink/50 shrink-0">{label}</span>
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => toggle(tag)}
          aria-pressed={selected.includes(tag)}
          className={`text-xs px-2 py-1 rounded-full border focus:outline-none focus-visible:ring-2 focus-visible:ring-library ${
            selected.includes(tag)
              ? 'bg-library text-white border-library'
              : 'border-ink/20 text-ink/70 hover:border-library hover:text-library'
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  )
}
