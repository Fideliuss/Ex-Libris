import { useEffect, useState } from 'react'

export const THEME_STORAGE_KEY = 'theme-preference'

const DARK_MEDIA = '(prefers-color-scheme: dark)'

function applyTheme(theme) {
  const root = document.documentElement
  if (theme === 'light' || theme === 'dark') {
    root.dataset.theme = theme
  } else {
    delete root.dataset.theme
  }
}

// Couleur de la barre d'état du navigateur/PWA — hors-sujet pour le CSS de
// la page, donc mise à jour à la main plutôt que par les tokens.
function updateThemeColorMeta(isDark) {
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', isDark ? '#161310' : '#eae1cb')
}

// 'light' | 'dark' | 'system'. La préférence système est gérée en pur CSS
// (media query dans index.css) : ce hook ne fait que poser/retirer
// data-theme sur <html>, index.html a sa propre copie de applyTheme() pour
// l'appliquer avant le premier rendu et éviter un flash du mauvais thème.
export function useTheme() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(THEME_STORAGE_KEY) ?? 'system',
  )

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(THEME_STORAGE_KEY, theme)

    if (theme !== 'system') {
      updateThemeColorMeta(theme === 'dark')
      return
    }

    // En mode "système", la barre d'état doit suivre l'OS en direct — pas
    // seulement au moment où l'utilisateur choisit "Système".
    const media = window.matchMedia(DARK_MEDIA)
    updateThemeColorMeta(media.matches)
    const onChange = (e) => updateThemeColorMeta(e.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  return [theme, setTheme]
}
