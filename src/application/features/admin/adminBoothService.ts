import { apiClient } from "@/infrastructure/api";
import type { BaseResponse, PaginationResponse, Booth } from "@/shared/types";

export interface NightMarketOption {
  id: string;
  name: string;
  status: string;
}

// ============================================================================
// ADMIN BOOTH SERVICE
// Kept separate from Booth Owner services to ensure clear responsibilities.
// ============================================================================
export const adminBoothService = {
  /**
   * Fetches all booths (paginated) for the Admin dashboard.
   * Backend: GET /api/booths?Page={page}&PageSize={pageSize}&nightMarketId={id}
   * Requires role: Admin
   */
  getAllBooths: async (page = 1, pageSize = 10, nightMarketId?: string) => {
    let url = `/booths?Page=${page}&PageSize=${pageSize}`;
    if (nightMarketId) {
      url += `&nightMarketId=${nightMarketId}`;
    }
    return apiClient.get<BaseResponse<PaginationResponse<Booth>>>(url);
  },

  /**
   * Fetches night market options for the filter dropdown.
   * Backend: GET /api/night-markets/options
   */
  getNightMarketOptions: async () => {
    return apiClient.get<BaseResponse<NightMarketOption[]>>(`/night-markets/options`);
  },
};
