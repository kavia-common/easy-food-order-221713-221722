<script setup lang="ts">
type SortBy = 'rating' | 'price' | 'distance'
type SortDir = 'asc' | 'desc'

defineProps<{
  sortBy: SortBy
  sortDir: SortDir
}>()

const emit = defineEmits<{
  (e: 'update:sortBy', v: SortBy): void
  (e: 'update:sortDir', v: SortDir): void
}>()

function onSortBy(e: Event) {
  const value = (e.target as HTMLSelectElement).value as SortBy
  emit('update:sortBy', value)
}
function onSortDir(e: Event) {
  const value = (e.target as HTMLSelectElement).value as SortDir
  emit('update:sortDir', value)
}
</script>

<template>
  <div class="sortbar" role="group" aria-label="Sort restaurants">
    <label class="field">
      <span>Sort by</span>
      <select :value="sortBy" @change="onSortBy" aria-label="Sort by">
        <option value="rating">Rating</option>
        <option value="price">Price</option>
        <option value="distance">Distance</option>
      </select>
    </label>
    <label class="field">
      <span>Direction</span>
      <select :value="sortDir" @change="onSortDir" aria-label="Sort direction">
        <option value="desc">Desc</option>
        <option value="asc">Asc</option>
      </select>
    </label>
  </div>
</template>

<style scoped>
.sortbar {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: .25rem 0 .5rem;
}
.field { display: grid; gap: .25rem; color: #374151; }
select {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: .4rem .6rem;
  background: var(--surface);
  outline: none;
}
select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(37,99,235,0.12);
}
</style>
