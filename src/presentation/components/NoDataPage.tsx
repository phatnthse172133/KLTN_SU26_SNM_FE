"use client";

import { AlertCircle, BarChart3, Clock, Database, Filter, Search } from "lucide-react";

type NoDataPageProps = {
  title: string;
  subtitle: string;
  primaryLabel?: string;
};

export function NoDataPage({ title, subtitle, primaryLabel = "Action" }: NoDataPageProps) {
  const stats = [
    { label: "Total", value: "No data", icon: Database },
    { label: "Pending", value: "No data", icon: Clock },
    { label: "Active", value: "No data", icon: BarChart3 },
    { label: "Issues", value: "No data", icon: AlertCircle },
  ];

  return (
    <div className="p-8 pb-12 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <button disabled className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium opacity-60 cursor-not-allowed shadow-sm">
          {primaryLabel}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-5 border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
              </div>
              <div className="p-2 rounded-lg bg-indigo-50">
                <stat.icon className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3 font-medium">No API endpoint connected for this metric</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input disabled placeholder="Search..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none text-sm disabled:text-gray-400" />
        </div>
        <div className="flex items-center space-x-2 border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 text-sm font-medium text-gray-400">
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="grid grid-cols-4 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wide">
          <span>Name</span>
          <span>Status</span>
          <span>Updated</span>
          <span className="text-right">Action</span>
        </div>
        <div className="px-6 py-16 text-center">
          <Database className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">No data from API</p>
        </div>
      </div>
    </div>
  );
}
