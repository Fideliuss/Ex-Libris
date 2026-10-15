import { BOOK_TYPES } from './bookTypes'
import { hasSpecialEdition } from './editionTypes'

const MIN_SERIES_RUN = 3
const TIER_LABELS = ['Bronze', 'Argent', 'Or', 'Platine']

// Dates mixtes (date seule "2024-05-03" ou horodatage complet) : on compare
// toujours par instant, jamais par ordre de chaîne.
function ms(date) {
  return new Date(date).getTime()
}

function byDate(a, b) {
  return ms(a) - ms(b)
}

// Date d'obtention d'un livre : la fin de lecture si elle existe, sinon la
// date d'ajout.
const finishedOrAdded = (b) => b.date_finished ?? b.created_at
const added = (b) => b.created_at

function earliestDate(items, dateOf) {
  let best = null
  for (const item of items) {
    const date = dateOf(item)
    if (!date) continue
    if (!best || ms(date) < ms(best)) best = date
  }
  return best
}

// Date à laquelle le N-ième élément (trié par date croissante) a été
// atteint : sert à dater précisément l'obtention d'un palier de comptage
// (livres lus, notes données, taille de bibliothèque...).
function nthDate(items, dateOf, n) {
  const dates = items.map(dateOf).filter(Boolean).sort(byDate)
  return dates[n - 1] ?? null
}

// Première date à laquelle N valeurs distinctes (extraites par `keysOf`, une
// ou plusieurs par élément) sont apparues : ex. 5 éditeurs différents, c'est
// la date du livre qui a fait apparaître le 5ème éditeur distinct.
function nthDistinctDate(items, keysOf, dateOf, n) {
  const firstByKey = new Map()
  for (const item of items) {
    const date = dateOf(item)
    if (!date) continue
    for (const key of keysOf(item)) {
      const known = firstByKey.get(key)
      if (known === undefined || ms(date) < ms(known)) firstByKey.set(key, date)
    }
  }
  if (firstByKey.size < n) return null
  return [...firstByKey.values()].sort(byDate)[n - 1]
}

const singleKey = (getter) => (item) => {
  const key = getter(item)
  return key ? [key] : []
}

// Première date à laquelle les 4 catégories (livre/BD/comics/manga) ont
// toutes été lues au moins une fois.
function allTypesReadDate(books) {
  const types = Object.keys(BOOK_TYPES)
  const firstByType = {}
  for (const b of books) {
    if (b.status !== 'read') continue
    const type = b.type ?? 'book'
    const date = finishedOrAdded(b)
    if (!date) continue
    if (!firstByType[type] || ms(date) < ms(firstByType[type])) firstByType[type] = date
  }
  if (!types.every((t) => firstByType[t])) return null
  return types.map((t) => firstByType[t]).sort().at(-1)
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
    const sorted = [...list].sort((a, b) => ms(a.created_at) - ms(b.created_at))
    for (let i = 0; i < sorted.length; i += 1) {
      const indices = sorted.slice(0, i + 1).map((b) => b.series_index)
      const min = Math.min(...indices)
      const max = Math.max(...indices)
      const span = max - min + 1
      if (span < MIN_SERIES_RUN || new Set(indices).size !== span) continue
      const unlockedAt = sorted[i].created_at
      if (!best || ms(unlockedAt) < ms(best)) best = unlockedAt
      break
    }
  }
  return best
}

function authorWithFiveBooksDate(books) {
  const byAuthor = new Map()
  for (const b of books) {
    for (const author of b.author ?? []) {
      if (!byAuthor.has(author)) byAuthor.set(author, [])
      byAuthor.get(author).push(b)
    }
  }
  let best = null
  for (const list of byAuthor.values()) {
    if (list.length < 5) continue
    const date = nthDate(list, added, 5)
    if (date && (!best || ms(date) < ms(best))) best = date
  }
  return best
}

// Distincts mois calendaires (YYYY-MM) où au moins un livre a été terminé.
function monthKey(dateStr) {
  return dateStr.slice(0, 7)
}

