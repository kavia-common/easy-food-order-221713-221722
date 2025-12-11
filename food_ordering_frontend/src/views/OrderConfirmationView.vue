<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getLastOrder } from '@/services/orders'
import ReviewForm from '@/components/ReviewForm.vue'
import RatingStars from '@/components/RatingStars.vue'
import {
  submitRestaurantReview,
  submitDeliveryReview,
  getRestaurantRatingSummary,
  getDeliveryRatingSummary
} from '@/services/ratings'

const route = useRoute()
const router = useRouter()
const order = ref(getLastOrder())

const restaurantSummary = ref(order.value?.restaurantId ? getRestaurantRatingSummary(String(order.value.restaurantId)) : { average:0, count:0, distribution:{1:0,2:0,3:0,4:0,5:0}})
const deliverySummary = ref(order.value?.deliveryPersonId ? getDeliveryRatingSummary(String(order.value.deliveryPersonId)) : { average:0, count:0, distribution:{1:0,2:0,3:0,4:0,5:0}})

const submittingRestaurant = ref(false)
const submittingDelivery = ref(false)

async function handleSubmitRestaurant(payload: { stars: number; comment: string }) {
  if (!order.value?.restaurantId) return
  submittingRestaurant.value = true
  const res = await submitRestaurantReview({
    restaurantId: String(order.value.restaurantId),
    orderId: String(order.value.id),
    stars: Math.max(1, Math.min(5, Math.round(payload.stars))) as 1|2|3|4|5,
    comment: payload.comment
  })
  submittingRestaurant.value = false
  if (res.ok && order.value?.restaurantId) {
    restaurantSummary.value = getRestaurantRatingSummary(String(order.value.restaurantId))
  }
}

async function handleSubmitDelivery(payload: { stars: number; comment: string }) {
  if (!order.value?.deliveryPersonId) return
  submittingDelivery.value = true
  const res = await submitDeliveryReview({
    deliveryPersonId: String(order.value.deliveryPersonId),
    orderId: String(order.value.id),
    stars: Math.max(1, Math.min(5, Math.round(payload.stars))) as 1|2|3|4|5,
    comment: payload.comment
  })
  submittingDelivery.value = false
  if (res.ok && order.value?.deliveryPersonId) {
    deliverySummary.value = getDeliveryRatingSummary(String(order.value.deliveryPersonId))
  }
}

onMounted(() => {
  // if deep-linked or missing, still allow showing id from route
  if (!order.value) {
    // Navigate back to orders page
    setTimeout(() => router.replace({ name: 'orders' }), 2000)
  }
})

function fmt(n: number) {
  return `$${n.toFixed(2)}`
}
</script>

<template>
  <div class="wrap">
    <div class="card">
      <div class="icon">✅</div>
      <h2>Thank you!</h2>
      <p v-if="order">Your order <strong>#{{ order.id }}</strong> has been placed.</p>
      <p v-else>Order placed. Redirecting…</p>

      <div v-if="order" class="summary">
        <div class="row"><span>Items</span><span>{{ order.lines.reduce((s,l)=>s+l.qty,0) }}</span></div>
        <div class="row"><span>Subtotal</span><span>{{ fmt(order.totals.subtotal) }}</span></div>
        <div class="row" v-if="order.totals.discount && order.totals.discount > 0"><span>Discount</span><span>-{{ fmt(order.totals.discount) }}</span></div>
        <div class="row"><span>Tax</span><span>{{ fmt(order.totals.tax) }}</span></div>
        <div class="row" v-if="order.totals && (order.totals as any).deliveryFee"><span>Delivery</span><span>{{ fmt((order.totals as any).deliveryFee) }}</span></div>
        <div class="row total"><span>Total</span><span>{{ fmt(order.totals.total) }}</span></div>
      </div>

      <div class="actions">
        <RouterLink class="btn" to="/orders">View Orders</RouterLink>
        <RouterLink class="btn ghost" to="/">Continue browsing</RouterLink>
      </div>

      <section v-if="order" class="rating-prompts">
        <h3 class="prompt-title">How was your experience?</h3>
        <div class="cards">
          <div class="card-item">
            <h4 class="subtitle">Rate the Restaurant</h4>
            <p class="meta">Order #{{ order.id }} • Restaurant {{ order.restaurantId }}</p>
            <div class="inline-form">
              <ReviewForm :submitting="submittingRestaurant" @submit="handleSubmitRestaurant" />
            </div>
            <div class="summary">
              <span class="sum-label">Current average:</span>
              <RatingStars :model-value="restaurantSummary.average" readonly />
              <span class="sum-text">{{ restaurantSummary.average.toFixed(1) }} ({{ restaurantSummary.count }})</span>
            </div>
          </div>
          <div class="card-item" v-if="order.deliveryPersonId">
            <h4 class="subtitle">Rate the Delivery</h4>
            <p class="meta">Delivered by {{ order.deliveryPersonId }}</p>
            <div class="inline-form">
              <ReviewForm :submitting="submittingDelivery" @submit="handleSubmitDelivery" />
            </div>
            <div class="summary">
              <span class="sum-label">Current average:</span>
              <RatingStars :model-value="deliverySummary.average" readonly />
              <span class="sum-text">{{ deliverySummary.average.toFixed(1) }} ({{ deliverySummary.count }})</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.wrap { display: grid; place-items: center; }
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1rem 1.2rem;
  max-width: 640px; width: 100%;
  text-align: center;
  box-shadow: 0 14px 40px rgba(0,0,0,.08);
}
.icon { font-size: 48px; margin-bottom: .5rem; }
.summary { margin-top: .8rem; text-align: left; }
.row { display: flex; justify-content: space-between; padding: .25rem 0; color: #374151; }
.total { font-weight: 800; color: var(--text); }
.actions { display: flex; gap: .6rem; justify-content: center; margin-top: 1rem; }
.btn {
  display: inline-block;
  background: var(--primary);
  color: #fff;
  padding: .6rem .9rem;
  border-radius: 10px;
  text-decoration: none;
  box-shadow: 0 6px 16px rgba(37,99,235,.25);
}
.btn.ghost {
  background: #fff;
  border: 1px solid var(--border);
  color: var(--text);
  box-shadow: none;
}
.rating-prompts {
  margin-top: 1rem;
  text-align: left;
}
.prompt-title {
  font-size: 1.1rem;
  color: #111827;
  margin-bottom: .5rem;
}
.cards {
  display: grid;
  gap: 1rem;
}
.card-item {
  border: 1px dashed #e5e7eb;
  border-radius: 10px;
  padding: .75rem;
  background: linear-gradient(to bottom right, rgba(37,99,235,0.04), rgba(245,158,11,0.05));
}
.subtitle {
  color: #111827;
  font-weight: 600;
}
.meta {
  color: #6b7280;
  margin-bottom: .5rem;
}
.inline-form {
  margin-bottom: .5rem;
}
.summary {
  display: flex;
  align-items: center;
  gap: .5rem;
}
.sum-label, .sum-text {
  color: #374151;
}
</style>
