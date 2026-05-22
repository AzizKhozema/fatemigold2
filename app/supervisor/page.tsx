'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase_client'
import { useAuth } from '@/lib/AuthContext'
import { RefreshCw, Clock, CheckCircle, AlertCircle, Circle } from 'lucide-react'
import { LoadingSpinner, ErrorMessage } from '@/app/components/ui/LoadingSpinner'

type WorkerStatus = {
  employee_id: string
  name: string
  role: string
  current_task: {
    id: string
    process_name: string
    item_name: string
    weight_grams: number
    karat: string
    status: string
    started_at: string | null
  } | null
  tasks_today: number
  tasks_done_today: number
  last_active: string | null
}

type ProductionOrder = {
  id: string
  item_name: string
  karat: string
  weight_grams: number
  status: string
  priority: string
  expected_completion: string | null
  current_stage: string | null
  current_worker: string | null
  created_at: string
}

const PRIORITY_CONFIG = {
  low:    { color: '#4ade80', bg: 'rgba(39,174,96,0.12)',    label: 'Low' },
  normal: { color: '#7eb8f7', bg: 'rgba(74,130,200,0.12)',   label: 'Normal' },
  high:   { color: '#E8C97A', bg: 'rgba(201,168,76,0.12)',   label: 'High' },
  urgent: { color: '#f87171', bg: 'rgba(192,57,43,0.12)',    label: 'Urgent' },
}

const STATUS_CONFIG = {
  pending:       { color: '#8A7D65', bg: 'rgba(130,100,50,0.12)',  label: 'Pending' },
  in_progress:   { color: '#E8C97A', bg: 'rgba(201,168,76,0.12)', label: 'In Progress' },
  quality_check: { color: '#fb923c', bg: 'rgba(230,126,34,0.12)', label: 'Quality Check' },
  completed:     { color: '#4ade80', bg: 'rgba(39,174,96,0.12)',  label: 'Completed' },
  delivered:     { color: '#C9A84C', bg: 'rgba(201,168,76,0.1)',  label: 'Delivered' },
  cancelled:     { color: '#f87171', bg: 'rgba(192,57,43,0.12)',  label: 'Cancelled' },
}

function getWorkerIndicator(worker: WorkerStatus) {
  if (!worker.current_task) return { color: '#4A4236', label: 'Not working' }
  if (worker.current_task.status === 'in_progress') return { color: '#4ade80', label: 'Active' }
  if (worker.current_task.status === 'done') return { color: '#E8C97A', label: 'Waiting collection' }
  return { color: '#7eb8f7', label: 'Assigned' }
}

