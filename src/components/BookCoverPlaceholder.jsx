// Couverture "sans image" façon collection blanche (double filet, auteur en
// petites capitales, titre en italique) plutôt qu'un simple texte gris —
// une bonne partie des livres ajoutés à la main n'ont jamais de cover_url,
// ça n'a pas à ressembler à un état cassé.
export default function BookCoverPlaceholder({ title, author }) {
  return (
    <div className="w-full h-full bg-cover flex items-center justify-center">
      <div className="absolute inset-3 border-t border-b border-ink/80 flex flex-col items-center justify-between py-3">
        <span className="font-sans text-[9px] tracking-[0.14em] uppercase text-ink/80 text-center px-1">
          {author}
        </span>
        <span className="font-serif italic text-stamp text-xs leading-snug text-center px-1 line-clamp-3">
          {title}
        </span>
        <span aria-hidden="true" className="block w-1 h-1" />
      </div>
    </div>
  )
}
