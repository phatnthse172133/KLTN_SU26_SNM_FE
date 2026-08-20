"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  ChevronRight,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";
import { useBooth } from "@/application/context/BoothContext";
import { menuService } from "@/application/features/menu/menuService";
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_TYPE,
  orderService,
  type BoothOwnerOrder,
  type BoothOwnerOrderDetail,
} from "@/application/features/orders/orderService";
import { getErrorMessage } from "@/shared/errors/errorMapper";
import type { FoodItem } from "@/shared/types";
import { Pagination } from "./Pagination";

const statusMeta: Record<number, { label: string; className: string }> = {
  [ORDER_STATUS.Placed]: { label: "New", className: "bg-blue-50 text-blue-700" },
  [ORDER_STATUS.Preparing]: { label: "Preparing", className: "bg-amber-50 text-amber-700" },
  [ORDER_STATUS.ReadyForPickup]: { label: "Ready", className: "bg-violet-50 text-violet-700" },
  [ORDER_STATUS.Completed]: { label: "Completed", className: "bg-emerald-50 text-emerald-700" },
  [ORDER_STATUS.Cancelled]: { label: "Cancelled", className: "bg-red-50 text-red-700" },
  [ORDER_STATUS.Underpaid]: { label: "Underpaid", className: "bg-orange-50 text-orange-700" },
  [ORDER_STATUS.Refunded]: { label: "Refunded", className: "bg-slate-100 text-slate-600" },
  [ORDER_STATUS.PendingPayment]: { label: "Pending payment", className: "bg-amber-50 text-amber-800" },
  [ORDER_STATUS.PaymentFailed]: { label: "Payment failed", className: "bg-red-50 text-red-700" },
};

