import { compareFr } from './text'
import { authorSortKey } from './authorSort'
import { parseDateOnly } from './dates'
import { STATUS_LABELS, STATUS_ORDER } from './statusLabels'

// Départage à l'alphabétique (titre) toute égalité de tri : deux livres du
// même auteur, à la même note, etc. sinon leur ordre relatif ne voudrait
// rien dire pour l'utilisateur (il refléterait juste l'ordre d'insertion).
// Un manga/comics/BD a en général le même titre pour tous ses tomes (juste
// le numéro qui change) : à titre égal, on affine donc par numéro de tome
// pour que la série s'affiche dans l'ordre de lecture plutôt qu'au hasard.
export function titleCompare(a, b) {
  return (
    compareFr(a.title, b.title) ||
    (a.series_index ?? 0) - (b.series_index ?? 0)
  )
}

// Livre sans date de fin : tout en bas (epoch), comme avant.
export function finishedTime(book) {
  return book.date_finished ? Date.parse(book.date_finished) : 0
}

// Numéro d'un hors-série pour le tri : sans numéro, il passe après ceux qui en ont.
function offSeriesNumber(book) {
  return book.series_index ?? Number.MAX_SAFE_INTEGER
}

export const SORT_OPTIONS = {
  title: {
    label: 'Titre',
    compare: titleCompare,
  },
  author: {
    label: 'Auteur',
    compare: (a, b) =>
      compareFr(authorSortKey(a.author), authorSortKey(b.author)) ||
      titleCompare(a, b),
  },
  recent: {
    label: 'Date d’ajout',
    compare: (a, b) =>
      Date.parse(b.created_at) - Date.parse(a.created_at) || titleCompare(a, b),
  },
  finished: {
    label: 'Date de fin de lecture',
    compare: (a, b) =>
      finishedTime(b) - finishedTime(a) || titleCompare(a, b),
  },
  rating: {
    label: 'Note',
    compare: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || titleCompare(a, b),
  },
  status: {
    label: 'Statut',
    compare: (a, b) =>
      STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) ||
      titleCompare(a, b),
  },
  // Trie d'abord par série (les livres sans série regroupés à part), puis
  // par numéro de tome à l'intérieur de chaque série : trier par tome seul,
  // toutes séries confondues, mélangerait les séries entre elles. Les
  // hors-séries passent après les tomes de leur série, par numéro, ceux sans
  // numéro en dernier (même ordre que la rangée de tomes de la fiche).
  tome: {
    label: 'Tome',
    compare: (a, b) =>
      compareFr(a.series ?? '', b.series ?? '') ||
      Number(Boolean(a.is_off_series)) - Number(Boolean(b.is_off_series)) ||
      (a.is_off_series
        ? offSeriesNumber(a) - offSeriesNumber(b)
        : (a.series_index ?? 0) - (b.series_index ?? 0)) ||
      titleCompare(a, b),
  },
}

export function monthLabel(date) {
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
    date,
  )
}

// `localeCompare('fr')` compare d'abord les lettres de base en ignorant les
// accents ("e" ≈ "é" ≈ "ê", comme dans un vrai classement alphabétique de
// bibliothèque) et ne s'en sert qu'en tout dernier recours pour départager :
// "Ecotopia" < "Êtes-vous..." < "Étude..." est donc un ordre de tri
// parfaitement correct. Regrouper par première lettre EXACTE (E ≠ Ê ≠ É)
// est incohérent avec ça : un livre accentué peut se retrouver coincé entre
// deux livres non accentués de la même lettre, cassant le groupe en deux
// au lieu de le fusionner. On regroupe donc en ignorant les accents aussi.
// Une valeur vide ou blanche (titre absent) va dans le groupe "#" plut\u00f4t que
// de faire \u00e9chouer l'affichage de toute la collection.
export function letterGroupKey(str) {
  const first = (str ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')[0]
  return first?.trim() ? first.toUpperCase() : '#'
}

// Détermine l'en-tête de section pour un livre selon le tri actif (lettre,
// mois, statut, série, note...). Toujours une étiquette explicite, y compris
// pour les livres sans valeur pour le critère actif (contigus grâce au tri
// ci-dessus) : les laisser sans en-tête donnait l'impression qu'ils étaient
// rangés n'importe où plutôt que volontairement à part.
export function groupKeyFor(book, sortKey) {
  if (sortKey === 'title') return letterGroupKey(book.title)
  if (sortKey === 'author') {
    const key = authorSortKey(book.author)
    return key ? letterGroupKey(key) : 'Auteur inconnu'
  }
  if (sortKey === 'recent') return monthLabel(new Date(book.created_at))
  if (sortKey === 'finished')
    return book.date_finished
      ? monthLabel(parseDateOnly(book.date_finished))
      : 'Non terminé'
  if (sortKey === 'status') return STATUS_LABELS[book.status] ?? null
  if (sortKey === 'rating') {
    if (!(book.rating > 0)) return 'Non noté'
    // En-tête de groupe purement textuel (pas la place pour le composant
    // StarRating ici) : étoiles pleines + ½ si besoin plutôt qu'arrondir et
    // perdre la distinction entre 3 et 3,5 par exemple.
    return '★'.repeat(Math.floor(book.rating)) + (book.rating % 1 !== 0 ? '½' : '')
  }
  if (sortKey === 'tome') return book.series || 'Sans série'
  return null
}
