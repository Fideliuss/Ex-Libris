// Entrée "quoi de neuf" affichée une fois à chaque utilisateur existant
// (voir ChangelogContext). Volontairement distincte de CHANGELOG.md : ce
// fichier-là est le journal technique (commits, PR, hash) génère/tenu à la
// main pour les releases, pas un texte pensé pour être lu par un·e
// utilisateur·rice dans l'app. On ajoute une entrée en tête de liste à
// chaque nouveauté qui mérite d'être annoncée (pas à chaque PR), au moment
// de la promotion `develop` -> `main`, en même temps que CHANGELOG.md
// (voir README.md, section GitFlow) : c'est le seul moment fiable où on
// prend du recul sur tout ce qui vient d'être livré d'un coup.
export const WHATS_NEW = [
  {
    id: '2026-09-wishlist-and-succes',
    title: 'Wishlist séparée et page Succès',
    items: [
      'La Wishlist a maintenant son propre onglet dans la Collection, à part de ce que tu possèdes déjà.',
      'Les succès ont leur propre page (bouton "Succès" à côté de "Statistiques"), avec les tiens et ceux de ton foyer.',
      'Une petite fenêtre te propose de noter un livre juste après l’avoir marqué "Lu", et de renseigner son prix/sa date d’achat quand tu le sors de la wishlist.',
      'Une barre alphabétique pour naviguer plus vite dans une grande collection, et un lien pour signaler un bug depuis ton compte.',
    ],
  },
  {
    id: '2026-09-sort-and-badges',
    title: 'Succès et tri amélioré',
    items: [
      'De nouveaux badges "Ex Libris" à débloquer au fil de tes lectures, à retrouver dans Statistiques.',
      'Le tri de la collection a été retravaillé : un filtre par auteur, un ordre croissant/décroissant, et un classement alphabétique qui respecte enfin les accents.',
    ],
  },
]

export const LATEST_CHANGELOG_ID = WHATS_NEW[0].id

// Toutes les entrées plus récentes que la dernière vue (WHATS_NEW est
// ordonné du plus récent au plus ancien) : un compte qui a raté plusieurs
// nouveautés d'affilée les voit toutes au prochain lancement, pas juste la
// dernière. `lastSeenId` inconnu ou introuvable (jamais vu ce pop-up, ou une
// très vieille entrée qu'on a fini par retirer de la liste) : on ne montre
// que la plus récente plutôt que de déverser tout l'historique d'un coup.
export function getMissedEntries(lastSeenId) {
  if (!lastSeenId) return WHATS_NEW.slice(0, 1)
  const seenIndex = WHATS_NEW.findIndex((entry) => entry.id === lastSeenId)
  if (seenIndex === -1) return WHATS_NEW.slice(0, 1)
  return WHATS_NEW.slice(0, seenIndex)
}
