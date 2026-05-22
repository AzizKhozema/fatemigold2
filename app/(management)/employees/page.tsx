'use client'

import { useState } from 'react'
import { Plus, Search, Phone, Mail, Edit2, Trash2, UserCheck, UserX } from 'lucide-react'
import { useEmployees } from '@/hooks/useEmployees'
import { LoadingSpinner, ErrorMessage, EmptyState } from '@/app/components/ui/LoadingSpinner'
import type { Employee } from '@/lib/types'

function EmployeeModal({ employee, onClose, onSave, saving }: {
  employee: Partial<Employee> | null
  onClose: () => void
  onSave: (e: Partial<Employee>) => Promise<void>
  saving: boolean
}) {
  const [form, setForm] = useState<Partial<Employee>>(employee ?? { is_active: true, skills: [] })
  const [err, setErr]   = useState<string | null>(null)
  const set = (k: keyof Employee, v: string | number | boolean) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name?.trim())         return setErr('Name is required')
    if (!form.role?.trim())         return setErr('Role is required')
    if (!form.phone?.trim())        return setErr('Phone is required')
    if (!form.joining_date?.trim()) return setErr('Joining date is required')
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
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--gold)', marginBottom: '20px' }}>
          {employee?.id ? 'Edit Employee' : 'Add Employee'}
        </h2>
        {[
          { label: 'Full Name *',         key: 'name',         type: 'text' },
          { label: 'Role / Position *',   key: 'role',         type: 'text' },
          { label: 'Phone *',             key: 'phone',        type: 'text' },
          { label: 'Email',               key: 'email',        type: 'email' },
          { label: 'Monthly Salary (PKR)', key: 'salary',      type: 'number' },
          { label: 'Joining Date *',      key: 'joining_date', type: 'date' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', display: 'block', marginBottom: '5px' }}>
              {f.label}
            </label>
            <input
              type={f.type}
              value={(form as Record<string, string | number>)[f.key] ?? ''}
              onChange={e => set(f.key as keyof Employee, f.type === 'number' ? Number(e.target.value) : e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', background: 'var(--surface2)',
                border: '0.5px solid var(--border)', borderRadius: '8px',
                color: 'var(--text)', fontSize: '13px', outline: 'none',
              }}
            />
          </div>
        ))}

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
            Status
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[true, false].map(val => (
              <button key={String(val)} onClick={() => set('is_active', val)} style={{
                flex: 1, padding: '7px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px',
                border: '0.5px solid',
                borderColor: form.is_active === val ? (val ? 'var(--success)' : 'var(--danger)') : 'var(--border)',
                background: form.is_active === val ? (val ? 'rgba(39,174,96,0.12)' : 'rgba(192,57,43,0.12)') : 'var(--surface2)',
                color: form.is_active === val ? (val ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)',
              }}>
                {val ? 'Active' : 'Inactive'}
              </button>
            ))}
          </div>
        </div>

        {err && <div style={{ fontSize: '12px', color: 'var(--danger)', marginBottom: '12px' }}>{err}</div>}

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={onClose} disabled={saving} style={{
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

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  { bg: 'rgba(201,168,76,0.15)',  color: 'var(--gold)' },
  { bg: 'rgba(138,110,180,0.15)', color: '#b89ee8' },
  { bg: 'rgba(39,174,96,0.12)',   color: '#4ade80' },
  { bg: 'rgba(74,130,200,0.12)',  color: '#7eb8f7' },
  { bg: 'rgba(230,126,34,0.12)',  color: '#fb923c' },
  { bg: 'rgba(236,72,153,0.12)',  color: '#f472b6' },
]

export default function EmployeesPage() {
  const { employees, loading, error, refetch, add, update, remove } = useEmployees()
  const [search, setSearch]       = useState('')
  const [modal, setModal]         = useState<Partial<Employee> | null | false>(false)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState<string | null>(null)
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')

  const filtered = employees.filter(e => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filterActive === 'all' ||
      (filterActive === 'active' && e.is_active) ||
      (filterActive === 'inactive' && !e.is_active)
    return matchSearch && matchFilter
  })

  const handleSave = async (form: Partial<Employee>) => {
    setSaving(true)
    try {
      if (form.id) {
        await update(form.id, form)
      } else {
        await add({
          name:         form.name!,
          role:         form.role!,
          phone:        form.phone!,
          email:        form.email ?? null,
          salary:       form.salary ?? 0,
          joining_date: form.joining_date!,
          is_active:    form.is_active ?? true,
          skills:       form.skills ?? [],
        })
      }
      setModal(false)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this employee?')) return
    setDeleting(id)
    try { await remove(id) }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed to delete') }
    finally { setDeleting(null) }
  }

  const totalSalary  = employees.filter(e => e.is_active).reduce((s, e) => s + e.salary, 0)
  const activeCount  = employees.filter(e => e.is_active).length

  if (loading) return <LoadingSpinner text="Loading employees..." />
  if (error)   return <ErrorMessage message={error} onRetry={refetch} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        {[
          { label: 'Total Staff',     value: String(employees.length),        color: 'var(--gold)' },
          { label: 'Active Now',      value: String(activeCount),             color: 'var(--success)' },
          { label: 'Monthly Payroll', value: `₨ ${totalSalary.toLocaleString()}`, color: '#b89ee8' },
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
            placeholder="Search by name or role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '13px', flex: 1 }}
          />
        </div>
        {(['all', 'active', 'inactive'] as const).map(f => (
          <button key={f} onClick={() => setFilterActive(f)} style={{
            padding: '6px 14px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer',
            border: '0.5px solid', textTransform: 'capitalize',
            borderColor: filterActive === f ? 'var(--gold)' : 'var(--border)',
            background: filterActive === f ? 'rgba(201,168,76,0.12)' : 'var(--surface)',
            color: filterActive === f ? 'var(--gold)' : 'var(--text-muted)',
          }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <button onClick={() => setModal({})} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 16px', background: 'rgba(201,168,76,0.12)',
          border: '0.5px solid var(--gold)', borderRadius: '8px',
          color: 'var(--gold)', fontSize: '13px', cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap',
        }}>
          <Plus size={14} /> Add Employee
        </button>
      </div>

      {filtered.length === 0 && (
        <EmptyState
          message={search ? 'No employees match your search.' : 'No employees yet. Add your first team member!'}
        />
      )}

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        {filtered.map((emp, idx) => {
          const av = AVATAR_COLORS[idx % AVATAR_COLORS.length]
          return (
            <div key={emp.id} style={{
              background: 'var(--surface)', border: '0.5px solid var(--border)',
              borderRadius: '10px', padding: '20px',
              opacity: deleting === emp.id ? 0.4 : 1, transition: 'opacity 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: av.bg, color: av.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 500, flexShrink: 0,
                }}>
                  {getInitials(emp.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>{emp.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{emp.role}</div>
                  <span style={{
                    marginTop: '5px', fontSize: '10px', padding: '2px 8px', borderRadius: '99px',
                    background: emp.is_active ? 'rgba(39,174,96,0.12)' : 'rgba(192,57,43,0.12)',
                    color: emp.is_active ? '#4ade80' : '#f87171',
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                  }}>
                    {emp.is_active ? <UserCheck size={9} /> : <UserX size={9} />}
                    {emp.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => setModal(emp)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '3px' }}>
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => handleDelete(emp.id)} disabled={deleting === emp.id} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '3px' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <Phone size={11} />{emp.phone}
                </div>
                {emp.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <Mail size={11} />{emp.email}
                  </div>
                )}
              </div>

              {emp.skills && emp.skills.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
                  {emp.skills.map(skill => (
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

              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderTop: '0.5px solid var(--border)', paddingTop: '12px',
              }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Salary</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', color: 'var(--gold)', marginTop: '2px' }}>
                    ₨ {emp.salary.toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Since</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{emp.joining_date}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {modal !== false && (
        <EmployeeModal employee={modal} onClose={() => setModal(false)} onSave={handleSave} saving={saving} />
      )}
    </div>
  )
}