"use client";

import {
  Store, Search, User, Eye, Edit, Ban, X, CheckCircle,
  FileText, ShieldCheck, AlertCircle, XCircle, ClipboardList,
  CheckCircle2, Info, MapPin, Calendar, Phone, Mail, Tag, ArrowLeft, DollarSign, RotateCw, Upload, Trash2, Loader2
} from 'lucide-react';
import { Modal } from './components/Modal';
import { useState, useEffect } from 'react';
import { adminBoothService, BoothStatus } from '@/application/features/admin/adminBoothService';
import { boothRegistrationService } from '@/application/features/boothRegistration/boothRegistrationService';
import type { Booth, BoothRegistration } from '@/shared/types';
import { Pagination } from './components/Pagination';
type MainTab = 'booths' | 'requests';
type BoothStatusFilter = 'Active' | 'Inactive' | 'Suspended' | 'Closed';
type RequestStatus = 'Pending' | 'Approved' | 'Rejected';
type RequestFilter = RequestStatus;

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

interface BoothManagementProps {
  onNavigate?: (tab: string, params?: any) => void;
}

export function BoothManagement({ onNavigate }: BoothManagementProps) {
  const [booths, setBooths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooths = async () => {
      try {
        setLoading(true);
        const res = await adminBoothService.getAllBooths(1, 1000);
        if (res.success) {
          const mapped = res.data.items.map((b: any) => ({
            id: b.id,
            name: b.boothName || 'No data available',
            boothName: b.boothName || 'No data available',
            owner: b.boothOwnerId || 'No data available',
            ownerId: b.boothOwnerId || '',
            boothOwnerId: b.boothOwnerId || '',
            market: b.nightMarketId || 'No data available',
            marketId: b.nightMarketId || '',
            nightMarketId: b.nightMarketId || '',
            category: 'No data available',
            phone: b.phoneNumber || 'No data available',
            phoneNumber: b.phoneNumber || '',
            boothCode: b.boothCode || 'No data available',
            location: b.slotNumber || 'No data available',
            revenue: 'No data available',
            createdAt: 'No data available',
            status: b.status,
            image: b.thumbnailUrl || '',
            description: b.description || '',
          }));
          setBooths(mapped);
        }
      } catch (error) {
        console.error("Failed to load booths", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooths();
  }, []);
  const [mainTab, setMainTab] = useState<MainTab>('booths');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BoothStatusFilter>('Active');
  const [planFilter, setPlanFilter] = useState('all');
  const [marketFilter, setMarketFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedBooth, setSelectedBooth] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'view' | 'edit' | 'suspend' | 'delete' | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; label: string } | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [showOwnerDetails, setShowOwnerDetails] = useState<any | null>(null);
  const itemsPerPage = 10;

  const uniqueMarkets = Array.from(new Set(booths.map(b => b.market)));
  const uniqueCategories = Array.from(new Set(booths.map(b => b.category)));

  const boothListData = booths;
  const filteredBooth = boothListData.filter(b => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      b.name.toLowerCase().includes(q) ||
      b.owner.toLowerCase().includes(q) ||
      b.boothCode.toLowerCase().includes(q) ||
      b.phone.includes(q);
    const matchStatus = b.status === statusFilter;
    const matchPlan = planFilter === 'all' || b.plan === planFilter;
    const matchMarket = marketFilter === 'all' || b.market === marketFilter;
    const matchCategory = categoryFilter === 'all' || b.category === categoryFilter;
    return matchSearch && matchStatus && matchPlan && matchMarket && matchCategory;
  });

  const totalPages = Math.ceil(filteredBooth.length / itemsPerPage);
  const paginatedBooth = filteredBooth.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Booth Requests state
  const [reqFilter, setReqFilter] = useState<RequestFilter>('Pending');
  const [reqPage, setReqPage] = useState(1);
  const [requestBooth, setRequestBooth] = useState<any[]>([]);
  const [reqStatuses, setReqStatuses] = useState<Record<string, RequestStatus>>({});
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [selectedReqDetailId, setSelectedReqDetailId] = useState<string | null>(null);
  const [reqActionStep, setReqActionStep] = useState<'idle' | 'confirming-approve' | 'confirming-reject' | 'confirming-info' | 'done'>('idle');
  const [reqActionNote, setReqActionNote] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const reqPerPage = 6;

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await boothRegistrationService.getPending(1, 1000);
        if (res.success) {
          setRequestBooth(res.data.items.map((r: BoothRegistration) => ({
            id: r.id,
            name: r.boothName || 'No data available',
            ownerId: r.ownerId || '',
            owner: r.ownerId || 'No data available',
            marketId: r.requestedNightMarketId || '',
            market: r.requestedNightMarketId || 'No data available',
            category: 'No data available',
            phone: r.phone || 'No data available',
            createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : 'No data available',
            status: r.status === 'PendingReview' ? 'Pending' : r.status,
            description: r.description || '',
            documents: r.documents || [],
          })));
        }
      } catch (error) {
        console.error("Failed to load booth requests", error);
        setRequestBooth([]);
      }
    };
    fetchRequests();
  }, []);

  const getReqStatus = (b: { id: string; status: string }): RequestStatus => {
    if (b.id in reqStatuses) return reqStatuses[b.id];
    if (b.status === 'Approved' || b.status === 'Rejected') return b.status as RequestStatus;
    return 'Pending';
  };

  const reqCounts: Record<RequestFilter, number> = {
    Pending: requestBooth.filter(b => getReqStatus(b) === 'Pending').length,
    Approved: requestBooth.filter(b => getReqStatus(b) === 'Approved').length,
    Rejected: requestBooth.filter(b => getReqStatus(b) === 'Rejected').length,
  };

  const filteredReqs = requestBooth.filter(b => getReqStatus(b) === reqFilter);
  const reqTotalPages = Math.ceil(filteredReqs.length / reqPerPage);
  const pagedReqs = filteredReqs.slice((reqPage - 1) * reqPerPage, reqPage * reqPerPage);

  const handleReqAction = async (type: 'approve' | 'reject', boothId?: string) => {
    const id = boothId ?? selectedReqId;
    if (!id) return;
    const newStatus: RequestStatus = type === 'approve' ? 'Approved' : 'Rejected';
    try {
      await boothRegistrationService.review(id, {
        approved: type === 'approve',
        rejectReason: type === 'reject' ? (reqActionNote || 'Rejected by admin') : null,
      });
    } catch (error) {
      console.error("Failed to review booth request", error);
      setToastMsg('Action failed');
      setTimeout(() => setToastMsg(null), 2500);
      return;
    }
    setReqStatuses(prev => ({ ...prev, [id]: newStatus }));
    setRequestBooth(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
    setToastMsg(type === 'approve' ? 'Booth approved successfully' : 'Booth rejected');
    setReqActionStep('done');
    setTimeout(() => { setToastMsg(null); setReqActionStep('idle'); setReqActionNote(''); setSelectedReqId(null); }, 2500);
  };

  const boothOwner = selectedBooth ? { id: selectedBooth.ownerId || selectedBooth.boothOwnerId, name: selectedBooth.owner || 'No data available', avatar: '', email: 'No data available', phone: selectedBooth.phone || 'No data available' } : null;

  const closeModals = () => { setSelectedBooth(null); setActionType(null); };
  const closeReqModal = () => { setSelectedReqDetailId(null); setSelectedReqId(null); };

  const reqDetailBooth = selectedReqDetailId !== null ? requestBooth.find(b => b.id === selectedReqDetailId) ?? null : null;
  const reqDetailOwner = reqDetailBooth ? { id: reqDetailBooth.ownerId, name: reqDetailBooth.owner, email: 'No data available', phone: reqDetailBooth.phone } : null;
  const reqDetailMarket = reqDetailBooth ? { id: reqDetailBooth.marketId, name: reqDetailBooth.market } : null;
  const reqDetailStatus = reqDetailBooth ? getReqStatus(reqDetailBooth) : 'Pending';

  const statusBadge = (status: string): React.CSSProperties => {
    if (status === 'Active') return { background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center' };
    if (status === 'Suspended') return { background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center' };
    if (status === 'Pending') return { background: 'rgba(245,158,11,0.15)', color: '#FBBF24', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center' };
    return { background: 'rgba(100,116,139,0.15)', color: '#64748B', border: '1px solid rgba(100,116,139,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center' };
  };

  const modalStyle: React.CSSProperties = {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '1rem',
    boxShadow: '0 24px 64px rgba(15,23,42,0.14)',
  };

  const selectStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '0.5rem',
    color: '#334155',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box'
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
    boxSizing: 'border-box'
  };

  const handleToggleBoothStatusConfirm = async () => {
    if (!selectedBooth) return;
    if (selectedBooth.status === 'Active' && !suspendReason.trim()) return;
    // Map UI string status to backend enum integer
    const newStatusStr = selectedBooth.status === 'Active' ? 'Suspended' : 'Active';
    const newStatusEnum = selectedBooth.status === 'Active' ? BoothStatus.Suspended : BoothStatus.Active;
    try {
      // AdminUpdateBoothRequest extends UpdateMyBoothRequest which has [Required] BoothName.
      // Must always send boothName along with status to satisfy backend validation.
      await adminBoothService.updateBooth(selectedBooth.id, {
        boothName: selectedBooth.boothName,          // required field
        description: selectedBooth.description ?? undefined,
        phoneNumber: selectedBooth.phoneNumber || undefined,
        status: newStatusEnum,                  // send int enum value
        isFeatured: false,
      });
      setBooths(prev => prev.map(b => b.id === selectedBooth.id ? { ...b, status: newStatusStr } : b));
      setSuspendReason('');
      closeModals();
    } catch (e) {
      console.error('Failed to update booth status:', e);
    }
  };

  const handleDeleteBoothConfirm = () => {
    if (!selectedBooth) return;
    setBooths(prev => prev.filter(b => b.id !== selectedBooth.id));
    setToastMsg('Booth deleted successfully');
    closeModals();
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleEditSave = () => {
    if (!selectedBooth) return;
    closeModals();
  };

  // --- Booth Detailed Screen ---
  if (selectedBooth && actionType === 'view' && boothOwner) {
    return (
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {toastMsg && (
          <div className="fixed top-5 right-5 z-[9999] bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-sm font-semibold">
            {toastMsg}
          </div>
        )}
        
        <div>
          <button
            onClick={closeModals}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'transparent',
              border: 'none',
              color: '#4F46E5',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              padding: 0
            }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Booth List
          </button>
        </div>

        {/* Profile Card */}
        <div style={cardStyle}>
          <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              {selectedBooth.image ? (
                <img src={selectedBooth.image} alt={selectedBooth.boothName} style={{ width: '4.5rem', height: '4.5rem', borderRadius: '0.75rem', objectFit: 'cover', flexShrink: 0, boxShadow: '0 0 0 3px rgba(99,102,241,0.3)' }} />
              ) : (
                <div style={{ width: '4.5rem', height: '4.5rem', borderRadius: '0.75rem', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 0 3px rgba(99,102,241,0.3)' }}>
                  <Store style={{ width: '1.75rem', height: '1.75rem', color: '#818CF8' }} />
                </div>
              )}
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0 }}>{selectedBooth.boothName}</h3>
                <p style={{ color: '#64748B', fontSize: '0.875rem', margin: '0.25rem 0 0', fontFamily: 'monospace' }}>ID: #{selectedBooth.id}</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span style={statusBadge(selectedBooth.status)}>{selectedBooth.status}</span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setActionType('edit')}
                style={{ padding: '0.5rem 1rem', background: '#2563EB', color: 'white', borderRadius: '0.5rem', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem' }}
              >
                <Edit style={{ width: '1rem', height: '1rem' }} /> Edit Details
              </button>
              
              {selectedBooth.status === 'Active' ? (
                <button
                  onClick={() => setActionType('suspend')}
                  style={{ padding: '0.5rem 1rem', background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#EF4444', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                >
                  <Ban style={{ width: '1rem', height: '1rem' }} /> Suspend Booth
                </button>
              ) : (
                <button
                  onClick={() => setActionType('suspend')}
                  style={{ padding: '0.5rem 1rem', background: '#ECFDF5', border: '1px solid #D1FAE5', color: '#10B981', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                >
                  <CheckCircle style={{ width: '1rem', height: '1rem' }} /> Activate Booth
                </button>
              )}

              <button
                onClick={() => setActionType('delete')}
                style={{ padding: '0.5rem 1rem', background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#EF4444', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
              >
                <Trash2 style={{ width: '1rem', height: '1rem' }} /> Delete Booth
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', padding: '1.5rem', borderTop: '1px solid #E5E7EB', background: '#F8FAFC' }}>
            {[
              { icon: <MapPin style={{ width: '1rem', height: '1rem', color: '#64748B' }} />, label: 'Market', value: 'Market ID: ' + selectedBooth.nightMarketId },
              { icon: <Tag style={{ width: '1rem', height: '1rem', color: '#64748B' }} />, label: 'Category', value: 'No data available' },
              { icon: <Store style={{ width: '1rem', height: '1rem', color: '#64748B' }} />, label: 'Zone / Slot', value: selectedBooth.location || 'No data available' },
              { icon: <DollarSign style={{ width: '1rem', height: '1rem', color: '#64748B' }} />, label: 'Subscription Plan', value: 'No data available' },
              { icon: <Calendar style={{ width: '1rem', height: '1rem', color: '#64748B' }} />, label: 'Registration Date', value: 'No data available' },
            ].map(item => (
              <div key={item.label} style={{ padding: '1rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '12px', fontWeight: 500, marginBottom: '0.375rem' }}>
                  {item.icon} {item.label}
                </div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1F2937', margin: 0 }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Owner Info & Description */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Owner Profile */}
          <div style={cardStyle}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>Booth Owner Information</h4>
              <button
                onClick={() => onNavigate && onNavigate('users', { userId: boothOwner.id })}
                style={{ background: 'transparent', border: 'none', color: '#4F46E5', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                View Account Details
              </button>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {boothOwner.avatar ? (
                  <img src={boothOwner.avatar} alt={boothOwner.name} style={{ width: '3.5rem', height: '3.5rem', borderRadius: '9999px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '9999px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User style={{ width: '1.5rem', height: '1.5rem', color: '#4F46E5' }} />
                  </div>
                )}
                <div>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>{boothOwner.name}</p>
                  <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.15rem 0 0' }}>Owner ID: #{boothOwner.id}</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#475569' }}>
                  <Mail style={{ width: '1rem', height: '1rem', color: '#64748B' }} /> {boothOwner.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#475569' }}>
                  <Phone style={{ width: '1rem', height: '1rem', color: '#64748B' }} /> {(selectedBooth.phone || 'No data available')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#475569' }}>
                  <Calendar style={{ width: '1rem', height: '1rem', color: '#64748B' }} /> Owner since No data available
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#475569' }}>
                  <MapPin style={{ width: '1rem', height: '1rem', color: '#64748B' }} /> {(boothOwner as any).address || 'No data available'}
                </div>
              </div>
            </div>
          </div>

          {/* Description & Docs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {selectedBooth.description && (
              <div style={cardStyle}>
                <div style={{ padding: '1.25rem', borderBottom: '1px solid #E5E7EB' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>Description</h4>
                </div>
                <div style={{ padding: '1.25rem' }}>
                  <p style={{ fontSize: '0.875rem', color: '#334155', margin: 0, lineHeight: 1.5 }}>{selectedBooth.description}</p>
                </div>
              </div>
            )}
            {/* Documents */}
            {(selectedBooth as any).documents && (
              <div style={{ padding: '1.25rem', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', margin: 0 }}>Documents & Identity</h4>
                  <FileText style={{ width: '1.25rem', height: '1.25rem', color: '#94A3B8' }} />
                </div>
                
                {/* CCCD / Citizen ID */}
                <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '1.25rem' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Citizen ID Card (CCCD)</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {[
                      { label: 'CCCD - Front Side', url: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400' },
                      { label: 'CCCD - Back Side', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400' },
                    ].map(({ label, url }) => (
                      <div
                        key={label}
                        onClick={() => setPreviewDoc({ url, label })}
                        style={{ width: '10rem', height: '6.5rem', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #E2E8F0', cursor: 'pointer', transition: 'all 0.15s', position: 'relative' }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.15)'; e.currentTarget.style.borderColor = '#6366F1'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                        title={`Click to view ${label}`}
                      >
                        <img src={url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', padding: '0.25rem 0.5rem' }}>
                          <span style={{ fontSize: '9px', color: '#FFFFFF', fontWeight: 600 }}>{label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {[
                    { doc: (selectedBooth as any).documents.businessLicense, label: 'Business License', images: ['https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400'] },
                    { doc: (selectedBooth as any).documents.foodSafety, label: 'Food Safety Certificate', images: ['https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400', 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400'] },
                    { doc: (selectedBooth as any).documents.healthPermit, label: 'Health Permit', images: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400'] },
                  ].filter(({ doc }) => doc).map(({ doc, label, images }) => doc && (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1F2937' }}>{label}</span>
                          {doc.verified && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              background: '#ECFDF5',
                              color: '#10B981',
                              textTransform: 'lowercase'
                            }}>
                              approved
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p style={{ fontSize: '11px', color: '#94A3B8', margin: '0 0 0.25rem' }}>
                        {doc.uploadedAt ? `Uploaded at ${doc.uploadedAt}` : 'May 28, 2026'}
                      </p>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                        {images.map((imgUrl, imgIdx) => (
                          <div 
                            key={imgIdx}
                            onClick={() => setPreviewDoc({ url: imgUrl, label: `${label} - Image ${imgIdx + 1}` })}
                            style={{
                              width: '6.5rem',
                              height: '5rem',
                              borderRadius: '0.5rem',
                              overflow: 'hidden',
                              border: '1px solid #E2E8F0',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease-in-out'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.03)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.15)';
                              e.currentTarget.style.borderColor = '#6366F1';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'none';
                              e.currentTarget.style.boxShadow = 'none';
                              e.currentTarget.style.borderColor = '#E2E8F0';
                            }}
                            title="Click to view full image"
                          >
                            <img src={imgUrl} alt={`${label} ${imgIdx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Booth Owner Detail Modal */}
        <Modal isOpen={!!showOwnerDetails} onClose={() => setShowOwnerDetails(null)} title="Booth Owner Account Details" size="md">
          {showOwnerDetails && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src={showOwnerDetails.avatar} alt={showOwnerDetails.name} style={{ width: '4.5rem', height: '4.5rem', borderRadius: '9999px', objectFit: 'cover', boxShadow: '0 0 0 3px rgba(99,102,241,0.3)' }} />
                <div>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>{showOwnerDetails.name}</h4>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>Role: Booth Owner · ID: #{showOwnerDetails.id}</p>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: showOwnerDetails.status === 'Active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: showOwnerDetails.status === 'Active' ? '#10B981' : '#EF4444',
                    borderRadius: '9999px',
                    padding: '2px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    marginTop: '0.4rem'
                  }}>{showOwnerDetails.status}</span>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                {[
                  { icon: <Mail className="w-4 h-4" />, label: 'Email', value: showOwnerDetails.email },
                  { icon: <Phone className="w-4 h-4" />, label: 'Phone', value: (showOwnerDetails as any).phone },
                  { icon: <Calendar className="w-4 h-4" />, label: 'Registered', value: (showOwnerDetails as any).registered },
                  { icon: <MapPin className="w-4 h-4" />, label: 'Address', value: (showOwnerDetails as any).address || "123 Nguyen Hue St, District 1, Ho Chi Minh City" },
                ].map(item => (
                  <div key={item.label} style={{ padding: '0.75rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ color: '#64748B' }}>{item.icon}</div>
                    <div>
                      <p style={{ fontSize: '11px', color: '#64748B', margin: 0, fontWeight: 500 }}>{item.label}</p>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1F2937', margin: 0 }}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid #E5E7EB', paddingTop: '1.25rem' }}>
                {showOwnerDetails.status === 'Active' ? (
                  <button
                    onClick={() => {
                      showOwnerDetails.status = 'Suspended';
                      setToastMsg("Account suspended successfully");
                      setShowOwnerDetails(null);
                      setTimeout(() => setToastMsg(null), 2000);
                    }}
                    style={{ flex: 1, padding: '0.5rem 1rem', background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#EF4444', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
                  >
                    <Ban style={{ width: '1rem', height: '1rem' }} /> Ban Account
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      showOwnerDetails.status = 'Active';
                      setToastMsg("Account restored successfully");
                      setShowOwnerDetails(null);
                      setTimeout(() => setToastMsg(null), 2000);
                    }}
                    style={{ flex: 1, padding: '0.5rem 1rem', background: '#ECFDF5', border: '1px solid #D1FAE5', color: '#10B981', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
                  >
                    <CheckCircle style={{ width: '1rem', height: '1rem' }} /> Restore Account
                  </button>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* Document Preview Modal */}
        <Modal isOpen={!!previewDoc} onClose={() => setPreviewDoc(null)} title={previewDoc?.label || "Document Preview"} size="md">
          {previewDoc && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '0.5rem' }}>
              <img src={previewDoc.url} alt={previewDoc.label} style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: '0.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }} />
              <button
                onClick={() => setPreviewDoc(null)}
                style={{ padding: '0.5rem 1.5rem', background: '#4F46E5', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#4338CA'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#4F46E5'}
              >
                Close Preview
              </button>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {toastMsg && (
        <div className="fixed top-5 right-5 z-[9999] bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-sm font-semibold">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827' }}>Booth Management</h2>
          <p style={{ color: '#64748B', marginTop: '0.25rem', fontSize: '0.875rem' }}>Manage all booths across night markets</p>
        </div>

      </div>

      {/* Main Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB' }}>
        {([
          { key: 'booths' as MainTab, label: 'Booth List', icon: <Store className="w-4 h-4" />, count: boothListData.length },
          { key: 'requests' as MainTab, label: 'Booth Requests', icon: <ClipboardList className="w-4 h-4" />, count: requestBooth.length },
        ]).map(tab => {
          const isAct = mainTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setMainTab(tab.key)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '0.9375rem', fontWeight: 600, border: 'none', borderBottom: isAct ? '2px solid #6366F1' : '2px solid transparent', marginBottom: '-1px', background: isAct ? 'rgba(99,102,241,0.06)' : 'transparent', color: isAct ? '#818CF8' : '#64748B', cursor: 'pointer' }}>
              {tab.icon}{tab.label}
              <span style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '9999px', background: isAct ? 'rgba(99,102,241,0.25)' : '#FFFFFF', color: isAct ? '#818CF8' : '#64748B', fontWeight: 500 }}>{tab.count}</span>
            </button>
          );
        })}
      </div>

      {mainTab === 'booths' && (
      <div style={cardStyle}>
        {/* Status Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', overflowX: 'auto' }}>
          {(['Active', 'Inactive', 'Suspended', 'Closed'] as BoothStatusFilter[]).map(status => {
            const count = boothListData.filter(b => b.status === status).length;
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1.25rem', fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.15s', marginBottom: '-1px', color: isActive ? '#818CF8' : '#64748B', background: isActive ? 'rgba(99,102,241,0.05)' : 'transparent', border: 'none', borderBottom: isActive ? '2px solid #6366F1' : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {status}
                <span style={{ padding: '1px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 500, background: isActive ? 'rgba(99,102,241,0.2)' : '#FFFFFF', color: isActive ? '#818CF8' : '#64748B' }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div style={{ padding: '1rem', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: '#64748B' }} />
            <input
              type="text"
              placeholder="Search by name, owner, code, phone..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{ ...selectStyle, width: '100%', paddingLeft: '2.5rem' }}
            />
          </div>
          <select value={marketFilter} onChange={e => { setMarketFilter(e.target.value); setCurrentPage(1); }} style={selectStyle}>
            <option value="all">All Markets</option>
            {uniqueMarkets.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }} style={selectStyle}>
            <option value="all">All Categories</option>
            {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
                <th style={theadThStyle}>Booth Name</th>
                <th style={theadThStyle}>Owner</th>
                <th style={theadThStyle}>Phone</th>
                <th style={theadThStyle}>Market</th>
                <th style={theadThStyle}>Zone / Slot</th>
                <th style={{ ...theadThStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBooth.map(booth => (
                <tr
                  key={booth.id}
                  onClick={() => { setSelectedBooth(booth); setActionType('view'); }}
                  onMouseEnter={() => setHoveredRow(booth.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{ borderBottom: '1px solid #E5E7EB', background: hoveredRow === booth.id ? '#F8FAFC' : 'transparent', transition: 'background 0.15s', cursor: 'pointer' }}
                >
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {booth.image ? (
                        <img src={booth.image} alt={booth.name} style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', objectFit: 'cover', flexShrink: 0, border: '1px solid #E5E7EB' }} />
                      ) : (
                        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Store style={{ width: '1rem', height: '1rem', color: '#818CF8' }} />
                        </div>
                      )}
                      <span style={{ fontWeight: 500, color: '#111827', fontSize: '0.875rem' }}>{booth.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{booth.owner}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#64748B' }}>{booth.phone}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#64748B', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{booth.market}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#64748B' }}>Zone {booth.zone} · #{booth.slotNumber}</td>

                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => { setSelectedBooth(booth); setActionType('view'); }}
                        style={{ padding: '0.375rem', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '0.375rem', color: '#64748B', display: 'flex', alignItems: 'center' }}
                        title="View"
                      >
                        <Eye style={{ width: '1rem', height: '1rem' }} />
                      </button>
                      <button
                        onClick={() => { setSelectedBooth(booth); setActionType('edit'); }}
                        style={{ padding: '0.375rem', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '0.375rem', color: '#64748B', display: 'flex', alignItems: 'center' }}
                        title="Edit"
                      >
                        <Edit style={{ width: '1rem', height: '1rem' }} />
                      </button>
                      <button
                        onClick={() => { setSelectedBooth(booth); setActionType('suspend'); }}
                        style={{ padding: '0.375rem', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '0.375rem', color: '#64748B', display: 'flex', alignItems: 'center' }}
                        title="Suspend/Activate"
                      >
                        <Ban style={{ width: '1rem', height: '1rem' }} />
                      </button>
                      <button
                        onClick={() => { setSelectedBooth(booth); setActionType('delete'); }}
                        style={{ padding: '0.375rem', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '0.375rem', color: '#EF4444', display: 'flex', alignItems: 'center' }}
                        title="Delete Booth"
                      >
                        <Trash2 style={{ width: '1rem', height: '1rem' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedBooth.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', fontSize: '0.875rem', color: '#94A3B8' }}>No data available for this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        )}

        <div style={{ borderTop: '1px solid #E5E7EB' }}>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filteredBooth.length} itemsPerPage={itemsPerPage} />
        </div>
      </div>
      )}

      {/* ── Booth Requests Tab ── */}
      {mainTab === 'requests' && (
        <div style={cardStyle}>
          {/* Request Status Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', overflowX: 'auto' }}>
            {(['Pending', 'Approved', 'Rejected'] as RequestFilter[]).map(f => {
              const isAct = reqFilter === f;
              return (
                <button key={f} onClick={() => { setReqFilter(f); setReqPage(1); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1.25rem', fontSize: '0.875rem', fontWeight: 500, border: 'none', borderBottom: isAct ? '2px solid #6366F1' : '2px solid transparent', marginBottom: '-1px', background: isAct ? 'rgba(99,102,241,0.05)' : 'transparent', color: isAct ? '#818CF8' : '#64748B', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {f}
                  <span style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '9999px', background: isAct ? 'rgba(99,102,241,0.2)' : '#FFFFFF', color: isAct ? '#818CF8' : '#64748B', fontWeight: 500 }}>{reqCounts[f]}</span>
                </button>
              );
            })}
          </div>

          {/* Request Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={theadThStyle}>Booth</th>
                  <th style={theadThStyle}>Market</th>
                  <th style={theadThStyle}>Owner</th>
                  <th style={theadThStyle}>Submitted</th>
                  <th style={theadThStyle}>Status</th>
                  <th style={{ ...theadThStyle, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedReqs.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', fontSize: '0.875rem', color: '#94A3B8' }}>No data available for this filter.</td></tr>
                )}
                {pagedReqs.map(req => {
                  const rStatus = getReqStatus(req);
                  return (
                    <tr key={req.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 500, color: '#111827', fontSize: '0.875rem' }}>{req.name}</span>
                          <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace', marginTop: '0.15rem' }}>ID: #{req.id}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#64748B' }}>{req.market}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{req.owner}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#64748B' }}>{req.createdAt}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={
                          rStatus === 'Approved'
                            ? { background: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '11px', fontWeight: 600 }
                            : rStatus === 'Rejected'
                            ? { background: 'rgba(239,68,68,0.15)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '11px', fontWeight: 600 }
                            : rStatus === ('Info Requested' as any)
                            ? { background: 'rgba(59,130,246,0.15)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '11px', fontWeight: 600 }
                            : { background: 'rgba(245,158,11,0.15)', color: '#FBBF24', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '11px', fontWeight: 600 }
                        }>{rStatus}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedReqDetailId(req.id)}
                          style={{ padding: '0.375rem 0.75rem', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '0.5rem', color: '#64748B', fontSize: '12px', fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
                        >
                          <Eye style={{ width: '0.875rem', height: '0.875rem' }} /> Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ borderTop: '1px solid #E5E7EB' }}>
            <Pagination currentPage={reqPage} totalPages={reqTotalPages} onPageChange={setReqPage} totalItems={filteredReqs.length} itemsPerPage={reqPerPage} />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {selectedBooth && boothOwner && actionType === 'edit' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ ...modalStyle, width: '100%', maxWidth: '48rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ position: 'sticky', top: 0, background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>Edit Booth</h3>
              <button onClick={closeModals} style={{ padding: '0.5rem', background: '#F3F4F6', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', color: '#64748B', display: 'flex' }}>
                <X style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Owner – locked */}
              <div style={{ background: '#FFFFFF', border: '2px solid #E5E7EB', borderRadius: '0.75rem', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <ShieldCheck style={{ width: '1rem', height: '1rem', color: '#64748B' }} />
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748B' }}>Owner Information (Locked)</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {[
                    { label: 'Owner Name', value: boothOwner.name },
                    { label: 'Email', value: boothOwner.email },
                    { label: 'Phone', value: (selectedBooth.phone || 'No data available') },
                    { label: 'Registered', value: 'No data available' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#64748B', marginBottom: '0.25rem' }}>{label}</label>
                      <input type="text" value={value} disabled style={{ ...inputStyle, background: '#F3F4F6', color: '#64748B', cursor: 'not-allowed' }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Editable Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.375rem' }}>Booth Name</label>
                  <input type="text" defaultValue={selectedBooth.boothName} style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.375rem' }}>Category</label>
                    <select defaultValue={'No data available'} style={{ ...selectStyle, width: '100%' }}>
                      <option>No data available</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.375rem' }}>Zone</label>
                    <select defaultValue={selectedBooth.zoneId ?? undefined} style={{ ...selectStyle, width: '100%' }}>
                      {['A', 'B', 'C', 'D', 'E'].map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.375rem' }}>Slot Number</label>
                    <input type="number" defaultValue={selectedBooth.slotNumber ?? undefined} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.375rem' }}>Description</label>
                  <textarea rows={3} defaultValue={selectedBooth.description ?? undefined} style={{ ...inputStyle, resize: 'none' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', padding: '1.25rem', borderTop: '1px solid #E5E7EB' }}>
              <button onClick={closeModals} style={{ flex: 1, padding: '0.5rem 1rem', background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#111827', borderRadius: '0.5rem', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleEditSave} style={{ flex: 1, padding: '0.5rem 1rem', background: '#2563EB', color: 'white', borderRadius: '0.5rem', fontWeight: 500, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <CheckCircle style={{ width: '1rem', height: '1rem' }} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Confirmation */}
      {selectedBooth && actionType === 'suspend' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ ...modalStyle, width: '100%', maxWidth: '28rem' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>
                {selectedBooth.status === 'Active' ? 'Suspend Booth' : 'Activate Booth'}
              </h3>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ color: '#64748B', fontSize: '0.875rem', margin: 0 }}>
                {selectedBooth.status === 'Active'
                  ? `Suspend "${selectedBooth.boothName}"? It will be hidden from customers.`
                  : `Activate "${selectedBooth.boothName}"? It will be visible to customers again.`}
              </p>
              {selectedBooth.status === 'Active' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' }}>Reason for suspension <span style={{ color: '#EF4444' }}>*</span></label>
                  <textarea
                    rows={3}
                    placeholder="Enter the reason for suspending this booth..."
                    value={suspendReason}
                    onChange={e => setSuspendReason(e.target.value)}
                    style={{ ...inputStyle, resize: 'none', borderColor: !suspendReason.trim() ? '#FCA5A5' : '#E5E7EB' }}
                  />
                  {!suspendReason.trim() && (
                    <p style={{ fontSize: '11px', color: '#EF4444', margin: '4px 0 0', fontWeight: 500 }}>⚠ A reason is required before suspending.</p>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', padding: '1.5rem', borderTop: '1px solid #E5E7EB' }}>
              <button onClick={closeModals} style={{ flex: 1, padding: '0.5rem 1rem', background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#111827', borderRadius: '0.5rem', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={handleToggleBoothStatusConfirm}
                style={{
                  flex: 1,
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  ...(selectedBooth.status === 'Active'
                    ? { background: '#FEE2E2', color: '#EF4444', border: '1px solid #FEE2E2' }
                    : { background: '#ECFDF5', color: '#10B981', border: '1px solid #D1FAE5' })
                }}
              >
                {selectedBooth.status === 'Active' ? <><Ban style={{ width: '1rem', height: '1rem' }} /> {!suspendReason.trim() ? 'Reason Required' : 'Suspend'}</> : <><CheckCircle style={{ width: '1rem', height: '1rem' }} /> Activate</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Request Modal */}
      <Modal isOpen={!!selectedReqDetailId} onClose={closeReqModal} title="Review Booth Request" size="lg">
        {reqDetailBooth && reqDetailOwner && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '4.5rem', height: '4.5rem', borderRadius: '0.75rem', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 0 3px rgba(99,102,241,0.3)' }}>
                <Store style={{ width: '1.75rem', height: '1.75rem', color: '#818CF8' }} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>{reqDetailBooth.name}</h4>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>Request ID: #{reqDetailBooth.id} · Submitted: {reqDetailBooth.createdAt}</p>
                <span style={statusBadge(reqDetailStatus)}>{reqDetailStatus}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.5rem' }}>
                <p style={{ fontSize: '11px', color: '#64748B', margin: 0, fontWeight: 500 }}>Market</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1F2937', margin: '2px 0 0' }}>{reqDetailBooth.market}</p>
              </div>
              <div style={{ padding: '0.75rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.5rem' }}>
                <p style={{ fontSize: '11px', color: '#64748B', margin: 0, fontWeight: 500 }}>Category</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1F2937', margin: '2px 0 0' }}>{reqDetailBooth.category}</p>
              </div>
            </div>

            {/* Owner Info card */}
            <div style={{ border: '2px solid #E5E7EB', borderRadius: '0.75rem', padding: '1rem' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', margin: '0 0 0.75rem' }}>Applicant / Owner Info</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>Name</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1F2937', margin: 0 }}>{reqDetailOwner.name}</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>Phone</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1F2937', margin: 0 }}>{reqDetailBooth.phone}</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>Email</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1F2937', margin: 0 }}>{reqDetailOwner.email}</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>Registered</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1F2937', margin: 0 }}>No data available</p>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>Address</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1F2937', margin: 0 }}>
                    {(reqDetailOwner as any).address || 'No data available'}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {reqDetailBooth.description && (
              <div style={{ padding: '0.75rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.5rem' }}>
                <p style={{ fontSize: '11px', color: '#64748B', fontWeight: 500, margin: '0 0 0.25rem' }}>Description</p>
                <p style={{ fontSize: '0.875rem', color: '#334155', margin: 0, lineHeight: 1.4 }}>{reqDetailBooth.description}</p>
              </div>
            )}

            {/* CCCD / Citizen ID */}
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Citizen ID Card (CCCD)</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {[
                  { label: 'CCCD - Front Side', url: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400' },
                  { label: 'CCCD - Back Side', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400' },
                ].map(({ label, url }) => (
                  <div
                    key={label}
                    onClick={() => setPreviewDoc({ url, label })}
                    style={{ width: '10rem', height: '6.5rem', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #E2E8F0', cursor: 'pointer', transition: 'all 0.15s', position: 'relative' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.15)'; e.currentTarget.style.borderColor = '#6366F1'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                    title={`Click to view ${label}`}
                  >
                    <img src={url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', padding: '0.25rem 0.5rem' }}>
                      <span style={{ fontSize: '9px', color: '#FFFFFF', fontWeight: 600 }}>{label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Uploaded Documents */}
            {reqDetailBooth.documents && (
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Business License & Certificates</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { doc: reqDetailBooth.documents.businessLicense, label: 'Business License' },
                    { doc: reqDetailBooth.documents.foodSafety, label: 'Food Safety Certificate' },
                    { doc: reqDetailBooth.documents.healthPermit, label: 'Health Permit' },
                  ].filter(({ doc }) => doc).map(({ doc, label }) => doc && (
                    <div key={label}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                        <FileText style={{ width: '0.875rem', height: '0.875rem', color: '#6366F1' }} />
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>{label}</span>
                        <span style={{ fontSize: '10px', color: '#94A3B8' }}>({doc.name} · {doc.uploadedAt})</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                        {['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400'].map((imgUrl, imgIdx) => (
                          <div
                            key={imgIdx}
                            onClick={() => setPreviewDoc({ url: imgUrl, label: `${label} - Image ${imgIdx + 1}` })}
                            style={{ width: '6.5rem', height: '5rem', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #E2E8F0', cursor: 'pointer', transition: 'all 0.15s ease-in-out' }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.15)'; e.currentTarget.style.borderColor = '#6366F1'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                            title="Click to view full image"
                          >
                            <img src={imgUrl} alt={`${label} ${imgIdx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions for Pending requests */}
            {reqDetailStatus === 'Pending' && (
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
                <button
                  onClick={() => handleReqAction('reject')}
                  style={{ flex: 1, padding: '0.5rem 1rem', background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#EF4444', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
                >
                  Reject
                </button>
                <button
                  onClick={() => handleReqAction('approve')}
                  style={{ flex: 1, padding: '0.5rem 1rem', background: '#10B981', color: 'white', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
                >
                  Approve Request
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      {selectedBooth && actionType === 'delete' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ ...modalStyle, width: '100%', maxWidth: '28rem' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#EF4444', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Trash2 style={{ width: '1.25rem', height: '1.25rem' }} /> Delete Booth
              </h3>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ color: '#1E293B', fontSize: '0.875rem', margin: 0, fontWeight: 500 }}>
                Are you sure you want to permanently delete booth "{selectedBooth.boothName}"?
              </p>
              <p style={{ color: '#64748B', fontSize: '0.8125rem', marginTop: '0.5rem', margin: 0 }}>
                This action is irreversible and will remove all registration data, coordinates, and menu configurations.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', padding: '1.5rem', borderTop: '1px solid #E5E7EB' }}>
              <button onClick={closeModals} style={{ flex: 1, padding: '0.5rem 1rem', background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#111827', borderRadius: '0.5rem', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={handleDeleteBoothConfirm}
                style={{
                  flex: 1,
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  border: 'none',
                  background: '#EF4444',
                  color: '#FFFFFF'
                }}
              >
                <Trash2 style={{ width: '1rem', height: '1rem' }} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
