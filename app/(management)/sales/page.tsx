'use client'

import { useState } from 'react'
import { Plus, Search, FileText, ChevronDown } from 'lucide-react'
import { useOrders } from '@/hooks/useOrders'
import { LoadingSpinner, ErrorMessage, EmptyState } from '@/app/components/ui/LoadingSpinner'
import type { Order, OrderStatus, GoldKarat } from '@/lib/types'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  delivered:     { label: 'Delivered',     color: '#4ade80', bg: 'rgba(39,174,96,0.12)' },
  in_production: { label: 'In Production', color: '#E8C97A', bg: 'rgba(201,168,76,0.12)' },
  designing:     { label: 'Designing',     color: '#b89ee8', bg: 'rgba(138,110,180,0.12)' },
  pending:       { label: 'Pending',       color: '#8A7D65', bg: 'rgba(130,100,50,0.12)' },
  ready:         { label: 'Ready',         color: '#60d394', bg: 'rgba(39,174,96,0.15)' },
  quality_check: { label: 'Quality Check', color: '#fb923c', bg: 'rgba(230,126,34,0.12)' },
  cancelled:     { label: 'Cancelled',     color: '#f87171', bg: 'rgba(192,57,43,0.12)' },
}

const KARAT_OPTIONS: GoldKarat[] = ['24K', '22K', '21K', '18K', '14K']
const STATUS_OPTIONS: OrderStatus[] = ['pending', 'designing', 'in_production', 'quality_check', 'ready', 'delivered', 'cancelled']

const GOLD_RATES: Record<string, number> = {
  '24K': 32450, '22K': 29745, '21K': 28390, '18K': 24340, '14K': 18920,
}

