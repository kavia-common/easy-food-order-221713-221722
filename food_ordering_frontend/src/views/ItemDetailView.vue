<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FoodItem } from '@/types'
import { fetchItemById } from '@/services/api'
import { useCartStore } from '@/stores/cart'
import QuantityStepper from '@/components/QuantityStepper.vue'

const route = useRoute()
const router = useRouter()
const restaurantId = route.params.id as string
const itemId = route.params.itemId as string

const cart = useCartStore()
const item = ref<FoodItem | null>(null)
const loading = ref(false)
const err = ref<string | null>(null)
const qty = ref(1)

// PUBLIC_INTERFACE
async function loadItem() {
  /** Load item details with graceful fallback. */
  loading.value = true
  err.value = null
  try {
    item.value = await fetchItemById(itemId, restaurantId)
    if (!item.value) {
      err.value = 'Item not found'
    }
  } catch {
    err.value = 'Failed to load item'
  } finally {
    loading.value = false
  }
}

function addToCart() {
  if (item.value) {
    cart.addItem(item.value, qty.value)
    router.push({ name: 'restaurant-menu', params: { id: restaurantId } })
  }
}

onMounted(loadItem)
</script>

<template>
  <div class="detail">
    <div class="card">
      <button class="close" @click="router.back()" aria-label="Close">×</button>

      <div v-if="loading" class="state loading">Loading item…</div>
      <div v-else-if="err" class="state error" role="alert">{{ err }}</div>

      <template v-else-if="item">
        <div class="media">
          <img :src="item.image" :alt="item.name" />
        </div>
        <div class="content">
          <h2 class="name">{{ item.name }}</h2>
          <p class="desc">{{ item.description }}</p>

          <div class="meta">
            <div class="price">${{ item.price.toFixed(2) }}</div>
            <div class="rating" aria-label="Rating">⭐ 4.5</div>
          </div>

          <div class="actions">
            <QuantityStepper v-model="qty" :min="1" :max="9" />
            <button class="add" @click="addToCart">Add to Cart</button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.detail {
  display: grid;
  place-items: center;
}
.card {
  position: relative;
  width: min(900px, 96vw);
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.12);
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr;
}
@media (min-width: 768px) {
  .card { grid-template-columns: 1.2fr 1fr; }
}
.close {
  position: absolute;
  top: 10px;
  right: 10px;
  border: none;
  background: #f3f4f6;
  color: #111827;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  cursor: pointer;
  z-index: 2;
}
.media {
  background: linear-gradient(135deg, rgba(37,99,235,0.08), rgba(229,231,235,0.3));
  min-height: 220px;
}
.media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.content { padding: 1rem; display: grid; gap: .6rem; }
.name { margin: 0; font-size: 1.4rem; font-weight: 800; color: var(--text); }
.desc { color: #6b7280; }
.meta { display: flex; gap: 1rem; align-items: center; }
.price { font-weight: 800; color: var(--primary); font-size: 1.1rem; }
.rating { color: #f59e0b; font-weight: 700; }
.actions { display: flex; gap: .75rem; align-items: center; margin-top: .5rem; }
.add {
  background: var(--secondary);
  color: #111827;
  border: none;
  padding: .6rem .9rem;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
  box-shadow: 0 8px 20px rgba(245,158,11,0.3);
}
.state {
  border: 1px dashed var(--border);
  background: #f9fafb;
  color: #374151;
  border-radius: 12px;
  padding: .75rem;
  margin: .75rem;
}
.error { border-color: #fecaca; background: #fef2f2; color: #991b1b; }
</style>
