'use client'

import { useCallback } from 'react'
import { GOLD_RATES } from '@/lib/supabase_client'
import type { JewelleryItem, JewelleryProcess } from '@/hooks/useJewellery'

export type PriceBreakdown = {
  gold_cost:      number
  wastage_cost:   number
  labour_cost:    number
  overhead_cost:  number
  subtotal:       number
  profit:         number
  selling_price:  number
  rate_per_gram:  number
  wastage_pct:    number
}

export function usePricing() {

  const calcLabourCost = useCallback((
    processes: JewelleryProcess[]
  ): number => {
    return processes.reduce((total, process) => {
      const processTotal = (process.labourers ?? []).reduce((sum, l) => {
        return sum + (Number(l.wage) * Number(l.quantity))
      }, 0)
      return total + processTotal
    }, 0)
  }, [])

  const calcPrice = useCallback((
    item: Pick<JewelleryItem,
      'weight_grams' | 'karat' | 'overhead_pct' | 'profit_margin_pct'
    >,
    processes: JewelleryProcess[] = [],
    customGoldRates?: Record<string, number>
  ): PriceBreakdown => {
    const rates       = customGoldRates ?? GOLD_RATES
    const rate        = rates[item.karat ?? '22K'] ?? rates['22K']
    const wastage_pct = 2
    const weight      = Number(item.weight_grams)

    const gold_cost    = Math.round(weight * rate)
    const wastage_cost = Math.round(gold_cost * (wastage_pct / 100))
    const labour_cost  = Math.round(calcLabourCost(processes))
    const subtotal_pre = gold_cost + wastage_cost + labour_cost
    const overhead_cost = Math.round(subtotal_pre * (Number(item.overhead_pct) / 100))
    const subtotal      = subtotal_pre + overhead_cost
    const profit        = Math.round(subtotal * (Number(item.profit_margin_pct) / 100))
    const selling_price = subtotal + profit

    return {
      gold_cost,
      wastage_cost,
      labour_cost,
      overhead_cost,
      subtotal,
      profit,
      selling_price,
      rate_per_gram: rate,
      wastage_pct,
    }
  }, [calcLabourCost])

  const formatPKR = (amount: number) =>
    `₨ ${Math.round(amount).toLocaleString('en-PK')}`

  return { calcPrice, calcLabourCost, formatPKR }
}