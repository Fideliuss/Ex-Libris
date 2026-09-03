import { BOOK_TYPES } from './bookTypes'

// Chaque tome minimum pour qu'une série "sans lacune" compte : en dessous,
// un seul livre possédé validerait trivialement la condition.
const MIN_SERIES_RUN = 3

function earliestBook(books) {
  return books.reduce((a, b) =>
    new Date(a.created_at) < new Date(b.created_at) ? a : b,
  )
}

// Date à laquelle un compte de livres lus (10/50/100...) a été atteint : le
// livre "lu" dont la date de fin de lecture (ou, à défaut, la date d'ajout)
// est la N-ième la plus ancienne.
function nthReadDate(books, n) {
  const read = books
    .filter((b) => b.status === 'read')
    .map((b) => ({ date: b.date_finished ?? b.created_at }))
    .filter((b) => b.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
  return read[n - 1]?.date ?? null
}

// Première date à laquelle les 4 catégories (livre/BD/comics/manga) ont
// toutes été lues au moins une fois : le plus tardif des "premier livre lu"
// par catégorie.
function allTypesReadDate(books) {
  const types = Object.keys(BOOK_TYPES)
  const firstReadByType = {}
  for (const b of books) {
    if (b.status !== 'read') continue
    const type = b.type ?? 'book'
    const date = b.date_finished ?? b.created_at
    if (!date) continue
    if (!firstReadByType[type] || new Date(date) < new Date(firstReadByType[type])) {
      firstReadByType[type] = date
    }
  }
  if (!types.every((t) => firstReadByType[t])) return null
  return types.map((t) => firstReadByType[t]).sort().at(-1)
}

// Premier moment où une série a atteint MIN_SERIES_RUN tomes possédés sans
// aucun trou entre le plus petit et le plus grand tome — rejoue l'ajout des
// livres dans l'ordre chronologique plutôt que de ne regarder que l'état
// final, pour dater l'obtention au bon jour.
function firstGaplessSeries(books) {
  const bySeries = new Map()
  for (const b of books) {
    if (!b.series || b.series_index == null) continue
    if (!bySeries.has(b.series)) bySeries.set(b.series, [])
    bySeries.get(b.series).push(b)
  }

  let best = null
  for (const list of bySeries.values()) {
    const sorted = [...list].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at),
    )
    for (let i = 0; i < sorted.length; i += 1) {
      const indices = sorted.slice(0, i + 1).map((b) => b.series_index)
      const min = Math.min(...indices)
      const max = Math.max(...indices)
      const span = max - min + 1
      if (span < MIN_SERIES_RUN) continue
      if (new Set(indices).size !== span) continue
      const unlockedAt = sorted[i].created_at
      if (!best || new Date(unlockedAt) < new Date(best)) best = unlockedAt
      break
    }
  }
  return best
}

// Chaque succès expose evaluate(books, ctx) -> { unlocked, current, target,
// unlockedAt }. `current`/`target` alimentent la barre de progression des
// succès verrouillés ; `unlockedAt` (ISO date ou null) s'affiche sur la
// plaque une fois débloquée.
export const ACHIEVEMENTS = [
  {
    id: 'first-book',
    icon: 'quill',
    motto: 'Liber Primus',
    translation: 'Premier livre',
    description: 'Ajoute ton premier livre à ta bibliothèque.',
    evaluate(books) {
      const target = 1
      if (books.length === 0) return { unlocked: false, current: 0, target }
      return {
        unlocked: true,
        current: 1,
        target,
        unlockedAt: earliestBook(books).created_at,
      }
    },
  },
  {
    id: 'ten-read',
    icon: 'books',
    motto: 'Decem Libri Lecti',
    translation: 'Dix livres lus',
    description: 'Termine la lecture de 10 livres.',
    evaluate(books) {
      const current = books.filter((b) => b.status === 'read').length
      const target = 10
      return {
        unlocked: current >= target,
        current: Math.min(current, target),
        target,
        unlockedAt: current >= target ? nthReadDate(books, target) : null,
      }
    },
  },
  {
    id: 'fifty-read',
    icon: 'books',
    motto: 'Quinquaginta Libri Lecti',
    translation: 'Cinquante livres lus',
    description: 'Termine la lecture de 50 livres.',
    evaluate(books) {
      const current = books.filter((b) => b.status === 'read').length
      const target = 50
      return {
        unlocked: current >= target,
        current: Math.min(current, target),
        target,
        unlockedAt: current >= target ? nthReadDate(books, target) : null,
      }
    },
  },
  {
    id: 'hundred-read',
    icon: 'books',
    motto: 'Centum Libri Lecti',
    translation: 'Cent livres lus',
    description: 'Termine la lecture de 100 livres.',
    evaluate(books) {
      const current = books.filter((b) => b.status === 'read').length
      const target = 100
      return {
        unlocked: current >= target,
        current: Math.min(current, target),
        target,
        unlockedAt: current >= target ? nthReadDate(books, target) : null,
      }
    },
  },
  {
    id: 'all-types',
    icon: 'compass',
    motto: 'Omnia Genera',
    translation: 'Tous les genres',
    description: 'Lis au moins un livre, une BD, un comics et un manga.',
    evaluate(books) {
      const types = Object.keys(BOOK_TYPES)
      const readTypes = new Set(
        books.filter((b) => b.status === 'read').map((b) => b.type ?? 'book'),
      )
      const current = types.filter((t) => readTypes.has(t)).length
      const target = types.length
      return {
        unlocked: current >= target,
        current,
        target,
        unlockedAt: current >= target ? allTypesReadDate(books) : null,
      }
    },
  },
  {
    id: 'gapless-series',
    icon: 'links',
    motto: 'Series Sine Lacuna',
    translation: 'Série sans lacune',
    description: `Possède ${MIN_SERIES_RUN} tomes consécutifs d'une même série, sans trou.`,
    evaluate(books) {
      const unlockedAt = firstGaplessSeries(books)
      return {
        unlocked: Boolean(unlockedAt),
        current: unlockedAt ? 1 : 0,
        target: 1,
        unlockedAt,
      }
    },
  },
  {
    id: 'rated-twenty',
    icon: 'star',
    motto: 'Viginti Judicia',
    translation: 'Vingt jugements',
    description: 'Attribue une note à 20 livres.',
    evaluate(books) {
      const rated = books
        .filter((b) => b.rating > 0)
        .map((b) => ({ date: b.date_finished ?? b.created_at }))
        .filter((b) => b.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
      const current = rated.length
      const target = 20
      return {
        unlocked: current >= target,
        current: Math.min(current, target),
        target,
        unlockedAt: current >= target ? rated[target - 1].date : null,
      }
    },
  },
  {
    id: 'household-shared',
    icon: 'circles',
    motto: 'Domus Communis',
    translation: 'Foyer commun',
    description: 'Partage ta bibliothèque avec ton foyer.',
    evaluate(books, { partner } = {}) {
      const target = 1
      return {
        unlocked: Boolean(partner),
        current: partner ? 1 : 0,
        target,
        unlockedAt: null,
      }
    },
  },
]
