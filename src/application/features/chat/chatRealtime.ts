import type { ChatMessage, Conversation } from "./chatService";

export type ChatConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting";

type UnknownRecord = Record<string, unknown>;

function readString(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function readBoolean(value: unknown): boolean {
  return value === true || value === "true";
}

export function normalizeChatMessage(raw: unknown): ChatMessage | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as UnknownRecord;
  const id = readString(source.id ?? source.Id);
  const conversationId = readString(source.conversationId ?? source.ConversationId);
  if (!id || !conversationId) return null;

  return {
    id,
    conversationId,
    senderId: readString(source.senderId ?? source.SenderId),
    clientMessageId: readString(source.clientMessageId ?? source.ClientMessageId) || null,
    senderName: readString(source.senderName ?? source.SenderName),
    senderAvatarUrl: readString(source.senderAvatarUrl ?? source.SenderAvatarUrl) || null,
    senderRole: readString(source.senderRole ?? source.SenderRole),
    type: (source.type ?? source.Type ?? "Text") as ChatMessage["type"],
    content: readString(source.content ?? source.Content),
    isRead: readBoolean(source.isRead ?? source.IsRead),
    readAt: readString(source.readAt ?? source.ReadAt) || null,
    createdAt: readString(source.createdAt ?? source.CreatedAt) || new Date().toISOString(),
    updatedAt: readString(source.updatedAt ?? source.UpdatedAt) || readString(source.createdAt ?? source.CreatedAt),
  };
}

export function normalizeConversationRead(raw: unknown): { conversationId: string; readerId: string; readAt: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as UnknownRecord;
  const conversationId = readString(source.conversationId ?? source.ConversationId);
  const readerId = readString(source.readerId ?? source.ReaderId);
  if (!conversationId || !readerId) return null;
  return {
    conversationId,
    readerId,
    readAt: readString(source.readAt ?? source.ReadAt) || new Date().toISOString(),
  };
}

export function isSameMessage(left: ChatMessage, right: ChatMessage): boolean {
  if (left.id && right.id && left.id === right.id) return true;
  return Boolean(
    left.clientMessageId
      && right.clientMessageId
      && left.clientMessageId === right.clientMessageId
      && left.senderId === right.senderId,
  );
}

export function sortMessages(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort((left, right) => {
    const time = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    return time !== 0 ? time : left.id.localeCompare(right.id);
  });
}

export function upsertMessage(messages: ChatMessage[], incoming: ChatMessage): ChatMessage[] {
  const index = messages.findIndex((message) => isSameMessage(message, incoming));
  if (index < 0) return sortMessages([...messages, incoming]);
  const next = [...messages];
  next[index] = { ...next[index], ...incoming };
  return sortMessages(next);
}

export function sortConversations(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((left, right) => {
    const leftTime = new Date(left.lastMessageAt ?? left.updatedAt).getTime();
    const rightTime = new Date(right.lastMessageAt ?? right.updatedAt).getTime();
    return rightTime - leftTime;
  });
}

export function totalUnread(conversations: Conversation[]): number {
  return conversations.reduce((sum, conversation) => sum + Math.max(0, conversation.unreadCount ?? 0), 0);
}

export function applyMessageCreated(input: {
  conversations: Conversation[];
  messages: ChatMessage[];
  selectedId: string | null;
  incoming: ChatMessage;
  currentUserId: string;
}): {
  conversations: Conversation[];
  messages: ChatMessage[];
  unknownConversation: boolean;
  shouldMarkRead: boolean;
} {
  const fromSelf = Boolean(input.currentUserId) && input.incoming.senderId === input.currentUserId;
  const isActive = input.selectedId === input.incoming.conversationId;
  const exists = input.conversations.some((conversation) => conversation.id === input.incoming.conversationId);

  return {
    unknownConversation: !exists,
    shouldMarkRead: isActive && !fromSelf,
    messages: isActive ? upsertMessage(input.messages, input.incoming) : input.messages,
    conversations: sortConversations(input.conversations.map((conversation) => {
      if (conversation.id !== input.incoming.conversationId) return conversation;
      return {
        ...conversation,
        lastMessage: input.incoming,
        lastMessageAt: input.incoming.createdAt,
        updatedAt: input.incoming.createdAt,
        unreadCount: fromSelf || isActive ? (isActive ? 0 : conversation.unreadCount) : conversation.unreadCount + 1,
      };
    })),
  };
}

export function applyConversationRead(input: {
  messages: ChatMessage[];
  selectedId: string | null;
  conversationId: string;
  readerId: string;
  currentUserId: string;
  readAt: string;
}): ChatMessage[] {
  if (input.selectedId !== input.conversationId) return input.messages;
  if (!input.currentUserId || input.readerId === input.currentUserId) return input.messages;
  return input.messages.map((message) => (
    message.senderId === input.currentUserId
      ? { ...message, isRead: true, readAt: input.readAt }
      : message
  ));
}

export function dayKey(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function formatDayLabel(value: string, now = new Date()): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatListTime(value?: string | null, now = new Date()): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);
  if (diffDays === 0) return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatMessageTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
