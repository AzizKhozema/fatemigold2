/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase_client'

export type Category = {
  id: string
  name: string
  parent_id: string | null
  sku_prefix: string
  icon: string
  sort_order: number
  created_at: string
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) setError(error.message)
    else setCategories(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const add = async (cat: Omit<Category, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('categories')
      .insert(cat)
      .select()
      .single()
    if (error) throw new Error(error.message)
    setCategories(prev => [...prev, data])
    return data
  }

  const update = async (id: string, updates: Partial<Category>) => {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    setCategories(prev => prev.map(c => c.id === id ? data : c))
    return data
  }

  const remove = async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  return { categories, loading, error, refetch: fetch, add, update, remove }
}