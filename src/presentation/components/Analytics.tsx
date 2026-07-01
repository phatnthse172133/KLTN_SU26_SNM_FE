"use client";

import { useMemo, useState } from "react";
import { Calendar, DollarSign, ShoppingBag, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Range = "today" | "week" | "month" | "year";
const pad = (value: number) => String(value).padStart(2, "0");

export function Analytics() {
  const now = useMemo(() => new Date(), []);
  const [dateRange, setDateRange] = useState<Range>("week");
  const [selectedDate, setSelectedDate] = useState(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
  const [selectedMonth, setSelectedMonth] = useState(pad(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const emptyData: { name: string; value: number }[] = [];
  const periodLabel = dateRange === "today" ? selectedDate : dateRange === "week" ? "This Week" : dateRange === "month" ? `${new Date(2000, Number(selectedMonth) - 1).toLocaleString("en-US", { month: "long" })} ${selectedYear}` : selectedYear;
  const kpis = [
    { title: "Total Revenue", icon: DollarSign, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Total Orders", icon: ShoppingBag, color: "text-emerald-500", bg: "bg-emerald-50" },
    { title: "Repeat Customers", icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
  ];

  const emptyChart = (kind: "bar" | "pie" | "line") => (
    <div className="h-[300px] w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        {kind === "pie" ? <PieChart><Pie data={emptyData} dataKey="value" /></PieChart> : kind === "line" ? <LineChart data={emptyData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Line dataKey="value" stroke="#10B981" /></LineChart> : <BarChart data={emptyData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#4F46E5" /></BarChart>}
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">No data from API</div>
    </div>
  );

  return (
    <div className="p-8 pb-12 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div><h2 className="text-2xl font-bold text-gray-900">Sales &amp; Performance</h2><p className="text-sm text-gray-500 mt-1">Deep dive into your booth&apos;s metrics</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm"><Calendar className="w-4 h-4 text-gray-500" /><select value={dateRange} onChange={(event) => setDateRange(event.target.value as Range)} className="bg-transparent text-sm font-medium text-gray-700 outline-none"><option value="today">Today</option><option value="week">This Week</option><option value="month">This Month</option><option value="year">This Year</option></select></div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm"><Calendar className="w-4 h-4 text-gray-500" />{dateRange === "today" ? <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="bg-transparent text-sm outline-none" /> : dateRange === "month" ? <select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="bg-transparent text-sm outline-none">{Array.from({length:12},(_,i)=>pad(i+1)).map((month)=><option key={month} value={month}>{new Date(2000,Number(month)-1).toLocaleString("en-US",{month:"long"})}</option>)}</select> : <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)} className="bg-transparent text-sm outline-none"><option>{now.getFullYear()}</option></select>}</div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600">{periodLabel}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{kpis.map((kpi)=><div key={kpi.title} className="bg-white rounded-xl p-5 border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)]"><div className="flex justify-between"><div><p className="text-sm font-medium text-gray-500">{kpi.title}</p><h3 className="text-2xl font-bold text-gray-900 mt-1">No data</h3></div><div className={`p-2 rounded-lg h-fit ${kpi.bg}`}><kpi.icon className={`w-5 h-5 ${kpi.color}`} /></div></div><p className="text-xs text-gray-500 mt-3">No data from API</p></div>)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]"><h3 className="text-base font-bold text-gray-900 mb-6">Revenue by Day of Week</h3>{emptyChart("bar")}</div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]"><h3 className="text-base font-bold text-gray-900 mb-6">Revenue by Category</h3>{emptyChart("pie")}</div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]"><h3 className="text-base font-bold text-gray-900 mb-6">Customer Ratings Over Time</h3>{emptyChart("line")}</div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]"><h3 className="text-base font-bold text-gray-900 mb-6">Top 5 Best-selling Items</h3>{emptyChart("bar")}</div>
      </div>
    </div>
  );
}
