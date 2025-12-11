import { getMockItems } from './mockData'
import type { FoodItem, Restaurant } from '@/types'
import type { Item as CustomerItem, AvailabilityStatus } from '@/types/restaurant'

/**
 * Re-exports a combined inventory list using existing mock data helpers.
 * This provides a simple array of FoodItem for fallback item lookup by id.
 */
export const inventory: FoodItem[] = getMockItems({}) as FoodItem[]

/**
 * Simple in-memory inventory store keyed by restaurantId -> itemId -> qty + meta
 * This is a mock client-only store for availability and stock handling.
 */
type StockEntry = {
  qty: number
  lowStockThreshold: number
  availability: AvailabilityStatus
}
const stockStore: Record<string, Record<string, StockEntry>> = {}

/**
 * PUBLIC_INTERFACE
 * Attach menus from provided restaurants into the inventory system and initialize stock entries if missing.
 */
export function loadRestaurants(restaurants: Restaurant[]): Restaurant[] {
  restaurants.forEach((r) => {
    const anyR = r as unknown as { menu?: CustomerItem[] }
    const menu = Array.isArray(anyR.menu) ? anyR.menu : undefined
    if (!menu) return
    if (!stockStore[r.id]) stockStore[r.id] = {}
    menu.forEach((m) => {
      const existing = stockStore[r.id][m.id]
      if (!existing) {
        const defaults = withInventoryDefaults(m)
        stockStore[r.id][m.id] = {
          qty: defaults.stockQuantity ?? 10,
          lowStockThreshold: defaults.lowStockThreshold ?? 3,
          availability: defaults.availability ?? 'in_stock',
        }
      }
    })
  })
  return restaurants
}

/**
 * PUBLIC_INTERFACE
 * Return current stock quantity for a restaurant's item.
 */
export function getStock(restaurantId: string, itemId: string): number | undefined {
  return stockStore[restaurantId]?.[itemId]?.qty
}

/**
 * PUBLIC_INTERFACE
 * Set stock quantity for a restaurant's item and update availability accordingly.
 */
export function setStock(restaurantId: string, itemId: string, qty: number): number {
  if (!stockStore[restaurantId]) stockStore[restaurantId] = {}
  const entry = stockStore[restaurantId][itemId] ?? {
    qty: 0,
    lowStockThreshold: 3,
    availability: 'in_stock' as AvailabilityStatus,
  }
  entry.qty = Math.max(0, Math.floor(qty))
  stockStore[restaurantId][itemId] = entry
  autoUpdateAvailability(restaurantId, itemId)
  return entry.qty
}

/**
 * PUBLIC_INTERFACE
 * Auto-derive availability from current stock and threshold.
 */
export function autoUpdateAvailability(restaurantId: string, itemId: string): AvailabilityStatus {
  const e = stockStore[restaurantId]?.[itemId]
  if (!e) return 'in_stock'
  if (e.qty <= 0) {
    e.availability = 'out_of_stock'
  } else if (e.qty <= (e.lowStockThreshold ?? 3)) {
    e.availability = 'low_stock'
  } else {
    e.availability = 'in_stock'
  }
  return e.availability
}

/**
 * PUBLIC_INTERFACE
 * Applies default inventory-related fields to a CustomerItem, without mutating the original object.
 */
export function withInventoryDefaults(item: CustomerItem): CustomerItem & {
  stockQuantity: number
  lowStockThreshold: number
  availability: AvailabilityStatus
} {
  const stockQuantity =  typeof (item as any).stockQuantity === 'number' ? (item as any).stockQuantity : 10
  const lowStockThreshold = typeof (item as any).lowStockThreshold === 'number' ? (item as any).lowStockThreshold : 3
  const availability: AvailabilityStatus = (item as any).availability ?? 'in_stock'
  return {
    ...item,
    stockQuantity,
    lowStockThreshold,
    availability,
  }
}
