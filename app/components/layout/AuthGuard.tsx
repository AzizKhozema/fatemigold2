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
  const router   = useRouter()
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
  }, [user, loading])

  // Show content immediately if user is cached
  if (!loading && user && allowedRoles.includes(user.role)) {
    return <>{children}</>
  }

  // Show minimal loader only on first load
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)',
      }}>
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '16px',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '24px', color: 'var(--gold)',
          }}>
            Fatemi Gold
          </div>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            border: '2px solid var(--border)',
            borderTopColor: 'var(--gold)',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return null
}