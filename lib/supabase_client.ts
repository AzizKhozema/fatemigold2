import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

export const GOLD_RATES: Record<string, number> = {
  '24K': 32450,
  '22K': 29745,
  '21K': 28390,
  '18K': 24340,
  '14K': 18920,
}

export function formatPKR(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style:                 'currency',
    currency:              'PKR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatWeight(grams: number): string {
  return `${grams.toFixed(2)}g`
}

export function calcGoldValue(grams: number, karat: string): number {
  const rate = GOLD_RATES[karat] ?? GOLD_RATES['24K']
  return Math.round(grams * rate)
}