'use client';

import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import Link from 'next/link';
import {
  MapPin, GitCompare, Layers, ChevronDown, ChevronUp, Lock,
  Loader2, CheckCircle2, AlertCircle, Play, RotateCcw, BarChart2,
} from 'lucide-react';
import Navbar from '@/components/navbar/navbar';
import Footer from '@/components/Footer/Footer';
import authService from '@/lib/api/authService';
import { dss, diseaseDss, bboxToGeoJSON, AFRICAN_COUNTRIES } from '@/lib/api/climateDssService';

// "AI for Climate Resilience" category  the only category allowed to use this tool.
const CLIMATE_RESILIENCE_CATEGORY_ID = '69ce216b97ba6be0d2f30b66';

function hasClimateResilienceAccess(user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const assigned = (user.fellowData?.assignedCategories || []).map((id) => id?.toString?.() || String(id));
  const purchased = (user.purchasedCategories || []).map((id) => id?.toString?.() || String(id));
  return assigned.includes(CLIMATE_RESILIENCE_CATEGORY_ID) || purchased.includes(CLIMATE_RESILIENCE_CATEGORY_ID);
}

const AOIMapPicker = lazy(() => import('@/components/climate/AOIMapPicker'));
const DssResults = lazy(() => import('@/components/climate/DssResults'));

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MODULES = [
  {
    id: 'food-security',
    label: 'Food Security',
    emoji: '🌾',
    desc: 'Analyse food insecurity risk using vegetation, rainfall, and land cover data.',
  },
  {
    id: 'disease',
    label: 'Disease Risk',
    emoji: '🦟',
    desc: 'Analyse climate-driven disease risk using temperature, humidity, and environmental data.',
  },
];

const TABS = [
  { id: 'single-aoi', label: 'Analyse One Area', icon: MapPin },
  { id: 'change-detection', label: 'Track Change Over Time', icon: GitCompare },
  { id: 'comparative', label: 'Compare Two Areas', icon: Layers },
];

const TAB_DESC = {
  'food-security': {
    'single-aoi': 'Get a food security risk map for a single location and time period.',
    'change-detection': 'See how food security risk has changed between two different periods.',
    'comparative': 'Compare food security risk between two different locations.',
  },
  'disease': {
    'single-aoi': 'Get a disease risk map for a single location and time period.',
    'change-detection': 'See how disease risk has changed between two different periods.',
    'comparative': 'Compare disease risk between two different locations.',
  },
};

const MODEL_OPTIONS = {
  'food-security': [
    { value: 'rf', label: 'Random Forest (Recommended)' },
    { value: 'xgboost', label: 'XGBoost' },
    { value: 'ensemble', label: 'Ensemble (All Models)' },
  ],
  'disease': [
    { value: 'gbm', label: 'Gradient Boosting (Recommended)' },
    { value: 'xgboost', label: 'XGBoost' },
    { value: 'ensemble', label: 'Ensemble (All Models)' },
  ],
};

const DEFAULT_BBOX = { west: 1.55, south: 7.6, east: 2.45, north: 8.6 };

// ---------------------------------------------------------------------------
// Shared UI primitives
// ---------------------------------------------------------------------------
function FieldLabel({ children }) {
  return <label className="block text-sm font-medium text-gray-700 mb-1.5">{children}</label>;
}

function TextInput({ className = '', ...props }) {
  return (
    <input
      className={`w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors ${className}`}
      {...props}
    />
  );
}

