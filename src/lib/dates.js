// Les champs "date" Postgres (date_started, date_finished, purchase_date...)
// n'ont pas d'heure : les parser avec `new Date(string)` les interprète en
// UTC et peut décaler d'un jour selon le fuseau du navigateur. On construit
// la date en local à partir de ses parties.
export function parseDateOnly(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// "2024-05-03" -> "03/05/2024" (null si la valeur est vide).
export function formatDate(value) {
  if (!value) return null
  const [y, m, d] = value.split('-')
  return `${d}/${m}/${y}`
}

// Date locale au format "YYYY-MM-DD". `new Date().toISOString()` convertit
// en UTC et peut décaler d'un jour en soirée selon le fuseau.
export function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function todayDateOnly() {
  return toDateKey(new Date())
}
