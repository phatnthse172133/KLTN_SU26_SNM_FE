import { apiClient } from "@/infrastructure/api";

export enum AIRecommendationType {
  General = 1,
  ByBudget = 2,
  ByFoodTags = 3,
  ByCombo = 4
}

export interface AILog {
  id: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  nightMarketId?: string;
  nightMarketName?: string;
  recommendationType: AIRecommendationType;
  recommendationTypeName: string;
  inputJson: string;
  parsedIntentJson?: string;
  resultJson: string;
  selectedOptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AILogListParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: AIRecommendationType;
}

export interface AILogListResult {
  items: AILog[];
  totalCount: number;
}

interface AdminApiEnvelope<T> {
  data?: T;
}

export const adminAILogService = {
  getLogs: async (params: AILogListParams = {}) => {
    const qp = new URLSearchParams();
    if (params.page) qp.append('Page', params.page.toString());
    if (params.limit) qp.append('Limit', params.limit.toString());
    if (params.search) qp.append('Search', params.search);
    if (params.type !== undefined) qp.append('Type', params.type.toString());

    const response = await apiClient.get<AdminApiEnvelope<AILogListResult>>(`/admin/ai-logs?${qp.toString()}`);
    return response.data;
  },

  getLogById: async (id: string) => {
    const response = await apiClient.get<AdminApiEnvelope<AILog>>(`/admin/ai-logs/${id}`);
    return response.data;
  }
};
