<script setup lang="ts">
import type { NutritionFacts } from '@/types'

defineProps<{
  nutrition?: NutritionFacts
}>()
</script>

<template>
  <div v-if="nutrition" class="nutri" aria-label="Nutrition summary">
    <span class="cal" :title="`${nutrition.calories} kcal`">{{ nutrition.calories }} kcal</span>
    <span class="pill" title="Protein"><strong>P</strong> {{ nutrition.protein }}g</span>
    <span class="pill" title="Carbs"><strong>C</strong> {{ nutrition.carbs }}g</span>
    <span class="pill" title="Fat"><strong>F</strong> {{ nutrition.fat }}g</span>
  </div>
</template>

<style scoped>
.nutri {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  color: #1E3A8A;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
}
.cal {
  background: #fff;
  border: 1px solid #E5E7EB;
  padding: 2px 6px;
  border-radius: 999px;
  font-weight: 700;
  color: #111827;
}
.pill {
  color: #1E3A8A;
}
.pill strong { color: #2563EB; }
</style>
