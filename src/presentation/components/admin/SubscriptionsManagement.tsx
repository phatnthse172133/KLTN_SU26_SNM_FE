"use client";

import type { ElementType, MouseEvent } from 'react';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Check, Store, Crown, Zap, Package, TrendingUp, Plus, Edit2, Trash2, ChevronRight, Shield } from 'lucide-react';
import { packageService, PackageTemplate } from '@/application/features/packages/packageService';
import { priceService, PriceResponse } from '@/application/features/prices/priceService';
import type { SubscriptionPackage } from '@/shared/types';
import { Modal } from './components/Modal';
import { PackageDetailModal } from './components/PackageDetailModal';
import { PackagePolicyModal } from './components/PackagePolicyModal';
import { useToast } from '@/presentation/components/shared/ToastContext';
import { getErrorMessage } from '@/shared/errors/errorMapper';

const planIcons: Record<string, ElementType> = {
  MARKET_BASIC: Store,
  MARKET_PRO: Crown,
  BOOTH_FREE: Package,
  BOOTH_GROWTH: Zap,
  BOOTH_FEATURED: Crown
};

const planGradients: Record<string, { border: string; icon: string; price: string; check: string }> = {
  MARKET_BASIC: {
    border: 'linear-gradient(90deg, #3B82F6, #06B6D4)',
    icon: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
    price: 'linear-gradient(90deg, #3B82F6, #06B6D4)',
    check: '#3B82F6',
  },
  MARKET_PRO: {
    border: 'linear-gradient(90deg, #8B5CF6, #EC4899)',
    icon: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
    price: 'linear-gradient(90deg, #8B5CF6, #EC4899)',
    check: '#8B5CF6',
  },
  BOOTH_FREE: {
    border: 'linear-gradient(90deg, #10B981, #34D399)',
    icon: 'linear-gradient(135deg, #10B981, #34D399)',
    price: 'linear-gradient(90deg, #10B981, #34D399)',
    check: '#10B981',
  },
  BOOTH_GROWTH: {
    border: 'linear-gradient(90deg, #F59E0B, #FBBF24)',
    icon: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
    price: 'linear-gradient(90deg, #F59E0B, #FBBF24)',
    check: '#F59E0B',
  },
  BOOTH_FEATURED: {
    border: 'linear-gradient(90deg, #EF4444, #F87171)',
    icon: 'linear-gradient(135deg, #EF4444, #F87171)',
    price: 'linear-gradient(90deg, #EF4444, #F87171)',
    check: '#EF4444',
  },
  DEFAULT: {
    border: 'linear-gradient(90deg, #64748B, #94A3B8)',
    icon: 'linear-gradient(135deg, #64748B, #94A3B8)',
    price: 'linear-gradient(90deg, #64748B, #94A3B8)',
    check: '#64748B',
  }
};

function formatPrice(p: number) {
  return p.toLocaleString('en-US') + ' VND';
}

