import { apiClient } from "@/infrastructure/api";
import type { BaseResponse, PaginationResponse } from "@/shared/types";

// ============================================================================
// ADMIN ACCOUNT SERVICE
// Handles all API calls related to User Management for Admin.
// Kept separate from Booth Owner services to ensure clear responsibilities.
// ============================================================================

/**
 * Shape of each user item returned by GET /api/account/users
 * Matches backend: ApplicationLayer.DTOs.Responses.ManagedUserResponse
 */
export interface ManagedUserResponse {
  id: string;
  userName: string;
  fullName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: string;        // e.g. "Admin", "BoothOwner", "Customer"
  status: string;      // e.g. "Active", "Suspended", "PendingVerification"
  createdAt: string;
}

/**
 * Enum mirror of backend DomainLayer.Enums.GeneralEnum.UserStatus
 * Must stay in sync with backend values.
 */
export enum UserStatus {
  PendingVerification = 0,
  Active = 1,
  Suspended = 2,
  Banned = 3,
  Inactive = 4,
}

export const adminAccountService = {
  /**
   * Fetches all users (paginated) for the Admin dashboard.
   * Backend: GET /api/account/users?Page={page}&PageSize={pageSize}
   * Requires role: Admin
   */
  getUsers: async (page = 1, pageSize = 10) => {
    return apiClient.get<BaseResponse<PaginationResponse<ManagedUserResponse>>>(
      `/account/users?Page=${page}&PageSize=${pageSize}`
    );
  },

  /**
   * Changes the status of a specific user.
   * Backend: PUT /api/account/users/{userId}/status
   * Body: { status: UserStatus (int enum) }
   * Requires role: Admin
   */
  changeUserStatus: async (userId: string, status: UserStatus) => {
    return apiClient.put<BaseResponse<any>>(`/account/users/${userId}/status`, {
      status, // Send integer enum value to match backend ChangeUserStatusRequest
    });
  },
};
