import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Erreur non gérée :', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-svh flex items-center justify-center p-6">
          <div className="max-w-sm w-full bg-card border-t-4 border-dashed border-stamp rounded-sm shadow-sm p-8 text-center">
            <h1 className="font-serif text-2xl font-semibold mb-2">
              Une erreur est survenue
            </h1>
            <p className="text-sm text-ink/70 mb-4">
              Quelque chose s'est mal passé. Recharge la page pour continuer.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-sm bg-library text-white font-medium px-4 py-2 text-sm hover:bg-library/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library"
            >
              Recharger
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
