<template>
  <main class="order-detail">
    <header class="hero">
      <h1>Order {{ orderId }}</h1>
      <button class="chat-btn" @click="chatDelivery">Chat with delivery</button>
    </header>
    <section class="links">
      <RouterLink to="/orders">Back to Orders</RouterLink>
      <RouterLink to="/chat">Open Messages</RouterLink>
    </section>
  </main>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { useChatsStore } from '@/stores/chats';
import { onMounted, ref } from 'vue';

const route = useRoute();
const router = useRouter();
const chats = useChatsStore();
const orderId = ref<string | undefined>(route.params.id as string | undefined);

onMounted(() => {
  orderId.value = route.params.id as string | undefined;
});

async function chatDelivery() {
  await chats.openThread('delivery', { orderId: orderId.value });
  router.push({ name: 'chat' });
}
</script>

<style scoped>
.order-detail { padding: 16px; }
.hero {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
}
.chat-btn {
  background: #2563EB;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
}
.chat-btn:hover { background: #1e4fd6; }
.links { display: flex; gap: 12px; }
</style>
