import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getChallenges, getChallenge, createChallenge, updateChallenge, deleteChallenge } from '../api'
import '../App.css'

const EMPTY_TC = { label: '', input: '', expectedText: '', sample: true }
const EMPTY_FORM = {
  title: '',
  difficulty: 'Easy',
  language: 'JavaScript',
  statement: '',
  functionDescription: '',
  constraints: '',
  function_name: '',
  starter_code: '',
  max_score: 100,
  success_rate: 0,
  testCases: [{ ...EMPTY_TC }],
}

function formToPayload(form) {
  return {
    title: form.title,
    difficulty: form.difficulty,
    language: form.language,
    description: {
      statement: form.statement,
      functionDescription: form.functionDescription,
      constraints: form.constraints.split('\n').map(s => s.trim()).filter(Boolean),
    },
    function_name: form.function_name,
    starter_code: form.starter_code,
    test_cases: form.testCases.map((tc, i) => ({
      label: tc.label || `${tc.sample ? 'Sample' : 'Hidden'} Test Case ${i}`,
      input: isNaN(tc.input) || tc.input === '' ? tc.input : Number(tc.input),
      expected: tc.expectedText.split('\n').map(s => s.trim()).filter(Boolean),
      sample: tc.sample,
    })),
    max_score: Number(form.max_score),
    success_rate: Number(form.success_rate),
  }
}

function challengeToForm(c) {
  return {
    title: c.title,
    difficulty: c.difficulty,
    language: c.language,
    statement: c.description.statement,
    functionDescription: c.description.functionDescription || '',
    constraints: (c.description.constraints || []).join('\n'),
    function_name: c.function_name,
    starter_code: c.starter_code,
    max_score: c.max_score,
    success_rate: c.success_rate,
    testCases: c.test_cases.map(tc => ({
      label: tc.label,
      input: String(tc.input),
      expectedText: tc.expected.join('\n'),
      sample: tc.sample,
    })),
  }
}

const field = { display: 'flex', flexDirection: 'column', gap: '0.25rem' }
const label = { color: '#8b8fa8', fontSize: '11px', marginBottom: '2px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.4px' }
const input = { background: '#12141a', border: '1px solid #2a2d38', color: '#c8ccd4', padding: '0.4rem 0.6rem', borderRadius: '4px', fontSize: '13px', width: '100%', boxSizing: 'border-box', outline: 'none' }
const textarea = { ...input, resize: 'vertical', fontFamily: 'inherit' }

