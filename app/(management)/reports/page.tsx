'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Download, Calendar } from 'lucide-react'

const MONTHLY_DATA = [
  { month: 'Jan', revenue: 6200000,  orders: 42, customers: 38, labour: 320000 },
  { month: 'Feb', revenue: 7500000,  orders: 51, customers: 44, labour: 380000 },
  { month: 'Mar', revenue: 5800000,  orders: 39, customers: 35, labour: 290000 },
  { month: 'Apr', revenue: 8800000,  orders: 58, customers: 52, labour: 440000 },
  { month: 'May', revenue: 8200000,  orders: 55, customers: 48, labour: 410000 },
  { month: 'Jun', revenue: 9100000,  orders: 62, customers: 56, labour: 460000 },
  { month: 'Jul', revenue: 7000000,  orders: 47, customers: 42, labour: 350000 },
  { month: 'Aug', revenue: 9500000,  orders: 64, customers: 58, labour: 475000 },
  { month: 'Sep', revenue: 7800000,  orders: 52, customers: 46, labour: 390000 },
  { month: 'Oct', revenue: 10500000, orders: 70, customers: 64, labour: 525000 },
  { month: 'Nov', revenue: 11500000, orders: 78, customers: 70, labour: 575000 },
  { month: 'Dec', revenue: 4800000,  orders: 32, customers: 28, labour: 240000 },
]

const CATEGORY_DATA = [
  { name: 'Bridal Sets',    value: 35, color: '#C9A84C' },
  { name: 'Necklaces',      value: 22, color: '#E8C97A' },
  { name: 'Bangles',        value: 18, color: '#b89ee8' },
  { name: 'Rings',          value: 14, color: '#7eb8f7' },
  { name: 'Ear Rings',      value: 7,  color: '#4ade80' },
  { name: 'Gold Coins',     value: 4,  color: '#fb923c' },
]

const KARAT_DATA = [
  { karat: '24K', revenue: 18400000, pct: 42 },
  { karat: '22K', revenue: 15700000, pct: 36 },
  { karat: '21K', revenue: 5240000,  pct: 12 },
  { karat: '18K', revenue: 3060000,  pct: 7  },
  { karat: '14K', revenue: 1300000,  pct: 3  },
]

const TOP_CUSTOMERS = [
  { name: 'Ahmed Raza',   city: 'Islamabad', orders: 8, spent: 12400000 },
  { name: 'Aisha Malik',  city: 'Karachi',   orders: 6, spent: 9200000  },
  { name: 'Hira Ali',     city: 'Lahore',    orders: 3, spent: 8200000  },
  { name: 'Bilal Ahmed',  city: 'Lahore',    orders: 2, spent: 7100000  },
  { name: 'Sana Mirza',   city: 'Karachi',   orders: 5, spent: 4500000  },
]

function BarChart({ data, valueKey, color = 'var(--gold)', height = 120 }: {
  data: typeof MONTHLY_DATA
  valueKey: keyof typeof MONTHLY_DATA[0]
  color?: string
  height?: number
}) {
  const max = Math.max(...data.map(d => d[valueKey] as number))
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height }}>
      {data.map((d, i) => {
        const val = d[valueKey] as number
        const pct = (val / max) * 100
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%' }}>
            <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
              <div
                title={`${d.month}: ${typeof val === 'number' && val > 100000 ? `₨ ${(val/1000000).toFixed(1)}M` : val}`}
                style={{
                  width: '100%',
                  height: `${pct}%`,
                  background: i === 4 ? color : `${color}40`,
                  borderRadius: '3px 3px 0 0',
                  minHeight: '4px',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              />
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>{d.month}</div>
          </div>
        )
      })}
    </div>
  )
}

