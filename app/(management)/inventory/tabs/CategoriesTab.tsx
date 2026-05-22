'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import type { Category } from '@/hooks/useCategories'
import { LoadingSpinner, ErrorMessage, EmptyState } from '@/app/components/ui/LoadingSpinner'

const ICON_OPTIONS = [
  'ti-circle', 'ti-circle-dashed', 'ti-ring', 'ti-diamond',
  'ti-link', 'ti-star', 'ti-heart', 'ti-crown',
  'ti-layout-grid', 'ti-marquee-2', 'ti-hexagon', 'ti-triangle',
]

function CategoryModal({ cat, onClose, onSave, saving }: {
  cat: Partial<Category> | null
  onClose: () => void
  onSave: (c: Partial<Category>) => Promise<void>
  saving: boolean
}) {
  const [form, setForm] = useState<Partial<Category>>(cat ?? { icon: 'ti-diamond', sku_prefix: '' })
  const [err, setErr]   = useState<string | null>(null)
  const set = (k: keyof Category, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name?.trim())       return setErr('Name is required')
    if (!form.sku_prefix?.trim()) return setErr('SKU prefix is required')
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
          {cat?.id ? 'Edit Category' : 'Add Category'}
        </h2>
        {[
          { label: 'Category Name *', key: 'name',       type: 'text',   placeholder: 'e.g. Bangles' },
          { label: 'SKU Prefix *',    key: 'sku_prefix', type: 'text',   placeholder: 'e.g. BNG' },
          { label: 'Sort Order',      key: 'sort_order', type: 'number', placeholder: '0' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', display: 'block', marginBottom: '5px' }}>
              {f.label}
            </label>
            <input
              type={f.type}
              placeholder={f.placeholder}
              value={(form as Record<string, string | number>)[f.key] ?? ''}
              onChange={e => set(f.key as keyof Category, f.type === 'number' ? Number(e.target.value) : e.target.value.toUpperCase())}
              style={{
                width: '100%', padding: '8px 12px', background: 'var(--surface2)',
                border: '0.5px solid var(--border)', borderRadius: '8px',
                color: 'var(--text)', fontSize: '13px', outline: 'none',
              }}
            />
          </div>
        ))}

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
            Icon
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {ICON_OPTIONS.map(icon => (
              <button key={icon} onClick={() => set('icon', icon)} style={{
                width: '36px', height: '36px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', border: '0.5px solid',
                borderColor: form.icon === icon ? 'var(--gold)' : 'var(--border)',
                background: form.icon === icon ? 'rgba(201,168,76,0.12)' : 'var(--surface2)',
                color: form.icon === icon ? 'var(--gold)' : 'var(--text-muted)',
                fontSize: '16px',
              }}>
                <i className={icon} />
              </button>
            ))}
          </div>
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
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CategoriesTab() {
  const { categories, loading, error, refetch, add, update, remove } = useCategories()
  const [modal, setModal]   = useState<Partial<Category> | null | false>(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async (form: Partial<Category>) => {
    setSaving(true)
    try {
      if (form.id) await update(form.id, form)
      else await add({
        name:       form.name!,
        sku_prefix: form.sku_prefix!,
        icon:       form.icon ?? 'ti-diamond',
        sort_order: form.sort_order ?? 0,
        parent_id:  null,
      })
      setModal(false)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return
    try { await remove(id) }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed to delete') }
  }

  if (loading) return <LoadingSpinner text="Loading categories..." />
  if (error)   return <ErrorMessage message={error} onRetry={refetch} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {categories.length} categories
        </div>
        <button onClick={() => setModal({})} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 16px', background: 'rgba(201,168,76,0.12)',
          border: '0.5px solid var(--gold)', borderRadius: '8px',
          color: 'var(--gold)', fontSize: '13px', cursor: 'pointer', fontWeight: 500,
        }}>
          <Plus size={14} /> Add Category
        </button>
      </div>

      {categories.length === 0 && <EmptyState message="No categories yet." />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
        {categories.map(cat => (
          <div key={cat.id} style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: '10px', padding: '16px 18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px',
                background: 'rgba(201,168,76,0.1)', border: '0.5px solid var(--border-bright)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', color: 'var(--gold)', flexShrink: 0,
              }}>
                <i className={cat.icon} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>{cat.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--gold)', marginTop: '1px' }}>{cat.sku_prefix}-XX-000</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
              <button onClick={() => setModal(cat)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                <Edit2 size={13} />
              </button>
              <button onClick={() => handleDelete(cat.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '4px' }}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal !== false && (
        <CategoryModal cat={modal} onClose={() => setModal(false)} onSave={handleSave} saving={saving} />
      )}
    </div>
  )
}