<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { getAvailableMethods } from '@/services/payments'

type Method = 'upi' | 'card' | 'cod'

const emit = defineEmits<{
  (e: 'update:modelValue', value: Method): void
}>()
const props = defineProps<{
  modelValue: Method
}>()

const available = getAvailableMethods()
const selected = ref<Method>(props.modelValue || (available.card ? 'card' : available.upi ? 'upi' : 'cod'))

watch(() => props.modelValue, (v) => { if (v) selected.value = v as Method })
watch(selected, (v) => emit('update:modelValue', v))

const options = computed(() => [
  { key: 'upi', title: 'UPI / Wallet', desc: 'Google Pay, PhonePe, etc.', enabled: available.upi },
  { key: 'card', title: 'Card', desc: 'Debit / Credit (mock tokenize)', enabled: available.card },
  { key: 'cod', title: 'Cash on Delivery', desc: 'Pay when delivered', enabled: available.cod },
] as { key: Method; title: string; desc: string; enabled: boolean }[])
</script>

<template>
  <div class="selector" role="radiogroup" aria-label="Payment methods">
    <button
      v-for="opt in options"
      :key="opt.key"
      class="opt"
      :class="{ active: selected === opt.key, disabled: !opt.enabled }"
      role="radio"
      :aria-checked="selected === opt.key"
      :aria-disabled="!opt.enabled"
      :disabled="!opt.enabled"
      @click="selected = opt.key"
    >
      <div class="title">{{ opt.title }}</div>
      <div class="desc">{{ opt.desc }}</div>
    </button>
  </div>
</template>

<style scoped>
.selector {
  display: grid;
  gap: .6rem;
}
.opt {
  text-align: left;
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 12px;
  padding: .7rem .9rem;
  cursor: pointer;
  transition: box-shadow .2s ease, border-color .2s ease, transform .05s ease;
}
.opt:hover { transform: translateY(-1px); }
.opt.active {
  border-color: var(--primary);
  box-shadow: 0 6px 18px rgba(37,99,235,.18);
  background: linear-gradient(180deg, rgba(37,99,235,.06), #fff);
}
.opt.disabled {
  opacity: .6;
  cursor: not-allowed;
}
.title { font-weight: 700; color: var(--text); }
.desc { color: #4b5563; font-size: .92rem; }
</style>
