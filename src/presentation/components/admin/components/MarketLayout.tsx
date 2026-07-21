"use client";
import { Store, X, Search, Sliders, Settings, PlusCircle, Footprints, Trash, Info, Check, HelpCircle } from 'lucide-react';
import { Booth } from '../data/marketData';
import { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';

interface MarketLayoutProps {
  market: any;
  booths: any[];
  onClose: () => void;
}

export function MarketLayout({ market, booths, onClose }: MarketLayoutProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedBooth, setSelectedBooth] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfiguring] = useState(true); // default to true to show full configurator experience
  const [configTab, setConfigTab] = useState<'map' | 'booths' | 'paths'>('booths');
  const [mapWidth, setMapWidth] = useState(market.mapWidth || 100);
  const [mapHeight, setMapHeight] = useState(market.mapHeight || 120);
  const [designMode, setDesignMode] = useState<'view' | 'move' | 'place' | 'path'>('move');
  const [toast, setToast] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(true);

  // Walkways state with coordinates
  const [walkways, setWalkways] = useState([
    { id: 1, name: 'Main entrance Walkway', x: 5, y: 32, w: 90, h: 6, isVertical: false },
    { id: 2, name: 'Central Food Lane Corridor', x: 5, y: 64, w: 90, h: 6, isVertical: false },
    { id: 3, name: 'Vertical Zone A-B Connector', x: 48, y: 5, w: 5, h: 90, isVertical: true }
  ]);

  // Local booths state for coordinate tracking
  const [localBooths, setLocalBooths] = useState<Booth[]>(() => [...booths]);

  // Generate initial coordinates dynamically for visual layout (0-100 percentage layout)
  const [boothCoords, setBoothCoords] = useState<Record<number, { x: number; y: number }>>(() => {
    const coords: Record<number, { x: number; y: number }> = {};
    booths.forEach((b, idx) => {
      const zone = b.zone || 'A';
      const slot = (b as any).slotNumber || (idx % 4 + 1);

      // Let's arrange them neatly into zone coordinates
      let baseX = 10;
      let baseY = 10;
      if (zone === 'A') {
        baseX = 12 + (slot % 3) * 12;
        baseY = 12 + Math.floor(slot / 3) * 10;
      } else if (zone === 'B') {
        baseX = 55 + (slot % 3) * 12;
        baseY = 12 + Math.floor(slot / 3) * 10;
      } else if (zone === 'C') {
        baseX = 12 + (slot % 5) * 15;
        baseY = 44 + Math.floor(slot / 5) * 9;
      } else if (zone === 'D') {
        baseX = 12 + (slot % 3) * 12;
        baseY = 76 + Math.floor(slot / 3) * 10;
      } else if (zone === 'E') {
        baseX = 55 + (slot % 3) * 12;
        baseY = 76 + Math.floor(slot / 3) * 10;
      }
      coords[b.id] = { x: baseX, y: baseY };
    });
    return coords;
  });

  // Dragging state
  const [draggingItem, setDraggingItem] = useState<{
    type: 'booth' | 'path';
    id: number;
    startX: number;
    startY: number;
    startCoordX: number;
    startCoordY: number;
  } | null>(null);

  // Walkways filter
  const activeWalkways = walkways;

  // Filtered booths
  const filteredBooths = useMemo(() => {
    if (!searchQuery.trim()) return localBooths;
    const query = searchQuery.toLowerCase();
    return localBooths.filter(booth =>
      booth.name.toLowerCase().includes(query) ||
      booth.category.toLowerCase().includes(query) ||
      (booth.owner && booth.owner.toLowerCase().includes(query)) ||
      booth.location.toLowerCase().includes(query)
    );
  }, [localBooths, searchQuery]);

  // Color schemes
  const getBoothStatusDot = (booth: Booth) => {
    if (booth.status === 'Active') return '#10B981';
    if (booth.status === 'Suspended') return '#EF4444';
    return '#F59E0B';
  };

  const getBoothPlanBorder = (booth: Booth) => {
    if (booth.plan === 'Featured') return 'rgba(251,146,60,0.8)';
    if (booth.plan === 'Premium') return 'rgba(192,132,252,0.8)';
    return 'rgba(96,165,250,0.8)';
  };

  const getBoothBgColor = (booth: Booth, isSelected: boolean, isSearchMatch: boolean) => {
    if (isSearchMatch) return 'rgba(99, 102, 241, 0.25)';
    if (isSelected) return 'rgba(99, 102, 241, 0.15)';
    return '#FFFFFF';
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent, type: 'booth' | 'path', id: number) => {
    if (designMode !== 'move') return;
    e.preventDefault();
    e.stopPropagation();
    const current = type === 'booth' ? boothCoords[id] : walkways.find(w => w.id === id);
    if (!current) return;

    setDraggingItem({
      type,
      id,
      startX: e.clientX,
      startY: e.clientY,
      startCoordX: current.x,
      startCoordY: current.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingItem || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();

    // Delta in pixels
    const deltaX = e.clientX - draggingItem.startX;
    const deltaY = e.clientY - draggingItem.startY;

    // Delta in percentages
    const pctDeltaX = (deltaX / rect.width) * 100;
    const pctDeltaY = (deltaY / rect.height) * 100;

    let newX = Math.round(draggingItem.startCoordX + pctDeltaX);
    let newY = Math.round(draggingItem.startCoordY + pctDeltaY);

    // Constraints
    newX = Math.max(0, Math.min(94, newX));
    newY = Math.max(0, Math.min(94, newY));

    if (draggingItem.type === 'booth') {
      setBoothCoords(prev => ({
        ...prev,
        [draggingItem.id]: { x: newX, y: newY }
      }));
    } else {
      setWalkways(prev => prev.map(w => w.id === draggingItem.id ? { ...w, x: newX, y: newY } : w));
    }
  };

  const handleMouseUp = () => {
    if (draggingItem) {
      setToast(`Updated ${draggingItem.type === 'booth' ? 'booth slot' : 'walking path'} layout position!`);
      setTimeout(() => setToast(null), 1500);
      setDraggingItem(null);
    }
  };

  // Canvas Click (Place Mode)
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const pctX = Math.round((clickX / rect.width) * 100);
    const pctY = Math.round((clickY / rect.height) * 100);

    if (designMode === 'place') {
      const nextId = Math.max(...localBooths.map(b => b.id), 0) + 1;
      const nextSlot = Math.max(...localBooths.map(b => (b as any).slotNumber || 0), 0) + 1;

      const newBoothSlot: any = {
        id: nextId,
        name: `Booth Slot #${nextSlot}`,
        boothCode: `B${nextSlot}`,
        marketId: market.id,
        ownerId: 0,
        status: 'Pending',
        registered: new Date().toISOString().split('T')[0],
        rentPrice: 4000000,
        location: `Zone A, Slot #${nextSlot}`,
        category: 'Mixed Retail',
        revenue: '0 VND',
        zone: 'A',
        slotNumber: nextSlot,
        plan: 'Basic',
        owner: 'Unassigned',
        phone: '-'
      };

      setLocalBooths(prev => [...prev, newBoothSlot]);
      setBoothCoords(prev => ({
        ...prev,
        [nextId]: { x: pctX, y: pctY }
      }));
      setSelectedBooth(newBoothSlot);
      setToast(`Placed new booth slot B${nextSlot} at coordinate (${pctX}%, ${pctY}%)`);
      setTimeout(() => setToast(null), 2500);
    } else if (designMode === 'path') {
      const nextId = Math.max(...walkways.map(w => w.id), 0) + 1;
      const newPath = {
        id: nextId,
        name: `Path Lane #${nextId}`,
        x: pctX,
        y: pctY,
        w: 30,
        h: 6,
        isVertical: false
      };
      setWalkways(prev => [...prev, newPath]);
      setToast(`Placed new walking path at coordinate (${pctX}%, ${pctY}%)`);
      setTimeout(() => setToast(null), 2500);
    }
  };

  const handleSaveConfig = () => {
    setToast("Market layout configuration saved successfully.");
    setTimeout(() => setToast(null), 3000);
  };

  const addWalkway = () => {
    const nextId = Math.max(...walkways.map(w => w.id), 0) + 1;
    setWalkways([...walkways, { id: nextId, name: `New Walking Path #${nextId}`, x: 30, y: 40, w: 40, h: 6, isVertical: false }]);
    setToast("Added new walking path overlay!");
    setTimeout(() => setToast(null), 2000);
  };

  const removeWalkway = (id: number) => {
    setWalkways(walkways.filter(w => w.id !== id));
    setToast("Removed walkway path");
    setTimeout(() => setToast(null), 2000);
  };

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div
        className="w-full max-w-7xl h-[92vh] overflow-hidden flex flex-col rounded-2xl"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
        }}
      >
        {/* Toast Alert */}
        {toast && (
          <div className="fixed top-5 right-5 z-[9999] bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 text-sm font-semibold">
            <Check className="w-4 h-4 text-emerald-400" />
            {toast}
          </div>
        )}

        {/* Header */}
        <div
          className="p-6 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: '1px solid #E5E7EB' }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: '#4F46E5', boxShadow: '0 4px 12px rgba(79,70,229,0.2)' }}
            >
              <Sliders className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 style={{ color: '#111827', fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>Interactive Layout & Map Configurator</h3>
              <p className="text-sm" style={{ color: '#64748B', margin: '2px 0 0' }}>{market.name} Â· Design Mode: {designMode.toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGuide(!showGuide)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid #C7D2FE',
                background: '#EEF2FF',
                color: '#4F46E5',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                transition: 'all 0.15s'
              }}
            >
              <HelpCircle className="w-4 h-4" />
              {showGuide ? 'Hide Instructions' : 'View Instructions'}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-all"
              style={{ background: '#F1F5F9', border: '1px solid #E5E7EB' }}
            >
              <X className="w-4 h-4" style={{ color: '#64748B' }} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">

          {/* Main Map Canvas Area */}
          <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#F8FAFC' }}>

            {/* Legend & Filter Bar */}
            <div
              className="px-6 py-4 flex-shrink-0 flex items-center justify-between gap-4 flex-wrap"
              style={{ borderBottom: '1px solid #E5E7EB', background: '#FFFFFF' }}
            >
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#64748B' }} />
                <input
                  type="text"
                  placeholder="Search booths by name, category, or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none"
                  style={{
                    background: '#F1F5F9',
                    border: '1px solid #E2E8F0',
                    color: '#1E293B',
                  }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4" style={{ color: '#64748B' }} />
                  </button>
                )}
              </div>

              {/* Status color definitions */}
              <div className="flex items-center gap-5 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10B981' }} />
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Active</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#F59E0B' }} />
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Pending</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#EF4444' }} />
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Suspended</span>
                </div>
                <div className="w-px h-4" style={{ background: '#CBD5E1' }} />
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ border: '2px solid rgba(96,165,250,0.8)' }} />
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Basic</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ border: '2px solid rgba(192,132,252,0.8)' }} />
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Premium</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ border: '2px solid rgba(251,146,60,0.8)' }} />
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Featured</span>
                </div>
              </div>
            </div>

            {/* Interactive Grid Canvas container */}
            <div
              className="flex-1 overflow-auto p-8 flex items-center justify-center"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="relative shadow-2xl border-4 border-slate-700 bg-white select-none transition-all duration-300"
                style={{
                  width: `${mapWidth * 8}px`,
                  height: `${mapHeight * 8}px`,
                  backgroundImage: `
                    linear-gradient(to right, #F1F5F9 1px, transparent 1px),
                    linear-gradient(to bottom, #F1F5F9 1px, transparent 1px)
                  `,
                  backgroundSize: '16px 16px', // 2 meters grid
                  borderRadius: '1rem',
                  cursor: designMode === 'place' ? 'cell' : designMode === 'path' ? 'crosshair' : 'default'
                }}
              >
                {/* Visual compass/labels on map */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/10 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded">
                  North Entrance Gate
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/10 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded">
                  South Exit Gate
                </div>

                {/* Render walkways as absolute corridors */}
                {activeWalkways.map((w) => (
                  <div
                    key={w.id}
                    onMouseDown={(e) => handleMouseDown(e, 'path', w.id)}
                    style={{
                      position: 'absolute',
                      left: `${w.x}%`,
                      top: `${w.y}%`,
                      width: `${w.w}%`,
                      height: `${w.h}%`,
                      background: 'repeating-linear-gradient(45deg, #F1F5F9, #F1F5F9 10px, #E2E8F0 10px, #E2E8F0 20px)',
                      border: designMode === 'move' ? '2px dashed #6366F1' : '1px dashed #94A3B8',
                      borderRadius: '0.375rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#475569',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: designMode === 'move' ? 'move' : 'default',
                      userSelect: 'none',
                      zIndex: 2,
                      opacity: 0.85,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
                    }}
                    title={w.name}
                  >
                    <Footprints className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                    <span className="truncate">{w.name} ({w.isVertical ? w.w : w.h}m)</span>
                  </div>
                ))}

                {/* Render booths absolute coordinates */}
                {filteredBooths.map((booth) => {
                  const coord = boothCoords[booth.id] || { x: 10, y: 10 };
                  const isSelected = selectedBooth?.id === booth.id;
                  const isSearchMatch = searchQuery ? booth.name.toLowerCase().includes(searchQuery.toLowerCase()) : false;

                  return (
                    <div
                      key={booth.id}
                      onMouseDown={(e) => handleMouseDown(e, 'booth', booth.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBooth(booth);
                      }}
                      className="absolute p-1.5 rounded-lg border flex flex-col justify-between transition-all"
                      style={{
                        left: `${coord.x}%`,
                        top: `${coord.y}%`,
                        width: '5.2rem',
                        height: '4.2rem',
                        background: getBoothBgColor(booth, isSelected, isSearchMatch),
                        borderColor: isSelected ? '#6366F1' : getBoothPlanBorder(booth),
                        borderWidth: isSelected ? '2px' : '1px',
                        boxShadow: isSelected
                          ? '0 10px 15px -3px rgba(99, 102, 241, 0.3), 0 4px 6px -4px rgba(99, 102, 241, 0.3)'
                          : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                        cursor: designMode === 'move' ? 'move' : 'pointer',
                        zIndex: isSelected ? 10 : 3
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-800 tracking-tight">{booth.boothCode}</span>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: getBoothStatusDot(booth) }} />
                      </div>
                      <div className="text-[9px] text-slate-500 font-medium truncate mt-0.5">{booth.name}</div>
                      <div className="text-[8px] text-slate-400 mt-auto truncate">{booth.category}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Booth Detail Footer bar */}
            {selectedBooth && (
              <div
                className="p-5 flex-shrink-0 flex items-start gap-4 border-t border-slate-200"
                style={{ background: '#FFFFFF' }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-50 border border-indigo-100 text-indigo-600 flex-shrink-0"
                >
                  <Store className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 style={{ color: '#1F2937', fontWeight: 700, fontSize: '1rem', margin: 0 }}>{selectedBooth.name} ({selectedBooth.boothCode})</h4>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '1px 8px',
                      borderRadius: '9999px',
                      background: selectedBooth.status === 'Active' ? '#ECFDF5' : '#FEF3C7',
                      color: selectedBooth.status === 'Active' ? '#10B981' : '#D97706'
                    }}>
                      {selectedBooth.status}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      Zone {selectedBooth.zone} Â· Slot #{selectedBooth.slotNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1" style={{ margin: 0 }}>
                    Category: <strong>{selectedBooth.category}</strong> Â· Owner: <strong>{selectedBooth.owner}</strong> Â· Phone: <strong>{selectedBooth.phone}</strong>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-xs font-medium text-slate-400">Position Coordinates</span>
                  <span className="text-sm font-bold text-slate-700 fontFamily-monospace bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                    X: {boothCoords[selectedBooth.id]?.x || 0}% Â· Y: {boothCoords[selectedBooth.id]?.y || 0}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Configuration Sidebar Panel */}
          {isConfiguring && (
            <div
              className="w-80 flex-shrink-0 flex flex-col border-l border-slate-200"
              style={{ background: '#FFFFFF' }}
            >
              {/* Step instructions overlay */}
              {showGuide && (
                <div style={{ padding: '1rem', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Info style={{ width: '0.875rem', height: '0.875rem', color: '#4F46E5' }} /> Setup Guidelines
                    </span>
                    <button onClick={() => setShowGuide(false)} style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', fontSize: '11px' }}>Hide</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '11px', color: '#475569' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span className="w-4 h-4 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-[9px] flex-shrink-0">1</span>
                      <span>Go to <strong>Map Size</strong> to adjust length/width (meters). Canvas updates dynamically.</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span className="w-4 h-4 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-[9px] flex-shrink-0">2</span>
                      <span>Go to <strong>Booths</strong> tab, select <strong>Place Mode</strong>, and click anywhere on the canvas to place a slot.</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span className="w-4 h-4 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-[9px] flex-shrink-0">3</span>
                      <span>Use <strong>Move Mode</strong> to drag and drop booths or walkway corridors around to arrange layout.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex border-b border-slate-200" style={{ background: '#F8FAFC' }}>
                {([
                  { key: 'map', label: 'Map Size' },
                  { key: 'booths', label: 'Booths Layout' },
                  { key: 'paths', label: 'Walkways' }
                ] as const).map(t => (
                  <button
                    key={t.key}
                    onClick={() => setConfigTab(t.key)}
                    style={{
                      flex: 1,
                      padding: '0.75rem 0.5rem',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      border: 'none',
                      borderBottom: configTab === t.key ? '2px solid #4F46E5' : '2px solid transparent',
                      color: configTab === t.key ? '#4F46E5' : '#64748B',
                      background: 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">

                {/* Map Size Tab */}
                {configTab === 'map' && (
                  <div className="space-y-4">
                    <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '0.5rem', padding: '0.75rem' }}>
                      <div className="flex items-center gap-2 mb-1 text-blue-700">
                        <Settings className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Canvas Settings</span>
                      </div>
                      <p className="text-xs text-blue-600 leading-normal" style={{ margin: 0 }}>
                        Resize the night market boundaries. The visual editor grid will adjust scale automatically.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Market Width (meters)</label>
                      <input
                        type="number"
                        value={mapWidth}
                        onChange={e => setMapWidth(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Market Length/Height (meters)</label>
                      <input
                        type="number"
                        value={mapHeight}
                        onChange={e => setMapHeight(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>

                    <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', fontSize: '11px', color: '#64748B' }}>
                      âš¡ Grid cells are calculated as 2m x 2m blocks.
                    </div>

                    <button
                      onClick={handleSaveConfig}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all mt-4 border-none cursor-pointer"
                    >
                      Save Layout Dimensions
                    </button>
                  </div>
                )}

                {/* Booths Layout Tab */}
                {configTab === 'booths' && (
                  <div className="space-y-4">
                    <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '0.5rem', padding: '0.75rem' }}>
                      <div className="flex items-center gap-2 mb-1 text-emerald-700">
                        <Store className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Booth Configurator</span>
                      </div>
                      <p className="text-xs text-emerald-600 leading-normal" style={{ margin: 0 }}>
                        Configure coordinate nodes, relocate them, or click to add slots.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Interactive Tool Mode</label>
                      <div className="flex flex-col gap-1.5">
                        {[
                          { key: 'move', label: 'Move Mode (Drag & Drop)', desc: 'Drag booths to reposition' },
                          { key: 'place', label: 'Place Mode (Click to Add)', desc: 'Click on grid to insert booth' },
                          { key: 'view', label: 'View Mode (Inspect)', desc: 'Click to select and view info' }
                        ].map(m => (
                          <label
                            key={m.key}
                            className="flex items-start gap-2.5 p-2.5 border rounded-lg cursor-pointer transition-all"
                            style={{
                              borderColor: designMode === m.key ? '#C7D2FE' : '#E2E8F0',
                              background: designMode === m.key ? '#F5F3FF' : '#FFFFFF',
                            }}
                          >
                            <input
                              type="radio"
                              name="designMode"
                              checked={designMode === m.key}
                              onChange={() => setDesignMode(m.key as any)}
                              className="accent-indigo-600 mt-0.5"
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-700" style={{ margin: 0 }}>{m.label}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5" style={{ margin: 0 }}>{m.desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {designMode === 'place' && (
                      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '0.5rem', padding: '0.75rem', fontSize: '11px', color: '#B45309' }}>
                        ðŸ’¡ <strong>Place Mode Active:</strong> Hover over the map canvas and click on any grid intersection to place a new booth slot.
                      </div>
                    )}

                    {designMode === 'move' && (
                      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '0.5rem', padding: '0.75rem', fontSize: '11px', color: '#2563EB' }}>
                        ðŸ‘‰ <strong>Drag Mode Active:</strong> Click and hold any booth slot box, then move your mouse to drag it to a new location.
                      </div>
                    )}

                    <button
                      onClick={handleSaveConfig}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all border-none cursor-pointer"
                    >
                      Save Booth Coordinates
                    </button>
                  </div>
                )}

                {/* Walkways Tab */}
                {configTab === 'paths' && (
                  <div className="space-y-4">
                    <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '0.5rem', padding: '0.75rem' }}>
                      <div className="flex items-center gap-2 mb-1 text-rose-700">
                        <Footprints className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Walkways Corridor</span>
                      </div>
                      <p className="text-xs text-rose-600 leading-normal" style={{ margin: 0 }}>
                        Configure pathways, lane widths, and pedestrian passages.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Active Walkways ({walkways.length})</span>
                        <button
                          onClick={addWalkway}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#4F46E5',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                        >
                          <PlusCircle style={{ width: '0.875rem', height: '0.875rem' }} /> Add Path
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {walkways.map(w => (
                          <div key={w.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                            <div>
                              <p className="font-bold text-slate-700" style={{ margin: 0 }}>{w.name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5" style={{ margin: 0 }}>
                                Pos: ({w.x}%, {w.y}%) Â· Size: {w.isVertical ? `${w.w}m wide` : `${w.h}m tall`}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  // toggle orientation
                                  setWalkways(prev => prev.map(p => p.id === w.id ? {
                                    ...p,
                                    isVertical: !p.isVertical,
                                    w: p.isVertical ? 40 : 6,
                                    h: p.isVertical ? 6 : 40
                                  } : p));
                                }}
                                title="Rotate corridor direction"
                                style={{ border: '1px solid #E2E8F0', padding: '2px 4px', borderRadius: '4px', background: '#FFFFFF', cursor: 'pointer', fontSize: '9px', fontWeight: 600, color: '#64748B' }}
                              >
                                Rotate
                              </button>
                              <button
                                onClick={() => removeWalkway(w.id)}
                                className="p-1 hover:bg-rose-100 rounded text-rose-500 border-none bg-transparent cursor-pointer"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleSaveConfig}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all border-none cursor-pointer"
                    >
                      Save Pathway Geometry
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
