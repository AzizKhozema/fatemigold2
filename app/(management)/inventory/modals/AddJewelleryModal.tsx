'use client'

import { useState } from 'react'
import { Plus, Trash2, UserPlus } from 'lucide-react'
import type { JewelleryItem } from '@/hooks/useJewellery'
import type { Category } from '@/hooks/useCategories'
import type { ProcessTemplate } from '@/hooks/useProcessTemplates'
import { GOLD_RATES } from '@/lib/supabase_client'

type Labourer = {
  tempId: string
  employee_id: string | null
  labourer_name: string
  wage: number
  quantity: number
  notes: string
}

type ProcessEntry = {
  tempId: string
  process_template_id: string | null
  process_name: string
  unit: string
  quantity: number
  labourers: Labourer[]
}

type Props = {
  onClose: () => void
  onSave: (
    form: Omit<JewelleryItem, 'id' | 'sku' | 'created_at' | 'category' | 'processes'>,
    processes: {
      process_template_id: string | null
      process_name: string
      unit: string
      quantity: number
      labourers: {
        employee_id: string | null
        labourer_name: string
        wage: number
        quantity: number
        notes: string | null
      }[]
    }[]
  ) => Promise<void>
  saving: boolean
  categories: Category[]
  templates: ProcessTemplate[]
}

