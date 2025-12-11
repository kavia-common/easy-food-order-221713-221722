<template>
  <div class="chat-page">
    <div class="left">
      <ChatInbox @select="onSelect" />
    </div>
    <div class="right">
      <div v-if="!currentThread" class="empty">
        <p>Select a chat to start messaging.</p>
      </div>
      <ChatWindow
        v-else
        :thread="currentThread"
        :messages="currentMessages"
        :typing="anyTyping"
        :status="statusOf(currentThread.id)"
        @send="onSend"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import ChatInbox from '@/components/ChatInbox.vue';
import ChatWindow from '@/components/ChatWindow.vue';
import { useChatsStore } from '@/stores/chats';

const chats = useChatsStore();

onMounted(async () => {
  await chats.loadThreads();
});

const currentThread = computed(() => chats.currentThread);
const currentMessages = computed(() => chats.currentMessages);

function onSelect(threadId: string) {
  chats.selectThread(threadId);
}

function onSend(content: string) {
  chats.send(content);
}

const anyTyping = computed(() => {
  const id = chats.currentThreadId;
  if (!id) return false;
  const map = chats.typingByThread[id];
  if (!map) return false;
  return Object.values(map).some(Boolean);
});

function statusOf(threadId: string) {
  return chats.connectionStatusByThread[threadId] || null;
}
</script>

<style scoped>
.chat-page {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  min-height: calc(100vh - 140px);
}
.left { min-width: 0; }
.right {
  min-width: 0;
  height: calc(100vh - 140px);
}
.empty {
  display: grid;
  place-items: center;
  height: 100%;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  color: #6b7280;
}
@media (max-width: 900px) {
  .chat-page {
    grid-template-columns: 1fr;
  }
  .right { height: auto; min-height: 60vh; }
}
</style>
