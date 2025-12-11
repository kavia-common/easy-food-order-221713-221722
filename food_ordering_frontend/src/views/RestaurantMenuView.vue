<template>
  <main class="restaurant-menu">
    <header class="hero" aria-label="Restaurant header">
      <h1>Restaurant {{ restaurantId }}</h1>
      <div class="hero-right">
        <div class="search">
          <SearchBar
            :model-value="search"
            aria-label="Search this restaurant's menu"
            placeholder="Search this menu"
            :debounce-ms="350"
            :loading="loading"
            @update:modelValue="setQueryParam"
            @clear="clearSearch"
          />
        </div>
        <button class="chat-btn" @click="chatSupport">Chat with restaurant support</button>
      </div>
    </header>

    <section class="links">
      <RouterLink to="/restaurants">Back to Restaurants</RouterLink>
      <RouterLink to="/chat">Open Messages</RouterLink>
    </section>

    <section class="filters" aria-label="Health filters">
      <HealthFilterBar
        v-model="filters"
        @change="onFiltersChanged"
      />
    </section>

    <section class="items">
      <div v-if="loading" class="skeletons" aria-label="Loading items">
        <div class="skeleton" v-for="n in 6" :key="n"></div>
      </div>
      <div v-else-if="!items.length" class="empty" aria-live="polite">No items match your search.</div>
      <div v-else class="grid">
        <FoodItemCard v-for="i in items" :key="i.id" :item="i" />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useChatsStore } from '@/stores/chats';
import { fetchItems } from '@/services/api'
import { withInventoryDefaults as invDefaults } from '@/services/mockData.inventory'
import FoodItemCard from '@/components/FoodItemCard.vue'
import HealthFilterBar from '@/components/HealthFilterBar.vue'
import SearchBar from '@/components/SearchBar.vue'
import type { FoodItem, HealthFilter } from '@/types'

const route = useRoute();
const router = useRouter();
const chats = useChatsStore();
const restaurantId = ref<string | undefined>(route.params.id as string | undefined);

type Filters = { healthFilters: HealthFilter[]; maxCalories?: number | null }
const filters = ref<Filters>({ healthFilters: [], maxCalories: null })
const items = ref<FoodItem[]>([])
const loading = ref(false)
const search = ref<string>(typeof route.query.q === 'string' ? route.query.q : '')

onMounted(() => {
  restaurantId.value = route.params.id as string | undefined;
  load()
});

async function load() {
  loading.value = true
  try {
    // Client-first fetch; pass filters to API where supported
    const raw = await fetchItems(undefined, search.value || undefined, restaurantId.value, {
      healthFilters: filters.value.healthFilters,
      maxCalories: filters.value.maxCalories ?? undefined
    })
    // Enrich with availability fields for badges
    items.value = raw.map((fi) =>
      ({
        ...fi,
        ...(invDefaults({
          id: fi.id,
          name: fi.name,
          description: fi.description,
          price: fi.price,
          image: fi.image,
          category: fi.categoryId,
          availability: 'in_stock',
        } as any) as any),
      } as typeof raw[number]),
    )
  } finally {
    loading.value = false
  }
}

let to: number | undefined
function onFiltersChanged() {
  if (typeof window !== 'undefined') {
    if (to) window.clearTimeout(to)
    to = window.setTimeout(() => load(), 250)
  } else {
    load()
  }
}

function setQueryParam(next: string) {
  const q = next || undefined
  router.replace({ query: { ...route.query, q } })
  search.value = next
}

function clearSearch() {
  setQueryParam('')
}

watch(() => route.query.q, (q) => {
  search.value = typeof q === 'string' ? q : ''
  load()
})

async function chatSupport() {
  await chats.openThread('support', { restaurantId: restaurantId.value });
  router.push({ name: 'chat' });
}
</script>

<style scoped>
.restaurant-menu { padding: 16px; }
.hero {
  display: grid;
  gap: .5rem;
  margin-bottom: 12px;
}
@media (min-width: 768px) {
  .hero { grid-template-columns: 1fr auto; align-items: center; }
}
.hero-right {
  display: flex;
  gap: .5rem;
  align-items: center;
}
.search { min-width: 260px; max-width: 380px; }
.chat-btn {
  background: #2563EB;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
}
.chat-btn:hover { background: #1e4fd6; }
.links { display: flex; gap: 12px; }

.skeletons { display: grid; grid-template-columns: repeat(1, minmax(0,1fr)); gap: .75rem; }
@media (min-width: 640px) { .skeletons { grid-template-columns: repeat(2, minmax(0,1fr)); } }
@media (min-width: 1024px) { .skeletons { grid-template-columns: repeat(3, minmax(0,1fr)); } }
.skeleton {
  height: 220px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}

.empty {
  border: 1px dashed var(--border);
  background: #f9fafb;
  color: #374151;
  border-radius: 12px;
  padding: .75rem;
}

@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}
</style>
