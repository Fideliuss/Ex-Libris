// Utilitaires communs aux imports de bibliothèque (Libib, My Library).

export function clean(value) {
  if (value == null) return ''
  return String(value).trim()
}

// "a, b , ,c" -> ["a", "b", "c"]
export function splitList(value) {
  return clean(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}
