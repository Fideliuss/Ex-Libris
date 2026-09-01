export const BOOK_TYPES = {
  book: 'Livre',
  bd: 'BD',
  comics: 'Comics',
  manga: 'Manga',
}

// Types pour lesquels la fiche et la carte mettent en avant la série + le
// numéro de tome plutôt que le titre : uniquement manga, où le titre de
// chaque tome n'apporte quasi jamais d'info distincte de la série. Les
// comics ont presque toujours un titre propre à chaque tome (ex: "Guerre
// Civile" pour le tome 1 de "Civil War") : masquer ce titre ferait perdre
// une vraie information.
export const SERIES_DRIVEN_TYPES = ['manga']
