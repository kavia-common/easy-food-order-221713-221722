<template>
  <div class="inbox-container">
    <div class="inbox-header">
      <h2>Messages</h2>
      <div class="filters">
        <button :class="['tab', filter === 'all' && 'active']" @click="setFilter('all')">All</button>
        <button :class="['tab', filter === 'delivery' && 'active']" @click="setFilter('delivery')">Delivery</button>
        <button :class="['tab', filter === 'support' && 'active']" @click="setFilter('support')">Support</button>
      </div>
    </div>
    <div v-if="loading" class="skeleton-list">
      <div class="skeleton-item" v-for="n in 4" :key="n" />
    </div>
    <div v-else-if="filteredThreads.length === 0" class="empty">
      <p>No chats yet.</p>
    </div>
    <ul v-else class="thread-list">
      <li v-for="t in filteredThreads" :key="t.id" class="thread" @click="$emit('select', t.id)">
        <div class="title">
          <span class="name">{{ threadTitle(t) }}</span>
          <span class="time">{{ shortTime(t.updatedAt) }}</span>
        </div>
        <div class="snippet">
          <span class="last">{{ t.latestMessage?.content || 'No messages yet' }}</span>
          <span v-if="t.unreadCount" class="badge">{{ t.unreadCount }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useChatsStore } from '@/stores/chats';
import type { ChatThread } from '@/types/chat';

const props = defineProps<{ initialFilter?: 'all' | 'delivery' | 'support' }>();
defineEmits<{ (e: 'select', threadId: string): void }>();

const chats = useChatsStore();
const loading = ref(true);
const filter = ref<'all' | 'delivery' | 'support'>(props.initialFilter || 'all');

onMounted(async () => {
  await chats.loadThreads();
  loading.value = false;
});

const filteredThreads = computed(() => {
  if (filter.value === 'all') return chats.threads;
  return chats.threads.filter((t) => t.type === filter.value);
});

function setFilter(v: 'all' | 'delivery' | 'support') {
  filter.value = v;
}

function threadTitle(t: ChatThread) {
  if (t.type === 'delivery') {
    return `Delivery - Order ${t.orderId || ''}`;
  }
  return t.restaurantId ? `Support - ${t.restaurantId}` : 'Support';
}

function shortTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}
</script>

<style scoped>
.inbox-container {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,.05);
  padding: 12px;
}
.inbox-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.filters {
  display: flex;
  gap: 8px;
}
.tab {
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #111827;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
}
.tab.active {
  background: #2563EB;
  border-color: #2563EB;
  color: white;
}
.skeleton-list {
  display: grid;
  gap: 8px;
}
.skeleton-item {
  height: 56px;
  border-radius: 10px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 400% 100%;
  animation: pulse 1.4s ease infinite;
}
@keyframes pulse {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}
.empty {
  text-align: center;
  color: #6b7280;
  padding: 24px 0;
}
.thread-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.thread {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  transition: border-color .2s, box-shadow .2s;
}
.thread:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(37,99,235,.06);
}
.title {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}
.name { font-weight: 600; color: #111827; }
.time { color: #6b7280; font-size: 12px; }
.snippet {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #374151;
}
.badge {
  background: #F59E0B;
  color: #111827;
  border-radius: 999px;
  padding: 2px 8px;
  font-weight: 700;
  font-size: 12px;
}
</style>
