'use client'

import { useState } from 'react'
import { Plus, Search, FileText, Printer, CheckCircle, Clock, XCircle, Trash2 } from 'lucide-react'
import { useInvoices } from '@/hooks/useInvoices'
import { LoadingSpinner, ErrorMessage, EmptyState } from '@/app/components/ui/LoadingSpinner'
import type { Invoice } from '@/lib/types'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  paid:     { label: 'Paid',     color: '#4ade80', bg: 'rgba(39,174,96,0.12)',  icon: <CheckCircle size={11} /> },
  partial:  { label: 'Partial',  color: '#E8C97A', bg: 'rgba(201,168,76,0.12)', icon: <Clock size={11} /> },
  unpaid:   { label: 'Unpaid',   color: '#f87171', bg: 'rgba(192,57,43,0.12)', icon: <XCircle size={11} /> },
  refunded: { label: 'Refunded', color: '#7eb8f7', bg: 'rgba(74,130,200,0.12)', icon: <XCircle size={11} /> },
}

function InvoiceViewModal({ invoice, onClose, onMarkPaid, saving }: {
  invoice: Invoice
  onClose: () => void
  onMarkPaid: (id: string) => Promise<void>
  saving: boolean
}) {
  const balance = Number(invoice.total) - Number(invoice.paid_amount)

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }}>
      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border-bright)',
        borderRadius: '12px', width: '480px', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--surface2), var(--surface3))',
          padding: '24px 28px', borderBottom: '0.5px solid var(--border)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--gold)' }}>
                Fatemi Gold
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Karachi, Pakistan
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>
                {invoice.invoice_number}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Issued: {invoice.issued_at?.slice(0, 10)}
              </div>
              {invoice.due_date && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Due: {invoice.due_date}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: '24px 28px' }}>
          {/* Bill To */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
              Bill To
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 500 }}>
              {(invoice.customer as { name?: string })?.name ?? 'Customer'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Order: {(invoice.order as { order_number?: string })?.order_number ?? invoice.order_id}
            </div>
          </div>

          {/* Line Items */}
          <div style={{
            background: 'var(--surface2)', borderRadius: '8px',
            border: '0.5px solid var(--border)', overflow: 'hidden', marginBottom: '16px',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                  {['Description', 'Amount'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left',
                      fontSize: '10px', color: 'var(--text-muted)',
                      letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: Number(invoice.discount) > 0 ? '0.5px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--text)' }}>
                    Gold Jewellery — {(invoice.order as { order_number?: string })?.order_number ?? invoice.order_id}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--text)' }}>
                    ₨ {Number(invoice.subtotal).toLocaleString()}
                  </td>
                </tr>
                {Number(invoice.discount) > 0 && (
                  <tr>
                    <td style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--success)' }}>Discount</td>
                    <td style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--success)' }}>
                      − ₨ {Number(invoice.discount).toLocaleString()}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {[
              { label: 'Subtotal',    value: `₨ ${Number(invoice.subtotal).toLocaleString()}`,    color: 'var(--text-muted)', bold: false },
              { label: 'Discount',    value: `− ₨ ${Number(invoice.discount).toLocaleString()}`,  color: 'var(--success)',    bold: false },
              { label: 'Total',       value: `₨ ${Number(invoice.total).toLocaleString()}`,       color: 'var(--text)',       bold: true  },
              { label: 'Paid',        value: `₨ ${Number(invoice.paid_amount).toLocaleString()}`, color: '#4ade80',           bold: false },
              { label: 'Balance Due', value: `₨ ${balance.toLocaleString()}`,                     color: balance > 0 ? 'var(--warning)' : '#4ade80', bold: true },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.label}</span>
                <span style={{
                  fontSize: row.bold ? '15px' : '13px',
                  color: row.color,
                  fontWeight: row.bold ? 600 : 400,
                  fontFamily: row.bold ? 'var(--font-display)' : 'inherit',
                }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Status Badge */}
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
            {(() => {
              const st = STATUS_CONFIG[invoice.payment_status]
              return (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  fontSize: '12px', padding: '6px 16px', borderRadius: '99px',
                  fontWeight: 500, color: st.color, background: st.bg,
                  border: `0.5px solid ${st.color}40`,
                }}>
                  {st.icon} {st.label}
                </span>
              )
            })()}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} style={{
              flex: 1, padding: '9px', background: 'var(--surface2)',
              border: '0.5px solid var(--border)', borderRadius: '8px',
              color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer',
            }}>Close</button>
            {invoice.payment_status !== 'paid' && (
              <button
                onClick={() => onMarkPaid(invoice.id)}
                disabled={saving}
                style={{
                  flex: 1, padding: '9px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '6px',
                  background: 'rgba(39,174,96,0.12)', border: '0.5px solid var(--success)',
                  borderRadius: '8px', color: 'var(--success)',
                  fontSize: '13px', cursor: saving ? 'not-allowed' : 'pointer',
                }}>
                <CheckCircle size={13} /> {saving ? 'Updating...' : 'Mark as Paid'}
              </button>
            )}
            <button onClick={() => window.print()} style={{
              flex: 1, padding: '9px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '6px',
              background: 'rgba(201,168,76,0.12)', border: '0.5px solid var(--gold)',
              borderRadius: '8px', color: 'var(--gold)', fontSize: '13px', cursor: 'pointer',
            }}>
              <Printer size={13} /> Print
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function NewInvoiceModal({ onClose, onSave, saving }: {
  onClose: () => void
  onSave: (inv: Omit<Invoice, 'id' | 'invoice_number' | 'issued_at'>) => Promise<void>
  saving: boolean
}) {
  const [form, setForm] = useState({
    order_id: '', customer_id: '',
    subtotal: '', discount: '0', tax: '0',
    paid_amount: '', due_date: '',
  })
  const [err, setErr] = useState<string | null>(null)

  const total = (Number(form.subtotal) || 0) - (Number(form.discount) || 0) + (Number(form.tax) || 0)
  const balance = total - (Number(form.paid_amount) || 0)
  const paymentStatus =
    Number(form.paid_amount) >= total ? 'paid' :
    Number(form.paid_amount) > 0 ? 'partial' : 'unpaid'

  const handleSave = async () => {
    if (!form.order_id.trim())    return setErr('Order ID is required')
    if (!form.customer_id.trim()) return setErr('Customer ID is required')
    if (!form.subtotal)           return setErr('Subtotal is required')
    setErr(null)
    await onSave({
      order_id:       form.order_id,
      customer_id:    form.customer_id,
      subtotal:       Number(form.subtotal),
      discount:       Number(form.discount) || 0,
      tax:            Number(form.tax) || 0,
      total,
      paid_amount:    Number(form.paid_amount) || 0,
      payment_status: paymentStatus as Invoice['payment_status'],
      due_date:       form.due_date || null,
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
        borderRadius: '12px', padding: '28px', width: '440px',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--gold)', marginBottom: '20px' }}>
          New Invoice
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Order ID *</label>
            <input value={form.order_id} onChange={e => setForm(f => ({ ...f, order_id: e.target.value }))}
              placeholder="Paste order UUID" style={inputStyle} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Customer ID *</label>
            <input value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}
              placeholder="Paste customer UUID" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Subtotal (PKR) *</label>
            <input type="number" value={form.subtotal}
              onChange={e => setForm(f => ({ ...f, subtotal: e.target.value }))}
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Discount (PKR)</label>
            <input type="number" value={form.discount}
              onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Tax (PKR)</label>
            <input type="number" value={form.tax}
              onChange={e => setForm(f => ({ ...f, tax: e.target.value }))}
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Paid Amount (PKR)</label>
            <input type="number" value={form.paid_amount}
              onChange={e => setForm(f => ({ ...f, paid_amount: e.target.value }))}
              style={inputStyle} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Due Date</label>
            <input type="date" value={form.due_date}
              onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
              style={inputStyle} />
          </div>
        </div>

        {/* Summary */}
        <div style={{
          background: 'var(--surface2)', border: '0.5px solid var(--border)',
          borderRadius: '8px', padding: '14px', marginBottom: '16px',
        }}>
          {[
            { label: 'Subtotal',    value: `₨ ${(Number(form.subtotal) || 0).toLocaleString()}` },
            { label: 'Discount',    value: `− ₨ ${(Number(form.discount) || 0).toLocaleString()}` },
            { label: 'Tax',         value: `₨ ${(Number(form.tax) || 0).toLocaleString()}` },
            { label: 'Total',       value: `₨ ${total.toLocaleString()}`,   bold: true, color: 'var(--gold)' },
            { label: 'Balance Due', value: `₨ ${balance.toLocaleString()}`, bold: true, color: balance > 0 ? 'var(--warning)' : 'var(--success)' },
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
          <button onClick={onClose} style={{
            flex: 1, padding: '9px', background: 'var(--surface2)',
            border: '0.5px solid var(--border)', borderRadius: '8px',
            color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 1, padding: '9px', background: 'rgba(201,168,76,0.15)',
            border: '0.5px solid var(--gold)', borderRadius: '8px',
            color: 'var(--gold)', fontSize: '13px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 500,
          }}>
            {saving ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BillingPage() {
  const { invoices, loading, error, refetch, add, update, remove } = useInvoices()
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState('all')
  const [selected, setSelected]   = useState<Invoice | null>(null)
  const [newModal, setNewModal]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState<string | null>(null)

  const filtered = invoices.filter(inv => {
    const matchSearch =
      (inv.customer as { name?: string })?.name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      (inv.order as { order_number?: string })?.order_number?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || inv.payment_status === filter
    return matchSearch && matchFilter
  })

  const totalBilled    = invoices.reduce((s, i) => s + Number(i.total), 0)
  const totalCollected = invoices.reduce((s, i) => s + Number(i.paid_amount), 0)
  const totalDue       = totalBilled - totalCollected

  const handleAdd = async (form: Omit<Invoice, 'id' | 'invoice_number' | 'issued_at'>) => {
    setSaving(true)
    try {
      await add(form)
      setNewModal(false)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to create invoice')
    } finally {
      setSaving(false)
    }
  }

  const handleMarkPaid = async (id: string) => {
    setSaving(true)
    try {
      const inv = invoices.find(i => i.id === id)
      if (!inv) return
      await update(id, {
        payment_status: 'paid',
        paid_amount: Number(inv.total),
      })
      setSelected(null)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invoice?')) return
    setDeleting(id)
    try { await remove(id) }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed to delete') }
    finally { setDeleting(null) }
  }

  if (loading) return <LoadingSpinner text="Loading invoices..." />
  if (error)   return <ErrorMessage message={error} onRetry={refetch} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[
          { label: 'Total Invoices', value: String(invoices.length),                            color: 'var(--gold)' },
          { label: 'Total Billed',   value: `₨ ${(totalBilled / 1000000).toFixed(1)}M`,        color: 'var(--text)' },
          { label: 'Collected',      value: `₨ ${(totalCollected / 1000000).toFixed(1)}M`,     color: 'var(--success)' },
          { label: 'Outstanding',    value: `₨ ${(totalDue / 1000000).toFixed(1)}M`,           color: 'var(--warning)' },
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
            placeholder="Search invoices, customers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '13px', flex: 1 }}
          />
        </div>
        {['all', 'paid', 'partial', 'unpaid'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '6px 14px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer',
            border: '0.5px solid', textTransform: 'capitalize',
            borderColor: filter === s ? 'var(--gold)' : 'var(--border)',
            background: filter === s ? 'rgba(201,168,76,0.12)' : 'var(--surface)',
            color: filter === s ? 'var(--gold)' : 'var(--text-muted)',
          }}>
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <button onClick={() => setNewModal(true)} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 16px', background: 'rgba(201,168,76,0.12)',
          border: '0.5px solid var(--gold)', borderRadius: '8px',
          color: 'var(--gold)', fontSize: '13px', cursor: 'pointer', fontWeight: 500,
        }}>
          <Plus size={14} /> New Invoice
        </button>
      </div>

      {filtered.length === 0 && (
        <EmptyState
          message={search ? 'No invoices match your search.' : 'No invoices yet. Create your first invoice!'}
          action={!search ? (
            <button onClick={() => setNewModal(true)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', background: 'rgba(201,168,76,0.12)',
              border: '0.5px solid var(--gold)', borderRadius: '8px',
              color: 'var(--gold)', fontSize: '13px', cursor: 'pointer',
            }}>
              <Plus size={14} /> New Invoice
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
                {['Invoice', 'Order', 'Customer', 'Issued', 'Due', 'Total', 'Paid', 'Balance', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '12px 14px', textAlign: 'left',
                    fontSize: '11px', color: 'var(--text-muted)',
                    letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, i) => {
                const st      = STATUS_CONFIG[inv.payment_status]
                const balance = Number(inv.total) - Number(inv.paid_amount)
                const customer = inv.customer as { name?: string } | null
                const order    = inv.order    as { order_number?: string } | null
                return (
                  <tr key={inv.id} style={{
                    borderBottom: i < filtered.length - 1 ? '0.5px solid var(--border)' : 'none',
                    opacity: deleting === inv.id ? 0.4 : 1, transition: 'opacity 0.2s',
                  }}>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 500 }}>
                        {inv.invoice_number}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {order?.order_number ?? '—'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text)' }}>
                      {customer?.name ?? '—'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {inv.issued_at?.slice(0, 10)}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {inv.due_date ?? '—'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>
                      ₨ {Number(inv.total).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--success)' }}>
                      ₨ {Number(inv.paid_amount).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: balance > 0 ? 'var(--warning)' : 'var(--success)' }}>
                      ₨ {balance.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        fontSize: '10px', padding: '3px 9px', borderRadius: '99px',
                        fontWeight: 500, color: st.color, background: st.bg,
                      }}>
                        {st.icon}{st.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => setSelected(inv)} style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                          gap: '4px', fontSize: '11px',
                        }}>
                          <FileText size={13} /> View
                        </button>
                        <button onClick={() => handleDelete(inv.id)} disabled={deleting === inv.id} style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--danger)', padding: '2px',
                        }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <InvoiceViewModal
          invoice={selected}
          onClose={() => setSelected(null)}
          onMarkPaid={handleMarkPaid}
          saving={saving}
        />
      )}
      {newModal && (
        <NewInvoiceModal
          onClose={() => setNewModal(false)}
          onSave={handleAdd}
          saving={saving}
        />
      )}
    </div>
  )
}