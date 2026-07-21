import { apiClient, buildQuery } from "@/infrastructure/api";
import type { BaseResponse, PaginationResponse, Review } from "@/shared/types";

export const reviewService = {
  create: async (data: { boothId: string; orderId: string; rating: number; content?: string | null; imageUrl?: string | null }) => {
    return apiClient.post<BaseResponse<Review>>("/reviews", data);
  },
  getByBooth: async (boothId: string, page = 1, pageSize = 10) => {
    return apiClient.get<BaseResponse<PaginationResponse<Review>>>(`/reviews/booths/${boothId}${buildQuery({ Page: page, PageSize: pageSize })}`);
  },
  getMine: async (page = 1, pageSize = 10) => {
    return apiClient.get<BaseResponse<PaginationResponse<Review>>>(`/reviews/mine${buildQuery({ Page: page, PageSize: pageSize })}`);
  },
  getAll: async (page = 1, pageSize = 10, filters?: { rating?: number; isVisible?: boolean; boothId?: string; keyword?: string }) => {
    return apiClient.get<BaseResponse<PaginationResponse<Review>>>(
      `/reviews${buildQuery({ Page: page, PageSize: pageSize, rating: filters?.rating, isVisible: filters?.isVisible, boothId: filters?.boothId, keyword: filters?.keyword })}`
    );
  },
  updateVisibility: async (reviewId: string, isVisible: boolean) => {
    return apiClient.patch<BaseResponse<Review>>(`/reviews/${reviewId}/visibility`, { isVisible });
  },
  reply: async (reviewId: string, content: string) => {
    return apiClient.put<BaseResponse<Review>>(`/reviews/${reviewId}/reply`, { content });
  },
};
