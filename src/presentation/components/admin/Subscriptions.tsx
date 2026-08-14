"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle, Ban, DollarSign, Calendar, Clock, 
  Store, Package as PackageIcon, Mail, User, Eye, Phone, CreditCard, TrendingUp
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Pagination } from './components/Pagination';
import { Modal } from './components/Modal';
import { getErrorMessage } from '@/shared/errors/errorMapper';
import { 
  adminSubscriptionService, 
  AdminSubscriptionDto, 
  PackageType, 
  SubscriptionStatus 
} from '@/application/features/admin/adminSubscriptionService';

type TabOption = 'All' | 'Booth' | 'Market';
type StatusTabOption = 'All' | SubscriptionStatus;

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  boxShadow: '0 4px 32px rgba(15,23,42,0.06)',
  borderRadius: '1rem',
  overflow: 'hidden',
};

const thStyle: React.CSSProperties = {
  padding: '1rem 1.5rem',
  textAlign: 'left',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#64748B',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  background: '#F8FAFC',
  borderBottom: '1px solid #E2E8F0',
};

const tdStyle: React.CSSProperties = {
  padding: '1.25rem 1.5rem',
  fontSize: '0.875rem',
  color: '#334155',
  borderBottom: '1px solid #E2E8F0',
};

export default function Subscriptions() {
  const [activeTab, setActiveTab] = useState<TabOption>('All');
  const [activeStatusTab, setActiveStatusTab] = useState<StatusTabOption>('All');
  
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<AdminSubscriptionDto | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      let typeParam: PackageType | undefined;
      if (activeTab === 'Booth') typeParam = PackageType.Booth;
      if (activeTab === 'Market') typeParam = PackageType.Market;

      let statusParam: SubscriptionStatus | undefined;
      if (activeStatusTab !== 'All') statusParam = activeStatusTab;

      const resp = await adminSubscriptionService.getSubscriptions(typeParam, statusParam, page, pageSize);
      setSubscriptions(resp.items || []);
      setTotalCount(resp.total || 0);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, activeStatusTab, page, pageSize]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      void fetchSubscriptions();
    });
  }, [fetchSubscriptions]);

  const renderStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case SubscriptionStatus.Active:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            Active
          </span>
        );
      case SubscriptionStatus.PendingPayment:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Pending Payment
          </span>
        );
      case SubscriptionStatus.Expired:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <Calendar className="w-3.5 h-3.5 mr-1" />
            Expired
          </span>
        );
      case SubscriptionStatus.Cancelled:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700 border border-rose-200">
            <Ban className="w-3.5 h-3.5 mr-1" />
            Cancelled
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <DollarSign className="w-7 h-7 mr-3 text-indigo-600" />
          Subscriptions
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          View subscription records from Market Owners and Booth Owners. Payments are processed automatically via PayOS.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {(['All', 'Booth', 'Market'] as TabOption[]).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
              }`}
            >
              {tab === 'All' ? 'All' : tab === 'Booth' ? 'Booth' : 'Market'}
            </button>
          ))}
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {(['All', SubscriptionStatus.PendingPayment, SubscriptionStatus.Active, SubscriptionStatus.Expired, SubscriptionStatus.Cancelled] as StatusTabOption[]).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveStatusTab(tab); setPage(1); }}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                activeStatusTab === tab 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
              }`}
            >
              {tab === 'All' ? 'All' 
                : tab === SubscriptionStatus.PendingPayment ? 'Pending Payment'
                : tab === SubscriptionStatus.Active ? 'Active'
                : tab === SubscriptionStatus.Expired ? 'Expired'
                : 'Cancelled'}
            </button>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <div className="overflow-x-auto min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
              <p>Loading...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-rose-500">
              <p>{error}</p>
              <button onClick={fetchSubscriptions} className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-md">Try Again</button>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <PackageIcon className="w-12 h-12 text-slate-300 mb-3" />
              <p>No subscriptions found.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th style={thStyle}>Package</th>
                  <th style={thStyle}>Subscriber</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Amount Paid</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle} className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50 transition-colors group">
                    <td style={tdStyle}>
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${sub.packageType === PackageType.Market ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                          {sub.packageType === PackageType.Market ? <Store className="w-5 h-5" /> : <PackageIcon className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{sub.packageName}</div>
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            {sub.packageType === PackageType.Market ? 'Market Package' : 'Booth Package'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 mr-3">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{sub.ownerName}</div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {sub.ownerEmail}
                          </div>
                          {sub.buyerName && sub.buyerName !== sub.ownerName && (
                            <div className="text-xs text-indigo-600 mt-1 border-t border-gray-100 pt-1">
                              <span className="font-medium">Buyer:</span> {sub.buyerName}
                              {sub.buyerEmail && <span className="text-gray-500"> ({sub.buyerEmail})</span>}
                              {sub.buyerPhone && <span className="text-gray-500"> · {sub.buyerPhone}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div className="text-sm">
                        <div className="flex items-center text-gray-700">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                          <span>Created: {new Date(sub.createdAt).toLocaleDateString('en-US')}</span>
                        </div>
                        {sub.status === SubscriptionStatus.Active && (
                          <div className="flex items-center text-emerald-600 mt-1 text-xs">
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                            <span>Ends: {new Date(sub.endDate).toLocaleDateString('en-US')}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div className="text-sm font-medium text-gray-900">
                        {sub.paidAmount > 0 ? new Intl.NumberFormat('en-US').format(sub.paidAmount) + ' VND' : '-'}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      {renderStatusBadge(sub.status)}
                    </td>
                    <td style={tdStyle} className="text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedSubscription(sub)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        <Eye className="h-3.5 w-3.5" /> View details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {totalCount > 0 && (
          <div className="bg-gray-50">
            <Pagination 
              currentPage={page} 
              totalPages={totalPages} 
              onPageChange={setPage} 
              totalItems={totalCount}
              itemsPerPage={pageSize}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={selectedSubscription !== null}
        onClose={() => setSelectedSubscription(null)}
        title="Subscription details"
        size="md"
      >
        {selectedSubscription && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailCard icon={PackageIcon} label="Package" value={selectedSubscription.packageName} />
              <DetailCard icon={CreditCard} label="Status" value={selectedSubscription.status === SubscriptionStatus.PendingPayment ? 'Pending Payment' : selectedSubscription.status} />
              <DetailCard icon={User} label="Subscriber" value={selectedSubscription.ownerName || 'Not available'} secondary={selectedSubscription.ownerEmail || 'Not available'} />
              <DetailCard icon={User} label="Buyer / payer" value={selectedSubscription.buyerName || selectedSubscription.ownerName || 'Not available'} secondary={selectedSubscription.buyerEmail || selectedSubscription.ownerEmail || 'Not available'} />
              <DetailCard icon={Phone} label="Buyer phone" value={selectedSubscription.buyerPhone || 'Not available'} />
              <DetailCard
                icon={TrendingUp}
                label="Change type"
                value={selectedSubscription.changeType
                  ? (selectedSubscription.previousPackageName
                      ? `${selectedSubscription.changeType} from ${selectedSubscription.previousPackageName}`
                      : selectedSubscription.changeType)
                  : 'New purchase'}
              />
              <DetailCard icon={DollarSign} label="Selected plan price" value={`${new Intl.NumberFormat('en-US').format(selectedSubscription.baseAmount || selectedSubscription.paidAmount)} VND`} />
              <DetailCard icon={DollarSign} label="Credit applied" value={selectedSubscription.creditAmount > 0 ? `-${new Intl.NumberFormat('en-US').format(selectedSubscription.creditAmount)} VND` : '0 VND'} />
              <DetailCard icon={DollarSign} label="Amount paid" value={selectedSubscription.paidAmount > 0 ? `${new Intl.NumberFormat('en-US').format(selectedSubscription.paidAmount)} VND` : '0 VND'} />
              <DetailCard icon={Calendar} label="Subscription period" value={`${formatDate(selectedSubscription.startDate)} - ${formatDate(selectedSubscription.endDate)}`} />
              <DetailCard icon={Clock} label="Payment time" value={selectedSubscription.paidAt ? formatDateTime(selectedSubscription.paidAt) : 'Not available'} />
            </div>
            {selectedSubscription.payOSOrderCode && (
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <span className="font-medium text-slate-900">PayOS reference:</span>{' '}
                {selectedSubscription.payOSOrderCode}
              </div>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleDateString('en-US');
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString('en-US');
}

function DetailCard({ icon: Icon, label, value, secondary }: { icon: LucideIcon; label: string; value: string; secondary?: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Icon className="h-4 w-4 text-indigo-600" /> {label}
      </div>
      <p className="break-words text-sm font-semibold text-slate-900">{value}</p>
      {secondary && <p className="mt-1 break-words text-xs text-slate-500">{secondary}</p>}
    </div>
  );
}
