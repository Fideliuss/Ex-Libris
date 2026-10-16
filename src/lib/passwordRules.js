export const MIN_PASSWORD_LENGTH = 6

// Message d'erreur si le nouveau mot de passe est refusé, sinon null.
export function validateNewPassword(password, confirmation) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`
  }
  if (password !== confirmation) {
    return 'Les mots de passe ne correspondent pas.'
  }
  return null
}
