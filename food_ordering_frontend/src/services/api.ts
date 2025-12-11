import type {
  FoodCategory,
  FoodItem,
  OrderPayload,
  OrderResponse,
  Restaurant,
  RestaurantQuery,
} from '@/types'

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

/**
 * Lightweight in-memory caches to prevent redundant network/mock processing.
 * Caches are per-session and keyed by parameter combinations.
 */
const cache = {
  categoriesByRestaurant: new Map<string | undefined, Promise<FoodCategory[]>>(),
  itemsByKey: new Map<string, Promise<FoodItem[]>>(),
  itemByKey: new Map<string, Promise<FoodItem | null>>(),
  restaurantsByQuery: new Map<string, Promise<Restaurant[]>>(),
}

function itemsKey(params: { categoryId?: string; search?: string; restaurantId?: string }) {
  return JSON.stringify({
    c: params.categoryId || '',
    s: (params.search || '').toLowerCase(),
    r: params.restaurantId || '',
  })
}

function restaurantsKey(query: RestaurantQuery = {}) {
  return JSON.stringify({
    c: (query.cuisine || '').toLowerCase(),
    sb: query.sortBy || '',
    sd: query.sortDir || '',
    l: query.location || '',
  })
}

// PUBLIC_INTERFACE
export async function fetchCategories(restaurantId?: string): Promise<FoodCategory[]> {
  /**
   * Fetches food categories list, optionally scoped to a restaurant. Falls back to mock when API is unavailable or request fails.
   * Uses in-memory cache to avoid redundant fetches and batch concurrent callers.
   */
  const cached = cache.categoriesByRestaurant.get(restaurantId)
  if (cached) return cached

  const p = (async () => {
    if (shouldUseMock()) {
      const data = await importMock()
      return data.getMockCategoriesForRestaurant(restaurantId)
    }
    const base = getApiBase()
    if (!base) {
      const data = await importMock()
      return data.getMockCategoriesForRestaurant(restaurantId)
    }
    try {
      const url = restaurantId
        ? `${String(base).replace(/\/*$/, '')}/restaurants/${encodeURIComponent(restaurantId)}/categories`
        : `${String(base).replace(/\/*$/, '')}/categories`
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('Failed to fetch categories')
      return res.json()
    } catch {
      const data = await importMock()
      return data.getMockCategoriesForRestaurant(restaurantId)
    }
  })()

  cache.categoriesByRestaurant.set(restaurantId, p)
  try {
    return await p
  } finally {
    // keep cached
  }
}

// PUBLIC_INTERFACE
export async function fetchItems(
  categoryId?: string,
  search?: string,
  restaurantId?: string,
): Promise<FoodItem[]> {
  /**
   * Fetches menu items, with optional category, search, and restaurant filter. Falls back to mock on failure.
   * Results are cached by (restaurantId, categoryId, search) to minimize repeated calls.
   */
  const key = itemsKey({ categoryId, search, restaurantId })
  const cached = cache.itemsByKey.get(key)
  if (cached) return cached

  const p = (async () => {
    if (shouldUseMock()) {
      const data = await importMock()
      return data.getMockItems({ categoryId, search, restaurantId })
    }
    const base = getApiBase()
    if (!base) {
      const data = await importMock()
      return data.getMockItems({ categoryId, search, restaurantId })
    }
    try {
      const baseUrl = restaurantId
        ? `${String(base).replace(/\/*$/, '')}/restaurants/${encodeURIComponent(restaurantId)}/items`
        : `${String(base).replace(/\/*$/, '')}/items`
      const url = new URL(baseUrl, window.location.origin)
      if (categoryId) url.searchParams.set('categoryId', categoryId)
      if (search) url.searchParams.set('q', search)
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } })
      if (!res.ok) throw new Error('Failed to fetch items')
      return res.json()
    } catch {
      const data = await importMock()
      return data.getMockItems({ categoryId, search, restaurantId })
    }
  })()

  cache.itemsByKey.set(key, p)
  try {
    return await p
  } finally {
    // keep cached
  }
}

