<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import QuantityStepper from '@/components/QuantityStepper.vue'
import { useCartStore } from '@/stores/cart'
import { useFavoritesStore } from '@/stores/favorites'
import { fetchItemById as apiFetchItemById } from '@/services/api'
import type { FoodItem } from '@/types'
import StarRating from '@/components/StarRating.vue'

type FetchState = 'idle' | 'loading' | 'success' | 'refreshing' | 'error' | 'not_found'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()
const favorites = useFavoritesStore()

const item = ref<FoodItem | null>(null)
const quantity = ref<number>(1)
const state = ref<FetchState>('idle')
const errorMessage = ref<string>('')

/**
 * Try to hydrate from in-memory navigation (if we linked with state)
 * If present, render immediately and then background-refresh to keep UI snappy.
 */
const navState = route?.state as { item?: FoodItem } | undefined
if (navState?.item) {
  item.value = navState.item
  state.value = 'success'
}

const priceFormatted = computed(() => {
  if (!item.value) return ''
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(item.value.price || 0)
})

const imageAlt = computed(() => {
  if (!item.value) return 'Food item image'
  return `${item.value.name} image`
})

const isFavorite = computed(() => {
  if (!item.value) return false
  return favorites.items.some(f => f.id === item.value!.id)
})

function toggleFavorite() {
  if (!item.value) return
  if (isFavorite.value) {
    favorites.remove(item.value.id)
  } else {
    favorites.add({
      id: item.value.id,
      name: item.value.name,
      image: item.value.image,
      price: item.value.price,
    } as any)
  }
}

// PUBLIC_INTERFACE
function addToCart() {
  /** Add current item to cart with selected quantity, accessible feedback handled via aria-live region. */
  if (!item.value) return
  cart.addItem({
    id: item.value.id,
    name: item.value.name,
    price: item.value.price,
    image: item.value.image,
    quantity: quantity.value,
    restaurantId: (item.value as any).restaurantId,
  } as any)
  const announcer = document.getElementById('live-region')
  if (announcer) {
    announcer.textContent = `${item.value.name} added to cart. Quantity ${quantity.value}.`
    setTimeout(() => {
      if (announcer) announcer.textContent = ''
    }, 1000)
  }
}

async function fetchItem(id: string, opts?: { background?: boolean }) {
  if (!id) return
  const background = !!opts?.background
  // If UI is already showing, mark as refreshing instead of loading
  state.value = item.value && background ? 'refreshing' : (item.value ? 'success' : 'loading')
  try {
    const data = await apiFetchItemById(id)
    if (!data) {
      state.value = 'not_found'
      item.value = null
      return
    }
    item.value = data
    state.value = 'success'
  } catch (err: any) {
    errorMessage.value = err?.message || 'Unable to fetch item'
    if (!item.value) state.value = 'error'
    else state.value = 'success'
  }
}

onMounted(() => {
  const id = route.params.id as string
  if (!id) return
  // If navigated with state item, show immediately and refresh in background
  if (item.value) {
    fetchItem(id, { background: true })
  } else {
    fetchItem(id)
  }
})

watch(
  () => route.params.id,
  (newId, oldId) => {
    if (!newId || newId === oldId) return
    quantity.value = 1
    const id = String(newId)
    // If we already have the same item loaded (e.g., reactive update), avoid clearing UI
    if (item.value && String(item.value.id) === id) {
      fetchItem(id, { background: true })
    } else {
      // Try to reuse route.state fast-path
      const st = route?.state as { item?: FoodItem } | undefined
      if (st?.item && String(st.item.id) === id) {
        item.value = st.item
        state.value = 'success'
        fetchItem(id, { background: true })
      } else {
        item.value = null
        state.value = 'loading'
        fetchItem(id)
      }
    }
  }
)
</script>

