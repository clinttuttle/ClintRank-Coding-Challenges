import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getChallenges } from '../api'
import '../App.css'

export default function ChallengeList() {
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getChallenges()
      .then(setChallenges)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="app">
      <header className="navbar">
        <div className="navbar-left">
          <span className="nav-logo">Clint's Coding Corner</span>
          <span className="nav-sep">|</span>
          <span className="nav-section">Practice</span>
        </div>
        <div className="navbar-right">
          <Link to="/admin" className="nav-user" style={{ textDecoration: 'none' }}>Admin</Link>
        </div>
      </header>

      <main style={{ padding: '2rem', maxWidth: '860px', margin: '0 auto', width: '100%' }}>
        <h1 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '20px', fontWeight: 600, color: '#e8eaf0' }}>
          Challenges
        </h1>

        {loading && <p style={{ color: '#8b8fa8' }}>Loading...</p>}
        {error && <p style={{ color: '#e06c75' }}>{error}</p>}

        {!loading && !error && challenges.length === 0 && (
          <p style={{ color: '#8b8fa8' }}>No challenges yet. <Link to="/admin" style={{ color: '#2ec866' }}>Add one as admin.</Link></p>
        )}

        <div className="challenge-list">
          {challenges.map(c => (
            <Link key={c.id} to={`/challenges/${c.id}`} className="challenge-card">
              <div className="challenge-card-title">{c.title}</div>
              <div className="challenge-card-meta">
                <span className={`badge ${c.difficulty.toLowerCase()}`}>{c.difficulty}</span>
                <span className="badge lang">{c.language}</span>
                <span className="score-label" style={{ marginLeft: 'auto' }}>
                  Max Score: <strong>{c.max_score}</strong>
                </span>
                <span className="score-label">
                  Success Rate: <strong>{c.success_rate}%</strong>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
