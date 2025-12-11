<script setup lang="ts">
import { computed } from 'vue'
import type { WorkingHoursDay } from '../types/restaurant'

const props = defineProps<{
  hours?: WorkingHoursDay[]
}>()

const daysOrder = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']

function titleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const ordered = computed(() => {
  if (!props.hours?.length) return []
  const map = new Map(props.hours.map(d => [d.day.toLowerCase(), d]))
  return daysOrder.map(d => map.get(d) ?? { day: d, isClosed: true })
})

function isToday(day: string) {
  const today = new Date().getDay() // 0 Sunday ... 6 Saturday
  const mapIdx: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
  }
  return mapIdx[day.toLowerCase()] === today
}

function isOpenNow(h?: WorkingHoursDay) {
  if (!h || h.isClosed) return false
  if (!h.open || !h.close) return false
  const [oh, om] = h.open.split(':').map(Number)
  const [ch, cm] = h.close.split(':').map(Number)
  const now = new Date()
  const start = new Date(now); start.setHours(oh, om, 0, 0)
  const end = new Date(now); end.setHours(ch, cm, 0, 0)
  return now >= start && now <= end
}
</script>

<template>
  <div class="hours-wrap">
    <div
      v-for="h in ordered"
      :key="h.day"
      class="row"
      :class="{ today: isToday(h.day) }"
      role="listitem"
      :aria-label="`${titleCase(h.day)} ${h.isClosed ? 'Closed' : (h.open + ' - ' + h.close)}`"
    >
      <div class="day">{{ titleCase(h.day) }}</div>
      <div class="time">
        <span v-if="h.isClosed" class="badge closed" aria-label="Closed">Closed</span>
        <span v-else><span class="mono">{{ h.open }}</span> – <span class="mono">{{ h.close }}</span></span>
      </div>
      <div class="status" v-if="isToday(h.day)">
        <span class="badge" :class="isOpenNow(h) ? 'open' : 'closed'">{{ isOpenNow(h) ? 'Open now' : 'Closed now' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hours-wrap {
  display: grid;
  gap: 6px;
}
.row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  padding: 8px 10px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
}
.row.today {
  border-color: #93c5fd;
  background: linear-gradient(to right, rgba(59,130,246,.08), rgba(255,255,255,1));
}
.day { color: #111827; font-weight: 600; }
.time { color: #374151; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
.status { margin-left: 8px; }
.badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 9999px;
  border: 1px solid transparent;
}
.badge.open {
  background: #F59E0B;
  color: #111827;
  border-color: #fcd34d;
}
.badge.closed {
  background: #ef4444;
  color: white;
  border-color: #fca5a5;
}
</style>
