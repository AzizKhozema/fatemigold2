'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase_client'
import type { Order } from '@/lib/types'

export function useOrders() {
  const [orders, setOrders]   = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(id, name, phone, city),
        order_items(*)
      `)
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setOrders((data ?? []) as Order[])
    setLoading(false)
  }, [])
// eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch() }, [fetch])

  const add = async (
  order: Omit<Order, 'id' | 'order_number' | 'balance_due' | 'payment_status' | 'created_at' | 'order_items'>,
  itemData?: { product_name: string; karat: string; weight_grams: number; making_charges: number; amount: number }
) => {
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select(`*, customer:customers(id, name, phone, city), order_items(*)`)
    .single()
  if (error) throw new Error(error.message)

  if (itemData && data?.id) {
    await supabase.from('order_items').insert({
      order_id:       data.id,
      product_name:   itemData.product_name,
      karat:          itemData.karat,
      weight_grams:   itemData.weight_grams,
      quantity:       1,
      making_charges: itemData.making_charges,
      amount:         itemData.amount,
    })
  }

  await fetch()
  return data as Order
}

  const update = async (id: string, updates: Partial<Order>) => {
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select(`*, customer:customers(id, name, phone, city), order_items(*)`)
      .single()
    if (error) throw new Error(error.message)
    setOrders(prev => prev.map(o => o.id === id ? data as Order : o))
    return data as Order
  }

  const remove = async (id: string) => {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
    setOrders(prev => prev.filter(o => o.id !== id))
  }

  return { orders, loading, error, refetch: fetch, add, update, remove }
}