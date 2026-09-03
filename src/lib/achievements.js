import { BOOK_TYPES } from './bookTypes'
import { hasSpecialEdition } from './editionTypes'

const MIN_SERIES_RUN = 3
const TIER_LABELS = ['Bronze', 'Argent', 'Or', 'Platine']

function earliestDate(items, dateOf) {
  let best = null
  for (const item of items) {
    const date = dateOf(item)
    if (!date) continue
    if (!best || new Date(date) < new Date(best)) best = date
  }
  return best
}

// Date à laquelle le N-ième élément (trié par date croissante) a été
// atteint : sert à dater précisément l'obtention d'un palier de comptage
// (livres lus, notes données, taille de bibliothèque...).
function nthDate(items, dateOf, n) {
  const dates = items
    .map(dateOf)
    .filter(Boolean)
    .sort((a, b) => new Date(a) - new Date(b))
  return dates[n - 1] ?? null
}

// Première date à laquelle les 4 catégories (livre/BD/comics/manga) ont
// toutes été lues au moins une fois.
function allTypesReadDate(books) {
  const types = Object.keys(BOOK_TYPES)
  const firstByType = {}
  for (const b of books) {
    if (b.status !== 'read') continue
    const type = b.type ?? 'book'
    const date = b.date_finished ?? b.created_at
    if (!date) continue
    if (!firstByType[type] || new Date(date) < new Date(firstByType[type])) {
      firstByType[type] = date
    }
  }
  if (!types.every((t) => firstByType[t])) return null
  return types.map((t) => firstByType[t]).sort().at(-1)
}

// Première date à laquelle N groupes distincts (par `keyOf`) ont chacun
// au moins un élément — ex. 5 éditeurs différents : la date du livre qui a
// fait apparaître le 5ème éditeur distinct.
function nthDistinctGroupDate(items, keyOf, dateOf, n) {
  const firstByKey = {}
  for (const item of items) {
    const key = keyOf(item)
    if (!key) continue
    const date = dateOf(item)
    if (!date) continue
    if (!firstByKey[key] || new Date(date) < new Date(firstByKey[key])) {
      firstByKey[key] = date
    }
  }
  const dates = Object.values(firstByKey).sort((a, b) => new Date(a) - new Date(b))
  if (dates.length < n) return null
  return dates[n - 1]
}

// Rejoue les éléments triés chronologiquement et retourne la date du
// premier moment où `isSatisfied(itemsSoFar)` devient vrai.
function firstMomentWhere(items, dateOf, isSatisfied) {
  const sorted = [...items]
    .filter((i) => dateOf(i))
    .sort((a, b) => new Date(dateOf(a)) - new Date(dateOf(b)))
  for (let i = 0; i < sorted.length; i += 1) {
    if (isSatisfied(sorted.slice(0, i + 1))) return dateOf(sorted[i])
  }
  return null
}

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
      if (span < MIN_SERIES_RUN || new Set(indices).size !== span) continue
      const unlockedAt = sorted[i].created_at
      if (!best || new Date(unlockedAt) < new Date(best)) best = unlockedAt
      break
    }
  }
  return best
}

function authorWithFiveBooksDate(books) {
  const byAuthor = new Map()
  for (const b of books) {
    if (!b.author) continue
    if (!byAuthor.has(b.author)) byAuthor.set(b.author, [])
    byAuthor.get(b.author).push(b)
  }
  let best = null
  for (const list of byAuthor.values()) {
    if (list.length < 5) continue
    const date = nthDate(list, (b) => b.created_at, 5)
    if (date && (!best || new Date(date) < new Date(best))) best = date
  }
  return best
}

// Distincts mois calendaires (YYYY-MM) où au moins un livre a été terminé.
function monthKey(dateStr) {
  return dateStr.slice(0, 7)
}

function twelveMonthsDate(books) {
  const read = books.filter((b) => b.date_finished)
  return firstMomentWhere(
    read,
    (b) => b.date_finished,
    (soFar) => new Set(soFar.map((b) => monthKey(b.date_finished))).size >= 12,
  )
}

function speedReadDate(books) {
  const qualifying = books.filter((b) => {
    if (!b.date_started || !b.date_finished) return false
    const days = (new Date(b.date_finished) - new Date(b.date_started)) / 86400000
    return days >= 0 && days <= 2
  })
  return earliestDate(qualifying, (b) => b.date_finished)
}

