import type {
  FoodCategory,
  FoodItem,
  OrderPayload,
  OrderResponse,
  Restaurant,
  RestaurantQuery,
  HealthFilter,
} from '@/types'
import type { RestaurantProfile } from '@/types/restaurantProfile'
import type { Item as CustomerItem, AdminMenuItemEdit, AvailabilityStatus } from '@/types/restaurant'
import { getMockCategoriesForRestaurant, getMockItems, getMockItemById, mockRestaurants } from './mockData'
import {
  loadRestaurants as invLoad,
  getStock as invGet,
  setStock as invSet,
  autoUpdateAvailability as invAuto,
  withInventoryDefaults as invDefaults,
} from './mockData.inventory'

/**
 * Small util to validate a base URL.
 */
function isValidBaseUrl(v: unknown): v is string {
  if (typeof v !== 'string' || v.trim().length === 0) return false
  try {
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

function shouldUseMock(): boolean {
  const forced = typeof flags.enableMockAPI === 'boolean' ? flags.enableMockAPI : undefined
  const base = getApiBase()
  return forced ?? !base
}

const cache = {
  categoriesByRestaurant: new Map<string | undefined, Promise<FoodCategory[]>>(),
  itemsByKey: new Map<string, Promise<FoodItem[]>>(),
  itemByKey: new Map<string, Promise<FoodItem | null>>(),
  restaurantsByQuery: new Map<string, Promise<Restaurant[]>>(),
  profileById: new Map<string, Promise<RestaurantProfile>>(),
  customerMenuByRestaurant: new Map<string, Promise<CustomerItem[]>>(),
}

// PUBLIC_INTERFACE
export function invalidateCaches(scope?: 'all' | 'items' | 'restaurants' | 'categories' | 'profiles' | 'customerMenu') {
  /** Clears client-side caches to force fresh data fetching and re-rendering after updates like orders. */
  const s = scope || 'all'
  if (s === 'all' || s === 'items') {
    cache.itemsByKey.clear()
    cache.itemByKey.clear()
  }
  if (s === 'all' || s === 'restaurants') {
    cache.restaurantsByQuery.clear()
  }
  if (s === 'all' || s === 'categories') {
    cache.categoriesByRestaurant.clear()
  }
  if (s === 'all' || s === 'profiles') {
    cache.profileById.clear()
  }
  if (s === 'all' || s === 'customerMenu') {
    cache.customerMenuByRestaurant.clear()
  }
}

function itemsKey(params: { categoryId?: string; search?: string; restaurantId?: string; healthFilters?: string[]; maxCalories?: number }) {
  return JSON.stringify({
    c: params.categoryId || '',
    s: (params.search || '').toLowerCase(),
    r: params.restaurantId || '',
    h: (params.healthFilters || []).slice().sort().join(','),
    m: typeof params.maxCalories === 'number' ? params.maxCalories : '',
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
  const cached = cache.categoriesByRestaurant.get(restaurantId)
  if (cached) return cached
  const p = (async () => {
    if (shouldUseMock()) return getMockCategoriesForRestaurant(restaurantId)
    const base = getApiBase()
    if (!base) return getMockCategoriesForRestaurant(restaurantId)
    try {
      const url = restaurantId
        ? `${String(base).replace(/\/*$/, '')}/restaurants/${encodeURIComponent(restaurantId)}/categories`
        : `${String(base).replace(/\/*$/, '')}/categories`
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } })
      if (!res.ok) throw new Error('Failed to fetch categories')
      return res.json()
    } catch {
      return getMockCategoriesForRestaurant(restaurantId)
    }
  })()
  cache.categoriesByRestaurant.set(restaurantId, p)
  return p
}

// PUBLIC_INTERFACE
export async function fetchItems(
  categoryId?: string,
  search?: string,
  restaurantId?: string,
  options?: { healthFilters?: HealthFilter[]; maxCalories?: number }
): Promise<FoodItem[]> {
  const key = itemsKey({ categoryId, search, restaurantId, healthFilters: options?.healthFilters, maxCalories: options?.maxCalories })
  const cached = cache.itemsByKey.get(key)
  if (cached) return cached
  const p = (async () => {
    if (shouldUseMock()) {
      const raw = getMockItems({ categoryId, search, restaurantId, healthFilters: options?.healthFilters, maxCalories: options?.maxCalories })
      // If restaurantId is present, map items to include availability via inventory defaults so UI badges render
      if (restaurantId) {
        return (raw as FoodItem[]).map((fi) =>
          ({
            ...fi,
            // invDefaults applies lowStockThreshold/stockQuantity/availability defaults if missing
            ...invDefaults({
              id: fi.id,
              name: fi.name,
              description: fi.description,
              price: fi.price,
              image: fi.image,
              category: fi.categoryId,
              availability: 'in_stock',
            } as unknown as CustomerItem),
          } as unknown as FoodItem),
        )
      }
      return raw
    }
    const base = getApiBase()
    if (!base) return getMockItems({ categoryId, search, restaurantId, healthFilters: options?.healthFilters, maxCalories: options?.maxCalories })
    try {
      const baseUrl = restaurantId
        ? `${String(base).replace(/\/*$/, '')}/restaurants/${encodeURIComponent(restaurantId)}/items`
        : `${String(base).replace(/\/*$/, '')}/items`
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
      const url = new URL(baseUrl, origin)
      if (categoryId) url.searchParams.set('categoryId', categoryId)
      if (search) url.searchParams.set('q', search)
      if (options?.healthFilters?.length) url.searchParams.set('health', options.healthFilters.join(','))
      if (typeof options?.maxCalories === 'number') url.searchParams.set('maxCalories', String(options.maxCalories))
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } })
      if (!res.ok) throw new Error('Failed to fetch items')
      return res.json()
    } catch {
      return getMockItems({ categoryId, search, restaurantId, healthFilters: options?.healthFilters, maxCalories: options?.maxCalories })
    }
  })()
  cache.itemsByKey.set(key, p)
  return p
}

