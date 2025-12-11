<template>
  <figure class="chart" role="img" :aria-label="ariaLabel">
    <figcaption class="sr-only">{{ ariaLabel }}</figcaption>
    <svg :viewBox="`0 0 ${width} ${height}`" :width="width" :height="height">
      <g :transform="`translate(${padding}, ${padding})`">
        <!-- axes -->
        <line :x1="0" :y1="innerH" :x2="innerW" :y2="innerH" class="axis" />
        <line :x1="0" :y1="0" :x2="0" :y2="innerH" class="axis" />
        <!-- bars -->
        <g v-for="(d, i) in data" :key="i"
           :transform="`translate(${i * (barW + gap)}, ${yScale(valAccessor(d))})`"
           class="bar-wrap">
          <rect
            class="bar"
            :width="barW"
            :height="innerH - yScale(valAccessor(d))"
            :fill="barColor"
            :rx="4"
          />
          <title>{{ labelAccessor(d) }}: {{ valAccessor(d) }}</title>
        </g>
        <!-- x labels -->
        <g v-for="(d, i) in data" :key="`x-${i}`" :transform="`translate(${i * (barW + gap) + barW/2}, ${innerH + 14})`">
          <text class="x-label" text-anchor="middle">{{ labelAccessor(d) }}</text>
        </g>
        <!-- y ticks -->
        <g v-for="t in ticks" :key="`y-${t}`" :transform="`translate(0, ${yScale(t)})`">
          <line :x1="0" :x2="innerW" y1="0" y2="0" class="grid" />
          <text class="y-label" :x="-8" y="0" text-anchor="end" dominant-baseline="middle">{{ t }}</text>
        </g>
      </g>
    </svg>
  </figure>
</template>

<script setup lang="ts">
/**
 * PUBLIC_INTERFACE
 * A small, dependency-free SVG bar chart with accessible labeling.
 */
import { computed } from 'vue'

type AnyRec = Record<string, any>

const props = defineProps<{
  data: AnyRec[]
  /** Extract numeric value from datum */
  valAccessor: (d: AnyRec) => number
  /** Extract label for x-axis */
  labelAccessor: (d: AnyRec) => string
  ariaLabel: string
  width?: number
  height?: number
  max?: number
  /** preferred number of grid lines */
  gridLines?: number
  barColor?: string
}>()

const width = computed(() => props.width ?? 560)
const height = computed(() => props.height ?? 240)
const padding = 32
const gap = 8

const innerW = computed(() => width.value - padding * 2)
const innerH = computed(() => height.value - padding * 2)
const barW = computed(() => {
  const n = Math.max(1, props.data?.length ?? 1)
  const totalGaps = gap * (n - 1)
  return Math.max(6, Math.floor((innerW.value - totalGaps) / n))
})

const maxVal = computed(() => {
  const m = Math.max(1, ...props.data.map(props.valAccessor))
  const forced = props.max
  return Math.max(m, forced ?? 0)
})

function niceTick(max: number, lines = 4) {
  const step = Math.max(1, Math.round(max / lines))
  const ticks: number[] = []
  for (let t = 0; t <= max; t += step) ticks.push(t)
  if (ticks[ticks.length - 1] !== max) ticks.push(max)
  return ticks
}

const ticks = computed(() => niceTick(maxVal.value, props.gridLines ?? 4))

function yScale(v: number) {
  const r = maxVal.value === 0 ? 0 : (1 - v / maxVal.value)
  return Math.round(r * innerH.value)
}

const barColor = computed(() => props.barColor ?? '#2563EB') // Ocean Professional primary
</script>

<style scoped>
.chart {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
  padding: 8px;
}
.axis {
  stroke: #94a3b8;
  stroke-width: 1;
}
.grid {
  stroke: rgba(148,163,184,.35);
  stroke-width: 1;
}
.x-label, .y-label {
  fill: #111827;
  font-size: 11px;
}
.bar {
  transition: opacity .2s ease, transform .2s ease;
}
.bar-wrap:hover .bar {
  opacity: .9;
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
