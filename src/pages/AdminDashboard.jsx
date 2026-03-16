import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/axios'
import Navbar from '../components/Navbar'
import '../App.css'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/dashboard'),
      api.get('/api/admin/students'),
    ])
      .then(([d, s]) => { setStats(d.data); setStudents(s.data) })
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false))
  }, [])

  const cardStyle = (color) => ({
    background: '#1e2029', border: `1px solid ${color}33`, borderRadius: '8px',
    padding: '1.25rem', textAlign: 'center', flex: 1, minWidth: '130px',
  })

  return (
    <div className="app" style={{ height: 'auto', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem', width: '100%' }}>
        <h1 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '20px', fontWeight: 600, color: '#e8eaf0' }}>
          Admin Dashboard
        </h1>

        {loading && <p style={{ color: '#8b8fa8' }}>Loading...</p>}
        {error && <p style={{ color: '#e06c75' }}>{error}</p>}

        {stats && (
          <>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <div style={cardStyle('#61afef')}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#61afef' }}>{stats.total_students}</div>
                <div style={{ color: '#8b8fa8', fontSize: '12px', marginTop: '4px' }}>Total Students</div>
              </div>
              <div style={cardStyle('#2ec866')}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#2ec866' }}>{stats.total_challenges}</div>
                <div style={{ color: '#8b8fa8', fontSize: '12px', marginTop: '4px' }}>Challenges</div>
              </div>
              <div style={cardStyle('#8b8fa8')}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#8b8fa8' }}>{stats.overall_not_started}</div>
                <div style={{ color: '#8b8fa8', fontSize: '12px', marginTop: '4px' }}>Not Started</div>
              </div>
              <div style={cardStyle('#e5c07b')}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#e5c07b' }}>{stats.overall_in_progress}</div>
                <div style={{ color: '#8b8fa8', fontSize: '12px', marginTop: '4px' }}>In Progress</div>
              </div>
              <div style={cardStyle('#2ec866')}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#2ec866' }}>{stats.overall_complete}</div>
                <div style={{ color: '#8b8fa8', fontSize: '12px', marginTop: '4px' }}>Complete</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '2rem' }}>
              <Link to="/admin/challenges" className="btn-run" style={{ textDecoration: 'none', padding: '8px 20px' }}>
                Manage Challenges
              </Link>
              <Link to="/admin/students" className="btn-reset" style={{ textDecoration: 'none', padding: '8px 20px' }}>
                View Students
              </Link>
            </div>

            {students.length > 0 && students.length <= 20 && (
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#e8eaf0', marginBottom: '1rem' }}>Student Progress</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {students.map(s => (
                    <Link key={s.id} to={`/admin/students`} style={{ textDecoration: 'none' }}>
                      <div style={{ background: '#1e2029', border: '1px solid #2a2d38', borderRadius: '6px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ color: '#e8eaf0', fontWeight: 600, fontSize: '13px', minWidth: '120px' }}>{s.username}</span>
                        <span style={{ color: '#8b8fa8', fontSize: '12px' }}>{s.email}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
