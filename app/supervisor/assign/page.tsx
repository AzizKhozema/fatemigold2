'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase_client'
import { useAuth } from '@/lib/AuthContext'
import { Plus, Search, ChevronDown } from 'lucide-react'
import { LoadingSpinner, ErrorMessage } from '@/app/components/ui/LoadingSpinner'

type Worker = { id: string; name: string; role: string; skills: string[] }
type ProdOrder = { id: string; item_name: string; karat: string; weight_grams: number; status: string }
type ProcTemplate = { id: string; name: string; unit: string; base_wage: number }

type AssignForm = {
  production_order_id: string
  assigned_to: string
  process_name: string
  process_template_id: string
  stage_order: string
  wage_type: 'per_gram' | 'fixed' | 'after_work'
  wage_rate: string
  fixed_wage: string
  notes: string
}

const WAGE_TYPE_CONFIG = {
  per_gram:   { label: 'Per Gram', desc: 'Wage × weight of piece' },
  fixed:      { label: 'Fixed',    desc: 'Flat rate per piece' },
  after_work: { label: 'After Work', desc: 'Supervisor decides at collection' },
}

export default function SupervisorAssignPage() {
  const { user } = useAuth()
  const [workers, setWorkers]     = useState<Worker[]>([])
  const [orders, setOrders]       = useState<ProdOrder[]>([])
  const [templates, setTemplates] = useState<ProcTemplate[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)
  const [success, setSuccess]     = useState(false)
  const [searchOrder, setSearchOrder] = useState('')
  const [searchWorker, setSearchWorker] = useState('')

  const [form, setForm] = useState<AssignForm>({
    production_order_id: '',
    assigned_to:         '',
    process_name:        '',
    process_template_id: '',
    stage_order:         '1',
    wage_type:           'fixed',
    wage_rate:           '',
    fixed_wage:          '',
    notes:               '',
  })

  const setF = (k: keyof AssignForm, v: string) =>
    setForm(f => ({ ...f, [k]: v }))

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [{ data: w }, { data: o }, { data: t }] = await Promise.all([
        supabase.from('employees').select('id, name, role, skills').eq('role', 'worker').is('deleted_at', null),
        supabase.from('production_orders').select('id, item_name, karat, weight_grams, status')
          .not('status', 'in', '("delivered","cancelled")').is('deleted_at', null),
        supabase.from('process_templates').select('id, name, unit, base_wage').is('deleted_at', null),
      ])
      setWorkers(w ?? [])
      setOrders(o ?? [])
      setTemplates(t ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const selectedOrder  = orders.find(o => o.id === form.production_order_id)
  const selectedWorker = workers.find(w => w.id === form.assigned_to)

  const calcEstimatedWage = () => {
    if (form.wage_type === 'per_gram' && form.wage_rate && selectedOrder) {
      return Number(form.wage_rate) * selectedOrder.weight_grams
    }
    if (form.wage_type === 'fixed' && form.fixed_wage) {
      return Number(form.fixed_wage)
    }
    return null
  }

  const handleTemplateSelect = (templateId: string) => {
    const t = templates.find(t => t.id === templateId)
    if (!t) return
    setForm(f => ({
      ...f,
      process_template_id: templateId,
      process_name:        t.name,
      wage_type:           t.unit === 'per_gram' ? 'per_gram' : 'fixed',
      fixed_wage:          t.unit !== 'per_gram' ? String(t.base_wage) : '',
      wage_rate:           t.unit === 'per_gram' ? String(t.base_wage) : '',
    }))
  }

  const handleAssign = async () => {
    if (!form.production_order_id) return alert('Select a production order')
    if (!form.assigned_to)         return alert('Select a worker')
    if (!form.process_name.trim()) return alert('Enter process name')

    setSaving(true)
    try {
      const supervisorEmployee = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      const { data: task, error: taskError } = await supabase
        .from('production_tasks')
        .insert({
          production_order_id:  form.production_order_id,
          assigned_to:          form.assigned_to,
          assigned_by:          supervisorEmployee.data?.id,
          process_template_id:  form.process_template_id || null,
          process_name:         form.process_name,
          stage_order:          Number(form.stage_order) || 1,
          wage_type:            form.wage_type,
          wage_rate:            form.wage_type === 'per_gram' ? Number(form.wage_rate) : null,
          fixed_wage:           form.wage_type === 'fixed' ? Number(form.fixed_wage) : null,
          status:               'assigned',
        })
        .select()
        .single()

      if (taskError) throw new Error(taskError.message)

      // Update production order status to in_progress
      await supabase
        .from('production_orders')
        .update({ status: 'in_progress' })
        .eq('id', form.production_order_id)
        .eq('status', 'pending')

      // Send notification to worker
      await supabase.from('notifications').insert({
        to_employee_id:   form.assigned_to,
        from_employee_id: supervisorEmployee.data?.id,
        type:             'task_assigned',
        title:            'New Task Assigned',
        body:             `You have been assigned ${form.process_name} for ${selectedOrder?.item_name} (${selectedOrder?.weight_grams}g · ${selectedOrder?.karat})`,
        reference_id:     task.id,
        reference_type:   'production_task',
      })

      setSuccess(true)
      setForm({
        production_order_id: '',
        assigned_to:         '',
        process_name:        '',
        process_template_id: '',
        stage_order:         '1',
        wage_type:           'fixed',
        wage_rate:           '',
        fixed_wage:          '',
        notes:               '',
      })
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to assign task')
    } finally {
      setSaving(false)
    }
  }

  const filteredOrders  = orders.filter(o => o.item_name.toLowerCase().includes(searchOrder.toLowerCase()))
  const filteredWorkers = workers.filter(w => w.name.toLowerCase().includes(searchWorker.toLowerCase()))
  const estimatedWage   = calcEstimatedWage()

  if (loading) return <LoadingSpinner text="Loading..." />
  if (error)   return <ErrorMessage message={error} onRetry={loadData} />

  const inputStyle = {
    width: '100%', padding: '9px 12px', background: 'var(--surface2)',
    border: '0.5px solid var(--border)', borderRadius: '8px',
    color: 'var(--text)', fontSize: '13px', outline: 'none',
  }
  const labelStyle = {
    fontSize: '11px', color: 'var(--text-muted)',
    letterSpacing: '0.08em', display: 'block', marginBottom: '6px',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--text)' }}>
          Assign Task
        </h1>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Assign a production process to a worker
        </div>
      </div>

      {success && (
        <div style={{
          padding: '14px 18px', background: 'rgba(39,174,96,0.12)',
          border: '0.5px solid var(--success)', borderRadius: '10px',
          color: 'var(--success)', fontSize: '13px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          ✓ Task assigned successfully! Worker has been notified.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Left — Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Select Production Order */}
          <div style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: '10px', padding: '18px',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '14px' }}>
              1. Select Production Order
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'var(--surface2)', border: '0.5px solid var(--border)',
              borderRadius: '8px', padding: '8px 12px', marginBottom: '10px',
            }}>
              <Search size={13} style={{ color: 'var(--text-muted)' }} />
              <input
                placeholder="Search orders..."
                value={searchOrder}
                onChange={e => setSearchOrder(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '13px', flex: 1 }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
              {filteredOrders.map(order => (
                <div key={order.id} onClick={() => setF('production_order_id', order.id)} style={{
                  padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                  border: '0.5px solid',
                  borderColor: form.production_order_id === order.id ? 'var(--gold)' : 'var(--border)',
                  background: form.production_order_id === order.id ? 'rgba(201,168,76,0.08)' : 'var(--surface2)',
                  transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{order.item_name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {order.karat} · {order.weight_grams}g · {order.status}
                  </div>
                </div>
              ))}
              {filteredOrders.length === 0 && (
                <div style={{ fontSize: '13px', color: 'var(--text-dim)', textAlign: 'center', padding: '16px' }}>
                  No orders found
                </div>
              )}
            </div>
          </div>

          {/* Select Worker */}
          <div style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: '10px', padding: '18px',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '14px' }}>
              2. Select Worker
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'var(--surface2)', border: '0.5px solid var(--border)',
              borderRadius: '8px', padding: '8px 12px', marginBottom: '10px',
            }}>
              <Search size={13} style={{ color: 'var(--text-muted)' }} />
              <input
                placeholder="Search workers..."
                value={searchWorker}
                onChange={e => setSearchWorker(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '13px', flex: 1 }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
              {filteredWorkers.map(worker => (
                <div key={worker.id} onClick={() => setF('assigned_to', worker.id)} style={{
                  padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                  border: '0.5px solid',
                  borderColor: form.assigned_to === worker.id ? 'var(--gold)' : 'var(--border)',
                  background: form.assigned_to === worker.id ? 'rgba(201,168,76,0.08)' : 'var(--surface2)',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  transition: 'all 0.15s',
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'rgba(201,168,76,0.15)', color: 'var(--gold)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 500, flexShrink: 0,
                  }}>
                    {worker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{worker.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                      {worker.skills?.join(', ') || 'No skills listed'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Process & Wage */}
          <div style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: '10px', padding: '18px',
            display: 'flex', flexDirection: 'column', gap: '14px',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>
              3. Process & Wage
            </div>

            <div>
              <label style={labelStyle}>From Template (optional)</label>
              <select
                value={form.process_template_id}
                onChange={e => handleTemplateSelect(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">Select template or enter manually</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} — ₨{t.base_wage}/{t.unit.replace('per_', '')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Process Name *</label>
              <input
                value={form.process_name}
                onChange={e => setF('process_name', e.target.value)}
                placeholder="e.g. Polishing, Casting..."
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Stage Order</label>
                <input
                  type="number"
                  value={form.stage_order}
                  onChange={e => setF('stage_order', e.target.value)}
                  min="1"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Wage Type</label>
                <select
                  value={form.wage_type}
                  onChange={e => setF('wage_type', e.target.value as AssignForm['wage_type'])}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  {Object.entries(WAGE_TYPE_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {form.wage_type === 'per_gram' && (
              <div>
                <label style={labelStyle}>
                  Rate per gram (PKR)
                  {selectedOrder && ` · Est: ₨${(Number(form.wage_rate) * selectedOrder.weight_grams).toLocaleString()}`}
                </label>
                <input
                  type="number"
                  value={form.wage_rate}
                  onChange={e => setF('wage_rate', e.target.value)}
                  placeholder="e.g. 30"
                  style={inputStyle}
                />
              </div>
            )}

            {form.wage_type === 'fixed' && (
              <div>
                <label style={labelStyle}>Fixed Wage (PKR)</label>
                <input
                  type="number"
                  value={form.fixed_wage}
                  onChange={e => setF('fixed_wage', e.target.value)}
                  placeholder="e.g. 800"
                  style={inputStyle}
                />
              </div>
            )}

            {form.wage_type === 'after_work' && (
              <div style={{
                padding: '10px 14px', background: 'rgba(201,168,76,0.06)',
                border: '0.5px solid var(--border-bright)', borderRadius: '8px',
                fontSize: '12px', color: 'var(--text-muted)',
              }}>
                Wage will be entered by supervisor at collection time and requires admin approval.
              </div>
            )}

            <div>
              <label style={labelStyle}>Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setF('notes', e.target.value)}
                rows={2}
                placeholder="Any instructions for the worker..."
                style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }}
              />
            </div>
          </div>
        </div>

        {/* Right — Summary */}
        <div>
          <div style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: '10px', padding: '20px',
            position: 'sticky', top: '20px',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '20px' }}>
              Assignment Summary
            </div>

            {[
              { label: 'Production Order', value: selectedOrder?.item_name ?? '—' },
              { label: 'Karat',            value: selectedOrder?.karat ?? '—' },
              { label: 'Weight',           value: selectedOrder ? `${selectedOrder.weight_grams}g` : '—' },
              { label: 'Worker',           value: selectedWorker?.name ?? '—' },
              { label: 'Process',          value: form.process_name || '—' },
              { label: 'Stage',            value: form.stage_order || '—' },
              { label: 'Wage Type',        value: WAGE_TYPE_CONFIG[form.wage_type]?.label ?? '—' },
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '8px 0', borderBottom: '0.5px solid var(--border)',
              }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.label}</span>
                <span style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}

            {estimatedWage !== null && (
              <div style={{
                marginTop: '16px', padding: '14px',
                background: 'rgba(201,168,76,0.06)',
                border: '0.5px solid var(--border-bright)',
                borderRadius: '8px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {form.wage_type === 'after_work' ? 'TBD at collection' : 'Estimated Wage'}
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--gold)' }}>
                  ₨ {estimatedWage.toLocaleString()}
                </span>
              </div>
            )}

            <button
              onClick={handleAssign}
              disabled={saving || !form.production_order_id || !form.assigned_to || !form.process_name}
              style={{
                width: '100%', marginTop: '20px',
                padding: '12px', borderRadius: '8px',
                background: saving || !form.production_order_id || !form.assigned_to || !form.process_name
                  ? 'var(--surface2)' : 'rgba(201,168,76,0.15)',
                border: `0.5px solid ${saving || !form.production_order_id || !form.assigned_to || !form.process_name
                  ? 'var(--border)' : 'var(--gold)'}`,
                color: saving || !form.production_order_id || !form.assigned_to || !form.process_name
                  ? 'var(--text-dim)' : 'var(--gold)',
                fontSize: '14px', fontWeight: 500,
                cursor: saving || !form.production_order_id || !form.assigned_to || !form.process_name
                  ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {saving ? (
                <>
                  <div style={{
                    width: '14px', height: '14px', borderRadius: '50%',
                    border: '1.5px solid var(--border)', borderTopColor: 'var(--gold)',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Assigning...
                </>
              ) : (
                <><Plus size={16} /> Assign Task</>
              )}
            </button>

            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center', marginTop: '10px' }}>
              Worker will be notified immediately
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}