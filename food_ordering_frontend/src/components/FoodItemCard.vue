<script setup lang="ts">
import { ref } from 'vue'
import type { FoodItem } from '@/types'
import { useCartStore } from '@/stores/cart'
import QuantityStepper from './QuantityStepper.vue'

const props = defineProps<{ item: FoodItem }>()
const cart = useCartStore()
const qty = ref(1)

function add() {
  cart.addItem(props.item, qty.value)
  qty.value = 1
}
</script>

<template>
  <div class="card">
    <div class="thumb" role="img" :aria-label="item.name">
      <img :src="item.image" :alt="item.name" />
    </div>
    <div class="info">
      <div class="title">{{ item.name }}</div>
      <p class="desc">{{ item.description }}</p>
      <div class="meta">
        <div class="price">${{ item.price.toFixed(2) }}</div>
        <div class="actions">
          <QuantityStepper v-model="qty" :min="1" :max="9" />
          <button class="add" @click="add">Add</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  display: grid;
  grid-template-rows: 160px auto;
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  background: var(--surface);
  box-shadow: 0 6px 16px rgba(0,0,0,0.06);
  transition: transform .15s ease, box-shadow .15s ease;
}
.card:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(0,0,0,0.08); }

.thumb {
  background: linear-gradient(135deg, rgba(37,99,235,0.08), rgba(229,231,235,0.3));
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info { padding: .75rem; display: grid; gap: .5rem; }
.title { font-weight: 700; color: var(--text); }
.desc { color: #6b7280; font-size: .9rem; min-height: 2.2em; }

.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.price { font-weight: 800; color: var(--primary); }
.actions { display: flex; align-items: center; gap: .5rem; }

.add {
  background: var(--primary);
  color: white;
  border: none;
  padding: .5rem .8rem;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  box-shadow: 0 6px 16px rgba(37,99,235,0.25);
}
</style>
