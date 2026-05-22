'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase_client'
import type { Employee } from '@/lib/types'

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name', { ascending: true })
    if (error) setError(error.message)
    else setEmployees(data ?? [])
    setLoading(false)
  }, [])
// eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch() }, [fetch])

  const add = async (emp: Omit<Employee, 'id'>) => {
    const { data, error } = await supabase
      .from('employees')
      .insert(emp)
      .select()
      .single()
    if (error) throw new Error(error.message)
    setEmployees(prev => [...prev, data])
    return data
  }

  const update = async (id: string, updates: Partial<Employee>) => {
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    setEmployees(prev => prev.map(e => e.id === id ? data : e))
    return data
  }

  const remove = async (id: string) => {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
    setEmployees(prev => prev.filter(e => e.id !== id))
  }

  return { employees, loading, error, refetch: fetch, add, update, remove }
}