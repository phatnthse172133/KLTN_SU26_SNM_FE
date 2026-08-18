import { apiClient, buildQuery } from "@/infrastructure/api";
import type { BaseResponse, PaginationResponse } from "@/shared/types";
import { createAppError } from "@/shared/errors/AppError";

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

function requireChatSuccess<T>(response: BaseResponse<T>, fallbackMessage: string): BaseResponse<T> {
  if (!response.success) {
    throw createAppError(response.message || fallbackMessage, {
      code: response.errorCode ?? undefined,
      retryable: false,
    });
  }
  return response;
}

export const chatService = {
  getConversations: async (params: { page?: number; pageSize?: number; keyword?: string }, signal?: AbortSignal) =>
    requireChatSuccess(await apiClient.get<BaseResponse<PaginationResponse<Conversation>>>(`/chats${buildQuery({
      Page: params.page ?? 1,
      PageSize: params.pageSize ?? 25,
      Keyword: params.keyword,
    })}`, { signal }), "Conversations could not be loaded."),

  getMessages: async (conversationId: string, params: { page?: number; pageSize?: number }, signal?: AbortSignal) =>
    requireChatSuccess(await apiClient.get<BaseResponse<PaginationResponse<ChatMessage>>>(`/chats/${conversationId}/messages${buildQuery({
      Page: params.page ?? 1,
      PageSize: params.pageSize ?? 100,
    })}`, { signal }), "Messages could not be loaded."),

  sendMessage: async (conversationId: string, content: string, clientMessageId: string) => {
    const response = await apiClient.post<BaseResponse<ChatMessage>>(`/chats/${conversationId}/messages`, {
      content,
      clientMessageId,
    });
    // Keep business errors readable even if a proxy returns HTTP 2xx with
    // the standard failure envelope instead of a non-2xx response.
    return requireChatSuccess(response, "The message could not be sent.");
  },

  markRead: async (conversationId: string) =>
    requireChatSuccess(
      await apiClient.patch<BaseResponse<{ updatedCount: number }>>(`/chats/${conversationId}/read`, {}),
      "The conversation could not be marked as read.",
    ),
};
