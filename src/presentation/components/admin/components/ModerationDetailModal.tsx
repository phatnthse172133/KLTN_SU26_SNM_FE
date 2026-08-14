"use client";





import { useState, useEffect } from 'react';


import {


  X,


  AlertTriangle,


  MapPin,


  ShieldCheck,


  Lock,


  Unlock,


  FileText,


  ExternalLink,


  UserRound,


  Mail,


  Phone,


  Clock3,


  CalendarDays,


  Store,


  MessageSquareWarning,


  Navigation,


  Star,


} from 'lucide-react';


import type { LucideIcon } from 'lucide-react';


import { adminModerationService } from '@/application/features/admin/adminModerationService';


import type { MarketModerationDetail, BoothModerationDetail, BoothDocument, ModerationActionHistory } from '@/application/features/admin/adminModerationService';

import { ImageWithFallback } from '@/presentation/components/ImageWithFallback';

import { getErrorMessage } from '@/shared/errors/errorMapper';

import { resolveMediaUrl } from '@/shared/utils';

import { HereLocationModal } from './HereLocationModal';





interface ModerationDetailModalProps {


  isOpen: boolean;


  onClose: () => void;


  targetId: string;


  targetType: 'Night Market' | 'Booth';


  onActionClick: () => void;


}





function formatDate(value?: string | null) {


  if (!value) return 'Not available';


  const date = new Date(value);


  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();


}





function InfoItem({ icon: Icon, label, value, action }: { icon: LucideIcon; label: string; value: string; action?: React.ReactNode }) {


  return (


    <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5">


      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">


        <Icon className="h-4 w-4" />


      </div>


      <div className="min-w-0 flex-1 flex items-center justify-between gap-4">


        <div>


          <span className="block text-xs text-slate-500">{label}</span>


          <span className="mt-0.5 block break-words text-sm font-medium text-slate-900">{value}</span>


        </div>


        {action && <div>{action}</div>}


      </div>


    </div>


  );


}





