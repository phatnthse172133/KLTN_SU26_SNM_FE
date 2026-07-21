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

export interface DashboardPendingComplaintDto {
    id: string;
    title: string;
    customerName: string;
    boothName: string;
    createdAt: string;
}

export interface DashboardRecentRegistrationDto {
    id: string;
    boothName: string;
    ownerName: string;
    marketName: string;
    createdAt: string;
    status: string;
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
    },

    getPendingComplaints: async (limit: number = 5): Promise<DashboardApiResponse<DashboardPendingComplaintDto[]>> => {
        return await apiClient.get<DashboardApiResponse<DashboardPendingComplaintDto[]>>(`/admin/dashboard/pending-complaints?limit=${limit}`);
    },

    getRecentBoothRegistrations: async (limit: number = 5): Promise<DashboardApiResponse<DashboardRecentRegistrationDto[]>> => {
        return await apiClient.get<DashboardApiResponse<DashboardRecentRegistrationDto[]>>(`/admin/dashboard/recent-booth-registrations?limit=${limit}`);
    }
};
