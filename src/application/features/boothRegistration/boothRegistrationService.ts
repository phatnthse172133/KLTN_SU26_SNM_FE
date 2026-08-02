import { apiClient, buildQuery } from "@/infrastructure/api";
import type { BaseResponse, BoothRegistration, PaginationResponse } from "@/shared/types";

export interface BoothRegistrationPayload {
  requestedNightMarketId: string;
  preferredZoneId?: string | null;
  boothName: string;
  description?: string | null;
  phone?: string | null;
  documents: { documentType: string; fileUrl: string }[];
}

export interface ReviewBoothRegistrationPayload {
  approved: boolean;
  rejectReason?: string | null;
}

export interface RegistrationCounts {
  pendingReview: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface BoothRegistrationWithOwner extends BoothRegistration {
  ownerName?: string;
  ownerEmail?: string;
}

export const boothRegistrationService = {
  create: async (data: BoothRegistrationPayload) => {
    return apiClient.post<BaseResponse<BoothRegistration>>("/booth-registrations", data);
  },
  getMine: async (page = 1, pageSize = 10) => {
    return apiClient.get<BaseResponse<PaginationResponse<BoothRegistration>>>(`/booth-registrations/mine${buildQuery({ Page: page, PageSize: pageSize })}`);
  },
  getPending: async (page = 1, pageSize = 10) => {
    return apiClient.get<BaseResponse<PaginationResponse<BoothRegistration>>>(`/booth-registrations/pending${buildQuery({ Page: page, PageSize: pageSize })}`);
  },
  getByMarketOwner: async (params: { marketId?: string | null; status?: string | null; keyword?: string | null; page?: number; pageSize?: number }) => {
    const query = buildQuery({
      MarketId: params.marketId ?? null,
      Status: params.status ?? null,
      Keyword: params.keyword ?? null,
      Page: params.page ?? 1,
      PageSize: params.pageSize ?? 10,
    });
    return apiClient.get<BaseResponse<PaginationResponse<BoothRegistrationWithOwner>>>(`/booth-registrations/market-owner${query}`);
  },
  getCountsByMarketOwner: async (marketId?: string | null) => {
    const query = buildQuery({ MarketId: marketId ?? null });
    return apiClient.get<BaseResponse<RegistrationCounts>>(`/booth-registrations/market-owner/counts${query}`);
  },
  review: async (registrationId: string, data: ReviewBoothRegistrationPayload) => {
    return apiClient.put<BaseResponse<BoothRegistration>>(`/booth-registrations/${registrationId}/review`, data);
  },
};
