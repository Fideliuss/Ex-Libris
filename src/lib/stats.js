import { BOOK_TYPES } from './bookTypes'
import { parseDateOnly } from './dates'
import { bookPoints, TYPE_POINTS } from './points'

// Calculs de la page Statistiques, sortis du composant pour pouvoir être
// testés. Ce sont des fonctions pures : la date du jour est passée en
// paramètre (`now`) au lieu d'être lue ici.

// Nombre de livres par valeur d'un champ, du plus fréquent au moins fréquent
// (les livres sans valeur sont ignorés).
export function countBy(books, field, key) {
  const counts = new Map()
  for (const book of books) {
    const value = book[field]
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ [key]: name, count }))
    .sort((a, b) => b.count - a.count)
}

export function statusTotals(books) {
  const counts = { read: 0, reading: 0, 'to-read': 0, wishlist: 0 }
  let spent = 0
  for (const b of books) {
    counts[b.status] = (counts[b.status] ?? 0) + 1
    if (b.status !== 'wishlist') spent += Number(b.price) || 0
  }
  return {
    readCount: counts.read,
    readingCount: counts.reading,
    toReadCount: counts['to-read'],
    wishlistCount: counts.wishlist,
    totalSpent: spent,
  }
}

export function scoreForYear(books, now) {
  const year = String(now.getFullYear())
  return books
    .filter((b) => b.date_finished?.startsWith(year))
    .reduce((sum, b) => sum + bookPoints(b), 0)
}

export function breakdownForYear(books, now) {
  const year = String(now.getFullYear())
  const counts = { book: 0, bd: 0, comics: 0, manga: 0 }
  for (const b of books) {
    if (!b.date_finished?.startsWith(year)) continue
    counts[b.type ?? 'book'] += 1
  }
  return Object.entries(BOOK_TYPES)
    .map(([key, label]) => ({
      key,
      label,
      count: counts[key],
      points: counts[key] * TYPE_POINTS[key],
    }))
    .filter((entry) => entry.count > 0)
}

export function latestFinishedByType(books) {
  // Un seul parcours : le dernier livre fini (date la plus récente) par type.
  const latest = {}
  for (const b of books) {
    if (!b.date_finished) continue
    const type = b.type ?? 'book'
    if (!latest[type] || b.date_finished > latest[type].date_finished) latest[type] = b
  }
  return Object.entries(BOOK_TYPES)
    .filter(([type]) => latest[type])
    .map(([type, label]) => ({ type, label, book: latest[type] }))
}

export function typeCounts(books) {
  const counts = { book: 0, bd: 0, comics: 0, manga: 0 }
  for (const b of books) counts[b.type ?? 'book'] += 1
  return counts
}

export function tagStatistics(books) {
  const map = new Map()
  for (const book of books) {
    for (const tag of book.tags ?? []) {
      const entry = map.get(tag) ?? { tag, count: 0, ratingSum: 0, ratingCount: 0 }
      entry.count += 1
      if (book.rating) {
        entry.ratingSum += book.rating
        entry.ratingCount += 1
      }
      map.set(tag, entry)
    }
  }
  return [...map.values()]
    .map((e) => ({
      ...e,
      avgRating: e.ratingCount ? e.ratingSum / e.ratingCount : null,
    }))
    .sort((a, b) => b.count - a.count)
}

// Bornes de la période sélectionnée : pilote tout l'onglet "Activité de
// lecture" (rythme, notes, couvertures, calendrier, livres finis par mois).
export function computePeriodRange(period, customFrom, customTo, now) {
  if (period === 'year') {
    return { start: new Date(now.getFullYear(), 0, 1), end: now }
  }
  if (period === 'rolling12') {
    return { start: new Date(now.getFullYear(), now.getMonth() - 11, 1), end: now }
  }
  if (period === 'custom') {
    return {
      start: customFrom ? parseDateOnly(customFrom) : null,
      end: customTo ? parseDateOnly(customTo) : now,
    }
  }
  return { start: null, end: now }
}

export function booksFinishedInPeriod(books, periodRange) {
  return books.filter((b) => {
    if (!b.date_finished) return false
    const d = parseDateOnly(b.date_finished)
    if (periodRange.start && d < periodRange.start) return false
    return d <= periodRange.end
  })
}

