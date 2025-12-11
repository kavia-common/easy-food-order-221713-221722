<template>
  <div class="rating-stars" :class="{ readonly }">
    <label v-if="label" class="sr-only">{{ label }}</label>
    <div
      class="stars-container"
      role="radiogroup"
      :aria-label="label || 'Star rating'"
      @mouseleave="onMouseLeave"
    >
      <button
        v-for="i in 5"
        :key="i"
        class="star-btn"
        :class="{ active: i <= hoverValue || (!hoverValue && i <= modelValue) }"
        :aria-checked="i === modelValue"
        role="radio"
        :tabindex="readonly ? -1 : i === focusIndex ? 0 : -1"
        :disabled="readonly || disabled"
        @click="onClick(i)"
        @keydown="onKeydown($event, i)"
        @mouseenter="onMouseEnter(i)"
      >
        <span class="sr-only">{{ i }} star</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          :fill="i <= hoverValue || (!hoverValue && i <= modelValue) ? '#F59E0B' : 'none'"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          :stroke="i <= hoverValue || (!hoverValue && i <= modelValue) ? '#F59E0B' : '#9CA3AF'"
          class="star-icon"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.07 4.2a.563.563 0 00.424.308l4.636.674c.499.073.699.686.337 1.037l-3.354 3.27a.563.563 0 00-.162.498l.792 4.616a.562.562 0 01-.815.592L12.53 16.88a.563.563 0 00-.522 0l-4.147 2.18a.562.562 0 01-.815-.592l.792-4.616a.563.563 0 00-.162-.498l-3.354-3.27a.563.563 0 01.337-1.037l4.636-.674a.563.563 0 00.424-.308l2.07-4.2z" />
        </svg>
      </button>
    </div>
    <div v-if="help" class="help-text">{{ help }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  modelValue: number;
  label?: string;
  help?: string;
  readonly?: boolean;
  disabled?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'update:modelValue', value: number): void }>();

const hoverValue = ref(0);
const focusIndex = ref(1);

watch(
  () => props.modelValue,
  (v) => {
    if (v && v >= 1 && v <= 5) {
      focusIndex.value = v;
    }
  },
  { immediate: true }
);

function onClick(val: number) {
  if (props.readonly || props.disabled) return;
  emit('update:modelValue', val as 1 | 2 | 3 | 4 | 5);
}
function onMouseEnter(val: number) {
  if (props.readonly || props.disabled) return;
  hoverValue.value = val;
}
function onMouseLeave() {
  hoverValue.value = 0;
}
function onKeydown(e: KeyboardEvent, i: number) {
  if (props.readonly || props.disabled) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
    e.preventDefault();
    const next = Math.min(5, i + 1);
    focusIndex.value = next;
    emit('update:modelValue', next);
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
    e.preventDefault();
    const prev = Math.max(1, i - 1);
    focusIndex.value = prev;
    emit('update:modelValue', prev);
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    emit('update:modelValue', i);
  }
}
</script>

<style scoped>
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
.rating-stars {
  display: inline-flex;
  flex-direction: column;
  gap: 0.25rem;
}
.stars-container {
  display: inline-flex;
  gap: 0.25rem;
  align-items: center;
}
.star-btn {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform .08s ease, box-shadow .15s ease, border-color .15s ease;
  box-shadow: 0 1px 1px rgba(0,0,0,0.04);
}
.star-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(37,99,235,0.12);
  border-color: #93c5fd;
}
.star-btn.active {
  border-color: #F59E0B;
  box-shadow: 0 3px 8px rgba(245,158,11,0.18);
}
.star-btn:disabled {
  cursor: not-allowed;
  opacity: .6;
}
.star-icon {
  width: 22px;
  height: 22px;
}
.help-text {
  font-size: 0.875rem;
  color: #6b7280;
}
.readonly .star-btn {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
  cursor: default;
}
</style>
