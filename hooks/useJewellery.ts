'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase_client'

export type JewelleryProcess = {
  id: string
  item_id: string
  process_template_id: string | null
  process_name: string
  unit: string
  quantity: number
  labourers: ProcessLabourer[]
}

export type ProcessLabourer = {
  id: string
  jewellery_process_id: string
  employee_id: string | null
  labourer_name: string
  wage: number
  quantity: number
  notes: string | null
}

export type JewelleryItem = {
  id: string
  sku: string
  name: string
  category_id: string | null
  category?: { id: string; name: string; sku_prefix: string; icon: string }
  karat: string | null
  weight_grams: number
  purity: number | null
  item_type: 'standalone' | 'component' | 'bundle'
  status: 'in_stock' | 'sold' | 'reserved' | 'on_order'
  size: string | null
  length_mm: number | null
  width_mm: number | null
  stone_type: string | null
  stone_count: number
  stone_weight_carats: number | null
  finish: string
  overhead_pct: number
  profit_margin_pct: number
  notes: string | null
  photos: string[]
  has_360: boolean
  model_type: 'spinner' | 'threejs' | 'none'
  created_at: string
  processes?: JewelleryProcess[]
}

export function useJewellery() {
  const [items, setItems]     = useState<JewelleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('jewellery_items')
      .select(`
        *,
        category:categories(id, name, sku_prefix, icon)
      `)
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setItems((data ?? []) as JewelleryItem[])
    setLoading(false)
  }, [])
// eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch() }, [fetch])

  const fetchOne = async (id: string): Promise<JewelleryItem | null> => {
    const { data, error } = await supabase
      .from('jewellery_items')
      .select(`
        *,
        category:categories(id, name, sku_prefix, icon),
        processes:jewellery_processes(
          *,
          labourers:process_labourers(*)
        )
      `)
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    return data as JewelleryItem
  }

  const add = async (
    item: Omit<JewelleryItem, 'id' | 'sku' | 'created_at' | 'category' | 'processes'>,
    processes?: {
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
  ) => {
    const { data, error } = await supabase
      .from('jewellery_items')
      .insert(item)
      .select(`*, category:categories(id, name, sku_prefix, icon)`)
      .single()
    if (error) throw new Error(error.message)

    if (processes && processes.length > 0 && data?.id) {
      for (const p of processes) {
        const { data: procData, error: procError } = await supabase
          .from('jewellery_processes')
          .insert({
            item_id:             data.id,
            process_template_id: p.process_template_id,
            process_name:        p.process_name,
            unit:                p.unit,
            quantity:            p.quantity,
          })
          .select()
          .single()
        if (procError) continue

        if (p.labourers.length > 0) {
          await supabase.from('process_labourers').insert(
            p.labourers.map(l => ({
              jewellery_process_id: procData.id,
              employee_id:          l.employee_id,
              labourer_name:        l.labourer_name,
              wage:                 l.wage,
              quantity:             l.quantity,
              notes:                l.notes,
            }))
          )
        }
      }
    }

    await fetch()
    return data as JewelleryItem
  }

  const update = async (id: string, updates: Partial<JewelleryItem>) => {
    const { data, error } = await supabase
      .from('jewellery_items')
      .update(updates)
      .eq('id', id)
      .select(`*, category:categories(id, name, sku_prefix, icon)`)
      .single()
    if (error) throw new Error(error.message)
    setItems(prev => prev.map(i => i.id === id ? data as JewelleryItem : i))
    return data as JewelleryItem
  }

  const updateStatus = async (id: string, status: JewelleryItem['status']) => {
    return update(id, { status })
  }

  const remove = async (id: string) => {
    const { error } = await supabase
      .from('jewellery_items')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const uploadPhoto = async (itemId: string, file: File): Promise<string> => {
    const ext      = file.name.split('.').pop()
    const path     = `jewellery/${itemId}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('jewellery-photos')
      .upload(path, file, { upsert: true })
    if (uploadError) throw new Error(uploadError.message)

    const { data: urlData } = supabase.storage
      .from('jewellery-photos')
      .getPublicUrl(path)

    const url = urlData.publicUrl
    const item = items.find(i => i.id === itemId)
    const photos = [...(item?.photos ?? []), url]
    await update(itemId, { photos })
    return url
  }

  return {
    items, loading, error,
    refetch: fetch, fetchOne,
    add, update, updateStatus,
    remove, uploadPhoto,
  }
}