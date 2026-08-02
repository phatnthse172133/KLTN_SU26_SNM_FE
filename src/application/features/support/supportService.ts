import { apiClient, buildQuery } from "@/infrastructure/api";
import type { BaseResponse, PaginationResponse } from "@/shared/types";

export interface SupportTicketListItem {
  id: string; ticketCode: string; title: string; category: string; status: string; priority: string;
  requesterName: string; requesterEmail: string; requesterRole: string; dueAt: string; isOverdue: boolean;
  createdAt: string; updatedAt: string;
}
export interface SupportMessage { id: string; senderName: string; senderRole: string; body: string; isInternalNote: boolean; createdAt: string; }
export interface SupportAttachment { id: string; fileUrl: string; originalFileName: string; contentType: string; fileSize: number; }
export interface SupportStatusHistory { fromStatus: string | null; toStatus: string; note: string | null; actorName: string; createdAt: string; }
export interface SupportTicketDetail extends SupportTicketListItem {
  description: string; pageUrl: string | null; boothId: string | null; nightMarketId: string | null;
  assignedAdminId: string | null; assignedAdminName: string | null; firstRespondedAt: string | null; resolvedAt: string | null;
  messages: SupportMessage[]; attachments: SupportAttachment[]; statusHistory: SupportStatusHistory[];
}
export interface SupportMetrics { open: number; inProgress: number; waitingForRequester: number; overdue: number; resolvedToday: number; }
export interface CreateSupportTicket { title: string; category: string; description: string; boothId?: string | null; nightMarketId?: string | null; pageUrl?: string | null; }

const withFile = (file: File) => { const form = new FormData(); form.append("file", file); return form; };

export const supportService = {
  create: async (payload: CreateSupportTicket) => (await apiClient.post<BaseResponse<SupportTicketDetail>>("/support/tickets", payload)).data,
  getMine: async (page = 1, pageSize = 20) => (await apiClient.get<BaseResponse<PaginationResponse<SupportTicketListItem>>>(`/support/tickets/mine${buildQuery({ Page: page, PageSize: pageSize })}`)).data,
  getMineDetail: async (id: string) => (await apiClient.get<BaseResponse<SupportTicketDetail>>(`/support/tickets/mine/${id}`)).data,
  replyMine: async (id: string, body: string) => (await apiClient.post<BaseResponse<SupportTicketDetail>>(`/support/tickets/mine/${id}/messages`, { body, isInternalNote: false })).data,
  uploadMine: async (id: string, file: File) => (await apiClient.post<BaseResponse<SupportAttachment>>(`/support/tickets/mine/${id}/attachments`, withFile(file))).data,
  getAdmin: async (query: Record<string, string | number | boolean | null | undefined>) => (await apiClient.get<BaseResponse<PaginationResponse<SupportTicketListItem>>>(`/admin/support/tickets${buildQuery(query)}`)).data,
  getMetrics: async () => (await apiClient.get<BaseResponse<SupportMetrics>>("/admin/support/tickets/metrics")).data,
  getAdminDetail: async (id: string) => (await apiClient.get<BaseResponse<SupportTicketDetail>>(`/admin/support/tickets/${id}`)).data,
  updateAdmin: async (id: string, status: string, note?: string) => (await apiClient.patch<BaseResponse<SupportTicketDetail>>(`/admin/support/tickets/${id}`, { status, note: note || null })).data,
  replyAdmin: async (id: string, body: string, isInternalNote = false) => (await apiClient.post<BaseResponse<SupportTicketDetail>>(`/admin/support/tickets/${id}/messages`, { body, isInternalNote })).data,
};
