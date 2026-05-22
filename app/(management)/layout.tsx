import Sidebar from '@/app/components/layout/Sidebar'
import Topbar from '@/app/components/layout/Topbar'
import AuthGuard from '@/app/components/layout/AuthGuard'

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <Topbar />
          <main className="flex-1 overflow-auto p-6"
            style={{ background: 'var(--bg)' }}>
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}