'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase_client'
import { useAuth } from '@/lib/AuthContext'
import { CheckCircle, XCircle, Clock, Search, Edit2 } from 'lucide-react'
import { LoadingSpinner, ErrorMessage } from '@/app/components/ui/LoadingSpinner'

type PendingWage = {
  id: string
  process_name: string
  wage_type: string
  actual_wage: number
  calculated_wage: number | null
  fixed_wage: number | null
  wage_status: string
  collected_at: string | null
  notes: string | null
  dispute_reason: string | null
  dispute_detail: string | null
  dispute_status: string | null
  dispute_raised_at: string | null
  production_order: {
    item_name: string
    karat: string
    weight_grams: number
  }
  worker: {
    id: string
    name: string
  }
  entered_by_emp: { name: string } | null
}

const STATUS_CONFIG = {
  supervisor_entered: { label: 'Pending Approval', color: '#E8C97A', bg: 'rgba(201,168,76,0.12)' },
  admin_approved:     { label: 'Approved',          color: '#4ade80', bg: 'rgba(39,174,96,0.12)' },
  admin_rejected:     { label: 'Rejected',          color: '#f87171', bg: 'rgba(192,57,43,0.12)' },
  paid:               { label: 'Paid',              color: '#7eb8f7', bg: 'rgba(74,130,200,0.12)' },
}

const DISPUTE_REASONS: Record<string, { icon: string; label: string }> = {
  more_work:      { icon: '😤', label: 'More work done than recorded' },
  wrong_weight:   { icon: '⚖️', label: 'Wrong weight used for calculation' },
  wrong_process:  { icon: '🔄', label: 'Wrong process recorded' },
  other:          { icon: '❓', label: 'Other reason' },
}

