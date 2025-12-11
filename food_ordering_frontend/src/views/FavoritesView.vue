<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFavoritesStore } from '@/stores/favorites'
import RestaurantCard from '@/components/RestaurantCard.vue'
import FoodItemCard from '@/components/FoodItemCard.vue'

const favs = useFavoritesStore()
const activeTab = ref<'restaurants' | 'items'>('restaurants')

const restaurants = computed(() => favs.restaurantList)
const items = computed(() => favs.itemList)

function removeRestaurant(id: string) {
  favs.removeRestaurant(id)
}
function removeItem(id: string) {
  favs.removeItem(id)
}
</script>

<template>
  <div class="wrap">
    <header class="header">
      <div class="title">
        <h2>Favorites</h2>
        <p>Quick access to your saved restaurants and dishes.</p>
      </div>
      <div class="tabs" role="tablist" aria-label="Favorites sections">
        <button
          role="tab"
          :aria-selected="activeTab === 'restaurants'"
          class="tab"
          :class="{ active: activeTab === 'restaurants' }"
          @click="activeTab = 'restaurants'"
        >
          Restaurants ({{ restaurants.length }})
        </button>
        <button
          role="tab"
          :aria-selected="activeTab === 'items'"
          class="tab"
          :class="{ active: activeTab === 'items' }"
          @click="activeTab = 'items'"
        >
          Dishes ({{ items.length }})
        </button>
      </div>
    </header>

    <section v-show="activeTab === 'restaurants'" aria-label="Favorite restaurants">
      <div v-if="!restaurants.length" class="state empty">No favorite restaurants yet.</div>
      <div v-else class="grid" role="list">
        <div v-for="r in restaurants" :key="r.id" role="listitem" class="stack">
          <RestaurantCard :restaurant="{
              id: r.id,
              name: r.name,
              cuisines: r.cuisines ?? [],
              rating: r.rating ?? 4.0,
              priceLevel: 2,
              distanceKm: 1.0,
              image: r.image,
              isOpen: true
            }" />
          <button class="remove" @click="removeRestaurant(r.id)" aria-label="Remove from favorites">Remove</button>
        </div>
      </div>
    </section>

    <section v-show="activeTab === 'items'" aria-label="Favorite dishes">
      <div v-if="!items.length" class="state empty">No favorite dishes yet.</div>
      <div v-else class="grid" role="list">
        <div v-for="it in items" :key="it.id" role="listitem" class="stack">
          <FoodItemCard :item="{
              id: it.id,
              name: it.name,
              price: it.price ?? 0,
              image: it.image || 'https://picsum.photos/seed/' + it.id + '/400/300',
              description: '',
              categoryId: 'favorites'
            }" />
          <button class="remove" @click="removeItem(it.id)" aria-label="Remove from favorites">Remove</button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.wrap { display: grid; gap: .75rem; }
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
.title p { margin: 0; color: #6b7280; }

.tabs { display: inline-flex; gap: .5rem; }
.tab {
  border: 1px solid var(--border);
  background: var(--surface);
  padding: .4rem .6rem;
  border-radius: 999px;
  cursor: pointer;
  transition: all .2s ease;
}
.tab.active {
  border-color: var(--primary);
  color: var(--primary);
  box-shadow: 0 2px 8px rgba(37,99,235,0.2);
}

.state {
  border: 1px dashed var(--border);
  background: #f9fafb;
  color: #374151;
  border-radius: 12px;
  padding: .75rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0,1fr));
  gap: .75rem;
}
@media (min-width: 640px) { .grid { grid-template-columns: repeat(2, minmax(0,1fr)); } }
@media (min-width: 1024px) { .grid { grid-template-columns: repeat(3, minmax(0,1fr)); } }

.stack { display: grid; gap: .4rem; }
.remove {
  border: 1px solid var(--border);
  background: #fef2f2;
  color: #991b1b;
  padding: .4rem .6rem;
  border-radius: 10px;
  cursor: pointer;
}
.remove:hover { background: #fee2e2; }
</style>
