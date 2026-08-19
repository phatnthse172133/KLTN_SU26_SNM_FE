"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  FileText,
  Search,
  RotateCw,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Modal } from '@/presentation/components/admin/components/Modal';
import { Pagination } from '@/presentation/components/admin/components/Pagination';
import { boothRegistrationService, type RegistrationCounts } from '@/application/features/boothRegistration/boothRegistrationService';
import { nightMarketService } from '@/application/features/nightMarkets/nightMarketService';
import { useToast } from '@/presentation/components/shared/ToastContext';
import { getErrorMessage } from '@/shared/errors/errorMapper';
import type { BoothRegistration, NightMarket } from '@/shared/types';

type RegStatus = 'PendingReview' | 'Approved' | 'Rejected' | 'All';

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  boxShadow: '0 4px 32px rgba(15,23,42,0.06)',
  borderRadius: '1rem',
  overflow: 'hidden',
};

const theadThStyle: React.CSSProperties = {
  color: '#64748B',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 600,
  textAlign: 'left',
  padding: '0.75rem 1rem',
};

const selectStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: '0.5rem',
  color: '#334155',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 1rem',
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: '0.5rem',
  color: '#111827',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const statusConfig: Record<string, { label: string; bg: string; color: string; border: string; icon: React.ElementType }> = {
  PendingReview: { label: 'Pending', bg: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: 'rgba(245,158,11,0.25)', icon: Clock },
  Approved: { label: 'Approved', bg: 'rgba(16,185,129,0.15)', color: '#10B981', border: 'rgba(16,185,129,0.25)', icon: CheckCircle2 },
  Rejected: { label: 'Rejected', bg: 'rgba(239,68,68,0.15)', color: '#EF4444', border: 'rgba(239,68,68,0.25)', icon: XCircle },
};

