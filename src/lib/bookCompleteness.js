// Champs qu'un scan ISBN réussi remplit normalement tout seul (ISBN compris
// désormais : un livre jamais scanné, ou importé sans ISBN, doit lui aussi
// être signalé comme incomplet). Même critère partagé entre BookForm.jsx (le
// bandeau du formulaire), BookDetail.jsx (le bandeau de la fiche) et
// Collection.jsx (l'onglet « À compléter ») — un seul endroit à faire
// évoluer plutôt que trois copies désynchronisées.
export function getMissingFields(book) {
  return [
    !book.isbn && 'ISBN',
    !book.cover_url && 'Couverture',
    !book.author?.length && 'Auteur',
    !book.publisher && 'Éditeur',
    !book.page_count && 'Pages',
    !book.description && 'Résumé',
  ].filter(Boolean)
}

export function isBookIncomplete(book) {
  return getMissingFields(book).length > 0
}
