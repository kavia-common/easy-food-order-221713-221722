<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { fetchRestaurants } from '@/services/api'
import type { Restaurant } from '@/types'
import CuisineFilter from '@/components/CuisineFilter.vue'
import SortBar from '@/components/SortBar.vue'
import RestaurantCard from '@/components/RestaurantCard.vue'

const loading = ref(false)
const err = ref<string | null>(null)
const restaurants = ref<Restaurant[]>([])

// Filters and sort state
const selectedCuisines = ref<string[]>([])
const sortBy = ref<'rating' | 'price' | 'distance'>('rating')
const sortDir = ref<'asc' | 'desc'>('desc')

// Available cuisines (can be refined based on data)
const allCuisines = ref<string[]>(['Indian','Chinese','Italian','Japanese','Mexican','Mediterranean','Greek','Asian','Pizza'])

async function load() {
  loading.value = true
  err.value = null
  try {
    // If multiple cuisines selected, for now send first to API and filter client-side for others.
    // API accepts single cuisine; client filtering will handle multi-select scenario.
    const primaryCuisine = selectedCuisines.value[0]
    const list = await fetchRestaurants({
      cuisine: primaryCuisine,
      sortBy: sortBy.value,
      sortDir: sortDir.value,
    })
    // Additional client filtering for multi-cuisine selection
    const filtered = selectedCuisines.value.length
      ? list.filter(r => r.cuisines.some(c => selectedCuisines.value.includes(c)))
      : list
    restaurants.value = filtered
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'message' in e) {
      const ex = e as { message?: unknown }
      err.value = typeof ex.message === 'string' ? ex.message : 'Failed to load restaurants'
    } else {
      err.value = 'Failed to load restaurants'
    }
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch([selectedCuisines, sortBy, sortDir], load)
</script>

<template>
  <div class="wrap">
    <header class="page-header" aria-label="Restaurants header">
      <div class="title">
        <h2>Restaurants</h2>
        <p>Discover nearby places with great food.</p>
      </div>
    </header>

    <section class="toolbar" aria-label="Filters and sorting">
      <CuisineFilter v-model="selectedCuisines" :options="allCuisines" />
      <SortBar v-model:sortBy="sortBy" v-model:sortDir="sortDir" />
    </section>

    <section>
      <div v-if="loading" class="state loading" aria-live="polite">Loading restaurants…</div>
      <div v-else-if="err" class="state error" role="alert">
        {{ err }}. Please check your connection or try again shortly.
      </div>
      <div v-else-if="!restaurants.length" class="state empty" aria-live="polite">No restaurants found.</div>

      <div v-else class="grid" role="list" aria-label="Restaurant results">
        <RestaurantCard v-for="r in restaurants" :key="r.id" :restaurant="r" role="listitem" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.wrap { display: grid; gap: .75rem; }

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: .25rem 0 .5rem;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(90deg, rgba(37,99,235,0.08), rgba(249,250,251,1));
  border-radius: 10px;
}
.title { padding: .25rem .5rem; }
.title h2 { margin: 0; font-size: 1.25rem; }
.title p { margin: 0; color: #6b7280; }

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: .75rem 1rem;
  align-items: center;
  justify-content: space-between;
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
</style>
