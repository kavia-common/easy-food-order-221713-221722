<template>
  <header class="app-header">
    <div class="wrapper">
      <nav class="nav">
        <RouterLink class="nav-link" to="/">Home</RouterLink>
        <RouterLink class="nav-link" to="/about">About</RouterLink>
        <RouterLink class="nav-link" to="/orders">Orders</RouterLink>
        <RouterLink class="nav-link" to="/analytics">Analytics</RouterLink>

        <div class="spacer" aria-hidden="true"></div>

        <RouterLink class="nav-link" to="/notifications" aria-label="Notifications Settings">
          Notifications
        </RouterLink>

        <VoiceSearchButton />

        <button class="chat-link" @click="goChat">
          Chat
          <span v-if="unread" class="badge">{{ unread }}</span>
        </button>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useChatsStore } from '@/stores/chats';
import VoiceSearchButton from '@/components/VoiceSearchButton.vue';

const router = useRouter();
const chats = useChatsStore();
const unread = computed(() => chats.totalUnread);

function goChat() {
  router.push({ name: 'chat' });
}
</script>

<style scoped>
.app-header {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}
.wrapper {
  max-width: 1100px;
  margin: 0 auto;
  padding: 10px 16px;
}
.nav {
  display: flex;
  align-items: center;
  gap: 12px;
}
.spacer { flex: 1 1 auto; }
.nav-link {
  padding: 6px 10px;
  border-radius: 8px;
  color: #111827;
  text-decoration: none;
}
.nav-link.router-link-active {
  background: rgba(37,99,235,.1);
  color: #1e4fd6;
}
.chat-link {
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 6px 12px;
  cursor: pointer;
}
.badge {
  background: #F59E0B;
  color: #111827;
  border-radius: 999px;
  padding: 2px 8px;
  font-weight: 700;
  font-size: 12px;
  margin-left: 6px;
}
</style>
