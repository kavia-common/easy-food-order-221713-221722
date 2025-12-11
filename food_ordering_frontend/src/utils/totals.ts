import { applyBestCoupon } from '@/services/couponsHelper';
import { useSubscriptionsStore } from '@/stores/subscriptions';

export interface TotalsInput {
  lineItems: Array<{ price: number; quantity: number }>; // cents
  deliveryFee: number; // cents
  taxRate: number; // fraction, e.g., 0.08
  appliedCouponCode?: string | null;
}

export interface TotalsOutput {
  subtotal: number;
  couponDiscount: number;
  vipDiscount: number;
  mealCreditsApplied: number;
  tax: number;
  deliveryFee: number;
  total: number;
}

// PUBLIC_INTERFACE
export function calculateTotals(input: TotalsInput): TotalsOutput {
  /** Calculates totals with order: subtotal -> coupon -> VIP -> tax -> delivery (waived if free_delivery). */
  const subs = useSubscriptionsStore();

  const subtotal = input.lineItems.reduce((acc, li) => acc + li.price * li.quantity, 0);

  // Coupons first (existing behavior)
  const couponResult = applyBestCoupon(subtotal, input.appliedCouponCode || undefined);
  const afterCoupon = Math.max(0, subtotal - couponResult.discount);

  // VIP discount next
  const vipPercent = subs.isActive ? subs.activeDiscountPercent : 0;
  const vipDiscount = Math.round((afterCoupon * vipPercent) / 100);
  const afterVip = Math.max(0, afterCoupon - vipDiscount);

  // Meal plan credits apply to item total (not fees or tax); consume credits
  let mealCreditsApplied = 0;
  if (subs.isActive && subs.mealPlanCreditsRemaining > 0) {
    const applied = subs.consumeMealCredits(afterVip);
    mealCreditsApplied = applied;
  }
  const afterCredits = Math.max(0, afterVip - mealCreditsApplied);

  // Tax on items after discounts/credits
  const tax = Math.round(afterCredits * input.taxRate);

  // Delivery fee last; waived if free delivery
  const deliveryFee = subs.hasFreeDelivery ? 0 : input.deliveryFee;

  const total = afterCredits + tax + deliveryFee;

  return {
    subtotal,
    couponDiscount: couponResult.discount,
    vipDiscount,
    mealCreditsApplied,
    tax,
    deliveryFee,
    total,
  };
}
