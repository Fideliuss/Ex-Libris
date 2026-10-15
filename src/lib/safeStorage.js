// Accès à localStorage/sessionStorage sans jamais lever : le stockage peut
// être indisponible (navigation privée, quota plein, accès bloqué) et ce ne
// sont que des préférences de confort, jamais un état dont dépend l'app.
function wrap(getStorage) {
  return {
    get(key) {
      try {
        return getStorage().getItem(key)
      } catch {
        return null
      }
    },
    set(key, value) {
      try {
        getStorage().setItem(key, value)
      } catch {
        // Tant pis : ce n'est qu'une préférence.
      }
    },
    remove(key) {
      try {
        getStorage().removeItem(key)
      } catch {
        // Idem.
      }
    },
  }
}

export const safeLocal = wrap(() => localStorage)
export const safeSession = wrap(() => sessionStorage)
