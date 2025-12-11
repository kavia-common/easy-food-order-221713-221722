<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useSubscriptionsStore } from '@/stores/subscriptions';
import type { SubscriptionPlan } from '@/types/subscriptions';

const subs = useSubscriptionsStore();
const { plans, loadingPlans, subscription, isActive } = storeToRefs(subs);
const busyPlan = ref<string | null>(null);
const toastMsg = ref<string | null>(null);
const toastType = ref<'success' | 'error'>('success');

onMounted(async () => {
  if (!plans.value.length) {
    await subs.loadPlans();
  }
  if (!subscription.value) {
    await subs.loadStatus();
  }
});

function planPerksList(plan: SubscriptionPlan): string[] {
  const list: string[] = [];
  if (plan.freeDeliveryEligible) list.push('Free delivery');
  if (plan.discountPercent) list.push(`${plan.discountPercent}% VIP discount`);
  if (plan.mealPlanCredits) list.push(`$${(plan.mealPlanCredits / 100).toFixed(0)} meal credits / ${plan.billingCycle}`);
  return list.length ? list : plan.benefits.map(b => b.description);
}

async function onSubscribe(planId: string) {
  try {
    busyPlan.value = planId;
    await subs.subscribeTo(planId);
    toastType.value = 'success';
    toastMsg.value = 'Subscription activated!';
  } catch (e) {
    toastType.value = 'error';
    const err = e as Error;
    toastMsg.value = err?.message || 'Failed to subscribe';
  } finally {
    busyPlan.value = null;
    setTimeout(() => (toastMsg.value = null), 2000);
  }
}

async function onCancel() {
  try {
    busyPlan.value = subscription.value?.planId || null;
    await subs.cancel();
    toastType.value = 'success';
    toastMsg.value = 'Subscription canceled';
  } catch (e) {
    toastType.value = 'error';
    const err = e as Error;
    toastMsg.value = err?.message || 'Failed to cancel';
  } finally {
    busyPlan.value = null;
    setTimeout(() => (toastMsg.value = null), 2000);
  }
}
</script>

<template>
  <div class="subs-page">
    <div class="head">
      <h1>Subscription Plans</h1>
      <p class="subtitle">Unlock perks like free delivery, VIP discounts, and monthly meal credits.</p>
    </div>

    <div v-if="toastMsg" class="toast" :class="toastType === 'success' ? 'toast-success' : 'toast-error'">
      {{ toastMsg }}
    </div>

    <div v-if="loadingPlans" class="cards">
      <div v-for="i in 3" :key="i" class="card skeleton"></div>
    </div>

    <div v-else-if="plans.length === 0" class="empty">
      <p>No plans available right now. Please check back later.</p>
    </div>

    <div v-else class="cards">
      <div v-for="p in plans" :key="p.id" class="card">
        <div class="card-head">
          <h2>{{ p.name }}</h2>
          <span v-if="p.highlight" class="highlight">{{ p.highlight }}</span>
        </div>
        <div class="price">
          <span class="amount">${{ (p.price / 100).toFixed(2) }}</span>
          <span class="cycle">/{{ p.billingCycle }}</span>
        </div>
        <ul class="perks">
          <li v-for="perk in planPerksList(p)" :key="perk">• {{ perk }}</li>
        </ul>
        <div class="actions">
          <button
            v-if="subscription?.planId !== p.id"
            class="btn primary"
            :disabled="!!busyPlan || (subscription?.status === 'active' && !!subscription?.planId)"
            @click="onSubscribe(p.id)"
          >
            <span v-if="busyPlan === p.id">Subscribing…</span>
            <span v-else>Subscribe</span>
          </button>
          <button
            v-else
            class="btn ghost"
            :disabled="!!busyPlan || !isActive"
            @click="onCancel"
          >
            <span v-if="busyPlan === p.id">Canceling…</span>
            <span v-else>Cancel</span>
          </button>
        </div>
      </div>
    </div>

    <div class="compare">
      <h3>Compare perks</h3>
      <div class="table">
        <div class="row header">
          <div class="cell">Plan</div>
          <div class="cell">Free Delivery</div>
          <div class="cell">VIP Discount</div>
          <div class="cell">Meal Credits</div>
        </div>
        <div class="row" v-for="p in plans" :key="p.id">
          <div class="cell">{{ p.name }}</div>
          <div class="cell">{{ p.freeDeliveryEligible ? 'Yes' : '—' }}</div>
          <div class="cell">{{ p.discountPercent ? p.discountPercent + '%' : '—' }}</div>
          <div class="cell">{{ p.mealPlanCredits ? '$' + (p.mealPlanCredits/100).toFixed(0) : '—' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.subs-page {
  max-width: 1100px;
  margin: 1rem auto 2rem;
  padding: 0 1rem;
}
.head h1 {
  font-size: 1.75rem;
  color: #111827;
}
.subtitle {
  color: #6B7280;
}
.toast {
  margin: 1rem 0;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid transparent;
}
.toast-success {
  background: #FEF3C7;
  color: #92400E;
  border-color: #FCD34D;
}
.toast-error {
  background: #FEE2E2;
  color: #7F1D1D;
  border-color: #FCA5A5;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}
.card {
  background: #ffffff;
  border: 1px solid #E5E7EB;
  border-radius: 0.75rem;
  padding: 1rem;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.highlight {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  background: #DBEAFE;
  color: #1E40AF;
  border: 1px solid #93C5FD;
}
.price {
  margin-top: 0.5rem;
  display: flex;
  align-items: flex-end;
  gap: 0.25rem;
}
.amount {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}
.cycle {
  color: #6B7280;
}
.perks {
  margin: 0.75rem 0;
  color: #374151;
}
.actions {
  display: flex;
  gap: 0.5rem;
}
.btn {
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #D1D5DB;
  background: #fff;
  color: #111827;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn:hover { background: #F9FAFB; }
.btn.primary {
  background: #2563EB;
  border-color: #1D4ED8;
  color: #ffffff;
}
.btn.primary:hover { background: #1D4ED8; }
.btn.ghost {
  background: #ffffff;
}
.skeleton {
  height: 220px;
  background: linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 37%, #E5E7EB 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
  border-radius: 0.75rem;
}
@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
.compare {
  margin-top: 2rem;
}
.table {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  border: 1px solid #E5E7EB;
  border-radius: 0.5rem;
}
.row {
  display: contents;
}
.row:not(.header) .cell {
  border-top: 1px solid #F3F4F6;
}
.cell {
  padding: 0.5rem 0.75rem;
}
.header .cell {
  background: #F3F4F6;
  font-weight: 600;
}
</style>
