"use client";

import { useEffect, useRef, useState } from 'react';
import { X, AlertCircle, MapPin, Store, Navigation } from 'lucide-react';
import { getHereMapsApiKey, loadHereMaps } from '@/infrastructure/maps/hereMapsLoader';
import { boothService, BoothNavigationInfo } from '@/application/features/booth/boothService';
import { getErrorMessage } from '@/shared/errors/errorMapper';

interface BoothMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  boothId: string;
  boothName: string;
}

export function BoothMapModal({ isOpen, onClose, boothId, boothName }: BoothMapModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [navInfo, setNavInfo] = useState<BoothNavigationInfo | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    let ignore = false;
    void Promise.resolve().then(async () => {
      if (ignore) return;
      setIsLoading(true);
      setNavInfo(null);
      setMapError(null);
      try {
        const res = await boothService.getNavigationInfo(boothId);
        if (!ignore && res.success && res.data) {
          setNavInfo(res.data);
        } else if (!ignore) {
          setMapError('The booth location is currently unavailable.');
        }
      } catch (error: unknown) {
        if (!ignore) setMapError(getErrorMessage(error));
      }
    });
    return () => { ignore = true; };
  }, [isOpen, boothId, retryCount]);

  useEffect(() => {
    if (!isOpen || !navInfo) return;

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

        currentMapRef.innerHTML = '';

        const center = navInfo.boothCoordinate ?? navInfo.nightMarketCenter;
        if (!center) {
          throw new Error('No coordinates available for this booth or its night market.');
        }

        mapInstance = new H.Map(
          currentMapRef,
          defaultLayers.vector.normal.map,
          {
            center: { lat: center.latitude, lng: center.longitude },
            zoom: 16,
            pixelRatio: window.devicePixelRatio || 1
          }
        );

        resizeObserver = new ResizeObserver(() => {
          if (mapInstance) {
            mapInstance.getViewPort().resize();
          }
        });
        resizeObserver.observe(currentMapRef);

        const mapEvents = new H.mapevents.MapEvents(mapInstance);
        behaviorInstance = new H.mapevents.Behavior(mapEvents);
        uiInstance = H.ui.UI.createDefault(mapInstance, defaultLayers);

        if (navInfo.boothCoordinate) {
          const boothMarker = new H.map.Marker({ lat: navInfo.boothCoordinate.latitude, lng: navInfo.boothCoordinate.longitude });
          mapInstance.addObject(boothMarker);
        }

        if (navInfo.nightMarketCenter && (!navInfo.boothCoordinate ||
            navInfo.nightMarketCenter.latitude !== navInfo.boothCoordinate.latitude ||
            navInfo.nightMarketCenter.longitude !== navInfo.boothCoordinate.longitude)) {
          const marketMarker = new H.map.Marker(
            { lat: navInfo.nightMarketCenter.latitude, lng: navInfo.nightMarketCenter.longitude },
            { icon: new H.map.Icon('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>', { size: { w: 24, h: 24 } }) }
          );
          mapInstance.addObject(marketMarker);
        }

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
  }, [isOpen, navInfo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="booth-map-title">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">

        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 id="booth-map-title" className="text-lg font-bold text-slate-900">Booth Location</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close map"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <Store className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">{boothName}</p>
              {navInfo && (
                <>
                  <p className="text-sm text-slate-600 mt-0.5 flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5" />
                    {navInfo.nightMarketName}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{navInfo.nightMarketAddress}</p>
                  {navInfo.boothCoordinate && (
                    <p className="text-xs font-mono text-slate-500 mt-2 bg-slate-200 inline-block px-2 py-0.5 rounded">
                      {navInfo.boothCoordinate.latitude.toFixed(6)}, {navInfo.boothCoordinate.longitude.toFixed(6)}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

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
                onClick={() => { setMapError(null); setRetryCount(c => c + 1); }}
                className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium text-sm rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          <div ref={mapRef} className="w-full h-full outline-none" />
        </div>

        <div className="p-4 flex items-center justify-between border-t border-slate-100 bg-white">
          {navInfo?.boothCoordinate ? (
            <a
              href={`https://wego.here.com/?map=${navInfo.boothCoordinate.latitude},${navInfo.boothCoordinate.longitude},16,normal`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Open in HERE WeGo
            </a>
          ) : (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              No coordinates available
            </span>
          )}
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
