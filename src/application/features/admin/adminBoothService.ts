import { apiClient } from "@/infrastructure/api";
import type { BaseResponse, PaginationResponse, Booth } from "@/shared/types";

// ============================================================================
// ADMIN BOOTH SERVICE
// Handles all API calls related to Booth Management for Admin.
// Kept separate from Booth Owner services to ensure clear responsibilities.
// ============================================================================

/**
 * Enum mirror of backend DomainLayer.Enums.GeneralEnum.BoothStatus
 * Must stay in sync with backend values.
 */
export enum BoothStatus {
  PendingApproval = 0,
  Active = 1,
  Inactive = 2,
  Suspended = 3,
  Closed = 4,
}

/**
 * Full request body for Admin update booth.
 * Backend: PUT /api/booths/{boothId}
 * Body: AdminUpdateBoothRequest (extends UpdateMyBoothRequest which has [Required] BoothName)
 * ALL fields of UpdateMyBoothRequest must be sent even if only updating status.
 */
export interface AdminUpdateBoothPayload {
  // Required by UpdateMyBoothRequest
  boothName: string;
  // Optional from UpdateMyBoothRequest
  description?: string | null;
  phoneNumber?: string | null;
  thumbnailUrl?: string | null;
  paymentQrImage?: string | null;
  openTime?: string | null;
  closeTime?: string | null;
  // Admin-only fields (AdminUpdateBoothRequest)
  zoneId?: string | null;
  slotNumber?: string | null;
  mapPositionX?: number | null;
  mapPositionY?: number | null;
  status: BoothStatus;        // int enum - must match backend BoothStatus enum
  isFeatured?: boolean;
}

export const adminBoothService = {
  /**
   * Fetches all booths (paginated) for the Admin dashboard.
   * Backend: GET /api/booths?Page={page}&PageSize={pageSize}
   * Requires role: Admin
   */
  getAllBooths: async (page = 1, pageSize = 10) => {
    return apiClient.get<BaseResponse<PaginationResponse<Booth>>>(
      `/booths?Page=${page}&PageSize=${pageSize}`
    );
  },

  /**
   * Updates a booth's details or status by an Admin.
   * Backend: PUT /api/booths/{boothId}
   * Requires role: Admin
   * IMPORTANT: BoothName is [Required] by the base request class — always include current booth data.
   */
  updateBooth: async (boothId: string, payload: AdminUpdateBoothPayload) => {
    return apiClient.put<BaseResponse<Booth>>(`/booths/${boothId}`, payload);
  },
};
