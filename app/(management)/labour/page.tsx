'use client'

import { useState } from 'react'
import { Plus, Search, Clock, CheckCircle, AlertCircle, PauseCircle } from 'lucide-react'
import { useLabour } from '@/hooks/useLabour'
import { LoadingSpinner, ErrorMessage, EmptyState } from '@/app/components/ui/LoadingSpinner'
import type { LabourTask, WorkflowStage } from '@/lib/types'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  assigned:    { label: 'Assigned',    color: '#7eb8f7', bg: 'rgba(74,130,200,0.12)',  icon: <Clock size={11} /> },
  in_progress: { label: 'In Progress', color: '#E8C97A', bg: 'rgba(201,168,76,0.12)', icon: <AlertCircle size={11} /> },
  completed:   { label: 'Completed',   color: '#4ade80', bg: 'rgba(39,174,96,0.12)',  icon: <CheckCircle size={11} /> },
  on_hold:     { label: 'On Hold',     color: '#f87171', bg: 'rgba(192,57,43,0.12)',  icon: <PauseCircle size={11} /> },
}

const STAGE_LABELS: Record<string, string> = {
  design: 'Design', casting: 'Casting', filing: 'Filing',
  setting: 'Stone Setting', polishing: 'Polishing',
  quality_check: 'Quality Check', packaging: 'Packaging',
}

const STAGE_OPTIONS: WorkflowStage[] = ['design', 'casting', 'filing', 'setting', 'polishing', 'quality_check', 'packaging']

