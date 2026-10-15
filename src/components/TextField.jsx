import { inputClass } from '../lib/ui'

// Champ texte avec son libellé, relié par id/htmlFor. `onChange` reçoit la
// valeur (pas l'événement). Les autres props vont à l'<input>.
export default function TextField({ id, label, onChange, className, ...inputProps }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium mb-1">
        {label}
      </label>
      <input
        id={id}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
        {...inputProps}
      />
    </div>
  )
}