function Dropdown({ children, ...props }) {
  return (
    <select
      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors"
      {...props}
    >
      {children}
    </select>
  );
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ${className}`}>
      {children}
    </div>
  );
}

function SectionHeading({ children }) {
  return <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">{children}</p>;
}

// ---------------------------------------------------------------------------
// Status messages
// ---------------------------------------------------------------------------
function StatusBanner({ status, error }) {
  if (!status && !error) return null;
  if (error) {
    return (
      <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">Something went wrong</p>
          <p className="text-red-600 mt-0.5">{error}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-700">
      <CheckCircle2 className="w-4 h-4 shrink-0" />
      <span>{status}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step progress indicator
// ---------------------------------------------------------------------------
function StepProgress({ currentStep }) {
  const steps = [
    { n: 1, label: 'Fetch Satellite Data' },
    { n: 2, label: 'Run Analysis' },
  ];
  return (
    <div className="flex items-center gap-3">
      {steps.map((s, i) => {
        const done = currentStep > s.n;
        const active = currentStep === s.n;
        return (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
              done ? 'bg-green-600 border-green-600 text-white'
                : active ? 'border-green-600 text-green-600 bg-green-50'
                : 'border-gray-200 text-gray-300'
            }`}>
              {done ? '✓' : s.n}
            </div>
            <span className={`text-xs font-medium ${active ? 'text-green-700' : done ? 'text-gray-500' : 'text-gray-300'}`}>
              {s.label}
            </span>
            {i < steps.length - 1 && <div className={`w-8 h-0.5 mx-1 ${done ? 'bg-green-400' : 'bg-gray-100'}`} />}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Action buttons
