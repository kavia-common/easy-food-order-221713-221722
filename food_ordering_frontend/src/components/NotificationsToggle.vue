<template>
  <div class="notif-toggle" :class="{ disabled: !canInteract }">
    <label :for="id" class="label">
      <span class="label-text">Festival Offers</span>
      <span class="sr-only">Toggle push notifications for special festival offers</span>
    </label>
    <button
      :id="id"
      class="toggle"
      :class="{ on: isOn, off: !isOn }"
      :disabled="!canInteract"
      role="switch"
      :aria-checked="isOn ? 'true' : 'false'"
      :aria-label="`Festival Offers notifications ${isOn ? 'on' : 'off'}`"
      @click="onToggle"
    >
      <span class="knob" />
    </button>
    <div class="status" aria-live="polite">{{ helpText }}</div>
    <div v-if="showBlockedHelp" class="blocked-help">
      To enable, check site permissions in your browser and allow notifications for this site.
    </div>

    <button
      v-if="mockMode && !isOn"
      class="mock-btn"
      type="button"
      @click="simulate"
      aria-label="Simulate festival offer notification"
    >
      Try a mock notification
    </button>

    <div v-if="toastMsg" class="toast" role="status" aria-live="polite">{{ toastMsg }}</div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import {
  canToggleForState,
  getNotificationsUIState,
  getFestivalOffersPreference,
  isMockMode,
  requestFestivalOffersPermission,
  setFestivalOffersPreference,
  triggerMockFestivalOffer,
  unsubscribeFestivalOffers,
} from '@/services/notifications';

const id = `notif-toggle-${Math.random().toString(36).slice(2, 8)}`;
const state = ref(getNotificationsUIState());
const isOn = ref<boolean>(getFestivalOffersPreference());
const toastMsg = ref<string>('');

const canInteract = computed(() => canToggleForState(state.value.state));
const helpText = computed(() => state.value.helpText);
const showBlockedHelp = computed(() => state.value.state === 'blocked');
const mockMode = computed(() => isMockMode());

async function refresh() {
  state.value = getNotificationsUIState();
  isOn.value = getFestivalOffersPreference();
}

async function onToggle() {
  if (!canInteract.value) return;
  // If currently off and state is prompt, request permission first
  if (!isOn.value && state.value.state === 'prompt') {
    const after = await requestFestivalOffersPermission();
    await refresh();
    if (after !== 'granted') {
      // Do not enable if not granted
      return;
    }
  }

  // Toggle preference
  const next = !isOn.value;
  setFestivalOffersPreference(next);
  isOn.value = next;

  if (!next) {
    // If turning off, unsubscribe placeholder
    try {
      await unsubscribeFestivalOffers();
    } catch {
      // ignore
    }
  }
}

function simulate() {
  triggerMockFestivalOffer((msg) => {
    toastMsg.value = msg;
    setTimeout(() => (toastMsg.value = ''), 3000);
  });
}

onMounted(async () => {
  await refresh();
});
</script>

<style scoped>
.notif-toggle {
  display: grid;
  gap: 0.25rem;
  align-items: center;
  max-width: 420px;
  color: #111827;
  font-size: 0.95rem;
}
.label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.label-text {
  font-weight: 600;
  color: #111827;
}
.toggle {
  position: relative;
  width: 48px;
  height: 28px;
  border-radius: 9999px;
  border: none;
  cursor: pointer;
  outline: none;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
  background: #e5e7eb; /* gray-200 */
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05);
}
.toggle.on {
  background: #2563EB; /* Ocean Professional primary */
}
.toggle.off {
  background: #e5e7eb;
}
.toggle:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  background: #ffffff;
  border-radius: 9999px;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.12);
}
.toggle.on .knob {
  transform: translateX(20px);
}
.status {
  font-size: 0.85rem;
  color: #374151;
}
.blocked-help {
  font-size: 0.8rem;
  color: #EF4444; /* error */
}
.mock-btn {
  align-self: start;
  width: fit-content;
  padding: 0.4rem 0.7rem;
  font-size: 0.85rem;
  background: linear-gradient(90deg, rgba(37,99,235,0.1), #f9fafb);
  color: #2563EB;
  border: 1px solid #93c5fd;
  border-radius: 8px;
  transition: all 0.2s ease;
}
.mock-btn:hover {
  background: #f0f8ff;
}
.toast {
  margin-top: 0.25rem;
  background: #ffffff;
  border-left: 4px solid #F59E0B; /* secondary accent */
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.06);
}
.sr-only {
  position: absolute !important;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0);
  white-space: nowrap; border: 0;
}
</style>
