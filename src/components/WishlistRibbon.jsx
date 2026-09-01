import { STATUS_LABELS } from '../lib/statusLabels'

// Ruban en coin façon "wishlist". La bande diagonale est plus large que
// son enveloppe carrée (fixe, indépendante de la largeur de la carte) :
// ses 4 coins sortent toujours de cette enveloppe, donc `overflow-hidden`
// la découpe proprement des deux côtés au lieu de laisser une pointe
// visible en plein milieu de la couverture.
export default function WishlistRibbon() {
  return (
    <div
      aria-hidden="true"
      className="absolute top-0 left-0 w-20 h-20 overflow-hidden pointer-events-none z-10"
    >
      <div className="absolute left-[-40px] top-[18px] w-[150px] -rotate-45 text-center bg-wishlist-fill text-white font-mono text-[10px] font-bold uppercase tracking-widest py-0.5 shadow">
        {STATUS_LABELS.wishlist}
      </div>
    </div>
  )
}
