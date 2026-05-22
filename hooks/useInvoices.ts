'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase_client'
import type { Invoice } from '@/lib/types'

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(id, name, phone, city),
        order:orders(id, order_number, status)
      `)
      .order('issued_at', { ascending: false })
    if (error) setError(error.message)
    else setInvoices((data ?? []) as Invoice[])
    setLoading(false)
  }, [])
// eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch() }, [fetch])

  const add = async (invoice: Omit<Invoice, 'id' | 'invoice_number' | 'issued_at'>) => {
    const { data, error } = await supabase
      .from('invoices')
      .insert(invoice)
      .select(`
        *,
        customer:customers(id, name, phone, city),
        order:orders(id, order_number, status)
      `)
      .single()
    if (error) throw new Error(error.message)
    setInvoices(prev => [data as Invoice, ...prev])
    return data as Invoice
  }

  const update = async (id: string, updates: Partial<Invoice>) => {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        customer:customers(id, name, phone, city),
        order:orders(id, order_number, status)
      `)
      .single()
    if (error) throw new Error(error.message)
    setInvoices(prev => prev.map(i => i.id === id ? data as Invoice : i))
    return data as Invoice
  }

  const remove = async (id: string) => {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
    setInvoices(prev => prev.filter(i => i.id !== id))
  }

  return { invoices, loading, error, refetch: fetch, add, update, remove }
}