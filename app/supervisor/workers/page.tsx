'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase_client'
import { LoadingSpinner, ErrorMessage } from '@/app/components/ui/LoadingSpinner'

type WorkerDetail = {
  id: string
  name: string
  phone: string
  skills: string[]
  joining_date: string
  is_active: boolean
  total_tasks: number
  completed_tasks: number
  pending_wage: number
  approved_wage: number
}

export default function SupervisorWorkersPage() {
  const [workers, setWorkers]   = useState<WorkerDetail[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const loadWorkers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: emps, error: empError } = await supabase
        .from('employees')
        .select('id, name, phone, skills, joining_date, is_active')
        .eq('role', 'worker')
        .is('deleted_at', null)
        .order('name')

      if (empError) throw new Error(empError.message)

      const workerDetails = await Promise.all((emps ?? []).map(async emp => {
        const [{ data: tasks }, { data: wages }] = await Promise.all([
          supabase
            .from('production_tasks')
            .select('id, status')
            .eq('assigned_to', emp.id),
          supabase
            .from('wage_entries')
            .select('amount, status')
            .eq('employee_id', emp.id),
        ])

        const pendingWage  = (wages ?? []).filter(w => w.status === 'pending').reduce((s, w) => s + Number(w.amount), 0)
        const approvedWage = (wages ?? []).filter(w => w.status === 'approved').reduce((s, w) => s + Number(w.amount), 0)

        return {
          ...emp,
          total_tasks:     (tasks ?? []).length,
          completed_tasks: (tasks ?? []).filter(t => ['collected','approved'].includes(t.status)).length,
          pending_wage:    pendingWage,
          approved_wage:   approvedWage,
        } as WorkerDetail
      }))

      setWorkers(workerDetails)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load workers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadWorkers() }, [loadWorkers])

  if (loading) return <LoadingSpinner text="Loading workers..." />
  if (error)   return <ErrorMessage message={error} onRetry={loadWorkers} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--text)' }}>
          Workers
        </h1>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {workers.length} workers · {workers.filter(w => w.is_active).length} active
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
        {workers.map(worker => {
          const completionRate = worker.total_tasks > 0
            ? Math.round((worker.completed_tasks / worker.total_tasks) * 100) : 0

          return (
            <div key={worker.id} style={{
              background: 'var(--surface)', border: '0.5px solid var(--border)',
              borderRadius: '12px', padding: '18px',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: worker.is_active ? 'rgba(201,168,76,0.15)' : 'var(--surface2)',
                  color: worker.is_active ? 'var(--gold)' : 'var(--text-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 500, flexShrink: 0,
                }}>
                  {worker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>
                    {worker.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                    {worker.phone}
                  </div>
                </div>
                <span style={{
                  fontSize: '10px', padding: '2px 8px', borderRadius: '99px',
                  background: worker.is_active ? 'rgba(39,174,96,0.12)' : 'rgba(130,100,50,0.12)',
                  color: worker.is_active ? '#4ade80' : 'var(--text-dim)',
                }}>
                  {worker.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Skills */}
              {worker.skills?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '14px' }}>
                  {worker.skills.map(skill => (
                    <span key={skill} style={{
                      fontSize: '10px', padding: '2px 8px', borderRadius: '99px',
                      background: 'var(--surface2)', border: '0.5px solid var(--border)',
                      color: 'var(--text-muted)',
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: '8px', marginBottom: '14px',
              }}>
                {[
                  { label: 'Tasks Done',   value: `${worker.completed_tasks}/${worker.total_tasks}`, color: 'var(--text)' },
                  { label: 'Completion',   value: `${completionRate}%`, color: completionRate > 80 ? 'var(--success)' : 'var(--warning)' },
                  { label: 'Pending Wage', value: `₨${worker.pending_wage.toLocaleString()}`, color: 'var(--warning)' },
                  { label: 'Approved',     value: `₨${worker.approved_wage.toLocaleString()}`, color: 'var(--success)' },
                ].map(s => (
                  <div key={s.label} style={{
                    background: 'var(--surface2)', border: '0.5px solid var(--border)',
                    borderRadius: '8px', padding: '10px 12px',
                  }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: '14px', color: s.color, fontWeight: 500 }}>
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Task completion rate</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{completionRate}%</span>
                </div>
                <div style={{ background: 'var(--surface2)', borderRadius: '99px', height: '5px' }}>
                  <div style={{
                    width: `${completionRate}%`, height: '5px', borderRadius: '99px',
                    background: completionRate > 80 ? 'var(--success)' : completionRate > 50 ? 'var(--gold)' : 'var(--warning)',
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>
            </div>
          )
        })}

        {workers.length === 0 && (
          <div style={{
            gridColumn: '1 / -1', textAlign: 'center', padding: '40px',
            border: '0.5px dashed var(--border)', borderRadius: '10px',
            color: 'var(--text-dim)', fontSize: '13px',
          }}>
            No workers found. Add workers with role `worker` in the Employees section.
          </div>
        )}
      </div>
    </div>
  )
}