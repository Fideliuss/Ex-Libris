import { useTheme } from '../hooks/useTheme'

const OPTIONS = [
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
  { value: 'system', label: 'Système' },
]

export default function ThemeToggle() {
  const [theme, setTheme] = useTheme()

  return (
    <div
      role="group"
      aria-label="Thème"
      className="inline-flex rounded-sm border border-ink/20 overflow-hidden text-sm"
    >
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          aria-pressed={theme === value}
          className={`px-3 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-library ${
            theme === value
              ? 'bg-library text-white'
              : 'text-ink/60 hover:text-ink'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
