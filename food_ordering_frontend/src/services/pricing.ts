import type { CartLine } from '@/types'
import type { Coupon } from '@/services/coupons'
import type { DeliveryPricingOptions } from './pricingConfig'

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

// Helpers for time windows

/**
 * PUBLIC_INTERFACE
 * Returns true if the given date is Saturday or Sunday in the provided timezone offset.
 * This helper treats the given Date as already in local time for the provided timezone.
 */
export function isWeekend(date: Date): boolean {
  const d = date.getDay()
  return d === 0 || d === 6
}

/**
 * PUBLIC_INTERFACE
 * Parse rush hour ranges like "11:30-14:00,18:00-21:00" into minute-of-day tuples.
 */
export function parseRushHours(spec: string): Array<[number, number]> {
  const parts = (spec || '').split(',').map(s => s.trim()).filter(Boolean)
  const ranges: Array<[number, number]> = []
  for (const p of parts) {
    const [start, end] = p.split('-').map(s => s.trim())
    const toMin = (hhmm: string): number => {
      const [h, m] = hhmm.split(':').map(Number)
      if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN as any
      return h * 60 + m
    }
    const sMin = toMin(start)
    const eMin = toMin(end)
    if (Number.isFinite(sMin) && Number.isFinite(eMin) && sMin >= 0 && eMin >= 0 && eMin > sMin) {
      ranges.push([sMin, eMin])
    }
  }
  return ranges
}

/**
 * PUBLIC_INTERFACE
 * Returns true if the time component of the date falls within any rush ranges.
 * Date is treated as local time already.
 */
export function isRushHour(date: Date, rushSpec: string): boolean {
  const mins = date.getHours() * 60 + date.getMinutes()
  const ranges = parseRushHours(rushSpec)
  for (const [s, e] of ranges) {
    if (mins >= s && mins < e) return true
  }
  return false
}

/**
 * PUBLIC_INTERFACE
 * Compute delivery fee given a date, cart state, and config options.
 * The function is pure and does not read from env; pass options from pricingConfig.
 */
export function computeDeliveryFee(
  date: Date,
  cart: { lines: CartLine[] },
  options: DeliveryPricingOptions,
): number {
  // Start with base fee; if cart empty, fee is zero.
  if (!cart?.lines?.length) return 0
  const base = Math.max(0, options.baseFee || 0)

  let fee = base
  if (isRushHour(date, options.rushHours)) {
    fee += Math.max(0, options.rushSurcharge || 0)
  }
  if (isWeekend(date)) {
    fee += Math.max(0, options.weekendSurcharge || 0)
  }
  return safeRound2(Math.max(0, fee))
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
