"use client";
import { AlertCircle, User as UserIcon, Store, Calendar, Image as ImageIcon, Search, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Modal } from './components/Modal';
import { adminComplaintService, ComplaintStatus, ComplaintResolutionAction } from '@/application/features/admin/adminComplaintService';
import { adminAccountService } from '@/application/features/admin/adminAccountService';
import { adminBoothService } from '@/application/features/admin/adminBoothService';
import { adminNightMarketService } from '@/application/features/admin/adminNightMarketService';
import type { Complaint, UserProfile } from '@/shared/types';
import { Pagination } from './components/Pagination';
import { ImageWithFallback } from '../ImageWithFallback';
import { getErrorMessage } from '@/shared/errors/errorMapper';

type StatusTab = 'all' | 'Pending' | 'Resolved' | 'Rejected';
type ActionMode = null | 'resolve' | 'reject';

interface BoothInfo {
  id: string;
  boothName: string;
  boothOwnerId: string;
  boothOwnerName?: string;
  nightMarketId?: string;
  nightMarketName?: string;
  slotNumber?: string;
}

const statusTabs: { key: StatusTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'Pending', label: 'Pending' },
  { key: 'Resolved', label: 'Resolved' },
  { key: 'Rejected', label: 'Rejected' },
];

const statusPillStyle: Record<string, React.CSSProperties> = {
  Pending: { background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 500 },
  Resolved: { background: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 500 },
  Rejected: { background: 'rgba(239,68,68,0.15)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 500 },
};

const resolutionActionLabels: Record<string, string> = {
  'NoViolation': 'Resolved without penalty',
  'Warning': 'Warning issued',
  'SuspendBooth': 'Booth suspended',
  'CloseBooth': 'Booth closed',
};

const mapBackendStatus = (backendStatus: unknown): string => {
  const map: Record<string, string> = {
    '0': 'Pending',
    '1': 'Resolved',
    '2': 'Rejected',
    'Pending': 'Pending',
    'Resolved': 'Resolved',
    'Rejected': 'Rejected',
  };
  return map[String(backendStatus)] ?? String(backendStatus);
};

const mapBackendResolutionAction = (val: unknown): string | null => {
  if (val === null || val === undefined) return null;
  const map: Record<string, string> = {
    '0': 'NoViolation',
    '1': 'Warning',
    '2': 'SuspendBooth',
    '3': 'CloseBooth',
    'NoViolation': 'NoViolation',
    'Warning': 'Warning',
    'SuspendBooth': 'SuspendBooth',
    'CloseBooth': 'CloseBooth',
  };
  return map[String(val)] ?? String(val);
};

export function Complaints() {
  const [complaintsList, setComplaintsList] = useState<Complaint[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [userLookup, setUserLookup] = useState<Record<string, UserProfile>>({});
  const [boothLookup, setBoothLookup] = useState<Record<string, BoothInfo>>({});
  const [marketNames, setMarketNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [statusCounts, setStatusCounts] = useState<{ Pending: number; Resolved: number; Rejected: number; All: number } | null>(null);

  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [resolveResponse, setResolveResponse] = useState('');
  const [resolveAction, setResolveAction] = useState<ComplaintResolutionAction>(ComplaintResolutionAction.NoViolation);
  const [resolvePolicyViolation, setResolvePolicyViolation] = useState('');
  const [suspendConfirm, setSuspendConfirm] = useState(false);

  const [rejectReason, setRejectReason] = useState('');

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);

    const statusFilter = activeTab === 'all' ? undefined : (
      activeTab === 'Pending' ? ComplaintStatus.Pending :
      activeTab === 'Resolved' ? ComplaintStatus.Resolved :
      ComplaintStatus.Rejected
    );

    const [complaintResult, countsResult, userResult, boothResult, marketResult] = await Promise.allSettled([
      adminComplaintService.getAllComplaints(currentPage, itemsPerPage, { status: statusFilter, keyword: searchQuery || undefined }),
      adminComplaintService.getComplaintCounts(),
      adminAccountService.getUsers({ page: 1, pageSize: 100 }),
      adminBoothService.getAllBooths(1, 100),
      adminNightMarketService.getNightMarkets(1, 100),
    ]);

    if (countsResult.status === 'fulfilled' && countsResult.value.success) {
      const c = countsResult.value.data;
      setStatusCounts({ Pending: c.pending, Resolved: c.resolved, Rejected: c.rejected, All: c.total });
    }

    if (complaintResult.status === 'fulfilled' && complaintResult.value.success) {
      setComplaintsList(complaintResult.value.data.items);
      setTotalCount(complaintResult.value.data.total);
    } else {
      setComplaintsList([]);
      setTotalCount(0);
      setError('Failed to load complaints. Please try again.');
    }

    if (userResult.status === 'fulfilled' && userResult.value.success) {
      const firstPage = userResult.value;
      const totalPages = firstPage.data.totalPages || 1;
      const remainingPages = totalPages > 1
        ? await Promise.allSettled(Array.from({ length: totalPages - 1 }, (_, index) => adminAccountService.getUsers({ page: index + 2, pageSize: 100 })))
        : [];
      const users = [
        ...firstPage.data.items,
        ...remainingPages
          .filter((r): r is PromiseFulfilledResult<typeof firstPage> => r.status === 'fulfilled' && r.value.success)
          .flatMap(r => r.value.data.items),
      ];
      setUserLookup(Object.fromEntries(users.map(user => [user.id, user])));
    }

    if (boothResult.status === 'fulfilled' && boothResult.value.success) {
      setBoothLookup(Object.fromEntries(boothResult.value.data.items.map(booth => [booth.id, booth as unknown as BoothInfo])));
    }

    if (marketResult.status === 'fulfilled' && marketResult.value.success) {
      setMarketNames(Object.fromEntries(marketResult.value.data.items.map(market => [market.id, market.name])));
    }

    setLoading(false);
  }, [activeTab, currentPage, searchQuery, itemsPerPage]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchComplaints(); }, [fetchComplaints, reloadKey]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const getUserName = (id: string) => userLookup[id]?.fullName || userLookup[id]?.email || 'Customer information unavailable';
  const getUserAvatar = (id: string) => userLookup[id]?.avatarUrl || '';
  const getBoothName = (id: string) => boothLookup[id]?.boothName || 'No data available';
  const getMarketNameByBooth = (boothId: string) => {
    const booth = boothLookup[boothId];
    return booth?.nightMarketName || marketNames[booth?.nightMarketId ?? ''] || 'No data available';
  };

  const countByStatus = (status: string) => {
    if (!statusCounts) return undefined;
    if (status === 'all') return statusCounts.All;
    return statusCounts[status as 'Pending' | 'Resolved' | 'Rejected'] ?? 0;
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  const selectedComplaint = complaintsList.find(c => c.id === selectedComplaintId);
  const complaintBooth = selectedComplaint ? { name: getBoothName(selectedComplaint.boothId), location: boothLookup[selectedComplaint.boothId]?.slotNumber || 'No data available' } : null;
  const complaintMarket = selectedComplaint ? { name: getMarketNameByBooth(selectedComplaint.boothId) } : null;
  const complaintUser = selectedComplaint ? { name: getUserName(selectedComplaint.customerId), avatar: getUserAvatar(selectedComplaint.customerId) } : null;
  const boothOwner = selectedComplaint && boothLookup[selectedComplaint.boothId]?.boothOwnerName
    ? { id: boothLookup[selectedComplaint.boothId].boothOwnerId, name: boothLookup[selectedComplaint.boothId].boothOwnerName, avatar: getUserAvatar(boothLookup[selectedComplaint.boothId].boothOwnerId) }
    : null;

  const resetFormState = () => {
    setActionMode(null);
    setActionError(null);
    setResolveResponse('');
    setResolveAction(ComplaintResolutionAction.NoViolation);
    setResolvePolicyViolation('');
    setSuspendConfirm(false);
    setRejectReason('');
  };

  const handleResolveSubmit = async () => {
    if (!selectedComplaintId || !resolveResponse.trim() || resolveResponse.trim().length < 10) return;
    if (resolveAction !== ComplaintResolutionAction.NoViolation && !resolvePolicyViolation.trim()) return;
    if (resolveAction === ComplaintResolutionAction.SuspendBooth && !suspendConfirm) return;

    setSubmitting(true);
    setActionError(null);
    try {
      await adminComplaintService.updateComplaintStatus(selectedComplaintId, {
        status: ComplaintStatus.Resolved,
        adminResponse: resolveResponse.trim(),
        resolutionAction: resolveAction,
        policyViolation: resolveAction !== ComplaintResolutionAction.NoViolation ? resolvePolicyViolation.trim() : null,
      });
      setSuccessMessage('Complaint resolved successfully.');
      setSelectedComplaintId(null);
      resetFormState();
      setReloadKey(k => k + 1);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setActionError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedComplaintId || !rejectReason.trim() || rejectReason.trim().length < 10) return;

    setSubmitting(true);
    setActionError(null);
    try {
      await adminComplaintService.updateComplaintStatus(selectedComplaintId, {
        status: ComplaintStatus.Rejected,
        adminResponse: rejectReason.trim(),
        resolutionAction: null,
        policyViolation: null,
      });
      setSuccessMessage('Complaint rejected successfully.');
      setSelectedComplaintId(null);
      resetFormState();
      setReloadKey(k => k + 1);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setActionError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedStatus = selectedComplaint ? mapBackendStatus(selectedComplaint.status) : '';
  const selectedResolutionAction = selectedComplaint ? mapBackendResolutionAction(selectedComplaint.resolutionAction) : null;
  const isPending = selectedStatus === 'Pending';
  const needsPolicyViolation = resolveAction === ComplaintResolutionAction.Warning || resolveAction === ComplaintResolutionAction.SuspendBooth;
  const canSubmitResolve = resolveResponse.trim().length >= 10 && (!needsPolicyViolation || resolvePolicyViolation.trim().length > 0) && (resolveAction !== ComplaintResolutionAction.SuspendBooth || suspendConfirm);
  const canSubmitReject = rejectReason.trim().length >= 10;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold" style={{ color: '#111827' }}>Complaint Management</h2>
          <p className="mt-1 text-sm" style={{ color: '#64748B' }}>Review and resolve customer complaints</p>
        </div>
      </div>

      {successMessage && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.75rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle className="w-4 h-4" style={{ color: '#34D399' }} />
          <span style={{ color: '#059669', fontSize: '0.875rem', fontWeight: 500 }}>{successMessage}</span>
        </div>
      )}

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '0.75rem', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#DC2626', fontSize: '0.875rem' }}>{error}</span>
          <button
            onClick={() => { setError(null); setReloadKey(k => k + 1); }}
            style={{ padding: '0.5rem 1rem', border: '1px solid #DC2626', borderRadius: '0.5rem', background: '#FFFFFF', color: '#DC2626', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600 }}
          >
            Retry
          </button>
        </div>
      )}

      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 4px 32px rgba(15,23,42,0.06)', borderRadius: '1rem', overflow: 'hidden' }}>
        <div className="flex overflow-x-auto" style={{ borderBottom: '1px solid #E5E7EB' }}>
          {statusTabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1.25rem',
                  fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', border: 'none',
                  borderBottom: isActive ? '2px solid #6366F1' : '2px solid transparent',
                  marginBottom: '-1px', background: 'transparent',
                  color: isActive ? '#818CF8' : '#64748B', cursor: 'pointer', transition: 'color 0.15s',
                }}
              >
                {tab.label}
                {countByStatus(tab.key) !== undefined && (
                  <span style={isActive
                    ? { background: 'rgba(99,102,241,0.2)', color: '#818CF8', borderRadius: '9999px', padding: '1px 8px', fontSize: '0.75rem', fontWeight: 600 }
                    : { background: '#FFFFFF', color: '#64748B', borderRadius: '9999px', padding: '1px 8px', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    {countByStatus(tab.key)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ padding: '1rem', borderBottom: '1px solid #E5E7EB' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#64748B' }} />
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{ width: '100%', paddingLeft: '2.25rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', background: '#F1F5F9', border: '1px solid #E5E7EB', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#374151', outline: 'none' }}
            />
          </div>
        </div>

        <div className="space-y-3" style={{ padding: '1rem' }}>
          {loading && (
            <div className="p-12 text-center">
              <div className="animate-pulse" style={{ color: '#64748B', fontSize: '0.875rem' }}>Loading complaints...</div>
            </div>
          )}

          {!loading && complaintsList.map(c => {
            const isSelected = selectedComplaintId === c.id;
            const isHovered = hoveredCard === c.id;
            const effectiveStatus = mapBackendStatus(c.status);
            const isDimmed = effectiveStatus === 'Resolved' || effectiveStatus === 'Rejected';

            return (
              <div
                key={c.id}
                onClick={() => { setSelectedComplaintId(c.id); resetFormState(); }}
                onMouseEnter={() => setHoveredCard(c.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  background: isSelected ? 'rgba(99,102,241,0.05)' : isHovered ? '#F1F5F9' : '#FFFFFF',
                  border: isSelected ? '1px solid rgba(99,102,241,0.4)' : isHovered ? '1px solid #E5E7EB' : '1px solid #F1F5F9',
                  borderRadius: '0.75rem', padding: '1.25rem', cursor: 'pointer',
                  transition: 'background 0.15s, border-color 0.15s, opacity 0.15s', opacity: isDimmed ? 0.55 : 1,
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span style={{ color: '#111827', fontSize: '0.875rem', fontWeight: 700 }}>{c.title || 'Complaint'}</span>
                      <span style={statusPillStyle[effectiveStatus] ?? statusPillStyle['Pending']}>{effectiveStatus}</span>
                    </div>
                    <p className="text-sm mb-2 line-clamp-2" style={{ color: '#4B5563' }}>{c.description}</p>
                    <div className="flex items-center gap-4 text-xs" style={{ color: '#64748B' }}>
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedUserId(c.customerId); }}
                        className="flex items-center gap-1 transition-colors"
                        style={{ color: '#64748B', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                      >
                        <UserIcon className="w-3 h-3" />
                        <span style={{ textDecoration: 'underline' }}>{getUserName(c.customerId)}</span>
                      </button>
                      <span className="flex items-center gap-1"><Store className="w-3 h-3" />{getBoothName(c.boothId)}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(c.createdAt).toLocaleDateString('en-US')}</span>
                      {c.imageUrls && c.imageUrls.length > 0 && (
                        <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" />{c.imageUrls.length} image{c.imageUrls.length > 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {!loading && complaintsList.length === 0 && (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(17,24,39,0.15)' }} />
              <p style={{ color: '#64748B' }}>No complaints found</p>
            </div>
          )}

          {!loading && complaintsList.length > 0 && (
            <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalCount} itemsPerPage={itemsPerPage} />
          )}
        </div>
      </div>

      <Modal
        isOpen={!!selectedComplaint}
        onClose={() => { setSelectedComplaintId(null); resetFormState(); }}
        title="Complaint Details"
        size="lg"
      >
        {selectedComplaint && complaintUser && complaintBooth && complaintMarket && (
          <div className="space-y-6">
            <div>
              <h3 style={{ color: '#111827', fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>{selectedComplaint.title || 'Complaint'}</h3>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span style={statusPillStyle[selectedStatus] ?? statusPillStyle['Pending']}>{selectedStatus}</span>
                {selectedStatus === 'Resolved' && selectedResolutionAction && resolutionActionLabels[selectedResolutionAction] && (
                  <span style={{ background: 'rgba(99,102,241,0.1)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '9999px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 500 }}>
                    {resolutionActionLabels[selectedResolutionAction]}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedUserId(selectedComplaint.customerId)}
                style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '0.75rem', padding: '1rem', textAlign: 'left', cursor: 'pointer' }}
              >
                <div className="flex items-center gap-2 mb-2" style={{ color: '#64748B', fontSize: '0.875rem' }}>
                  <UserIcon className="w-4 h-4" /><span>Reported By</span>
                </div>
                <div className="flex items-center gap-3">
                  {complaintUser.avatar
                    ? <ImageWithFallback src={complaintUser.avatar} alt={complaintUser.name} className="w-10 h-10 rounded-full" />
                    : <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#E5E7EB', color: '#64748B', fontSize: '0.875rem', fontWeight: 600 }}>{complaintUser.name?.charAt(0)?.toUpperCase() || '?'}</div>}
                  <div>
                    <p className="font-medium" style={{ color: '#374151' }}>{complaintUser.name}</p>
                    <p className="text-sm" style={{ color: '#818CF8' }}>View profile â†’</p>
                  </div>
                </div>
              </button>

              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '0.75rem', padding: '1rem' }}>
                <div className="flex items-center gap-2 mb-2" style={{ color: '#64748B', fontSize: '0.875rem' }}>
                  <Store className="w-4 h-4" /><span>Booth Involved</span>
                </div>
                <p className="font-medium" style={{ color: '#374151' }}>{complaintBooth.name}</p>
                <p className="text-sm mt-1" style={{ color: '#64748B' }}>{complaintMarket.name}</p>
                <p className="text-sm" style={{ color: '#64748B' }}>{complaintBooth.location}</p>
              </div>
            </div>

            {boothOwner && (
              <button
                onClick={() => setSelectedUserId(boothOwner.id)}
                style={{ width: '100%', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '0.75rem', padding: '1rem', textAlign: 'left', cursor: 'pointer' }}
              >
                <div className="flex items-center gap-2 mb-2" style={{ color: '#F59E0B', fontSize: '0.875rem' }}>
                  <Store className="w-4 h-4" /><span>Booth Owner</span>
                </div>
                <div className="flex items-center gap-3">
                  {boothOwner.avatar
                    ? <ImageWithFallback src={boothOwner.avatar} alt={boothOwner.name} className="w-10 h-10 rounded-full" />
                    : <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', fontSize: '0.875rem', fontWeight: 600 }}>{boothOwner.name?.charAt(0)?.toUpperCase() || '?'}</div>}
                  <div>
                    <p className="font-medium" style={{ color: '#374151' }}>{boothOwner.name}</p>
                    <p className="text-sm" style={{ color: '#818CF8' }}>View profile â†’</p>
                  </div>
                </div>
              </button>
            )}

            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '0.75rem', padding: '1rem' }}>
              <div className="flex items-center gap-2 mb-2" style={{ color: '#64748B', fontSize: '0.875rem' }}>
                <Calendar className="w-4 h-4" /><span>Submitted</span>
              </div>
              <p className="font-medium" style={{ color: '#374151' }}>{new Date(selectedComplaint.createdAt).toLocaleDateString()}</p>
            </div>

            <div>
              <p className="text-sm font-semibold mb-3" style={{ color: '#475569' }}>Description</p>
              <p className="leading-relaxed text-sm" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '0.75rem', padding: '1rem', color: '#4B5563' }}>
                {selectedComplaint.description}
              </p>
            </div>

            {selectedComplaint.imageUrls && selectedComplaint.imageUrls.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-3" style={{ color: '#475569' }}>Evidence Images</p>
                <div className="grid grid-cols-3 gap-3">
                  {selectedComplaint.imageUrls.map((url, idx) => (
                    <div key={`img-${idx}`} style={{ borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                      <ImageWithFallback src={url} alt={`Evidence ${idx + 1}`} className="w-full h-32 object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isPending && selectedComplaint.adminResponse && (
              <div>
                <p className="text-sm font-semibold mb-3" style={{ color: '#475569' }}>Admin Response</p>
                <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '0.75rem', padding: '1rem' }}>
                  <p className="text-sm" style={{ color: '#4B5563', whiteSpace: 'pre-wrap' }}>{selectedComplaint.adminResponse}</p>
                  {selectedStatus === 'Resolved' && selectedResolutionAction && resolutionActionLabels[selectedResolutionAction] && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid #E5E7EB' }}>
                      <p className="text-xs" style={{ color: '#64748B' }}>Action taken:</p>
                      <p className="text-sm font-medium" style={{ color: '#374151' }}>{resolutionActionLabels[selectedResolutionAction]}</p>
                    </div>
                  )}
                  {selectedComplaint.policyViolation && (
                    <div className="mt-2">
                      <p className="text-xs" style={{ color: '#64748B' }}>Policy violation:</p>
                      <p className="text-sm" style={{ color: '#4B5563' }}>{selectedComplaint.policyViolation}</p>
                    </div>
                  )}
                  <div className="mt-2">
                    <p className="text-xs" style={{ color: '#64748B' }}>Processed at: {new Date(selectedComplaint.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 space-y-3" style={{ borderTop: '1px solid #E5E7EB' }}>
              {actionError && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.5rem', padding: '0.75rem', fontSize: '0.8125rem', color: '#DC2626' }}>
                  {actionError}
                </div>
              )}

              {actionMode === 'resolve' && (
                <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '0.75rem', padding: '1rem' }}>
                  <p className="text-sm font-medium mb-3" style={{ color: '#34D399' }}>Resolve this complaint</p>
                  <textarea
                    value={resolveResponse} onChange={e => setResolveResponse(e.target.value)}
                    placeholder="Enter admin response for the customer (min 10 characters)..."
                    rows={3} disabled={submitting}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#F1F5F9', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#374151', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '0.75rem', opacity: submitting ? 0.6 : 1 }}
                  />
                  <p className="text-xs mb-2" style={{ color: '#64748B' }}>Resolution action:</p>
                  <select
                    value={resolveAction} onChange={e => { setResolveAction(Number(e.target.value) as ComplaintResolutionAction); setSuspendConfirm(false); }}
                    disabled={submitting}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#F1F5F9', border: '1px solid #E5E7EB', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#374151', outline: 'none', marginBottom: '0.75rem', opacity: submitting ? 0.6 : 1 }}
                  >
                    <option value={ComplaintResolutionAction.NoViolation}>Resolved without penalty</option>
                    <option value={ComplaintResolutionAction.Warning}>Warning</option>
                    <option value={ComplaintResolutionAction.SuspendBooth}>Suspend Booth</option>
                  </select>
                  {needsPolicyViolation && (
                    <textarea
                      value={resolvePolicyViolation} onChange={e => setResolvePolicyViolation(e.target.value)}
                      placeholder="Describe the policy violation (required for Warning/Suspend)..."
                      rows={2} disabled={submitting}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#F1F5F9', border: '1px solid rgba(217,119,6,0.3)', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#374151', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '0.75rem', opacity: submitting ? 0.6 : 1 }}
                    />
                  )}
                  {resolveAction === ComplaintResolutionAction.SuspendBooth && (
                    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '0.75rem' }}>
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#F87171' }} />
                        <div>
                          <p className="text-sm font-medium" style={{ color: '#F87171' }}>This will suspend the booth. The booth owner will be notified.</p>
                          <label className="flex items-center gap-2 mt-2" style={{ cursor: submitting ? 'default' : 'pointer' }}>
                            <input type="checkbox" checked={suspendConfirm} onChange={e => setSuspendConfirm(e.target.checked)} disabled={submitting} />
                            <span className="text-sm" style={{ color: '#DC2626' }}>I confirm this booth should be suspended</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleResolveSubmit} disabled={!canSubmitResolve || submitting}
                      style={{ padding: '0.5rem 1.25rem', background: canSubmitResolve && !submitting ? 'rgba(16,185,129,0.8)' : 'rgba(16,185,129,0.35)', color: '#fff', borderRadius: '0.5rem', fontWeight: 500, border: 'none', cursor: canSubmitResolve && !submitting ? 'pointer' : 'default', fontSize: '0.875rem', transition: 'background 0.15s' }}
                    >
                      {submitting ? 'Submitting...' : 'Confirm Resolve'}
                    </button>
                    <button onClick={() => setActionMode(null)} disabled={submitting} style={{ padding: '0.5rem 1rem', background: '#FFFFFF', color: '#475569', borderRadius: '0.5rem', fontWeight: 500, border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
                  </div>
                </div>
              )}

              {actionMode === 'reject' && (
                <div style={{ background: 'rgba(107,114,128,0.08)', border: '1px solid rgba(107,114,128,0.25)', borderRadius: '0.75rem', padding: '1rem' }}>
                  <p className="text-sm font-medium mb-2" style={{ color: '#6B7280' }}>Reject this complaint</p>
                  <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>The booth will not be affected. No penalty will be applied.</p>
                  <textarea
                    value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                    placeholder="Enter rejection reason (min 10 characters)..."
                    rows={3} disabled={submitting}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#F1F5F9', border: '1px solid rgba(107,114,128,0.3)', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#374151', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '0.75rem', opacity: submitting ? 0.6 : 1 }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleRejectSubmit} disabled={!canSubmitReject || submitting}
                      style={{ padding: '0.5rem 1.25rem', background: canSubmitReject && !submitting ? 'rgba(107,114,128,0.85)' : 'rgba(107,114,128,0.35)', color: '#fff', borderRadius: '0.5rem', fontWeight: 500, border: 'none', cursor: canSubmitReject && !submitting ? 'pointer' : 'default', fontSize: '0.875rem', transition: 'background 0.15s' }}
                    >
                      {submitting ? 'Submitting...' : 'Confirm Reject'}
                    </button>
                    <button onClick={() => setActionMode(null)} disabled={submitting} style={{ padding: '0.5rem 1rem', background: '#FFFFFF', color: '#475569', borderRadius: '0.5rem', fontWeight: 500, border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
                  </div>
                </div>
              )}

              {isPending && actionMode === null && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setActionMode('resolve')} disabled={submitting}
                    style={{ padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.8)', color: '#fff', borderRadius: '0.5rem', fontWeight: 500, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.875rem', transition: 'background 0.15s', opacity: submitting ? 0.5 : 1 }}
                    onMouseEnter={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = 'rgba(16,185,129,1)')}
                    onMouseLeave={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = 'rgba(16,185,129,0.8)')}
                  >
                    <CheckCircle className="w-4 h-4" />Resolve
                  </button>
                  <button
                    onClick={() => setActionMode('reject')} disabled={submitting}
                    style={{ padding: '0.75rem 1rem', background: 'rgba(107,114,128,0.8)', color: '#fff', borderRadius: '0.5rem', fontWeight: 500, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.875rem', transition: 'background 0.15s', opacity: submitting ? 0.5 : 1 }}
                    onMouseEnter={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = 'rgba(107,114,128,1)')}
                    onMouseLeave={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = 'rgba(107,114,128,0.8)')}
                  >
                    <XCircle className="w-4 h-4" />Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!selectedUserId} onClose={() => setSelectedUserId(null)} title="User Profile" size="md">
        {selectedUserId && userLookup[selectedUserId] && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              {getUserAvatar(selectedUserId)
                ? <ImageWithFallback src={getUserAvatar(selectedUserId)} alt={getUserName(selectedUserId)} className="w-20 h-20 rounded-full" />
                : <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: '#E5E7EB', color: '#64748B', fontSize: '1.5rem', fontWeight: 600 }}>{getUserName(selectedUserId).charAt(0).toUpperCase()}</div>}
              <div>
                <h3 className="text-xl font-semibold" style={{ color: '#111827' }}>{getUserName(selectedUserId)}</h3>
                <span style={{ display: 'inline-block', marginTop: '0.5rem', background: '#F3F4F6', color: '#818CF8', border: '1px solid #E5E7EB', borderRadius: '9999px', padding: '2px 10px', fontSize: '0.8rem', fontWeight: 500 }}>
                  {userLookup[selectedUserId].role}
                </span>
                <span style={{ display: 'inline-block', marginTop: '0.5rem', marginLeft: '0.5rem', background: userLookup[selectedUserId].status === 'Active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: userLookup[selectedUserId].status === 'Active' ? '#34D399' : '#F87171', border: '1px solid ' + (userLookup[selectedUserId].status === 'Active' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'), borderRadius: '9999px', padding: '2px 10px', fontSize: '0.8rem', fontWeight: 500 }}>
                  {userLookup[selectedUserId].status}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Email', value: userLookup[selectedUserId].email },
                { label: 'Phone', value: userLookup[selectedUserId].phone || 'No data available' },
                { label: 'Registered', value: new Date(userLookup[selectedUserId].createdAt || '').toLocaleDateString() },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '0.75rem', padding: '0.75rem' }}>
                  <div>
                    <p className="text-xs" style={{ color: '#64748B' }}>{item.label}</p>
                    <p className="text-sm font-medium" style={{ color: '#374151' }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
