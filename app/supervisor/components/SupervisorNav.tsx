'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import {
  LayoutDashboard, ClipboardList,
  UserCheck, PackageCheck, LogOut, Bell,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase_client'

const NAV = [
  { href: '/supervisor',         label: 'Workshop',  icon: LayoutDashboard },
  { href: '/supervisor/assign',  label: 'Assign',    icon: ClipboardList },
  { href: '/supervisor/collect', label: 'Collect',   icon: PackageCheck },
  { href: '/supervisor/workers', label: 'Workers',   icon: UserCheck },
]

export default function SupervisorNav() {
  const pathname        = usePathname()
  const { user, logout } = useAuth()
  const router          = useRouter()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) return
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('to_employee_id', user.employee_id)
      .eq('read', false)
      .then(({ count }) => setUnread(count ?? 0))

    const sub = supabase
      .channel('supervisor-notifs')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'notifications',
        filter: `to_employee_id=eq.${user.employee_id}`,
      }, () => {
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('to_employee_id', user.employee_id)
          .eq('read', false)
          .then(({ count }) => setUnread(count ?? 0))
      })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [user])

  return (
    <header style={{
      background: 'var(--surface)',
      borderBottom: '0.5px solid var(--border)',
      padding: '0 20px',
      display: 'flex',
      alignItems: 'center',
      height: '60px',
      gap: '8px',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '16px', color: 'var(--gold)',
        marginRight: '16px', flexShrink: 0,
      }}>
        Fatemi Gold
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', gap: '4px', flex: 1 }}>
        {NAV.map(item => {
          const active = pathname === item.href
          const Icon   = item.icon
          return (
            <button key={item.href} onClick={() => router.push(item.href)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '8px',
              fontSize: '13px', cursor: 'pointer', border: 'none',
              background: active ? 'rgba(201,168,76,0.12)' : 'transparent',
              color: active ? 'var(--gold)' : 'var(--text-muted)',
              fontWeight: active ? 500 : 400,
            }}>
              <Icon size={15} />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'var(--surface2)', border: '0.5px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-muted)',
          }}>
            <Bell size={16} />
          </button>
          {unread > 0 && (
            <div style={{
              position: 'absolute', top: '-2px', right: '-2px',
              width: '16px', height: '16px', borderRadius: '50%',
              background: 'var(--danger)', color: '#fff',
              fontSize: '9px', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {unread > 9 ? '9+' : unread}
            </div>
          )}
        </div>

        {/* User */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500 }}>
            {user?.name}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            Supervisor
          </div>
        </div>

        {/* Logout */}
        <button onClick={logout} style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'var(--surface2)', border: '0.5px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--text-muted)',
        }}>
          <LogOut size={14} />
        </button>
      </div>
    </header>
  )
}