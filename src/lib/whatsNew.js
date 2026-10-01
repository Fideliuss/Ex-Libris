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
    id: '2026-10-smarter-filters',
    title: 'Des filtres plus malins',
    items: [
      'Les filtres de la Collection se resserrent maintenant entre eux : choisir un type (ou toute autre option) ne propose plus que ce qui existe vraiment dans ce sous-ensemble.',
      'Les filtres sont maintenant aussi disponibles sur l’onglet "À compléter", et une recherche sans résultat te propose d’aller voir dans l’autre onglet (Collection ↔ Wishlist).',
      'Changer de membre du foyer ne se réinitialise plus en changeant de page (Stats, Succès, retour d’une fiche).',
      'Un bug qui pouvait bloquer la navigation avec "Retour" après une mise en veille de l’app est corrigé.',
    ],
  },
  {
    id: '2026-09-format-reliure-webp',
    title: 'Format et reliure repensés',
    items: [
      'Le format et la reliure d’un livre se choisissent maintenant avec de vraies pastilles à sélection unique, plus lisibles que des cases à cocher.',
      'Ils sont pris en compte dans le calcul des fiches "à compléter", avec une présentation dédiée sur la fiche du livre.',
      'Les couvertures que tu ajoutes sont maintenant optimisées automatiquement (plus légères, s’affichent plus vite).',
    ],
  },
  {
    id: '2026-09-half-stars-and-wishlist',
    title: 'Notes en demi-étoiles et ajout plus rapide',
    items: [
      'Tu peux maintenant noter un livre avec des demi-étoiles, pas juste des notes entières.',
      'Une case à cocher "Je le veux" tout en haut du formulaire d’ajout, pour marquer un livre en wishlist en un clic sans fouiller dans le formulaire.',
      'La couverture d’un livre s’affiche en grand d’un clic, et accepte maintenant le glisser-déposer pour l’ajouter.',
      'Les succès de ton foyer sont maintenant sauvegardés pour de bon : avant, ils ne vivaient que dans ton navigateur et ne se voyaient pas d’un appareil à l’autre.',
    ],
  },
  {
    id: '2026-09-household',
    title: 'Un foyer à plusieurs personnes',
    items: [
      'Le partage n’est plus limité à deux comptes : invite tout ton foyer (famille, colocataires...) et voyez toutes vos collections côte à côte.',
      'Le panneau Partage (dans Compte) a été refait : liste des membres, code ami pour inviter, invitations en attente, tout au même endroit.',
    ],
  },
  {
    id: '2026-09-multi-author',
    title: 'Plusieurs auteurs, traducteurs, illustrateurs par livre',
    items: [
      'Tu peux maintenant ajouter plusieurs auteurs, traducteurs ou illustrateurs par livre, avec des suggestions basées sur ceux déjà dans ta collection.',
      'Le filtre par auteur dans la Collection cible maintenant chaque personne individuellement, plus seulement la chaîne de texte complète.',
    ],
  },
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