// Date du livre terminé qui a porté à 12 le nombre de mois calendaires
// distincts : on rejoue les fins de lecture dans l'ordre chronologique.
function twelveMonthsDate(books) {
  const sorted = books.filter((b) => b.date_finished).sort((a, b) => byDate(a.date_finished, b.date_finished))
  const months = new Set()
  for (const b of sorted) {
    months.add(monthKey(b.date_finished))
    if (months.size >= 12) return b.date_finished
  }
  return null
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
// genre le MOINS lu, contrairement à "Libri Lecti" (volume brut), ne
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
    .map((b) => ({ type: b.type ?? 'book', date: finishedOrAdded(b) }))
    .filter((b) => b.date)
    .sort((a, b) => byDate(a.date, b.date))
  const counts = Object.fromEntries(types.map((t) => [t, 0]))
  for (const b of read) {
    counts[b.type] = (counts[b.type] ?? 0) + 1
    if (types.every((t) => counts[t] >= n)) return b.date
  }
  return null
}

// --- Fabriques ---------------------------------------------------------

// Famille à paliers dont la progression est "le nombre de livres qui passent
// `filter`", datée par la date `dateOf` du N-ième d'entre eux.
function countFamily({ filter, dateOf, ...family }) {
  return {
    ...family,
    metric: (books) => books.filter(filter).length,
    dateForCount: (books, n) => nthDate(books.filter(filter), dateOf, n),
  }
}

// Résultat d'un succès à compteur : `current` plafonné à `target`, daté
// seulement une fois débloqué.
function progress(current, target, dateIfUnlocked) {
  const unlocked = current >= target
  return {
    unlocked,
    current: Math.min(current, target),
    target,
    unlockedAt: unlocked ? dateIfUnlocked() : null,
  }
}

// Succès simple "au moins `target` livres passent `filter`" (1 par défaut).
function countAchievement({ filter, dateOf, target = 1, ...badge }) {
  return {
    ...badge,
    evaluate(books) {
      const qualifying = books.filter(filter)
      return progress(qualifying.length, target, () => nthDate(qualifying, dateOf, target))
    },
  }
}

// Succès simple "au moins `target` valeurs distinctes" : `valuesOf` donne les
// valeurs d'un livre (un tableau, éventuellement vide).
function distinctAchievement({ valuesOf, dateOf, target, ...badge }) {
  return {
    ...badge,
    evaluate(books) {
      const distinct = new Set(books.flatMap(valuesOf))
      return progress(distinct.size, target, () =>
        nthDistinctDate(books, valuesOf, dateOf, target),
      )
    },
  }
}

// Succès simple dont la condition est un événement daté (ou aucun).
function flagResult(unlockedAt) {
  return { unlocked: Boolean(unlockedAt), current: unlockedAt ? 1 : 0, target: 1, unlockedAt }
}

const isRead = (b) => b.status === 'read'
const isReadOfType = (type) => (b) => b.status === 'read' && b.type === type

// --- Familles à paliers (bronze/argent/or/platine) ---------------------
// `metric(books)` compte la progression courante ; `dateForCount` date
// l'obtention d'un seuil précis. evaluateAchievements() en dérive un seul
// badge "évolutif" par famille. Une famille par pilier (voir plus bas).
const TIERED_ACHIEVEMENTS = [
  countFamily({
    id: 'libri-lecti',
    category: 'Lecture',
    icon: 'books',
    motto: 'Libri Lecti',
    translation: 'Livres lus',
    description: 'Termine la lecture de livres.',
    thresholds: [10, 50, 100, 250],
    filter: isRead,
    dateOf: finishedOrAdded,
  }),
  countFamily({
    id: 'judicia',
    category: 'Jugement',
    icon: 'star',
    motto: 'Judicia',
    translation: 'Notes données',
    description: 'Attribue une note à des livres.',
    thresholds: [5, 20, 50, 100],
    filter: (b) => b.rating > 0,
    dateOf: finishedOrAdded,
  }),
  countFamily({
    id: 'bibliotheca',
    category: 'Bibliothèque',
    icon: 'shelf',
    motto: 'Bibliotheca',
    translation: 'Livres possédés',
    description: 'Ajoute des livres à ta bibliothèque, quel que soit leur statut.',
    thresholds: [25, 100, 250, 500],
    filter: () => true,
    dateOf: added,
  }),
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
    metric: (books) => {
      const set = new Set()
      for (const b of books) {
        if (!isRead(b)) continue
        for (const author of b.author ?? []) set.add(author)
      }
      return set.size
    },
    dateForCount: (books, n) =>
      nthDistinctDate(books.filter(isRead), (b) => b.author ?? [], finishedOrAdded, n),
  },
]

