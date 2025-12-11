/**
 * Coupon and number helpers used across the app.
 * Maintains two-decimal precision and avoids returning -0.
 */

export function toCurrency(value: number): number {
  // Keep two-decimal currency precision
  const n = Math.round(value * 100) / 100;
  // Avoid -0 using Object.is for exact -0 detection
  return Object.is(n, -0) ? 0 : n;
}

// PUBLIC_INTERFACE
export function clampCurrency(value: number): number {
  /** Clamp to two decimals and min zero for totals display. */
  return Math.max(0, toCurrency(value));
}

export function applyPercentage(value: number, percent: number): number {
  return toCurrency(value * (1 - percent / 100));
}

export function applyFixed(value: number, amountOff: number): number {
  return toCurrency(value - amountOff);
}

export type Coupon =
  | { type: 'percent'; code: string; value: number }   // value in [0..100]
  | { type: 'fixed'; code: string; value: number };    // fixed currency off

// PUBLIC_INTERFACE
export function calcDiscount(subtotal: number, coupon?: Coupon | null): number {
  /** Calculate the discount amount for a given subtotal and coupon (non-negative). */
  if (!coupon) return 0;
  if (coupon.type === 'percent') {
    const discounted = subtotal - applyPercentage(subtotal, coupon.value);
    return clampCurrency(discounted);
  }
  return clampCurrency(Math.min(subtotal, coupon.value));
}

// PUBLIC_INTERFACE
export function applyCoupon(subtotal: number, coupon?: Coupon | null): number {
  /** Apply a coupon to the subtotal and return the new total (not below zero). */
  if (!coupon) return toCurrency(subtotal);
  if (coupon.type === 'percent') {
    return clampCurrency(applyPercentage(subtotal, coupon.value));
  }
  return clampCurrency(applyFixed(subtotal, coupon.value));
}

// PUBLIC_INTERFACE
export function validateCoupon(code: string, available: Coupon[]): Coupon | null {
  /** Validate a coupon code against available coupons; returns the coupon or null. */
  const c = available.find((c) => c.code.toLowerCase() === code.trim().toLowerCase());
  if (!c) return null;
  if (c.type === 'percent' && (c.value < 0 || c.value > 100)) return null;
  if (c.type === 'fixed' && c.value < 0) return null;
  return c;
}

// PUBLIC_INTERFACE
export function findCouponByCode(code: string, available: Coupon[]): Coupon | null {
  /** Find a coupon by code, case-insensitive. */
  return available.find((c) => c.code.toLowerCase() === code.trim().toLowerCase()) || null;
}
