'use client';

import { useEffect, useRef } from 'react';

/**
 * Leaflet map for picking an AOI bounding box.
 * Renders Africa by default; user clicks to set SW corner then NE corner.
 * Props:
 *   bbox: { west, south, east, north } | null
 *   onBboxChange: (bbox) => void
 */
export default function AOIMapPicker({ bbox, onBboxChange }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);
  const rectRef = useRef(null);
  const clickStateRef = useRef('first'); // 'first' | 'second'
  const firstPointRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let L;
    try { L = require('leaflet'); } catch { return; }

    // Fix default icon paths
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    if (instanceRef.current || !mapRef.current) return;

    const map = L.map(mapRef.current, {
      center: [5, 20],
      zoom: 3,
      minZoom: 2,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    instanceRef.current = map;

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;

      if (clickStateRef.current === 'first') {
        firstPointRef.current = { lat, lng };
        clickStateRef.current = 'second';
      } else {
        const p1 = firstPointRef.current;
        const south = Math.min(p1.lat, lat);
        const north = Math.max(p1.lat, lat);
        const west = Math.min(p1.lng, lng);
        const east = Math.max(p1.lng, lng);

        onBboxChange({ south, north, west, east });
        clickStateRef.current = 'first';
        firstPointRef.current = null;
      }
    });

    return () => {
      map.remove();
      instanceRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draw rectangle whenever bbox changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let L;
    try { L = require('leaflet'); } catch { return; }

    const map = instanceRef.current;
    if (!map) return;

    if (rectRef.current) {
      rectRef.current.remove();
      rectRef.current = null;
    }

    if (bbox && bbox.south != null && bbox.north != null) {
      const rect = L.rectangle(
        [[bbox.south, bbox.west], [bbox.north, bbox.east]],
        { color: '#16a34a', weight: 2, fillOpacity: 0.15 }
      ).addTo(map);
      rectRef.current = rect;
      map.fitBounds(rect.getBounds(), { padding: [40, 40] });
    }
  }, [bbox]);

  return (
    <div className="relative">
      <div
        ref={mapRef}
        style={{ height: 320, width: '100%', borderRadius: 8, border: '1px solid #e5e7eb' }}
      />
      <div className="absolute top-2 left-2 z-[1000] bg-white/90 text-xs text-gray-600 px-2 py-1 rounded shadow">
        Click twice to set bounding box corners
      </div>
    </div>
  );
}
