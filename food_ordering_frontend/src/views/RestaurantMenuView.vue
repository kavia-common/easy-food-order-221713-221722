<template>
  <main class="restaurant-menu">
    <header class="hero">
      <h1>Restaurant {{ restaurantId }}</h1>
      <button class="chat-btn" @click="chatSupport">Chat with restaurant support</button>
    </header>

    <section class="links">
      <RouterLink to="/restaurants">Back to Restaurants</RouterLink>
      <RouterLink to="/chat">Open Messages</RouterLink>
    </section>

    <section class="filters">
      <HealthFilterBar
        v-model="filters"
        @change="onFiltersChanged"
      />
    </section>

    <section class="items">
      <div v-if="loading" class="skeletons">
        <div class="skeleton" v-for="n in 6" :key="n"></div>
      </div>
      <div v-else class="grid">
        <FoodItemCard v-for="i in items" :key="i.id" :item="i" />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useChatsStore } from '@/stores/chats';
import { fetchItems } from '@/services/api'
import { withInventoryDefaults as invDefaults } from '@/services/mockData.inventory'
import FoodItemCard from '@/components/FoodItemCard.vue'
import HealthFilterBar from '@/components/HealthFilterBar.vue'
import type { FoodItem, HealthFilter } from '@/types'

const route = useRoute();
const router = useRouter();
const chats = useChatsStore();
const restaurantId = ref<string | undefined>(route.params.id as string | undefined);

type Filters = { healthFilters: HealthFilter[]; maxCalories?: number | null }
const filters = ref<Filters>({ healthFilters: [], maxCalories: null })
const items = ref<FoodItem[]>([])
const loading = ref(false)

onMounted(() => {
  restaurantId.value = route.params.id as string | undefined;
  load()
});

async function load() {
  loading.value = true
  try {
    // Capture voice item keywords from query
    const search = (route.query.q as string) || undefined

    // Client-first fetch; pass filters to API where supported
    const raw = await fetchItems(undefined, search, restaurantId.value, {
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

async function chatSupport() {
  await chats.openThread('support', { restaurantId: restaurantId.value });
  router.push({ name: 'chat' });
}
</script>

<style scoped>
.restaurant-menu { padding: 16px; }
.hero {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
}
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
</style>
