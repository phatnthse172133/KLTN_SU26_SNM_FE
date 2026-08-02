import { apiClient, buildQuery } from "@/infrastructure/api";
import type { BaseResponse } from "@/shared/types";

export type DashboardRange = "today" | "week" | "month" | "year";
export type AnalyticsTier = "Free" | "Growth" | "Featured";

export interface DashboardRangeInfo {
  period: string;
  fromDate: string;
  toDate: string;
  granularity: string;
}

export interface RevenueTrendPoint {
  bucketStart: string;
  label: string;
  revenue: number;
  orderCount: number;
}

export interface OrderStatusCount {
  status: string;
  count: number;
}

export interface TopFood {
  foodItemId: string;
  foodName: string;
  quantitySold: number;
  revenue: number;
}

export interface PeakHour {
  hour: number;
  label: string;
  orderCount: number;
}

export interface OrderTrendPoint {
  bucketStart: string;
  label: string;
  orderCount: number;
}

export interface RatingTrendPoint {
  bucketStart: string;
  label: string;
  averageRating: number;
  reviewCount: number;
}

export interface ConversionFunnel {
  ordersPlaced: number;
  ordersCompleted: number;
  ordersCancelled: number;
  completionRate: number;
  cancellationRate: number;
}

export interface RecentOrder {
  orderId: string;
  orderCode: number;
  status: string;
  finalAmount: number;
  createdAt: string;
  isPaid: boolean;
}

export interface BoothDashboardSummary {
  totalRevenue: number;
  totalOrders: number;
  todayOrders: number;
  placedOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  averageRating: number;
  reviewCount: number;
  outOfStockCount: number;
  activeMenuItemCount: number;
  activePromotionCount: number;
}

export interface BoothDashboardEntitlements {
  analyticsTier: AnalyticsTier;
  advancedAnalyticsEnabled: boolean;
  promotionEnabled: boolean;
  featuredBoothEnabled: boolean;
  featuredFoodEnabled: boolean;
  pauseBoothEnabled: boolean;
  reviewReplyEnabled: boolean;
}

export interface BoothDashboard {
  range: DashboardRangeInfo;
  summary: BoothDashboardSummary;
  entitlements: BoothDashboardEntitlements;
  revenueTrend?: RevenueTrendPoint[] | null;
  orderStatusBreakdown?: OrderStatusCount[] | null;
  topFoods?: TopFood[] | null;
  peakHours?: PeakHour[] | null;
  recentOrders?: RecentOrder[] | null;
}

export interface BoothAnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  completionRate: number;
  cancellationRate: number;
  averageRating: number;
  reviewCount: number;
}

export interface BoothAnalytics {
  range: DashboardRangeInfo;
  summary: BoothAnalyticsSummary;
  revenueTrend?: RevenueTrendPoint[] | null;
  orderTrend?: OrderTrendPoint[] | null;
  topFoods?: TopFood[] | null;
  topFoodsByRevenue?: TopFood[] | null;
  peakHours?: PeakHour[] | null;
  ratingTrend?: RatingTrendPoint[] | null;
  conversion?: ConversionFunnel | null;
}

export interface RevenueSeries {
  range: DashboardRangeInfo;
  points: RevenueTrendPoint[];
  totalRevenue: number;
  totalOrders: number;
}

export interface PromotionPerformanceItem {
  promotionId: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  usageCount: number;
  discountTotal: number;
}

export interface RecommendationPerformance {
  recommendationPriority: number;
  featuredBoothActive: boolean;
  featuredFoodEnabled: boolean;
  featuredFoodCount: number;
}

export interface PromotionPerformance {
  promotions: PromotionPerformanceItem[];
  recommendation: RecommendationPerformance;
}

export const boothDashboardService = {
  getDashboard: async (range: DashboardRange = "week", signal?: AbortSignal) => {
    return apiClient.get<BaseResponse<BoothDashboard>>(`/booth-owner/dashboard${buildQuery({ range })}`, { signal });
  },
  getAnalytics: async (range: DashboardRange = "week", signal?: AbortSignal) => {
    return apiClient.get<BaseResponse<BoothAnalytics>>(`/booth-owner/analytics${buildQuery({ range })}`, { signal });
  },
  getRevenueSeries: async (days = 14, signal?: AbortSignal) => {
    return apiClient.get<BaseResponse<RevenueSeries>>(`/booth-owner/analytics/revenue-series${buildQuery({ days })}`, { signal });
  },
  getPromotionPerformance: async (signal?: AbortSignal) => {
    return apiClient.get<BaseResponse<PromotionPerformance>>("/booth-owner/analytics/promotions", { signal });
  },
};
