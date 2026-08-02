"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { CreditCard, Calendar, Clock, CheckCircle, Package, TrendingUp, History, Store, Copy, ExternalLink, X, RefreshCw, ShieldCheck } from 'lucide-react';
import { useBooth } from '@/application/context/BoothContext';
import { ownerSubscriptionService, CurrentSubscription, SubscriptionHistoryItem, OwnerPackage, PackagePolicy, PayOSPaymentResponse } from '@/application/features/subscriptions/ownerSubscriptionService';
import { priceService, PublicPackagePricingOption } from '@/application/features/prices/priceService';
import { Modal } from '@/presentation/components/admin/components/Modal';
import { useToast } from '@/presentation/components/shared/ToastContext';
import { getErrorMessage, isAppError } from '@/shared/errors/errorMapper';
import { resolveMediaUrl } from '@/shared/utils';
import { ImageWithFallback } from '@/presentation/components/ImageWithFallback';

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  boxShadow: '0 4px 32px rgba(15,23,42,0.06)',
  borderRadius: '1rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 1rem',
  background: '#F1F5F9',
  border: '1px solid #E5E7EB',
  borderRadius: '0.5rem',
  fontSize: '0.875rem',
  color: '#111827',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#111827',
  marginBottom: '0.375rem',
};

function formatPrice(p: number) {
  if (p === 0) return 'Free';
  return p.toLocaleString('en-US') + ' VND';
}

function formatDate(d: string | null) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US');
}

function getStatusBadge(status: string) {
  const styles: Record<string, React.CSSProperties> = {
    Active: { background: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)' },
    PendingPayment: { background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)' },
    Scheduled: { background: 'rgba(59,130,246,0.12)', color: '#2563EB', border: '1px solid rgba(59,130,246,0.25)' },
    Expired: { background: 'rgba(100,116,139,0.15)', color: '#64748B', border: '1px solid rgba(100,116,139,0.25)' },
    Cancelled: { background: 'rgba(239,68,68,0.15)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' },
    None: { background: 'rgba(100,116,139,0.15)', color: '#64748B', border: '1px solid rgba(100,116,139,0.25)' },
  };
  const labels: Record<string, string> = {
    Active: 'Active',
    PendingPayment: 'Pending',
    Scheduled: 'Scheduled',
    Expired: 'Expired',
    Cancelled: 'Cancelled',
    None: 'None',
  };
  const s = styles[status] || styles['None'];
  return <span style={{ ...s, borderRadius: '9999px', padding: '2px 10px', fontSize: '12px', fontWeight: 500 }}>{labels[status] || status}</span>;
}

