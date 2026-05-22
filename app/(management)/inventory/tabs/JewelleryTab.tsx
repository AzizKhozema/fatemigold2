'use client'

import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, Eye, Package } from 'lucide-react'
import { useJewellery } from '@/hooks/useJewellery'
import { useCategories } from '@/hooks/useCategories'
import { usePricing } from '@/hooks/usePricing'
import { LoadingSpinner, ErrorMessage, EmptyState } from '@/app/components/ui/LoadingSpinner'
import { useProcessTemplates } from '@/hooks/useProcessTemplates'
import AddJewelleryModal from '../modals/AddJewelleryModal'
import type { JewelleryItem } from '@/hooks/useJewellery'
import Link from 'next/link'

const STATUS_CONFIG = {
  in_stock:  { label: 'In Stock',  color: '#4ade80', bg: 'rgba(39,174,96,0.12)' },
  sold:      { label: 'Sold',      color: '#f87171', bg: 'rgba(192,57,43,0.12)' },
  reserved:  { label: 'Reserved',  color: '#E8C97A', bg: 'rgba(201,168,76,0.12)' },
  on_order:  { label: 'On Order',  color: '#7eb8f7', bg: 'rgba(74,130,200,0.12)' },
}

const FINISH_LABELS: Record<string, string> = {
  high_polish: 'High Polish',
  matte:       'Matte',
  rhodium:     'Rhodium',
  antique:     'Antique',
  two_tone:    'Two Tone',
}

const SHAPE_MAP: Record<string, 'bangle' | 'ring' | 'bracelet' | 'earring' | 'necklace'> = {
  'Bangles':         'bangle',
  'Kara':            'bangle',
  'Rings':           'ring',
  'Gents Rings':     'ring',
  'Bracelets':       'bracelet',
  'Gents Bracelets': 'bracelet',
  'Earrings':        'earring',
  'Necklaces':       'necklace',
}

