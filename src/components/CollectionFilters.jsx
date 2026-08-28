import { useState } from 'react'
import { BOOK_TYPES } from '../lib/bookTypes'
import TagMultiSelect from './TagMultiSelect'

const selectClass =
  'w-full rounded-sm border border-ink/20 bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library'

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
  universe,
  onUniverseChange,
  universeList,
  type,
  onTypeChange,
  status,
  onStatusChange,
  hasActiveFilters,
  onReset,
}) {
  const activeCount =
    [publisher, collection, series, universe, type, status].filter(Boolean)
      .length + (selectedTags.length > 0 ? 1 : 0)
  const [expanded, setExpanded] = useState(() => hasActiveFilters)

  return (
    <div className="mb-6 space-y-3">
      <input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Rechercher par titre, auteur ou ISBN…"
        aria-label="Rechercher par titre, auteur ou ISBN"
        className="w-full rounded-sm border border-ink/20 bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="rounded-sm border border-ink/20 px-3 py-2 text-sm text-ink/70 hover:border-library hover:text-library focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
        >
          Filtres{activeCount > 0 && ` (${activeCount})`}{' '}
          <span aria-hidden="true">{expanded ? '▴' : '▾'}</span>
        </button>
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

      {expanded && (
        <div className="space-y-4 border-t border-ink/10 pt-4">
          {tags.length > 0 && (
            <TagMultiSelect
              tags={tags}
              selected={selectedTags}
              onChange={onSelectedTagsChange}
              label="Tags :"
            />
          )}

          <FilterSection label="Catégorisation">
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

            {universeList.length > 0 && (
              <select
                value={universe}
                onChange={(e) => onUniverseChange(e.target.value)}
                aria-label="Filtrer par univers"
                className={selectClass}
              >
                <option value="">Tous les univers</option>
                {universeList.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            )}
          </FilterSection>

          <FilterSection label="Type &amp; statut">
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
              <option value="wishlist">Wishlist</option>
              <option value="to-read">À lire</option>
              <option value="reading">En cours</option>
              <option value="read">Lu</option>
            </select>
          </FilterSection>
        </div>
      )}
    </div>
  )
}

function FilterSection({ label, children }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-2">
        {label}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{children}</div>
    </div>
  )
}
