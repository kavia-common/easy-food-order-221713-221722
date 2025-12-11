<template>
  <section class="page" aria-labelledby="analytics-title">
    <header class="page-header">
      <h1 id="analytics-title">Analytics Dashboard</h1>
      <div class="actions">
        <label class="range-label" for="range">Range</label>
        <select id="range" v-model.number="range" @change="loadAll" aria-label="Select analytics date range">
          <option :value="7">Last 7 days</option>
          <option :value="30">Last 30 days</option>
        </select>
      </div>
    </header>

    <div v-if="loading" class="skeleton-grid" aria-live="polite" aria-busy="true">
      <div class="card skeleton"></div>
      <div class="card skeleton"></div>
      <div class="card skeleton"></div>
    </div>

    <div v-else-if="error" class="error" role="alert">
      <strong>Unable to load analytics.</strong>
      <p>{{ error }}</p>
      <button class="btn" @click="loadAll">Retry</button>
    </div>

    <div v-else class="grid">
      <article class="card" aria-labelledby="sales-title">
        <header class="card-header">
          <h2 id="sales-title">Daily Sales</h2>
          <p class="subtitle">Revenue and orders per day</p>
        </header>
        <div v-if="dailySales.length === 0" class="empty">No sales in this period.</div>
        <BarChart
          v-else
          :data="dailySales"
          :valAccessor="(d) => d.totalCents / 100"
          :labelAccessor="(d) => shortDate(d.date)"
          aria-label="Daily sales revenue chart"
          :height="240"
          :gridLines="5"
        />
      </article>

      <article class="card" aria-labelledby="peak-title">
        <header class="card-header">
          <h2 id="peak-title">Peak Hours</h2>
          <p class="subtitle">Hourly order density by day</p>
        </header>
        <div v-if="peakHours.length === 0" class="empty">No hourly data in this period.</div>
        <HeatmapGrid
          v-else
          :data="peakHours"
          aria-label="Peak hours heatmap for orders"
          :height="300"
        />
      </article>

      <article class="card" aria-labelledby="top-title">
        <header class="card-header">
          <h2 id="top-title">Most Ordered Items</h2>
          <p class="subtitle">Top items by orders</p>
        </header>
        <div v-if="topItems.length === 0" class="empty">No popular items in this period.</div>
        <ul v-else class="list">
          <li v-for="it in topItems" :key="it.id" class="list-row">
            <span class="name">{{ it.name }}</span>
            <span class="metric">
              <strong>{{ it.count }}</strong> orders
              <span class="revenue"> • ${{ (it.revenueCents / 100).toFixed(2) }}</span>
            </span>
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * PUBLIC_INTERFACE
 * Analytics dashboard page showing daily sales, peak hours, and top items.
 */
import { ref, onMounted } from 'vue'
import BarChart from '@/components/charts/BarChart.vue'
import HeatmapGrid from '@/components/charts/HeatmapGrid.vue'
import { getDailySales, getPeakHours, getTopItems } from '@/services/analyticsApi'
import type { DateRange, DailySalesPoint, PeakHourPoint, TopItem } from '@/types/analytics'

const range = ref<DateRange>(7)
const loading = ref<boolean>(true)
const error = ref<string | null>(null)

const dailySales = ref<DailySalesPoint[]>([])
const peakHours = ref<PeakHourPoint[]>([])
const topItems = ref<TopItem[]>([])

function shortDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  const m = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return m
}

async function loadAll() {
  loading.value = true
  error.value = null
  try {
    const [d, p, t] = await Promise.all([
      getDailySales(range.value),
      getPeakHours(range.value),
      getTopItems(range.value),
    ])
    dailySales.value = d
    peakHours.value = p
    topItems.value = t
  } catch (e: any) {
    error.value = e?.message ?? 'Unknown error'
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
</script>

<style scoped>
.page {
  display: grid;
  gap: 16px;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px 16px;
}
h1 {
  font-size: 20px;
  color: #111827;
}
.actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.range-label {
  font-size: 14px;
  color: #374151;
}
select {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 6px 10px;
  background: #fff;
}
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}
@media (min-width: 960px) {
  .grid {
    grid-template-columns: 1.2fr 1fr;
  }
}
.card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
}
.card-header {
  margin-bottom: 8px;
}
.subtitle {
  color: #6b7280;
  font-size: 12px;
}
.empty {
  color: #6b7280;
  padding: 24px 8px;
}
.btn {
  background: #2563EB;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
}
.list {
  list-style: none;
  padding: 0;
  margin: 8px 0 0;
}
.list-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 4px;
  border-bottom: 1px dashed #e5e7eb;
}
.list-row:last-child {
  border-bottom: none;
}
.name { color: #111827; }
.metric { color: #374151; }
.revenue { color: #2563EB; }

.skeleton-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}
.skeleton {
  min-height: 220px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
  border-radius: 12px;
}
@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
</style>
