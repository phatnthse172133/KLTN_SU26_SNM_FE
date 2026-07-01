import { apiClient } from "@/infrastructure/api";
import type { BaseResponse, PaginationResponse, Complaint } from "@/shared/types";

// ============================================================================
// ADMIN COMPLAINT SERVICE
// Handles all API calls related to Complaints Management for Admin.
// ============================================================================

export enum ComplaintStatus {
  Submitted = 0,
  UnderInvestigation = 1,
  Resolved = 2,
  Rejected = 3,
  Closed = 4
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
   * Fetches all complaints for Admin
   * Backend: GET /api/complaints
   */
  getAllComplaints: async (page = 1, pageSize = 10) => {
    let url = `/complaints?Page=${page}&PageSize=${pageSize}`;
    return apiClient.get<BaseResponse<PaginationResponse<Complaint>>>(url);
  },

  /**
   * Updates status and resolution of a complaint
   * Backend: PUT /api/complaints/{id}/status
   */
  updateComplaintStatus: async (id: string, payload: UpdateComplaintStatusRequest) => {
    return apiClient.put<BaseResponse<Complaint>>(`/complaints/${id}/status`, payload);
  }
};
