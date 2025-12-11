<script setup lang="ts">
const props = defineProps<{
  options: string[]
  modelValue: string[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string[]): void
}>()

function toggle(val: string) {
  const set = new Set(props.modelValue)
  if (set.has(val)) set.delete(val)
  else set.add(val)
  emit('update:modelValue', Array.from(set))
}

function clearAll() {
  emit('update:modelValue', [])
}
</script>

<template>
  <div class="wrap" role="group" aria-label="Filter by cuisine">
    <button
      class="chip reset"
      :class="{ active: modelValue.length === 0 }"
      @click="clearAll"
      :aria-pressed="modelValue.length === 0"
    >
      All
    </button>
    <button
      v-for="c in options"
      :key="c"
      class="chip"
      :class="{ active: modelValue.includes(c) }"
      @click="toggle(c)"
      :aria-pressed="modelValue.includes(c)"
      :aria-label="`Filter by ${c}`"
    >
      {{ c }}
    </button>
  </div>
</template>

<style scoped>
.wrap {
  display: flex;
  flex-wrap: wrap;
  gap: .5rem;
  padding: .25rem 0 .75rem;
}
.chip {
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 999px;
  padding: .4rem .8rem;
  cursor: pointer;
  transition: all .2s ease;
}
.chip.active {
  border-color: var(--primary);
  color: var(--primary);
  box-shadow: 0 2px 8px rgba(37,99,235,0.2);
}
.chip.reset {
  background: #f9fafb;
}
.chip:hover { transform: translateY(-1px); }
</style>
