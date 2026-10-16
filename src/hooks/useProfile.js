import { createContext, useContext } from 'react'

export const ProfileContext = createContext(undefined)

// Profil de l'utilisateur courant, chargé une seule fois à la connexion et
// partagé (Tutoriel, Nouveautés, Succès, Compte, Partage) au lieu d'une
// requête identique par consommateur. `profile` vaut undefined tant qu'il
// charge, null si le compte n'a pas de profil.
export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (ctx === undefined) {
    throw new Error("useProfile doit être utilisé à l'intérieur de <ProfileProvider>")
  }
  return ctx
}
