<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import CategoryList from '@/components/CategoryList.vue'
import FoodItemCard from '@/components/FoodItemCard.vue'
import { fetchCategories, fetchItems } from '@/services/api'
import type { FoodCategory, FoodItem } from '@/types'
import { useRoute } from 'vue-router'

const route = useRoute()
const categories = ref<FoodCategory[]>([])
const items = ref<FoodItem[]>([])
const loading = ref(false)
const err = ref<string | null>(null)
const activeCategory = ref<string | undefined>(undefined)

async function load() {
  loading.value = true
  err.value = null
  try {
    if (categories.value.length === 0) {
      categories.value = await fetchCategories()
    }
    const search = (route.query.q as string) || undefined
    items.value = await fetchItems(activeCategory.value, search)
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
watch([() => route.query.q, activeCategory], load)
</script>

<template>
  <div class="home">
    <CategoryList
      :categories="categories"
      :active="activeCategory"
      @select="(id)=> activeCategory = id"
    />

    <div v-if="loading" class="loading">Loading menu…</div>
    <div v-else-if="err" class="error">
      {{ err }}. Please check your connection or try again shortly.
    </div>
    <div v-else-if="!items.length" class="empty">No items found.</div>

    <div v-else class="grid">
      <FoodItemCard v-for="it in items" :key="it.id" :item="it" />
    </div>
  </div>
</template>

<style scoped>
.home { display: grid; gap: .75rem; }

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
</style>