function AssignTaskModal({ onClose, onSave, saving }: {
  onClose: () => void
  onSave: (t: Partial<LabourTask>) => Promise<void>
  saving: boolean
}) {
  const [form, setForm] = useState({
    order_id: '', employee_id: '',
    stage: 'design' as WorkflowStage,
    status: 'assigned' as LabourTask['status'],
    description: '', estimated_hours: '', labour_cost: '',
  })
  const [err, setErr] = useState<string | null>(null)

  const handleSave = async () => {
    if (!form.order_id.trim())    return setErr('Order ID is required')
    if (!form.employee_id.trim()) return setErr('Employee ID is required')
    if (!form.description.trim()) return setErr('Description is required')
    setErr(null)
    await onSave({
      order_id:        form.order_id,
      employee_id:     form.employee_id,
      stage:           form.stage,
      status:          form.status,
      description:     form.description,
      estimated_hours: Number(form.estimated_hours) || 0,
      actual_hours:    null,
      labour_cost:     Number(form.labour_cost) || 0,
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
        borderRadius: '12px', padding: '28px', width: '420px',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--gold)', marginBottom: '20px' }}>
          Assign Task
        </h2>
        {[
          { label: 'Order ID *',     key: 'order_id',     type: 'text',   placeholder: 'Paste order UUID' },
          { label: 'Employee ID *',  key: 'employee_id',  type: 'text',   placeholder: 'Paste employee UUID' },
          { label: 'Description *',  key: 'description',  type: 'text',   placeholder: 'What needs to be done' },
          { label: 'Est. Hours',     key: 'estimated_hours', type: 'number', placeholder: '0' },
          { label: 'Labour Cost (PKR)', key: 'labour_cost', type: 'number', placeholder: '0' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>{f.label}</label>
            <input
              type={f.type}
              placeholder={f.placeholder}
              value={(form as Record<string, string>)[f.key]}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              style={inputStyle}
            />
          </div>
        ))}
        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>Stage</label>
          <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value as WorkflowStage }))}
            style={{ ...inputStyle, cursor: 'pointer' }}>
            {STAGE_OPTIONS.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
          </select>
        </div>
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
            {saving ? 'Assigning...' : 'Assign Task'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LabourPage() {
  const { tasks, loading, error, refetch, add, update } = useLabour()
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('all')
  const [modal, setModal]     = useState(false)
  const [saving, setSaving]   = useState(false)

  const filtered = tasks.filter(t => {
    const matchSearch =
      (t.employee as { name?: string })?.name?.toLowerCase().includes(search.toLowerCase()) ||
      (t.order as { order_number?: string })?.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || t.status === filter
    return matchSearch && matchFilter
  })

  const handleAdd = async (form: Partial<LabourTask>) => {
    setSaving(true)
    try {
      await add(form as Omit<LabourTask, 'id' | 'assigned_at' | 'completed_at'>)
      setModal(false)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to assign task')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await update(id, { status: status as LabourTask['status'] })
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to update status')
    }
  }

  const totalCost      = tasks.reduce((s, t) => s + Number(t.labour_cost), 0)
  const completedCount = tasks.filter(t => t.status === 'completed').length
  const inProgress     = tasks.filter(t => t.status === 'in_progress').length

  if (loading) return <LoadingSpinner text="Loading tasks..." />
  if (error)   return <ErrorMessage message={error} onRetry={refetch} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[
          { label: 'Total Tasks',  value: String(tasks.length),         color: 'var(--gold)' },
          { label: 'In Progress',  value: String(inProgress),           color: 'var(--warning)' },
          { label: 'Completed',    value: String(completedCount),       color: 'var(--success)' },
          { label: 'Labour Cost',  value: `₨ ${totalCost.toLocaleString()}`, color: '#b89ee8' },
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
            placeholder="Search tasks, employees, orders..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '13px', flex: 1 }}
          />
        </div>
        {['all', 'assigned', 'in_progress', 'completed', 'on_hold'].map(s => (
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
        <button onClick={() => setModal(true)} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 16px', background: 'rgba(201,168,76,0.12)',
          border: '0.5px solid var(--gold)', borderRadius: '8px',
          color: 'var(--gold)', fontSize: '13px', cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap',
        }}>
          <Plus size={14} /> Assign Task
        </button>
      </div>

      {filtered.length === 0 && (
        <EmptyState message={search ? 'No tasks match your search.' : 'No tasks yet. Assign your first task!'} />
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
                {['Order', 'Employee', 'Stage', 'Description', 'Est. Hrs', 'Cost', 'Status', 'Update'].map(h => (
                  <th key={h} style={{
                    padding: '12px 14px', textAlign: 'left',
                    fontSize: '11px', color: 'var(--text-muted)',
                    letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((task, i) => {
                const st  = STATUS_CONFIG[task.status]
                const emp = task.employee as { name?: string } | null
                const ord = task.order   as { order_number?: string } | null
                return (
                  <tr key={task.id} style={{
                    borderBottom: i < filtered.length - 1 ? '0.5px solid var(--border)' : 'none',
                  }}>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--gold)', fontWeight: 500 }}>
                      {ord?.order_number ?? task.order_id.slice(0, 8)}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text)' }}>
                      {emp?.name ?? task.employee_id.slice(0, 8)}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        fontSize: '11px', padding: '2px 8px', borderRadius: '99px',
                        background: 'var(--surface2)', border: '0.5px solid var(--border)',
                        color: 'var(--text-muted)',
                      }}>
                        {STAGE_LABELS[task.stage] ?? task.stage}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-muted)', maxWidth: '200px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {task.description}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                      {task.estimated_hours}h
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text)' }}>
                      ₨ {Number(task.labour_cost).toLocaleString()}
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
                      <select
                        value={task.status}
                        onChange={e => handleStatusUpdate(task.id, e.target.value)}
                        style={{
                          background: 'var(--surface2)', border: '0.5px solid var(--border)',
                          borderRadius: '6px', color: 'var(--text-muted)', fontSize: '11px',
                          padding: '4px 6px', cursor: 'pointer', outline: 'none',
                        }}
                      >
                        {Object.keys(STATUS_CONFIG).map(s => (
                          <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <AssignTaskModal onClose={() => setModal(false)} onSave={handleAdd} saving={saving} />
      )}
    </div>
  )
}