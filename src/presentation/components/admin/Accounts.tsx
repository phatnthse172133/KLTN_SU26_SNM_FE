"use client";

import { Search, Eye, Ban, CheckCircle, Mail, Phone, Calendar, ShoppingBag, Store, MapPin, ArrowLeft, ShieldCheck, User, DollarSign, FileText, RotateCw, Upload, Loader2 } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Modal } from './components/Modal';
import { Pagination } from './components/Pagination';
type RoleTab = 'customer' | 'booth_owner';
import { adminAccountService, UserStatus } from '@/application/features/admin/adminAccountService';

type StatusTab = 'Active' | 'Inactive' | 'Suspended';

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  boxShadow: '0 4px 32px rgba(15,23,42,0.06)',
  borderRadius: '1rem',
  overflow: 'hidden',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.75rem 1rem',
  color: '#64748B',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 600,
};

function statusPill(status: string): React.CSSProperties {
  if (status === 'Active') return { display: 'inline-flex', alignItems: 'center', background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '12px', fontWeight: 600 };
  if (status === 'Suspended') return { display: 'inline-flex', alignItems: 'center', background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '12px', fontWeight: 600 };
  return { display: 'inline-flex', alignItems: 'center', background: 'rgba(100,116,139,0.15)', color: '#64748B', border: '1px solid rgba(100,116,139,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '12px', fontWeight: 600 };
}

interface AccountsProps {
  initialUserId?: string | null;
}

export function Accounts({ initialUserId }: AccountsProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleTab, setRoleTab] = useState<RoleTab>(initialUserId ? 'booth_owner' : 'customer');
  const [statusTab, setStatusTab] = useState<StatusTab>('Active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(initialUserId || null);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; label: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const itemsPerPage = 12;

  useEffect(() => {
    if (initialUserId) {
      setSelectedId(initialUserId);
      setRoleTab('booth_owner');
    }
  }, [initialUserId]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await adminAccountService.getUsers(1, 1000);
        if (res.success) {
          const mapped = res.data.items.map(u => ({
            id: u.id,
            name: u.fullName,
            email: u.email,
            // Backend returns "BoothOwner" (PascalCase), map to UI's "booth_owner"
            role: u.role === 'BoothOwner' ? 'booth_owner' : 'customer',
            status: u.status, // e.g. "Active", "Suspended", "PendingVerification"
            avatar: u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName)}&background=random`,
            registered: u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : 'No data available',
            phone: u.phone || 'No data available',
            address: 'No data available',
          }));
          setUsers(mapped);
        }
      } catch (error) {
        console.error("Failed to load users", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const roleCounts = useMemo(() => ({
    customer: users.filter(u => u.role === 'customer').length,
    booth_owner: users.filter(u => u.role === 'booth_owner').length,
  }), [users]);

  const statusCounts = useMemo(() => {
    const base = users.filter(u => u.role === roleTab);
    return {
      Active: base.filter(u => u.status === 'Active').length,
      Inactive: base.filter(u => (u.status as string) === 'Inactive').length,
      Suspended: base.filter(u => u.status === 'Suspended').length,
    };
  }, [roleTab, users]);

  const filtered = useMemo(() => {
    return users.filter(u => {
      if (u.role !== roleTab) return false;
      const effectiveStatus = u.status === 'Active' ? 'Active' : u.status === 'Suspended' ? 'Suspended' : 'Inactive';
      if (effectiveStatus !== statusTab) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      }
      return true;
    });
  }, [roleTab, statusTab, searchQuery, users]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const selected = users.find(u => u.id === selectedId);

  const handleRoleChange = (tab: RoleTab) => { setRoleTab(tab); setStatusTab('Active'); setCurrentPage(1); };
  const handleStatusChange = (tab: StatusTab) => { setStatusTab(tab); setCurrentPage(1); };

  const handleBanUser = async (id: string) => {
    try {
      // Send integer enum (Suspended = 2) to match backend ChangeUserStatusRequest
      await adminAccountService.changeUserStatus(id, UserStatus.Suspended);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'Suspended' } : u));
    } catch (e) {
      console.error('Failed to suspend user:', e);
    }
  };

  const handleRestoreUser = async (id: string) => {
    try {
      // Send integer enum (Active = 1) to match backend ChangeUserStatusRequest
      await adminAccountService.changeUserStatus(id, UserStatus.Active);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'Active' } : u));
    } catch (e) {
      console.error('Failed to restore user:', e);
    }
  };

  // --- Booth Owner Detailed Screen ---
  if (selectedId && selected && selected.role === 'booth_owner') {
    const ownedBooths: any[] = [];
    return (
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <button
            onClick={() => setSelectedId(null)}
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
            <ArrowLeft className="w-4 h-4" /> Back to Account List
          </button>
        </div>

        {/* Profile Card */}
        <div style={cardStyle}>
          <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <img src={selected.avatar} alt={selected.name} style={{ width: '4.5rem', height: '4.5rem', borderRadius: '9999px', objectFit: 'cover', boxShadow: '0 0 0 3px rgba(99,102,241,0.3)' }} />
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>{selected.name}</h3>
                <p style={{ color: '#64748B', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>Booth Owner Account</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span style={statusPill(selected.status)}>{selected.status}</span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {selected.status !== 'Suspended' ? (
                <button
                  onClick={() => handleBanUser(selected.id)}
                  style={{ padding: '0.5rem 1rem', background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#EF4444', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                >
                  <Ban style={{ width: '1rem', height: '1rem' }} /> Ban Account
                </button>
              ) : (
                <button
                  onClick={() => handleRestoreUser(selected.id)}
                  style={{ padding: '0.5rem 1rem', background: '#ECFDF5', border: '1px solid #D1FAE5', color: '#10B981', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                >
                  <CheckCircle style={{ width: '1rem', height: '1rem' }} /> Restore Account
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', padding: '1.5rem', borderTop: '1px solid #E5E7EB', background: '#F8FAFC' }}>
            {[
              { icon: <Mail style={{ width: '1rem', height: '1rem', color: '#64748B' }} />, label: 'Email Address', value: selected.email },
              { icon: <Phone style={{ width: '1rem', height: '1rem', color: '#64748B' }} />, label: 'Phone Number', value: selected.phone },
              { icon: <Calendar style={{ width: '1rem', height: '1rem', color: '#64748B' }} />, label: 'Registration Date', value: selected.registered },
              { icon: <MapPin style={{ width: '1rem', height: '1rem', color: '#64748B' }} />, label: 'Address', value: selected.address },
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

        {/* Owned Booths */}
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>Owned Booths ({ownedBooths.length})</h3>
          <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: '0.25rem' }}>Manage specific booths owned by {selected.name}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {ownedBooths.length === 0 ? (
            <div style={{ ...cardStyle, padding: '3rem', textAlign: 'center', color: '#64748B' }}>
              <Store style={{ width: '3rem', height: '3rem', color: '#CBD5E1', margin: '0 auto 1rem' }} />
              <p style={{ margin: 0, fontWeight: 500 }}>No booths registered to this owner.</p>
            </div>
          ) : (
            ownedBooths.map(booth => (
              <div key={booth.id} style={cardStyle}>
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'start', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {booth.image ? (
                        <img src={booth.image} alt={booth.name} style={{ width: '4.5rem', height: '4.5rem', borderRadius: '0.75rem', objectFit: 'cover', flexShrink: 0, boxShadow: '0 0 0 3px rgba(99,102,241,0.2)' }} />
                      ) : (
                        <div style={{ width: '4.5rem', height: '4.5rem', borderRadius: '0.75rem', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 0 3px rgba(99,102,241,0.2)' }}>
                          <Store style={{ width: '1.75rem', height: '1.75rem', color: '#818CF8' }} />
                        </div>
                      )}
                      <div>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>{booth.name}</h4>
                        <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.15rem 0 0', fontFamily: 'monospace' }}>ID: #{booth.id}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            background: booth.status === 'Active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                            color: booth.status === 'Active' ? '#10B981' : '#EF4444',
                            border: booth.status === 'Active' ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(239,68,68,0.25)',
                            borderRadius: '9999px',
                            padding: '2px 8px',
                            fontSize: '11px',
                            fontWeight: 600
                          }}>{booth.status}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {booth.status === 'Active' ? (
                        <button
                          disabled
                          style={{ padding: '0.5rem 0.75rem', background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#EF4444', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Ban style={{ width: '0.875rem', height: '0.875rem' }} /> Suspend Booth
                        </button>
                      ) : (
                        <button
                          disabled
                          style={{ padding: '0.5rem 0.75rem', background: '#ECFDF5', border: '1px solid #D1FAE5', color: '#10B981', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <CheckCircle style={{ width: '0.875rem', height: '0.875rem' }} /> Activate Booth
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                    {[
                      { icon: <MapPin style={{ width: '0.875rem', height: '0.875rem' }} />, label: 'Market', value: booth.market },
                      { icon: <Store style={{ width: '0.875rem', height: '0.875rem' }} />, label: 'Zone / Slot', value: `${booth.location}` },
                      { icon: <Calendar style={{ width: '0.875rem', height: '0.875rem' }} />, label: 'Created At', value: booth.createdAt },
                      { icon: <DollarSign style={{ width: '0.875rem', height: '0.875rem' }} />, label: 'Estimated Revenue', value: booth.revenue },
                    ].map(item => (
                      <div key={item.label} style={{ padding: '0.75rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748B', fontSize: '11px', marginBottom: '0.25rem' }}>
                          {item.icon} {item.label}
                        </div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155', margin: 0 }}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                    {booth.description && (
                      <div style={{ padding: '0.75rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.5rem' }}>
                        <p style={{ fontSize: '11px', color: '#64748B', fontWeight: 500, margin: '0 0 0.25rem' }}>Description</p>
                        <p style={{ fontSize: '0.8125rem', color: '#334155', margin: 0, lineHeight: 1.4 }}>{booth.description}</p>
                      </div>
                    )}
                    
                    <div style={{ padding: '1.25rem', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', margin: 0 }}>Documents</h4>
                        <FileText style={{ width: '1.25rem', height: '1.25rem', color: '#94A3B8' }} />
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {[
                          { doc: booth.documents?.businessLicense, label: 'Business License', images: ['https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400'] },
                          { doc: booth.documents?.foodSafety, label: 'Food Safety Certificate', images: ['https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400', 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400'] },
                          { doc: booth.documents?.healthPermit, label: 'Health Permit', images: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400'] },
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
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

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
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827', margin: 0 }}>User Management</h2>
          <p style={{ color: '#64748B', marginTop: '0.25rem', fontSize: '0.875rem' }}>Manage platform users by role and status</p>
        </div>
      </div>

      {/* Main Card */}
      <div style={cardStyle}>

        {/* Role Tabs */}
        <div style={{ borderBottom: '1px solid #E5E7EB', padding: '1.25rem 1.5rem', background: '#FFFFFF' }}>
          <div style={{
            display: 'inline-flex',
            background: '#F1F5F9',
            padding: '4px',
            borderRadius: '0.75rem',
            border: '1px solid #E2E8F0',
            gap: '4px',
          }}>
            {([
              { key: 'customer' as RoleTab, label: 'Customers', count: roleCounts.customer },
              { key: 'booth_owner' as RoleTab, label: 'Booth Owners', count: roleCounts.booth_owner },
            ]).map(tab => {
              const active = roleTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleRoleChange(tab.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: active ? '#FFFFFF' : 'transparent',
                    color: active ? '#0F172A' : '#64748B',
                    boxShadow: active ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                  <span style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    background: active ? '#F1F5F9' : '#FFFFFF',
                    color: active ? '#0F172A' : '#64748B',
                    fontWeight: 600
                  }}>{tab.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Pills */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', background: '#F8FAFC' }}>
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
            {(['Active', 'Inactive', 'Suspended'] as StatusTab[]).map(tab => {
              const active = statusTab === tab;
              const count = statusCounts[tab];
              return (
                <button
                  key={tab}
                  onClick={() => handleStatusChange(tab)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.375rem 0.875rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    borderRadius: '9999px',
                    border: '1px solid',
                    borderColor: active ? '#4F46E5' : '#E2E8F0',
                    background: active ? 'rgba(79, 70, 229, 0.08)' : '#FFFFFF',
                    color: active ? '#4F46E5' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab}
                  <span style={{
                    fontSize: '10px',
                    padding: '1px 5px',
                    borderRadius: '9999px',
                    background: active ? '#4F46E5' : '#F1F5F9',
                    color: active ? '#FFFFFF' : '#64748B',
                  }}>{count}</span>
                </button>
              );
            })}
          </div>
          <span style={{ fontSize: '0.8125rem', color: '#64748B', whiteSpace: 'nowrap' }}>{filtered.length} users</span>
        </div>

        {/* Users Table */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={thStyle}>User</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Phone</th>
                  {roleTab === 'customer' && <th style={thStyle}>Orders</th>}
                  {roleTab === 'booth_owner' && <th style={thStyle}>Booths</th>}
                  <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(u => (
                  <tr
                  key={u.id}
                  onClick={() => setSelectedId(u.id)}
                  onMouseEnter={() => setHoveredRow(u.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{ borderBottom: '1px solid #E5E7EB', background: hoveredRow === u.id ? '#F8FAFC' : 'transparent', cursor: 'pointer', transition: 'background 0.15s' }}
                >
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img src={u.avatar} alt={u.name} style={{ width: '2.25rem', height: '2.25rem', borderRadius: '9999px', objectFit: 'cover', display: 'block', boxShadow: hoveredRow === u.id ? '0 0 0 2px rgba(99,102,241,0.5)' : '0 0 0 2px transparent', transition: 'box-shadow 0.2s' }} />
                      <span style={{ fontWeight: 500, color: '#111827', fontSize: '0.875rem' }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#64748B' }}>{u.email}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#64748B' }}>{u.phone}</td>
                  {roleTab === 'customer' && <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{u.totalOrders ?? 0}</td>}
                  {roleTab === 'booth_owner' && <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{u.boothsOwned?.length ?? 0}</td>}
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                      <button
                        title="View Details"
                        onClick={() => setSelectedId(u.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '0.5rem', border: '1px solid #E5E7EB', background: '#FFFFFF', cursor: 'pointer', transition: 'all 0.15s' }}
                      >
                        <Eye style={{ width: '0.875rem', height: '0.875rem', color: '#64748B' }} />
                      </button>
                      
                      {u.status !== 'Suspended' ? (
                        <button
                          title="Ban User"
                          onClick={() => handleBanUser(u.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '0.5rem', border: '1px solid #FEE2E2', background: '#FEF2F2', cursor: 'pointer', transition: 'all 0.15s' }}
                        >
                          <Ban style={{ width: '0.875rem', height: '0.875rem', color: '#EF4444' }} />
                        </button>
                      ) : (
                        <button
                          title="Restore User"
                          onClick={() => handleRestoreUser(u.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '0.5rem', border: '1px solid #D1FAE5', background: '#ECFDF5', cursor: 'pointer', transition: 'all 0.15s' }}
                        >
                          <CheckCircle style={{ width: '0.875rem', height: '0.875rem', color: '#10B981' }} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748B' }}>
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}

        {/* Pagination */}
        <div style={{ borderTop: '1px solid #E5E7EB' }}>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filtered.length} itemsPerPage={itemsPerPage} />
        </div>
      </div>

      {/* Detail Modal for Customers */}
      <Modal isOpen={!!(selected && selected.role === 'customer')} onClose={() => setSelectedId(null)} title="User Details" size="md">
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img src={selected.avatar} alt={selected.name} style={{ width: '5rem', height: '5rem', borderRadius: '9999px', objectFit: 'cover', boxShadow: '0 0 0 3px rgba(99,102,241,0.3)' }} />
              <div>
                <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>{selected.name}</h4>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>Role: Customer · ID: #{selected.id}</p>
                <span style={statusPill(selected.status)}>{selected.status}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
              {[
                { icon: <Mail style={{ width: '0.875rem', height: '0.875rem' }} />, label: 'Email', value: selected.email },
                { icon: <Phone style={{ width: '0.875rem', height: '0.875rem' }} />, label: 'Phone', value: selected.phone },
                { icon: <Calendar style={{ width: '0.875rem', height: '0.875rem' }} />, label: 'Registered', value: selected.registered },
                { icon: <MapPin style={{ width: '0.875rem', height: '0.875rem' }} />, label: 'Address', value: selected.address || 'No data available' },
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '0.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: '#047857', margin: 0, fontWeight: 500 }}>Total Orders</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34D399', margin: 0 }}>{selected.totalOrders ?? 0}</p>
              </div>
              <div style={{ padding: '0.75rem', background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.15)', borderRadius: '0.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: '#0F766E', margin: 0, fontWeight: 500 }}>Total Spent</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2DD4BF', margin: 0, marginTop: '0.3rem' }}>{selected.totalSpent ?? '0 VND'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              {selected.status === 'Active' ? (
                <button
                  onClick={() => { handleBanUser(selected.id); setSelectedId(null); }}
                  style={{ flex: 1, padding: '0.5rem 1rem', background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#EF4444', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
                >
                  <Ban style={{ width: '1.125rem', height: '1.125rem' }} /> Ban Account
                </button>
              ) : (
                <button
                  onClick={() => { handleRestoreUser(selected.id); setSelectedId(null); }}
                  style={{ flex: 1, padding: '0.5rem 1rem', background: '#ECFDF5', border: '1px solid #D1FAE5', color: '#10B981', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
                >
                  <CheckCircle style={{ width: '1.125rem', height: '1.125rem' }} /> Restore Account
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
