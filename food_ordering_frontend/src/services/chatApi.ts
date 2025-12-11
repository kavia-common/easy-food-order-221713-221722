/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Chat API service
 * - Provides listing, getOrCreate, sendMessage, subscribe with WebSocket or polling fallback
 * - LocalStorage backed mock data when backend is absent
 * - SSR safe guards
 */

import { nanoid } from 'nanoid';
import type {
  ChatMessage,
  ChatThread,
  GetOrCreateThreadInput,
  SubscribeHandle,
  ThreadEvent,
  ConnectionStatus,
  Participant,
} from '@/types/chat';
import { isServer } from './helpersRuntime';

function normalizeBaseUrl(v?: string): string | undefined {
  try {
    if (!v || typeof v !== 'string' || !v.trim()) return undefined;
    // Constructing URL validates basic shape; we allow relative API path like "/api"
    if (v.startsWith('/')) return v;
    const u = new URL(v, 'http://localhost');
    return v;
  } catch {
    return undefined;
  }
}
const WS_ENV = normalizeBaseUrl(import.meta.env.VITE_WS_URL as string | undefined);
const API_BASE = normalizeBaseUrl(import.meta.env.VITE_API_BASE as string | undefined);

const LS_THREADS_KEY = 'mock_chat_threads_v1';
const LS_MESSAGES_KEY = 'mock_chat_messages_v1';
const LS_USER_ID_KEY = 'mock_chat_user_id_v1';

type EventCallback = (ev: ThreadEvent) => void;

type CacheEntry = {
  thread: ChatThread;
  messages: ChatMessage[];
};
const cache = new Map<string, CacheEntry>();

let userIdMemo: string | null = null;

// helpers
function getUserId(): string {
  if (isServer()) return 'server-user';
  if (userIdMemo) return userIdMemo;
  const existing = localStorage.getItem(LS_USER_ID_KEY);
  if (existing) {
    userIdMemo = existing;
    return existing;
  }
  const id = `u_${nanoid(8)}`;
  localStorage.setItem(LS_USER_ID_KEY, id);
  userIdMemo = id;
  return id;
}

