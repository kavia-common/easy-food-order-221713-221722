<script setup lang="ts">
const props = withDefaults(defineProps<{ modelValue: number; min?: number; max?: number }>(), {
  min: 0,
  max: 99,
})
const emit = defineEmits<{
  (e: 'update:modelValue', v: number): void
}>()
function dec() {
  const v = Math.max(props.min, props.modelValue - 1)
  emit('update:modelValue', v)
}
function inc() {
  const v = Math.min(props.max, props.modelValue + 1)
  emit('update:modelValue', v)
}
</script>

<template>
  <div class="stepper">
    <button @click="dec" aria-label="Decrease">−</button>
    <span class="qty">{{ modelValue }}</span>
    <button @click="inc" aria-label="Increase">+</button>
  </div>
</template>

<style scoped>
.stepper {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: .2rem .4rem;
  background: var(--surface);
}
button {
  background: transparent;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
}
button:hover { background: #f3f4f6; }
.qty { min-width: 16px; text-align: center; font-weight: 600; }
</style>
