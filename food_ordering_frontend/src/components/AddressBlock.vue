<script setup lang="ts">
import { computed } from 'vue'
import type { RestaurantAddress } from '@/types/restaurantProfile'

const props = defineProps<{
  address: RestaurantAddress
  showCopy?: boolean
}>()

const emits = defineEmits<{
  (e: 'copied'): void
}>()

const formatted = computed(() => {
  const a = props.address
  const parts = [a.line1, a.line2, [a.city, a.state].filter(Boolean).join(', '), a.postalCode, a.country].filter(Boolean)
  return parts.join('\n')
})

async function copyAddress() {
  try {
    await navigator.clipboard.writeText(formatted.value)
    emits('copied')
  } catch {
    // silent fail
  }
}

const mapHref = computed(() => {
  const a = props.address
  if (a.latitude != null && a.longitude != null) {
    return `https://www.google.com/maps?q=${encodeURIComponent(`${a.latitude},${a.longitude}`)}`
  }
  const q = [a.line1, a.line2, a.city, a.state, a.postalCode, a.country].filter(Boolean).join(', ')
  if (!q) return undefined
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}`
})
</script>

<template>
  <div class="address-block">
    <pre class="addr-text" aria-label="Restaurant address">{{ formatted }}</pre>
    <div class="addr-actions">
      <a v-if="mapHref" :href="mapHref" target="_blank" rel="noopener" class="btn btn-link" aria-label="Open in Maps">Open in Maps</a>
      <button
        v-if="showCopy"
        class="btn btn-copy"
        type="button"
        @click="copyAddress"
        aria-label="Copy address to clipboard"
      >
        Copy
      </button>
    </div>
  </div>
</template>

<style scoped>
.address-block {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px;
}
.addr-text {
  white-space: pre-wrap;
  color: #111827;
  margin: 0;
}
.addr-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.btn {
  cursor: pointer;
  border-radius: 8px;
  padding: 6px 10px;
  border: 1px solid transparent;
  transition: all .2s ease;
}
.btn-copy {
  background: #2563EB;
  color: white;
}
.btn-copy:hover {
  filter: brightness(0.95);
}
.btn-link {
  color: #2563EB;
  text-decoration: none;
  border-color: #dbeafe;
  background: linear-gradient(to right, rgba(59,130,246,.08), rgba(249,250,251,1));
}
.btn-link:hover {
  background: #eff6ff;
}
</style>
