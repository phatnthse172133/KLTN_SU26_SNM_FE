import { apiClient } from '@/infrastructure/api';
import type { BaseResponse } from '@/shared/types';

export interface CurrentSubscription {
  subscriptionId: string;
  packageCode: string | null;
  packageName: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  daysRemaining: number;
  entitlements: string | null;
  paidAmount: number;
  hasPendingRequest: boolean;
  payOSOrderCode: number | null;
  pendingSubscriptionId: string | null;
  pendingPackageCode: string | null;
  pendingPackageName: string | null;
  pendingStatus: string | null;
  pendingExpiresAt: string | null;
  scheduledSubscriptionId: string | null;
  scheduledPackageName: string | null;
  scheduledStartDate: string | null;
}

export interface SubscriptionQuoteRequest {
  packageId: string;
  durationDays?: number | null;
}

export interface SubscriptionQuoteResponse {
  currentPackageName: string;
  targetPackageName: string;
  changeType: string;
  baseAmount: number;
  creditAmount: number;
  amountDue: number;
  currency: string;
  currentPlanEndDate: string | null;
  activationMode: string;
  pendingAction: string;
  pendingSubscriptionId: string | null;
  pendingPackageName: string | null;
  pendingPaymentExpiresAt: string | null;
  message: string;
}

export interface SubscriptionHistoryItem {
  id: string;
  packageName: string;
  packageCode: string | null;
  status: string;
  startDate: string;
  endDate: string;
  baseAmount: number;
  creditAmount: number;
  paidAmount: number;
  changeType?: string | null;
  previousPackageName?: string | null;
  payOSOrderCode: number | null;
  paidAt: string | null;
  createdAt: string;
}

export interface PurchaseRequest {
  packageId: string;
  durationDays?: number | null;
  acceptedPolicy: boolean;
  acceptedPolicyVersion?: string | null;
}

export interface RenewSubscriptionRequest {
  durationDays?: number | null;
  acceptedPolicy: boolean;
  acceptedPolicyVersion?: string | null;
}

export interface PackagePolicy {
  id: string;
  packageId: string;
  version: string;
  displayVersion: string;
  title: string;
  terms: string[];
  effectiveFrom: string;
  isActive: boolean;
  createdAt: string;
}

export interface PayOSPaymentResponse {
  subscriptionId: string;
  orderCode: number;
  packageName: string;
  durationDays: number;
  baseAmount?: number;
  creditAmount?: number;
  amount: number;
  changeType?: string;
  qrCode: string;
  checkoutUrl: string;
  accountNumber: string;
  accountName: string;
  description: string;
  expiresAt: string | null;
  status: string;
}

export interface PaymentStatusResponse {
  subscriptionId: string;
  packageName?: string;
  status: string;
  baseAmount?: number;
  creditAmount?: number;
  paidAmount: number;
  changeType?: string | null;
  paidAt: string | null;
  startDate: string | null;
  endDate: string | null;
  providerStatus?: string | null;
  isFinal?: boolean;
  canResumePayment?: boolean;
  checkoutUrl?: string | null;
  message?: string;
}

export interface OwnerPackage {
  id: string;
  packageName: string;
  code: string | null;
  price: number;
  durationDays: number;
  type: number;
  description: string | null;
  entitlements: string | null;
  imageUrl: string | null;
  features: string[];
  status: string;
}

export const ownerSubscriptionService = {
  getMarketCurrent: async (): Promise<CurrentSubscription> => {
    const resp = await apiClient.get<BaseResponse<CurrentSubscription>>('/market-owner/subscriptions/current');
    return resp.data;
  },

  getMarketHistory: async (): Promise<SubscriptionHistoryItem[]> => {
    const resp = await apiClient.get<BaseResponse<SubscriptionHistoryItem[]>>('/market-owner/subscriptions/history');
    return resp.data || [];
  },

  quoteMarket: async (request: SubscriptionQuoteRequest): Promise<SubscriptionQuoteResponse> => {
    const resp = await apiClient.post<BaseResponse<SubscriptionQuoteResponse>>('/market-owner/subscriptions/quote', request);
    return resp.data;
  },

  purchaseMarket: async (data: PurchaseRequest): Promise<PayOSPaymentResponse> => {
    const resp = await apiClient.post<BaseResponse<PayOSPaymentResponse>>('/market-owner/subscriptions/purchase', data);
    return resp.data;
  },

  getBoothCurrent: async (boothId: string): Promise<CurrentSubscription> => {
    const resp = await apiClient.get<BaseResponse<CurrentSubscription>>(`/booths/${boothId}/subscriptions/current`);
    return resp.data;
  },

  getBoothHistory: async (boothId: string): Promise<SubscriptionHistoryItem[]> => {
    const resp = await apiClient.get<BaseResponse<SubscriptionHistoryItem[]>>(`/booths/${boothId}/subscriptions/history`);
    return resp.data || [];
  },

  quoteBooth: async (boothId: string, request: SubscriptionQuoteRequest): Promise<SubscriptionQuoteResponse> => {
    const resp = await apiClient.post<BaseResponse<SubscriptionQuoteResponse>>(`/booths/${boothId}/subscriptions/quote`, request);
    return resp.data;
  },

  purchaseBooth: async (boothId: string, request: PurchaseRequest): Promise<PayOSPaymentResponse> => {
    const resp = await apiClient.post<BaseResponse<PayOSPaymentResponse>>(`/booths/${boothId}/subscriptions/purchase`, request);
    return resp.data;
  },

  renewBooth: async (boothId: string, request: RenewSubscriptionRequest): Promise<PayOSPaymentResponse> => {
    const resp = await apiClient.post<BaseResponse<PayOSPaymentResponse>>(`/booths/${boothId}/subscriptions/renew`, request);
    return resp.data;
  },

  getPaymentStatus: async (subscriptionId: string): Promise<PaymentStatusResponse> => {
    const resp = await apiClient.get<BaseResponse<PaymentStatusResponse>>(`/subscriptions/${subscriptionId}/payment-status`);
    return resp.data;
  },

  cancelPayment: async (subscriptionId: string): Promise<void> => {
    await apiClient.post(`/subscriptions/${subscriptionId}/cancel-payment`, {});
  },

  getPublicPackages: async (type?: number): Promise<OwnerPackage[]> => {
    const params = new URLSearchParams();
    if (type !== undefined) params.append('type', type.toString());
    const resp = await apiClient.get<BaseResponse<OwnerPackage[]>>(`/packages${params.toString() ? '?' + params.toString() : ''}`);
    return resp.data || [];
  },

  getPublicPackageById: async (id: string): Promise<OwnerPackage> => {
    const resp = await apiClient.get<BaseResponse<OwnerPackage>>(`/packages/${id}`);
    return resp.data;
  },

  getPublicPackagePolicy: async (packageId: string): Promise<PackagePolicy> => {
    const resp = await apiClient.get<BaseResponse<PackagePolicy>>(`/packages/${packageId}/policy`);
    return resp.data;
  },
};
