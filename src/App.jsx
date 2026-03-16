import { Component } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import StudentDashboard from './pages/StudentDashboard'
import ChallengePage from './pages/ChallengePage'
import AdminDashboard from './pages/AdminDashboard'
import AdminChallengesPage from './pages/AdminChallengesPage'
import AdminChallengeEditPage from './pages/AdminChallengeEditPage'
import AdminStudentsPage from './pages/AdminStudentsPage'

function ProtectedRoute({ children, requireFaculty = false }) {
  const { isAuthenticated, isFaculty, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#1a1c23', color: '#8b8fa8' }}>Loading...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (requireFaculty && !isFaculty) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { isAuthenticated, isFaculty, loading } = useAuth()
  if (loading) return null

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to={isFaculty ? '/admin' : '/'} replace />} />
      <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" replace />} />

      <Route path="/" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
      <Route path="/challenge/:id" element={<ProtectedRoute><ChallengePage /></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute requireFaculty><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/challenges" element={<ProtectedRoute requireFaculty><AdminChallengesPage /></ProtectedRoute>} />
      <Route path="/admin/challenges/new" element={<ProtectedRoute requireFaculty><AdminChallengeEditPage /></ProtectedRoute>} />
      <Route path="/admin/challenges/:id" element={<ProtectedRoute requireFaculty><AdminChallengeEditPage /></ProtectedRoute>} />
      <Route path="/admin/students" element={<ProtectedRoute requireFaculty><AdminStudentsPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to={isAuthenticated ? (isFaculty ? '/admin' : '/') : '/login'} replace />} />
    </Routes>
  )
}

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#1a1c23', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ color: '#e06c75', fontSize: '18px', fontWeight: 600 }}>Something went wrong.</div>
        <button className="btn-reset" onClick={() => { this.setState({ hasError: false }); window.location.href = '/' }}>
          Go Home
        </button>
      </div>
    )
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
