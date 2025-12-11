<template>
  <div
    class="star-rating"
    :class="{ readonly }"
    role="slider"
    :aria-label="ariaLabel"
    :aria-valuemin="0"
    :aria-valuemax="5"
    :aria-valuenow="currentValue"
    tabindex="0"
    @keydown="onKeydown"
  >
    <div class="stars" @mouseleave="onMouseLeave">
      <button
        v-for="i in 10"
        :key="i"
        type="button"
        class="star-half"
        :class="halfClass(i)"
        :aria-label="`Rate ${i / 2} stars`"
        :disabled="readonly"
        @mousemove="onHover(i)"
        @focus="onHover(i)"
        @click="onClick(i)"
      >
        <span class="sr-only">{{ i / 2 }}</span>
        <svg viewBox="0 0 24 24" class="icon" aria-hidden="true">
          <path
            d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.402 8.171L12 18.896l-7.336 3.872 1.402-8.171L.132 9.21l8.2-1.192z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
    <div v-if="showValue" class="value ml-2 text-sm text-gray-600">{{ currentValue.toFixed(1) }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue?: number;
    readonly?: boolean;
    showValue?: boolean;
    ariaLabel?: string;
  }>(),
  {
    modelValue: 0,
    readonly: false,
    showValue: false,
    ariaLabel: 'Star rating',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
  (e: 'change', value: number): void;
}>();

const hoverIndex = ref<number | null>(null);
const internal = ref<number>(props.modelValue);

watch(
  () => props.modelValue,
  (v) => {
    internal.value = v;
  },
);

const currentValue = computed(() => {
  if (props.readonly) return props.modelValue || 0;
  if (hoverIndex.value != null) return hoverIndex.value / 2;
  return internal.value || 0;
});

function onHover(i: number) {
  if (props.readonly) return;
  hoverIndex.value = i;
}
function onMouseLeave() {
  if (props.readonly) return;
  hoverIndex.value = null;
}
function onClick(i: number) {
  if (props.readonly) return;
  const val = i / 2;
  internal.value = val;
  emit('update:modelValue', val);
  emit('change', val);
}
function onKeydown(e: KeyboardEvent) {
  if (props.readonly) return;
  let delta = 0;
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') delta = 0.5;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') delta = -0.5;
  if (delta !== 0) {
    e.preventDefault();
    const next = Math.max(0, Math.min(5, (internal.value || 0) + delta));
    internal.value = next;
    emit('update:modelValue', next);
    emit('change', next);
  }
}
function halfClass(i: number) {
  const val = currentValue.value;
  const threshold = i / 2;
  return {
    filled: val >= threshold,
    partial: Math.ceil(val) === threshold && val % 1 !== 0,
  };
}
</script>

<style scoped>
.star-rating {
  display: inline-flex;
  align-items: center;
  outline: none;
}
.star-rating.readonly {
  pointer-events: none;
}
.stars {
  display: inline-flex;
}
.star-half {
  position: relative;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  background: transparent;
  color: #e5e7eb; /* gray-200 */
  cursor: pointer;
  transition: transform 0.05s ease;
}
.star-half:focus-visible {
  outline: 2px solid #2563EB; /* primary */
  outline-offset: 2px;
  border-radius: 4px;
}
.star-half .icon {
  width: 100%;
  height: 100%;
}
.star-half.filled {
  color: #F59E0B; /* secondary (amber) */
  text-shadow: 0 1px 2px rgba(0,0,0,0.08);
}
.star-half:hover {
  transform: scale(1.05);
}
.value {
  color: #374151;
}
</style>
