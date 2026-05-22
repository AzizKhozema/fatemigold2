'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase_client'
import type { InventoryItem } from '@/lib/types'

export function useInventory() {
  const [items, setItems]     = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('material', { ascending: true })
    if (error) setError(error.message)
    else setItems(data ?? [])
    setLoading(false)
  }, [])
// eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch() }, [fetch])

  const add = async (item: Omit<InventoryItem, 'id' | 'last_updated'>) => {
    const { data, error } = await supabase
      .from('inventory')
      .insert(item)
      .select()
      .single()
    if (error) throw new Error(error.message)
    setItems(prev => [...prev, data])
    return data
  }

  const update = async (id: string, updates: Partial<InventoryItem>) => {
    const { data, error } = await supabase
      .from('inventory')
      .update({ ...updates, last_updated: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    setItems(prev => prev.map(i => i.id === id ? data : i))
    return data
  }

  const remove = async (id: string) => {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return { items, loading, error, refetch: fetch, add, update, remove }
}
