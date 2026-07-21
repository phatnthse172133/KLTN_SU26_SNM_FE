import { apiClient, buildQuery } from "@/infrastructure/api";
import type { BaseResponse, PaginationResponse, SubscriptionPackage, PackagePolicy } from "@/shared/types";

export interface PackageTemplate {
  code: string;
  displayName: string;
  packageType: number;
  isFree: boolean;
  features: string[];
}

export const packageService = {
  getAll: async (page = 1, pageSize = 10) => {
    return apiClient.get<BaseResponse<PaginationResponse<SubscriptionPackage>>>(`/admin/packages${buildQuery({ Page: page, PageSize: pageSize })}`);
  },
  getById: async (packageId: string) => {
    return apiClient.get<BaseResponse<SubscriptionPackage>>(`/admin/packages/${packageId}`);
  },
  getTemplates: async () => {
    return apiClient.get<BaseResponse<PackageTemplate[]>>(`/admin/packages/templates`);
  },
  create: async (data: {
    packageName: string;
    templateCode: string;
    price: number;
    durationDays: number;
    description?: string | null;
    status?: number;
    promotion?: {
      price: number;
      startDate?: string | null;
      endDate?: string | null;
    };
  }) => {
    return apiClient.post<BaseResponse<SubscriptionPackage>>("/admin/packages", data);
  },
  update: async (packageId: string, data: {
    packageName: string;
    price: number;
    durationDays: number;
    description?: string | null;
    status?: number;
    promotionAction?: "Keep" | "Upsert" | "Remove";
    promotion?: {
      id?: string | null;
      price: number;
      startDate?: string | null;
      endDate?: string | null;
    } | null;
  }) => {
    return apiClient.put<BaseResponse<SubscriptionPackage>>(`/admin/packages/${packageId}`, data);
  },
  delete: async (packageId: string) => {
    return apiClient.delete<BaseResponse<object>>(`/admin/packages/${packageId}`);
  },
  getPolicyVersions: async (packageId: string) => {
    return apiClient.get<BaseResponse<PackagePolicy[]>>(`/admin/packages/${packageId}/policies`);
  },
  getActivePolicy: async (packageId: string) => {
    return apiClient.get<BaseResponse<PackagePolicy>>(`/packages/${packageId}/policy`);
  },
  createPolicy: async (packageId: string, data: {
    version: string;
    title: string;
    contentJson: string;
    contentMarkdown?: string | null;
    effectiveFrom?: string | null;
  }) => {
    return apiClient.post<BaseResponse<PackagePolicy>>(`/admin/packages/${packageId}/policies`, data);
  },
  activatePolicy: async (packageId: string, policyId: string) => {
    return apiClient.put<BaseResponse<PackagePolicy>>(`/admin/packages/${packageId}/policies/${policyId}/activate`, {});
  },
};
