'use client';

import { useEffect, useRef } from 'react';

const CROWD_THRESHOLD_PX = 50;
const REGIONAL_CENTER = { lat: 2, lng: 20 };

// Aggregates raw records into one bubble per country (records missing lat/lng,
// or flagged isRegional, are grouped under a single "Regional / multi-country" bubble).
export function buildCountryGroups(records) {
  const map = new Map();
  records.forEach((r) => {
    const isRegional = r.isRegional || r.lat == null || r.lng == null;
    const key = isRegional ? '__regional__' : r.country;
    if (!map.has(key)) {
      map.set(key, {
        key,
        country: isRegional ? 'Regional / multi-country' : r.country,
        region: r.region,
        lat: isRegional ? REGIONAL_CENTER.lat : r.lat,
        lng: isRegional ? REGIONAL_CENTER.lng : r.lng,
        isRegional,
        records: [],
      });
    }
    map.get(key).records.push(r);
  });
  return [...map.values()];
}

export default function CountryBubbleMap({ groups = [], selectedKey = null, onSelect = () => {}, color = '#6366f1' }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);
  const markersRef = useRef({});

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let L;
    try { L = require('leaflet'); } catch { return; }

    const map = instanceRef.current;
    if (!map) return;

    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    if (!groups.length) return;

    const maxCount = Math.max(...groups.map((g) => g.records.length), 1);
    const bounds = L.latLngBounds(groups.map((g) => L.latLng(g.lat, g.lng)));
    map.fitBounds(bounds.pad(0.2), { animate: false });

    function buildIcon(g, showLabel) {
      const isSelected = g.key === selectedKey;
      const count = g.records.length;
      const size = Math.max(22, Math.min(40, 20 + (count / maxCount) * 20));
      const fontSize = Math.max(10, size / 3);

      return L.divIcon({
        className: '',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
            <div class="bubble-marker-dot" style="
              width:${size}px;height:${size}px;
              background:${color};
              border:${isSelected ? 3 : 2.5}px solid white;
              border-radius:50%;
              box-shadow:0 2px 6px rgba(0,0,0,0.35)${isSelected ? `, 0 0 0 3px ${color}` : ''};
              display:flex;align-items:center;justify-content:center;
              font-weight:700;color:white;font-size:${fontSize}px;line-height:1;
              cursor:pointer;
              ${g.isRegional ? 'border-style:dashed;' : ''}
            ">${count}</div>
            ${showLabel ? `
              <div style="
                font-size:11px;font-weight:600;color:#111827;
                background:rgba(255,255,255,0.96);padding:2px 7px;border-radius:999px;
                white-space:nowrap;line-height:1.4;box-shadow:0 1px 4px rgba(0,0,0,0.18);
                border:1px solid rgba(0,0,0,0.07);cursor:pointer;
              ">${g.country}</div>` : ''}
          </div>`,
        iconSize: null,
        iconAnchor: [size / 2, size / 2],
      });
    }

    function refreshLabels() {
      const pts = groups.map((g) => ({ key: g.key, pt: map.latLngToContainerPoint(L.latLng(g.lat, g.lng)) }));
      const crowded = new Set();
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].pt.x - pts[j].pt.x;
          const dy = pts[i].pt.y - pts[j].pt.y;
          if (Math.sqrt(dx * dx + dy * dy) < CROWD_THRESHOLD_PX) {
            crowded.add(pts[i].key);
            crowded.add(pts[j].key);
          }
        }
      }
      groups.forEach((g) => {
        const marker = markersRef.current[g.key];
        if (marker) marker.setIcon(buildIcon(g, !crowded.has(g.key) || g.key === selectedKey));
      });
    }

    groups.forEach((g) => {
      const marker = L.marker([g.lat, g.lng], { icon: buildIcon(g, false) })
        .bindTooltip(`${g.country}  ${g.records.length} ${g.records.length === 1 ? 'entry' : 'entries'}`, {
          direction: 'top',
          offset: [0, -10],
        })
        .on('click', () => onSelect(g))
        .addTo(map);
      markersRef.current[g.key] = marker;
    });

    refreshLabels();
    map.on('zoomend', refreshLabels);

    return () => {
      map.off('zoomend', refreshLabels);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, selectedKey, color]);

  useEffect(() => {
    if (typeof window === 'undefined' || !selectedKey) return;
    const map = instanceRef.current;
    const marker = markersRef.current[selectedKey];
    if (map && marker) map.panTo(marker.getLatLng());
  }, [selectedKey]);

  return (
    <div className="relative isolate">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossOrigin="" />
      <style>{`
        .bubble-marker-dot { transition: transform 0.15s ease; }
        .bubble-marker-dot:hover { transform: scale(1.25); }
        .leaflet-tooltip { font-size: 12px; font-weight: 600; }
      `}</style>
      <div ref={mapRef} className="w-full rounded-xl overflow-hidden border border-gray-200" style={{ height: 470 }} />
      <p className="absolute bottom-3 left-3 bg-white/95 rounded-lg shadow px-3 py-1.5 text-[11px] text-gray-500 border border-gray-200 z-[1]">
        Bubble size = number of entries · click a country to see the list
      </p>
    </div>
  );
}
