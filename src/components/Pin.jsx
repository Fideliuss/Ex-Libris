// Punaise de coin, façon mur à trophées : partagée entre la page vitrine
// (cartes de tarifs) et les plaques de succès.
export default function Pin({ className = '', size = 'w-2', style }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute ${size} aspect-square rounded-full ${className}`}
      style={{
        background: 'radial-gradient(circle at 35% 35%, #f0dcae, #8e7145 75%)',
        boxShadow: '0 2px 3px rgba(0,0,0,0.5)',
        ...style,
      }}
    />
  )
}
