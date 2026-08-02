import { apiClient } from '@/infrastructure/api';
import { PaginationResponse } from '@/shared/types';

export enum PackageType {
    Booth = 0,
    Market = 1
}

export enum SubscriptionStatus {
    Active = 'Active',
    Expired = 'Expired',
    Cancelled = 'Cancelled',
    PendingPayment = 'PendingPayment'
}

export interface AdminSubscriptionDto {
    id: string;
    ownerId: string;
    ownerName: string;
    ownerEmail: string;
    packageType: PackageType;
    packageId: string;
    packageCode: string;
    packageName: string;
    startDate: string;
    endDate: string;
    status: SubscriptionStatus;
    adminNotes: string | null;
    paidAmount: number;
    payOSOrderCode: number | null;
    paidAt: string | null;
    createdAt: string;
    buyerName: string | null;
    buyerEmail: string | null;
    buyerPhone: string | null;
}

export interface VerifySubscriptionRequest {
    isApproved: boolean;
    adminNotes: string | null;
}

const subscriptionStatusByCode: Record<number, SubscriptionStatus> = {
    0: SubscriptionStatus.PendingPayment,
    1: SubscriptionStatus.Active,
    2: SubscriptionStatus.Expired,
    3: SubscriptionStatus.Cancelled,
};

const normalizeSubscriptionStatus = (status: SubscriptionStatus | number): SubscriptionStatus => {
    if (typeof status === 'number') {
        return subscriptionStatusByCode[status] ?? (String(status) as SubscriptionStatus);
    }
    return status;
};

export const adminSubscriptionService = {
    getSubscriptions: async (
        type?: PackageType,
        status?: SubscriptionStatus,
        pageIndex: number = 1,
        pageSize: number = 10
    ): Promise<PaginationResponse<AdminSubscriptionDto>> => {
        const params = new URLSearchParams({
            pageIndex: pageIndex.toString(),
            pageSize: pageSize.toString(),
        });

        if (type !== undefined) {
            params.append('type', type.toString());
        }

        if (status) {
            params.append('status', status);
        }

        const response = await apiClient.get<PaginationResponse<AdminSubscriptionDto>>(`/admin/subscriptions?${params.toString()}`);
        return {
            ...response,
            items: (response.items || []).map((item) => ({
                ...item,
                status: normalizeSubscriptionStatus(item.status),
            })),
        };
    }
};
