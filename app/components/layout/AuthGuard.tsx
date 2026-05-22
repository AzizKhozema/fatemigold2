'use client'

import { useAuth } from '@/lib/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import type { UserRole } from '@/lib/auth'

type Props = {
  children: React.ReactNode
  allowedRoles: UserRole[]
}

export default function AuthGuard({ children, allowedRoles }: Props) {
  const { user, loading } = useAuth()
  const router  = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/login')
      return
    }
    if (!allowedRoles.includes(user.role)) {
      if (user.role === 'admin')      router.replace('/dashboard')
      if (user.role === 'supervisor') router.replace('/supervisor')
      if (user.role === 'worker')     router.replace('/worker')
    }
  }, [user, loading, pathname])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)',
      }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          border: '2px solid var(--border)', borderTopColor: 'var(--gold)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!user || !allowedRoles.includes(user.role)) return null

  return <>{children}</>
}