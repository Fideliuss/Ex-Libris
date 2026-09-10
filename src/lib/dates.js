// `new Date().toISOString()` convertit en UTC et peut décaler d'un jour en
// soirée selon le fuseau ; on construit la date locale à la main.
export function todayDateOnly() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
