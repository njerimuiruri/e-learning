'use client';

import { useEffect, useRef } from 'react';

const COUNTRY_COORDS = {
  'Kenya':          { lat:  -1.292,  lng:  36.821, flag: '🇰🇪' },
  'Nigeria':        { lat:   9.082,  lng:   8.675, flag: '🇳🇬' },
  'Ghana':          { lat:   7.946,  lng:  -1.023, flag: '🇬🇭' },
  'South Africa':   { lat: -30.560,  lng:  22.938, flag: '🇿🇦' },
  'Uganda':         { lat:   1.374,  lng:  32.290, flag: '🇺🇬' },
  'Tanzania':       { lat:  -6.370,  lng:  34.889, flag: '🇹🇿' },
  'Rwanda':         { lat:  -1.940,  lng:  29.873, flag: '🇷🇼' },
  'Ethiopia':       { lat:   9.145,  lng:  40.489, flag: '🇪🇹' },
  'Zambia':         { lat: -13.134,  lng:  27.849, flag: '🇿🇲' },
  'Zimbabwe':       { lat: -19.015,  lng:  29.155, flag: '🇿🇼' },
  'Cameroon':       { lat:   3.848,  lng:  11.502, flag: '🇨🇲' },
  'Senegal':        { lat:  14.497,  lng: -14.452, flag: '🇸🇳' },
  'Côte d\'Ivoire': { lat:   7.540,  lng:  -5.547, flag: '🇨🇮' },
  'Egypt':          { lat:  26.820,  lng:  30.802, flag: '🇪🇬' },
  'Morocco':        { lat:  31.792,  lng:  -7.093, flag: '🇲🇦' },
  'Somalia':        { lat:   5.152,  lng:  46.200, flag: '🇸🇴' },
  'Sudan':          { lat:  12.862,  lng:  30.217, flag: '🇸🇩' },
  'Mozambique':     { lat: -18.665,  lng:  35.530, flag: '🇲🇿' },
  'Angola':         { lat: -11.202,  lng:  17.874, flag: '🇦🇴' },
  'Malawi':         { lat: -13.254,  lng:  34.302, flag: '🇲🇼' },
  'United States':  { lat:  37.090,  lng: -95.713, flag: '🇺🇸' },
  'United Kingdom': { lat:  55.378,  lng:  -3.436, flag: '🇬🇧' },
  'India':          { lat:  20.594,  lng:  78.963, flag: '🇮🇳' },
  'Germany':        { lat:  51.166,  lng:  10.452, flag: '🇩🇪' },
  'France':         { lat:  46.228,  lng:   2.214, flag: '🇫🇷' },
  'Canada':         { lat:  56.131,  lng: -106.347, flag: '🇨🇦' },
  'Australia':      { lat: -25.274,  lng: 133.775, flag: '🇦🇺' },
  'Brazil':         { lat: -14.235,  lng: -51.925, flag: '🇧🇷' },
  'China':          { lat:  35.862,  lng: 104.196, flag: '🇨🇳' },
  'Japan':          { lat:  36.205,  lng: 138.252, flag: '🇯🇵' },
};

const COUNTRY_SHORT = {
  'Kenya': 'KE', 'Nigeria': 'NG', 'Ghana': 'GH', 'South Africa': 'SA',
  'Uganda': 'UG', 'Tanzania': 'TZ', 'Rwanda': 'RW', 'Ethiopia': 'ET',
  'Zambia': 'ZM', 'Zimbabwe': 'ZW', 'Cameroon': 'CM', 'Senegal': 'SN',
  "Côte d'Ivoire": 'CI', 'Egypt': 'EG', 'Morocco': 'MA', 'Somalia': 'SO',
  'Sudan': 'SD', 'Mozambique': 'MZ', 'Angola': 'AO', 'Malawi': 'MW',
  'United States': 'US', 'United Kingdom': 'UK', 'India': 'IN',
  'Germany': 'DE', 'France': 'FR', 'Canada': 'CA', 'Australia': 'AU',
  'Brazil': 'BR', 'China': 'CN', 'Japan': 'JP',
};

function getCoords(countryName) {
  if (!countryName) return null;
  const direct = COUNTRY_COORDS[countryName];
  if (direct) return direct;
  const key = Object.keys(COUNTRY_COORDS).find(k =>
    k.toLowerCase() === countryName.toLowerCase() ||
    countryName.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(countryName.toLowerCase())
  );
  return key ? COUNTRY_COORDS[key] : null;
}

// Iterative force-directed collision avoidance in pixel space
function resolveOverlaps(L, map, positions) {
  const pts = positions.map(p => {
    const pixel = map.latLngToContainerPoint(L.latLng(p.lat, p.lng));
    return { ...p, px: pixel.x, py: pixel.y, origPx: pixel.x, origPy: pixel.y };
  });

  const PADDING = 16;
  for (let iter = 0; iter < 200; iter++) {
    let anyMoved = false;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[j].px - pts[i].px;
        const dy = pts[j].py - pts[i].py;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
        const minDist = (pts[i].size / 2) + (pts[j].size / 2) + PADDING;
        if (dist < minDist) {
          const push = (minDist - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          pts[i].px -= nx * push;
          pts[i].py -= ny * push;
          pts[j].px += nx * push;
          pts[j].py += ny * push;
          anyMoved = true;
        }
      }
    }
    if (!anyMoved) break;
  }

  return pts.map(p => {
    const latlng = map.containerPointToLatLng(L.point(p.px, p.py));
    return { ...p, resolvedLat: latlng.lat, resolvedLng: latlng.lng };
  });
}

