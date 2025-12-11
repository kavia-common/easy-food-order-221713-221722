<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CategoryList from '@/components/CategoryList.vue'
import FoodItemCard from '@/components/FoodItemCard.vue'
import RatingSummaryBar from '@/components/RatingSummaryBar.vue'
import ReviewList from '@/components/ReviewList.vue'
import ReviewForm from '@/components/ReviewForm.vue'
import type { FoodCategory, FoodItem, Restaurant } from '@/types'
import type { RatingSummary, RestaurantReview } from '@/types/reviews'
import { fetchCategories, fetchItems, fetchRestaurants } from '@/services/api'
import { useReviewsStore } from '@/stores/reviews'

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

const reviewsStore = useReviewsStore()
const ratingSummary = ref<RatingSummary>({ average: 0, count: 0, breakdown: { 5:0,4:0,3:0,2:0,1:0 } })
const recentReviews = ref<RestaurantReview[]>([])
const reviewsLoading = ref<boolean>(false)

async function loadRestaurantReviews() {
  if (!restaurant.value) return
  reviewsLoading.value = true
  await reviewsStore.loadRestaurantReviews(restaurant.value.id, 10)
  ratingSummary.value = reviewsStore.restaurantSummaries[restaurant.value.id] || ratingSummary.value
  recentReviews.value = reviewsStore.restaurantRecent[restaurant.value.id] || []
  reviewsLoading.value = false
}

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
  const t0 = performance.now()
  loading.value = true
  err.value = null
  try {
    // Kick off restaurant and categories in parallel if needed
    const tasks: Promise<unknown>[] = []
    if (!restaurant.value) {
      tasks.push(loadRestaurant())
    }
    if (categories.value.length === 0) {
      tasks.push(
        (async () => {
          categories.value = await fetchCategories(restaurantId)
        })(),
      )
    }
    if (tasks.length) await Promise.all(tasks)

    // Items last (depends on activeCategory/search)
    items.value = await fetchItems(activeCategory.value, search.value || undefined, restaurantId)
  } catch {
    err.value = 'Failed to load menu'
  } finally {
    loading.value = false
    const t1 = performance.now()
    if (import.meta.env?.DEV) {
      // Log timing only in development to aid performance verification
      // and avoid noisy logs in production builds.
      console.log(`[Menu] load(${restaurantId}) in ${(t1 - t0).toFixed(0)}ms`)
    }
  }
}

onMounted(async () => {
  await load()
  await loadRestaurant()
  await loadRestaurantReviews()
  if (route.hash === '#reviews') {
    const el = document.getElementById('reviews')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }
})

// Debounce search-driven reloads to minimize chatter
let searchTimer: number | null = null
watch(
  () => route.query.q,
  (val) => {
    search.value = (val as string) || ''
    if (searchTimer) window.clearTimeout(searchTimer)
    searchTimer = window.setTimeout(() => {
      load()
    }, 250)
  },
)

watch(activeCategory, () => {
  load()
})

function openItem(item: FoodItem) {
  router.push({ name: 'item-detail', params: { id: restaurantId, itemId: item.id } })
}

async function handleRestaurantReviewSubmit(payload: { rating: number; comment: string }) {
  if (!restaurant.value) return
  await reviewsStore.submitRestaurantReviewOptimistic({
    restaurantId: restaurant.value.id,
    author: 'You',
    rating: (Math.max(0, Math.min(5, Number(payload.rating))) as unknown) as import('@/types/reviews').RatingValue,
    comment: payload.comment,
  })
  await loadRestaurantReviews()
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

    <div v-if="loading" class="grid skeletons" aria-label="Loading menu">
      <div v-for="n in 6" :key="n" class="skeleton-card">
        <div class="skeleton-img" />
        <div class="skeleton-text w1" />
        <div class="skeleton-text w2" />
      </div>
    </div>
    <div v-else-if="err" class="state error" role="alert">
      {{ err }}. Please check your connection or try again shortly.
    </div>
    <div v-else-if="!items.length" class="state empty">No items found.</div>

    <div v-else class="grid" role="list">
      <article class="clickable" v-for="it in items" :key="it.id" role="listitem" @click="openItem(it)">
        <FoodItemCard :item="it" />
      </article>
    </div>

    <section id="reviews" class="reviews-section">
      <h3 class="reviews-title">Ratings & Reviews</h3>
      <div class="reviews-grid">
        <RatingSummaryBar :summary="ratingSummary" :loading="reviewsLoading" />
        <div class="reviews-right">
          <ReviewList :reviews="recentReviews" :loading="reviewsLoading" />
          <ReviewForm class="mt-3" :submit-label="'Submit review'" @submit="handleRestaurantReviewSubmit" />
        </div>
      </div>
    </section>
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

.reviews-section {
  margin-top: 1rem;
  padding-top: .5rem;
  border-top: 1px solid var(--border);
}
.reviews-title {
  margin: 0 0 .5rem 0;
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--text);
}
.reviews-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: .75rem;
}
.reviews-right {
  display: grid;
  gap: .75rem;
}
@media (min-width: 768px) {
  .reviews-grid {
    grid-template-columns: 1fr 2fr;
  }
}
</style>
