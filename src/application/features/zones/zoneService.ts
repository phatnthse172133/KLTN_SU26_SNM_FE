import { apiClient, buildQuery } from "@/infrastructure/api";
import type { BaseResponse, PaginationResponse, Zone } from "@/shared/types";

export const zoneService = {
  getAll: async (page = 1, pageSize = 10) => {
    return apiClient.get<PaginationResponse<Zone>>(`/admin/zones${buildQuery({ Page: page, PageSize: pageSize })}`);
  },
  getById: async (zoneId: string) => {
    return apiClient.get<BaseResponse<Zone>>(`/admin/zones/${zoneId}`);
  },
  create: async (data: { nightMarketId: string; zoneName: string; description?: string | null; color?: string | null; status?: string }) => {
    return apiClient.post<BaseResponse<Zone>>("/admin/zones", data);
  },
  update: async (zoneId: string, data: { nightMarketId: string; zoneName: string; description?: string | null; color?: string | null; status?: string }) => {
    return apiClient.put<BaseResponse<Zone>>(`/admin/zones/${zoneId}`, data);
  },
  delete: async (zoneId: string) => {
    return apiClient.delete<BaseResponse<object>>(`/admin/zones/${zoneId}`);
  },
};
