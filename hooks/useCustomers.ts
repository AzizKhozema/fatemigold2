'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase_client'
import type { Customer } from '@/lib/types'

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setCustomers(data ?? [])
    setLoading(false)
  }, [])
// eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch() }, [fetch])

  const add = async (customer: Omit<Customer, 'id' | 'created_at' | 'total_orders' | 'total_spent'>) => {
    const { data, error } = await supabase
      .from('customers')
      .insert(customer)
      .select()
      .single()
    if (error) throw new Error(error.message)
    setCustomers(prev => [data, ...prev])
    return data
  }

  const update = async (id: string, updates: Partial<Customer>) => {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    setCustomers(prev => prev.map(c => c.id === id ? data : c))
    return data
  }

  const remove = async (id: string) => {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
    setCustomers(prev => prev.filter(c => c.id !== id))
  }

  return { customers, loading, error, refetch: fetch, add, update, remove }
}