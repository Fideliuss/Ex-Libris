import { createContext, useContext } from 'react'

export const TutorialContext = createContext(undefined)

export function useTutorial() {
  const ctx = useContext(TutorialContext)
  if (ctx === undefined) {
    throw new Error("useTutorial doit être utilisé à l'intérieur de <TutorialProvider>")
  }
  return ctx
}
