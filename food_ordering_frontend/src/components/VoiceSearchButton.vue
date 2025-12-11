<template>
  <div class="voice-wrap">
    <button
      class="voice-btn"
      :class="{ active: listening }"
      @click="toggle"
      @keydown.enter.prevent="toggle"
      :aria-pressed="listening ? 'true' : 'false'"
      :aria-label="listening ? 'Stop voice search' : 'Start voice search'"
      type="button"
    >
      <span class="mic-icon" aria-hidden="true">🎤</span>
      <span class="label">{{ listening ? 'Listening…' : 'Voice' }}</span>
    </button>

    <button
      v-if="listening"
      class="stop-btn"
      type="button"
      @click="stop"
      aria-label="Stop listening"
    >
      Stop
    </button>

    <div class="status" aria-live="polite">
      <span v-if="statusText">{{ statusText }}</span>
    </div>

    <div class="hint" role="tooltip">
      <strong>Try:</strong>
      <span>“show me biryani near me”</span>
      <span>“order pizza under 200 rupees”</span>
      <span>“chinese delivery”</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useVoiceRecognition } from '@/utils/voice';
import { useGeo } from '@/stores/geo';

const router = useRouter();
const route = useRoute();
const { supported, listening, interim, finalText, error, start, stop, getVoiceQuery } = useVoiceRecognition();
const geo = useGeo();

const statusText = computed(() => {
  if (!supported) return 'Microphone not supported on this browser.';
  if (error.value === 'not-allowed') return 'Mic permission denied.';
  if (listening.value) return interim.value ? `Heard: ${interim.value}` : 'Listening…';
  if (finalText.value) return `You said: "${finalText.value}"`;
  return '';
});

function toggle() {
  if (!supported) return;
  if (listening.value) stop();
  else start();
}

async function applyParsed() {
  const q = getVoiceQuery();
  if (!q.transcript) return;

  const currentQuery: Record<string, any> = { ...route.query };

  // Map parsed filters to router query parameters
  if (q.parsed.keywords?.length) currentQuery.q = q.parsed.keywords.join(' ');
  if (q.parsed.cuisines?.length) currentQuery.cuisines = q.parsed.cuisines;
  if (typeof q.parsed.maxPrice === 'number') currentQuery.maxPrice = String(q.parsed.maxPrice);
  if (q.parsed.nearMe) currentQuery.nearMe = '1';
  if (q.parsed.fulfillment) currentQuery.fulfillment = q.parsed.fulfillment;

  // If nearMe requested, try to get coordinates (non-blocking for navigation)
  if (q.parsed.nearMe) {
    const coords = await geo.request();
    if (coords) {
      currentQuery.lat = String(coords.lat);
      currentQuery.lon = String(coords.lon);
    }
  }

  // Choose destination route by intent
  if (q.parsed.intent === 'order_item' || q.parsed.intent === 'search_items') {
    // Go to home (items list) with query
    await router.push({ name: 'home', query: currentQuery });
  } else {
    // Restaurants search
    // Make sure sort by distance if nearMe
    if (q.parsed.nearMe) {
      currentQuery.sortBy = 'distance';
      currentQuery.sortDir = 'asc';
    }
    await router.push({ name: 'restaurants', query: currentQuery });
  }
}

// When finalText updates, apply parsed filters.
watch(finalText, async (v) => {
  if (v && v.trim()) {
    await applyParsed();
  }
});
</script>

<style scoped>
.voice-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.voice-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  color: #111827;
  border: 1px solid #e5e7eb;
  padding: 6px 10px;
  border-radius: 999px;
  cursor: pointer;
  transition: box-shadow .2s ease, border-color .2s ease, background .2s ease;
}
.voice-btn:hover {
  border-color: #c7d2fe;
  box-shadow: 0 2px 10px rgba(37,99,235,0.12);
}
.voice-btn.active {
  background: rgba(37,99,235,.08);
  border-color: #2563EB;
}
.mic-icon {
  font-size: 16px;
  line-height: 1;
}
.label { font-weight: 600; font-size: 14px; }

.stop-btn {
  background: #EF4444;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 4px 8px;
  cursor: pointer;
}

.status {
  min-height: 1.25rem;
  font-size: 12px;
  color: #374151;
}

.hint {
  position: absolute;
  top: 110%;
  left: 0;
  background: #ffffff;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  display: flex;
  gap: 8px;
  flex-direction: column;
  white-space: nowrap;
  transform: translateY(6px);
  z-index: 10;
}
.hint strong { color: #2563EB; }
.hint span { color: #6b7280; }
</style>
