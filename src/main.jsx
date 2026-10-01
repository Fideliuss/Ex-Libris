import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// ErrorBoundary vit maintenant à l'intérieur de App.jsx, sous les providers
// (Auth, HouseholdView...) plutôt qu'ici autour de <App/> — voir son
// commentaire d'en-tête pour pourquoi.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
