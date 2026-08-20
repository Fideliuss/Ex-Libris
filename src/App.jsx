import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import Collection from './pages/Collection'
import BookForm from './pages/BookForm'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Collection />} />
          <Route path="/books/new" element={<BookForm />} />
          <Route path="/books/:id/edit" element={<BookForm />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
