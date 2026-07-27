import { apiClient, buildQuery } from "@/infrastructure/api";
import type { BaseResponse, PaginationResponse } from "@/shared/types";

export interface MarketLayout {
  id: string;
  nightMarketId: string;
  layoutName: string;
  version: number;
  layoutImageUrl?: string | null;
  width: number;
  height: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export type LayoutNodeType = "Junction" | "Entrance" | "Exit" | "BoothAccess" | "Landmark";

export interface LayoutNode {
  id: string;
  layoutId: string;
  zoneId?: string | null;
  nodeName?: string | null;
  nodeType: LayoutNodeType;
  xCoordinate: number;
  yCoordinate: number;
  isAccessible: boolean;
  isStartingPoint: boolean;
}

export interface LayoutEdge {
  id: string;
  layoutId: string;
  fromNodeId: string;
  toNodeId: string;
  distance: number;
  isBidirectional: boolean;
  isAccessible: boolean;
}

export interface Zone {
  id: string;
  nightMarketId: string;
  zoneName: string;
  description?: string | null;
  color?: string | null;
  status: "Active" | "Inactive" | "Maintenance";
}

export interface BoothLocation {
  id: string;
  boothId: string;
  layoutId: string;
  layoutNodeId: string;
  zoneId?: string | null;
  slotNumber?: string | null;
  xCoordinate: number;
  yCoordinate: number;
  releasedAt?: string | null;
}

export interface MarketLayoutEditorData {
  layout: MarketLayout;
  zones: Zone[];
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  boothLocations: BoothLocation[];
}

export interface LayoutValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CreateZoneRequest {
  zoneName: string;
  description?: string;
  color?: string;
}

export interface UpdateZoneRequest {
  zoneName: string;
  description?: string;
  color?: string;
}

export interface SaveGraphRequest {
  expectedUpdatedAt: string;
  nodes: Array<Omit<LayoutNode, "layoutId">>;
  edges: Array<Omit<LayoutEdge, "layoutId">>;
}

export interface AssignBoothRequest {
  layoutId: string;
  layoutNodeId: string;
  zoneId?: string;
  slotNumber: string;
}

export const marketLayoutService = {
  list: (nightMarketId: string, page = 1, pageSize = 100) =>
    apiClient.get<BaseResponse<PaginationResponse<MarketLayout>>>(
      `/night-markets/${nightMarketId}/layouts${buildQuery({ Page: page, PageSize: pageSize })}`,
    ),
  create: (nightMarketId: string, data: { layoutName: string; version: number }) =>
    apiClient.post<BaseResponse<MarketLayout>>(`/night-markets/${nightMarketId}/layouts`, data),
  
  updateDimensions: (layoutId: string, width: number, height: number) =>
    apiClient.patch<BaseResponse<MarketLayout>>(`/layouts/${layoutId}/dimensions`, { width, height }),
    
  editorData: (layoutId: string) =>
    apiClient.get<BaseResponse<MarketLayoutEditorData>>(`/layouts/${layoutId}/editor-data`),
    
  saveGraphTransactional: (layoutId: string, request: SaveGraphRequest) =>
    apiClient.put<BaseResponse<object>>(`/layouts/${layoutId}/graph`, request),

  validate: (layoutId: string) =>
    apiClient.post<BaseResponse<LayoutValidation>>(`/layouts/${layoutId}/validate`, {}),
  activate: (layoutId: string) =>
    apiClient.post<BaseResponse<MarketLayout>>(`/layouts/${layoutId}/activate`, {}),
  deactivate: (layoutId: string) =>
    apiClient.post<BaseResponse<MarketLayout>>(`/layouts/${layoutId}/deactivate`, {}),
  remove: (layoutId: string) => apiClient.delete<BaseResponse<object>>(`/layouts/${layoutId}`),

  // Zones
  getZones: (nightMarketId: string, page = 1, pageSize = 100) =>
    apiClient.get<BaseResponse<PaginationResponse<Zone>>>(
      `/night-markets/${nightMarketId}/zones${buildQuery({ Page: page, PageSize: pageSize })}`,
    ),
  createZone: (nightMarketId: string, request: CreateZoneRequest) =>
    apiClient.post<BaseResponse<Zone>>(`/night-markets/${nightMarketId}/zones`, request),
  updateZone: (zoneId: string, request: UpdateZoneRequest) =>
    apiClient.put<BaseResponse<Zone>>(`/zones/${zoneId}`, request),
  deleteZone: (zoneId: string) => apiClient.delete<BaseResponse<object>>(`/zones/${zoneId}`),

  // Booth Allocation
  getAvailableSlots: (layoutId: string) =>
    apiClient.get<BaseResponse<LayoutNode[]>>(`/layouts/${layoutId}/available-booth-locations`),
  assignBooth: (boothId: string, request: AssignBoothRequest) =>
    apiClient.post<BaseResponse<BoothLocation>>(`/booths/${boothId}/location`, request),
  moveBooth: (boothId: string, request: AssignBoothRequest) =>
    apiClient.put<BaseResponse<BoothLocation>>(`/booths/${boothId}/location`, request),
  releaseBooth: (boothId: string) => apiClient.delete<BaseResponse<object>>(`/booths/${boothId}/location`),
};
