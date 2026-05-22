import AuthGuard from '@/app/components/layout/AuthGuard'
import SupervisorNav from './components/SupervisorNav'

export default function SupervisorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard allowedRoles={['admin', 'supervisor']}>
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <SupervisorNav />
        <main style={{
          flex: 1,
          padding: '20px',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
        }}>
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}