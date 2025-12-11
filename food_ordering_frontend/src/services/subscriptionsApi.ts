import { SubscriptionPerkType, type SubscriptionPerk, type SubscriptionPlan, type UserSubscription } from '@/types/subscriptions';

const STORAGE_KEYS = {
  plans: 'subs_plans_v1',
  userSub: 'subs_user_v1',
  cacheTs: 'subs_cache_ts_v1',
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// SSR-safe storage guards
function safeGetItem(key: string): string | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSetItem(key: string, value: string) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function now(): number {
  return Date.now();
}

function hasFreshCache(): boolean {
  const ts = safeGetItem(STORAGE_KEYS.cacheTs);
  if (!ts) return false;
  const n = parseInt(ts, 10);
  return Number.isFinite(n) && now() - n < CACHE_TTL_MS;
}

// Mock plans, visually aligned to Ocean Professional theme intent
function mockPlans(): SubscriptionPlan[] {
  const perksBasic: SubscriptionPerk[] = [
    { type: SubscriptionPerkType.FreeDelivery, description: 'Free delivery on eligible orders', value: 1 },
  ];
  const perksVip: SubscriptionPerk[] = [
    { type: SubscriptionPerkType.FreeDelivery, description: 'Free delivery on all orders', value: 1 },
    { type: SubscriptionPerkType.VipDiscount, description: 'VIP discount on every order', value: 10 },
  ];
  const perksMeal: SubscriptionPerk[] = [
    { type: SubscriptionPerkType.MealPlan, description: 'Monthly meal plan credits', value: 2000 }, // in cents
    { type: SubscriptionPerkType.VipDiscount, description: 'VIP discount on every order', value: 5 },
    { type: SubscriptionPerkType.FreeDelivery, description: 'Free delivery on eligible orders', value: 1 },
  ];
  return [
    {
      id: 'basic-monthly',
      name: 'Basic',
      price: 499, // cents
      billingCycle: 'monthly',
      benefits: perksBasic,
      freeDeliveryEligible: true,
      discountPercent: 0,
      mealPlanCredits: 0,
      highlight: 'Free delivery on eligible orders',
    },
    {
      id: 'vip-monthly',
      name: 'VIP',
      price: 1299,
      billingCycle: 'monthly',
      benefits: perksVip,
      freeDeliveryEligible: true,
      discountPercent: 10,
      mealPlanCredits: 0,
      highlight: 'Best for frequent orders: free delivery + 10% off',
    },
    {
      id: 'mealpro-monthly',
      name: 'Meal Pro',
      price: 1999,
      billingCycle: 'monthly',
      benefits: perksMeal,
      freeDeliveryEligible: true,
      discountPercent: 5,
      mealPlanCredits: 2000, // $20 credits
      highlight: 'Get $20 meal credits monthly + perks',
    },
  ];
}

function defaultUserSubscription(): UserSubscription {
  return {
    planId: null,
    status: 'none',
    perks: [],
    discountPercent: 0,
    freeDeliveryEligible: false,
    mealPlanCreditsRemaining: 0,
  };
}

function persistPlans(plans: SubscriptionPlan[]) {
  safeSetItem(STORAGE_KEYS.plans, JSON.stringify(plans));
  safeSetItem(STORAGE_KEYS.cacheTs, String(now()));
}

function persistUserSub(sub: UserSubscription) {
  safeSetItem(STORAGE_KEYS.userSub, JSON.stringify(sub));
}

function loadPlansFromStorage(): SubscriptionPlan[] | null {
  const raw = safeGetItem(STORAGE_KEYS.plans);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadUserSubFromStorage(): UserSubscription | null {
  const raw = safeGetItem(STORAGE_KEYS.userSub);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function fetchFromApi<T>(path: string): Promise<T> {
  const base = import.meta.env.VITE_API_BASE || '';
  if (!base) {
    // no backend, throw to use mock fallback
    throw new Error('No API base configured');
  }
  const url = `${base.replace(/\/$/, '')}${path}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// PUBLIC_INTERFACE
export async function listPlans(): Promise<SubscriptionPlan[]> {
  /** Returns available subscription plans; uses API if available, otherwise local mock with caching. */
  // Try cache
  if (hasFreshCache()) {
    const cached = loadPlansFromStorage();
    if (cached) return cached;
  }
  // Try API
  try {
    const plans = await fetchFromApi<SubscriptionPlan[]>('/subscriptions/plans');
    persistPlans(plans);
    return plans;
  } catch {
    const plans = mockPlans();
    persistPlans(plans);
    return plans;
  }
}

// PUBLIC_INTERFACE
export async function getCurrentSubscription(): Promise<UserSubscription> {
  /** Returns current user subscription from API if present, else local storage mock. */
  try {
    const sub = await fetchFromApi<UserSubscription>('/subscriptions/current');
    persistUserSub(sub);
    return sub;
  } catch {
    const local = loadUserSubFromStorage();
    if (local) return local;
    const def = defaultUserSubscription();
    persistUserSub(def);
    return def;
  }
}

// PUBLIC_INTERFACE
export async function subscribe(planId: string): Promise<UserSubscription> {
  /** Subscribe to a plan. When API missing, persists locally to storage. */
  try {
    const sub = await fetchFromApi<UserSubscription>(`/subscriptions/subscribe?planId=${encodeURIComponent(planId)}`);
    persistUserSub(sub);
    return sub;
  } catch {
    const plans = (await listPlans()) || [];
    const plan = plans.find(p => p.id === planId);
    if (!plan) throw new Error('Plan not found');
    const sub: UserSubscription = {
      planId: plan.id,
      status: 'active',
      startedAt: new Date().toISOString(),
      currentPeriodEnd: undefined,
      perks: plan.benefits,
      discountPercent: plan.discountPercent || 0,
      freeDeliveryEligible: !!plan.freeDeliveryEligible,
      mealPlanCreditsRemaining: plan.mealPlanCredits || 0,
    };
    persistUserSub(sub);
    return sub;
  }
}

// PUBLIC_INTERFACE
export async function cancelSubscription(): Promise<UserSubscription> {
  /** Cancels current subscription; local mock marks status 'canceled' and preserves remaining perks for the period. */
  try {
    const sub = await fetchFromApi<UserSubscription>('/subscriptions/cancel');
    persistUserSub(sub);
    return sub;
  } catch {
    const current = await getCurrentSubscription();
    const canceled: UserSubscription = {
      ...current,
      status: current.planId ? 'canceled' : 'none',
    };
    persistUserSub(canceled);
    return canceled;
  }
}

// PUBLIC_INTERFACE
export async function getPerks(): Promise<SubscriptionPerk[]> {
  /** Retrieves resolved perks for current user subscription. */
  const sub = await getCurrentSubscription();
  return sub.perks || [];
}