/** Internal: fetch with timeout for responsiveness */
async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit & { timeoutMs?: number }) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), init?.timeoutMs ?? 8000)
  try {
    const res = await fetch(input, { ...init, signal: controller.signal })
    return res
  } finally {
    clearTimeout(t)
  }
}

// PUBLIC_INTERFACE
export async function fetchItemById(itemId: string, restaurantId?: string): Promise<FoodItem | null> {
  if (!itemId) return null
  const key = `${restaurantId || ''}::${itemId}`
  const cached = cache.itemByKey.get(key)
  if (cached) return cached
  const p = (async () => {
    if (shouldUseMock()) return getMockItemById(itemId, restaurantId)
    const base = getApiBase()
    if (!base) return getMockItemById(itemId, restaurantId)
    try {
      const url = restaurantId
        ? `${String(base).replace(/\/*$/, '')}/restaurants/${encodeURIComponent(restaurantId)}/items/${encodeURIComponent(itemId)}`
        : `${String(base).replace(/\/*$/, '')}/items/${encodeURIComponent(itemId)}`
      const res = await fetchWithTimeout(url, { headers: { 'Content-Type': 'application/json' }, timeoutMs: 8000 })
      if (res.status === 404) return null
      if (!res.ok) throw new Error('Failed to fetch item')
      return res.json()
    } catch {
      return getMockItemById(itemId, restaurantId)
    }
  })()
  cache.itemByKey.set(key, p)
  return p
}

