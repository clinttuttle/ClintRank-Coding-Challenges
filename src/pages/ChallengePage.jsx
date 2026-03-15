import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getChallenge } from '../api'
import '../App.css'

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }
  if (isPlainObject(value)) {
    const entries = Object.keys(value)
      .sort()
      .map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    return `{${entries.join(',')}}`
  }
  return JSON.stringify(value)
}

function formatValue(value) {
  if (typeof value === 'string') return value
  if (typeof value === 'undefined') return 'undefined'
  if (typeof value === 'function') return '[Function]'
  if (typeof value === 'symbol') return value.toString()

  try {
    const serialized = stableStringify(value)
    return typeof serialized === 'undefined' ? String(value) : serialized
  } catch {
    return String(value)
  }
}

function isStringArray(value) {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}

function areEqual(a, b) {
  return stableStringify(a) === stableStringify(b)
}

function executeCode(code, functionName, input) {
  const output = []
  const mockConsole = { log: (...args) => output.push(args.map(formatValue).join(' ')) }
  try {
    const args = Array.isArray(input) ? input : [input]
    const fn = new Function('console', 'args', `${code}\nreturn ${functionName}(...args)`)
    const returnValue = fn(mockConsole, args)
    return { output, returnValue, error: null }
  } catch (e) {
    return { output, returnValue: undefined, error: e.message }
  }
}

export default function ChallengePage() {
  const { id } = useParams()
  const [challenge, setChallenge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [code, setCode] = useState('')
  const [results, setResults] = useState(null)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    getChallenge(id)
      .then(c => { setChallenge(c); setCode(c.starter_code) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  function handleRun() {
    setRunning(true)
    setTimeout(() => {
      const testResults = challenge.test_cases.map(tc => {
        const { output, returnValue, error } = executeCode(code, challenge.function_name, tc.input)
        const comparesConsoleOutput = isStringArray(tc.expected)
        const passed = !error && (comparesConsoleOutput ? areEqual(output, tc.expected) : areEqual(returnValue, tc.expected))
        return { ...tc, output, returnValue, error, passed }
      })
      setResults(testResults)
      setRunning(false)
    }, 400)
  }

  function handleReset() {
    setCode(challenge.starter_code)
    setResults(null)
  }

  if (loading) return <div className="app"><p style={{ padding: '2rem', color: '#8b8fa8' }}>Loading...</p></div>
  if (error) return <div className="app"><p style={{ padding: '2rem', color: '#e06c75' }}>{error}</p></div>

  const desc = challenge.description
  const sampleCases = challenge.test_cases.filter(tc => tc.sample)
  const allPassed = results && results.every(r => r.passed)
  const anyRan = results !== null

  return (
    <div className="app">
      <header className="navbar">
        <div className="navbar-left">
          <span className="nav-logo">Clint's Coding Corner</span>
          <span className="nav-sep">|</span>
          <Link to="/" className="nav-section" style={{ textDecoration: 'none', color: '#8b8fa8' }}>Practice</Link>
        </div>
        <div className="navbar-right">
          <span className="nav-user">guest_user</span>
        </div>
      </header>

      <div className="challenge-bar">
        <div className="challenge-meta">
          <span className="challenge-title">{challenge.title}</span>
          <span className={`badge ${challenge.difficulty.toLowerCase()}`}>{challenge.difficulty}</span>
          <span className="badge lang">{challenge.language}</span>
        </div>
        <div className="challenge-actions">
          <span className="score-label">Max Score: <strong>{challenge.max_score}</strong></span>
          <span className="score-label">Success Rate: <strong>{challenge.success_rate}%</strong></span>
        </div>
      </div>

      <main className="main">
        <section className="problem-panel">
          <div className="panel-tabs">
            <button className="tab active">Problem</button>
            <button className="tab">Discussions</button>
            <button className="tab">Leaderboard</button>
          </div>

          <div className="problem-body">
            <h2>Problem Statement</h2>
            {desc.statement.split('\n').map((line, i) => <p key={i}>{line}</p>)}

            {desc.functionDescription && (
              <>
                <h3>Function Description</h3>
                {desc.functionDescription.split('\n').map((line, i) => <p key={i}>{line}</p>)}
              </>
            )}

            {desc.constraints?.length > 0 && (
              <>
                <h3>Constraints</h3>
                <ul>{desc.constraints.map((c, i) => <li key={i}><code>{c}</code></li>)}</ul>
              </>
            )}

            {sampleCases.map((tc, i) => (
              <div key={i}>
                <h3>Sample Input {i}</h3>
                <div className="sample-block">{formatValue(tc.input)}</div>
                <h3>Sample Output {i}</h3>
                <div className="sample-block">
                  {isStringArray(tc.expected)
                    ? tc.expected.map((line, j) => <div key={j}>{line}</div>)
                    : <div>{formatValue(tc.expected)}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="editor-panel">
          <div className="editor-toolbar">
            <span className="lang-select">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              {challenge.language} (Node.js)
            </span>
            <button className="btn-reset" onClick={handleReset}>Reset</button>
          </div>

          <div className="editor-wrapper">
            <div className="line-numbers" aria-hidden="true">
              {code.split('\n').map((_, i) => <span key={i}>{i + 1}</span>)}
            </div>
            <textarea
              className="code-editor"
              value={code}
              onChange={e => setCode(e.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
            />
          </div>

          <div className="editor-footer">
            <button className={`btn-run ${running ? 'running' : ''}`} onClick={handleRun} disabled={running}>
              {running ? 'Running...' : '▶  Run Code'}
            </button>
            <button className="btn-submit" disabled={!anyRan || !allPassed}>Submit</button>
          </div>

          {results && (
            <div className="results-panel">
              <div className={`results-banner ${allPassed ? 'pass' : 'fail'}`}>
                {allPassed
                  ? '✓  All test cases passed!'
                  : `✗  ${results.filter(r => !r.passed).length} test case(s) failed`}
              </div>
              <div className="test-cases">
                {results.map((r, i) => (
                  <details key={i} className={`test-case ${r.passed ? 'pass' : 'fail'}`}>
                    <summary>
                      <span className={`tc-icon ${r.passed ? 'pass' : 'fail'}`}>{r.passed ? '✓' : '✗'}</span>
                      <span className="tc-label">{r.label}</span>
                      {!r.sample && <span className="tc-hidden-tag">hidden</span>}
                    </summary>
                    <div className="tc-detail">
                      <div className="tc-row">
                        <span className="tc-key">Input</span>
                        <span className="tc-val">{formatValue(r.input)}</span>
                      </div>
                      {r.error ? (
                        <div className="tc-row error">
                          <span className="tc-key">Error</span>
                          <span className="tc-val">{r.error}</span>
                        </div>
                      ) : (
                        <>
                          <div className="tc-row">
                            <span className="tc-key">Expected</span>
                            <span className="tc-val">{isStringArray(r.expected) ? r.expected.join(', ') : formatValue(r.expected)}</span>
                          </div>
                          <div className="tc-row">
                            <span className="tc-key">Your Output</span>
                            <span className={`tc-val ${r.passed ? '' : 'wrong'}`}>
                              {r.output.length
                                ? r.output.join(', ')
                                : typeof r.returnValue === 'undefined'
                                  ? '(no output)'
                                  : formatValue(r.returnValue)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
