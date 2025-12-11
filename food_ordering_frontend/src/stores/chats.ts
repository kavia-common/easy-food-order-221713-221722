import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { ChatMessage, ChatThread, ThreadType } from '@/types/chat';
import { getOrCreateThread, listThreads, fetchMessages, sendMessage, subscribeToThread } from '@/services/chatApi';

interface SubscriptionMap {
  [threadId: string]: { unsubscribe: () => void } | undefined;
}

const PERSIST_KEY = 'chat_store_state_v1';

function persistDebounced(state: unknown) {
  const self = persistDebounced as unknown as { _t?: ReturnType<typeof setTimeout> }
  if (self._t) clearTimeout(self._t);
  self._t = setTimeout(() => {
    try {
      localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, 400);
}

export const useChatsStore = defineStore('chats', () => {
  const threads = ref<ChatThread[]>([]);
  const messagesByThread = ref<Record<string, ChatMessage[]>>({});
  const typingByThread = ref<Record<string, Record<string, boolean>>>({});
  const connectionStatusByThread = ref<Record<string, { connected: boolean; transport: string }>>({});
  const currentThreadId = ref<string | null>(null);
  const subs: SubscriptionMap = {};

  const totalUnread = computed(() => threads.value.reduce((acc, t) => acc + (t.unreadCount || 0), 0));
  const currentThread = computed(() => threads.value.find((t) => t.id === currentThreadId.value) || null);
  const currentMessages = computed(() => (currentThreadId.value ? (messagesByThread.value[currentThreadId.value] || []) : []));

  async function loadThreads(orderId?: string) {
    const list = await listThreads(orderId);
    // sort by updated desc
    threads.value = list.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    persistDebounced({ threads: threads.value, messagesByThread: messagesByThread.value });
  }

  async function openThread(type: ThreadType, ctx?: { orderId?: string; restaurantId?: string }) {
    const th = await getOrCreateThread({ type, orderId: ctx?.orderId, restaurantId: ctx?.restaurantId });
    if (!threads.value.find((t) => t.id === th.id)) {
      threads.value.unshift(th);
    }
    currentThreadId.value = th.id;
    if (!messagesByThread.value[th.id]) {
      messagesByThread.value[th.id] = await fetchMessages(th.id);
    }
    subscribe(th.id);
    markRead(th.id);
    persistDebounced({ threads: threads.value, messagesByThread: messagesByThread.value });
  }

  async function send(content: string) {
    if (!currentThreadId.value) return;
    const msg = await sendMessage(currentThreadId.value, { content });
    messagesByThread.value[currentThreadId.value] = (messagesByThread.value[currentThreadId.value] || []).concat(msg as ChatMessage);
    const t = threads.value.find((x) => x.id === currentThreadId.value);
    if (t) {
      t.latestMessage = msg;
      t.updatedAt = msg.createdAt;
    }
    markRead(currentThreadId.value);
    persistDebounced({ threads: threads.value, messagesByThread: messagesByThread.value });
  }

  function markRead(threadId: string) {
    const t = threads.value.find((x) => x.id === threadId);
    if (t) {
      t.unreadCount = 0;
    }
  }

  function subscribe(threadId: string) {
    if (subs[threadId]) return;
    const handle = subscribeToThread(threadId, (ev: { type: 'message'|'typing'|'presence'; message?: ChatMessage; participantId?: string; isTyping?: boolean }) => {
      if (ev.type === 'message') {
        messagesByThread.value[threadId] = (messagesByThread.value[threadId] || []).concat(ev.message);
        const t = threads.value.find((x) => x.id === threadId);
        if (t) {
          t.latestMessage = ev.message;
          t.updatedAt = ev.message.createdAt;
          if (currentThreadId.value !== threadId) {
            t.unreadCount = (t.unreadCount || 0) + 1;
          }
        }
      } else if (ev.type === 'typing') {
        typingByThread.value[threadId] = typingByThread.value[threadId] || {};
        typingByThread.value[threadId][ev.participantId] = ev.isTyping;
      } else if (ev.type === 'presence') {
        // presence updates could be handled in UI when needed
      }
    });
    connectionStatusByThread.value[threadId] = {
      connected: handle.status.connected,
      transport: handle.status.transport,
    };
    subs[threadId] = handle;
  }

  function selectThread(threadId: string) {
    currentThreadId.value = threadId;
    subscribe(threadId);
    markRead(threadId);
  }

  return {
    threads,
    currentThreadId,
    currentThread,
    currentMessages,
    totalUnread,
    typingByThread,
    connectionStatusByThread,
    messagesByThread,
    loadThreads,
    openThread,
    send,
    markRead,
    selectThread,
  };
});
