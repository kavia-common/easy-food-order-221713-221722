<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCartStore } from '@/stores/cart'
import QuantityStepper from './QuantityStepper.vue'
import { useRouter } from 'vue-router'
import { useSubscriptionsStore } from '@/stores/subscriptions'
import { calculateTotals } from '@/utils/totals'

const cart = useCartStore()
const subs = useSubscriptionsStore()
const showCalories = ref<boolean>(false)
const router = useRouter()

const couponInput = ref<string>(cart.appliedCouponCode || '')
function apply() {
  if (!couponInput.value) return
  cart.applyCoupon(couponInput.value)
}
function removeCoupon() {
  cart.removeCoupon()
  couponInput.value = ''
}

const totals = computed(() => {
  return calculateTotals({
    lineItems: cart.lines.map(l => ({ price: Math.round(l.price * 100), quantity: l.qty })), // convert to cents if stored as dollars
    deliveryFee: 499, // static fallback; could be from settings
    taxRate: cart.taxRate, // cart.taxRate already fraction (0.08)
    appliedCouponCode: cart.appliedCouponCode || undefined,
  })
})

const formatted = computed(() => {
  const fmt = (cents: number) => (cents / 100).toFixed(2)
  return {
    subtotal: fmt(totals.value.subtotal),
    coupon: totals.value.couponDiscount > 0 ? `- $${fmt(totals.value.couponDiscount)}` : null,
    vip: totals.value.vipDiscount > 0 ? `- $${fmt(totals.value.vipDiscount)}` : null,
    credits: totals.value.mealCreditsApplied > 0 ? `- $${fmt(totals.value.mealCreditsApplied)}` : null,
    tax: fmt(totals.value.tax),
    deliveryFee: fmt(totals.value.deliveryFee),
    total: fmt(totals.value.total),
    creditsRemaining: subs.mealPlanCreditsRemaining,
  }
})
</script>

<template>
  <div class="panel" aria-label="Cart panel">
    <h2>Cart</h2>
    <div v-if="!cart.lines.length" class="empty">
      Your cart is empty.
    </div>
    <div v-if="cart.lines.length" class="small-toggle">
      <label><input type="checkbox" v-model="showCalories" /> Show calories</label>
    </div>
    <ul v-else class="lines">
      <li v-for="l in cart.lines" :key="l.id" class="line">
        <img v-if="l.image" :src="l.image" :alt="l.name" />
        <div class="meta">
          <div class="name">{{ l.name }}</div>
          <div class="price">${{ l.price.toFixed(2) }}</div>
          <div v-if="showCalories" class="cals">~ — kcal each</div>
          <QuantityStepper :model-value="l.qty" @update:modelValue="(v)=>cart.updateQty(l.id,v)" />
        </div>
        <button class="remove" @click="cart.removeItem(l.id)" aria-label="Remove">×</button>
      </li>
    </ul>

    <div v-if="cart.lines.length" class="coupon">
      <label class="field">
        <span>Coupon</span>
        <div class="row">
          <input
            :value="couponInput"
            @input="(e:any)=>couponInput = e.target.value"
            placeholder="Enter coupon code"
            aria-label="Coupon code"
          />
          <button class="apply" @click="apply" :disabled="!couponInput">Apply</button>
          <button v-if="cart.appliedCouponCode" class="remove-coupon" @click="removeCoupon" aria-label="Remove coupon">Remove</button>
        </div>
      </label>
      <p v-if="cart.couponError" class="help error" role="alert">{{ cart.couponError }}</p>
      <p v-else-if="cart.appliedCouponCode" class="help success" aria-live="polite">
        Applied: <strong>{{ cart.appliedCouponCode }}</strong>
      </p>
    </div>

    <div class="summary" aria-label="Order summary">
      <div class="row"><span>Subtotal</span><span>${{ formatted.subtotal }}</span></div>
      <div v-if="formatted.coupon" class="row savings"><span>Coupon</span><span>{{ formatted.coupon }}</span></div>
      <div v-if="formatted.vip" class="row savings"><span>VIP Discount</span><span>{{ formatted.vip }}</span></div>
      <div v-if="formatted.credits" class="row savings"><span>Meal Credits</span><span>{{ formatted.credits }}</span></div>
      <div class="row"><span>Tax</span><span>${{ formatted.tax }}</span></div>
      <div class="row"><span>Delivery</span><span>${{ formatted.deliveryFee }}</span></div>
      <div v-if="formatted.creditsRemaining > 0" class="credits-remaining">Meal credits left: ${{ (formatted.creditsRemaining/100).toFixed(2) }}</div>
      <div class="row total"><span>Total</span><span>${{ formatted.total }}</span></div>
      <button class="checkout" :disabled="!cart.lines.length" @click="router.push('/checkout')">
        Proceed to Checkout
      </button>
    </div>
  </div>
</template>

<style scoped>
.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.06);
  padding: 1rem;
}
h2 { margin-bottom: .5rem; }

.small-toggle {
  margin: .25rem 0 .5rem;
  color: #6B7280;
  font-size: .9rem;
}
.cals { color: #6B7280; font-size: .85rem; }
.empty {
  color: #6b7280;
  padding: .75rem;
  border: 1px dashed var(--border);
  border-radius: 12px;
  text-align: center;
}

.lines { list-style: none; padding: 0; margin: 0; display: grid; gap: .5rem; }
.line {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: .5rem;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: .5rem;
}
.line img {
  width: 56px; height: 56px; object-fit: cover; border-radius: 10px;
}
.meta { display: grid; gap: .25rem; }
.name { font-weight: 600; }
.price { color: #374151; font-weight: 600; }

.remove {
  border: none; background: transparent; cursor: pointer; font-size: 18px;
  width: 32px; height: 32px; border-radius: 8px;
}
.remove:hover { background: #f3f4f6; }

.coupon {
  margin-top: .75rem;
  padding-top: .5rem;
  border-top: 1px dashed var(--border);
}
.field { display: grid; gap: .35rem; }
.field span { color: #374151; font-size: .9rem; }
.row { display: flex; gap: .5rem; align-items: center; }
input {
  flex: 1;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: .5rem .7rem;
  background: var(--surface);
  outline: none;
}
input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(37,99,235,0.12); }
.apply {
  background: var(--primary);
  color: #fff;
  border: none;
  padding: .5rem .8rem;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
}
.remove-coupon {
  background: #f3f4f6;
  color: #111827;
  border: 1px solid var(--border);
  padding: .5rem .7rem;
  border-radius: 10px;
  cursor: pointer;
}
.help { margin: .4rem 0 0; font-size: .9rem; }
.help.error { color: #991b1b; }
.help.success { color: #065f46; }

.summary {
  margin-top: 1rem;
  display: grid;
  gap: .4rem;
}
.row { display: flex; justify-content: space-between; color: #374151; }
.savings { color: #065f46; }
.total { font-weight: 800; color: var(--text); }
.checkout {
  margin-top: .5rem;
  background: var(--secondary);
  color: #111827;
  border: none;
  padding: .7rem .9rem;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
}
.checkout:disabled { opacity: .6; cursor: not-allowed; }
.credits-remaining {
  margin: 0.25rem 0;
  font-size: 0.875rem;
  color: #6B7280;
}
</style>
