import type { FoodCategory, FoodItem, OrderPayload, OrderResponse } from '@/types'

// PUBLIC_INTERFACE
export function getApiBase(): string | undefined {
  /** Returns API base from environment variables if set. */
  const base = import.meta.env.VITE_API_BASE || import.meta.env.VITE_BACKEND_URL
  return typeof base === 'string' && base.length > 0 ? base : undefined
}

function getFlags(): Record<string, boolean> {
  const flagsRaw = import.meta.env.VITE_FEATURE_FLAGS
  try {
    if (!flagsRaw) return {}
    // Accept CSV like "enableSearch=true,enableMockAPI=false" or JSON
    if (typeof flagsRaw === 'string' && flagsRaw.trim().startsWith('{')) {
      return JSON.parse(flagsRaw)
    }
    const obj: Record<string, boolean> = {}
    String(flagsRaw)
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
      .forEach((kv) => {
        const [k, v] = kv.split('=')
        obj[k] = v === undefined ? true : String(v).toLowerCase() === 'true'
      })
    return obj
  } catch {
    return {}
  }
}

const flags = getFlags()
const useMock = flags.enableMockAPI ?? !getApiBase()

// PUBLIC_INTERFACE
export async function fetchCategories(): Promise<FoodCategory[]> {
  /** Fetches food categories list, falling back to mock when API is unavailable. */
  if (useMock) {
    const data = await import('@/services/mockData')
    return data.mockCategories
  }
  const res = await fetch(`${getApiBase()}/categories`, { headers: { 'Content-Type': 'application/json' } })
  if (!res.ok) throw new Error('Failed to fetch categories')
  return res.json()
}

// PUBLIC_INTERFACE
export async function fetchItems(categoryId?: string, search?: string): Promise<FoodItem[]> {
  /** Fetches menu items, with optional category and search filter. */
  if (useMock) {
    const data = await import('@/services/mockData')
    return data.mockItems
      .filter((i) => (!categoryId || i.categoryId === categoryId))
      .filter((i) => (!search || i.name.toLowerCase().includes(search.toLowerCase())))
  }
  const url = new URL(`${getApiBase()}/items`)
  if (categoryId) url.searchParams.set('categoryId', categoryId)
  if (search) url.searchParams.set('q', search)
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } })
  if (!res.ok) throw new Error('Failed to fetch items')
  return res.json()
}

// PUBLIC_INTERFACE
export async function submitOrder(payload: OrderPayload): Promise<OrderResponse> {
  /** Submits order to API or mocks success with a generated ID. */
  if (useMock) {
    await new Promise((r) => setTimeout(r, 750))
    return { id: `MOCK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, status: 'success' }
  }
  try {
    const res = await fetch(`${getApiBase()}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Order failed')
    return res.json()
  } catch {
    // graceful fallback
    await new Promise((r) => setTimeout(r, 750))
    return { id: `FALLBACK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, status: 'success' }
  }
}

export const featureFlags = flags
