import { apiClient } from "@/infrastructure/api";
import type { BaseResponse, PaginationResponse, NightMarket } from "@/shared/types";

// ============================================================================
// ADMIN NIGHT MARKET SERVICE
// Handles all API calls related to Night Market Management for Admin.
// ============================================================================

/**
 * Enum mirror of backend DomainLayer.Enums.GeneralEnum.NightMarketStatus
 * Must stay in sync with backend values.
 * Suspension is handled by ModerationStatus (separate field).
 */
export enum NightMarketStatus {
  Active = 1,
  Inactive = 2,
}

/**
 * Request body for creating/updating a Night Market.
 * Backend: CreateNightMarketRequest / UpdateNightMarketRequest
 * Note: Status is NOT sent in create/update — it defaults to Inactive on create,
 * and is changed via PATCH /night-markets/{id}/status by the market owner.
 */
export interface SaveNightMarketPayload {
  name: string;
  description?: string | null;
  address: string;
  latitude: number;
  longitude: number;
  boundaryWidthMeters: number;
  boundaryHeightMeters: number;
  openingHours?: string | null;
  closingHours?: string | null;
  thumbnailUrl?: string | null;
}

export const adminNightMarketService = {
  /**
   * Fetches all night markets (paginated)
   * Backend: GET /api/night-markets
   */
  getNightMarkets: async (page = 1, pageSize = 10, keyword?: string) => {
    let url = `/night-markets?Page=${page}&PageSize=${pageSize}`;
    if (keyword) url += `&Keyword=${encodeURIComponent(keyword)}`;
    return apiClient.get<BaseResponse<PaginationResponse<NightMarket>>>(url);
  },

  /**
   * Fetches a single night market by ID
   * Backend: GET /api/night-markets/{id}
   */
  getNightMarketById: async (id: string) => {
    return apiClient.get<BaseResponse<NightMarket>>(`/night-markets/${id}`);
  },

  /**
   * Creates a new night market
   * Backend: POST /api/night-markets
   */
  createNightMarket: async (payload: SaveNightMarketPayload) => {
    return apiClient.post<BaseResponse<NightMarket>>(`/night-markets`, payload);
  },

  /**
   * Updates an existing night market
   * Backend: PUT /api/night-markets/{id}
   */
  updateNightMarket: async (id: string, payload: SaveNightMarketPayload) => {
    return apiClient.put<BaseResponse<NightMarket>>(`/night-markets/${id}`, payload);
  },

  /**
   * Deletes a night market
   * Backend: DELETE /api/night-markets/{id}
   */
  deleteNightMarket: async (id: string) => {
    return apiClient.delete<BaseResponse<void>>(`/night-markets/${id}`);
  },

  getDeletionImpact: async (id: string) => {
    return apiClient.get<BaseResponse<DeletionImpactResponse>>(`/night-markets/${id}/deletion-impact`);
  },
};

export interface DeletionImpactResponse {
  activeBooths: number;
  openOrders: number;
  pendingRegistrations: number;
  layouts: number;
  zones: number;
}