const KARAT_OPTIONS = ['24K', '22K', '21K', '18K', '14K']
const FINISH_OPTIONS = [
  { value: 'high_polish', label: 'High Polish' },
  { value: 'matte',       label: 'Matte' },
  { value: 'rhodium',     label: 'Rhodium' },
  { value: 'antique',     label: 'Antique' },
  { value: 'two_tone',    label: 'Two Tone' },
]
const UNIT_LABELS: Record<string, string> = {
  per_piece: 'Per Piece',
  per_gram:  'Per Gram',
  per_stone: 'Per Stone',
  per_hour:  'Per Hour',
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

export default function AddJewelleryModal({
  onClose, onSave, saving, categories, templates,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [err, setErr]   = useState<string | null>(null)

  const [form, setForm] = useState({
    name:               '',
    category_id:        '',
    karat:              '22K',
    weight_grams:       '',
    size:               '',
    length_mm:          '',
    width_mm:           '',
    stone_type:         '',
    stone_count:        '0',
    stone_weight_carats:'',
    finish:             'high_polish',
    item_type:          'standalone' as JewelleryItem['item_type'],
    status:             'in_stock'   as JewelleryItem['status'],
    overhead_pct:       '3',
    profit_margin_pct:  '15',
    notes:              '',
    photos:             [] as string[],
    has_360:            false,
    model_type:         'threejs'    as JewelleryItem['model_type'],
    purity:             null as number | null,
  })

  const [processes, setProcesses] = useState<ProcessEntry[]>([])

  const setF = (k: string, v: string | boolean | number | null) =>
    setForm(f => ({ ...f, [k]: v }))

  const goldRate   = GOLD_RATES[form.karat] ?? 29745
  const weight     = Number(form.weight_grams) || 0
  const goldCost   = Math.round(weight * goldRate)
  const wastageCost = Math.round(goldCost * 0.02)
  const labourCost = processes.reduce((total, p) =>
    total + p.labourers.reduce((s, l) => s + Number(l.wage) * Number(l.quantity), 0), 0
  )
  const overhead   = Math.round((goldCost + wastageCost + labourCost) * (Number(form.overhead_pct) / 100))
  const subtotal   = goldCost + wastageCost + labourCost + overhead
  const profit     = Math.round(subtotal * (Number(form.profit_margin_pct) / 100))
  const sellPrice  = subtotal + profit

  const addProcess = (template?: ProcessTemplate) => {
    setProcesses(prev => [...prev, {
      tempId:              uid(),
      process_template_id: template?.id ?? null,
      process_name:        template?.name ?? '',
      unit:                template?.unit ?? 'per_piece',
      quantity:            1,
      labourers:           template ? [{
        tempId:        uid(),
        employee_id:   null,
        labourer_name: '',
        wage:          template.base_wage,
        quantity:      1,
        notes:         '',
      }] : [],
    }])
  }

  const removeProcess = (tempId: string) =>
    setProcesses(prev => prev.filter(p => p.tempId !== tempId))

  const updateProcess = (tempId: string, key: keyof ProcessEntry, value: string | number) =>
    setProcesses(prev => prev.map(p =>
      p.tempId === tempId ? { ...p, [key]: value } : p
    ))

  const addLabourer = (processTempId: string) =>
    setProcesses(prev => prev.map(p =>
      p.tempId === processTempId ? {
        ...p,
        labourers: [...p.labourers, {
          tempId: uid(), employee_id: null,
          labourer_name: '', wage: 0, quantity: 1, notes: '',
        }],
      } : p
    ))

  const removeLabourer = (processTempId: string, labTempId: string) =>
    setProcesses(prev => prev.map(p =>
      p.tempId === processTempId ? {
        ...p,
        labourers: p.labourers.filter(l => l.tempId !== labTempId),
      } : p
    ))

  const updateLabourer = (
    processTempId: string,
    labTempId: string,
    key: keyof Labourer,
    value: string | number | null
  ) =>
    setProcesses(prev => prev.map(p =>
      p.tempId === processTempId ? {
        ...p,
        labourers: p.labourers.map(l =>
          l.tempId === labTempId ? { ...l, [key]: value } : l
        ),
      } : p
    ))

  const handleSave = async () => {
    if (!form.name.trim())       return setErr('Item name is required')
    if (!form.category_id)       return setErr('Category is required')
    if (!form.weight_grams)      return setErr('Weight is required')
    setErr(null)

    await onSave(
      {
        name:                form.name,
        category_id:         form.category_id || null,
        karat:               form.karat,
        weight_grams:        Number(form.weight_grams),
        purity:              form.purity,
        item_type:           form.item_type,
        status:              form.status,
        size:                form.size || null,
        length_mm:           Number(form.length_mm) || null,
        width_mm:            Number(form.width_mm) || null,
        stone_type:          form.stone_type || null,
        stone_count:         Number(form.stone_count) || 0,
        stone_weight_carats: Number(form.stone_weight_carats) || null,
        finish:              form.finish,
        overhead_pct:        Number(form.overhead_pct),
        profit_margin_pct:   Number(form.profit_margin_pct),
        notes:               form.notes || null,
        photos:              form.photos,
        has_360:             form.has_360,
        model_type:          form.model_type,
      },
      processes.map(p => ({
        process_template_id: p.process_template_id,
        process_name:        p.process_name,
        unit:                p.unit,
        quantity:            p.quantity,
        labourers:           p.labourers.map(l => ({
          employee_id:   l.employee_id,
          labourer_name: l.labourer_name,
          wage:          Number(l.wage),
          quantity:      Number(l.quantity),
          notes:         l.notes || null,
        })),
      }))
    )
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
  const sectionHead = {
    fontSize: '11px', color: 'var(--text-dim)',
    letterSpacing: '0.12em', textTransform: 'uppercase' as const,
    marginBottom: '12px', marginTop: '4px',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }}>
      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border-bright)',
        borderRadius: '14px', width: '620px', maxHeight: '92vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '0.5px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--gold)' }}>
              Add Jewellery Piece
            </h2>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Step {step} of 3 —{' '}
              {step === 1 ? 'Basic Details' : step === 2 ? 'Processes & Labour' : 'Pricing & Review'}
            </div>
          </div>
          {/* Step indicators */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2, 3].map(s => (
              <div key={s} onClick={() => setStep(s as 1 | 2 | 3)} style={{
                width: '28px', height: '28px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                background: step === s ? 'rgba(201,168,76,0.2)' : 'var(--surface2)',
                border: `0.5px solid ${step === s ? 'var(--gold)' : 'var(--border)'}`,
                color: step === s ? 'var(--gold)' : 'var(--text-muted)',
              }}>
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* ── STEP 1 — Basic Details ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={sectionHead}>Item Info</div>

              <div>
                <label style={labelStyle}>Item Name *</label>
                <input value={form.name} onChange={e => setF('name', e.target.value)}
                  placeholder="e.g. Traditional Kara" style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Category *</label>
                  <select value={form.category_id} onChange={e => setF('category_id', e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Karat</label>
                  <select value={form.karat} onChange={e => setF('karat', e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}>
                    {KARAT_OPTIONS.map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Weight (grams) *</label>
                  <input type="number" value={form.weight_grams}
                    onChange={e => setF('weight_grams', e.target.value)}
                    placeholder="0.00" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Size</label>
                  <input value={form.size} onChange={e => setF('size', e.target.value)}
                    placeholder='e.g. 2.6" or US 7' style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Length (mm)</label>
                  <input type="number" value={form.length_mm}
                    onChange={e => setF('length_mm', e.target.value)}
                    placeholder="0" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Width (mm)</label>
                  <input type="number" value={form.width_mm}
                    onChange={e => setF('width_mm', e.target.value)}
                    placeholder="0" style={inputStyle} />
                </div>
              </div>

              <div style={sectionHead}>Finish & Stones</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Finish</label>
                  <select value={form.finish} onChange={e => setF('finish', e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}>
                    {FINISH_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Stone Type</label>
                  <input value={form.stone_type} onChange={e => setF('stone_type', e.target.value)}
                    placeholder="e.g. Diamond, Ruby" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Stone Count</label>
                  <input type="number" value={form.stone_count}
                    onChange={e => setF('stone_count', e.target.value)}
                    placeholder="0" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Stone Weight (carats)</label>
                  <input type="number" value={form.stone_weight_carats}
                    onChange={e => setF('stone_weight_carats', e.target.value)}
                    placeholder="0.00" style={inputStyle} />
                </div>
              </div>

              <div style={sectionHead}>Item Type & Status</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Item Type</label>
                  <select value={form.item_type} onChange={e => setF('item_type', e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="standalone">Standalone</option>
                    <option value="bundle">Bundle / Set</option>
                    <option value="component">Component of Set</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select value={form.status} onChange={e => setF('status', e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="in_stock">In Stock</option>
                    <option value="on_order">On Order</option>
                    <option value="reserved">Reserved</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Notes</label>
                <textarea value={form.notes} onChange={e => setF('notes', e.target.value)}
                  rows={2} placeholder="Any additional notes..."
                  style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }} />
              </div>
            </div>
          )}

          {/* ── STEP 2 — Processes & Labour ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={sectionHead}>Production Processes</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {/* Quick add from templates */}
                  <select
                    onChange={e => {
                      const t = templates.find(t => t.id === e.target.value)
                      if (t) addProcess(t)
                      e.target.value = ''
                    }}
                    defaultValue=""
                    style={{
                      background: 'var(--surface2)', border: '0.5px solid var(--border)',
                      borderRadius: '8px', color: 'var(--text-muted)', fontSize: '12px',
                      padding: '7px 10px', cursor: 'pointer', outline: 'none',
                    }}
                  >
                    <option value="">+ From template</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <button onClick={() => addProcess()} style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '7px 12px', background: 'rgba(201,168,76,0.1)',
                    border: '0.5px solid var(--border-bright)', borderRadius: '8px',
                    color: 'var(--gold)', fontSize: '12px', cursor: 'pointer',
                  }}>
                    <Plus size={13} /> Custom
                  </button>
                </div>
              </div>

              {processes.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '30px',
                  border: '0.5px dashed var(--border)', borderRadius: '10px',
                  color: 'var(--text-dim)', fontSize: '13px',
                }}>
                  No processes added yet. Add from template or create custom.
                </div>
              )}

              {processes.map((proc, pi) => (
                <div key={proc.tempId} style={{
                  background: 'var(--surface2)', border: '0.5px solid var(--border)',
                  borderRadius: '10px', padding: '14px',
                }}>
                  {/* Process header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px auto', gap: '10px', marginBottom: '12px', alignItems: 'end' }}>
                    <div>
                      <label style={labelStyle}>Process Name</label>
                      <input
                        value={proc.process_name}
                        onChange={e => updateProcess(proc.tempId, 'process_name', e.target.value)}
                        placeholder="e.g. Stone Setting"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Unit</label>
                      <select
                        value={proc.unit}
                        onChange={e => updateProcess(proc.tempId, 'unit', e.target.value)}
                        style={{ ...inputStyle, cursor: 'pointer' }}
                      >
                        {Object.entries(UNIT_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Qty</label>
                      <input
                        type="number"
                        value={proc.quantity}
                        onChange={e => updateProcess(proc.tempId, 'quantity', Number(e.target.value))}
                        style={inputStyle}
                      />
                    </div>
                    <button onClick={() => removeProcess(proc.tempId)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--danger)', padding: '4px', marginTop: '16px',
                    }}>
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Labourers */}
                  <div style={{ paddingLeft: '8px', borderLeft: '2px solid var(--border)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Labourers
                    </div>

                    {proc.labourers.map((lab, li) => (
                      <div key={lab.tempId} style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 100px 80px 80px auto',
                        gap: '8px', marginBottom: '8px', alignItems: 'center',
                      }}>
                        <input
                          value={lab.labourer_name}
                          onChange={e => updateLabourer(proc.tempId, lab.tempId, 'labourer_name', e.target.value)}
                          placeholder="Labourer name"
                          style={{ ...inputStyle, fontSize: '12px', padding: '6px 10px' }}
                        />
                        <input
                          type="number"
                          value={lab.wage}
                          onChange={e => updateLabourer(proc.tempId, lab.tempId, 'wage', Number(e.target.value))}
                          placeholder="Wage"
                          style={{ ...inputStyle, fontSize: '12px', padding: '6px 10px' }}
                        />
                        <input
                          type="number"
                          value={lab.quantity}
                          onChange={e => updateLabourer(proc.tempId, lab.tempId, 'quantity', Number(e.target.value))}
                          placeholder="Qty"
                          style={{ ...inputStyle, fontSize: '12px', padding: '6px 10px' }}
                        />
                        <div style={{ fontSize: '12px', color: 'var(--success)', textAlign: 'right' }}>
                          ₨ {(Number(lab.wage) * Number(lab.quantity)).toLocaleString()}
                        </div>
                        <button onClick={() => removeLabourer(proc.tempId, lab.tempId)} style={{
                          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)',
                        }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}

                    <button onClick={() => addLabourer(proc.tempId)} style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      background: 'none', border: '0.5px dashed var(--border)',
                      borderRadius: '6px', padding: '5px 10px',
                      color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer',
                      marginTop: '4px',
                    }}>
                      <UserPlus size={12} /> Add Labourer
                    </button>
                  </div>

                  {/* Process total */}
                  <div style={{
                    marginTop: '10px', paddingTop: '10px',
                    borderTop: '0.5px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '12px',
                  }}>
                    <span style={{ color: 'var(--text-muted)' }}>Process Total</span>
                    <span style={{ color: 'var(--gold)', fontWeight: 500 }}>
                      ₨ {proc.labourers.reduce((s, l) => s + Number(l.wage) * Number(l.quantity), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}

              {/* Labour total */}
              {processes.length > 0 && (
                <div style={{
                  background: 'rgba(201,168,76,0.06)', border: '0.5px solid var(--border-bright)',
                  borderRadius: '8px', padding: '12px 16px',
                  display: 'flex', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Labour Cost</span>
                  <span style={{ fontSize: '14px', color: 'var(--gold)', fontWeight: 500 }}>
                    ₨ {labourCost.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3 — Pricing & Review ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={sectionHead}>Pricing Settings</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Overhead %</label>
                  <input
                    type="number"
                    value={form.overhead_pct}
                    onChange={e => setF('overhead_pct', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Profit Margin %</label>
                  <input
                    type="number"
                    value={form.profit_margin_pct}
                    onChange={e => setF('profit_margin_pct', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Price Breakdown */}
              <div style={sectionHead}>Price Breakdown</div>

              <div style={{
                background: 'var(--surface2)', border: '0.5px solid var(--border)',
                borderRadius: '10px', overflow: 'hidden',
              }}>
                {[
                  { label: `Gold (${weight}g × ₨${goldRate.toLocaleString()}/g)`, value: goldCost,    color: 'var(--text)' },
                  { label: 'Wastage (2%)',                                          value: wastageCost, color: 'var(--text)' },
                  { label: 'Labour Cost',                                           value: labourCost,  color: 'var(--text)' },
                  { label: `Overhead (${form.overhead_pct}%)`,                     value: overhead,    color: 'var(--text)' },
                  { label: 'Subtotal (Cost Price)',                                 value: subtotal,    color: 'var(--text)', border: true },
                  { label: `Profit Margin (${form.profit_margin_pct}%)`,           value: profit,      color: '#4ade80' },
                ].map((row, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 16px',
                    borderBottom: row.border ? '0.5px solid var(--border-bright)' : '0.5px solid var(--border)',
                  }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.label}</span>
                    <span style={{ fontSize: '13px', color: row.color, fontWeight: row.border ? 500 : 400 }}>
                      ₨ {row.value.toLocaleString()}
                    </span>
                  </div>
                ))}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 16px',
                  background: 'rgba(201,168,76,0.06)',
                }}>
                  <span style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 500 }}>Selling Price</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--gold)' }}>
                    ₨ {sellPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Review Summary */}
              <div style={sectionHead}>Review</div>

              <div style={{
                background: 'var(--surface2)', border: '0.5px solid var(--border)',
                borderRadius: '10px', padding: '14px 16px',
              }}>
                {[
                  { label: 'Name',      value: form.name || '—' },
                  { label: 'Category', value: categories.find(c => c.id === form.category_id)?.name || '—' },
                  { label: 'Karat',    value: form.karat },
                  { label: 'Weight',   value: `${form.weight_grams || 0}g` },
                  { label: 'Finish',   value: FINISH_OPTIONS.find(f => f.value === form.finish)?.label || '—' },
                  { label: 'Stones',   value: Number(form.stone_count) > 0 ? `${form.stone_count} × ${form.stone_type || 'unknown'}` : 'None' },
                  { label: 'Processes', value: `${processes.length} process${processes.length !== 1 ? 'es' : ''}` },
                ].map(row => (
                  <div key={row.label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '5px 0', borderBottom: '0.5px solid var(--border)',
                  }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.label}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text)' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '0.5px solid var(--border)',
          display: 'flex', gap: '10px', flexShrink: 0,
          background: 'var(--surface)',
        }}>
          {err && (
            <div style={{ fontSize: '12px', color: 'var(--danger)', flex: 1, display: 'flex', alignItems: 'center' }}>
              {err}
            </div>
          )}
          <button onClick={onClose} style={{
            padding: '9px 20px', background: 'var(--surface2)',
            border: '0.5px solid var(--border)', borderRadius: '8px',
            color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer',
          }}>
            Cancel
          </button>
          {step > 1 && (
            <button onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)} style={{
              padding: '9px 20px', background: 'var(--surface2)',
              border: '0.5px solid var(--border)', borderRadius: '8px',
              color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer',
            }}>
              Back
            </button>
          )}
          {step < 3 && (
            <button onClick={() => {
              if (step === 1 && !form.name.trim()) return setErr('Item name is required')
              if (step === 1 && !form.category_id) return setErr('Category is required')
              if (step === 1 && !form.weight_grams) return setErr('Weight is required')
              setErr(null)
              setStep(s => (s + 1) as 1 | 2 | 3)
            }} style={{
              padding: '9px 24px', background: 'rgba(201,168,76,0.15)',
              border: '0.5px solid var(--gold)', borderRadius: '8px',
              color: 'var(--gold)', fontSize: '13px', cursor: 'pointer', fontWeight: 500,
              marginLeft: 'auto',
            }}>
              Next →
            </button>
          )}
          {step === 3 && (
            <button onClick={handleSave} disabled={saving} style={{
              padding: '9px 24px', background: 'rgba(201,168,76,0.15)',
              border: '0.5px solid var(--gold)', borderRadius: '8px',
              color: 'var(--gold)', fontSize: '13px', cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 500, marginLeft: 'auto',
            }}>
              {saving ? 'Saving...' : 'Save Piece'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}