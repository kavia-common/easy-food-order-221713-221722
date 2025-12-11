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

    <section id="ratings" class="ratings card" aria-label="Ratings and reviews">
      <h2 class="section-title">Ratings</h2>

      <div class="summary">
        <div class="avg">
          <span class="avg-score">{{ summary.average.toFixed(1) }}</span>
          <span class="avg-label">Average</span>
        </div>
        <div class="count">
          <span class="count-num">{{ summary.count }}</span>
          <span class="count-label">reviews</span>
        </div>
        <div class="distribution">
          <div v-for="i in [5,4,3,2,1]" :key="i" class="dist-row">
            <span class="dist-label">{{ i }}★</span>
            <div class="bar">
              <div
                class="bar-fill"
                :style="{ width: (summary.count ? (summary.distribution[i as 1|2|3|4|5] / summary.count) * 100 : 0) + '%' }"
              />
            </div>
            <span class="dist-count">{{ summary.distribution[i as 1|2|3|4|5] }}</span>
          </div>
        </div>
      </div>

      <ReviewList
        :items="paged.data"
        :page="page"
        :total-pages="paged.totalPages"
        @update:page="(p:number)=> page = p"
      />

      <div class="write-review">
        <h3 class="subsection-title">Write a review</h3>
        <ReviewForm @submit="handleSubmit" @cancel="() => {}" />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useChatsStore } from '@/stores/chats';
import { fetchItems } from '@/services/api'
import { withInventoryDefaults as invDefaults } from '@/services/mockData.inventory'
import FoodItemCard from '@/components/FoodItemCard.vue'
import HealthFilterBar from '@/components/HealthFilterBar.vue'
import SearchBar from '@/components/SearchBar.vue'
import ReviewList from '@/components/ReviewList.vue'
import ReviewForm from '@/components/ReviewForm.vue'
import { getRestaurantRatingSummary, listRestaurantReviews, submitRestaurantReview } from '@/services/ratings'
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

// Ratings & Reviews state
const page = ref(1)
const pageSize = ref(5)
const summary = ref(getRestaurantRatingSummary(String(route.params.id || '')))
const paged = ref(listRestaurantReviews(String(route.params.id || ''), { page: page.value, pageSize: pageSize.value }))

watch([page, pageSize, () => route.params.id], () => {
  const id = String(route.params.id || '')
  summary.value = getRestaurantRatingSummary(id)
  paged.value = listRestaurantReviews(id, { page: page.value, pageSize: pageSize.value })
})

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

async function handleSubmit(payload: { stars: number; comment: string }) {
  const id = String(route.params.id || '')
  const res = await submitRestaurantReview({
    restaurantId: id,
    stars: Math.max(1, Math.min(5, Math.round(payload.stars))) as 1|2|3|4|5,
    comment: payload.comment
  })
  if (res.ok) {
    summary.value = getRestaurantRatingSummary(id)
    paged.value = listRestaurantReviews(id, { page: page.value, pageSize: pageSize.value })
  }
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

.ratings.card {
  margin-top: 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 6px 16px rgba(17,24,39,0.06);
}
.section-title {
  font-size: 1.25rem;
  margin-bottom: .5rem;
  color: #111827;
}
.summary {
  display: grid;
  grid-template-columns: 120px 120px 1fr;
  gap: 1rem;
  align-items: center;
  margin-bottom: .75rem;
}
.avg, .count {
  display: grid;
  justify-items: center;
  background: linear-gradient(to bottom right, rgba(37,99,235,0.06), rgba(243,244,246,0.7));
  border: 1px solid #c7d2fe;
  border-radius: 10px;
  padding: .5rem;
}
.avg-score {
  font-size: 1.75rem;
  color: #111827;
}
.avg-label, .count-label {
  color: #6b7280;
  font-size: .875rem;
}
.count-num {
  font-size: 1.5rem;
  color: #111827;
}
.distribution {
  display: grid;
  gap: .35rem;
}
.dist-row {
  display: grid;
  grid-template-columns: 36px 1fr 36px;
  gap: .5rem;
  align-items: center;
}
.dist-label {
  color: #374151;
  font-size: .875rem;
}
.bar {
  height: 10px;
  background: #f3f4f6;
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}
.bar-fill {
  height: 100%;
  background: linear-gradient(to right, #2563EB, #F59E0B);
}
.write-review {
  margin-top: .75rem;
}
.subsection-title {
  font-weight: 600;
  color: #111827;
  margin-bottom: .5rem;
}

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
