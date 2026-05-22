'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase_client'

export type Bundle = {
  id: string
  bundle_item_id: string
  component_item_id: string
  quantity: number
  created_at: string
  component?: {
    id: string
    sku: string
    name: string
    status: string
    weight_grams: number
    karat: string
  }
}

export function useBundles(bundleItemId?: string) {
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!bundleItemId) return
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('bundles')
      .select(`
        *,
        component:jewellery_items!bundles_component_item_id_fkey(
          id, sku, name, status, weight_grams, karat
        )
      `)
      .eq('bundle_item_id', bundleItemId)
    if (error) setError(error.message)
    else setBundles((data ?? []) as Bundle[])
    setLoading(false)
  }, [bundleItemId])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch() }, [fetch])

  const addComponent = async (
    bundleId: string,
    componentId: string,
    quantity: number = 1
  ) => {
    const { data, error } = await supabase
      .from('bundles')
      .insert({
        bundle_item_id:    bundleId,
        component_item_id: componentId,
        quantity,
      })
      .select(`
        *,
        component:jewellery_items!bundles_component_item_id_fkey(
          id, sku, name, status, weight_grams, karat
        )
      `)
      .single()
    if (error) throw new Error(error.message)
    setBundles(prev => [...prev, data as Bundle])
    return data as Bundle
  }

  const removeComponent = async (id: string) => {
    const { error } = await supabase
      .from('bundles')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
    setBundles(prev => prev.filter(b => b.id !== id))
  }

  const breakSet = async (bundleItemId: string) => {
    const { error } = await supabase
      .from('bundles')
      .delete()
      .eq('bundle_item_id', bundleItemId)
    if (error) throw new Error(error.message)

    await supabase
      .from('jewellery_items')
      .update({ item_type: 'standalone', status: 'in_stock' })
      .eq('id', bundleItemId)

    setBundles([])
  }

  const isBundleAvailable = (bundles: Bundle[]): boolean => {
    return bundles.every(b => b.component?.status === 'in_stock')
  }

  return {
    bundles, loading, error,
    refetch: fetch,
    addComponent, removeComponent,
    breakSet, isBundleAvailable,
  }
}