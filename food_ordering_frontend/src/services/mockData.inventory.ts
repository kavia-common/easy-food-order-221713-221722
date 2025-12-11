import type { Item as MenuItem } from '@/types/restaurant'
import type { Restaurant } from '@/types'

/**
 * SSR-safe localStorage helpers
 */
const safeStorage = {
  get(key: string): string | null {
    if (typeof window === 'undefined') return null
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string) {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // ignore
    }
  },
}

const STORAGE_KEYS = {
  RESTAURANTS: 'mock_restaurants_with_inventory_v1',
}

/**
 * Apply inventory defaults and auto-derive availability
 */
export function withInventoryDefaults(item: MenuItem): MenuItem {
  const lowStockThreshold = item.lowStockThreshold ?? 5
  const stockQuantity = item.stockQuantity ?? 12
  const autoStock = item.autoStock ?? true

  let availability = item.availability ?? 'in_stock'
  if (autoStock) {
    if (stockQuantity <= 0) {
      availability = 'out_of_stock'
    } else if (stockQuantity <= lowStockThreshold) {
      availability = 'low_stock'
    } else {
      availability = 'in_stock'
    }
  }

  return {
    ...item,
    lowStockThreshold,
    stockQuantity,
    autoStock,
    availability,
  }
}

export function loadRestaurants(baseRestaurants: Restaurant[]): Restaurant[] {
  const cached = safeStorage.get(STORAGE_KEYS.RESTAURANTS)
  if (cached) {
    try {
      const parsed: Restaurant[] = JSON.parse(cached)
      return parsed.map((r) => {
        const withMenu = r as unknown as Restaurant & { menu?: MenuItem[] }
        const menu = withMenu.menu?.map((m) => withInventoryDefaults(m)) ?? withMenu.menu
        return { ...(r as Record<string, unknown>), menu } as Restaurant
      })
    } catch {
      // fall through and seed
    }
  }
  const seeded = baseRestaurants.map((r) => {
    const withMenu = r as unknown as Restaurant & { menu?: MenuItem[] }
    const menu = withMenu.menu?.map((m) => withInventoryDefaults(m)) ?? withMenu.menu
    return { ...(r as Record<string, unknown>), menu } as Restaurant
  })
  safeStorage.set(STORAGE_KEYS.RESTAURANTS, JSON.stringify(seeded))
  return seeded
}

export function saveRestaurants(restaurants: Restaurant[]) {
  safeStorage.set(STORAGE_KEYS.RESTAURANTS, JSON.stringify(restaurants))
}

// PUBLIC_INTERFACE
export function getStock(restaurantId: string, itemId: string): number | undefined {
  const all = readAll()
  const r = all.find((x) => x.id === restaurantId) as (Restaurant & { menu?: MenuItem[] }) | undefined
  // @ts-expect-error Restaurant type in this app doesn't declare menu on list view; we widen locally to include menu for inventory
  const item: MenuItem | undefined = r?.menu?.find((i) => i.id === itemId)
  return item?.stockQuantity
}

// PUBLIC_INTERFACE
export function setStock(restaurantId: string, itemId: string, qty: number): number | undefined {
  const all = readAll()
  const idx = all.findIndex((x) => x.id === restaurantId)
  if (idx === -1) return undefined
  const withMenu = all[idx] as unknown as Restaurant & { menu?: MenuItem[] }
  const mIdx = withMenu.menu?.findIndex((i) => i.id === itemId) ?? -1
  if (mIdx === -1 || !withMenu.menu) return undefined
  const current: MenuItem = withMenu.menu[mIdx]
  const updated = withInventoryDefaults({ ...current, stockQuantity: Math.max(0, Math.floor(qty)) })
  const newR = { ...(withMenu as unknown as Record<string, unknown>), menu: [...withMenu.menu.slice(0, mIdx), updated, ...withMenu.menu.slice(mIdx + 1)] } as Restaurant
  const next = [...all.slice(0, idx), newR, ...all.slice(idx + 1)]
  saveRestaurants(next)
  return updated.stockQuantity
}

// PUBLIC_INTERFACE
export function autoUpdateAvailability(restaurantId: string, itemId: string): MenuItem | undefined {
  const all = readAll()
  const idx = all.findIndex((x) => x.id === restaurantId)
  if (idx === -1) return undefined
  const withMenu = all[idx] as unknown as Restaurant & { menu?: MenuItem[] }
  const mIdx = withMenu.menu?.findIndex((i) => i.id === itemId) ?? -1
  if (mIdx === -1 || !withMenu.menu) return undefined
  const updated = withInventoryDefaults(withMenu.menu[mIdx])
  const newR = { ...(withMenu as unknown as Record<string, unknown>), menu: [...withMenu.menu.slice(0, mIdx), updated, ...withMenu.menu.slice(mIdx + 1)] } as Restaurant
  const next = [...all.slice(0, idx), newR, ...all.slice(idx + 1)]
  saveRestaurants(next)
  return updated
}

/**
 * Internal: read all restaurants snapshot
 */
function readAll(): Restaurant[] {
  const raw = safeStorage.get(STORAGE_KEYS.RESTAURANTS)
  if (!raw) return []
  try {
    return JSON.parse(raw) as Restaurant[]
  } catch {
    return []
  }
}
