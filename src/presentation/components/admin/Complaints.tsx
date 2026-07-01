"use client";
import { AlertCircle, User as UserIcon, Store, Calendar, Image as ImageIcon, AlertTriangle, Phone, Mail, MapPin, Package, Send, Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useState } from 'react';
import { Modal } from './components/Modal';
import { adminComplaintService, ComplaintStatus, ComplaintResolutionAction } from '@/application/features/admin/adminComplaintService';
import type { Complaint } from '@/shared/types';
import { useEffect } from 'react';
import { Pagination } from './components/Pagination';

type StatusTab = 'all' | 'Open' | 'Investigating' | 'Resolved' | 'Closed';
type ActionMode = null | 'resolve' | 'warn' | 'suspend';

interface LocalMessage {
  senderName: string;
  senderType: string;
  message: string;
  time: string;
}

const statusTabs: { key: StatusTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'Open', label: 'Open' },
  { key: 'Investigating', label: 'Investigating' },
  { key: 'Resolved', label: 'Resolved' },
  { key: 'Closed', label: 'Closed' },
];

const statusPillStyle: Record<string, React.CSSProperties> = {
  Open: { background: 'rgba(239,68,68,0.15)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 500 },
  Investigating: { background: 'rgba(59,130,246,0.15)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 500 },
  Resolved: { background: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 500 },
  Closed: { background: 'rgba(100,116,139,0.15)', color: '#64748B', border: '1px solid rgba(100,116,139,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 500 },
};


export function Complaints() {
  
  const [complaintsList, setComplaintsList] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await adminComplaintService.getAllComplaints(1, 1000);
      if (res.success) {
        setComplaintsList(res.data.items);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComplaints(); }, []);

  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [complaintStatuses, setComplaintStatuses] = useState<Record<string, string>>({});
  const [localConversations, setLocalConversations] = useState<Record<string, LocalMessage[]>>({});
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [warnReason, setWarnReason] = useState('');

  const getEffectiveStatus = (id: string, originalStatus: string) =>
    complaintStatuses[id] ?? originalStatus;

  const countByStatus = (status: string) =>
    complaintsList.filter(c =>
      status === 'all' ? true : getEffectiveStatus(c.id, c.status) === status
    ).length;

  const filtered = complaintsList.filter(c => {
    const effectiveStatus = getEffectiveStatus(c.id, c.status);
    if (activeTab !== 'all' && effectiveStatus !== activeTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.id.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedComplaints = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const addLocalMessage = (complaintId: string, msg: LocalMessage) => {
    setLocalConversations(prev => ({
      ...prev,
      [complaintId]: [...(prev[complaintId] ?? []), msg],
    }));
  };

  const handleSendMessage = () => {
    if (!adminResponse.trim() || !selectedComplaintId) return;
    addLocalMessage(selectedComplaintId, {
      senderName: 'Platform Admin',
      senderType: 'admin',
      message: adminResponse.trim(),
      time: new Date().toLocaleString(),
    });
    setAdminResponse('');
  };

  const handleResolveConfirm = async () => {
    if (!selectedComplaintId) return;
    try {
      await adminComplaintService.updateComplaintStatus(selectedComplaintId, {
        status: ComplaintStatus.Resolved,
        adminResponse: adminResponse,
        resolutionAction: ComplaintResolutionAction.NoViolation
      });
      fetchComplaints();
      setActionMode(null);
      setSelectedComplaintId(null);
      setAdminResponse('');
    } catch (e) { console.error(e); }
  };

  const handleWarnConfirm = async () => {
    if (!selectedComplaintId || !warnReason.trim()) return;
    try {
      await adminComplaintService.updateComplaintStatus(selectedComplaintId, {
        status: ComplaintStatus.UnderInvestigation,
        adminResponse: warnReason.trim(),
        resolutionAction: ComplaintResolutionAction.Warning
      });
      fetchComplaints();
      setWarnReason('');
      setActionMode(null);
      setSelectedComplaintId(null);
      setAdminResponse('');
    } catch (e) { console.error(e); }
  };

  const handleSuspendConfirm = async () => {
    if (!selectedComplaintId) return;
    try {
      await adminComplaintService.updateComplaintStatus(selectedComplaintId, {
        status: ComplaintStatus.Closed,
        adminResponse: 'Booth has been suspended pending investigation.',
        resolutionAction: ComplaintResolutionAction.SuspendBooth
      });
      fetchComplaints();
      setActionMode(null);
      setSelectedComplaintId(null);
      setAdminResponse('');
    } catch (e) { console.error(e); }
  };

  const selectedComplaint = complaintsList.find(c => c.id === selectedComplaintId);
  const selectedUser = null;
  const complaintBooth = null;
  const complaintMarket = null;
  const complaintUser = null;
  const boothOwner = null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold" style={{ color: '#111827' }}>Complaint Management</h2>
          <p className="mt-1 text-sm" style={{ color: '#64748B' }}>Review and resolve customer complaints</p>
        </div>
      </div>

      {/* Tab bar + filter */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          boxShadow: '0 4px 32px rgba(15,23,42,0.06)',
          borderRadius: '1rem',
          overflow: 'hidden',
        }}
      >
        <div
          className="flex overflow-x-auto"
          style={{ borderBottom: '1px solid #E5E7EB' }}
        >
          {statusTabs.map(tab => {
            const count = countByStatus(tab.key);
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.875rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #6366F1' : '2px solid transparent',
                  marginBottom: '-1px',
                  background: 'transparent',
                  color: isActive ? '#818CF8' : '#64748B',
                  cursor: 'pointer',
                  transition: 'color 0.15s',
                }}
              >
                {tab.label}
                <span
                  style={
                    isActive
                      ? { background: 'rgba(99,102,241,0.2)', color: '#818CF8', borderRadius: '9999px', padding: '1px 8px', fontSize: '0.75rem', fontWeight: 600 }
                      : { background: '#FFFFFF', color: '#64748B', borderRadius: '9999px', padding: '1px 8px', fontSize: '0.75rem', fontWeight: 600 }
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter bar */}
        <div
          style={{ padding: '1rem', borderBottom: '1px solid #E5E7EB' }}
        >
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: '#64748B' }}
            />
            <input
              type="text"
              placeholder="Search by ID, description, customer or booth..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{
                width: '100%',
                paddingLeft: '2.25rem',
                paddingRight: '1rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                background: '#F1F5F9',
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.8)',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Complaint list */}
        <div className="space-y-3" style={{ padding: '1rem' }}>
          {paginatedComplaints.map(c => {
            
            
            
            const isSelected = selectedComplaintId === c.id;
            const isHovered = hoveredCard === c.id;
            const effectiveStatus = getEffectiveStatus(c.id, c.status);
            const isDimmed = effectiveStatus === 'Resolved' || effectiveStatus === 'Closed';

            return (
              <div
                key={c.id}
                onClick={() => { setSelectedComplaintId(c.id); setActionMode(null); setWarnReason(''); }}
                onMouseEnter={() => setHoveredCard(c.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  background: isSelected
                    ? 'rgba(99,102,241,0.05)'
                    : isHovered
                    ? '#F1F5F9'
                    : '#FFFFFF',
                  border: isSelected
                    ? '1px solid rgba(99,102,241,0.4)'
                    : isHovered
                    ? '1px solid #E5E7EB'
                    : '1px solid #F1F5F9',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  transition: 'background 0.15s, border-color 0.15s, opacity 0.15s',
                  opacity: isDimmed ? 0.55 : 1,
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        style={{
                          fontFamily: 'monospace',
                          color: '#818CF8',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                        }}
                      >
                        {c.id}
                      </span>
                      <span style={statusPillStyle[effectiveStatus] ?? statusPillStyle['Closed']}>{effectiveStatus}</span>
                    </div>
                    <p className="text-sm mb-2 line-clamp-2" style={{ color: '#4B5563' }}>{c.description}</p>
                    <div className="flex items-center gap-4 text-xs" style={{ color: '#64748B' }}>
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedUserId(null); }}
                        className="flex items-center gap-1 transition-colors"
                        style={{ color: '#64748B', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                        onMouseEnter={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.color = '#818CF8')}
                        onMouseLeave={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.color = '#64748B')}
                      >
                        <UserIcon className="w-3 h-3" />
                        <span style={{ textDecoration: 'underline' }}>{'Customer ' + c.customerId.substring(0,8)}</span>
                      </button>
                      <span className="flex items-center gap-1">
                        <Store className="w-3 h-3" />
                        {'Booth ' + c.boothId.substring(0,8)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {'Order ' + c.orderId.substring(0,8)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {c.createdAt}
                      </span>
                      {/* removed images section */}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(17,24,39,0.15)' }} />
              <p style={{ color: '#64748B' }}>No complaints found</p>
            </div>
          )}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      </div>

      {/* Complaint Detail Modal */}
      <Modal
        isOpen={!!selectedComplaint}
        onClose={() => { setSelectedComplaintId(null); setAdminResponse(''); setActionMode(null); setWarnReason(''); }}
        title="Complaint Details"
        size="lg"
      >
        {selectedComplaint && complaintUser && complaintBooth && complaintMarket && (
          <div className="space-y-6">
            <div>
              <span
                style={{
                  fontFamily: 'monospace',
                  color: '#818CF8',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                }}
              >
                {selectedComplaint.id}
              </span>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {(() => {
                  const eff = getEffectiveStatus(selectedComplaint.id, selectedComplaint.status);
                  return <span style={statusPillStyle[eff] ?? statusPillStyle['Closed']}>{eff}</span>;
                })()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedUserId(selectedComplaint.customerId)}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = '#FFFFFF')}
                onMouseLeave={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = '#FFFFFF')}
              >
                <div className="flex items-center gap-2 mb-2" style={{ color: '#64748B', fontSize: '0.875rem' }}>
                  <UserIcon className="w-4 h-4" />
                  <span>Reported By</span>
                </div>
                <div className="flex items-center gap-3">
                  <img src={(complaintUser as any).avatar} alt={(complaintUser as any).name} className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="font-medium" style={{ color: '#374151' }}>{(complaintUser as any).name}</p>
                    <p className="text-sm" style={{ color: '#818CF8' }}>View profile →</p>
                  </div>
                </div>
              </button>

              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                }}
              >
                <div className="flex items-center gap-2 mb-2" style={{ color: '#64748B', fontSize: '0.875rem' }}>
                  <Store className="w-4 h-4" />
                  <span>Booth Involved</span>
                </div>
                <p className="font-medium" style={{ color: '#374151' }}>{(complaintBooth as any).name}</p>
                <p className="text-sm mt-1" style={{ color: '#64748B' }}>{(complaintMarket as any).name}</p>
                <p className="text-sm" style={{ color: '#64748B' }}>{(complaintBooth as any).location}</p>
              </div>
            </div>

            {boothOwner && (
              <button
                onClick={() => setSelectedUserId((boothOwner as any).id)}
                style={{
                  width: '100%',
                  background: 'rgba(245,158,11,0.07)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = 'rgba(245,158,11,0.12)')}
                onMouseLeave={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = 'rgba(245,158,11,0.07)')}
              >
                <div className="flex items-center gap-2 mb-2" style={{ color: '#F59E0B', fontSize: '0.875rem' }}>
                  <Package className="w-4 h-4" />
                  <span>Booth Owner</span>
                </div>
                <div className="flex items-center gap-3">
                  <img src={(boothOwner as any).avatar} alt={(boothOwner as any).name} className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="font-medium" style={{ color: '#374151' }}>{(boothOwner as any).name}</p>
                    <p className="text-sm" style={{ color: '#818CF8' }}>View profile →</p>
                  </div>
                </div>
              </button>
            )}

            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '0.75rem',
                padding: '1rem',
              }}
            >
              <div className="flex items-center gap-2 mb-2" style={{ color: '#64748B', fontSize: '0.875rem' }}>
                <Calendar className="w-4 h-4" />
                <span>Submitted</span>
              </div>
              <p className="font-medium" style={{ color: '#374151' }}>{new Date(selectedComplaint.createdAt).toLocaleDateString()}</p>
            </div>

            <div>
              <p className="text-sm font-semibold mb-3" style={{ color: '#475569' }}>Description</p>
              <p
                className="leading-relaxed text-sm"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  color: '#4B5563',
                }}
              >
                {selectedComplaint.description}
              </p>
            </div>

            {/* Removed images section */}

            <div>
              <p className="text-sm font-semibold mb-3" style={{ color: '#475569' }}>Conversation History</p>
              <div className="space-y-3">
                {[...((selectedComplaint as any).conversations || []), ...(localConversations[selectedComplaint.id] ?? [])].map((conv, idx) => (
                  <div
                    key={`conv-${idx}`}
                    style={
                      conv.senderType === 'admin'
                        ? { background: '#F3F4F6', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '0.75rem', padding: '1rem' }
                        : conv.senderType === 'booth_owner'
                        ? { background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '0.75rem', padding: '1rem' }
                        : { background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '0.75rem', padding: '1rem' }
                    }
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: '#374151' }}>{conv.senderName}</span>
                        <span
                          style={
                            conv.senderType === 'admin'
                              ? { background: 'rgba(99,102,241,0.2)', color: '#818CF8', borderRadius: '9999px', padding: '1px 8px', fontSize: '0.7rem' }
                              : conv.senderType === 'booth_owner'
                              ? { background: 'rgba(245,158,11,0.2)', color: '#F59E0B', borderRadius: '9999px', padding: '1px 8px', fontSize: '0.7rem' }
                              : { background: '#FFFFFF', color: '#64748B', borderRadius: '9999px', padding: '1px 8px', fontSize: '0.7rem' }
                          }
                        >
                          {conv.senderType === 'admin' ? 'Admin' : conv.senderType === 'booth_owner' ? 'Booth Owner' : 'Customer'}
                        </span>
                      </div>
                      <span className="text-xs" style={{ color: '#64748B' }}>{conv.time}</span>
                    </div>
                    <p className="text-sm" style={{ color: '#4B5563' }}>{conv.message}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Type an admin response..."
                  value={adminResponse}
                  onChange={e => setAdminResponse(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                  style={{
                    flex: 1,
                    padding: '0.5rem 1rem',
                    background: '#F1F5F9',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    color: 'rgba(255,255,255,0.8)',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  style={{
                    padding: '0.5rem 1rem',
                    background: adminResponse.trim() ? 'rgba(99,102,241,0.8)' : 'rgba(99,102,241,0.35)',
                    color: '#fff',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    border: 'none',
                    cursor: adminResponse.trim() ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLElement>) => { if (adminResponse.trim()) e.currentTarget.style.background = 'rgba(99,102,241,1)'; }}
                  onMouseLeave={(e: React.MouseEvent<HTMLElement>) => { if (adminResponse.trim()) e.currentTarget.style.background = 'rgba(99,102,241,0.8)'; }}
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>

            <div
              className="pt-4 space-y-3"
              style={{ borderTop: '1px solid #E5E7EB' }}
            >
              {/* Inline confirmation: Resolve */}
              {actionMode === 'resolve' && (
                <div
                  style={{
                    background: 'rgba(16,185,129,0.08)',
                    border: '1px solid rgba(16,185,129,0.25)',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                  }}
                >
                  <p className="text-sm font-medium mb-3" style={{ color: '#34D399' }}>
                    Mark this complaint as Resolved?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleResolveConfirm}
                      style={{
                        padding: '0.5rem 1.25rem',
                        background: 'rgba(16,185,129,0.8)',
                        color: '#fff',
                        borderRadius: '0.5rem',
                        fontWeight: 500,
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = 'rgba(16,185,129,1)')}
                      onMouseLeave={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = 'rgba(16,185,129,0.8)')}
                    >
                      Confirm Resolve
                    </button>
                    <button
                      onClick={() => setActionMode(null)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#FFFFFF',
                        color: '#475569',
                        borderRadius: '0.5rem',
                        fontWeight: 500,
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Inline form: Warn Booth */}
              {actionMode === 'warn' && (
                <div
                  style={{
                    background: 'rgba(217,119,6,0.08)',
                    border: '1px solid rgba(217,119,6,0.25)',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                  }}
                >
                  <p className="text-sm font-medium mb-3" style={{ color: '#F59E0B' }}>
                    Provide a reason for warniK the booth owner:
                  </p>
                  <textarea
                    value={warnReason}
                    onChange={e => setWarnReason(e.target.value)}
                    placeholder="Describe the reason for the warniK..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      background: '#F1F5F9',
                      border: '1px solid rgba(217,119,6,0.3)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      color: 'rgba(255,255,255,0.8)',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleWarnConfirm}
                      style={{
                        padding: '0.5rem 1.25rem',
                        background: warnReason.trim() ? 'rgba(217,119,6,0.85)' : 'rgba(217,119,6,0.35)',
                        color: '#fff',
                        borderRadius: '0.5rem',
                        fontWeight: 500,
                        border: 'none',
                        cursor: warnReason.trim() ? 'pointer' : 'default',
                        fontSize: '0.875rem',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e: React.MouseEvent<HTMLElement>) => { if (warnReason.trim()) e.currentTarget.style.background = 'rgba(217,119,6,1)'; }}
                      onMouseLeave={(e: React.MouseEvent<HTMLElement>) => { if (warnReason.trim()) e.currentTarget.style.background = 'rgba(217,119,6,0.85)'; }}
                    >
                      Send Warning
                    </button>
                    <button
                      onClick={() => { setActionMode(null); setWarnReason(''); }}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#FFFFFF',
                        color: '#475569',
                        borderRadius: '0.5rem',
                        fontWeight: 500,
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Inline confirmation: Suspend Booth */}
              {actionMode === 'suspend' && (
                <div
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                  }}
                >
                  <div className="flex items-start gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#F87171' }} />
                    <p className="text-sm font-medium" style={{ color: '#F87171' }}>
                      This will suspend the booth and close the complaint. This action will be logged and visible to the booth owner.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSuspendConfirm}
                      style={{
                        padding: '0.5rem 1.25rem',
                        background: 'rgba(239,68,68,0.85)',
                        color: '#fff',
                        borderRadius: '0.5rem',
                        fontWeight: 500,
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = 'rgba(239,68,68,1)')}
                      onMouseLeave={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = 'rgba(239,68,68,0.85)')}
                    >
                      Confirm Suspension
                    </button>
                    <button
                      onClick={() => setActionMode(null)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#FFFFFF',
                        color: '#475569',
                        borderRadius: '0.5rem',
                        fontWeight: 500,
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Action buttons row */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setActionMode(actionMode === 'resolve' ? null : 'resolve')}
                  style={{
                    padding: '0.75rem 1rem',
                    background: actionMode === 'resolve' ? 'rgba(16,185,129,1)' : 'rgba(16,185,129,0.8)',
                    color: '#fff',
                    borderRadius: '0.5rem',
                    fontWeight: 500,
                    border: actionMode === 'resolve' ? '2px solid rgba(16,185,129,0.6)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = 'rgba(16,185,129,1)')}
                  onMouseLeave={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = actionMode === 'resolve' ? 'rgba(16,185,129,1)' : 'rgba(16,185,129,0.8)')}
                >
                  <CheckCircle className="w-4 h-4" />
                  Resolve
                </button>
                <button
                  onClick={() => setActionMode(actionMode === 'warn' ? null : 'warn')}
                  style={{
                    padding: '0.75rem 1rem',
                    background: actionMode === 'warn' ? 'rgba(217,119,6,1)' : 'rgba(217,119,6,0.8)',
                    color: '#fff',
                    borderRadius: '0.5rem',
                    fontWeight: 500,
                    border: actionMode === 'warn' ? '2px solid rgba(217,119,6,0.6)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = 'rgba(217,119,6,1)')}
                  onMouseLeave={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = actionMode === 'warn' ? 'rgba(217,119,6,1)' : 'rgba(217,119,6,0.8)')}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Warn Booth
                </button>
                <button
                  onClick={() => setActionMode(actionMode === 'suspend' ? null : 'suspend')}
                  style={{
                    padding: '0.75rem 1rem',
                    background: actionMode === 'suspend' ? 'rgba(239,68,68,1)' : 'rgba(239,68,68,0.8)',
                    color: '#fff',
                    borderRadius: '0.5rem',
                    fontWeight: 500,
                    border: actionMode === 'suspend' ? '2px solid rgba(239,68,68,0.6)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = 'rgba(239,68,68,1)')}
                  onMouseLeave={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = actionMode === 'suspend' ? 'rgba(239,68,68,1)' : 'rgba(239,68,68,0.8)')}
                >
                  <AlertCircle className="w-4 h-4" />
                  Suspend Booth
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* User Profile Modal */}
      <Modal isOpen={!!selectedUser} onClose={() => setSelectedUserId(null)} title="User Profile" size="md">
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <img src={(selectedUser as any).avatar} alt={(selectedUser as any).name} className="w-20 h-20 rounded-full" />
              <div>
                <h3 className="text-xl font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{(selectedUser as any).name}</h3>
                <span
                  style={
                    (selectedUser as any).role === 'booth_owner'
                      ? { display: 'inline-block', marginTop: '0.5rem', background: '#F3F4F6', color: '#818CF8', border: '1px solid #E5E7EB', borderRadius: '9999px', padding: '2px 10px', fontSize: '0.8rem', fontWeight: 500 }
                      : { display: 'inline-block', marginTop: '0.5rem', background: 'rgba(20,184,166,0.15)', color: '#2DD4BF', border: '1px solid rgba(20,184,166,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '0.8rem', fontWeight: 500 }
                  }
                >
                  {(selectedUser as any).role === 'booth_owner' ? 'Booth Owner' : 'Customer'}
                </span>
                <span
                  style={
                    (selectedUser as any).status === 'Active'
                      ? { display: 'inline-block', marginTop: '0.5rem', marginLeft: '0.5rem', background: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '0.8rem', fontWeight: 500 }
                      : { display: 'inline-block', marginTop: '0.5rem', marginLeft: '0.5rem', background: 'rgba(239,68,68,0.15)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '0.8rem', fontWeight: 500 }
                  }
                >
                  {(selectedUser as any).status}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { icon: <Mail className="w-5 h-5" />, label: 'Email', value: (selectedUser as any).email },
                { icon: <Phone className="w-5 h-5" />, label: 'Phone', value: (selectedUser as any).phone },
                { icon: <Calendar className="w-5 h-5" />, label: 'Registered', value: (selectedUser as any).registered },
              ].map(item => (
                <div
                  key={item.label}
                  className="flex items-center gap-3"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.75rem',
                    padding: '0.75rem',
                  }}
                >
                  <span style={{ color: '#64748B' }}>{item.icon}</span>
                  <div>
                    <p className="text-xs" style={{ color: '#64748B' }}>{item.label}</p>
                    <p className="text-sm font-medium" style={{ color: '#374151' }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="pt-4 flex gap-3"
              style={{ borderTop: '1px solid #E5E7EB' }}
            >
              <button
                style={{
                  flex: 1,
                  padding: '0.5rem 1rem',
                  background: 'rgba(99,102,241,0.8)',
                  color: '#fff',
                  borderRadius: '0.5rem',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = 'rgba(99,102,241,1)')}
                onMouseLeave={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = 'rgba(99,102,241,0.8)')}
              >
                <Mail className="w-4 h-4" />
                Send Email
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '0.5rem 1rem',
                  background: 'rgba(16,185,129,0.8)',
                  color: '#fff',
                  borderRadius: '0.5rem',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = 'rgba(16,185,129,1)')}
                onMouseLeave={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = 'rgba(16,185,129,0.8)')}
              >
                <Phone className="w-4 h-4" />
                Call
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