function getStatusPill(status: string) {
  switch (status) {
    case 'Active':
      return { background: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '12px', fontWeight: 500 };
    default:
      return { background: 'rgba(100,116,139,0.15)', color: '#64748B', border: '1px solid rgba(100,116,139,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '12px', fontWeight: 500 };
  }
}


export interface CreatePackagePayload {
  packageName: string;
  templateCode: string;
  price: number;
  durationDays: number;
  description: string;
  status: number;
  promotion?: {
    price: number;
    startDate: string | null;
    endDate: string | null;
  };
}

interface PackageWithPromo extends SubscriptionPackage {
  promo?: PriceResponse | null;
}

interface PlanForm {
  packageName: string;
  templateCode: string;
  price: string;
  durationDays: string;
  description: string;
  status: string;
  promoPrice: string;
  promoStartDate: string;
  promoEndDate: string;
}

const emptyPlanForm: PlanForm = {
  packageName: '',
  templateCode: '',
  price: '',
  durationDays: '30',
  description: '',
  status: 'Active',
  promoPrice: '',
  promoStartDate: '',
  promoEndDate: '',
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

export function SubscriptionsManagement() {
  const { showToast } = useToast();
  const [packages, setPackages] = useState<PackageWithPromo[]>([]);
  const [templates, setTemplates] = useState<PackageTemplate[]>([]);
  const [templateLoading, setTemplateLoading] = useState(true);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editPackage, setEditPackage] = useState<PackageWithPromo | null>(null);
  const [editForm, setEditForm] = useState<PlanForm>({ ...emptyPlanForm });

  const [showAddPlan, setShowAddPlan] = useState(false);
  const [addContext, setAddContext] = useState<number | null>(null); // 0 = Booth, 1 = Market
  const [planForm, setPlanForm] = useState<PlanForm>({ ...emptyPlanForm });

  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PackageWithPromo | null>(null);

  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [policyTarget, setPolicyTarget] = useState<PackageWithPromo | null>(null);

  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await packageService.getAll(1, 100);
      if (!response.success) {
        throw new Error("Failed to load packages");
      }
      const items = response.data.items;
      const withPromos = await Promise.all(
        items.map(async (pkg): Promise<PackageWithPromo> => {
          try {
            const promoRes = await priceService.getPackagePrices(pkg.id);
            const now = new Date();
            const activePromo = promoRes.success
              ? promoRes.data.items.find(p =>
                  p.price !== undefined &&
                  p.startDate && p.endDate &&
                  new Date(p.startDate) <= now &&
                  new Date(p.endDate) >= now
                )
              : null;
            return { ...pkg, promo: activePromo || null };
          } catch {
            return { ...pkg, promo: null };
          }
        })
      );
      setPackages(withPromos);
    } catch {
      setError("We couldn't load the packages. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    setTemplateLoading(true);
    setTemplateError(null);
    try {
      const res = await packageService.getTemplates();
      if (res.success && res.data) {
        setTemplates(res.data);
      } else {
        throw new Error('Failed to load templates');
      }
    } catch {
      setTemplateError("We couldn't load package templates. Please try again.");
    } finally {
      setTemplateLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(async () => {
      await Promise.all([
        fetchPackages(),
        fetchTemplates(),
      ]);
    });
  }, [fetchPackages, fetchTemplates]);

  const marketPackages = useMemo(() => {
    const pkgs = packages.filter(p => p.type === 1);
    const order = ['MARKET_BASIC', 'MARKET_PRO'];
    return pkgs.sort((a, b) => {
      const idxA = order.indexOf(a.code || '');
      const idxB = order.indexOf(b.code || '');
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
  }, [packages]);

  const boothPackages = useMemo(() => {
    const pkgs = packages.filter(p => p.type === 0);
    const order = ['BOOTH_FREE', 'BOOTH_GROWTH', 'BOOTH_FEATURED'];
    return pkgs.sort((a, b) => {
      const idxA = order.indexOf(a.code || '');
      const idxB = order.indexOf(b.code || '');
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
  }, [packages]);

  const openAddPlan = (type?: number) => {
    setAddContext(type ?? null);
    setPlanForm({ ...emptyPlanForm });
    setShowAddPlan(true);
  };

  const openEditPackage = (e: MouseEvent, pkg: PackageWithPromo) => {
    e.stopPropagation();
    setEditPackage(pkg);
    setEditForm({
      packageName: pkg.packageName,
      templateCode: pkg.code || '',
      price: pkg.price.toString(),
      durationDays: pkg.durationDays.toString(),
      description: pkg.description || '',
      status: pkg.status,
      promoPrice: pkg.promo?.price?.toString() || '',
      promoStartDate: pkg.promo?.startDate?.split('T')[0] || '',
      promoEndDate: pkg.promo?.endDate?.split('T')[0] || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editPackage) return;
    setSaving(true);
    try {
      const desc = editForm.description.trim();
      const updatePayload: Parameters<typeof packageService.update>[1] = {
        packageName: editForm.packageName.trim(),
        price: Number(editForm.price),
        durationDays: Number(editForm.durationDays),
        description: desc,
        status: editForm.status === 'Active' ? 0 : 1,
      };

      if (editForm.promoPrice && editForm.promoPrice.trim() !== '') {
        updatePayload.promotionAction = "Upsert";
        updatePayload.promotion = {
          id: editPackage.promo?.id,
          price: Number(editForm.promoPrice),
          startDate: editForm.promoStartDate ? new Date(`${editForm.promoStartDate}T00:00:00+07:00`).toISOString() : null,
          endDate: editForm.promoEndDate ? new Date(`${editForm.promoEndDate}T23:59:59.999+07:00`).toISOString() : null,
        };
      } else if (editPackage.promo) {
        updatePayload.promotionAction = "Remove";
        updatePayload.promotion = {
          id: editPackage.promo.id,
          price: 0
        };
      } else {
        updatePayload.promotionAction = "Keep";
      }

      await packageService.update(editPackage.id, updatePayload);

      showToast('success', 'The package has been updated successfully.');
      setEditPackage(null);
      await fetchPackages();
    } catch (error) {
      console.error('Failed to update package:', error);
      showToast('error', getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAdd = async () => {
    if (!planForm.packageName) {
      showToast('error', 'Package name is required.');
      return;
    }
    if (!planForm.price) {
      showToast('error', 'Base price is required.');
      return;
    }
    setSaving(true);
    try {
      const desc = planForm.description.trim();
      const createPayload: CreatePackagePayload = {
        packageName: planForm.packageName.trim(),
        templateCode: planForm.templateCode,
        price: Number(planForm.price),
        durationDays: Number(planForm.durationDays),
        description: desc,
        status: planForm.status === 'Active' ? 0 : 1,
      };

      if (planForm.promoPrice && planForm.promoPrice.trim() !== '') {
        createPayload.promotion = {
          price: Number(planForm.promoPrice),
          startDate: planForm.promoStartDate ? new Date(`${planForm.promoStartDate}T00:00:00+07:00`).toISOString() : null,
          endDate: planForm.promoEndDate ? new Date(`${planForm.promoEndDate}T23:59:59.999+07:00`).toISOString() : null,
        };
      }

      await packageService.create(createPayload);

      showToast('success', 'The package has been created successfully.');
      setShowAddPlan(false);
      setPlanForm({ ...emptyPlanForm });
      await fetchPackages();
    } catch (error) {
      console.error('Failed to create package:', error);
      showToast('error', getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePackage = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await packageService.delete(deleteTarget.id);
      showToast('success', 'The package has been deleted successfully.');
      setDeleteTarget(null);
      await fetchPackages();
    } catch (error) {
      console.error('Failed to delete package:', error);
      showToast('error', getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const renderPromoSection = (
    form: PlanForm,
    setForm: React.Dispatch<React.SetStateAction<PlanForm>>
  ) => (
    <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1rem', marginTop: '0.5rem' }}>
      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6366F1', margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <TrendingUp style={{ width: '1rem', height: '1rem' }} /> Optional Promotion
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#64748B', marginBottom: '0.25rem' }}>Discounted Price (VND)</label>
          <input
            type="number"
            placeholder="e.g. 1200000"
            value={form.promoPrice}
            onChange={e => setForm(f => ({ ...f, promoPrice: e.target.value }))}
            style={inputStyle}
          />
          <p style={{ margin: '0.375rem 0 0', color: '#64748B', fontSize: '0.75rem', lineHeight: 1.4 }}>
            Optional. The discounted price must be lower than the regular package price. Leave this field empty if the package has no promotion.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#64748B', marginBottom: '0.25rem' }}>Promotion Start Date</label>
            <input
              type="date"
              value={form.promoStartDate}
              onChange={e => setForm(f => ({ ...f, promoStartDate: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#64748B', marginBottom: '0.25rem' }}>Promotion End Date</label>
            <input
              type="date"
              value={form.promoEndDate}
              onChange={e => setForm(f => ({ ...f, promoEndDate: e.target.value }))}
              style={inputStyle}
            />
          </div>
        </div>
        <p style={{ margin: 0, color: '#64748B', fontSize: '0.75rem', lineHeight: 1.4 }}>
          The promotion applies to the package duration configured above. Both dates are required when a discounted price is entered.
        </p>
      </div>
    </div>
  );

  const renderCard = (pkg: PackageWithPromo) => {
    const Icon = planIcons[pkg.code || ''] ?? Package;
    const grad = planGradients[pkg.code || ''] ?? planGradients['DEFAULT'];
    const hasPromo = !!pkg.promo;

    return (
      <div
        key={pkg.id}
        onClick={() => setSelectedPackageId(pkg.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedPackageId(pkg.id); }}
        className="group bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all duration-200 flex flex-col relative cursor-pointer hover:shadow-lg hover:border-purple-400"
      >
        <div style={{ height: '4px', background: grad.border }} />

        {hasPromo && (
          <div className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md z-10">
            PROMOTION ACTIVE
          </div>
        )}

        <div className="p-5 flex-1 flex flex-col">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: grad.icon }}>
            <Icon className="w-5 h-5 text-white" />
          </div>

          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-gray-900 text-lg font-bold m-0">{pkg.packageName}</h3>
              <span className="text-xs font-medium text-gray-500 mt-1 inline-block">
                {pkg.code || 'NO_CODE'}
              </span>
            </div>
            <span style={getStatusPill(pkg.status)}>{pkg.status}</span>
          </div>

          <div className="flex flex-col mb-4">
            {hasPromo && pkg.promo?.price ? (
              <>
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(pkg.price)}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-red-500">
                    {formatPrice(pkg.promo.price)}
                  </span>
                  <span className="text-xs text-gray-500">/ {pkg.durationDays} days</span>
                </div>
                {pkg.promo.startDate && pkg.promo.endDate && (
                  <div className="text-[10px] text-amber-500 mt-1 font-medium">
                    Valid: {pkg.promo.startDate.split('T')[0]} to {pkg.promo.endDate.split('T')[0]}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold" style={{ background: grad.price, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {formatPrice(pkg.price)}
                </span>
                <span className="text-xs text-gray-500">/ {pkg.durationDays} days</span>
              </div>
            )}
          </div>

          <div className="text-xs text-gray-600 mb-4 flex-1">
            {pkg.status === 'Active' ? (
              <span className="font-medium">{pkg.features?.length || 0} included features</span>
            ) : (
              <span className="text-gray-400 italic">Currently unavailable for purchase</span>
            )}
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedPackageId(pkg.id); }}
              className="flex-1 py-1.5 px-3 bg-gray-50 border border-gray-200 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-100 flex items-center justify-center gap-1 transition-colors"
            >
              View Details <ChevronRight className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => openEditPackage(e, pkg)}
              className="py-1.5 px-3 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1 transition-colors"
              aria-label="Edit Package"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setPolicyTarget(pkg); }}
              className="py-1.5 px-3 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1 transition-colors"
              aria-label="Manage Policy"
            >
              <Shield className="w-3 h-3" /> Policy
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(pkg); }}
              className="py-1.5 px-2 bg-red-50 border border-red-100 rounded-md text-xs text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
              aria-label="Delete Package"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-gray-900 text-2xl font-bold m-0">Package Management</h2>
          <p className="text-gray-500 mt-1 text-sm">Configure and manage subscription packages for the platform.</p>
        </div>
        <button
          onClick={() => openAddPlan()}
          disabled={!!templateError || templateLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium border-none cursor-pointer flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Add New Plan
        </button>
      </div>

      {templateError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-center justify-between rounded-md">
          <p className="text-sm text-red-700">{templateError}</p>
          <button onClick={fetchTemplates} className="text-sm font-medium text-red-700 hover:text-red-600 underline">Retry</button>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchPackages} className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-md text-sm font-medium hover:bg-red-50">Retry</button>
        </div>
      )}

      {/* MARKET PACKAGES SECTION */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Market Packages</h3>
            <p className="text-sm text-gray-500">Plans for Market Owners to create and manage night markets.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-gray-100 animate-pulse rounded-2xl"></div>
            <div className="h-48 bg-gray-100 animate-pulse rounded-2xl"></div>
          </div>
        ) : marketPackages.length === 0 && !error ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
            <p className="text-gray-500 text-sm mb-4">No Market packages are available yet.</p>
            <button
              onClick={() => openAddPlan(1)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium text-sm rounded-md hover:bg-gray-50"
            >
              Create Market Package
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {marketPackages.map(renderCard)}
          </div>
        )}
      </section>

      {/* BOOTH PACKAGES SECTION */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Booth Packages</h3>
            <p className="text-sm text-gray-500">Plans for Booth Owners to operate and promote their booths.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="h-48 bg-gray-100 animate-pulse rounded-2xl"></div>
            <div className="h-48 bg-gray-100 animate-pulse rounded-2xl"></div>
            <div className="h-48 bg-gray-100 animate-pulse rounded-2xl"></div>
          </div>
        ) : boothPackages.length === 0 && !error ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
            <p className="text-gray-500 text-sm mb-4">No Booth packages are available yet.</p>
            <button
              onClick={() => openAddPlan(0)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium text-sm rounded-md hover:bg-gray-50"
            >
              Create Booth Package
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boothPackages.map(renderCard)}
          </div>
        )}
      </section>


      {/* Detail Modal */}
      <PackageDetailModal
        packageId={selectedPackageId!}
        isOpen={!!selectedPackageId}
        onClose={() => setSelectedPackageId(null)}
        onEdit={(pkg) => {
          // Re-find package in local state to pass promo correctly if needed
          const localPkg = packages.find(p => p.id === pkg.id);
          if (localPkg) {
            setEditPackage(localPkg);
            setEditForm({
              packageName: localPkg.packageName,
              templateCode: localPkg.code || '',
              price: localPkg.price.toString(),
              durationDays: localPkg.durationDays.toString(),
              description: localPkg.description || '',
              status: localPkg.status,
              promoPrice: localPkg.promo?.price?.toString() || '',
              promoStartDate: localPkg.promo?.startDate?.split('T')[0] || '',
              promoEndDate: localPkg.promo?.endDate?.split('T')[0] || '',
            });
          }
        }}
      />

      {/* Edit Package Modal */}
      <Modal isOpen={!!editPackage} onClose={() => setEditPackage(null)} title="Edit Subscription Package" size="md">
        {editPackage && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Package Name</label>
              <input
                value={editForm.packageName}
                onChange={e => setEditForm(prev => ({ ...prev, packageName: e.target.value }))}
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Template</label>
                <input
                  value={templates.find(t => t.code === editPackage.code)?.displayName ?? editPackage.code ?? 'N/A'}
                  disabled
                  style={{ ...inputStyle, background: '#F8FAFC', color: '#64748B', cursor: 'not-allowed' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Price (VND)</label>
                <input
                  type="number"
                  value={editForm.price}
                  onChange={e => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Duration (days)</label>
                <input
                  type="number"
                  value={editForm.durationDays}
                  onChange={e => setEditForm(prev => ({ ...prev, durationDays: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Description (short summary)</label>
              <textarea
                value={editForm.description}
                onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                style={{ ...inputStyle, resize: 'none' }}
              />
            </div>

            {(() => {
              const tmpl = templates.find(t => t.code === editPackage.code);
              if (!tmpl) return null;
              return (
                <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '0.5rem', padding: '0.75rem' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', margin: '0 0 0.5rem' }}>Package Features (from template)</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {tmpl.features.map((f, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div style={{ width: '1rem', height: '1rem', borderRadius: '9999px', background: '#3B82F622', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                          <Check style={{ width: '0.6rem', height: '0.6rem', color: '#3B82F6' }} />
                        </div>
                        <span style={{ fontSize: '0.8125rem', color: '#334155' }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}

            {renderPromoSection(editForm, setEditForm)}

            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                style={{ flex: 1, padding: '0.625rem 1rem', background: '#2563EB', color: 'white', borderRadius: '0.5rem', fontWeight: 500, border: 'none', cursor: 'pointer', fontSize: '0.875rem', opacity: saving ? 0.5 : 1 }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setEditPackage(null)}
                style={{ padding: '0.625rem 1rem', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '0.5rem', fontWeight: 500, color: '#111827', cursor: 'pointer', fontSize: '0.875rem' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add New Plan Modal */}
      <Modal isOpen={showAddPlan} onClose={() => setShowAddPlan(false)} title="Add New Subscription Plan" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Package Name <span style={{ color: '#F87171' }}>*</span></label>
            <input
              type="text"
              placeholder="e.g. Market Basic, Booth Growth..."
              value={planForm.packageName}
              onChange={e => setPlanForm(f => ({ ...f, packageName: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Template <span style={{ color: '#F87171' }}>*</span></label>
            <select
              value={planForm.templateCode}
              onChange={e => {
                const code = e.target.value;
                const tmpl = templates.find(t => t.code === code);
                setPlanForm(f => ({
                  ...f,
                  templateCode: code,
                  packageName: f.packageName || tmpl?.displayName || '',
                  price: tmpl?.isFree ? '0' : f.price,
                }));
              }}
              style={inputStyle}
            >
              <option value="">Select a template...</option>
              {templates
                .filter(t => addContext === null || t.packageType === addContext)
                .map(t => (
                <option key={t.code} value={t.code}>
                  {t.displayName} ({t.packageType === 1 ? 'Market' : 'Booth'}{t.isFree ? ' - Free' : ''})
                </option>
              ))}
            </select>
          </div>

          {planForm.templateCode && (() => {
            const tmpl = templates.find(t => t.code === planForm.templateCode);
            if (!tmpl) return null;
            return (
              <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '0.5rem', padding: '0.75rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', margin: '0 0 0.5rem' }}>Package Features</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {tmpl.features.map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div style={{ width: '1rem', height: '1rem', borderRadius: '9999px', background: '#3B82F622', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                        <Check style={{ width: '0.6rem', height: '0.6rem', color: '#3B82F6' }} />
                      </div>
                      <span style={{ fontSize: '0.8125rem', color: '#334155' }}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Price (VND) <span style={{ color: '#F87171' }}>*</span></label>
              <input
                type="number"
                placeholder="e.g. 1500000"
                value={planForm.price}
                onChange={e => setPlanForm(f => ({ ...f, price: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Duration (days) <span style={{ color: '#F87171' }}>*</span></label>
              <input
                type="number"
                value={planForm.durationDays}
                onChange={e => setPlanForm(f => ({ ...f, durationDays: e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Description (short summary)</label>
            <textarea
              rows={2}
              placeholder="Describe this plan's purpose..."
              value={planForm.description}
              onChange={e => setPlanForm(f => ({ ...f, description: e.target.value }))}
              style={{ ...inputStyle, resize: 'none' }}
            />
          </div>

          {renderPromoSection(planForm, setPlanForm)}

          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
            <button
              onClick={handleSaveAdd}
              disabled={!planForm.packageName || !planForm.price || !planForm.templateCode || saving}
              style={{ flex: 1, padding: '0.625rem 1rem', background: '#2563EB', color: 'white', borderRadius: '0.5rem', fontWeight: 500, border: 'none', cursor: 'pointer', fontSize: '0.875rem', opacity: (!planForm.packageName || !planForm.price || !planForm.templateCode || saving) ? 0.5 : 1 }}
            >
              {saving ? 'Creating...' : 'Create Plan'}
            </button>
            <button
              onClick={() => setShowAddPlan(false)}
              style={{ padding: '0.625rem 1rem', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '0.5rem', fontWeight: 500, color: '#111827', cursor: 'pointer', fontSize: '0.875rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Package" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: '#475569', fontSize: '0.875rem', lineHeight: 1.5 }}>
            Are you sure you want to delete <strong style={{ color: '#111827' }}>{deleteTarget?.packageName}</strong>?
            This package will no longer be available for purchase. Existing subscription history will not be affected.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleDeletePackage}
              disabled={saving}
              style={{ flex: 1, padding: '0.625rem 1rem', background: '#EF4444', color: 'white', borderRadius: '0.5rem', fontWeight: 500, border: 'none', cursor: 'pointer', fontSize: '0.875rem', opacity: saving ? 0.5 : 1 }}
            >
              {saving ? 'Deleting...' : 'Delete'}
            </button>
            <button
              onClick={() => setDeleteTarget(null)}
              style={{ padding: '0.625rem 1rem', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '0.5rem', fontWeight: 500, color: '#111827', cursor: 'pointer', fontSize: '0.875rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Policy Management Modal */}
      {policyTarget && (
        <PackagePolicyModal
          isOpen={!!policyTarget}
          onClose={() => setPolicyTarget(null)}
          packageId={policyTarget.id}
          packageName={policyTarget.packageName}
        />
      )}
    </div>
  );
}
