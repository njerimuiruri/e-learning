// All DSS calls are proxied through /api/dss-proxy to avoid CORS issues.
// The Next.js server holds the credentials and token; the browser never calls
// the DSS server directly.
async function dssPost<T>(path: string, body: object): Promise<T> {
  const res = await fetch('/api/dss-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, body }),
  });

  const data = await res.json().catch(() => ({ error: res.statusText }));

  if (!res.ok) {
    throw new Error(data.error || 'DSS request failed');
  }

  return data;
}

// ---------------------------------------------------------------------------
// Payload types
// ---------------------------------------------------------------------------
export interface AOIGeoJSON {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface SingleAOIPayload {
  aoi_geojson: AOIGeoJSON;
  country: string;
  start_date: string;
  end_date: string;
  lt_baseline_start: string;
  s2_start: string;
  model_type: 'rf' | 'xgboost' | 'ensemble';
  n_pixels: number;
  scale: number;
}

export interface ChangeDetectionPayload {
  aoi_geojson: AOIGeoJSON;
  country: string;
  start_date: string;
  end_date: string;
  comparison_start_date: string;
  comparison_end_date: string;
  model_type: 'rf' | 'xgboost' | 'ensemble';
}

export interface ComparisonRegion {
  admin_name: string;
  aoi_geojson: AOIGeoJSON;
}

export interface ComparativePayload {
  aoi_geojson: AOIGeoJSON;
  comparison_region: ComparisonRegion;
  country: string;
  start_date: string;
  end_date: string;
  model_type: 'rf' | 'xgboost' | 'ensemble';
}

export interface PreprocessResult {
  preprocessing_key: string;
  status: string;
  cached: boolean;
  metadata: Record<string, unknown>;
}

export type DssResult = Record<string, unknown>;

// Disease risk has a simpler payload  no n_pixels/scale/lt_baseline_start/s2_start
// and uses gbm|xgboost|ensemble (not rf)
export interface DiseasePayload {
  aoi_geojson: AOIGeoJSON;
  country: string;
  start_date: string;
  end_date: string;
  model_type: 'gbm' | 'xgboost' | 'ensemble';
}

export interface DiseaseChangePayload extends DiseasePayload {
  comparison_start_date: string;
  comparison_end_date: string;
}

export interface DiseaseComparativePayload extends DiseasePayload {
  comparison_region: ComparisonRegion;
}

// ---------------------------------------------------------------------------
// Food Security endpoints
// ---------------------------------------------------------------------------
export const dss = {
  // Single AOI
  preprocessSingleAOI: (p: SingleAOIPayload) =>
    dssPost<PreprocessResult>('/api/v1/analysis/food-security/single-aoi/preprocess', p),
  runSingleAOI: (p: SingleAOIPayload & { preprocessing_key: string }) =>
    dssPost<DssResult>('/api/v1/analysis/food-security/single-aoi/run', p),

  // Change Detection
  preprocessChangeDetection: (p: ChangeDetectionPayload) =>
    dssPost<PreprocessResult>('/api/v1/analysis/food-security/change-detection/preprocess', p),
  runChangeDetection: (p: ChangeDetectionPayload & { preprocessing_key: string }) =>
    dssPost<DssResult>('/api/v1/analysis/food-security/change-detection/run', p),

  // Comparative
  preprocessComparative: (p: ComparativePayload) =>
    dssPost<PreprocessResult>('/api/v1/analysis/food-security/comparative/preprocess', p),
  runComparative: (p: ComparativePayload & { preprocessing_key: string }) =>
    dssPost<DssResult>('/api/v1/analysis/food-security/comparative/run', p),
};

// ---------------------------------------------------------------------------
// Disease Risk endpoints
// ---------------------------------------------------------------------------
export const diseaseDss = {
  preprocessSingleAOI: (p: DiseasePayload) =>
    dssPost<PreprocessResult>('/api/v1/analysis/disease/single-aoi/preprocess', p),
  runSingleAOI: (p: DiseasePayload & { preprocessing_key: string }) =>
    dssPost<DssResult>('/api/v1/analysis/disease/single-aoi/run', p),

  preprocessChangeDetection: (p: DiseaseChangePayload) =>
    dssPost<PreprocessResult>('/api/v1/analysis/disease/change-detection/preprocess', p),
  runChangeDetection: (p: DiseaseChangePayload & { preprocessing_key: string }) =>
    dssPost<DssResult>('/api/v1/analysis/disease/change-detection/run', p),

  preprocessComparative: (p: DiseaseComparativePayload) =>
    dssPost<PreprocessResult>('/api/v1/analysis/disease/comparative/preprocess', p),
  runComparative: (p: DiseaseComparativePayload & { preprocessing_key: string }) =>
    dssPost<DssResult>('/api/v1/analysis/disease/comparative/run', p),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a rectangular polygon GeoJSON from bounding box values */
export function bboxToGeoJSON(
  westLng: number,
  southLat: number,
  eastLng: number,
  northLat: number
): AOIGeoJSON {
  return {
    type: 'Polygon',
    coordinates: [
      [
        [westLng, southLat],
        [eastLng, southLat],
        [eastLng, northLat],
        [westLng, northLat],
        [westLng, southLat],
      ],
    ],
  };
}

export const AFRICAN_COUNTRIES = [
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi',
  'Cabo Verde', 'Cameroon', 'Central African Republic', 'Chad', 'Comoros',
  'Congo', 'Democratic Republic of the Congo', "Cote d'Ivoire", 'Djibouti',
  'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon',
  'Gambia', 'Ghana', 'Guinea', 'Guinea-Bissau', 'Kenya', 'Lesotho', 'Liberia',
  'Libya', 'Madagascar', 'Malawi', 'Mali', 'Mauritania', 'Mauritius', 'Morocco',
  'Mozambique', 'Namibia', 'Niger', 'Nigeria', 'Rwanda', 'Sao Tome and Principe',
  'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia', 'South Africa', 'South Sudan',
  'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe',
];
