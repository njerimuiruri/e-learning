'use client';

import { useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell,
} from 'recharts';

// ---------------------------------------------------------------------------
// Risk colour palette  used consistently everywhere
// ---------------------------------------------------------------------------
const RISK_COLOR = {
  'Low Risk': '#16a34a',
  'Medium Risk': '#d97706',
  'High Risk': '#dc2626',
  Low: '#16a34a',
  Medium: '#d97706',
  High: '#dc2626',
};

// ---------------------------------------------------------------------------
// Risk summary  three big cards at the top
// ---------------------------------------------------------------------------
function RiskSummaryCards({ stats }) {
  const cards = [
    { label: 'Low Risk', key: 'low_risk_pct', color: 'bg-green-50 border-green-200 text-green-700', dot: 'bg-green-500' },
    { label: 'Medium Risk', key: 'medium_risk_pct', color: 'bg-amber-50 border-amber-200 text-amber-700', dot: 'bg-amber-500' },
    { label: 'High Risk', key: 'high_risk_pct', color: 'bg-red-50 border-red-200 text-red-700', dot: 'bg-red-500' },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {cards.map(({ label, key, color, dot }) => {
        const val = stats?.[key];
        return (
          <div key={key} className={`rounded-2xl border p-5 ${color}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
              <span className="text-sm font-semibold">{label}</span>
            </div>
            <p className="text-3xl font-bold">
              {val != null ? `${val.toFixed(1)}%` : ''}
            </p>
            <p className="text-xs mt-1 opacity-70">of the analysed area</p>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Key numbers grid
// ---------------------------------------------------------------------------
const READABLE = {
  total_area_ha: { label: 'Total area analysed', fmt: (v) => `${(v / 1000).toFixed(0)}k ha` },
  analysed_pixels: { label: 'Satellite pixels used', fmt: (v) => v.toLocaleString() },
  vci_mean: { label: 'Vegetation health (VCI)', fmt: (v) => `${v.toFixed(1)} / 100` },
  tci_mean: { label: 'Temperature stress (TCI)', fmt: (v) => `${v.toFixed(1)} / 100` },
  vhi_mean: { label: 'Overall vegetation health (VHI)', fmt: (v) => `${v.toFixed(1)} / 100` },
  n_hotspot_clusters: { label: 'Disease hotspot clusters', fmt: (v) => v.toLocaleString() },
  top_driver: { label: 'Biggest risk driver', fmt: (v) => String(v).replace(/_/g, ' ') },
  run_duration_s: { label: 'Analysis time', fmt: (v) => `${v.toFixed(1)} s` },
};

function KeyNumbers({ stats }) {
  const entries = Object.entries(READABLE)
    .filter(([k]) => stats?.[k] != null)
    .map(([k, meta]) => ({ label: meta.label, value: meta.fmt(stats[k]) }));

  if (!entries.length) return null;

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-800 mb-3">Key numbers</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {entries.map(({ label, value }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-sm font-bold text-gray-800">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Risk distribution bar chart
// ---------------------------------------------------------------------------
function RiskBarChart({ riskDist }) {
  if (!riskDist?.labels?.length) return null;

  const data = riskDist.labels.map((label, i) => ({
    name: label,
    value: riskDist.data[i],
    color: riskDist.colors?.[i] || '#6366f1',
    pixels: riskDist.pixel_count?.[i],
    area: riskDist.area_ha?.[i],
  }));

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-800 mb-1">Risk breakdown</h3>
      <p className="text-sm text-gray-500 mb-4">How much of the area falls into each risk category</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11 }} unit="%" axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(v, _n, entry) => [
              `${v.toFixed(1)}%  ${entry.payload.pixels?.toLocaleString() || ''} pixels  ${
                entry.payload.area ? `${(entry.payload.area / 1000).toFixed(0)}k ha` : ''
              }`,
              'Coverage',
            ]}
            contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #e5e7eb' }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={80}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Time series chart  NDVI and rainfall over time
// ---------------------------------------------------------------------------
function TrendChart({ timeSeries }) {
  if (!timeSeries?.labels?.length || !timeSeries?.datasets?.length) return null;

  const data = timeSeries.labels.map((month, i) => {
    const pt = { month };
    timeSeries.datasets.forEach((ds) => { pt[ds.label] = ds.data[i]; });
    return pt;
  });

  const tickFmt = (v, i) => (i % 6 === 0 ? v : '');

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-800 mb-1">Vegetation & rainfall trend</h3>
      <p className="text-sm text-gray-500 mb-4">Monthly vegetation health (NDVI) and rainfall over the selected period</p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={tickFmt} axisLine={false} tickLine={false} />
          <YAxis yAxisId="ndvi" domain={[0, 1]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'NDVI', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#9ca3af', dx: 10 }} />
          <YAxis yAxisId="rain" orientation="right" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Rain (mm)', angle: 90, position: 'insideRight', fontSize: 10, fill: '#9ca3af', dx: -10 }} />
          <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #e5e7eb' }} />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          {timeSeries.datasets.map((ds) => (
            <Line
              key={ds.label}
              yAxisId={ds.label.toLowerCase().includes('rain') ? 'rain' : 'ndvi'}
              type="monotone"
              dataKey={ds.label}
              stroke={ds.color || '#16a34a'}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SHAP  what drove the risk score
// ---------------------------------------------------------------------------
const FEATURE_NAMES = {
  // Food security
  ndvi_slope: 'Vegetation trend over time',
  vci: 'Vegetation health score',
  tci: 'Temperature stress score',
  rainfall_anom_pct: 'Rainfall compared to normal',
  mndwi: 'Water availability index',
  slope_terrain: 'Terrain slope',
  land_cover: 'Land use type',
  // Disease risk
  temp_mean: 'Average temperature',
  temp_max: 'Maximum temperature',
  humidity_mean: 'Average humidity',
  rainfall_total: 'Total rainfall',
  ndvi_mean: 'Average vegetation cover',
  urban_density: 'Urban density',
  water_bodies: 'Proximity to water bodies',
  elevation: 'Elevation',
};

function DriverChart({ shap }) {
  if (!shap?.features?.length) return null;

  const data = shap.features
    .map((f, i) => ({ name: FEATURE_NAMES[f] || f.replace(/_/g, ' '), value: shap.mean_abs_shap[i] }))
    .sort((a, b) => b.value - a.value);

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-800 mb-1">What's driving the risk</h3>
      <p className="text-sm text-gray-500 mb-4">The factors that contributed most to the food security risk score in this area</p>
      <ResponsiveContainer width="100%" height={data.length * 38 + 24}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 180, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={175} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v) => [v.toFixed(4), 'Importance score']} contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #e5e7eb' }} />
          <Bar dataKey="value" fill="#16a34a" radius={[0, 6, 6, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Model accuracy summary
// ---------------------------------------------------------------------------
function ModelAccuracy({ stats }) {
  const models = [
    { key: 'rf', label: 'Random Forest', f1: stats?.rf_f1 },
    { key: 'gbm', label: 'Gradient Boosting', f1: stats?.gbm_f1 },
    { key: 'xgb', label: 'XGBoost', f1: stats?.xgb_f1 },
    { key: 'ensemble', label: 'Ensemble', f1: stats?.ensemble_f1 },
  ].filter((m) => m.f1 != null);

  if (!models.length) return null;

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-800 mb-1">Model accuracy</h3>
      <p className="text-sm text-gray-500 mb-3">How well each AI model performed on this analysis</p>
      <div className="flex flex-wrap gap-3">
        {models.map((m) => (
          <div key={m.key} className={`flex-1 min-w-[140px] rounded-xl border p-4 ${stats?.model_type === m.key ? 'border-green-300 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
            <p className="text-xs text-gray-500 mb-1">{m.label}{stats?.model_type === m.key && <span className="ml-1 text-green-600 font-semibold">(used)</span>}</p>
            <p className="text-lg font-bold text-gray-800">{(m.f1 * 100).toFixed(1)}%</p>
            <p className="text-xs text-gray-400">F1 accuracy score</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GeoJSON risk map
// ---------------------------------------------------------------------------
function RiskMap({ geojson }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !geojson || !mapRef.current) return;
    let L;
    try { L = require('leaflet'); } catch { return; }
    if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null; }

    const map = L.map(mapRef.current, { center: [5, 20], zoom: 5 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);
    instanceRef.current = map;

    const gd = typeof geojson === 'string' ? JSON.parse(geojson) : geojson;
    const layer = L.geoJSON(gd, {
      style: (f) => {
        const cls = f?.properties?.class || f?.properties?.risk_class || f?.properties?.label || '';
        const color = RISK_COLOR[cls] || RISK_COLOR[cls?.split(' ')[0]] || '#6366f1';
        return { color, weight: 0.5, fillOpacity: 0.65, fillColor: color };
      },
      onEachFeature: (f, lyr) => {
        const p = f.properties || {};
        const html = Object.entries(p).filter(([, v]) => typeof v !== 'object').map(([k, v]) => `<b>${k}:</b> ${v}`).join('<br/>');
        if (html) lyr.bindPopup(html);
      },
    }).addTo(map);
    try { map.fitBounds(layer.getBounds(), { padding: [20, 20] }); } catch {}
    return () => { map.remove(); instanceRef.current = null; };
  }, [geojson]);

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-800 mb-1">Risk map</h3>
      <p className="text-sm text-gray-500 mb-3">Spatial distribution of food security risk across the selected area</p>
      <div ref={mapRef} style={{ height: 380, width: '100%', borderRadius: 16, border: '1px solid #e5e7eb' }} />
      <div className="flex gap-4 mt-3 text-xs text-gray-500">
        {[['Low Risk', '#16a34a'], ['Medium Risk', '#d97706'], ['High Risk', '#dc2626']].map(([l, c]) => (
          <span key={l} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: c }} />{l}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Render one complete result block (shared by single-aoi, and by each period
// in change-detection / comparative)
// ---------------------------------------------------------------------------
function ResultBlock({ res, periodLabel }) {
  if (!res) return null;

  const stats = res.stats || {};
  const charts = res.charts || {};
  const geoRaw = res.geojson;
  const geojson = geoRaw && typeof geoRaw === 'object' && !geoRaw.type
    ? Object.values(geoRaw)[0]
    : geoRaw;

  return (
    <div className="space-y-10">
      {periodLabel && (
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-100" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{periodLabel}</span>
          <div className="h-px flex-1 bg-gray-100" />
        </div>
      )}

      {res.cached && (
        <p className="text-xs inline-flex items-center gap-1 bg-purple-50 text-purple-600 border border-purple-100 px-3 py-1 rounded-full">
           Returned from cache  results are from a previous identical analysis
        </p>
      )}

      {/* Big three risk cards */}
      <RiskSummaryCards stats={stats} />

      {/* Key numbers */}
      <KeyNumbers stats={stats} />

      {/* Risk bar chart */}
      {charts.riskDist && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <RiskBarChart riskDist={charts.riskDist} />
        </div>
      )}

      {/* Trend chart */}
      {charts.timeSeries && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <TrendChart timeSeries={charts.timeSeries} />
        </div>
      )}

      {/* SHAP driver chart */}
      {charts.shap && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <DriverChart shap={charts.shap} />
        </div>
      )}

      {/* Model accuracy */}
      <ModelAccuracy stats={stats} />

      {/* Risk map */}
      {geojson && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <RiskMap geojson={geojson} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------
export default function DssResults({ result, mode }) {
  if (!result) return null;

  if (mode === 'single-aoi') {
    return <ResultBlock res={result} />;
  }

  if (mode === 'change-detection') {
    return (
      <div className="space-y-12">
        <ResultBlock res={result.baseline} periodLabel="Baseline period" />
        <ResultBlock res={result.comparison} periodLabel="Comparison period" />
        {result.change && Object.keys(result.change).length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">What changed</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(result.change)
                .filter(([, v]) => typeof v !== 'object' && v != null)
                .map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">{k.replace(/_/g, ' ')}</p>
                    <p className="text-sm font-bold text-gray-800">{typeof v === 'number' ? v.toFixed(2) : String(v)}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Comparative
  return (
    <div className="space-y-12">
      <ResultBlock res={result.primary} periodLabel="Main area" />
      <ResultBlock res={result.comparison} periodLabel="Comparison area" />
    </div>
  );
}
