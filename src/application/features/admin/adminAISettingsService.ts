import { apiClient } from "@/infrastructure/api";
import type { BaseResponse } from "@/shared/types";

export interface AISettingsDto {
  provider: string;
  enableExternalProvider: boolean;
  model: string;
  baseUrl: string;
  hasApiKey: boolean;
}

export interface UpdateAISettingsPayload {
  provider: string;
  enableExternalProvider: boolean;
  apiKey?: string | null;
  model: string;
  baseUrl: string;
}

export const adminAISettingsService = {
  get: async () => {
    return apiClient.get<BaseResponse<AISettingsDto>>("/admin/ai-settings");
  },
  update: async (payload: UpdateAISettingsPayload) => {
    return apiClient.put<BaseResponse<AISettingsDto>>("/admin/ai-settings", payload);
  },
};
