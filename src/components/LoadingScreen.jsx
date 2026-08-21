// Écran de chargement : le logo (livre ouvert) flotte doucement, plutôt
// qu'un simple "Chargement…" statique.
export default function LoadingScreen({ fullScreen = true, label = 'Chargement…' }) {
  const content = (
    <div className="flex flex-col items-center gap-3">
      <img src="/favicon.svg" alt="" className="w-10 h-10 animate-float" />
      <p className="font-mono text-sm text-ink/60">{label}</p>
    </div>
  )

  if (!fullScreen) {
    return <div className="flex justify-center py-16">{content}</div>
  }

  return (
    <div className="min-h-svh flex items-center justify-center">{content}</div>
  )
}