const paymentStatusLabel: Record<number, string> = {
  [PAYMENT_STATUS.Pending]: "Pending",
  [PAYMENT_STATUS.Paid]: "Paid",
  [PAYMENT_STATUS.Failed]: "Failed",
  [PAYMENT_STATUS.Refunded]: "Refunded",
  [PAYMENT_STATUS.Cancelled]: "Cancelled",
  [PAYMENT_STATUS.RefundProcessing]: "Refund processing",
  [PAYMENT_STATUS.Underpaid]: "Underpaid",
  [PAYMENT_STATUS.Unpaid]: "Unpaid",
  [PAYMENT_STATUS.Expired]: "Expired",
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

function StatusBadge({ status }: { status: number }) {
  const meta = statusMeta[status] ?? { label: "Unknown", className: "bg-slate-100 text-slate-600" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${meta.className}`}>{meta.label}</span>;
}

export function Orders() {
  const { selectedBooth, loading: boothLoading } = useBooth();
  const [orders, setOrders] = useState<BoothOwnerOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [detail, setDetail] = useState<BoothOwnerOrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [menu, setMenu] = useState<FoodItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<number>(PAYMENT_TYPE.Cash);
  const [createError, setCreateError] = useState("");
  const [paymentUrl, setPaymentUrl] = useState("");

  const loadOrders = useCallback(async (signal?: AbortSignal) => {
    if (!selectedBooth?.id) {
      setOrders([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await orderService.getMine({
        page,
        pageSize,
        keyword: keyword.trim() || undefined,
        status: status === "" ? undefined : Number(status),
        paymentStatus: paymentStatus === "" ? undefined : Number(paymentStatus),
      }, signal);
      setOrders(response.data.items ?? []);
      setTotal(response.data.total ?? 0);
    } catch (loadError) {
      if (!signal?.aborted) {
        setOrders([]);
        setTotal(0);
        setError(getErrorMessage(loadError));
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [keyword, page, pageSize, paymentStatus, selectedBooth?.id, status]);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadOrders(controller.signal));
    return () => controller.abort();
  }, [loadOrders]);

  useEffect(() => {
    const onRealtime = (event: Event) => {
      const detail = (event as CustomEvent<{ type?: string }>).detail;
      const type = detail?.type ?? "";
      if (!type) return;
      if (/order|payment|refund/i.test(type)) void loadOrders();
    };
    window.addEventListener("realtime:event", onRealtime);
    return () => window.removeEventListener("realtime:event", onRealtime);
  }, [loadOrders]);

  const openDetail = async (orderCode: number) => {
    setDetailLoading(true);
    setError("");
    try {
      const response = await orderService.getDetail(orderCode);
      setDetail(response.data);
    } catch (detailError) {
      setError(getErrorMessage(detailError));
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshDetailAndList = async (orderCode: number) => {
    const response = await orderService.getDetail(orderCode);
    setDetail(response.data);
    await loadOrders();
  };

  const updateStatus = async (newStatus: number) => {
    if (!detail) return;
    setActionLoading(true);
    setError("");
    try {
      await orderService.updateStatus(detail.orderCode, newStatus);
      setNotice("Order status updated successfully.");
      await refreshDetailAndList(detail.orderCode);
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setActionLoading(false);
    }
  };

  const cancelOrder = async () => {
    if (!detail) return;
    const reason = window.prompt("Enter a cancellation reason:")?.trim();
    if (!reason) return;
    setActionLoading(true);
    setError("");
    try {
      await orderService.cancelOrder(detail.orderCode, reason);
      setNotice("Order cancelled successfully.");
      await refreshDetailAndList(detail.orderCode);
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setActionLoading(false);
    }
  };

  const confirmCash = async () => {
    if (!detail) return;
    setActionLoading(true);
    setError("");
    try {
      await orderService.confirmCashPayment(detail.orderCode);
      setNotice("Cash payment confirmed successfully.");
      await refreshDetailAndList(detail.orderCode);
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setActionLoading(false);
    }
  };

  const openCreate = async () => {
    if (!selectedBooth?.id) return;
    setShowCreate(true);
    setCreateError("");
    setMenuLoading(true);
    try {
      const response = await menuService.getMenu(selectedBooth.id, 1, 100);
      setMenu((response.data.items ?? []).filter((item) => item.isAvailable));
    } catch (menuError) {
      setMenu([]);
      setCreateError(getErrorMessage(menuError));
    } finally {
      setMenuLoading(false);
    }
  };

  const selectedItems = useMemo(
    () => menu.filter((item) => (quantities[item.id] ?? 0) > 0),
    [menu, quantities],
  );
  const createTotal = selectedItems.reduce(
    (sum, item) => sum + item.price * (quantities[item.id] ?? 0),
    0,
  );

  const createOrder = async () => {
    if (selectedItems.length === 0) {
      setCreateError("Add at least one menu item.");
      return;
    }
    setActionLoading(true);
    setCreateError("");
    try {
      const response = await orderService.createWalkIn({
        items: selectedItems.map((item) => ({ foodItemId: item.id, quantity: quantities[item.id] })),
        note: note.trim() || undefined,
        paymentMethod,
      });
      setShowCreate(false);
      setQuantities({});
      setNote("");
      setNotice(`Order #${response.data.orderCode} created successfully.`);
      if (response.data.paymentUrl) setPaymentUrl(response.data.paymentUrl);
      await loadOrders();
      await openDetail(response.data.orderCode);
    } catch (createOrderError) {
      setCreateError(getErrorMessage(createOrderError));
    } finally {
      setActionLoading(false);
    }
  };

  const nextAction = detail?.status === ORDER_STATUS.Placed
    ? { label: "Start Preparing", status: ORDER_STATUS.Preparing }
    : detail?.status === ORDER_STATUS.Preparing
      ? { label: "Mark as Ready", status: ORDER_STATUS.ReadyForPickup }
      : detail?.status === ORDER_STATUS.ReadyForPickup
        ? { label: "Complete Order", status: ORDER_STATUS.Completed }
        : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-5 pb-12 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Orders</h1>
          <p className="mt-1 text-sm text-slate-500">Manage incoming and walk-in orders for your booth</p>
        </div>
        <button
          type="button"
          disabled={!selectedBooth || boothLoading}
          onClick={() => void openCreate()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Plus className="h-4 w-4" /> Create Walk-in Order
        </button>
      </div>

      {notice && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss"><X className="h-4 w-4" /></button>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => void loadOrders()} className="inline-flex items-center gap-1 font-bold">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      )}

      <div className="rounded-2xl bg-white shadow-[0_2px_14px_rgba(15,23,42,0.07)] ring-1 ring-slate-100">
        <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-[minmax(220px,1fr)_180px_180px]">
          <label className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={keyword}
              onChange={(event) => { setKeyword(event.target.value); setPage(1); }}
              placeholder="Search order code or customer"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
            <option value="">All statuses</option>
            {Object.entries(statusMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
          </select>
          <select value={paymentStatus} onChange={(event) => { setPaymentStatus(event.target.value); setPage(1); }} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
            <option value="">All payments</option>
            {Object.entries(paymentStatusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-5 py-3">STT</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Items</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Payment</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Created</th><th className="px-5 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order, index) => (
                <tr key={order.orderCode} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-bold text-slate-700">{(page - 1) * pageSize + index + 1}</td>
                  <td className="px-5 py-4 font-semibold text-slate-800">{order.customerName}</td>
                  <td className="px-5 py-4 text-slate-600">{order.itemCount}</td>
                  <td className="px-5 py-4 font-bold text-slate-900">{formatMoney(order.finalAmount)}</td>
                  <td className="px-5 py-4 text-slate-600">{order.paymentStatus == null ? "Not available" : paymentStatusLabel[order.paymentStatus]}</td>
                  <td className="px-5 py-4"><StatusBadge status={order.status} /></td>
                  <td className="px-5 py-4 text-slate-500">{formatDate(order.createdAt)}</td>
                  <td className="px-5 py-4 text-right"><button type="button" onClick={() => void openDetail(order.orderCode)} className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50" aria-label={`View order ${order.orderCode}`}><ChevronRight className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-slate-100 md:hidden">
          {orders.map((order) => (
            <button key={order.orderCode} type="button" onClick={() => void openDetail(order.orderCode)} className="w-full space-y-3 p-4 text-left hover:bg-slate-50">
              <div className="flex items-center justify-between"><span className="font-black text-indigo-600">#{order.orderCode}</span><StatusBadge status={order.status} /></div>
              <div className="flex items-end justify-between"><div><p className="font-semibold text-slate-900">{order.customerName}</p><p className="text-xs text-slate-500">{order.itemCount} items - {formatDate(order.createdAt)}</p></div><span className="font-black text-slate-900">{formatMoney(order.finalAmount)}</span></div>
            </button>
          ))}
        </div>

        {!loading && orders.length === 0 && (
          <div className="px-5 py-16 text-center"><ShoppingBag className="mx-auto h-11 w-11 text-slate-200" /><p className="mt-3 font-bold text-slate-700">No orders found</p><p className="mt-1 text-sm text-slate-400">New orders will appear here.</p></div>
        )}
        {loading && <div className="px-5 py-16 text-center text-sm font-medium text-slate-400">Loading orders...</div>}
        <Pagination currentPage={page} totalItems={total} itemsPerPage={pageSize} onPageChange={setPage} onItemsPerPageChange={(value) => { setPageSize(value); setPage(1); }} />
      </div>

      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            {detailLoading || !detail ? <div className="p-12 text-center text-slate-500">Loading order details...</div> : (
              <>
                <div className="flex items-start justify-between border-b border-slate-100 p-6">
                  <div><p className="text-sm font-bold text-indigo-600">Order #{detail.orderCode}</p><h2 className="mt-1 text-2xl font-black text-slate-900">{detail.customerName}</h2><div className="mt-3"><StatusBadge status={detail.status} /></div></div>
                  <button type="button" onClick={() => setDetail(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100" aria-label="Close order details"><X className="h-5 w-5" /></button>
                </div>
                <div className="space-y-6 p-6">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Created</p><p className="mt-1 text-sm font-bold text-slate-800">{formatDate(detail.createdAt)}</p></div>
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Payment</p><p className="mt-1 text-sm font-bold text-slate-800">{detail.paymentMethod === PAYMENT_TYPE.Cash ? "Cash" : "Online"}</p></div>
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Payment status</p><p className="mt-1 text-sm font-bold text-slate-800">{detail.paymentStatus == null ? "Not available" : paymentStatusLabel[detail.paymentStatus]}</p></div>
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Total</p><p className="mt-1 text-sm font-black text-slate-900">{formatMoney(detail.finalAmount)}</p></div>
                  </div>
                  <div><h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Items</h3><div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-100">{detail.items.map((item) => <div key={`${item.foodItemName}-${item.unitPrice}`} className="flex items-center justify-between p-4"><div><p className="font-bold text-slate-900">{item.foodItemName}</p><p className="text-sm text-slate-500">{item.quantity} x {formatMoney(item.unitPrice)}</p></div><p className="font-black text-slate-900">{formatMoney(item.totalPrice)}</p></div>)}</div></div>
                  {detail.note && <div><h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Note</h3><p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-line">{detail.note}</p></div>}
                </div>
                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 p-5">
                  {detail.paymentMethod === PAYMENT_TYPE.Cash && detail.paymentStatus === PAYMENT_STATUS.Pending && <button type="button" disabled={actionLoading} onClick={() => void confirmCash()} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50"><Banknote className="h-4 w-4" /> Confirm Cash Payment</button>}
                  {detail.status === ORDER_STATUS.Placed && <button type="button" disabled={actionLoading} onClick={() => void cancelOrder()} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50" aria-label={detail.isWalkInCustomer ? "Cancel walk-in order" : "Cancel order"}>
                    {detail.isWalkInCustomer ? "Cancel Walk-in Order" : "Cancel Order"}
                  </button>}
                  {nextAction && <button type="button" disabled={actionLoading} onClick={() => void updateStatus(nextAction.status)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:bg-slate-300"><CheckCircle2 className="h-4 w-4" /> {actionLoading ? "Updating..." : nextAction.label}</button>}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-6"><div><h2 className="text-xl font-black text-slate-900">Create Walk-in Order</h2><p className="mt-1 text-sm text-slate-500">Select available items from your booth menu</p></div><button type="button" onClick={() => setShowCreate(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100" aria-label="Close create order"><X className="h-5 w-5" /></button></div>
            <div className="space-y-5 p-6">
              {createError && <div className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{createError}</div>}
              <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto rounded-2xl border border-slate-100">
                {menuLoading ? <p className="p-10 text-center text-sm text-slate-400">Loading menu...</p> : menu.length === 0 ? <p className="p-10 text-center text-sm text-slate-400">No available menu items.</p> : menu.map((item) => {
                  const quantity = quantities[item.id] ?? 0;
                  return <div key={item.id} className="flex items-center justify-between gap-4 p-4"><div className="min-w-0"><p className="truncate font-bold text-slate-900">{item.name}</p><p className="text-sm font-semibold text-indigo-600">{formatMoney(item.price)}</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => setQuantities((current) => ({ ...current, [item.id]: Math.max(0, quantity - 1) }))} className="h-8 w-8 rounded-lg border border-slate-200 font-bold text-slate-600">-</button><span className="w-8 text-center font-bold">{quantity}</span><button type="button" onClick={() => setQuantities((current) => ({ ...current, [item.id]: Math.min(100, quantity + 1) }))} className="h-8 w-8 rounded-lg bg-indigo-600 font-bold text-white">+</button></div></div>;
                })}
              </div>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="Order note (optional)" className="min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500" />
              <div><p className="mb-2 text-sm font-bold text-slate-700">Payment method</p><div className="grid grid-cols-2 gap-3">{[{ value: PAYMENT_TYPE.Cash, label: "Cash" }, { value: PAYMENT_TYPE.Online, label: "Online payment" }].map((method) => <button key={method.value} type="button" onClick={() => setPaymentMethod(method.value)} className={`rounded-xl border p-3 text-sm font-bold ${paymentMethod === method.value ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600"}`}>{method.label}</button>)}</div></div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-900 p-5 text-white"><div><p className="text-xs text-slate-300">{selectedItems.length} selected items</p><p className="text-xl font-black">{formatMoney(createTotal)}</p></div><button type="button" disabled={actionLoading || selectedItems.length === 0} onClick={() => void createOrder()} className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-bold hover:bg-indigo-400 disabled:bg-slate-600">{actionLoading ? "Creating..." : "Create Order"}</button></div>
            </div>
          </div>
        </div>
      )}

      {paymentUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl"><CheckCircle2 className="mx-auto h-12 w-12 text-indigo-600" /><h2 className="mt-4 text-xl font-black text-slate-900">Complete Payment</h2><p className="mt-2 text-sm text-slate-500">Open the secure payment page to complete this order.</p><div className="mt-6 flex gap-3"><button type="button" onClick={() => setPaymentUrl("")} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600">Close</button><a href={paymentUrl} target="_blank" rel="noreferrer" className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white">Complete Payment</a></div></div>
        </div>
      )}
    </div>
  );
}
