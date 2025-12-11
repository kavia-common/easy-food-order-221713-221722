import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { FavoriteItem, FavoriteRestaurant } from '@/types'

type FavoritesState = {
  restaurants: Record<string, FavoriteRestaurant>
  items: Record<string, FavoriteItem>
}

const STORAGE_KEY = 'favorites_state_v1'

// SSR guard for window/localStorage access
function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function loadPersisted(): FavoritesState | null {
  if (!canUseStorage()) return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as FavoritesState) : null
  } catch {
    return null
  }
}

// Debounced persist helper to reduce re-writes
function createDebouncedSaver<T>(fn: (s: T) => void, delay = 250) {
  let t: number | null = null
  return (state: T) => {
    if (!canUseStorage()) return
    if (t) window.clearTimeout(t)
    t = window.setTimeout(() => {
      fn(state)
    }, delay)
  }
}

// PUBLIC_INTERFACE
export const useFavoritesStore = defineStore('favorites', () => {
  /** Favorites store handling restaurants and items, persisted to localStorage. */

  const initial = loadPersisted()
  const restaurants = ref<Record<string, FavoriteRestaurant>>(initial?.restaurants ?? {})
  const items = ref<Record<string, FavoriteItem>>(initial?.items ?? {})

  const restaurantIdsSet = computed(() => new Set(Object.keys(restaurants.value)))
  const itemIdsSet = computed(() => new Set(Object.keys(items.value)))

  // PUBLIC_INTERFACE
  function isRestaurantFav(id: string): boolean {
    /** Check if a restaurant id is favorited. */
    return restaurantIdsSet.value.has(id)
  }

  // PUBLIC_INTERFACE
  function isItemFav(id: string): boolean {
    /** Check if a menu item id is favorited. */
    return itemIdsSet.value.has(id)
  }

  // PUBLIC_INTERFACE
  function addRestaurant(fav: FavoriteRestaurant) {
    /** Add a restaurant to favorites. */
    restaurants.value = { ...restaurants.value, [fav.id]: fav }
  }

  // PUBLIC_INTERFACE
  function removeRestaurant(id: string) {
    /** Remove a restaurant from favorites. */
    if (!(id in restaurants.value)) return
    const next = { ...restaurants.value }
    delete (next as Record<string, unknown>)[id]
    restaurants.value = next
  }

  // PUBLIC_INTERFACE
  function toggleRestaurant(fav: FavoriteRestaurant) {
    /** Toggle a restaurant favorite. */
    if (isRestaurantFav(fav.id)) removeRestaurant(fav.id)
    else addRestaurant(fav)
  }

  // PUBLIC_INTERFACE
  function addItem(fav: FavoriteItem) {
    /** Add an item to favorites. */
    items.value = { ...items.value, [fav.id]: fav }
  }

  // PUBLIC_INTERFACE
  function removeItem(id: string) {
    /** Remove an item from favorites. */
    if (!(id in items.value)) return
    const next = { ...items.value }
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (next as Record<string, unknown>)[id]
    items.value = next
  }

  // PUBLIC_INTERFACE
  function toggleItem(fav: FavoriteItem) {
    /** Toggle a menu item favorite. */
    if (isItemFav(fav.id)) removeItem(fav.id)
    else addItem(fav)
  }

  const persistNow = (state: FavoritesState) => {
    try {
      if (!canUseStorage()) return
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ restaurants: state.restaurants, items: state.items }),
      )
    } catch {
      // ignore
    }
  }
  const persistDebounced = createDebouncedSaver<FavoritesState>(persistNow, 250)

  watch(
    [restaurants, items],
    () => {
      persistDebounced({ restaurants: restaurants.value, items: items.value })
    },
    { deep: true },
  )

  const restaurantList = computed(() => Object.values(restaurants.value))
  const itemList = computed(() => Object.values(items.value))

  return {
    restaurants,
    items,
    restaurantList,
    itemList,
    isRestaurantFav,
    isItemFav,
    addRestaurant,
    removeRestaurant,
    toggleRestaurant,
    addItem,
    removeItem,
    toggleItem,
  }
})
