"use client";
import { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { MapPin } from 'lucide-react';

interface MapPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

export function MapPicker({ isOpen, onClose, onConfirm, initialLat = 10.7721, initialLng = 106.6980 }: MapPickerProps) {
  const [coords, setCoords] = useState({ lat: initialLat, lng: initialLng });
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Sync initial coords when map picker opens
  useEffect(() => {
    if (isOpen) {
      setCoords({ lat: initialLat, lng: initialLng });
    }
  }, [isOpen, initialLat, initialLng]);

  // Load Leaflet CDN dynamically
  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;

    const loadLeaflet = async () => {
      if ((window as any).L) {
        setIsLeafletLoaded(true);
        return;
      }

      // Append Leaflet CSS
      let link = document.querySelector('link[href*="leaflet"]');
      if (!link) {
        link = document.createElement('link');
        (link as any).rel = 'stylesheet';
        (link as any).href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Append Leaflet JS
      let script = document.querySelector('script[src*="leaflet"]');
      if (!script) {
        script = document.createElement('script');
        (script as any).src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        document.head.appendChild(script);

        (script as any).onload = () => {
          if (!isCancelled) setIsLeafletLoaded(true);
        };
      } else {
        // script exists but L might not be fully loaded/ready
        const checkL = setInterval(() => {
          if ((window as any).L) {
            clearInterval(checkL);
            if (!isCancelled) setIsLeafletLoaded(true);
          }
        }, 100);
      }
    };

    loadLeaflet();

    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  // Initialize/update Map
  useEffect(() => {
    if (!isOpen || !isLeafletLoaded || !mapContainerRef.current) return;

    const L = (window as any).L;

    // Reset previous instance if it exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    }

    // Initialize Map
    const map = L.map(mapContainerRef.current).setView([coords.lat, coords.lng], 13);
    mapInstanceRef.current = map;

    // Add Tile Layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Create marker
    const marker = L.marker([coords.lat, coords.lng], { draggable: true }).addTo(map);
    markerRef.current = marker;

    // Handle marker drag
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      setCoords({ lat: Number(position.lat.toFixed(6)), lng: Number(position.lng.toFixed(6)) });
    });

    // Handle map click
    map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setCoords({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) });
    });

    // Invalidate map size on render to fix grey tile issue
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isOpen, isLeafletLoaded]);

  const handleConfirm = () => {
    onConfirm(coords.lat, coords.lng);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Location on Map" size="md">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-500" style={{ margin: 0 }}>
          Click anywhere on the map or drag the red marker to select the exact night market location coordinates.
        </p>

        {/* Map wrapper */}
        <div 
          ref={mapContainerRef} 
          style={{ width: '100%', height: '350px', background: '#F1F5F9', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #E2E8F0', zIndex: 1 }}
        />

        {/* Coordinates Display */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#F8FAFC', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748B', display: 'block', fontWeight: 600 }}>LATITUDE</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1E293B', fontFamily: 'monospace' }}>{coords.lat}</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748B', display: 'block', fontWeight: 600 }}>LONGITUDE</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1E293B', fontFamily: 'monospace' }}>{coords.lng}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button 
            onClick={onClose} 
            style={{ flex: 1, padding: '0.625rem 1rem', background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#334155', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            style={{ flex: 1, padding: '0.625rem 1rem', background: '#4F46E5', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <MapPin style={{ width: '1rem', height: '1rem' }} /> Confirm Location
          </button>
        </div>
      </div>
    </Modal>
  );
}
