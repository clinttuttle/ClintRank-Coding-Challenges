import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../lib/axios'
import Navbar from '../components/Navbar'
import CodeEditor from '../components/CodeEditor'
import TestResultList from '../components/TestResultList'
import '../App.css'

// ── Client-side code runner (no server-side eval) ──────────────────────────
function runTests(code, testCases) {
  return testCases.map(tc => {
    let input, expected
    try { input = JSON.parse(tc.input) } catch { input = tc.input }
    try { expected = JSON.parse(tc.expectedOutput) } catch { expected = tc.expectedOutput }

    const args = Array.isArray(input) ? input : [input]

    // 3-second timeout guard
    let timedOut = false
    const timeoutId = setTimeout(() => { timedOut = true }, 3000)

    let actual, error
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function(...args.map((_, i) => `arg${i}`), `${code}\n; return (${getFunctionName(code)})(...arguments)`)
      actual = fn(...args)
      if (timedOut) throw new Error('Execution timed out (> 3s)')
    } catch (e) {
      error = e.message
    } finally {
      clearTimeout(timeoutId)
    }

    const actualStr = JSON.stringify(actual)
    const expectedStr = JSON.stringify(expected)
    const passed = !error && actualStr === expectedStr

    return { input: tc.input, expected, actual, error, passed, isHidden: false }
  })
}

function getFunctionName(code) {
  const m = code.match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/)
  return m ? m[1] : 'solution'
}

export default function ChallengePage() {
  const { id } = useParams()
  const [challenge, setChallenge] = useState(null)
  const [code, setCode] = useState('')
  const [results, setResults] = useState(null)
  const [running, setRunning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get(`/api/challenges/${id}`)
      .then(res => {
        const c = res.data
        setChallenge(c)
        setCode(c.progress?.currentCode || c.starterCode || '')
        if (c.progress?.status === 'complete') {
          setSubmitMsg({ type: 'success', text: 'You have already completed this challenge!' })
        }
      })
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleRun() {
    setRunning(true)
    setSubmitMsg(null)
    // Small delay to let UI update
    await new Promise(r => setTimeout(r, 50))
    const testResults = runTests(code, challenge.testCases)
    setResults(testResults)
    setRunning(false)

    // Record attempt and auto-save
    try {
      await api.post(`/api/challenges/${id}/run`, { code })
    } catch {}
  }

  async function handleSubmit() {
    const allPassed = results && results.every(r => r.passed)
    if (!allPassed) return
    if (challenge.progress?.status === 'complete') {
      setSubmitMsg({ type: 'info', text: 'Already completed!' })
      return
    }

    setSubmitting(true)
    try {
      await api.post(`/api/challenges/${id}/submit`, { code, allTestsPassed: true })
      setSubmitMsg({ type: 'success', text: '🎉 Challenge complete! Great work!' })
      setChallenge(c => ({ ...c, progress: { ...c.progress, status: 'complete' } }))
    } catch (e) {
      setSubmitMsg({ type: 'error', text: e.response?.data?.error || 'Submission failed' })
    } finally {
      setSubmitting(false)
    }
  }

  function handleReset() {
    setCode(challenge.starterCode)
    setResults(null)
    setSubmitMsg(null)
  }

  const allPassed = results && results.every(r => r.passed)
  const alreadyComplete = challenge?.progress?.status === 'complete'

  if (loading) return (
    <div className="app"><Navbar />
      <div style={{ padding: '2rem', color: '#8b8fa8' }}>Loading challenge...</div>
    </div>
  )
  if (error) return (
    <div className="app"><Navbar />
      <div style={{ padding: '2rem', color: '#e06c75' }}>{error}</div>
    </div>
  )

  return (
    <div className="app">
      <Navbar />

      <div className="challenge-bar">
        <div className="challenge-meta">
          <span className="challenge-title">{challenge.title}</span>
          {alreadyComplete && (
            <span className="badge" style={{ background: 'rgba(46,200,102,0.15)', color: '#2ec866', border: '1px solid rgba(46,200,102,0.3)' }}>
              Complete
            </span>
          )}
        </div>
        <div className="challenge-actions">
          <Link to="/" style={{ color: '#8b8fa8', fontSize: '13px', textDecoration: 'none' }}>← Back</Link>
        </div>
      </div>

      <main className="main" style={{ flexDirection: window.innerWidth < 768 ? 'column' : 'row' }}>
        {/* LEFT: Description + test cases */}
        <section className="problem-panel">
          <div className="panel-tabs">
            <button className="tab active">Problem</button>
          </div>
          <div className="problem-body">
            <h2>Problem Statement</h2>
            {challenge.description.split('\n').map((line, i) => <p key={i}>{line}</p>)}

            {challenge.testCases.length > 0 && (
              <>
                <h3>Sample Test Cases</h3>
                {challenge.testCases.map((tc, i) => (
                  <div key={tc.id}>
                    <div style={{ fontSize: '12px', color: '#8b8fa8', marginBottom: '4px' }}>Test Case {i + 1}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#5a5f72', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Input</div>
                        <div className="sample-block">{tc.input}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#5a5f72', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Expected</div>
                        <div className="sample-block">{tc.expectedOutput}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </section>

        {/* RIGHT: Editor */}
        <section className="editor-panel">
          <div className="editor-toolbar">
            <span className="lang-select">JavaScript</span>
            <button className="btn-reset" onClick={handleReset}>Reset</button>
          </div>

          <div className="editor-wrapper" style={{ flexDirection: 'column' }}>
            <CodeEditor value={code} onChange={setCode} />
          </div>

          <div className="editor-footer">
            <button className={`btn-run ${running ? 'running' : ''}`} onClick={handleRun} disabled={running}>
              {running ? 'Running...' : '▶  Run Code'}
            </button>
            <button
              className="btn-submit"
              onClick={handleSubmit}
              disabled={!allPassed || alreadyComplete || submitting}
              title={alreadyComplete ? 'Already completed' : !allPassed ? 'All tests must pass first' : ''}
            >
              {submitting ? 'Submitting...' : alreadyComplete ? 'Already Completed' : 'Submit'}
            </button>
          </div>

          {submitMsg && (
            <div style={{
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 600,
              background: submitMsg.type === 'success' ? 'rgba(46,200,102,0.1)' : submitMsg.type === 'error' ? 'rgba(224,108,117,0.1)' : 'rgba(97,175,239,0.1)',
              color: submitMsg.type === 'success' ? '#2ec866' : submitMsg.type === 'error' ? '#e06c75' : '#61afef',
              borderTop: '1px solid',
              borderColor: submitMsg.type === 'success' ? 'rgba(46,200,102,0.2)' : submitMsg.type === 'error' ? 'rgba(224,108,117,0.2)' : 'rgba(97,175,239,0.2)',
            }}>
              {submitMsg.text}
            </div>
          )}

          <TestResultList results={results} />
        </section>
      </main>
    </div>
  )
}
