'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase_client'
import { useAuth } from '@/lib/AuthContext'
import { useLanguage } from '@/lib/useLanguage'
import { useOfflineSync } from '@/lib/useOfflineSync'
import { t, getProcessIcon, getCategoryIcon } from '@/lib/i18n'
import { Bell, LogOut, Wifi, WifiOff, RefreshCw } from 'lucide-react'

type WorkerTask = {
  id: string
  process_name: string
  status: string
  wage_type: string
  calculated_wage: number | null
  fixed_wage: number | null
  actual_wage: number | null
  wage_status: string
  started_at: string | null
  done_at: string | null
  notes: string | null
  production_order: {
    id: string
    item_name: string
    karat: string
    weight_grams: number
    category: { name: string } | null
  }
  next_task?: {
    process_name: string
    worker_name: string | null
  } | null
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  assigned:    { bg: 'rgba(74,130,200,0.15)',  color: '#7eb8f7' },
  in_progress: { bg: 'rgba(201,168,76,0.15)',  color: '#E8C97A' },
  done:        { bg: 'rgba(230,126,34,0.15)',  color: '#fb923c' },
  collected:   { bg: 'rgba(138,110,180,0.15)', color: '#b89ee8' },
  approved:    { bg: 'rgba(39,174,96,0.15)',   color: '#4ade80' },
}

