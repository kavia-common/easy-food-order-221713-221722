import { safeRound2 } from './pricing'
import { getApiBase } from './api'
import type {
  Coupon,
  CouponCreateInput,
  CouponUpdatePatch,
  CouponValidationContext,
} from '@/types/coupons'

/**
 * Local storage keys
 */
const LS_KEYS = {
  COUPONS: 'fof.coupons.v1',
  COUPON_USAGE_BY_RESTAURANT: 'fof.coupons.usageByRestaurant.v1', // { "<code>|<restaurantId>": number }
}

/** Safe window.localStorage access */
function safeStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage
  } catch {
    // ignore
  }
  return null
}

function readAll(): Coupon[] {
  const store = safeStorage()
  if (!store) return seedDefaults()
  try {
    const raw = store.getItem(LS_KEYS.COUPONS)
    if (!raw) {
      const seeded = seedDefaults()
      store.setItem(LS_KEYS.COUPONS, JSON.stringify(seeded))
      return seeded
    }
    const parsed = JSON.parse(raw) as Coupon[]
    return parsed.map(normalizeCoupon)
  } catch {
    return seedDefaults()
  }
}

function writeAll(list: Coupon[]) {
  const store = safeStorage()
  if (!store) return
  try {
    store.setItem(LS_KEYS.COUPONS, JSON.stringify(list))
  } catch {
    // ignore
  }
}

function readUsageByRestaurant(): Record<string, number> {
  const store = safeStorage()
  if (!store) return {}
  try {
    const raw = store.getItem(LS_KEYS.COUPON_USAGE_BY_RESTAURANT)
    return raw ? (JSON.parse(raw) as Record<string, number>) : {}
  } catch {
    return {}
  }
}

function writeUsageByRestaurant(map: Record<string, number>) {
  const store = safeStorage()
  if (!store) return
  try {
    store.setItem(LS_KEYS.COUPON_USAGE_BY_RESTAURANT, JSON.stringify(map))
  } catch {
    // ignore
  }
}

