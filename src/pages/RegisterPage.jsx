import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import { useAuth } from '../contexts/AuthContext'
import '../App.css'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function validate() {
    const e = {}
    if (!form.username) e.username = 'Username is required'
    else if (!/^[a-zA-Z0-9_]{3,30}$/.test(form.username)) e.username = 'Username must be 3–30 alphanumeric characters or underscores'
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    else if (!/[A-Z]/.test(form.password)) e.password = 'Password must contain at least one uppercase letter'
    else if (!/[0-9]/.test(form.password)) e.password = 'Password must contain at least one number'
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
      const res = await api.post('/api/auth/register', form)
      login(res.data.user, res.data.token)
      navigate('/')
    } catch (err) {
      setServerError(err.response?.data?.error || 'Registration failed')
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
        <div className="navbar-left"><span className="nav-logo">ClintRank</span></div>
      </header>
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        <form onSubmit={handleSubmit} style={{ background: '#1e2029', border: '1px solid #2a2d38', borderRadius: '8px', padding: '2rem', width: '340px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ color: '#e8eaf0', margin: 0, fontSize: '18px', fontWeight: 600 }}>Create an account</h2>

          {serverError && <p style={{ ...errorStyle, margin: 0 }}>{serverError}</p>}

          <div>
            <input type="text" placeholder="Username" value={form.username} onChange={e => set('username', e.target.value)} style={inputStyle} />
            {errors.username && <p style={errorStyle}>{errors.username}</p>}
          </div>

          <div>
            <input type="email" placeholder="Email" value={form.email} onChange={e => set('email', e.target.value)} style={inputStyle} />
            {errors.email && <p style={errorStyle}>{errors.email}</p>}
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Password (min 8 chars, 1 uppercase, 1 number)"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              style={{ ...inputStyle, paddingRight: '70px' }}
            />
            <button type="button" onClick={() => setShowPass(s => !s)}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#8b8fa8', fontSize: '11px', cursor: 'pointer' }}>
              {showPass ? 'Hide' : 'Show'}
            </button>
            {errors.password && <p style={errorStyle}>{errors.password}</p>}
          </div>

          <button type="submit" className="btn-run" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating account...' : 'Register'}
          </button>

          <p style={{ color: '#8b8fa8', fontSize: '13px', margin: 0, textAlign: 'center' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#2ec866' }}>Sign in</Link>
          </p>
        </form>
      </main>
    </div>
  )
}
