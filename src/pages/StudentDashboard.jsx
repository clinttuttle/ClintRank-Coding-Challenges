import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/axios'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import ProgressBar from '../components/ProgressBar'
import '../App.css'

const STATUS_LABELS = {
  not_started: { label: 'Not Started', color: '#8b8fa8', bg: 'rgba(139,143,168,0.1)', border: 'rgba(139,143,168,0.25)' },
  in_progress: { label: 'In Progress', color: '#e5c07b', bg: 'rgba(229,192,123,0.1)', border: 'rgba(229,192,123,0.3)' },
  complete:    { label: 'Complete',    color: '#2ec866', bg: 'rgba(46,200,102,0.1)',  border: 'rgba(46,200,102,0.3)' },
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/api/challenges')
      .then(res => setData(res.data))
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="app" style={{ height: 'auto', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem', width: '100%' }}>
        <h1 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '20px', fontWeight: 600, color: '#e8eaf0' }}>
          Welcome, {user?.username}
        </h1>

        {loading && <p style={{ color: '#8b8fa8' }}>Loading challenges...</p>}
        {error && <p style={{ color: '#e06c75' }}>{error}</p>}

        {data && (
          <>
            <ProgressBar complete={data.summary.complete} total={data.summary.total} />

            <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {['not_started', 'in_progress', 'complete'].map(s => {
                const st = STATUS_LABELS[s]
                return (
                  <div key={s} style={{ background: st.bg, border: `1px solid ${st.border}`, borderRadius: '6px', padding: '8px 16px', fontSize: '13px' }}>
                    <span style={{ color: st.color, fontWeight: 600 }}>{data.summary[s]}</span>
                    <span style={{ color: '#8b8fa8', marginLeft: '6px' }}>{st.label}</span>
                  </div>
                )
              })}
            </div>

            <div className="challenge-list">
              {data.challenges.map(c => {
                const st = STATUS_LABELS[c.status] || STATUS_LABELS.not_started
                return (
                  <Link key={c.id} to={`/challenge/${c.id}`} className="challenge-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="challenge-card-title" style={{ marginBottom: 0 }}>{c.title}</div>
                      <span className="badge" style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                        {st.label}
                      </span>
                    </div>
                  </Link>
                )
              })}
              {data.challenges.length === 0 && (
                <p style={{ color: '#8b8fa8' }}>No challenges available yet.</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
