<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import CategoryList from '@/components/CategoryList.vue'
import FoodItemCard from '@/components/FoodItemCard.vue'
import SearchBar from '@/components/SearchBar.vue'
import { fetchCategories, fetchItems } from '@/services/api'
import { withInventoryDefaults as invDefaults } from '@/services/mockData.inventory'
import type { FoodCategory, FoodItem } from '@/types'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const categories = ref<FoodCategory[]>([])
const items = ref<FoodItem[]>([])
const loading = ref(false)
const err = ref<string | null>(null)
const activeCategory = ref<string | undefined>(undefined)
const search = ref<string>(typeof route.query.q === 'string' ? route.query.q : '')

async function load() {
  loading.value = true
  err.value = null
  try {
    if (categories.value.length === 0) {
      categories.value = await fetchCategories()
    }
    const raw = await fetchItems(activeCategory.value, search.value || undefined)
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
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'message' in e) {
      const ex = e as { message?: unknown }
      err.value = typeof ex.message === 'string' ? ex.message : 'Failed to load menu'
    } else {
      err.value = 'Failed to load menu'
    }
  } finally {
    loading.value = false
  }
}
onMounted(load)

function setQueryParam(next: string) {
  const q = next || undefined
  router.replace({ query: { ...route.query, q } })
  search.value = next
}
function clearSearch() {
  setQueryParam('')
}

watch([() => route.query.q, () => route.query.fulfillment, activeCategory], ([q]) => {
  search.value = typeof q === 'string' ? q : ''
  load()
})
</script>

<template>
  <div class="home">
    <header class="page-header" aria-label="Browse menu">
      <div class="title">
        <h2>Browse Menu</h2>
        <p>Find dishes by name or category.</p>
      </div>
      <div class="search-wrap">
        <SearchBar
          :model-value="search"
          aria-label="Search menu items"
          placeholder="Search by name or category"
          :debounce-ms="350"
          :loading="loading"
          @update:modelValue="setQueryParam"
          @clear="clearSearch"
        />
      </div>
    </header>

    <CategoryList
      :categories="categories"
      :active="activeCategory"
      @select="(id)=> activeCategory = id"
    />

    <div v-if="loading" class="grid skeletons" aria-label="Loading items">
      <div v-for="n in 6" :key="n" class="skeleton-card">
        <div class="skeleton-img" />
        <div class="skeleton-text w1" />
        <div class="skeleton-text w2" />
      </div>
    </div>
    <div v-else-if="err" class="error" role="alert">
      {{ err }}. Please check your connection or try again shortly.
    </div>
    <div v-else-if="!items.length" class="empty" aria-live="polite">No items match your search.</div>

    <div v-else class="grid" role="list" aria-label="Menu results">
      <FoodItemCard v-for="it in items" :key="it.id" :item="it" role="listitem" />
    </div>
  </div>
</template>

<style scoped>
.home { display: grid; gap: .75rem; }

.page-header {
  display: grid;
  gap: .5rem;
  padding: .25rem 0 .5rem;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(90deg, rgba(37,99,235,0.08), rgba(249,250,251,1));
  border-radius: 10px;
}
@media (min-width: 768px) {
  .page-header { grid-template-columns: 1fr 1.2fr; align-items: center; }
}
.title { padding: .25rem .5rem; }
.title h2 { margin: 0; font-size: 1.25rem; }
.title p { margin: 0; color: #6b7280; }

.search-wrap { padding: .25rem .5rem; }

.loading, .error, .empty {
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

/* Skeleton styles */
.skeletons .skeleton-card {
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  background: var(--surface);
  box-shadow: 0 6px 16px rgba(0,0,0,0.06);
  padding-bottom: .75rem;
}
.skeleton-img {
  height: 160px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}
.skeleton-text {
  height: 12px;
  margin: .5rem .75rem;
  border-radius: 999px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}
.skeleton-text.w1 { width: 70%; }
.skeleton-text.w2 { width: 45%; }

@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}
</style>
