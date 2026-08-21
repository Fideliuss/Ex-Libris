import { BOOK_TYPES } from '../lib/bookTypes'
import TagMultiSelect from './TagMultiSelect'

const selectClass =
  'rounded-sm border border-ink/20 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library'

export default function CollectionFilters({
  search,
  onSearchChange,
  selectedTags,
  onSelectedTagsChange,
  tags,
  publisher,
  onPublisherChange,
  publishers,
  collection,
  onCollectionChange,
  collections,
  series,
  onSeriesChange,
  seriesList,
  type,
  onTypeChange,
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

      <TagMultiSelect
        tags={tags}
        selected={selectedTags}
        onChange={onSelectedTagsChange}
        label="Tags :"
      />

      <div className="flex flex-wrap gap-2 items-center">
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
          value={collection}
          onChange={(e) => onCollectionChange(e.target.value)}
          aria-label="Filtrer par collection"
          className={selectClass}
        >
          <option value="">Toutes les collections</option>
          {collections.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={series}
          onChange={(e) => onSeriesChange(e.target.value)}
          aria-label="Filtrer par série"
          className={selectClass}
        >
          <option value="">Toutes les séries</option>
          {seriesList.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={type}
          onChange={(e) => onTypeChange(e.target.value)}
          aria-label="Filtrer par type"
          className={selectClass}
        >
          <option value="">Tous les types</option>
          {Object.entries(BOOK_TYPES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
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
          <option value="wishlist">Souhaité</option>
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
