'use client'

import { useState } from 'react'
import { Plus, Search, Phone, Mail, MapPin, ShoppingBag, Edit2, Trash2 } from 'lucide-react'
import { useCustomers } from '@/hooks/useCustomers'
import { LoadingSpinner, ErrorMessage, EmptyState } from '@/app/components/ui/LoadingSpinner'
import type { Customer } from '@/lib/types'

function CustomerModal({ customer, onClose, onSave, saving }: {
  customer: Partial<Customer> | null
  onClose: () => void
  onSave: (c: Partial<Customer>) => Promise<void>
  saving: boolean
}) {
  const [form, setForm] = useState<Partial<Customer>>(customer ?? {})
  const [err, setErr]   = useState<string | null>(null)
  const set = (k: keyof Customer, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name?.trim()) return setErr('Name is required')
    if (!form.phone?.trim()) return setErr('Phone is required')
    setErr(null)
    await onSave(form)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }}>
      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border-bright)',
        borderRadius: '12px', padding: '28px', width: '400px',
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--gold)', marginBottom: '20px' }}>
          {customer?.id ? 'Edit Customer' : 'Add Customer'}
        </h2>
        {[
          { label: 'Full Name *',     key: 'name' },
          { label: 'Phone *',         key: 'phone' },
          { label: 'Email',           key: 'email' },
          { label: 'City',            key: 'city' },
          { label: 'Address',         key: 'address' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', display: 'block', marginBottom: '5px' }}>
              {f.label}
            </label>
            <input
              value={(form as Record<string, string>)[f.key] ?? ''}
              onChange={e => set(f.key as keyof Customer, e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', background: 'var(--surface2)',
                border: '0.5px solid var(--border)', borderRadius: '8px',
                color: 'var(--text)', fontSize: '13px', outline: 'none',
              }}
            />
          </div>
        ))}
        {err && <div style={{ fontSize: '12px', color: 'var(--danger)', marginBottom: '12px' }}>{err}</div>}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
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
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  { bg: 'rgba(201,168,76,0.15)',  color: 'var(--gold)' },
  { bg: 'rgba(138,110,180,0.15)', color: '#b89ee8' },
  { bg: 'rgba(39,174,96,0.12)',   color: '#4ade80' },
  { bg: 'rgba(74,130,200,0.12)',  color: '#7eb8f7' },
]

export default function CustomersPage() {
  const { customers, loading, error, refetch, add, update, remove } = useCustomers()
  const [search, setSearch]   = useState('')
  const [modal, setModal]     = useState<Partial<Customer> | null | false>(false)
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    (c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (c.city ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async (form: Partial<Customer>) => {
    setSaving(true)
    try {
      if (form.id) {
        await update(form.id, form)
      } else {
        await add({
          name: form.name!,
          phone: form.phone!,
          email: form.email ?? null,
          address: form.address ?? null,
          city: form.city ?? null,
        })
      }
      setModal(false)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer?')) return
    setDeleting(id)
    try {
      await remove(id)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  const totalSpent = customers.reduce((s, c) => s + (c.total_spent ?? 0), 0)
  const totalOrders = customers.reduce((s, c) => s + (c.total_orders ?? 0), 0)

  if (loading) return <LoadingSpinner text="Loading customers..." />
  if (error)   return <ErrorMessage message={error} onRetry={refetch} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        {[
          { label: 'Total Customers',     value: String(customers.length),                                              color: 'var(--gold)' },
          { label: 'Total Lifetime Value', value: `₨ ${(totalSpent / 1000000).toFixed(1)}M`,                           color: 'var(--success)' },
          { label: 'Avg. Order Value',     value: totalOrders > 0 ? `₨ ${Math.round(totalSpent / totalOrders).toLocaleString()}` : '—', color: '#b89ee8' },
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', flex: 1,
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: '8px', padding: '8px 14px',
        }}>
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            placeholder="Search by name, phone, city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '13px', flex: 1 }}
          />
        </div>
        <button onClick={() => setModal({})} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 16px', background: 'rgba(201,168,76,0.12)',
          border: '0.5px solid var(--gold)', borderRadius: '8px',
          color: 'var(--gold)', fontSize: '13px', cursor: 'pointer', fontWeight: 500,
        }}>
          <Plus size={14} /> Add Customer
        </button>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <EmptyState
          message={search ? 'No customers match your search.' : 'No customers yet. Add your first customer!'}
          action={
            !search ? (
              <button onClick={() => setModal({})} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', background: 'rgba(201,168,76,0.12)',
                border: '0.5px solid var(--gold)', borderRadius: '8px',
                color: 'var(--gold)', fontSize: '13px', cursor: 'pointer',
              }}>
                <Plus size={14} /> Add Customer
              </button>
            ) : undefined
          }
        />
      )}

      {/* Customer Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
        {filtered.map((customer, idx) => {
          const av = AVATAR_COLORS[idx % AVATAR_COLORS.length]
          return (
            <div key={customer.id} style={{
              background: 'var(--surface)', border: '0.5px solid var(--border)',
              borderRadius: '10px', padding: '18px 20px',
              opacity: deleting === customer.id ? 0.5 : 1,
              transition: 'opacity 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '50%',
                  background: av.bg, color: av.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 500, flexShrink: 0,
                }}>
                  {getInitials(customer.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>{customer.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Since {customer.created_at?.slice(0, 7)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => setModal(customer)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => handleDelete(customer.id)} disabled={deleting === customer.id} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '4px' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <Phone size={12} style={{ flexShrink: 0 }} />{customer.phone}
                </div>
                {customer.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <Mail size={12} style={{ flexShrink: 0 }} />{customer.email}
                  </div>
                )}
                {customer.city && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <MapPin size={12} style={{ flexShrink: 0 }} />{customer.city}
                  </div>
                )}
              </div>

              <div style={{
                display: 'flex', gap: '10px',
                borderTop: '0.5px solid var(--border)', paddingTop: '12px',
              }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Orders</div>
                  <div style={{ fontSize: '16px', fontFamily: 'var(--font-display)', color: 'var(--gold)', marginTop: '3px' }}>
                    {customer.total_orders ?? 0}
                  </div>
                </div>
                <div style={{ width: '0.5px', background: 'var(--border)' }} />
                <div style={{ flex: 2, textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Spent</div>
                  <div style={{ fontSize: '14px', fontFamily: 'var(--font-display)', color: 'var(--success)', marginTop: '3px' }}>
                    ₨ {((customer.total_spent ?? 0) / 1000000).toFixed(1)}M
                  </div>
                </div>
                <div style={{ width: '0.5px', background: 'var(--border)' }} />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <button style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--gold)', fontSize: '11px',
                  }}>
                    <ShoppingBag size={12} /> Orders
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {modal !== false && (
        <CustomerModal
          customer={modal}
          onClose={() => setModal(false)}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  )
}