<template>
  <div class="page bg-gradient min-h-screen">
    <div class="container">
      <nav aria-label="Breadcrumb" class="breadcrumb">
        <button class="link" @click="router.back()" aria-label="Go back">
          ← Back
        </button>
        <span class="sep" aria-hidden="true">/</span>
        <span class="crumb" aria-current="page">Item</span>
      </nav>

      <section v-if="state === 'loading'" class="card loading" role="status" aria-live="polite">
        <div class="skeleton image"></div>
        <div class="content">
          <div class="skeleton title"></div>
          <div class="skeleton text"></div>
          <div class="skeleton text short"></div>
          <div class="skeleton cta"></div>
        </div>
      </section>

      <section v-else-if="state === 'not_found'" class="card empty" role="alert" aria-live="assertive">
        <h1 class="title">Item not found</h1>
        <p>We couldn't find the food item you're looking for.</p>
        <button class="btn" @click="router.push({ name: 'home' })">Go Home</button>
      </section>

      <section v-else-if="state === 'error'" class="card empty" role="alert" aria-live="assertive">
        <h1 class="title">Something went wrong</h1>
        <p>{{ errorMessage || 'Please try again later.' }}</p>
        <button class="btn" @click="router.go(0)">Retry</button>
      </section>

      <article
        v-else-if="item"
        class="card item-card"
        itemscope
        itemtype="https://schema.org/MenuItem"
      >
        <div v-if="state === 'refreshing'" class="refresh-indicator" aria-live="polite">Refreshing…</div>
        <div class="media">
          <img
            :src="item.image"
            :alt="imageAlt"
            class="item-image"
            loading="lazy"
            width="800"
            height="460"
            itemprop="image"
          />
        </div>

        <div class="content">
          <header class="header">
            <h1 class="title" itemprop="name">{{ item.name }}</h1>
            <button
              class="icon-fav"
              :aria-pressed="isFavorite"
              :aria-label="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
              @click="toggleFavorite"
              title="Toggle favorite"
            >
              <svg v-if="isFavorite" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F59E0B" width="24" height="24" aria-hidden="true">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42
                4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3
                16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55
                11.54L12 21.35z"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#9CA3AF" width="24" height="24" aria-hidden="true">
                <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5
                3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55
                11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22
                8.5 22 5.42 19.58 3 16.5 3zM12.1 18.55l-.1.1-.11-.1C7.14
                14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99
                3.57 2.36h1.87C14.46 5.99 15.96 5 17.5 5 19.5 5 21 6.5 21
                8.5c0 2.89-3.14 5.74-8.9 10.05z"/>
              </svg>
            </button>
          </header>

          <div class="rating-row" aria-label="Ratings">
            <StarRating :rating="(item as any).rating ?? 0" :read-only="true" />
            <span class="rating-text" v-if="(item as any).rating !== undefined" aria-label="Average rating">
              {{ ((item as any).rating as number).toFixed(1) }} / 5
            </span>
            <span class="rating-text muted" v-else aria-label="No ratings yet">
              No ratings yet
            </span>
            <RouterLink
              v-if="(item as any)?.restaurantId"
              class="badge"
              :to="{ name: 'restaurant', params: { id: (item as any).restaurantId }, hash: '#ratings' }"
              title="See restaurant ratings"
            >
              ★ Ratings
            </RouterLink>
          </div>

          <p class="description" itemprop="description">
            {{ item.description || 'Delicious freshly prepared item.' }}
          </p>

          <div class="purchase-row" aria-live="polite">
            <div class="price" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
              <span class="price-value" itemprop="price">{{ priceFormatted }}</span>
              <meta itemprop="priceCurrency" content="USD" />
            </div>

            <div class="qty">
              <label for="quantity" class="sr-only">Quantity</label>
              <QuantityStepper
                id="quantity"
                v-model="quantity"
                :min="1"
                :max="99"
                aria-label="Select quantity"
              />
            </div>

            <div class="cta">
              <button class="btn primary" @click="addToCart" aria-label="Add to cart">
                Add to Cart
              </button>
            </div>
          </div>

          <div id="live-region" class="sr-only" aria-live="polite"></div>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
