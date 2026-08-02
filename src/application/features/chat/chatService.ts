import { apiClient, buildQuery } from "@/infrastructure/api";
import type { BaseResponse, PaginationResponse } from "@/shared/types";

export interface ChatUser {
  userId: string;
  fullName: string;
  avatarUrl?: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  clientMessageId?: string | null;
  senderName: string;
  senderAvatarUrl?: string | null;
  senderRole: string;
  type: "Text" | "Image" | "System" | "File" | number;
  content: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  customerId: string;
  boothOwnerId: string;
  status: string;
  lastMessageAt?: string | null;
  lastMessage?: ChatMessage | null;
  customer: ChatUser;
  boothOwner: ChatUser;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export const chatService = {
  getConversations: (params: { page?: number; pageSize?: number; keyword?: string }, signal?: AbortSignal) =>
    apiClient.get<BaseResponse<PaginationResponse<Conversation>>>(`/chats${buildQuery({
      Page: params.page ?? 1,
      PageSize: params.pageSize ?? 25,
      Keyword: params.keyword,
    })}`, { signal }),

  getMessages: (conversationId: string, params: { page?: number; pageSize?: number }, signal?: AbortSignal) =>
    apiClient.get<BaseResponse<PaginationResponse<ChatMessage>>>(`/chats/${conversationId}/messages${buildQuery({
      Page: params.page ?? 1,
      PageSize: params.pageSize ?? 100,
    })}`, { signal }),

  sendMessage: (conversationId: string, content: string, clientMessageId: string) =>
    apiClient.post<BaseResponse<ChatMessage>>(`/chats/${conversationId}/messages`, {
      content,
      clientMessageId,
    }),

  markRead: (conversationId: string) =>
    apiClient.patch<BaseResponse<{ updatedCount: number }>>(`/chats/${conversationId}/read`, {}),
};
