<template>
  <main class="container">
    <header class="page-header">
      <h1>Order #{{ id }}</h1>
      <div class="actions">
        <button class="btn-outline" @click="reorder">Reorder</button>
        <RouterLink :to="`/orders/${id}/invoice`" class="btn-primary">Invoice / Print</RouterLink>
      </div>
    </header>

    <section v-if="orders.loading" aria-busy="true" class="skeleton">
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
    </section>

    <section v-else-if="!detail" class="empty">Order not found.</section>

    <section v-else class="grid">
      <article class="panel">
        <h2>Summary</h2>
        <p><strong>Status:</strong> <span class="badge" :data-status="detail.status">{{ prettyStatus(detail.status) }}</span></p>
        <p><strong>Placed:</strong> {{ new Date(detail.placedAt).toLocaleString() }}</p>
        <p><strong>Restaurant:</strong> {{ detail.restaurantName }}</p>
        <p v-if="detail.fulfillment.type === 'delivery'"><strong>Fulfillment:</strong> Delivery</p>
        <p v-else><strong>Fulfillment:</strong> Pickup</p>
      </article>

      <article class="panel">
        <h2>Items</h2>
        <ul class="lines">
          <li v-for="l in detail.lines" :key="l.id" class="line">
            <img v-if="l.imageUrl" :src="l.imageUrl" :alt="l.name" />
            <div class="info">
              <div class="name">{{ l.name }}</div>
              <div class="options" v-if="l.options?.length">{{ l.options.join(', ') }}</div>
              <div class="qty">{{ l.quantity }} × {{ formatMoney(l.unitPrice.amount, l.unitPrice.currency) }}</div>
            </div>
            <div class="sum">{{ formatMoney(l.unitPrice.amount * l.quantity, l.unitPrice.currency) }}</div>
          </li>
        </ul>
        <div class="totals">
          <div><span>Subtotal</span><span>{{ formatMoney(detailTotals.subtotal.amount, detailTotals.subtotal.currency) }}</span></div>
          <div v-if="detailTotals.discount"><span>Discount</span><span>-{{ formatMoney(detailTotals.discount.amount, detailTotals.discount.currency) }}</span></div>
          <div><span>Tax</span><span>{{ formatMoney(detailTotals.tax.amount, detailTotals.tax.currency) }}</span></div>
          <div v-if="detailTotals.deliveryFee"><span>Delivery</span><span>{{ formatMoney(detailTotals.deliveryFee.amount, detailTotals.deliveryFee.currency) }}</span></div>
          <div class="grand"><span>Total</span><span>{{ formatMoney(detailTotals.total.amount, detailTotals.total.currency) }}</span></div>
        </div>
      </article>

      <article v-if="detail.addressSnapshot" class="panel">
        <h2>Delivery Address</h2>
        <address>
          <div>{{ detail.addressSnapshot.fullName }}</div>
          <div>{{ detail.addressSnapshot.line1 }}</div>
          <div v-if="detail.addressSnapshot.line2">{{ detail.addressSnapshot.line2 }}</div>
          <div>{{ detail.addressSnapshot.city }} {{ detail.addressSnapshot.state }} {{ detail.addressSnapshot.postalCode }}</div>
          <div>{{ detail.addressSnapshot.country }}</div>
          <div v-if="detail.addressSnapshot.phone">{{ detail.addressSnapshot.phone }}</div>
        </address>
      </article>

      <article v-if="detail.paymentSnapshot" class="panel">
        <h2>Payment</h2>
        <p>
          Method: {{ detail.paymentSnapshot.method.toUpperCase() }}
          <span v-if="detail.paymentSnapshot.brand">({{ detail.paymentSnapshot.brand }})</span>
          <span v-if="detail.paymentSnapshot.last4">•••• {{ detail.paymentSnapshot.last4 }}</span>
        </p>
        <p>Status: <strong :class="detail.paymentSnapshot.paid ? 'ok' : 'warn'">{{ detail.paymentSnapshot.paid ? 'Paid' : 'Unpaid' }}</strong></p>
      </article>

      <article v-if="detail && detail.fulfillment.type === 'delivery'" class="panel">
        <h2>Rate your delivery</h2>
        <section v-if="deliveryLoading" aria-busy="true" class="skeleton">
          <div class="skeleton-card"></div>
        </section>
        <section v-else>
          <div v-if="existingDeliveryReview" class="mb-2">
            <div class="text-sm text-gray-700">Your previous rating</div>
            <div class="flex items-center gap-2 mt-1">
              <StarRating :model-value="existingDeliveryReview.rating" readonly />
              <span class="text-xs text-gray-600">{{ existingDeliveryReview.rating.toFixed(1) }}</span>
            </div>
            <p class="text-sm text-gray-700 mt-1 whitespace-pre-line">{{ existingDeliveryReview.comment }}</p>
          </div>
          <ReviewForm
            v-if="hasDeliveryPerson"
            :initial-rating="existingDeliveryReview?.rating || 0"
            :initial-comment="existingDeliveryReview?.comment || ''"
            :submit-label="existingDeliveryReview ? 'Update review' : 'Submit review'"
            @submit="submitDeliveryReview"
          />
        </section>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useOrdersStore } from '@/stores/orders';
