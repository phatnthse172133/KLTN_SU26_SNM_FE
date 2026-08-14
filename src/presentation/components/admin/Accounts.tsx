"use client";

import { Eye, Ban, CheckCircle, Mail, Phone, Calendar, Store, MapPin, ArrowLeft, DollarSign, FileText, RotateCw, Loader2, Crown, UserPlus, Send } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Modal } from './components/Modal';
import { Pagination } from './components/Pagination';
type RoleTab = 'customer' | 'booth_owner' | 'market_owner';
import { adminAccountService, AdminOwnedBoothResponse, BoothDocumentResponse, ManagedUserResponse, UserStatus, UserStatusHistoryResponse } from '@/application/features/admin/adminAccountService';
import { adminSubscriptionService, PackageType, SubscriptionStatus } from '@/application/features/admin/adminSubscriptionService';
import { getErrorMessage } from '@/shared/errors/errorMapper';
import { resolveMediaUrl } from '@/shared/utils';
import { ImageWithFallback } from '@/presentation/components/ImageWithFallback';

type StatusTab = 'Active' | 'Inactive';

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
  if (status === 'Inactive') return { display: 'inline-flex', alignItems: 'center', background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '12px', fontWeight: 600 };
  return { display: 'inline-flex', alignItems: 'center', background: 'rgba(100,116,139,0.15)', color: '#64748B', border: '1px solid rgba(100,116,139,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '12px', fontWeight: 600 };
}

interface AccountsProps {
  initialUserId?: string | null;
}

interface AccountListItem {
  id: string;
  name: string;
  email: string;
  role: RoleTab;
  status: string;
  avatar: string;
  registered: string;
  phone: string;
  address: string;
  totalOrders?: number;
  totalSpent?: string;
  boothsOwned?: unknown[];
  activePackageCode?: string;
  activePackageName?: string;
  mustChangePassword: boolean;
}

interface BoothDocumentSummary {
  id: string;
  label: string;
  url: string;
  verificationStatus: string;
  uploadedAt?: string;
}

interface OwnedBoothSummary {
  id: string;
  image?: string | null;
  name: string;
  status: string;
  market?: string;
  location?: string;
  createdAt?: string;
  revenue?: string;
  description?: string | null;
  documents: BoothDocumentSummary[];
}

const roleToApiRole = (role: RoleTab): string => {
  if (role === 'booth_owner') return 'BoothOwner';
  if (role === 'market_owner') return 'MarketOwner';
  return 'Customer';
};

