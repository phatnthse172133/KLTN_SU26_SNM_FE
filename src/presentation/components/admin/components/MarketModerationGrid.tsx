"use client";


import { Search, MapPin, AlertCircle, Eye, Lock, Unlock, RefreshCw, ShieldCheck } from 'lucide-react';
import type { MarketModerationOverview } from '@/application/features/admin/adminModerationService';
import { Pagination } from '@/presentation/components/admin/components/Pagination';
import { ImageWithFallback } from '@/presentation/components/ImageWithFallback';

interface MarketModerationGridProps {
  items: MarketModerationOverview[];
  totalItems: number;
  isLoading: boolean;
  error: string;
  page: number;
  setPage: (p: number) => void;
  search: string;
  setSearch: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  lifecycleFilter: string;
  setLifecycleFilter: (s: string) => void;
  fetchData: () => void;
  openDetail: (id: string, name: string, status: 'Active'|'Suspended') => void;
  openSanction: (id: string, name: string, status: 'Active'|'Suspended') => void;
}

export function MarketModerationGrid(props: MarketModerationGridProps) {
  const {
    items, totalItems, isLoading, error, page, setPage,
    search, setSearch, statusFilter, setStatusFilter,
    lifecycleFilter, setLifecycleFilter, fetchData,
    openDetail, openSanction
  } = props;

  const statusBadge = (status: string) => {
    if (status === 'Active' || status === 'Open') return "bg-emerald-100 text-emerald-700";
    if (status === 'Upcoming' || status === 'Draft') return "bg-amber-100 text-amber-700";
    if (status === 'Suspended' || status === 'Cancelled') return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-600";
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / 12));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Night Market Management</h2>
          <p className="text-slate-500 mt-1 text-sm">
            Manage all night markets on the platform
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search market name, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <select value={lifecycleFilter} onChange={(e) => { setLifecycleFilter(e.target.value); setPage(1); }} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700">
            <option value="">All Lifecycle</option>
            <option value="Draft">Draft</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700">
            <option value="">All Moderation</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>
          <button
            type="button"
            aria-label="Refresh"
            onClick={fetchData}
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">We couldn&apos;t load night markets. Please try again.</span>
          </div>
          <button type="button" onClick={fetchData} className="text-sm font-semibold underline hover:text-red-800">
            Retry
          </button>
        </div>
      )}

      {/* Grid */}
      {!error && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="aspect-[16/9] w-full bg-slate-200 animate-pulse" />
                  <div className="p-5 flex-1 flex flex-col gap-4">
                    <div className="space-y-2">
                      <div className="h-5 w-3/4 bg-slate-200 rounded animate-pulse" />
                      <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
                    </div>
                    <div className="h-8 w-full bg-slate-50 rounded mt-auto animate-pulse" />
                    <div className="flex gap-2 mt-2">
                      <div className="h-9 flex-1 bg-slate-200 rounded animate-pulse" />
                      <div className="h-9 flex-1 bg-slate-200 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : items.length > 0 ? (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                {items.map((m) => {
                  const isSuspended = m.moderationStatus === 'Suspended';
                  return (
                    <div
                      key={m.id}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden relative flex flex-col group"
                    >
                      {/* Thumbnail */}
                      <div className="aspect-[16/9] w-full bg-slate-100 relative">
                        {m.thumbnailUrl ? (
                          <ImageWithFallback src={m.thumbnailUrl} alt={m.marketName || 'Market'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MapPin className="w-8 h-8 text-slate-300" />
                          </div>
                        )}
                        <div className="absolute top-3 inset-x-3 flex justify-between items-start pointer-events-none">
                          <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md backdrop-blur-md ${statusBadge(m.lifecycleStatus)}`}>
                            {m.lifecycleStatus}
                          </span>
                          <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md backdrop-blur-md shadow-sm ${statusBadge(m.moderationStatus)}`}>
                            {m.moderationStatus}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="text-lg font-semibold text-slate-900 mb-1 line-clamp-1">{m.marketName || 'Unnamed market'}</h3>

                        <div className="flex items-start gap-1.5 mb-2 text-slate-500 text-sm">
                          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{m.address || 'Address unavailable'}</span>
                        </div>

                        {/* Quick Stats Row */}
                        <div className="mt-2 mb-4 bg-slate-50 rounded-xl p-3 flex justify-between items-center text-xs">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="font-semibold text-slate-900">{m.totalBooths || 0}</span>
                            <span className="text-slate-500">Booths</span>
                          </div>
                          <div className="w-px h-8 bg-slate-200"></div>
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="font-semibold text-emerald-600">{m.activeBooths || 0}</span>
                            <span className="text-slate-500">Active</span>
                          </div>
                          <div className="w-px h-8 bg-slate-200"></div>
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={`font-semibold ${m.seriousComplaintCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{m.seriousComplaintCount || 0}</span>
                            <span className="text-slate-500">Alerts</span>
                          </div>
                        </div>

                        {/* Owner & Hours */}
                        <div className="mt-auto flex flex-col gap-1.5 mb-4 text-[13px]">
                           <div className="flex justify-between">
                             <span className="text-slate-500">Owner</span>
                             <span className="text-slate-900 font-medium line-clamp-1 text-right ml-4">
                               {m.marketOwnerName?.trim() || 'Not assigned'}
                             </span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-slate-500">Hours</span>
                             <span className="text-slate-900 font-medium">
                               {m.openingHours && m.closingHours ? `${m.openingHours} - ${m.closingHours}` : 'Hours unavailable'}
                             </span>
                           </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-4 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openDetail(m.id, m.marketName, m.moderationStatus); }}
                            className="flex-1 py-2 px-3 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                          >
                            <Eye className="w-4 h-4" /> View Details
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openSanction(m.id, m.marketName, m.moderationStatus); }}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                              isSuspended
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                            }`}
                          >
                            {isSuspended ? (
                              <><Unlock className="w-4 h-4" /> Restore</>
                            ) : (
                              <><Lock className="w-4 h-4" /> Suspend</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={totalItems}
                itemsPerPage={12}
              />
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
               <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
               <h3 className="text-lg font-semibold text-slate-900 mb-2">No night markets found</h3>
               <p className="text-slate-500 text-sm">Try adjusting your search or filters.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
