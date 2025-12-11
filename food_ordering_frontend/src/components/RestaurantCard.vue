<script setup lang="ts">
import type { Restaurant } from '@/types'

defineProps<{
  restaurant: Restaurant
}>()
</script>

<template>
  <article class="card" :aria-label="restaurant.name">
    <div class="thumb" role="img" :aria-label="`${restaurant.name} image`">
      <img v-if="restaurant.image" :src="restaurant.image" :alt="restaurant.name" />
      <div v-else class="placeholder">🍽️</div>
      <div class="badge status" :class="{ open: restaurant.isOpen }" aria-live="polite">
        {{ restaurant.isOpen ? 'Open' : 'Closed' }}
      </div>
      <div v-if="restaurant.etaMin" class="badge eta" aria-label="Estimated delivery time">
        {{ restaurant.etaMin }} min
      </div>
    </div>
    <div class="info">
      <h3 class="name">{{ restaurant.name }}</h3>
      <p class="cuisines">{{ restaurant.cuisines.join(', ') }}</p>
      <div class="meta">
        <span class="rating" aria-label="Rating">
          ⭐ {{ restaurant.rating.toFixed(1) }}
        </span>
        <span class="price" aria-label="Price level">
          {{ '$'.repeat(restaurant.priceLevel) }}
        </span>
        <span class="distance" aria-label="Distance">
          {{ restaurant.distanceKm.toFixed(1) }} km
        </span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.card {
  display: grid;
  grid-template-rows: 140px auto;
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
.thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.placeholder { width: 100%; height: 100%; display: grid; place-items: center; font-size: 40px; }

.badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #111827;
  color: #fff;
  font-size: .75rem;
  padding: .2rem .5rem;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.2);
}
.badge.eta {
  right: auto;
  left: 10px;
  background: var(--primary);
}
.badge.status.open {
  background: #16a34a;
}

.info { padding: .75rem; display: grid; gap: .4rem; }
.name { margin: 0; font-size: 1rem; font-weight: 800; color: var(--text); }
.cuisines { margin: 0; color: #6b7280; font-size: .9rem; min-height: 1.8em; }

.meta { display: flex; gap: .6rem; align-items: center; color: #374151; }
.rating { color: #f59e0b; font-weight: 700; }
.price { letter-spacing: 1px; }
</style>
