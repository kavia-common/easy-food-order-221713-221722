export type CouponResult = {
  discount: number; // amount in cents
};

/**
 * Simple validity check against a list of known coupon codes.
 */
export function isCouponValid(code?: string): boolean {
  if (!code) return false;
  const norm = code.trim().toUpperCase();
  const valid = ['WELCOME10', 'SAVE10', 'OCEAN10'];
  return valid.includes(norm);
}

/**
 * PUBLIC_INTERFACE
 * Returns the discount amount in cents for the given subtotal and coupon code.
 * Current logic: flat 10% off for known codes, capped at $20 (2000 cents).
 */
export function applyBestCoupon(subtotalCents: number, code?: string): CouponResult {
  if (!code || !isCouponValid(code)) return { discount: 0 };
  const percent = 10; // 10%
  const maxCents = 2000;
  const discount = Math.min(Math.round((subtotalCents * percent) / 100), maxCents);
  return { discount };
}
