'use client'

import { usePathname } from 'next/navigation'
import { TrendingUp, Bell, Search, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'

const pageTitles: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/sales':        'Sales & Invoices',
  '/customers':    'Customers',
  '/inventory':    'Inventory',
  '/billing':      'Billing & Orders',
  '/design':       'Design Studio',
  '/ai-generator': 'AI Generator',
  '/labour':       'Labour Management',
  '/workflow':     'Workflow',
  '/employees':    'Employees',
  '/reports':      'Reports & Analytics',
  '/wages':        'Wage Approvals',
}

export default function Topbar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const title = pageTitles[pathname] ?? 'Fatemi Gold'

  return (
    <header style={{
      height: '56px', background: 'var(--surface)',
      borderBottom: '0.5px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: '16px', flexShrink: 0,
    }}>
      <h1 style={{
        fontFamily: 'var(--font-display)', fontSize: '17px',
        color: 'var(--text)', flex: 1, fontWeight: 500,
      }}>
        {title}
      </h1>

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'var(--surface2)', border: '0.5px solid var(--border)',
        borderRadius: '8px', padding: '6px 12px', cursor: 'text',
      }}>
        <Search size={13} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Search...</span>
      </div>

      {/* Gold rate */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        fontSize: '12px', color: 'var(--text-muted)',
        background: 'var(--surface2)', border: '0.5px solid var(--border)',
        borderRadius: '6px', padding: '5px 12px',
      }}>
        <TrendingUp size={13} style={{ color: 'var(--gold)' }} />
        <span>24K: PKR 32,450/g</span>
      </div>

      {/* Bell */}
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: 'rgba(201,168,76,0.1)', border: '0.5px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }}>
        <Bell size={15} style={{ color: 'var(--gold)' }} />
      </div>

      {/* User + logout */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500 }}>
              {user.name}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {user.role}
            </div>
          </div>
          <button onClick={logout} title="Sign out" style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'var(--surface2)', border: '0.5px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-muted)',
          }}>
            <LogOut size={14} />
          </button>
        </div>
      )}
    </header>
  )
}