function idGen(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  } catch {
    // ignore
  }
  return `C_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// PUBLIC_INTERFACE
export function normalizeCoupon(c: Coupon): Coupon {
  /** Normalize numbers and arrays for consistent behavior */
  const base = {
    ...c,
    value: safeRound2(Number(c.value)),
    minSubtotal: c.minSubtotal !== undefined ? safeRound2(Number(c.minSubtotal)) : undefined,
    usageLimit: typeof c.usageLimit === 'number' && c.usageLimit >= 0 ? Math.floor(c.usageLimit) : undefined,
    usedCount: Math.max(0, Math.floor(c.usedCount ?? 0)),
    perRestaurantLimit:
      typeof c.perRestaurantLimit === 'number' && c.perRestaurantLimit >= 0
        ? Math.floor(c.perRestaurantLimit)
        : undefined,
    restaurantIds: Array.isArray(c.restaurantIds) ? c.restaurantIds.filter(Boolean) : undefined,
    active: Boolean(c.active),
  } as Coupon
  if (base.type === 'percent') {
    base.value = Math.max(0, Math.min(100, Number(base.value)))
  }
  return base
}

function seedDefaults(): Coupon[] {
  const future = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString()
  return [
    {
      id: idGen(),
      code: 'WELCOME10',
      type: 'percent',
      value: 10,
      minSubtotal: 10,
      expiresAt: future,
      usageLimit: 10000,
      usedCount: 0,
      active: true,
      restaurantIds: undefined,
      description: '10% off for first-time users',
    },
    {
      id: idGen(),
      code: 'SAVE5',
      type: 'fixed',
      value: 5,
      minSubtotal: 20,
      expiresAt: future,
      usageLimit: 10000,
      usedCount: 0,
      active: true,
      restaurantIds: undefined,
    },
    {
      id: idGen(),
      code: 'PIZZA15',
      type: 'percent',
      value: 15,
      minSubtotal: 30,
      expiresAt: future,
      usageLimit: 2000,
      usedCount: 0,
      active: true,
      restaurantIds: ['r_pizza_1', 'r_pizza_2'],
      note: 'Valid only for select pizza partners',
    },
  ].map(normalizeCoupon)
}

// PUBLIC_INTERFACE
export async function listCoupons(): Promise<Coupon[]> {
  /**
   * Returns the list of coupons.
   * TODO: If backend is available, call `${API}/coupons`.
   */
  const base = getApiBase()
  if (base) {
    try {
      const res = await fetch(`${String(base).replace(/\/*$/, '')}/coupons`, {
        headers: { Accept: 'application/json' },
      })
      if (res.ok) {
        const data = (await res.json()) as Coupon[]
        return data.map(normalizeCoupon)
      }
      // fall back
    } catch {
      // swallow and fallback
    }
  }
  return readAll()
}

// PUBLIC_INTERFACE
export async function createCoupon(input: CouponCreateInput): Promise<Coupon> {
  /**
   * Creates a coupon.
   * TODO: POST to `${API}/coupons` when available.
   */
  const base = getApiBase()
  if (base) {
    try {
      const res = await fetch(`${String(base).replace(/\/*$/, '')}/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (res.ok) {
        const data = (await res.json()) as Coupon
        return normalizeCoupon(data)
      }
    } catch {
      // swallow and fallback
    }
  }
  const all = readAll()
  const exists = all.some((c) => c.code.trim().toUpperCase() === input.code.trim().toUpperCase())
  if (exists) throw new Error('Coupon code already exists')
  const created: Coupon = normalizeCoupon({
    ...(input as Coupon),
    id: idGen(),
    usedCount: 0,
  })
  const next = [...all, created]
  writeAll(next)
  return created
}

// PUBLIC_INTERFACE
export async function updateCoupon(id: string, patch: CouponUpdatePatch): Promise<Coupon> {
  /**
   * Updates a coupon by id.
   * TODO: PATCH `${API}/coupons/:id`
   */
  const base = getApiBase()
  if (base) {
    try {
      const res = await fetch(`${String(base).replace(/\/*$/, '')}/coupons/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (res.ok) {
        const data = (await res.json()) as Coupon
        return normalizeCoupon(data)
      }
    } catch {
      // swallow and fallback
    }
  }
  const all = readAll()
  const idx = all.findIndex((c) => c.id === id)
  if (idx === -1) throw new Error('Coupon not found')
  const updated: Coupon = normalizeCoupon({
    ...all[idx],
    ...patch,
  } as Coupon)
  const next = [...all]
  next[idx] = updated
  writeAll(next)
  return updated
}

// PUBLIC_INTERFACE
export async function toggleCoupon(id: string, active: boolean): Promise<Coupon> {
  /** Enable/disable a coupon quickly. */
  return updateCoupon(id, { active })
}

// Helpers for validation

// PUBLIC_INTERFACE
export function isExpired(expiresAt?: string): boolean {
  /** Returns true if expiresAt is provided and already in the past. */
  if (!expiresAt) return false
  const t = new Date(expiresAt).getTime()
  return Number.isFinite(t) && Date.now() > t
}

// PUBLIC_INTERFACE
export function couponMeetsSubtotal(subtotal: number, coupon?: Coupon | null): boolean {
  /** Verify if subtotal satisfies coupon minSubtotal (if any). */
  if (!coupon) return false
  const min = coupon.minSubtotal ?? 0
  return subtotal >= min
}

function cartHasRestaurantMatch(ctx: CouponValidationContext, coupon: Coupon): boolean {
  if (!coupon.restaurantIds || coupon.restaurantIds.length === 0) return true
  // match any restaurant in cart
  const cartR = (ctx.restaurantIds && ctx.restaurantIds.length ? ctx.restaurantIds : (ctx.restaurantId ? [ctx.restaurantId] : [])) || []
  if (cartR.length === 0) return false
  return cartR.some((rid) => coupon.restaurantIds!.includes(rid))
}

function getCartRestaurantIds(ctx: CouponValidationContext): string[] {
  return (ctx.restaurantIds && ctx.restaurantIds.length ? ctx.restaurantIds : (ctx.restaurantId ? [ctx.restaurantId] : [])) || []
}

function allItemsMatchScope(cartRids: string[], coupon: Coupon): boolean {
  if (!coupon.restaurantIds || coupon.restaurantIds.length === 0) return true
  // all restaurants in cart must be contained within coupon scope
  return cartRids.every((rid) => coupon.restaurantIds!.includes(rid))
}

// PUBLIC_INTERFACE
export function validateCouponWithContext(coupon: Coupon, ctx: CouponValidationContext): { valid: true } | { valid: false; reason: string } {
  /**
   * Enforces:
   * - active
   * - not expired
   * - minSubtotal met
   * - usageLimit (global)
   * - perRestaurantLimit (optional)
   * - restaurant scoping: if coupon.restaurantIds set, cart must match scope
   * - if multiple restaurants in cart: requires global coupon or scope that covers all items
   */
  if (!coupon.active) return { valid: false, reason: 'This coupon is currently disabled.' }
  if (isExpired(coupon.expiresAt)) return { valid: false, reason: 'This coupon has expired.' }
  if (!couponMeetsSubtotal(ctx.subtotal, coupon)) {
    return { valid: false, reason: `Minimum subtotal of $${(coupon.minSubtotal ?? 0).toFixed(2)} required.` }
  }
  if (typeof coupon.usageLimit === 'number' && coupon.usedCount !== undefined && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, reason: 'This coupon has reached its usage limit.' }
  }
  const cartRids = getCartRestaurantIds(ctx)
  if (cartRids.length > 1) {
    // Multiple restaurants in cart
    if (!(coupon.restaurantIds?.length)) {
      // global coupon is allowed for multi-restaurant cart
    } else if (!allItemsMatchScope(cartRids, coupon)) {
      return { valid: false, reason: 'This coupon applies to a specific restaurant and cannot be used for multiple restaurants in the same order.' }
    }
  } else {
    // Single or none
    if (!cartHasRestaurantMatch(ctx, coupon)) {
      return { valid: false, reason: 'This coupon is not valid for the selected restaurant.' }
    }
  }

  // perRestaurantLimit check (mock-only via local storage)
  if (coupon.perRestaurantLimit && coupon.perRestaurantLimit > 0 && cartRids.length) {
    const map = readUsageByRestaurant()
    const rid = cartRids[0]
    const key = `${coupon.code}|${rid}`
    const used = map[key] ?? 0
    if (used >= coupon.perRestaurantLimit) {
      return { valid: false, reason: 'This coupon has reached its usage limit for this restaurant.' }
    }
  }

  return { valid: true }
}

// PUBLIC_INTERFACE
export async function findByCode(code: string): Promise<Coupon | null> {
  /** Case-insensitive find coupon by code. */
  if (!code) return null
  const list = await listCoupons()
  const norm = code.trim().toUpperCase()
  const found = list.find((c) => c.code.trim().toUpperCase() === norm)
  return found ? normalizeCoupon(found) : null
}

// PUBLIC_INTERFACE
export async function recordUsage(coupon: Coupon, ctx: CouponValidationContext) {
  /**
   * For mock store only:
   * - increments global usedCount and per-restaurant counters
   */
  const cartRids = getCartRestaurantIds(ctx)
  const all = readAll()
  const idx = all.findIndex((c) => c.id === coupon.id)
  if (idx !== -1) {
    const updated = { ...all[idx], usedCount: (all[idx].usedCount ?? 0) + 1 }
    all[idx] = updated
    writeAll(all)
  }
  if (cartRids.length) {
    const map = readUsageByRestaurant()
    const key = `${coupon.code}|${cartRids[0]}`
    map[key] = (map[key] ?? 0) + 1
    writeUsageByRestaurant(map)
  }
}
