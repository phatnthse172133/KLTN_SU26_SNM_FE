"use client";

const preferences = ["Order notifications", "Promotion notifications", "Auto accept paid orders"];

export function Settings() {
  return (
    <div className="p-8 pb-12 max-w-4xl mx-auto space-y-6">
      <div><h2 className="text-2xl font-bold text-gray-900">Settings</h2><p className="text-sm text-gray-500 mt-1">Configure booth owner preferences</p></div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-6 space-y-5">
        {preferences.map((label)=><div key={label} className="flex items-center justify-between pb-4 border-b border-gray-100"><div><span className="font-medium text-gray-900">{label}</span><p className="text-xs text-gray-400 mt-1">No data from API</p></div><button disabled className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300" aria-label={label}><span className="inline-block h-4 w-4 translate-x-1 rounded-full bg-white" /></button></div>)}
        <label className="block space-y-2"><span className="font-medium text-gray-900">Language</span><select disabled className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400"><option>No data from API</option></select></label>
      </div>
    </div>
  );
}
