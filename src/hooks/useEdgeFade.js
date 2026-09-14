import { useEffect, useState } from 'react'

// Sait si un conteneur scrollable a encore du contenu caché à gauche/à
// droite, pour afficher un indice de défilement horizontal (un dégradé en
// bord de zone) plutôt qu'un contenu tronqué sans indication qu'il reste
// caché même une fois arrivé au bout.
export function useEdgeFade(ref) {
  const [fade, setFade] = useState({ left: false, right: false })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    function update() {
      setFade({
        left: el.scrollLeft > 4,
        right: el.scrollLeft < el.scrollWidth - el.clientWidth - 4,
      })
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [ref])

  return fade
}
