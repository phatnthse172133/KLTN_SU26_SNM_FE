import { useState } from 'react';
import { Search, AlertCircle, Store, Eye, Lock, Unlock, RefreshCw, Star, MapPin } from 'lucide-react';
import type { BoothModerationOverview, BoothModerationStatus } from '@/application/features/admin/adminModerationService';
import type { NightMarketOption } from '@/application/features/admin/adminBoothService';
import { ImageWithFallback } from '@/presentation/components/ImageWithFallback';
import { Pagination } from './Pagination';
import { BoothMapModal } from './BoothMapModal';

interface BoothModerationTableProps {
  items: BoothModerationOverview[];
  totalItems: number;
  isLoading: boolean;
  error: string;
  page: number;
  setPage: (p: number) => void;
  search: string;
  setSearch: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  nightMarketFilter: string;
  setNightMarketFilter: (s: string) => void;
  nightMarketOptions: NightMarketOption[];
  fetchData: () => void;
  openDetail: (id: string, name: string, status: BoothModerationStatus) => void;
  openSanction: (id: string, name: string, status: BoothModerationStatus) => void;
  pageSize: number;
}

const STATUS_BADGE: Record<BoothModerationStatus, string> = {
  Active:   'bg-emerald-100 text-emerald-700',
  Inactive: 'bg-gray-100 text-gray-600',
  Banned:   'bg-red-100 text-red-700',
};

const STATUS_LABEL: Record<BoothModerationStatus, string> = {
  Active:   'Active',
  Inactive: 'Inactive',
  Banned:   'Banned',
};

const PACKAGE_BADGE: Record<string, string> = {
  'Booth Featured': 'bg-amber-100 text-amber-700 border-amber-200',
  'Booth Boost':    'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Booth Basic':    'bg-slate-100 text-slate-600 border-slate-200',
};

