// Traduit les erreurs réseau/Supabase les plus courantes en messages
// compréhensibles, plutôt que d'afficher le texte brut (souvent en anglais,
// parfois cryptique) renvoyé par fetch ou Postgres.
export function describeError(err) {
  const message = err?.message ?? String(err)

  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return 'Impossible de contacter le serveur. Vérifie ta connexion et réessaie.'
  }
  if (/row-level security|permission denied/i.test(message)) {
    return "Tu n'as pas le droit d'effectuer cette action."
  }
  return `Une erreur est survenue : ${message}`
}
