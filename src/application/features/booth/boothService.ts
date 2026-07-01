import { apiClient } from "@/infrastructure/api";
import type { BaseResponse, Booth, PaginationResponse } from "@/shared/types";

export const boothService = {
  getMyBooths: async () => {
    return apiClient.get<BaseResponse<PaginationResponse<Booth>>>("/booths/mine");
  },
  updateMyBooth: async (boothId: string, data: Pick<Booth, "boothName"> & Partial<Pick<Booth, "description" | "phoneNumber" | "thumbnailUrl" | "openTime" | "closeTime">>) => {
    return apiClient.put<BaseResponse<Booth>>(`/booths/mine/${boothId}`, data);
  },
  getAllBooths: async (page = 1, pageSize = 10) => {
    return apiClient.get<BaseResponse<PaginationResponse<Booth>>>(`/booths?Page=${page}&PageSize=${pageSize}`);
  },
};
