export const STATUS_LABELS = {
  wishlist: 'Wishlist',
  'to-read': 'PAL',
  reading: 'En cours',
  read: 'Lu',
}

// Signal discret de statut, sur la bordure des cartes et les badges.
export const STATUS_BORDER_CLASS = {
  wishlist: 'border-wishlist',
  'to-read': 'border-toread',
  reading: 'border-reading',
  read: 'border-library',
}

// Badges de statut : fond plein + texte blanc, avec des teintes dédiées
// (--color-toread/--color-reading/--color-read) plutôt que les tokens de
// texte utilisés ailleurs dans l'UI — nécessaire pour rester lisible en
// mode sombre (voir le commentaire dans index.css).
export const STATUS_BADGE_CLASS = {
  wishlist: 'bg-wishlist-fill text-white',
  'to-read': 'bg-toread text-white',
  reading: 'bg-reading text-white',
  read: 'bg-read text-white',
}
