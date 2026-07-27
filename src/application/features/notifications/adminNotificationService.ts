import { apiClient } from "@/infrastructure/api";
import type { BaseResponse, PaginationResponse } from "@/shared/types";

export interface AdminNotificationListRequest {
  page: number;
  pageSize: number;
  keyword?: string;
  target?: string;
  role?: string;
  type?: string;
  fromDate?: string;
  toDate?: string;
}

export interface AdminNotificationListItemResponse {
  batchId: string;
  title: string;
  contentPreview: string;
  type: string;
  target: string;
  targetRole?: string | null;
  specificUserName?: string | null;
  recipientCount: number;
  createdByName: string;
  createdAt: string;
}

export interface AdminNotificationDetailResponse {
  batchId: string;
  title: string;
  content: string;
  type: string;
  target: string;
  targetRole?: string | null;
  specificUser?: {
    fullName: string;
    email: string;
  } | null;
  recipientCount: number;
  createdByName: string;
  createdAt: string;
}

export interface AdminCreateNotificationRequest {
  target: string;
  userId?: string | null;
  role?: string | null;
  title: string;
  content: string;
}

export interface AdminNotificationResultResponse {
  batchId: string;
  recipientCount: number;
  notificationCount: number;
}

export const adminNotificationService = {
  getAdminNotifications: async (req: AdminNotificationListRequest, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    params.append('Page', req.page.toString());
    params.append('PageSize', req.pageSize.toString());
    if (req.keyword) params.append('Keyword', req.keyword);
    if (req.target) params.append('Target', req.target);
    if (req.role) params.append('Role', req.role);
    if (req.type) params.append('Type', req.type);
    if (req.fromDate) params.append('FromDate', req.fromDate);
    if (req.toDate) params.append('ToDate', req.toDate);

    const response = await apiClient.get<BaseResponse<PaginationResponse<AdminNotificationListItemResponse>>>(
      `/admin/notifications?${params.toString()}`,
      { signal }
    );
    return response.data;
  },

  getAdminNotificationDetail: async (batchId: string) => {
    const response = await apiClient.get<BaseResponse<AdminNotificationDetailResponse>>(`/admin/notifications/${batchId}`);
    return response.data;
  },

  createNotification: async (payload: AdminCreateNotificationRequest) => {
    const response = await apiClient.post<BaseResponse<AdminNotificationResultResponse>>('/admin/notifications', payload);
    return response.data;
  }
};
