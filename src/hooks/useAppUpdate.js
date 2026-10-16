import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

// Une mise à jour est cherchée toutes les heures, et au retour sur l'appli si
// la dernière vérification date de plus d'un quart d'heure : une PWA installée
// reste souvent ouverte en arrière-plan pendant des jours.
const CHECK_EVERY_MS = 60 * 60 * 1000
const MIN_GAP_ON_FOCUS_MS = 15 * 60 * 1000

// État des mises à jour de l'application (service worker). Quand une nouvelle
// build est prête, `needRefresh` passe à true et `nextVersion` donne sa
// version et son commit ({ version, commit }, ou null si on n'a pas pu les
// lire). `reload()` active la nouvelle build et recharge la page ; `dismiss()`
// masque l'avis jusqu'au prochain chargement.
export function useAppUpdate() {
  const [registration, setRegistration] = useState(null)
  const [nextVersion, setNextVersion] = useState(null)
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      if (reg) setRegistration(reg)
    },
  })

  useEffect(() => {
    if (!registration) return
    let lastCheck = Date.now()
    function check() {
      lastCheck = Date.now()
      registration.update().catch(() => {
        // Hors ligne ou serveur injoignable : on réessaiera plus tard.
      })
    }
    function onVisible() {
      if (document.visibilityState === 'visible' && Date.now() - lastCheck > MIN_GAP_ON_FOCUS_MS) {
        check()
      }
    }
    const timer = setInterval(check, CHECK_EVERY_MS)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [registration])

  // Le service worker en attente ne dit pas de quelle version il s'agit :
  // version.json est émis à chaque build et n'est jamais mis en cache.
  useEffect(() => {
    if (!needRefresh) return
    let active = true
    fetch('/version.json', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((info) => {
        if (active && info) setNextVersion(info)
      })
      .catch(() => {
        // L'avis s'affiche quand même, sans le numéro.
      })
    return () => {
      active = false
    }
  }, [needRefresh])

  return {
    needRefresh,
    nextVersion,
    reload: () => updateServiceWorker(true),
    dismiss: () => setNeedRefresh(false),
  }
}
