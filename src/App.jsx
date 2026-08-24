import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import Home from './pages/Home'
import Account from './pages/Account'
import BookForm from './pages/BookForm'
import BookDetail from './pages/BookDetail'
import Stats from './pages/Stats'
import LoadingScreen from './components/LoadingScreen'

const Import = lazy(() => import('./pages/Import'))

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/account" element={<Account />} />
          <Route path="/books/new" element={<BookForm />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/books/:id/edit" element={<BookForm />} />
          <Route path="/stats" element={<Stats />} />
          <Route
            path="/import"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <Import />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
