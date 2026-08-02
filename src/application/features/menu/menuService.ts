import { apiClient, buildQuery } from "@/infrastructure/api";
import type { BaseResponse, FoodItem, PaginationResponse } from "@/shared/types";

export type FoodItemPayload = {
  categoryId: string;
  name: string;
  description?: string | null;
  price: number;
  thumbnailUrl?: string | null;
  isAvailable?: boolean;
  isFeatured?: boolean;
};

export const menuService = {
  getMenu: async (boothId: string, page = 1, pageSize = 100) => {
    return apiClient.get<BaseResponse<PaginationResponse<FoodItem>>>(
      `/booths/mine/${boothId}/menu${buildQuery({ Page: page, PageSize: pageSize })}`,
    );
  },
  createFoodItem: async (boothId: string, data: FoodItemPayload) => {
    return apiClient.post<BaseResponse<FoodItem>>(`/booths/mine/${boothId}/menu`, data);
  },
  updateFoodItem: async (boothId: string, foodItemId: string, data: FoodItemPayload) => {
    return apiClient.put<BaseResponse<FoodItem>>(`/booths/mine/${boothId}/menu/${foodItemId}`, data);
  },
  updateAvailability: async (boothId: string, foodItemId: string, isAvailable: boolean) => {
    return apiClient.patch<BaseResponse<FoodItem>>(`/booths/mine/${boothId}/menu/${foodItemId}/availability`, { isAvailable });
  },
  updateFeatured: async (boothId: string, foodItemId: string, isFeatured: boolean) => {
    return apiClient.patch<BaseResponse<FoodItem>>(`/booths/mine/${boothId}/menu/${foodItemId}/featured`, { isFeatured });
  },
  deleteFoodItem: async (boothId: string, foodItemId: string) => {
    return apiClient.delete<BaseResponse<object>>(`/booths/mine/${boothId}/menu/${foodItemId}`);
  },
  uploadThumbnail: async (boothId: string, foodItemId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<BaseResponse<{ url: string }>>(`/booth-owner/booths/${boothId}/food-items/${foodItemId}/images`, formData);
  },
};
