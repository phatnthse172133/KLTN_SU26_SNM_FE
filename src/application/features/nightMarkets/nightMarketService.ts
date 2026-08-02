import { apiClient, buildQuery } from "@/infrastructure/api";
import type { BaseResponse, NightMarket, PaginationResponse } from "@/shared/types";

export const nightMarketService = {
  getAll: async (page = 1, pageSize = 10) => {
    return apiClient.get<BaseResponse<PaginationResponse<NightMarket>>>(`/night-markets${buildQuery({ Page: page, PageSize: pageSize })}`);
  },
  getMine: async () => {
    return apiClient.get<BaseResponse<NightMarket[]>>("/night-markets/mine");
  },
  getById: async (id: string) => {
    return apiClient.get<BaseResponse<NightMarket>>(`/night-markets/${id}`);
  },
  create: async (data: Partial<NightMarket> & { name: string; address: string }) => {
    return apiClient.post<BaseResponse<NightMarket>>("/night-markets", data);
  },
  update: async (id: string, data: Partial<NightMarket> & { name: string; address: string }) => {
    return apiClient.put<BaseResponse<NightMarket>>(`/night-markets/${id}`, data);
  },
};
