"use client";

import { useState } from "react";
import { Calendar, Hash, Percent, Plus, Tag, Ticket, Users, X } from "lucide-react";

export function Promotions() {
  const [activeTab, setActiveTab] = useState<"promotions" | "vouchers">("promotions");
  const [showModal, setShowModal] = useState(false);
  const promoStats = [{ label: "Active Promotions", icon: Tag }, { label: "Total Items On Sale", icon: Percent }, { label: "Total Promotions", icon: Calendar }];
  const voucherStats = [{ label: "Active Vouchers", icon: Ticket }, { label: "Total Uses", icon: Users }, { label: "Total Vouchers", icon: Hash }];
  const stats = activeTab === "promotions" ? promoStats : voucherStats;

  return (
    <div className="p-8 pb-12 max-w-7xl mx-auto space-y-6">
      {showModal && <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6"><div className="bg-white rounded-xl shadow-2xl w-full max-w-lg"><div className="flex items-center justify-between px-6 py-4 border-b border-gray-200"><h3 className="text-lg font-bold text-gray-900">{activeTab === "promotions" ? "Create Promotion" : "Create Voucher"}</h3><button onClick={()=>setShowModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg" aria-label="Close"><X className="w-5 h-5" /></button></div><div className="p-10 text-center"><Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-sm font-medium text-gray-700">No data available</p><p className="text-xs text-gray-400 mt-1">Promotions and vouchers are not available yet.</p></div></div></div>}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h2 className="text-2xl font-bold text-gray-900">Promotions &amp; Vouchers</h2><p className="text-sm text-gray-500 mt-1">Manage item-level promotions and voucher codes</p></div><button onClick={()=>setShowModal(true)} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 shadow-sm"><Plus className="w-5 h-5" />{activeTab === "promotions" ? "Create Promotion" : "Create Voucher"}</button></div>
      <div className="border-b border-gray-200"><nav className="-mb-px flex gap-8">{([{key:"promotions",label:"Promotions",icon:Tag},{key:"vouchers",label:"Vouchers",icon:Ticket}] as const).map((tab)=><button key={tab.key} onClick={()=>setActiveTab(tab.key)} className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${activeTab===tab.key?"border-indigo-500 text-indigo-600":"border-transparent text-gray-500"}`}><tab.icon className="w-4 h-4" />{tab.label}<span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab===tab.key?"bg-indigo-100 text-indigo-700":"bg-gray-100 text-gray-600"}`}>0 active</span></button>)}</nav></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{stats.map((stat)=><div key={stat.label} className="bg-white p-5 rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] flex items-center gap-4"><div className="w-11 h-11 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600"><stat.icon className="w-5 h-5" /></div><div><p className="text-sm font-medium text-gray-500">{stat.label}</p><h3 className="text-xl font-bold text-gray-900 mt-0.5">No data</h3></div></div>)}</div>
      {activeTab === "promotions" ? <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400 shadow-[0_1px_4px_rgba(0,0,0,0.08)]"><Tag className="w-12 h-12 mx-auto mb-3 text-gray-200" /><p className="font-medium">No data available</p></div> : <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-gray-500"><tr><th className="px-5 py-3">Code</th><th className="px-5 py-3">Discount</th><th className="px-5 py-3">Min Order</th><th className="px-5 py-3">Usage</th><th className="px-5 py-3">Expiry</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody><tr><td colSpan={7} className="px-5 py-16 text-center text-gray-500">No data available</td></tr></tbody></table></div>}
    </div>
  );
}
