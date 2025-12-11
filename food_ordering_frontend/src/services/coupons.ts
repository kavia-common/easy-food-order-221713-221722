import { safeRound2 } from './pricing'

export type CouponBase = {
  code: string
  /**
   * Minimum subtotal required before tax/fees to apply this coupon.
   */
  minSubtotal?: number
  /**
   * ISO date string for expiry.
   */
  expiresAt?: string
}
export type PercentCoupon = CouponBase & { type: 'percent'; value: number } // 0..100
export type FixedCoupon = CouponBase & { type: 'fixed'; value: number } // fixed currency off
export type Coupon = PercentCoupon | FixedCoupon

export type CouponValidation =
  | { valid: true; coupon: Coupon }
  | { valid: false; reason: string }

// PUBLIC_INTERFACE
export function isExpired(expiresAt?: string): boolean {
  /** Returns true if expiresAt is provided and already in the past. */
  if (!expiresAt) return false
  const exp = new Date(expiresAt).getTime()
  if (Number.isNaN(exp)) return false
  return Date.now() > exp
}

// PUBLIC_INTERFACE
export async function validateCoupon(code: string): Promise<CouponValidation> {
  /**
   * Validate coupon via mock dataset for now; hook to backend when available.
   * If VITE_API_BASE exists, you can replace with a fetch to `${VITE_API_BASE}/coupons/validate?code=${code}`
   */
  const trimmed = (code || '').trim().toUpperCase()
  if (!trimmed) return { valid: false, reason: 'Please enter a coupon code.' }

  // Attempt backend validation if configured (placeholder; keep graceful fallback).
  const base = import.meta.env.VITE_API_BASE as string | undefined
  if (base) {
    try {
      const res = await fetch(`${base.replace(/\/+$/, '')}/coupons/validate?code=${encodeURIComponent(trimmed)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      })
      if (res.ok) {
        const data = (await res.json()) as Coupon
        return { valid: true, coupon: normalizeCoupon(data) }
      }
      // fallthrough to mock when non-200
    } catch {
      // swallow and fallback to mock
    }
  }

  // Mock list
  const mock = getMockCoupons()
  const found = mock.find(c => c.code.toUpperCase() === trimmed)
  if (!found) return { valid: false, reason: 'Invalid coupon code.' }
  const normalized = normalizeCoupon(found)

  if (normalized.type === 'percent') {
    if (normalized.value < 0 || normalized.value > 100) return { valid: false, reason: 'Invalid coupon value.' }
  } else if (normalized.value < 0) {
    return { valid: false, reason: 'Invalid coupon value.' }
  }
  if (isExpired(normalized.expiresAt)) {
    return { valid: false, reason: 'This coupon has expired.' }
  }
  return { valid: true, coupon: normalized }
}

// PUBLIC_INTERFACE
export function getMockCoupons(): Coupon[] {
  /** Local mock coupons for development and tests. */
  // Expires one year in the future for demo
  const future = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString()
  return [
    { code: 'WELCOME10', type: 'percent', value: 10, minSubtotal: 10, expiresAt: future },
    { code: 'SAVE5', type: 'fixed', value: 5, minSubtotal: 20, expiresAt: future },
    { code: 'FREEDINE', type: 'fixed', value: 15, minSubtotal: 60, expiresAt: future },
  ]
}

// PUBLIC_INTERFACE
export function normalizeCoupon(c: Coupon): Coupon {
  /** Ensure values are numeric and currency rounded. */
  if (c.type === 'percent') {
    return { ...c, value: Math.max(0, Math.min(100, Number(c.value))) }
  }
  return { ...c, value: safeRound2(Number(c.value)) }
}

// PUBLIC_INTERFACE
export function couponMeetsSubtotal(subtotal: number, coupon?: Coupon | null): boolean {
  /** Verify if subtotal satisfies coupon minSubtotal (if any). */
  if (!coupon) return false
  const min = coupon.minSubtotal ?? 0
  return subtotal >= min
}
