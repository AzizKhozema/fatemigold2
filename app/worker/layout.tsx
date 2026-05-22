import AuthGuard from '@/app/components/layout/AuthGuard'

export default function WorkerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard allowedRoles={['worker', 'supervisor', 'admin']}>
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        maxWidth: '480px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {children}
      </div>
    </AuthGuard>
  )
}