const selectClass =
  'rounded-sm border border-ink/20 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library'

export default function CollectionFilters({
  search,
  onSearchChange,
  tag,
  onTagChange,
  tags,
  publisher,
  onPublisherChange,
  publishers,
  status,
  onStatusChange,
  hasActiveFilters,
  onReset,
}) {
  return (
    <div className="mb-6 space-y-3">
      <input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Rechercher par titre ou auteur…"
        aria-label="Rechercher par titre ou auteur"
        className="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
      />

      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={tag}
          onChange={(e) => onTagChange(e.target.value)}
          aria-label="Filtrer par tag"
          className={selectClass}
        >
          <option value="">Tous les tags</option>
          {tags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          value={publisher}
          onChange={(e) => onPublisherChange(e.target.value)}
          aria-label="Filtrer par éditeur"
          className={selectClass}
        >
          <option value="">Tous les éditeurs</option>
          {publishers.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label="Filtrer par statut"
          className={selectClass}
        >
          <option value="">Tous les statuts</option>
          <option value="to-read">À lire</option>
          <option value="reading">En cours</option>
          <option value="read">Lu</option>
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-sm text-ink/50 hover:text-stamp underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
          >
            Réinitialiser
          </button>
        )}
      </div>
    </div>
  )
}
