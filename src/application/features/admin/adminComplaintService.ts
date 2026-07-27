import { apiClient } from "@/infrastructure/api";
import type { BaseResponse, PaginationResponse, Complaint } from "@/shared/types";

// ============================================================================
// ADMIN COMPLAINT SERVICE
// Handles all API calls related to Complaints Management for Admin.
// ============================================================================

export enum ComplaintStatus {
  Pending = 0,
  Resolved = 1,
  Rejected = 2,
}

export enum ComplaintResolutionAction {
  NoViolation = 0,
  Warning = 1,
  SuspendBooth = 2,
  CloseBooth = 3
}

export interface UpdateComplaintStatusRequest {
  status: ComplaintStatus;
  adminResponse?: string | null;
  resolutionAction?: ComplaintResolutionAction | null;
  policyViolation?: string | null;
}

export const adminComplaintService = {
  /**
   * Fetches all complaints for Admin with server-side filtering and pagination
   * Backend: GET /api/complaints
   */
  getAllComplaints: async (page = 1, pageSize = 10, filters?: { status?: ComplaintStatus; keyword?: string; boothId?: string }) => {
    const params = new URLSearchParams();
    params.set('Page', String(page));
    params.set('PageSize', String(pageSize));
    if (filters?.status !== undefined) params.set('Status', String(filters.status));
    if (filters?.keyword) params.set('Keyword', filters.keyword);
    if (filters?.boothId) params.set('BoothId', filters.boothId);
    return apiClient.get<BaseResponse<PaginationResponse<Complaint>>>(`/complaints?${params.toString()}`);
  },

  /**
   * Updates status and resolution of a complaint
   * Backend: PUT /api/complaints/{id}/status
   */
  updateComplaintStatus: async (id: string, payload: UpdateComplaintStatusRequest) => {
    return apiClient.put<BaseResponse<Complaint>>(`/complaints/${id}/status`, payload);
  },

  /**
   * Fetches complaint counts by status for tab badges
   * Backend: GET /api/complaints/counts
   */
  getComplaintCounts: async () => {
    return apiClient.get<BaseResponse<{ pending: number; resolved: number; rejected: number; total: number }>>(`/complaints/counts`);
  }
};
