"use client";

import {
  Calendar,
  DollarSign,
  MapPin,
  MessageSquareWarning,
  RefreshCw,
  Store,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { adminBoothService } from "@/application/features/admin/adminBoothService";
import { adminComplaintService, ComplaintStatus } from "@/application/features/admin/adminComplaintService";
import {
  adminDashboardService,
  DashboardStatsDto,
  RevenueChartDto,
} from "@/application/features/admin/adminDashboardService";
import type { Booth, Complaint } from "@/shared/types";
import { getErrorMessage } from "@/shared/errors/errorMapper";

type DateRange = "week" | "month" | "year";
type ChartView = "revenue" | "newBooths";

interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  subColor: string;
  icon: React.ReactNode;
  iconGradient: string;
  glowColor: string;
}

const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const emptyStats: DashboardStatsDto = {
  totalUsers: 0,
  totalMarkets: 0,
  totalBooths: 0,
  totalRevenue: 0,
  newBooths: 0,
  newReviews: 0,
  newComplaints: 0,
  totalSubscriptions: 0,
  activeSubscriptions: 0,
  newSubscriptions: 0,
};

function KpiCard({ label, value, sub, subColor, icon, iconGradient, glowColor }: KpiCardProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-xl p-5 transition-all h-full flex flex-col"
      style={{
        background: "#FFFFFF",
        border: hovered ? "1px solid #D1D5DB" : "1px solid #E5E7EB",
        boxShadow: hovered
          ? "0 12px 32px rgba(0,0,0,0.06), 0 0 0 1px rgba(17,24,39,0.06)"
          : "0 4px 18px rgba(15,23,42,0.06)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      <div className="flex items-start justify-between mb-3 flex-1">
        <div className="min-h-[3.5rem]">
          <p className="text-xs mb-1" style={{ color: "#64748B" }}>{label}</p>
          <p className="text-2xl font-semibold" style={{ color: "#111827" }}>{value}</p>
          <p className="text-xs mt-1" style={{ color: subColor }}>{sub}</p>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconGradient, boxShadow: `0 0 16px ${glowColor}` }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function toUtcIso(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString();
}

function getISOWeekYear(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}

function getISOWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getMondayOfWeek(isoYear: number, isoWeek: number) {
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
  const targetMonday = new Date(week1Monday);
  targetMonday.setUTCDate(week1Monday.getUTCDate() + (isoWeek - 1) * 7);
  return targetMonday;
}

function getISOWeeksInYear(year: number) {
  return getISOWeekNumber(new Date(Date.UTC(year, 11, 28)));
}

function getAvailableWeeks(isoYear: number) {
  const currentISOYear = getISOWeekYear(new Date());
  const currentWeek = getISOWeekNumber(new Date());
  const maxWeek = isoYear === currentISOYear ? currentWeek : getISOWeeksInYear(isoYear);
  return Array.from({ length: maxWeek }, (_, i) => i + 1);
}

const isoWeekYearOptions = (() => {
  const currentISOYear = getISOWeekYear(new Date());
  return Array.from({ length: 4 }, (_, i) => currentISOYear - i);
})();

function formatRevenue(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)} K`;
  return value.toLocaleString("en-US");
}

export function Dashboard() {
  const now = useMemo(() => new Date(), []);
  const [dateRange, setDateRange] = useState<DateRange>("month");
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedMonthYear, setSelectedMonthYear] = useState(now.getFullYear());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedWeek, setSelectedWeek] = useState(() => getISOWeekNumber(now));
  const [selectedWeekYear, setSelectedWeekYear] = useState(() => getISOWeekYear(now));
  const [chartView, setChartView] = useState<ChartView>("revenue");
  const [stats, setStats] = useState<DashboardStatsDto>(emptyStats);
  const [chartData, setChartData] = useState<RevenueChartDto[]>([]);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [pendingComplaintsTotal, setPendingComplaintsTotal] = useState(0);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [pendingReloadKey, setPendingReloadKey] = useState(0);

  const availableYears = useMemo(
    () => Array.from({ length: 4 }, (_, index) => now.getFullYear() - index),
    [now],
  );

  const period = useMemo(() => {
    if (dateRange === "week") {
      const monday = getMondayOfWeek(selectedWeekYear, selectedWeek);
      const nextMonday = new Date(monday);
      nextMonday.setUTCDate(monday.getUTCDate() + 7);
      return {
        startDate: monday.toISOString(),
        endDate: nextMonday.toISOString(),
        granularity: "day" as const,
        label: `Week ${selectedWeek}, ${selectedWeekYear}`,
      };
    }

    if (dateRange === "month") {
      const start = new Date(selectedMonthYear, selectedMonth, 1);
      const end = new Date(selectedMonthYear, selectedMonth + 1, 1);
      return {
        startDate: toUtcIso(start),
        endDate: toUtcIso(end),
        granularity: "day" as const,
        label: `${months[selectedMonth]} ${selectedMonthYear}`,
      };
    }

    return {
      startDate: toUtcIso(new Date(selectedYear, 0, 1)),
      endDate: toUtcIso(new Date(selectedYear + 1, 0, 1)),
      granularity: "month" as const,
      label: `Year ${selectedYear}`,
    };
  }, [dateRange, selectedMonth, selectedMonthYear, selectedYear, selectedWeek, selectedWeekYear]);

  useEffect(() => {
    let mounted = true;
    Promise.resolve()
      .then(() => {
        if (!mounted) return null;
        setLoading(true);
        setError(null);
        return Promise.all([
          adminDashboardService.getStats(period),
          adminDashboardService.getRevenueChart(period),
        ]);
      })
      .then(responses => {
        if (!responses) return;
        const [statsResponse, chartResponse] = responses;
        if (!mounted) return;
        setStats(statsResponse.data ?? emptyStats);
        setChartData(chartResponse.data ?? []);
      })
      .catch((requestError: unknown) => {
        if (!mounted) return;
        setStats(emptyStats);
        setChartData([]);
        setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [period, reloadKey]);

  useEffect(() => {
    let mounted = true;
    Promise.resolve()
      .then(() => {
        if (!mounted) return;
        setPendingLoading(true);
        setPendingError(null);
        return Promise.allSettled([
          adminBoothService.getAllBooths(1, 10),
          adminComplaintService.getAllComplaints(1, 6, { status: ComplaintStatus.Pending }),
        ]);
      })
      .then((results) => {
        if (!mounted || !results) return;
        const [boothResponse, complaintResponse] = results;
        if (boothResponse.status === "fulfilled") {
          setBooths(boothResponse.value.data?.items ?? []);
        }
        if (complaintResponse.status === "fulfilled") {
          setComplaints(complaintResponse.value.data?.items ?? []);
          setPendingComplaintsTotal(complaintResponse.value.data?.total ?? 0);
        } else {
          setComplaints([]);
          setPendingComplaintsTotal(0);
          setPendingError(getErrorMessage(complaintResponse.reason));
        }
      })
      .finally(() => {
        if (mounted) setPendingLoading(false);
      });
    return () => { mounted = false; };
  }, [pendingReloadKey]);

  const recentBooths = useMemo(() => booths.slice(0, 6), [booths]);
  const pendingComplaints = useMemo(() => complaints.slice(0, 6), [complaints]);

  const chartConfig = {
    revenue: { label: "Subscription Revenue", shortLabel: "Revenue", color: "#111827", dataKey: "revenue" },
    newBooths: { label: "Newly Registered Booths", shortLabel: "New Booths", color: "#10B981", dataKey: "newBooths" },
  } as const;

  const formatChartDate = (value: string) => {
    const date = new Date(value);
    if (period.granularity === "month") return months[date.getUTCMonth()];
    return `${date.getUTCDate()}/${date.getUTCMonth() + 1}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Platform analytics by period</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={dateRange}
              onChange={event => setDateRange(event.target.value as DateRange)}
              className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </div>

          {dateRange === "week" ? (
            <>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedWeek}
                  onChange={event => setSelectedWeek(Number(event.target.value))}
                  className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
                >
                  {getAvailableWeeks(selectedWeekYear).map(week => <option key={week} value={week}>Week {week}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedWeekYear}
                  onChange={event => {
                    const newYear = Number(event.target.value);
                    setSelectedWeekYear(newYear);
                    const maxWeek = getAvailableWeeks(newYear).length;
                    setSelectedWeek(prev => Math.min(prev, maxWeek));
                  }}
                  className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
                >
                  {isoWeekYearOptions.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
            </>
          ) : dateRange === "month" ? (
            <>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedMonth}
                  onChange={event => setSelectedMonth(Number(event.target.value))}
                  className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
                >
                  {months.map((month, index) => <option key={month} value={index}>{month}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedMonthYear}
                  onChange={event => setSelectedMonthYear(Number(event.target.value))}
                  className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
                >
                  {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={selectedYear}
                onChange={event => setSelectedYear(Number(event.target.value))}
                className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
              >
                {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setReloadKey(value => value + 1)} className="flex items-center gap-2 font-semibold">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Subscription Revenue" value={loading ? "..." : formatRevenue(stats.totalRevenue)} sub={period.label} subColor="#818CF8" icon={<DollarSign className="w-5 h-5 text-white" />} iconGradient="linear-gradient(135deg, #6366F1, #4F46E5)" glowColor="rgba(99,102,241,0.4)" />
        <KpiCard label="Total Night Markets" value={loading ? "..." : String(stats.totalMarkets)} sub="Markets available by period end" subColor="#2DD4BF" icon={<MapPin className="w-5 h-5 text-white" />} iconGradient="linear-gradient(135deg, #14B8A6, #0D9488)" glowColor="rgba(20,184,166,0.4)" />
        <KpiCard label="Total Booths" value={loading ? "..." : stats.totalBooths.toLocaleString()} sub={`+${stats.newBooths} new this period`} subColor="#34D399" icon={<Store className="w-5 h-5 text-white" />} iconGradient="linear-gradient(135deg, #10B981, #059669)" glowColor="rgba(16,185,129,0.4)" />
        <KpiCard label="New Complaints" value={loading ? "..." : String(stats.newComplaints)} sub="This period" subColor="#F87171" icon={<MessageSquareWarning className="w-5 h-5 text-white" />} iconGradient="linear-gradient(135deg, #EF4444, #DC2626)" glowColor="rgba(239,68,68,0.4)" />
      </div>

      <div className="rounded-xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 4px 18px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 style={{ color: "#111827" }}>{chartConfig[chartView].label}</h3>
            <p className="text-sm mt-0.5" style={{ color: "#475569" }}>{period.label}</p>
          </div>
          <div className="flex items-center gap-2">
            {(Object.keys(chartConfig) as ChartView[]).map(view => (
              <button
                key={view}
                onClick={() => setChartView(view)}
                className="px-3 py-1.5 rounded-lg text-xs transition-all"
                style={chartView === view ? { background: "#2563EB", color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" } : { background: "#FFFFFF", color: "#64748B", border: "1px solid #E5E7EB" }}
              >
                {chartConfig[view].shortLabel}
              </button>
            ))}
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 15 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="date" tickFormatter={formatChartDate} axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
              <YAxis tickFormatter={value => chartView === "revenue" ? formatRevenue(Number(value)) : String(value)} axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
              <Tooltip labelFormatter={label => new Date(String(label)).toLocaleDateString("en-US")} formatter={value => chartView === "revenue" ? `${Number(value).toLocaleString("en-US")} â‚«` : Number(value).toLocaleString("en-US")} />
              <Line type="monotone" dataKey={chartConfig[chartView].dataKey} stroke={chartConfig[chartView].color} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 4px 18px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center justify-between mb-4"><h3 style={{ color: "#111827" }}>Recent Booths</h3><span className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>{recentBooths.length} latest</span></div>
          <div className="space-y-2">
            {recentBooths.length === 0 ? <p className="text-sm text-center py-6 text-gray-500">No data available</p> : recentBooths.map(booth => (
              <div key={booth.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-50"><Store className="w-4 h-4 text-emerald-600" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm truncate text-gray-900">{booth.boothName || "No data available"}</p><p className="text-xs truncate text-gray-500">{booth.boothOwnerName || booth.boothOwnerEmail || "No owner info"}</p></div>
                <span className="text-xs text-gray-500">{booth.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 4px 18px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center justify-between mb-4"><h3 style={{ color: "#111827" }}>Pending Complaints</h3><span className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>{pendingComplaintsTotal} pending</span></div>
          <div className="space-y-2">
            {pendingError ? (
              <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span>{pendingError}</span>
                <button onClick={() => setPendingReloadKey(v => v + 1)} className="flex items-center gap-2 font-semibold">
                  <RefreshCw className="h-4 w-4" /> Retry
                </button>
              </div>
            ) : pendingLoading ? (
              <p className="text-sm text-center py-6 text-gray-400">Loading...</p>
            ) : pendingComplaints.length === 0 ? (
              <p className="text-sm text-center py-6 text-gray-500">No pending complaints</p>
            ) : pendingComplaints.map(complaint => (
              <div key={complaint.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200">
                <div className="flex-1 min-w-0"><p className="text-sm truncate text-gray-900">{complaint.title || "Untitled complaint"}</p><p className="text-xs truncate text-gray-500">{complaint.description || "No data available"}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
