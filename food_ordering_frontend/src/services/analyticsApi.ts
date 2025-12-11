import { getApiBase } from './runtimeConfig'
import type { DateRange, DailySalesPoint, PeakHourPoint, TopItem, AnalyticsSummary } from '@/types/analytics'

type CacheKey = string

const memCache = new Map<CacheKey, Promise<any>>()

function key(parts: Record<string, unknown>): CacheKey {
  return JSON.stringify(parts)
}

function shouldUseMock(): boolean {
  const base = getApiBase()
  return !base
}

function daysBack(n: number): string[] {
  const out: string[] = []
  const today = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function mockDaily(range: DateRange): DailySalesPoint[] {
  const dates = daysBack(range)
  return dates.map((date) => {
    const orders = rand(12, 90)
    const totalCents = orders * rand(1200, 2800)
    return { date, orders, totalCents }
  })
}

function mockPeak(range: DateRange): PeakHourPoint[] {
  // Bias toward lunchtime 11-14 and dinner 18-21 on Fri/Sat/Sun
  const pts: PeakHourPoint[] = []
  for (let dow = 0; dow < 7; dow++) {
    for (let h = 0; h < 24; h++) {
      const base = (h >= 11 && h <= 14) || (h >= 18 && h <= 21) ? 6 : 2
      const weekendBoost = dow === 5 || dow === 6 ? 1.4 : dow === 0 ? 1.2 : 1.0
      const count = Math.max(0, Math.round(rand(0, base) * weekendBoost))
      pts.push({ dow, hour: h, count })
    }
  }
  return pts
}

const SAMPLE_ITEMS = [
  { id: 'i_burger', name: 'Classic Burger' },
  { id: 'i_pizza', name: 'Neapolitan Pizza' },
  { id: 'i_salad', name: 'Caesar Salad' },
  { id: 'i_taco', name: 'Chicken Tacos' },
  { id: 'i_pasta', name: 'Pesto Pasta' },
  { id: 'i_bowl', name: 'Veggie Bowl' },
]

function mockTop(range: DateRange): TopItem[] {
  const items = SAMPLE_ITEMS.map((it) => {
    const count = rand(50, 400) * (range === 30 ? 2 : 1)
    const revenueCents = count * rand(900, 2200)
    return { ...it, count, revenueCents }
  }).sort((a, b) => b.count - a.count)
  return items.slice(0, 5)
}

/**
 * PUBLIC_INTERFACE
 * Load daily sales analytics.
 */
export async function getDailySales(range: DateRange): Promise<DailySalesPoint[]> {
  const k = key({ t: 'daily', range })
  const cached = memCache.get(k)
  if (cached) return cached
  const p = (async () => {
    if (shouldUseMock()) return mockDaily(range)
    try {
      const base = getApiBase()!
      const url = `${String(base).replace(/\/+$/, '')}/analytics/daily-sales?range=${range}`
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    } catch {
      return mockDaily(range)
    }
  })()
  memCache.set(k, p)
  return p
}

/**
 * PUBLIC_INTERFACE
 * Load peak hour analytics.
 */
export async function getPeakHours(range: DateRange): Promise<PeakHourPoint[]> {
  const k = key({ t: 'peak', range })
  const cached = memCache.get(k)
  if (cached) return cached
  const p = (async () => {
    if (shouldUseMock()) return mockPeak(range)
    try {
      const base = getApiBase()!
      const url = `${String(base).replace(/\/+$/, '')}/analytics/peak-hours?range=${range}`
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    } catch {
      return mockPeak(range)
    }
  })()
  memCache.set(k, p)
  return p
}

/**
 * PUBLIC_INTERFACE
 * Load most-ordered items analytics.
 */
export async function getTopItems(range: DateRange): Promise<TopItem[]> {
  const k = key({ t: 'top', range })
  const cached = memCache.get(k)
  if (cached) return cached
  const p = (async () => {
    if (shouldUseMock()) return mockTop(range)
    try {
      const base = getApiBase()!
      const url = `${String(base).replace(/\/+$/, '')}/analytics/top-items?range=${range}`
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    } catch {
      return mockTop(range)
    }
  })()
  memCache.set(k, p)
  return p
}

/**
 * PUBLIC_INTERFACE
 * Convenience to fetch all sections at once.
 */
export async function getSummary(range: DateRange): Promise<AnalyticsSummary> {
  const [dailySales, peakHours, topItems] = await Promise.all([
    getDailySales(range),
    getPeakHours(range),
    getTopItems(range),
  ])
  return { range, dailySales, peakHours, topItems }
}
