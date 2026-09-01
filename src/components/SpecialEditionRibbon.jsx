// Ruban en coin façon "wishlist" (voir WishlistRibbon.jsx), mais en bas à
// droite et doré : signale une édition spéciale (Collector, Illustrée...)
// sur la fiche livre, à la place des badges texte habituels pour rester
// bien visible. Plusieurs éditions spéciales cochées empilent un ruban par
// valeur, centrés autour de la même diagonale que le ruban unique (calculé
// en JS car Tailwind ne gère pas des classes arbitraires dépendant d'un
// index de boucle).
const RIBBON_CENTER = 18
const RIBBON_GAP = 32

export default function SpecialEditionRibbon({ labels }) {
  return (
    <div
      aria-hidden="true"
      className="absolute bottom-0 right-0 w-32 h-32 overflow-hidden pointer-events-none z-10"
    >
      {labels.map((label, i) => (
        <div
          key={label}
          style={{
            bottom: `${RIBBON_CENTER + (i - (labels.length - 1) / 2) * RIBBON_GAP}px`,
          }}
          className="absolute right-[-40px] w-[150px] -rotate-45 text-center bg-brass-fill text-white font-mono text-[10px] font-bold leading-none uppercase tracking-widest py-1 shadow"
        >
          {label}
        </div>
      ))}
    </div>
  )
}
