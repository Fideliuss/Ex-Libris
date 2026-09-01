// Ruban en coin façon "wishlist" (voir WishlistRibbon.jsx), mais en bas à
// droite et doré : signale une édition spéciale (Collector, Illustrée...)
// sur la fiche livre, à la place des badges texte habituels pour rester
// bien visible.
export default function SpecialEditionRibbon({ label }) {
  return (
    <div
      aria-hidden="true"
      className="absolute bottom-0 right-0 w-20 h-20 overflow-hidden pointer-events-none z-10"
    >
      <div className="absolute right-[-40px] bottom-[18px] w-[150px] -rotate-45 text-center bg-brass-fill text-white font-mono text-[10px] font-bold uppercase tracking-widest py-0.5 shadow">
        {label}
      </div>
    </div>
  )
}