export function ModerationDetailModal({ isOpen, onClose, targetId, targetType, onActionClick }: ModerationDetailModalProps) {


  const [activeTab, setActiveTab] = useState<'overview' | 'violations' | 'documents' | 'history'>('overview');


  const [detail, setDetail] = useState<MarketModerationDetail | BoothModerationDetail | null>(null);


  const [history, setHistory] = useState<ModerationActionHistory[]>([]);


  const [historyError, setHistoryError] = useState('');


  const [isLoading, setIsLoading] = useState(true);


  const [error, setError] = useState('');


  const [retryCount, setRetryCount] = useState(0);


  const [isMapOpen, setIsMapOpen] = useState(false);





  useEffect(() => {


    if (!targetId) return;


    const fetchIt = async () => {


      setError('');


      setHistoryError('');


      setDetail(null);


      setHistory([]);


      setIsLoading(true);


      try {


        if (targetType === 'Night Market') {


          const detailRes = await adminModerationService.getMarketDetail(targetId);

          if (!detailRes.success || !detailRes.data) {

            throw new Error('Night market details are currently unavailable.');

          }


          setDetail(detailRes.data);


          setIsLoading(false);


          try {


            const historyRes = await adminModerationService.getMarketModerationHistory(targetId);


            if (historyRes.success && historyRes.data) setHistory(historyRes.data.items || []);


            else setHistoryError('Moderation history is currently unavailable.');

          } catch {


            setHistoryError('Moderation history is currently unavailable.');


          }


        } else {


          const detailRes = await adminModerationService.getBoothDetail(targetId);

          if (!detailRes.success || !detailRes.data) {

            throw new Error('Booth details are currently unavailable.');

          }


          setDetail(detailRes.data);


          setIsLoading(false);


          try {


            const historyRes = await adminModerationService.getBoothModerationHistory(targetId);


            if (historyRes.success && historyRes.data) setHistory(historyRes.data.items || []);


            else setHistoryError('Moderation history is currently unavailable.');

          } catch {


            setHistoryError('Moderation history is currently unavailable.');


          }


        }


      } catch (err: unknown) {

        setError(getErrorMessage(err));

      } finally {


        setIsLoading(false);


      }


    };


    void fetchIt();


  }, [targetId, targetType, retryCount]);





  // Accessibility: Handle Escape key


  useEffect(() => {


    const handleKeyDown = (e: KeyboardEvent) => {


      if (e.key === 'Escape' && isOpen && !isMapOpen) onClose();


    };


    window.addEventListener('keydown', handleKeyDown);


    return () => window.removeEventListener('keydown', handleKeyDown);


  }, [isMapOpen, isOpen, onClose]);





  if (!isOpen) return null;





  const isMarket = targetType === 'Night Market';


  const mDetail = isMarket ? (detail as MarketModerationDetail) : null;


  const bDetail = !isMarket ? (detail as BoothModerationDetail) : null;





  const name = isMarket ? mDetail?.marketName : bDetail?.boothName;


  const owner = isMarket ? mDetail?.marketOwnerName : bDetail?.boothOwnerName;


  const moderationStatus = isMarket ? mDetail?.moderationStatus : undefined;


  const status = isMarket


    ? (moderationStatus === 'Suspended' ? 'Banned' : mDetail?.lifecycleStatus)


    : bDetail?.status;


  const targetName = name || 'Target';





  const isSuspended = isMarket && status === 'Suspended';

  const isBanned = !isMarket && status === 'Banned';





  const BOOTH_BADGE: Record<string, string> = {


    Active:   'bg-emerald-100 text-emerald-700',


    Inactive: 'bg-gray-100 text-gray-600',


    Banned:   'bg-red-100 text-red-700',


  };


  const MARKET_BADGE: Record<string, string> = {


    Active: 'bg-emerald-100 text-emerald-700',


    Inactive: 'bg-amber-100 text-amber-700',


    Suspended: 'bg-red-100 text-red-700',


  };





  const canModerateStatus = !isMarket && status != null;





  const badgeClass = isMarket


    ? (MARKET_BADGE[status ?? ''] ?? 'bg-gray-100 text-gray-600')


    : (BOOTH_BADGE[status ?? ''] ?? 'bg-gray-100 text-gray-600');





  const statusLabel = status;





  const getSeverityClass = (severity: string) => {


    switch(severity) {


      case 'Critical': return 'bg-red-100 text-red-700';


      case 'High': return 'bg-orange-100 text-orange-700';


      case 'Medium': return 'bg-amber-100 text-amber-700';


      case 'Low': default: return 'bg-slate-100 text-slate-700';


    }


  };





  const complaints = (isMarket ? mDetail?.recentComplaints : bDetail?.recentComplaints) || [];

  const banRecord = !isMarket
    ? (bDetail?.recentHistory?.newStatus === 'Banned'
        ? bDetail.recentHistory
        : history.find(h => h.newStatus === 'Banned'))
    : undefined;





  return (


    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="modal-title">


      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">





        <div className="px-8 py-6 border-b border-slate-100 flex items-start gap-4">


          <ImageWithFallback


            src={mDetail?.thumbnailUrl || bDetail?.thumbnailUrl || ''}


            alt={targetName}


            className="w-16 h-16 rounded-xl object-cover ring-4 ring-white shadow-sm"


          />


          <div className="flex-1 min-w-0">


            <div className="flex items-start justify-between">


              <div>


                <h2 id="modal-title" className="text-2xl font-bold text-slate-900 truncate pr-4">{name || 'Loading...'}</h2>


                <p className="text-sm text-slate-500 mt-1 truncate">


                  Owned by <span className="font-medium text-slate-700">{owner?.trim() || 'Not assigned'}</span>


                </p>


              </div>


              <button type="button" onClick={onClose} aria-label="Close modal" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors shrink-0">


                <X className="w-5 h-5" />


              </button>


            </div>





            <div className="flex gap-2 mt-3">


              <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md ${badgeClass}`}>


                {statusLabel}


              </span>


            </div>


          </div>


        </div>





        <div className="flex px-8 border-b border-slate-200 bg-white shadow-sm overflow-x-auto hide-scrollbar shrink-0 z-10" role="tablist">


          <button


            onClick={() => setActiveTab('overview')}


            className={`pb-4 px-2 text-sm font-medium transition-colors relative mr-8 ${activeTab === 'overview' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}


          >


            Overview


            {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}


          </button>


          <button


            onClick={() => setActiveTab('violations')}


            className={`pb-4 px-2 text-sm font-medium transition-colors relative mr-8 ${activeTab === 'violations' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}


          >


            Violations ({complaints.length})


            {activeTab === 'violations' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}


          </button>


          {!isMarket && (


            <button


              onClick={() => setActiveTab('documents')}


              className={`pb-4 px-2 text-sm font-medium transition-colors relative mr-8 ${activeTab === 'documents' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}


            >


              Documents


              {activeTab === 'documents' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}


            </button>


          )}


          <button


            onClick={() => setActiveTab('history')}


            className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeTab === 'history' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}


          >


            History


            {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}


          </button>


        </div>





        <div className="px-8 py-6 overflow-y-auto flex-1 bg-white min-h-0">


          {isLoading ? (


            <div className="space-y-6 animate-pulse">


              <div className="grid grid-cols-2 gap-8">


                <div className="space-y-4"><div className="h-4 bg-slate-200 w-1/4 rounded"/><div className="h-6 bg-slate-100 w-3/4 rounded"/></div>


                <div className="space-y-4"><div className="h-4 bg-slate-200 w-1/4 rounded"/><div className="h-6 bg-slate-100 w-3/4 rounded"/></div>


              </div>


            </div>


          ) : error ? (


            <div className="flex flex-col items-center justify-center py-12">


               <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />


               <p className="text-slate-900 font-medium mb-1">We couldn&apos;t load the details.</p>


               <p className="text-slate-500 text-sm mb-6">{error}</p>


               <button type="button" onClick={() => setRetryCount(c => c+1)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">


                 Retry


               </button>


            </div>


          ) : (


            <div className="space-y-8">





              {activeTab === 'overview' && (


                <div className="space-y-8 animate-in fade-in duration-300">


                  {!isMarket && bDetail?.nightMarketName && (


                    <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1">


                      <MapPin className="w-3.5 h-3.5" />


                      {bDetail.nightMarketName}


                      {bDetail.zoneName && <span className="opacity-75">• {bDetail.zoneName}</span>}


                    </div>


                  )}


                  {isSuspended && (


                    <div className="bg-red-50 rounded-xl p-4 flex gap-3">


                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />


                      <div>


                        <h4 className="text-red-800 font-semibold text-sm">{targetType} Banned</h4>


                        <p className="text-red-700 text-sm mt-1">This {targetType.toLowerCase()} is currently banned and restricted from normal operations.</p>


                      </div>


                    </div>


                  )}


                  {isBanned && (


                    <div className="bg-red-50 rounded-xl p-4 flex gap-3">


                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />


                      <div>


                        <h4 className="text-red-800 font-semibold text-sm">Booth Banned</h4>


                        <p className="text-red-700 text-sm mt-1">This booth has been banned by the platform.</p>


                        {banRecord && (


                          <div className="mt-3 space-y-1">


                            <p className="text-red-800 text-sm"><span className="font-semibold">Ban Reason:</span> {banRecord.reason}</p>


                            <p className="text-red-700 text-xs">Banned by <span className="font-medium">{banRecord.adminName || 'Admin'}</span> on {formatDate(banRecord.createdAt)}</p>


                          </div>


                        )}


                      </div>


                    </div>


                  )}


                  <div>


                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Information</h3>


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


                      {isMarket && mDetail ? (


                        <>


                          <InfoItem icon={MapPin} label="Address" value={mDetail.address || 'Not available'} />


                          <InfoItem icon={Clock3} label="Operating Hours" value={mDetail.openingHours && mDetail.closingHours ? `${mDetail.openingHours} - ${mDetail.closingHours}` : 'Not available'} />
                          <InfoItem icon={Store} label="Total Booths" value={mDetail.totalBooths != null ? String(mDetail.totalBooths) : '0'} />
                          <InfoItem icon={Store} label="Available Booths" value={mDetail.availableBooths != null ? String(mDetail.availableBooths) : '0'} />


                          <InfoItem icon={UserRound} label="Market Owner" value={mDetail.marketOwnerName?.trim() || 'Not assigned'} />


                          <InfoItem icon={Mail} label="Owner Email" value={mDetail.marketOwnerEmail?.trim() || 'Not available'} />


                          <InfoItem icon={Phone} label="Owner Phone" value={mDetail.ownerPhone?.trim() || 'Not available'} />


                          <InfoItem


                            icon={Navigation}


                            label="Coordinates"


                            value={mDetail.latitude != null && mDetail.longitude != null ? `${mDetail.latitude}, ${mDetail.longitude}` : 'Not available'}


                            action={


                              mDetail.latitude != null && mDetail.longitude != null && mDetail.latitude >= -90 && mDetail.latitude <= 90 && mDetail.longitude >= -180 && mDetail.longitude <= 180 ? (


                                <button


                                  type="button"


                                  onClick={() => setIsMapOpen(true)}


                                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"


                                >


                                  View on Map


                                </button>


                              ) : null


                            }


                          />


                          <InfoItem icon={CalendarDays} label="Created On" value={formatDate(mDetail.createdAt)} />


                          <InfoItem icon={CalendarDays} label="Last Updated" value={formatDate(mDetail.updatedAt)} />


                        </>





                      ) : bDetail ? (


                        <>


                          <InfoItem icon={Store} label="Booth Name" value={bDetail.boothName || 'Not available'} />


                          <InfoItem icon={MapPin} label="Night Market" value={bDetail.nightMarketName || 'Not available'} />


                          <InfoItem icon={UserRound} label="Owner Name" value={bDetail.boothOwnerName || 'Not assigned'} />


                          <InfoItem icon={Mail} label="Owner Email" value={bDetail.boothOwnerEmail || 'Not available'} />


                          <InfoItem icon={Phone} label="Phone Number" value={bDetail.phoneNumber || 'Not available'} />


                          <InfoItem icon={Navigation} label="Location (Zone/Slot)" value={bDetail.zoneName ? `${bDetail.zoneName}${bDetail.slotNumber ? ' - ' + bDetail.slotNumber : ''}` : 'Not assigned'} />


                          <InfoItem icon={Star} label="Rating" value={(bDetail.averageRating != null && bDetail.averageRating > 0) ? `${bDetail.averageRating.toFixed(1)} / 5.0` : 'No ratings yet'} />


                          <InfoItem icon={MessageSquareWarning} label="Total Complaints" value={bDetail.complaintCount > 0 ? String(bDetail.complaintCount) : '0'} />


                          <InfoItem icon={CalendarDays} label="Created On" value={formatDate(bDetail.createdAt)} />


                          <InfoItem icon={CalendarDays} label="Last Updated" value={formatDate(bDetail.updatedAt)} />


                        </>


                      ) : null}


                    </div>


                  </div>


                  {bDetail && (


                    <div>


                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Description</h3>


                      <p className="text-sm leading-6 text-slate-600 whitespace-pre-wrap">


                        {bDetail.description?.trim() || 'No description available.'}


                      </p>


                    </div>


                  )}





                  {isMarket && mDetail && (


                    <>


                      <div>


                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Description</h3>


                        <p className="text-sm leading-6 text-slate-600 whitespace-pre-wrap">


                          {mDetail.description?.trim() || 'No description available.'}


                        </p>


                      </div>


                    </>


                  )}


                </div>


              )}





              {activeTab === 'violations' && (


                <div className="space-y-4 animate-in fade-in duration-300">


                  {complaints.length === 0 ? (


                    <div className="text-center py-16">


                      <ShieldCheck className="w-12 h-12 text-emerald-300 mx-auto mb-3" />


                      <h3 className="text-slate-900 font-medium">No violations recorded</h3>


                    </div>


                  ) : (


                    <div className="space-y-4">


                      {complaints.map((complaint) => (


                        <div key={complaint.id} className="relative pl-6 before:absolute before:left-0 before:top-2 before:bottom-[-1rem] last:before:hidden before:w-px before:bg-slate-200">


                          <div className="absolute left-[-4px] top-2 w-2 h-2 rounded-full bg-slate-300 border-2 border-white" />


                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-1">


                            <h4 className="font-semibold text-slate-900 text-sm">{complaint.title}</h4>


                            <span className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded ${getSeverityClass(complaint.severity)}`}>


                              {complaint.severity}


                            </span>


                          </div>


                          <p className="text-sm text-slate-600 line-clamp-3 mb-2">{complaint.description}</p>


                        </div>


                      ))}


                    </div>


                  )}


                </div>


              )}





              {activeTab === 'documents' && !isMarket && (


                <div className="space-y-4 animate-in fade-in duration-300">


                  {bDetail?.documents && bDetail.documents.length > 0 ? (


                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">


                      {bDetail.documents.map((doc: BoothDocument) => (

                        <div key={doc.id} className="border border-slate-200 rounded-xl p-4 bg-white hover:border-indigo-200 transition-colors group flex flex-col h-full">


                          <div className="flex items-start justify-between mb-3">


                            <h4 className="font-semibold text-slate-900 text-sm">{doc.documentType}</h4>


                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${doc.verificationStatus === 'Verified' ? 'bg-emerald-100 text-emerald-700' : doc.verificationStatus === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>


                              {doc.verificationStatus}


                            </span>


                          </div>


                          <div className="mt-auto pt-4 flex items-center justify-between">


                            <span className="text-xs text-slate-500">


                              Uploaded {formatDate(doc.createdAt)}

                            </span>



                            {doc.fileUrl ? (

                              <a

                                href={resolveMediaUrl(doc.fileUrl)}

                                target="_blank"

                                rel="noopener noreferrer"

                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group-hover:underline"

                              >

                                View Document <ExternalLink className="w-3 h-3" />

                              </a>

                            ) : (

                              <span className="text-xs text-slate-400">File unavailable</span>

                            )}




                          </div>


                        </div>


                      ))}


                    </div>


                  ) : (


                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100 border-dashed">


                      <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />


                      <h3 className="text-slate-900 font-medium">No documents available</h3>


                    </div>


                  )}


                </div>


              )}





              {activeTab === 'history' && (


                <div className="animate-in fade-in duration-300">


                  {historyError ? (


                    <div className="text-center py-12">


                      <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />


                      <h3 className="text-slate-900 font-medium">Moderation history is unavailable</h3>


                      <p className="text-sm text-slate-500 mt-1 mb-4">{historyError}</p>


                      <button type="button" onClick={() => setRetryCount((count) => count + 1)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">


                        Retry


                      </button>


                    </div>


                  ) : history.length === 0 ? (


                    <div className="text-center py-16">


                      <ShieldCheck className="w-12 h-12 text-slate-200 mx-auto mb-3" />


                      <h3 className="text-slate-900 font-medium">No moderation actions recorded</h3>


                    </div>


                  ) : (


                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-px before:bg-slate-200">


                      {history.map((h, i) => (


                        <div key={h.id || i} className="relative flex items-start gap-4">


                          <div className="w-10 h-10 shrink-0 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center z-10">


                            {h.newStatus === 'Suspended' || h.newStatus === 'Banned' ? <Lock className="w-4 h-4 text-slate-400" /> : <Unlock className="w-4 h-4 text-slate-400" />}


                          </div>


                          <div className="flex-1 pt-2">


                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">


                              <span className="font-semibold text-sm text-slate-900">


        Changed status to <span className={h.newStatus === 'Suspended' || h.newStatus === 'Banned' ? 'text-red-600' : 'text-emerald-600'}>{h.newStatus === 'Suspended' ? 'Banned' : h.newStatus}</span>


                              </span>


                              <span className="text-xs text-slate-500">{new Date(h.createdAt).toLocaleString()}</span>


                            </div>


                            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 mt-2">


                              {h.reason}


                            </div>


                            <p className="text-xs text-slate-500 mt-2">Performed by <span className="font-medium text-slate-700">{h.adminName || 'Admin'}</span></p>


                          </div>


                        </div>


                      ))}


                    </div>


                  )}


                </div>


              )}





            </div>


          )}


        </div>





        {/* Footer */}


        <div className="px-8 py-4 border-t border-slate-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row items-center justify-between shrink-0 z-10 gap-4">


          <div className="text-sm font-medium text-slate-600">


            {isMarket ? 'Market Status' : 'Booth Status'}: <span className={`font-bold ${isSuspended || isBanned ? 'text-red-600' : status === 'Active' ? 'text-emerald-600' : status === 'Inactive' ? 'text-amber-600' : 'text-slate-900'}`}>{statusLabel || 'Unknown'}</span>


            {isMarket && moderationStatus && (


              <span className="ml-3 text-slate-500">Platform Moderation: <span className={`font-bold ${moderationStatus === 'Suspended' ? 'text-red-600' : 'text-emerald-600'}`}>{moderationStatus === 'Suspended' ? 'Banned' : moderationStatus}</span></span>


            )}


          </div>


          <div className="flex gap-2 w-full sm:w-auto">


            <button type="button" onClick={onClose} className="flex-1 sm:flex-none px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">


              Close


            </button>


            {(isMarket || canModerateStatus) && (


              <button


                type="button"


                disabled={isLoading}


                onClick={() => onActionClick()}


                className={`flex-1 sm:flex-none px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${


                  isSuspended || isBanned


                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'


                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'


                }`}


              >


                {isMarket ? (isSuspended ? `Restore ${targetType}` : `Ban ${targetType}`) : (isBanned ? 'Restore Booth' : 'Ban Booth')}


              </button>


            )}


          </div>


        </div>





      </div>





      {isMapOpen && isMarket && mDetail?.latitude != null && mDetail?.longitude != null && (


        <HereLocationModal


          isOpen={isMapOpen}


          onClose={() => setIsMapOpen(false)}


          latitude={mDetail.latitude}


          longitude={mDetail.longitude}


          targetName={mDetail.marketName || 'Unknown Market'}


          address={mDetail.address || 'No Address'}


        />


      )}


    </div>


  );


}
