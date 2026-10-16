import { sortedUnique } from './text'

// Un contrôle par champ de filtre : renvoie true si le livre respecte ce
// filtre (ou si le filtre n'est pas actif).
const FILTER_CHECKS = {
  search(book, { search = '' }) {
    const query = search.trim().toLowerCase()
    if (!query) return true
    const isbn = (book.isbn ?? '').replace(/[\s-]/g, '')
    const haystack = `${book.title} ${(book.author ?? []).join(' ')} ${isbn}`.toLowerCase()
    return haystack.includes(query)
  },
  tags(book, { selectedTags = [] }) {
    return selectedTags.length === 0 || selectedTags.some((t) => book.tags?.includes(t))
  },
  publisher: (book, { publisher = '' }) => !publisher || book.publisher === publisher,
  author: (book, { author = '' }) => !author || Boolean(book.author?.includes(author)),
  collection: (book, { collection = '' }) => !collection || book.collection === collection,
  edition: (book, { edition = '' }) => !edition || Boolean(book.edition?.includes(edition)),
  series: (book, { series = '' }) => !series || book.series === series,
  universe: (book, { universe = '' }) => !universe || book.universe === universe,
  type: (book, { type = '' }) => !type || book.type === type,
  status: (book, { status = '' }) => !status || book.status === status,
}

const FILTER_KEYS = Object.keys(FILTER_CHECKS)

// Les filtres que le livre ne respecte pas.
function failedFilters(book, filters) {
  const failed = []
  for (const key of FILTER_KEYS) {
    if (!FILTER_CHECKS[key](book, filters)) failed.push(key)
  }
  return failed
}

// Prédicat de filtrage partagé par Collection.jsx : vrai si `book` respecte
// tous les champs actifs de `filters`, sauf celui nommé par `exclude` (ou
// aucun si `exclude` est null/omis). Sert à la fois à calculer la liste
// réellement affichée (exclude = null) et les options proposées par chaque
// filtre, réduites par tous les AUTRES filtres déjà posés (EXL D.1) —
// sélectionner Type = Manga ne laisse plus apparaître, dans la liste
// Auteur, que les auteurs ayant au moins un manga. Sans `exclude`, cocher
// une valeur dans un filtre la ferait disparaître de sa propre liste.
export function bookMatchesFilters(book, filters, exclude = null) {
  for (const key of FILTER_KEYS) {
    if (key !== exclude && !FILTER_CHECKS[key](book, filters)) return false
  }
  return true
}

// Valeurs que chaque filtre à liste de choix doit proposer.
const FACET_VALUES = {
  tags: (book) => book.tags ?? [],
  publisher: (book) => (book.publisher ? [book.publisher] : []),
  author: (book) => book.author ?? [],
  collection: (book) => (book.collection ? [book.collection] : []),
  edition: (book) => book.edition ?? [],
  series: (book) => (book.series ? [book.series] : []),
  universe: (book) => (book.universe ? [book.universe] : []),
}

// Options de tous les filtres en UNE passe sur les livres : un livre entre
// dans la liste d'options d'un filtre s'il respecte tous les AUTRES filtres,
// donc s'il n'en rate aucun, ou seulement celui-là. Équivalent à appeler
// bookMatchesFilters(book, filters, <champ>) pour chaque champ, sans
// refiltrer toute la liste une fois par champ.
// Retourne aussi `statusCounts` (nombre de livres par statut).
export function computeFacets(books, filters) {
  const sets = Object.fromEntries(Object.keys(FACET_VALUES).map((key) => [key, new Set()]))
  const statusCounts = {}

  for (const book of books) {
    const failed = failedFilters(book, filters)
    if (failed.length > 1) continue

    const only = failed[0] // undefined si le livre passe tous les filtres
    for (const key of Object.keys(FACET_VALUES)) {
      if (only === undefined || only === key) {
        for (const value of FACET_VALUES[key](book)) sets[key].add(value)
      }
    }
    if (only === undefined || only === 'status') {
      statusCounts[book.status] = (statusCounts[book.status] ?? 0) + 1
    }
  }

  const facets = Object.fromEntries(
    Object.entries(sets).map(([key, set]) => [key, sortedUnique(set)]),
  )
  return { ...facets, statusCounts }
}
