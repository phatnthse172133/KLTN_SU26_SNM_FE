"use client";

import { useState, useEffect, useCallback } from 'react';
import { adminModerationService } from '@/application/features/admin/adminModerationService';
import { adminBoothService, NightMarketOption } from '@/application/features/admin/adminBoothService';
import type { MarketModerationOverview, BoothModerationOverview, BoothModerationStatus, MarketModerationStatus } from '@/application/features/admin/adminModerationService';
import { getErrorMessage } from '@/shared/errors/errorMapper';
import { MarketModerationGrid } from './components/MarketModerationGrid';
import { BoothModerationTable } from './components/BoothModerationTable';
import { ModerationDetailModal } from './components/ModerationDetailModal';
import { SanctionModal } from './components/SanctionModal';

const BOOTH_PAGE_SIZE = 8;
const MARKET_PAGE_SIZE = 12;

interface ModerationManagementProps {
  targetType: 'Booth' | 'NightMarket';
}

export type ModerationItem = MarketModerationOverview | BoothModerationOverview;
export type ModerationTargetStatus = BoothModerationStatus | MarketModerationStatus;

export function ModerationManagement({ targetType }: ModerationManagementProps) {
  // Data State
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [lifecycleFilter, setLifecycleFilter] = useState('');
  const [nightMarketFilter, setNightMarketFilter] = useState('');
  const [nightMarketOptions, setNightMarketOptions] = useState<NightMarketOption[]>([]);

  // Modals
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [sanctionModalOpen, setSanctionModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    name: string;
    status: ModerationTargetStatus;
  } | null>(null);

  useEffect(() => {
    let ignore = false;
    adminBoothService.getNightMarketOptions().then(res => {
      if (!ignore && res.success && res.data) {
        setNightMarketOptions(res.data);
      }
    }).catch(() => {});
    return () => { ignore = true; };
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const [reloadKey, setReloadKey] = useState(0);
  const fetchData = useCallback(() => setReloadKey(k => k + 1), []);

  useEffect(() => {
    let ignore = false;
    const fetchIt = async () => {
      setIsLoading(true);
      setError('');
      try {
        if (targetType === 'NightMarket') {
          const res = await adminModerationService.getMarkets({
            page,
            pageSize: MARKET_PAGE_SIZE,
            keyword: debouncedSearch || undefined,
            moderationStatus: statusFilter || undefined,
            lifecycleStatus: lifecycleFilter || undefined
          });
          if (!ignore) {
            if (res.success) {
              const newTotal = res.data.total;
              const lastPage = Math.max(1, Math.ceil(newTotal / MARKET_PAGE_SIZE));
              if (page > lastPage) {
                setPage(lastPage);
                return;
              }
              setItems(res.data.items || []);
              setTotalItems(newTotal);
            } else {
              throw new Error('Market data is currently unavailable.');
            }
          }
        } else {
          const res = await adminModerationService.getBooths({
            page,
            pageSize: BOOTH_PAGE_SIZE,
            keyword: debouncedSearch || undefined,
            status: statusFilter || undefined,
            nightMarketId: nightMarketFilter || undefined
          });
          if (!ignore) {
            if (res.success) {
              const newTotal = res.data.total;
              const lastPage = Math.max(1, Math.ceil(newTotal / BOOTH_PAGE_SIZE));
              if (page > lastPage) {
                setPage(lastPage);
                return;
              }
              setItems(res.data.items || []);
              setTotalItems(newTotal);
            } else {
              throw new Error('Booth data is currently unavailable.');
            }
          }
        }
      } catch (err: unknown) {
        if (!ignore) setError(getErrorMessage(err));
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    // We intentionally ignore the ESLint warning since `fetchIt` sets state asynchronously
    // when it awaits the promise, avoiding synchronous cascading renders.
    void fetchIt();
    return () => { ignore = true; };
  }, [targetType, page, debouncedSearch, statusFilter, lifecycleFilter, nightMarketFilter, reloadKey]);

  const handleAction = async (req: { action: 'sanction' | 'restore'; reason: string }) => {
    if (!selectedItem) return;
    try {
      if (targetType === 'NightMarket') {
        const res = await adminModerationService.changeMarketModerationStatus(selectedItem.id, {
          status: req.action === 'sanction' ? 'Suspended' : 'Active',
          reason: req.reason
        });
        if (!res.success) throw new Error('The night market status could not be updated.');
      } else {
        const res = req.action === 'sanction'
          ? await adminModerationService.banBooth(selectedItem.id, { reason: req.reason })
          : await adminModerationService.restoreBooth(selectedItem.id, { reason: req.reason });
        if (!res.success) throw new Error('The booth status could not be updated.');
      }
      setSanctionModalOpen(false);
      setDetailModalOpen(false);
      fetchData(); // Refresh list
    } catch (err: unknown) {
      // Re-throw so SanctionModal can display the error
      throw err;
    }
  };

  const openDetail = useCallback((id: string, name: string, status: ModerationTargetStatus) => {
    setSelectedItem({ id, name, status });
    setDetailModalOpen(true);
  }, []);

  const openSanction = useCallback((id: string, name: string, status: ModerationTargetStatus) => {
    setSelectedItem({ id, name, status });
    setSanctionModalOpen(true);
  }, []);

  const onSanctionFromDetail = useCallback(() => {
    setDetailModalOpen(false);
    setSanctionModalOpen(true);
  }, []);

  const commonProps = {
    items,
    totalItems,
    isLoading,
    error,
    page,
    setPage,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    lifecycleFilter,
    setLifecycleFilter,
    nightMarketFilter,
    setNightMarketFilter,
    nightMarketOptions,
    fetchData,
    openDetail,
    openSanction
  };

  if (targetType === 'NightMarket') {
    return (
      <>
        <MarketModerationGrid {...commonProps} items={items as MarketModerationOverview[]} />
        {detailModalOpen && selectedItem && (
          <ModerationDetailModal
            isOpen={detailModalOpen}
            onClose={() => setDetailModalOpen(false)}
            targetId={selectedItem.id}
            targetType="Night Market"
            onActionClick={onSanctionFromDetail}
          />
        )}
        {sanctionModalOpen && selectedItem && (selectedItem.status === 'Active' || selectedItem.status === 'Suspended') && (
          <SanctionModal
            isOpen={sanctionModalOpen}
            onClose={() => setSanctionModalOpen(false)}
            targetId={selectedItem.id}
            targetName={selectedItem.name}
            targetType="Night Market"
            currentStatus={selectedItem.status}
            onSubmit={handleAction}
          />
        )}
      </>
    );
  }

  return (
    <>
      <BoothModerationTable {...commonProps} items={items as BoothModerationOverview[]} pageSize={BOOTH_PAGE_SIZE} />

      {detailModalOpen && selectedItem && (
        <ModerationDetailModal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          targetId={selectedItem.id}
          targetType="Booth"
          onActionClick={onSanctionFromDetail}
        />
      )}

      {sanctionModalOpen && selectedItem && (
        <SanctionModal
          isOpen={sanctionModalOpen}
          onClose={() => setSanctionModalOpen(false)}
          targetId={selectedItem.id}
          targetName={selectedItem.name}
          targetType="Booth"
          currentStatus={selectedItem.status}
          onSubmit={handleAction}
        />
      )}
    </>
  );
}
