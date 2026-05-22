'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase_client'
import type { LabourTask } from '@/lib/types'

export function useLabour() {
  const [tasks, setTasks]     = useState<LabourTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('labour_tasks')
      .select(`
        *,
        employee:employees(id, name, role),
        order:orders(id, order_number)
      `)
      .order('assigned_at', { ascending: false })
    if (error) setError(error.message)
    else setTasks((data ?? []) as LabourTask[])
    setLoading(false)
  }, [])
// eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch() }, [fetch])

  const add = async (task: Omit<LabourTask, 'id' | 'assigned_at' | 'completed_at'>) => {
    const { data, error } = await supabase
      .from('labour_tasks')
      .insert(task)
      .select(`*, employee:employees(id, name, role), order:orders(id, order_number)`)
      .single()
    if (error) throw new Error(error.message)
    setTasks(prev => [data as LabourTask, ...prev])
    return data as LabourTask
  }

  const update = async (id: string, updates: Partial<LabourTask>) => {
    const payload = {
      ...updates,
      ...(updates.status === 'completed' && { completed_at: new Date().toISOString() }),
    }
    const { data, error } = await supabase
      .from('labour_tasks')
      .update(payload)
      .eq('id', id)
      .select(`*, employee:employees(id, name, role), order:orders(id, order_number)`)
      .single()
    if (error) throw new Error(error.message)
    setTasks(prev => prev.map(t => t.id === id ? data as LabourTask : t))
    return data as LabourTask
  }

  const remove = async (id: string) => {
    const { error } = await supabase
      .from('labour_tasks')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  return { tasks, loading, error, refetch: fetch, add, update, remove }
}