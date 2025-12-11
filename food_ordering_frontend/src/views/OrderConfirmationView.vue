<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getLastOrder } from '@/services/orders'

const route = useRoute()
const router = useRouter()
const order = ref(getLastOrder())

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
</style>