:root {
  --primary: #2563EB;
  --secondary: #F59E0B;
  --error: #EF4444;
  --bg: #f9fafb;
  --surface: #ffffff;
  --text: #111827;
  --muted: #6B7280;
  --shadow: 0 10px 20px rgba(2, 6, 23, 0.06);
  --radius: 16px;
}

.bg-gradient {
  background: linear-gradient(135deg, rgba(59,130,246,0.06), rgba(243,244,246,0.6));
  padding-bottom: 48px;
}
.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px;
}
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0 16px;
  color: var(--muted);
  font-size: 14px;
}
.breadcrumb .link {
  background: transparent;
  border: none;
  padding: 0;
  color: var(--primary);
  cursor: pointer;
}
.breadcrumb .link:hover { text-decoration: underline; }
.breadcrumb .sep { opacity: 0.5; }
.card {
  display: grid;
  grid-template-columns: 1fr;
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}
.item-card {
  grid-template-columns: 1fr 1.2fr;
}
@media (max-width: 900px) {
  .item-card { grid-template-columns: 1fr; }
}
.media {
  background: linear-gradient(180deg, rgba(37,99,235,0.08), transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
}
.item-image {
  width: 100%;
  height: 100%;
  max-height: 460px;
  object-fit: cover;
}
.content {
  padding: 24px;
}
.header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}
.title {
  font-size: 28px;
  line-height: 1.2;
  color: var(--text);
  margin: 0 0 8px;
}
.icon-fav {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 999px;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  box-shadow: var(--shadow);
}
.rating-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0 12px;
}
.rating-text { color: var(--text); font-size: 14px; }
.rating-text.muted { color: var(--muted); }
.badge {
  font-size: 0.85rem;
  background: #111827;
  color: #fff;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  box-shadow: 0 3px 8px rgba(0,0,0,0.12);
  text-decoration: none;
}
.description {
  color: #374151;
  font-size: 16px;
  line-height: 1.6;
  margin: 8px 0 20px;
}
.purchase-row {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 16px;
  align-items: center;
}
@media (max-width: 600px) {
  .purchase-row { grid-template-columns: 1fr; }
}
.price-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
}
.cta .btn {
  width: 100%;
}
.btn {
  appearance: none;
  border: 1px solid transparent;
  background: #fff;
  color: var(--text);
  padding: 10px 16px;
  border-radius: 12px;
  box-shadow: var(--shadow);
  transition: transform .05s ease, box-shadow .2s ease, background .2s ease, color .2s ease;
  cursor: pointer;
}
.btn:hover { transform: translateY(-1px); }
.btn.primary {
  background: linear-gradient(135deg, #2563EB, #1D4ED8);
  color: white;
  border-color: #1D4ED8;
}
.btn.primary:hover { box-shadow: 0 12px 24px rgba(29,78,216,0.22); }

.loading {
  grid-template-columns: 1fr 1fr;
  padding: 16px;
  gap: 16px;
}
.loading .skeleton {
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
  animation: shimmer 1.2s infinite;
  border-radius: 10px;
  height: 16px;
}
.loading .skeleton.image { height: 260px; }
.loading .skeleton.title { width: 70%; height: 24px; }
.loading .skeleton.text { width: 90%; }
.loading .skeleton.text.short { width: 60%; }
.loading .skeleton.cta { width: 40%; height: 36px; }
@keyframes shimmer {
  0% { background-position: -40rem 0; }
  100% { background-position: 40rem 0; }
}

.empty {
  padding: 24px;
  text-align: center;
}

.sr-only {
  position: absolute !important;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0);
  white-space: nowrap; border: 0;
}
.refresh-indicator {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(255,255,255,0.9);
  color: #374151;
  font-size: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 2px 8px;
}
</style>
