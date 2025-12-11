<template>
  <div class="review-list card">
    <div v-if="items.length === 0" class="empty">
      <p>No reviews yet. Be the first to leave a review!</p>
    </div>
    <ul v-else class="list">
      <li v-for="r in items" :key="r.id" class="row">
        <div class="header">
          <strong class="user">{{ r.userName || 'Guest' }}</strong>
          <span class="date">{{ formatDate(r.createdAt) }}</span>
        </div>
        <div class="stars">
          <RatingStars :model-value="Number(r.stars)" readonly />
          <span class="score">{{ Number(r.stars).toFixed(0) }}/5</span>
        </div>
        <p class="comment">{{ r.comment }}</p>
      </li>
    </ul>

    <div v-if="totalPages > 1" class="pager">
      <button class="btn" :disabled="page === 1" @click="$emit('update:page', page - 1)">Prev</button>
      <span class="page-indicator">Page {{ page }} / {{ totalPages }}</span>
      <button class="btn" :disabled="page === totalPages" @click="$emit('update:page', page + 1)">Next</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import RatingStars from './RatingStars.vue';
import type { BaseReview } from '@/types/ratings';

interface Props {
  items: BaseReview[];
  page: number;
  totalPages: number;
}
defineProps<Props>();
defineEmits<{ (e: 'update:page', value: number): void }>();

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}
</script>

<style scoped>
.card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 6px 16px rgba(17,24,39,0.06);
}
.empty {
  color: #6b7280;
  text-align: center;
  padding: 1rem;
}
.list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.row {
  padding: 0.75rem 0;
  border-bottom: 1px dashed #e5e7eb;
}
.row:last-child {
  border-bottom: none;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.user {
  color: #111827;
}
.date {
  color: #6b7280;
  font-size: 0.875rem;
}
.stars {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.25rem 0 0.5rem;
}
.score {
  color: #374151;
  font-size: 0.875rem;
}
.comment {
  color: #111827;
  line-height: 1.5;
}
.pager {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
}
.btn {
  background: linear-gradient(to bottom right, rgba(37,99,235,0.08), rgba(243,244,246,0.5));
  border: 1px solid #c7d2fe;
  color: #1f2937;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.page-indicator {
  color: #374151;
}
</style>
