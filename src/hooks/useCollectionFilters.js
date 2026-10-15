import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { safeLocal } from '../lib/safeStorage'

// Filtres simples : nom côté code -> nom du paramètre d'URL.
const PARAM_BY_FILTER = {
  search: 'q',
  publisher: 'publisher',
  author: 'author',
  collection: 'collection',
  edition: 'edition',
  series: 'series',
  universe: 'universe',
  type: 'type',
  status: 'status',
}

const FILTER_NAMES = Object.keys(PARAM_BY_FILTER)

// Tout ce que "Réinitialiser les filtres" efface (ni le tri ni l'onglet).
const RESET_PARAMS = ['tag', ...Object.values(PARAM_BY_FILTER)]

function sortStorageKey(userId) {
  return `exlibris:${userId ?? 'anon'}:collectionSort`
}

function directionStorageKey(userId) {
  return `exlibris:${userId ?? 'anon'}:collectionSortDir`
}

// Filtres, tri, sens du tri et onglet de la collection. Tout vit dans l'URL
// (et non un useState local) pour survivre à un aller-retour vers la fiche
// d'un livre : la page se démonte/remonte à chaque navigation, un useState
// repartirait à zéro. Le tri et son sens sont en plus mémorisés par
// utilisateur, comme préférence de confort.
export function useCollectionFilters(userId) {
  const [searchParams, setSearchParams] = useSearchParams()

  function update(mutate) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        mutate(next)
        return next
      },
      { replace: true },
    )
  }

  function setParam(key, value) {
    update((params) => {
      if (!value) params.delete(key)
      else params.set(key, value)
    })
  }

  // Mémoïsé sur searchParams : getAll() renvoie un nouveau tableau à chaque
  // appel, ce qui invaliderait `filters` (et tous les calculs en aval) à
  // chaque render, même sans changement d'URL.
  const selectedTags = useMemo(() => searchParams.getAll('tag'), [searchParams])

  const filters = useMemo(() => {
    const values = { selectedTags }
    for (const name of FILTER_NAMES) values[name] = searchParams.get(PARAM_BY_FILTER[name]) ?? ''
    return values
  }, [searchParams, selectedTags])

  const sort = searchParams.get('sort') ?? safeLocal.get(sortStorageKey(userId)) ?? 'title'
  const direction =
    (searchParams.get('dir') ?? safeLocal.get(directionStorageKey(userId))) === 'desc'
      ? 'desc'
      : 'asc'
  const collectionTab = searchParams.get('tab') ?? 'collection'

  // Un setter par filtre simple : setFilter.publisher(value)...
  const setFilter = useMemo(() => {
    const setters = {}
    for (const name of FILTER_NAMES) {
      setters[name] = (value) => setParam(PARAM_BY_FILTER[name], value)
    }
    return setters
  }, [setSearchParams])

  function setSort(value) {
    setParam('sort', value)
    safeLocal.set(sortStorageKey(userId), value)
  }

  function toggleDirection() {
    const next = direction === 'desc' ? 'asc' : 'desc'
    setParam('dir', next === 'asc' ? null : next)
    safeLocal.set(directionStorageKey(userId), next)
  }

  function setCollectionTab(next) {
    setParam('tab', next === 'collection' ? null : next)
  }

  const setSelectedTags = useCallback(
    (nextTags) => {
      update((params) => {
        params.delete('tag')
        for (const t of nextTags) params.append('tag', t)
      })
    },
    [setSearchParams],
  )

  function resetFilters() {
    update((params) => {
      for (const key of RESET_PARAMS) params.delete(key)
    })
  }

  // Regarder une série précise ? Le tri par tome est presque toujours ce
  // qu'on veut, plutôt que l'ordre d'ajout par défaut.
  function setSeries(next) {
    update((params) => {
      if (next) {
        params.set('series', next)
        params.set('sort', 'tome')
      } else {
        params.delete('series')
      }
    })
  }

  const hasActiveFilters =
    selectedTags.length > 0 || FILTER_NAMES.some((name) => Boolean(filters[name]))

  return {
    filters,
    hasActiveFilters,
    setFilter,
    setSelectedTags,
    setSeries,
    resetFilters,
    sort,
    setSort,
    direction,
    toggleDirection,
    collectionTab,
    setCollectionTab,
  }
}
