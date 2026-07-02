import { apiClient, buildQuery } from "@/infrastructure/api";
import type { BaseResponse, PaginationResponse, Zone } from "@/shared/types";

export const zoneService = {
  getAll: async (nightMarketId: string, page = 1, pageSize = 10) => {
    return apiClient.get<BaseResponse<PaginationResponse<Zone>>>(`/night-markets/${nightMarketId}/zones${buildQuery({ Page: page, PageSize: pageSize })}`);
  },
  getById: async (zoneId: string) => {
    return apiClient.get<BaseResponse<Zone>>(`/zones/${zoneId}`);
  },
  create: async (nightMarketId: string, data: { zoneName: string; description?: string | null; color?: string | null; status?: string }) => {
    return apiClient.post<BaseResponse<Zone>>(`/night-markets/${nightMarketId}/zones`, data);
  },
  update: async (zoneId: string, data: { zoneName: string; description?: string | null; color?: string | null; status?: string }) => {
    return apiClient.put<BaseResponse<Zone>>(`/zones/${zoneId}`, data);
  },
  updateStatus: async (zoneId: string, status: string) => {
    return apiClient.patch<BaseResponse<Zone>>(`/zones/${zoneId}/status`, { status });
  },
  delete: async (zoneId: string) => {
    return apiClient.delete<BaseResponse<object>>(`/zones/${zoneId}`);
  },
};
