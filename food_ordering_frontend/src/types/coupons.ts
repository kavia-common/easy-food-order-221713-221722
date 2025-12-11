//
// Coupon data models and validation context with restaurant scoping.
//
// Ocean Professional theme note: types only here.
//

export type CouponType = 'percent' | 'fixed'

export type CouponScope = {
  /**
   * If set, coupon applies only when cart context matches one of these restaurant IDs.
   * Empty or undefined means global (applies to any restaurant).
   */
  restaurantIds?: string[]
}

export type CouponLimits = {
  /** Minimum subtotal required before tax/fees to apply this coupon. */
  minSubtotal?: number
  /** ISO timestamp string for expiry. */
  expiresAt?: string
  /** Total times this coupon can be used across all users (global). */
  usageLimit?: number
  /** Current used count (server-managed normally; local mock increments). */
  usedCount?: number
  /** Max times a single restaurant can use this code (when scoped). Optional. */
  perRestaurantLimit?: number
}

export type CouponBase = CouponScope &
  CouponLimits & {
    id: string
    code: string
    active: boolean
    description?: string
    /**
     * Optional note shown to user/admin about this coupon's behavior.
     */
    note?: string
  }

export type PercentCoupon = CouponBase & {
  type: 'percent'
  /** Percentage off [0..100] */
  value: number
}

export type FixedCoupon = CouponBase & {
  type: 'fixed'
  /** Fixed currency amount off (>= 0) */
  value: number
}

export type Coupon = PercentCoupon | FixedCoupon

export type CouponCreateInput = Omit<Coupon, 'id' | 'usedCount'> & {
  /** usedCount is initialized to 0 in server or mock. */
  usedCount?: number
}

export type CouponUpdatePatch = Partial<
  Omit<Coupon, 'id' | 'code' | 'type'> & {
    /** Allow admin to edit code/type? Optional: kept immutable in basic UI. */
    code?: string
    type?: CouponType
  }
>

/**
 * Validation context passed from cart/checkout flows.
 */
export type CouponValidationContext = {
  /**
   * Subtotal before taxes/fees for items the coupon should be applied to.
   * For multi-restaurant carts, this could be total subtotal or per-restaurant subtotal,
   * depending on business rule. In this app, if multiple restaurants are present,
   * coupon is invalid unless global or matches all items uniformly.
   */
  subtotal: number
  /**
   * If the cart contains items from one or more restaurants, list them here.
   * When a single restaurant is present, you may set both restaurantIds=[id] and restaurantId=id for convenience.
   */
  restaurantIds?: string[]
  /** Convenience single restaurant id when applicable. */
  restaurantId?: string
}
