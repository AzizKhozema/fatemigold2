'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase_client'
import { useAuth } from '@/lib/AuthContext'
import { useLanguage } from '@/lib/useLanguage'
import { useOfflineSync } from '@/lib/useOfflineSync'
import { t, getProcessIcon, getCategoryIcon } from '@/lib/i18n'
import { ArrowLeft, CheckCircle } from 'lucide-react'

type TaskDetail = {
  id: string
  process_name: string
  status: string
  wage_type: string
  wage_rate: number | null
  fixed_wage: number | null
  calculated_wage: number | null
  actual_wage: number | null
  wage_status: string
  notes: string | null
  started_at: string | null
  done_at: string | null
  stage_order: number
  dispute_reason: string | null
  dispute_detail: string | null
  dispute_status: string | null
  dispute_raised_at: string | null
  production_order: {
    id: string
    item_name: string
    karat: string
    weight_grams: number
    notes: string | null
    category: { name: string } | null
    tasks: {
      id: string
      process_name: string
      stage_order: number
      status: string
      worker: { name: string } | null
    }[]
  }
}

const DISPUTE_REASONS = [
  { key: 'more_work',     icon: '😤', en: 'More work done than recorded', ur: 'زیادہ کام کیا' },
  { key: 'wrong_weight',  icon: '⚖️', en: 'Wrong weight used',            ur: 'غلط وزن استعمال ہوا' },
  { key: 'wrong_process', icon: '🔄', en: 'Wrong process recorded',       ur: 'غلط عمل درج ہوا' },
  { key: 'other',         icon: '❓', en: 'Other reason',                  ur: 'دوسری وجہ' },
]

