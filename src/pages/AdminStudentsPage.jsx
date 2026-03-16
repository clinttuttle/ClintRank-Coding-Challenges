import { useState, useEffect } from 'react'
import api from '../lib/axios'
import Navbar from '../components/Navbar'
import '../App.css'

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [expandedData, setExpandedData] = useState({})
  const [sortKey, setSortKey] = useState('percent_complete')
  const [sortDir, setSortDir] = useState('desc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/api/admin/students')
      .then(res => {
        const list = res.data
        // Fetch progress for each student
        return Promise.all(list.map(s =>
          api.get(`/api/admin/students/${s.id}/progress`)
            .then(r => ({ ...s, ...r.data.summary }))
            .catch(() => ({ ...s, total: 0, not_started: 0, in_progress: 0, complete: 0, percent_complete: 0 }))
        ))
      })
      .then(setStudents)
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false))
  }, [])

  async function toggleExpand(id) {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (!expandedData[id]) {
      try {
        const res = await api.get(`/api/admin/students/${id}/progress`)
        setExpandedData(d => ({ ...d, [id]: res.data }))
      } catch {}
    }
  }

  function sortedStudents() {
    return [...students].sort((a, b) => {
      const va = a[sortKey] ?? 0
      const vb = b[sortKey] ?? 0
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      return sortDir === 'asc' ? va - vb : vb - va
    })
  }

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const thStyle = { textAlign: 'left', padding: '10px 12px', fontSize: '11px', color: '#8b8fa8', textTransform: 'uppercase', letterSpacing: '0.4px', cursor: 'pointer', userSelect: 'none', background: '#1e2029' }
  const tdStyle = { padding: '10px 12px', fontSize: '13px', color: '#c8ccd4', borderTop: '1px solid #2a2d38' }

  return (
    <div className="app" style={{ height: 'auto', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem', width: '100%' }}>
        <h1 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '20px', fontWeight: 600, color: '#e8eaf0' }}>Students</h1>

        {loading && <p style={{ color: '#8b8fa8' }}>Loading...</p>}
        {error && <p style={{ color: '#e06c75' }}>{error}</p>}

        {!loading && !error && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#12141a', border: '1px solid #2a2d38', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr>
                  {[
                    ['username', 'Username'],
                    ['email', 'Email'],
                    ['not_started', 'Not Started'],
                    ['in_progress', 'In Progress'],
                    ['complete', 'Complete'],
                    ['percent_complete', '% Done'],
                  ].map(([key, label]) => (
                    <th key={key} style={thStyle} onClick={() => handleSort(key)}>
                      {label} {sortKey === key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedStudents().map(s => (
                  <>
                    <tr
                      key={s.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleExpand(s.id)}
                    >
                      <td style={tdStyle}><strong style={{ color: '#e8eaf0' }}>{s.username}</strong></td>
                      <td style={tdStyle}>{s.email}</td>
                      <td style={tdStyle}><span style={{ color: '#8b8fa8' }}>{s.not_started ?? '—'}</span></td>
                      <td style={tdStyle}><span style={{ color: '#e5c07b' }}>{s.in_progress ?? '—'}</span></td>
                      <td style={tdStyle}><span style={{ color: '#2ec866' }}>{s.complete ?? '—'}</span></td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, background: '#2a2d38', borderRadius: '3px', height: '6px', overflow: 'hidden', minWidth: '60px' }}>
                            <div style={{ width: `${s.percent_complete ?? 0}%`, height: '100%', background: '#2ec866', borderRadius: '3px' }} />
                          </div>
                          <span style={{ color: '#2ec866', fontWeight: 600, fontSize: '12px', minWidth: '32px' }}>{s.percent_complete ?? 0}%</span>
                        </div>
                      </td>
                    </tr>
                    {expanded === s.id && expandedData[s.id] && (
                      <tr key={`${s.id}-expand`}>
                        <td colSpan={6} style={{ ...tdStyle, background: '#12141a', padding: '12px 16px' }}>
                          <div style={{ fontSize: '12px', color: '#8b8fa8', marginBottom: '8px' }}>Challenge breakdown:</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {expandedData[s.id].challenges.map(p => (
                              <div key={p.id} style={{ background: '#1e2029', border: '1px solid #2a2d38', borderRadius: '4px', padding: '6px 10px', fontSize: '12px' }}>
                                <span style={{ color: '#e8eaf0' }}>{p.Challenge?.title || `Challenge ${p.challengeId}`}</span>
                                <span style={{ marginLeft: '8px', color: p.status === 'complete' ? '#2ec866' : p.status === 'in_progress' ? '#e5c07b' : '#8b8fa8' }}>
                                  {p.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {students.length === 0 && (
                  <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#8b8fa8' }}>No students registered yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
