<template>
  <main class="restaurant-menu">
    <header class="hero">
      <h1>Restaurant {{ restaurantId }}</h1>
      <button class="chat-btn" @click="chatSupport">Chat with restaurant support</button>
    </header>
    <section class="links">
      <RouterLink to="/restaurants">Back to Restaurants</RouterLink>
      <RouterLink to="/chat">Open Messages</RouterLink>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useChatsStore } from '@/stores/chats';

const route = useRoute();
const router = useRouter();
const chats = useChatsStore();
const restaurantId = ref<string | undefined>(route.params.id as string | undefined);

onMounted(() => {
  restaurantId.value = route.params.id as string | undefined;
});

async function chatSupport() {
  await chats.openThread('support', { restaurantId: restaurantId.value });
  router.push({ name: 'chat' });
}
</script>

<style scoped>
.restaurant-menu { padding: 16px; }
.hero {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
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
