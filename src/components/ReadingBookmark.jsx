// Marque-page qui dépasse du haut de la couverture pour "En cours" : un
// onglet coloré avec une encoche en V au bas, comme un vrai signet glissé
// dans le livre.
export default function ReadingBookmark() {
  return (
    <div
      aria-hidden="true"
      className="absolute top-0 right-4 w-4 h-9 bg-reading shadow pointer-events-none z-10"
      style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)' }}
    />
  )
}
