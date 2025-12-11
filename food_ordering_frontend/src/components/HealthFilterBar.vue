<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { HealthFilter } from '@/types'

type Model = {
  healthFilters: HealthFilter[]
  maxCalories?: number | null
}

const props = withDefaults(defineProps<{
  modelValue?: Model
  disabled?: boolean
}>(), { disabled: false })

const emit = defineEmits<{
  (e: 'update:modelValue', v: Model): void
  (e: 'change', v: Model): void
}>()

const local = ref<Model>({
  healthFilters: props.modelValue?.healthFilters ?? [],
  maxCalories: props.modelValue?.maxCalories ?? null
})

watch(() => props.modelValue, (v) => {
  if (!v) return
  local.value = { healthFilters: v.healthFilters ?? [], maxCalories: v.maxCalories ?? null }
}, { deep: true })

const options: { key: HealthFilter; label: string }[] = [
  { key: 'low_calorie', label: 'Low calorie' },
  { key: 'keto', label: 'Keto' },
  { key: 'high_protein', label: 'High protein' },
  { key: 'low_carb', label: 'Low carb' },
]

function toggle(key: HealthFilter) {
  if (props.disabled) return
  const set = new Set(local.value.healthFilters)
  if (set.has(key)) set.delete(key)
  else set.add(key)
  local.value = { ...local.value, healthFilters: Array.from(set) }
  emit('update:modelValue', local.value)
  debouncedNotify()
}

function onMaxCaloriesInput(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  local.value = { ...local.value, maxCalories: Number.isFinite(val) ? val : null }
  emit('update:modelValue', local.value)
  debouncedNotify()
}

// simple debounce without external deps; SSR-safe
let t: number | undefined
function debouncedNotify() {
  if (typeof window !== 'undefined') {
    if (t) window.clearTimeout(t)
    t = window.setTimeout(() => emit('change', local.value), 250)
  } else {
    // SSR: emit immediately
    emit('change', local.value)
  }
}

const anyActive = computed(() => (local.value.healthFilters.length > 0) || !!local.value.maxCalories)
</script>

<template>
  <div class="bar" :class="{ disabled }" role="group" aria-label="Health filters">
    <div class="chips">
      <button
        v-for="opt in options"
        :key="opt.key"
        class="chip"
        :class="{ active: local.healthFilters.includes(opt.key) }"
        :aria-pressed="local.healthFilters.includes(opt.key)"
        :disabled="disabled"
        @click="toggle(opt.key)"
      >
        {{ opt.label }}
      </button>
    </div>
    <div class="calories">
      <label>
        <span>Max calories</span>
        <input
          type="number"
          min="0"
          step="10"
          :disabled="disabled"
          :value="local.maxCalories ?? ''"
          @input="onMaxCaloriesInput"
          placeholder="e.g. 500"
          aria-label="Max calories"
        />
      </label>
    </div>
    <div v-if="anyActive" class="hint">Filters active</div>
  </div>
</template>

<style scoped>
.bar {
  display: flex;
  flex-wrap: wrap;
  gap: .5rem .75rem;
  align-items: center;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: .5rem .6rem;
}
.bar.disabled { opacity: .6; }
.chips { display: flex; gap: .4rem; flex-wrap: wrap; }
.chip {
  border: 1px solid var(--border);
  background: #F3F4F6;
  color: #374151;
  padding: .35rem .6rem;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 600;
}
.chip.active {
  background: #DBEAFE;
  color: #1E3A8A;
  border-color: #93C5FD;
}
.calories label { display: flex; align-items: center; gap: .4rem; }
.calories span { color: #374151; font-size: .9rem; }
input {
  width: 120px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: .35rem .5rem;
  background: var(--surface);
  outline: none;
}
input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(37,99,235,0.12); }
.hint { margin-left: auto; font-size: .85rem; color: #2563EB; font-weight: 600; }
</style>
