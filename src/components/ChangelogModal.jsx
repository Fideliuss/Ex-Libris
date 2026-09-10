import { primaryButtonClass } from '../lib/ui'

export default function ChangelogModal({ entries, onClose }) {
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
        className="relative w-full max-w-sm max-h-[80vh] overflow-y-auto bg-card border-t-4 border-dashed border-brass rounded-sm shadow-xl p-7"
      >
        <p className="font-mono text-[10px] uppercase tracking-widest text-brass mb-4">
          Quoi de neuf
        </p>
        <div className="space-y-6 mb-6">
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              className={i > 0 ? 'pt-5 border-t border-dashed border-ink/15' : ''}
            >
              <h2 className="font-serif text-lg font-semibold mb-3">{entry.title}</h2>
              <ul className="space-y-2.5">
                {entry.items.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-sm text-ink/70 leading-relaxed"
                  >
                    <span className="text-brass shrink-0" aria-hidden="true">
                      &bull;
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
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
