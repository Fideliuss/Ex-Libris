import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import Collection from './pages/Collection'
import BookForm from './pages/BookForm'
import BookDetail from './pages/BookDetail'
import Stats from './pages/Stats'

const ImportLibib = lazy(() => import('./pages/ImportLibib'))

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Collection />} />
          <Route path="/books/new" element={<BookForm />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/books/:id/edit" element={<BookForm />} />
          <Route path="/stats" element={<Stats />} />
          <Route
            path="/import"
            element={
              <Suspense
                fallback={
                  <div className="min-h-svh flex items-center justify-center">
                    <p className="font-mono text-sm text-ink/60">Chargement…</p>
                  </div>
                }
              >
                <ImportLibib />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
