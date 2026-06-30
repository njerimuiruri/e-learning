'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataTable } from '@/components/ui/data-table';
import analyticsService from '@/lib/api/analyticsService';
import capstoneService from '@/lib/api/capstoneService';
import projectService from '@/lib/api/projectService';
import {
  Users, BookOpen, BarChart3, RefreshCw, AlertTriangle, Globe, Clock,
  Activity, Target, CheckCircle, Flame, MapPin, TrendingUp, Star,
  ArrowUp, ArrowDown, Minus, Medal, Zap, Brain, Calendar, UserX,
  Award, GraduationCap, Trophy, ClipboardList, Sparkles,
  ThumbsUp, ThumbsDown, ScrollText, FileText, FolderOpen, ExternalLink,
  Download, ImageIcon, Trash2,
} from 'lucide-react';
import adminService from '@/lib/api/adminService';
import Navbar from '@/components/navbar/navbar';

const DemographicsMap = dynamic(() => import('@/components/shared/DemographicsMap'), {
  ssr: false,
  loading: () => <div className="w-full h-[460px] rounded-xl bg-gray-100 animate-pulse" />,
});

// ─── palette ──────────────────────────────────────────────────────────────────
const C = ['#6366f1','#22c55e','#f59e0b','#ef4444','#14b8a6','#f97316','#8b5cf6','#06b6d4'];
const LEVEL_COLORS = { beginner: '#22c55e', intermediate: '#6366f1', advanced: '#f59e0b' };
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt  = (n, d = 1) => Number(n ?? 0).toFixed(d);
const pct  = (n) => `${fmt(n)}%`;
const num  = (n) => Number(n ?? 0).toLocaleString();
const trunc = (s, max = 28) => s?.length > max ? s.slice(0, max - 1) + '…' : (s ?? '—');

function buildMonthlyBase() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { month: MONTHS[d.getMonth()], enrollments: 0, completions: 0, active: 0 };
  });
}

// ─── micro components ─────────────────────────────────────────────────────────
function KPICard({ icon: Icon, label, value, sub, color = 'indigo', trend, onClick }) {
  const bg = {
    indigo:'bg-indigo-50 text-indigo-600', green:'bg-green-50 text-green-600',
    amber:'bg-amber-50 text-amber-600',   rose:'bg-rose-50 text-rose-600',
    teal:'bg-teal-50 text-teal-600',      violet:'bg-violet-50 text-violet-600',
    sky:'bg-sky-50 text-sky-600',         orange:'bg-orange-50 text-orange-600',
    red:'bg-red-50 text-red-600',         yellow:'bg-yellow-50 text-yellow-600',
    lime:'bg-lime-50 text-lime-600',      cyan:'bg-cyan-50 text-cyan-600',
  };
  return (
    <Card className={`border border-gray-100 shadow-sm hover:shadow-md transition-all ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg ${bg[color] ?? bg.indigo}`}><Icon className="w-4 h-4" /></div>
          {trend !== undefined && (
            <span className={`text-xs font-medium flex items-center gap-0.5 ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-500' : 'text-gray-400'}`}>
              {trend > 0 ? <ArrowUp className="w-3 h-3" /> : trend < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-xs font-medium text-gray-500 mt-0.5">{label}</div>
          {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function Chip({ type = 'info', children }) {
  const s = {
    info:'bg-blue-50 text-blue-700 border-blue-100',
    success:'bg-green-50 text-green-700 border-green-100',
    warning:'bg-amber-50 text-amber-700 border-amber-100',
    danger:'bg-red-50 text-red-700 border-red-100',
    violet:'bg-violet-50 text-violet-700 border-violet-100',
    warn:'bg-amber-50 text-amber-700 border-amber-100',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${s[type]}`}>
      {children}
    </span>
  );
}

function SectionHeader({ icon: Icon, title, description, action }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-5">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-indigo-50 rounded-lg mt-0.5"><Icon className="w-4 h-4 text-indigo-600" /></div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-bold text-gray-800 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-semibold text-gray-900">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
};

function Empty({ message = 'No data available yet' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-3 bg-gray-100 rounded-full mb-3"><BarChart3 className="w-6 h-6 text-gray-400" /></div>
      <p className="text-sm text-gray-500 font-medium">{message}</p>
      <p className="text-xs text-gray-400 mt-1">Data will appear here as students engage with the platform</p>
    </div>
  );
}

function RiskBadge({ daysInactive }) {
  if (daysInactive >= 30) return <Chip type="danger">Dormant</Chip>;
  if (daysInactive >= 14) return <Chip type="warning">At Risk</Chip>;
  if (daysInactive >= 7)  return <Chip type="warning">Inactive</Chip>;
  return <Chip type="success">Active</Chip>;
}

function HourHeatmap({ data }) {
  if (!data?.length) return <Empty message="No activity data" />;
  const max = Math.max(...data.map(d => d.completions), 1);
  const getColor = (val) => {
    const r = val / max;
    if (r > 0.8) return 'bg-indigo-600 text-white';
    if (r > 0.6) return 'bg-indigo-400 text-white';
    if (r > 0.4) return 'bg-indigo-200 text-indigo-900';
    if (r > 0.2) return 'bg-indigo-100 text-indigo-700';
    return 'bg-gray-100 text-gray-500';
  };
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-1">
        {data.map(d => (
          <div key={d.hour} title={`${d.label}: ${d.completions} completions`}
            className={`rounded-md p-1.5 text-center cursor-default hover:ring-2 hover:ring-indigo-400 ${getColor(d.completions)}`}>
            <div className="text-[9px] font-bold leading-none">{d.label}</div>
            <div className="text-[10px] font-semibold mt-0.5 leading-none">{d.completions}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-gray-400">Less</span>
        {['bg-gray-100','bg-indigo-100','bg-indigo-200','bg-indigo-400','bg-indigo-600'].map((c, i) => (
          <div key={i} className={`w-4 h-4 rounded ${c}`} />
        ))}
        <span className="text-xs text-gray-400">More</span>
      </div>
    </div>
  );
}

function StarRating({ rating, max = 5 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
      <span className="text-xs font-semibold text-gray-700 ml-1">{Number(rating ?? 0).toFixed(1)}</span>
    </div>
  );
}

function YAxisWrappedTick({ x, y, payload, width = 190 }) {
  const words = (payload.value ?? '').split(' ');
  const lines = [];
  let current = '';
  const maxChars = Math.floor(width / 6.5);
  words.forEach(word => {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  });
  if (current) lines.push(current);
  const lineH = 13;
  const totalH = lines.length * lineH;
  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, i) => (
        <text
          key={i}
          x={0} y={0}
          dy={-totalH / 2 + i * lineH + lineH / 2}
          textAnchor="end"
          fill="#6b7280"
          fontSize={10}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function ProgressBar({ value, color = '#6366f1', className = '' }) {
  return (
    <div className={`h-1.5 bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(value ?? 0, 100)}%`, background: color }} />
    </div>
  );
}

function ExportBtn({ targetRef, filename = 'chart' }) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);

  const openMenu = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    }
    setOpen(o => !o);
  };

  const capture = async () => {
    const { default: html2canvas } = await import('html2canvas');
    return html2canvas(targetRef.current, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 15000,
      onclone: (doc) => {
        // Hide export buttons from the captured image
        doc.querySelectorAll('[data-export-btn]').forEach(el => { el.style.display = 'none'; });
      },
    });
  };

  const downloadPng = async () => {
    if (!targetRef.current) return;
    setExporting(true); setOpen(false);
    try {
      const canvas = await capture();
      const a = document.createElement('a');
      a.download = `${filename}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    } finally { setExporting(false); }
  };

  const downloadPdf = async () => {
    if (!targetRef.current) return;
    setExporting(true); setOpen(false);
    try {
      const canvas = await capture();
      const { jsPDF } = await import('jspdf');
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: canvas.width > canvas.height ? 'landscape' : 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`${filename}.pdf`);
    } finally { setExporting(false); }
  };

  return (
    <div>
      <button
        ref={btnRef}
        onClick={openMenu}
        disabled={exporting}
        data-export-btn="true"
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 rounded-lg px-2.5 py-1.5 transition-colors bg-white disabled:opacity-50"
        title="Export chart"
      >
        {exporting ? <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        Export
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 w-36"
            style={{ top: dropPos.top, right: dropPos.right }}
          >
            <button onClick={downloadPng} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-gray-700 text-xs font-medium">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-500" /> Save as PNG
            </button>
            <button onClick={downloadPdf} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-gray-700 text-xs font-medium">
              <FileText className="w-3.5 h-3.5 text-red-500" /> Save as PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Capstone status badge ────────────────────────────────────────────────────
const CAPSTONE_STATUS = {
  submitted:                 { label: 'Submitted',        cls: 'bg-blue-100 text-blue-700'    },
  under_review:              { label: 'Under Review',     cls: 'bg-indigo-100 text-indigo-700' },
  revision_requested:        { label: 'Revision Req.',    cls: 'bg-amber-100 text-amber-700'   },
  approved:                  { label: 'Approved',         cls: 'bg-green-100 text-green-700'   },
  implementation:            { label: 'Implementation',   cls: 'bg-teal-100 text-teal-700'     },
  implementation_submitted:  { label: 'Impl. Submitted',  cls: 'bg-cyan-100 text-cyan-700'     },
  grading:                   { label: 'Grading',          cls: 'bg-violet-100 text-violet-700' },
  graded:                    { label: 'Graded',           cls: 'bg-purple-100 text-purple-700' },
  completed:                 { label: 'Completed',        cls: 'bg-emerald-100 text-emerald-700'},
  rejected:                  { label: 'Rejected',         cls: 'bg-red-100 text-red-700'       },
};

function CapstoneStatusBadge({ status }) {
  const s = CAPSTONE_STATUS[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${s.cls}`}>{s.label}</span>;
}

function CapstoneDataTable({ capstones }) {
  const data = useMemo(() => capstones.map(c => ({
    id:        c._id,
    name:      c.studentName || '—',
    email:     c.studentEmail || '—',
    title:     c.title || '—',
    status:    c.status,
    grade:     c.grade ?? null,
    passed:    c.passed,
    revisions: c.revisionCount ?? 0,
    files:     (c.files ?? []).length + (c.implementationFiles ?? []).length,
    submitted: c.submittedAt ? new Date(c.submittedAt).toLocaleDateString() : '—',
  })), [capstones]);

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Student',
      cell: ({ getValue, row }) => (
        <div>
          <p className="font-semibold text-gray-800 text-xs">{getValue()}</p>
          <p className="text-[10px] text-gray-400">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'title',
      header: 'Project Title',
      cell: ({ getValue }) => <span className="font-medium text-gray-700 text-xs leading-snug">{getValue()}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 130,
      cell: ({ getValue }) => <CapstoneStatusBadge status={getValue()} />,
    },
    {
      accessorKey: 'grade',
      header: 'Grade',
      size: 80,
      cell: ({ getValue, row }) => {
        const g = getValue();
        if (g === null || g === undefined) return <span className="text-gray-400 text-xs">—</span>;
        return (
          <span className={`font-bold text-xs ${g >= 50 ? 'text-green-600' : 'text-red-500'}`}>
            {g}% {row.original.passed ? '✓' : '✗'}
          </span>
        );
      },
    },
    {
      accessorKey: 'revisions',
      header: 'Revisions',
      size: 75,
      cell: ({ getValue }) => {
        const v = getValue();
        return <span className={`text-xs font-semibold ${v > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{v}</span>;
      },
    },
    {
      accessorKey: 'files',
      header: 'Files',
      size: 55,
      cell: ({ getValue }) => <span className="text-xs text-gray-600">{getValue()}</span>,
    },
    {
      accessorKey: 'submitted',
      header: 'Submitted',
      size: 95,
      cell: ({ getValue }) => <span className="text-xs text-gray-500">{getValue()}</span>,
    },
  ], []);

  return <DataTable columns={columns} data={data} searchPlaceholder="Search by name, title, email…" pageSize={15} />;
}

function CaseStudyDataTable({ projects }) {
  const data = useMemo(() => projects.map(p => ({
    id:       p._id,
    name:     p.studentName || p.authorName || '—',
    email:    p.studentEmail || p.authorEmail || '—',
    title:    p.title || '—',
    status:   p.status,
    tags:     (p.tags ?? []).slice(0, 3).join(', ') || '—',
    file:     p.fileName || '—',
    fileUrl:  p.fileUrl || null,
    feedback: p.adminFeedback || p.feedback || '—',
    created:  p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—',
  })), [projects]);

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Submitted By',
      cell: ({ getValue, row }) => (
        <div>
          <p className="font-semibold text-gray-800 text-xs">{getValue()}</p>
          <p className="text-[10px] text-gray-400">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ getValue }) => <span className="font-medium text-gray-700 text-xs">{trunc(getValue(), 40)}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 100,
      cell: ({ getValue }) => {
        const v = getValue();
        const s = v === 'approved' ? 'bg-green-100 text-green-700' : v === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
        return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${s}`}>{v || 'pending'}</span>;
      },
    },
    {
      accessorKey: 'tags',
      header: 'Tags',
      size: 120,
      cell: ({ getValue }) => <span className="text-[10px] text-gray-500">{getValue()}</span>,
    },
    {
      accessorKey: 'file',
      header: 'File',
      size: 140,
      cell: ({ getValue, row }) => {
        const url = row.original.fileUrl;
        return url ? (
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-[10px] font-medium truncate max-w-[130px]">
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
            {trunc(getValue(), 20)}
          </a>
        ) : <span className="text-[10px] text-gray-400">{trunc(getValue(), 20)}</span>;
      },
    },
    {
      accessorKey: 'created',
      header: 'Date',
      size: 90,
      cell: ({ getValue }) => <span className="text-xs text-gray-500">{getValue()}</span>,
    },
  ], []);

  return <DataTable columns={columns} data={data} searchPlaceholder="Search by name, title, email…" pageSize={15} />;
}

// ─── Demographics DataTable sub-components ───────────────────────────────────
function CountryDataTable({ countryDist }) {
  const total = countryDist.reduce((s, c) => s + c.count, 0);
  const data = useMemo(() => countryDist.map((c, i) => ({
    rank:       i + 1,
    country:    c.country || 'Unknown',
    students:   c.count,
    share:      total > 0 ? (c.count / total) * 100 : 0,
  })), [countryDist, total]);

  const columns = useMemo(() => [
    {
      accessorKey: 'rank',
      header: '#',
      size: 40,
      enableSorting: false,
      cell: ({ getValue }) => <span className="text-gray-400 font-medium">{getValue()}</span>,
    },
    {
      accessorKey: 'country',
      header: 'Country',
      cell: ({ getValue }) => (
        <span className="flex items-center gap-1.5 font-medium text-gray-800">
          <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />{getValue()}
        </span>
      ),
    },
    {
      accessorKey: 'students',
      header: 'Students',
      size: 90,
      cell: ({ getValue }) => <span className="font-bold text-gray-900">{num(getValue())}</span>,
    },
    {
      accessorKey: 'share',
      header: '% Share',
      size: 160,
      cell: ({ getValue, row }) => {
        const val = getValue();
        const i = row.index;
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${Math.min(val, 100)}%`, background: C[i % C.length] }} />
            </div>
            <span className="font-semibold text-xs w-10 text-right" style={{ color: C[i % C.length] }}>{pct(val)}</span>
          </div>
        );
      },
    },
  ], []);

  return <DataTable columns={columns} data={data} searchPlaceholder="Search country…" pageSize={10} />;
}

