import { apiClient } from "@/infrastructure/api";
import type { BaseResponse, Booth, PaginationResponse } from "@/shared/types";

export interface BoothNavigationInfo {
  boothId: string;
  boothName: string;
  nightMarketId: string;
  nightMarketName: string;
  nightMarketAddress: string;
  boothCoordinate: { latitude: number; longitude: number } | null;
  nightMarketCenter: { latitude: number; longitude: number } | null;
  nightMarketBoundary: { widthMeters: number; heightMeters: number } | null;
}


export const boothService = {
  getMyBooths: async () => {
    return apiClient.get<BaseResponse<Booth>>("/booths/mine");
  },
  updateMyBooth: async (data: Pick<Booth, "boothName"> & Partial<Pick<Booth, "description" | "phoneNumber" | "thumbnailUrl" | "paymentQrImage" | "openTime" | "closeTime">>) => {
    return apiClient.put<BaseResponse<Booth>>("/booths/mine", data);
  },
  togglePauseMyBooth: async () => {
    return apiClient.patch<BaseResponse<Booth>>("/booths/mine/toggle-pause", {});
  },
  getAllBooths: async (page = 1, pageSize = 10) => {
    return apiClient.get<BaseResponse<PaginationResponse<Booth>>>(`/booths?Page=${page}&PageSize=${pageSize}`);
  },
  getNavigationInfo: async (boothId: string) => {
    return apiClient.get<BaseResponse<BoothNavigationInfo>>(`/booths/${boothId}/navigation-info`);
  },
};
