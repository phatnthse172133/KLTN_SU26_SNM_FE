"use client";
import {
  MapPin, Store, Plus, Search, LayoutGrid, Map, Tag,
  Clock, CalendarDays, Grid3x3, ArrowLeft, Edit, Globe, FileText, Trash, Upload
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { adminNightMarketService } from '@/application/features/admin/adminNightMarketService';
import { adminBoothService } from '@/application/features/admin/adminBoothService';
import type { Booth, NightMarket } from '@/shared/types';
import { Pagination } from './components/Pagination';
import { MapView } from './components/MapView';
import { MarketLayout } from './components/MarketLayout';
import { Modal } from './components/Modal';
import { MapPicker } from './components/MapPicker';
import { ConfirmDialog } from '@/presentation/components/shared/ConfirmDialog';
interface NightMarketsProps {
  initialMarketId?: string | null;
}

export function NightMarkets({ initialMarketId }: NightMarketsProps) {
  const [marketsList, setMarketsList] = useState<NightMarket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedMarket, setSelectedMarket] = useState<string | null>(initialMarketId || null);
  
  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editMarket, setEditMarket] = useState<NightMarket | null>(null);
  const [showLayoutMarket, setShowLayoutMarket] = useState<string | null>(null);
  
  const [mapSelectedMarket, setMapSelectedMarket] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [boothPage, setBoothPage] = useState(1);
  const [boothSearch, setBoothSearch] = useState('');
  const [boothStatusFilter, setBoothStatusFilter] = useState<'Active' | 'Inactive' | 'Banned'>('Active');
  
  const [selectedBoothDetail, setSelectedBoothDetail] = useState<Booth | null>(null);
  const [marketBooths, setMarketBooths] = useState<Booth[]>([]);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; label: string } | null>(null);
  const [hoveredBoothRow, setHoveredBoothRow] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [marketPendingDeletion, setMarketPendingDeletion] = useState<string | null>(null);
  const [deletingMarket, setDeletingMarket] = useState(false);

  const [, setLoading] = useState(false);
  const fetchMarkets = async () => {
    try {
      setLoading(true);
      const [marketRes, boothRes] = await Promise.all([
        adminNightMarketService.getNightMarkets(1, 1000),
        adminBoothService.getAllBooths(1, 1000),
      ]);
      if (marketRes.success) {
        setMarketsList(marketRes.data.items);
      }
      if (boothRes.success) {
        setMarketBooths(boothRes.data.items);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchMarkets(); }, []);

  const itemsPerPage = 8;
  const boothsPerPage = 10;

  // Form States for Create
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newCategory, setNewCategory] = useState('Street Food Market');
  const [newOpenHour, setNewOpenHour] = useState('18:00');
  const [newCloseHour, setNewCloseHour] = useState('24:00');
  const [newLat, setNewLat] = useState('10.7721');
  const [newLng, setNewLng] = useState('106.6980');
  const [newWidth, setNewWidth] = useState('100');
  const [newHeight, setNewHeight] = useState('120');
  const [newImages, setNewImages] = useState<string[]>([]);

  // Form States for Edit
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editOpenHour, setEditOpenHour] = useState('');
  const [editCloseHour, setEditCloseHour] = useState('');
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');
  const [editWidth, setEditWidth] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  // Status is managed via PATCH endpoint, not in edit form

  // Map Picker State
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [mapPickerTarget, setMapPickerTarget] = useState<'create' | 'edit' | null>(null);

  useEffect(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTop = 0;
  }, [selectedMarket]);

  useEffect(() => {
    if (editMarket) {
      setEditName(editMarket.name);
      setEditDesc(editMarket.description || '');
      setEditAddress(editMarket.address);
      setEditOpenHour(editMarket.openingHours || '18:00');
      setEditCloseHour(editMarket.closingHours || '24:00');
      setEditLat(String(editMarket.latitude || ''));
      setEditLng(String(editMarket.longitude || ''));
      setEditWidth(String(editMarket.mapWidth || ''));
      setEditHeight(String(editMarket.mapHeight || ''));
      setEditImages(editMarket.thumbnailUrl ? [editMarket.thumbnailUrl] : []);
      // Status is managed via PATCH endpoint, not in edit form
    }
  }, [editMarket]);

  const uniqueCategories = Array.from(new Set(marketsList.map(() => 'Night Market')));

  const filteredMarkets = marketsList.filter(m => {
    const q = searchQuery.toLowerCase();
    const matchSearch = m.name.toLowerCase().includes(q) || m.address.toLowerCase().includes(q);
    const matchCat = categoryFilter === 'all';
    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const totalPages = Math.ceil(filteredMarkets.length / itemsPerPage);
  const paginatedMarkets = filteredMarkets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const market = marketsList.find(m => m.id === selectedMarket);

  const filteredBooth = selectedMarket
    ? marketBooths.filter(b => {
        const matchMarket = b.nightMarketId === selectedMarket;
        const q = boothSearch.toLowerCase();
        const matchSearch = b.boothName.toLowerCase().includes(q) || (b.boothOwnerId || '').toLowerCase().includes(q);
        const matchStatus = b.status === boothStatusFilter;
        return matchMarket && matchSearch && matchStatus;
      })
    : [];

  const boothTotalPages = Math.ceil(filteredBooth.length / boothsPerPage);
  const paginatedBooth = filteredBooth.slice((boothPage - 1) * boothsPerPage, boothPage * boothsPerPage);

  const statusBadge = (status: string) => {
    if (status === 'Active') return { background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center' };
    if (status === 'Inactive') return { background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center' };
    return { background: 'rgba(100,116,139,0.15)', color: '#64748B', border: '1px solid rgba(100,116,139,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center' };
  };

  const boothStatusBadge = (status: string) => {
    if (status === 'Active') return { background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '11px', fontWeight: 600 };
    if (status === 'Banned') return { background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '11px', fontWeight: 600 };
    return { background: 'rgba(100,116,139,0.15)', color: '#64748B', border: '1px solid rgba(100,116,139,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '11px', fontWeight: 600 };
  };

  const inputStyle: React.CSSProperties = {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    color: '#111827',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  };

  const selectStyle: React.CSSProperties = {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    color: '#111827',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const cardStyle: React.CSSProperties = {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    boxShadow: '0 4px 32px rgba(15,23,42,0.06)',
    borderRadius: '1rem',
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

  const handleCreateMarket = async () => {
    try {
      await adminNightMarketService.createNightMarket({
        name: newName || 'New Night Market',
        description: newDesc || 'No description provided.',
        address: newAddress || 'Address, Ho Chi Minh City',
        latitude: Number(newLat) || 10.7721,
        longitude: Number(newLng) || 106.6980,
        boundaryWidthMeters: Number(newWidth) || 100,
        boundaryHeightMeters: Number(newHeight) || 120,
        openingHours: newOpenHour ? newOpenHour + ":00" : null,
        closingHours: newCloseHour ? newCloseHour + ":00" : null,
        thumbnailUrl: newImages[0] || null
      });
      setShowCreateDialog(false);
      fetchMarkets();
      // Reset Form
      setNewName(''); setNewDesc(''); setNewAddress(''); setNewOpenHour('18:00'); setNewCloseHour('24:00');
      setNewLat('10.7721'); setNewLng('106.6980'); setNewWidth('100'); setNewHeight('120'); setNewImages([]);
    } catch (e) { console.error(e); }
  };

  const handleEditMarket = async () => {
    if (!editMarket) return;
    try {
      await adminNightMarketService.updateNightMarket(editMarket.id, {
        name: editName,
        description: editDesc,
        address: editAddress,
        latitude: Number(editLat) || editMarket.latitude || 10.7721,
        longitude: Number(editLng) || editMarket.longitude || 106.6980,
        boundaryWidthMeters: Number(editWidth) || editMarket.mapWidth || 100,
        boundaryHeightMeters: Number(editHeight) || editMarket.mapHeight || 120,
        openingHours: editOpenHour ? editOpenHour + (editOpenHour.length === 5 ? ":00" : "") : null,
        closingHours: editCloseHour ? editCloseHour + (editCloseHour.length === 5 ? ":00" : "") : null,
        thumbnailUrl: editImages[0] || editMarket.thumbnailUrl || null
      });
      setEditMarket(null);
      fetchMarkets();
    } catch (e) { console.error(e); }
  };

  const handleDeleteMarket = async (id: string) => {
    setDeletingMarket(true);
    try {
      await adminNightMarketService.deleteNightMarket(id);
      if (selectedMarket === id) setSelectedMarket(null);
      setMarketPendingDeletion(null);
      await fetchMarkets();
    } catch(e) {
      console.error(e);
    } finally {
      setDeletingMarket(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827' }}>Night Market Management</h2>
          <p style={{ color: '#64748B', marginTop: '0.25rem', fontSize: '0.875rem' }}>
            {selectedMarket ? `Viewing booths in ${market?.name}` : 'Manage all night markets on the platform'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedMarket && (
            <button
              onClick={() => { setSelectedMarket(null); setBoothSearch(''); setBoothStatusFilter('Active'); }}
              style={{ padding: '0.5rem 1rem', background: '#FFFFFF', color: '#111827', borderRadius: '0.5rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #E2E8F0', cursor: 'pointer', fontSize: '0.875rem' }}
            >
              <ArrowLeft className="w-4 h-4" /> Back to Markets
            </button>
          )}
          <button
            onClick={() => setShowCreateDialog(true)}
            style={{ padding: '0.5rem 1rem', background: '#4F46E5', color: '#FFFFFF', borderRadius: '0.5rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            <Plus className="w-4 h-4" /> Add Night Market
          </button>
        </div>
      </div>

      {!selectedMarket ? (
        <>
          {/* Filters */}
          <div style={cardStyle} className="p-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#64748B' }} />
              <input
                type="text"
                placeholder="Search market name, address..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{ ...inputStyle, paddingLeft: '2.5rem' }}
              />
            </div>
            <div className="flex items-center gap-3">
              <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }} style={selectStyle}>
                <option value="all">All Categories</option>
                {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }} style={selectStyle}>
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                {(['grid', 'map'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className="p-1.5 rounded-md cursor-pointer transition-all border-none"
                    style={{
                      background: viewMode === mode ? '#FFFFFF' : 'transparent',
                      color: viewMode === mode ? '#4F46E5' : '#64748B',
                      boxShadow: viewMode === mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    {mode === 'grid' ? <LayoutGrid className="w-4 h-4" /> : <Map className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Map view */}
          {viewMode === 'map' && (
            <div style={{ height: '550px' }}>
              <MapView
                markets={filteredMarkets}
                selectedMarket={marketsList.find(m => m.id === mapSelectedMarket) || null}
                onMarketSelect={m => setMapSelectedMarket(mapSelectedMarket === m.id ? null : m.id)}
                onViewDetails={id => setSelectedMarket(id)}
              />
            </div>
          )}

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {paginatedMarkets.map(m => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMarket(m.id)}
                    onMouseEnter={() => setHoveredCard(m.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    className="transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    style={{
                      ...cardStyle,
                      boxShadow: hoveredCard === m.id ? '0 8px 32px rgba(15,23,42,0.12)' : '0 2px 12px rgba(15,23,42,0.04)',
                    }}
                  >
                    {m.thumbnailUrl && (
                      <div style={{ height: '11rem', overflow: 'hidden', position: 'relative' }}>
                        <img
                          src={m.thumbnailUrl}
                          alt={m.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: hoveredCard === m.id ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.3s' }}
                        />
                        {/* Gradient overlay */}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, rgba(15,23,42,0.8), transparent)' }} />
                        <div style={{ position: 'absolute', bottom: '0.75rem', left: '1rem', right: '1rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                          <div>
                            <h3 style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '1rem', lineHeight: 1.3, margin: 0 }}>{m.name}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#E2E8F0', fontSize: '11px', marginTop: '0.2rem' }}>
                              <MapPin style={{ width: '0.75rem', height: '0.75rem' }} />
                              <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.address}</span>
                            </div>
                          </div>
                          <span style={statusBadge(m.status)}>{m.status}</span>
                        </div>
                      </div>
                    )}
                    {!m.thumbnailUrl && (
                      <div style={{ padding: '1.25rem 1rem 0' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <div>
                            <h3 style={{ fontWeight: 600, color: '#111827', margin: 0 }}>{m.name}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#64748B', fontSize: '12px', marginTop: '0.25rem' }}>
                              <MapPin style={{ width: '0.75rem', height: '0.75rem' }} />
                              <span>{m.address}</span>
                            </div>
                          </div>
                          <span style={statusBadge(m.status)}>{m.status}</span>
                        </div>
                      </div>
                    )}
                    <div style={{ padding: '0.875rem 1rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#4F46E5', fontSize: '12px', marginBottom: '0.75rem' }}>
                        <Tag style={{ width: '0.75rem', height: '0.75rem' }} />
                        <span>{'Night Market'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#64748B', fontSize: '12px', paddingTop: '0.75rem', borderTop: '1px solid #E5E7EB' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock style={{ width: '0.75rem', height: '0.75rem' }} /> {m.openingHours} - {m.closingHours || '24:00'}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Store style={{ width: '0.75rem', height: '0.75rem' }} /> {m.totalBooth} Booths</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.875rem' }}>
                        <button
                          onClick={e => { e.stopPropagation(); setShowLayoutMarket(m.id); }}
                          style={{ flex: 1, padding: '0.4rem 0.75rem', border: '1px solid rgba(79,70,229,0.3)', color: '#4F46E5', background: 'rgba(79,70,229,0.06)', borderRadius: '0.5rem', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                        >
                          <Grid3x3 style={{ width: '0.875rem', height: '0.875rem' }} /> Floor Plan
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filteredMarkets.length} itemsPerPage={itemsPerPage} />
            </div>
          )}
        </>
      ) : (
        /* Market Detail – Booths */
        <div className="space-y-5">
          {/* Market Info Card */}
          {market && (
            <div style={{ ...cardStyle, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'stretch', flexWrap: 'wrap' }}>
                {market.thumbnailUrl && (
                  <div style={{ width: '12rem', minHeight: '12rem', flexShrink: 0, position: 'relative' }}>
                    <img src={market.thumbnailUrl} alt={market.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ flex: 1, padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0 }}>{market.name}</h3>
                      <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '0.25rem' }}>{market.description}</p>
                    </div>
                    <span style={statusBadge(market.status)}>{market.status}</span>
                  </div>
                  {/* Mini stat pills */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ background: '#F8FAFC', border: '1px solid rgba(79,70,229,0.15)', borderRadius: '0.5rem', padding: '0.35rem 0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Store style={{ width: '0.875rem', height: '0.875rem', color: '#4F46E5' }} />
                      <span style={{ fontSize: '12px', color: '#4F46E5', fontWeight: 600 }}>{market.totalBooth} Total Booths</span>
                    </div>
                    <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '0.5rem', padding: '0.35rem 0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Store style={{ width: '0.875rem', height: '0.875rem', color: '#10B981' }} />
                      <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 600 }}>{(market as any).activeBooth || 0} Active</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem 2rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#64748B' }}>
                      <MapPin style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
                      <span>{market.address}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#64748B' }}>
                      <Clock style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
                      <span>Opening Hours: {market.openingHours} - {market.closingHours || '24:00'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#64748B' }}>
                      <Tag style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
                      <span>{'Night Market'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#64748B' }}>
                      <CalendarDays style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
                      <span>Created: {(market as any).createdAt || 'No data available'} · Updated: {(market as any).updatedAt || 'No data available'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#64748B' }}>
                      <Globe style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
                      <span>Lat: {market.latitude}, Lng: {market.longitude}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#64748B' }}>
                      <Grid3x3 style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
                      <span>Map Size: {market.mapWidth}m x {market.mapHeight}m</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                      onClick={() => setShowLayoutMarket(market.id)}
                      style={{ padding: '0.5rem 1rem', border: '1px solid rgba(79,70,229,0.3)', color: '#4F46E5', background: 'rgba(79,70,229,0.06)', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Grid3x3 style={{ width: '1rem', height: '1rem' }} /> Floor Plan
                    </button>
                    <button
                      onClick={() => setEditMarket(market)}
                      style={{ padding: '0.5rem 1rem', border: 'none', color: '#111827', background: '#F1F5F9', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Edit style={{ width: '1rem', height: '1rem' }} /> Edit Market
                    </button>
                    <button
                      onClick={() => setMarketPendingDeletion(market.id)}
                      style={{ padding: '0.5rem 1rem', border: '1px solid #FEE2E2', color: '#EF4444', background: '#FEF2F2', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Trash style={{ width: '1rem', height: '1rem' }} /> Delete Market
                    </button>
                    <button
                      onClick={() => {
                        setSelectedMarket(null);
                        setViewMode('map');
                        setMapSelectedMarket(market.id);
                      }}
                      style={{ padding: '0.5rem 1rem', border: '1px solid rgba(79,70,229,0.3)', color: '#4F46E5', background: '#FFFFFF', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Map className="w-4 h-4" /> View on Map
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Booth List */}
          <div style={cardStyle}>
            <div style={{ padding: '1rem', borderBottom: '1px solid #E5E7EB' }}>
              <h4 style={{ fontWeight: 600, color: '#111827', marginBottom: '0.75rem', fontSize: '0.9375rem', margin: 0 }}>Booths in {market?.name}</h4>
              
              {/* Status Segmented Control Tabs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
                  {(['Active', 'Inactive', 'Banned'] as const).map(status => {
                    const count = marketBooths.filter(b => b.nightMarketId === selectedMarket && b.status === status).length;
                    const active = boothStatusFilter === status;
                    return (
                      <button
                        key={status}
                        onClick={() => { setBoothStatusFilter(status); setBoothPage(1); }}
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
                        {status}
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
                
                <div style={{ position: 'relative', width: '100%' }}>
                  <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: '#64748B' }} />
                  <input
                    type="text"
                    placeholder="Search booth name, owner..."
                    value={boothSearch}
                    onChange={e => { setBoothSearch(e.target.value); setBoothPage(1); }}
                    style={{ ...inputStyle, paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
                    <th style={theadThStyle}>Booth</th>
                    <th style={theadThStyle}>Owner</th>
                    <th style={theadThStyle}>Phone</th>
                    <th style={theadThStyle}>Zone / Slot</th>
                    <th style={theadThStyle}>Category</th>
                    <th style={theadThStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBooth.map(b => (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedBoothDetail(b)}
                      onMouseEnter={() => setHoveredBoothRow(String(b.id))}
                      onMouseLeave={() => setHoveredBoothRow(null)}
                      style={{ borderBottom: '1px solid #E5E7EB', background: hoveredBoothRow === String(b.id) ? '#F8FAFC' : 'transparent', transition: 'background 0.15s', cursor: 'pointer' }}
                    >
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ fontWeight: 500, color: '#111827', fontSize: '0.875rem' }}>{b.boothName || 'No data available'}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{b.boothOwnerId || 'No data available'}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#64748B' }}>{b.phoneNumber || 'No data available'}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#64748B' }}>{b.slotNumber || 'No data available'}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748B', background: 'rgba(100,116,139,0.12)', padding: '2px 8px', borderRadius: '4px' }}>No data available</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={boothStatusBadge(b.status)}>{b.status}</span>
                      </td>
                    </tr>
                  ))}
                  {paginatedBooth.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748B' }}>No data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination currentPage={boothPage} totalPages={boothTotalPages} onPageChange={setBoothPage} totalItems={filteredBooth.length} itemsPerPage={boothsPerPage} />
          </div>
        </div>
      )}

      {/* Create Market Dialog */}
      <Modal isOpen={showCreateDialog} onClose={() => setShowCreateDialog(false)} title="Add New Night Market" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.375rem' }}>Market Name</label>
            <input type="text" placeholder="e.g., Ben Thanh Night Market" value={newName} onChange={e => setNewName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.375rem' }}>Description</label>
            <textarea rows={2} placeholder="Brief description of the market" value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ ...inputStyle, resize: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.375rem' }}>Full Address</label>
            <input type="text" placeholder="e.g., 1 Le Loi St, District 1, Ho Chi Minh City" value={newAddress} onChange={e => setNewAddress(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.375rem' }}>Category</label>
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
                <option value="Street Food Market">Street Food Market</option>
                <option value="Seafood Market">Seafood Market</option>
                <option value="Mountain Specialty Market">Mountain Specialty Market</option>
                <option value="Traditional Food Market">Traditional Food Market</option>
                <option value="Mixed Night Market">Mixed Night Market</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.375rem' }}>Images (Max 5)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                {newImages.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '3.75rem', height: '3.75rem', borderRadius: '0.375rem', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                    <img src={img} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => setNewImages(prev => prev.filter((_, i) => i !== idx))}
                      style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(239,68,68,0.85)', color: 'white', border: 'none', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '9px', padding: 0 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                
                {newImages.length < 5 && (
                  <label style={{ width: '3.75rem', height: '3.75rem', borderRadius: '0.375rem', border: '1px dashed #CBD5E1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', cursor: 'pointer', color: '#94A3B8' }}>
                    <Upload style={{ width: '0.875rem', height: '0.875rem' }} />
                    <span style={{ fontSize: '9px', marginTop: '2px' }}>Add</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files) {
                          const filesArray = Array.from(e.target.files);
                          const newUrls = filesArray.map(file => URL.createObjectURL(file));
                          setNewImages(prev => [...prev, ...newUrls].slice(0, 5));
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.375rem' }}>Opening Time</label>
              <input type="text" placeholder="e.g., 18:00" value={newOpenHour} onChange={e => setNewOpenHour(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.375rem' }}>Closing Time</label>
              <input type="text" placeholder="e.g., 24:00" value={newCloseHour} onChange={e => setNewCloseHour(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Coordinates</span>
              <button
                type="button"
                onClick={() => {
                  setMapPickerTarget('create');
                  setIsMapPickerOpen(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  background: '#EEF2FF',
                  border: '1px solid #C7D2FE',
                  color: '#4F46E5',
                  padding: '3px 8px',
                  borderRadius: '0.375rem',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#E0E7FF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#EEF2FF';
                }}
              >
                <Map style={{ width: '0.75rem', height: '0.75rem' }} /> Select from Map
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#64748B', marginBottom: '0.25rem' }}>Latitude</label>
                <input type="number" step="any" placeholder="e.g., 10.7721" value={newLat} onChange={e => setNewLat(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#64748B', marginBottom: '0.25rem' }}>Longitude</label>
                <input type="number" step="any" placeholder="e.g., 106.6980" value={newLng} onChange={e => setNewLng(e.target.value)} style={inputStyle} />
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.375rem' }}>Map Width (meters)</label>
              <input type="number" placeholder="e.g., 100" value={newWidth} onChange={e => setNewWidth(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.375rem' }}>Map Height (meters)</label>
              <input type="number" placeholder="e.g., 120" value={newHeight} onChange={e => setNewHeight(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <button onClick={() => setShowCreateDialog(false)} style={{ flex: 1, padding: '0.5rem 1rem', background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#111827', borderRadius: '0.5rem', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleCreateMarket} style={{ flex: 1, padding: '0.5rem 1rem', background: '#4F46E5', color: 'white', borderRadius: '0.5rem', fontWeight: 500, border: 'none', cursor: 'pointer' }}>Create Market</button>
          </div>
        </div>
      </Modal>

      {/* Edit Market Dialog */}
      <Modal isOpen={!!editMarket} onClose={() => setEditMarket(null)} title="Edit Market" size="md">
        {editMarket && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.375rem' }}>Market Name</label>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.375rem' }}>Description</label>
              <textarea rows={2} value={editDesc} onChange={e => setEditDesc(e.target.value)} style={{ ...inputStyle, resize: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.375rem' }}>Full Address</label>
              <input type="text" value={editAddress} onChange={e => setEditAddress(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.375rem' }}>Category</label>
                <select value={editCategory} onChange={e => setEditCategory(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
                  <option value="Street Food Market">Street Food Market</option>
                  <option value="Seafood Market">Seafood Market</option>
                  <option value="Mountain Specialty Market">Mountain Specialty Market</option>
                  <option value="Traditional Food Market">Traditional Food Market</option>
                  <option value="Mixed Night Market">Mixed Night Market</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.375rem' }}>Images (Max 5)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  {editImages.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '3.75rem', height: '3.75rem', borderRadius: '0.375rem', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                      <img src={img} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => setEditImages(prev => prev.filter((_, i) => i !== idx))}
                        style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(239,68,68,0.85)', color: 'white', border: 'none', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '9px', padding: 0 }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  
                  {editImages.length < 5 && (
                    <label style={{ width: '3.75rem', height: '3.75rem', borderRadius: '0.375rem', border: '1px dashed #CBD5E1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', cursor: 'pointer', color: '#94A3B8' }}>
                      <Upload style={{ width: '0.875rem', height: '0.875rem' }} />
                      <span style={{ fontSize: '9px', marginTop: '2px' }}>Add</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files) {
                            const filesArray = Array.from(e.target.files);
                            const newUrls = filesArray.map(file => URL.createObjectURL(file));
                            setEditImages(prev => [...prev, ...newUrls].slice(0, 5));
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.375rem' }}>Opening Time</label>
                <input type="text" value={editOpenHour} onChange={e => setEditOpenHour(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.375rem' }}>Closing Time</label>
                <input type="text" value={editCloseHour} onChange={e => setEditCloseHour(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Coordinates</span>
                <button
                  type="button"
                  onClick={() => {
                    setMapPickerTarget('edit');
                    setIsMapPickerOpen(true);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    background: '#EEF2FF',
                    border: '1px solid #C7D2FE',
                    color: '#4F46E5',
                    padding: '3px 8px',
                    borderRadius: '0.375rem',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#E0E7FF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#EEF2FF';
                  }}
                >
                  <Map style={{ width: '0.75rem', height: '0.75rem' }} /> Select from Map
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#64748B', marginBottom: '0.25rem' }}>Latitude</label>
                  <input type="number" step="any" value={editLat} onChange={e => setEditLat(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#64748B', marginBottom: '0.25rem' }}>Longitude</label>
                  <input type="number" step="any" value={editLng} onChange={e => setEditLng(e.target.value)} style={inputStyle} />
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.375rem' }}>Map Width (meters)</label>
                <input type="number" value={editWidth} onChange={e => setEditWidth(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.375rem' }}>Map Height (meters)</label>
                <input type="number" value={editHeight} onChange={e => setEditHeight(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
              <button onClick={() => setEditMarket(null)} style={{ flex: 1, padding: '0.5rem 1rem', background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#111827', borderRadius: '0.5rem', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleEditMarket} style={{ flex: 1, padding: '0.5rem 1rem', background: '#4F46E5', color: 'white', borderRadius: '0.5rem', fontWeight: 500, border: 'none', cursor: 'pointer' }}>Save Changes</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Booth Detail Modal */}
      <Modal isOpen={!!selectedBoothDetail} onClose={() => setSelectedBoothDetail(null)} title="Booth Detail" size="lg">
        {selectedBoothDetail && (() => {
          const b = selectedBoothDetail as any;
          const sectionCard: React.CSSProperties = {
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '0.75rem',
            padding: '1rem',
          };
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Row 1: name + badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', margin: 0 }}>{b.boothName || 'No data available'}</h4>
                <span style={boothStatusBadge(b.status)}>{b.status}</span>
              </div>

              {/* 2-column info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={sectionCard}>
                  <p style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem', margin: 0 }}>Owner</p>
                  <p style={{ color: '#111827', fontWeight: 600, fontSize: '0.875rem', margin: '4px 0 0' }}>{b.boothOwnerId || 'No data available'}</p>
                  <p style={{ color: '#64748B', fontSize: '12px', marginTop: '0.2rem', margin: 0 }}>{b.phoneNumber || 'No data available'}</p>
                </div>
                <div style={sectionCard}>
                  <p style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem', margin: 0 }}>Market</p>
                  <p style={{ color: '#111827', fontWeight: 600, fontSize: '0.875rem', margin: '4px 0 0' }}>{market?.name || 'No data available'}</p>
                  <p style={{ color: '#64748B', fontSize: '12px', marginTop: '0.2rem', margin: 0 }}>{b.slotNumber || 'No data available'}</p>
                </div>
                <div style={sectionCard}>
                  <p style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem', margin: 0 }}>Category</p>
                  <p style={{ color: '#111827', fontWeight: 600, fontSize: '0.875rem', margin: '4px 0 0' }}>No data available</p>
                </div>
                <div style={sectionCard}>
                  <p style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem', margin: 0 }}>Registered</p>
                  <p style={{ color: '#111827', fontWeight: 600, fontSize: '0.875rem', margin: '4px 0 0' }}>No data available</p>
                </div>
              </div>

              {/* Description */}
              {b.description && (
                <div style={sectionCard}>
                  <p style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem', margin: 0 }}>Description</p>
                  <p style={{ color: '#111827', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>{b.description}</p>
                </div>
              )}

              {/* Documents */}
              {b.documents && (
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
                      { doc: b.documents.businessLicense, label: 'Business License', images: ['https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400'] },
                      { doc: b.documents.foodSafety, label: 'Food Safety Certificate', images: ['https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400', 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400'] },
                      { doc: b.documents.healthPermit, label: 'Health Permit', images: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400'] },
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

              {/* Images */}
              {b.images && b.images.length > 0 && (
                <div>
                  <p style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem', margin: 0 }}>Images</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    {b.images.map((img: string, idx: number) => (
                      <div key={idx} style={{ aspectRatio: '1', overflow: 'hidden', borderRadius: '0.5rem', background: '#FFFFFF' }}>
                        <img src={img} alt={`Booth image ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Menu Items */}
              {b.menu && b.menu.length > 0 && (
                <div>
                  <p style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem', margin: 0 }}>Menu Items</p>
                  <div style={{ ...sectionCard, padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
                          <th style={{ ...theadThStyle, padding: '0.625rem 1rem' }}>Name</th>
                          <th style={{ ...theadThStyle, padding: '0.625rem 1rem' }}>Category</th>
                          <th style={{ ...theadThStyle, padding: '0.625rem 1rem', textAlign: 'right' }}>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {b.menu.map((item: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                            <td style={{ padding: '0.5rem 1rem', color: '#111827', fontSize: '0.875rem' }}>{item.name}</td>
                            <td style={{ padding: '0.5rem 1rem', color: '#64748B', fontSize: '12px', textTransform: 'capitalize' }}>{item.category}</td>
                            <td style={{ padding: '0.5rem 1rem', color: '#111827', fontSize: '0.875rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                              {item.price.toLocaleString('en-US')} VND
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
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

      {/* Market Layout Modal */}
      {showLayoutMarket && (
        <MarketLayout
          market={marketsList.find(m => m.id === showLayoutMarket)!}
          booths={marketBooths.filter(b => b.nightMarketId === showLayoutMarket).map(b => ({
            id: b.id,
            name: b.boothName || 'No data available',
            owner: b.boothOwnerId || 'No data available',
            phone: b.phoneNumber || 'No data available',
            status: b.status,
            slotNumber: b.slotNumber || 'No data available',
            location: b.slotNumber || 'No data available',
            category: 'No data available',
            zone: 'No data available',
            plan: 'No data available',
            boothCode: b.boothCode || 'No data available',
            image: b.thumbnailUrl || '',
            description: b.description || '',
          }))}
          onClose={() => setShowLayoutMarket(null)}
        />
      )}

      {/* Map Picker Modal */}
      <MapPicker
        isOpen={isMapPickerOpen}
        onClose={() => {
          setIsMapPickerOpen(false);
          setMapPickerTarget(null);
        }}
        onConfirm={(lat, lng) => {
          if (mapPickerTarget === 'create') {
            setNewLat(String(lat));
            setNewLng(String(lng));
          } else if (mapPickerTarget === 'edit') {
            setEditLat(String(lat));
            setEditLng(String(lng));
          }
        }}
        initialLat={mapPickerTarget === 'edit' ? Number(editLat) || 10.7721 : Number(newLat) || 10.7721}
        initialLng={mapPickerTarget === 'edit' ? Number(editLng) || 106.6980 : Number(newLng) || 106.6980}
      />
      <ConfirmDialog
        open={marketPendingDeletion !== null}
        title="Delete night market?"
        message="This night market will no longer be available. Existing records will be retained for audit purposes."
        confirmLabel="Delete Market"
        confirmStyle="danger"
        loading={deletingMarket}
        onCancel={() => setMarketPendingDeletion(null)}
        onConfirm={() => {
          if (marketPendingDeletion) void handleDeleteMarket(marketPendingDeletion);
        }}
      />
    </div>
  );
}