export default function WorkerHomePage() {
  const { user, logout }          = useAuth()
  const { lang, toggleLang, isUrdu } = useLanguage()
  const { isOnline, syncing, queueSize } = useOfflineSync()
  const router = useRouter()

  const [tasks, setTasks]         = useState<WorkerTask[]>([])
  const [loading, setLoading]     = useState(true)
  const [unread, setUnread]       = useState(0)
  const [activeTab, setActiveTab] = useState<'tasks' | 'wages' | 'notifs'>('tasks')
  const [notifications, setNotifications] = useState<{
    id: string; title: string; body: string; read: boolean; created_at: string
  }[]>([])

  const loadTasks = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('production_tasks')
        .select(`
          id, process_name, status, wage_type,
          calculated_wage, fixed_wage, actual_wage,
          wage_status, started_at, done_at, notes,
          production_order:production_orders(
            id, item_name, karat, weight_grams,
            category:categories(name)
          )
        `)
        .eq('assigned_to', user.employee_id)
        .not('status', 'in', '("cancelled")')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      setTasks((data ?? []) as unknown as WorkerTask[])
    } finally {
      setLoading(false)
    }
  }, [user])

  const loadNotifications = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('id, title, body, read, created_at')
      .eq('to_employee_id', user.employee_id)
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifications(data ?? [])
    setUnread((data ?? []).filter(n => !n.read).length)
  }, [user])

  useEffect(() => {
    loadTasks()
    loadNotifications()

    const sub = supabase
      .channel('worker-tasks')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'production_tasks',
        filter: `assigned_to=eq.${user?.employee_id}`,
      }, () => { loadTasks(); loadNotifications() })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `to_employee_id=eq.${user?.employee_id}`,
      }, loadNotifications)
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [loadTasks, loadNotifications])

  const markAllRead = async () => {
    if (!user) return
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('to_employee_id', user.employee_id)
      .eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
  }

  const activeTasks    = tasks.filter(t => ['assigned', 'in_progress', 'done'].includes(t.status))
  const completedTasks = tasks.filter(t => ['collected', 'approved'].includes(t.status))

  const getWageDisplay = (task: WorkerTask) => {
    if (task.actual_wage) return `₨ ${Number(task.actual_wage).toLocaleString()}`
    if (task.calculated_wage) return `₨ ${Number(task.calculated_wage).toLocaleString()}`
    if (task.fixed_wage) return `₨ ${Number(task.fixed_wage).toLocaleString()}`
    return '—'
  }

  const totalApproved = tasks
    .filter(t => t.wage_status === 'admin_approved')
    .reduce((s, t) => s + Number(t.actual_wage ?? 0), 0)
  const totalPending = tasks
    .filter(t => t.wage_status === 'supervisor_entered')
    .reduce((s, t) => s + Number(t.actual_wage ?? 0), 0)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      minHeight: '100vh', background: 'var(--bg)',
    }}>

      {/* Header */}
      <div style={{
        background: 'var(--surface)', borderBottom: '0.5px solid var(--border)',
        padding: '16px 20px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--gold)' }}>
              Fatemi Gold
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '1px' }}>
              {isUrdu ? `سلام، ${user?.name}` : `Hello, ${user?.name}`}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

            {/* Online indicator */}
            <div title={isOnline ? 'Online' : 'Offline'}>
              {isOnline
                ? <Wifi size={16} style={{ color: 'var(--success)' }} />
                : <WifiOff size={16} style={{ color: 'var(--danger)' }} />
              }
            </div>

            {/* Sync indicator */}
            {queueSize > 0 && (
              <div style={{
                fontSize: '10px', padding: '2px 8px', borderRadius: '99px',
                background: 'rgba(230,126,34,0.15)', color: 'var(--warning)',
              }}>
                {syncing ? 'Syncing...' : `${queueSize} pending`}
              </div>
            )}

            {/* Language toggle */}
            <button onClick={toggleLang} style={{
              padding: '5px 10px', borderRadius: '8px', fontSize: '12px',
              background: 'var(--surface2)', border: '0.5px solid var(--border)',
              color: 'var(--text-muted)', cursor: 'pointer',
            }}>
              {lang === 'en' ? '🇵🇰 اردو' : '🇬🇧 EN'}
            </button>

            {/* Logout */}
            <button onClick={logout} style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'var(--surface2)', border: '0.5px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-muted)',
            }}>
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', background: 'var(--surface)',
        borderBottom: '0.5px solid var(--border)', flexShrink: 0,
      }}>
        {([
          { id: 'tasks',  label: t(lang, 'myTasks'),  badge: activeTasks.length },
          { id: 'wages',  label: t(lang, 'myWages'),  badge: 0 },
          { id: 'notifs', label: t(lang, 'notifications'), badge: unread },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id === 'notifs') markAllRead() }} style={{
            flex: 1, padding: '14px 8px', border: 'none', cursor: 'pointer',
            background: 'transparent',
            borderBottom: activeTab === tab.id ? '2px solid var(--gold)' : '2px solid transparent',
            color: activeTab === tab.id ? 'var(--gold)' : 'var(--text-muted)',
            fontSize: '13px', fontWeight: activeTab === tab.id ? 500 : 400,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
            {tab.label}
            {tab.badge > 0 && (
              <span style={{
                background: activeTab === tab.id ? 'var(--gold)' : 'var(--danger)',
                color: '#0D0C0A', fontSize: '10px', fontWeight: 600,
                padding: '1px 6px', borderRadius: '99px',
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {/* ── TASKS TAB ── */}
        {activeTab === 'tasks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {loading && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
                <div style={{ fontSize: '13px' }}>Loading...</div>
              </div>
            )}

            {!loading && activeTasks.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '60px 20px',
                border: '0.5px dashed var(--border)', borderRadius: '16px',
                marginTop: '20px',
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                <div style={{ fontSize: '16px', color: 'var(--text)', fontWeight: 500, marginBottom: '6px' }}>
                  {t(lang, 'noTasks')}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {t(lang, 'noTasksDesc')}
                </div>
              </div>
            )}

            {activeTasks.map(task => {
              const icon    = getProcessIcon(task.process_name)
              const catIcon = getCategoryIcon(
                (task.production_order.category as { name?: string } | null)?.name ?? ''
              )
              const st      = STATUS_COLORS[task.status] ?? STATUS_COLORS['assigned']
              const wage    = getWageDisplay(task)

              return (
                <div
                  key={task.id}
                  onClick={() => router.push(`/worker/task/${task.id}`)}
                  style={{
                    background: 'var(--surface)',
                    border: `0.5px solid ${task.status === 'in_progress' ? 'var(--gold)' : 'var(--border)'}`,
                    borderRadius: '16px', padding: '18px',
                    cursor: 'pointer', transition: 'all 0.15s',
                    borderLeft: `4px solid ${st.color}`,
                  }}
                >
                  {/* Top row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    {/* Big process icon */}
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '14px',
                      background: st.bg, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '28px', flexShrink: 0,
                    }}>
                      {icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text)', marginBottom: '3px' }}>
                        {task.process_name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '11px', padding: '2px 10px', borderRadius: '99px',
                          background: st.bg, color: st.color, fontWeight: 500,
                        }}>
                          {task.status === 'assigned' ? t(lang, 'taskAssigned') : 
                           task.status === 'in_progress' ? t(lang, 'taskInProgress') :
                           task.status === 'done' ? t(lang, 'taskDone') :
                           task.status === 'collected' ? t(lang, 'taskCollected') :
                           task.status === 'approved' ? t(lang, 'taskApproved') :
                           task.status}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '22px' }}>{catIcon}</div>
                  </div>

                  {/* Piece details */}
                  <div style={{
                    background: 'var(--surface2)', borderRadius: '10px',
                    padding: '12px', marginBottom: '12px',
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                  }}>
                    {[
                      { label: t(lang, 'item'),   value: task.production_order.item_name },
                      { label: t(lang, 'karat'),  value: task.production_order.karat },
                      { label: t(lang, 'weight'), value: `${task.production_order.weight_grams}g` },
                      { label: t(lang, 'estimatedWage'), value: wage, color: 'var(--gold)' },
                    ].map(spec => (
                      <div key={spec.label}>
                        <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
                          {spec.label}
                        </div>
                        <div style={{ fontSize: '14px', color: spec.color ?? 'var(--text)', fontWeight: 500 }}>
                          {spec.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action hint */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: '12px', color: 'var(--text-muted)',
                  }}>
                    <span>
                      {task.status === 'assigned'    && `👆 ${isUrdu ? 'ٹیپ کریں' : 'Tap to start'}`}
                      {task.status === 'in_progress' && `👆 ${isUrdu ? 'ٹیپ کریں' : 'Tap to manage'}`}
                      {task.status === 'done'        && `⏳ ${t(lang, 'waitingCollection')}`}
                    </span>
                    <span style={{ color: 'var(--gold)', fontSize: '16px' }}>→</span>
                  </div>
                </div>
              )
            })}

            {/* Completed tasks */}
            {completedTasks.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px', padding: '0 4px' }}>
                  {isUrdu ? 'مکمل کام' : 'Completed'}
                </div>
                {completedTasks.map(task => {
                  const icon = getProcessIcon(task.process_name)
                  return (
                    <div key={task.id} style={{
                      background: 'var(--surface)', border: '0.5px solid var(--border)',
                      borderRadius: '12px', padding: '14px',
                      marginBottom: '8px', opacity: 0.7,
                      display: 'flex', alignItems: 'center', gap: '12px',
                    }}>
                      <div style={{ fontSize: '24px' }}>{icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 500 }}>
                          {task.process_name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {task.production_order.item_name}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: 500 }}>
                          {getWageDisplay(task)}
                        </div>
                        <div style={{ fontSize: '10px', color: task.wage_status === 'admin_approved' ? 'var(--success)' : 'var(--text-muted)', marginTop: '2px' }}>
                          {task.wage_status === 'admin_approved' ? t(lang, 'approved') : t(lang, 'pendingApproval')}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── WAGES TAB ── */}
        {activeTab === 'wages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{
                background: 'var(--surface)', border: '0.5px solid var(--border-bright)',
                borderRadius: '14px', padding: '18px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {t(lang, 'approved')}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--success)' }}>
                  ₨ {totalApproved.toLocaleString()}
                </div>
              </div>
              <div style={{
                background: 'var(--surface)', border: '0.5px solid var(--border)',
                borderRadius: '14px', padding: '18px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {t(lang, 'pendingApproval')}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--warning)' }}>
                  ₨ {totalPending.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Wage history */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tasks.filter(t => t.actual_wage || t.calculated_wage || t.fixed_wage).map(task => {
                const icon  = getProcessIcon(task.process_name)
                const wage  = getWageDisplay(task)
                const wSt   = task.wage_status
                const color =
                  wSt === 'admin_approved' ? 'var(--success)' :
                  wSt === 'supervisor_entered' ? 'var(--warning)' :
                  wSt === 'admin_rejected' ? 'var(--danger)' : 'var(--text-muted)'
                const label =
                  wSt === 'admin_approved' ? t(lang, 'approved') :
                  wSt === 'supervisor_entered' ? t(lang, 'pendingApproval') :
                  wSt === 'admin_rejected' ? (isUrdu ? 'واپس' : 'Returned') :
                  wSt === 'paid' ? t(lang, 'paid') : '—'

                return (
                  <div key={task.id} style={{
                    background: 'var(--surface)', border: '0.5px solid var(--border)',
                    borderRadius: '12px', padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                  }}>
                    <div style={{ fontSize: '24px' }}>{icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>
                        {task.process_name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {task.production_order.item_name} · {task.production_order.weight_grams}g
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--gold)' }}>
                        {wage}
                      </div>
                      <div style={{ fontSize: '10px', color, marginTop: '2px', fontWeight: 500 }}>
                        {label}
                      </div>
                    </div>
                  </div>
                )
              })}
              {tasks.filter(t => t.actual_wage || t.calculated_wage || t.fixed_wage).length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)', fontSize: '13px' }}>
                  {isUrdu ? 'ابھی تک کوئی اجرت نہیں' : 'No wages recorded yet'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS TAB ── */}
        {activeTab === 'notifs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {notifications.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)', fontSize: '13px' }}>
                <Bell size={32} style={{ marginBottom: '10px', opacity: 0.3 }} />
                <div>{t(lang, 'noNotifications')}</div>
              </div>
            )}
            {notifications.map(notif => (
              <div key={notif.id} style={{
                background: notif.read ? 'var(--surface)' : 'rgba(201,168,76,0.06)',
                border: `0.5px solid ${notif.read ? 'var(--border)' : 'var(--border-bright)'}`,
                borderRadius: '12px', padding: '14px 16px',
              }}>
                <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: notif.read ? 400 : 500, marginBottom: '4px' }}>
                  {notif.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {notif.body}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '6px' }}>
                  {new Date(notif.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// Fix missing import
const translations = {
  en: {} as Record<string, string>,
  ur: {} as Record<string, string>,
}