<template>
  <div class="window">
    <div class="header">
      <div class="title">
        <h3>{{ headerTitle }}</h3>
        <small class="sub">{{ subTitle }}</small>
      </div>
      <div class="status" v-if="status">
        <span class="pill" :data-transport="status.transport">{{ status.transport }}</span>
      </div>
    </div>

    <div class="messages" ref="listEl">
      <template v-for="(group, gi) in grouped" :key="gi">
        <div class="day-sep">{{ group.day }}</div>
        <div v-for="m in group.items" :key="m.id" class="row" :class="m.senderRole === 'user' ? 'me' : 'them'">
          <div class="bubble">
            <div class="content">{{ m.content }}</div>
            <div class="meta">
              <span class="time">{{ time(m.createdAt) }}</span>
              <span class="tick" :data-status="m.status || 'sent'">✓</span>
            </div>
          </div>
        </div>
      </template>
      <div class="typing-wrap" v-if="showTyping"><TypingIndicator :show="true" /></div>
    </div>

    <MessageComposer @send="onSend" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import TypingIndicator from './TypingIndicator.vue';
import MessageComposer from './MessageComposer.vue';
import type { ChatMessage, ChatThread } from '@/types/chat';

const props = defineProps<{ thread: ChatThread | null; messages: ChatMessage[]; typing?: boolean; status?: { connected: boolean, transport: string } | null }>();
const emit = defineEmits<{ (e: 'send', content: string): void }>();

const listEl = ref<HTMLDivElement | null>(null);

const headerTitle = computed(() => {
  if (!props.thread) return 'Chat';
  if (props.thread.type === 'delivery') return `Delivery - Order ${props.thread.orderId || ''}`;
  return props.thread.restaurantId ? `Support - ${props.thread.restaurantId}` : 'Support';
});
const subTitle = computed(() => props.status?.connected ? 'Connected' : 'Connecting…');

const grouped = computed(() => {
  const map: { day: string; items: ChatMessage[] }[] = [];
  let currentDay = '';
  for (const m of props.messages) {
    const day = new Date(m.createdAt).toLocaleDateString();
    if (day !== currentDay) {
      currentDay = day;
      map.push({ day, items: [] });
    }
    map[map.length - 1].items.push(m);
  }
  return map;
});

const showTyping = computed(() => !!props.typing);

function time(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function onSend(content: string) {
  emit('send', content);
}

function scrollToBottom() {
  nextTick(() => {
    const el = listEl.value;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  });
}

onMounted(() => scrollToBottom());
watch(() => props.messages.length, () => scrollToBottom());
</script>

<style scoped>
.window {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100%;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}
.header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(90deg, rgba(37,99,235,.05), rgba(249,250,251,1));
  border-bottom: 1px solid #e5e7eb;
}
.title h3 { margin: 0; line-height: 1.2; }
.sub { color: #6b7280; }
.pill {
  border: 1px solid #e5e7eb;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  color: #111827;
  background: #f3f4f6;
}
.pill[data-transport="websocket"] { background: #dbeafe; border-color: #93c5fd; }
.pill[data-transport="polling"] { background: #fef3c7; border-color: #f59e0b; }
.pill[data-transport="mock"] { background: #f3f4f6; }
.messages {
  padding: 12px;
  overflow: auto;
  background: #f9fafb;
}
.day-sep {
  text-align: center;
  color: #6b7280;
  font-size: 12px;
  margin: 8px 0;
}
.row { display: flex; margin: 6px 0; }
.row.me { justify-content: flex-end; }
.row.them { justify-content: flex-start; }
.bubble {
  max-width: 70%;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 8px 10px;
  box-shadow: 0 1px 2px rgba(0,0,0,.03);
}
.row.me .bubble {
  background: #2563EB;
  color: white;
  border-color: #1e4fd6;
}
.content { white-space: pre-wrap; word-break: break-word; }
.meta {
  display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px;
  font-size: 11px; opacity: .8;
}
.tick[data-status="sent"]::after { content: ' ✓'; }
.tick[data-status="delivered"]::after { content: ' ✓✓'; }
.tick[data-status="read"]::after { content: ' ✓✓'; color: #60a5fa; }
.typing-wrap { margin-top: 8px; }
</style>
