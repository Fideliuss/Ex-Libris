// Version et commit de la build en cours, injectés par Vite au moment du
// build (voir vite.config.js). Hors build (tests), les constantes n'existent
// pas : on retombe sur des valeurs neutres.
const version = typeof __APP_VERSION__ === 'undefined' ? 'dev' : __APP_VERSION__
const commit = typeof __APP_COMMIT__ === 'undefined' ? '' : __APP_COMMIT__

// "v1.12.2 (48c81a2)", ou "v1.12.2" sans commit (build locale), ou "dev".
export function formatAppVersion(versionValue, commitValue) {
  if (versionValue === 'dev') return 'dev'
  return commitValue ? `v${versionValue} (${commitValue})` : `v${versionValue}`
}

export const APP_VERSION = version
export const APP_VERSION_LABEL = formatAppVersion(version, commit)
