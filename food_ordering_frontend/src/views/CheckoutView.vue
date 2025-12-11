<script setup lang="ts">
import CheckoutForm from '@/components/CheckoutForm.vue'
import { useCartStore } from '@/stores/cart'
import { computed } from 'vue'
import { calculateTotals } from '@/utils/totals'
import { useSubscriptionsStore } from '@/stores/subscriptions'

const cart = useCartStore()
const subs = useSubscriptionsStore()

const totals = computed(() => {
  return calculateTotals({
    lineItems: cart.lines.map(l => ({ price: Math.round(l.price * 100), quantity: l.qty })),
    deliveryFee: 499,
    taxRate: cart.taxRate,
    appliedCouponCode: cart.appliedCouponCode || undefined,
  })
})
const fmt = (cents: number) => (cents / 100).toFixed(2)
</script>

<template>
  <div class="grid">
    <section class="left">
      <CheckoutForm />
    </section>
    <aside class="right">
      <div class="card" aria-label="Order summary">
        <h3>Order Summary</h3>
        <div class="row"><span>Items</span><span>{{ cart.count }}</span></div>
        <div class="row"><span>Subtotal</span><span>${{ fmt(totals.subtotal) }}</span></div>
        <div v-if="totals.couponDiscount > 0" class="row savings"><span>Coupon</span><span>- ${{ fmt(totals.couponDiscount) }}</span></div>
        <div v-if="totals.vipDiscount > 0" class="row savings"><span>VIP Discount</span><span>- ${{ fmt(totals.vipDiscount) }}</span></div>
        <div v-if="totals.mealCreditsApplied > 0" class="row savings"><span>Meal Credits</span><span>- ${{ fmt(totals.mealCreditsApplied) }}</span></div>
        <div class="row"><span>Tax</span><span>${{ fmt(totals.tax) }}</span></div>
        <div class="row"><span>Delivery</span><span>${{ fmt(totals.deliveryFee) }}</span></div>
        <div v-if="subs.mealPlanCreditsRemaining > 0" class="applied" aria-live="polite">
          Credits remaining after order: <strong>${{ (subs.mealPlanCreditsRemaining/100).toFixed(2) }}</strong>
        </div>
        <div class="row total"><span>Total</span><span>${{ fmt(totals.total) }}</span></div>
        <p v-if="cart.appliedCouponCode" class="applied" aria-live="polite">Coupon applied: <strong>{{ cart.appliedCouponCode }}</strong></p>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 1024px) {
  .grid { grid-template-columns: 1fr 320px; }
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1rem;
  box-shadow: 0 8px 20px rgba(0,0,0,0.06);
}
h3 { margin-bottom: .5rem; }
.row { display: flex; justify-content: space-between; padding: .25rem 0; color: #374151; }
.savings { color: #065f46; }
.total { font-weight: 800; color: var(--text); }
.applied { margin-top: .4rem; color: #374151; font-size: .9rem; }
</style>
