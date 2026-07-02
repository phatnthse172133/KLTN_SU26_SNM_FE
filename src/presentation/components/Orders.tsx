"use client";

import { useState } from "react";
import { Package, Plus, Search, X } from "lucide-react";
import { Pagination } from "./Pagination";

const tabs = ["all", "pending", "processing", "ready", "completed", "cancelled"] as const;

export function Orders() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="p-8 pb-12 max-w-7xl mx-auto space-y-5">
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Create New Order</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg" aria-label="Close create order"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-10 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">No data available</p>
              <p className="text-xs text-gray-400 mt-1">Order creation is not available yet.</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage incoming, active, and completed orders</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search orders..." className="w-64 pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:border-indigo-500 outline-none text-sm" />
          </div>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-lg shadow-sm whitespace-nowrap">
            <Plus className="w-4 h-4" /> Create Order
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex gap-6 min-w-max">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => { setActiveTab(tab); setCurrentPage(1); }} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8 bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr><th className="px-4 py-3 text-center w-10">#</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Items</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody><tr><td colSpan={6} className="px-5 py-14 text-center text-gray-500"><Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />No data available</td></tr></tbody>
            </table>
          </div>
          <Pagination currentPage={currentPage} totalItems={0} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }} />
        </div>

        <div className="xl:col-span-4 bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden">
          <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center text-gray-500 p-5">
            <Package className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-sm font-medium">No data available</p>
            <p className="text-xs text-gray-400 mt-1">Order details will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
