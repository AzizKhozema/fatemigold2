'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { useProcessTemplates } from '@/hooks/useProcessTemplates'
import type { ProcessTemplate } from '@/hooks/useProcessTemplates'
import { LoadingSpinner, ErrorMessage, EmptyState } from '@/app/components/ui/LoadingSpinner'

const UNIT_LABELS: Record<string, string> = {
  per_piece: 'Per Piece',
  per_gram:  'Per Gram',
  per_stone: 'Per Stone',
  per_hour:  'Per Hour',
}

function ProcessModal({ template, onClose, onSave, saving }: {
  template: Partial<ProcessTemplate> | null
  onClose: () => void
  onSave: (t: Partial<ProcessTemplate>) => Promise<void>
  saving: boolean
}) {
  const [form, setForm] = useState<Partial<ProcessTemplate>>(template ?? { unit: 'per_piece', base_wage: 0 })
  const [err, setErr]   = useState<string | null>(null)

  const handleSave = async () => {
    if (!form.name?.trim()) return setErr('Process name is required')
    if (!form.base_wage && form.base_wage !== 0) return setErr('Base wage is required')
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
          {template?.id ? 'Edit Process' : 'New Process'}
        </h2>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', display: 'block', marginBottom: '5px' }}>
            Process Name *
          </label>
          <input
            value={form.name ?? ''}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Stone Setting"
            style={{
              width: '100%', padding: '8px 12px', background: 'var(--surface2)',
              border: '0.5px solid var(--border)', borderRadius: '8px',
              color: 'var(--text)', fontSize: '13px', outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', display: 'block', marginBottom: '5px' }}>
            Billing Unit
          </label>
          <select
            value={form.unit ?? 'per_piece'}
            onChange={e => setForm(f => ({ ...f, unit: e.target.value as ProcessTemplate['unit'] }))}
            style={{
              width: '100%', padding: '8px 12px', background: 'var(--surface2)',
              border: '0.5px solid var(--border)', borderRadius: '8px',
              color: 'var(--text)', fontSize: '13px', outline: 'none', cursor: 'pointer',
            }}
          >
            {Object.entries(UNIT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', display: 'block', marginBottom: '5px' }}>
            Base Wage (PKR) *
          </label>
          <input
            type="number"
            value={form.base_wage ?? 0}
            onChange={e => setForm(f => ({ ...f, base_wage: Number(e.target.value) }))}
            style={{
              width: '100%', padding: '8px 12px', background: 'var(--surface2)',
              border: '0.5px solid var(--border)', borderRadius: '8px',
              color: 'var(--text)', fontSize: '13px', outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', display: 'block', marginBottom: '5px' }}>
            Description
          </label>
          <textarea
            value={form.description ?? ''}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            placeholder="Optional notes about this process"
            style={{
              width: '100%', padding: '8px 12px', background: 'var(--surface2)',
              border: '0.5px solid var(--border)', borderRadius: '8px',
              color: 'var(--text)', fontSize: '13px', outline: 'none',
              resize: 'none', fontFamily: 'inherit',
            }}
          />
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

export default function ProcessesTab() {
  const { templates, loading, error, refetch, add, update, remove } = useProcessTemplates()
  const [modal, setModal]   = useState<Partial<ProcessTemplate> | null | false>(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async (form: Partial<ProcessTemplate>) => {
    setSaving(true)
    try {
      if (form.id) await update(form.id, form)
      else await add({
        name:        form.name!,
        unit:        form.unit ?? 'per_piece',
        base_wage:   form.base_wage ?? 0,
        description: form.description ?? null,
      })
      setModal(false)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this process template?')) return
    try { await remove(id) }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed to delete') }
  }

  if (loading) return <LoadingSpinner text="Loading processes..." />
  if (error)   return <ErrorMessage message={error} onRetry={refetch} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {templates.length} process templates
        </div>
        <button onClick={() => setModal({})} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 16px', background: 'rgba(201,168,76,0.12)',
          border: '0.5px solid var(--gold)', borderRadius: '8px',
          color: 'var(--gold)', fontSize: '13px', cursor: 'pointer', fontWeight: 500,
        }}>
          <Plus size={14} /> New Process
        </button>
      </div>

      {templates.length === 0 && <EmptyState message="No process templates yet." />}

      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border)',
        borderRadius: '10px', overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
              {['Process', 'Unit', 'Base Wage', 'Description', ''].map(h => (
                <th key={h} style={{
                  padding: '11px 16px', textAlign: 'left', fontSize: '11px',
                  color: 'var(--text-muted)', letterSpacing: '0.08em',
                  textTransform: 'uppercase', fontWeight: 500,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {templates.map((t, i) => (
              <tr key={t.id} style={{
                borderBottom: i < templates.length - 1 ? '0.5px solid var(--border)' : 'none',
              }}>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>
                  {t.name}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    fontSize: '11px', padding: '2px 8px', borderRadius: '99px',
                    background: 'rgba(201,168,76,0.1)', color: 'var(--gold)',
                    border: '0.5px solid var(--border-bright)',
                  }}>
                    {UNIT_LABELS[t.unit] ?? t.unit}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--success)', fontWeight: 500 }}>
                  ₨ {Number(t.base_wage).toLocaleString()}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {t.description ?? '—'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setModal(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '4px' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal !== false && (
        <ProcessModal template={modal} onClose={() => setModal(false)} onSave={handleSave} saving={saving} />
      )}
    </div>
  )
}