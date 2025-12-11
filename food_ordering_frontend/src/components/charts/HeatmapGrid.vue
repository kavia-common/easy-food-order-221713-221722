<template>
  <figure class="chart" role="img" :aria-label="ariaLabel">
    <figcaption class="sr-only">{{ ariaLabel }}</figcaption>
    <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`">
      <g :transform="`translate(${paddingLeft}, ${paddingTop})`">
        <!-- hour labels on top -->
        <g v-for="h in hours" :key="h" :transform="`translate(${(h-0.5) * cellSize}, -8)`">
          <text class="axis-label" text-anchor="middle">{{ hourLabel(h-1) }}</text>
        </g>
        <!-- day labels left -->
        <g v-for="d in days" :key="d" :transform="`translate(-8, ${(d-0.5) * cellSize})`">
          <text class="axis-label" text-anchor="end" dominant-baseline="middle">{{ dowLabel(d-1) }}</text>
        </g>
        <!-- cells -->
        <g v-for="d in 7" :key="`row-${d}`">
          <g v-for="h in 24" :key="`cell-${d}-${h}`" :transform="`translate(${(h-1)*cellSize}, ${(d-1)*cellSize})`">
            <rect
              :width="cellSize - 2"
              :height="cellSize - 2"
              :fill="colorFor(d-1, h-1)"
              rx="4"
            />
            <title>{{ dowLabel(d-1) }} {{ hourLabel(h-1) }}: {{ countFor(d-1, h-1) }} orders</title>
          </g>
        </g>
      </g>
    </svg>
  </figure>
</template>

<script setup lang="ts">
/**
 * PUBLIC_INTERFACE
 * Heatmap grid (7x24) for peak hours visualization.
 */
import { computed } from 'vue'
import type { PeakHourPoint } from '@/types/analytics'

const props = defineProps<{
  data: PeakHourPoint[]
  ariaLabel: string
  width?: number
  height?: number
}>()

const width = computed(() => props.width ?? 680)
const height = computed(() => props.height ?? 320)
const paddingLeft = 56
const paddingTop = 26

const cellSize = computed(() => {
  // 24 columns, 7 rows
  const innerW = width.value - paddingLeft - 8
  const innerH = height.value - paddingTop - 8
  return Math.max(14, Math.min(Math.floor(innerW / 24), Math.floor(innerH / 7)))
})

const days = [1,2,3,4,5,6,7]
const hours = Array.from({ length: 24 }).map((_, i) => i + 1)

const matrix = computed(() => {
  const m: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
  for (const p of props.data) {
    if (p.dow >= 0 && p.dow < 7 && p.hour >= 0 && p.hour < 24) {
      m[p.dow][p.hour] += p.count
    }
  }
  return m
})

const maxVal = computed(() => {
  let m = 0
  for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) m = Math.max(m, matrix.value[d][h])
  return m || 1
})

function colorFor(d: number, h: number) {
  const v = matrix.value[d][h]
  const t = v / maxVal.value
  // Ocean Professional gradient from light to primary
  const start = { r: 59, g: 130, b: 246, a: 0.10 } // blue-500 @10%
  const end = { r: 37, g: 99, b: 235, a: 0.95 }    // primary @95%
  const r = Math.round(start.r + (end.r - start.r) * t)
  const g = Math.round(start.g + (end.g - start.g) * t)
  const b = Math.round(start.b + (end.b - start.b) * t)
  const a = start.a + (end.a - start.a) * t
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`
}

function countFor(d: number, h: number) {
  return matrix.value[d][h]
}

function hourLabel(h: number) {
  const ampm = h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`
  return ampm
}
function dowLabel(d: number) {
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d] ?? `${d}`
}
</script>

<style scoped>
.chart {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
  padding: 8px;
}
.axis-label {
  fill: #111827;
  font-size: 11px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border: 0;
}
</style>
