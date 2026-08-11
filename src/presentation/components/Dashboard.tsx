"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Calendar,
  Lock,
  Package,
  RefreshCw,
  ShoppingBag,
  Star,
  TrendingUp,
} from "lucide-react";
import { useBooth } from "@/application/context/BoothContext";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  boothDashboardService,
  type BoothDashboard,
  type DashboardRange,
} from "@/application/features/dashboard/boothDashboardService";
import { getErrorMessage } from "@/shared/errors/errorMapper";

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

const statusMeta: Record<string, { label: string; className: string }> = {
  Placed: { label: "New", className: "bg-blue-50 text-blue-700" },
  Preparing: { label: "Preparing", className: "bg-amber-50 text-amber-700" },
  ReadyForPickup: { label: "Ready", className: "bg-violet-50 text-violet-700" },
  Completed: { label: "Completed", className: "bg-emerald-50 text-emerald-700" },
  Cancelled: { label: "Cancelled", className: "bg-red-50 text-red-700" },
  Underpaid: { label: "Underpaid", className: "bg-orange-50 text-orange-700" },
  Refunded: { label: "Refunded", className: "bg-slate-100 text-slate-600" },
};

function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta[status] ?? { label: status, className: "bg-slate-100 text-slate-600" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${meta.className}`}>{meta.label}</span>;
}

function UpgradePrompt({ packageName, feature }: { packageName: string; feature: string }) {
  return (
    <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center gap-2 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 p-6">
      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
        <Lock className="w-5 h-5 text-indigo-600" />
      </div>
      <p className="text-sm font-bold text-gray-900">{feature} is locked</p>
      <p className="text-xs text-gray-500 max-w-[260px]">
        Upgrade to <span className="font-semibold text-indigo-600">{packageName}</span> to unlock this insight.
      </p>
    </div>
  );
}

const rangeLabels: Record<DashboardRange, { revenueTitle: string; periodLabel: string }> = {
  today: { revenueTitle: "Today's Revenue", periodLabel: "Today" },
  week: { revenueTitle: "Weekly Revenue", periodLabel: "Last 7 days" },
  month: { revenueTitle: "Monthly Revenue", periodLabel: "Last 30 days" },
  year: { revenueTitle: "Yearly Revenue", periodLabel: "Last 12 months" },
};

export function Dashboard() {
  const { selectedBooth, loading: boothLoading, notFound: boothNotFound, error: boothError, refreshBooths } = useBooth();
  const [range, setRange] = useState<DashboardRange>("week");
  const [dashboard, setDashboard] = useState<BoothDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (signal?: AbortSignal) => {
    if (!selectedBooth) {
      setDashboard(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await boothDashboardService.getDashboard(range, signal);
      setDashboard(response.data);
    } catch (loadError) {
      if (!signal?.aborted) {
        setDashboard(null);
        setError(getErrorMessage(loadError));
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [range, selectedBooth]);

  useEffect(() => {
    if (boothLoading) return;
    const controller = new AbortController();
    void Promise.resolve().then(() => loadDashboard(controller.signal));
    return () => controller.abort();
  }, [boothLoading, loadDashboard]);

  if (boothLoading) {
    return <div className="p-8 text-sm text-slate-500">Loading your booth workspace...</div>;
  }

  if (!selectedBooth) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><ShoppingBag className="h-7 w-7" /></div>
        <h1 className="text-xl font-bold text-slate-900">Your booth is not assigned yet</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">A Market Owner will create and assign a booth slot to your account. Once assigned, your dashboard, menu, orders, and analytics will appear here.</p>
        {boothError && !boothNotFound && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{boothError}</p>}
        <button onClick={() => void refreshBooths()} className="mt-6 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Check again</button>
      </div>
    );
  }

  const summary = dashboard?.summary;
  const tier = dashboard?.entitlements.analyticsTier ?? "Free";
  const isLockedForCharts = dashboard != null && tier === "Free";

  const stats = summary
    ? [
        {
          title: "Revenue (Paid)",
          value: formatMoney(summary.totalRevenue),
          subtitle: `${summary.totalOrders} paid completed order${summary.totalOrders === 1 ? "" : "s"}`,
          icon: TrendingUp,
          color: "text-emerald-500",
          bg: "bg-emerald-50",
        },
        {
          title: "Orders",
          value: String(summary.placedOrders),
          subtitle: `${summary.completedOrders} completed - ${summary.cancelledOrders} cancelled`,
          icon: Package,
          color: "text-indigo-600",
          bg: "bg-indigo-50",
        },
        {
          title: "Avg Order Value",
          value: summary.totalOrders > 0 ? formatMoney(summary.averageOrderValue) : "No data",
          subtitle: "Across paid orders",
          icon: ShoppingBag,
          color: "text-sky-500",
          bg: "bg-sky-50",
        },
        {
          title: "Rating",
          value: summary.reviewCount > 0 ? summary.averageRating.toFixed(1) : "No data",
          subtitle: summary.reviewCount > 0 ? `From ${summary.reviewCount} visible reviews` : "No reviews yet",
          icon: Star,
          color: "text-orange-500",
          bg: "bg-orange-50",
        },
      ]
    : [];

  const revenueData = (dashboard?.revenueTrend ?? []).map((point) => ({
    name: point.label,
    revenue: point.revenue,
    orders: point.orderCount,
  }));

  const recentOrders = dashboard?.recentOrders ?? [];
  const topFoods = dashboard?.topFoods ?? [];

  return (
    <div className="p-8 pb-12 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Booth Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">Monitor your booth&apos;s sales and performance</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={range}
              onChange={(event) => setRange(event.target.value as DashboardRange)}
              className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
              aria-label="Select dashboard period"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600">
            {rangeLabels[range].periodLabel}
          </div>
          <button
            onClick={() => void loadDashboard()}
            disabled={loading}
            className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm font-medium text-red-700">{error}</p>
          <button
            onClick={() => void loadDashboard()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg"
          >
            Try Again
          </button>
        </div>
      )}

      {!error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {loading && !dashboard
              ? Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="bg-white rounded-xl p-5 border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] animate-pulse">
                    <div className="h-4 w-24 bg-gray-100 rounded" />
                    <div className="h-7 w-32 bg-gray-100 rounded mt-3" />
                    <div className="h-3 w-28 bg-gray-100 rounded mt-4" />
                  </div>
                ))
              : stats.map((stat) => (
                  <div key={stat.title} className="bg-white rounded-xl p-5 border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
                      </div>
                      <div className={`p-2 rounded-lg ${stat.bg}`}>
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 font-medium">{stat.subtitle}</p>
                  </div>
                ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-6">
            <h3 className="text-base font-bold text-gray-900 mb-6">{rangeLabels[range].revenueTitle}</h3>
            {isLockedForCharts ? (
              <UpgradePrompt packageName="Booth Boost" feature="Revenue trend" />
            ) : (
              <div className="h-[250px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} dx={-10} tickFormatter={(value) => `${Number(value) / 1000}K`} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} formatter={(value) => [`${Number(value ?? 0).toLocaleString()} VND`, "Revenue"]} />
                    <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 pointer-events-none bg-white/60">Loading...</div>
                )}
                {!loading && revenueData.every((point) => point.revenue === 0) && (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 pointer-events-none">No paid revenue in this period yet</div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
              <div className="p-5 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Recent Orders</h3>
                  <p className="text-xs text-gray-500 mt-1">The latest 10 orders received by your booth</p>
                </div>
                <span className="text-xs font-semibold text-gray-500">
                  {loading ? "Loading..." : `${recentOrders.length} order${recentOrders.length === 1 ? "" : "s"}`}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Order</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3 whitespace-nowrap">Total</th>
                      <th className="px-4 py-3 rounded-tr-lg text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">
                          {loading ? "Loading orders..." : "No orders yet"}
                        </td>
                      </tr>
                    )}
                    {recentOrders.map((order) => (
                      <tr key={order.orderId} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-3 font-semibold text-gray-900">#{order.orderCode}</td>
                        <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold ${order.isPaid ? "text-emerald-600" : "text-gray-400"}`}>
                            {order.isPaid ? "Paid" : "Unpaid"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{formatMoney(order.finalAmount)}</td>
                        <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">{formatDateTime(order.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-6">
              <h3 className="text-base font-bold text-gray-900 mb-5">Top Selling Items</h3>
              {isLockedForCharts ? (
                <UpgradePrompt packageName="Booth Boost" feature="Best-selling analytics" />
              ) : topFoods.length === 0 ? (
                <div className="min-h-[180px] flex items-center justify-center text-sm text-gray-500 text-center">
                  {loading ? "Loading..." : "No completed sales in this period yet"}
                </div>
              ) : (
                <div className="space-y-4">
                  {topFoods.map((food, index) => (
                    <div key={food.foodItemId} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{food.foodName}</p>
                        <p className="text-xs text-gray-500">{food.quantitySold} sold</p>
                      </div>
                      <p className="text-xs font-bold text-gray-700 whitespace-nowrap">{formatMoney(food.revenue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
