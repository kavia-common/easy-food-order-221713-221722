<template>
  <div class="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
    <div v-if="loading" class="animate-pulse">
      <div class="h-6 bg-gray-200 rounded w-24 mb-2"></div>
      <div class="h-3 bg-gray-100 rounded w-full mb-1" v-for="i in 5" :key="i"></div>
    </div>
    <div v-else>
      <div class="flex items-end gap-3">
        <div class="text-3xl font-semibold text-gray-900">{{ summary.average.toFixed(1) }}</div>
        <div class="pb-1 text-gray-600">
          <StarRating :model-value="summary.average" readonly />
        </div>
        <div class="text-sm text-gray-500">({{ summary.count }} reviews)</div>
      </div>
      <div class="mt-3 space-y-1.5">
        <div v-for="star in [5,4,3,2,1]" :key="star" class="flex items-center gap-2">
          <div class="w-10 text-xs text-gray-600">{{ star }} star</div>
          <div class="flex-1 h-3 bg-gray-100 rounded">
            <div
              class="h-3 rounded bg-amber-400"
              :style="{ width: barWidth(star) }"
            ></div>
          </div>
          <div class="w-8 text-right text-xs text-gray-600">
            {{ summary.breakdown[star as 1 | 2 | 3 | 4 | 5] || 0 }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import StarRating from './StarRating.vue';
import type { RatingSummary } from '@/types/reviews';

const props = defineProps<{
  summary: RatingSummary;
  loading?: boolean;
}>();

function barWidth(star: number) {
  const count = props.summary.count || 0;
  if (!count) return '0%';
  // RatingBreakdown keys are 1..5 as numbers
  const b = props.summary.breakdown;
  const value = b[star as 1 | 2 | 3 | 4 | 5] || 0;
  return `${Math.round((value / count) * 100)}%`;
}
</script>

<style scoped>
</style>