// PUBLIC_INTERFACE
export async function fetchItemById(itemId: string, restaurantId?: string): Promise<FoodItem | null> {
  /** Fetch a single menu item by ID, optionally restaurant-scoped. Falls back to mock and returns null if not found. Uses cache. */
  if (!itemId) return null
  const key = `${restaurantId || ''}::${itemId}`
  const cached = cache.itemByKey.get(key)
  if (cached) return cached

  const p = (async () => {
    if (shouldUseMock()) {
      const data = await importMock()
      return data.getMockItemById(itemId, restaurantId)
    }
    const base = getApiBase()
    if (!base) {
      const data = await importMock()
      return data.getMockItemById(itemId, restaurantId)
    }
    try {
      const url = restaurantId
        ? `${String(base).replace(/\/*$/, '')}/restaurants/${encodeURIComponent(
            restaurantId,
          )}/items/${encodeURIComponent(itemId)}`
        : `${String(base).replace(/\/*$/, '')}/items/${encodeURIComponent(itemId)}`
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } })
      if (!res.ok) throw new Error('Failed to fetch item')
      return res.json()
    } catch {
      const data = await importMock()
      return data.getMockItemById(itemId, restaurantId)
    }
  })()

  cache.itemByKey.set(key, p)
  try {
    return await p
  } finally {
    // keep cached
  }
}

/**
 * Generates a mock success order response with a slight delay.
 */
async function mockOrderSuccess(): Promise<OrderResponse> {
  await new Promise((r) => setTimeout(r, 750))
  return {
    id: `MOCK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    status: 'success',
    etaMin: 30,
  }
}

// PUBLIC_INTERFACE
export async function createOrder(payload: OrderPayload): Promise<OrderResponse> {
  /** Create order with fulfillment, address/pickup, payment and cart lines. Gracefully falls back to mock. */
  if (shouldUseMock()) {
    return mockOrderSuccess()
  }
  const base = getApiBase()
  if (!base) {
    return mockOrderSuccess()
  }
  try {
    const res = await fetch(`${String(base).replace(/\/*$/, '')}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Order failed')
    return res.json()
  } catch {
    return mockOrderSuccess()
  }
}

// PUBLIC_INTERFACE
export async function submitOrder(payload: OrderPayload): Promise<OrderResponse> {
  /** Backward-compatible wrapper that delegates to createOrder. */
  return createOrder(payload)
}

export const featureFlags = flags

// PUBLIC_INTERFACE
export async function fetchRestaurants(query: RestaurantQuery = {}): Promise<Restaurant[]> {
  /**
   * Fetch restaurants list with optional cuisine filter and sorting.
   * Falls back to mock on missing/invalid base or any network failure.
   *
   * Query params: cuisine, sortBy=rating|price|distance, sortDir=asc|desc, location
   * Results are cached by query to prevent redundant calls and large-list processing.
   */
  const applyClientSide = (list: Restaurant[]): Restaurant[] => {
    let r = list.slice()
    if (query.cuisine) {
      const c = String(query.cuisine).toLowerCase()
      r = r.filter((it) => it.cuisines.some((x) => x.toLowerCase() === c))
    }
    if (query.sortBy) {
      const dir = query.sortDir === 'asc' ? 1 : -1
      const key = query.sortBy
      r.sort((a, b) => {
        const av = key === 'price' ? a.priceLevel : key === 'distance' ? a.distanceKm : a.rating
        const bv = key === 'price' ? b.priceLevel : key === 'distance' ? b.distanceKm : b.rating
        if (av === bv) return 0
        return av > bv ? dir : -dir
      })
    }
    return r
  }

  const key = restaurantsKey(query)
  const cached = cache.restaurantsByQuery.get(key)
  if (cached) return cached

  const p = (async () => {
    if (shouldUseMock()) {
      const data = await importMock()
      return applyClientSide(data.mockRestaurants)
    }
    const base = getApiBase()
    if (!base) {
      const data = await importMock()
      return applyClientSide(data.mockRestaurants)
    }
    try {
      const url = new URL(`${String(base).replace(/\/*$/, '')}/restaurants`, window.location.origin)
      if (query.cuisine) url.searchParams.set('cuisine', String(query.cuisine))
      if (query.sortBy) url.searchParams.set('sortBy', String(query.sortBy))
      if (query.sortDir) url.searchParams.set('sortDir', String(query.sortDir))
      if (query.location) url.searchParams.set('location', String(query.location))
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } })
      if (!res.ok) throw new Error('Failed to fetch restaurants')
      const serverList: Restaurant[] = await res.json()
      return applyClientSide(serverList)
    } catch {
      const data = await importMock()
      return applyClientSide(data.mockRestaurants)
    }
  })()

  cache.restaurantsByQuery.set(key, p)
  try {
    return await p
  } finally {
    // keep cached
  }
}
