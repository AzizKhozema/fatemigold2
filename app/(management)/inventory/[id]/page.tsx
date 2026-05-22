'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Upload, Trash2, RotateCcw,
  ChevronDown, ChevronUp, Edit2, Package,
} from 'lucide-react'
import { useJewellery } from '@/hooks/useJewellery'
import { usePricing } from '@/hooks/usePricing'
import { useBundles } from '@/hooks/useBundles'
import { LoadingSpinner, ErrorMessage } from '@/app/components/ui/LoadingSpinner'
import ThreeDViewer from '@/app/components/ui/ThreeDViewer'
import type { JewelleryItem } from '@/hooks/useJewellery'
import { GOLD_RATES } from '@/lib/supabase_client'

const STATUS_CONFIG = {
  in_stock:  { label: 'In Stock',  color: '#4ade80', bg: 'rgba(39,174,96,0.12)' },
  sold:      { label: 'Sold',      color: '#f87171', bg: 'rgba(192,57,43,0.12)' },
  reserved:  { label: 'Reserved',  color: '#E8C97A', bg: 'rgba(201,168,76,0.12)' },
  on_order:  { label: 'On Order',  color: '#7eb8f7', bg: 'rgba(74,130,200,0.12)' },
}

const FINISH_LABELS: Record<string, string> = {
  high_polish: 'High Polish', matte: 'Matte',
  rhodium: 'Rhodium', antique: 'Antique', two_tone: 'Two Tone',
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

export default function JewelleryItemPage() {
  const { id }    = useParams<{ id: string }>()
  const router    = useRouter()
  const { fetchOne, updateStatus, uploadPhoto, remove, items } = useJewellery()
  const { calcPrice, formatPKR } = usePricing()
  const { bundles, breakSet, isBundleAvailable } = useBundles(id)

  const [item, setItem]           = useState<JewelleryItem | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [showCost, setShowCost]   = useState(false)
  const [activePhoto, setActivePhoto] = useState(0)
  const [viewMode, setViewMode]   = useState<'photo' | '3d'>('3d')
  const [uploading, setUploading] = useState(false)
  const [similarItems, setSimilarItems] = useState<JewelleryItem[]>([])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchOne(id)
      .then(data => {
        setItem(data)
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    if (!item) return
    const similar = items
      .filter(i => i.id !== item.id && i.category_id === item.category_id)
      .slice(0, 4)
    setSimilarItems(similar)
  }, [item, items])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !item) return
    setUploading(true)
    try {
      const url = await uploadPhoto(item.id, file)
      setItem(prev => prev ? { ...prev, photos: [...(prev.photos ?? []), url] } : prev)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleStatusChange = async (status: JewelleryItem['status']) => {
    if (!item) return
    try {
      await updateStatus(item.id, status)
      setItem(prev => prev ? { ...prev, status } : prev)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to update status')
    }
  }

  const handleDelete = async () => {
    if (!item || !confirm('Delete this piece permanently?')) return
    await remove(item.id)
    router.push('/inventory')
  }

  const handleBreakSet = async () => {
    if (!item || !confirm('Break this set? Components will return to standalone stock.')) return
    await breakSet(item.id)
    setItem(prev => prev ? { ...prev, item_type: 'standalone' } : prev)
  }

  if (loading) return <LoadingSpinner text="Loading piece..." />
  if (error)   return <ErrorMessage message={error} />
  if (!item)   return <ErrorMessage message="Item not found" />

  const price    = calcPrice(item, item.processes ?? [])
  const st       = STATUS_CONFIG[item.status]
  const catName  = (item.category as { name?: string })?.name ?? ''
  const shape    = SHAPE_MAP[catName] ?? 'bangle'
  const photos   = item.photos ?? []
  const bundleAvailable = isBundleAvailable(bundles)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Back */}
      <button onClick={() => router.back()} style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-muted)', fontSize: '13px', width: 'fit-content',
      }}>
        <ArrowLeft size={14} /> Back to Inventory
      </button>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* Left — Viewer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* View Toggle */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: '8px', padding: '3px', width: 'fit-content' }}>
            {(['3d', 'photo'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                padding: '5px 14px', borderRadius: '5px', fontSize: '12px', cursor: 'pointer',
                border: 'none',
                background: viewMode === mode ? 'rgba(201,168,76,0.15)' : 'transparent',
                color: viewMode === mode ? 'var(--gold)' : 'var(--text-muted)',
              }}>
                {mode === '3d' ? '3D View' : 'Photos'}
              </button>
            ))}
          </div>

          {/* 3D Viewer */}
          {viewMode === '3d' && (
            <ThreeDViewer shape={shape} karat={item.karat ?? '22K'} size={360} />
          )}

          {/* Photo Viewer */}
          {viewMode === 'photo' && (
            <div>
              <div style={{
                height: '320px', background: 'var(--surface)',
                border: '0.5px solid var(--border)', borderRadius: '10px',
                overflow: 'hidden', position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {photos.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photos[activePhoto]}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
                    <Package size={48} style={{ marginBottom: '8px', opacity: 0.3 }} />
                    <div style={{ fontSize: '13px' }}>No photos yet</div>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {photos.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', overflowX: 'auto' }}>
                  {photos.map((url, i) => (
                    <div key={i} onClick={() => setActivePhoto(i)} style={{
                      width: '60px', height: '60px', borderRadius: '8px',
                      border: `0.5px solid ${activePhoto === i ? 'var(--gold)' : 'var(--border)'}`,
                      overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                    }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}

              {/* Upload */}
              <label style={{
                display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px',
                padding: '8px 14px', background: 'var(--surface)',
                border: '0.5px dashed var(--border)', borderRadius: '8px',
                color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer',
                width: 'fit-content',
              }}>
                <Upload size={13} />
                {uploading ? 'Uploading...' : 'Upload Photo'}
                <input type="file" accept="image/*" onChange={handlePhotoUpload}
                  style={{ display: 'none' }} />
              </label>
            </div>
          )}
        </div>

        {/* Right — Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* SKU + Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--gold)', letterSpacing: '0.1em' }}>
              {item.sku}
            </span>
            <span style={{
              fontSize: '11px', padding: '2px 10px', borderRadius: '99px',
              color: st.color, background: st.bg, fontWeight: 500,
            }}>
              {st.label}
            </span>
            {item.item_type === 'bundle' && (
              <span style={{
                fontSize: '11px', padding: '2px 10px', borderRadius: '99px',
                color: '#b89ee8', background: 'rgba(138,110,180,0.12)', fontWeight: 500,
              }}>
                Set
              </span>
            )}
          </div>

          {/* Name */}
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--text)', lineHeight: 1.2 }}>
              {item.name}
            </h1>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {catName} · {item.karat} · {item.weight_grams}g
            </div>
          </div>

          {/* Live Price */}
          <div style={{
            background: 'var(--surface)', border: '0.5px solid var(--border-bright)',
            borderRadius: '10px', padding: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                  Live Selling Price
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--gold)' }}>
                  {formatPKR(price.selling_price)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Rate: ₨{price.rate_per_gram.toLocaleString()}/g · Updates with gold rate
                </div>
              </div>
              <button
                onClick={() => setShowCost(!showCost)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  background: 'none', border: '0.5px solid var(--border)',
                  borderRadius: '6px', padding: '5px 10px',
                  color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer',
                }}
              >
                {showCost ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showCost ? 'Hide Cost' : 'Show Cost'}
              </button>
            </div>

            {showCost && (
              <div style={{
                borderTop: '0.5px solid var(--border)', paddingTop: '12px',
                display: 'flex', flexDirection: 'column', gap: '6px',
              }}>
                {[
                  { label: 'Gold Cost',    value: price.gold_cost,     color: 'var(--text)' },
                  { label: 'Wastage (2%)', value: price.wastage_cost,  color: 'var(--text)' },
                  { label: 'Labour',       value: price.labour_cost,   color: 'var(--text)' },
                  { label: `Overhead (${item.overhead_pct}%)`, value: price.overhead_cost, color: 'var(--text)' },
                  { label: 'Cost Price',   value: price.subtotal,      color: 'var(--text)', bold: true },
                  { label: `Margin (${item.profit_margin_pct}%)`, value: price.profit, color: '#4ade80' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.label}</span>
                    <span style={{ fontSize: row.bold ? '13px' : '12px', color: row.color, fontWeight: row.bold ? 500 : 400 }}>
                      {formatPKR(row.value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Specifications */}
          <div style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: '10px', padding: '16px',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
              Specifications
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Karat',    value: item.karat ?? '—' },
                { label: 'Weight',   value: `${item.weight_grams}g` },
                { label: 'Finish',   value: FINISH_LABELS[item.finish] ?? item.finish },
                { label: 'Size',     value: item.size ?? '—' },
                { label: 'Stone',    value: item.stone_type ?? 'None' },
                { label: 'Stone Qty', value: item.stone_count > 0 ? String(item.stone_count) : '—' },
                { label: 'Length',   value: item.length_mm ? `${item.length_mm}mm` : '—' },
                { label: 'Width',    value: item.width_mm ? `${item.width_mm}mm` : '—' },
              ].map(spec => (
                <div key={spec.label}>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
                    {spec.label}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text)' }}>{spec.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Update */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <button key={k} onClick={() => handleStatusChange(k as JewelleryItem['status'])} style={{
                padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                border: '0.5px solid',
                borderColor: item.status === k ? v.color : 'var(--border)',
                background: item.status === k ? v.bg : 'var(--surface)',
                color: item.status === k ? v.color : 'var(--text-muted)',
              }}>
                {v.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {item.item_type === 'bundle' && (
              <button onClick={handleBreakSet} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', background: 'rgba(230,126,34,0.1)',
                border: '0.5px solid var(--warning)', borderRadius: '8px',
                color: 'var(--warning)', fontSize: '12px', cursor: 'pointer',
              }}>
                <RotateCcw size={13} /> Break Set
              </button>
            )}
            <button onClick={handleDelete} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', background: 'rgba(192,57,43,0.1)',
              border: '0.5px solid var(--danger)', borderRadius: '8px',
              color: 'var(--danger)', fontSize: '12px', cursor: 'pointer',
            }}>
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Processes */}
      {item.processes && item.processes.length > 0 && (
        <div style={{
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: '10px', padding: '20px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '16px' }}>
            Production Processes
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {item.processes.map(proc => (
              <div key={proc.id} style={{
                background: 'var(--surface2)', border: '0.5px solid var(--border)',
                borderRadius: '8px', padding: '14px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>
                    {proc.process_name}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--gold)' }}>
                    ₨ {(proc.labourers ?? []).reduce((s, l) => s + Number(l.wage) * Number(l.quantity), 0).toLocaleString()}
                  </span>
                </div>
                {(proc.labourers ?? []).map(lab => (
                  <div key={lab.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '5px 0', borderTop: '0.5px solid var(--border)',
                  }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{lab.labourer_name || 'Unnamed'}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      ₨{Number(lab.wage).toLocaleString()} × {lab.quantity} = {' '}
                      <span style={{ color: 'var(--success)' }}>
                        ₨{(Number(lab.wage) * Number(lab.quantity)).toLocaleString()}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bundle Components */}
      {item.item_type === 'bundle' && bundles.length > 0 && (
        <div style={{
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: '10px', padding: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>
              Set Components
            </span>
            <span style={{
              fontSize: '11px', padding: '2px 10px', borderRadius: '99px',
              color: bundleAvailable ? '#4ade80' : '#f87171',
              background: bundleAvailable ? 'rgba(39,174,96,0.12)' : 'rgba(192,57,43,0.12)',
            }}>
              {bundleAvailable ? 'Available' : 'Unavailable'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {bundles.map(b => {
              const comp   = b.component
              const compSt = comp ? STATUS_CONFIG[comp.status as keyof typeof STATUS_CONFIG] : null
              return (
                <div key={b.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 14px', background: 'var(--surface2)',
                  border: '0.5px solid var(--border)', borderRadius: '8px',
                }}>
                  <Package size={14} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', color: 'var(--text)' }}>{comp?.name ?? '—'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                      {comp?.sku} · {comp?.karat} · {comp?.weight_grams}g
                    </div>
                  </div>
                  {compSt && (
                    <span style={{
                      fontSize: '10px', padding: '2px 8px', borderRadius: '99px',
                      color: compSt.color, background: compSt.bg,
                    }}>
                      {compSt.label}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Notes */}
      {item.notes && (
        <div style={{
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: '10px', padding: '16px 20px',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
            Notes
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {item.notes}
          </div>
        </div>
      )}

      {/* Similar Items */}
      {similarItems.length > 0 && (
        <div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '14px' }}>
            Similar Pieces
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {similarItems.map(similar => {
              const simPrice = calcPrice(similar, similar.processes ?? [])
              const simSt    = STATUS_CONFIG[similar.status]
              return (
                <a key={similar.id} href={`/inventory/${similar.id}`} style={{
                  background: 'var(--surface)', border: '0.5px solid var(--border)',
                  borderRadius: '10px', overflow: 'hidden', textDecoration: 'none',
                  display: 'block',
                }}>
                  <div style={{
                    height: '100px', background: 'var(--surface2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    {similar.photos?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={similar.photos[0]} alt={similar.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Package size={24} style={{ color: 'var(--text-dim)' }} />
                    )}
                  </div>
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--gold)', marginBottom: '2px' }}>
                      {similar.sku}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500, marginBottom: '4px' }}>
                      {similar.name}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--gold)' }}>
                        {formatPKR(simPrice.selling_price)}
                      </span>
                      <span style={{
                        fontSize: '9px', padding: '1px 6px', borderRadius: '99px',
                        color: simSt.color, background: simSt.bg,
                      }}>
                        {simSt.label}
                      </span>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}