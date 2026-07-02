"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Package, Star, TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useBooth } from "@/application/context/BoothContext";
import { reviewService } from "@/application/features/reviews/reviewService";

type DateRange = "today" | "week" | "month" | "year";

const pad = (value: number) => String(value).padStart(2, "0");

const toDateInput = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const getIsoWeekInput = (date: Date) => {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utcDate.getUTCFullYear()}-W${pad(week)}`;
};

const formatDateLabel = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? "No date selected"
    : date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

const formatMonthLabel = (value: string) =>
  new Date(2000, Number(value) - 1, 1).toLocaleDateString("en-US", { month: "long" });

const formatWeekLabel = (value: string) => {
  const [year, weekValue] = value.split("-W");
  return year && weekValue ? `Week ${weekValue}, ${year}` : "No week selected";
};

export function Dashboard() {
  const { selectedBooth, loading: boothLoading } = useBooth();
  const today = useMemo(() => new Date(), []);
  const currentYear = String(today.getFullYear());
  const [dateRange, setDateRange] = useState<DateRange>("today");
  const [selectedDate, setSelectedDate] = useState(() => toDateInput(today));
  const [selectedWeek, setSelectedWeek] = useState(() => getIsoWeekInput(today));
  const [selectedMonth, setSelectedMonth] = useState(() => pad(today.getMonth() + 1));
  const [selectedMonthYear, setSelectedMonthYear] = useState(currentYear);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [reviewTotal, setReviewTotal] = useState<number | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    if (!selectedBooth?.id) {
      setReviewTotal(null);
      return;
    }

    let active = true;
    setReviewLoading(true);
    reviewService
      .getByBooth(selectedBooth.id, 1, 1)
      .then((response) => {
        if (active) setReviewTotal(response.data.total);
      })
      .catch(() => {
        if (active) setReviewTotal(null);
      })
      .finally(() => {
        if (active) setReviewLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedBooth?.id]);

  const periodLabel = dateRange === "today"
    ? formatDateLabel(selectedDate)
    : dateRange === "week"
      ? formatWeekLabel(selectedWeek)
      : dateRange === "month"
        ? `${formatMonthLabel(selectedMonth)} ${selectedMonthYear}`
        : selectedYear;

  const revenueTitle = dateRange === "today"
    ? "Today's Revenue"
    : dateRange === "week"
      ? "Weekly Revenue"
      : dateRange === "month"
        ? "Monthly Revenue"
        : "Yearly Revenue";

  const ratingValue = boothLoading || reviewLoading
    ? "..."
    : selectedBooth?.averageRating != null
      ? selectedBooth.averageRating.toFixed(1)
      : "No data";

  const stats = [
    {
      title: "Subscription Revenue",
      value: "No data",
      subtitle: "No data available",
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    },
    {
      title: "Orders",
      value: "No data",
      subtitle: "No data available",
      icon: Package,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "Rating",
      value: ratingValue,
      subtitle: reviewTotal == null ? "No data available" : `From ${reviewTotal} visible reviews`,
      icon: Star,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
  ];

  const yearOptions = Array.from({ length: 3 }, (_, index) => String(today.getFullYear() - 2 + index));
  const revenueData: { name: string; revenue: number }[] = [];

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
              value={dateRange}
              onChange={(event) => setDateRange(event.target.value as DateRange)}
              className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
              aria-label="Select dashboard period"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            {dateRange === "today" && (
              <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer" />
            )}
            {dateRange === "week" && (
              <input type="week" value={selectedWeek} onChange={(event) => setSelectedWeek(event.target.value)} className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer" />
            )}
            {dateRange === "month" && (
              <select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer" aria-label="Select month">
                {Array.from({ length: 12 }, (_, index) => pad(index + 1)).map((month) => (
                  <option key={month} value={month}>{formatMonthLabel(month)}</option>
                ))}
              </select>
            )}
            {dateRange === "year" && (
              <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)} className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer" aria-label="Select year">
                {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            )}
          </div>

          {dateRange === "month" && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select value={selectedMonthYear} onChange={(event) => setSelectedMonthYear(event.target.value)} className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer" aria-label="Select month year">
                {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600">
            {periodLabel}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
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
        <h3 className="text-base font-bold text-gray-900 mb-6">{revenueTitle}</h3>
        <div className="h-[250px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} dx={-10} tickFormatter={(value) => `${Number(value) / 1000000}M`} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} formatter={(value) => [`${Number(value ?? 0).toLocaleString()} VND`, "Revenue"]} />
              <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 pointer-events-none">No data available</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
          <div className="p-5 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-gray-900">Pending Orders</h3>
              <p className="text-xs text-gray-500 mt-1">New orders waiting for confirmation</p>
            </div>
            <span className="text-xs font-semibold text-gray-500">No data</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-4 py-3 text-center w-10 rounded-tl-lg">#</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3 whitespace-nowrap">Total</th>
                  <th className="px-4 py-3 rounded-tr-lg text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">No data available</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-6">
          <h3 className="text-base font-bold text-gray-900 mb-5">Top Selling Items</h3>
          <div className="min-h-[180px] flex items-center justify-center text-sm text-gray-500 text-center">No data available</div>
        </div>
      </div>
    </div>
  );
}
