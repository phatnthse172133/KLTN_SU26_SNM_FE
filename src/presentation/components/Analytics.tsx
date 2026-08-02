"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Award,
  BarChart3,
  Calendar,
  Clock3,
  CheckCircle2,
  Gift,
  Lock,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
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
  type BoothAnalytics,
  type BoothDashboard,
  type DashboardRange,
  type PromotionPerformance,
  type RevenueSeries,
} from "@/application/features/dashboard/boothDashboardService";
import { getErrorMessage, isAppError } from "@/shared/errors/errorMapper";
import type { BaseResponse } from "@/shared/types";

const LOCKED_CODES = new Set([
  "ADVANCED_ANALYTICS_NOT_INCLUDED",
  "FEATURED_ANALYTICS_NOT_INCLUDED",
  "ANALYTICS_NOT_ALLOWED",
  "BOOTH_SUBSCRIPTION_REQUIRED",
  "BOOTH_PACKAGE_REQUIRED",
]);

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));

const orderStatusMeta: Record<string, { label: string; barClass: string }> = {
  Placed: { label: "New", barClass: "bg-blue-500" },
  Preparing: { label: "Preparing", barClass: "bg-amber-500" },
  ReadyForPickup: { label: "Ready", barClass: "bg-violet-500" },
  Completed: { label: "Completed", barClass: "bg-emerald-500" },
  Cancelled: { label: "Cancelled", barClass: "bg-red-500" },
  Underpaid: { label: "Underpaid", barClass: "bg-orange-500" },
  Refunded: { label: "Refunded", barClass: "bg-slate-400" },
};

const promotionStatusClass: Record<string, string> = {
  Scheduled: "bg-blue-50 text-blue-700",
  Active: "bg-emerald-50 text-emerald-700",
  Inactive: "bg-amber-50 text-amber-700",
  Expired: "bg-slate-100 text-slate-600",
  Suspended: "bg-red-50 text-red-700",
};

interface SectionState<T> {
  data: T | null;
  loading: boolean;
  error: string;
  locked: boolean;
}

function useSection<T>(fetcher: (signal?: AbortSignal) => Promise<BaseResponse<T>>, enabled: boolean) {
  const [state, setState] = useState<SectionState<T>>({ data: null, loading: enabled, error: "", locked: false });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void Promise.resolve().then(() => {
      if (controller.signal.aborted) return;
      setState((prev) => ({ ...prev, loading: true, error: "", locked: false }));
      return fetcher(controller.signal)
        .then((response) => {
          if (!controller.signal.aborted) setState({ data: response.data, loading: false, error: "", locked: false });
        })
        .catch((error) => {
          if (controller.signal.aborted) return;
          if (isAppError(error) && error.code && LOCKED_CODES.has(error.code)) {
            setState({ data: null, loading: false, error: "", locked: true });
          } else {
            setState({ data: null, loading: false, error: getErrorMessage(error), locked: false });
          }
        });
    });
    return () => controller.abort();
  }, [fetcher, enabled, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);
  return { ...state, reload };
}

function UpgradePrompt({ packageName, feature }: { packageName: string; feature: string }) {
  return (
    <div className="min-h-[200px] h-full flex flex-col items-center justify-center text-center gap-2 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 p-6">
      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
        <Lock className="w-5 h-5 text-indigo-600" />
      </div>
      <p className="text-sm font-bold text-gray-900">{feature} is locked</p>
      <p className="text-xs text-gray-500 max-w-[280px]">
        Upgrade to <span className="font-semibold text-indigo-600">{packageName}</span> to unlock this insight.
      </p>
    </div>
  );
}

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-[200px] flex flex-col items-center justify-center gap-3 text-center rounded-xl border border-red-100 bg-red-50/60 p-6">
      <AlertCircle className="w-7 h-7 text-red-500" />
      <p className="text-sm font-medium text-red-700">{message}</p>
      <button onClick={onRetry} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg">
        Try Again
      </button>
    </div>
  );
}

function SectionLoading() {
  return (
    <div className="min-h-[200px] flex items-center justify-center text-sm text-gray-400">
      Loading...
    </div>
  );
}

function SectionEmpty({ text }: { text: string }) {
  return (
    <div className="min-h-[200px] flex items-center justify-center text-sm text-gray-500 text-center">
      {text}
    </div>
  );
}

