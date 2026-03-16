export default function ProgressBar({ complete, total, label }) {
  const pct = total > 0 ? Math.round((complete / total) * 100) : 0
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: '#8b8fa8' }}>
        <span>{label || `${complete} of ${total} challenges complete`}</span>
        <span style={{ color: '#2ec866', fontWeight: 600 }}>{pct}%</span>
      </div>
      <div style={{ background: '#2a2d38', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #2ec866, #39d972)',
            borderRadius: '4px',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  )
}
