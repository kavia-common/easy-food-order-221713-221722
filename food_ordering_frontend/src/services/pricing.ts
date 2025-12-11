import type { CartLine } from '@/types'
import type { Coupon } from '@/services/coupons'

/**
 * Pure pricing utilities for test-friendly totals computation.
 * Uses simple JS math and returns numbers in "currency" units (e.g., dollars).
 */

// PUBLIC_INTERFACE
export function safeRound2(n: number): number {
  /** Round to 2 decimals and avoid returning -0. */
  const r = Math.round(n * 100) / 100
  return Object.is(r, -0) ? 0 : r
}

// PUBLIC_INTERFACE
export function lineSubtotal(lines: CartLine[]): number {
  /** Sum per-line price * qty. */
  return safeRound2(lines.reduce((acc, l) => acc + l.price * l.qty, 0))
}

// PUBLIC_INTERFACE
export function couponDiscount(subtotal: number, coupon?: Coupon | null): number {
  /** Compute discount amount given a subtotal and coupon. */
  if (!coupon) return 0
  if (coupon.type === 'percent') {
    return safeRound2(subtotal * (coupon.value / 100))
  }
  // fixed
  return safeRound2(Math.min(subtotal, coupon.value))
}

// PUBLIC_INTERFACE
export function computeTax(taxable: number, taxRate: number): number {
  /** Compute tax on taxable amount using provided rate (e.g., 0.08). */
  return safeRound2(taxable * Math.max(0, taxRate || 0))
}

export type TotalsInput = {
  lines: CartLine[]
  taxRate?: number
  coupon?: Coupon | null
  deliveryFee?: number // optional delivery fee
}

export type CartTotalsResult = {
  subtotal: number
  discount: number
  tax: number
  deliveryFee: number
  total: number
}

// PUBLIC_INTERFACE
export function computeTotals(input: TotalsInput): CartTotalsResult {
  /** Compute pricing totals given normalized input. */
  const subtotal = lineSubtotal(input.lines)
  const discount = couponDiscount(subtotal, input.coupon)
  const taxable = Math.max(0, subtotal - discount)
  const tax = computeTax(taxable, input.taxRate ?? 0)
  const deliveryFee = safeRound2(Math.max(0, input.deliveryFee ?? 0))
  const total = safeRound2(taxable + tax + deliveryFee)
  return { subtotal, discount, tax, deliveryFee, total }
}
