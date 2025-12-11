<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue'

/**
 * Accessible, themed search input with debounced update and clear button.
 * Emits 'update:modelValue' as the user types, with optional debounce.
 * Shows a loading spinner when 'loading' prop is true.
 */
const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  ariaLabel?: string
  debounceMs?: number
  loading?: boolean
}>(), {
  placeholder: 'Search menu items by name or category…',
  ariaLabel: 'Search menu items',
  debounceMs: 300,
  loading: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'clear'): void
}>()

const value = ref(props.modelValue)
let to: number | undefined

watch(() => props.modelValue, (v) => {
  if (v !== value.value) value.value = v
})

function flushEmit(next: string) {
  emit('update:modelValue', next)
}

function onInput(ev: Event) {
  const target = ev.target as HTMLInputElement
  value.value = target.value
  if (to) window.clearTimeout(to)
  if (props.debounceMs && props.debounceMs > 0) {
    to = window.setTimeout(() => flushEmit(value.value), props.debounceMs)
  } else {
    flushEmit(value.value)
  }
}

function onClear() {
  if (to) window.clearTimeout(to)
  value.value = ''
  flushEmit('')
  emit('clear')
}

onBeforeUnmount(() => {
  if (to) window.clearTimeout(to)
})

const showClear = computed(() => value.value && value.value.length > 0)
</script>

<template>
  <div class="searchbar" role="search">
    <div class="field">
      <span class="icon" aria-hidden="true">🔎</span>
      <input
        :value="value"
        :placeholder="placeholder"
        class="input"
        type="search"
        :aria-label="ariaLabel"
        autocomplete="off"
        @input="onInput"
      />
      <button
        v-if="showClear"
        class="clear"
        type="button"
        @click="onClear"
        aria-label="Clear search"
        title="Clear search"
      >
        ✕
      </button>
      <span v-if="loading" class="spinner" role="status" aria-live="polite" aria-label="Loading"></span>
    </div>
  </div>
</template>

<style scoped>
.searchbar {
  width: 100%;
}
.field {
  position: relative;
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 6px 10px 6px 36px;
  box-shadow: 0 4px 12px rgba(17, 24, 39, 0.04);
}
.icon {
  position: absolute;
  left: 10px;
  color: #6b7280;
}
.input {
  flex: 1 1 auto;
  border: none;
  outline: none;
  font-size: 14px;
  color: #111827;
  background: transparent;
}
.clear {
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #111827;
  border-radius: 999px;
  width: 28px;
  height: 28px;
  cursor: pointer;
  margin-left: 6px;
}
.clear:hover {
  background: rgba(245, 158, 11, 0.12);
  border-color: #F59E0B;
}
.spinner {
  margin-left: 8px;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(37, 99, 235, 0.2);
  border-top-color: #2563EB;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
