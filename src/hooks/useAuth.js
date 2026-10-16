import { createContext, useContext } from 'react'

export const AuthContext = createContext(undefined)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) {
    throw new Error("useAuth doit être utilisé à l'intérieur de <AuthProvider>")
  }
  return ctx
}
