// Un manga ou un comics se lit bien plus vite qu'un roman : les compter
// pour 1 point chacun gonflerait artificiellement le score de lecture.
export const TYPE_POINTS = {
  book: 1,
  bd: 0.5,
  comics: 0.5,
  manga: 1 / 3,
}

export function bookPoints(book) {
  return TYPE_POINTS[book.type ?? 'book'] ?? 1
}

// Enlève les zéros inutiles après la virgule (9.50 -> 9.5, 12.00 -> 12), le
// score cumulant des points fractionnaires (1, 1/2, 1/3 selon le type).
export function formatScore(value) {
  return value.toFixed(2).replace(/\.?0+$/, '')
}
