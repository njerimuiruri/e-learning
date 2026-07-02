'use client';

import { useEffect, useRef } from 'react';

export const STATUS_COLORS = {
  Published: '#22c55e',
  Implemented: '#6366f1',
  Approved: '#06b6d4',
  Draft: '#f59e0b',
};

function statusColor(status) {
  return STATUS_COLORS[status] || '#9ca3af';
}

// Two markers whose dots sit closer than this (px) are considered "crowded" 
// their permanent label is hidden and only shown on hover, so the map stays readable.
const CROWD_THRESHOLD_PX = 62;

export default function PolicyMap({ records = [], selectedId = null, onSelect = () => {} }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);
  const markersRef = useRef({});

  // Create the map once
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let L;
    try { L = require('leaflet'); } catch { return; }

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    if (!instanceRef.current && mapRef.current) {
      instanceRef.current = L.map(mapRef.current, {
        center: [5, 20],
        zoom: 3,
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(instanceRef.current);
    }

    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove();
        instanceRef.current = null;
      }
    };
  }, []);

  // Plot / refresh markers whenever records (or selection) change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let L;
    try { L = require('leaflet'); } catch { return; }

    const map = instanceRef.current;
    if (!map) return;

    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    const plottable = records.filter((r) => r.lat != null && r.lng != null);
    if (!plottable.length) return;

    const bounds = L.latLngBounds(plottable.map((r) => L.latLng(r.lat, r.lng)));
    map.fitBounds(bounds.pad(0.2), { animate: false });

    function buildIcon(r, showLabel) {
      const color = statusColor(r.policyStatus);
      const isSelected = r.id === selectedId;
      const dotSize = r.isRegional ? 22 : isSelected ? 20 : 16;
      const label = r.isRegional ? 'Africa (Pan-African)' : r.country;

      return L.divIcon({
        className: '',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
            <div class="policy-marker-dot" style="
              width:${dotSize}px;height:${dotSize}px;
              background:${color};
              border:${isSelected ? 3 : 2.5}px solid white;
              border-radius:50%;
              box-shadow:0 2px 6px rgba(0,0,0,0.35)${isSelected ? `, 0 0 0 3px ${color}` : ''};
              cursor:pointer;
            "></div>
            ${showLabel ? `
              <div style="
                font-size:11px;
                font-weight:600;
                color:#111827;
                background:rgba(255,255,255,0.96);
                padding:2px 7px;
                border-radius:999px;
                white-space:nowrap;
                line-height:1.4;
                box-shadow:0 1px 4px rgba(0,0,0,0.18);
                border:1px solid rgba(0,0,0,0.07);
                cursor:pointer;
              ">${label}</div>` : ''}
          </div>`,
        iconSize: null,
        iconAnchor: [dotSize / 2, dotSize / 2],
      });
    }

    function refreshLabels() {
      const pts = plottable.map((r) => ({
        id: r.id,
        pt: map.latLngToContainerPoint(L.latLng(r.lat, r.lng)),
      }));
      const crowded = new Set();
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].pt.x - pts[j].pt.x;
          const dy = pts[i].pt.y - pts[j].pt.y;
          if (Math.sqrt(dx * dx + dy * dy) < CROWD_THRESHOLD_PX) {
            crowded.add(pts[i].id);
            crowded.add(pts[j].id);
          }
        }
      }
      plottable.forEach((r) => {
        const marker = markersRef.current[r.id];
        if (marker) marker.setIcon(buildIcon(r, !crowded.has(r.id) || r.id === selectedId));
      });
    }

    plottable.forEach((r) => {
      const marker = L.marker([r.lat, r.lng], { icon: buildIcon(r, false) })
        .bindTooltip(
          r.isRegional ? 'Africa (Pan-African)' : `${r.country}  ${r.policyStatus}`,
          { direction: 'top', offset: [0, -10] }
        )
        .on('click', () => onSelect(r))
        .addTo(map);
      markersRef.current[r.id] = marker;
    });

    refreshLabels();
    map.on('zoomend', refreshLabels);

    return () => {
      map.off('zoomend', refreshLabels);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, selectedId]);

  // Pan to selected marker
  useEffect(() => {
    if (typeof window === 'undefined' || !selectedId) return;
    const map = instanceRef.current;
    const marker = markersRef.current[selectedId];
    if (map && marker) {
      map.panTo(marker.getLatLng());
    }
  }, [selectedId]);

  return (
    <div className="relative isolate">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <style>{`
        .policy-marker-dot { transition: transform 0.15s ease; }
        .policy-marker-dot:hover { transform: scale(1.35); }
        .leaflet-tooltip { font-size: 12px; font-weight: 600; }
      `}</style>
      <div
        ref={mapRef}
        className="w-full rounded-xl overflow-hidden border border-gray-200"
        style={{ height: 470 }}
      />
      <div className="absolute top-3 right-3 bg-white/95 rounded-lg shadow px-3 py-2 text-xs space-y-1 border border-gray-200 z-[1]">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="text-gray-700">{status}</span>
          </div>
        ))}
      </div>
      <p className="absolute bottom-3 left-3 bg-white/95 rounded-lg shadow px-3 py-1.5 text-[11px] text-gray-500 border border-gray-200 z-[1]">
        Zoom in on a cluster to reveal every country name
      </p>
    </div>
  );
}
