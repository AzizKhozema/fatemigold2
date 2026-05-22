'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  TrendingUp, TrendingDown, AlertTriangle,
  ShoppingCart, ArrowUpRight, Coins, Hammer, Workflow, Pencil,
} from 'lucide-react'
import { supabase } from '@/lib/supabase_client'
import type { GoldRate } from '@/lib/types'

const GOLD_RATES: GoldRate[] = [
  { karat: '24K', rate_per_gram: 32450, change_percent: 0.8 },
  { karat: '22K', rate_per_gram: 29745, change_percent: 0.8 },
  { karat: '18K', rate_per_gram: 24340, change_percent: -0.2 },
]

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  delivered:     { label: 'Delivered',     color: '#4ade80', bg: 'rgba(39,174,96,0.12)' },
  in_production: { label: 'In Production', color: '#E8C97A', bg: 'rgba(201,168,76,0.12)' },
  designing:     { label: 'Designing',     color: '#b89ee8', bg: 'rgba(138,110,180,0.12)' },
  pending:       { label: 'Pending',       color: '#8A7D65', bg: 'rgba(130,100,50,0.12)' },
  ready:         { label: 'Ready',         color: '#60d394', bg: 'rgba(39,174,96,0.15)' },
  cancelled:     { label: 'Cancelled',     color: '#f87171', bg: 'rgba(192,57,43,0.12)' },
}

const QUICK_MODULES = [
  { label: 'Design Studio', href: '/design',       icon: Pencil },
  { label: 'AI Generator',  href: '/ai-generator', icon: Coins },
  { label: 'Workflow',      href: '/workflow',      icon: Workflow },
  { label: 'Labour',        href: '/labour',        icon: Hammer },
]

type Stats = {
  revenue: number
  orders: number
  customers: number
  goldStock: number
  lowStock: number
}

type RecentOrder = {
  id: string
  order_number: string
  status: string
  total_amount: number
  customer: { name: string } | null
  items: { product_name: string; karat: string; weight_grams: number }[]
}

type StockItem = {
  material: string
  quantity_grams: number
  karat: string | null
}

