<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CategoryList from '@/components/CategoryList.vue'
import FoodItemCard from '@/components/FoodItemCard.vue'
import type { FoodCategory, FoodItem, Restaurant } from '@/types'
import { fetchCategories, fetchItems, fetchRestaurants } from '@/services/api'

const route = useRoute()
const router = useRouter()
const restaurantId = route.params.id as string

const restaurant = ref<Restaurant | null>(null)
const categories = ref<FoodCategory[]>([])
const items = ref<FoodItem[]>([])
const loading = ref(false)
const err = ref<string | null>(null)
const activeCategory = ref<string | undefined>(undefined)
const search = ref<string>((route.query.q as string) || '')

async function loadRestaurant() {
  try {
    // Reuse restaurants API; in mock it returns full list.
    const list = await fetchRestaurants()
    restaurant.value = list.find(r => r.id === restaurantId) ?? null
  } catch {
    restaurant.value = null
  }
}

async function load() {
  loading.value = true
  err.value = null
  try {
    if (!restaurant.value) await loadRestaurant()
    if (categories.value.length === 0) {
      categories.value = await fetchCategories(restaurantId)
    }
    items.value = await fetchItems(activeCategory.value, search.value || undefined, restaurantId)
  } catch {
    err.value = 'Failed to load menu'
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch([() => route.query.q], () => {
  search.value = (route.query.q as string) || ''
  load()
})
watch(activeCategory, load)

function openItem(item: FoodItem) {
  router.push({ name: 'item-detail', params: { id: restaurantId, itemId: item.id } })
}
</script>

<template>
  <div class="menu">
    <header class="header">
      <div class="title">
        <h2>{{ restaurant?.name || 'Menu' }}</h2>
        <p v-if="restaurant" class="sub">
          <span>⭐ {{ restaurant.rating.toFixed(1) }}</span>
          <span class="dot">•</span>
          <span>{{ restaurant.cuisines.join(', ') }}</span>
          <span class="dot">•</span>
          <span v-if="restaurant.etaMin">{{ restaurant.etaMin }} min</span>
        </p>
      </div>
      <div class="actions">
        <button class="back" @click="router.push('/restaurants')">← All Restaurants</button>
      </div>
    </header>

    <CategoryList :categories="categories" :active="activeCategory" @select="(id)=>activeCategory=id" />

    <div v-if="loading" class="state loading" aria-live="polite">Loading menu…</div>
    <div v-else-if="err" class="state error" role="alert">
      {{ err }}. Please check your connection or try again shortly.
    </div>
    <div v-else-if="!items.length" class="state empty">No items found.</div>

    <div v-else class="grid" role="list">
      <article class="clickable" v-for="it in items" :key="it.id" role="listitem" @click="openItem(it)">
        <FoodItemCard :item="it" />
      </article>
    </div>
  </div>
</template>

<style scoped>
.menu { display: grid; gap: .75rem; }
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: .25rem 0 .5rem;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(90deg, rgba(37,99,235,0.08), rgba(249,250,251,1));
  border-radius: 10px;
}
.title h2 { margin: 0; font-size: 1.25rem; }
.sub { margin: 0; color: #6b7280; display: flex; gap: .5rem; align-items: center; }
.dot { opacity: .6; }
.actions .back {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  padding: .4rem .6rem;
  border-radius: 10px;
  cursor: pointer;
}
.state {
  border: 1px dashed var(--border);
  background: #f9fafb;
  color: #374151;
  border-radius: 12px;
  padding: .75rem;
}
.error { border-color: #fecaca; background: #fef2f2; color: #991b1b; }
.grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0,1fr));
  gap: .75rem;
}
@media (min-width: 640px) { .grid { grid-template-columns: repeat(2, minmax(0,1fr)); } }
@media (min-width: 1024px) { .grid { grid-template-columns: repeat(3, minmax(0,1fr)); } }
.clickable { cursor: pointer; }
</style>
