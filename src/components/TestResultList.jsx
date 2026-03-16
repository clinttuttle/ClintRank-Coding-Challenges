function formatVal(v) {
  if (typeof v === 'undefined') return 'undefined'
  if (typeof v === 'string') return v
  try { return JSON.stringify(v) } catch { return String(v) }
}

export default function TestResultList({ results }) {
  if (!results) return null
  const allPassed = results.every(r => r.passed)

  return (
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
              <span className="tc-label">Test Case {i + 1}</span>
              {r.isHidden && <span className="tc-hidden-tag">hidden</span>}
            </summary>
            <div className="tc-detail">
              <div className="tc-row">
                <span className="tc-key">Input</span>
                <span className="tc-val">{formatVal(r.input)}</span>
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
                    <span className="tc-val">{formatVal(r.expected)}</span>
                  </div>
                  <div className="tc-row">
                    <span className="tc-key">Your Output</span>
                    <span className={`tc-val ${r.passed ? '' : 'wrong'}`}>{formatVal(r.actual)}</span>
                  </div>
                </>
              )}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