export default function DemographicsMap({ countryData = [] }) {
  const mapRef      = useRef(null);
  const instanceRef = useRef(null);
  const markersRef  = useRef([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let L;
    try { L = require('leaflet'); } catch { return; }

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    if (!instanceRef.current && mapRef.current) {
      instanceRef.current = L.map(mapRef.current, {
        center: [5, 20],
        zoom: 3,
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(instanceRef.current);
    }

    const map = instanceRef.current;
    if (!map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (!countryData.length) return;

    const total    = countryData.reduce((s, c) => s + c.count, 0);
    const maxCount = Math.max(...countryData.map(c => c.count), 1);

    // Build position array with bubble sizes
    const positions = [];
    countryData.forEach(({ country, count }) => {
      const coords = getCoords(country);
      if (!coords) return;
      const size = Math.max(24, Math.min(46, 22 + (count / maxCount) * 24));
      positions.push({ country, count, lat: coords.lat, lng: coords.lng, flag: coords.flag, size });
    });

    if (!positions.length) return;

    // Fit map to original positions first so zoom is correct for pixel math
    const origBounds = L.latLngBounds(positions.map(p => L.latLng(p.lat, p.lng)));
    map.fitBounds(origBounds.pad(0.45));

    // Run collision avoidance at the current zoom
    const resolved = resolveOverlaps(L, map, positions);

    resolved.forEach(({ country, count, lat, lng, flag, size, resolvedLat, resolvedLng, px, py, origPx, origPy }) => {
      const pct       = Math.round((count / total) * 100);
      const color     = count === maxCount ? '#6366f1' : count >= maxCount * 0.5 ? '#22c55e' : '#f59e0b';
      const shortName = COUNTRY_SHORT[country] || country.slice(0, 2).toUpperCase();
      const fontSize  = Math.max(10, size / 3.2);

      // Draw a dashed connector if the bubble was displaced significantly
      const displacement = Math.sqrt((px - origPx) ** 2 + (py - origPy) ** 2);
      if (displacement > size * 0.4) {
        const line = L.polyline(
          [[lat, lng], [resolvedLat, resolvedLng]],
          { color, weight: 1.5, opacity: 0.45, dashArray: '4,4' }
        ).addTo(map);
        markersRef.current.push(line);

        // Small dot at the true country center
        const dot = L.circleMarker([lat, lng], {
          radius: 4, color: 'white', weight: 2, fillColor: color, fillOpacity: 1,
        }).addTo(map);
        markersRef.current.push(dot);
      }

      const totalWidth = size + 20;
      const icon = L.divIcon({
        className: '',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;gap:2px;width:${totalWidth}px;">
            <div style="
              width:${size}px;height:${size}px;
              background:${color};
              border:2.5px solid white;
              border-radius:50%;
              display:flex;align-items:center;justify-content:center;
              box-shadow:0 2px 10px rgba(0,0,0,0.28);
              cursor:pointer;
              font-weight:700;
              font-size:${fontSize}px;
              color:white;
              line-height:1;
            ">${count}</div>
            <div style="
              font-size:9px;
              font-weight:700;
              color:#111827;
              background:rgba(255,255,255,0.95);
              padding:1px 4px;
              border-radius:3px;
              white-space:nowrap;
              line-height:1.4;
              box-shadow:0 1px 3px rgba(0,0,0,0.18);
              border:1px solid rgba(0,0,0,0.07);
              letter-spacing:0.3px;
            ">${shortName}</div>
          </div>`,
        iconSize:   [totalWidth, size + 20],
        iconAnchor: [totalWidth / 2, size / 2],
      });

      const marker = L.marker([resolvedLat, resolvedLng], { icon })
        .bindPopup(`
          <div style="font-family:system-ui;min-width:150px">
            <div style="font-weight:700;font-size:13px;margin-bottom:4px">${flag} ${country}</div>
            <div style="font-size:12px;color:#4b5563"><b>${count.toLocaleString()}</b> students</div>
            <div style="font-size:11px;color:#9ca3af">${pct}% of total</div>
          </div>`)
        .addTo(map);

      markersRef.current.push(marker);
    });

  }, [countryData]);

  useEffect(() => {
    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove();
        instanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div
        ref={mapRef}
        className="w-full rounded-xl overflow-hidden border border-gray-200"
        style={{ height: 580 }}
      />
      {countryData.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 rounded-xl">
          <p className="text-xs text-gray-400 font-medium">No country data available yet</p>
        </div>
      )}
    </div>
  );
}
