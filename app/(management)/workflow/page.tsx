'use client'

import { ArrowRight, CheckCircle } from 'lucide-react'
import { useOrders } from '@/hooks/useOrders'
import { LoadingSpinner, ErrorMessage } from '@/app/components/ui/LoadingSpinner'
import type { Order, OrderStatus } from '@/lib/types'

const STAGES = [
  { id: 'pending',       label: 'Pending',        color: '#8A7D65' },
  { id: 'designing',     label: 'Designing',      color: '#b89ee8' },
  { id: 'in_production', label: 'In Production',  color: '#E8C97A' },
  { id: 'quality_check', label: 'Quality Check',  color: '#fb923c' },
  { id: 'ready',         label: 'Ready',          color: '#4ade80' },
  { id: 'delivered',     label: 'Delivered',      color: '#C9A84C' },
]

const NEXT_STAGE: Record<string, OrderStatus> = {
  pending:       'designing',
  designing:     'in_production',
  in_production: 'quality_check',
  quality_check: 'ready',
  ready:         'delivered',
}

function OrderCard({ order, onMove }: {
  order: Order
  onMove: (id: string, status: OrderStatus) => void
}) {
  const next    = NEXT_STAGE[order.status]
  const nextCfg = STAGES.find(s => s.id === next)
  const item = order.order_items?.[0]

  return (
    <div style={{
      background: 'var(--surface2)', border: '0.5px solid var(--border)',
      borderRadius: '8px', padding: '12px', marginBottom: '8px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
        <span style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 500 }}>
          {order.order_number}
        </span>
        <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
          ₨ {Number(order.total_amount).toLocaleString()}
        </span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500, marginBottom: '2px' }}>
        {item?.product_name ?? 'Order'}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
        {order.customer?.name ?? '—'} {item?.karat ? `· ${item.karat}` : ''}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {order.expected_delivery && (
          <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
            Due: {order.expected_delivery.slice(0, 10)}
          </div>
        )}
        {next && nextCfg ? (
          <button onClick={() => onMove(order.id, next)} style={{
            display: 'flex', alignItems: 'center', gap: '3px',
            background: 'rgba(201,168,76,0.1)', border: '0.5px solid var(--border-bright)',
            borderRadius: '5px', padding: '3px 8px',
            color: 'var(--gold)', fontSize: '10px', cursor: 'pointer',
            marginLeft: 'auto',
          }}>
            {nextCfg.label} <ArrowRight size={9} />
          </button>
        ) : (
          <span style={{ fontSize: '10px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '3px', marginLeft: 'auto' }}>
            <CheckCircle size={10} /> Complete
          </span>
        )}
      </div>
    </div>
  )
}

export default function WorkflowPage() {
  const { orders, loading, error, refetch, update } = useOrders()

  const moveOrder = async (id: string, status: OrderStatus) => {
    try { await update(id, { status }) }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed to update') }
  }

  const activeOrders  = orders.filter(o => o.status !== 'cancelled')
  const highPriority  = orders.filter(o =>
    ['pending', 'designing', 'in_production'].includes(o.status)
  ).length

  if (loading) return <LoadingSpinner text="Loading workflow..." />
  if (error)   return <ErrorMessage message={error} onRetry={refetch} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[
          { label: 'Active Orders',   value: String(activeOrders.length), color: 'var(--gold)' },
          { label: 'Needs Attention', value: String(highPriority),        color: 'var(--danger)' },
          { label: 'Stages',          value: String(STAGES.length),       color: '#b89ee8' },
          { label: 'Delivered',       value: String(orders.filter(o => o.status === 'delivered').length), color: 'var(--success)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: '10px', padding: '18px 20px',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              {s.label}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline Legend */}
      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border)',
        borderRadius: '10px', padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '4px' }}>Pipeline:</span>
        {STAGES.map((stage, i) => (
          <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontSize: '11px', padding: '3px 10px', borderRadius: '99px',
              background: `${stage.color}18`, color: stage.color,
              border: `0.5px solid ${stage.color}40`,
            }}>
              {stage.label}
            </span>
            {i < STAGES.length - 1 && <ArrowRight size={11} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />}
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`,
        gap: '12px',
        overflowX: 'auto',
        paddingBottom: '8px',
      }}>
        {STAGES.map(stage => {
          const stageOrders = activeOrders.filter(o => o.status === stage.id)
          return (
            <div key={stage.id} style={{
              background: 'var(--surface)', border: '0.5px solid var(--border)',
              borderRadius: '10px', minWidth: '170px', overflow: 'hidden',
            }}>
              <div style={{
                padding: '12px 14px', borderBottom: '0.5px solid var(--border)',
                borderTop: `2px solid ${stage.color}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)' }}>
                    {stage.label}
                  </span>
                  <span style={{
                    fontSize: '10px', padding: '1px 7px', borderRadius: '99px',
                    background: `${stage.color}18`, color: stage.color, fontWeight: 500,
                  }}>
                    {stageOrders.length}
                  </span>
                </div>
              </div>
              <div style={{ padding: '10px', minHeight: '120px' }}>
                {stageOrders.length === 0 ? (
                  <div style={{
                    textAlign: 'center', padding: '20px 10px',
                    fontSize: '11px', color: 'var(--text-dim)',
                    border: '0.5px dashed var(--border)', borderRadius: '6px',
                  }}>
                    Empty
                  </div>
                ) : (
                  stageOrders.map(order => (
                    <OrderCard key={order.id} order={order} onMove={moveOrder} />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary Table */}
      {activeOrders.length > 0 && (
        <div style={{
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: '10px', overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--border)' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>All Active Orders</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                {['Order', 'Customer', 'Item', 'Karat', 'Stage', 'Amount', 'Delivery'].map(h => (
                  <th key={h} style={{
                    padding: '11px 14px', textAlign: 'left',
                    fontSize: '11px', color: 'var(--text-muted)',
                    letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeOrders.map((order, i) => {
                const stage = STAGES.find(s => s.id === order.status)
                const item = order.order_items?.[0]
                return (
                  <tr key={order.id} style={{
                    borderBottom: i < activeOrders.length - 1 ? '0.5px solid var(--border)' : 'none',
                  }}>
                    <td style={{ padding: '11px 14px', fontSize: '12px', color: 'var(--gold)', fontWeight: 500 }}>
                      {order.order_number}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: '13px', color: 'var(--text)' }}>
                      {order.customer?.name ?? '—'}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {item?.product_name ?? '—'}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {item?.karat ?? '—'}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      {stage && (
                        <span style={{
                          fontSize: '11px', padding: '2px 8px', borderRadius: '99px',
                          background: `${stage.color}18`, color: stage.color,
                          border: `0.5px solid ${stage.color}40`,
                        }}>
                          {stage.label}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: '13px', color: 'var(--text)' }}>
                      ₨ {Number(order.total_amount).toLocaleString()}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {order.expected_delivery?.slice(0, 10) ?? '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}