// Ruban en coin façon "wishlist" (voir WishlistRibbon.jsx), mais en bas à
// droite et doré : signale une édition spéciale (Collector, Illustrée...)
// sur la fiche livre, à la place des badges texte habituels pour rester
// bien visible. Un seul ruban même si plusieurs éditions spéciales sont
// cochées : en empiler un par valeur cliquait vite au débordement et
// faisait trop de bruit visuel dès 2-3 éditions cumulées. Un retour à la
// ligne par valeur (plutôt qu'un texte joint qui coupe au milieu d'un mot
// selon la largeur disponible) garde chaque nom lisible d'un bloc.
export default function SpecialEditionRibbon({ labels }) {
  return (
    <div
      aria-hidden="true"
      className="absolute bottom-0 right-0 w-28 h-28 overflow-hidden pointer-events-none z-10"
    >
      <div className="absolute right-[-40px] bottom-[10px] w-[160px] -rotate-45 text-center bg-brass-fill text-white font-mono text-[10px] font-bold uppercase tracking-widest py-1 leading-tight shadow">
        {labels.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>
    </div>
  )
}
