'use client'

import { useState } from 'react'
import { Plus, AlertTriangle, Search, Edit2, Trash2, Package } from 'lucide-react'
import { useInventory } from '@/hooks/useInventory'
import { LoadingSpinner, ErrorMessage, EmptyState } from '@/app/components/ui/LoadingSpinner'
import type { InventoryItem } from '@/lib/types'

function Modal({ item, onClose, onSave, saving }: {
  item: Partial<InventoryItem> | null
  onClose: () => void
  onSave: (item: Partial<InventoryItem>) => Promise<void>
  saving: boolean
}) {
  const [form, setForm] = useState<Partial<InventoryItem>>(item ?? {})
  const [err, setErr]   = useState<string | null>(null)
  const set = (k: keyof InventoryItem, v: string | number | null) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.material?.trim()) return setErr('Material name is required')
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
        borderRadius: '12px', padding: '28px', width: '420px',
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--gold)', marginBottom: '20px' }}>
          {item?.id ? 'Edit Material' : 'Add Material'}
        </h2>
        {[
          { label: 'Material Name *', key: 'material',            type: 'text' },
          { label: 'Karat',           key: 'karat',               type: 'text' },
          { label: 'Quantity (g) *',  key: 'quantity_grams',      type: 'number' },
          { label: 'Min Threshold',   key: 'min_threshold_grams', type: 'number' },
          { label: 'Cost per gram',   key: 'cost_per_gram',       type: 'number' },
          { label: 'Supplier',        key: 'supplier',            type: 'text' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', display: 'block', marginBottom: '5px' }}>
              {f.label}
            </label>
            <input
              type={f.type}
              value={(form as Record<string, string | number | null>)[f.key] ?? ''}
              onChange={e => set(f.key as keyof InventoryItem, f.type === 'number' ? Number(e.target.value) : e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', background: 'var(--surface2)',
                border: '0.5px solid var(--border)', borderRadius: '8px',
                color: 'var(--text)', fontSize: '13px', outline: 'none',
              }}
            />
          </div>
        ))}
        {err && <div style={{ fontSize: '12px', color: 'var(--danger)', marginBottom: '12px' }}>{err}</div>}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
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
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MaterialsTab() {
  const { items, loading, error, refetch, add, update, remove } = useInventory()
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState<Partial<InventoryItem> | null | false>(false)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const filtered = items.filter(i =>
    i.material.toLowerCase().includes(search.toLowerCase()) ||
    (i.supplier ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async (form: Partial<InventoryItem>) => {
    setSaving(true)
    try {
      if (form.id) await update(form.id, form)
      else await add({
        material:            form.material!,
        karat:               form.karat ?? null,
        quantity_grams:      form.quantity_grams ?? 0,
        min_threshold_grams: form.min_threshold_grams ?? 100,
        cost_per_gram:       form.cost_per_gram ?? 0,
        supplier:            form.supplier ?? null,
      })
      setModal(false)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this material?')) return
    setDeleting(id)
    try { await remove(id) }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed to delete') }
    finally { setDeleting(null) }
  }

  const totalValue = items.reduce((s, i) => s + i.quantity_grams * i.cost_per_gram, 0)
  const lowStock   = items.filter(i => i.quantity_grams < i.min_threshold_grams).length

  if (loading) return <LoadingSpinner text="Loading materials..." />
  if (error)   return <ErrorMessage message={error} onRetry={refetch} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { label: 'Total Materials', value: String(items.length),                        color: 'var(--gold)' },
          { label: 'Low Stock',       value: String(lowStock),                            color: 'var(--warning)' },
          { label: 'Stock Value',     value: `₨ ${(totalValue/1000000).toFixed(1)}M`,    color: 'var(--success)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: '10px', padding: '16px 18px',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
              {s.label}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', flex: 1,
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: '8px', padding: '8px 14px',
        }}>
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            placeholder="Search materials..."
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
          <Plus size={14} /> Add Material
        </button>
      </div>

      {filtered.length === 0 && (
        <EmptyState message={search ? 'No materials match.' : 'No materials yet.'} />
      )}

      {filtered.length > 0 && (
        <div style={{
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: '10px', overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                {['Material', 'Karat', 'Stock', 'Min', 'Cost/g', 'Total Value', 'Supplier', 'Status', ''].map(h => (
                  <th key={h} style={{
                    padding: '11px 14px', textAlign: 'left', fontSize: '11px',
                    color: 'var(--text-muted)', letterSpacing: '0.08em',
                    textTransform: 'uppercase', fontWeight: 500,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => {
                const low = item.quantity_grams < item.min_threshold_grams
                return (
                  <tr key={item.id} style={{
                    borderBottom: i < filtered.length - 1 ? '0.5px solid var(--border)' : 'none',
                    opacity: deleting === item.id ? 0.4 : 1,
                  }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Package size={13} style={{ color: 'var(--gold)' }} />
                        <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{item.material}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>{item.karat ?? '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: low ? 'var(--warning)' : 'var(--text)' }}>
                      {item.quantity_grams}g
                      {low && <AlertTriangle size={11} style={{ marginLeft: '5px', verticalAlign: 'middle', color: 'var(--warning)' }} />}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>{item.min_threshold_grams}g</td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text)' }}>₨ {item.cost_per_gram.toLocaleString()}</td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--success)' }}>
                      ₨ {(item.quantity_grams * item.cost_per_gram).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>{item.supplier ?? '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        fontSize: '10px', padding: '2px 8px', borderRadius: '99px',
                        background: low ? 'rgba(230,126,34,0.12)' : 'rgba(39,174,96,0.12)',
                        color: low ? 'var(--warning)' : 'var(--success)', fontWeight: 500,
                      }}>
                        {low ? 'Low' : 'OK'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => setModal(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} disabled={!!deleting} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
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

      {modal !== false && (
        <Modal item={modal} onClose={() => setModal(false)} onSave={handleSave} saving={saving} />
      )}
    </div>
  )
}