export default function SupervisorWorkshopPage() {
  const { user }  = useAuth()
  const [workers, setWorkers]   = useState<WorkerStatus[]>([])
  const [orders, setOrders]     = useState<ProductionOrder[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const loadData = useCallback(async () => {
    setError(null)
    try {
      const [{ data: empData }, { data: taskData }, { data: orderData }] = await Promise.all([
        supabase
          .from('employees')
          .select('id, name, role')
          .eq('role', 'worker')
          .is('deleted_at', null),
        supabase
          .from('production_tasks')
          .select(`
            id, process_name, status, started_at, assigned_to,
            production_order:production_orders(
              id, item_name, karat, weight_grams
            )
          `)
          .in('status', ['assigned', 'in_progress', 'done'])
          .is('deleted_at', null),
        supabase
          .from('production_orders')
          .select(`
            id, item_name, karat, weight_grams, status,
            priority, expected_completion, created_at,
            tasks:production_tasks(
              id, process_name, status, assigned_to,
              employee:employees(name)
            )
          `)
          .not('status', 'in', '("delivered","cancelled")')
          .is('deleted_at', null)
          .order('created_at', { ascending: false }),
      ])

      const workerStatuses: WorkerStatus[] = (empData ?? []).map(emp => {
        const empTasks = (taskData ?? []).filter(t => t.assigned_to === emp.id)
        const activeTask = empTasks.find(t => t.status === 'in_progress' || t.status === 'done' || t.status === 'assigned')
        const po = activeTask?.production_order as { item_name?: string; karat?: string; weight_grams?: number } | null

        return {
          employee_id:      emp.id,
          name:             emp.name,
          role:             emp.role,
          current_task:     activeTask ? {
            id:           activeTask.id,
            process_name: activeTask.process_name,
            item_name:    po?.item_name ?? '—',
            weight_grams: po?.weight_grams ?? 0,
            karat:        po?.karat ?? '—',
            status:       activeTask.status,
            started_at:   activeTask.started_at,
          } : null,
          tasks_today:      empTasks.length,
          tasks_done_today: empTasks.filter(t => t.status === 'done' || t.status === 'collected').length,
          last_active:      activeTask?.started_at ?? null,
        }
      })

      const ordersWithStage: ProductionOrder[] = (orderData ?? []).map((o) => {
        const activeTasks = (o.tasks ?? []).filter(t => t.status === 'in_progress')
        const currentTask = activeTasks[0]
        return {
          id:                  o.id,
          item_name:           o.item_name,
          karat:               o.karat,
          weight_grams:        o.weight_grams,
          status:              o.status,
          priority:            o.priority,
          expected_completion: o.expected_completion,
          created_at:          o.created_at,
          current_stage:       currentTask?.process_name ?? null,
          current_worker:      (currentTask?.employee as { name?: string } | null)?.name ?? null,
        }
      })

      setWorkers(workerStatuses)
      setOrders(ordersWithStage)
      setLastRefresh(new Date())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [loadData])

  // Realtime
  useEffect(() => {
    const sub = supabase
      .channel('workshop-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_tasks' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_orders' }, loadData)
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [loadData])

  const activeWorkers = workers.filter(w => w.current_task?.status === 'in_progress').length
  const waitingCollection = workers.filter(w => w.current_task?.status === 'done').length
  const urgentOrders = orders.filter(o => o.priority === 'urgent').length

  if (loading) return <LoadingSpinner text="Loading workshop..." />
  if (error)   return <ErrorMessage message={error} onRetry={loadData} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--text)' }}>
            Workshop
          </h1>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Live — refreshes every 30s · Last updated {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
        <button onClick={loadData} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 14px', background: 'var(--surface)',
          border: '0.5px solid var(--border)', borderRadius: '8px',
          color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer',
        }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'Total Workers',       value: String(workers.length),    color: 'var(--gold)' },
          { label: 'Active Now',          value: String(activeWorkers),     color: 'var(--success)' },
          { label: 'Waiting Collection',  value: String(waitingCollection), color: 'var(--warning)' },
          { label: 'Urgent Orders',       value: String(urgentOrders),      color: 'var(--danger)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: '10px', padding: '16px 18px',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
              {s.label}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Worker Feed */}
      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border)',
        borderRadius: '10px', overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>
            Workers — Live Status
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {workers.length} workers
          </span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
              {['Worker', 'Status', 'Current Task', 'Item', 'Weight', 'Process', 'Tasks Today'].map(h => (
                <th key={h} style={{
                  padding: '11px 16px', textAlign: 'left',
                  fontSize: '11px', color: 'var(--text-muted)',
                  letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {workers.map((worker, i) => {
              const indicator = getWorkerIndicator(worker)
              return (
                <tr key={worker.employee_id} style={{
                  borderBottom: i < workers.length - 1 ? '0.5px solid var(--border)' : 'none',
                }}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: 'rgba(201,168,76,0.15)', color: 'var(--gold)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 500, flexShrink: 0,
                      }}>
                        {worker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>
                        {worker.name}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: indicator.color, flexShrink: 0,
                      }} />
                      <span style={{ fontSize: '12px', color: indicator.color }}>
                        {indicator.label}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {worker.current_task ? (
                      <span style={{
                        fontSize: '10px', padding: '2px 8px', borderRadius: '99px',
                        background: worker.current_task.status === 'done'
                          ? 'rgba(201,168,76,0.12)' : 'rgba(39,174,96,0.12)',
                        color: worker.current_task.status === 'done'
                          ? 'var(--gold)' : '#4ade80',
                      }}>
                        {worker.current_task.status === 'done' ? 'Waiting Collection' : 'In Progress'}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--text)' }}>
                    {worker.current_task?.item_name ?? '—'}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {worker.current_task ? `${worker.current_task.weight_grams}g · ${worker.current_task.karat}` : '—'}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {worker.current_task?.process_name ?? '—'}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text)' }}>
                        {worker.tasks_done_today}/{worker.tasks_today}
                      </div>
                      <div style={{
                        flex: 1, background: 'var(--surface2)',
                        borderRadius: '99px', height: '4px', width: '50px',
                      }}>
                        <div style={{
                          width: worker.tasks_today > 0
                            ? `${(worker.tasks_done_today / worker.tasks_today) * 100}%` : '0%',
                          height: '4px', borderRadius: '99px', background: 'var(--gold)',
                        }} />
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
            {workers.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '30px', textAlign: 'center', fontSize: '13px', color: 'var(--text-dim)' }}>
                  No workers found. Add workers in the Employees section.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Production Orders */}
      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border)',
        borderRadius: '10px', overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--border)' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>
            Active Production Orders
          </span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
              {['Item', 'Karat', 'Weight', 'Status', 'Priority', 'Current Stage', 'Worker', 'Due'].map(h => (
                <th key={h} style={{
                  padding: '11px 16px', textAlign: 'left',
                  fontSize: '11px', color: 'var(--text-muted)',
                  letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order, i) => {
              const st  = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
              const pri = PRIORITY_CONFIG[order.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.normal
              const isOverdue = order.expected_completion &&
                new Date(order.expected_completion) < new Date()
              return (
                <tr key={order.id} style={{
                  borderBottom: i < orders.length - 1 ? '0.5px solid var(--border)' : 'none',
                  background: isOverdue ? 'rgba(192,57,43,0.04)' : 'transparent',
                }}>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>
                    {order.item_name}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {order.karat}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {order.weight_grams}g
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: '10px', padding: '2px 8px', borderRadius: '99px',
                      color: st.color, background: st.bg, fontWeight: 500,
                    }}>
                      {st.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: '10px', padding: '2px 8px', borderRadius: '99px',
                      color: pri.color, background: pri.bg, fontWeight: 500,
                    }}>
                      {pri.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {order.current_stage ?? '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {order.current_worker ?? '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: isOverdue ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {order.expected_completion?.slice(0, 10) ?? '—'}
                    {isOverdue && ' ⚠'}
                  </td>
                </tr>
              )
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '30px', textAlign: 'center', fontSize: '13px', color: 'var(--text-dim)' }}>
                  No active production orders
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}