import { primaryButtonClass } from '../lib/ui'

export default function ChangelogModal({ entry, onClose }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Quoi de neuf"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-ink/86 flex items-center justify-center p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-card border-t-4 border-dashed border-brass rounded-sm shadow-xl p-7"
      >
        <p className="font-mono text-[10px] uppercase tracking-widest text-brass mb-1">
          Quoi de neuf
        </p>
        <h2 className="font-serif text-lg font-semibold mb-4">{entry.title}</h2>
        <ul className="space-y-2.5 mb-6">
          {entry.items.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-ink/70 leading-relaxed">
              <span className="text-brass shrink-0" aria-hidden="true">
                &bull;
              </span>
              {item}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onClose}
          className={`w-full rounded-sm px-4 py-2.5 text-sm ${primaryButtonClass}`}
        >
          Compris
        </button>
      </div>
    </div>
  )
}
