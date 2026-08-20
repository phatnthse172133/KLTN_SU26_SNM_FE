import { apiClient, buildQuery } from "@/infrastructure/api";
import type { BaseResponse, PaginationResponse } from "@/shared/types";

export const ORDER_STATUS = {
  Placed: 0,
  Preparing: 1,
  ReadyForPickup: 2,
  Completed: 3,
  Cancelled: 4,
  Underpaid: 5,
  Refunded: 6,
} as const;

export const PAYMENT_TYPE = { Cash: 0, Online: 1 } as const;
export const PAYMENT_STATUS = { Pending: 0, Paid: 1, Failed: 2, Refunded: 3 } as const;

export interface BoothOwnerOrder {
  orderCode: number;
  customerName: string;
  isWalkInCustomer: boolean;
  itemCount: number;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: number | null;
  paymentStatus: number | null;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface BoothOwnerOrderItem {
  foodItemName: string;
  imageUrl?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface BoothOwnerOrderDetail extends BoothOwnerOrder {
  note?: string | null;
  items: BoothOwnerOrderItem[];
}

export interface OrderQuery {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: number;
  paymentStatus?: number;
  fromDate?: string;
  toDate?: string;
}

export interface CreateWalkInOrderPayload {
  items: Array<{ foodItemId: string; quantity: number }>;
  note?: string;
  paymentMethod: number;
}

export interface CreatedOrder {
  orderId: string;
  orderCode: number;
  status: number;
  paymentUrl?: string | null;
}

export const orderService = {
  getMine: (query: OrderQuery, signal?: AbortSignal) =>
    apiClient.get<BaseResponse<PaginationResponse<BoothOwnerOrder>>>(
      `/Order/booth-owner${buildQuery({
        Page: query.page,
        PageSize: query.pageSize,
        Keyword: query.keyword,
        Status: query.status,
        PaymentStatus: query.paymentStatus,
        FromDate: query.fromDate,
        ToDate: query.toDate,
      })}`,
      { signal },
    ),
  getDetail: (orderCode: number, signal?: AbortSignal) =>
    apiClient.get<BaseResponse<BoothOwnerOrderDetail>>(
      `/Order/booth-owner/${orderCode}`,
      { signal },
    ),
  createWalkIn: (payload: CreateWalkInOrderPayload) =>
    apiClient.post<BaseResponse<CreatedOrder>>("/Order/booth-owner", payload),
  updateStatus: (orderCode: number, status: string) =>
    apiClient.patch<BaseResponse<boolean>>(`/Order/booth-owner/${orderCode}/status`, {
      status,
    }),
  cancelOrder: (orderCode: number, refundReason: string) =>
    apiClient.put<BaseResponse<boolean>>(`/Order/${orderCode}/BoothOwner/Cancel`, {
      refundReason,
    }),
  confirmCashPayment: (orderCode: number) =>
    apiClient.post<BaseResponse<boolean>>(
      `/Order/booth-owner/${orderCode}/confirm-cash-payment`,
      {},
    ),
};
