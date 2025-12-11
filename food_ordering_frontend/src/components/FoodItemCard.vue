<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FoodItem } from '@/types'
import { useCartStore } from '@/stores/cart'
import { useFavoritesStore } from '@/stores/favorites'
import QuantityStepper from './QuantityStepper.vue'
import type { Item as CustomerItem, AvailabilityStatus } from '@/types/restaurant'

// Accept either FoodItem (catalog) or CustomerItem (admin/customer menu with availability)
type DisplayItem = FoodItem | (CustomerItem & { category?: string })

function hasDescription(x: unknown): x is { description?: string } {
  return typeof x === 'object' && x !== null && 'description' in (x as Record<string, unknown>)
}

const props = defineProps<{ item: DisplayItem }>()

const cart = useCartStore()
const favs = useFavoritesStore()
const qty = ref(1)

const isFav = computed(() => favs.isItemFav(props.item.id))

// Strongly typed field derivations
const name = computed<string>(() => ('name' in props.item ? props.item.name : ''))
const price = computed<number>(() => ('price' in props.item ? props.item.price : 0))
const image = computed<string>(() => ('image' in props.item ? props.item.image : ''))
const description = computed<string | undefined>(() => (hasDescription(props.item) ? props.item.description : undefined))
const availability = computed<AvailabilityStatus>(() => {
  return 'availability' in props.item && props.item.availability ? props.item.availability : 'in_stock'
})
const isOut = computed(() => availability.value === 'out_of_stock')

type CartLineLite = { id: string; name: string; price: number; image?: string }

function add() {
  if (isOut.value) return
  const minimal: CartLineLite = {
    id: props.item.id,
    name: name.value,
    price: price.value,
    image: image.value || undefined,
  }
  // Cast for compatibility with cart store typing
  cart.addItem(minimal as unknown as FoodItem, qty.value)
  qty.value = 1
}

function toggleFav() {
  favs.toggleItem({
    id: props.item.id,
    name: name.value,
    image: image.value,
    price: price.value,
  })
}
</script>

<template>
  <div class="card">
    <div class="thumb" role="img" :aria-label="name">
      <button
        class="fav"
        :class="{ active: isFav }"
        :aria-pressed="isFav"
        :aria-label="isFav ? 'Remove from favorites' : 'Add to favorites'"
        @click.stop="toggleFav"
        title="Toggle favorite"
      >
        ❤
      </button>
      <img :src="image" :alt="name" />
      <span v-if="isOut" class="badge">Out of stock</span>
    </div>
    <div class="info">
      <div class="title">{{ name }}</div>
      <p class="desc">{{ description }}</p>
      <div class="meta">
        <div class="price">${{ price.toFixed(2) }}</div>
        <div class="actions" :class="{ disabled: isOut }">
          <QuantityStepper v-model="qty" :min="1" :max="9" />
          <button class="add" :disabled="isOut" @click="add">{{ isOut ? 'Unavailable' : 'Add' }}</button>
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
  position: relative;
  background: linear-gradient(135deg, rgba(37,99,235,0.08), rgba(229,231,235,0.3));
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: #fff7ed;
  color: #9a3412;
  border: 1px solid #fed7aa;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 12px;
}
.fav {
  position: absolute;
  top: 10px;
  right: 10px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.9);
  color: #6b7280;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: transform .15s ease, box-shadow .15s ease, color .2s ease, background-color .2s ease;
}
.fav:hover { transform: scale(1.05); box-shadow: 0 6px 16px rgba(0,0,0,0.12); }
.fav.active { background: #fee2e2; color: #ef4444; border-color: #fecaca; }

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
.actions.disabled { opacity: .6; }
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
.add:disabled {
  background: #cbd5e1;
  color: #475569;
  box-shadow: none;
  cursor: not-allowed;
}
</style>