function EditWageModal({ task, onClose, onSave, saving, isAdmin }: {
  task: PendingWage
  onClose: () => void
  onSave: (newWage: number, approveNow: boolean) => Promise<void>
  saving: boolean
  isAdmin: boolean
}) {
  const [wage, setWage]           = useState(String(task.actual_wage))
  const [approveNow, setApproveNow] = useState(false)
  const [err, setErr]             = useState<string | null>(null)

  const handleSave = async () => {
    if (!wage || Number(wage) <= 0) return setErr('Enter a valid wage amount')
    setErr(null)
    await onSave(Number(wage), approveNow)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }}>
      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border-bright)',
        borderRadius: '14px', width: '420px', overflow: 'hidden',
      }}>
        <div style={{
          padding: '20px 24px', borderBottom: '0.5px solid var(--border)',
          background: 'var(--surface2)',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--gold)', marginBottom: '4px' }}>
            Edit Wage
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {task.worker.name} — {task.process_name} — {task.production_order.item_name}
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Current vs calculated */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
            marginBottom: '20px',
          }}>
            {[
              { label: 'Current Wage',    value: `₨ ${Number(task.actual_wage).toLocaleString()}`,    color: 'var(--warning)' },
              { label: 'Calculated Wage', value: task.calculated_wage ? `₨ ${Number(task.calculated_wage).toLocaleString()}` : '—', color: 'var(--text-muted)' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--surface2)', border: '0.5px solid var(--border)',
                borderRadius: '8px', padding: '12px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '16px', color: s.color, fontWeight: 500 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Dispute info if present */}
          {task.dispute_status === 'pending' && (
            <div style={{
              background: 'rgba(192,57,43,0.08)', border: '0.5px solid var(--danger)',
              borderRadius: '10px', padding: '14px', marginBottom: '20px',
            }}>
              <div style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: 500, marginBottom: '6px' }}>
                ⚠ Worker Dispute
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {DISPUTE_REASONS[task.dispute_reason ?? '']?.icon} {DISPUTE_REASONS[task.dispute_reason ?? '']?.label ?? task.dispute_reason}
              </div>
              {task.dispute_detail && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {task.dispute_detail}
                </div>
              )}
            </div>
          )}

          {/* New wage input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              fontSize: '11px', color: 'var(--text-muted)',
              letterSpacing: '0.08em', display: 'block', marginBottom: '8px',
            }}>
              NEW WAGE AMOUNT (PKR)
            </label>
            <input
              type="number"
              value={wage}
              onChange={e => setWage(e.target.value)}
              autoFocus
              style={{
                width: '100%', padding: '12px 14px',
                background: 'var(--surface2)',
                border: '0.5px solid var(--border-bright)',
                borderRadius: '8px', color: 'var(--text)',
                fontSize: '20px', outline: 'none',
                textAlign: 'center',
                fontFamily: 'var(--font-display)',
              }}
            />
          </div>

          {/* Admin-only: approve now toggle */}
          {isAdmin && (
            <div
              onClick={() => setApproveNow(s => !s)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 14px', borderRadius: '8px', cursor: 'pointer',
                background: approveNow ? 'rgba(39,174,96,0.1)' : 'var(--surface2)',
                border: `0.5px solid ${approveNow ? 'var(--success)' : 'var(--border)'}`,
                marginBottom: '16px', transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%',
                background: approveNow ? 'var(--success)' : 'var(--surface)',
                border: `0.5px solid ${approveNow ? 'var(--success)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.15s',
              }}>
                {approveNow && <CheckCircle size={12} style={{ color: '#0D0C0A' }} />}
              </div>
              <div>
                <div style={{ fontSize: '13px', color: approveNow ? 'var(--success)' : 'var(--text)', fontWeight: 500 }}>
                  Approve immediately
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Save and approve in one step
                </div>
              </div>
            </div>
          )}

          {err && (
            <div style={{ fontSize: '12px', color: 'var(--danger)', marginBottom: '12px' }}>{err}</div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} disabled={saving} style={{
              flex: 1, padding: '10px', background: 'var(--surface2)',
              border: '0.5px solid var(--border)', borderRadius: '8px',
              color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer',
            }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} style={{
              flex: 2, padding: '10px',
              background: approveNow ? 'rgba(39,174,96,0.15)' : 'rgba(201,168,76,0.15)',
              border: `0.5px solid ${approveNow ? 'var(--success)' : 'var(--gold)'}`,
              borderRadius: '8px',
              color: approveNow ? 'var(--success)' : 'var(--gold)',
              fontSize: '13px', fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}>
              {saving ? 'Saving...' : approveNow ? '✓ Save & Approve' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RejectModal({ taskId, onClose, onReject, saving }: {
  taskId: string
  onClose: () => void
  onReject: (id: string, note: string) => Promise<void>
  saving: boolean
}) {
  const [note, setNote] = useState('')
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }}>
      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border-bright)',
        borderRadius: '12px', padding: '28px', width: '380px',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--danger)', marginBottom: '8px' }}>
          Return for Review
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Supervisor and worker will be notified.
        </div>
        <label style={{
          fontSize: '11px', color: 'var(--text-muted)',
          letterSpacing: '0.08em', display: 'block', marginBottom: '6px',
        }}>
          REASON *
        </label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          placeholder="e.g. Wage seems too high, please review..."
          autoFocus
          style={{
            width: '100%', padding: '10px 12px',
            background: 'var(--surface2)', border: '0.5px solid var(--border)',
            borderRadius: '8px', color: 'var(--text)',
            fontSize: '13px', outline: 'none',
            resize: 'none', fontFamily: 'inherit', marginBottom: '20px',
          }}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '9px', background: 'var(--surface2)',
            border: '0.5px solid var(--border)', borderRadius: '8px',
            color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer',
          }}>Cancel</button>
          <button
            onClick={() => onReject(taskId, note)}
            disabled={!note.trim() || saving}
            style={{
              flex: 1, padding: '9px',
              background: !note.trim() ? 'var(--surface2)' : 'rgba(192,57,43,0.12)',
              border: `0.5px solid ${!note.trim() ? 'var(--border)' : 'var(--danger)'}`,
              borderRadius: '8px',
              color: !note.trim() ? 'var(--text-dim)' : 'var(--danger)',
              fontSize: '13px', cursor: !note.trim() ? 'not-allowed' : 'pointer', fontWeight: 500,
            }}
          >
            {saving ? 'Sending...' : 'Return'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function WagesPage() {
  const { user }  = useAuth()
  const [tasks, setTasks]             = useState<PendingWage[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [search, setSearch]           = useState('')
  const [filter, setFilter]           = useState('supervisor_entered')
  const [processing, setProcessing]   = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<PendingWage | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [activeDispute, setActiveDispute] = useState<PendingWage | null>(null)

  const loadTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('production_tasks')
        .select(`
          id, process_name, wage_type, actual_wage,
          calculated_wage, fixed_wage, wage_status,
          collected_at, notes,
          dispute_reason, dispute_detail,
          dispute_status, dispute_raised_at,
          production_order:production_orders(
            item_name, karat, weight_grams
          ),
          worker:employees!production_tasks_assigned_to_fkey(
            id, name
          ),
          entered_by_emp:employees!production_tasks_wage_entered_by_fkey(
            name
          )
        `)
        .not('wage_status', 'eq', 'pending')
        .is('deleted_at', null)
        .order('collected_at', { ascending: false })
      if (error) throw new Error(error.message)
      setTasks((data ?? []) as unknown as PendingWage[])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTasks() }, [loadTasks])

  useEffect(() => {
    const sub = supabase
      .channel('wages-admin')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'production_tasks',
      }, loadTasks)
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [loadTasks])

  const getAdminEmpId = async () => {
    const { data } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', user?.id)
      .single()
    return data?.id
  }

  const handleApprove = async (task: PendingWage) => {
    setProcessing(task.id)
    try {
      const adminId = await getAdminEmpId()
      await supabase.from('production_tasks').update({
        wage_status:      'admin_approved',
        wage_approved_by: adminId,
        approved_at:      new Date().toISOString(),
        dispute_status:   task.dispute_status === 'pending' ? 'resolved' : task.dispute_status,
        dispute_resolved_at: task.dispute_status === 'pending' ? new Date().toISOString() : null,
        dispute_resolved_by: task.dispute_status === 'pending' ? adminId : null,
      }).eq('id', task.id)

      await supabase.from('notifications').insert({
        to_employee_id:   task.worker.id,
        from_employee_id: adminId,
        type:             'wage_approved',
        title:            'Wage Approved ✓',
        body:             `Your wage of ₨${Number(task.actual_wage).toLocaleString()} for ${task.process_name} (${task.production_order.item_name}) has been approved.`,
        reference_id:     task.id,
        reference_type:   'production_task',
      })

      await loadTasks()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to approve')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (taskId: string, note: string) => {
    setProcessing(taskId)
    try {
      const task    = tasks.find(t => t.id === taskId)
      const adminId = await getAdminEmpId()

      await supabase.from('production_tasks').update({
        wage_status:         'admin_rejected',
        wage_rejection_note: note,
        wage_approved_by:    adminId,
      }).eq('id', taskId)

      if (task) {
        await supabase.from('notifications').insert([
          {
            to_employee_id:   task.worker.id,
            from_employee_id: adminId,
            type:             'wage_rejected',
            title:            'Wage Needs Review',
            body:             `Wage for ${task.process_name} was returned for review. Note: ${note}`,
            reference_id:     taskId,
            reference_type:   'production_task',
          },
        ])
      }

      setRejectingId(null)
      await loadTasks()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to reject')
    } finally {
      setProcessing(null)
    }
  }

  const handleEditSave = async (newWage: number, approveNow: boolean) => {
    if (!editingTask) return
    setProcessing(editingTask.id)
    try {
      const adminId = await getAdminEmpId()
      const updates: Record<string, unknown> = {
        actual_wage: newWage,
      }
      if (approveNow) {
        updates.wage_status      = 'admin_approved'
        updates.wage_approved_by = adminId
        updates.approved_at      = new Date().toISOString()
        if (editingTask.dispute_status === 'pending') {
          updates.dispute_status      = 'resolved'
          updates.dispute_resolved_at = new Date().toISOString()
          updates.dispute_resolved_by = adminId
          updates.dispute_adjusted_wage = newWage
        }
      }

      await supabase.from('production_tasks').update(updates).eq('id', editingTask.id)

      if (approveNow) {
        await supabase.from('notifications').insert({
          to_employee_id:   editingTask.worker.id,
          from_employee_id: adminId,
          type:             'wage_approved',
          title:            editingTask.dispute_status === 'pending'
            ? 'Dispute Resolved ✓'
            : 'Wage Approved ✓',
          body:             `Your wage has been adjusted to ₨${newWage.toLocaleString()} for ${editingTask.process_name} (${editingTask.production_order.item_name}) and approved.`,
          reference_id:     editingTask.id,
          reference_type:   'production_task',
        })
      } else {
        await supabase.from('notifications').insert({
          to_employee_id:   editingTask.worker.id,
          from_employee_id: adminId,
          type:             'wage_entered',
          title:            'Wage Updated',
          body:             `Your wage for ${editingTask.process_name} has been updated to ₨${newWage.toLocaleString()}. Pending final approval.`,
          reference_id:     editingTask.id,
          reference_type:   'production_task',
        })
      }

      setEditingTask(null)
      await loadTasks()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setProcessing(null)
    }
  }

  const handleResolveDispute = async (task: PendingWage, adjust: boolean, newWage?: number) => {
    setProcessing(task.id)
    try {
      const adminId = await getAdminEmpId()
      const finalWage = adjust && newWage ? newWage : Number(task.actual_wage)

      await supabase.from('production_tasks').update({
        dispute_status:       adjust ? 'resolved' : 'rejected',
        dispute_resolved_at:  new Date().toISOString(),
        dispute_resolved_by:  adminId,
        dispute_adjusted_wage: adjust ? finalWage : null,
        actual_wage:          finalWage,
        wage_status:          'admin_approved',
        wage_approved_by:     adminId,
        approved_at:          new Date().toISOString(),
      }).eq('id', task.id)

      await supabase.from('notifications').insert({
        to_employee_id:   task.worker.id,
        from_employee_id: adminId,
        type:             'dispute_resolved',
        title:            adjust ? 'Dispute Resolved — Wage Adjusted ✓' : 'Dispute Reviewed — Original Wage Confirmed',
        body:             adjust
          ? `Your dispute was accepted. Wage adjusted to ₨${finalWage.toLocaleString()} for ${task.process_name}.`
          : `Your dispute was reviewed. Original wage of ₨${Number(task.actual_wage).toLocaleString()} for ${task.process_name} is confirmed.`,
        reference_id:     task.id,
        reference_type:   'production_task',
      })

      setActiveDispute(null)
      await loadTasks()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to resolve dispute')
    } finally {
      setProcessing(null)
    }
  }

  const filtered = tasks.filter(t => {
    const matchSearch =
      t.worker.name.toLowerCase().includes(search.toLowerCase()) ||
      t.production_order.item_name.toLowerCase().includes(search.toLowerCase()) ||
      t.process_name.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all' ? true :
      filter === 'disputed' ? t.dispute_status === 'pending' :
      t.wage_status === filter
    return matchSearch && matchFilter
  })

  const pendingCount   = tasks.filter(t => t.wage_status === 'supervisor_entered').length
  const approvedCount  = tasks.filter(t => t.wage_status === 'admin_approved').length
  const disputedCount  = tasks.filter(t => t.dispute_status === 'pending').length
  const totalPending   = tasks
    .filter(t => t.wage_status === 'supervisor_entered')
    .reduce((s, t) => s + Number(t.actual_wage), 0)

  if (loading) return <LoadingSpinner text="Loading wages..." />
  if (error)   return <ErrorMessage message={error} onRetry={loadTasks} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[
          { label: 'Pending Approval', value: String(pendingCount),                 color: 'var(--warning)' },
          { label: 'Approved',         value: String(approvedCount),                color: 'var(--success)' },
          { label: 'Disputes',         value: String(disputedCount),                color: 'var(--danger)' },
          { label: 'Pending Amount',   value: `₨ ${totalPending.toLocaleString()}`, color: 'var(--gold)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: '10px', padding: '18px 20px',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              {s.label}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: s.color }}>
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
            placeholder="Search by worker, item, process..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '13px', flex: 1 }}
          />
        </div>
        {[
          { key: 'supervisor_entered', label: 'Pending' },
          { key: 'disputed',           label: `Disputed ${disputedCount > 0 ? `(${disputedCount})` : ''}` },
          { key: 'admin_approved',     label: 'Approved' },
          { key: 'admin_rejected',     label: 'Rejected' },
          { key: 'all',                label: 'All' },
        ].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)} style={{
            padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer',
            border: '0.5px solid',
            borderColor: filter === s.key ? (s.key === 'disputed' ? 'var(--danger)' : 'var(--gold)') : 'var(--border)',
            background: filter === s.key ? (s.key === 'disputed' ? 'rgba(192,57,43,0.1)' : 'rgba(201,168,76,0.12)') : 'var(--surface)',
            color: filter === s.key ? (s.key === 'disputed' ? 'var(--danger)' : 'var(--gold)') : 'var(--text-muted)',
            fontWeight: filter === s.key ? 500 : 400,
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '50px',
          border: '0.5px dashed var(--border)', borderRadius: '10px',
          color: 'var(--text-dim)', fontSize: '13px',
        }}>
          <Clock size={32} style={{ marginBottom: '10px', opacity: 0.3 }} />
          <div>No wages to review</div>
        </div>
      ) : (
        <div style={{
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: '10px', overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                {['Worker', 'Item', 'Process', 'Weight', 'Wage Type', 'Amount', 'Submitted By', 'Status', 'Actions'].map(h => (
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
                const st        = STATUS_CONFIG[task.wage_status as keyof typeof STATUS_CONFIG]
                const disputed  = task.dispute_status === 'pending'
                return (
                  <tr key={task.id} style={{
                    borderBottom: i < filtered.length - 1 ? '0.5px solid var(--border)' : 'none',
                    background: disputed ? 'rgba(192,57,43,0.03)' :
                      task.wage_status === 'supervisor_entered' ? 'rgba(201,168,76,0.02)' : 'transparent',
                  }}>
                    <td style={{ padding: '13px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          background: 'rgba(201,168,76,0.12)', color: 'var(--gold)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', fontWeight: 500, flexShrink: 0,
                        }}>
                          {task.worker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>
                          {task.worker.name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 14px', fontSize: '13px', color: 'var(--text)' }}>
                      {task.production_order.item_name}
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      <span style={{
                        fontSize: '11px', padding: '2px 8px', borderRadius: '99px',
                        background: 'rgba(201,168,76,0.1)', color: 'var(--gold)',
                        border: '0.5px solid var(--border-bright)',
                      }}>
                        {task.process_name}
                      </span>
                    </td>
                    <td style={{ padding: '13px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {task.production_order.weight_grams}g · {task.production_order.karat}
                    </td>
                    <td style={{ padding: '13px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {task.wage_type === 'per_gram' ? 'Per Gram' : task.wage_type === 'fixed' ? 'Fixed' : 'After Work'}
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--gold)' }}>
                        ₨ {Number(task.actual_wage).toLocaleString()}
                      </div>
                      {task.calculated_wage && task.calculated_wage !== task.actual_wage && (
                        <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                          Calc: ₨{Number(task.calculated_wage).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '13px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {task.entered_by_emp?.name ?? '—'}
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {st && (
                          <span style={{
                            fontSize: '10px', padding: '3px 9px', borderRadius: '99px',
                            fontWeight: 500, color: st.color, background: st.bg,
                            display: 'inline-block',
                          }}>
                            {st.label}
                          </span>
                        )}
                        {disputed && (
                          <span style={{
                            fontSize: '10px', padding: '3px 9px', borderRadius: '99px',
                            fontWeight: 500, color: 'var(--danger)',
                            background: 'rgba(192,57,43,0.12)', display: 'inline-block',
                          }}>
                            ⚠ Disputed
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {/* Dispute resolution */}
                        {disputed && (
                          <button
                            onClick={() => setActiveDispute(task)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '3px',
                              padding: '4px 8px',
                              background: 'rgba(192,57,43,0.1)',
                              border: '0.5px solid var(--danger)',
                              borderRadius: '6px', color: 'var(--danger)',
                              fontSize: '11px', cursor: 'pointer',
                            }}
                          >
                            ⚠ Dispute
                          </button>
                        )}

                        {/* Approve */}
                        {task.wage_status === 'supervisor_entered' && !disputed && (
                          <button
                            onClick={() => handleApprove(task)}
                            disabled={processing === task.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '3px',
                              padding: '4px 8px',
                              background: 'rgba(39,174,96,0.12)',
                              border: '0.5px solid var(--success)',
                              borderRadius: '6px', color: 'var(--success)',
                              fontSize: '11px', cursor: 'pointer',
                            }}
                          >
                            <CheckCircle size={11} /> OK
                          </button>
                        )}

                        {/* Edit */}
                        {['supervisor_entered', 'admin_rejected'].includes(task.wage_status) && (
                          <button
                            onClick={() => setEditingTask(task)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '3px',
                              padding: '4px 8px',
                              background: 'rgba(201,168,76,0.1)',
                              border: '0.5px solid var(--border-bright)',
                              borderRadius: '6px', color: 'var(--gold)',
                              fontSize: '11px', cursor: 'pointer',
                            }}
                          >
                            <Edit2 size={11} /> Edit
                          </button>
                        )}

                        {/* Edit on approved (admin only) */}
                        {task.wage_status === 'admin_approved' && (
                          <button
                            onClick={() => setEditingTask(task)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '3px',
                              padding: '4px 8px',
                              background: 'var(--surface2)',
                              border: '0.5px solid var(--border)',
                              borderRadius: '6px', color: 'var(--text-muted)',
                              fontSize: '11px', cursor: 'pointer',
                            }}
                          >
                            <Edit2 size={11} /> Edit
                          </button>
                        )}

                        {/* Reject */}
                        {task.wage_status === 'supervisor_entered' && (
                          <button
                            onClick={() => setRejectingId(task.id)}
                            disabled={processing === task.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '3px',
                              padding: '4px 8px',
                              background: 'rgba(192,57,43,0.1)',
                              border: '0.5px solid var(--danger)',
                              borderRadius: '6px', color: 'var(--danger)',
                              fontSize: '11px', cursor: 'pointer',
                            }}
                          >
                            <XCircle size={11} /> Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingTask && (
        <EditWageModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleEditSave}
          saving={!!processing}
          isAdmin={true}
        />
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <RejectModal
          taskId={rejectingId}
          onClose={() => setRejectingId(null)}
          onReject={handleReject}
          saving={!!processing}
        />
      )}

      {/* Dispute Resolution Modal */}
      {activeDispute && (
        <DisputeModal
          task={activeDispute}
          onClose={() => setActiveDispute(null)}
          onResolve={handleResolveDispute}
          saving={!!processing}
        />
      )}
    </div>
  )
}

function DisputeModal({ task, onClose, onResolve, saving }: {
  task: PendingWage
  onClose: () => void
  onResolve: (task: PendingWage, adjust: boolean, newWage?: number) => Promise<void>
  saving: boolean
}) {
  const [adjustedWage, setAdjustedWage] = useState(String(task.actual_wage))
  const [decision, setDecision]         = useState<'keep' | 'adjust' | null>(null)

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }}>
      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border-bright)',
        borderRadius: '14px', width: '460px', overflow: 'hidden',
      }}>
        <div style={{
          padding: '20px 24px', borderBottom: '0.5px solid var(--border)',
          background: 'rgba(192,57,43,0.06)',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--danger)', marginBottom: '4px' }}>
            ⚠ Resolve Dispute
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {task.worker.name} — {task.process_name} — {task.production_order.item_name}
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Dispute reason */}
          <div style={{
            background: 'var(--surface2)', border: '0.5px solid var(--border)',
            borderRadius: '10px', padding: '14px', marginBottom: '20px',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              Worker&apos;s Complaint
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text)', marginBottom: '6px' }}>
              {DISPUTE_REASONS[task.dispute_reason ?? '']?.icon ?? '❓'}{' '}
              {DISPUTE_REASONS[task.dispute_reason ?? '']?.label ?? task.dispute_reason}
            </div>
            {task.dispute_detail && (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                {task.dispute_detail}
              </div>
            )}
            <div style={{ marginTop: '10px', display: 'flex', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '2px' }}>Current Wage</div>
                <div style={{ fontSize: '16px', color: 'var(--warning)', fontWeight: 500 }}>
                  ₨ {Number(task.actual_wage).toLocaleString()}
                </div>
              </div>
              {task.calculated_wage && (
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '2px' }}>Calculated</div>
                  <div style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: 500 }}>
                    ₨ {Number(task.calculated_wage).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Decision */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Your Decision:
            </div>
            {[
              { key: 'keep',   label: 'Keep original wage', desc: `Confirm ₨${Number(task.actual_wage).toLocaleString()} — dispute rejected`, icon: '✓' },
              { key: 'adjust', label: 'Adjust wage',        desc: 'Change amount and approve',                                                icon: '✏️' },
            ].map(opt => (
              <div
                key={opt.key}
                onClick={() => setDecision(opt.key as 'keep' | 'adjust')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                  border: '0.5px solid',
                  borderColor: decision === opt.key
                    ? (opt.key === 'keep' ? 'var(--success)' : 'var(--gold)')
                    : 'var(--border)',
                  background: decision === opt.key
                    ? (opt.key === 'keep' ? 'rgba(39,174,96,0.08)' : 'rgba(201,168,76,0.08)')
                    : 'var(--surface2)',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: '20px' }}>{opt.icon}</div>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{opt.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{opt.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Adjust wage input */}
          {decision === 'adjust' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                fontSize: '11px', color: 'var(--text-muted)',
                letterSpacing: '0.08em', display: 'block', marginBottom: '8px',
              }}>
                ADJUSTED WAGE (PKR)
              </label>
              <input
                type="number"
                value={adjustedWage}
                onChange={e => setAdjustedWage(e.target.value)}
                autoFocus
                style={{
                  width: '100%', padding: '12px 14px',
                  background: 'var(--surface2)',
                  border: '0.5px solid var(--border-bright)',
                  borderRadius: '8px', color: 'var(--text)',
                  fontSize: '20px', outline: 'none',
                  textAlign: 'center',
                  fontFamily: 'var(--font-display)',
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} style={{
              flex: 1, padding: '10px', background: 'var(--surface2)',
              border: '0.5px solid var(--border)', borderRadius: '8px',
              color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer',
            }}>
              Cancel
            </button>
            <button
              onClick={() => {
                if (!decision) return alert('Select a decision')
                if (decision === 'adjust' && !adjustedWage) return alert('Enter adjusted wage')
                onResolve(task, decision === 'adjust', decision === 'adjust' ? Number(adjustedWage) : undefined)
              }}
              disabled={saving || !decision}
              style={{
                flex: 2, padding: '10px',
                background: !decision ? 'var(--surface2)' :
                  decision === 'keep' ? 'rgba(39,174,96,0.15)' : 'rgba(201,168,76,0.15)',
                border: `0.5px solid ${!decision ? 'var(--border)' :
                  decision === 'keep' ? 'var(--success)' : 'var(--gold)'}`,
                borderRadius: '8px',
                color: !decision ? 'var(--text-dim)' :
                  decision === 'keep' ? 'var(--success)' : 'var(--gold)',
                fontSize: '13px', fontWeight: 500,
                cursor: saving || !decision ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Resolving...' : decision === 'keep' ? '✓ Confirm & Approve' : '✏️ Adjust & Approve'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}