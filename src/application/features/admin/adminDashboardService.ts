import { apiClient } from '@/infrastructure/api';
interface DashboardApiResponse<T> {
    message: string;
    data: T;
}

export interface DashboardStatsDto {
    totalUsers: number;
    totalMarkets: number;
    totalBooths: number;
    totalRevenue: number;
    newBooths: number;
    newReviews: number;
    newComplaints: number;
    totalSubscriptions: number;
    activeSubscriptions: number;
    newSubscriptions: number;
}

export interface RevenueChartDto {
    date: string;
    revenue: number;
    newBooths: number;
    newReviews: number;
    newComplaints: number;
    newSubscriptions: number;
    activeSubscriptions: number;
    totalSubscriptions: number;
}

export interface DashboardPeriodQuery {
    startDate: string;
    endDate: string;
    granularity: 'day' | 'month';
}

export const adminDashboardService = {
    getStats: async (query: Pick<DashboardPeriodQuery, 'startDate' | 'endDate'>): Promise<DashboardApiResponse<DashboardStatsDto>> => {
        const params = new URLSearchParams({ startDate: query.startDate, endDate: query.endDate });
        return await apiClient.get<DashboardApiResponse<DashboardStatsDto>>(`/admin/dashboard/stats?${params.toString()}`);
    },

    getRevenueChart: async (query: DashboardPeriodQuery): Promise<DashboardApiResponse<RevenueChartDto[]>> => {
        const params = new URLSearchParams({
            startDate: query.startDate,
            endDate: query.endDate,
            granularity: query.granularity,
        });
        return await apiClient.get<DashboardApiResponse<RevenueChartDto[]>>(`/admin/dashboard/revenue-chart?${params.toString()}`);
    }
};
