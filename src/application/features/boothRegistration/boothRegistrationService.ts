import { apiClient, buildQuery } from "@/infrastructure/api";
import type { BaseResponse, BoothRegistration, PaginationResponse } from "@/shared/types";

export interface BoothRegistrationPayload {
  requestedNightMarketId: string;
  preferredZoneId?: string | null;
  preferredLayoutNodeId?: string | null;
  boothName: string;
  description?: string | null;
  phone?: string | null;
  documents: { documentType: string; fileUrl: string }[];
}

export const boothRegistrationService = {
  create: async (data: BoothRegistrationPayload) => {
    return apiClient.post<BaseResponse<BoothRegistration>>("/booth-registrations", data);
  },
  getMine: async () => {
    return apiClient.get<BaseResponse<PaginationResponse<BoothRegistration>>>("/booth-registrations/mine");
  },
  getPending: async (page = 1, pageSize = 10) => {
    return apiClient.get<BaseResponse<PaginationResponse<BoothRegistration>>>(`/booth-registrations/pending${buildQuery({ Page: page, PageSize: pageSize })}`);
  },
  review: async (registrationId: string, data: { approved: boolean; rejectReason?: string | null; zoneId?: string | null; slotNumber?: string | null; mapPositionX?: number | null; mapPositionY?: number | null }) => {
    return apiClient.put<BaseResponse<BoothRegistration>>(`/booth-registrations/${registrationId}/review`, data);
  },
};