async function mockOrderSuccess(): Promise<OrderResponse> {
  await new Promise((r) => setTimeout(r, 400))
  return {
    id: `MOCK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    status: 'success',
    etaMin: 30,
  }
}

// Inventory utilities (mock only)

// PUBLIC_INTERFACE
export function getStock(restaurantId: string, itemId: string) {
  return invGet(restaurantId, itemId) ?? 0
}

// PUBLIC_INTERFACE
export function setStock(restaurantId: string, itemId: string, qty: number) {
  return invSet(restaurantId, itemId, qty)
}

/**
 * Client-only reservation map (non-persistent)
 */
const localReservations: Record<string, number> = {}

// PUBLIC_INTERFACE
export function reserveLocal(restaurantId: string, itemId: string, qty = 1) {
  const key = `${restaurantId}:${itemId}`
  localReservations[key] = (localReservations[key] ?? 0) + qty
}

// PUBLIC_INTERFACE
export function getDisplayStock(restaurantId: string, itemId: string) {
  const real = getStock(restaurantId, itemId) ?? 0
  const key = `${restaurantId}:${itemId}`
  const reserved = localReservations[key] ?? 0
  return Math.max(0, real - reserved)
}

// PUBLIC_INTERFACE
export async function createOrder(payload: OrderPayload): Promise<OrderResponse> {
  if (shouldUseMock()) {
    // simulate stock decrement in mock: for each line id = itemId, we try to locate restaurant item in cached inventory
    const base = invLoad(attachMenusToRestaurants(mockRestaurants))
    // naive mapping: attempt to find the restaurant that contains the item id
    for (const line of payload.items) {
      if (!line?.id) continue
      const found = findRestaurantAndItem(base, line.id)
      if (found) {
        const { restaurantId, itemId } = found
        const current = invGet(restaurantId, itemId) ?? 0
        invSet(restaurantId, itemId, Math.max(0, current - (line.qty ?? 0)))
        invAuto(restaurantId, itemId)
      }
    }
    // Invalidate item menus so UI can refresh stock/availability
    invalidateCaches('items')
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
  return createOrder(payload)
}

export const featureFlags = flags

// PUBLIC_INTERFACE
export async function fetchRestaurantProfile(restaurantId: string): Promise<RestaurantProfile> {
  if (!restaurantId) throw new Error('restaurantId is required')
  const p = cache.profileById.get(restaurantId)
  if (p) return p
  const q = Promise.resolve({
    id: restaurantId,
    name: `Restaurant ${restaurantId}`,
    address: { line1: '', city: '', state: '', postalCode: '', country: '' },
    workingHours: [],
  } as RestaurantProfile)
  cache.profileById.set(restaurantId, q)
  return q
}

// PUBLIC_INTERFACE
export async function fetchRestaurants(query: RestaurantQuery = {}): Promise<Restaurant[]> {
  const key = restaurantsKey(query)
  const cached = cache.restaurantsByQuery.get(key)
  if (cached) return cached
  const p = Promise.resolve(applyClientSide(mockRestaurants, query))
  cache.restaurantsByQuery.set(key, p)
  return p
}

function applyClientSide(list: Restaurant[], query: RestaurantQuery) {
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

// Admin menu APIs (localStorage mock)
const LS_KEYS = {
  MENU: (rid: string) => `fof.menu.${rid}`,
}
function safeStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage
  } catch {
    // ignore
  }
  return null
}
function applyDefaultAvailability(item: CustomerItem): CustomerItem {
  // derive based on inventory defaults if present
  const enriched = invDefaults(item as any)
  return enriched
}

async function readCustomerMenu(restaurantId: string): Promise<CustomerItem[]> {
  if (!restaurantId) return []
  const mem = cache.customerMenuByRestaurant.get(restaurantId)
  if (mem) return mem
  const p = (async () => {
    // seed from mock items for restaurant
    const items = (getMockItems({ restaurantId }) as FoodItem[]).map((fi) =>
      applyDefaultAvailability({
        id: fi.id,
        name: fi.name,
        description: fi.description,
        price: fi.price,
        image: fi.image,
        category: fi.categoryId,
        availability: 'in_stock',
      } as CustomerItem),
    )
    const store = safeStorage()
    if (store) store.setItem(LS_KEYS.MENU(restaurantId), JSON.stringify(items))
    // ensure inventory persistence has restaurants with menus
    invLoad(attachMenusToRestaurants(mockRestaurants))
    return items
  })()
  cache.customerMenuByRestaurant.set(restaurantId, p)
  return p
}
function writeCustomerMenu(restaurantId: string, items: CustomerItem[]) {
  const store = safeStorage()
  if (!store) return
  try {
    store.setItem(LS_KEYS.MENU(restaurantId), JSON.stringify(items))
  } catch {
    // ignore
  }
  cache.customerMenuByRestaurant.set(restaurantId, Promise.resolve(items))
}

// PUBLIC_INTERFACE
export async function listMenuItems(restaurantId: string): Promise<CustomerItem[]> {
  return readCustomerMenu(restaurantId)
}

// PUBLIC_INTERFACE
export async function createMenuItem(
  restaurantId: string,
  payload: AdminMenuItemEdit
): Promise<CustomerItem> {
  if (!restaurantId) throw new Error('restaurantId is required')
  const list = await readCustomerMenu(restaurantId)
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`
  const item: CustomerItem = applyDefaultAvailability({
    id,
    name: payload.name,
    description: payload.description,
    price: payload.price,
    image: payload.image,
    category: payload.category,
    availability: payload.availability ?? 'in_stock',
  } as CustomerItem)
  const next = [...list, item]
  writeCustomerMenu(restaurantId, next)
  return item
}

// PUBLIC_INTERFACE
export async function updateMenuItem(
  restaurantId: string,
  itemId: string,
  payload: Partial<AdminMenuItemEdit>
): Promise<CustomerItem> {
  if (!restaurantId || !itemId) throw new Error('restaurantId and itemId are required')
  const list = await readCustomerMenu(restaurantId)
  const idx = list.findIndex(i => i.id === itemId)
  if (idx === -1) throw new Error('Item not found')
  const updated: CustomerItem = applyDefaultAvailability({
    ...list[idx],
    ...payload,
    availability: payload.availability ?? list[idx].availability ?? 'in_stock',
  } as CustomerItem)
  const next = [...list]
  next[idx] = updated
  writeCustomerMenu(restaurantId, next)
  return updated
}

// PUBLIC_INTERFACE
export async function updateAvailability(
  restaurantId: string,
  itemId: string,
  status: AvailabilityStatus
): Promise<CustomerItem> {
  if (!restaurantId || !itemId) throw new Error('restaurantId and itemId are required')
  const list = await readCustomerMenu(restaurantId)
  const idx = list.findIndex(i => i.id === itemId)
  if (idx === -1) throw new Error('Item not found')
  const updated: CustomerItem = applyDefaultAvailability({ ...list[idx], availability: status })
  const next = [...list]
  next[idx] = updated
  writeCustomerMenu(restaurantId, next)
  return updated
}

// Helpers

function attachMenusToRestaurants(base: Restaurant[]): Restaurant[] {
  // read all menus stored in LS and attach to restaurants for inventory ops
  const store = safeStorage()
  if (!store) return base
  try {
    return base.map((r) => {
      const raw = store.getItem(LS_KEYS.MENU(r.id))
      if (!raw) return r
      const items: CustomerItem[] = JSON.parse(raw)
      // Return a widened Restaurant that carries a menu for inventory operations
      return { ...(r as Record<string, unknown>), menu: items } as Restaurant
    })
  } catch {
    return base
  }
}

function findRestaurantAndItem(rests: Restaurant[], itemId: string): { restaurantId: string; itemId: string } | null {
  for (const r of rests as unknown as Array<Restaurant & { menu?: CustomerItem[] }>) {
    const menu: CustomerItem[] | undefined = r.menu
    if (!Array.isArray(menu)) continue
    if (menu.some((m) => m.id === itemId)) return { restaurantId: r.id, itemId }
  }
  return null
}

// Re-export orders API if needed by other modules
export * as OrdersApi from './ordersApi'