// Un mois par barre, sur la période sélectionnée, plafonné à 12 barres
// (les 12 derniers mois de la période) pour rester lisible même avec
// "Tout" sélectionné sur plusieurs années.
export function monthlyFinishedBuckets(finishedInPeriod, periodRange) {
  const end = periodRange.end
  const cappedStart = new Date(end.getFullYear(), end.getMonth() - 11, 1)
  const start =
    periodRange.start && periodRange.start > cappedStart
      ? new Date(periodRange.start.getFullYear(), periodRange.start.getMonth(), 1)
      : cappedStart

  const months = []
  const cursor = new Date(start)
  while (cursor <= end) {
    months.push({
      key: `${cursor.getFullYear()}-${cursor.getMonth()}`,
      count: 0,
      shortLabel: new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(
        cursor,
      ),
      fullLabel: new Intl.DateTimeFormat('fr-FR', {
        month: 'long',
        year: 'numeric',
      }).format(cursor),
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  const byKey = new Map(months.map((m) => [m.key, m]))
  for (const book of finishedInPeriod) {
    const [y, m] = book.date_finished.split('-').map(Number)
    const bucket = byKey.get(`${y}-${m - 1}`)
    if (bucket) bucket.count += 1
  }
  return months
}

export function computePaceStats(finishedInPeriod, periodRange) {
  const pagesRead = finishedInPeriod.reduce(
    (sum, b) => sum + (b.page_count || 0),
    0,
  )

  // Un livre commencé et fini le même jour compte comme 1 jour de lecture,
  // pas 0 : ce plancher s'applique après avoir écarté les dates
  // incohérentes (fini avant d'être commencé), qui restent filtrées comme
  // avant plutôt que remontées à 1.
  const durations = finishedInPeriod
    .filter((b) => b.date_started && b.date_finished)
    .map((b) => ({
      book: b,
      days: Math.round(
        (parseDateOnly(b.date_finished) - parseDateOnly(b.date_started)) /
          86400000,
      ),
    }))
    .filter((d) => d.days >= 0)
    .map((d) => (d.days === 0 ? { ...d, days: 1 } : d))

  const avgDays = durations.length
    ? durations.reduce((sum, d) => sum + d.days, 0) / durations.length
    : null
  const fastest = durations.length
    ? durations.reduce((a, b) => (b.days < a.days ? b : a))
    : null
  const slowest = durations.length
    ? durations.reduce((a, b) => (b.days > a.days ? b : a))
    : null

  let spanStart = periodRange.start
  if (!spanStart && finishedInPeriod.length > 0) {
    const earliest = finishedInPeriod.reduce(
      (min, b) => (b.date_finished < min ? b.date_finished : min),
      finishedInPeriod[0].date_finished,
    )
    spanStart = parseDateOnly(earliest)
  }
  const monthsSpan = spanStart
    ? Math.max(
        1,
        (periodRange.end.getFullYear() - spanStart.getFullYear()) * 12 +
          (periodRange.end.getMonth() - spanStart.getMonth()) +
          1,
      )
    : 1
  const perMonth = finishedInPeriod.length / monthsSpan

  return { pagesRead, avgDays, fastest, slowest, perMonth }
}

// Un cran par demi-étoile (0, 0.5, 1, ..., 5) : l'index est le rang *2,
// 11 crans au lieu de 6 pour les notes entières uniquement. Avec des
// étoiles empilées ("★★★½"), les étiquettes de 11 barres se chevauchaient
// (illisible) : un simple chiffre à la place, et seuls les paliers
// entiers sont étiquetés (les demi-crans restent des barres nues) pour
// aérer l'axe sans retirer de barres.
export function computeRatingBars(finishedInPeriod) {
  const counts = new Array(11).fill(0)
  for (const b of finishedInPeriod) counts[Math.round((b.rating || 0) * 2)] += 1
  return counts.map((count, i) => {
    const rating = i / 2
    const isWholeStep = rating % 1 === 0
    return {
      key: String(i),
      count,
      shortLabel: !isWholeStep ? '' : rating === 0 ? '—' : String(rating),
      fullLabel:
        rating === 0
          ? 'Non noté'
          : `${rating} étoile${rating > 1 ? 's' : ''}`,
    }
  })
}

export function averageRating(finishedInPeriod) {
  const rated = finishedInPeriod.filter((b) => b.rating > 0)
  if (!rated.length) return null
  return rated.reduce((sum, b) => sum + b.rating, 0) / rated.length
}

export function coverWall(finishedInPeriod) {
  return finishedInPeriod
    .filter((b) => b.cover_url)
    .sort((a, b) => (b.date_finished ?? '').localeCompare(a.date_finished ?? ''))
}