export function Analytics() {
  const [range, setRange] = useState<DashboardRange>("month");
  const [seriesDays, setSeriesDays] = useState(14);

  const fetchOverview = useCallback(
    (signal?: AbortSignal) => boothDashboardService.getDashboard(range, signal),
    [range]
  );
  const overview = useSection<BoothDashboard>(fetchOverview, true);

  const tier = overview.data?.entitlements.analyticsTier;
  const tierKnown = tier != null;
  const growthLocked = tierKnown && tier === "Free";
  const featuredLocked = tierKnown && tier !== "Featured";
  const probeAllowed = !tierKnown && !overview.loading;

  const fetchSeries = useCallback(
    (signal?: AbortSignal) => boothDashboardService.getRevenueSeries(seriesDays, signal),
    [seriesDays]
  );
  const series = useSection<RevenueSeries>(fetchSeries, (tierKnown && !growthLocked) || probeAllowed);

  const fetchAnalytics = useCallback(
    (signal?: AbortSignal) => boothDashboardService.getAnalytics(range, signal),
    [range]
  );
  const analytics = useSection<BoothAnalytics>(fetchAnalytics, (tierKnown && !growthLocked) || probeAllowed);

  const fetchPromotions = useCallback(
    (signal?: AbortSignal) => boothDashboardService.getPromotionPerformance(signal),
    []
  );
  const promotions = useSection<PromotionPerformance>(fetchPromotions, (tierKnown && !featuredLocked) || probeAllowed);

  const seriesLocked = growthLocked || series.locked;
  const analyticsLocked = growthLocked || analytics.locked;
  const promotionsLocked = featuredLocked || promotions.locked;

  const breakdown = overview.data?.orderStatusBreakdown ?? [];
  const breakdownTotal = breakdown.reduce((sum, row) => sum + row.count, 0);

  const seriesData = (series.data?.points ?? []).map((point) => ({
    name: point.label,
    revenue: point.revenue,
    orders: point.orderCount,
  }));

  const peakHourData = (analytics.data?.peakHours ?? []).map((bucket) => ({
    name: bucket.label,
    orders: bucket.orderCount,
  }));

  const topByQuantity = analytics.data?.topFoods ?? [];
  const topByRevenue = analytics.data?.topFoodsByRevenue ?? [];
  const orderTrendData = (analytics.data?.orderTrend ?? []).map((point) => ({
    name: point.label,
    orders: point.orderCount,
  }));
  const ratingTrendData = (analytics.data?.ratingTrend ?? []).map((point) => ({
    name: point.label,
    rating: point.averageRating,
    reviews: point.reviewCount,
  }));
  const summary = analytics.data?.summary;

  return (
    <div className="p-8 pb-12 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales &amp; Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">Understand how your booth performs over time</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tierKnown && (
            <div className="flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700">
              <Sparkles className="w-3.5 h-3.5" />
              {tier === "Free" ? "Booth Basic plan" : tier === "Growth" ? "Booth Boost plan" : "Booth Featured plan"}
            </div>
          )}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={range}
              onChange={(event) => setRange(event.target.value as DashboardRange)}
              className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
              aria-label="Select analytics period"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {analyticsLocked ? (
        <UpgradePrompt packageName="Booth Boost" feature="Performance summary" />
      ) : analytics.error ? (
        <SectionError message={analytics.error} onRetry={analytics.reload} />
      ) : !summary ? (
        <SectionLoading />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Paid Revenue", value: formatMoney(summary.totalRevenue), detail: `${summary.totalOrders} completed paid orders`, icon: TrendingUp, iconClass: "text-emerald-600", bgClass: "bg-emerald-50" },
            { label: "Customers", value: String(summary.totalCustomers), detail: "Unique customers in this period", icon: Users, iconClass: "text-sky-600", bgClass: "bg-sky-50" },
            { label: "Avg Order Value", value: summary.totalOrders > 0 ? formatMoney(summary.averageOrderValue) : "No data", detail: "Across completed paid orders", icon: ShoppingBag, iconClass: "text-indigo-600", bgClass: "bg-indigo-50" },
            { label: "Rating", value: summary.reviewCount > 0 ? summary.averageRating.toFixed(1) : "No data", detail: summary.reviewCount > 0 ? `${summary.reviewCount} visible reviews` : "No reviews yet", icon: Star, iconClass: "text-amber-500", bgClass: "bg-amber-50" },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`rounded-lg p-2 ${card.bgClass}`}>
                  <card.icon className={`h-5 w-5 ${card.iconClass}`} />
                </div>
              </div>
              <p className="mt-3 text-xs font-medium text-gray-500">{card.detail}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h3 className="text-base font-bold text-gray-900">Revenue Over Time</h3>
            <span className="text-xs text-gray-400 font-medium">Paid orders only</span>
          </div>
          {!seriesLocked && (
            <div className="flex items-center gap-2">
              <select
                value={seriesDays}
                onChange={(event) => setSeriesDays(Number(event.target.value))}
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 outline-none cursor-pointer"
                aria-label="Select revenue series range"
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={60}>Last 60 days</option>
                <option value={90}>Last 90 days</option>
              </select>
              <button
                onClick={series.reload}
                disabled={series.loading}
                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                aria-label="Reload revenue series"
              >
                <RefreshCw className={`w-4 h-4 ${series.loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          )}
        </div>
        {seriesLocked ? (
          <UpgradePrompt packageName="Booth Boost" feature="Revenue analytics" />
        ) : series.error ? (
          <SectionError message={series.error} onRetry={series.reload} />
        ) : !series.data ? (
          <SectionLoading />
        ) : (
          <>
            <div className="flex flex-wrap gap-6 mb-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 font-medium">Total revenue</p>
                <p className="font-bold text-gray-900">{formatMoney(series.data.totalRevenue)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Paid orders</p>
                <p className="font-bold text-gray-900">{series.data.totalOrders}</p>
              </div>
            </div>
            <div className="h-[260px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={seriesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} dx={-10} tickFormatter={(value) => `${Number(value) / 1000}K`} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} formatter={(value) => [`${Number(value ?? 0).toLocaleString()} VND`, "Revenue"]} />
                  <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
              {seriesData.every((point) => point.revenue === 0) && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 pointer-events-none">No paid revenue in this range yet</div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <h3 className="text-base font-bold text-gray-900">Order Trend</h3>
          </div>
          {analyticsLocked ? (
            <UpgradePrompt packageName="Booth Boost" feature="Order trend" />
          ) : analytics.error ? (
            <SectionError message={analytics.error} onRetry={analytics.reload} />
          ) : !analytics.data ? (
            <SectionLoading />
          ) : orderTrendData.every((point) => point.orders === 0) ? (
            <SectionEmpty text="No orders in this period yet" />
          ) : (
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} dy={8} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} />
                  <Tooltip formatter={(value) => [`${Number(value ?? 0)} orders`, "Orders"]} />
                  <Bar dataKey="orders" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-6">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <h3 className="text-base font-bold text-gray-900">Rating &amp; Completion</h3>
            </div>
            {analytics.data?.conversion && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {analytics.data.conversion.completionRate.toFixed(1)}% completed
              </span>
            )}
          </div>
          {analyticsLocked ? (
            <UpgradePrompt packageName="Booth Boost" feature="Rating trend" />
          ) : analytics.error ? (
            <SectionError message={analytics.error} onRetry={analytics.reload} />
          ) : !analytics.data ? (
            <SectionLoading />
          ) : ratingTrendData.every((point) => point.reviews === 0) ? (
            <SectionEmpty text="No reviews in this period yet" />
          ) : (
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ratingTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} dy={8} />
                  <YAxis domain={[0, 5]} allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} />
                  <Tooltip formatter={(value) => [Number(value ?? 0).toFixed(1), "Average rating"]} />
                  <Line type="monotone" dataKey="rating" stroke="#F59E0B" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-6">
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <h3 className="text-base font-bold text-gray-900">Order Status Breakdown</h3>
            </div>
            <button
              onClick={overview.reload}
              disabled={overview.loading}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              aria-label="Reload order breakdown"
            >
              <RefreshCw className={`w-4 h-4 ${overview.loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          {overview.error ? (
            <SectionError message={overview.error} onRetry={overview.reload} />
          ) : !overview.data ? (
            <SectionLoading />
          ) : breakdownTotal === 0 ? (
            <SectionEmpty text="No orders in this period yet" />
          ) : (
            <div className="space-y-4">
              {breakdown.map((row) => {
                const meta = orderStatusMeta[row.status] ?? { label: row.status, barClass: "bg-gray-400" };
                const percent = breakdownTotal > 0 ? Math.round((row.count / breakdownTotal) * 100) : 0;
                return (
                  <div key={row.status}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-gray-700">{meta.label}</span>
                      <span className="text-gray-500 text-xs font-semibold">{row.count} ({percent}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className={`h-full rounded-full ${meta.barClass}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-6">
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-indigo-600" />
              <h3 className="text-base font-bold text-gray-900">Peak Hours</h3>
            </div>
            {!analyticsLocked && (
              <button
                onClick={analytics.reload}
                disabled={analytics.loading}
                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                aria-label="Reload peak hours"
              >
                <RefreshCw className={`w-4 h-4 ${analytics.loading ? "animate-spin" : ""}`} />
              </button>
            )}
          </div>
          {analyticsLocked ? (
            <UpgradePrompt packageName="Booth Boost" feature="Peak-hour analytics" />
          ) : analytics.error ? (
            <SectionError message={analytics.error} onRetry={analytics.reload} />
          ) : !analytics.data ? (
            <SectionLoading />
          ) : peakHourData.length === 0 ? (
            <SectionEmpty text="No completed orders in this period yet" />
          ) : (
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHourData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} dy={8} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} dx={-10} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} formatter={(value) => [`${Number(value ?? 0)} order${Number(value ?? 0) === 1 ? "" : "s"}`, "Orders"]} />
                  <Bar dataKey="orders" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-6">
        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" />
            <h3 className="text-base font-bold text-gray-900">Top Selling Foods</h3>
            <span className="text-xs text-gray-400 font-medium">Completed &amp; paid orders</span>
          </div>
          {!analyticsLocked && (
            <button
              onClick={analytics.reload}
              disabled={analytics.loading}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              aria-label="Reload top selling foods"
            >
              <RefreshCw className={`w-4 h-4 ${analytics.loading ? "animate-spin" : ""}`} />
            </button>
          )}
        </div>
        {analyticsLocked ? (
          <UpgradePrompt packageName="Booth Boost" feature="Best-selling analytics" />
        ) : analytics.error ? (
          <SectionError message={analytics.error} onRetry={analytics.reload} />
        ) : !analytics.data ? (
          <SectionLoading />
        ) : topByQuantity.length === 0 && topByRevenue.length === 0 ? (
          <SectionEmpty text="No completed sales in this period yet" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">By quantity sold</p>
              <div className="space-y-3">
                {topByQuantity.slice(0, 5).map((food, index) => (
                  <div key={food.foodItemId} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{food.foodName}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-700 whitespace-nowrap">{food.quantitySold} sold</p>
                  </div>
                ))}
                {topByQuantity.length === 0 && <p className="text-sm text-gray-500">No data for this period</p>}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">By revenue</p>
              <div className="space-y-3">
                {topByRevenue.slice(0, 5).map((food, index) => (
                  <div key={food.foodItemId} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{food.foodName}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-700 whitespace-nowrap">{formatMoney(food.revenue)}</p>
                  </div>
                ))}
                {topByRevenue.length === 0 && <p className="text-sm text-gray-500">No data for this period</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-6">
        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-indigo-600" />
            <h3 className="text-base font-bold text-gray-900">Promotion &amp; Recommendation Performance</h3>
          </div>
          {!promotionsLocked && (
            <button
              onClick={promotions.reload}
              disabled={promotions.loading}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              aria-label="Reload promotion performance"
            >
              <RefreshCw className={`w-4 h-4 ${promotions.loading ? "animate-spin" : ""}`} />
            </button>
          )}
        </div>
        {promotionsLocked ? (
          <UpgradePrompt packageName="Booth Featured" feature="Promotion & recommendation analytics" />
        ) : promotions.error ? (
          <SectionError message={promotions.error} onRetry={promotions.reload} />
        ) : !promotions.data ? (
          <SectionLoading />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium text-gray-500">Recommendation priority</p>
                <p className="text-lg font-bold text-gray-900 mt-1">x{promotions.data.recommendation.recommendationPriority.toFixed(1)}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium text-gray-500">Featured booth badge</p>
                <p className={`text-lg font-bold mt-1 ${promotions.data.recommendation.featuredBoothActive ? "text-emerald-600" : "text-gray-400"}`}>
                  {promotions.data.recommendation.featuredBoothActive ? "Active" : "Inactive"}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium text-gray-500">Featured food items</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{promotions.data.recommendation.featuredFoodCount}</p>
              </div>
            </div>

            {promotions.data.promotions.length === 0 ? (
              <SectionEmpty text="No promotions created yet" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Promotion</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 whitespace-nowrap">Period</th>
                      <th className="px-4 py-3 text-right">Times Used</th>
                      <th className="px-4 py-3 rounded-tr-lg text-right whitespace-nowrap">Discount Given</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promotions.data.promotions.map((promotion) => (
                      <tr key={promotion.promotionId} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-3 font-semibold text-gray-900">{promotion.title}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${promotionStatusClass[promotion.status] ?? "bg-slate-100 text-slate-600"}`}>
                            {promotion.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">{promotion.usageCount}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">{formatMoney(promotion.discountTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
