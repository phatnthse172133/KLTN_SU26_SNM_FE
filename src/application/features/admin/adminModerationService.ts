import { apiClient } from '@/infrastructure/api';
import type { BaseResponse, PaginationResponse } from '@/shared/types';

// ============================================================================
// MODERATION MODELS
// ============================================================================

export interface ModerationActionHistory {
  id: string;
  boothId?: string | null;
  nightMarketId?: string | null;
  adminId: string;
  adminName?: string;
  previousStatus: string;
  newStatus: string;
  reason: string;
  source: string; // "DirectAdmin" | "Complaint"
  complaintId?: string | null;
  createdAt: string;
}

export interface ModerationStatusRequest {
  status: 'Active' | 'Suspended';
  reason: string;
  expectedUpdatedAt?: string;
  complaintId?: string | null;
}

export interface BoothModerationActionRequest {
  reason: string;
}

// ----------------------------------------------------------------------------
// Night Market Moderation
// ----------------------------------------------------------------------------

export type MarketModerationStatus = 'Active' | 'Suspended';

export interface MarketModerationOverview {
  id: string;
  marketOwnerName?: string | null;
  marketOwnerEmail?: string | null;
  marketName: string;
  address: string;
  thumbnailUrl?: string | null;
  openingHours?: string | null;
  closingHours?: string | null;
  lifecycleStatus: string;
  moderationStatus: MarketModerationStatus;
  totalBooths: number;
  activeBooths: number;
  availableBooths: number;
  totalComplaintCount: number;
  seriousComplaintCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ModerationComplaintSummary {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  createdAt: string;
}

export interface ModerationActionResponse {
  id: string;
  success: boolean;
  message?: string;
}

export interface MarketModerationDetail extends MarketModerationOverview {
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  ownerPhone?: string | null;
  recentComplaints?: ModerationComplaintSummary[];
}

export interface GetMarketsQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  lifecycleStatus?: string;
  moderationStatus?: string;
  marketOwnerId?: string;
  sortBy?: string;
  sortDirection?: string;
}

// ----------------------------------------------------------------------------
// Booth Moderation
// ----------------------------------------------------------------------------

export interface BoothDocument {
  id: string;
  documentType: string;
  fileUrl: string;
  verificationStatus: string;
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
}

export type BoothModerationStatus = 'Active' | 'Inactive' | 'Banned';

export interface BoothModerationOverview {
  id: string;
  boothName: string;
  boothOwnerName?: string | null;
  boothOwnerEmail?: string | null;
  nightMarketName?: string | null;
  zoneName?: string | null;
  slotNumber?: string | null;
  thumbnailUrl?: string | null;
  status: BoothModerationStatus;
  averageRating?: number | null;
  complaintCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BoothModerationDetail extends BoothModerationOverview {
  description?: string;
  openTime?: string | null;
  closeTime?: string | null;
  phoneNumber?: string;
  thumbnailUrl?: string | null;
  documents?: BoothDocument[];
  recentComplaints?: ModerationComplaintSummary[];
  recentHistory?: ModerationActionHistory;
}

export interface GetBoothsQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  nightMarketId?: string;
  boothOwnerId?: string;
  sortBy?: string;
  sortDirection?: string;
}

// ============================================================================
// MODERATION SERVICE
// ============================================================================

export const adminModerationService = {
  // --- Markets ---
  getMarkets: async (query: GetMarketsQuery) => {
    const params = new URLSearchParams();
    if (query.page) params.append('Page', query.page.toString());
    if (query.pageSize) params.append('PageSize', query.pageSize.toString());
    if (query.keyword) params.append('Keyword', query.keyword);
    if (query.lifecycleStatus) params.append('LifecycleStatus', query.lifecycleStatus);
    if (query.moderationStatus) params.append('ModerationStatus', query.moderationStatus);
    if (query.marketOwnerId) params.append('MarketOwnerId', query.marketOwnerId);
    if (query.sortBy) params.append('SortBy', query.sortBy);
    if (query.sortDirection) params.append('SortDirection', query.sortDirection);

    return apiClient.get<BaseResponse<PaginationResponse<MarketModerationOverview>>>(
      `/admin/night-markets?${params.toString()}`
    );
  },

  getMarketDetail: async (marketId: string) => {
    return apiClient.get<BaseResponse<MarketModerationDetail>>(`/admin/night-markets/${marketId}`);
  },

  changeMarketModerationStatus: async (marketId: string, req: ModerationStatusRequest) => {
    return apiClient.patch<BaseResponse<ModerationActionResponse>>(`/admin/night-markets/${marketId}/moderation-status`, req);
  },

  getMarketModerationHistory: async (marketId: string, page = 1, pageSize = 10) => {
    return apiClient.get<BaseResponse<PaginationResponse<ModerationActionHistory>>>(
      `/admin/night-markets/${marketId}/moderation-history?Page=${page}&PageSize=${pageSize}`
    );
  },

  // --- Booths ---
  getBooths: async (query: GetBoothsQuery) => {
    const params = new URLSearchParams();
    if (query.page) params.append('Page', query.page.toString());
    if (query.pageSize) params.append('PageSize', query.pageSize.toString());
    if (query.keyword) params.append('Keyword', query.keyword);
    if (query.status) params.append('Status', query.status);
    if (query.nightMarketId) params.append('NightMarketId', query.nightMarketId);
    if (query.boothOwnerId) params.append('BoothOwnerId', query.boothOwnerId);
    if (query.sortBy) params.append('SortBy', query.sortBy);
    if (query.sortDirection) params.append('SortDirection', query.sortDirection);

    return apiClient.get<BaseResponse<PaginationResponse<BoothModerationOverview>>>(
      `/admin/booths?${params.toString()}`
    );
  },

  getBoothDetail: async (boothId: string) => {
    return apiClient.get<BaseResponse<BoothModerationDetail>>(`/admin/booths/${boothId}`);
  },

  banBooth: async (boothId: string, req: BoothModerationActionRequest) => {
    return apiClient.post<BaseResponse<ModerationActionResponse>>(`/admin/moderation/booths/${boothId}/ban`, req);
  },

  restoreBooth: async (boothId: string, req: BoothModerationActionRequest) => {
    return apiClient.post<BaseResponse<ModerationActionResponse>>(`/admin/moderation/booths/${boothId}/restore`, req);
  },

  getBoothModerationHistory: async (boothId: string, page = 1, pageSize = 10) => {
    return apiClient.get<BaseResponse<PaginationResponse<ModerationActionHistory>>>(
      `/admin/booths/${boothId}/moderation-history?Page=${page}&PageSize=${pageSize}`
    );
  },
};