function NewOrderModal({ onClose, onSave, saving }: {
  onClose: () => void
  onSave: (o: Partial<Order>) => Promise<void>
  saving: boolean
}) {
  const [form, setForm] = useState({
    customer_id: '',
    product_name: '',
    karat: '22K' as GoldKarat,
    weight_grams: '',
    making_charges: '',
    advance_paid: '',
    notes: '',
    expected_delivery: '',
    status: 'pending' as OrderStatus,
  })
  const [err, setErr] = useState<string | null>(null)

  const goldRate = GOLD_RATES[form.karat] ?? 32450
  const goldValue = (Number(form.weight_grams) || 0) * goldRate
  const makingCharges = Number(form.making_charges) || 0
  const total = goldValue + makingCharges

  const handleSave = async () => {
    if (!form.customer_id.trim()) return setErr('Customer ID is required')
    if (!form.product_name.trim()) return setErr('Item name is required')
    if (!form.weight_grams) return setErr('Weight is required')
    setErr(null)
    await onSave({
  customer_id:        form.customer_id,
  status:             form.status,
  total_weight_grams: Number(form.weight_grams),
  gold_rate_at_order: goldRate,
  making_charges:     makingCharges,
  total_amount:       total,
  advance_paid:       Number(form.advance_paid) || 0,
  notes:              form.notes || null,
  expected_delivery:  form.expected_delivery || null,
  _product_name:      form.product_name,
  _karat:             form.karat,
  _weight_grams:      Number(form.weight_grams),
  _making_charges:    makingCharges,
  _amount:            total,
} as Partial<Order> & {
  _product_name?: string
  _karat?: string
  _weight_grams?: number
  _making_charges?: number
  _amount?: number
  
})
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px', background: 'var(--surface2)',
    border: '0.5px solid var(--border)', borderRadius: '8px',
    color: 'var(--text)', fontSize: '13px', outline: 'none',
  }

  const labelStyle = {
    fontSize: '11px', color: 'var(--text-muted)',
    letterSpacing: '0.08em', display: 'block', marginBottom: '5px',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }}>
      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border-bright)',
        borderRadius: '12px', padding: '28px', width: '480px',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--gold)', marginBottom: '20px' }}>
          New Order
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Customer ID *</label>
            <input value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}
              placeholder="Paste customer UUID from customers page"
              style={inputStyle} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Item Name *</label>
            <input value={form.product_name} onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))}
              placeholder="e.g. Bridal Necklace Set"
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Karat</label>
            <select value={form.karat} onChange={e => setForm(f => ({ ...f, karat: e.target.value as GoldKarat }))}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              {KARAT_OPTIONS.map(k => <option key={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Weight (grams) *</label>
            <input type="number" value={form.weight_grams}
              onChange={e => setForm(f => ({ ...f, weight_grams: e.target.value }))}
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Making Charges (PKR)</label>
            <input type="number" value={form.making_charges}
              onChange={e => setForm(f => ({ ...f, making_charges: e.target.value }))}
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Advance Paid (PKR)</label>
            <input type="number" value={form.advance_paid}
              onChange={e => setForm(f => ({ ...f, advance_paid: e.target.value }))}
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as OrderStatus }))}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Expected Delivery</label>
            <input type="date" value={form.expected_delivery}
              onChange={e => setForm(f => ({ ...f, expected_delivery: e.target.value }))}
              style={inputStyle} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2} style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }} />
          </div>
        </div>

        {/* Price Summary */}
        <div style={{
          background: 'var(--surface2)', border: '0.5px solid var(--border)',
          borderRadius: '8px', padding: '14px', marginBottom: '16px',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
            Price Summary
          </div>
          {[
            { label: `Gold Value (${form.weight_grams || 0}g × ₨${goldRate.toLocaleString()})`, value: `₨ ${goldValue.toLocaleString()}` },
            { label: 'Making Charges', value: `₨ ${makingCharges.toLocaleString()}` },
            { label: 'Total Amount', value: `₨ ${total.toLocaleString()}`, bold: true, color: 'var(--gold)' },
            { label: 'Advance Paid', value: `₨ ${(Number(form.advance_paid) || 0).toLocaleString()}`, color: 'var(--success)' },
            { label: 'Balance Due', value: `₨ ${(total - (Number(form.advance_paid) || 0)).toLocaleString()}`, color: 'var(--warning)' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.label}</span>
              <span style={{ fontSize: row.bold ? '14px' : '12px', color: row.color ?? 'var(--text)', fontWeight: row.bold ? 600 : 400 }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {err && <div style={{ fontSize: '12px', color: 'var(--danger)', marginBottom: '12px' }}>{err}</div>}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} disabled={saving} style={{
            flex: 1, padding: '9px', background: 'var(--surface2)',
            border: '0.5px solid var(--border)', borderRadius: '8px',
            color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 1, padding: '9px', background: 'rgba(201,168,76,0.15)',
            border: '0.5px solid var(--gold)', borderRadius: '8px',
            color: 'var(--gold)', fontSize: '13px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 500,
          }}>
            {saving ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </div>
    </div>
  )
}

function UpdateStatusModal({ order, onClose, onUpdate, saving }: {
  order: Order
  onClose: () => void
  onUpdate: (id: string, status: OrderStatus) => Promise<void>
  saving: boolean
}) {
  const [status, setStatus] = useState<OrderStatus>(order.status)
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }}>
      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border-bright)',
        borderRadius: '12px', padding: '28px', width: '340px',
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--gold)', marginBottom: '8px' }}>
          Update Status
        </h2>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          {order.order_number} — {order.customer?.name}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {STATUS_OPTIONS.map(s => {
            const cfg = STATUS_CONFIG[s]
            return (
              <button key={s} onClick={() => setStatus(s)} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                border: '0.5px solid',
                borderColor: status === s ? cfg.color : 'var(--border)',
                background: status === s ? cfg.bg : 'var(--surface2)',
                textAlign: 'left',
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: status === s ? cfg.color : 'var(--text-muted)' }}>{cfg.label}</span>
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '9px', background: 'var(--surface2)',
            border: '0.5px solid var(--border)', borderRadius: '8px',
            color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={() => onUpdate(order.id, status)} disabled={saving} style={{
            flex: 1, padding: '9px', background: 'rgba(201,168,76,0.15)',
            border: '0.5px solid var(--gold)', borderRadius: '8px',
            color: 'var(--gold)', fontSize: '13px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 500,
          }}>
            {saving ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SalesPage() {
  const { orders, loading, error, refetch, add, update } = useOrders()
  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState('all')
  const [newModal, setNewModal]     = useState(false)
  const [updateModal, setUpdateModal] = useState<Order | null>(null)
  const [saving, setSaving]         = useState(false)

  const filtered = orders.filter(o => {
    const matchSearch =
      (o.customer?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (o.items?.[0]?.product_name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || o.status === filter
    return matchSearch && matchFilter
  })

  const totalRevenue   = orders.reduce((s, o) => s + Number(o.total_amount), 0)
  const totalCollected = orders.reduce((s, o) => s + Number(o.advance_paid), 0)
  const totalPending   = totalRevenue - totalCollected

  const handleAdd = async (form: Partial<Order> & {
  _product_name?: string
  _karat?: string
  _weight_grams?: number
  _making_charges?: number
  _amount?: number
}) => {
  setSaving(true)
  try {
    const { _product_name, _karat, _weight_grams, _making_charges, _amount, ...orderData } = form
    await add(
      orderData as Omit<Order, 'id' | 'order_number' | 'balance_due' | 'payment_status' | 'created_at' | 'order_items'>,
      _product_name ? {
        product_name:   _product_name,
        karat:          _karat ?? '22K',
        weight_grams:   _weight_grams ?? 0,
        making_charges: _making_charges ?? 0,
        amount:         _amount ?? 0,
      } : undefined
    )
    setNewModal(false)
  } catch (e: unknown) {
    alert(e instanceof Error ? e.message : 'Failed to create order')
  } finally {
    setSaving(false)
  }
}

  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    setSaving(true)
    try {
      await update(id, { status })
      setUpdateModal(null)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner text="Loading orders..." />
  if (error)   return <ErrorMessage message={error} onRetry={refetch} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[
          { label: 'Total Orders',  value: String(orders.length),                              color: 'var(--gold)' },
          { label: 'Total Revenue', value: `₨ ${(totalRevenue / 1000000).toFixed(1)}M`,       color: 'var(--success)' },
          { label: 'Collected',     value: `₨ ${(totalCollected / 1000000).toFixed(1)}M`,     color: '#60d394' },
          { label: 'Balance Due',   value: `₨ ${(totalPending / 1000000).toFixed(1)}M`,       color: 'var(--warning)' },
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

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px',
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: '8px', padding: '8px 14px',
        }}>
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            placeholder="Search orders, customers, items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '13px', flex: 1 }}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['all', ...STATUS_OPTIONS].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer',
              border: '0.5px solid',
              borderColor: filter === s ? 'var(--gold)' : 'var(--border)',
              background: filter === s ? 'rgba(201,168,76,0.12)' : 'var(--surface)',
              color: filter === s ? 'var(--gold)' : 'var(--text-muted)',
            }}>
              {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label ?? s}
            </button>
          ))}
        </div>
        <button onClick={() => setNewModal(true)} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 16px', background: 'rgba(201,168,76,0.12)',
          border: '0.5px solid var(--gold)', borderRadius: '8px',
          color: 'var(--gold)', fontSize: '13px', cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap',
        }}>
          <Plus size={14} /> New Order
        </button>
      </div>

      {filtered.length === 0 && (
        <EmptyState
          message={search ? 'No orders match your search.' : 'No orders yet. Create your first order!'}
          action={!search ? (
            <button onClick={() => setNewModal(true)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', background: 'rgba(201,168,76,0.12)',
              border: '0.5px solid var(--gold)', borderRadius: '8px',
              color: 'var(--gold)', fontSize: '13px', cursor: 'pointer',
            }}>
              <Plus size={14} /> New Order
            </button>
          ) : undefined}
        />
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div style={{
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: '10px', overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                {['Order', 'Customer', 'Item', 'Weight', 'Total', 'Advance', 'Balance', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '12px 14px', textAlign: 'left',
                    fontSize: '11px', color: 'var(--text-muted)',
                    letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, i) => {
                const st      = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['pending']
                const balance = Number(order.total_amount) - Number(order.advance_paid)
                const item = order.order_items?.[0]
                return (
                  <tr key={order.id} style={{
                    borderBottom: i < filtered.length - 1 ? '0.5px solid var(--border)' : 'none',
                  }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 500 }}>{order.order_number}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {order.created_at?.slice(0, 10)}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text)' }}>
                      {order.customer?.name ?? '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{item?.product_name ?? '—'}</div>
                      {item?.karat && (
                        <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '1px' }}>{item.karat}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {item ? `${item.weight_grams}g` : '—'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>
                      ₨ {Number(order.total_amount).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--success)' }}>
                      ₨ {Number(order.advance_paid).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: balance > 0 ? 'var(--warning)' : 'var(--success)' }}>
                      ₨ {balance.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        fontSize: '10px', padding: '3px 9px', borderRadius: '99px',
                        fontWeight: 500, color: st.color, background: st.bg,
                      }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <button onClick={() => setUpdateModal(order)} style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        background: 'none', border: '0.5px solid var(--border)',
                        borderRadius: '6px', padding: '4px 8px',
                        color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer',
                      }}>
                        <ChevronDown size={11} /> Status
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {newModal && (
        <NewOrderModal onClose={() => setNewModal(false)} onSave={handleAdd} saving={saving} />
      )}
      {updateModal && (
        <UpdateStatusModal
          order={updateModal}
          onClose={() => setUpdateModal(null)}
          onUpdate={handleUpdateStatus}
          saving={saving}
        />
      )}
    </div>
  )
}