const mapUser = (user: ManagedUserResponse): AccountListItem => ({
  id: user.id,
  name: user.fullName,
  email: user.email,
  role: user.role === 'BoothOwner' ? 'booth_owner' : user.role === 'MarketOwner' ? 'market_owner' : 'customer',
  status: user.status,
  avatar: user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`,
  registered: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US') : 'No data available',
  phone: user.phone || 'No data available',
  address: user.address || 'No data available',
  mustChangePassword: !!user.mustChangePassword,
});

const packagePill = (isFree: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  maxWidth: '10rem',
  padding: '2px 7px',
  borderRadius: '9999px',
  border: isFree ? '1px solid #CBD5E1' : '1px solid #C4B5FD',
  background: isFree ? '#F8FAFC' : '#F5F3FF',
  color: isFree ? '#475569' : '#6D28D9',
  fontSize: '10px',
  fontWeight: 700,
  lineHeight: 1.4,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const documentLabel = (documentType: string): string => {
  const labels: Record<string, string> = {
    BusinessLicense: 'Business License',
    FoodSafetyCertificate: 'Food Safety Certificate',
    OwnerIdentification: 'Owner Identification',
    Other: 'Supporting Document',
  };
  return labels[documentType] ?? documentType.replace(/([a-z])([A-Z])/g, '$1 $2');
};

const formatDate = (value?: string | null): string => {
  if (!value) return 'No data available';
  return new Date(value).toLocaleDateString('en-US');
};

const mapBoothDocument = (document: BoothDocumentResponse): BoothDocumentSummary => ({
  id: document.id,
  label: documentLabel(document.documentType),
  url: document.fileUrl,
  verificationStatus: document.verificationStatus,
  uploadedAt: formatDate(document.createdAt),
});

const mapOwnedBooth = (booth: AdminOwnedBoothResponse): OwnedBoothSummary => ({
  id: booth.id,
  image: booth.thumbnailUrl ?? booth.logoUrl ?? null,
  name: booth.boothName,
  status: booth.status,
  market: booth.nightMarketName ?? 'No data available',
  location: [booth.zoneName, booth.slotNumber].filter(Boolean).join(' / ') || 'No data available',
  createdAt: formatDate(booth.createdAt),
  revenue: booth.activePackageName
    ? `${booth.activePackageName}${booth.packageExpiryDate ? ` until ${formatDate(booth.packageExpiryDate)}` : ''}`
    : 'No active package',
  description: booth.description,
  documents: booth.documents.map(mapBoothDocument),
});

export function Accounts({ initialUserId }: AccountsProps) {
  const [users, setUsers] = useState<AccountListItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<AccountListItem | null>(null);
  const [selectedUserLoading, setSelectedUserLoading] = useState(false);
  const [selectedUserError, setSelectedUserError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleTab, setRoleTab] = useState<RoleTab>(initialUserId ? 'booth_owner' : 'customer');
  const [statusTab, setStatusTab] = useState<StatusTab>('Active');
  const [searchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(initialUserId || null);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; label: string } | null>(null);
  const [ownedBooths, setOwnedBooths] = useState<OwnedBoothSummary[]>([]);
  const [boothDetailsLoading, setBoothDetailsLoading] = useState(false);
  const [boothDetailsError, setBoothDetailsError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [banModalUser, setBanModalUser] = useState<AccountListItem | null>(null);
  const [banReason, setBanReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [statusHistory, setStatusHistory] = useState<UserStatusHistoryResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [roleCounts, setRoleCounts] = useState({ customer: 0, booth_owner: 0, market_owner: 0 });
  const [statusCounts, setStatusCounts] = useState({ Active: 0, Inactive: 0 });
  const [listError, setListError] = useState<string | null>(null);
  const [showCreateMarketOwner, setShowCreateMarketOwner] = useState(false);
  const [marketOwnerEmail, setMarketOwnerEmail] = useState('');
  const [marketOwnerEmailError, setMarketOwnerEmailError] = useState<string | null>(null);
  const [createMarketOwnerError, setCreateMarketOwnerError] = useState<string | null>(null);
  const [creatingMarketOwner, setCreatingMarketOwner] = useState(false);
  const [resendingInvitationId, setResendingInvitationId] = useState<string | null>(null);
  const itemsPerPage = 12;

  useEffect(() => {
    if (!initialUserId) return;
    void Promise.resolve().then(() => {
      setSelectedId(initialUserId);
      setRoleTab('booth_owner');
    });
  }, [initialUserId]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setListError(null);
      const res = await adminAccountService.getUsers({
        page: currentPage,
        pageSize: itemsPerPage,
        role: roleToApiRole(roleTab),
        status: statusTab,
        keyword: debouncedSearch || undefined,
      });
      if (res.success) {
        const mappedUsers = res.data.items.map(mapUser);

        if (roleTab === 'customer' || mappedUsers.length === 0) {
          setUsers(mappedUsers);
        } else {
          try {
            const packageType = roleTab === 'booth_owner' ? PackageType.Booth : PackageType.Market;
            const subscriptions = await adminSubscriptionService.getSubscriptions(
              packageType,
              SubscriptionStatus.Active,
              1,
              500
            );
            const visibleUserIds = new Set(mappedUsers.map((user) => user.id));
            const activeByOwner = new Map<string, (typeof subscriptions.items)[number]>();

            subscriptions.items
              .filter((subscription) => visibleUserIds.has(subscription.ownerId))
              .sort((left, right) => new Date(right.endDate).getTime() - new Date(left.endDate).getTime())
              .forEach((subscription) => {
                if (!activeByOwner.has(subscription.ownerId)) activeByOwner.set(subscription.ownerId, subscription);
              });

            setUsers(mappedUsers.map((user) => {
              const subscription = activeByOwner.get(user.id);
              return subscription
                ? {
                    ...user,
                    activePackageCode: subscription.packageCode,
                    activePackageName: subscription.packageName,
                  }
                : user;
            }));
          } catch {
            // Package tags are supplementary; the account list must remain usable.
            setUsers(mappedUsers);
          }
        }
        setTotalItems(res.data.total ?? res.data.items.length);
      } else {
        setUsers([]);
        setTotalItems(0);
        setListError(getErrorMessage(res));
      }
    } catch (error: unknown) {
      setUsers([]);
      setTotalItems(0);
      setListError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [currentPage, roleTab, statusTab, debouncedSearch]);

  const fetchCounts = useCallback(async () => {
    try {
      const roles: RoleTab[] = ['customer', 'booth_owner', 'market_owner'];
      const counts: Record<string, number> = {};
      for (const r of roles) {
        const res = await adminAccountService.getUsers({ page: 1, pageSize: 1, role: roleToApiRole(r) });
        if (res.success) counts[r] = res.data.total ?? 0;
      }
      setRoleCounts({
        customer: counts['customer'] ?? 0,
        booth_owner: counts['booth_owner'] ?? 0,
        market_owner: counts['market_owner'] ?? 0,
      });

      const statusRes = await adminAccountService.getUsers({ page: 1, pageSize: 1, role: roleToApiRole(roleTab), status: 'Active' });
      const inactiveRes = await adminAccountService.getUsers({ page: 1, pageSize: 1, role: roleToApiRole(roleTab), status: 'Inactive' });
      setStatusCounts({
        Active: statusRes.success ? (statusRes.data.total ?? 0) : 0,
        Inactive: inactiveRes.success ? (inactiveRes.data.total ?? 0) : 0,
      });
    } catch {
      // counts are non-critical
    }
  }, [roleTab]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    void Promise.resolve().then(fetchUsers);
  }, [fetchUsers]);

  useEffect(() => {
    void Promise.resolve().then(fetchCounts);
  }, [fetchCounts]);

  useEffect(() => {
    if (!successMessage) return;

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginated = users;
  const selected = selectedUser?.id === selectedId
    ? selectedUser
    : users.find(u => u.id === selectedId);

  useEffect(() => {
    if (!selectedId) {
      void Promise.resolve().then(() => {
        setSelectedUser(null);
        setSelectedUserError(null);
      });
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        setSelectedUserLoading(true);
        setSelectedUserError(null);
        const response = await adminAccountService.getUser(selectedId);
        if (!cancelled && response.success) {
          setSelectedUser(mapUser(response.data));
        } else if (!cancelled) {
          setSelectedUser(null);
          setSelectedUserError(getErrorMessage(response));
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setSelectedUser(null);
          setSelectedUserError(getErrorMessage(error));
        }
      } finally {
        if (!cancelled) setSelectedUserLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const fetchBoothOwnerDetails = useCallback(async (userId: string) => {
    try {
      setBoothDetailsLoading(true);
      setBoothDetailsError(null);
      const res = await adminAccountService.getBoothOwnerDetails(userId);
      if (res.success) {
        setOwnedBooths(res.data.ownedBooths.map(mapOwnedBooth));
      } else {
        setOwnedBooths([]);
        setBoothDetailsError(getErrorMessage(res));
      }
    } catch (error: unknown) {
      setOwnedBooths([]);
      setBoothDetailsError(getErrorMessage(error));
    } finally {
      setBoothDetailsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId && selected?.role === 'booth_owner') {
      void Promise.resolve().then(() => fetchBoothOwnerDetails(selectedId));
      return;
    }

    void Promise.resolve().then(() => {
      setOwnedBooths([]);
      setBoothDetailsError(null);
    });
  }, [fetchBoothOwnerDetails, selected?.role, selectedId]);

  const handleRoleChange = (tab: RoleTab) => { setRoleTab(tab); setStatusTab('Active'); setCurrentPage(1); };
  const handleStatusChange = (tab: StatusTab) => { setStatusTab(tab); setCurrentPage(1); };

  const handleOpenBanModal = (user: AccountListItem) => {
    setBanModalUser(user);
    setBanReason('');
    setApiError(null);
    setSuccessMessage(null);
  };

  const handleCloseBanModal = () => {
    setBanModalUser(null);
    setBanReason('');
    setApiError(null);
  };

  const handleConfirmStatusChange = async () => {
    if (!banModalUser) return;
    const normalizedReason = banReason.trim();
    if (normalizedReason.length < 10 || normalizedReason.length > 1000) return;
    try {
      setIsSubmitting(true);
      setApiError(null);
      const isCurrentlyActive = banModalUser.status === 'Active';
      const newStatus = isCurrentlyActive ? UserStatus.Inactive : UserStatus.Active;
      const statusResponse = await adminAccountService.changeUserStatus(banModalUser.id, {
        status: newStatus,
        reason: normalizedReason,
      });
      if (statusResponse.success) {
        setSelectedUser(mapUser(statusResponse.data));
      }
      setShowHistory(false);
      setStatusHistory([]);
      setHistoryError(null);
      setSuccessMessage(
        isCurrentlyActive
          ? `${banModalUser.name} has been banned successfully. An email notification with the reason has been queued for delivery.`
          : `${banModalUser.name} has been restored successfully. An email notification with the reason has been queued for delivery.`
      );
      handleCloseBanModal();
      await Promise.all([fetchUsers(), fetchCounts()]);
    } catch (e: unknown) {
      const msg = getErrorMessage(e);
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFetchHistory = async () => {
    if (!selected) return;
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    try {
      setHistoryLoading(true);
      setHistoryError(null);
      const resp = await adminAccountService.getUserStatusHistory(selected.id);
      if (resp.success) {
        setStatusHistory(resp.data.items);
      } else {
        setStatusHistory([]);
        setHistoryError(getErrorMessage(resp));
      }
      setShowHistory(true);
    } catch (error: unknown) {
      setStatusHistory([]);
      setHistoryError(getErrorMessage(error));
      setShowHistory(true);
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeCreateMarketOwner = () => {
    if (creatingMarketOwner) return;
    setShowCreateMarketOwner(false);
    setMarketOwnerEmail('');
    setMarketOwnerEmailError(null);
    setCreateMarketOwnerError(null);
  };

  const validateMarketOwnerEmail = (value: string): string | null => {
    const normalized = value.trim();
    if (!normalized) return 'Market Owner email is required.';
    if (normalized.length > 150) return 'Email must not exceed 150 characters.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return 'Enter a valid Market Owner email address.';
    return null;
  };

  const handleCreateMarketOwner = async () => {
    const emailError = validateMarketOwnerEmail(marketOwnerEmail);
    setMarketOwnerEmailError(emailError);
    if (emailError) return;

    try {
      setCreatingMarketOwner(true);
      setCreateMarketOwnerError(null);
      const response = await adminAccountService.createMarketOwnerAccount(marketOwnerEmail.trim().toLowerCase());
      if (!response.success) {
        setCreateMarketOwnerError(getErrorMessage(response));
        return;
      }

      setSuccessMessage(`Market Owner account created for ${response.data.email}. The invitation email is queued for delivery.`);
      setShowCreateMarketOwner(false);
      setMarketOwnerEmail('');
      setRoleTab('market_owner');
      setStatusTab('Active');
      setCurrentPage(1);
    } catch (error: unknown) {
      setCreateMarketOwnerError(getErrorMessage(error));
    } finally {
      setCreatingMarketOwner(false);
    }
  };

  const handleResendMarketOwnerInvitation = async (user: AccountListItem) => {
    try {
      setResendingInvitationId(user.id);
      setSuccessMessage(null);
      setListError(null);
      const response = await adminAccountService.resendMarketOwnerInvitation(user.id);
      if (!response.success) {
        setListError(getErrorMessage(response));
        return;
      }
      setSuccessMessage(`A new invitation email has been queued for ${user.email}.`);
      await fetchUsers();
    } catch (error: unknown) {
      setListError(getErrorMessage(error));
    } finally {
      setResendingInvitationId(null);
    }
  };

  // --- Booth Owner Detailed Screen ---
  if (selectedId && selectedUserLoading && !selected) {
    return (
      <div className="flex min-h-[24rem] items-center justify-center gap-3 text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading account details...
      </div>
    );
  }

  if (selectedId && selectedUserError && !selected) {
    return (
      <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-semibold text-red-800">We could not open this account.</p>
        <p className="mt-2 text-sm text-red-700">{selectedUserError}</p>
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm"
        >
          Back to account list
        </button>
      </div>
    );
  }

  // --- Booth Owner Detailed Screen ---
  if (selectedId && selected && selected.role === 'booth_owner') {
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
              <ImageWithFallback src={resolveMediaUrl(selected.avatar)} alt={selected.name} style={{ width: '4.5rem', height: '4.5rem', borderRadius: '9999px', objectFit: 'cover', boxShadow: '0 0 0 3px rgba(99,102,241,0.3)' }} />
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>{selected.name}</h3>
                <p style={{ color: '#64748B', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>Booth Owner Account</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span style={statusPill(selected.status)}>{selected.status}</span>
                  {selected.activePackageName && (
                    <span
                      style={packagePill(selected.activePackageCode === 'BOOTH_FREE')}
                      title={`Active plan: ${selected.activePackageName}`}
                    >
                      <Crown style={{ width: '0.75rem', height: '0.75rem', flexShrink: 0 }} />
                      {selected.activePackageCode === 'BOOTH_FREE' ? 'Free' : selected.activePackageName}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {selected.status === 'Active' && (
                <button
                  onClick={() => { setSelectedId(null); handleOpenBanModal(selected); }}
                  style={{ padding: '0.5rem 1rem', background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#EF4444', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                >
                  <Ban style={{ width: '1rem', height: '1rem' }} /> Ban Account
                </button>
              )}
              {selected.status === 'Inactive' && (
                <button
                  onClick={() => { setSelectedId(null); handleOpenBanModal(selected); }}
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
          {boothDetailsLoading ? (
            <div style={{ ...cardStyle, padding: '3rem', textAlign: 'center', color: '#64748B' }}>
              <Loader2 style={{ width: '2rem', height: '2rem', color: '#6366F1', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
              <p style={{ margin: 0, fontWeight: 500 }}>Loading booth details...</p>
            </div>
          ) : boothDetailsError ? (
            <div style={{ ...cardStyle, padding: '1.5rem', color: '#B91C1C', background: '#FEF2F2', borderColor: '#FECACA' }}>
              <p style={{ margin: '0 0 1rem', fontWeight: 600 }}>{boothDetailsError}</p>
              <button
                onClick={() => fetchBoothOwnerDetails(selected.id)}
                style={{ padding: '0.5rem 0.875rem', border: '1px solid #FCA5A5', background: '#FFFFFF', color: '#B91C1C', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Retry
              </button>
            </div>
          ) : ownedBooths.length === 0 ? (
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
                        <ImageWithFallback src={resolveMediaUrl(booth.image)} alt={booth.name} style={{ width: '4.5rem', height: '4.5rem', borderRadius: '0.75rem', objectFit: 'cover', flexShrink: 0, boxShadow: '0 0 0 3px rgba(99,102,241,0.2)' }} />
                      ) : (
                        <div style={{ width: '4.5rem', height: '4.5rem', borderRadius: '0.75rem', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 0 3px rgba(99,102,241,0.2)' }}>
                          <Store style={{ width: '1.75rem', height: '1.75rem', color: '#818CF8' }} />
                        </div>
                      )}
                      <div>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>{booth.name}</h4>
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
                          <Ban style={{ width: '0.875rem', height: '0.875rem' }} /> Ban Booth
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
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {booth.documents.length === 0 ? (
                          <div style={{ padding: '1rem', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '0.75rem', color: '#64748B', fontSize: '0.875rem' }}>
                            No legal documents uploaded for this booth.
                          </div>
                        ) : booth.documents.map((doc) => {
                          const fileUrl = resolveMediaUrl(doc.url);
                          const isImage = /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(doc.url);
                          const isApproved = doc.verificationStatus === 'Approved';
                          return (
                          <div key={doc.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.875rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1F2937' }}>{doc.label}</span>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  background: isApproved ? '#ECFDF5' : '#FFF7ED',
                                  color: isApproved ? '#10B981' : '#EA580C',
                                  textTransform: 'lowercase'
                                }}>
                                  {doc.verificationStatus}
                                </span>
                              </div>
                            </div>
                            
                            <p style={{ fontSize: '11px', color: '#94A3B8', margin: '0 0 0.25rem' }}>
                              Uploaded at {doc.uploadedAt ?? 'No data available'}
                            </p>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                              {isImage ? (
                                <div
                                  onClick={() => setPreviewDoc({ url: fileUrl, label: doc.label })}
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
                                  <ImageWithFallback src={fileUrl} alt={doc.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                              ) : (
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.5rem', color: '#4F46E5', fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none' }}
                                >
                                  <FileText style={{ width: '0.875rem', height: '0.875rem' }} /> Open document
                                </a>
                              )}
                            </div>
                          </div>
                        )})}
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
              <ImageWithFallback src={previewDoc.url} alt={previewDoc.label} style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: '0.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }} />
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
        <button
          type="button"
          onClick={() => {
            setMarketOwnerEmail('');
            setMarketOwnerEmailError(null);
            setCreateMarketOwnerError(null);
            setShowCreateMarketOwner(true);
          }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1rem', border: 'none', borderRadius: '0.625rem', background: '#4F46E5', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(79,70,229,0.2)' }}
        >
          <UserPlus style={{ width: '1rem', height: '1rem' }} /> Create Market Owner
        </button>
      </div>

      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '0.875rem 1rem',
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '0.75rem',
            color: '#047857',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
            {successMessage}
          </span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            aria-label="Dismiss success message"
            style={{ border: 'none', background: 'transparent', color: '#047857', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1, padding: '0.125rem' }}
          >
            ×
          </button>
        </div>
      )}

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
              { key: 'market_owner' as RoleTab, label: 'Market Owners', count: roleCounts.market_owner },
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
            {(['Active', 'Inactive'] as StatusTab[]).map(tab => {
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
          <span style={{ fontSize: '0.8125rem', color: '#64748B', whiteSpace: 'nowrap' }}>{totalItems} users</span>
        </div>

        {/* Users Table */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : listError ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '3rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#DC2626', margin: 0, fontWeight: 500 }}>{listError}</p>
            <button
              onClick={() => fetchUsers()}
              style={{ padding: '0.5rem 1rem', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#4F46E5', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
            >
              <RotateCw style={{ width: '0.875rem', height: '0.875rem' }} /> Retry
            </button>
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
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <ImageWithFallback src={resolveMediaUrl(u.avatar)} alt={u.name} style={{ width: '2.25rem', height: '2.25rem', borderRadius: '9999px', objectFit: 'cover', display: 'block', boxShadow: hoveredRow === u.id ? '0 0 0 2px rgba(99,102,241,0.5)' : '0 0 0 2px transparent', transition: 'box-shadow 0.2s' }} />
                        {u.activePackageName && (
                          <span
                            aria-label={`Active plan: ${u.activePackageName}`}
                            title={`Active plan: ${u.activePackageName}`}
                            style={{
                              position: 'absolute',
                              right: '-0.35rem',
                              top: '-0.35rem',
                              display: 'flex',
                              width: '1rem',
                              height: '1rem',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '9999px',
                              border: '2px solid #FFFFFF',
                              background: u.activePackageCode === 'BOOTH_FREE' ? '#64748B' : '#7C3AED',
                              color: '#FFFFFF',
                            }}
                          >
                            <Crown style={{ width: '0.55rem', height: '0.55rem' }} />
                          </span>
                        )}
                        {roleTab === 'market_owner' && u.mustChangePassword && (
                          <span style={{ display: 'inline-flex', marginTop: '0.2rem', padding: '2px 7px', borderRadius: '9999px', background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA', fontSize: '10px', fontWeight: 700 }}>
                            Invitation pending
                          </span>
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', fontWeight: 500, color: '#111827', fontSize: '0.875rem' }}>{u.name}</span>
                        {u.activePackageName && (
                          <span
                            style={packagePill(u.activePackageCode === 'BOOTH_FREE')}
                            title={`Active plan: ${u.activePackageName}`}
                          >
                            {u.activePackageCode === 'BOOTH_FREE' ? 'Free' : u.activePackageName}
                          </span>
                        )}
                      </div>
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

                      {roleTab === 'market_owner' && u.mustChangePassword && u.status === 'Active' && (
                        <button
                          title="Resend invitation"
                          aria-label={`Resend invitation to ${u.email}`}
                          disabled={resendingInvitationId === u.id}
                          onClick={() => void handleResendMarketOwnerInvitation(u)}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '0.5rem', border: '1px solid #C7D2FE', background: '#EEF2FF', cursor: resendingInvitationId === u.id ? 'wait' : 'pointer', opacity: resendingInvitationId === u.id ? 0.6 : 1 }}
                        >
                          {resendingInvitationId === u.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                            : <Send style={{ width: '0.875rem', height: '0.875rem', color: '#4F46E5' }} />}
                        </button>
                      )}
                      
                      {u.status === 'Active' && (
                        <button
                          title="Ban User"
                          onClick={() => handleOpenBanModal(u)}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '0.5rem', border: '1px solid #FEE2E2', background: '#FEF2F2', cursor: 'pointer', transition: 'all 0.15s' }}
                        >
                          <Ban style={{ width: '0.875rem', height: '0.875rem', color: '#EF4444' }} />
                        </button>
                      )}
                      {u.status === 'Inactive' && (
                        <button
                          title="Restore User"
                          onClick={() => handleOpenBanModal(u)}
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
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} itemsPerPage={itemsPerPage} />
        </div>
      </div>

      {/* Detail Modal for Customers */}
      <Modal isOpen={!!(selected && (selected.role === 'customer' || selected.role === 'market_owner'))} onClose={() => { setSelectedId(null); setShowHistory(false); setStatusHistory([]); }} title="User Details" size="md">
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ImageWithFallback src={resolveMediaUrl(selected.avatar)} alt={selected.name} style={{ width: '5rem', height: '5rem', borderRadius: '9999px', objectFit: 'cover', boxShadow: '0 0 0 3px rgba(99,102,241,0.3)' }} />
              <div>
                <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>{selected.name}</h4>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>Role: {selected.role === 'market_owner' ? 'Market Owner' : 'Customer'}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.35rem' }}>
                  <span style={statusPill(selected.status)}>{selected.status}</span>
                  {selected.activePackageName && (
                    <span
                      style={packagePill(false)}
                      title={`Active plan: ${selected.activePackageName}`}
                    >
                      <Crown style={{ width: '0.75rem', height: '0.75rem' }} />
                      {selected.activePackageName}
                    </span>
                  )}
                </div>
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
              {selected.status === 'Active' && (
                <button
                  onClick={() => { handleOpenBanModal(selected); }}
                  style={{ flex: 1, padding: '0.5rem 1rem', background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#EF4444', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
                >
                  <Ban style={{ width: '1.125rem', height: '1.125rem' }} /> Ban Account
                </button>
              )}
              {selected.status === 'Inactive' && (
                <button
                  onClick={() => { handleOpenBanModal(selected); }}
                  style={{ flex: 1, padding: '0.5rem 1rem', background: '#ECFDF5', border: '1px solid #D1FAE5', color: '#10B981', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
                >
                  <CheckCircle style={{ width: '1.125rem', height: '1.125rem' }} /> Restore Account
                </button>
              )}
            </div>

            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
              <button
                onClick={handleFetchHistory}
                disabled={historyLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: '#4F46E5', cursor: 'pointer', fontWeight: 600, fontSize: '0.8125rem', padding: 0 }}
              >
                {historyLoading ? (
                  <Loader2 style={{ width: '0.875rem', height: '0.875rem', animation: 'spin 1s linear infinite' }} />
                ) : null}
                {showHistory ? 'Hide Status History' : 'View Status History'}
              </button>
              {showHistory && (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '15rem', overflowY: 'auto' }}>
                  {historyError ? (
                    <p style={{ fontSize: '0.8125rem', color: '#B91C1C', margin: 0 }}>{historyError}</p>
                  ) : statusHistory.length === 0 ? (
                    <p style={{ fontSize: '0.8125rem', color: '#94A3B8', fontStyle: 'italic', margin: 0 }}>No status history available.</p>
                  ) : (
                    statusHistory.map(hist => (
                      <div key={hist.id} style={{ padding: '0.75rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={statusPill(hist.previousStatus)}>{hist.previousStatus}</span>
                            <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>→</span>
                            <span style={statusPill(hist.newStatus)}>{hist.newStatus}</span>
                          </div>
                          <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                            {new Date(hist.createdAt).toLocaleString('en-US')}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: '#475569', margin: '0.5rem 0 0' }}>
                          <strong>Reason:</strong> {hist.reason}
                        </p>
                        <p style={{ fontSize: '0.6875rem', color: '#94A3B8', margin: '0.25rem 0 0' }}>
                          By: {hist.changedByAdminName}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {banModalUser && (
        <Modal
          isOpen={true}
          onClose={handleCloseBanModal}
          title={banModalUser.status === 'Active' ? 'Ban Account' : 'Restore Account'}
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: banModalUser.status === 'Active' ? '#FEF2F2' : '#ECFDF5', border: `1px solid ${banModalUser.status === 'Active' ? '#FEE2E2' : '#D1FAE5'}`, borderRadius: '0.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#334155', margin: 0 }}>
                You are about to <strong style={{ color: banModalUser.status === 'Active' ? '#EF4444' : '#10B981' }}>{banModalUser.status === 'Active' ? 'ban' : 'restore'}</strong> the account of <strong>{banModalUser.name}</strong> ({banModalUser.email}).
              </p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                Reason <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <textarea
                value={banReason}
                onChange={(e) => { setBanReason(e.target.value); setApiError(null); }}
                placeholder="Enter reason for this action (10-1000 characters)..."
                maxLength={1000}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: `1px solid ${banReason.trim().length > 0 && banReason.trim().length < 10 ? '#FCA5A5' : '#E2E8F0'}`, borderRadius: '0.375rem', fontSize: '0.8125rem', resize: 'vertical', minHeight: '4rem', fontFamily: 'inherit' }}
                rows={3}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.6875rem', color: banReason.trim().length > 0 && banReason.trim().length < 10 ? '#EF4444' : '#94A3B8' }}>
                  {banReason.trim().length === 0
                    ? 'Reason is required (10-1000 characters)'
                    : banReason.trim().length < 10
                      ? `At least 10 characters required (current: ${banReason.trim().length})`
                      : ''}
                </span>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                  {banReason.trim().length}/1000
                </span>
              </div>
            </div>
            {apiError && (
              <div style={{ padding: '0.625rem 0.75rem', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '0.375rem' }}>
                <p style={{ fontSize: '0.8125rem', color: '#DC2626', margin: 0, fontWeight: 500 }}>{apiError}</p>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={handleCloseBanModal}
                disabled={isSubmitting}
                style={{ padding: '0.5rem 1rem', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStatusChange}
                disabled={isSubmitting || banReason.trim().length < 10 || banReason.trim().length > 1000}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  background: banModalUser.status === 'Active' ? '#EF4444' : '#10B981',
                  color: '#FFFFFF',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  cursor: (isSubmitting || banReason.trim().length < 10 || banReason.trim().length > 1000) ? 'not-allowed' : 'pointer',
                  opacity: (isSubmitting || banReason.trim().length < 10 || banReason.trim().length > 1000) ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}
              >
                {isSubmitting ? (
                  <Loader2 style={{ width: '0.875rem', height: '0.875rem', animation: 'spin 1s linear infinite' }} />
                ) : banModalUser.status === 'Active' ? (
                  <Ban style={{ width: '0.875rem', height: '0.875rem' }} />
                ) : (
                  <CheckCircle style={{ width: '0.875rem', height: '0.875rem' }} />
                )}
                Confirm
              </button>
            </div>
          </div>
        </Modal>
      )}

      <Modal
        isOpen={showCreateMarketOwner}
        onClose={closeCreateMarketOwner}
        title="Create Market Owner Account"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '0.875rem', borderRadius: '0.625rem', border: '1px solid #C7D2FE', background: '#EEF2FF', color: '#3730A3', fontSize: '0.8125rem', lineHeight: 1.6 }}>
            The account will be saved immediately. A temporary password will be sent by email, and the Market Owner must change it at the first sign-in.
          </div>
          <div>
            <label htmlFor="market-owner-email" style={{ display: 'block', marginBottom: '0.375rem', color: '#334155', fontSize: '0.8125rem', fontWeight: 600 }}>
              Market Owner email <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              id="market-owner-email"
              type="email"
              autoComplete="off"
              maxLength={150}
              value={marketOwnerEmail}
              onChange={(event) => {
                setMarketOwnerEmail(event.target.value);
                if (marketOwnerEmailError) setMarketOwnerEmailError(null);
                if (createMarketOwnerError) setCreateMarketOwnerError(null);
              }}
              onBlur={() => setMarketOwnerEmailError(validateMarketOwnerEmail(marketOwnerEmail))}
              placeholder="owner@example.com"
              aria-invalid={!!marketOwnerEmailError}
              aria-describedby={marketOwnerEmailError ? 'market-owner-email-error' : undefined}
              style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.5rem', border: `1px solid ${marketOwnerEmailError ? '#FCA5A5' : '#CBD5E1'}`, outline: 'none', fontSize: '0.875rem', color: '#0F172A' }}
            />
            {marketOwnerEmailError && (
              <p id="market-owner-email-error" style={{ margin: '0.35rem 0 0', color: '#DC2626', fontSize: '0.75rem' }}>{marketOwnerEmailError}</p>
            )}
          </div>
          {createMarketOwnerError && (
            <div role="alert" style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #FECACA', background: '#FEF2F2', color: '#B91C1C', fontSize: '0.8125rem' }}>
              {createMarketOwnerError}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={closeCreateMarketOwner} disabled={creatingMarketOwner} style={{ padding: '0.55rem 1rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: '0.8125rem', fontWeight: 600, cursor: creatingMarketOwner ? 'not-allowed' : 'pointer' }}>
              Cancel
            </button>
            <button type="button" onClick={() => void handleCreateMarketOwner()} disabled={creatingMarketOwner || !!validateMarketOwnerEmail(marketOwnerEmail)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', borderRadius: '0.5rem', border: 'none', background: '#4F46E5', color: '#FFFFFF', fontSize: '0.8125rem', fontWeight: 600, cursor: creatingMarketOwner || !!validateMarketOwnerEmail(marketOwnerEmail) ? 'not-allowed' : 'pointer', opacity: creatingMarketOwner || !!validateMarketOwnerEmail(marketOwnerEmail) ? 0.55 : 1 }}>
              {creatingMarketOwner ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus style={{ width: '0.875rem', height: '0.875rem' }} />}
              Create Account
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
