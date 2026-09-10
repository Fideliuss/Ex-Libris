// Entrée "quoi de neuf" affichée une fois à chaque utilisateur existant
// (voir ChangelogContext). Volontairement distincte de CHANGELOG.md : ce
// fichier-là est le journal technique (commits, PR, hash) génère/tenu à la
// main pour les releases, pas un texte pensé pour être lu par un·e
// utilisateur·rice dans l'app. On ajoute une entrée en tête de liste à
// chaque nouveauté qui mérite d'être annoncée (pas à chaque PR).
export const WHATS_NEW = [
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
