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

// Même principe que nthDistinctGroupDate, mais pour un champ à valeurs
// multiples par livre (les tags) plutôt qu'une seule clé.
function nthDistinctTagDate(books, n) {
  const firstByTag = {}
  for (const b of books) {
    const date = b.created_at
    if (!date) continue
    for (const tag of b.tags ?? []) {
      if (!firstByTag[tag] || new Date(date) < new Date(firstByTag[tag])) {
        firstByTag[tag] = date
      }
    }
  }
  const dates = Object.values(firstByTag).sort((a, b) => new Date(a) - new Date(b))
  return dates.length < n ? null : dates[n - 1]
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

// Compte de livres lus par genre (book/bd/comics/manga) : le nombre lu du
// genre le MOINS lu — contrairement à "Libri Lecti" (volume brut), ça ne
// progresse que si tous les genres suivent, pas juste le total.
function readCountsByType(books) {
  const types = Object.keys(BOOK_TYPES)
  const counts = Object.fromEntries(types.map((t) => [t, 0]))
  for (const b of books) {
    if (b.status !== 'read') continue
    const t = b.type ?? 'book'
    counts[t] = (counts[t] ?? 0) + 1
  }
  return counts
}

function genreBalanceMetric(books) {
  const counts = readCountsByType(books)
  return Math.min(...Object.values(counts))
}

function genreBalanceDate(books, n) {
  const types = Object.keys(BOOK_TYPES)
  const read = books
    .filter((b) => b.status === 'read')
    .map((b) => ({ type: b.type ?? 'book', date: b.date_finished ?? b.created_at }))
    .filter((b) => b.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
  const counts = Object.fromEntries(types.map((t) => [t, 0]))
  for (const b of read) {
    counts[b.type] = (counts[b.type] ?? 0) + 1
    if (types.every((t) => counts[t] >= n)) return b.date
  }
  return null
}

// --- Familles à paliers (bronze/argent/or/platine) ---------------------
// `metric(books)` compte la progression courante ; `dateForCount` date
// l'obtention d'un seuil précis. evaluateAchievements() en dérive un seul
// badge "évolutif" par famille. Une famille par pilier (voir plus bas).
const TIERED_ACHIEVEMENTS = [
  {
    id: 'libri-lecti',
    category: 'Lecture',
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
  {
    id: 'genera-lecta',
    category: 'Genres',
    icon: 'compass',
    motto: 'Genera Lecta',
    translation: 'Équilibre des genres',
    description:
      "Lis livres, BD, comics et mangas à parts égales : le palier suit le genre le moins lu, pas le total.",
    thresholds: [1, 5, 15, 30],
    metric: genreBalanceMetric,
    dateForCount: (books, n) => genreBalanceDate(books, n),
  },
  {
    id: 'auctores-varii',
    category: 'Curiosité',
    icon: 'links',
    motto: 'Auctores Varii',
    translation: 'Auteurs différents',
    description: "Lis des livres d'auteurs différents.",
    thresholds: [10, 30, 60, 100],
    metric: (books) =>
      new Set(books.filter((b) => b.status === 'read' && b.author).map((b) => b.author)).size,
    dateForCount: (books, n) =>
      nthDistinctGroupDate(
        books.filter((b) => b.status === 'read'),
        (b) => b.author,
        (b) => b.date_finished ?? b.created_at,
        n,
      ),
  },
]

// --- Succès simples (badge unique, toujours en bronze) ------------------
// Rangés par pilier (4 par catégorie), Miscellaneous en dernier.
const SIMPLE_ACHIEVEMENTS = [
  // Lecture
  {
    id: 'liber-primus',
    category: 'Lecture',
    icon: 'books',
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
    id: 'velocitas',
    category: 'Lecture',
    icon: 'books',
    motto: 'Velocitas',
    translation: 'Lecture éclair',
    description: 'Termine un livre en 3 jours ou moins.',
    evaluate(books) {
      const unlockedAt = speedReadDate(books)
      return { unlocked: Boolean(unlockedAt), current: unlockedAt ? 1 : 0, target: 1, unlockedAt }
    },
  },
  {
    id: 'duodecim-menses',
    category: 'Lecture',
    icon: 'books',
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
    id: 'magnum-opus',
    category: 'Lecture',
    icon: 'books',
    motto: 'Magnum Opus',
    translation: 'Livre de 500+ pages',
    description: 'Termine la lecture d\'un livre de 500 pages ou plus.',
    evaluate(books) {
      const qualifying = books.filter((b) => b.status === 'read' && b.page_count >= 500)
      const target = 1
      return {
        unlocked: qualifying.length > 0,
        current: Math.min(qualifying.length, target),
        target,
        unlockedAt: earliestDate(qualifying, (b) => b.date_finished ?? b.created_at),
      }
    },
  },

  // Jugement
  {
    id: 'judicium-primum',
    category: 'Jugement',
    icon: 'star',
    motto: 'Judicium Primum',
    translation: 'Première note',
    description: 'Attribue ta toute première note.',
    evaluate(books) {
      const qualifying = books.filter((b) => b.rating > 0)
      const target = 1
      return {
        unlocked: qualifying.length > 0,
        current: Math.min(qualifying.length, target),
        target,
        unlockedAt: earliestDate(qualifying, (b) => b.date_finished ?? b.created_at),
      }
    },
  },
  {
    id: 'censor-severus',
    category: 'Jugement',
    icon: 'star',
    motto: 'Censor Severus',
    translation: 'Critique sévère',
    description: 'Attribue une note de 2 étoiles ou moins à un livre.',
    evaluate(books) {
      const qualifying = books.filter((b) => b.rating > 0 && b.rating <= 2)
      const target = 1
      return {
        unlocked: qualifying.length > 0,
        current: Math.min(qualifying.length, target),
        target,
        unlockedAt: earliestDate(qualifying, (b) => b.date_finished ?? b.created_at),
      }
    },
  },
  {
    id: 'thesaurus-absconditus',
    category: 'Jugement',
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
    id: 'nota-bene',
    category: 'Jugement',
    icon: 'star',
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

  // Bibliothèque
  {
    id: 'series-sine-lacuna',
    category: 'Bibliothèque',
    icon: 'shelf',
    motto: 'Series Sine Lacuna',
    translation: 'Série sans lacune',
    description: `Possède ${MIN_SERIES_RUN} tomes consécutifs d'une même série, sans trou.`,
    evaluate(books) {
      const unlockedAt = firstGaplessSeries(books)
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
    icon: 'shelf',
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
    id: 'scriptor-unus',
    category: 'Bibliothèque',
    icon: 'shelf',
    motto: 'Scriptor Unus',
    translation: 'Auteur fidèle',
    description: "Possède 5 livres d'un même auteur.",
    evaluate(books) {
      const unlockedAt = authorWithFiveBooksDate(books)
      return { unlocked: Boolean(unlockedAt), current: unlockedAt ? 1 : 0, target: 1, unlockedAt }
    },
  },

  // Genres
  {
    id: 'manga-lecta',
    category: 'Genres',
    icon: 'compass',
    motto: 'Manga Lecta',
    translation: 'Mangas lus',
    description: 'Termine la lecture de 10 mangas.',
    evaluate(books) {
      const target = 10
      const qualifying = books.filter((b) => b.status === 'read' && b.type === 'manga')
      return {
        unlocked: qualifying.length >= target,
        current: Math.min(qualifying.length, target),
        target,
        unlockedAt:
          qualifying.length >= target
            ? nthDate(qualifying, (b) => b.date_finished ?? b.created_at, target)
            : null,
      }
    },
  },
  {
    id: 'fabulae-lectae',
    category: 'Genres',
    icon: 'compass',
    motto: 'Fabulae Lectae',
    translation: 'Comics lus',
    description: 'Termine la lecture de 10 comics.',
    evaluate(books) {
      const target = 10
      const qualifying = books.filter((b) => b.status === 'read' && b.type === 'comics')
      return {
        unlocked: qualifying.length >= target,
        current: Math.min(qualifying.length, target),
        target,
        unlockedAt:
          qualifying.length >= target
            ? nthDate(qualifying, (b) => b.date_finished ?? b.created_at, target)
            : null,
      }
    },
  },
  {
    id: 'chartae-lectae',
    category: 'Genres',
    icon: 'compass',
    motto: 'Chartae Lectae',
    translation: 'BD lues',
    description: 'Termine la lecture de 10 BD.',
    evaluate(books) {
      const target = 10
      const qualifying = books.filter((b) => b.status === 'read' && b.type === 'bd')
      return {
        unlocked: qualifying.length >= target,
        current: Math.min(qualifying.length, target),
        target,
        unlockedAt:
          qualifying.length >= target
            ? nthDate(qualifying, (b) => b.date_finished ?? b.created_at, target)
            : null,
      }
    },
  },
  {
    id: 'omnia-genera',
    category: 'Genres',
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

  // Curiosité
  {
    id: 'polyglotta',
    category: 'Curiosité',
    icon: 'links',
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
    icon: 'links',
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
    id: 'peregrinator-mundi',
    category: 'Curiosité',
    icon: 'links',
    motto: 'Peregrinator Mundi',
    translation: '3 univers explorés',
    description: 'Possède des livres d\'au moins 3 univers différents.',
    evaluate(books) {
      const universes = new Set(books.filter((b) => b.universe).map((b) => b.universe))
      const current = universes.size
      const target = 3
      return {
        unlocked: current >= target,
        current: Math.min(current, target),
        target,
        unlockedAt:
          current >= target
            ? nthDistinctGroupDate(books, (b) => b.universe, (b) => b.created_at, target)
            : null,
      }
    },
  },
  {
    id: 'index-variorum',
    category: 'Curiosité',
    icon: 'links',
    motto: 'Index Variorum',
    translation: '15 tags différents',
    description: 'Utilise au moins 15 tags différents dans ta collection.',
    evaluate(books) {
      const tags = new Set(books.flatMap((b) => b.tags ?? []))
      const current = tags.size
      const target = 15
      return {
        unlocked: current >= target,
        current: Math.min(current, target),
        target,
        unlockedAt: current >= target ? nthDistinctTagDate(books, target) : null,
      }
    },
  },

  // Miscellaneous
  {
    id: 'domus-communis',
    category: 'Miscellaneous',
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

// Une famille à paliers ne produit plus 4 badges séparés : un seul badge
// "évolutif", qui expose le rang le plus haut réellement atteint
// (`reachedRank`, -1 si aucun seuil n'est franchi) ainsi que la progression
// vers le seuil suivant. C'est à l'affichage (voir AchievementsGallery) de
// décider quel rang montrer selon ce que le joueur a déjà "réclamé".
export function evaluateAchievements(books, ctx = {}) {
  const badges = []

  for (const family of TIERED_ACHIEVEMENTS) {
    const current = family.metric(books)
    let reachedRank = -1
    family.thresholds.forEach((threshold, i) => {
      if (current >= threshold) reachedRank = i
    })
    const nextRank = reachedRank + 1
    const nextThreshold = family.thresholds[nextRank] ?? null

    badges.push({
      id: family.id,
      kind: 'tiered',
      category: family.category,
      icon: family.icon,
      motto: family.motto,
      translationBase: family.translation,
      description: family.description,
      thresholds: family.thresholds,
      tierLabels: TIER_LABELS,
      reachedRank,
      current,
      nextThreshold,
      unlockedAtForRank: (rank) =>
        rank < 0 ? null : family.dateForCount(books, family.thresholds[rank]),
    })
  }

  for (const achievement of SIMPLE_ACHIEVEMENTS) {
    const result = achievement.evaluate(books, ctx)
    badges.push({
      id: achievement.id,
      kind: 'simple',
      category: achievement.category,
      icon: achievement.icon,
      motto: achievement.motto,
      translation: achievement.translation,
      description: achievement.description,
      ...result,
    })
  }

  return badges
}

export const TIER_METAL_LABELS = TIER_LABELS