function DisputeSection({ task, lang, isUrdu, employeeId, onDisputed }: {
  task: TaskDetail
  lang: 'en' | 'ur'
  isUrdu: boolean
  employeeId: string
  onDisputed: () => void
}) {
  const [open, setOpen]             = useState(false)
  const [reason, setReason]         = useState<string | null>(null)
  const [detail, setDetail]         = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed]   = useState(false)

  const handleSubmit = async () => {
    if (!reason) return
    setSubmitting(true)
    try {
      await supabase
        .from('production_tasks')
        .update({
          dispute_reason:    reason,
          dispute_detail:    detail || null,
          dispute_status:    'pending',
          dispute_raised_at: new Date().toISOString(),
        })
        .eq('id', task.id)

      const adminEmp = await supabase
        .from('employees')
        .select('id')
        .eq('role', 'admin')
        .single()

      if (adminEmp.data) {
        await supabase.from('notifications').insert({
          to_employee_id:   adminEmp.data.id,
          from_employee_id: employeeId,
          type:             'wage_disputed',
          title:            'Wage Disputed by Worker',
          body:             `${task.process_name} — ${task.production_order.item_name} · ₨${Number(task.actual_wage ?? 0).toLocaleString()}`,
          reference_id:     task.id,
          reference_type:   'production_task',
        })
      }

      setConfirmed(true)
      setTimeout(() => {
        setOpen(false)
        onDisputed()
      }, 2000)
    } catch {
      alert('Failed to submit dispute')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        width: '100%', padding: '14px',
        background: 'rgba(192,57,43,0.08)',
        border: '0.5px solid var(--danger)',
        borderRadius: '14px', color: 'var(--danger)',
        fontSize: '14px', cursor: 'pointer',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: '8px',
      }}>
        ⚠️ {isUrdu ? 'اجرت پر اعتراض' : 'Dispute Wage'}
      </button>
    )
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '0.5px solid var(--danger)',
      borderRadius: '16px', padding: '20px',
    }}>
      {confirmed ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>📨</div>
          <div style={{ fontSize: '16px', color: 'var(--success)', fontWeight: 500 }}>
            {isUrdu ? 'اعتراض جمع ہو گیا!' : 'Dispute submitted!'}
          </div>
        </div>
      ) : (
        <>
          <div style={{
            fontSize: '15px', fontWeight: 600,
            color: 'var(--text)', marginBottom: '16px', textAlign: 'center',
          }}>
            {isUrdu ? 'کیا مسئلہ ہے؟' : 'What is the issue?'}
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '10px', marginBottom: '16px',
          }}>
            {DISPUTE_REASONS.map(r => (
              <button key={r.key} onClick={() => setReason(r.key)} style={{
                padding: '14px 10px', borderRadius: '12px', cursor: 'pointer',
                border: '0.5px solid',
                borderColor: reason === r.key ? 'var(--danger)' : 'var(--border)',
                background: reason === r.key
                  ? 'rgba(192,57,43,0.1)' : 'var(--surface2)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '6px',
                transition: 'all 0.15s',
              }}>
                <div style={{ fontSize: '28px' }}>{r.icon}</div>
                <div style={{
                  fontSize: '11px',
                  color: reason === r.key ? 'var(--danger)' : 'var(--text-muted)',
                  textAlign: 'center', lineHeight: 1.3,
                }}>
                  {isUrdu ? r.ur : r.en}
                </div>
              </button>
            ))}
          </div>

          <textarea
            value={detail}
            onChange={e => setDetail(e.target.value)}
            placeholder={isUrdu ? 'مزید تفصیل (اختیاری)' : 'More details (optional)'}
            rows={2}
            style={{
              width: '100%', padding: '10px 12px',
              background: 'var(--surface2)',
              border: '0.5px solid var(--border)',
              borderRadius: '10px', color: 'var(--text)',
              fontSize: '13px', outline: 'none',
              resize: 'none', fontFamily: 'inherit',
              marginBottom: '14px',
              direction: isUrdu ? 'rtl' : 'ltr',
            }}
          />

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setOpen(false)} style={{
              flex: 1, padding: '14px',
              background: 'var(--surface2)',
              border: '0.5px solid var(--border)',
              borderRadius: '12px', color: 'var(--text-muted)',
              fontSize: '14px', cursor: 'pointer',
            }}>
              {isUrdu ? 'منسوخ' : 'Cancel'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!reason || submitting}
              style={{
                flex: 2, padding: '14px',
                background: !reason ? 'var(--surface2)' : 'rgba(192,57,43,0.15)',
                border: `0.5px solid ${!reason ? 'var(--border)' : 'var(--danger)'}`,
                borderRadius: '12px',
                color: !reason ? 'var(--text-dim)' : 'var(--danger)',
                fontSize: '14px', fontWeight: 600,
                cursor: !reason || submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? '...' : isUrdu ? 'اعتراض جمع کریں' : 'Submit Dispute'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function WorkerTaskPage() {
  const { id }      = useParams<{ id: string }>()
  const router      = useRouter()
  const { user }    = useAuth()
  const { lang, isUrdu } = useLanguage()
  const { isOnline, queueAction } = useOfflineSync()

  const [task, setTask]           = useState<TaskDetail | null>(null)
  const [loading, setLoading]     = useState(true)
  const [confirm, setConfirm]     = useState<'start' | 'done' | null>(null)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess]     = useState<'started' | 'done' | null>(null)

  useEffect(() => {
    if (!id) return
    supabase
      .from('production_tasks')
      .select(`
        id, process_name, status, wage_type,
        wage_rate, fixed_wage, calculated_wage,
        actual_wage, wage_status, notes,
        started_at, done_at, stage_order,
        dispute_reason, dispute_detail,
        dispute_status, dispute_raised_at,
        production_order:production_orders(
          id, item_name, karat, weight_grams, notes,
          category:categories(name),
          tasks:production_tasks(
            id, process_name, stage_order, status,
            worker:employees!production_tasks_assigned_to_fkey(name)
          )
        )
      `)
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setTask(data as unknown as TaskDetail)
        setLoading(false)
      })
  }, [id])

  const handleStart = async () => {
    if (!task) return
    setProcessing(true)
    const now = new Date().toISOString()
    try {
      if (isOnline) {
        await supabase
          .from('production_tasks')
          .update({ status: 'in_progress', started_at: now })
          .eq('id', task.id)
      } else {
        await queueAction('task_start', { task_id: task.id, started_at: now })
      }
      setTask(prev => prev ? { ...prev, status: 'in_progress', started_at: now } : prev)
      setConfirm(null)
      setSuccess('started')
      setTimeout(() => setSuccess(null), 2500)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed')
    } finally {
      setProcessing(false)
    }
  }

  const handleDone = async () => {
    if (!task || !user) return
    setProcessing(true)
    const now = new Date().toISOString()
    try {
      if (isOnline) {
        await supabase
          .from('production_tasks')
          .update({ status: 'done', done_at: now })
          .eq('id', task.id)

        const supervisorEmp = await supabase
          .from('employees')
          .select('id')
          .eq('role', 'supervisor')
          .limit(1)
          .single()

        if (supervisorEmp.data) {
          await supabase.from('notifications').insert({
            to_employee_id:   supervisorEmp.data.id,
            from_employee_id: user.employee_id,
            type:             'task_done',
            title:            'Piece Ready for Collection',
            body:             `${user.name} has completed ${task.process_name} for ${task.production_order.item_name} (${task.production_order.weight_grams}g · ${task.production_order.karat})`,
            reference_id:     task.id,
            reference_type:   'production_task',
          })
        }
      } else {
        await queueAction('task_done', { task_id: task.id, done_at: now })
      }

      setTask(prev => prev ? { ...prev, status: 'done', done_at: now } : prev)
      setConfirm(null)
      setSuccess('done')
      setTimeout(() => {
        setSuccess(null)
        router.push('/worker')
      }, 2500)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)',
      }}>
        <div style={{ fontSize: '32px', animation: 'spin 1s linear infinite' }}>⚙️</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!task) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', gap: '16px',
      }}>
        <div style={{ fontSize: '48px' }}>❌</div>
        <div style={{ fontSize: '16px', color: 'var(--text)' }}>Task not found</div>
        <button onClick={() => router.push('/worker')} style={{
          padding: '10px 20px', background: 'rgba(201,168,76,0.12)',
          border: '0.5px solid var(--gold)', borderRadius: '10px',
          color: 'var(--gold)', fontSize: '14px', cursor: 'pointer',
        }}>
          {t(lang, 'back')}
        </button>
      </div>
    )
  }

  const processIcon = getProcessIcon(task.process_name)
  const catIcon     = getCategoryIcon(
    (task.production_order.category as { name?: string } | null)?.name ?? ''
  )
  const wage =
    task.actual_wage     ? `₨ ${Number(task.actual_wage).toLocaleString()}` :
    task.calculated_wage ? `₨ ${Number(task.calculated_wage).toLocaleString()}` :
    task.fixed_wage      ? `₨ ${Number(task.fixed_wage).toLocaleString()}` : '—'

  const sortedTasks = [...(task.production_order.tasks ?? [])]
    .sort((a, b) => a.stage_order - b.stage_order)

  const nextTask = sortedTasks.find(
    tt => tt.stage_order > task.stage_order && tt.status !== 'cancelled'
  )

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      minHeight: '100vh', background: 'var(--bg)',
    }}>

      {/* Header */}
      <div style={{
        background: 'var(--surface)',
        borderBottom: '0.5px solid var(--border)',
        padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <button onClick={() => router.push('/worker')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', padding: '4px',
          display: 'flex', alignItems: 'center',
        }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '16px', color: 'var(--text)',
        }}>
          {t(lang, 'myTasks')}
        </div>
      </div>

      {/* Success Banner */}
      {success && (
        <div style={{
          background: success === 'done'
            ? 'rgba(39,174,96,0.15)' : 'rgba(201,168,76,0.15)',
          border: `0.5px solid ${success === 'done' ? 'var(--success)' : 'var(--gold)'}`,
          padding: '16px', textAlign: 'center',
          fontSize: '16px', fontWeight: 500,
          color: success === 'done' ? 'var(--success)' : 'var(--gold)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '8px',
        }}>
          <CheckCircle size={20} />
          {success === 'done'
            ? (isUrdu ? 'بہت اچھا! کام مکمل ہو گیا ✨' : 'Great! Task marked done!')
            : (isUrdu ? 'کام شروع ہو گیا! 💪' : 'Work started!')}
        </div>
      )}

      {/* Scrollable content */}
      <div style={{
        flex: 1, padding: '20px',
        display: 'flex', flexDirection: 'column',
        gap: '16px', overflowY: 'auto',
      }}>

        {/* Big process icon */}
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '72px', marginBottom: '12px' }}>{processIcon}</div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '24px', color: 'var(--text)', marginBottom: '4px',
          }}>
            {task.process_name}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {task.status === 'assigned'    && (isUrdu ? 'شروع کرنے کے لیے تیار' : 'Ready to start')}
            {task.status === 'in_progress' && (isUrdu ? 'جاری ہے...' : 'In progress...')}
            {task.status === 'done'        && (isUrdu ? 'مکمل — جمع کرنے کا انتظار' : 'Done — waiting for collection')}
            {task.status === 'collected'   && (isUrdu ? 'جمع ہو گیا' : 'Collected')}
            {task.status === 'approved'    && (isUrdu ? 'منظور شدہ ✓' : 'Approved ✓')}
          </div>
        </div>

        {/* Piece info */}
        <div style={{
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: '16px', padding: '18px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: '10px', marginBottom: '14px',
          }}>
            <span style={{ fontSize: '24px' }}>{catIcon}</span>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px', color: 'var(--text)',
            }}>
              {task.production_order.item_name}
            </div>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
          }}>
            {[
              { label: t(lang, 'karat'),         value: task.production_order.karat,              icon: '⭐' },
              { label: t(lang, 'weight'),        value: `${task.production_order.weight_grams}g`, icon: '⚖️' },
              { label: t(lang, 'estimatedWage'), value: wage,                                     icon: '💰', color: 'var(--gold)' },
              { label: t(lang, 'process'),       value: `Stage ${task.stage_order}`,              icon: '🔢' },
            ].map(spec => (
              <div key={spec.label} style={{
                background: 'var(--surface2)', borderRadius: '10px',
                padding: '12px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{spec.icon}</div>
                <div style={{
                  fontSize: '10px', color: 'var(--text-dim)',
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px',
                }}>
                  {spec.label}
                </div>
                <div style={{
                  fontSize: '15px',
                  color: spec.color ?? 'var(--text)',
                  fontWeight: 600,
                }}>
                  {spec.value}
                </div>
              </div>
            ))}
          </div>

          {/* Order notes */}
          {task.production_order.notes && (
            <div style={{
              marginTop: '12px', padding: '10px 14px',
              background: 'rgba(201,168,76,0.06)',
              border: '0.5px solid var(--border-bright)',
              borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)',
            }}>
              📝 {task.production_order.notes}
            </div>
          )}

          {/* Task notes */}
          {task.notes && (
            <div style={{
              marginTop: '8px', padding: '10px 14px',
              background: 'var(--surface2)',
              border: '0.5px solid var(--border)',
              borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)',
            }}>
              💬 {task.notes}
            </div>
          )}
        </div>

        {/* Next process */}
        {nextTask && (
          <div style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: '14px', padding: '16px',
          }}>
            <div style={{
              fontSize: '11px', color: 'var(--text-dim)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px',
            }}>
              {t(lang, 'nextProcess')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '28px' }}>
                {getProcessIcon(nextTask.process_name)}
              </div>
              <div>
                <div style={{ fontSize: '15px', color: 'var(--text)', fontWeight: 500 }}>
                  {nextTask.process_name}
                </div>
                {nextTask.worker && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    → {(nextTask.worker as { name?: string })?.name}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pipeline */}
        {sortedTasks.length > 1 && (
          <div style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: '14px', padding: '16px',
          }}>
            <div style={{
              fontSize: '11px', color: 'var(--text-dim)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px',
            }}>
              {isUrdu ? 'پیداواری مراحل' : 'Production Pipeline'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sortedTasks.map(pt => {
                const isCurrent = pt.id === task.id
                const isDone    = ['done', 'collected', 'approved'].includes(pt.status)
                const icon      = getProcessIcon(pt.process_name)
                return (
                  <div key={pt.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 12px', borderRadius: '10px',
                    background: isCurrent ? 'rgba(201,168,76,0.08)' : 'transparent',
                    border: `0.5px solid ${isCurrent ? 'var(--border-bright)' : 'transparent'}`,
                  }}>
                    <div style={{ fontSize: '20px' }}>
                      {isDone ? '✅' : isCurrent ? icon : '⏳'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '13px',
                        color: isCurrent ? 'var(--gold)' : isDone ? 'var(--success)' : 'var(--text-muted)',
                        fontWeight: isCurrent ? 600 : 400,
                      }}>
                        {pt.process_name}
                        {isCurrent && (isUrdu ? ' ← آپ' : ' ← You')}
                      </div>
                      {pt.worker && (
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                          {(pt.worker as { name?: string })?.name}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      #{pt.stage_order}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── DISPUTE SECTION ── */}

        {/* Dispute button — show when approved and no dispute yet */}
        {['collected', 'approved'].includes(task.status) &&
         task.wage_status === 'admin_approved' &&
         (task.dispute_status === 'none' || task.dispute_status === null) && (
          <DisputeSection
            task={task}
            lang={lang}
            isUrdu={isUrdu}
            employeeId={user?.employee_id ?? ''}
            onDisputed={() => {
              setTask(prev => prev ? { ...prev, dispute_status: 'pending' } : prev)
            }}
          />
        )}

        {/* Dispute pending */}
        {task.dispute_status === 'pending' && (
          <div style={{
            background: 'rgba(230,126,34,0.1)',
            border: '0.5px solid var(--warning)',
            borderRadius: '14px', padding: '20px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
            <div style={{ fontSize: '15px', color: 'var(--warning)', fontWeight: 500 }}>
              {isUrdu ? 'اعتراض زیر جائزہ ہے' : 'Dispute Under Review'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
              {isUrdu
                ? 'ایڈمن آپ کے اعتراض کا جائزہ لے رہے ہیں'
                : 'Admin is reviewing your dispute'}
            </div>
          </div>
        )}

        {/* Dispute resolved */}
        {task.dispute_status === 'resolved' && (
          <div style={{
            background: 'rgba(39,174,96,0.1)',
            border: '0.5px solid var(--success)',
            borderRadius: '14px', padding: '20px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
            <div style={{ fontSize: '15px', color: 'var(--success)', fontWeight: 500 }}>
              {isUrdu ? 'اعتراض حل ہو گیا' : 'Dispute Resolved'}
            </div>
          </div>
        )}

        {/* Dispute rejected */}
        {task.dispute_status === 'rejected' && (
          <div style={{
            background: 'rgba(192,57,43,0.08)',
            border: '0.5px solid var(--danger)',
            borderRadius: '14px', padding: '20px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>❌</div>
            <div style={{ fontSize: '15px', color: 'var(--danger)', fontWeight: 500 }}>
              {isUrdu ? 'اعتراض مسترد — اصل اجرت برقرار' : 'Dispute Reviewed — Original Wage Confirmed'}
            </div>
          </div>
        )}

      </div>

      {/* ── ACTION BUTTONS ── */}
      <div style={{
        padding: '16px 20px', background: 'var(--surface)',
        borderTop: '0.5px solid var(--border)', flexShrink: 0,
      }}>
        {task.status === 'assigned' && (
          <button onClick={() => setConfirm('start')} style={{
            width: '100%', padding: '18px',
            background: 'rgba(201,168,76,0.15)',
            border: '0.5px solid var(--gold)',
            borderRadius: '14px', color: 'var(--gold)',
            fontSize: '18px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '10px',
          }}>
            ▶️ {t(lang, 'startWork')}
          </button>
        )}

        {task.status === 'in_progress' && (
          <button onClick={() => setConfirm('done')} style={{
            width: '100%', padding: '18px',
            background: 'rgba(39,174,96,0.15)',
            border: '0.5px solid var(--success)',
            borderRadius: '14px', color: 'var(--success)',
            fontSize: '18px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '10px',
          }}>
            ✅ {t(lang, 'markDone')}
          </button>
        )}

        {task.status === 'done' && (
          <div style={{
            padding: '18px', textAlign: 'center',
            background: 'rgba(230,126,34,0.1)',
            border: '0.5px solid var(--warning)',
            borderRadius: '14px', color: 'var(--warning)',
            fontSize: '15px', fontWeight: 500,
          }}>
            ⏳ {t(lang, 'waitingCollection')}
          </div>
        )}

        {['collected', 'approved'].includes(task.status) && (
          <div style={{
            padding: '18px', textAlign: 'center',
            background: 'rgba(39,174,96,0.1)',
            border: '0.5px solid var(--success)',
            borderRadius: '14px', color: 'var(--success)',
            fontSize: '15px', fontWeight: 500,
          }}>
            ✓ {task.status === 'approved' ? t(lang, 'approved') : t(lang, 'collected')}
          </div>
        )}
      </div>

      {/* ── CONFIRM MODAL ── */}
      {confirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'flex-end',
          justifyContent: 'center', zIndex: 50,
        }}>
          <div style={{
            background: 'var(--surface)', borderRadius: '20px 20px 0 0',
            padding: '28px 24px 40px', width: '100%',
            maxWidth: '480px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>
              {confirm === 'start' ? '▶️' : '✅'}
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '20px', color: 'var(--text)', marginBottom: '8px',
            }}>
              {t(lang, 'areYouSure')}
            </div>
            <div style={{
              fontSize: '14px', color: 'var(--text-muted)',
              marginBottom: '28px', lineHeight: 1.6,
            }}>
              {confirm === 'start'
                ? (isUrdu
                  ? `کیا آپ ${task.process_name} شروع کرنا چاہتے ہیں؟`
                  : `Start ${task.process_name} for ${task.production_order.item_name}?`)
                : t(lang, 'confirmDone')
              }
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirm(null)} style={{
                flex: 1, padding: '16px', background: 'var(--surface2)',
                border: '0.5px solid var(--border)', borderRadius: '12px',
                color: 'var(--text-muted)', fontSize: '16px', cursor: 'pointer',
              }}>
                {t(lang, 'cancel')}
              </button>
              <button
                onClick={confirm === 'start' ? handleStart : handleDone}
                disabled={processing}
                style={{
                  flex: 2, padding: '16px',
                  background: confirm === 'start'
                    ? 'rgba(201,168,76,0.15)' : 'rgba(39,174,96,0.15)',
                  border: `0.5px solid ${confirm === 'start' ? 'var(--gold)' : 'var(--success)'}`,
                  borderRadius: '12px',
                  color: confirm === 'start' ? 'var(--gold)' : 'var(--success)',
                  fontSize: '16px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                {processing ? '...' : t(lang, 'confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}