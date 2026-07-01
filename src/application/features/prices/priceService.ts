import { apiClient } from "@/infrastructure/api";
import type { BaseResponse, PaginationResponse } from "@/shared/types";

export interface PriceResponse {
  id: string;
  foodItemId?: string;
  packageId?: string;
  price: number;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PricePayload {
  price: number;
  startDate?: string | null;
  endDate?: string | null;
}

export const priceService = {
  getFoodPrices: async (boothId: string, foodItemId: string) => {
    return apiClient.get<BaseResponse<PaginationResponse<PriceResponse>>>(`/booths/mine/${boothId}/menu/${foodItemId}/prices`);
  },
  createFoodPrice: async (boothId: string, foodItemId: string, data: PricePayload) => {
    return apiClient.post<BaseResponse<PriceResponse>>(`/booths/mine/${boothId}/menu/${foodItemId}/prices`, data);
  },
  updateFoodPrice: async (boothId: string, foodItemId: string, priceId: string, data: PricePayload) => {
    return apiClient.put<BaseResponse<PriceResponse>>(`/booths/mine/${boothId}/menu/${foodItemId}/prices/${priceId}`, data);
  },
  deleteFoodPrice: async (boothId: string, foodItemId: string, priceId: string) => {
    return apiClient.delete<BaseResponse<object>>(`/booths/mine/${boothId}/menu/${foodItemId}/prices/${priceId}`);
  },
  getPackagePrices: async (packageId: string) => {
    return apiClient.get<BaseResponse<PaginationResponse<PriceResponse>>>(`/admin/packages/${packageId}/prices`);
  },
  createPackagePrice: async (packageId: string, data: PricePayload) => {
    return apiClient.post<BaseResponse<PriceResponse>>(`/admin/packages/${packageId}/prices`, data);
  },
  updatePackagePrice: async (packageId: string, priceId: string, data: PricePayload) => {
    return apiClient.put<BaseResponse<PriceResponse>>(`/admin/packages/${packageId}/prices/${priceId}`, data);
  },
  deletePackagePrice: async (packageId: string, priceId: string) => {
    return apiClient.delete<BaseResponse<object>>(`/admin/packages/${packageId}/prices/${priceId}`);
  },
};