function DonutChart({ data }: { data: typeof CATEGORY_DATA }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  let cumulative = 0
  const radius = 60
  const cx = 80, cy = 80
  const strokeWidth = 22

  const segments = data.map(d => {
    const startAngle = (cumulative / total) * 360 - 90
    cumulative += d.value
    const endAngle = (cumulative / total) * 360 - 90
    const start = polarToCartesian(cx, cy, radius, endAngle)
    const end = polarToCartesian(cx, cy, radius, startAngle)
    const largeArc = endAngle - startAngle > 180 ? 1 : 0
    return {
      ...d,
      path: `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`,
    }
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        {segments.map((seg, i) => (
          <path key={i} d={seg.path} fill="none" stroke={seg.color} strokeWidth={strokeWidth} />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--text)" fontSize="14" fontFamily="var(--font-display)">
          {total}%
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--text-muted)" fontSize="9">
          categories
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', flex: 1 }}>
        {data.map(d => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', flex: 1 }}>{d.name}</span>
            <span style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500 }}>{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = (angle * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

export default function ReportsPage() {
  const [period, setPeriod] = useState('2026')

  const totalRevenue = MONTHLY_DATA.reduce((s, d) => s + d.revenue, 0)
  const totalOrders  = MONTHLY_DATA.reduce((s, d) => s + d.orders, 0)
  const totalLabour  = MONTHLY_DATA.reduce((s, d) => s + d.labour, 0)
  const avgOrder     = Math.round(totalRevenue / totalOrders)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['2024', '2025', '2026'].map(y => (
            <button key={y} onClick={() => setPeriod(y)} style={{
              padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
              border: '0.5px solid',
              borderColor: period === y ? 'var(--gold)' : 'var(--border)',
              background: period === y ? 'rgba(201,168,76,0.12)' : 'var(--surface)',
              color: period === y ? 'var(--gold)' : 'var(--text-muted)',
            }}>
              {y}
            </button>
          ))}
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '7px 14px', background: 'rgba(201,168,76,0.12)',
          border: '0.5px solid var(--gold)', borderRadius: '8px',
          color: 'var(--gold)', fontSize: '12px', cursor: 'pointer',
        }}>
          <Download size={13} /> Export Report
        </button>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[
          { label: 'Annual Revenue',  value: `₨ ${(totalRevenue/1000000).toFixed(1)}M`, trend: '+18%', up: true },
          { label: 'Total Orders',    value: String(totalOrders),                        trend: '+23%', up: true },
          { label: 'Avg Order Value', value: `₨ ${(avgOrder/1000).toFixed(0)}K`,        trend: '+6%',  up: true },
          { label: 'Labour Cost',     value: `₨ ${(totalLabour/1000000).toFixed(1)}M`,  trend: '+12%', up: false },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: '10px', padding: '18px 20px',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              {s.label}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--text)' }}>
              {s.value}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
              {s.up
                ? <TrendingUp size={11} style={{ color: 'var(--success)' }} />
                : <TrendingDown size={11} style={{ color: 'var(--warning)' }} />
              }
              <span style={{ fontSize: '11px', color: s.up ? 'var(--success)' : 'var(--warning)' }}>
                {s.trend} vs last year
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>

        {/* Revenue Chart */}
        <div style={{
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: '10px', padding: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>Monthly Revenue</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{period}</span>
          </div>
          <BarChart data={MONTHLY_DATA} valueKey="revenue" color="var(--gold)" height={130} />
        </div>

        {/* Category Donut */}
        <div style={{
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: '10px', padding: '20px',
        }}>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>Sales by Category</span>
          </div>
          <DonutChart data={CATEGORY_DATA} />
        </div>
      </div>

      {/* Orders Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: '10px', padding: '20px',
        }}>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>Monthly Orders</span>
          </div>
          <BarChart data={MONTHLY_DATA} valueKey="orders" color="#7eb8f7" height={100} />
        </div>

        {/* Karat Breakdown */}
        <div style={{
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: '10px', padding: '20px',
        }}>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>Revenue by Karat</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {KARAT_DATA.map(k => (
              <div key={k.karat} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '32px', flexShrink: 0 }}>{k.karat}</span>
                <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: '99px', height: '6px' }}>
                  <div style={{
                    width: `${k.pct}%`, height: '6px', borderRadius: '99px',
                    background: 'var(--gold)',
                  }} />
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text)', width: '40px', textAlign: 'right' }}>{k.pct}%</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '60px', textAlign: 'right' }}>
                  ₨{(k.revenue/1000000).toFixed(1)}M
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border)',
        borderRadius: '10px', overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--border)' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>Top Customers by Revenue</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
              {['Rank', 'Customer', 'City', 'Orders', 'Total Spent', 'Share'].map(h => (
                <th key={h} style={{
                  padding: '11px 16px', textAlign: 'left',
                  fontSize: '11px', color: 'var(--text-muted)',
                  letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TOP_CUSTOMERS.map((c, i) => {
              const share = ((c.spent / totalRevenue) * 100).toFixed(1)
              return (
                <tr key={c.name} style={{
                  borderBottom: i < TOP_CUSTOMERS.length - 1 ? '0.5px solid var(--border)' : 'none',
                }}>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: i === 0 ? 'rgba(201,168,76,0.2)' : 'var(--surface2)',
                      color: i === 0 ? 'var(--gold)' : 'var(--text-muted)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 500,
                    }}>
                      {i + 1}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{c.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>{c.city}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>{c.orders}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--success)', fontWeight: 500 }}>
                    ₨ {(c.spent / 1000000).toFixed(1)}M
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '80px', background: 'var(--surface2)', borderRadius: '99px', height: '5px' }}>
                        <div style={{ width: `${share}%`, height: '5px', borderRadius: '99px', background: 'var(--gold)' }} />
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{share}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}