"use client";

import { Store } from "lucide-react";

export default function MarketOwnerBoothAssignmentPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Store className="w-7 h-7 text-purple-600" />
        Booth Assignment
      </h1>
      <p className="text-sm text-gray-500 mt-1">
        Assign booths to slots in the night market layout.
      </p>
      <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
        <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">
          The slot assignment feature will be available soon.
        </p>
      </div>
    </div>
  );
}