export function Fees() {
  const { showToast } = useToast();
  const { selectedBooth, loading: boothLoading, refreshBooths } = useBooth();
  const [current, setCurrent] = useState<CurrentSubscription | null>(null);
  const [history, setHistory] = useState<SubscriptionHistoryItem[]>([]);
  const [packages, setPackages] = useState<OwnerPackage[]>([]);
  const [packagePrices, setPackagePrices] = useState<Record<string, PublicPackagePricingOption[]>>({});
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<OwnerPackage | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [isRenew, setIsRenew] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [pricingErrors, setPricingErrors] = useState<Set<string>>(new Set());
  const [selectedPolicy, setSelectedPolicy] = useState<PackagePolicy | null>(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [policyAccepted, setPolicyAccepted] = useState(false);

  // PayOS QR modal state
  const [payOSData, setPayOSData] = useState<PayOSPaymentResponse | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [polling, setPolling] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const closeSubscriptionModal = useCallback(() => {
    setShowPurchase(false);
    setSelectedPackage(null);
    setSelectedDuration(null);
    setIsRenew(false);
    setSelectedPolicy(null);
    setPolicyError(null);
    setPolicyAccepted(false);
  }, []);

  const loadSelectedPolicy = useCallback(async (packageId: string) => {
    try {
      setPolicyLoading(true);
      setPolicyError(null);
      setPolicyAccepted(false);
      const policy = await ownerSubscriptionService.getPublicPackagePolicy(packageId);
      setSelectedPolicy(policy);
    } catch (error) {
      setSelectedPolicy(null);
      setPolicyError(getErrorMessage(error));
    } finally {
      setPolicyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!showPurchase || !selectedPackage || isDefaultBoothPlan(selectedPackage.code)) return;
    void Promise.resolve().then(() => loadSelectedPolicy(selectedPackage.id));
  }, [loadSelectedPolicy, selectedPackage, showPurchase]);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const packagesResp = await ownerSubscriptionService.getPublicPackages(0);
      setPackages(packagesResp);

      const newPricingErrors = new Set<string>();
      const priceEntries = await Promise.all(
        packagesResp.map(async (pkg) => {
          if (isDefaultBoothPlan(pkg.code)) return [pkg.id, []] as const;
          try {
            const resp = await priceService.getPublicPackagePrices(pkg.id);
            if (resp.success && resp.data) return [pkg.id, resp.data] as const;
          } catch {
            // The affected card receives its own unavailable-pricing state below.
          }
          newPricingErrors.add(pkg.id);
          return [pkg.id, []] as const;
        }),
      );
      setPackagePrices(Object.fromEntries(priceEntries));
      setPricingErrors(newPricingErrors);
    } catch {
      setPackages([]);
      setPackagePrices({});
      setPricingErrors(new Set());
      setCatalogError("We couldn't load subscription packages. Please try again.");
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  const loadSubscription = useCallback(async () => {
    if (!selectedBooth?.id) {
      setCurrent(null);
      setHistory([]);
      setSubscriptionError(null);
      setSubscriptionLoading(false);
      return;
    }

    setSubscriptionLoading(true);
    setSubscriptionError(null);
    try {
      const [currentResult, historyResult] = await Promise.allSettled([
        ownerSubscriptionService.getBoothCurrent(selectedBooth.id),
        ownerSubscriptionService.getBoothHistory(selectedBooth.id),
      ]);
      setCurrent(currentResult.status === 'fulfilled' ? currentResult.value : null);
      setHistory(historyResult.status === 'fulfilled' ? historyResult.value : []);
      if (currentResult.status === 'rejected' || historyResult.status === 'rejected') {
        setSubscriptionError("We couldn't load this booth's subscription details. Please try again.");
      }
    } finally {
      setSubscriptionLoading(false);
    }
  }, [selectedBooth?.id]);

  const fetchData = useCallback(async () => {
    await Promise.all([loadCatalog(), loadSubscription()]);
  }, [loadCatalog, loadSubscription]);

  useEffect(() => {
    void Promise.resolve().then(loadCatalog);
  }, [loadCatalog]);

  useEffect(() => {
    void Promise.resolve().then(loadSubscription);
  }, [loadSubscription]);

  const handlePurchase = async () => {
    if (!selectedPackage || !selectedBooth?.id) return;

    if (isDefaultBoothPlan(selectedPackage.code)) {
      showToast('info', 'Booth Basic is included automatically and does not require a purchase.');
      return;
    }

    if (!selectedPolicy || !policyAccepted) {
      showToast('error', 'Review and accept the current package policy before continuing.');
      return;
    }
    
    if (pricingErrors.has(selectedPackage.id)) {
      showToast('error', 'Pricing is currently unavailable. Please retry before continuing.');
      return;
    }
    try {
      setSubmitting(true);
      let data: PayOSPaymentResponse;
      if (isRenew) {
          data = await ownerSubscriptionService.renewBooth(selectedBooth.id, {
            durationDays: selectedDuration || undefined,
            acceptedPolicy: true,
            acceptedPolicyVersion: selectedPolicy.version,
          });
      } else {
          data = await ownerSubscriptionService.purchaseBooth(selectedBooth.id, {
            packageId: selectedPackage.id,
            durationDays: selectedDuration || undefined,
            acceptedPolicy: true,
            acceptedPolicyVersion: selectedPolicy.version,
          });
      }

      if (data.status === 'Active' || data.status === 'Scheduled') {
        showToast('success', data.status === 'Scheduled'
          ? 'Your plan change has been scheduled. Your current plan remains active until its end date.'
          : 'Subscription activated successfully.');
        closeSubscriptionModal();
        await fetchData();
      } else if (data.status === 'AwaitingConfirmation') {
        showToast('info', 'Your payment was received. We are confirming the plan change now.');
        closeSubscriptionModal();
        await fetchData();
      } else {
        setPayOSData(data);
        closeSubscriptionModal();
        setShowQRModal(true);
        startPolling(data.subscriptionId, data.expiresAt);
      }
    } catch (error) {
      if (isAppError(error) && error.code === 'POLICY_VERSION_MISMATCH') {
        setPolicyAccepted(false);
        showToast('error', 'The package policy was updated. Review and accept the latest version before continuing.');
        await loadSelectedPolicy(selectedPackage.id);
        return;
      }

      showToast('error', getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const startPolling = useCallback((subscriptionId: string, expiresAt: string | null) => {
    setPolling(true);
    if (expiresAt) {
      const numericExpiry = Number(expiresAt);
      const expiryMs = Number.isFinite(numericExpiry) && /^\d+$/.test(expiresAt)
        ? numericExpiry * 1000
        : new Date(expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiryMs - Date.now()) / 1000));
      setCountdown(remaining);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 0) { if (countdownRef.current) clearInterval(countdownRef.current); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    pollingRef.current = setInterval(async () => {
      try {
        const res = await ownerSubscriptionService.getPaymentStatus(subscriptionId);
        if (res.status === 'Active') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          if (countdownRef.current) clearInterval(countdownRef.current);
          setPolling(false); setShowQRModal(false); setPayOSData(null);
          showToast('success', 'Payment successful. Your subscription is now active.');
          await fetchData();
        } else if (res.status === 'Cancelled' || res.status === 'Expired') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          if (countdownRef.current) clearInterval(countdownRef.current);
          setPolling(false); setShowQRModal(false); setPayOSData(null);
          showToast('error', 'Payment was cancelled or expired.');
          await fetchData();
        }
      } catch { /* ignore */ }
    }, 4000);
  }, [fetchData, showToast]);

  const handleCancelPayment = async () => {
    if (!payOSData) return;
    try {
      await ownerSubscriptionService.cancelPayment(payOSData.subscriptionId);
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      setPolling(false); setShowQRModal(false); setPayOSData(null);
      showToast('info', 'Payment has been cancelled.');
      await fetchData();
    } catch (error) {
      showToast('error', getErrorMessage(error));
    }
  };

  const handleCancelExistingPayment = async () => {
    if (!current?.pendingSubscriptionId) return;
    try {
      setSubmitting(true);
      await ownerSubscriptionService.cancelPayment(current.pendingSubscriptionId);
      showToast('info', 'The pending payment has been cancelled. You can choose another plan now.');
      await fetchData();
    } catch (error) {
      showToast('error', getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('success', `${label} copied to clipboard.`);
    }).catch(() => {
      showToast('error', 'Failed to copy.');
    });
  };

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const renderCurrentFeatures = (packageCode: string | null) => {
    const features = packages.find((pkg) => pkg.code === packageCode)?.features ?? [];
    if (features.length === 0) return null;
    return (
      <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '0.5rem' }}>Included features</div>
        <ul className="space-y-1.5 text-sm text-slate-700">
          {features.map((feature) => <li key={feature} className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />{feature}</li>)}
        </ul>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <CreditCard className="w-7 h-7 mr-3 text-indigo-600" />
          Subscription Plans &amp; Fees
        </h1>
        <p className="mt-2 text-sm text-gray-600">Manage your subscription plans and payments for your booth.</p>
      </div>

      {boothLoading && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600" style={cardStyle}>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          Checking your assigned booth...
        </div>
      )}

      {!boothLoading && !selectedBooth && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <div className="flex gap-3">
            <Store className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="font-semibold">No booth has been assigned to your account yet.</p>
              <p className="mt-1 text-sm text-amber-800">You can review available plans now. Purchasing becomes available after a Market Owner assigns your booth.</p>
            </div>
          </div>
          <button type="button" onClick={() => void refreshBooths()} className="shrink-0 text-sm font-semibold text-amber-900 underline">Retry</button>
        </div>
      )}

      <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
        <button onClick={() => setActiveTab('current')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'current' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-indigo-600'}`}>Current Plan</button>
        <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-indigo-600'}`}>History</button>
      </div>

      {catalogError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 flex items-center justify-between">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{catalogError}</p>
            </div>
          </div>
          <button onClick={() => void loadCatalog()} className="text-sm font-medium text-red-700 hover:text-red-600 underline">Retry</button>
        </div>
      )}

      {subscriptionError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 flex items-center justify-between">
          <p className="text-sm text-red-700">{subscriptionError}</p>
          <button onClick={() => void loadSubscription()} className="text-sm font-medium text-red-700 hover:text-red-600 underline">Retry</button>
        </div>
      )}

      {catalogLoading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
          <p>Loading...</p>
        </div>
      ) : activeTab === 'current' ? (
        <div className="space-y-6">
          {subscriptionLoading && selectedBooth && (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600" style={cardStyle}>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              Loading your current subscription...
            </div>
          )}
          {current && (
            <div className="space-y-4">
            {current.pendingSubscriptionId && (
              <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">Payment waiting for {current.pendingPackageName || 'your selected plan'}</p>
                  <p className="mt-1 text-sm text-amber-800">Continue by selecting the same plan again, or cancel this payment before choosing another plan.</p>
                </div>
                <button type="button" disabled={submitting} onClick={() => void handleCancelExistingPayment()} className="shrink-0 rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50">Cancel pending payment</button>
              </div>
            )}
            {current.scheduledSubscriptionId && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-950">
                <p className="font-semibold">{current.scheduledPackageName || 'Your next plan'} is scheduled</p>
                <p className="mt-1 text-sm text-blue-800">Your current plan remains active. The scheduled plan starts on {formatDate(current.scheduledStartDate)}.</p>
              </div>
            )}
            <div style={cardStyle} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{getBoothPlanName(current.packageCode, current.packageName)}</h2>
                </div>
                <div className="flex items-center gap-3">
                  {current.status === 'Active' && !isDefaultBoothPlan(current.packageCode) && (
                    <button 
                      onClick={() => {
                        const pkg = packages.find(p => p.code === current.packageCode);
                        if (pkg) {
                          if (pricingErrors.has(pkg.id)) {
                            showToast('error', 'Pricing is currently unavailable. Please retry before renewing.');
                            return;
                          }
                          setSelectedPackage(pkg);
                          const prices = packagePrices[pkg.id] || [];
                          const defaultDuration = pkg.durationDays;
                          const hasDefault = prices.some(p => p.durationDays === defaultDuration);
                          setSelectedDuration(hasDefault ? defaultDuration : (prices[0]?.durationDays || null));
                          setIsRenew(true);
                          setShowPurchase(true);
                        } else {
                          showToast('error', 'Cannot renew: package no longer available.');
                        }
                      }}
                      className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-md text-sm font-medium hover:bg-indigo-200"
                    >
                      Renew Subscription
                    </button>
                  )}
                  {getStatusBadge(current.status)}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Start Date</div>
                  <div className="text-sm font-medium text-gray-900 flex items-center"><Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />{isDefaultBoothPlan(current.packageCode) ? 'Included automatically' : formatDate(current.startDate)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">End Date</div>
                  <div className="text-sm font-medium text-gray-900 flex items-center"><Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />{isDefaultBoothPlan(current.packageCode) ? 'No expiration' : formatDate(current.endDate)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Remaining</div>
                  <div className="text-sm font-medium text-gray-900 flex items-center"><Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />{isDefaultBoothPlan(current.packageCode) ? 'Always available' : `${current.daysRemaining} days`}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Amount Paid</div>
                  <div className="text-sm font-medium text-gray-900">{formatPrice(current.paidAmount)}</div>
                </div>
              </div>
              {renderCurrentFeatures(current.packageCode)}
            </div>
            </div>
          )}

          {selectedBooth && !subscriptionLoading && !current && !subscriptionError && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600" style={cardStyle}>
              Your current plan will appear here once it is available.
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Available Plans</h3>
              <button disabled={!!catalogError || !selectedBooth} onClick={() => { setSelectedPackage(null); setIsRenew(false); setShowPurchase(true); }} className={`px-4 py-2 text-white rounded-lg text-sm font-medium flex items-center gap-2 ${(catalogError || !selectedBooth) ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                <TrendingUp className="w-4 h-4" /> Subscribe to New Plan
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map(pkg => (
                <div key={pkg.id} style={cardStyle} className="p-5 flex flex-col">
                  {pkg.imageUrl ? (
                    <div className="mb-3 rounded-lg overflow-hidden" style={{ height: '120px', background: '#F8FAFC' }}>
                      <ImageWithFallback src={resolveMediaUrl(pkg.imageUrl)} alt={pkg.packageName} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mb-3">
                      <Package className="w-6 h-6 text-indigo-600" />
                    </div>
                  )}
                  <h4 className="font-semibold text-gray-900 mb-1">{getBoothPlanName(pkg.code, pkg.packageName)}</h4>
                  {(() => {
                    if (isDefaultBoothPlan(pkg.code)) {
                      return (
                        <div className="mb-3">
                          <span className="text-xl font-bold text-emerald-700">Free forever</span>
                          <p className="text-xs text-gray-500 mt-1">Applied automatically when no paid plan is active.</p>
                        </div>
                      );
                    }
                    if (pricingErrors.has(pkg.id)) {
                      return (
                        <div className="flex flex-col mb-3">
                          <span className="text-sm text-red-500 font-medium">Pricing is currently unavailable.</span>
                          <button onClick={() => void loadCatalog()} className="text-xs text-indigo-600 hover:text-indigo-800 self-start mt-1 underline">Retry</button>
                        </div>
                      );
                    }
                    const prices = packagePrices[pkg.id] || [];
                    const displayOption = prices.find(p => p.durationDays === pkg.durationDays);
                    if (displayOption?.hasPromotion) {
                      return (
                        <div className="flex flex-col mb-3">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-red-600">{formatPrice(displayOption.effectivePrice)}</span>
                            <span className="text-sm text-gray-400 line-through">{formatPrice(displayOption.basePrice)}</span>
                            <span className="text-xs text-gray-500">/ {displayOption.durationDays} days</span>
                          </div>
                          <span className="text-xs text-red-500 font-medium">
                            Promo valid until {displayOption.promotionEndDate ? formatDate(displayOption.promotionEndDate) : 'further notice'}
                          </span>
                        </div>
                      );
                    }
                    if (displayOption) {
                      return (
                        <div className="flex items-baseline gap-1 mb-3">
                          <span className="text-xl font-bold text-gray-900">{formatPrice(displayOption.effectivePrice)}</span>
                          <span className="text-xs text-gray-500">/ {displayOption.durationDays} days</span>
                        </div>
                      );
                    }
                    return (
                      <div className="flex items-baseline gap-1 mb-3">
                        <span className="text-xl font-bold text-gray-900">{formatPrice(pkg.price)}</span>
                        <span className="text-xs text-gray-500">/ {pkg.durationDays} days</span>
                      </div>
                    );
                  })()}
                  {pkg.description && <p className="text-sm text-gray-600 mb-3 flex-1">{pkg.description}</p>}
                  
                  {pkg.features && pkg.features.length > 0 && (
                    <div className="border-t border-gray-200 pt-3 mb-4 flex-1">
                      <ul className="space-y-2">
                        {pkg.features.map((f, i) => (
                          <li key={i} className="flex items-start text-sm text-gray-700">
                            <CheckCircle className="w-4 h-4 mr-2 text-indigo-500 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button disabled={!!catalogError || !selectedBooth || pricingErrors.has(pkg.id) || isDefaultBoothPlan(pkg.code) || current?.packageCode === pkg.code} onClick={() => { 
                    setSelectedPackage(pkg);
                    const prices = packagePrices[pkg.id] || [];
                    const defaultDuration = pkg.durationDays;
                    const hasDefault = prices.some(p => p.durationDays === defaultDuration);
                    setSelectedDuration(hasDefault ? defaultDuration : (prices[0]?.durationDays || null));
                    setIsRenew(false);
                    setShowPurchase(true); 
                  }} className={`mt-3 w-full px-4 py-2 text-white rounded-lg text-sm font-medium ${(catalogError || !selectedBooth || pricingErrors.has(pkg.id) || isDefaultBoothPlan(pkg.code) || current?.packageCode === pkg.code) ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                    {!selectedBooth
                      ? 'Booth assignment required'
                      : isDefaultBoothPlan(pkg.code)
                      ? 'Included by default'
                      : current?.packageCode === pkg.code
                        ? 'Current plan'
                        : getBoothPlanRank(pkg.code) > getBoothPlanRank(current?.packageCode)
                          ? 'Upgrade to this plan'
                          : 'Schedule this plan'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={cardStyle} className="overflow-hidden">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <History className="w-12 h-12 text-slate-300 mb-3" />
              <p>No subscription history yet.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b">Start</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b">End</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b">Price</th>
                </tr>
              </thead>
              <tbody>
                {history.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{getBoothPlanName(item.packageCode, item.packageName)}</td>
                    <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{formatDate(item.startDate)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{formatDate(item.endDate)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{formatPrice(item.paidAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal isOpen={showPurchase} onClose={closeSubscriptionModal} title={isRenew ? "Renew Subscription" : "Subscribe to Plan"} size="md">
        <div className="space-y-4">
          {selectedPackage && (() => {
            const prices = packagePrices[selectedPackage.id] || [];
            const selectedPrice = prices.find(p => p.durationDays === selectedDuration);
            const displayPrice = selectedPrice ? selectedPrice.effectivePrice : selectedPackage.price;
            const displayDuration = selectedPrice ? selectedPrice.durationDays : selectedPackage.durationDays;
            return (
              <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
                <p className="text-sm text-gray-800">
                  You are selecting <strong>{getBoothPlanName(selectedPackage.code, selectedPackage.packageName)}</strong> ({formatPrice(displayPrice)} / {displayDuration} days).
                </p>
              </div>
            );
          })()}
          {!selectedPackage && packages.length > 0 && (
            <div>
              <label style={labelStyle}>Select Plan</label>
              <select onChange={e => { 
                const found = packages.find(p => p.id === e.target.value); 
                if (found && pricingErrors.has(found.id)) {
                  showToast('error', 'Pricing is currently unavailable for this plan.');
                  e.target.value = '';
                  setSelectedPackage(null);
                  setSelectedDuration(null);
                  return;
                }
                setSelectedPackage(found ?? null);
                setSelectedPolicy(null);
                setPolicyAccepted(false);
                setPolicyError(null);
                if (found) {
                  const prices = packagePrices[found.id] || [];
                  const defaultDuration = found.durationDays;
                  const hasDefault = prices.some(p => p.durationDays === defaultDuration);
                  setSelectedDuration(hasDefault ? defaultDuration : (prices[0]?.durationDays || null));
                } else {
                  setSelectedDuration(null);
                }
              }} style={inputStyle} defaultValue="">
                <option value="">-- Select a plan --</option>
                {packages.map(p => (
                  <option
                    key={p.id}
                    value={p.id}
                    disabled={pricingErrors.has(p.id) || isDefaultBoothPlan(p.code) || current?.packageCode === p.code}
                  >
                    {getBoothPlanName(p.code, p.packageName)} - {isDefaultBoothPlan(p.code) ? 'Included by default' : formatPrice(p.price)}{pricingErrors.has(p.id) ? ' - Pricing unavailable' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          {selectedPackage && (packagePrices[selectedPackage.id] || []).length > 0 && (
            <div>
              <label style={labelStyle}>Select Price Tier</label>
              <select
                onChange={e => setSelectedDuration(e.target.value ? Number(e.target.value) : null)}
                style={inputStyle}
                value={selectedDuration || ''}
              >
                {packagePrices[selectedPackage.id].map(p => (
                  <option key={p.durationDays} value={p.durationDays}>
                    {formatPrice(p.effectivePrice)} / {p.durationDays} days {p.hasPromotion ? '(Promo)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          {selectedPackage && !isDefaultBoothPlan(selectedPackage.code) && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Package policy and change rules</h4>
                  <ul className="mt-2 space-y-1 text-xs text-slate-600">
                    <li>Upgrades become active after successful payment; unused paid value is applied as credit.</li>
                    <li>A lower-tier plan is scheduled after the current paid term ends; no mid-term refund is issued.</li>
                    <li>If a package stops being sold, an already-paid subscription keeps its accepted policy snapshot until its term ends.</li>
                    <li>Expiry falls back to Booth Basic without deleting the booth, menu, orders, reviews or history.</li>
                    <li>When more than 20 menu items remain after fallback, existing items are retained but new items are blocked until the count is reduced or the plan is upgraded.</li>
                  </ul>
                </div>
              </div>

              {policyLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                  Loading the current policy...
                </div>
              ) : policyError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-700">We couldn&apos;t load the current package policy.</p>
                  <button type="button" onClick={() => void loadSelectedPolicy(selectedPackage.id)} className="mt-2 text-sm font-semibold text-red-700 underline">
                    Retry
                  </button>
                </div>
              ) : selectedPolicy ? (
                <>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{selectedPolicy.title}</p>
                      <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">Version {selectedPolicy.version}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Effective {formatDate(selectedPolicy.effectiveFrom)}</p>
                    {selectedPolicy.terms && selectedPolicy.terms.length > 0 ? (
                      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-6 text-slate-700">
                        {selectedPolicy.terms.map((term, index) => (
                          <li key={index}>{term}</li>
                        ))}
                      </ol>
                    ) : (
                      <p className="mt-3 text-sm leading-6 text-slate-700">The detailed package terms are unavailable. Please retry before continuing.</p>
                    )}
                  </div>
                  <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={policyAccepted}
                      onChange={(event) => setPolicyAccepted(event.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600"
                    />
                    <span>I have read and accept package policy version {selectedPolicy.version}.</span>
                  </label>
                </>
              ) : null}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button onClick={closeSubscriptionModal} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium">Cancel</button>
            <button onClick={handlePurchase} disabled={!selectedPackage || isDefaultBoothPlan(selectedPackage.code) || pricingErrors.has(selectedPackage.id) || policyLoading || !!policyError || !selectedPolicy || !policyAccepted || submitting} className={`px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium flex items-center ${(!selectedPackage || isDefaultBoothPlan(selectedPackage.code) || pricingErrors.has(selectedPackage.id) || policyLoading || !!policyError || !selectedPolicy || !policyAccepted || submitting) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'}`}>
              {submitting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <CheckCircle className="w-4 h-4 mr-2" />}
              Complete Payment
            </button>
          </div>
        </div>
      </Modal>

      {/* PayOS QR Modal */}
      {showQRModal && payOSData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: '#FFFFFF' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Payment Details</h3>
                <p className="text-sm text-gray-500">{payOSData.packageName} - {payOSData.durationDays} days</p>
              </div>
              <button onClick={handleCancelPayment} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {countdown > 0 && (
              <div className="rounded-lg p-3 mb-4 flex items-center gap-2" style={{ background: '#FEF3C7' }}>
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-700">Time remaining: <strong>{formatCountdown(countdown)}</strong></span>
                {polling && <span className="ml-auto text-xs text-amber-600 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Checking...</span>}
              </div>
            )}
            {payOSData.qrCode && (
              <div className="flex flex-col items-center mb-4">
                <div className="p-4 rounded-xl" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                  <Image
                    src={payOSData.qrCode}
                    alt="Payment QR Code"
                    width={192}
                    height={192}
                    unoptimized
                    className="h-48 w-48"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Scan the QR code to complete your payment</p>
              </div>
            )}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#F9FAFB' }}>
                <div><p className="text-xs text-gray-500">Amount</p><p className="text-sm font-bold text-gray-900">{new Intl.NumberFormat('en-US').format(payOSData.amount)} VND</p></div>
                <button onClick={() => copyToClipboard(String(payOSData.amount), 'Amount')} className="p-1.5 rounded-lg hover:bg-gray-200"><Copy className="w-4 h-4 text-gray-500" /></button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#F9FAFB' }}>
                <div><p className="text-xs text-gray-500">Account Number</p><p className="text-sm font-medium text-gray-900">{payOSData.accountNumber}</p></div>
                <button onClick={() => copyToClipboard(payOSData.accountNumber, 'Account number')} className="p-1.5 rounded-lg hover:bg-gray-200"><Copy className="w-4 h-4 text-gray-500" /></button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#F9FAFB' }}>
                <div><p className="text-xs text-gray-500">Account Name</p><p className="text-sm font-medium text-gray-900">{payOSData.accountName}</p></div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#F9FAFB' }}>
                <div><p className="text-xs text-gray-500">Description</p><p className="text-sm font-medium text-gray-900">{payOSData.description}</p></div>
                <button onClick={() => copyToClipboard(payOSData.description, 'Description')} className="p-1.5 rounded-lg hover:bg-gray-200"><Copy className="w-4 h-4 text-gray-500" /></button>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleCancelPayment} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all" style={{ background: '#F3F4F6', color: '#374151' }}>Cancel Payment</button>
              <a href={payOSData.checkoutUrl} target="_blank" rel="noopener noreferrer" className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all flex items-center justify-center gap-2" style={{ background: '#7C3AED' }}>
                <ExternalLink className="w-4 h-4" /> Open Payment Page
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getBoothPlanName(code: string | null | undefined, fallback: string) {
  switch (code?.toUpperCase()) {
    case 'BOOTH_FREE': return 'Booth Basic';
    case 'BOOTH_GROWTH': return 'Booth Boost';
    case 'BOOTH_FEATURED': return 'Booth Featured';
    default: return fallback;
  }
}

function getBoothPlanRank(code: string | null | undefined) {
  switch (code?.toUpperCase()) {
    case 'BOOTH_FREE': return 0;
    case 'BOOTH_GROWTH': return 1;
    case 'BOOTH_FEATURED': return 2;
    default: return 0;
  }
}

function isDefaultBoothPlan(code: string | null | undefined) {
  return code?.toUpperCase() === 'BOOTH_FREE';
}
