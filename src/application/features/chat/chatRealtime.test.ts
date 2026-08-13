import { describe, expect, it } from "vitest";
import type { ChatMessage, Conversation } from "./chatService";
import {
  applyConversationRead,
  applyMessageCreated,
  isSameMessage,
  normalizeChatMessage,
  totalUnread,
  upsertMessage,
} from "./chatRealtime";

function message(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: "m1",
    conversationId: "c1",
    senderId: "customer",
    clientMessageId: "client-1",
    senderName: "Customer",
    senderAvatarUrl: null,
    senderRole: "Customer",
    type: "Text",
    content: "hello",
    isRead: false,
    readAt: null,
    createdAt: "2026-08-13T02:00:00.000Z",
    updatedAt: "2026-08-13T02:00:00.000Z",
    ...overrides,
  };
}

function conversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: "c1",
    customerId: "customer",
    boothOwnerId: "owner",
    status: "Active",
    lastMessageAt: null,
    lastMessage: null,
    customer: { userId: "customer", fullName: "Customer" },
    boothOwner: { userId: "owner", fullName: "Owner" },
    unreadCount: 0,
    createdAt: "2026-08-13T01:00:00.000Z",
    updatedAt: "2026-08-13T01:00:00.000Z",
    ...overrides,
  };
}

describe("chatRealtime", () => {
  it("normalizes PascalCase hub payloads", () => {
    const normalized = normalizeChatMessage({
      Id: "m9",
      ConversationId: "c9",
      SenderId: "owner",
      Content: "hi",
      CreatedAt: "2026-08-13T03:00:00.000Z",
    });
    expect(normalized?.id).toBe("m9");
    expect(normalized?.conversationId).toBe("c9");
    expect(normalized?.senderId).toBe("owner");
  });

  it("dedupes by message id and clientMessageId", () => {
    expect(isSameMessage(message(), message({ content: "hello again" }))).toBe(true);
    expect(isSameMessage(message({ id: "temp" }), message({ id: "server", content: "hello" }))).toBe(true);
    const merged = upsertMessage([message({ id: "temp" })], message({ id: "server" }));
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe("server");
  });

  it("appends into the active conversation only once", () => {
    const first = applyMessageCreated({
      conversations: [conversation()],
      messages: [],
      selectedId: "c1",
      incoming: message(),
      currentUserId: "owner",
    });
    const second = applyMessageCreated({
      conversations: first.conversations,
      messages: first.messages,
      selectedId: "c1",
      incoming: message(),
      currentUserId: "owner",
    });
    expect(first.messages).toHaveLength(1);
    expect(second.messages).toHaveLength(1);
    expect(second.conversations[0].unreadCount).toBe(0);
    expect(first.shouldMarkRead).toBe(true);
  });

  it("updates preview and unread for a different conversation", () => {
    const result = applyMessageCreated({
      conversations: [conversation({ id: "c1" }), conversation({ id: "c2", unreadCount: 1 })],
      messages: [message()],
      selectedId: "c1",
      incoming: message({ id: "m2", conversationId: "c2", content: "from B" }),
      currentUserId: "owner",
    });
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].conversationId).toBe("c1");
    expect(result.conversations.find((item) => item.id === "c2")?.unreadCount).toBe(2);
    expect(result.conversations.find((item) => item.id === "c2")?.lastMessage?.content).toBe("from B");
    expect(result.conversations.find((item) => item.id === "c1")?.unreadCount).toBe(0);
  });

  it("marks own messages read when the other participant reads", () => {
    const updated = applyConversationRead({
      messages: [message({ senderId: "owner", isRead: false }), message({ id: "m2", senderId: "customer" })],
      selectedId: "c1",
      conversationId: "c1",
      readerId: "customer",
      currentUserId: "owner",
      readAt: "2026-08-13T04:00:00.000Z",
    });
    expect(updated[0].isRead).toBe(true);
    expect(updated[1].isRead).toBe(false);
  });

  it("sums unread counts", () => {
    expect(totalUnread([conversation({ unreadCount: 2 }), conversation({ id: "c2", unreadCount: 3 })])).toBe(5);
  });
});
