export type ParticipantRole = 'user' | 'delivery_partner' | 'restaurant_support';

export interface Participant {
  id: string; // userId, partnerId, or supportId (restaurantId-prefixed for support)
  role: ParticipantRole;
  displayName: string;
  avatarUrl?: string;
  presence?: 'online' | 'offline' | 'away';
  typing?: boolean;
}

export type ThreadType = 'delivery' | 'support';

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderRole: ParticipantRole;
  content: string;
  createdAt: string; // ISO
  status?: 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
}

export interface ChatThread {
  id: string;
  type: ThreadType;
  orderId?: string;
  restaurantId?: string; // for support threads if available
  participants: Participant[];
  latestMessage?: ChatMessage;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ThreadEventTyping {
  type: 'typing';
  threadId: string;
  participantId: string;
  isTyping: boolean;
}

export interface ThreadEventMessage {
  type: 'message';
  threadId: string;
  message: ChatMessage;
}

export interface ThreadEventPresence {
  type: 'presence';
  threadId: string;
  participantId: string;
  presence: 'online' | 'offline' | 'away';
}

export type ThreadEvent = ThreadEventTyping | ThreadEventMessage | ThreadEventPresence;

export interface GetOrCreateThreadInput {
  type: ThreadType;
  orderId?: string;
  restaurantId?: string;
}

export interface SubscribeHandle {
  unsubscribe: () => void;
}

export interface ConnectionStatus {
  connected: boolean;
  transport: 'websocket' | 'polling' | 'mock';
  lastError?: string;
}
