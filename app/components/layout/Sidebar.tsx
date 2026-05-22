'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ShoppingCart, Users, Package,
  Receipt, Pencil, Sparkles, Wrench, Workflow,
  UserCheck, BarChart3, Settings, ChevronRight, Coins
} from 'lucide-react'

const navItems = [
  {
    section: 'Core',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Sales & Invoices', href: '/sales', icon: ShoppingCart, badge: 4 },
      { label: 'Customers', href: '/customers', icon: Users },
      { label: 'Inventory', href: '/inventory', icon: Package },
      { label: 'Billing & Orders', href: '/billing', icon: Receipt },
    ],
  },
  {
    section: 'Production',
    items: [
      { label: 'Design Studio', href: '/design', icon: Pencil },
      { label: 'AI Generator', href: '/ai-generator', icon: Sparkles },
      { label: 'Labour', href: '/labour', icon: Wrench },
      { label: 'Workflow', href: '/workflow', icon: Workflow },
    ],
  },
  {
    section: 'People',
    items: [
      { label: 'Employees', href: '/employees', icon: UserCheck },
      { label: 'Wages',     href: '/wages',     icon: Coins },
      { label: 'Reports', href: '/reports', icon: BarChart3 },
    ]
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: '220px',
      minHeight: '100vh',
      background: 'var(--surface)',
      borderRight: '0.5px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '24px 20px 20px',
        borderBottom: '0.5px solid var(--border)',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '20px',
          color: 'var(--gold)',
          letterSpacing: '0.04em',
          lineHeight: 1.2,
        }}>
          Fatemi Gold
        </div>
        <div style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          marginTop: '2px',
        }}>
          Business Suite
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 0', flex: 1, overflowY: 'auto' }}>
        {navItems.map((group) => (
          <div key={group.section}>
            <div style={{
              fontSize: '10px',
              color: 'var(--text-dim)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              padding: '12px 20px 6px',
            }}>
              {group.section}
            </div>
            {group.items.map((item) => {
              const active = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href))
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 20px',
                    fontSize: '13px',
                    color: active ? 'var(--gold)' : 'var(--text-muted)',
                    background: active ? 'rgba(201,168,76,0.06)' : 'transparent',
                    borderLeft: active
                      ? '2px solid var(--gold)'
                      : '2px solid transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon size={15} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && (
                    <span style={{
                      background: 'var(--gold-dim)',
                      color: '#0D0C0A',
                      fontSize: '10px',
                      fontWeight: 500,
                      padding: '1px 7px',
                      borderRadius: '99px',
                    }}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '16px 20px',
        borderTop: '0.5px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 500,
          color: '#0D0C0A',
          flexShrink: 0,
        }}>
          FG
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', color: 'var(--text)' }}>Admin</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Owner</div>
        </div>
        <Settings size={15} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
      </div>
    </aside>
  )
}