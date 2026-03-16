import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import Navbar from '../components/Navbar'
import '../App.css'

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const res = await api.get('/api/admin/challenges')
      setChallenges(res.data)
    } catch (e) {
      setError(e.response?.data?.error || e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Deactivate this challenge? (Soft delete — students lose access)')) return
    try {
      await api.delete(`/api/admin/challenges/${id}`)
      await load()
    } catch (e) {
      alert(e.response?.data?.error || 'Delete failed')
    }
  }

  async function moveOrder(challenge, dir) {
    const newOrder = challenge.displayOrder + (dir === 'up' ? -1 : 1)
    try {
      await api.put(`/api/admin/challenges/${challenge.id}`, { ...challenge, displayOrder: newOrder })
      await load()
    } catch {}
  }

  const thStyle = { textAlign: 'left', padding: '10px 12px', fontSize: '11px', color: '#8b8fa8', textTransform: 'uppercase', letterSpacing: '0.4px', background: '#1e2029' }
  const tdStyle = { padding: '10px 12px', fontSize: '13px', color: '#c8ccd4', borderTop: '1px solid #2a2d38' }

  return (
    <div className="app" style={{ height: 'auto', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#e8eaf0' }}>Challenges</h1>
          <button className="btn-run" onClick={() => navigate('/admin/challenges/new')} style={{ padding: '8px 16px' }}>
            + Add New Challenge
          </button>
        </div>

        {loading && <p style={{ color: '#8b8fa8' }}>Loading...</p>}
        {error && <p style={{ color: '#e06c75' }}>{error}</p>}

        {!loading && !error && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#12141a', border: '1px solid #2a2d38', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Order</th>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Active</th>
                  <th style={thStyle}># Tests</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {challenges.map((c, idx) => (
                  <tr key={c.id}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <button className="btn-reset" style={{ padding: '1px 6px', fontSize: '11px' }} onClick={() => moveOrder(c, 'up')} disabled={idx === 0}>↑</button>
                        <span style={{ textAlign: 'center', color: '#8b8fa8', fontSize: '12px' }}>{c.displayOrder}</span>
                        <button className="btn-reset" style={{ padding: '1px 6px', fontSize: '11px' }} onClick={() => moveOrder(c, 'down')} disabled={idx === challenges.length - 1}>↓</button>
                      </div>
                    </td>
                    <td style={tdStyle}><strong style={{ color: '#e8eaf0' }}>{c.title}</strong></td>
                    <td style={tdStyle}>
                      <span style={{ color: c.isActive ? '#2ec866' : '#e06c75', fontSize: '12px', fontWeight: 600 }}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={tdStyle}>{c.testCaseCount}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Link to={`/admin/challenges/${c.id}`} className="btn-reset" style={{ textDecoration: 'none', padding: '4px 10px', fontSize: '12px' }}>Edit</Link>
                        <button className="btn-reset" style={{ color: '#e06c75', borderColor: 'rgba(224,108,117,0.3)', padding: '4px 10px', fontSize: '12px' }} onClick={() => handleDelete(c.id)}>
                          {c.isActive ? 'Deactivate' : 'Inactive'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {challenges.length === 0 && (
                  <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#8b8fa8' }}>No challenges yet. Add one!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
