// Traduit les erreurs de l'API d'authentification en messages destinés à
// l'utilisateur final.

// Écart d'horloge système côté client : le JWT semble "émis dans le futur"
// par rapport à l'heure locale. Un simple rafraîchissement suffit en général
// (nouvelle requête, nouvel horodatage), sans attendre que l'utilisateur
// corrige l'horloge de sa machine.
export function isClockSkewError(error) {
  const message = error.message ?? ''
  return /issued.*(at|in).*future|jwt.*future/i.test(message)
}

export function describeSignInError(error) {
  const code = error.code ?? ''
  const message = error.message ?? ''

  if (code === 'email_not_confirmed' || /email.*not.*confirm/i.test(message)) {
    return "Ce compte n'est pas encore confirmé. Ouvre le lien de confirmation reçu par email, puis réessaie."
  }
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(message)) {
    return 'Email ou mot de passe incorrect.'
  }
  if (isClockSkewError(error)) {
    return 'Erreur temporaire de connexion. Rafraîchis la page et réessaie.'
  }
  return `Connexion impossible : ${message || 'erreur inconnue'}.`
}

export function describeSignUpError(error) {
  const code = error.code ?? ''
  const message = error.message ?? ''

  if (code === 'user_already_exists' || /already registered|already exists/i.test(message)) {
    return 'Un compte existe déjà avec cet email.'
  }
  if (code === 'weak_password' || /password/i.test(message)) {
    return 'Mot de passe trop faible : essaie au moins 6 caractères.'
  }
  return `Impossible de créer le compte : ${message || 'erreur inconnue'}.`
}
