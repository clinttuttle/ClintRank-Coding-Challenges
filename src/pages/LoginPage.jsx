import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import { useAuth } from '../contexts/AuthContext'
import '../App.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function validate() {
    const e = {}
    if (!email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email'
    if (!password) e.password = 'Password is required'
    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setServerError(null)
    setLoading(true)
    try {
      const res = await api.post('/api/auth/login', { email, password })
      login(res.data.user, res.data.token)
      navigate(res.data.user.role === 'faculty' ? '/admin' : '/')
    } catch (err) {
      setServerError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background: '#12141a', border: '1px solid #2a2d38', color: '#c8ccd4',
    padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box',
  }
  const errorStyle = { color: '#e06c75', fontSize: '12px', marginTop: '2px' }

  return (
    <div className="app">
      <header className="navbar">
        <div className="navbar-left">
          <span className="nav-logo">ClintRank</span>
        </div>
      </header>
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        <form onSubmit={handleSubmit} style={{ background: '#1e2029', border: '1px solid #2a2d38', borderRadius: '8px', padding: '2rem', width: '340px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ color: '#e8eaf0', margin: 0, fontSize: '18px', fontWeight: 600 }}>Sign in to ClintRank</h2>

          {serverError && <p style={{ ...errorStyle, margin: 0 }}>{serverError}</p>}

          <div>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
            {errors.email && <p style={errorStyle}>{errors.email}</p>}
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ ...inputStyle, paddingRight: '70px' }}
            />
            <button type="button" onClick={() => setShowPass(s => !s)}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#8b8fa8', fontSize: '11px', cursor: 'pointer' }}>
              {showPass ? 'Hide' : 'Show'}
            </button>
            {errors.password && <p style={errorStyle}>{errors.password}</p>}
          </div>

          <button type="submit" className="btn-run" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p style={{ color: '#8b8fa8', fontSize: '13px', margin: 0, textAlign: 'center' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#2ec866' }}>Register</Link>
          </p>
        </form>
      </main>
    </div>
  )
}
