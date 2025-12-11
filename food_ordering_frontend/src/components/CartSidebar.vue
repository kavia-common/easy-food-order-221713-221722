<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
import QuantityStepper from './QuantityStepper.vue'
import { useRouter } from 'vue-router'

const cart = useCartStore()
const router = useRouter()
</script>

<template>
  <div class="panel">
    <h2>Cart</h2>
    <div v-if="!cart.lines.length" class="empty">
      Your cart is empty.
    </div>
    <ul v-else class="lines">
      <li v-for="l in cart.lines" :key="l.id" class="line">
        <img v-if="l.image" :src="l.image" :alt="l.name" />
        <div class="meta">
          <div class="name">{{ l.name }}</div>
          <div class="price">${{ l.price.toFixed(2) }}</div>
          <QuantityStepper :model-value="l.qty" @update:modelValue="(v)=>cart.updateQty(l.id,v)" />
        </div>
        <button class="remove" @click="cart.removeItem(l.id)" aria-label="Remove">×</button>
      </li>
    </ul>

    <div class="summary">
      <div class="row"><span>Subtotal</span><span>${{ cart.subtotal.toFixed(2) }}</span></div>
      <div class="row"><span>Tax</span><span>${{ cart.tax.toFixed(2) }}</span></div>
      <div class="row total"><span>Total</span><span>${{ cart.total.toFixed(2) }}</span></div>
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

.summary {
  margin-top: 1rem;
  display: grid;
  gap: .4rem;
}
.row { display: flex; justify-content: space-between; color: #374151; }
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
</style>
