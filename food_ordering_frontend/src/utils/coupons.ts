export type CouponType = 'percent' | 'flat' | 'freeship'

export type Coupon = {
  code: string
  type: CouponType
  amount?: number // percent value (e.g., 10 for 10%) or flat value in currency
  minSpend?: number
  expiresAt?: string // ISO date string
  description?: string
}

// Basic utilities for coupon validation and discount calculation

export function isExpired(coupon: Coupon, now: Date = new Date()): boolean {
  if (!coupon.expiresAt) return false
  const exp = new Date(coupon.expiresAt)
  return !isNaN(exp.getTime()) && exp.getTime() < now.getTime()
}

export function meetsMinSpend(coupon: Coupon, subtotal: number): boolean {
  if (!coupon.minSpend) return true
  return subtotal >= coupon.minSpend
}

/**
 * Calculate discount for a given coupon, based on subtotal and tax/shipping.
 * For freeship type, we treat it as 0 currency discount here; shipping is not modeled in app,
 * so freeship acts as a no-op but remains validated and can be shown in UI.
 */
export function calcDiscount(coupon: Coupon | null, subtotal: number): number {
  if (!coupon) return 0
  if (subtotal <= 0) return 0
  if (coupon.type === 'percent') {
    const pct = (coupon.amount ?? 0) / 100
    return clampCurrency(subtotal * pct)
  }
  if (coupon.type === 'flat') {
    return clampCurrency(Math.min(subtotal, coupon.amount ?? 0))
  }
  // freeship: no shipping modeled, $0 discount to totals.
  return 0
}

export function clampCurrency(v: number): number {
  // Keep two-decimal currency precision, avoid -0
  const n = Math.round(v * 100) / 100
  return n === -0 ? 0 : n
}

// Mock coupon list
export const mockCoupons: Coupon[] = [
  {
    code: 'FLAT10',
    type: 'flat',
    amount: 10,
    minSpend: 30,
    description: '$10 off orders $30+',
    expiresAt: undefined,
  },
  {
    code: 'SAVE20',
    type: 'percent',
    amount: 20,
    minSpend: 50,
    description: '20% off orders $50+',
    expiresAt: undefined,
  },
  {
    code: 'FREESHIP',
    type: 'freeship',
    description: 'Free shipping',
    expiresAt: undefined,
  },
]

export function findCouponByCode(code: string): Coupon | null {
  const normalized = code.trim().toUpperCase()
  const found = mockCoupons.find((c) => c.code.toUpperCase() === normalized)
  return found ? { ...found } : null
}

/**
 * Validate if coupon can be applied on current cart.
 * Returns string error message or null when valid.
 */
export function validateCoupon(coupon: Coupon, subtotal: number, now: Date = new Date()): string | null {
  if (isExpired(coupon, now)) return 'This coupon has expired.'
  if (!meetsMinSpend(coupon, subtotal)) {
    const ms = coupon.minSpend?.toFixed(2)
    return `Minimum spend of $${ms} required.`
  }
  return null
}
