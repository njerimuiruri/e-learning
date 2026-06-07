'use client';

import { useEffect, useRef } from 'react';

// Country coordinates lookup (lat, lng, flag emoji)
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

export default function DemographicsMap({ countryData = [] }) {
  const mapRef      = useRef(null);
  const instanceRef = useRef(null);
  const markersRef  = useRef([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let L;
    try { L = require('leaflet'); } catch { return; }

    // Fix default icon paths for Next.js
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

      // CartoDB Voyager — English labels, clean modern style
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(instanceRef.current);
    }

    const map = instanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (!countryData.length) return;

    const total = countryData.reduce((s, c) => s + c.count, 0);
    const maxCount = Math.max(...countryData.map(c => c.count), 1);

    countryData.forEach(({ country, count }) => {
      const coords = getCoords(country);
      if (!coords) return;

      const pct   = Math.round((count / total) * 100);
      const size  = Math.max(28, Math.min(56, 28 + (count / maxCount) * 28));
      const color = count === maxCount ? '#6366f1' : count >= maxCount * 0.5 ? '#22c55e' : '#f59e0b';

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="
            width:${size}px;height:${size}px;
            background:${color};
            border:2.5px solid white;
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 2px 8px rgba(0,0,0,0.25);
            cursor:pointer;
            font-weight:700;
            font-size:${Math.max(9, size / 3.5)}px;
            color:white;
            line-height:1;
          ">${count}</div>`,
        iconSize:   [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([coords.lat, coords.lng], { icon })
        .bindPopup(`
          <div style="font-family:system-ui;min-width:140px">
            <div style="font-weight:700;font-size:13px;margin-bottom:4px">${coords.flag} ${country}</div>
            <div style="font-size:12px;color:#4b5563"><b>${count.toLocaleString()}</b> students</div>
            <div style="font-size:11px;color:#9ca3af">${pct}% of total</div>
          </div>`)
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Fit bounds if we have markers
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.3));
    }
  }, [countryData]);

  // Cleanup on unmount
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
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div
        ref={mapRef}
        className="w-full rounded-xl overflow-hidden border border-gray-200"
        style={{ height: 380 }}
      />
      {countryData.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 rounded-xl">
          <p className="text-xs text-gray-400 font-medium">No country data available yet</p>
        </div>
      )}
    </div>
  );
}
