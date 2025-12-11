<template>
  <div class="composer">
    <textarea
      v-model="draft"
      class="input"
      rows="2"
      placeholder="Type a message…"
      @keydown.enter.exact.prevent="submit"
      @keydown.enter.shift.exact.stop
    />
    <button class="send" :disabled="!canSend" @click="submit" title="Send">
      Send
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const emit = defineEmits<{ (e: 'send', content: string): void }>();
const draft = ref('');

const canSend = computed(() => draft.value.trim().length > 0);

function submit() {
  const content = draft.value.trim();
  if (!content) return;
  emit('send', content);
  draft.value = '';
}
</script>

<style scoped>
.composer {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  padding: 8px;
  border-top: 1px solid #e5e7eb;
  background: #fafbfc;
}
.input {
  width: 100%;
  resize: none;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px;
  outline: none;
  font-size: 14px;
}
.input:focus {
  border-color: #2563EB;
  box-shadow: 0 0 0 3px rgba(37,99,235,.1);
}
.send {
  background: #2563EB;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background .2s;
}
.send:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}
.send:hover:not(:disabled) { background: #1e4fd6; }
</style>
