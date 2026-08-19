"use client";

import { Layout } from "lucide-react";

export default function MarketOwnerLayoutsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Layout className="w-7 h-7 text-purple-600" />
        Market Layouts
      </h1>
      <p className="text-sm text-gray-500 mt-1">
        Manage your night market layouts, zones, and booth placements.
      </p>
      <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
        <Layout className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">
          Layout editor will be available here. Select a night market to begin.
        </p>
      </div>
    </div>
  );
}
