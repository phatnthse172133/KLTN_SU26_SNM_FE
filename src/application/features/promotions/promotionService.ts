import { apiClient, buildQuery } from "@/infrastructure/api";
import type { BaseResponse, PaginationResponse } from "@/shared/types";

export type Promotion = {
  id: string; boothId: string; boothName: string; promotionCode?: string | null;
  title: string; description?: string | null; discountType: "Percentage" | "FixedAmount";
  scope: "EntireBoothOrder" | "SpecificFoodItems" | "SpecificCategories";
  discountValue: number; minimumOrderAmount?: number | null; maximumDiscountAmount?: number | null;
  totalUsageLimit?: number | null; usageLimitPerCustomer?: number | null; isPublic: boolean;
  startDate: string; endDate: string; status: string; usedCount: number;
  foodItems: { foodItemId: string; foodName: string }[];
  categories: { categoryId: string; categoryName: string }[];
};

export type PromotionPayload = {
  promotionCode?: string | null; title: string; description?: string | null;
  discountType: Promotion["discountType"]; scope: Promotion["scope"]; discountValue: number;
  minimumOrderAmount?: number | null; maximumDiscountAmount?: number | null;
  totalUsageLimit?: number | null; usageLimitPerCustomer?: number | null; isPublic: boolean;
  startDate: string; endDate: string; foodItemIds: string[]; categoryIds: string[];
};

export const promotionService = {
  getByBooth: (boothId: string, page = 1, pageSize = 100) => apiClient.get<BaseResponse<PaginationResponse<Promotion>>>(`/booths/${boothId}/promotions${buildQuery({ Page: page, PageSize: pageSize })}`),
  create: (boothId: string, data: PromotionPayload) => apiClient.post<BaseResponse<Promotion>>(`/booths/${boothId}/promotions`, data),
  update: (id: string, data: PromotionPayload) => apiClient.put<BaseResponse<Promotion>>(`/promotions/${id}`, data),
  activate: (id: string) => apiClient.patch<BaseResponse<Promotion>>(`/promotions/${id}/activate`, {}),
  deactivate: (id: string) => apiClient.patch<BaseResponse<Promotion>>(`/promotions/${id}/deactivate`, {}),
  delete: (id: string) => apiClient.delete<BaseResponse<object>>(`/promotions/${id}`),
};
