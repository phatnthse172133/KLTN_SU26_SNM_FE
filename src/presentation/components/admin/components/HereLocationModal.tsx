"use client";

import { useEffect, useRef, useState } from 'react';
import { X, AlertCircle, MapPin } from 'lucide-react';
import { getHereMapsApiKey, loadHereMaps } from '@/infrastructure/maps/hereMapsLoader';
import { getErrorMessage } from '@/shared/errors/errorMapper';

interface HereLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
  targetName: string;
  address: string;
}

export function HereLocationModal({ isOpen, onClose, latitude, longitude, targetName, address }: HereLocationModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mapInstance: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let behaviorInstance: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let uiInstance: any = null;
    let resizeObserver: ResizeObserver | null = null;
    const currentMapRef = mapRef.current;
    let disposed = false;

    const initMap = async () => {
      try {
        setIsLoading(true);
        setMapError(null);

        const apiKey = getHereMapsApiKey();
        if (!apiKey) {
          throw new Error('We couldn\'t load the map. Please try again.');
        }

        await loadHereMaps();

        if (disposed || !currentMapRef) return;
        if (!window.H) {
          throw new Error('HERE Maps SDK failed to load.');
        }

        const H = window.H;
        const platform = new H.service.Platform({ apikey: apiKey });
        const defaultLayers = platform.createDefaultLayers();

        // Ensure container is empty before appending new map
        currentMapRef.innerHTML = '';

        mapInstance = new H.Map(
          currentMapRef,
          defaultLayers.vector.normal.map,
          {
            center: { lat: latitude, lng: longitude },
            zoom: 15,
            pixelRatio: window.devicePixelRatio || 1
          }
        );

        // Resize observer to handle map resizing dynamically
        resizeObserver = new ResizeObserver(() => {
          if (mapInstance) {
            mapInstance.getViewPort().resize();
          }
        });
        resizeObserver.observe(currentMapRef);

        // Add map events for interactivity (read-only: zoom, pan)
        const mapEvents = new H.mapevents.MapEvents(mapInstance);
        behaviorInstance = new H.mapevents.Behavior(mapEvents);

        // Basic UI components
        uiInstance = H.ui.UI.createDefault(mapInstance, defaultLayers);

        // Add a stationary marker
        const marker = new H.map.Marker({ lat: latitude, lng: longitude });
        mapInstance.addObject(marker);

        if (!disposed) setIsLoading(false);
      } catch (err: unknown) {
        if (!disposed) {
          setIsLoading(false);
          setMapError(getErrorMessage(err));
        }
      }
    };

    void initMap();

    return () => {
      disposed = true;
      if (uiInstance) {
        uiInstance.dispose?.();
      }
      if (behaviorInstance) {
        behaviorInstance.dispose();
      }
      if (mapInstance) {
        mapInstance.dispose();
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (currentMapRef) {
        currentMapRef.innerHTML = '';
      }
    };
  }, [isOpen, latitude, longitude, retryCount]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="here-location-title">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 id="here-location-title" className="text-lg font-bold text-slate-900">Night Market Location</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close map"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Details */}
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">{targetName}</p>
              <p className="text-sm text-slate-600 mt-0.5">{address}</p>
              <p className="text-xs font-mono text-slate-500 mt-2 bg-slate-200 inline-block px-2 py-0.5 rounded">
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </p>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative w-full h-[400px] bg-slate-100">
          {isLoading && !mapError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-medium text-slate-600">Loading map...</p>
            </div>
          )}

          {mapError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10 px-6 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
              <p className="text-sm font-medium text-slate-900 mb-1">Map failed to load</p>
              <p className="text-xs text-slate-500 mb-4 max-w-xs">{mapError}</p>
              <button
                type="button"
                onClick={() => setRetryCount(c => c + 1)}
                className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium text-sm rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          <div ref={mapRef} className="w-full h-full outline-none" />
        </div>

        {/* Footer */}
        <div className="p-4 flex items-center justify-between border-t border-slate-100 bg-white">
          <a
            href={`https://wego.here.com/?map=${latitude},${longitude},15,normal`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            Open in HERE WeGo
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
