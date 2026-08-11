import { apiClient } from "@/infrastructure/api";
import type { BaseResponse } from "@/shared/types";

export interface BoothPaymentSettingsStatus {
  isPayInConfigured: boolean;
  isPayOutConfigured: boolean;
  updatedAt: string | null;
}

export interface SaveBoothPaymentSettingsRequest {
  clientId?: string;
  apiKey?: string;
  checksumKey?: string;
  payoutClientId?: string;
  payoutApiKey?: string;
  payoutChecksumKey?: string;
}

export const boothPaymentSettingsService = {
  getStatus: () =>
    apiClient.get<BaseResponse<BoothPaymentSettingsStatus>>("/booth-owner/payos-credentials/mine"),
  save: (request: SaveBoothPaymentSettingsRequest) =>
    apiClient.put<BaseResponse<boolean>>("/booth-owner/payos-credentials/mine", request),
};