function readLS<T>(key: string, fallback: T): T {
  if (isServer()) return fallback;
  try {
    const t = localStorage.getItem(key);
    if (!t) return fallback;
    return JSON.parse(t) as T;
  } catch {
    return fallback;
  }
}
function writeLS<T>(key: string, value: T) {
  if (isServer()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function seedMockIfEmpty() {
  const threads = readLS<ChatThread[]>(LS_THREADS_KEY, []);
  if (threads.length > 0) return;
  const now = new Date();
  const me: Participant = {
    id: getUserId(),
    role: 'user',
    displayName: 'You',
    presence: 'online',
  };

  const deliveryPartner: Participant = {
    id: 'd_123',
    role: 'delivery_partner',
    displayName: 'Alex (DP)',
    presence: 'online',
  };
  const support: Participant = {
    id: 'r_45_support',
    role: 'restaurant_support',
    displayName: 'Ocean Sushi Support',
    presence: 'offline',
  };

  const t1: ChatThread = {
    id: 'th_' + nanoid(6),
    type: 'delivery',
    orderId: 'ord_1001',
    participants: [me, deliveryPartner],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    unreadCount: 1,
  };
  const t2: ChatThread = {
    id: 'th_' + nanoid(6),
    type: 'support',
    restaurantId: 'rest_45',
    participants: [me, support],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    unreadCount: 0,
  };

  const messages: Record<string, ChatMessage[]> = {};
  const m1: ChatMessage = {
    id: 'm_' + nanoid(8),
    threadId: t1.id,
    senderId: deliveryPartner.id,
    senderRole: 'delivery_partner',
    content: 'Hi! I am on the way to your location.',
    createdAt: now.toISOString(),
    status: 'delivered',
  };
  const m2: ChatMessage = {
    id: 'm_' + nanoid(8),
    threadId: t2.id,
    senderId: support.id,
    senderRole: 'restaurant_support',
    content: 'Hello! How can we assist you today?',
    createdAt: now.toISOString(),
    status: 'delivered',
  };
  messages[t1.id] = [m1];
  messages[t2.id] = [m2];

  t1.latestMessage = m1;
  t2.latestMessage = m2;

  writeLS(LS_THREADS_KEY, [t1, t2]);
  writeLS(LS_MESSAGES_KEY, messages);
}

function loadAllMock(): { threads: ChatThread[]; messages: Record<string, ChatMessage[]> } {
  seedMockIfEmpty();
  const threads = readLS<ChatThread[]>(LS_THREADS_KEY, []);
  const messages = readLS<Record<string, ChatMessage[]>>(LS_MESSAGES_KEY, {});
  return { threads, messages };
}

function saveMock(
  threads: ChatThread[],
  messages: Record<string, ChatMessage[]>,
) {
  writeLS(LS_THREADS_KEY, threads);
  writeLS(LS_MESSAGES_KEY, messages);
}

function canUseWS(): boolean {
  return typeof window !== 'undefined' && !!(WS_ENV || API_BASE);
}

function wsUrlForThread(threadId: string): string | null {
  const base = WS_ENV || (API_BASE ? `${API_BASE.replace(/\/+$/, '')}/ws` : '');
  if (!base) return null;
  const url = new URL(base);
  // Assuming endpoint path like /ws/chat?threadId=...
  if (!/\/ws(\/)?$/.test(url.pathname)) {
    url.pathname = (url.pathname.replace(/\/+$/, '') || '') + '/ws';
  }
  url.pathname = url.pathname.replace(/\/+$/, '') + '/chat';
  url.searchParams.set('threadId', threadId);
  return url.toString().replace(/^http/, 'ws');
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE) throw new Error('API_BASE not configured');
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

// PUBLIC_INTERFACE
export async function listThreads(orderId?: string): Promise<ChatThread[]> {
  /** List existing threads, optionally scoped by orderId. Falls back to mock/localStorage if backend not available. */
  try {
    if (API_BASE) {
      const q = orderId ? `?orderId=${encodeURIComponent(orderId)}` : '';
      const items = await http<ChatThread[]>(`/chat/threads${q}`);
      // update cache
      items.forEach((t) => {
        if (!cache.has(t.id)) cache.set(t.id, { thread: t, messages: [] });
        else {
          const ce = cache.get(t.id)!;
          ce.thread = t;
        }
      });
      return items;
    }
  } catch {
    // swallow and fallback
  }
  const { threads } = loadAllMock();
  return orderId ? threads.filter((t) => t.orderId === orderId) : threads;
}

// PUBLIC_INTERFACE
export async function getOrCreateThread(input: GetOrCreateThreadInput): Promise<ChatThread> {
  /** Get or create a chat thread based on type and context (order or restaurant). */
  try {
    if (API_BASE) {
      const t = await http<ChatThread>('/chat/thread', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      if (!cache.has(t.id)) cache.set(t.id, { thread: t, messages: [] });
      return t;
    }
  } catch {
    // fallthrough
  }

  // mock behavior
  const { threads, messages } = loadAllMock();
  const meId = getUserId();
  const existing = threads.find((t) => {
    if (t.type !== input.type) return false;
    if (t.type === 'delivery') return t.orderId === input.orderId;
    if (input.restaurantId) return t.restaurantId === input.restaurantId;
    return !t.restaurantId;
  });
  if (existing) return existing;

  const now = new Date();
  const participants: Participant[] = [
    { id: meId, role: 'user', displayName: 'You', presence: 'online' },
  ];

  if (input.type === 'delivery') {
    participants.push({
      id: 'd_' + nanoid(4),
      role: 'delivery_partner',
      displayName: 'Delivery Partner',
      presence: 'online',
    });
  } else {
    const rid = input.restaurantId ? input.restaurantId : 'global';
    participants.push({
      id: (input.restaurantId ? `r_${rid}_support` : `support_global`),
      role: 'restaurant_support',
      displayName: input.restaurantId ? 'Restaurant Support' : 'Support',
      presence: 'offline',
    });
  }

  const t: ChatThread = {
    id: 'th_' + nanoid(6),
    type: input.type,
    orderId: input.orderId,
    restaurantId: input.restaurantId,
    participants,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    unreadCount: 0,
  };
  threads.unshift(t);
  messages[t.id] = [];
  saveMock(threads, messages);
  cache.set(t.id, { thread: t, messages: [] });
  return t;
}

// PUBLIC_INTERFACE
export async function fetchMessages(threadId: string): Promise<ChatMessage[]> {
  /** Fetch messages for a thread; local mock if backend missing. */
  try {
    if (API_BASE) {
      const msgs = await http<ChatMessage[]>(`/chat/threads/${encodeURIComponent(threadId)}/messages`);
      const ce = cache.get(threadId) || null;
      if (ce) ce.messages = msgs;
      else cache.set(threadId, { thread: { id: threadId } as any, messages: msgs });
      return msgs;
    }
  } catch {
    // fallback to mock
  }
  const { messages } = loadAllMock();
  return messages[threadId] || [];
}

// PUBLIC_INTERFACE
export async function sendMessage(threadId: string, payload: { content: string }): Promise<ChatMessage> {
  /** Send a message to a thread. */
  const meId = getUserId();
  try {
    if (API_BASE) {
      const msg = await http<ChatMessage>(`/chat/threads/${encodeURIComponent(threadId)}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: payload.content }),
      });
      // update cache
      const ce = cache.get(threadId);
      if (ce) {
        ce.messages.push(msg);
        ce.thread.latestMessage = msg;
        ce.thread.updatedAt = msg.createdAt;
      }
      return msg;
    }
  } catch {
    // fallback
  }
  // mock local delivery with immediate echo and simulated partner reply
  const now = new Date();
  const myMsg: ChatMessage = {
    id: 'm_' + nanoid(8),
    threadId,
    senderId: meId,
    senderRole: 'user',
    content: payload.content,
    createdAt: now.toISOString(),
    status: 'sent',
  };
  const { threads, messages } = loadAllMock();
  messages[threadId] = messages[threadId] || [];
  messages[threadId].push(myMsg);

  const t = threads.find((x) => x.id === threadId);
  if (t) {
    t.latestMessage = myMsg;
    t.updatedAt = myMsg.createdAt;
  }
  saveMock(threads, messages);

  // schedule a fake reply
  if (!isServer()) {
    setTimeout(() => {
      const reply: ChatMessage = {
        id: 'm_' + nanoid(8),
        threadId,
        senderId:
          (t?.participants.find((p) => p.role !== 'user')?.id) || 'system',
        senderRole:
          (t?.participants.find((p) => p.role !== 'user')?.role) ||
          'restaurant_support',
        content:
          'Thanks for your message! We will get back to you shortly.',
        createdAt: new Date().toISOString(),
        status: 'delivered',
      };
      const d = loadAllMock();
      d.messages[threadId] = d.messages[threadId] || [];
      d.messages[threadId].push(reply);
      const tt = d.threads.find((x) => x.id === threadId);
      if (tt) {
        tt.latestMessage = reply;
        tt.updatedAt = reply.createdAt;
        tt.unreadCount = (tt.unreadCount || 0) + 1;
      }
      saveMock(d.threads, d.messages);
      // notify subscribers
      notify(threadId, { type: 'message', threadId, message: reply });
    }, 1200);
  }

  // notify subscribers
  notify(threadId, { type: 'message', threadId, message: myMsg });
  return myMsg;
}

// subscriber registry
const listeners = new Map<string, Set<EventCallback>>();
function notify(threadId: string, event: ThreadEvent) {
  const set = listeners.get(threadId);
  if (!set) return;
  for (const cb of set) {
    try {
      cb(event);
    } catch {
      // no-op
    }
  }
}

// PUBLIC_INTERFACE
export function subscribeToThread(
  threadId: string,
  onEvent: EventCallback,
): SubscribeHandle & { status: ConnectionStatus } {
  /**
   * Subscribe to thread events. Uses WebSocket if configured; otherwise polls.
   * Auto-retry on WS failure with backoff. SSR-safe.
   */
  const status: ConnectionStatus = {
    connected: false,
    transport: 'mock',
  };

  // register immediate listener
  if (!listeners.get(threadId)) listeners.set(threadId, new Set());
  listeners.get(threadId)!.add(onEvent);

  const teardownFns: Array<() => void> = [];

  // polling
  const startPolling = (intervalMs: number) => {
    status.transport = API_BASE ? 'polling' : 'mock';
    status.connected = true;
    let lastSeen = 0;
    const iv = setInterval(async () => {
      const msgs = await fetchMessages(threadId);
      // naive: push any new messages by id
      msgs
        .filter((m) => {
          const ts = new Date(m.createdAt).getTime();
          if (ts > lastSeen) lastSeen = ts;
          return true;
        })
        .forEach((m) => notify(threadId, { type: 'message', threadId, message: m }));
    }, intervalMs);
    teardownFns.push(() => clearInterval(iv));
  };

  if (!isServer() && canUseWS()) {
    let ws: WebSocket | null = null;
    let backoff = 1000;
    const maxBackoff = 10000;

    const connect = () => {
      const url = wsUrlForThread(threadId);
      if (!url) {
        startPolling(3500);
        return;
      }
      try {
        ws = new WebSocket(url);
      } catch {
        startPolling(3500);
        return;
      }
      status.transport = 'websocket';
      ws.onopen = () => {
        status.connected = true;
        backoff = 1000;
      };
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as ThreadEvent;
          onEvent(data);
        } catch {
          // ignore
        }
      };
      ws.onerror = () => {
        status.lastError = 'WebSocket error';
      };
      ws.onclose = () => {
        status.connected = false;
        // retry with backoff
        setTimeout(connect, backoff);
        backoff = Math.min(maxBackoff, backoff * 2);
      };
      teardownFns.push(() => {
        if (ws && ws.readyState === WebSocket.OPEN) ws.close();
        ws = null;
      });
    };
    connect();
  } else {
    // polling fallback
    startPolling(3500);
  }

  return {
    status,
    unsubscribe() {
      const set = listeners.get(threadId);
      if (set) {
        set.delete(onEvent);
        if (set.size === 0) listeners.delete(threadId);
      }
      teardownFns.forEach((fn) => {
        try {
          fn();
        } catch {
          // ignore
        }
      });
    },
  };
}
