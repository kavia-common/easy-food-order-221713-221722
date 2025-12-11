import { defineStore } from 'pinia';
import { cancelSubscription, getCurrentSubscription, getPerks, listPlans, subscribe } from '@/services/subscriptionsApi';
import type { SubscriptionPlan, SubscriptionSavings, UserSubscription } from '@/types/subscriptions';

interface State {
  plans: SubscriptionPlan[];
  loadingPlans: boolean;
  loadingStatus: boolean;
  error: string | null;
  subscription: UserSubscription | null;
}

const STORAGE_KEY = 'subs_store_snapshot_v1';

function safeGetItem(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSetItem(key: string, value: string) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function loadSnapshot(): Partial<State> | null {
  const raw = safeGetItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function persistSnapshot(state: State) {
  safeSetItem(STORAGE_KEY, JSON.stringify({
    plans: state.plans,
    subscription: state.subscription,
  }));
}

export const useSubscriptionsStore = defineStore('subscriptions', {
  state: (): State => ({
    plans: [],
    loadingPlans: false,
    loadingStatus: false,
    error: null,
    subscription: null,
  }),
  getters: {
    isActive: (state) => state.subscription?.status === 'active',
    activeDiscountPercent: (state) => state.subscription?.discountPercent || 0,
    hasFreeDelivery: (state) => !!state.subscription?.freeDeliveryEligible && state.subscription?.status === 'active',
    mealPlanCreditsRemaining: (state) => state.subscription?.mealPlanCreditsRemaining || 0,
  },
  actions: {
    async init() {
      const snapshot = loadSnapshot();
      if (snapshot) {
        if (snapshot.plans) this.plans = snapshot.plans as SubscriptionPlan[];
        if (snapshot.subscription) this.subscription = snapshot.subscription as UserSubscription;
      }
      await Promise.all([this.loadPlans(), this.loadStatus()]);
    },
    async loadPlans() {
      this.loadingPlans = true;
      this.error = null;
      try {
        this.plans = await listPlans();
      } catch (e) {
        const err = e as Error;
        this.error = err?.message || 'Failed to load plans';
      } finally {
        this.loadingPlans = false;
        persistSnapshot(this.$state);
      }
    },
    async loadStatus() {
      this.loadingStatus = true;
      this.error = null;
      try {
        this.subscription = await getCurrentSubscription();
      } catch (e) {
        const err = e as Error;
        this.error = err?.message || 'Failed to load subscription';
      } finally {
        this.loadingStatus = false;
        persistSnapshot(this.$state);
      }
    },
    // PUBLIC_INTERFACE
    async subscribeTo(planId: string) {
      /** Optimistic subscribe: set local state, roll back on error. */
      this.error = null;
      const prev = this.subscription ? { ...this.subscription } : null;
      try {
        // optimistic
        const plan = this.plans.find(p => p.id === planId);
        if (plan) {
          this.subscription = {
            planId,
            status: 'active',
            startedAt: new Date().toISOString(),
            perks: plan.benefits,
            discountPercent: plan.discountPercent || 0,
            freeDeliveryEligible: !!plan.freeDeliveryEligible,
            mealPlanCreditsRemaining: plan.mealPlanCredits || 0,
          };
          persistSnapshot(this.$state);
        }
        const result = await subscribe(planId);
        this.subscription = result;
        persistSnapshot(this.$state);
      } catch (e) {
        if (prev) this.subscription = prev;
        const err = (e as Error);
        this.error = err?.message || 'Failed to subscribe';
      }
    },
    // PUBLIC_INTERFACE
    async cancel() {
      /** Cancel current subscription. Optimistic with rollback. */
      this.error = null;
      const prev = this.subscription ? { ...this.subscription } : null;
      try {
        if (this.subscription) {
          this.subscription = { ...this.subscription, status: 'canceled' };
          persistSnapshot(this.$state);
        }
        const result = await cancelSubscription();
        this.subscription = result;
        persistSnapshot(this.$state);
      } catch (e) {
        if (prev) this.subscription = prev;
        const err = (e as Error);
        this.error = err?.message || 'Failed to cancel subscription';
      }
    },
    // PUBLIC_INTERFACE
    async refreshPerks() {
      /** Manual refresh of perks from API/local. */
      try {
        const perks = await getPerks();
        if (this.subscription) {
          this.subscription.perks = perks;
          persistSnapshot(this.$state);
        }
      } catch {
        // ignore
      }
    },
    // PUBLIC_INTERFACE
    consumeMealCredits(amountCents: number): number {
      /** Consumes available meal plan credits; returns applied amount (<= requested) */
      if (!this.subscription || this.subscription.status !== 'active') return 0;
      const remaining = this.subscription.mealPlanCreditsRemaining || 0;
      if (remaining <= 0) return 0;
      const applied = Math.min(remaining, Math.max(0, Math.floor(amountCents)));
      this.subscription.mealPlanCreditsRemaining = remaining - applied;
      persistSnapshot(this.$state);
      return applied;
    },
    // PUBLIC_INTERFACE
    getSavingsLine(): SubscriptionSavings {
      /** Returns current savings amounts for display. Amounts are in cents. */
      return {
        vipDiscountAmount: 0,
        deliveryWaived: this.hasFreeDelivery,
        mealPlanCreditsApplied: 0,
      };
    },
  },
});