// --- Familles à paliers (bronze/argent/or/platine) ---------------------
// `metric(books)` compte la progression courante ; `dateForCount` date
// l'obtention d'un seuil précis. evaluateTiers() en dérive les 4 badges.
const TIERED_ACHIEVEMENTS = [
  {
    id: 'libri-lecti',
    category: 'Paliers de lecture',
    icon: 'books',
    motto: 'Libri Lecti',
    translation: 'Livres lus',
    description: 'Termine la lecture de livres.',
    thresholds: [10, 50, 100, 250],
    metric: (books) => books.filter((b) => b.status === 'read').length,
    dateForCount: (books, n) =>
      nthDate(
        books.filter((b) => b.status === 'read'),
        (b) => b.date_finished ?? b.created_at,
        n,
      ),
  },
  {
    id: 'judicia',
    category: 'Jugement',
    icon: 'star',
    motto: 'Judicia',
    translation: 'Notes données',
    description: 'Attribue une note à des livres.',
    thresholds: [5, 20, 50, 100],
    metric: (books) => books.filter((b) => b.rating > 0).length,
    dateForCount: (books, n) =>
      nthDate(
        books.filter((b) => b.rating > 0),
        (b) => b.date_finished ?? b.created_at,
        n,
      ),
  },
  {
    id: 'bibliotheca',
    category: 'Bibliothèque',
    icon: 'shelf',
    motto: 'Bibliotheca',
    translation: 'Livres possédés',
    description: 'Ajoute des livres à ta bibliothèque, quel que soit leur statut.',
    thresholds: [25, 100, 250, 500],
    metric: (books) => books.length,
    dateForCount: (books, n) => nthDate(books, (b) => b.created_at, n),
  },
]

// --- Succès simples (badge unique, toujours en bronze) ------------------
const SIMPLE_ACHIEVEMENTS = [
  {
    id: 'liber-primus',
    category: 'Bibliothèque',
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
        unlockedAt: earliestDate(books, (b) => b.created_at),
      }
    },
  },
  {
    id: 'omnia-genera',
    category: 'Curiosité',
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
    id: 'series-sine-lacuna',
    category: 'Curiosité',
    icon: 'links',
    motto: 'Series Sine Lacuna',
    translation: 'Série sans lacune',
    description: `Possède ${MIN_SERIES_RUN} tomes consécutifs d'une même série, sans trou.`,
    evaluate(books) {
      const unlockedAt = firstGaplessSeries(books)
      return { unlocked: Boolean(unlockedAt), current: unlockedAt ? 1 : 0, target: 1, unlockedAt }
    },
  },
  {
    id: 'polyglotta',
    category: 'Curiosité',
    icon: 'quill',
    motto: 'Polyglotta',
    translation: 'Œuvre traduite',
    description: "Ajoute un livre dont le traducteur est renseigné.",
    evaluate(books) {
      const qualifying = books.filter((b) => b.translator)
      const target = 1
      return {
        unlocked: qualifying.length > 0,
        current: Math.min(qualifying.length, target),
        target,
        unlockedAt: earliestDate(qualifying, (b) => b.created_at),
      }
    },
  },
  {
    id: 'illustrata',
    category: 'Curiosité',
    icon: 'quill',
    motto: 'Illustrata',
    translation: 'Œuvre illustrée',
    description: "Ajoute un livre dont l'illustrateur est renseigné.",
    evaluate(books) {
      const qualifying = books.filter((b) => b.illustrator)
      const target = 1
      return {
        unlocked: qualifying.length > 0,
        current: Math.min(qualifying.length, target),
        target,
        unlockedAt: earliestDate(qualifying, (b) => b.created_at),
      }
    },
  },
  {
    id: 'duodecim-menses',
    category: 'Curiosité',
    icon: 'compass',
    motto: 'Duodecim Menses',
    translation: 'Douze mois de lecture',
    description: 'Termine au moins un livre sur 12 mois calendaires différents.',
    evaluate(books) {
      const months = new Set(
        books.filter((b) => b.date_finished).map((b) => monthKey(b.date_finished)),
      )
      const current = months.size
      const target = 12
      return {
        unlocked: current >= target,
        current: Math.min(current, target),
        target,
        unlockedAt: current >= target ? twelveMonthsDate(books) : null,
      }
    },
  },
  {
    id: 'velocitas',
    category: 'Curiosité',
    icon: 'star',
    motto: 'Velocitas',
    translation: 'Lecture éclair',
    description: 'Termine un livre en 3 jours ou moins.',
    evaluate(books) {
      const unlockedAt = speedReadDate(books)
      return { unlocked: Boolean(unlockedAt), current: unlockedAt ? 1 : 0, target: 1, unlockedAt }
    },
  },
  {
    id: 'nota-bene',
    category: 'Cœur',
    icon: 'quill',
    motto: 'Nota Bene',
    translation: 'Citation favorite',
    description: 'Enregistre une citation favorite sur un livre.',
    evaluate(books) {
      const qualifying = books.filter((b) => b.favorite_quote)
      const target = 1
      return {
        unlocked: qualifying.length > 0,
        current: Math.min(qualifying.length, target),
        target,
        unlockedAt: earliestDate(qualifying, (b) => b.created_at),
      }
    },
  },
  {
    id: 'thesaurus-absconditus',
    category: 'Cœur',
    icon: 'star',
    motto: 'Thesaurus Absconditus',
    translation: 'Coups de cœur',
    description: 'Note 10 livres à 5 étoiles.',
    evaluate(books) {
      const fiveStars = books.filter((b) => b.rating === 5)
      const target = 10
      return {
        unlocked: fiveStars.length >= target,
        current: Math.min(fiveStars.length, target),
        target,
        unlockedAt:
          fiveStars.length >= target
            ? nthDate(fiveStars, (b) => b.date_finished ?? b.created_at, target)
            : null,
      }
    },
  },
  {
    id: 'scriptor-unus',
    category: 'Cœur',
    icon: 'quill',
    motto: 'Scriptor Unus',
    translation: 'Auteur fidèle',
    description: "Possède 5 livres d'un même auteur.",
    evaluate(books) {
      const unlockedAt = authorWithFiveBooksDate(books)
      return { unlocked: Boolean(unlockedAt), current: unlockedAt ? 1 : 0, target: 1, unlockedAt }
    },
  },
  {
    id: 'aurea-editio',
    category: 'Bibliothèque',
    icon: 'shelf',
    motto: 'Aurea Editio',
    translation: 'Édition spéciale',
    description: 'Possède au moins une édition spéciale (collector, illustrée...).',
    evaluate(books) {
      const qualifying = books.filter((b) => hasSpecialEdition(b.edition))
      const target = 1
      return {
        unlocked: qualifying.length > 0,
        current: Math.min(qualifying.length, target),
        target,
        unlockedAt: earliestDate(qualifying, (b) => b.created_at),
      }
    },
  },
  {
    id: 'mundi-explorator',
    category: 'Bibliothèque',
    icon: 'compass',
    motto: 'Mundi Explorator',
    translation: '5 éditeurs différents',
    description: 'Possède des livres chez au moins 5 éditeurs différents.',
    evaluate(books) {
      const publishers = new Set(books.filter((b) => b.publisher).map((b) => b.publisher))
      const current = publishers.size
      const target = 5
      return {
        unlocked: current >= target,
        current: Math.min(current, target),
        target,
        unlockedAt:
          current >= target
            ? nthDistinctGroupDate(books, (b) => b.publisher, (b) => b.created_at, target)
            : null,
      }
    },
  },
  {
    id: 'domus-communis',
    category: 'Communauté',
    icon: 'circles',
    motto: 'Domus Communis',
    translation: 'Foyer commun',
    description: 'Partage ta bibliothèque avec ton foyer.',
    evaluate(books, { partner } = {}) {
      const target = 1
      return { unlocked: Boolean(partner), current: partner ? 1 : 0, target, unlockedAt: null }
    },
  },
]