export default function JewelleryTab() {
  const { items, loading, error, refetch, add, updateStatus, remove } = useJewellery()
  const { categories } = useCategories()
  const { templates }  = useProcessTemplates()
  const { calcPrice, formatPKR } = usePricing()

  const [search, setSearch]       = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState<string | null>(null)

  const filtered = items.filter(item => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku?.toLowerCase().includes(search.toLowerCase())
    const matchCat    = filterCat === 'all' || item.category_id === filterCat
    const matchStatus = filterStatus === 'all' || item.status === filterStatus
    return matchSearch && matchCat && matchStatus
  })

  const handleAdd = async (
    form: Omit<JewelleryItem, 'id' | 'sku' | 'created_at' | 'category' | 'processes'>,
    processes: Parameters<typeof add>[1]
  ) => {
    setSaving(true)
    try {
      await add(form, processes)
      setShowModal(false)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to add item')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return
    setDeleting(id)
    try { await remove(id) }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed to delete') }
    finally { setDeleting(null) }
  }

  const inStock   = items.filter(i => i.status === 'in_stock').length
  const sold      = items.filter(i => i.status === 'sold').length
  const reserved  = items.filter(i => i.status === 'reserved').length

  if (loading) return <LoadingSpinner text="Loading jewellery stock..." />
  if (error)   return <ErrorMessage message={error} onRetry={refetch} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'Total Pieces', value: String(items.length),   color: 'var(--gold)' },
          { label: 'In Stock',     value: String(inStock),        color: 'var(--success)' },
          { label: 'Sold',         value: String(sold),           color: 'var(--danger)' },
          { label: 'Reserved',     value: String(reserved),       color: 'var(--warning)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: '10px', padding: '16px 18px',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
              {s.label}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px',
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: '8px', padding: '8px 14px',
        }}>
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '13px', flex: 1 }}
          />
        </div>

        {/* Category filter */}
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: '8px', color: 'var(--text-muted)', fontSize: '12px',
            padding: '8px 12px', cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: '8px', color: 'var(--text-muted)', fontSize: '12px',
            padding: '8px 12px', cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="all">All Status</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <button onClick={() => setShowModal(true)} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 16px', background: 'rgba(201,168,76,0.12)',
          border: '0.5px solid var(--gold)', borderRadius: '8px',
          color: 'var(--gold)', fontSize: '13px', cursor: 'pointer',
          fontWeight: 500, whiteSpace: 'nowrap',
        }}>
          <Plus size={14} /> Add Piece
        </button>
      </div>

      {filtered.length === 0 && (
        <EmptyState
          message={search ? 'No pieces match your search.' : 'No jewellery stock yet. Add your first piece!'}
          action={!search ? (
            <button onClick={() => setShowModal(true)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', background: 'rgba(201,168,76,0.12)',
              border: '0.5px solid var(--gold)', borderRadius: '8px',
              color: 'var(--gold)', fontSize: '13px', cursor: 'pointer',
            }}>
              <Plus size={14} /> Add Piece
            </button>
          ) : undefined}
        />
      )}

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '14px',
      }}>
        {filtered.map(item => {
          const st     = STATUS_CONFIG[item.status]
          const price  = calcPrice(item, item.processes ?? [])
          const catName = (item.category as { name?: string })?.name ?? ''
          const shape  = SHAPE_MAP[catName] ?? 'bangle'

          return (
            <div key={item.id} style={{
              background: 'var(--surface)', border: '0.5px solid var(--border)',
              borderRadius: '10px', overflow: 'hidden',
              opacity: deleting === item.id ? 0.4 : 1,
              transition: 'opacity 0.2s',
            }}>
              {/* Photo / 3D Preview */}
              <div style={{
                height: '160px', background: 'var(--surface2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden',
                cursor: 'pointer',
              }}>
                {item.photos && item.photos.length > 0 ? (
                  <img
                    src={item.photos[0]}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  }}>
                    <Package size={32} style={{ color: 'var(--text-dim)' }} />
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>No photo</span>
                  </div>
                )}
                <div style={{
                  position: 'absolute', top: '8px', left: '8px',
                  fontSize: '10px', fontWeight: 500,
                  padding: '2px 8px', borderRadius: '99px',
                  color: st.color, background: st.bg,
                }}>
                  {st.label}
                </div>
                {item.karat && (
                  <div style={{
                    position: 'absolute', top: '8px', right: '8px',
                    fontSize: '10px', color: 'var(--gold)',
                    background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '99px',
                  }}>
                    {item.karat}
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: '14px' }}>
                <div style={{ fontSize: '10px', color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: '3px' }}>
                  {item.sku}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  {catName} · {item.weight_grams}g
                  {item.finish && ` · ${FINISH_LABELS[item.finish] ?? item.finish}`}
                </div>

                {/* Live Price */}
                <div style={{
                  background: 'var(--surface2)', border: '0.5px solid var(--border)',
                  borderRadius: '8px', padding: '8px 12px', marginBottom: '10px',
                }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
                    Live Price
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--gold)' }}>
                    {formatPKR(price.selling_price)}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '1px' }}>
                    Cost: {formatPKR(price.subtotal)}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Link href={`/inventory/${item.id}`} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '4px', padding: '7px',
                    background: 'rgba(201,168,76,0.1)', border: '0.5px solid var(--border-bright)',
                    borderRadius: '7px', color: 'var(--gold)', fontSize: '12px',
                    textDecoration: 'none', cursor: 'pointer',
                  }}>
                    <Eye size={12} /> View
                  </Link>
                  <select
                    value={item.status}
                    onChange={e => updateStatus(item.id, e.target.value as JewelleryItem['status'])}
                    style={{
                      flex: 1, background: 'var(--surface2)',
                      border: '0.5px solid var(--border)', borderRadius: '7px',
                      color: 'var(--text-muted)', fontSize: '11px',
                      padding: '6px 4px', cursor: 'pointer', outline: 'none',
                    }}
                  >
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <button onClick={() => handleDelete(item.id)} style={{
                    padding: '7px 10px', background: 'none',
                    border: '0.5px solid var(--border)', borderRadius: '7px',
                    color: 'var(--danger)', cursor: 'pointer',
                  }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <AddJewelleryModal
          onClose={() => setShowModal(false)}
          onSave={handleAdd}
          saving={saving}
          categories={categories}
          templates={templates}
        />
      )}
    </div>
  )
}