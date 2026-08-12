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
  PendingPayment: 7,
  PaymentFailed: 8,
} as const;

export const ORDER_STATUS_API: Record<number, string> = {
  [ORDER_STATUS.Placed]: "PLACED",
  [ORDER_STATUS.Preparing]: "PREPARING",
  [ORDER_STATUS.ReadyForPickup]: "READY_FOR_PICKUP",
  [ORDER_STATUS.Completed]: "COMPLETED",
  [ORDER_STATUS.Cancelled]: "CANCELLED",
  [ORDER_STATUS.Underpaid]: "UNDERPAID",
  [ORDER_STATUS.Refunded]: "REFUNDED",
  [ORDER_STATUS.PendingPayment]: "PENDING_PAYMENT",
  [ORDER_STATUS.PaymentFailed]: "PAYMENT_FAILED",
};

export const PAYMENT_TYPE = { Cash: 0, Online: 1 } as const;
export const PAYMENT_STATUS = {
  Pending: 0,
  Paid: 1,
  Failed: 2,
  Refunded: 3,
  Cancelled: 4,
  RefundProcessing: 5,
  Underpaid: 6,
  Unpaid: 7,
  Expired: 8,
} as const;

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
  updateStatus: (orderCode: number, newStatus: number) =>
    apiClient.patch<BaseResponse<boolean>>(`/Order/booth-owner/${orderCode}/status`, {
      status: ORDER_STATUS_API[newStatus] ?? String(newStatus),
    }),
  cancelOrder: (orderCode: number, refundReason: string) =>
    apiClient.put<BaseResponse<boolean>>(`/Order/${orderCode}/BoothOwner/Cancel`, {
      refundReason,
      bankBin: null,
      accountNumber: null,
    }),
  confirmCashPayment: (orderCode: number) =>
    apiClient.post<BaseResponse<boolean>>(
      `/Order/booth-owner/${orderCode}/confirm-cash-payment`,
      {},
    ),
};
