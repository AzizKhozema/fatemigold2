'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase_client'

export type ProcessTemplate = {
  id: string
  name: string
  unit: 'per_piece' | 'per_gram' | 'per_stone' | 'per_hour'
  base_wage: number
  description: string | null
  created_at: string
}

export function useProcessTemplates() {
  const [templates, setTemplates] = useState<ProcessTemplate[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('process_templates')
      .select('*')
      .order('name', { ascending: true })
    if (error) setError(error.message)
    else setTemplates(data ?? [])
    setLoading(false)
  }, [])
// eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch() }, [fetch])

  const add = async (t: Omit<ProcessTemplate, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('process_templates')
      .insert(t)
      .select()
      .single()
    if (error) throw new Error(error.message)
    setTemplates(prev => [...prev, data])
    return data
  }

  const update = async (id: string, updates: Partial<ProcessTemplate>) => {
    const { data, error } = await supabase
      .from('process_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    setTemplates(prev => prev.map(t => t.id === id ? data : t))
    return data
  }

  const remove = async (id: string) => {
    const { error } = await supabase
      .from('process_templates')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  return { templates, loading, error, refetch: fetch, add, update, remove }
}