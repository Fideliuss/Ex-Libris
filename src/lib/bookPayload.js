// Liste sans valeurs vides, ou null si rien ne reste : les champs à valeurs
// multiples (auteurs, éditions...) sont stockés à null plutôt qu'en tableau
// vide, comme partout dans l'app.
export function nullIfEmpty(list) {
  const cleaned = (list ?? []).filter(Boolean)
  return cleaned.length > 0 ? cleaned : null
}