// --- Succès simples (badge unique, toujours en bronze) ------------------
// Rangés par pilier (4 par catégorie), Miscellaneous en dernier.
const SIMPLE_ACHIEVEMENTS = [
  // Lecture
  countAchievement({
    id: 'liber-primus',
    category: 'Lecture',
    icon: 'books',
    motto: 'Liber Primus',
    translation: 'Premier livre',
    description: 'Ajoute ton premier livre à ta bibliothèque.',
    filter: () => true,
    dateOf: added,
  }),
  {
    id: 'velocitas',
    category: 'Lecture',
    icon: 'books',
    motto: 'Velocitas',
    translation: 'Lecture éclair',
    description: 'Termine un livre en 3 jours ou moins.',
    evaluate: (books) => flagResult(speedReadDate(books)),
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
      return progress(months.size, 12, () => twelveMonthsDate(books))
    },
  },
  countAchievement({
    id: 'magnum-opus',
    category: 'Lecture',
    icon: 'books',
    motto: 'Magnum Opus',
    translation: 'Livre de 500+ pages',
    description: "Termine la lecture d'un livre de 500 pages ou plus.",
    filter: (b) => isRead(b) && b.page_count >= 500,
    dateOf: finishedOrAdded,
  }),

  // Jugement
  countAchievement({
    id: 'judicium-primum',
    category: 'Jugement',
    icon: 'star',
    motto: 'Judicium Primum',
    translation: 'Première note',
    description: 'Attribue ta toute première note.',
    filter: (b) => b.rating > 0,
    dateOf: finishedOrAdded,
  }),
  countAchievement({
    id: 'censor-severus',
    category: 'Jugement',
    icon: 'star',
    motto: 'Censor Severus',
    translation: 'Critique sévère',
    description: 'Attribue une note de 2 étoiles ou moins à un livre.',
    filter: (b) => b.rating > 0 && b.rating <= 2,
    dateOf: finishedOrAdded,
  }),
  countAchievement({
    id: 'thesaurus-absconditus',
    category: 'Jugement',
    icon: 'star',
    motto: 'Thesaurus Absconditus',
    translation: 'Coups de cœur',
    description: 'Note 10 livres à 5 étoiles.',
    filter: (b) => b.rating === 5,
    dateOf: finishedOrAdded,
    target: 10,
  }),
  countAchievement({
    id: 'nota-bene',
    category: 'Jugement',
    icon: 'star',
    motto: 'Nota Bene',
    translation: 'Citation favorite',
    description: 'Enregistre une citation favorite sur un livre.',
    filter: (b) => b.favorite_quote,
    dateOf: added,
  }),

  // Bibliothèque
  {
    id: 'series-sine-lacuna',
    category: 'Bibliothèque',
    icon: 'shelf',
    motto: 'Series Sine Lacuna',
    translation: 'Série sans lacune',
    description: `Possède ${MIN_SERIES_RUN} tomes consécutifs d'une même série, sans trou.`,
    evaluate: (books) => flagResult(firstGaplessSeries(books)),
  },
  countAchievement({
    id: 'aurea-editio',
    category: 'Bibliothèque',
    icon: 'shelf',
    motto: 'Aurea Editio',
    translation: 'Édition spéciale',
    description: 'Possède au moins une édition spéciale (collector, illustrée...).',
    filter: (b) => hasSpecialEdition(b.edition),
    dateOf: added,
  }),
  distinctAchievement({
    id: 'mundi-explorator',
    category: 'Bibliothèque',
    icon: 'shelf',
    motto: 'Mundi Explorator',
    translation: '5 éditeurs différents',
    description: 'Possède des livres chez au moins 5 éditeurs différents.',
    valuesOf: singleKey((b) => b.publisher),
    dateOf: added,
    target: 5,
  }),
  {
    id: 'scriptor-unus',
    category: 'Bibliothèque',
    icon: 'shelf',
    motto: 'Scriptor Unus',
    translation: 'Auteur fidèle',
    description: "Possède 5 livres d'un même auteur.",
    evaluate: (books) => flagResult(authorWithFiveBooksDate(books)),
  },

  // Genres
  countAchievement({
    id: 'manga-lecta',
    category: 'Genres',
    icon: 'compass',
    motto: 'Manga Lecta',
    translation: 'Mangas lus',
    description: 'Termine la lecture de 10 mangas.',
    filter: isReadOfType('manga'),
    dateOf: finishedOrAdded,
    target: 10,
  }),
  countAchievement({
    id: 'fabulae-lectae',
    category: 'Genres',
    icon: 'compass',
    motto: 'Fabulae Lectae',
    translation: 'Comics lus',
    description: 'Termine la lecture de 10 comics.',
    filter: isReadOfType('comics'),
    dateOf: finishedOrAdded,
    target: 10,
  }),
  countAchievement({
    id: 'chartae-lectae',
    category: 'Genres',
    icon: 'compass',
    motto: 'Chartae Lectae',
    translation: 'BD lues',
    description: 'Termine la lecture de 10 BD.',
    filter: isReadOfType('bd'),
    dateOf: finishedOrAdded,
    target: 10,
  }),
  {
    id: 'omnia-genera',
    category: 'Genres',
    icon: 'compass',
    motto: 'Omnia Genera',
    translation: 'Tous les genres',
    description: 'Lis au moins un livre, une BD, un comics et un manga.',
    evaluate(books) {
      const types = Object.keys(BOOK_TYPES)
      const readTypes = new Set(books.filter(isRead).map((b) => b.type ?? 'book'))
      const current = types.filter((t) => readTypes.has(t)).length
      return progress(current, types.length, () => allTypesReadDate(books))
    },
  },

  // Curiosité
  countAchievement({
    id: 'polyglotta',
    category: 'Curiosité',
    icon: 'links',
    motto: 'Polyglotta',
    translation: 'Œuvre traduite',
    description: 'Ajoute un livre dont le traducteur est renseigné.',
    filter: (b) => b.translator?.length > 0,
    dateOf: added,
  }),
  countAchievement({
    id: 'illustrata',
    category: 'Curiosité',
    icon: 'links',
    motto: 'Illustrata',
    translation: 'Œuvre illustrée',
    description: "Ajoute un livre dont l'illustrateur est renseigné.",
    filter: (b) => b.illustrator?.length > 0,
    dateOf: added,
  }),
  distinctAchievement({
    id: 'peregrinator-mundi',
    category: 'Curiosité',
    icon: 'links',
    motto: 'Peregrinator Mundi',
    translation: '3 univers explorés',
    description: "Possède des livres d'au moins 3 univers différents.",
    valuesOf: singleKey((b) => b.universe),
    dateOf: added,
    target: 3,
  }),
  distinctAchievement({
    id: 'index-variorum',
    category: 'Curiosité',
    icon: 'links',
    motto: 'Index Variorum',
    translation: '15 tags différents',
    description: 'Utilise au moins 15 tags différents dans ta collection.',
    valuesOf: (b) => b.tags ?? [],
    dateOf: added,
    target: 15,
  }),

  // Miscellaneous
  {
    id: 'domus-communis',
    category: 'Miscellaneous',
    icon: 'circles',
    motto: 'Domus Communis',
    translation: 'Foyer commun',
    description: 'Partage ta bibliothèque avec ton foyer.',
    evaluate(books, { partner } = {}) {
      return { unlocked: Boolean(partner), current: partner ? 1 : 0, target: 1, unlockedAt: null }
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