// ---------------------------------------------------------------------------
function ActionButtons({ workflow, onPreprocess, onRun, onReset, canStart }) {
  return (
    <div className="flex flex-wrap gap-3">
      {workflow === 'idle' && (
        <button
          onClick={onPreprocess}
          disabled={!canStart}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Play className="w-4 h-4" />
          Step 1: Fetch Satellite Data
        </button>
      )}
      {workflow === 'preprocessing' && (
        <button disabled className="flex items-center gap-2 bg-green-600/70 text-white px-6 py-2.5 rounded-xl text-sm font-semibold cursor-not-allowed">
          <Loader2 className="w-4 h-4 animate-spin" />
          Fetching satellite data… (this takes 30–90 s)
        </button>
      )}
      {workflow === 'preprocessed' && (
        <>
          <button
            onClick={onRun}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <BarChart2 className="w-4 h-4" />
            Step 2: Run Analysis
          </button>
          <button onClick={onReset} className="flex items-center gap-2 border border-gray-200 text-gray-500 hover:bg-gray-50 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </>
      )}
      {workflow === 'running' && (
        <button disabled className="flex items-center gap-2 bg-green-600/70 text-white px-6 py-2.5 rounded-xl text-sm font-semibold cursor-not-allowed">
          <Loader2 className="w-4 h-4 animate-spin" />
          Running analysis… (30–60 s)
        </button>
      )}
      {workflow === 'done' && (
        <button onClick={onReset} className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          <RotateCcw className="w-3.5 h-3.5" /> Start New Analysis
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AOI picker  coordinate form + optional map
// ---------------------------------------------------------------------------
function LocationPicker({ bbox, onBboxChange, label = 'Location (Area of Interest)' }) {
  const [mode, setMode] = useState('coords');

  return (
    <div>
      <SectionHeading>{label}</SectionHeading>
      <p className="text-sm text-gray-500 mb-3">
        Define the geographic area you want to analyse. You can type in coordinates or pick it on a map.
      </p>

      <div className="flex gap-2 mb-4">
        {[['coords', 'Type Coordinates'], ['map', 'Pick on Map']].map(([m, name]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors border ${
              mode === m
                ? 'bg-green-50 border-green-500 text-green-700'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {mode === 'coords' ? (
        <div className="grid grid-cols-2 gap-3">
          {[
            ['west', 'West (left edge longitude)'],
            ['south', 'South (bottom edge latitude)'],
            ['east', 'East (right edge longitude)'],
            ['north', 'North (top edge latitude)'],
          ].map(([key, lbl]) => (
            <div key={key}>
              <FieldLabel>{lbl}</FieldLabel>
              <TextInput
                type="number"
                step="0.01"
                value={bbox[key] ?? ''}
                onChange={(e) => onBboxChange({ ...bbox, [key]: parseFloat(e.target.value) || 0 })}
                placeholder="e.g. 1.55"
              />
            </div>
          ))}
        </div>
      ) : (
        <Suspense fallback={<div className="h-72 bg-gray-50 rounded-xl flex items-center justify-center text-sm text-gray-400">Loading map…</div>}>
          <AOIMapPicker bbox={bbox} onBboxChange={onBboxChange} />
          {bbox && (
            <p className="text-xs text-gray-400 mt-2">
              Selected: W {bbox.west?.toFixed(3)} · S {bbox.south?.toFixed(3)} · E {bbox.east?.toFixed(3)} · N {bbox.north?.toFixed(3)}
            </p>
          )}
        </Suspense>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Analysis settings  shared across tabs
// ---------------------------------------------------------------------------
function AnalysisSettings({ values, onChange, extraFields, moduleId = 'food-security' }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const modelOpts = MODEL_OPTIONS[moduleId] || MODEL_OPTIONS['food-security'];

  return (
    <div>
      <SectionHeading>Analysis Settings</SectionHeading>

      <div className="space-y-4">
        <div>
          <FieldLabel>Country</FieldLabel>
          <Dropdown value={values.country} onChange={(e) => onChange('country', e.target.value)}>
            <option value=""> Select a country </option>
            {AFRICAN_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Dropdown>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Start date</FieldLabel>
            <TextInput type="date" value={values.start_date} onChange={(e) => onChange('start_date', e.target.value)} />
          </div>
          <div>
            <FieldLabel>End date</FieldLabel>
            <TextInput type="date" value={values.end_date} onChange={(e) => onChange('end_date', e.target.value)} />
          </div>
        </div>

        {extraFields}

        <div>
          <FieldLabel>Analysis model</FieldLabel>
          <Dropdown value={values.model_type} onChange={(e) => onChange('model_type', e.target.value)}>
            {modelOpts.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </Dropdown>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mt-1"
        >
          {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Advanced options
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
            <div>
              <FieldLabel>Pixel sample size</FieldLabel>
              <TextInput type="number" min={500} max={10000} step={500} value={values.n_pixels} onChange={(e) => onChange('n_pixels', parseInt(e.target.value))} />
            </div>
            <div>
              <FieldLabel>Resolution (metres)</FieldLabel>
              <TextInput type="number" min={100} max={5000} step={100} value={values.scale} onChange={(e) => onChange('scale', parseInt(e.target.value))} />
            </div>
            <div>
              <FieldLabel>Baseline start year</FieldLabel>
              <TextInput type="date" value={values.lt_baseline_start} onChange={(e) => onChange('lt_baseline_start', e.target.value)} />
            </div>
            <div>
              <FieldLabel>Sentinel-2 start</FieldLabel>
              <TextInput type="date" value={values.s2_start} onChange={(e) => onChange('s2_start', e.target.value)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Results wrapper  scrolls into view when results arrive
// ---------------------------------------------------------------------------
function ResultsSection({ result, mode, onReset }) {
  const ref = useRef(null);

  useEffect(() => {
    if (result && ref.current) {
      setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [result]);

  if (!result) return null;

  return (
    <div ref={ref} className="mt-8 pt-8 border-t border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Analysis Results</h2>
          <p className="text-sm text-gray-500 mt-0.5">Scroll down to explore the full results</p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 border border-gray-200 text-gray-500 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> New Analysis
        </button>
      </div>
      <Suspense fallback={<div className="text-sm text-gray-400 py-8 text-center">Loading results…</div>}>
        <DssResults result={result} mode={mode} />
      </Suspense>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual tab contents (all mounted, shown/hidden via CSS)
// ---------------------------------------------------------------------------
function SingleAOIContent() {
  const [bbox, setBbox] = useState(DEFAULT_BBOX);
  const [settings, setSettings] = useState({
    country: 'Benin', start_date: '2018-01-01', end_date: '2023-12-31',
    model_type: 'rf', n_pixels: 3000, scale: 1000,
    lt_baseline_start: '2001-01-01', s2_start: '2018-01-01',
  });
  const [workflow, setWorkflow] = useState('idle');
  const [error, setError] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);
  const [result, setResult] = useState(null);
  const [prepKey, setPrepKey] = useState(null);

  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));
  const reset = () => { setWorkflow('idle'); setResult(null); setError(null); setStatusMsg(null); setPrepKey(null); };

  const basePayload = {
    aoi_geojson: bboxToGeoJSON(bbox.west, bbox.south, bbox.east, bbox.north),
    country: settings.country, start_date: settings.start_date, end_date: settings.end_date,
    lt_baseline_start: settings.lt_baseline_start, s2_start: settings.s2_start,
    model_type: settings.model_type, n_pixels: settings.n_pixels, scale: settings.scale,
  };

  const handlePreprocess = async () => {
    setError(null); setStatusMsg(null); setResult(null); setPrepKey(null);
    setWorkflow('preprocessing');
    try {
      const res = await dss.preprocessSingleAOI(basePayload);
      setPrepKey(res.preprocessing_key);
      setWorkflow('preprocessed');
      setStatusMsg('Satellite data fetched successfully. Ready to run the analysis.');
    } catch (e) { setError(e.message); setWorkflow('idle'); }
  };

  const handleRun = async () => {
    setError(null); setStatusMsg(null);
    setWorkflow('running');
    try {
      const res = await dss.runSingleAOI({ ...basePayload, preprocessing_key: prepKey });
      setResult(res); setWorkflow('done');
    } catch (e) { setError(e.message); setWorkflow('preprocessed'); }
  };

  const step = { idle: 0, preprocessing: 1, preprocessed: 1, running: 2, done: 2 }[workflow];

  return (
    <div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <LocationPicker bbox={bbox} onBboxChange={setBbox} />
        </Card>
        <Card>
          <AnalysisSettings values={settings} onChange={set} />
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <StepProgress currentStep={step} />
          <div className="sm:ml-auto">
            <ActionButtons
              workflow={workflow}
              onPreprocess={handlePreprocess}
              onRun={handleRun}
              onReset={reset}
              canStart={!!settings.country}
            />
          </div>
        </div>
        {(statusMsg || error) && <div className="mt-4"><StatusBanner status={statusMsg} error={error} /></div>}
      </Card>

      <ResultsSection result={result} mode="single-aoi" onReset={reset} />
    </div>
  );
}

function ChangeDetectionContent() {
  const [bbox, setBbox] = useState(DEFAULT_BBOX);
  const [settings, setSettings] = useState({
    country: 'Benin', start_date: '2018-01-01', end_date: '2020-12-31',
    comparison_start_date: '2021-01-01', comparison_end_date: '2023-12-31',
    model_type: 'rf',
  });
  const [workflow, setWorkflow] = useState('idle');
  const [error, setError] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);
  const [result, setResult] = useState(null);
  const [prepKey, setPrepKey] = useState(null);

  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));
  const reset = () => { setWorkflow('idle'); setResult(null); setError(null); setStatusMsg(null); setPrepKey(null); };

  const basePayload = {
    aoi_geojson: bboxToGeoJSON(bbox.west, bbox.south, bbox.east, bbox.north),
    country: settings.country, start_date: settings.start_date, end_date: settings.end_date,
    comparison_start_date: settings.comparison_start_date,
    comparison_end_date: settings.comparison_end_date,
    model_type: settings.model_type,
  };

  const handlePreprocess = async () => {
    setError(null); setStatusMsg(null); setResult(null); setPrepKey(null);
    setWorkflow('preprocessing');
    try {
      const res = await dss.preprocessChangeDetection(basePayload);
      setPrepKey(res.preprocessing_key);
      setWorkflow('preprocessed');
      setStatusMsg('Satellite data fetched for both time periods. Ready to run the analysis.');
    } catch (e) { setError(e.message); setWorkflow('idle'); }
  };

  const handleRun = async () => {
    setError(null); setStatusMsg(null);
    setWorkflow('running');
    try {
      const res = await dss.runChangeDetection({ ...basePayload, preprocessing_key: prepKey });
      setResult(res); setWorkflow('done');
    } catch (e) { setError(e.message); setWorkflow('preprocessed'); }
  };

  const step = { idle: 0, preprocessing: 1, preprocessed: 1, running: 2, done: 2 }[workflow];

  const extraFields = (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-3 mt-1">Comparison period</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Comparison start</FieldLabel>
          <TextInput type="date" value={settings.comparison_start_date} onChange={(e) => set('comparison_start_date', e.target.value)} />
        </div>
        <div>
          <FieldLabel>Comparison end</FieldLabel>
          <TextInput type="date" value={settings.comparison_end_date} onChange={(e) => set('comparison_end_date', e.target.value)} />
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <LocationPicker bbox={bbox} onBboxChange={setBbox} />
        </Card>
        <Card>
          <AnalysisSettings values={settings} onChange={set} extraFields={extraFields} />
        </Card>
      </div>
      <Card className="mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <StepProgress currentStep={step} />
          <div className="sm:ml-auto">
            <ActionButtons workflow={workflow} onPreprocess={handlePreprocess} onRun={handleRun} onReset={reset} canStart={!!settings.country} />
          </div>
        </div>
        {(statusMsg || error) && <div className="mt-4"><StatusBanner status={statusMsg} error={error} /></div>}
      </Card>
      <ResultsSection result={result} mode="change-detection" onReset={reset} />
    </div>
  );
}

function ComparativeContent() {
  const [primaryBbox, setPrimaryBbox] = useState(DEFAULT_BBOX);
  const [compBbox, setCompBbox] = useState({ west: 2.5, south: 7.6, east: 3.5, north: 8.6 });
  const [compName, setCompName] = useState('Comparison Area');
  const [settings, setSettings] = useState({
    country: 'Benin', start_date: '2018-01-01', end_date: '2023-12-31', model_type: 'rf',
  });
  const [workflow, setWorkflow] = useState('idle');
  const [error, setError] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);
  const [result, setResult] = useState(null);
  const [prepKey, setPrepKey] = useState(null);

  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));
  const reset = () => { setWorkflow('idle'); setResult(null); setError(null); setStatusMsg(null); setPrepKey(null); };

  const basePayload = {
    aoi_geojson: bboxToGeoJSON(primaryBbox.west, primaryBbox.south, primaryBbox.east, primaryBbox.north),
    comparison_region: {
      admin_name: compName,
      aoi_geojson: bboxToGeoJSON(compBbox.west, compBbox.south, compBbox.east, compBbox.north),
    },
    country: settings.country, start_date: settings.start_date,
    end_date: settings.end_date, model_type: settings.model_type,
  };

  const handlePreprocess = async () => {
    setError(null); setStatusMsg(null); setResult(null); setPrepKey(null);
    setWorkflow('preprocessing');
    try {
      const res = await dss.preprocessComparative(basePayload);
      setPrepKey(res.preprocessing_key);
      setWorkflow('preprocessed');
      setStatusMsg('Satellite data fetched for both areas. Ready to run the analysis.');
    } catch (e) { setError(e.message); setWorkflow('idle'); }
  };

  const handleRun = async () => {
    setError(null); setStatusMsg(null);
    setWorkflow('running');
    try {
      const res = await dss.runComparative({ ...basePayload, preprocessing_key: prepKey });
      setResult(res); setWorkflow('done');
    } catch (e) { setError(e.message); setWorkflow('preprocessed'); }
  };

  const step = { idle: 0, preprocessing: 1, preprocessed: 1, running: 2, done: 2 }[workflow];

  return (
    <div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <LocationPicker bbox={primaryBbox} onBboxChange={setPrimaryBbox} label="Main Area" />
        </Card>
        <Card>
          <div className="mb-5">
            <SectionHeading>Comparison Area</SectionHeading>
            <FieldLabel>Name for this area</FieldLabel>
            <TextInput
              value={compName}
              onChange={(e) => setCompName(e.target.value)}
              placeholder="e.g. Northern District"
              className="mb-4"
            />
            <LocationPicker bbox={compBbox} onBboxChange={setCompBbox} label="Comparison Location" />
          </div>
        </Card>
      </div>
      <Card className="mt-6">
        <AnalysisSettings values={settings} onChange={set} />
      </Card>
      <Card className="mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <StepProgress currentStep={step} />
          <div className="sm:ml-auto">
            <ActionButtons workflow={workflow} onPreprocess={handlePreprocess} onRun={handleRun} onReset={reset} canStart={!!settings.country} />
          </div>
        </div>
        {(statusMsg || error) && <div className="mt-4"><StatusBanner status={statusMsg} error={error} /></div>}
      </Card>
      <ResultsSection result={result} mode="comparative" onReset={reset} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Disease Risk tab content components (same structure, different endpoints/model)
// ---------------------------------------------------------------------------
const DEFAULT_DISEASE_SETTINGS = {
  country: 'Benin', start_date: '2018-01-01', end_date: '2023-12-31', model_type: 'gbm',
};

function DiseaseSingleAOIContent() {
  const [bbox, setBbox] = useState(DEFAULT_BBOX);
  const [settings, setSettings] = useState(DEFAULT_DISEASE_SETTINGS);
  const [workflow, setWorkflow] = useState('idle');
  const [error, setError] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);
  const [result, setResult] = useState(null);
  const [prepKey, setPrepKey] = useState(null);

  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));
  const reset = () => { setWorkflow('idle'); setResult(null); setError(null); setStatusMsg(null); setPrepKey(null); };

  const basePayload = {
    aoi_geojson: bboxToGeoJSON(bbox.west, bbox.south, bbox.east, bbox.north),
    country: settings.country, start_date: settings.start_date,
    end_date: settings.end_date, model_type: settings.model_type,
  };

  const handlePreprocess = async () => {
    setError(null); setStatusMsg(null); setResult(null); setPrepKey(null);
    setWorkflow('preprocessing');
    try {
      const res = await diseaseDss.preprocessSingleAOI(basePayload);
      setPrepKey(res.preprocessing_key);
      setWorkflow('preprocessed');
      setStatusMsg('Satellite data fetched. Ready to run the analysis.');
    } catch (e) { setError(e.message); setWorkflow('idle'); }
  };

  const handleRun = async () => {
    setError(null); setStatusMsg(null);
    setWorkflow('running');
    try {
      const res = await diseaseDss.runSingleAOI({ ...basePayload, preprocessing_key: prepKey });
      setResult(res); setWorkflow('done');
    } catch (e) { setError(e.message); setWorkflow('preprocessed'); }
  };

  const step = { idle: 0, preprocessing: 1, preprocessed: 1, running: 2, done: 2 }[workflow];

  return (
    <div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card><LocationPicker bbox={bbox} onBboxChange={setBbox} /></Card>
        <Card><AnalysisSettings values={settings} onChange={set} moduleId="disease" /></Card>
      </div>
      <Card className="mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <StepProgress currentStep={step} />
          <div className="sm:ml-auto">
            <ActionButtons workflow={workflow} onPreprocess={handlePreprocess} onRun={handleRun} onReset={reset} canStart={!!settings.country} />
          </div>
        </div>
        {(statusMsg || error) && <div className="mt-4"><StatusBanner status={statusMsg} error={error} /></div>}
      </Card>
      <ResultsSection result={result} mode="single-aoi" onReset={reset} />
    </div>
  );
}

function DiseaseChangeDetectionContent() {
  const [bbox, setBbox] = useState(DEFAULT_BBOX);
  const [settings, setSettings] = useState({
    ...DEFAULT_DISEASE_SETTINGS, end_date: '2020-12-31',
    comparison_start_date: '2021-01-01', comparison_end_date: '2023-12-31',
  });
  const [workflow, setWorkflow] = useState('idle');
  const [error, setError] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);
  const [result, setResult] = useState(null);
  const [prepKey, setPrepKey] = useState(null);

  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));
  const reset = () => { setWorkflow('idle'); setResult(null); setError(null); setStatusMsg(null); setPrepKey(null); };

  const basePayload = {
    aoi_geojson: bboxToGeoJSON(bbox.west, bbox.south, bbox.east, bbox.north),
    country: settings.country, start_date: settings.start_date, end_date: settings.end_date,
    comparison_start_date: settings.comparison_start_date,
    comparison_end_date: settings.comparison_end_date, model_type: settings.model_type,
  };

  const handlePreprocess = async () => {
    setError(null); setStatusMsg(null); setResult(null); setPrepKey(null);
    setWorkflow('preprocessing');
    try {
      const res = await diseaseDss.preprocessChangeDetection(basePayload);
      setPrepKey(res.preprocessing_key);
      setWorkflow('preprocessed');
      setStatusMsg('Satellite data fetched for both periods. Ready to run.');
    } catch (e) { setError(e.message); setWorkflow('idle'); }
  };

  const handleRun = async () => {
    setError(null); setStatusMsg(null); setWorkflow('running');
    try {
      const res = await diseaseDss.runChangeDetection({ ...basePayload, preprocessing_key: prepKey });
      setResult(res); setWorkflow('done');
    } catch (e) { setError(e.message); setWorkflow('preprocessed'); }
  };

  const step = { idle: 0, preprocessing: 1, preprocessed: 1, running: 2, done: 2 }[workflow];

  const extraFields = (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-3 mt-1">Comparison period</p>
      <div className="grid grid-cols-2 gap-3">
        <div><FieldLabel>Comparison start</FieldLabel><TextInput type="date" value={settings.comparison_start_date} onChange={(e) => set('comparison_start_date', e.target.value)} /></div>
        <div><FieldLabel>Comparison end</FieldLabel><TextInput type="date" value={settings.comparison_end_date} onChange={(e) => set('comparison_end_date', e.target.value)} /></div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card><LocationPicker bbox={bbox} onBboxChange={setBbox} /></Card>
        <Card><AnalysisSettings values={settings} onChange={set} extraFields={extraFields} moduleId="disease" /></Card>
      </div>
      <Card className="mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <StepProgress currentStep={step} />
          <div className="sm:ml-auto">
            <ActionButtons workflow={workflow} onPreprocess={handlePreprocess} onRun={handleRun} onReset={reset} canStart={!!settings.country} />
          </div>
        </div>
        {(statusMsg || error) && <div className="mt-4"><StatusBanner status={statusMsg} error={error} /></div>}
      </Card>
      <ResultsSection result={result} mode="change-detection" onReset={reset} />
    </div>
  );
}

function DiseaseComparativeContent() {
  const [primaryBbox, setPrimaryBbox] = useState(DEFAULT_BBOX);
  const [compBbox, setCompBbox] = useState({ west: 2.5, south: 7.6, east: 3.5, north: 8.6 });
  const [compName, setCompName] = useState('Comparison Area');
  const [settings, setSettings] = useState(DEFAULT_DISEASE_SETTINGS);
  const [workflow, setWorkflow] = useState('idle');
  const [error, setError] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);
  const [result, setResult] = useState(null);
  const [prepKey, setPrepKey] = useState(null);

  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));
  const reset = () => { setWorkflow('idle'); setResult(null); setError(null); setStatusMsg(null); setPrepKey(null); };

  const basePayload = {
    aoi_geojson: bboxToGeoJSON(primaryBbox.west, primaryBbox.south, primaryBbox.east, primaryBbox.north),
    comparison_region: { admin_name: compName, aoi_geojson: bboxToGeoJSON(compBbox.west, compBbox.south, compBbox.east, compBbox.north) },
    country: settings.country, start_date: settings.start_date,
    end_date: settings.end_date, model_type: settings.model_type,
  };

  const handlePreprocess = async () => {
    setError(null); setStatusMsg(null); setResult(null); setPrepKey(null);
    setWorkflow('preprocessing');
    try {
      const res = await diseaseDss.preprocessComparative(basePayload);
      setPrepKey(res.preprocessing_key);
      setWorkflow('preprocessed');
      setStatusMsg('Satellite data fetched for both areas. Ready to run.');
    } catch (e) { setError(e.message); setWorkflow('idle'); }
  };

  const handleRun = async () => {
    setError(null); setStatusMsg(null); setWorkflow('running');
    try {
      const res = await diseaseDss.runComparative({ ...basePayload, preprocessing_key: prepKey });
      setResult(res); setWorkflow('done');
    } catch (e) { setError(e.message); setWorkflow('preprocessed'); }
  };

  const step = { idle: 0, preprocessing: 1, preprocessed: 1, running: 2, done: 2 }[workflow];

  return (
    <div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card><LocationPicker bbox={primaryBbox} onBboxChange={setPrimaryBbox} label="Main Area" /></Card>
        <Card>
          <div className="mb-5">
            <SectionHeading>Comparison Area</SectionHeading>
            <FieldLabel>Name for this area</FieldLabel>
            <TextInput value={compName} onChange={(e) => setCompName(e.target.value)} placeholder="e.g. Northern District" className="mb-4" />
            <LocationPicker bbox={compBbox} onBboxChange={setCompBbox} label="Comparison Location" />
          </div>
        </Card>
      </div>
      <Card className="mt-6"><AnalysisSettings values={settings} onChange={set} moduleId="disease" /></Card>
      <Card className="mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <StepProgress currentStep={step} />
          <div className="sm:ml-auto">
            <ActionButtons workflow={workflow} onPreprocess={handlePreprocess} onRun={handleRun} onReset={reset} canStart={!!settings.country} />
          </div>
        </div>
        {(statusMsg || error) && <div className="mt-4"><StatusBanner status={statusMsg} error={error} /></div>}
      </Card>
      <ResultsSection result={result} mode="comparative" onReset={reset} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
function RestrictedScreen() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 pt-32 pb-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-5">
          <Lock className="w-6 h-6 text-amber-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Fellows-Only Tool</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          The Climate Decision Support System is only available to fellows enrolled in the
          AI for Climate Resilience programme. Log in with a fellow account to continue, or
          contact your programme administrator if you believe this is a mistake.
        </p>
        <Link href="/login" className="inline-block mt-6 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          Go to Login
        </Link>
      </div>
      <Footer />
    </div>
  );
}

export default function ClimateDSSPage() {
  const [activeModule, setActiveModule] = useState('food-security');
  const [activeTab, setActiveTab] = useState('single-aoi');
  const [access, setAccess] = useState('checking'); // 'checking' | 'allowed' | 'denied'

  useEffect(() => {
    const localUser = authService.getCurrentUser();
    if (hasClimateResilienceAccess(localUser)) setAccess('allowed');

    // Always re-check against the server  category assignment can change after login.
    authService.refreshFromServer().then((freshUser) => {
      setAccess(hasClimateResilienceAccess(freshUser || localUser) ? 'allowed' : 'denied');
    });
  }, []);

  const mod = MODULES.find((m) => m.id === activeModule);

  if (access === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
      </div>
    );
  }

  if (access === 'denied') {
    return <RestrictedScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Page header */}
      <div className="bg-white border-b border-gray-100 pt-16 sm:pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0 mt-0.5 text-xl">
              {mod?.emoji}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Climate Risk Analysis</h1>
              <p className="text-gray-500 mt-1 max-w-2xl">
                Use satellite data and AI to understand climate-driven risks across Africa.
                Choose a module, define your area, and get a risk assessment with charts and maps.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {['54 African countries', 'Google Earth Engine', 'AI-powered', 'Fellows Only'].map((t) => (
                  <span key={t} className="text-xs bg-green-50 text-green-700 border border-green-100 px-2.5 py-1 rounded-full font-medium">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Module switcher */}
        <div className="max-w-6xl mx-auto px-4 pb-0">
          <div className="flex gap-3 mb-0">
            {MODULES.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveModule(m.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-sm font-semibold border border-b-0 transition-all ${
                  activeModule === m.id
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span>{m.emoji}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Analysis type tabs */}
        <div className="max-w-6xl mx-auto px-4 bg-white border-t border-gray-200">
          <div className="flex gap-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-all -mb-px ${
                    active
                      ? 'border-green-600 text-green-700'
                      : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab description */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <p className="text-sm text-gray-500">
            {TAB_DESC[activeModule]?.[activeTab]}
          </p>
        </div>
      </div>

      {/* Content  all 6 combinations mounted simultaneously to preserve state */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Food Security */}
        <div style={{ display: activeModule === 'food-security' && activeTab === 'single-aoi' ? 'block' : 'none' }}>
          <SingleAOIContent />
        </div>
        <div style={{ display: activeModule === 'food-security' && activeTab === 'change-detection' ? 'block' : 'none' }}>
          <ChangeDetectionContent />
        </div>
        <div style={{ display: activeModule === 'food-security' && activeTab === 'comparative' ? 'block' : 'none' }}>
          <ComparativeContent />
        </div>
        {/* Disease Risk */}
        <div style={{ display: activeModule === 'disease' && activeTab === 'single-aoi' ? 'block' : 'none' }}>
          <DiseaseSingleAOIContent />
        </div>
        <div style={{ display: activeModule === 'disease' && activeTab === 'change-detection' ? 'block' : 'none' }}>
          <DiseaseChangeDetectionContent />
        </div>
        <div style={{ display: activeModule === 'disease' && activeTab === 'comparative' ? 'block' : 'none' }}>
          <DiseaseComparativeContent />
        </div>
      </div>

      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <Footer />
    </div>
  );
}
