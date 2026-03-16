import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { user, isAuthenticated, isFaculty, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <header className="navbar">
      <div className="navbar-left">
        <Link to={isFaculty ? '/admin' : '/'} className="nav-logo" style={{ textDecoration: 'none' }}>
          ClintRank
        </Link>
        {isAuthenticated && !isFaculty && (
          <>
            <span className="nav-sep">|</span>
            <Link to="/" className="nav-section" style={{ textDecoration: 'none', color: '#8b8fa8' }}>Practice</Link>
          </>
        )}
        {isFaculty && (
          <>
            <span className="nav-sep">|</span>
            <Link to="/admin" className="nav-section" style={{ textDecoration: 'none', color: '#8b8fa8' }}>Dashboard</Link>
            <span className="nav-sep">|</span>
            <Link to="/admin/challenges" className="nav-section" style={{ textDecoration: 'none', color: '#8b8fa8' }}>Challenges</Link>
            <span className="nav-sep">|</span>
            <Link to="/admin/students" className="nav-section" style={{ textDecoration: 'none', color: '#8b8fa8' }}>Students</Link>
          </>
        )}
      </div>
      <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isAuthenticated && (
          <>
            <span className="nav-user">{user.username}</span>
            <span
              className="badge"
              style={{
                background: isFaculty ? 'rgba(97,175,239,0.15)' : 'rgba(46,200,102,0.15)',
                color: isFaculty ? '#61afef' : '#2ec866',
                border: `1px solid ${isFaculty ? 'rgba(97,175,239,0.3)' : 'rgba(46,200,102,0.3)'}`,
              }}
            >
              {isFaculty ? 'Faculty' : 'Student'}
            </span>
            <button className="btn-reset" onClick={handleLogout}>Logout</button>
          </>
        )}
        {!isAuthenticated && (
          <Link to="/login" className="btn-reset" style={{ textDecoration: 'none' }}>Login</Link>
        )}
      </div>
    </header>
  )
}
