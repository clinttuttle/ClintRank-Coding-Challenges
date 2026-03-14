import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api'
import '../App.css'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { token } = await login(username, password)
      localStorage.setItem('admin_token', token)
      navigate('/admin')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="navbar">
        <div className="navbar-left">
          <span className="nav-logo">Clint's Coding Corner</span>
          <span className="nav-sep">|</span>
          <Link to="/" className="nav-section" style={{ textDecoration: 'none', color: '#8b8fa8' }}>Practice</Link>
        </div>
      </header>

      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        <form
          onSubmit={handleSubmit}
          style={{
            background: '#1e2029',
            border: '1px solid #2a2d38',
            borderRadius: '8px',
            padding: '2rem',
            width: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <h2 style={{ color: '#e8eaf0', margin: 0, fontSize: '16px', fontWeight: 600 }}>Admin Login</h2>

          {error && <p style={{ color: '#e06c75', margin: 0, fontSize: '13px' }}>{error}</p>}

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
          <button type="submit" className="btn-run" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </main>
    </div>
  )
}

const inputStyle = {
  background: '#12141a',
  border: '1px solid #2a2d38',
  color: '#c8ccd4',
  padding: '0.5rem 0.75rem',
  borderRadius: '4px',
  fontSize: '13px',
  outline: 'none',
}
