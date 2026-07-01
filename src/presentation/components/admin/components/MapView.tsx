"use client";
import { MapPin, X, ArrowRight } from 'lucide-react';
import { Market } from '../data/marketData';
import { useState, useEffect } from 'react';

interface MapViewProps {
  markets: any[];
  selectedMarket?: any | null;
  onMarketSelect: (market: any) => void;
  onViewDetails?: (marketId: any) => void;
}

export function MapView({ markets, selectedMarket, onMarketSelect, onViewDetails }: MapViewProps) {
  const [hoveredMarket, setHoveredMarket] = useState<any | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 16.0, lng: 106.0 });
  const [mapZoom, setMapZoom] = useState(6);

  useEffect(() => {
    if (selectedMarket && selectedMarket.lat && selectedMarket.lng) {
      setMapCenter({ lat: selectedMarket.lat, lng: selectedMarket.lng });
      setMapZoom(12);
    } else {
      setMapCenter({ lat: 16.0, lng: 106.0 });
      setMapZoom(6);
    }
  }, [selectedMarket]);

  const allLats = markets.filter(m => m.lat).map(m => m.lat!);
  const allLngs = markets.filter(m => m.lng).map(m => m.lng!);
  const minLat = Math.min(...allLats);
  const maxLat = Math.max(...allLats);
  const minLng = Math.min(...allLngs);
  const maxLng = Math.max(...allLngs);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden" style={{ background: '#F9FAFB' }}>
      {/* Map Background */}
      <div className="absolute inset-0">
        <iframe
          key={`map-${mapCenter.lat}-${mapCenter.lng}-${mapZoom}`}
          width="100%"
          height="100%"
          style={{ border: 0, filter: 'brightness(0.7) saturate(0.8) conMast(1.1)' }}
          loading="lazy"
          src={`https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&center=${mapCenter.lat},${mapCenter.lng}&zoom=${mapZoom}`}
          className="w-full h-full"
        />
      </div>

      {/* Custom Markers Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full">
          {markets.filter(m => m.lat && m.lng).map((market) => {
            const x = ((market.lng! - minLng) / (maxLng - minLng)) * 100;
            const y = ((maxLat - market.lat!) / (maxLat - minLat)) * 100;
            const isSelected = selectedMarket?.id === market.id;
            const isHovered = hoveredMarket === market.id;

            return (
              <g key={market.id}>
                {isSelected && (
                  <circle
                    cx={`${x}%`} cy={`${y}%`} r="18"
                    fill="rgba(99,102,241,0.2)"
                    className="pointer-events-auto"
                  />
                )}
                <circle
                  cx={`${x}%`}
                  cy={`${y}%`}
                  r={isSelected ? "10" : isHovered ? "9" : "7"}
                  fill={isSelected ? '#2563EB' : '#EF4444'}
                  stroke={isSelected ? '#6B7280' : '#fff'}
                  strokeWidth="2"
                  opacity="0.9"
                  className="pointer-events-auto cursor-pointer transition-all"
                  style={{ filter: isSelected ? 'drop-shadow(0 0 6px rgba(17,24,39,0.4))' : 'drop-shadow(0 0 4px rgba(239,68,68,0.6))' }}
                  data-mouse-enter={() => setHoveredMarket(market.id)}
                  data-mouse-leave={() => setHoveredMarket(null)}
                  onClick={() => onMarketSelect(market)}
                />
                {(isSelected || isHovered) && (
                  <text
                    x={`${x}%`}
                    y={`${y - 2.5}%`}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#FFFFFF"
                    className="pointer-events-none"
                    style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)', fontWeight: 600 }}
                  >
                    {market.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Market List Sidebar */}
      <div
        className="absolute right-4 top-4 bottom-4 w-72 rounded-xl overflow-hidden flex flex-col pointer-events-auto"
        style={{
          background: '#111827',
          backdropFilter: 'blur(16px)',
          border: '1px solid #E5E7EB',
          boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
        }}
      >
        <div
          className="p-4"
          style={{
            background: '#F9FAFB',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          <h3 style={{ color: '#111827' }}>Night Market List</h3>
          <p className="text-xs mt-1" style={{ color: '#64748B' }}>{markets.length} night market{markets.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {markets.map((market) => (
            <div
              key={market.id}
              onClick={() => onMarketSelect(market)}
              data-mouse-enter={() => setHoveredMarket(market.id)}
              data-mouse-leave={() => setHoveredMarket(null)}
              className="p-3 cursor-pointer transition-all"
              style={{
                borderBottom: '1px solid #E5E7EB',
                borderLeft: selectedMarket?.id === market.id ? '2px solid #111827' : '2px solid transparent',
                background:
                  selectedMarket?.id === market.id
                    ? 'rgba(99,102,241,0.1)'
                    : hoveredMarket === market.id
                    ? '#FFFFFF'
                    : 'transparent',
              }}
            >
              <div className="flex items-start gap-3">
                {market.image && (
                  <img src={market.image} alt={market.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm Muncate" style={{ color: '#334155' }}>{market.name}</h4>
                  <div className="flex items-center gap-1 mt-0.5 text-xs" style={{ color: '#475569' }}>
                    <MapPin className="w-3 h-3" />
                    <span className="Muncate">{market.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(16,185,129,0.12)', color: '#34D399', border: '1px solid rgba(16,185,129,0.2)' }}
                    >
                      {market.activeBooth} active
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(20,184,166,0.12)', color: '#2DD4BF', border: '1px solid rgba(20,184,166,0.2)' }}
                    >
                      {market.occupancy}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Market Detail */}
      {selectedMarket && (
        <div
          className="absolute left-4 bottom-4 rounded-xl p-5 w-80 pointer-events-auto"
          style={{
            background: '#111827',
            backdropFilter: 'blur(16px)',
            border: '1px solid #E5E7EB',
            boxShadow: '0 16px 48px rgba(15,23,42,0.14), 0 0 0 1px rgba(99,102,241,0.1)',
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h3 style={{ color: '#111827' }}>{selectedMarket.name}</h3>
              <div className="flex items-center gap-2 text-sm mt-1" style={{ color: '#64748B' }}>
                <MapPin className="w-4 h-4" />
                <span className="Muncate">{selectedMarket.location}</span>
              </div>
            </div>
            <button
              onClick={() => onMarketSelect(selectedMarket)}
              className="p-1.5 rounded-lg transition-all ml-2"
              style={{ background: '#F1F5F9' }}
            >
              <X className="w-4 h-4" style={{ color: '#64748B' }} />
            </button>
          </div>

          {selectedMarket.image && (
            <img
              src={selectedMarket.image}
              alt={selectedMarket.name}
              className="w-full h-28 object-cover rounded-lg mb-4"
            />
          )}

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Total', value: selectedMarket.totalBooth, color: '#818CF8', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)' },
              { label: 'Active', value: selectedMarket.activeBooth, color: '#34D399', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
              { label: 'Occupied', value: `${selectedMarket.occupancy}%`, color: '#2DD4BF', bg: 'rgba(20,184,166,0.1)', border: 'rgba(20,184,166,0.2)' },
            ].map(({ label, value, color, bg, border }) => (
              <div key={label} className="p-3 rounded-lg" style={{ background: bg, border: `1px solid ${border}` }}>
                <p className="text-xs" style={{ color: '#64748B' }}>{label}</p>
                <p className="text-lg font-semibold" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => onViewDetails?.(selectedMarket.id)}
            className="w-full px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-all"
            style={{
              background: '#2563EB',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            View Market Details
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
