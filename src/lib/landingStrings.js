// Textes de la page vitrine, en français et en anglais. Séparés du composant
// pour que Landing.jsx ne garde que la mise en page et les animations.
export const STRINGS = {
  fr: {
    nav: { features: 'Fonctionnalités', pricing: 'Tarifs', login: 'Se connecter' },
    hero: {
      eyebrow: 'Ta bibliothèque personnelle',
      titleLine1: 'La bibliothèque qui porte',
      titleLine2: 'ton nom.',
      subtitle:
        'Scanne, classe, suis tes objectifs de lecture et partage le tout avec ton foyer.',
      cta: 'Se connecter',
    },
    featuresTitle: 'Tu es plutôt...',
    features: [
      {
        title: 'Le collectionneur pressé',
        text: 'Tu rentres avec dix nouveaux livres ? Scanne le code-barres et la fiche se remplit toute seule — auteur, éditeur, résumé, en quelques secondes.',
      },
      {
        title: 'Le lecteur organisé',
        text: 'Livres, BD, comics, mangas : chacun garde sa place. Statuts, tags, séries, éditeurs — ta collection reste rangée même quand elle explose.',
      },
      {
        title: 'Qui vise un objectif',
        text: "Un objectif de lecture par an, un système de points, un calendrier. Tu sais où tu en es sans avoir à compter toi-même.",
      },
      {
        title: 'Qui partage en foyer',
        text: 'Chacun garde ses livres, mais vous voyez tout le foyer côte à côte, sans jamais les mélanger.',
      },
    ],
    howTitle: 'Comment ça marche',
    steps: [
      {
        title: 'Scanne ou cherche',
        text: 'Ajoute un livre en scannant son ISBN ou en le cherchant à la main.',
      },
      {
        title: 'Suis ta progression',
        text: 'Statut de lecture, notes, objectif annuel : ta collection évolue avec toi.',
      },
      {
        title: 'Partage',
        text: 'Invite ton foyer pour voir sa collection à côté de la tienne.',
      },
    ],
    pricingTitle: 'Tarifs',
    pricingNote: "Aperçu, l'application n'est pas encore ouverte au public.",
    billingToggle: { monthly: 'Mensuel', annual: 'Annuel', save: "Jusqu'à -28%" },
    pricing: [
      {
        name: 'Basic',
        priceMonthly: 'Gratuit',
        priceAnnual: 'Gratuit',
        tagline: 'Pour découvrir ta bibliothèque perso.',
        items: ['Collection limitée (1000 livres)', 'Scan ISBN', 'Statuts de lecture de base'],
      },
      {
        name: 'Premium',
        priceMonthly: '1,99€/mois',
        priceAnnual: '19,99€/an',
        tagline: 'Pour les lecteurs assidus.',
        items: ['Collection illimitée', 'Statistiques, objectifs & succès Ex Libris', 'Historique de lecture complet'],
      },
      {
        name: 'Duo',
        priceMonthly: '2,99€/mois',
        priceAnnual: '25,99€/an',
        tagline: 'Pour partager à deux.',
        items: ['Tout Premium', 'Partage à deux (foyer de 2)', 'Vue croisée des bibliothèques'],
        highlighted: true,
        badge: 'Recommandé',
      },
      {
        name: 'Family',
        priceMonthly: '3,49€/mois',
        priceAnnual: '33,99€/an',
        tagline: 'Pour toute la famille.',
        items: ['Tout Duo', "Foyer jusqu'à 6 comptes", 'Gestion des permissions'],
      },
    ],
    finalCtaTitle: 'Prêt·e à ranger ta bibliothèque ?',
    footer: 'Ex Libris',
    legalNotice: 'Mentions légales',
    privacyPolicy: 'Confidentialité',
  },
  en: {
    nav: { features: 'Features', pricing: 'Pricing', login: 'Log in' },
    hero: {
      eyebrow: 'Your personal library',
      titleLine1: 'The library that bears',
      titleLine2: 'your name.',
      subtitle:
        'Scan, sort, track your reading goals and share it all with your household.',
      cta: 'Log in',
    },
    featuresTitle: "You're the type who...",
    features: [
      {
        title: 'The rushed collector',
        text: 'Coming home with ten new books? Scan the barcode and the entry fills itself in — author, publisher, summary, in seconds.',
      },
      {
        title: 'The organized reader',
        text: 'Books, comics, manga: everything keeps its place. Status, tags, series, publishers — your collection stays tidy even as it grows.',
      },
      {
        title: 'Chasing a goal',
        text: 'A yearly reading goal, a points system, a calendar. You always know where you stand, without counting it yourself.',
      },
      {
        title: 'Sharing with your household',
        text: 'Everyone keeps their own books, but you see the whole household side by side, never mixed up.',
      },
    ],
    howTitle: 'How it works',
    steps: [
      {
        title: 'Scan or search',
        text: 'Add a book by scanning its ISBN or searching for it manually.',
      },
      {
        title: 'Track your progress',
        text: 'Reading status, ratings, yearly goal: your collection evolves with you.',
      },
      {
        title: 'Share',
        text: 'Invite your household to see their collection next to yours.',
      },
    ],
    pricingTitle: 'Pricing',
    pricingNote: "Preview, the app isn't open to the public yet.",
    billingToggle: { monthly: 'Monthly', annual: 'Annual', save: 'Up to -28%' },
    pricing: [
      {
        name: 'Basic',
        priceMonthly: 'Free',
        priceAnnual: 'Free',
        tagline: 'To discover your personal library.',
        items: ['Limited collection (1,000 books)', 'ISBN scan', 'Basic reading statuses'],
      },
      {
        name: 'Premium',
        priceMonthly: '€1.99/mo',
        priceAnnual: '€19.99/yr',
        tagline: 'For dedicated readers.',
        items: ['Unlimited collection', 'Stats, goals & Ex Libris achievements', 'Full reading history'],
      },
      {
        name: 'Duo',
        priceMonthly: '€2.99/mo',
        priceAnnual: '€25.99/yr',
        tagline: 'To share with one other person.',
        items: ['Everything in Premium', 'Sharing for two (a household of 2)', "A shared view of both libraries"],
        highlighted: true,
        badge: 'Recommended',
      },
      {
        name: 'Family',
        priceMonthly: '€3.49/mo',
        priceAnnual: '€33.99/yr',
        tagline: 'For the whole family.',
        items: ['Everything in Duo', 'A household of up to 6', 'Permission management'],
      },
    ],
    finalCtaTitle: 'Ready to organize your library?',
    footer: 'Ex Libris',
    legalNotice: 'Legal notice',
    privacyPolicy: 'Privacy',
  },
}
