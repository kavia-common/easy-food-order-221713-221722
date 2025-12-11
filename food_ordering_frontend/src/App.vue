<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import { RouterView } from 'vue-router'
import ErrorBoundary from '@/components/ErrorBoundary.vue'
</script>

<template>
  <div class="app-shell">
    <header>
      <ErrorBoundary>
        <AppHeader />
      </ErrorBoundary>
    </header>
    <main class="container">
      <ErrorBoundary>
        <!-- A minimal skeleton so we never show a blank screen -->
        <Suspense>
          <template #default>
            <RouterView />
          </template>
          <template #fallback>
            <div class="skeleton-page" aria-label="Loading page">
              <div class="skeleton-header"></div>
              <div class="skeleton-row"></div>
              <div class="skeleton-row short"></div>
              <div class="skeleton-grid">
                <div class="skeleton-card" v-for="n in 6" :key="n"></div>
              </div>
            </div>
          </template>
        </Suspense>
      </ErrorBoundary>
    </main>
  </div>
</template>

<style>
.app-shell {
  min-height: 100vh;
  background: linear-gradient(180deg, rgba(37,99,235,0.06), rgba(249,250,251,1));
}
.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px;
}

/* Fallback skeleton styles */
.skeleton-page { display: grid; gap: 10px; }
.skeleton-header,
.skeleton-row,
.skeleton-card {
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
  border-radius: 12px;
}
.skeleton-header { height: 24px; }
.skeleton-row { height: 14px; }
.skeleton-row.short { width: 60%; }
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0,1fr));
  gap: 10px;
}
@media (min-width: 640px) { .skeleton-grid { grid-template-columns: repeat(2, minmax(0,1fr)); } }
@media (min-width: 1024px) { .skeleton-grid { grid-template-columns: repeat(3, minmax(0,1fr)); } }
.skeleton-card { height: 140px; }
@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}
</style>
