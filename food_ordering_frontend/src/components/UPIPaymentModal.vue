<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { buildUPIQRCodeData } from '@/services/payments'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirmed'): void
}>()

const props = defineProps<{
  open: boolean
  deeplink: string
}>()

const qrRef = ref<SVGSVGElement | null>(null)

// naive QR like placeholder (not real QR encoding: render data text as blocks for mock)
function renderMockQR(data: string) {
  const svg = qrRef.value
  if (!svg) return
  while (svg.firstChild) svg.removeChild(svg.firstChild)
  // simple grid hash based
  const size = 180
  const cell = 6
  const cols = Math.floor(size / cell)
  const rows = cols
  svg.setAttribute('width', String(size))
  svg.setAttribute('height', String(size))
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`)
  const seed = Array.from(data).reduce((a, c) => (a + c.charCodeAt(0)) % 9973, 0)
  let s = seed
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff
      const on = (s % 7) < 3
      if (on) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        rect.setAttribute('x', String(x * cell))
        rect.setAttribute('y', String(y * cell))
        rect.setAttribute('width', String(cell))
        rect.setAttribute('height', String(cell))
        rect.setAttribute('fill', '#111827')
        svg.appendChild(rect)
      }
    }
  }
}

function copyLink() {
  try {
    navigator.clipboard.writeText(props.deeplink)
  } catch { /* ignore */ }
}

watch(() => props.deeplink, (v) => {
  if (v) {
    renderMockQR(buildUPIQRCodeData(v))
  }
})

onMounted(() => {
  if (props.deeplink) renderMockQR(buildUPIQRCodeData(props.deeplink))
})
</script>

<template>
  <div v-if="open" class="overlay" role="dialog" aria-modal="true" aria-label="UPI payment">
    <div class="modal">
      <header class="header">
        <h3>Scan UPI QR or open app</h3>
        <button class="close" aria-label="Close" @click="emit('close')">✕</button>
      </header>

      <div class="content">
        <div class="qr-wrap">
          <svg ref="qrRef" aria-label="UPI QR code"></svg>
        </div>
        <a class="open-btn" :href="deeplink">Open in UPI app</a>
        <button class="copy" @click="copyLink">Copy UPI link</button>
        <p class="hint">If your app didn't open, scan the QR in your UPI app or paste the link.</p>
        <div class="divider" role="separator" aria-orientation="horizontal"></div>
        <button class="confirm" @click="emit('confirmed')">I have paid</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(17,24,39,.5);
  display: grid; place-items: center;
  z-index: 50;
}
.modal {
  width: min(480px, 92vw);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 20px 48px rgba(0,0,0,.25);
  overflow: hidden;
}
.header {
  display: flex; align-items: center; justify-content: space-between;
  padding: .8rem 1rem;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(180deg, rgba(37,99,235,.06), #fff);
}
.close {
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 8px;
  padding: .2rem .4rem;
  cursor: pointer;
}
.content { padding: 1rem; display: grid; gap: .7rem; }
.qr-wrap { display: grid; place-items: center; }
.open-btn {
  display: inline-block;
  text-align: center;
  background: var(--primary);
  color: #fff;
  text-decoration: none;
  border-radius: 10px;
  padding: .6rem .9rem;
  box-shadow: 0 6px 16px rgba(37,99,235,.25);
}
.copy, .confirm {
  border: 1px solid var(--border);
  background: #ffffff;
  border-radius: 10px;
  padding: .6rem .9rem;
  cursor: pointer;
}
.confirm {
  border-color: var(--primary);
  color: #fff;
  background: var(--primary);
}
.hint { color: #4b5563; font-size: .92rem; }
.divider { height: 1px; background: var(--border); margin: .4rem 0; }
</style>
