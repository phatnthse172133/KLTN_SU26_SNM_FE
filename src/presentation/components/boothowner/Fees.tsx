"use client";

import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Calendar, Clock, CheckCircle, Package, TrendingUp, History, Store, ShieldCheck, X, Eye } from 'lucide-react';
import { useBooth } from '@/application/context/BoothContext';
import {
  ownerSubscriptionService,
  CurrentSubscription,
  SubscriptionHistoryItem,
  OwnerPackage,
  PackagePolicy,
  PayOSPaymentResponse,
  SubscriptionQuoteResponse,
} from '@/application/features/subscriptions/ownerSubscriptionService';
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

function formatDateTime(d: string | null) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
  const { selectedBooth, loading: boothLoading, error: boothLoadError, notFound: boothNotFound, refreshBooths } = useBooth();
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
  const [quoteData, setQuoteData] = useState<SubscriptionQuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [priceRefreshConfirmation, setPriceRefreshConfirmation] = useState<{ quoteAmount: number; actualAmount: number; checkoutUrl: string } | null>(null);
  const [selectedHistoryDetail, setSelectedHistoryDetail] = useState<SubscriptionHistoryItem | null>(null);

  const closeSubscriptionModal = useCallback(() => {
    setShowPurchase(false);
    setSelectedPackage(null);
    setSelectedDuration(null);
    setIsRenew(false);
    setSelectedPolicy(null);
    setPolicyError(null);
    setPolicyAccepted(false);
    setQuoteData(null);
    setQuoteError(null);
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

  const loadQuote = useCallback(async (packageId: string, durationDays: number | null) => {
    if (!selectedBooth?.id) return;
    try {
      setQuoteLoading(true);
      setQuoteError(null);
      const quote = await ownerSubscriptionService.quoteBooth(selectedBooth.id, {
        packageId,
        durationDays: durationDays || undefined,
      });
      setQuoteData(quote);
    } catch (error) {
      setQuoteData(null);
      setQuoteError(getErrorMessage(error));
    } finally {
      setQuoteLoading(false);
    }
  }, [selectedBooth?.id]);

  useEffect(() => {
    if (!showPurchase || !selectedPackage || isDefaultBoothPlan(selectedPackage.code)) return;
    void Promise.resolve().then(() => loadSelectedPolicy(selectedPackage.id));
    void Promise.resolve().then(() => loadQuote(selectedPackage.id, selectedDuration));
  }, [loadSelectedPolicy, loadQuote, selectedDuration, selectedPackage, showPurchase]);

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

  useEffect(() => {
    if (!current?.pendingSubscriptionId || typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const paymentResult = url.searchParams.get('payment');
    if (!paymentResult) return;
    url.searchParams.delete('payment');
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);

    void (async () => {
      try {
        const status = await ownerSubscriptionService.getPaymentStatus(current.pendingSubscriptionId!);
        if (paymentResult === 'cancelled') {
          if (status.status !== 'Cancelled' && status.status !== 'Expired') {
            await ownerSubscriptionService.cancelPayment(current.pendingSubscriptionId!);
          }
          showToast('info', 'Payment was cancelled. Your plan has not been changed.');
        } else if (status.status === 'Active') {
          showToast('success', 'Payment successful. Your subscription is now active.');
        } else if (status.status === 'Cancelled' || status.status === 'Expired') {
          showToast('error', 'Payment was cancelled or expired. You can choose the plan again.');
        } else {
          showToast('info', 'We are still confirming your payment. Please check your subscription again shortly.');
        }
        await loadSubscription();
      } catch (error) {
        showToast('error', getErrorMessage(error));
      }
    })();
  }, [current, loadSubscription, showToast]);

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
          : 'Your plan has been activated. No PayOS payment was required because your subscription credit covered the selected plan.');
        closeSubscriptionModal();
        await fetchData();
      } else if (data.status === 'AwaitingConfirmation') {
        showToast('info', 'Your payment was received. We are confirming the plan change now.');
        closeSubscriptionModal();
        await fetchData();
      } else {
        if (!data.checkoutUrl) {
          showToast('error', 'The payment page is unavailable. Please try again later.');
          return;
        }
        if (quoteData && data.amount !== quoteData.amountDue) {
          setPriceRefreshConfirmation({
            quoteAmount: quoteData.amountDue,
            actualAmount: data.amount,
            checkoutUrl: data.checkoutUrl,
          });
          closeSubscriptionModal();
          return;
        }
        closeSubscriptionModal();
        window.location.assign(data.checkoutUrl);
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

  const handleContinuePendingPayment = async () => {
    if (!current?.pendingPackageCode || !selectedBooth?.id) {
      showToast('error', 'The pending plan could not be identified. Please refresh and try again.');
      return;
    }
    const pendingPackage = packages.find((pkg) => pkg.code === current.pendingPackageCode);
    if (!pendingPackage) {
      showToast('error', 'The pending plan is no longer available. Please contact Support.');
      return;
    }
    try {
      setSubmitting(true);
      const data = await ownerSubscriptionService.purchaseBooth(selectedBooth.id, {
        packageId: pendingPackage.id,
        durationDays: pendingPackage.durationDays,
        acceptedPolicy: true,
      });
      if (data.status === 'AwaitingWebhook' || data.status === 'AwaitingConfirmation') {
        showToast('info', 'Your payment was received. We are confirming your plan now.');
        await fetchData();
        return;
      }
      if (!data.checkoutUrl) {
        showToast('error', 'The payment page is unavailable. Please try again later.');
        return;
      }
      window.location.assign(data.checkoutUrl);
    } catch (error) {
      showToast('error', getErrorMessage(error));
    } finally {
      setSubmitting(false);
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
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
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
              <p className="font-semibold">{boothNotFound ? "Your account does not have a Booth yet." : "We couldn't load your Booth information."}</p>
              <p className="mt-1 text-sm text-amber-800">{boothNotFound
                ? "Ask the Market Owner to create a Booth for your account. You can purchase a plan after the Booth is created."
                : boothLoadError ?? "Please try again or contact Support if the problem continues."}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void refreshBooths()}
            className="shrink-0 rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800"
          >
            Refresh
          </button>
        </div>
      )}

      {selectedBooth && (
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('current')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'current' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <TrendingUp className="w-4 h-4" />
            Plans &amp; Subscription
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <History className="w-4 h-4" />
            History
          </button>
        </div>
      )}

      {activeTab === 'current' ? (
        <div className="space-y-6">
          {subscriptionLoading ? (
            <div style={cardStyle} className="p-6">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                Loading your current subscription...
              </div>
            </div>
          ) : subscriptionError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-medium">{subscriptionError}</p>
                <button
                  type="button"
                  onClick={() => void loadSubscription()}
                  className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : current ? (
            <div style={cardStyle} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Current Plan</span>
                  <h3 className="text-xl font-bold text-gray-900 mt-1">{getBoothPlanName(current.packageCode, current.packageName)}</h3>
                </div>
                {getStatusBadge(current.status)}
              </div>

              {current.pendingSubscriptionId && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">
                        You have a pending payment for {getBoothPlanName(current.pendingPackageCode, current.pendingPackageName || 'another plan')}.
                      </p>
                      <p className="mt-1 text-xs text-amber-800">
                        Complete your payment to activate this plan, or cancel it to choose a different plan.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleContinuePendingPayment()}
                        disabled={submitting}
                        className="rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
                      >
                        {submitting ? 'Opening...' : 'Continue payment'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleCancelExistingPayment()}
                        disabled={submitting}
                        className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                      >
                        Cancel pending payment
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {current.scheduledSubscriptionId && (
                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
                  <p className="font-semibold">
                    Scheduled plan: {getBoothPlanName(null, current.scheduledPackageName || 'Next plan')}
                  </p>
                  <p className="mt-1 text-xs text-blue-800">
                    This plan will become active automatically on {formatDate(current.scheduledStartDate)}.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Start Date</div>
                  <div className="font-semibold text-gray-900 text-sm mt-1">{formatDate(current.startDate)}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> End Date</div>
                  <div className="font-semibold text-gray-900 text-sm mt-1">{formatDate(current.endDate)}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Days Remaining</div>
                  <div className="font-semibold text-gray-900 text-sm mt-1">{current.daysRemaining} days</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> Paid Amount</div>
                  <div className="font-semibold text-gray-900 text-sm mt-1">{formatPrice(current.paidAmount)}</div>
                </div>
              </div>

              {renderCurrentFeatures(current.packageCode)}
            </div>
          ) : (
            <div style={cardStyle} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Current Plan</span>
                  <h3 className="text-xl font-bold text-gray-900 mt-1">Booth Basic</h3>
                  <p className="mt-1 text-sm text-gray-600">Booth Basic is included automatically. Upgrade to access more features.</p>
                </div>
                {getStatusBadge('Active')}
              </div>
              {renderCurrentFeatures('BOOTH_FREE')}
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Available Plans</h3>
            {catalogError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <div className="flex items-center justify-between gap-3">
                  <span>{catalogError}</span>
                  <button type="button" onClick={() => void loadCatalog()} className="rounded-lg bg-red-800 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700">Retry</button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <div key={pkg.id} style={cardStyle} className={`p-6 flex flex-col relative transition-all duration-200 ${current?.packageCode === pkg.code ? 'border-2 border-indigo-600 shadow-md' : 'border border-gray-200 hover:shadow-lg'}`}>
                  {current?.packageCode === pkg.code && (
                    <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                      <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase shadow">Current</span>
                    </div>
                  )}

                  {pkg.imageUrl && (
                    <div className="w-full h-36 relative mb-4 rounded-lg overflow-hidden border border-gray-100">
                      <ImageWithFallback
                        src={resolveMediaUrl(pkg.imageUrl)}
                        alt={pkg.packageName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <h4 className="text-lg font-bold text-gray-900 mb-1">{getBoothPlanName(pkg.code, pkg.packageName)}</h4>

                  {(() => {
                    if (isDefaultBoothPlan(pkg.code)) {
                      return (
                        <div className="flex items-baseline gap-1 mb-3">
                          <span className="text-xl font-bold text-emerald-600">Free</span>
                          <span className="text-xs text-gray-500">/ included</span>
                        </div>
                      );
                    }
                    if (pricingErrors.has(pkg.id)) {
                      return (
                        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
                          Pricing is currently unavailable.
                        </div>
                      );
                    }
                    const prices = packagePrices[pkg.id] || [];
                    const displayOption = prices.find((p) => p.durationDays === pkg.durationDays) || prices[0];
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

                  <button
                    disabled={!!catalogError || !selectedBooth || pricingErrors.has(pkg.id) || isDefaultBoothPlan(pkg.code) || (current?.packageCode === pkg.code && current?.pendingPackageCode !== pkg.code)}
                    onClick={() => {
                      if (current?.pendingSubscriptionId && current.pendingPackageCode === pkg.code) {
                        void handleContinuePendingPayment();
                        return;
                      }
                      setSelectedPackage(pkg);
                      const prices = packagePrices[pkg.id] || [];
                      const defaultDuration = pkg.durationDays;
                      const hasDefault = prices.some(p => p.durationDays === defaultDuration);
                      setSelectedDuration(hasDefault ? defaultDuration : (prices[0]?.durationDays || null));
                      setIsRenew(false);
                      setShowPurchase(true);
                    }}
                    className={`mt-3 w-full px-4 py-2 text-white rounded-lg text-sm font-medium ${(catalogError || !selectedBooth || pricingErrors.has(pkg.id) || isDefaultBoothPlan(pkg.code) || (current?.packageCode === pkg.code && current?.pendingPackageCode !== pkg.code)) ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                  >
                    {!selectedBooth
                      ? 'Booth assignment required'
                      : isDefaultBoothPlan(pkg.code)
                      ? 'Included by default'
                      : current?.pendingPackageCode === pkg.code && current?.pendingSubscriptionId
                        ? 'Continue payment'
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b">Paid Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b">Actions</th>
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
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedHistoryDetail(item)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Subscription / Upgrade Modal */}
      <Modal isOpen={showPurchase} onClose={closeSubscriptionModal} title={isRenew ? "Renew Subscription" : "Subscribe to Plan"} size="md">
        <div className="space-y-4">
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

          {/* Payment summary breakdown */}
          {quoteLoading ? (
            <div className="rounded-xl p-4 flex items-center justify-center gap-2 bg-slate-50 border border-slate-200">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <span className="text-sm text-slate-500">Calculating payment summary...</span>
            </div>
          ) : quoteError ? (
            <div className="rounded-xl p-4 bg-red-50 border border-red-200">
              <p className="text-sm text-red-600 mb-2">{quoteError}</p>
              <button
                type="button"
                onClick={() => selectedPackage && void loadQuote(selectedPackage.id, selectedDuration)}
                className="text-xs font-semibold underline text-red-700"
              >
                Retry calculation
              </button>
            </div>
          ) : quoteData ? (
            <div className="rounded-xl p-4 bg-slate-50 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Payment summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Current plan</span>
                  <span className="font-medium text-slate-900">{quoteData.currentPackageName || 'Booth Basic'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Selected plan</span>
                  <span className="font-medium text-slate-900">{quoteData.targetPackageName} — {selectedDuration} days</span>
                </div>
                <div className="border-t border-slate-200 my-2" />
                <div className="flex justify-between">
                  <span className="text-slate-500">Selected plan price</span>
                  <span className="font-medium text-slate-900">{formatPrice(quoteData.baseAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Unused subscription credit</span>
                  <span className={`font-medium ${quoteData.creditAmount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {quoteData.creditAmount > 0 ? `-${formatPrice(quoteData.creditAmount)}` : '0 VND'}
                  </span>
                </div>
                <div className="border-t border-slate-200 my-2" />
                <div className="flex justify-between text-base font-bold">
                  <span className="text-slate-900">Amount payable via PayOS</span>
                  <span className="text-indigo-600">{formatPrice(quoteData.amountDue)}</span>
                </div>
                {quoteData.message && (
                  <p className="text-xs text-slate-500 mt-2 italic">{quoteData.message}</p>
                )}
              </div>
            </div>
          ) : null}

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
            <button
              onClick={handlePurchase}
              disabled={!selectedPackage || isDefaultBoothPlan(selectedPackage.code) || pricingErrors.has(selectedPackage.id) || policyLoading || !!policyError || !selectedPolicy || !policyAccepted || quoteLoading || !!quoteError || !quoteData || submitting}
              className={`px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium flex items-center ${(!selectedPackage || isDefaultBoothPlan(selectedPackage.code) || pricingErrors.has(selectedPackage.id) || policyLoading || !!policyError || !selectedPolicy || !policyAccepted || quoteLoading || !!quoteError || !quoteData || submitting) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : quoteLoading ? (
                'Calculating...'
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              {quoteData?.pendingAction === 'ResumeExistingPayment'
                ? 'Continue payment'
                : quoteData?.pendingAction === 'ScheduleDowngrade'
                ? 'Schedule downgrade'
                : quoteData?.activationMode === 'CreditCovered'
                ? 'Activate plan'
                : quoteData?.activationMode === 'Free'
                ? 'Activate free plan'
                : 'Continue to PayOS'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Price Refresh Confirmation Modal ─── */}
      {priceRefreshConfirmation && (
        <Modal isOpen={!!priceRefreshConfirmation} onClose={() => setPriceRefreshConfirmation(null)} title="Payment Total Refreshed" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Your payment total has been refreshed from {formatPrice(priceRefreshConfirmation.quoteAmount)} to {formatPrice(priceRefreshConfirmation.actualAmount)}.
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setPriceRefreshConfirmation(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.assign(priceRefreshConfirmation.checkoutUrl);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
              >
                Continue to PayOS
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── History Details Modal ─── */}
      {selectedHistoryDetail && (
        <Modal isOpen={!!selectedHistoryDetail} onClose={() => setSelectedHistoryDetail(null)} title="Subscription Details" size="md">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Selected plan</span>
              <span className="font-medium text-slate-900">{getBoothPlanName(selectedHistoryDetail.packageCode, selectedHistoryDetail.packageName)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Change</span>
              <span className="font-medium text-slate-900">
                {selectedHistoryDetail.changeType
                  ? (selectedHistoryDetail.previousPackageName
                      ? `${selectedHistoryDetail.changeType} from ${selectedHistoryDetail.previousPackageName}`
                      : selectedHistoryDetail.changeType)
                  : 'New purchase'}
              </span>
            </div>
            <div className="border-t border-slate-200 my-2" />
            <div className="flex justify-between">
              <span className="text-slate-500">Selected plan price</span>
              <span className="font-medium text-slate-900">{formatPrice(selectedHistoryDetail.baseAmount ?? selectedHistoryDetail.paidAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Credit applied</span>
              <span className={`font-medium ${(selectedHistoryDetail.creditAmount ?? 0) > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                {(selectedHistoryDetail.creditAmount ?? 0) > 0 ? `-${formatPrice(selectedHistoryDetail.creditAmount!)}` : '0 VND'}
              </span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-slate-900">Paid amount</span>
              <span className="text-indigo-600">{formatPrice(selectedHistoryDetail.paidAmount)}</span>
            </div>
            <div className="border-t border-slate-200 my-2" />
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <span className="font-medium text-slate-900">{selectedHistoryDetail.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Paid date</span>
              <span className="font-medium text-slate-900">{formatDateTime(selectedHistoryDetail.paidAt || selectedHistoryDetail.createdAt)}</span>
            </div>
            {selectedHistoryDetail.payOSOrderCode && (
              <div className="flex justify-between">
                <span className="text-slate-500">PayOS reference</span>
                <span className="font-medium text-slate-900">{selectedHistoryDetail.payOSOrderCode}</span>
              </div>
            )}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setSelectedHistoryDetail(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
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