// ─── main component ──────────────────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const [loading, setLoading]           = useState(true);
  const [overview, setOverview]         = useState(null);
  const [studentProgress, setStudentProgress] = useState(null);
  const [courseCompletion, setCourseCompletion] = useState(null);
  const [assessmentData, setAssessmentData]   = useState(null);
  const [behaviorData, setBehaviorData]       = useState(null);
  const [engagementData, setEngagementData]   = useState(null);
  const [demoData, setDemoData]               = useState(null);
  const [extData, setExtData]                 = useState(null);
  const [certSummary, setCertSummary]         = useState(null);
  const [fellowStats, setFellowStats]         = useState(null);
  const [fellowsData, setFellowsData]         = useState(null);
  const [fellowActivity, setFellowActivity]   = useState(null);
  const [fellowRiskFilter, setFellowRiskFilter] = useState('all');
  const [topPerformers, setTopPerformers]     = useState(null);
  const [behaviorPeriod, setBehaviorPeriod]   = useState('weekly');
  const [activeTab, setActiveTab]             = useState('overview');
  const [lastUpdated, setLastUpdated]         = useState(null);
  const [capstones, setCapstones]             = useState([]);
  const [caseStudies, setCaseStudies]         = useState([]);
  const [subsLoading, setSubsLoading]         = useState(false);

  // Export refs — one per exportable section
  const refMostAccessed      = useRef(null);
  const refHighestCompletion = useRef(null);
  const refModuleProgress    = useRef(null);
  const refDropOff           = useRef(null);
  const refModuleOverview    = useRef(null);
  const refAssessmentPerf    = useRef(null);
  const refGeoSection        = useRef(null);
  const refGenderDist        = useRef(null);
  const refCountryTable      = useRef(null);
  const refCertInfographic   = useRef(null);
  const refEnrollmentByModule = useRef(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, sp, cc, ai, bh, eg, dm, ex, fs, fw, fa, tp, cs] = await Promise.allSettled([
        analyticsService.getOverview(),
        analyticsService.getStudentProgress(100),
        analyticsService.getCourseCompletion(),
        analyticsService.getAssessmentInsights(),
        analyticsService.getLearningBehavior(behaviorPeriod),
        analyticsService.getEngagement(),
        analyticsService.getDemographics(),
        analyticsService.getExtendedAnalytics(),
        analyticsService.getFellowProgressStats(),
        analyticsService.getFellowsProgress({ limit: 200 }),
        analyticsService.getFellowLearningAnalytics({ days: 30 }),
        analyticsService.getTopPerformers(),
        analyticsService.getCertificatesSummary(),
      ]);
      if (ov.status === 'fulfilled') setOverview(ov.value);
      if (sp.status === 'fulfilled') setStudentProgress(sp.value);
      if (cc.status === 'fulfilled') setCourseCompletion(cc.value);
      if (ai.status === 'fulfilled') setAssessmentData(ai.value);
      if (bh.status === 'fulfilled') setBehaviorData(bh.value);
      if (eg.status === 'fulfilled') setEngagementData(eg.value);
      if (dm.status === 'fulfilled') setDemoData(dm.value);
      if (ex.status === 'fulfilled') setExtData(ex.value);
      if (fs.status === 'fulfilled') setFellowStats(fs.value);
      if (fw.status === 'fulfilled') setFellowsData(fw.value);
      if (fa.status === 'fulfilled') setFellowActivity(fa.value);
      if (tp.status === 'fulfilled') setTopPerformers(tp.value);
      if (cs.status === 'fulfilled') setCertSummary(cs.value);
      setLastUpdated(new Date());

      // ── DEBUG LOGS — open browser console (F12) to inspect ──────────────
      // Raw DB counts to verify which collection has data
      analyticsService.getDebugCounts().then(dbg => {
        console.group('%c🔍 DB Raw Counts', 'color:#ef4444;font-weight:bold;font-size:14px');
        console.log('moduleEnrollments :', dbg.moduleEnrollments);
        console.log('oldEnrollments    :', dbg.oldEnrollments);
        console.log('modules           :', dbg.modules);
        console.log('students          :', dbg.students);
        console.log('sample enrollment :', dbg.sampleEnrollment);
        console.log('sample module     :', dbg.sampleModule);
        console.groupEnd();
      }).catch(e => console.warn('Debug counts failed:', e));

      console.group('%c📊 Analytics Debug', 'color:#6366f1;font-weight:bold;font-size:14px');
      console.log('%c Overview',         'color:#22c55e;font-weight:bold', ov.status  === 'fulfilled' ? ov.value  : `❌ ${ov.reason}`);
      console.log('%c CourseCompletion', 'color:#22c55e;font-weight:bold', cc.status  === 'fulfilled' ? cc.value  : `❌ ${cc.reason}`);
      console.log('%c StudentProgress',  'color:#22c55e;font-weight:bold', sp.status  === 'fulfilled' ? sp.value  : `❌ ${sp.reason}`);
      console.log('%c Engagement',       'color:#22c55e;font-weight:bold', eg.status  === 'fulfilled' ? eg.value  : `❌ ${eg.reason}`);
      console.log('%c Assessments',      'color:#22c55e;font-weight:bold', ai.status  === 'fulfilled' ? ai.value  : `❌ ${ai.reason}`);
      console.log('%c Behavior',         'color:#22c55e;font-weight:bold', bh.status  === 'fulfilled' ? bh.value  : `❌ ${bh.reason}`);
      console.log('%c Demographics',     'color:#22c55e;font-weight:bold', dm.status  === 'fulfilled' ? dm.value  : `❌ ${dm.reason}`);
      console.log('%c Extended',         'color:#22c55e;font-weight:bold', ex.status  === 'fulfilled' ? ex.value  : `❌ ${ex.reason}`);

      // Specific module data summary
      if (cc.status === 'fulfilled') {
        const modules = cc.value?.courses ?? [];
        console.table(modules.map(m => ({
          module: m.courseName,
          level: m.level,
          enrolled: m.totalEnrollments,
          completed: m.completedCount,
          completionRate: `${m.completionRate}%`,
          avgProgress: `${m.avgProgress}%`,
        })));
      }
      // Engagement summary
      if (eg.status === 'fulfilled') {
        const s = eg.value?.summary ?? {};
        console.log('%c Engagement Summary', 'color:#f59e0b;font-weight:bold', { total: s.totalStudents, active: s.activeStudents, atRisk: s.atRiskStudents, dormant: s.dormantStudents, activeRate: `${s.activeRate}%` });
        console.log('%c Top Students count', 'color:#f59e0b', eg.value?.topStudents?.length ?? 0);
      }
      // Extended: level stats
      if (ex.status === 'fulfilled') {
        console.log('%c Level Stats', 'color:#8b5cf6;font-weight:bold', ex.value?.levelStats);
        console.log('%c Certificates', 'color:#8b5cf6', ex.value?.certificates);
      }
      console.groupEnd();
    } catch (e) { console.error('Analytics load error:', e); }
    finally { setLoading(false); }
  }, [behaviorPeriod]);

  useEffect(() => { loadAll(); }, []);

  const handleDeleteModule = async (moduleId, moduleName) => {
    if (!confirm(`Permanently delete "${moduleName}"?\n\nThis cannot be undone.`)) return;
    try {
      await adminService.deleteModule(moduleId);
      setCourseCompletion(prev => prev
        ? { ...prev, courses: prev.courses.filter(m => m.courseId !== moduleId) }
        : prev
      );
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete module');
    }
  };

  // Load submissions lazily when the tab is first activated
  useEffect(() => {
    if (activeTab !== 'submissions') return;
    if (capstones.length > 0 || caseStudies.length > 0) return;
    setSubsLoading(true);
    Promise.allSettled([
      capstoneService.getAllCapstones({ limit: 200 }),
      projectService.getAdminSubmissions({ limit: 200 }),
    ]).then(([cap, proj]) => {
      if (cap.status === 'fulfilled')  setCapstones(cap.value?.data  ?? []);
      if (proj.status === 'fulfilled') setCaseStudies(proj.value?.projects ?? proj.value?.data ?? []);
    }).finally(() => setSubsLoading(false));
  }, [activeTab]);

  const refreshSubmissions = useCallback(() => {
    setSubsLoading(true);
    Promise.allSettled([
      capstoneService.getAllCapstones({ limit: 200 }),
      projectService.getAdminSubmissions({ limit: 200 }),
    ]).then(([cap, proj]) => {
      if (cap.status === 'fulfilled')  setCapstones(cap.value?.data  ?? []);
      if (proj.status === 'fulfilled') setCaseStudies(proj.value?.projects ?? proj.value?.data ?? []);
    }).finally(() => setSubsLoading(false));
  }, []);

  const refreshBehavior = useCallback(async (period) => {
    setBehaviorPeriod(period);
    try { const bh = await analyticsService.getLearningBehavior(period); setBehaviorData(bh); }
    catch (e) { console.error(e); }
  }, []);

  // ── derived ────────────────────────────────────────────────────────────────
  const enrollmentTrend = (() => {
    const base = buildMonthlyBase();
    if (overview?.monthlyEnrollments) {
      overview.monthlyEnrollments.forEach(m => {
        const idx = base.findIndex(b => b.month === m.month);
        if (idx >= 0) { base[idx].enrollments = m.count ?? 0; base[idx].completions = m.completions ?? 0; base[idx].active = m.active ?? 0; }
      });
    } else {
      const total = overview?.enrollments?.total ?? 0;
      const rate = overview?.enrollments?.completionRate ? parseFloat(overview.enrollments.completionRate) / 100 : 0.3;
      base.forEach((b, i) => { b.enrollments = Math.round((total / 6) * (0.6 + i * 0.08)); b.completions = Math.round(b.enrollments * rate); b.active = b.enrollments - b.completions; });
    }
    return base;
  })();

  const allModules     = courseCompletion?.courses ?? [];
  const mostAccessed   = [...allModules].sort((a, b) => b.totalEnrollments - a.totalEnrollments).slice(0, 8);
  const highestComp    = [...allModules].sort((a, b) => b.completionRate - a.completionRate).slice(0, 5);
  const dropOff        = [...allModules].filter(m => m.totalEnrollments >= 3).sort((a, b) => a.completionRate - b.completionRate).slice(0, 8);

  const progressBuckets = (() => {
    if (!studentProgress?.students) return [];
    const buckets = [
      { range: '0–20%', min: 0, max: 20, count: 0, fill: '#ef4444' },
      { range: '21–40%', min: 21, max: 40, count: 0, fill: '#f97316' },
      { range: '41–60%', min: 41, max: 60, count: 0, fill: '#f59e0b' },
      { range: '61–80%', min: 61, max: 80, count: 0, fill: '#22c55e' },
      { range: '81–100%', min: 81, max: 100, count: 0, fill: '#16a34a' },
    ];
    studentProgress.students.forEach(s => {
      const b = buckets.find(bk => s.progress >= bk.min && s.progress <= bk.max);
      if (b) b.count++;
    });
    return buckets;
  })();

  const finalAss   = assessmentData?.finalAssessment ?? {};
  const moduleAss  = assessmentData?.moduleAssessment ?? {};
  const scoreDist  = assessmentData?.scoreDistribution ?? [];
  const coursePerf = assessmentData?.coursePerformance ?? [];

  const engSummary    = engagementData?.summary ?? {};
  const topStudents   = engagementData?.topStudents ?? [];
  const atRiskStudents = engagementData?.atRiskList ?? [];

  const peakHours = behaviorData?.peakHours ?? [];
  const weekdays  = behaviorData?.weekdays ?? [];

  const genderDist  = (demoData?.genderDistribution ?? []).map(g => ({ ...g, label: g.gender === 'M' ? 'Male' : g.gender === 'F' ? 'Female' : (g.gender ?? 'Unspecified') }));
  const countryDist = demoData?.countryDistribution ?? [];
  const cohortDist  = demoData?.cohortDistribution ?? [];
  const regTrend    = demoData?.registrationTrend ?? [];

  const levelStats        = extData?.levelStats ?? [];
  const moduleProgressStats = extData?.moduleProgressStats ?? [];
  const certData          = certSummary ?? extData?.certificates ?? {};
  const ratingsData       = extData?.ratings ?? {};
  const streakData        = extData?.streaks ?? {};
  const gradingData       = extData?.grading ?? {};

  const ov = overview;

  // radial data for level funnel
  const radialData = levelStats.map((l, i) => ({
    name: l.label,
    value: l.totalStudents,
    fill: [LEVEL_COLORS.beginner, LEVEL_COLORS.intermediate, LEVEL_COLORS.advanced][i],
  }));

  // loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded-lg w-72" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}
          </div>
          <div className="h-12 bg-gray-200 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 h-64 bg-gray-200 rounded-xl" />
            <div className="h-64 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* ── Page header ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Admin</span>
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900">Analytics & Reporting</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Deep insights into student behaviour, module engagement, and platform performance
                {lastUpdated && <span className="ml-2 text-gray-400">· Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={loadAll}>
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Top KPI strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard icon={Users}         label="Total Students"  value={num(ov?.users?.students)}               color="indigo" />
          <KPICard icon={Activity}      label="Active (7d)"     value={num(engSummary.activeStudents)}         color="green"  />
          <KPICard icon={AlertTriangle} label="At Risk"         value={num(engSummary.atRiskStudents)}         color="amber"  />
          <KPICard icon={UserX}         label="Dormant"         value={num(engSummary.dormantStudents)}        color="red"    />
          <KPICard icon={Award}         label="Completion Rate" value={ov?.enrollments?.completionRate ?? '—'} color="teal"   />
          <KPICard icon={BookOpen}      label="Total Modules"   value={num(ov?.courses?.total)}                color="violet" />
        </div>

        {/* ── Level KPI strip ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {levelStats.map((l, i) => (
            <Card key={l.level} className="border border-gray-100 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${i === 0 ? 'bg-green-100 text-green-700' : i === 1 ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                    {l.label}
                  </div>
                  <GraduationCap className={`w-5 h-5 ${i === 0 ? 'text-green-500' : i === 1 ? 'text-indigo-500' : 'text-amber-500'}`} />
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div><div className="text-xl font-bold text-gray-900">{num(l.totalStudents)}</div><div className="text-[10px] text-gray-500">Students</div></div>
                  <div><div className="text-xl font-bold text-gray-900">{pct(l.completionRate)}</div><div className="text-[10px] text-gray-500">Completion</div></div>
                  <div><div className="text-xl font-bold text-gray-900">{pct(l.avgProgress)}</div><div className="text-[10px] text-gray-500">Avg Progress</div></div>
                </div>
                <ProgressBar value={l.completionRate} color={[LEVEL_COLORS.beginner, LEVEL_COLORS.intermediate, LEVEL_COLORS.advanced][i]} className="mt-3" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Main tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-4 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <TabsList className="h-12 bg-transparent gap-0 rounded-none p-0 flex w-max min-w-full">
                {[
                  { value: 'overview',      icon: BarChart3,     label: 'Overview'      },
                  { value: 'modules',       icon: BookOpen,      label: 'Modules'       },
                  { value: 'activity',      icon: Clock,         label: 'Activity'      },
                  { value: 'assessments',   icon: Target,        label: 'Assessments'   },
                  { value: 'engagement',    icon: Flame,         label: 'Engagement'    },
                  { value: 'certificates',  icon: ScrollText,    label: 'Certificates'  },
                  { value: 'ratings',       icon: Star,          label: 'Ratings'       },
                  { value: 'instructors',   icon: Users,         label: 'Instructors'   },
                  { value: 'demographics',  icon: Globe,         label: 'Demographics'  },
                  { value: 'fellows',       icon: GraduationCap, label: 'Fellows'       },
                  { value: 'performers',    icon: Trophy,        label: 'Top Performers'},
                  { value: 'submissions',   icon: FolderOpen,    label: 'Submissions'   },
                ].map(({ value, icon: Icon, label }) => (
                  <TabsTrigger key={value} value={value}
                    className="flex items-center gap-1.5 px-4 h-12 text-xs font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap">
                    <Icon className="w-3.5 h-3.5" />{label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* ═══════════════ OVERVIEW ═══════════════════════════════════════ */}
            <TabsContent value="overview" className="p-5 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Enrollment trend — interactive area */}
                <Card className="lg:col-span-2 border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Enrollment Trend — Last 6 Months</CardTitle>
                    <CardDescription className="text-xs">Enrollments, completions and active learners</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={enrollmentTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                          <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.25}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <ReTooltip content={<Tip />} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        <Area type="monotone" dataKey="enrollments" name="Enrollments" stroke="#6366f1" fill="url(#gE)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        <Area type="monotone" dataKey="completions" name="Completions" stroke="#22c55e" fill="url(#gC)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        <Area type="monotone" dataKey="active" name="Active" stroke="#f59e0b" fill="none" strokeWidth={2} strokeDasharray="5 3" dot={false} activeDot={{ r: 4 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Platform health */}
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm font-bold text-gray-900">Platform Health</CardTitle></CardHeader>
                  <CardContent className="px-4 pb-4 space-y-4">
                    {[
                      { label: 'Completion Rate',  value: parseFloat(ov?.enrollments?.completionRate ?? 0), color: '#22c55e' },
                      { label: 'Active Rate',       value: engSummary.activeRate ?? 0,                       color: '#6366f1' },
                      { label: 'Modules Published', value: ov?.courses?.total ? (ov.courses.published / ov.courses.total) * 100 : 0, color: '#f59e0b' },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-medium text-gray-700">{label}</span>
                          <span className="font-bold" style={{ color }}>{pct(value)}</span>
                        </div>
                        <ProgressBar value={value} color={color} />
                      </div>
                    ))}
                    <div className="pt-3 border-t border-gray-200 space-y-2">
                      {[
                        { label: 'Total Enrollments', val: num(ov?.enrollments?.total) },
                        { label: 'Completed',          val: num(ov?.enrollments?.completed) },
                        { label: 'In Progress',        val: num((ov?.enrollments?.total ?? 0) - (ov?.enrollments?.completed ?? 0)) },
                        { label: 'Instructors',        val: num(ov?.users?.instructors) },
                      ].map(({ label, val }) => (
                        <div key={label} className="flex justify-between text-xs">
                          <span className="text-gray-500">{label}</span>
                          <span className="font-bold text-gray-900">{val}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Progress distribution + country */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Student Progress Distribution</CardTitle>
                    <CardDescription className="text-xs">How far along are students in their modules?</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    {progressBuckets.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={progressBuckets} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="range" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <ReTooltip content={<Tip />} />
                          <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                            {progressBuckets.map((b, i) => <Cell key={i} fill={b.fill} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <Empty message="No student progress data" />}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Students by Country</CardTitle>
                    <CardDescription className="text-xs">Geographic distribution of learners</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    {countryDist.length > 0 ? (
                      <div className="space-y-2">
                        {countryDist.slice(0, 7).map((c, i) => {
                          const total = countryDist.reduce((s, x) => s + x.count, 0);
                          return (
                            <div key={c.country ?? i} className="flex items-center gap-3">
                              <span className="text-xs text-gray-400 w-4 font-medium">{i + 1}</span>
                              <div className="flex-1">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="font-medium text-gray-700">{c.country || 'Unknown'}</span>
                                  <span className="text-gray-500">{c.count} <span className="text-gray-400">({pct((c.count / total) * 100)})</span></span>
                                </div>
                                <ProgressBar value={(c.count / total) * 100} color={C[i % C.length]} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : <Empty message="No country data yet" />}
                  </CardContent>
                </Card>
              </div>

              {/* Engagement summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KPICard icon={Users}         label="Total Students"  value={num(engSummary.totalStudents)}  color="indigo" />
                <KPICard icon={CheckCircle}   label="Active (7 days)" value={num(engSummary.activeStudents)} color="green"  />
                <KPICard icon={AlertTriangle} label="At Risk (7-14d)" value={num(engSummary.atRiskStudents)} color="amber"  />
                <KPICard icon={UserX}         label="Dormant (30d+)"  value={num(engSummary.dormantStudents)} color="red"  />
              </div>

              {/* Streak & XP strip */}
              {streakData && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <KPICard icon={Flame}   label="Avg Streak"     value={`${fmt(streakData.avgCurrentStreak)}d`} color="orange" />
                  <KPICard icon={Trophy}  label="Longest Streak" value={`${num(streakData.maxLongestStreak)}d`} color="amber"  />
                  <KPICard icon={Zap}     label="Total XP"       value={num(streakData.totalXP)}               color="violet" />
                  <KPICard icon={Sparkles} label="On Streaks"    value={num(streakData.studentsWithStreak)}    color="sky"    />
                </div>
              )}
            </TabsContent>

            {/* ═══════════════ MODULES ════════════════════════════════════════ */}
            <TabsContent value="modules" className="p-5 space-y-6">
              <SectionHeader icon={BookOpen} title="Module Performance Analytics" description="Identify popular modules, difficult modules, and where students stop progressing" />

              {/* Most accessed + highest completion — interactive bar */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card ref={refMostAccessed} className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold text-gray-900">Most Accessed Modules</CardTitle>
                      <div className="flex items-center gap-2">
                        <Chip type="success"><TrendingUp className="w-3 h-3" /> Popular</Chip>
                        <ExportBtn targetRef={refMostAccessed} filename="most-accessed-modules" />
                      </div>
                    </div>
                    <CardDescription className="text-xs">Sorted by total student enrollments</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    {mostAccessed.length > 0 ? (
                      <ResponsiveContainer width="100%" height={mostAccessed.length * 52 + 20}>
                        <BarChart layout="vertical" data={mostAccessed} margin={{ top: 0, right: 55, left: 4, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis type="category" dataKey="courseName" axisLine={false} tickLine={false} width={200} tick={<YAxisWrappedTick width={200} />} />
                          <ReTooltip content={<Tip />} />
                          <Bar dataKey="totalEnrollments" name="Enrollments" fill="#6366f1" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 10, fill: '#6b7280' }} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <Empty message="No module data yet" />}
                  </CardContent>
                </Card>

                <Card ref={refHighestCompletion} className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold text-gray-900">Highest Completion Rates</CardTitle>
                      <div className="flex items-center gap-2">
                        <Chip type="success"><Medal className="w-3 h-3" /> Top Performers</Chip>
                        <ExportBtn targetRef={refHighestCompletion} filename="highest-completion-rates" />
                      </div>
                    </div>
                    <CardDescription className="text-xs">Modules where students successfully complete</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    {highestComp.length > 0 ? highestComp.map((m, i) => (
                      <div key={m.courseId ?? i} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                            <span className="text-xs font-medium text-gray-700">{trunc(m.courseName, 30)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{m.totalEnrollments} enrolled</span>
                            <span className="text-xs font-bold text-green-600">{pct(m.completionRate)}</span>
                          </div>
                        </div>
                        <ProgressBar value={m.completionRate} color="#22c55e" />
                      </div>
                    )) : <Empty message="No completion data" />}
                  </CardContent>
                </Card>
              </div>

              {/* ── Enrollment by Module table ── */}
              {allModules.length > 0 && (
                <Card ref={refEnrollmentByModule} className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-bold text-gray-900">Enrollment by Module</CardTitle>
                        <CardDescription className="text-xs">All modules ranked by number of enrolled students</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Chip type="info"><Users className="w-3 h-3" /> {allModules.length} modules</Chip>
                        <ExportBtn targetRef={refEnrollmentByModule} filename="enrollment-by-module" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-100">
                          <TableHead className="text-xs font-semibold text-gray-500 w-8">#</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500">Module</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Enrolled</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Completed</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Completion Rate</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Avg Progress</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...allModules]
                          .sort((a, b) => b.totalEnrollments - a.totalEnrollments)
                          .map((m, i) => {
                            const maxEnroll = allModules.reduce((mx, x) => Math.max(mx, x.totalEnrollments), 1);
                            const barPct = (m.totalEnrollments / maxEnroll) * 100;
                            return (
                              <TableRow key={m.courseId ?? i} className="border-gray-50">
                                <TableCell className="text-xs text-gray-400 font-medium">{i + 1}</TableCell>
                                <TableCell className="text-xs font-medium text-gray-800 max-w-[260px]">
                                  {m.courseName || '—'}
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="text-sm font-bold text-indigo-600">{num(m.totalEnrollments)}</span>
                                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full bg-indigo-400" style={{ width: `${barPct}%` }} />
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs text-center text-gray-600 font-medium">{num(m.completedCount ?? 0)}</TableCell>
                                <TableCell className="text-xs text-center">
                                  <div className="flex items-center gap-2 justify-center">
                                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full" style={{ width: `${Math.min(m.completionRate, 100)}%`, background: m.completionRate >= 60 ? '#22c55e' : m.completionRate >= 30 ? '#f59e0b' : '#ef4444' }} />
                                    </div>
                                    <span className={`font-semibold text-xs ${m.completionRate >= 60 ? 'text-green-600' : m.completionRate >= 30 ? 'text-amber-600' : 'text-red-500'}`}>{pct(m.completionRate)}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs text-center text-gray-600">{pct(m.avgProgress ?? 0)}</TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Per-module progress stats (from extended analytics) */}
              {moduleProgressStats.length > 0 && (
                <Card ref={refModuleProgress} className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-bold text-gray-900">Module Progress Stats</CardTitle>
                        <CardDescription className="text-xs">Detailed per-module breakdown including ratings, repeat rate and grading queue</CardDescription>
                      </div>
                      <ExportBtn targetRef={refModuleProgress} filename="module-progress-stats" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-100">
                          <TableHead className="text-xs font-semibold text-gray-500">#</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500">Module</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Level</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Enrolled</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Completion</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Avg Progress</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Rating</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Repeats</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {moduleProgressStats.slice(0, 15).map((m, i) => (
                          <TableRow key={m.moduleId ?? i} className="border-gray-50">
                            <TableCell className="text-xs text-gray-400 font-medium">{i + 1}</TableCell>
                            <TableCell className="text-xs font-medium text-gray-800">{trunc(m.title, 35)}</TableCell>
                            <TableCell className="text-center">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.level === 'beginner' ? 'bg-green-100 text-green-700' : m.level === 'intermediate' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                                {m.level === 'beginner' ? 'Basic' : m.level === 'intermediate' ? 'Intermediate' : 'Advanced'}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-center text-gray-600">{num(m.totalEnrollments)}</TableCell>
                            <TableCell className="text-xs text-center">
                              <div className="flex items-center gap-2 justify-center">
                                <div className="w-14 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${Math.min(m.completionRate, 100)}%`, background: m.completionRate >= 60 ? '#22c55e' : m.completionRate >= 30 ? '#f59e0b' : '#ef4444' }} />
                                </div>
                                <span className={`font-semibold text-xs ${m.completionRate >= 60 ? 'text-green-600' : m.completionRate >= 30 ? 'text-amber-600' : 'text-red-600'}`}>{pct(m.completionRate)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-center text-gray-600">{pct(m.avgProgress)}</TableCell>
                            <TableCell className="text-center">
                              {m.totalRatings > 0 ? <StarRating rating={m.avgRating} /> : <span className="text-xs text-gray-400">—</span>}
                            </TableCell>
                            <TableCell className="text-xs text-center">
                              {m.repeatCount > 0 ? <span className="text-amber-600 font-semibold">{m.repeatCount}</span> : <span className="text-gray-400">0</span>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Drop-off analysis */}
              <Card ref={refDropOff} className="border-0 shadow-none bg-gray-50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-gray-900">Drop-Off Risk Modules</CardTitle>
                      <CardDescription className="text-xs">High enrollments but low completion — students may be struggling</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Chip type="danger"><AlertTriangle className="w-3 h-3" /> Needs Attention</Chip>
                      <ExportBtn targetRef={refDropOff} filename="drop-off-risk-modules" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {dropOff.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-100">
                          <TableHead className="text-xs font-semibold text-gray-500 w-8">#</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500">Module</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Enrolled</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Completed</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Completion Rate</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Avg Progress</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Risk</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dropOff.map((m, i) => {
                          const risk = m.completionRate < 20 ? 'high' : m.completionRate < 40 ? 'medium' : 'low';
                          return (
                            <TableRow key={m.courseId ?? i} className="border-gray-50">
                              <TableCell className="text-xs text-gray-400 font-medium">{i + 1}</TableCell>
                              <TableCell className="text-xs font-medium text-gray-800">{trunc(m.courseName, 40)}</TableCell>
                              <TableCell className="text-xs text-center text-gray-600">{num(m.totalEnrollments)}</TableCell>
                              <TableCell className="text-xs text-center text-gray-600">{num(m.completedCount)}</TableCell>
                              <TableCell className="text-xs text-center">
                                <div className="flex items-center gap-2 justify-center">
                                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-red-400" style={{ width: `${Math.min(m.completionRate, 100)}%` }} />
                                  </div>
                                  <span className="font-semibold text-red-600">{pct(m.completionRate)}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-center text-gray-600">{pct(m.avgProgress)}</TableCell>
                              <TableCell className="text-center">
                                {risk === 'high'   && <Chip type="danger">High Risk</Chip>}
                                {risk === 'medium' && <Chip type="warning">Medium</Chip>}
                                {risk === 'low'    && <Chip type="info">Low</Chip>}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : <Empty message="No drop-off data available" />}
                </CardContent>
              </Card>

              {/* All modules completion bar */}
              <Card ref={refModuleOverview} className="border-0 shadow-none bg-gray-50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-gray-900">Module Completion Rates Overview</CardTitle>
                      <CardDescription className="text-xs">All modules ranked by completion percentage</CardDescription>
                    </div>
                    <ExportBtn targetRef={refModuleOverview} filename="module-completion-overview" />
                  </div>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  {allModules.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        data={[...allModules].sort((a, b) => b.completionRate - a.completionRate).slice(0, 12)}
                        margin={{ top: 5, right: 10, left: -20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="courseName" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" tickFormatter={v => trunc(v, 18)} />
                        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                        <ReTooltip content={<Tip />} />
                        <Bar dataKey="completionRate" name="Completion %" radius={[4, 4, 0, 0]}>
                          {allModules.map((m, i) => <Cell key={i} fill={m.completionRate >= 60 ? '#22c55e' : m.completionRate >= 30 ? '#f59e0b' : '#ef4444'} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <Empty />}
                </CardContent>
              </Card>

              {/* Level funnel radial */}
              {radialData.length > 0 && (
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Students by Level — Radial View</CardTitle>
                    <CardDescription className="text-xs">How many students are enrolled in each difficulty level</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-4 flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={240}>
                      <RadialBarChart cx="50%" cy="50%" innerRadius={40} outerRadius={110} data={radialData} startAngle={90} endAngle={-270}>
                        <RadialBar minAngle={15} dataKey="value" cornerRadius={6} label={{ position: 'insideStart', fill: '#fff', fontSize: 11, fontWeight: 700 }} />
                        <ReTooltip content={<Tip />} />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ═══════════════ ACTIVITY ═══════════════════════════════════════ */}
            <TabsContent value="activity" className="p-5 space-y-6">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <SectionHeader icon={Clock} title="Learning Activity Analytics" description="When students are most active — peak hours, active days, and learning trends" />
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['daily','weekly','monthly','quarterly','yearly'].map(p => (
                    <Button key={p} size="sm" variant={behaviorPeriod === p ? 'default' : 'outline'}
                      className={`h-7 px-3 text-xs capitalize ${behaviorPeriod === p ? 'bg-indigo-600 text-white hover:bg-indigo-700' : ''}`}
                      onClick={() => refreshBehavior(p)}>{p}</Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KPICard icon={Zap}      label="Peak Hour"         value={behaviorData?.peakHour ?? '—'}          color="amber"  />
                <KPICard icon={Calendar} label="Peak Day"          value={behaviorData?.peakDay ?? '—'}           color="indigo" />
                <KPICard icon={Activity} label="Total Completions" value={num(behaviorData?.totalCompletions)}    color="green"  />
                <KPICard icon={Users}    label="Active Students"   value={num(engSummary.activeStudents)}         color="sky"    />
              </div>

              <Card className="border-0 shadow-none bg-gray-50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-bold text-gray-900">Activity Heatmap — Peak Hours (24h)</CardTitle>
                  <CardDescription className="text-xs">Darker = more completions</CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-4"><HourHeatmap data={peakHours} /></CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Completions by Hour</CardTitle>
                    <CardDescription className="text-xs">Which hours see the most learning activity</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    {peakHours.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={peakHours} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="label" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <ReTooltip content={<Tip />} />
                          <Bar dataKey="completions" name="Completions" fill="#6366f1" radius={[3, 3, 0, 0]} />
                          <Bar dataKey="students"    name="Students"    fill="#e0e7ff" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <Empty message="No hourly data available" />}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Activity by Day of Week</CardTitle>
                    <CardDescription className="text-xs">Which days are students most active</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    {weekdays.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={weekdays} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <ReTooltip content={<Tip />} />
                          <Bar dataKey="completions" name="Completions" radius={[4, 4, 0, 0]}>
                            {weekdays.map((d, i) => <Cell key={i} fill={C[i % C.length]} />)}
                          </Bar>
                          <Bar dataKey="students" name="Students" fill="#e0e7ff" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <Empty message="No daily data available" />}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: Zap,     title: 'Peak Learning Time', body: behaviorData?.peakHour ? `Students are most active at ${behaviorData.peakHour}. Schedule notifications and live sessions around this time.` : 'Data will appear once students engage.', color: 'amber' },
                  { icon: Calendar, title: 'Most Active Day',   body: behaviorData?.peakDay  ? `${behaviorData.peakDay} sees the highest engagement. Plan releases for this day.` : 'Engage students consistently throughout the week.', color: 'indigo' },
                  { icon: Brain,   title: 'Learning Behaviour', body: behaviorData?.totalCompletions ? `${num(behaviorData.totalCompletions)} completions recorded this ${behaviorPeriod}.` : 'Insights will appear as students complete activities.', color: 'green' },
                ].map(({ icon: Icon, title, body, color }) => (
                  <Card key={title} className="border-0 shadow-none bg-gray-50">
                    <CardContent className="p-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${color === 'amber' ? 'bg-amber-50' : color === 'indigo' ? 'bg-indigo-50' : 'bg-green-50'}`}>
                        <Icon className={`w-4 h-4 ${color === 'amber' ? 'text-amber-600' : color === 'indigo' ? 'text-indigo-600' : 'text-green-600'}`} />
                      </div>
                      <h4 className="text-xs font-bold text-gray-900 mb-1">{title}</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* ═══════════════ ASSESSMENTS ════════════════════════════════════ */}
            <TabsContent value="assessments" className="p-5 space-y-6">
              <SectionHeader icon={Target} title="Assessment Analytics" description="Track quiz performance, pass rates, retakes, and identify difficult assessments" />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KPICard icon={Star}        label="Final Avg Score"  value={pct(finalAss.avgScore)}    color="indigo" />
                <KPICard icon={CheckCircle} label="Final Pass Rate"  value={pct(finalAss.passRate)}    color="green"  />
                <KPICard icon={RefreshCw}   label="Retake Rate"      value={pct(finalAss.retakeRate)}  color="amber"  />
                <KPICard icon={Activity}    label="Module Avg Score" value={pct(moduleAss.avgScore)}   color="violet" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Score Distribution</CardTitle>
                    <CardDescription className="text-xs">How students are scoring across all assessments</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    {scoreDist.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={scoreDist} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="range" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <ReTooltip content={<Tip />} />
                          <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                            {scoreDist.map((_, i) => <Cell key={i} fill={C[i % C.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <Empty message="No score distribution data" />}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Final Assessment: Pass / Fail</CardTitle>
                    <CardDescription className="text-xs">Overall pass vs fail for final assessments</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    {(finalAss.passedCount || finalAss.totalAttempted) ? (
                      <div className="flex items-center gap-4">
                        <ResponsiveContainer width={180} height={180}>
                          <PieChart>
                            <Pie data={[{ name: 'Passed', value: finalAss.passedCount ?? 0 }, { name: 'Failed', value: (finalAss.totalAttempted ?? 0) - (finalAss.passedCount ?? 0) }]}
                              cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                              <Cell fill="#22c55e" /><Cell fill="#ef4444" />
                            </Pie>
                            <ReTooltip content={<Tip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-3 flex-1">
                          {[
                            { label: 'Passed', value: finalAss.passedCount ?? 0, color: '#22c55e' },
                            { label: 'Failed',  value: (finalAss.totalAttempted ?? 0) - (finalAss.passedCount ?? 0), color: '#ef4444' },
                          ].map(item => (
                            <div key={item.label}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: item.color }} /><span className="font-medium text-gray-700">{item.label}</span></span>
                                <span className="font-bold text-gray-900">{num(item.value)}</span>
                              </div>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-gray-200 space-y-1 text-xs">
                            <div className="flex justify-between"><span className="text-gray-500">Total Attempted</span><span className="font-bold text-gray-900">{num(finalAss.totalAttempted)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Avg Attempts</span><span className="font-bold text-gray-900">{fmt(finalAss.avgAttempts)}</span></div>
                          </div>
                        </div>
                      </div>
                    ) : <Empty message="No assessment data yet" />}
                  </CardContent>
                </Card>
              </div>

              {/* Final vs Module breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {[
                  { title: 'Final Assessment Breakdown', color: '#6366f1', data: [
                    { label: 'Average Score', value: pct(finalAss.avgScore), raw: finalAss.avgScore },
                    { label: 'Pass Rate', value: pct(finalAss.passRate), raw: finalAss.passRate },
                    { label: 'Retake Rate', value: pct(finalAss.retakeRate), raw: finalAss.retakeRate },
                    { label: 'Avg Attempts', value: fmt(finalAss.avgAttempts), raw: null },
                  ]},
                  { title: 'Module Assessment Breakdown', color: '#8b5cf6', data: [
                    { label: 'Average Score', value: pct(moduleAss.avgScore), raw: moduleAss.avgScore },
                    { label: 'Pass Rate', value: pct(moduleAss.passRate), raw: moduleAss.passRate },
                    { label: 'Retake Rate', value: pct(moduleAss.retakeRate), raw: moduleAss.retakeRate },
                    { label: 'Total Attempted', value: num(moduleAss.totalAttempted), raw: null },
                  ]},
                ].map(({ title, color, data }) => (
                  <Card key={title} className="border-0 shadow-none bg-gray-50">
                    <CardContent className="p-5">
                      <h4 className="text-xs font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: color }} />{title}
                      </h4>
                      <div className="space-y-3">
                        {data.map(({ label, value, raw }) => (
                          <div key={label}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-600 font-medium">{label}</span>
                              <span className="font-bold" style={{ color }}>{value}</span>
                            </div>
                            {raw !== null && <ProgressBar value={raw} color={color} />}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Per-module assessment table */}
              {coursePerf.length > 0 && (
                <Card ref={refAssessmentPerf} className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-bold text-gray-900">Assessment Performance by Module</CardTitle>
                        <CardDescription className="text-xs">Strongest and weakest assessment results per module</CardDescription>
                      </div>
                      <ExportBtn targetRef={refAssessmentPerf} filename="assessment-performance-by-module" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-100">
                          <TableHead className="text-xs font-semibold text-gray-500">#</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500">Module</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Avg Score</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Pass Rate</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Avg Attempts</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Attempted</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...coursePerf].sort((a, b) => b.avgScore - a.avgScore).map((c, i) => (
                          <TableRow key={c.courseId ?? i} className="border-gray-50">
                            <TableCell className="text-xs text-gray-400 font-medium">{i + 1}</TableCell>
                            <TableCell className="text-xs font-medium text-gray-800">{trunc(c.courseName, 35)}</TableCell>
                            <TableCell className="text-xs text-center"><span className={`font-bold ${c.avgScore >= 70 ? 'text-green-600' : c.avgScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{pct(c.avgScore)}</span></TableCell>
                            <TableCell className="text-xs text-center"><span className={`font-semibold ${c.passRate >= 70 ? 'text-green-600' : c.passRate >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{pct(c.passRate)}</span></TableCell>
                            <TableCell className="text-xs text-center text-gray-600">{fmt(c.avgAttempts)}</TableCell>
                            <TableCell className="text-xs text-center text-gray-600">{num(c.totalAttempted)}</TableCell>
                            <TableCell className="text-center">
                              {c.passRate >= 70 ? <Chip type="success">Strong</Chip> : c.passRate >= 50 ? <Chip type="warning">Average</Chip> : <Chip type="danger">Struggling</Chip>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ═══════════════ ENGAGEMENT ═════════════════════════════════════ */}
            <TabsContent value="engagement" className="p-5 space-y-6">
              <SectionHeader icon={Flame} title="Student Engagement Analytics" description="Active students, at-risk learners, and overall engagement health" />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KPICard icon={Users}         label="Total Students"  value={num(engSummary.totalStudents)}    color="indigo" />
                <KPICard icon={CheckCircle}   label="Active (7 days)" value={num(engSummary.activeStudents)}  color="green"  />
                <KPICard icon={AlertTriangle} label="At Risk (7-14d)" value={num(engSummary.atRiskStudents)}  color="amber"  />
                <KPICard icon={UserX}         label="Dormant (30d+)"  value={num(engSummary.dormantStudents)} color="red"    />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm font-bold text-gray-900">Engagement Distribution</CardTitle></CardHeader>
                  <CardContent className="px-2 pb-4">
                    {engSummary.totalStudents > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie data={[{ name: 'Active', value: engSummary.activeStudents ?? 0 }, { name: 'At Risk', value: engSummary.atRiskStudents ?? 0 }, { name: 'Dormant', value: engSummary.dormantStudents ?? 0 }]}
                              cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={2}>
                              <Cell fill="#22c55e" /><Cell fill="#f59e0b" /><Cell fill="#ef4444" />
                            </Pie>
                            <ReTooltip content={<Tip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-1.5 mt-2">
                          {[{ label: 'Active', val: engSummary.activeStudents, color: '#22c55e' }, { label: 'At Risk', val: engSummary.atRiskStudents, color: '#f59e0b' }, { label: 'Dormant', val: engSummary.dormantStudents, color: '#ef4444' }].map(item => (
                            <div key={item.label} className="flex justify-between text-xs">
                              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: item.color }} /><span className="text-gray-600">{item.label}</span></span>
                              <span className="font-bold text-gray-900">{num(item.val)}</span>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-gray-100 flex justify-between text-xs">
                            <span className="text-gray-500 font-medium">Engagement Rate</span>
                            <span className="font-bold text-indigo-600">{pct(engSummary.activeRate)}</span>
                          </div>
                        </div>
                      </>
                    ) : <Empty message="No engagement data" />}
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2 border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold text-gray-900">Most Active Students</CardTitle>
                      <Chip type="success"><Star className="w-3 h-3" /> Top Performers</Chip>
                    </div>
                    <CardDescription className="text-xs">Students with the highest engagement scores</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    {topStudents.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-100">
                            <TableHead className="text-xs font-semibold text-gray-500">#</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500">Student</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 text-center">Progress</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 text-center">Completed</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 text-center">Score</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500">Last Active</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {topStudents.slice(0, 8).map((s, i) => (
                            <TableRow key={s.email ?? i} className="border-gray-50">
                              <TableCell className="text-xs text-gray-400 font-medium">{i + 1}</TableCell>
                              <TableCell><div><p className="text-xs font-medium text-gray-800">{s.name || '—'}</p><p className="text-xs text-gray-400">{s.email}</p></div></TableCell>
                              <TableCell className="text-xs text-center">
                                <div className="flex items-center gap-1.5 justify-center">
                                  <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(s.avgProgress, 100)}%` }} /></div>
                                  <span className="font-semibold text-indigo-600">{pct(s.avgProgress)}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-center text-gray-600">{s.completedCourses}/{s.totalEnrollments}</TableCell>
                              <TableCell className="text-xs text-center"><span className="font-bold text-indigo-600">{fmt(s.engagementScore)}</span></TableCell>
                              <TableCell className="text-xs text-gray-500">{s.lastActive ? new Date(s.lastActive).toLocaleDateString() : '—'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : <Empty message="No active students data" />}
                  </CardContent>
                </Card>
              </div>

              {/* At-risk */}
              <Card className="border-0 shadow-none bg-gray-50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-gray-900">Students Needing Intervention</CardTitle>
                      <CardDescription className="text-xs">Inactive or at-risk students — consider reaching out to re-engage</CardDescription>
                    </div>
                    <Chip type="danger"><AlertTriangle className="w-3 h-3" /> Action Required</Chip>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {atRiskStudents.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-100">
                          <TableHead className="text-xs font-semibold text-gray-500">#</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500">Student</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500">Country</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Progress</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Modules at Risk</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Days Inactive</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {atRiskStudents.map((s, i) => (
                          <TableRow key={s.email ?? i} className="border-gray-50">
                            <TableCell className="text-xs text-gray-400 font-medium">{i + 1}</TableCell>
                            <TableCell><div><p className="text-xs font-medium text-gray-800">{s.name || '—'}</p><p className="text-xs text-gray-400">{s.email}</p></div></TableCell>
                            <TableCell className="text-xs text-gray-600"><span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" />{s.country || '—'}</span></TableCell>
                            <TableCell className="text-xs text-center"><span className="font-semibold text-amber-600">{pct(s.avgProgress)}</span></TableCell>
                            <TableCell className="text-xs text-center text-gray-600">{s.coursesAtRisk}</TableCell>
                            <TableCell className="text-xs text-center"><span className={`font-bold ${s.daysInactive >= 30 ? 'text-red-600' : s.daysInactive >= 14 ? 'text-amber-600' : 'text-orange-500'}`}>{s.daysInactive}d</span></TableCell>
                            <TableCell className="text-center"><RiskBadge daysInactive={s.daysInactive} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
                      <p className="text-sm font-medium text-gray-700">All students are actively engaged!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══════════════ CERTIFICATES ════════════════════════════════════ */}
            <TabsContent value="certificates" className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <SectionHeader icon={ScrollText} title="Certificate Analytics" description="Beginner level achievement — export for your report" />
                <ExportBtn targetRef={refCertInfographic} filename="arin-beginner-certificate-report" />
              </div>

              {/* ── INFOGRAPHIC ───────────────────────────────────────────────── */}
              <div ref={refCertInfographic} className="bg-white border border-gray-200 rounded-2xl overflow-hidden" style={{ fontFamily: 'system-ui, sans-serif' }}>

                {/* ① Header */}
                <div className="px-8 pt-7 pb-5 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400">ARIN Publishing Academy · AI for Climate Resilience Programme</p>
                      <h2 className="mt-1 text-2xl font-black text-gray-900 tracking-tight">Beginner Certificate Achievement</h2>
                    </div>
                    <p className="text-xs text-gray-400 whitespace-nowrap mt-1">
                      {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* ② Main body */}
                <div className="grid grid-cols-5 gap-0">

                  {/* Left — donut + big number */}
                  <div className="col-span-2 flex flex-col items-center justify-center py-10 px-6 border-r border-gray-100">
                    <div className="relative">
                      <ResponsiveContainer width={180} height={180}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Issued',   value: certData.byLevel?.beginner?.issued  ?? 0 },
                              { name: 'Remaining', value: Math.max(0, (certData.byLevel?.beginner?.total ?? 0) - (certData.byLevel?.beginner?.issued ?? 0)) },
                            ]}
                            cx="50%" cy="50%"
                            innerRadius={62} outerRadius={82}
                            startAngle={90} endAngle={-270}
                            dataKey="value" strokeWidth={0}
                          >
                            <Cell fill="#4f46e5" />
                            <Cell fill="#e8e9ff" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Centre label */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-4xl font-black text-gray-900 leading-none">{certData.byLevel?.beginner?.issued ?? 0}</span>
                        <span className="text-[10px] font-semibold text-gray-400 mt-0.5">issued</span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm font-bold text-gray-700 text-center">Beginner Certificates</p>
                    <p className="text-xs text-gray-400 text-center mt-0.5">out of {certData.byLevel?.beginner?.total ?? 0} completions</p>
                  </div>

                  {/* Right — stat grid + bars */}
                  <div className="col-span-3 py-8 px-8 space-y-6">

                    {/* KPI row */}
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: certData.byLevel?.beginner?.issued ?? 0, label: 'Certificates\nIssued',    color: '#4f46e5' },
                        { value: certData.byLevel?.beginner?.total  ?? 0, label: 'Fellows\nCompleted',     color: '#0891b2' },
                        { value: `${certData.byLevel?.beginner?.total > 0 ? Math.round(((certData.byLevel?.beginner?.issued ?? 0) / certData.byLevel.beginner.total) * 100) : 0}%`,
                          label: 'Certification\nRate', color: '#059669' },
                      ].map(({ value, label, color }) => (
                        <div key={label} className="text-center">
                          <div className="text-3xl font-black leading-none" style={{ color }}>{value}</div>
                          <div className="text-[10px] text-gray-500 mt-1 whitespace-pre-line font-medium leading-tight">{label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100" />

                    {/* Level breakdown bars */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Certificate Status by Level</p>
                      {[
                        { label: 'Beginner',     issued: certData.byLevel?.beginner?.issued     ?? 0, pending: certData.byLevel?.beginner?.pending     ?? 0, color: '#4f46e5' },
                        { label: 'Intermediate', issued: certData.byLevel?.intermediate?.issued ?? 0, pending: certData.byLevel?.intermediate?.pending ?? 0, color: '#0891b2' },
                        { label: 'Advanced',     issued: certData.byLevel?.advanced?.issued     ?? 0, pending: certData.byLevel?.advanced?.pending     ?? 0, color: '#059669' },
                      ].map(({ label, issued, pending, color }) => {
                        const total = issued + pending;
                        const pct   = total > 0 ? Math.round((issued / total) * 100) : 0;
                        return (
                          <div key={label}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-gray-600">{label}</span>
                              <span className="text-xs text-gray-400">{issued} issued{pending > 0 ? ` · ${pending} pending` : ''}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${total > 0 ? pct : (issued > 0 ? 100 : 0)}%`, background: color }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ③ Monthly trend */}
                <div className="px-8 pb-7 border-t border-gray-100">
                  <div className="flex items-center justify-between pt-5 mb-4">
                    <div>
                      <p className="text-sm font-bold text-gray-800">Monthly Certificate Issuance</p>
                      <p className="text-xs text-gray-400">Last 12 months</p>
                    </div>
                    <TrendingUp className="w-4 h-4 text-gray-300" />
                  </div>
                  {certData.monthlyTrend?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={certData.monthlyTrend} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gCertIG" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#4f46e5" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}    />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <ReTooltip content={<Tip />} />
                        <Area type="monotone" dataKey="count" name="Certificates Issued" stroke="#4f46e5" fill="url(#gCertIG)" strokeWidth={2} dot={{ fill: '#4f46e5', r: 3, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[160px] flex items-center justify-center text-xs text-gray-400">
                      Trend data will appear as certificates are issued
                    </div>
                  )}
                </div>

                {/* ④ Footer */}
                <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-500 italic max-w-lg">
                    <span className="font-bold not-italic text-gray-700">{certData.byLevel?.beginner?.issued ?? 0} fellows</span> have successfully completed all beginner-level modules and received their ARIN certificates of achievement.
                  </p>
                  <div className="flex items-center gap-1.5 ml-6 flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Verified · ARIN LMS</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ═══════════════ RATINGS ════════════════════════════════════════ */}
            <TabsContent value="ratings" className="p-5 space-y-6">
              <SectionHeader icon={Star} title="Module Ratings & Feedback" description="Student satisfaction scores — only students who complete a module can rate it" />

              {/* Summary banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Big avg rating card */}
                <Card className="sm:col-span-1 border border-amber-100 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-sm">
                  <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-2">
                    <div className="text-5xl font-extrabold text-amber-500">{ratingsData.overallAvgRating ?? 0}</div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-5 h-5 ${i < Math.round(ratingsData.overallAvgRating ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                      ))}
                    </div>
                    <div className="text-xs font-semibold text-amber-700">Platform Average</div>
                    <div className="text-xs text-gray-500">out of 5.0</div>
                  </CardContent>
                </Card>

                {/* Breakdown counts */}
                <Card className="sm:col-span-2 border border-gray-100 shadow-sm">
                  <CardContent className="p-5 grid grid-cols-3 gap-4 h-full">
                    {[
                      { label: 'Rated Modules',   value: ratingsData.ratedModulesCount ?? 0,   icon: ThumbsUp,   color: 'text-green-600 bg-green-50' },
                      { label: 'Unrated Modules',  value: ratingsData.unratedModulesCount ?? 0, icon: ThumbsDown, color: 'text-red-500 bg-red-50'    },
                      { label: 'Total Published',  value: (ratingsData.ratedModulesCount ?? 0) + (ratingsData.unratedModulesCount ?? 0), icon: BookOpen, color: 'text-indigo-600 bg-indigo-50' },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className="flex flex-col items-center justify-center text-center gap-2 p-3 rounded-xl bg-gray-50">
                        <div className={`p-2 rounded-lg ${color}`}><Icon className="w-4 h-4" /></div>
                        <div className="text-2xl font-bold text-gray-900">{num(value)}</div>
                        <div className="text-xs text-gray-500 font-medium">{label}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {ratingsData.topRated?.length > 0 ? (
                <>
                  {/* Top rated module cards */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-900">Most Liked Modules</h3>
                      <Chip type="success"><Star className="w-3 h-3" /> Top Rated</Chip>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {ratingsData.topRated.slice(0, 8).map((m, i) => (
                        <Card key={m._id ?? i} className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${m.level === 'beginner' ? 'bg-green-100 text-green-700' : m.level === 'intermediate' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                                {m.level === 'beginner' ? 'Basic' : m.level === 'intermediate' ? 'Intermediate' : 'Advanced'}
                              </span>
                              <span className="text-[10px] text-gray-400">#{i + 1}</span>
                            </div>
                            <p className="text-xs font-semibold text-gray-800 leading-snug mb-3 line-clamp-2 min-h-[32px]">{m.title}</p>
                            <StarRating rating={m.avgRating} />
                            <div className="flex items-center justify-between mt-2 text-[10px] text-gray-400">
                              <span>{m.totalRatings} reviews</span>
                              <span>{m.enrollmentCount ?? 0} enrolled</span>
                            </div>
                            <ProgressBar value={(m.avgRating / 5) * 100} color={`hsl(${45 - i * 4}, 90%, 52%)`} className="mt-2" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Lowest rated */}
                  {ratingsData.bottomRated?.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-900">Lowest Rated — Needs Review</h3>
                        <Chip type="danger"><AlertTriangle className="w-3 h-3" /> Action</Chip>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {ratingsData.bottomRated.map((m, i) => (
                          <Card key={m._id ?? i} className="border border-red-100 bg-red-50/30 shadow-sm">
                            <CardContent className="p-4 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-red-600">{Number(m.avgRating ?? 0).toFixed(1)}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800 truncate">{trunc(m.title, 30)}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{m.totalRatings} reviews</p>
                                <StarRating rating={m.avgRating} />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Card className="border border-dashed border-gray-200 bg-gray-50/50">
                  <CardContent className="py-16 flex flex-col items-center text-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
                      <Star className="w-7 h-7 text-amber-300" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">No ratings yet</p>
                    <p className="text-xs text-gray-400 max-w-xs">Students can rate a module only after completing it. Ratings will appear here once completions are recorded.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ═══════════════ INSTRUCTORS ════════════════════════════════════ */}
            <TabsContent value="instructors" className="p-5 space-y-6">
              <SectionHeader icon={Users} title="Instructor Analytics" description="Module counts, students taught, completion rates, and grading queue" />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KPICard icon={Users}         label="Total Instructors"  value={num(ov?.users?.instructors)}             color="indigo" />
                <KPICard icon={ClipboardList} label="Pending Grading"    value={num(gradingData.totalPendingGrading)}   color="amber"  />
                <KPICard icon={BookOpen}      label="Published Modules"  value={num(ov?.courses?.published)}            color="green"  />
                <KPICard icon={Target}        label="Modules Published"  value={num(ov?.courses?.total)}                color="violet" />
              </div>

              {/* Instructor leaderboard bar chart */}
              {gradingData.instructorLeaderboard?.length > 0 && (
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Instructor Leaderboard — Students Taught</CardTitle>
                    <CardDescription className="text-xs">Ranked by total students enrolled in their published modules</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    <ResponsiveContainer width="100%" height={Math.min(gradingData.instructorLeaderboard.length * 38 + 40, 360)}>
                      <BarChart layout="vertical" data={gradingData.instructorLeaderboard.slice(0, 10).map(i => ({ ...i, name: trunc(i.name, 22) }))} margin={{ top: 0, right: 60, left: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={140} />
                        <ReTooltip content={<Tip />} />
                        <Bar dataKey="studentsTaught" name="Students Taught" fill="#6366f1" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 10, fill: '#6b7280' }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Instructor table */}
              {gradingData.instructorLeaderboard?.length > 0 && (
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Instructor Details</CardTitle>
                    <CardDescription className="text-xs">Published modules, students taught, and avg completion rate</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-100">
                          <TableHead className="text-xs font-semibold text-gray-500">#</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500">Instructor</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Modules</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Students</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Avg Completion</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500">Last Login</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gradingData.instructorLeaderboard.map((inst, i) => (
                          <TableRow key={inst.email ?? i} className="border-gray-50">
                            <TableCell className="text-xs text-gray-400 font-medium">{i + 1}</TableCell>
                            <TableCell>
                              <div>
                                <p className="text-xs font-medium text-gray-800">{inst.name}</p>
                                <p className="text-xs text-gray-400">{inst.email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-center text-gray-600">{inst.publishedModules}</TableCell>
                            <TableCell className="text-xs text-center text-gray-600">{num(inst.studentsTaught)}</TableCell>
                            <TableCell className="text-xs text-center">
                              <span className={`font-semibold ${inst.avgCompletionRate >= 60 ? 'text-green-600' : inst.avgCompletionRate >= 30 ? 'text-amber-600' : 'text-red-600'}`}>
                                {pct(inst.avgCompletionRate)}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-gray-500">{inst.lastLogin ? new Date(inst.lastLogin).toLocaleDateString() : '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ═══════════════ DEMOGRAPHICS ════════════════════════════════════ */}
            <TabsContent value="demographics" className="p-5 space-y-6">

              {/* ── Page title ── */}
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-xl mt-0.5"><Globe className="w-5 h-5 text-indigo-600" /></div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Demographic Analytics</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Understand who your students are — where they come from, gender balance, cohort spread, and growth trends</p>
                </div>
              </div>

              {/* ── Summary KPI strip ── */}
              {(() => {
                const totalStudents = genderDist.reduce((s, g) => s + g.count, 0) || countryDist.reduce((s, c) => s + c.count, 0);
                const topCountry = countryDist[0];
                const male   = genderDist.find(g => g.gender === 'M');
                const female = genderDist.find(g => g.gender === 'F');
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <KPICard icon={Globe}     label="Countries Represented" value={num(countryDist.length)}                                                       color="indigo" />
                    <KPICard icon={MapPin}    label="Top Country"           value={topCountry?.country || '—'} sub={topCountry ? `${num(topCountry.count)} students` : ''} color="teal" />
                    <KPICard icon={Users}     label="Male Students"         value={male   ? `${pct((male.count   / totalStudents) * 100)}` : '—'} sub={male   ? `${num(male.count)} students`   : ''} color="sky"   />
                    <KPICard icon={Users}     label="Female Students"       value={female ? `${pct((female.count / totalStudents) * 100)}` : '—'} sub={female ? `${num(female.count)} students` : ''} color="violet"/>
                  </div>
                );
              })()}

              {/* ── Map + Top Countries side by side ── */}
              <div ref={refGeoSection} className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                {/* Map — wider (3/5) */}
                <Card className="lg:col-span-3 border border-gray-100 shadow-sm">
                  <CardHeader className="pb-3 pt-4 px-5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <CardTitle className="text-base font-bold text-gray-900">Geographic Distribution</CardTitle>
                        <CardDescription className="text-xs mt-0.5">Bubble size = number of students · Click a bubble for details</CardDescription>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" /> Top</span>
                          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> High</span>
                          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> Others</span>
                        </div>
                        <ExportBtn targetRef={refGeoSection} filename="geographic-distribution" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <DemographicsMap countryData={countryDist} />
                  </CardContent>
                </Card>

                {/* Top Countries ranked list (2/5) */}
                <Card className="lg:col-span-2 border border-gray-100 shadow-sm">
                  <CardHeader className="pb-3 pt-4 px-5">
                    <CardTitle className="text-base font-bold text-gray-900">Top Countries</CardTitle>
                    <CardDescription className="text-xs mt-0.5">Ranked by enrollment count</CardDescription>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    {countryDist.length > 0 ? (() => {
                      const total = countryDist.reduce((s, c) => s + c.count, 0);
                      const rankColors = ['bg-indigo-500', 'bg-teal-500', 'bg-amber-500'];
                      return (
                        <div className="divide-y divide-gray-50">
                          {countryDist.slice(0, 10).map((c, i) => {
                            const share = (c.count / total) * 100;
                            const barColor = C[i % C.length];
                            return (
                              <div key={c.country ?? i} className="py-3 first:pt-0 last:pb-0">
                                {/* Row 1: rank + name + count + pct */}
                                <div className="flex items-center gap-3 mb-2">
                                  <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-extrabold text-white ${rankColors[i] ?? 'bg-gray-400'}`}>
                                    {i + 1}
                                  </span>
                                  <span className="flex-1 text-sm font-semibold text-gray-800 min-w-0">{c.country || 'Unknown'}</span>
                                  <span className="text-sm font-bold text-gray-900 flex-shrink-0">{num(c.count)}</span>
                                  <span className="text-xs font-semibold w-11 text-right flex-shrink-0" style={{ color: barColor }}>{pct(share)}</span>
                                </div>
                                {/* Row 2: progress bar */}
                                <div className="ml-9 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all" style={{ width: `${share}%`, background: barColor }} />
                                </div>
                              </div>
                            );
                          })}
                          {countryDist.length > 10 && (
                            <p className="text-xs text-gray-400 pt-3 border-t border-gray-100">
                              +{countryDist.length - 10} more countries — see full table below
                            </p>
                          )}
                        </div>
                      );
                    })() : <Empty message="No country data yet" />}
                  </CardContent>
                </Card>
              </div>

              {/* ── Gender + Cohort side by side ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Gender distribution — visual cards */}
                <Card ref={refGenderDist} className="border border-gray-100 shadow-sm">
                  <CardHeader className="pb-3 pt-4 px-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-bold text-gray-900">Gender Distribution</CardTitle>
                        <CardDescription className="text-xs mt-0.5">Student breakdown by gender</CardDescription>
                      </div>
                      <ExportBtn targetRef={refGenderDist} filename="gender-distribution" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    {genderDist.length > 0 ? (() => {
                      const total = genderDist.reduce((s, g) => s + g.count, 0);
                      const GENDER_COLORS = ['#6366f1', '#f472b6', '#94a3b8'];
                      return (
                        <div className="space-y-5">
                          {/* Stacked bar */}
                          <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
                            {genderDist.map((g, i) => (
                              <div key={g.gender ?? i} title={`${g.label}: ${num(g.count)}`}
                                style={{ width: `${(g.count / total) * 100}%`, background: GENDER_COLORS[i % GENDER_COLORS.length] }}
                                className="h-full transition-all" />
                            ))}
                          </div>
                          {/* Big stat cards per gender */}
                          <div className="grid grid-cols-2 gap-4">
                            {genderDist.map((g, i) => {
                              const share = (g.count / total) * 100;
                              const color = GENDER_COLORS[i % GENDER_COLORS.length];
                              return (
                                <div key={g.gender ?? i} className="rounded-xl p-4 border" style={{ borderColor: color + '33', background: color + '08' }}>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-gray-700">{g.label}</span>
                                    <span className="w-3 h-3 rounded-full" style={{ background: color }} />
                                  </div>
                                  <div className="text-3xl font-extrabold text-gray-900">{num(g.count)}</div>
                                  <div className="text-sm font-bold mt-1" style={{ color }}>{pct(share)} of total</div>
                                </div>
                              );
                            })}
                          </div>
                          {/* Donut */}
                          <ResponsiveContainer width="100%" height={130}>
                            <PieChart>
                              <Pie data={genderDist.map((g, i) => ({ ...g, name: g.label, fill: GENDER_COLORS[i] }))}
                                cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="count" paddingAngle={3}>
                                {genderDist.map((_, i) => <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} />)}
                              </Pie>
                              <ReTooltip content={<Tip />} />
                              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    })() : <Empty message="No gender data yet" />}
                  </CardContent>
                </Card>

                {/* Cohort distribution */}
                <Card className="border border-gray-100 shadow-sm">
                  <CardHeader className="pb-3 pt-4 px-5">
                    <CardTitle className="text-base font-bold text-gray-900">Students by Cohort</CardTitle>
                    <CardDescription className="text-xs mt-0.5">How fellows are distributed across cohorts</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    {cohortDist.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={cohortDist} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="cohort" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <ReTooltip content={<Tip />} />
                          <Bar dataKey="count" name="Students" radius={[5, 5, 0, 0]} maxBarSize={48}>
                            {cohortDist.map((_, i) => <Cell key={i} fill={C[i % C.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <Empty message="No cohort data available" />}
                  </CardContent>
                </Card>
              </div>

              {/* ── Registration trend (area) + Certs vs Registrations ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                <Card className="border border-gray-100 shadow-sm">
                  <CardHeader className="pb-3 pt-4 px-5">
                    <CardTitle className="text-base font-bold text-gray-900">New Student Registrations</CardTitle>
                    <CardDescription className="text-xs mt-0.5">Monthly sign-up growth over the last 12 months</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    {regTrend.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={regTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gReg" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <ReTooltip content={<Tip />} />
                          <Area type="monotone" dataKey="count" name="New Students" stroke="#6366f1" fill="url(#gReg)" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : <Empty message="No registration trend data" />}
                  </CardContent>
                </Card>

                <Card className="border border-gray-100 shadow-sm">
                  <CardHeader className="pb-3 pt-4 px-5">
                    <CardTitle className="text-base font-bold text-gray-900">Registrations vs Certificates</CardTitle>
                    <CardDescription className="text-xs mt-0.5">Are students completing what they sign up for?</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    {(regTrend.length > 0 || certData.monthlyTrend?.length > 0) ? (() => {
                      const regMap  = Object.fromEntries((regTrend ?? []).map(r => [r.label, r.count]));
                      const certMap = Object.fromEntries((certData.monthlyTrend ?? []).map(c => [c.label, c.count]));
                      const allLabels = Array.from(new Set([...Object.keys(regMap), ...Object.keys(certMap)])).sort();
                      const merged = allLabels.slice(-12).map(label => ({ label, registrations: regMap[label] ?? 0, certificates: certMap[label] ?? 0 }));
                      return (
                        <ResponsiveContainer width="100%" height={220}>
                          <LineChart data={merged} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="label" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <ReTooltip content={<Tip />} />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                            <Line type="monotone" dataKey="registrations" name="Registrations" stroke="#6366f1" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                            <Line type="monotone" dataKey="certificates"  name="Certificates"  stroke="#14b8a6" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      );
                    })() : <Empty message="No trend data available" />}
                  </CardContent>
                </Card>
              </div>

              {/* ── Full Country Table (searchable / sortable) ── */}
              <Card ref={refCountryTable} className="border border-gray-100 shadow-sm">
                <CardHeader className="pb-3 pt-4 px-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-gray-900">All Countries — Enrollment Breakdown</CardTitle>
                      <CardDescription className="text-xs mt-0.5">Search, sort and browse the full country list · click any column header to sort</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Chip type="info"><Globe className="w-3 h-3" /> {countryDist.length} countries</Chip>
                      <ExportBtn targetRef={refCountryTable} filename="country-enrollment-breakdown" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {countryDist.length > 0 ? (
                    <CountryDataTable countryDist={countryDist} />
                  ) : <Empty message="No country data yet" />}
                </CardContent>
              </Card>

            </TabsContent>

            {/* ═══════════════ FELLOWS ═════════════════════════════════════════ */}
            <TabsContent value="fellows" className="p-5 space-y-6">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <SectionHeader
                  icon={GraduationCap}
                  title="Fellowship Progress Analytics"
                  description="Track fellow progress, deadline compliance, risk levels and learning activity"
                />
                {/* Risk filter buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { key: 'all',       label: 'All',        color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                    { key: 'ON_TRACK',  label: 'On Track',   color: 'bg-green-100 text-green-700 hover:bg-green-200' },
                    { key: 'AT_RISK',   label: 'At Risk',    color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
                    { key: 'CRITICAL',  label: 'Critical',   color: 'bg-red-100 text-red-700 hover:bg-red-200' },
                    { key: 'INACTIVE',  label: 'Inactive',   color: 'bg-gray-200 text-gray-600 hover:bg-gray-300' },
                    { key: 'COMPLETED', label: 'Completed',  color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' },
                  ].map(({ key, label, color }) => (
                    <button
                      key={key}
                      onClick={() => setFellowRiskFilter(key)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        fellowRiskFilter === key
                          ? 'ring-2 ring-offset-1 ring-indigo-400 ' + color
                          : color
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* KPI strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <KPICard icon={Users}         label="Total Fellows"       value={num(fellowStats?.totalFellows)}          color="indigo" />
                <KPICard icon={Activity}      label="Active"              value={num(fellowStats?.activeFellows)}         color="green"  />
                <KPICard icon={CheckCircle}   label="Completed"           value={num(fellowStats?.completedFellows)}      color="teal"   />
                <KPICard icon={UserX}         label="Expired"             value={num(fellowStats?.expiredFellows)}        color="red"    />
                <KPICard icon={AlertTriangle} label="Near Deadline (30d)" value={num(fellowStats?.approachingDeadline)}  color="amber"  />
                <KPICard icon={Clock}         label="Inactive Fellows"    value={num(fellowStats?.inactiveFellowsEstimate)} color="orange" />
              </div>

              {/* Progress + risk overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Risk distribution pie */}
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Risk Distribution</CardTitle>
                    <CardDescription className="text-xs">Fellowship health at a glance</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    {fellowsData?.stats ? (() => {
                      const s = fellowsData.stats;
                      const pieData = [
                        { name: 'On Track',  value: s.onTrack,   fill: '#22c55e' },
                        { name: 'At Risk',   value: s.atRisk,    fill: '#f59e0b' },
                        { name: 'Critical',  value: s.critical,  fill: '#ef4444' },
                        { name: 'Inactive',  value: s.inactive,  fill: '#94a3b8' },
                        { name: 'Completed', value: s.completed, fill: '#6366f1' },
                      ].filter(d => d.value > 0);
                      return (
                        <>
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                                {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                              </Pie>
                              <ReTooltip content={<Tip />} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="space-y-1.5 mt-1">
                            {pieData.map(d => (
                              <div key={d.name} className="flex justify-between text-xs">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                                  <span className="text-gray-600">{d.name}</span>
                                </span>
                                <span className="font-bold text-gray-900">{d.value}</span>
                              </div>
                            ))}
                            <div className="pt-2 border-t border-gray-100 flex justify-between text-xs">
                              <span className="text-gray-500 font-medium">Avg Progress</span>
                              <span className="font-bold text-indigo-600">{pct(fellowsData.stats.avgProgress)}</span>
                            </div>
                          </div>
                        </>
                      );
                    })() : <Empty message="No fellowship data" />}
                  </CardContent>
                </Card>

                {/* Module completion stats */}
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Module Stats</CardTitle>
                    <CardDescription className="text-xs">Overall module enrollment & completion</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-4 pt-2">
                    {[
                      { label: 'Module Completion Rate', value: fellowStats?.moduleCompletionRate ?? 0, color: '#22c55e' },
                      { label: 'Completed / Total',      value: fellowStats?.totalModuleEnrollments > 0 ? (fellowStats.completedModuleEnrollments / fellowStats.totalModuleEnrollments) * 100 : 0, color: '#6366f1' },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-medium text-gray-700">{label}</span>
                          <span className="font-bold" style={{ color }}>{pct(value)}</span>
                        </div>
                        <ProgressBar value={value} color={color} />
                      </div>
                    ))}
                    <div className="pt-3 border-t border-gray-200 space-y-2">
                      {[
                        { label: 'Total Enrollments',    val: num(fellowStats?.totalModuleEnrollments) },
                        { label: 'Completed Modules',    val: num(fellowStats?.completedModuleEnrollments) },
                        { label: 'Recent (7 days)',       val: num(fellowStats?.recentCompletions) },
                        { label: 'Cohorts Active',        val: (fellowStats?.cohorts ?? []).length },
                      ].map(({ label, val }) => (
                        <div key={label} className="flex justify-between text-xs">
                          <span className="text-gray-500">{label}</span>
                          <span className="font-bold text-gray-900">{val}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Daily activity trend */}
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Daily Activity — Last 30 Days</CardTitle>
                    <CardDescription className="text-xs">Learning sessions per day</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    {fellowActivity?.dailySeries?.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={fellowActivity.dailySeries} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gFellow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="date" tick={{ fontSize: 8 }} axisLine={false} tickLine={false}
                            tickFormatter={v => v.slice(5)} interval={6} />
                          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <ReTooltip content={<Tip />} />
                          <Area type="monotone" dataKey="count" name="Sessions" stroke="#6366f1" fill="url(#gFellow)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : <Empty message="No activity data" />}
                  </CardContent>
                </Card>
              </div>

              {/* Peak hour + peak day bars */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Peak Learning Hours</CardTitle>
                    <CardDescription className="text-xs">When fellows are most active during the day</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    {fellowActivity?.hourOfDay?.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={fellowActivity.hourOfDay} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="label" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} interval={3} />
                          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <ReTooltip content={<Tip />} />
                          <Bar dataKey="count" name="Sessions" radius={[3, 3, 0, 0]}>
                            {(fellowActivity.hourOfDay ?? []).map((d, i) => (
                              <Cell key={i} fill={d.hour === fellowActivity?.peakHour?.hour ? '#6366f1' : '#c7d2fe'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <Empty message="No hourly data" />}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Activity by Day of Week</CardTitle>
                    <CardDescription className="text-xs">Which days fellows engage most</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    {fellowActivity?.dayOfWeek?.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={fellowActivity.dayOfWeek} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <ReTooltip content={<Tip />} />
                          <Bar dataKey="count" name="Sessions" radius={[4, 4, 0, 0]}>
                            {(fellowActivity.dayOfWeek ?? []).map((d, i) => (
                              <Cell key={i} fill={C[i % C.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <Empty message="No daily data" />}
                  </CardContent>
                </Card>
              </div>

              {/* Per-fellow progress table */}
              <Card className="border-0 shadow-none bg-gray-50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-gray-900">Fellow Progress List</CardTitle>
                      <CardDescription className="text-xs">
                        {fellowRiskFilter === 'all'
                          ? `All ${fellowsData?.fellows?.length ?? 0} fellows`
                          : `Filtered by: ${fellowRiskFilter} — ${(fellowsData?.fellows ?? []).filter(f => f.riskLevel === fellowRiskFilter).length} fellows`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />On Track</div>
                      <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />At Risk</div>
                      <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Critical</div>
                      <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400" />Inactive</div>
                      <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" />Completed</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {(() => {
                    const allFellows = fellowsData?.fellows ?? [];
                    const filtered = fellowRiskFilter === 'all'
                      ? allFellows
                      : allFellows.filter(f => f.riskLevel === fellowRiskFilter);

                    if (!filtered.length) return <Empty message={fellowRiskFilter === 'all' ? 'No fellows yet' : `No ${fellowRiskFilter.toLowerCase()} fellows`} />;

                    const riskColor = {
                      ON_TRACK:  { dot: 'bg-green-500',  badge: 'bg-green-100 text-green-700'  },
                      AT_RISK:   { dot: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-700'  },
                      CRITICAL:  { dot: 'bg-red-500',    badge: 'bg-red-100 text-red-700'      },
                      INACTIVE:  { dot: 'bg-gray-400',   badge: 'bg-gray-100 text-gray-600'    },
                      COMPLETED: { dot: 'bg-indigo-500', badge: 'bg-indigo-100 text-indigo-700'},
                    };

                    return (
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-100">
                            <TableHead className="text-xs font-semibold text-gray-500">#</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500">Fellow</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 text-center">Cohort</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 text-center">Progress</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 text-center">Completed</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 text-center">In Progress</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 text-center">Days Left</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 text-center">Last Active</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 text-center">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtered.map((f, i) => {
                            const rc = riskColor[f.riskLevel] ?? riskColor.INACTIVE;
                            const daysLeftNum = f.daysLeft;
                            return (
                              <TableRow key={f._id ?? i} className="border-gray-50">
                                <TableCell className="text-xs text-gray-400 font-medium">{i + 1}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${rc.dot}`} />
                                    <div>
                                      <p className="text-xs font-semibold text-gray-800">{f.firstName} {f.lastName}</p>
                                      <p className="text-[10px] text-gray-400">{f.email}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs text-center text-gray-600">{f.fellowData?.cohort || '—'}</TableCell>
                                <TableCell className="text-xs text-center">
                                  <div className="flex items-center gap-1.5 justify-center">
                                    <div className="w-14 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full transition-all"
                                        style={{ width: `${Math.min(f.overallProgressPct ?? 0, 100)}%`, background: f.overallProgressPct >= 75 ? '#22c55e' : f.overallProgressPct >= 40 ? '#f59e0b' : '#ef4444' }} />
                                    </div>
                                    <span className={`font-bold text-xs ${f.overallProgressPct >= 75 ? 'text-green-600' : f.overallProgressPct >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                                      {pct(f.overallProgressPct ?? 0)}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs text-center text-green-600 font-semibold">{f.completedModules ?? 0}</TableCell>
                                <TableCell className="text-xs text-center text-indigo-600 font-semibold">{f.inProgressModules ?? 0}</TableCell>
                                <TableCell className="text-xs text-center">
                                  {daysLeftNum !== null && daysLeftNum !== undefined ? (
                                    <span className={`font-bold ${daysLeftNum <= 14 ? 'text-red-600' : daysLeftNum <= 30 ? 'text-amber-600' : 'text-gray-700'}`}>
                                      {daysLeftNum < 0 ? `${Math.abs(daysLeftNum)}d overdue` : `${daysLeftNum}d`}
                                    </span>
                                  ) : <span className="text-gray-400">—</span>}
                                </TableCell>
                                <TableCell className="text-xs text-gray-500 text-center">
                                  {f.lastAccessedAt ? new Date(f.lastAccessedAt).toLocaleDateString() : '—'}
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rc.badge}`}>
                                    {f.riskLevel?.replace('_', ' ')}
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Cohorts summary */}
              {(fellowStats?.cohorts ?? []).length > 0 && (
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Active Cohorts</CardTitle>
                    <CardDescription className="text-xs">Fellowship cohorts currently on the platform</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="flex flex-wrap gap-2">
                      {fellowStats.cohorts.map((cohort, i) => (
                        <span key={cohort ?? i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100">
                          {cohort}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ═══════════════ TOP PERFORMERS ══════════════════════════════════ */}
            <TabsContent value="performers" className="p-5 space-y-6">
              <SectionHeader icon={Trophy} title="Top Performers" description="Students leading the platform by completions, scores, streaks, and recent activity" />

              {/* Level Champions */}
              {topPerformers?.levelChampions?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-3">Level Champions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {topPerformers.levelChampions.map((c, i) => {
                      const lvlColor = c.level === 'beginner'
                        ? { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700', icon: 'text-green-500' }
                        : c.level === 'intermediate'
                        ? { bg: 'bg-indigo-50', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-700', icon: 'text-indigo-500' }
                        : { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', icon: 'text-amber-500' };
                      return (
                        <Card key={c.level ?? i} className={`border ${lvlColor.border} ${lvlColor.bg} shadow-sm`}>
                          <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${lvlColor.badge}`}>
                                {c.level === 'beginner' ? 'BASIC' : c.level === 'intermediate' ? 'INTERMEDIATE' : 'ADVANCED'} CHAMPION
                              </span>
                              <Trophy className={`w-5 h-5 ${lvlColor.icon}`} />
                            </div>
                            <div className="text-base font-extrabold text-gray-900 truncate">{c.name}</div>
                            <div className="text-xs text-gray-500 truncate mb-3">{c.email}</div>
                            <div className="flex items-center gap-4 text-xs">
                              <div className="text-center">
                                <div className="text-lg font-bold text-gray-900">{c.completedModules}</div>
                                <div className="text-gray-400">Completed</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-gray-900">{fmt(c.avgScore)}%</div>
                                <div className="text-gray-400">Avg Score</div>
                              </div>
                              {c.country && (
                                <div className="flex items-center gap-1 text-gray-500 ml-auto">
                                  <MapPin className="w-3 h-3" />{c.country}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Leaderboards side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Most Completions */}
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold text-gray-900">Most Modules Completed</CardTitle>
                      <Chip type="success"><Medal className="w-3 h-3" /> Completions</Chip>
                    </div>
                    <CardDescription className="text-xs">Ranked by number of modules finished</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    {topPerformers?.byCompletions?.length > 0 ? (
                      <div className="space-y-2">
                        {topPerformers.byCompletions.map((s, i) => (
                          <div key={s.email ?? i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-extrabold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-200 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
                              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-gray-800 truncate">{s.name}</div>
                              <div className="text-[10px] text-gray-400 truncate">{s.cohort || s.country || s.email}</div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-sm font-extrabold text-indigo-600">{s.completedModules}</div>
                              <div className="text-[10px] text-gray-400">modules</div>
                            </div>
                            <div className="text-right flex-shrink-0 hidden sm:block">
                              <div className="text-xs font-semibold text-gray-600">{fmt(s.avgScore)}%</div>
                              <div className="text-[10px] text-gray-400">avg score</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <Empty message="No completion data yet" />}
                  </CardContent>
                </Card>

                {/* Highest Scores */}
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold text-gray-900">Highest Assessment Scores</CardTitle>
                      <Chip type="violet"><Star className="w-3 h-3" /> Top Scores</Chip>
                    </div>
                    <CardDescription className="text-xs">Ranked by average final assessment score</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    {topPerformers?.byScore?.length > 0 ? (
                      <div className="space-y-2">
                        {topPerformers.byScore.map((s, i) => (
                          <div key={s.email ?? i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-extrabold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-200 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
                              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-gray-800 truncate">{s.name}</div>
                              <div className="text-[10px] text-gray-400 truncate">{s.cohort || s.country || s.email}</div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-sm font-extrabold text-violet-600">{fmt(s.avgScore)}%</div>
                              <div className="text-[10px] text-gray-400">avg score</div>
                            </div>
                            <div className="text-right flex-shrink-0 hidden sm:block">
                              <div className="text-xs font-semibold text-gray-600">{s.completedModules}</div>
                              <div className="text-[10px] text-gray-400">completed</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <Empty message="No assessment data yet" />}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Longest Streak */}
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold text-gray-900">Longest Learning Streaks</CardTitle>
                      <Chip type="warn"><Flame className="w-3 h-3" /> On Fire</Chip>
                    </div>
                    <CardDescription className="text-xs">Students with the most consecutive active days</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    {topPerformers?.byStreak?.length > 0 ? (
                      <div className="space-y-2">
                        {topPerformers.byStreak.map((s, i) => (
                          <div key={s.email ?? i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-extrabold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-200 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
                              {i === 0 ? '🔥' : i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-gray-800 truncate">{s.name}</div>
                              <div className="text-[10px] text-gray-400 truncate">{s.cohort || s.country || s.email}</div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-sm font-extrabold text-orange-500">{s.currentStreak}d</div>
                              <div className="text-[10px] text-gray-400">current</div>
                            </div>
                            <div className="text-right flex-shrink-0 hidden sm:block">
                              <div className="text-xs font-semibold text-gray-500">{s.longestStreak}d</div>
                              <div className="text-[10px] text-gray-400">best</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <Empty message="No streak data yet" />}
                  </CardContent>
                </Card>

                {/* Recent Stars — active last 7 days */}
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold text-gray-900">Stars This Week</CardTitle>
                      <Chip type="success">
                        <Sparkles className="w-3 h-3" /> Active 7d</Chip>
                    </div>
                    <CardDescription className="text-xs">High-progress students active in the last 7 days</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    {topPerformers?.recentStars?.length > 0 ? (
                      <div className="space-y-2">
                        {topPerformers.recentStars.map((s, i) => (
                          <div key={s.email ?? i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors">
                            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                              <Sparkles className="w-3.5 h-3.5 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-gray-800 truncate">{s.name}</div>
                              <div className="text-[10px] text-gray-400 truncate">{s.cohort || s.country || s.email}</div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-sm font-extrabold text-green-600">{pct(s.avgProgress)}</div>
                              <div className="text-[10px] text-gray-400">avg progress</div>
                            </div>
                            <div className="text-right flex-shrink-0 hidden sm:block">
                              <div className="text-xs font-semibold text-gray-600">{s.completedModules}</div>
                              <div className="text-[10px] text-gray-400">done</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <Empty message="No recent activity" />}
                  </CardContent>
                </Card>
              </div>

              {/* Full leaderboard bar chart — top 10 by completions */}
              {topPerformers?.byCompletions?.length > 0 && (
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Leaderboard — Modules Completed</CardTitle>
                    <CardDescription className="text-xs">Top 10 students ranked by total module completions</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        layout="vertical"
                        data={topPerformers.byCompletions.map((s, i) => ({ ...s, rank: `#${i + 1} ${trunc(s.name, 18)}` }))}
                        margin={{ top: 0, right: 60, left: 10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="rank" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={140} />
                        <ReTooltip content={<Tip />} />
                        <Bar dataKey="completedModules" name="Modules Completed" radius={[0, 4, 4, 0]}
                          label={{ position: 'right', fontSize: 10, fill: '#6b7280' }}>
                          {topPerformers.byCompletions.map((_, i) => (
                            <Cell key={i} fill={i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#f97316' : '#6366f1'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Empty state when no data at all */}
              {!topPerformers?.byCompletions?.length && !topPerformers?.byScore?.length && !topPerformers?.levelChampions?.length && (
                <Card className="border border-dashed border-gray-200 bg-gray-50/50">
                  <CardContent className="py-16 flex flex-col items-center text-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center">
                      <Trophy className="w-7 h-7 text-indigo-300" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">No top performers yet</p>
                    <p className="text-xs text-gray-400 max-w-xs">Leaderboards will populate as students complete modules and take assessments.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ═══════════════ SUBMISSIONS ══════════════════════════════════════ */}
            <TabsContent value="submissions" className="p-5 space-y-6">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <SectionHeader
                  icon={FolderOpen}
                  title="Student Submissions"
                  description="View all capstone project proposals and case study submissions, who submitted them, and their current status"
                />
                <Button variant="outline" size="sm" className="gap-2" onClick={refreshSubmissions} disabled={subsLoading}>
                  <RefreshCw className={`w-4 h-4 ${subsLoading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
              </div>

              {/* KPI strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KPICard icon={FileText}    label="Capstone Submissions"  value={num(capstones.length)}                                                                        color="indigo" />
                <KPICard icon={CheckCircle} label="Capstones Graded"      value={num(capstones.filter(c => c.status === 'graded' || c.status === 'completed').length)}         color="green"  />
                <KPICard icon={FolderOpen}  label="Case Studies"          value={num(caseStudies.length)}                                                                       color="violet" />
                <KPICard icon={AlertTriangle} label="Pending Review"      value={num(capstones.filter(c => c.status === 'submitted' || c.status === 'implementation_submitted').length + caseStudies.filter(p => p.status === 'pending').length)} color="amber" />
              </div>

              {/* ── Capstone Projects ── */}
              <Card className="border-0 shadow-none bg-gray-50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-gray-900">Capstone Project Submissions</CardTitle>
                      <CardDescription className="text-xs">All student capstone proposals and implementations — searchable and sortable</CardDescription>
                    </div>
                    <Chip type="info"><FileText className="w-3 h-3" /> {capstones.length} Total</Chip>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {subsLoading ? (
                    <div className="py-12 flex items-center justify-center gap-3">
                      <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                      <span className="text-sm text-gray-400">Loading submissions…</span>
                    </div>
                  ) : capstones.length > 0 ? (
                    <CapstoneDataTable capstones={capstones} />
                  ) : (
                    <Empty message="No capstone submissions yet" />
                  )}
                </CardContent>
              </Card>

              {/* ── Case Study / Project Submissions ── */}
              <Card className="border-0 shadow-none bg-gray-50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-gray-900">Case Study & Project Submissions</CardTitle>
                      <CardDescription className="text-xs">Student-uploaded projects and resources awaiting review or already approved</CardDescription>
                    </div>
                    <Chip type="violet"><FolderOpen className="w-3 h-3" /> {caseStudies.length} Total</Chip>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {subsLoading ? (
                    <div className="py-12 flex items-center justify-center gap-3">
                      <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                      <span className="text-sm text-gray-400">Loading submissions…</span>
                    </div>
                  ) : caseStudies.length > 0 ? (
                    <CaseStudyDataTable projects={caseStudies} />
                  ) : (
                    <Empty message="No case study submissions yet" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          </div>
        </Tabs>
      </div>
    </div>
  );
}
