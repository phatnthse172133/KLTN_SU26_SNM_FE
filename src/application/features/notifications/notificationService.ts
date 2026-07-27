import { apiClient } from "@/infrastructure/api";
import type { BaseResponse, PaginationResponse } from "@/shared/types";

export interface AppNotification {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  type: string;
  createdAt: string;
}

export const notificationService = {
  getNotifications: async (page = 1, pageSize = 20) => {
    return apiClient.get<BaseResponse<PaginationResponse<AppNotification>>>(`/notifications?Page=${page}&PageSize=${pageSize}`);
  },
  getUnreadCount: async () => {
    return apiClient.get<BaseResponse<{ unreadCount: number }>>("/notifications/unread-count");
  },
  markAsRead: async (id: string) => {
    return apiClient.patch<BaseResponse<object>>(`/notifications/${id}/read`, {});
  },
  markAllAsRead: async () => {
    return apiClient.patch<BaseResponse<object>>("/notifications/read-all", {});
  },
  deleteNotification: async (id: string) => {
    return apiClient.delete<BaseResponse<object>>(`/notifications/${id}`);
  }
};
