<script setup lang="ts">
import type { FoodCategory } from '@/types'

defineProps<{
  categories: FoodCategory[]
  active?: string
}>()

const emit = defineEmits<{
  (e: 'select', id?: string): void
}>()
</script>

<template>
  <div class="wrap">
    <button
      class="chip"
      :class="{ active: !active }"
      @click="emit('select', undefined)"
    >
      All
    </button>
    <button
      v-for="c in categories"
      :key="c.id"
      class="chip"
      :class="{ active: active === c.id }"
      @click="emit('select', c.id)"
    >
      {{ c.name }}
    </button>
  </div>
</template>

<style scoped>
.wrap {
  display: flex;
  flex-wrap: wrap;
  gap: .5rem;
  padding: .25rem 0 .75rem;
}
.chip {
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 999px;
  padding: .4rem .8rem;
  cursor: pointer;
  transition: all .2s ease;
}
.chip.active {
  border-color: var(--primary);
  color: var(--primary);
  box-shadow: 0 2px 8px rgba(37,99,235,0.2);
}
.chip:hover { transform: translateY(-1px); }
</style>
