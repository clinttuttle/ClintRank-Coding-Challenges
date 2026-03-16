import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // On app load, check for existing session via cookie
  useEffect(() => {
    api.get('/api/auth/me')
      .then(res => {
        setUser(res.data.user)
        if (res.data.token) {
          setToken(res.data.token)
          window.__authToken = res.data.token
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function login(userData, jwtToken) {
    setUser(userData)
    setToken(jwtToken)
    window.__authToken = jwtToken
  }

  async function logout() {
    try { await api.post('/api/auth/logout') } catch {}
    setUser(null)
    setToken(null)
    window.__authToken = null
  }

  const isAuthenticated = !!user
  const isFaculty = user?.role === 'faculty'

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, isFaculty, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
