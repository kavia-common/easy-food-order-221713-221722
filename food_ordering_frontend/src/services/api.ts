import type { FoodCategory, FoodItem, OrderPayload, OrderResponse } from '@/types'

/**
 * Small util to validate a base URL.
 */
function isValidBaseUrl(v: unknown): v is string {
  if (typeof v !== 'string' || v.trim().length === 0) return false
  // Allow http(s) URLs; tolerate trailing slashes
  try {
    // Attempt to construct a URL (relative allowed by providing a base)
    // If it's a relative like '/api', allow it as well (Vite dev proxy use-case)
    new URL(v, 'http://dummy.base')
    return true
  } catch {
    return false
  }
}

// PUBLIC_INTERFACE
export function getApiBase(): string | undefined {
  /** Returns API base from environment variables if set and valid. */
  const base = import.meta.env.VITE_API_BASE || import.meta.env.VITE_BACKEND_URL
  return isValidBaseUrl(base) ? String(base) : undefined
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

/**
 * Decide mock mode dynamically rather than only once at module-load for robustness.
 */
function shouldUseMock(): boolean {
  const forced = typeof flags.enableMockAPI === 'boolean' ? flags.enableMockAPI : undefined
  const base = getApiBase()
  return forced ?? !base
}

async function importMock() {
  return import('@/services/mockData')
}

// PUBLIC_INTERFACE
export async function fetchCategories(): Promise<FoodCategory[]> {
  /** Fetches food categories list, falling back to mock when API is unavailable or request fails. */
  if (shouldUseMock()) {
    const data = await importMock()
    return data.mockCategories
  }
  const base = getApiBase()
  if (!base) {
    const data = await importMock()
    return data.mockCategories
  }
  try {
    const res = await fetch(`${String(base).replace(/\/+$/, '')}/categories`, {
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) throw new Error('Failed to fetch categories')
    return res.json()
  } catch {
    // Fallback to mock on any network/parse failure
    const data = await importMock()
    return data.mockCategories
  }
}

// PUBLIC_INTERFACE
export async function fetchItems(categoryId?: string, search?: string): Promise<FoodItem[]> {
  /** Fetches menu items, with optional category and search filter. Falls back to mock on failure. */
  if (shouldUseMock()) {
    const data = await importMock()
    return data.mockItems
      .filter((i) => (!categoryId || i.categoryId === categoryId))
      .filter((i) => (!search || i.name.toLowerCase().includes(String(search).toLowerCase())))
  }
  const base = getApiBase()
  if (!base) {
    const data = await importMock()
    return data.mockItems
      .filter((i) => (!categoryId || i.categoryId === categoryId))
      .filter((i) => (!search || i.name.toLowerCase().includes(String(search).toLowerCase())))
  }
  try {
    const url = new URL(`${String(base).replace(/\/+$/, '')}/items`, window.location.origin)
    if (categoryId) url.searchParams.set('categoryId', categoryId)
    if (search) url.searchParams.set('q', search)
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } })
    if (!res.ok) throw new Error('Failed to fetch items')
    return res.json()
  } catch {
    const data = await importMock()
    return data.mockItems
      .filter((i) => (!categoryId || i.categoryId === categoryId))
      .filter((i) => (!search || i.name.toLowerCase().includes(String(search).toLowerCase())))
  }
}

// PUBLIC_INTERFACE
export async function submitOrder(payload: OrderPayload): Promise<OrderResponse> {
  /** Submits order to API or mocks success with a generated ID. Always falls back gracefully. */
  if (shouldUseMock()) {
    await new Promise((r) => setTimeout(r, 750))
    return { id: `MOCK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, status: 'success' }
  }
  const base = getApiBase()
  if (!base) {
    await new Promise((r) => setTimeout(r, 750))
    return { id: `MOCK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, status: 'success' }
  }
  try {
    const res = await fetch(`${String(base).replace(/\/+$/, '')}/orders`, {
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