function KpiCard({ label, value, sub, trend }: {
  label: string; value: string; sub: string
  trend: 'up' | 'down' | 'warn' | 'neutral'
}) {
  const color =
    trend === 'up'   ? 'var(--success)' :
    trend === 'down' ? 'var(--danger)'  :
    trend === 'warn' ? 'var(--warning)' : 'var(--gold)'
  return (
    <div style={{
      background: 'var(--surface)', border: '0.5px solid var(--border)',
      borderRadius: '10px', padding: '18px 20px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: color }} />
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--text)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '11px', color, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        {trend === 'up'   && <TrendingUp size={11} />}
        {trend === 'down' && <TrendingDown size={11} />}
        {trend === 'warn' && <AlertTriangle size={11} />}
        {sub}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats]               = useState<Stats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [stockItems, setStockItems]     = useState<StockItem[]>([])
  const [monthlySales, setMonthlySales] = useState<number[]>(Array(12).fill(0))
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [
        { data: orders },
        { data: customers },
        { data: inventory },
        { data: recent },
      ] = await Promise.all([
        supabase.from('orders').select('total_amount, status, created_at'),
        supabase.from('customers').select('id'),
        supabase.from('inventory').select('material, karat, quantity_grams, min_threshold_grams, cost_per_gram'),
        supabase.from('orders')
          .select('id, order_number, status, total_amount, customer:customers(name), items:order_items(product_name, karat, weight_grams)')
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      const now = new Date()
      const thisMonth = now.getMonth()
      const thisYear  = now.getFullYear()

      const monthlyRevenue = Array(12).fill(0)
      let revenue = 0
      let activeOrders = 0

      ;(orders ?? []).forEach((o: { total_amount: number; status: string; created_at: string }) => {
        const d = new Date(o.created_at)
        if (d.getFullYear() === thisYear) {
          monthlyRevenue[d.getMonth()] += Number(o.total_amount)
        }
        if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
          revenue += Number(o.total_amount)
        }
        if (!['delivered', 'cancelled'].includes(o.status)) activeOrders++
      })

      const goldStock = (inventory ?? [])
        .filter((i: { karat: string | null }) => i.karat !== null)
        .reduce((s: number, i: { quantity_grams: number }) => s + Number(i.quantity_grams), 0)

      const lowStock = (inventory ?? [])
        .filter((i: { quantity_grams: number; min_threshold_grams: number }) => i.quantity_grams < i.min_threshold_grams).length

      setStats({
        revenue,
        orders: activeOrders,
        customers: customers?.length ?? 0,
        goldStock: Math.round(goldStock),
        lowStock,
      })

      setMonthlySales(monthlyRevenue)
      const formattedOrders = (recent ?? []).map(order => ({
  ...order,
  // Safely grab the first customer if it exists, otherwise fall back to a default object
  customer: order.customer?.[0] ? { name: String(order.customer[0].name) } : { name: 'Unknown' }

})) as RecentOrder[];

      setRecentOrders(formattedOrders)
      setStockItems((inventory ?? []).slice(0, 6) as StockItem[])
      setLoading(false)
    }
    load()
  }, [])

  const maxSales = Math.max(...monthlySales, 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {loading ? Array(4).fill(null).map((_, i) => (
          <div key={i} style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: '10px', padding: '18px 20px', height: '92px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        )) : <>
          <KpiCard label="This Month Revenue" value={`₨ ${((stats?.revenue ?? 0) / 1000000).toFixed(1)}M`}    sub="Current month"          trend="up" />
          <KpiCard label="Active Orders"       value={String(stats?.orders ?? 0)}                              sub="In progress"            trend="up" />
          <KpiCard label="Gold Stock"          value={`${(stats?.goldStock ?? 0).toLocaleString()}g`}           sub={stats?.lowStock ? `${stats.lowStock} low stock alert${stats.lowStock > 1 ? 's' : ''}` : 'All stocked'} trend={stats?.lowStock ? 'warn' : 'neutral'} />
          <KpiCard label="Total Customers"     value={(stats?.customers ?? 0).toLocaleString()}                 sub="Registered"            trend="neutral" />
        </>}
      </div>

      {/* Quick Modules */}
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
          Quick Access
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {QUICK_MODULES.map(m => {
            const Icon = m.icon
            return (
              <a key={m.href} href={m.href} style={{
                background: 'var(--surface)', border: '0.5px solid var(--border)',
                borderRadius: '10px', padding: '16px', textAlign: 'center',
                textDecoration: 'none', display: 'block', transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-bright)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <Icon size={22} style={{ color: 'var(--gold)', marginBottom: '8px' }} />
                <div style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500 }}>{m.label}</div>
              </a>
            )
          })}
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>

        {/* Recent Orders */}
        <div style={{
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: '10px', padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>Recent Orders</span>
            <a href="/billing" style={{ fontSize: '11px', color: 'var(--gold)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}>
              View all <ArrowUpRight size={11} />
            </a>
          </div>
          {recentOrders.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '30px', fontSize: '13px', color: 'var(--text-dim)' }}>
              No orders yet
            </div>
          )}
          {recentOrders.map((order, i) => {
            const st = STATUS_STYLES[order.status] ?? STATUS_STYLES['pending']
            const firstItem = order.items?.[0]
            return (
              <div key={order.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 0',
                borderBottom: i < recentOrders.length - 1 ? '0.5px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'var(--surface2)', border: '0.5px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <ShoppingCart size={14} style={{ color: 'var(--gold)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {firstItem?.product_name ?? 'Order'} — {order.customer?.name ?? 'Unknown'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                    {order.order_number} · ₨ {Number(order.total_amount).toLocaleString()}
                  </div>
                </div>
                <span style={{
                  fontSize: '10px', padding: '2px 9px', borderRadius: '99px',
                  fontWeight: 500, color: st.color, background: st.bg, flexShrink: 0,
                }}>
                  {st.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Right col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Gold Rates */}
          <div style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: '10px', padding: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>Gold Rates</span>
              <span style={{ fontSize: '11px', color: 'var(--gold)' }}>Today</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {GOLD_RATES.map(r => (
                <div key={r.karat} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', background: 'var(--surface2)',
                  borderRadius: '8px', border: '0.5px solid var(--border)',
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.karat}/g</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '15px', color: 'var(--gold)' }}>
                    ₨ {r.rate_per_gram.toLocaleString()}
                  </span>
                  <span style={{
                    fontSize: '10px', padding: '2px 7px', borderRadius: '99px',
                    background: r.change_percent >= 0 ? 'rgba(39,174,96,0.12)' : 'rgba(192,57,43,0.12)',
                    color: r.change_percent >= 0 ? '#4ade80' : '#f87171',
                  }}>
                    {r.change_percent >= 0 ? '+' : ''}{r.change_percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Summary */}
          <div style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: '10px', padding: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>Stock</span>
              <Link href="/inventory" style={{ fontSize: '11px', color: 'var(--gold)', textDecoration: 'none' }}>Manage →</Link>
            </div>
            {stockItems.length === 0 && !loading && (
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', textAlign: 'center', padding: '16px' }}>No stock data</div>
            )}
            {stockItems.map((item, i) => {
              const COLORS = ['#C9A84C','#E8C97A','#8B6E2E','#9CA3AF','#b89ee8','#7eb8f7']
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '6px 0', borderBottom: i < stockItems.length - 1 ? '0.5px solid var(--border)' : 'none',
                }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: '12px', color: 'var(--text)' }}>{item.material}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{Math.round(item.quantity_grams)}g</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Sales Chart */}
      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border)',
        borderRadius: '10px', padding: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>
            Monthly Revenue — {new Date().getFullYear()}
          </span>
          <a href="/reports" style={{ fontSize: '11px', color: 'var(--gold)', textDecoration: 'none' }}>Full report →</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '100px' }}>
          {monthlySales.map((val, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', height: '100%' }}>
              <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                <div style={{
                  width: '100%',
                  height: `${(val / maxSales) * 100}%`,
                  background: i === new Date().getMonth() ? 'var(--gold)' : 'rgba(201,168,76,0.25)',
                  borderRadius: '3px 3px 0 0', minHeight: val > 0 ? '4px' : '0',
                }} />
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>{MONTHS[i]}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}