// Aplatit les familles à paliers (4 badges chacune : un par threshold) et
// les succès simples (1 badge, toujours "Bronze") en une seule liste de
// badges indépendants, prêts à être affichés.
export function evaluateAchievements(books, ctx = {}) {
  const badges = []

  for (const family of TIERED_ACHIEVEMENTS) {
    const current = family.metric(books)
    family.thresholds.forEach((threshold, i) => {
      const unlocked = current >= threshold
      badges.push({
        id: `${family.id}-${i}`,
        category: family.category,
        icon: family.icon,
        motto: family.motto,
        translation: `${TIER_LABELS[i]} · ${family.translation}`,
        description: `${family.description} (seuil : ${threshold}).`,
        tierRank: i,
        unlocked,
        current: Math.min(current, threshold),
        target: threshold,
        unlockedAt: unlocked ? family.dateForCount(books, threshold) : null,
      })
    })
  }

  for (const achievement of SIMPLE_ACHIEVEMENTS) {
    const result = achievement.evaluate(books, ctx)
    badges.push({
      id: achievement.id,
      category: achievement.category,
      icon: achievement.icon,
      motto: achievement.motto,
      translation: achievement.translation,
      description: achievement.description,
      tierRank: 0,
      ...result,
    })
  }

  return badges
}

export const ACHIEVEMENT_CATEGORIES = [
  'Paliers de lecture',
  'Jugement',
  'Bibliothèque',
  'Curiosité',
  'Cœur',
  'Communauté',
]

export const TIER_METAL_LABELS = TIER_LABELS
