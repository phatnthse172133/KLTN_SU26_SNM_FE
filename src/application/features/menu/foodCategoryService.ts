import { apiClient, buildQuery } from "@/infrastructure/api";
import type { BaseResponse, FoodCategory, PaginationResponse } from "@/shared/types";

export const foodCategoryService = {
  getAllCategories: async (boothId: string, page: number = 1, pageSize: number = 100) => {
    return apiClient.get<BaseResponse<PaginationResponse<FoodCategory>>>(`/booths/mine/${boothId}/food-categories${buildQuery({ Page: page, PageSize: pageSize })}`);
  },
  getCategory: async (boothId: string, categoryId: string) => {
    return apiClient.get<BaseResponse<FoodCategory>>(`/booths/mine/${boothId}/food-categories/${categoryId}`);
  },
  createCategory: async (boothId: string, data: { name: string; description?: string | null }) => {
    return apiClient.post<BaseResponse<FoodCategory>>(`/booths/mine/${boothId}/food-categories`, data);
  },
  updateCategory: async (boothId: string, categoryId: string, data: { name: string; description?: string | null }) => {
    return apiClient.put<BaseResponse<FoodCategory>>(`/booths/mine/${boothId}/food-categories/${categoryId}`, data);
  },
  deleteCategory: async (boothId: string, categoryId: string) => {
    return apiClient.delete<BaseResponse<object>>(`/booths/mine/${boothId}/food-categories/${categoryId}`);
  },
};