import { useCartStore } from '@/stores/cart';
import { useReviewsStore } from '@/stores/reviews';
import StarRating from '@/components/StarRating.vue';
import ReviewForm from '@/components/ReviewForm.vue';
import type { DeliveryReview } from '@/types/reviews';

const route = useRoute();
const id = route.params.id as string;
const orders = useOrdersStore();
const cart = useCartStore();

const reviewsStore = useReviewsStore();
const deliveryLoading = ref<boolean>(false);
const existingDeliveryReview = ref<DeliveryReview | undefined>(undefined);

onMounted(async () => {
  orders.loadOrder(id);
  await loadDeliveryReview();
});

const detail = computed(() => orders.getById(id));

const hasDeliveryPerson = computed<boolean>(() => {
  const d = detail.value
  // Original code expected driverId; not present in type, so derive a stable pseudo-id from restaurant or order id.
  return !!(d && (d.restaurantName || d.restaurantId || d.id));
});

async function loadDeliveryReview() {
  const d = detail.value;
  if (!d) return;
  deliveryLoading.value = true;
  await reviewsStore.loadDeliveryReviewByOrder(String(d.id));
  existingDeliveryReview.value = reviewsStore.deliveryByOrder[String(d.id)];
  deliveryLoading.value = false;
}

async function submitDeliveryReview(payload: { rating: number; comment: string }) {
  const d = detail.value;
  const deliveryPersonId = d ? String(d.restaurantName || d.restaurantId || d.id) : undefined;
  if (!d || !deliveryPersonId) return;
  await reviewsStore.submitDeliveryReviewOptimistic({
    orderId: String(d.id),
    deliveryPersonId,
    author: 'You',
    rating: (Math.max(0, Math.min(5, Number(payload.rating))) as unknown) as import('@/types/reviews').RatingValue,
    comment: payload.comment,
  });
  await loadDeliveryReview();
}

type TotalsLike = {
  subtotal: { currency: string; amount: number }
  discount?: { currency: string; amount: number }
  tax: { currency: string; amount: number }
  deliveryFee?: { currency: string; amount: number }
  total: { currency: string; amount: number }
}

const detailTotals = computed<TotalsLike>(() => {
  const d = detail.value
  if (!d) {
    return {
      subtotal: { currency: 'USD', amount: 0 },
      discount: undefined,
      tax: { currency: 'USD', amount: 0 },
      deliveryFee: undefined,
      total: { currency: 'USD', amount: 0 },
    }
  }
  // Recompute from lines for accuracy
  const subtotalAmt = d.lines.reduce((sum, l) => sum + l.unitPrice.amount * l.quantity, 0)
  const taxAmt = +(subtotalAmt * 0.08).toFixed(2)
  const deliveryAmt = d.fulfillment.type === 'delivery' ? 5 : 0
  const totalAmt = +(subtotalAmt + taxAmt + deliveryAmt).toFixed(2)
  const currency = d.total?.currency || (d.lines[0]?.unitPrice.currency ?? 'USD')
  return {
    subtotal: { currency, amount: +subtotalAmt.toFixed(2) },
    discount: undefined,
    tax: { currency, amount: taxAmt },
    deliveryFee: deliveryAmt ? { currency, amount: deliveryAmt } : undefined,
    total: { currency, amount: totalAmt },
  }
});

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(+amount.toFixed(2));
}
function prettyStatus(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}
function reorder() {
  const d = detail.value
  if (!d) return
  for (const l of d.lines) {
    const existing = cart.lines.find((x) => x.id === l.itemId)
    if (existing) {
      existing.qty += l.quantity
    } else {
      cart.lines.push({
        id: l.itemId,
        name: l.name,
        price: l.unitPrice.amount,
        image: l.imageUrl || '',
        qty: l.quantity,
      })
    }
  }
}
</script>

<style scoped>
.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.page-header h1 { margin: 0; }
.actions {
  display: flex;
  gap: 0.5rem;
}
.btn-primary {
  background: #2563EB;
  color: white;
  border: 1px solid #1d4ed8;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  text-decoration: none;
}
.btn-outline {
  background: white;
  color: #2563EB;
  border: 1px solid #2563EB;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
}
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
.panel {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1rem;
}
.lines {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.75rem;
}
.line {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 0.75rem;
  align-items: center;
}
.line img {
  width: 56px; height: 56px; object-fit: cover; border-radius: 0.5rem;
}
.info .name { font-weight: 600; }
.info .options { color: #6b7280; font-size: 0.85rem; }
.info .qty { color: #374151; font-size: 0.9rem; margin-top: 0.25rem; }
.totals {
  margin-top: 0.75rem;
  border-top: 1px dashed #e5e7eb;
  padding-top: 0.75rem;
}
.totals > div {
  display: flex; justify-content: space-between; padding: 0.15rem 0;
}
.totals .grand {
  font-weight: 700;
  border-top: 1px solid #e5e7eb;
  margin-top: 0.25rem;
  padding-top: 0.5rem;
}
.badge {
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 0.1rem 0.5rem;
  font-size: 0.75rem;
  background: #f9fafb;
}
.ok { color: #16a34a; }
.warn { color: #b45309; }
.skeleton {
  display: grid;
  gap: 0.75rem;
}
.skeleton-card {
  height: 96px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
  border-radius: 0.75rem;
}
@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}
</style>
