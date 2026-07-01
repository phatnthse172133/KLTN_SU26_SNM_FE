"use client";

import { Send } from "lucide-react";
import { Pagination } from "./Pagination";

export function Messages() {
  return (
    <div className="p-8 pb-12 max-w-7xl mx-auto space-y-6">
      <div><h2 className="text-2xl font-bold text-gray-900">Messages</h2><p className="text-sm text-gray-500 mt-1">Reply to customer conversations</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-190px)] min-h-[520px]">
        <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col">
          <div className="flex-1 flex items-center justify-center p-8 text-sm text-gray-500 text-center">No data from API</div>
          <Pagination compact currentPage={1} totalItems={0} itemsPerPage={10} onPageChange={() => undefined} onItemsPerPageChange={() => undefined} />
        </div>
        <div className="lg:col-span-8 bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200"><h3 className="font-bold text-gray-900">No conversation selected</h3></div>
          <div className="flex-1 flex items-center justify-center p-5 bg-gray-50 text-sm text-gray-500">No data from API</div>
          <div className="p-4 border-t border-gray-200 flex gap-3">
            <input disabled placeholder="Type a reply..." className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400" />
            <button disabled className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-300 text-white text-sm font-medium"><Send className="w-4 h-4" /> Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