export default function AdminPanel() {
  const [challenges, setChallenges] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { loadChallenges() }, [])

  async function loadChallenges() {
    try { setChallenges(await getChallenges()) } catch (e) { setError(e.message) }
  }

  function setField(key, val) { setForm(f => ({ ...f, [key]: val })) }
  function setTcField(i, key, val) {
    setForm(f => { const tcs = [...f.testCases]; tcs[i] = { ...tcs[i], [key]: val }; return { ...f, testCases: tcs } })
  }

  async function startEdit(c) {
    try { setForm(challengeToForm(await getChallenge(c.id))); setEditingId(c.id) } catch (e) { setError(e.message) }
  }

  function cancelEdit() { setForm(EMPTY_FORM); setEditingId(null); setError(null) }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = formToPayload(form)
      if (editingId) { await updateChallenge(editingId, payload) } else { await createChallenge(payload) }
      await loadChallenges()
      cancelEdit()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this challenge?')) return
    try { await deleteChallenge(id); await loadChallenges() } catch (e) { setError(e.message) }
  }

  function handleLogout() { localStorage.removeItem('admin_token'); navigate('/admin/login') }

  return (
    <div className="app" style={{ height: 'auto', minHeight: '100vh' }}>
      <header className="navbar">
        <div className="navbar-left">
          <span className="nav-logo">Clint's Coding Corner</span>
          <span className="nav-sep">|</span>
          <Link to="/" className="nav-section" style={{ textDecoration: 'none', color: '#8b8fa8' }}>Practice</Link>
          <span className="nav-sep">|</span>
          <span className="nav-section">Admin</span>
        </div>
        <div className="navbar-right">
          <button className="btn-reset" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', padding: '1.5rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>

        {/* Left: Challenge list */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h2 style={{ color: '#e8eaf0', margin: 0, fontSize: '15px', fontWeight: 600 }}>Challenges</h2>
            <button className="btn-reset" onClick={cancelEdit}>+ New</button>
          </div>

          {error && <p style={{ color: '#e06c75', fontSize: '12px', marginBottom: '0.75rem' }}>{error}</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {challenges.map(c => (
              <div
                key={c.id}
                style={{
                  background: '#1e2029',
                  border: `1px solid ${editingId === c.id ? '#2ec866' : '#2a2d38'}`,
                  borderRadius: '6px',
                  padding: '0.6rem 0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: '#e8eaf0', fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '3px' }}>
                    <span className={`badge ${c.difficulty.toLowerCase()}`}>{c.difficulty}</span>
                    <span className="badge lang">{c.language}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button className="btn-reset" onClick={() => startEdit(c)}>Edit</button>
                  <button className="btn-reset" style={{ color: '#e06c75', borderColor: 'rgba(224,108,117,0.3)' }} onClick={() => handleDelete(c.id)}>Del</button>
                </div>
              </div>
            ))}
            {challenges.length === 0 && (
              <p style={{ color: '#8b8fa8', fontSize: '13px' }}>No challenges yet.</p>
            )}
          </div>
        </div>

        {/* Right: Form */}
        <div>
          <h2 style={{ color: '#e8eaf0', margin: '0 0 1rem', fontSize: '15px', fontWeight: 600 }}>
            {editingId ? 'Edit Challenge' : 'New Challenge'}
          </h2>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
              <div style={field}>
                <label style={label}>Title *</label>
                <input style={input} value={form.title} onChange={e => setField('title', e.target.value)} required />
              </div>
              <div style={field}>
                <label style={label}>Difficulty</label>
                <select style={input} value={form.difficulty} onChange={e => setField('difficulty', e.target.value)}>
                  <option>Easy</option><option>Medium</option><option>Hard</option>
                </select>
              </div>
              <div style={field}>
                <label style={label}>Max Score</label>
                <input type="number" style={input} value={form.max_score} onChange={e => setField('max_score', e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={field}>
                <label style={label}>Function Name *</label>
                <input style={input} value={form.function_name} onChange={e => setField('function_name', e.target.value)} required placeholder="e.g. fizzBuzz" />
              </div>
              <div style={field}>
                <label style={label}>Success Rate (%)</label>
                <input type="number" style={input} value={form.success_rate} onChange={e => setField('success_rate', e.target.value)} min="0" max="100" step="0.1" />
              </div>
            </div>

            <div style={field}>
              <label style={label}>Problem Statement *</label>
              <textarea style={{ ...textarea, minHeight: '80px' }} value={form.statement} onChange={e => setField('statement', e.target.value)} required />
            </div>

            <div style={field}>
              <label style={label}>Function Description</label>
              <textarea style={{ ...textarea, minHeight: '56px' }} value={form.functionDescription} onChange={e => setField('functionDescription', e.target.value)} />
            </div>

            <div style={field}>
              <label style={label}>Constraints (one per line)</label>
              <textarea style={{ ...textarea, minHeight: '48px' }} value={form.constraints} onChange={e => setField('constraints', e.target.value)} placeholder="1 ≤ n ≤ 100" />
            </div>

            <div style={field}>
              <label style={label}>Starter Code *</label>
              <textarea style={{ ...textarea, minHeight: '80px', fontFamily: 'Consolas, monospace', fontSize: '12px' }} value={form.starter_code} onChange={e => setField('starter_code', e.target.value)} required />
            </div>

            {/* Test Cases */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ ...label, margin: 0 }}>Test Cases *</label>
                <button type="button" className="btn-reset" onClick={() => setForm(f => ({ ...f, testCases: [...f.testCases, { ...EMPTY_TC }] }))}>
                  + Add Case
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {form.testCases.map((tc, i) => (
                  <div key={i} style={{ background: '#12141a', border: '1px solid #2a2d38', borderRadius: '6px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px auto', gap: '0.5rem', alignItems: 'end' }}>
                      <div style={field}>
                        <label style={label}>Label</label>
                        <input style={input} value={tc.label} onChange={e => setTcField(i, 'label', e.target.value)} placeholder={`${tc.sample ? 'Sample' : 'Hidden'} Test Case ${i}`} />
                      </div>
                      <div style={field}>
                        <label style={label}>Input</label>
                        <input style={input} value={tc.input} onChange={e => setTcField(i, 'input', e.target.value)} placeholder="e.g. 15" />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingBottom: '2px' }}>
                        <input type="checkbox" id={`sample-${i}`} checked={tc.sample} onChange={e => setTcField(i, 'sample', e.target.checked)} />
                        <label htmlFor={`sample-${i}`} style={{ ...label, margin: 0, cursor: 'pointer' }}>Visible</label>
                      </div>
                      <button
                        type="button"
                        className="btn-reset"
                        style={{ color: '#e06c75', borderColor: 'rgba(224,108,117,0.3)' }}
                        onClick={() => setForm(f => ({ ...f, testCases: f.testCases.filter((_, j) => j !== i) }))}
                        disabled={form.testCases.length === 1}
                      >✕</button>
                    </div>
                    <div style={field}>
                      <label style={label}>Expected Output (one value per line)</label>
                      <textarea
                        style={{ ...textarea, minHeight: '60px', fontFamily: 'Consolas, monospace', fontSize: '12px' }}
                        value={tc.expectedText}
                        onChange={e => setTcField(i, 'expectedText', e.target.value)}
                        placeholder={'1\n2\nFizz\n4\nBuzz'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && <p style={{ color: '#e06c75', fontSize: '12px', margin: 0 }}>{error}</p>}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn-run" disabled={saving} style={{ flex: 1 }}>
                {saving ? 'Saving...' : editingId ? 'Update Challenge' : 'Create Challenge'}
              </button>
              {editingId && (
                <button type="button" className="btn-reset" onClick={cancelEdit}>Cancel</button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
