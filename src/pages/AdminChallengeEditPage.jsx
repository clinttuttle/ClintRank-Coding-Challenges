import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import Navbar from '../components/Navbar'
import CodeEditor from '../components/CodeEditor'
import '../App.css'

const EMPTY_TC = { input: '', expectedOutput: '', isHidden: false, displayOrder: 0 }

export default function AdminChallengeEditPage() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '', description: '', starterCode: 'function solution() {\n  // Write your code here\n}',
    displayOrder: 0, isActive: true,
  })
  const [testCases, setTestCases] = useState([{ ...EMPTY_TC }])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isNew) return
    Promise.all([
      api.get(`/api/admin/challenges`),
      api.get(`/api/admin/challenges/${id}/tests`),
    ])
      .then(([challRes, testsRes]) => {
        const c = challRes.data.find(c => String(c.id) === String(id))
        if (!c) throw new Error('Challenge not found')
        setForm({ title: c.title, description: c.description, starterCode: c.starterCode, displayOrder: c.displayOrder, isActive: c.isActive })
        setTestCases(testsRes.data.length > 0 ? testsRes.data : [{ ...EMPTY_TC }])
      })
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false))
  }, [id, isNew])

  function setField(key, val) { setForm(f => ({ ...f, [key]: val })) }
  function setTc(i, key, val) {
    setTestCases(tcs => { const a = [...tcs]; a[i] = { ...a[i], [key]: val }; return a })
  }
  function addTc() { setTestCases(tcs => [...tcs, { ...EMPTY_TC, displayOrder: tcs.length }]) }
  function removeTc(i) { setTestCases(tcs => tcs.filter((_, j) => j !== i)) }

  function validate() {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.description.trim()) e.description = 'Description is required'
    if (testCases.length === 0) e.testCases = 'At least one test case is required'
    return e
  }

  async function handleSave(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setSaving(true)
    setError(null)

    try {
      let challengeId = id
      if (isNew) {
        const res = await api.post('/api/admin/challenges', form)
        challengeId = res.data.id
      } else {
        await api.put(`/api/admin/challenges/${id}`, form)
        // Delete all test cases and re-add (simple approach for MVP)
        const existing = await api.get(`/api/admin/challenges/${id}/tests`)
        await Promise.all(existing.data.map(tc => api.delete(`/api/admin/challenges/${id}/tests/${tc.id}`)))
      }

      await Promise.all(testCases.map((tc, i) =>
        api.post(`/api/admin/challenges/${challengeId}/tests`, {
          ...tc,
          displayOrder: i,
        })
      ))

      navigate('/admin/challenges')
    } catch (e) {
      setError(e.response?.data?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = { background: '#12141a', border: '1px solid #2a2d38', color: '#c8ccd4', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box' }
  const labelStyle = { color: '#8b8fa8', fontSize: '11px', marginBottom: '4px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.4px' }
  const errStyle = { color: '#e06c75', fontSize: '12px', marginTop: '3px' }

  if (loading) return <div className="app"><Navbar /><div style={{ padding: '2rem', color: '#8b8fa8' }}>Loading...</div></div>

  return (
    <div className="app" style={{ height: 'auto', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem', width: '100%' }}>
        <h1 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '20px', fontWeight: 600, color: '#e8eaf0' }}>
          {isNew ? 'New Challenge' : 'Edit Challenge'}
        </h1>

        {error && <p style={{ color: '#e06c75', marginBottom: '1rem' }}>{error}</p>}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Title + Order */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Title *</label>
              <input style={inputStyle} value={form.title} onChange={e => setField('title', e.target.value)} />
              {errors.title && <p style={errStyle}>{errors.title}</p>}
            </div>
            <div>
              <label style={labelStyle}>Display Order</label>
              <input type="number" style={inputStyle} value={form.displayOrder} onChange={e => setField('displayOrder', Number(e.target.value))} />
            </div>
          </div>

          {/* Active toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setField('isActive', e.target.checked)} />
            <label htmlFor="isActive" style={{ color: '#c8ccd4', fontSize: '13px', cursor: 'pointer' }}>Active (visible to students)</label>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description *</label>
            <textarea
              style={{ ...inputStyle, minHeight: '100px', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' }}
              value={form.description}
              onChange={e => setField('description', e.target.value)}
            />
            {errors.description && <p style={errStyle}>{errors.description}</p>}
          </div>

          {/* Starter Code */}
          <div>
            <label style={labelStyle}>Starter Code *</label>
            <div style={{ border: '1px solid #2a2d38', borderRadius: '4px', overflow: 'hidden', minHeight: '200px' }}>
              <CodeEditor value={form.starterCode} onChange={v => setField('starterCode', v)} />
            </div>
          </div>

          {/* Test Cases */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label style={labelStyle}>Test Cases *</label>
              <button type="button" className="btn-reset" onClick={addTc}>+ Add Test Case</button>
            </div>
            {errors.testCases && <p style={errStyle}>{errors.testCases}</p>}

            {/* Scrollable container — max 400px */}
            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {testCases.map((tc, i) => (
                <div key={i} style={{ background: '#12141a', border: '1px solid #2a2d38', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '8px', alignItems: 'end' }}>
                    <div>
                      <label style={labelStyle}>Input (JSON)</label>
                      <input style={inputStyle} value={tc.input} onChange={e => setTc(i, 'input', e.target.value)} placeholder='e.g. [2, 3] or "hello"' />
                    </div>
                    <div>
                      <label style={labelStyle}>Expected Output (JSON)</label>
                      <input style={inputStyle} value={tc.expectedOutput} onChange={e => setTc(i, 'expectedOutput', e.target.value)} placeholder='e.g. 5 or "olleh"' />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingBottom: '2px' }}>
                      <input type="checkbox" id={`hidden-${i}`} checked={tc.isHidden} onChange={e => setTc(i, 'isHidden', e.target.checked)} />
                      <label htmlFor={`hidden-${i}`} style={{ ...labelStyle, margin: 0, cursor: 'pointer' }}>Hidden</label>
                    </div>
                    <button
                      type="button"
                      className="btn-reset"
                      style={{ color: '#e06c75', borderColor: 'rgba(224,108,117,0.3)', padding: '4px 8px' }}
                      onClick={() => removeTc(i)}
                      disabled={testCases.length === 1}
                    >✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" className="btn-run" disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Saving...' : isNew ? 'Create Challenge' : 'Save Changes'}
            </button>
            <button type="button" className="btn-reset" onClick={() => navigate('/admin/challenges')}>Cancel</button>
          </div>
        </form>
      </main>
    </div>
  )
}
