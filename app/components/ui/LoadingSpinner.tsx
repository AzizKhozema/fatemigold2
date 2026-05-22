export function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '300px', gap: '16px',
    }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        border: '2px solid var(--border)',
        borderTopColor: 'var(--gold)',
        animation: 'spin 0.8s linear infinite',
      }} />
      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{text}</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '300px', gap: '12px',
    }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '50%',
        background: 'rgba(192,57,43,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '20px',
      }}>⚠</div>
      <div style={{ fontSize: '13px', color: 'var(--danger)', textAlign: 'center', maxWidth: '300px' }}>
        {message}
      </div>
      {onRetry && (
        <button onClick={onRetry} style={{
          padding: '7px 16px', background: 'rgba(201,168,76,0.12)',
          border: '0.5px solid var(--gold)', borderRadius: '8px',
          color: 'var(--gold)', fontSize: '13px', cursor: 'pointer',
        }}>
          Try Again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '200px', gap: '12px',
      border: '0.5px dashed var(--border)', borderRadius: '10px',
      padding: '40px',
    }}>
      <div style={{ fontSize: '32px', opacity: 0.3 }}>◈</div>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
        {message}
      </div>
      {action}
    </div>
  )
}