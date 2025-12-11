<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FoodItem, FavoriteItem } from '@/types'
import { useCartStore } from '@/stores/cart'
import { useFavoritesStore } from '@/stores/favorites'
import QuantityStepper from './QuantityStepper.vue'

const props = defineProps<{ item: FoodItem }>()
const cart = useCartStore()
const favs = useFavoritesStore()
const qty = ref(1)

const isFav = computed(() => favs.isItemFav(props.item.id))

function add() {
  cart.addItem(props.item, qty.value)
  qty.value = 1
}

function toggleFav() {
  const payload: FavoriteItem = {
    id: props.item.id,
    name: props.item.name,
    image: props.item.image,
    price: props.item.price,
  }
  favs.toggleItem(payload)
}
</script>

<template>
  <div class="card">
    <div class="thumb" role="img" :aria-label="item.name">
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
  position: relative;
  background: linear-gradient(135deg, rgba(37,99,235,0.08), rgba(229,231,235,0.3));
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