function PackageTag({ booth }: { booth: BoothModerationOverview }) {
  const packageName = booth.packageName || 'Booth Basic';
  const badgeClass = PACKAGE_BADGE[packageName] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border whitespace-nowrap ${badgeClass}`}>
      {booth.isFeatured && <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />}
      {packageName}
    </span>
  );
}

export function BoothModerationTable(props: BoothModerationTableProps) {
  const {
    items, totalItems, isLoading, error,
    page, setPage, search, setSearch,
    statusFilter, setStatusFilter,
    nightMarketFilter, setNightMarketFilter, nightMarketOptions,
    fetchData,
    openDetail, openSanction, pageSize
  } = props;

  const [mapBoothId, setMapBoothId] = useState<string | null>(null);
  const [mapBoothName, setMapBoothName] = useState('');

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const showPagination = !isLoading && totalItems > 0;

  const pagination = showPagination ? (
    <Pagination
      currentPage={safePage}
      totalPages={totalPages}
      onPageChange={setPage}
      totalItems={totalItems}
      itemsPerPage={pageSize}
    />
  ) : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Booth Management</h2>
          <p className="text-slate-500 mt-1 text-sm">
            Manage all vendor booths across markets
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 min-w-0 w-full sm:min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search booths by name or owner..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border-0 bg-slate-50 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={nightMarketFilter}
            onChange={e => {
              setNightMarketFilter(e.target.value);
              setPage(1);
            }}
            className="flex-1 sm:flex-none px-4 py-2 border-0 bg-slate-50 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer"
          >
            <option value="">All Night Markets</option>
            {nightMarketOptions.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="flex-1 sm:flex-none px-4 py-2 border-0 bg-slate-50 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Banned">Banned</option>
          </select>
          <button
            type="button"
            onClick={fetchData}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50/50 border border-red-100 text-red-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <p className="text-sm font-medium">We couldn&apos;t load booths. Please try again.</p>
          </div>
          <button onClick={fetchData} className="text-sm font-semibold underline hover:text-red-900 transition-colors">Retry</button>
        </div>
      )}

      {!error && (
        <div className="space-y-6">
          {/* A table needs more room than the content area beside the admin sidebar. */}
          <div className="hidden xl:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="min-w-[1080px] w-full text-left text-sm">
              <caption className="sr-only">Booths available for platform moderation</caption>
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-600">
                <tr>
                  <th className="min-w-[260px] px-6 py-5 font-medium tracking-wide">Booth</th>
                  <th className="w-[210px] px-6 py-5 font-medium tracking-wide">Owner</th>
                  <th className="w-[190px] px-6 py-5 font-medium tracking-wide">Night Market</th>
                  <th className="w-[100px] px-6 py-5 font-medium tracking-wide whitespace-nowrap">Rating</th>
                  <th className="w-[150px] px-6 py-5 font-medium tracking-wide whitespace-nowrap">Package</th>
                  <th className="w-[120px] px-6 py-5 font-medium tracking-wide whitespace-nowrap">Complaints</th>
                  <th className="w-[150px] px-6 py-5 font-medium tracking-wide whitespace-nowrap">Status</th>
                  <th className="min-w-[190px] px-6 py-5 font-medium tracking-wide text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && items.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse bg-white">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0" />
                          <div className="h-4 bg-slate-200 rounded w-28" />
                        </div>
                      </td>
                      <td className="px-6 py-5"><div className="h-4 bg-slate-200 rounded w-32" /></td>
                      <td className="px-6 py-5"><div className="h-4 bg-slate-200 rounded w-32" /></td>
                      <td className="px-6 py-5"><div className="h-4 bg-slate-200 rounded w-12" /></td>
                      <td className="px-6 py-5"><div className="h-5 bg-slate-200 rounded w-24" /></td>
                      <td className="px-6 py-5"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                      <td className="px-6 py-5"><div className="h-6 bg-slate-200 rounded-full w-20" /></td>
                      <td className="px-6 py-5 text-right"><div className="h-8 bg-slate-200 rounded w-24 inline-block" /></td>
                    </tr>
                  ))
                ) : items.length > 0 ? (
                  items.map(b => (
                    <tr key={b.id} className="hover:bg-indigo-50/30 transition-colors bg-white group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl shrink-0 overflow-hidden relative flex items-center justify-center">
                            {b.thumbnailUrl ? (
                              <ImageWithFallback src={b.thumbnailUrl} alt={b.boothName} className="w-full h-full object-cover relative z-10" />
                            ) : (
                              <Store className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-900 group-hover:text-indigo-900 transition-colors" title={b.boothName}>{b.boothName}</div>
                            {b.zoneName && (
                              <div className="text-xs text-slate-500 mt-1">{b.zoneName}{b.slotNumber ? ` · ${b.slotNumber}` : ''}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="max-w-[210px] truncate text-slate-700 font-medium" title={b.boothOwnerName ?? undefined}>{b.boothOwnerName || 'Not available'}</div>
                        <div className="max-w-[210px] truncate text-xs text-slate-500 mt-0.5" title={b.boothOwnerEmail ?? undefined}>{b.boothOwnerEmail || 'No contact'}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="max-w-[190px] truncate text-slate-700" title={b.nightMarketName ?? undefined}>{b.nightMarketName || 'Not available'}</div>
                      </td>
                      <td className="px-6 py-5 text-slate-600">
                        {b.averageRating != null && b.averageRating > 0 ? (
                          <span className="inline-flex items-center gap-1.5 font-medium">
                            {b.averageRating.toFixed(1)}
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">No rating</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <PackageTag booth={b} />
                      </td>
                      <td className="px-6 py-5">
                        {b.complaintCount > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-red-100 text-red-700 font-bold text-xs">{b.complaintCount}</span>
                        ) : (
                          <span className="text-slate-400 text-xs font-semibold">0</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md backdrop-blur-md shadow-sm ${STATUS_BADGE[b.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {STATUS_LABEL[b.status] ?? b.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openDetail(b.id, b.boothName, b.status)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-colors focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" /> Details
                          </button>
                          <button
                            type="button"
                            onClick={() => { setMapBoothId(b.id); setMapBoothName(b.boothName); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-colors focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            title="View on Map"
                          >
                            <MapPin className="w-3.5 h-3.5" /> Map
                          </button>
                          <button
                            type="button"
                            onClick={() => openSanction(b.id, b.boothName, b.status)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors focus:ring-2 outline-none ${
                              b.status === 'Banned'
                                ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 focus:ring-emerald-500/20'
                                : 'text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 focus:ring-red-500/20'
                            }`}
                          >
                            {b.status === 'Banned' ? <><Unlock className="w-3.5 h-3.5" /> Restore Booth</> : <><Lock className="w-3.5 h-3.5" /> Ban Booth</>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-24 text-center bg-white">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                          <Store className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">No booths found</h3>
                        <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
            {pagination}
          </div>

          {/* Cards avoid a cramped seven-column table on tablets and narrow desktops. */}
          <div className="xl:hidden overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
            {isLoading && items.length === 0 ? (
               Array.from({ length: 4 }).map((_, i) => (
                 <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 animate-pulse flex flex-col gap-4">
                   <div className="flex items-start gap-4">
                     <div className="w-16 h-16 bg-slate-200 rounded-xl shrink-0" />
                     <div className="flex-1 space-y-2">
                       <div className="h-4 bg-slate-200 rounded w-2/3" />
                       <div className="h-3 bg-slate-200 rounded w-1/2" />
                     </div>
                   </div>
                   <div className="h-8 bg-slate-200 rounded-lg w-full" />
                 </div>
               ))
            ) : items.length > 0 ? (
              items.map(b => (
                <div key={b.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5 flex flex-col gap-4 group">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-xl shrink-0 overflow-hidden relative flex items-center justify-center">
                      {b.thumbnailUrl ? (
                        <ImageWithFallback src={b.thumbnailUrl} alt={b.boothName} className="w-full h-full object-cover relative z-10" />
                      ) : (
                        <Store className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-slate-900 truncate group-hover:text-indigo-900 transition-colors">{b.boothName}</h3>
                        <span className={`shrink-0 inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${STATUS_BADGE[b.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {STATUS_LABEL[b.status] ?? b.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 truncate mt-0.5">{b.nightMarketName || 'No Market'}</p>
                      {b.zoneName && (
                        <p className="text-xs text-slate-500 mt-1">{b.zoneName}{b.slotNumber ? ` · ${b.slotNumber}` : ''}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm pt-4 border-t border-slate-50">
                    <div>
                      <span className="block text-xs text-slate-500 mb-0.5">Owner</span>
                      <span className="font-medium text-slate-700 truncate block">{b.boothOwnerName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500 mb-0.5">Package</span>
                      <PackageTag booth={b} />
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500 mb-0.5">Rating & Complaints</span>
                      <div className="flex items-center gap-3">
                        {b.averageRating != null && b.averageRating > 0 ? (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                            {b.averageRating.toFixed(1)} <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-semibold">No Rating</span>
                        )}
                        {b.complaintCount > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-100 text-red-700 font-bold text-[10px]">{b.complaintCount}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 mt-auto">
                    <button
                      type="button"
                      onClick={() => openDetail(b.id, b.boothName, b.status)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-colors focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    >
                      <Eye className="w-4 h-4" /> Details
                    </button>
                    <button
                      type="button"
                      onClick={() => openSanction(b.id, b.boothName, b.status)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-bold rounded-xl transition-colors focus:ring-2 outline-none ${
                        b.status === 'Banned'
                          ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 focus:ring-emerald-500/20'
                          : 'text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 focus:ring-red-500/20'
                      }`}
                    >
                      {b.status === 'Banned' ? <><Unlock className="w-4 h-4" /> Restore Booth</> : <><Lock className="w-4 h-4" /> Ban Booth</>}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-16 h-16 mx-auto bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Store className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No booths found</h3>
                <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
          {pagination}
          </div>
        </div>
      )}

      {mapBoothId && (
        <BoothMapModal
          isOpen={!!mapBoothId}
          onClose={() => { setMapBoothId(null); setMapBoothName(''); }}
          boothId={mapBoothId}
          boothName={mapBoothName}
        />
      )}
    </div>
  );
}
