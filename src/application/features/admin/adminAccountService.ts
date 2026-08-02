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
  address?: string | null;
  avatarUrl?: string | null;
  role: string;        // e.g. "Admin", "BoothOwner", "Customer", "MarketOwner"
  status: string;      // e.g. "Active", "Inactive", "PendingVerification"
  createdAt: string;
}

/**
 * Enum mirror of backend DomainLayer.Enums.GeneralEnum.UserStatus
 * Must stay in sync with backend values.
 */
export enum UserStatus {
  PendingVerification = 0,
  Active = 1,
  Inactive = 2,
}

export interface ChangeUserStatusRequest {
  status: UserStatus.Active | UserStatus.Inactive;
  reason: string;
}

export interface UserStatusHistoryResponse {
  id: string;
  userId: string;
  changedByAdminId: string;
  changedByAdminName: string;
  previousStatus: string;
  newStatus: string;
  reason: string;
  createdAt: string;
}

export interface BoothDocumentResponse {
  id: string;
  documentType: string;
  fileUrl: string;
  verificationStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOwnedBoothResponse {
  id: string;
  boothName: string;
  boothCode?: string | null;
  status: string;
  description?: string | null;
  phoneNumber?: string | null;
  thumbnailUrl?: string | null;
  logoUrl?: string | null;
  nightMarketName?: string | null;
  zoneName?: string | null;
  slotNumber?: string | null;
  mapPositionX?: number | null;
  mapPositionY?: number | null;
  activePackageName?: string | null;
  packageExpiryDate?: string | null;
  createdAt: string;
  documents: BoothDocumentResponse[];
}

export interface BoothOwnerAccountDetailResponse {
  account: ManagedUserResponse;
  ownedBooths: AdminOwnedBoothResponse[];
}

export interface UserListQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortDirection?: string;
}

export const adminAccountService = {
  getUser: async (userId: string) => {
    return apiClient.get<BaseResponse<ManagedUserResponse>>(
      `/account/users/${userId}`
    );
  },

  /**
   * Fetches users (paginated + filtered) for the Admin dashboard.
   * Backend: GET /api/account/users?Page=&PageSize=&Keyword=&Role=&Status=
   * Requires role: Admin
   */
  getUsers: async (params: UserListQueryParams = {}) => {
    const {
      page = 1,
      pageSize = 20,
      keyword,
      role,
      status,
      sortBy,
      sortDirection,
    } = params;

    const qp = new URLSearchParams();
    qp.set("Page", String(page));
    qp.set("PageSize", String(pageSize));
    if (keyword) qp.set("Keyword", keyword);
    if (role) qp.set("Role", role);
    if (status) qp.set("Status", status);
    if (sortBy) qp.set("SortBy", sortBy);
    if (sortDirection) qp.set("SortDirection", sortDirection);

    return apiClient.get<BaseResponse<PaginationResponse<ManagedUserResponse>>>(
      `/account/users?${qp.toString()}`
    );
  },

  /**
   * Changes the status of a specific user.
   * Backend: PUT /api/account/users/{userId}/status
   * Requires role: Admin
   */
  changeUserStatus: async (
    userId: string,
    request: ChangeUserStatusRequest
  ) => {
    return apiClient.put<BaseResponse<ManagedUserResponse>>(
      `/account/users/${userId}/status`,
      request
    );
  },

  /**
   * Gets the status history of a specific user.
   * Backend: GET /api/account/users/{userId}/status-history
   * Requires role: Admin
   */
  getUserStatusHistory: async (userId: string, page = 1, pageSize = 10) => {
    return apiClient.get<BaseResponse<PaginationResponse<UserStatusHistoryResponse>>>(
      `/account/users/${userId}/status-history?Page=${page}&PageSize=${pageSize}`
    );
  },

  /**
   * Gets Booth Owner account details with owned booth, assignment and legal documents.
   * Backend: GET /api/account/users/{userId}/booth-owner-details
   * Requires role: Admin
   */
  getBoothOwnerDetails: async (userId: string) => {
    return apiClient.get<BaseResponse<BoothOwnerAccountDetailResponse>>(
      `/account/users/${userId}/booth-owner-details`
    );
  },
};
