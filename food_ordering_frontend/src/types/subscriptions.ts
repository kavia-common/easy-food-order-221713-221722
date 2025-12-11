export type BillingCycle = 'monthly' | 'annual';

export enum SubscriptionPerkType {
  FreeDelivery = 'free_delivery',
  VipDiscount = 'vip_discount',
  MealPlan = 'meal_plan',
}

export interface SubscriptionPerk {
  type: SubscriptionPerkType;
  description: string;
  // Optional value for perk if applicable (e.g., percent, credits)
  value?: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number; // price per cycle
  billingCycle: BillingCycle;
  benefits: SubscriptionPerk[];
  // Plan attributes to make calculation straightforward
  discountPercent?: number; // VIP discount percent if any
  freeDeliveryEligible?: boolean; // if true, waive delivery
  mealPlanCredits?: number; // credits per cycle
  highlight?: string; // optional marketing blurb
}

export type SubscriptionStatus = 'active' | 'canceled' | 'none' | 'past_due';

export interface UserSubscription {
  planId: string | null;
  status: SubscriptionStatus;
  startedAt?: string;
  currentPeriodEnd?: string;
  // resolved perks snapshot for quick use
  perks: SubscriptionPerk[];
  discountPercent?: number;
  freeDeliveryEligible?: boolean;
  mealPlanCreditsRemaining?: number;
}

// Helper used in cart to represent savings lines for display
export interface SubscriptionSavings {
  vipDiscountAmount: number;
  deliveryWaived: boolean;
  mealPlanCreditsApplied: number; // currency value applied
}
