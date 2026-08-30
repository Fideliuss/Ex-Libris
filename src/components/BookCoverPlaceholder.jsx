// Couverture "sans image" façon collection blanche (double filet, auteur en
// petites capitales, titre en italique) plutôt qu'un simple texte gris —
// une bonne partie des livres ajoutés à la main n'ont jamais de cover_url,
// ça n'a pas à ressembler à un état cassé. `volume` (tome) ne s'affiche que
// pour un manga en série, comme le reste de la fiche.
export default function BookCoverPlaceholder({ title, author, volume }) {
  return (
    <div className="w-full h-full bg-cover flex items-center justify-center">
      <div className="absolute inset-3 border-t border-b border-ink/80 flex flex-col items-center justify-between py-3">
        <span className="font-sans text-[9px] tracking-[0.14em] uppercase text-ink/80 text-center px-1">
          {author}
        </span>
        <span className="flex flex-col items-center gap-1 px-1">
          <span className="font-serif italic text-stamp text-xs leading-snug text-center line-clamp-3">
            {title}
          </span>
          {volume != null && (
            <span className="font-serif italic text-brass text-[11px]">Tome {volume}</span>
          )}
        </span>
        <span className="font-sans text-[8px] tracking-[0.18em] uppercase text-ink/70">
          Ex Libris
        </span>
      </div>
    </div>
  )
}
