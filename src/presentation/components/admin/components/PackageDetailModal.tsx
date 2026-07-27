import React, { useEffect, useState, useCallback } from 'react';
import { Modal } from './Modal';
import { packageService } from '@/application/features/packages/packageService';
import { priceService, PublicPackagePricingOption } from '@/application/features/prices/priceService';
import { SubscriptionPackage } from '@/shared/types';
import { Check, Package, Store, Crown, Zap } from 'lucide-react';
import { resolveMediaUrl } from '@/shared/utils';
import { ImageWithFallback } from '@/presentation/components/ImageWithFallback';

interface PackageDetailModalProps {
  packageId: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (pkg: SubscriptionPackage) => void;
}

const planIcons: Record<string, React.ElementType> = { 
  MARKET_BASIC: Store, 
  MARKET_PRO: Crown, 
  BOOTH_FREE: Package, 
  BOOTH_GROWTH: Zap, 
  BOOTH_FEATURED: Crown 
};

export function PackageDetailModal({ packageId, isOpen, onClose, onEdit }: PackageDetailModalProps) {
  const [packageLoading, setPackageLoading] = useState(false);
  const [packageError, setPackageError] = useState<string | null>(null);
  
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);
  
  const [pkg, setPkg] = useState<SubscriptionPackage | null>(null);
  const [prices, setPrices] = useState<PublicPackagePricingOption[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'pricing'>('overview');

  const fetchPackageData = useCallback(async (signal?: AbortSignal) => {
    if (!packageId) return;
    setPackageLoading(true);
    setPackageError(null);
    try {
      const pkgRes = await packageService.getById(packageId);
      if (signal?.aborted) return;
      if (pkgRes.success && pkgRes.data) {
        setPkg(pkgRes.data);
      } else {
        throw new Error('Failed to load package details');
      }
    } catch {
      if (signal?.aborted) return;
      setPackageError("We couldn't load the package details.");
    } finally {
      if (!signal?.aborted) {
        setPackageLoading(false);
      }
    }
  }, [packageId]);

  const fetchPricingData = useCallback(async (signal?: AbortSignal) => {
    if (!packageId) return;
    setPricingLoading(true);
    setPricingError(null);
    try {
      const pricesRes = await priceService.getPublicPackagePrices(packageId);
      if (signal?.aborted) return;
      if (pricesRes && typeof pricesRes === 'object' && 'success' in pricesRes && pricesRes.success) {
        setPrices(pricesRes.data || []);
      } else {
        throw new Error('Failed to load pricing');
      }
    } catch {
      if (signal?.aborted) return;
      setPricingError("We couldn't load package pricing.");
    } finally {
      if (!signal?.aborted) {
        setPricingLoading(false);
      }
    }
  }, [packageId]);

  useEffect(() => {
    const controller = new AbortController();
    
    if (isOpen && packageId) {
      void Promise.resolve().then(() => {
        setActiveTab('overview');
        void fetchPackageData(controller.signal);
        void fetchPricingData(controller.signal);
      });
    } else {
      void Promise.resolve().then(() => {
        setPkg(null);
        setPrices([]);
        setPackageError(null);
        setPricingError(null);
      });
    }
    
    return () => {
      controller.abort();
    };
  }, [isOpen, packageId, fetchPackageData, fetchPricingData]);

  const renderLimits = (entitlementsJson?: string | null, type?: number) => {
    if (!entitlementsJson) return <p className="text-sm text-gray-500">No limits specified.</p>;
    try {
      const parsed = JSON.parse(entitlementsJson);
      
      const renderBoolean = (val: boolean | undefined) => val ? 'Included' : 'Not included';
      const renderNumber = (val: number | null | undefined) => val === null ? 'Unlimited' : (val === undefined ? 'Not specified' : val);
      
      if (type === 1) { // Market
        return (
          <ul className="space-y-2 text-sm text-gray-700">
            {parsed.maxMarkets !== undefined && <li><strong>Markets:</strong> {renderNumber(parsed.maxMarkets)}</li>}
            {parsed.maxSlotsPerMarket !== undefined && <li><strong>Slots per market:</strong> {renderNumber(parsed.maxSlotsPerMarket)}</li>}
            {parsed.maxLayoutsPerMarket !== undefined && <li><strong>Layouts per market:</strong> {renderNumber(parsed.maxLayoutsPerMarket)}</li>}
            {parsed.zoneManagement !== undefined && <li><strong>Zone management:</strong> {renderBoolean(parsed.zoneManagement)}</li>}
            {parsed.advancedBoothApproval !== undefined && <li><strong>Advanced booth approval:</strong> {renderBoolean(parsed.advancedBoothApproval)}</li>}
            {parsed.advancedComplaint !== undefined && <li><strong>Advanced complaint:</strong> {renderBoolean(parsed.advancedComplaint)}</li>}
            {parsed.advancedReports !== undefined && <li><strong>Advanced reports:</strong> {renderBoolean(parsed.advancedReports)}</li>}
            {parsed.aiInsights !== undefined && <li><strong>AI insights:</strong> {renderBoolean(parsed.aiInsights)}</li>}
            {parsed.exportReports !== undefined && <li><strong>Export reports:</strong> {renderBoolean(parsed.exportReports)}</li>}
          </ul>
        );
      } else { // Booth
        return (
          <ul className="space-y-2 text-sm text-gray-700">
            {parsed.maxBooths !== undefined && <li><strong>Booths:</strong> {renderNumber(parsed.maxBooths)}</li>}
            <li><strong>Menu items:</strong> {parsed.maxMenuItems == null ? 'Unlimited' : parsed.maxMenuItems}</li>
            {parsed.promotion !== undefined && <li><strong>Promotions:</strong> {renderBoolean(parsed.promotion)}</li>}
            {parsed.advancedAnalytics !== undefined && <li><strong>Advanced analytics:</strong> {renderBoolean(parsed.advancedAnalytics)}</li>}
            {parsed.reviewReply !== undefined && <li><strong>Review replies:</strong> {renderBoolean(parsed.reviewReply)}</li>}
            {parsed.pauseBooth !== undefined && <li><strong>Pause booth:</strong> {renderBoolean(parsed.pauseBooth)}</li>}
            {parsed.recommendationPriority !== undefined && <li><strong>Recommendation weight:</strong> {parsed.recommendationPriority}x</li>}
            {parsed.featuredBooth !== undefined && <li><strong>Featured Booth:</strong> {renderBoolean(parsed.featuredBooth)}</li>}
            {parsed.featuredFood !== undefined && <li><strong>Featured food:</strong> {renderBoolean(parsed.featuredFood)}</li>}
          </ul>
        );
      }
    } catch {
      return <p className="text-sm text-gray-500">Error parsing limits.</p>;
    }
  };

  if (!isOpen) return null;

  const Icon = pkg ? (planIcons[pkg.code || ''] || Package) : Package;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Package Details" size="xl">
      <div className="flex flex-col h-full max-h-[75vh]">
        
        {packageLoading && (
          <div className="py-8 text-center text-gray-500 flex-1">Loading package details...</div>
        )}

        {packageError && !packageLoading && (
          <div className="bg-red-50 p-4 rounded-md border border-red-200 m-4 flex-1">
            <p className="text-red-700 text-sm mb-2">{packageError}</p>
            <div className="flex gap-4">
              <button onClick={() => fetchPackageData()} className="text-sm font-medium text-red-700 underline">Retry</button>
              <button onClick={onClose} className="text-sm font-medium text-gray-600 underline">Close</button>
            </div>
          </div>
        )}

        {!packageLoading && !packageError && pkg && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-center gap-4 shrink-0">
              {pkg.imageUrl ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  <ImageWithFallback src={resolveMediaUrl(pkg.imageUrl)} alt={pkg.packageName} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{pkg.packageName}</h2>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                  <span className="font-medium text-gray-700">{pkg.code || 'NO_CODE'}</span>
                  <span>&middot;</span>
                  <span>{pkg.type === 1 ? 'Market Package' : 'Booth Package'}</span>
                  <span>&middot;</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pkg.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {pkg.status}
                  </span>
                  <span>&middot;</span>
                  <span>{pkg.price.toLocaleString('en-US')} VND / {pkg.durationDays} days</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-6 border-b flex gap-6 shrink-0">
              <button
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'features' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('features')}
              >
                Features &amp; Limits
              </button>
              <button
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pricing' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('pricing')}
              >
                Pricing
              </button>
            </div>

            {/* Content Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
              {activeTab === 'overview' && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Package Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Description</p>
                      <p className="text-gray-900 font-medium">{pkg.description || 'Not applicable'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Package Type</p>
                      <p className="text-gray-900 font-medium">{pkg.type === 1 ? 'Market Package' : 'Booth Package'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Base Price</p>
                      <p className="text-gray-900 font-medium">{pkg.price.toLocaleString('en-US')} VND</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Base Duration</p>
                      <p className="text-gray-900 font-medium">{pkg.durationDays} days</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Created Date</p>
                      <p className="text-gray-900 font-medium">{new Date(pkg.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Last Updated Date</p>
                      <p className="text-gray-900 font-medium">{new Date(pkg.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'features' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Included Features</h3>
                    {pkg.features && pkg.features.length > 0 ? (
                      <ul className="space-y-3 text-sm text-gray-700">
                        {pkg.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="w-3 h-3 text-blue-600" />
                            </div>
                            <span className="leading-tight">{f}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No features specified.</p>
                    )}
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Package Limits</h3>
                    {renderLimits(pkg.entitlements, pkg.type)}
                  </div>
                </div>
              )}

              {activeTab === 'pricing' && (
                <div className="space-y-4">
                  {pricingLoading && <div className="text-sm text-gray-500 text-center py-4">Loading pricing options...</div>}
                  
                  {pricingError && !pricingLoading && (
                    <div className="bg-red-50 p-4 rounded-md border border-red-200 flex items-center justify-between">
                      <p className="text-red-700 text-sm">{pricingError}</p>
                      <button onClick={() => fetchPricingData()} className="px-3 py-1.5 bg-white border border-red-300 text-red-700 rounded text-sm font-medium hover:bg-red-50">
                        Retry
                      </button>
                    </div>
                  )}

                  {!pricingLoading && !pricingError && prices.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {prices.map((p, idx) => {
                        let cycleName = 'Custom';
                        if (p.durationDays === 30) cycleName = 'Monthly';
                        else if (p.durationDays === 365) cycleName = 'Yearly';
                        
                        return (
                          <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col relative overflow-hidden">
                            {p.hasPromotion && (
                              <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                                PROMOTION ACTIVE
                              </div>
                            )}
                            <h4 className="text-base font-bold text-gray-900 mb-1">{cycleName} &middot; {p.durationDays} days</h4>
                            
                            <div className="mt-3 flex flex-col gap-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Base price:</span>
                                <span className={p.hasPromotion ? 'line-through text-gray-400' : 'font-medium text-gray-900'}>
                                  {p.basePrice.toLocaleString('en-US')} VND
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Current price:</span>
                                <span className="font-bold text-gray-900 text-base text-blue-600">
                                  {p.effectivePrice.toLocaleString('en-US')} VND
                                </span>
                              </div>
                            </div>
                            
                            <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 flex-1 flex items-end">
                              {p.hasPromotion && p.promotionEndDate ? (
                                <span className="text-amber-600 font-medium">Promotion active until {new Date(p.promotionEndDate).toLocaleDateString()}</span>
                              ) : (
                                <span>No active promotion</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {!pricingLoading && !pricingError && prices.length === 0 && (
                    <div className="text-center py-8 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <p className="text-gray-500 text-sm">No pricing options available.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Sticky Footer */}
            <div className="px-6 py-4 border-t bg-white flex justify-end gap-3 shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded-md font-medium text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onClose();
                  onEdit(pkg);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium text-sm hover:bg-blue-700 transition-colors"
              >
                Edit Package
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
