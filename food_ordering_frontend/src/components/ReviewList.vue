<template>
  <div>
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div class="h-3 bg-gray-100 rounded w-2/3 mb-1"></div>
        <div class="h-3 bg-gray-100 rounded w-5/6"></div>
      </div>
    </div>
    <div v-else-if="!reviews || reviews.length === 0" class="text-gray-500 text-sm">
      No reviews yet. Be the first to write one.
    </div>
    <ul v-else class="divide-y divide-gray-100">
      <li v-for="r in reviews" :key="r.id" class="py-3">
        <div class="flex items-center justify-between">
          <div class="font-medium text-gray-900">{{ r.author }}</div>
          <div class="text-xs text-gray-500">{{ formatDate(r.createdAt) }}</div>
        </div>
        <div class="flex items-center gap-2 mt-1">
          <StarRating :model-value="r.rating" readonly />
          <span class="text-xs text-gray-600">{{ r.rating.toFixed(1) }}</span>
        </div>
        <p class="text-sm text-gray-700 mt-1 whitespace-pre-line">{{ r.comment }}</p>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import StarRating from './StarRating.vue';
import type { ReviewBase } from '@/types/reviews';

defineProps<{
  reviews: ReviewBase[] | undefined;
  loading?: boolean;
}>();

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}
</script>

<style scoped>
</style>
