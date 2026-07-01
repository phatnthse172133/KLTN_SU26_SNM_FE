import { apiClient, buildQuery } from "@/infrastructure/api";
import type { BaseResponse, Complaint, PaginationResponse } from "@/shared/types";

export const complaintService = {
  create: async (data: { boothId: string; orderId: string; title: string; description: string; images?: { imageUrl: string }[] }) => {
    return apiClient.post<BaseResponse<Complaint>>("/complaints", { ...data, images: data.images ?? [] });
  },
  getMine: async (page = 1, pageSize = 10) => {
    return apiClient.get<BaseResponse<PaginationResponse<Complaint>>>(`/complaints/mine${buildQuery({ Page: page, PageSize: pageSize })}`);
  },
  getAll: async (page = 1, pageSize = 10) => {
    return apiClient.get<BaseResponse<PaginationResponse<Complaint>>>(`/complaints${buildQuery({ Page: page, PageSize: pageSize })}`);
  },
  getByBooth: async (boothId: string, page = 1, pageSize = 10) => {
    return apiClient.get<BaseResponse<PaginationResponse<Complaint>>>(`/complaints/booths/${boothId}${buildQuery({ Page: page, PageSize: pageSize })}`);
  },
  updateStatus: async (complaintId: string, data: { status: string; adminResponse?: string | null; resolutionAction?: string | null; policyViolation?: string | null }) => {
    return apiClient.put<BaseResponse<Complaint>>(`/complaints/${complaintId}/status`, data);
  },
};
