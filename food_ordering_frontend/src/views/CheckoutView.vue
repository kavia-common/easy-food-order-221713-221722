<script setup lang="ts">
import CheckoutForm from '@/components/CheckoutForm.vue'
import { useCartStore } from '@/stores/cart'

const cart = useCartStore()
</script>

<template>
  <div class="grid">
    <section class="left">
      <CheckoutForm />
    </section>
    <aside class="right">
      <div class="card">
        <h3>Order Summary</h3>
        <div class="row"><span>Items</span><span>{{ cart.count }}</span></div>
        <div class="row"><span>Subtotal</span><span>${{ cart.subtotal.toFixed(2) }}</span></div>
        <div class="row"><span>Tax</span><span>${{ cart.tax.toFixed(2) }}</span></div>
        <div class="row total"><span>Total</span><span>${{ cart.total.toFixed(2) }}</span></div>
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
.total { font-weight: 800; color: var(--text); }
</style>
