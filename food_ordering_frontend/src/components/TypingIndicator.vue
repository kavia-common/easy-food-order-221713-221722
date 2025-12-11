<template>
  <div v-if="show" class="typing">
    <span class="dot" />
    <span class="dot" />
    <span class="dot" />
  </div>
</template>

<script setup lang="ts">
defineProps<{ show: boolean }>();
</script>

<style scoped>
.typing {
  display: inline-flex;
  gap: 4px;
  padding: 6px 10px;
  background: #f3f4f6;
  border-radius: 12px;
  align-items: center;
}
.dot {
  width: 6px; height: 6px; background: #9ca3af; border-radius: 50%;
  animation: bounce 1.2s infinite ease-in-out;
}
.dot:nth-child(2) { animation-delay: .2s; }
.dot:nth-child(3) { animation-delay: .4s; }
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.8); opacity: .6; }
  40% { transform: scale(1); opacity: 1; }
}
</style>
