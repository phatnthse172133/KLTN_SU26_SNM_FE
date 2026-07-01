import { apiClient, buildQuery } from "@/infrastructure/api";
import type { BaseResponse, PaginationResponse, SubscriptionPackage } from "@/shared/types";

export const packageService = {
  getAll: async (page = 1, pageSize = 10) => {
    return apiClient.get<BaseResponse<PaginationResponse<SubscriptionPackage>>>(`/admin/packages${buildQuery({ Page: page, PageSize: pageSize })}`);
  },
  getById: async (packageId: string) => {
    return apiClient.get<BaseResponse<SubscriptionPackage>>(`/admin/packages/${packageId}`);
  },
  create: async (data: { packageName: string; price: number; durationDays: number; description?: string | null; status?: string }) => {
    return apiClient.post<BaseResponse<SubscriptionPackage>>("/admin/packages", data);
  },
  update: async (packageId: string, data: { packageName: string; price: number; durationDays: number; description?: string | null; status?: string }) => {
    return apiClient.put<BaseResponse<SubscriptionPackage>>(`/admin/packages/${packageId}`, data);
  },
  delete: async (packageId: string) => {
    return apiClient.delete<BaseResponse<object>>(`/admin/packages/${packageId}`);
  },
};
