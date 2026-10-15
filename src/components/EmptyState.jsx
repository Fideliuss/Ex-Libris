// Message centré quand une liste n'a rien à montrer : titre en serif, puis
// le détail ou l'action en enfants.
export default function EmptyState({ title, children }) {
  return (
    <div className="text-center py-16">
      <p className="font-serif text-xl mb-2">{title}</p>
      {children}
    </div>
  )
}