function getStatusBadge(status: string) {
  const cfg = statusConfig[status] || statusConfig['PendingReview'];
  const Icon = cfg.icon;
  return (
    <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, borderRadius: '9999px', padding: '2px 10px', fontSize: '12px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function formatDate(d: string | null) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function BoothRegistrations() {
  const { showToast } = useToast();
  const [registrations, setRegistrations] = useState<BoothRegistration[]>([]);
  const [markets, setMarkets] = useState<NightMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RegStatus>('PendingReview');
  const [marketFilter, setMarketFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState<RegistrationCounts | null>(null);
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const pageSize = 10;

  const [selectedReg, setSelectedReg] = useState<BoothRegistration | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMarkets = useCallback(async () => {
    try {
      const resp = await nightMarketService.getMine();
      if (resp.success) {
        setMarkets(resp.data);
      }
    } catch {
      // Markets are optional for filter
    }
  }, []);

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await boothRegistrationService.getByMarketOwner({
        marketId: marketFilter !== 'all' ? marketFilter : null,
        status: statusFilter !== 'All' ? statusFilter : null,
        keyword: debouncedKeyword || null,
        page: currentPage,
        pageSize,
      });
      if (resp.success) {
        setRegistrations(resp.data.items);
        setTotalItems(resp.data.total);
        setTotalPages(resp.data.totalPages);
      } else {
        setError(getErrorMessage(resp));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [marketFilter, statusFilter, debouncedKeyword, currentPage]);

  const fetchCounts = useCallback(async () => {
    try {
      const resp = await boothRegistrationService.getCountsByMarketOwner(
        marketFilter !== 'all' ? marketFilter : null,
      );
      if (resp.success) {
        setCounts(resp.data);
      }
    } catch {
      // Counts are non-critical
    }
  }, [marketFilter]);

  useEffect(() => {
    void Promise.resolve().then(() => fetchMarkets());
  }, [fetchMarkets]);

  useEffect(() => {
    void Promise.resolve().then(() => fetchRegistrations());
  }, [fetchRegistrations]);

  useEffect(() => {
    void Promise.resolve().then(() => fetchCounts());
  }, [fetchCounts]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      setDebouncedKeyword(searchQuery.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const marketNames = new Map(markets.map(m => [m.id, m.name]));

  const handleApprove = async (reg: BoothRegistration) => {
    setSubmitting(true);
    try {
      await boothRegistrationService.review(reg.id, { approved: true });
      showToast('success', `Registration for "${reg.boothName}" has been approved.`);
      setShowDetail(false);
      setActionType(null);
      await fetchCounts();
      const itemLeavesCurrentFilter = statusFilter === 'PendingReview';
      if (itemLeavesCurrentFilter && registrations.length === 1 && currentPage > 1) {
        setCurrentPage(previous => previous - 1);
      } else {
        await fetchRegistrations();
      }
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReg) return;
    if (!rejectReason.trim()) {
      showToast('warning', 'A rejection reason is required.');
      return;
    }
    setSubmitting(true);
    try {
      await boothRegistrationService.review(selectedReg.id, { approved: false, rejectReason: rejectReason.trim() });
      showToast('success', `Registration for "${selectedReg.boothName}" has been rejected.`);
      setShowDetail(false);
      setActionType(null);
      setRejectReason('');
      await fetchCounts();
      const itemLeavesCurrentFilter = statusFilter === 'PendingReview';
      if (itemLeavesCurrentFilter && registrations.length === 1 && currentPage > 1) {
        setCurrentPage(previous => previous - 1);
      } else {
        await fetchRegistrations();
      }
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = (reg: BoothRegistration) => {
    setSelectedReg(reg);
    setShowDetail(true);
    setActionType(null);
    setRejectReason('');
  };

  const closeDetail = () => {
    setShowDetail(false);
    setSelectedReg(null);
    setActionType(null);
    setRejectReason('');
  };

  const statusTabs: RegStatus[] = ['PendingReview', 'Approved', 'Rejected', 'All'];
  const statusTabCounts: Record<string, number> = counts
    ? { PendingReview: counts.pendingReview, Approved: counts.approved, Rejected: counts.rejected, All: counts.total }
    : { PendingReview: 0, Approved: 0, Rejected: 0, All: 0 };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#7C3AED' }}>
          <ClipboardList className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booth Registrations</h1>
          <p className="text-sm text-gray-500">Review booth registration requests from Booth Owners</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Status tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#F1F5F9' }}>
          {statusTabs.map(tab => {
            const labels: Record<string, string> = { PendingReview: 'Pending', Approved: 'Approved', Rejected: 'Rejected', All: 'All' };
            const isActive = statusFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => { setStatusFilter(tab); setCurrentPage(1); }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: isActive ? '#FFFFFF' : 'transparent',
                  color: isActive ? '#111827' : '#64748B',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {labels[tab]}
                <span className="ml-1.5 text-xs" style={{ color: isActive ? '#7C3AED' : '#94A3B8' }}>
                  {statusTabCounts[tab]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Market filter */}
        <select
          value={marketFilter}
          onChange={e => { setMarketFilter(e.target.value); setCurrentPage(1); }}
          style={selectStyle}
          className="min-w-[180px]"
        >
          <option value="all">All Markets</option>
          {markets.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by booth name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={inputStyle}
            className="pl-9"
          />
        </div>

        {/* Retry */}
        <button
          onClick={() => fetchRegistrations()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ background: '#F3F4F6', color: '#475569', border: '1px solid #E5E7EB' }}
        >
          <RotateCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <span className="ml-3 text-gray-500">Loading...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20" style={cardStyle}>
          <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => fetchRegistrations()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#7C3AED', color: '#FFFFFF' }}
          >
            <RotateCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      ) : registrations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20" style={cardStyle}>
          <ClipboardList className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">No registrations found.</p>
        </div>
      ) : (
        <div style={cardStyle}>
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <th style={theadThStyle}>Booth</th>
                <th style={theadThStyle}>Market</th>
                <th style={theadThStyle}>Phone</th>
                <th style={theadThStyle}>Date</th>
                <th style={theadThStyle}>Status</th>
                <th style={theadThStyle}>Documents</th>
                <th style={{ ...theadThStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map(reg => (
                <tr
                  key={reg.id}
                  className="transition-all"
                  style={{ borderBottom: '1px solid #F1F5F9' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFBFC'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div className="font-medium text-sm text-gray-900">{reg.boothName}</div>
                    {reg.description && <div className="text-xs text-gray-400 truncate max-w-[200px]">{reg.description}</div>}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className="text-sm text-gray-600">{marketNames.get(reg.requestedNightMarketId) || 'N/A'}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className="text-sm text-gray-600">{reg.phone || 'N/A'}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className="text-sm text-gray-500">{formatDate(reg.createdAt)}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {getStatusBadge(reg.status)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className="text-xs text-gray-500">{reg.documents?.length || 0} file(s)</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openDetail(reg)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
                        style={{ background: '#F3F4F6', color: '#475569' }}
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {reg.status === 'PendingReview' && (
                        <>
                          <button
                            onClick={() => { setSelectedReg(reg); setShowDetail(true); setActionType('approve'); }}
                            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
                            style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}
                            title="Approve"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setSelectedReg(reg); setShowDetail(true); setActionType('reject'); }}
                            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
                            style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={pageSize}
          />
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={showDetail}
        onClose={closeDetail}
        title={actionType === 'approve' ? 'Approve Registration' : actionType === 'reject' ? 'Reject Registration' : 'Registration Details'}
        size="lg"
      >
        {selectedReg && (
          <div className="space-y-5">
            {/* Info grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Booth Name</label>
                <p className="text-sm font-semibold text-gray-900 mt-1">{selectedReg.boothName}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Market</label>
                <p className="text-sm text-gray-700 mt-1">{marketNames.get(selectedReg.requestedNightMarketId) || selectedReg.requestedNightMarketId}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</label>
                <p className="text-sm text-gray-700 mt-1">{selectedReg.ownerName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</label>
                <p className="text-sm text-gray-700 mt-1">{selectedReg.ownerEmail || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</label>
                <p className="text-sm text-gray-700 mt-1">{selectedReg.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Date</label>
                <p className="text-sm text-gray-700 mt-1">{formatDate(selectedReg.createdAt)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</label>
                <div className="mt-1">{getStatusBadge(selectedReg.status)}</div>
              </div>
              {selectedReg.preferredZoneId && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Preferred Zone</label>
                  <p className="text-sm text-gray-700 mt-1">{selectedReg.preferredZoneId}</p>
                </div>
              )}
            </div>

            {/* Description */}
            {selectedReg.description && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description</label>
                <p className="text-sm text-gray-700 mt-1 p-3 rounded-lg" style={{ background: '#F8FAFC', border: '1px solid #E5E7EB' }}>
                  {selectedReg.description}
                </p>
              </div>
            )}

            {/* Reject reason (if rejected) */}
            {selectedReg.status === 'Rejected' && selectedReg.rejectReason && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rejection Reason</label>
                <p className="text-sm text-red-600 mt-1 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  {selectedReg.rejectReason}
                </p>
              </div>
            )}

            {/* Documents */}
            {selectedReg.documents && selectedReg.documents.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Attached Documents</label>
                <div className="space-y-2">
                  {selectedReg.documents.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#F8FAFC', border: '1px solid #E5E7EB' }}>
                      <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{doc.documentType}</p>
                        <p className="text-xs text-gray-400 truncate">{doc.fileUrl}</p>
                      </div>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: doc.verificationStatus === 'Verified' ? 'rgba(16,185,129,0.15)' : doc.verificationStatus === 'Rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                          color: doc.verificationStatus === 'Verified' ? '#10B981' : doc.verificationStatus === 'Rejected' ? '#EF4444' : '#F59E0B',
                        }}
                      >
                        {doc.verificationStatus}
                      </span>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-600 hover:underline"
                      >
                        View
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action area */}
            {actionType === 'reject' && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Enter the reason for rejecting this registration..."
                  rows={3}
                  style={inputStyle}
                  className="resize-none"
                />
              </div>
            )}

            {/* Action buttons */}
            {selectedReg.status === 'PendingReview' && !actionType && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setActionType('approve')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => setActionType('reject')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            )}

            {actionType === 'approve' && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setActionType(null)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{ background: '#F3F4F6', color: '#475569', border: '1px solid #E5E7EB' }}
                >
                  Back
                </button>
                <button
                  onClick={() => handleApprove(selectedReg)}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: '#10B981', color: '#FFFFFF', opacity: submitting ? 0.6 : 1 }}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {submitting ? 'Processing...' : 'Confirm Approval'}
                </button>
              </div>
            )}

            {actionType === 'reject' && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setActionType(null); setRejectReason(''); }}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{ background: '#F3F4F6', color: '#475569', border: '1px solid #E5E7EB' }}
                >
                  Back
                </button>
                <button
                  onClick={handleReject}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: '#EF4444', color: '#FFFFFF', opacity: submitting ? 0.6 : 1 }}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  {submitting ? 'Processing...' : 'Confirm Rejection'}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}