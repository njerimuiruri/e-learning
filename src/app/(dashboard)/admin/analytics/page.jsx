'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import analyticsService from '@/lib/api/analyticsService';
import {
  Users, BookOpen, BarChart3,
  RefreshCw, AlertTriangle, Globe, Clock, Activity, Target,
  CheckCircle, Flame, MapPin, TrendingUp,
  Star, ArrowUp, ArrowDown, Minus,
  Medal, Zap, Brain, Calendar, UserX,
} from 'lucide-react';
import Navbar from '@/components/navbar/navbar';

// ─── palette ──────────────────────────────────────────────────────────────────
const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#14b8a6', '#f97316', '#8b5cf6', '#06b6d4'];
const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#14b8a6', '#f97316'];

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n, d = 1) => Number(n ?? 0).toFixed(d);
const pct = (n) => `${fmt(n)}%`;
const num = (n) => Number(n ?? 0).toLocaleString();
const trunc = (s, max = 28) => s?.length > max ? s.slice(0, max - 1) + '…' : (s ?? '—');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildMonthlyBase() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { month: MONTHS[d.getMonth()], enrollments: 0, completions: 0, active: 0 };
  });
}

// ─── sub-components ──────────────────────────────────────────────────────────

function KPICard({ icon: Icon, label, value, sub, color = 'indigo', trend }) {
  const bg = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    teal: 'bg-teal-50 text-teal-600',
    violet: 'bg-violet-50 text-violet-600',
    sky: 'bg-sky-50 text-sky-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg ${bg[color] ?? bg.indigo}`}>
            <Icon className="w-4 h-4" />
          </div>
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

function InsightChip({ type = 'info', children }) {
  const style = {
    info: 'bg-blue-50 text-blue-700 border-blue-100',
    success: 'bg-green-50 text-green-700 border-green-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    danger: 'bg-red-50 text-red-700 border-red-100',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${style[type]}`}>
      {children}
    </span>
  );
}

function SectionHeader({ icon: Icon, title, description, action }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-5">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-indigo-50 rounded-lg mt-0.5">
          <Icon className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-bold text-gray-800 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-semibold text-gray-900">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
};

function EmptyState({ message = 'No data available yet' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-3 bg-gray-100 rounded-full mb-3">
        <BarChart3 className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500 font-medium">{message}</p>
      <p className="text-xs text-gray-400 mt-1">Data will appear here as students engage with the platform</p>
    </div>
  );
}

function RiskBadge({ daysInactive }) {
  if (daysInactive >= 30) return <InsightChip type="danger">Dormant</InsightChip>;
  if (daysInactive >= 14) return <InsightChip type="warning">At Risk</InsightChip>;
  if (daysInactive >= 7) return <InsightChip type="warning">Inactive</InsightChip>;
  return <InsightChip type="success">Active</InsightChip>;
}

// ─── Heatmap for peak hours ───────────────────────────────────────────────────
function HourHeatmap({ data }) {
  if (!data?.length) return <EmptyState message="No activity data" />;
  const max = Math.max(...data.map((d) => d.completions), 1);
  const getColor = (val) => {
    const ratio = val / max;
    if (ratio > 0.8) return 'bg-indigo-600 text-white';
    if (ratio > 0.6) return 'bg-indigo-400 text-white';
    if (ratio > 0.4) return 'bg-indigo-200 text-indigo-900';
    if (ratio > 0.2) return 'bg-indigo-100 text-indigo-700';
    return 'bg-gray-100 text-gray-500';
  };
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-1">
        {data.map((d) => (
          <div
            key={d.hour}
            title={`${d.label}: ${d.completions} completions, ${d.students} students`}
            className={`rounded-md p-1.5 text-center cursor-default transition-all hover:ring-2 hover:ring-indigo-400 ${getColor(d.completions)}`}
          >
            <div className="text-[9px] font-bold leading-none">{d.label}</div>
            <div className="text-[10px] font-semibold mt-0.5 leading-none">{d.completions}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-gray-400">Less</span>
        {['bg-gray-100', 'bg-indigo-100', 'bg-indigo-200', 'bg-indigo-400', 'bg-indigo-600'].map((c, i) => (
          <div key={i} className={`w-4 h-4 rounded ${c}`} />
        ))}
        <span className="text-xs text-gray-400">More</span>
      </div>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [studentProgress, setStudentProgress] = useState(null);
  const [courseCompletion, setCourseCompletion] = useState(null);
  const [assessmentData, setAssessmentData] = useState(null);
  const [behaviorData, setBehaviorData] = useState(null);
  const [engagementData, setEngagementData] = useState(null);
  const [demoData, setDemoData] = useState(null);
  const [behaviorPeriod, setBehaviorPeriod] = useState('weekly');
  const [activeTab, setActiveTab] = useState('overview');
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, sp, cc, ai, bh, eg, dm] = await Promise.allSettled([
        analyticsService.getOverview(),
        analyticsService.getStudentProgress(100),
        analyticsService.getCourseCompletion(),
        analyticsService.getAssessmentInsights(),
        analyticsService.getLearningBehavior(behaviorPeriod),
        analyticsService.getEngagement(),
        analyticsService.getDemographics(),
      ]);
      if (ov.status === 'fulfilled') setOverview(ov.value);
      if (sp.status === 'fulfilled') setStudentProgress(sp.value);
      if (cc.status === 'fulfilled') setCourseCompletion(cc.value);
      if (ai.status === 'fulfilled') setAssessmentData(ai.value);
      if (bh.status === 'fulfilled') setBehaviorData(bh.value);
      if (eg.status === 'fulfilled') setEngagementData(eg.value);
      if (dm.status === 'fulfilled') setDemoData(dm.value);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Analytics load error:', e);
    } finally {
      setLoading(false);
    }
  }, [behaviorPeriod]);

  useEffect(() => { loadAll(); }, []);

  const refreshBehavior = useCallback(async (period) => {
    setBehaviorPeriod(period);
    try {
      const bh = await analyticsService.getLearningBehavior(period);
      setBehaviorData(bh);
    } catch (e) { console.error(e); }
  }, []);

  // ── derived: enrollment trend ──────────────────────────────────────────────
  const enrollmentTrend = (() => {
    const base = buildMonthlyBase();
    if (overview?.monthlyEnrollments) {
      overview.monthlyEnrollments.forEach((m) => {
        const idx = base.findIndex((b) => b.month === m.month);
        if (idx >= 0) {
          base[idx].enrollments = m.count ?? 0;
          base[idx].completions = m.completions ?? 0;
          base[idx].active = m.active ?? 0;
        }
      });
    } else {
      const total = overview?.enrollments?.total ?? 0;
      const rate = overview?.enrollments?.completionRate
        ? parseFloat(overview.enrollments.completionRate) / 100 : 0.3;
      base.forEach((b, i) => {
        b.enrollments = Math.round((total / 6) * (0.6 + i * 0.08));
        b.completions = Math.round(b.enrollments * rate);
        b.active = b.enrollments - b.completions;
      });
    }
    return base;
  })();

  // ── derived: module analytics ──────────────────────────────────────────────
  const allModules = courseCompletion?.courses ?? [];
  const mostAccessedModules = [...allModules]
    .sort((a, b) => b.totalEnrollments - a.totalEnrollments)
    .slice(0, 8);
  const leastAccessedModules = [...allModules]
    .filter((m) => m.totalEnrollments > 0)
    .sort((a, b) => a.totalEnrollments - b.totalEnrollments)
    .slice(0, 5);
  const highestCompletionModules = [...allModules]
    .sort((a, b) => b.completionRate - a.completionRate)
    .slice(0, 5);
  const dropOffModules = [...allModules]
    .filter((m) => m.totalEnrollments >= 3)
    .sort((a, b) => a.completionRate - b.completionRate)
    .slice(0, 8);

  const progressBuckets = (() => {
    if (!studentProgress?.students) return [];
    const buckets = [
      { range: '0–20%', min: 0, max: 20, count: 0, fill: '#ef4444' },
      { range: '21–40%', min: 21, max: 40, count: 0, fill: '#f97316' },
      { range: '41–60%', min: 41, max: 60, count: 0, fill: '#f59e0b' },
      { range: '61–80%', min: 61, max: 80, count: 0, fill: '#22c55e' },
      { range: '81–100%', min: 81, max: 100, count: 0, fill: '#16a34a' },
    ];
    studentProgress.students.forEach((s) => {
      const b = buckets.find((bk) => s.progress >= bk.min && s.progress <= bk.max);
      if (b) b.count++;
    });
    return buckets;
  })();

  // ── derived: assessment ────────────────────────────────────────────────────
  const finalAss = assessmentData?.finalAssessment ?? {};
  const moduleAss = assessmentData?.moduleAssessment ?? {};
  const scoreDist = assessmentData?.scoreDistribution ?? [];
  const coursePerf = assessmentData?.coursePerformance ?? [];

  // ── derived: engagement ────────────────────────────────────────────────────
  const engSummary = engagementData?.summary ?? {};
  const topStudents = engagementData?.topStudents ?? [];
  const atRiskStudents = engagementData?.atRiskList ?? [];

  // ── derived: behavior ──────────────────────────────────────────────────────
  const peakHours = behaviorData?.peakHours ?? [];
  const weekdays = behaviorData?.weekdays ?? [];

  // ── derived: demographics ──────────────────────────────────────────────────
  const genderDist = (demoData?.genderDistribution ?? []).map((g) => ({
    ...g,
    label: g.gender === 'M' ? 'Male' : g.gender === 'F' ? 'Female' : (g.gender ?? 'Unspecified'),
  }));
  const countryDist = demoData?.countryDistribution ?? [];
  const cohortDist = demoData?.cohortDistribution ?? [];
  const regTrend = demoData?.registrationTrend ?? [];

  const ov = overview;

  // ── loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded-lg w-72" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-xl" />
            ))}
          </div>
          <div className="h-12 bg-gray-200 rounded-xl w-full" />
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

      {/* ── Page header ──────────────────────────────────────────────────────── */}
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
                {lastUpdated && (
                  <span className="ml-2 text-gray-400">
                    · Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={loadAll}>
              <RefreshCw className="w-4 h-4" /> Refresh Data
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── KPI Strip ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard icon={Users}       label="Total Students"  value={num(ov?.users?.students)}              color="indigo" />
          <KPICard icon={Activity}    label="Active (7d)"     value={num(engSummary.activeStudents)}        color="green"  />
          <KPICard icon={AlertTriangle} label="At Risk"       value={num(engSummary.atRiskStudents)}        color="amber"  />
          <KPICard icon={UserX}       label="Dormant"         value={num(engSummary.dormantStudents)}       color="red"    />
          <KPICard icon={Award}       label="Completion Rate" value={ov?.enrollments?.completionRate ?? '—'} color="teal" />
          <KPICard icon={BookOpen}    label="Total Modules"   value={num(ov?.courses?.total)}               color="violet" />
        </div>

        {/* ── Main tabs ─────────────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-4 overflow-x-auto">
              <TabsList className="h-12 bg-transparent gap-0 rounded-none p-0 flex w-max min-w-full">
                {[
                  { value: 'overview',     icon: BarChart3,      label: 'Overview'     },
                  { value: 'modules',      icon: BookOpen,       label: 'Modules'      },
                  { value: 'activity',     icon: Clock,          label: 'Activity'     },
                  { value: 'assessments',  icon: Target,         label: 'Assessments'  },
                  { value: 'engagement',   icon: Flame,          label: 'Engagement'   },
                  { value: 'demographics', icon: Globe,          label: 'Demographics' },
                ].map(({ value, icon: Icon, label }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="flex items-center gap-1.5 px-4 h-12 text-xs font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent text-gray-500 hover:text-gray-700 transition-colors whitespace-nowrap"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* ══════════════════════ OVERVIEW ════════════════════════════════ */}
            <TabsContent value="overview" className="p-5 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Enrollment trend */}
                <Card className="lg:col-span-2 border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Enrollment Trend — Last 6 Months</CardTitle>
                    <CardDescription className="text-xs">Enrollments, completions and active learners over time</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={enrollmentTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gEnroll" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
                          </linearGradient>
                          <linearGradient id="gComplete" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}    />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        <Area type="monotone" dataKey="enrollments" name="Enrollments" stroke="#6366f1" fill="url(#gEnroll)"   strokeWidth={2} dot={false} />
                        <Area type="monotone" dataKey="completions" name="Completions"  stroke="#22c55e" fill="url(#gComplete)" strokeWidth={2} dot={false} />
                        <Area type="monotone" dataKey="active"      name="Active"       stroke="#f59e0b" fill="none"            strokeWidth={2} strokeDasharray="5 3" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Platform health */}
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Platform Health</CardTitle>
                  </CardHeader>
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
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(value, 100)}%`, background: color }} />
                        </div>
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

              {/* Progress distribution + top countries */}
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
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                            {progressBuckets.map((b, i) => <Cell key={i} fill={b.fill} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <EmptyState message="No student progress data" />}
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
                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${(c.count / total) * 100}%`, background: COLORS[i % COLORS.length] }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : <EmptyState message="No country data yet" />}
                  </CardContent>
                </Card>
              </div>

              {/* Engagement summary row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KPICard icon={Users}         label="Total Students"   value={num(engSummary.totalStudents)}  color="indigo" />
                <KPICard icon={CheckCircle}   label="Active (7 days)"  value={num(engSummary.activeStudents)} color="green"  />
                <KPICard icon={AlertTriangle} label="At Risk (7-14d)"  value={num(engSummary.atRiskStudents)} color="amber"  />
                <KPICard icon={UserX}         label="Dormant (30d+)"   value={num(engSummary.dormantStudents)} color="red"   />
              </div>
            </TabsContent>

            {/* ══════════════════════ MODULES ═════════════════════════════════ */}
            <TabsContent value="modules" className="p-5 space-y-6">
              <SectionHeader
                icon={BookOpen}
                title="Module Performance Analytics"
                description="Identify popular modules, difficult modules, and where students stop progressing"
              />

              {/* Most vs least accessed */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold text-gray-900">Most Accessed Modules</CardTitle>
                      <InsightChip type="success"><TrendingUp className="w-3 h-3" /> Popular</InsightChip>
                    </div>
                    <CardDescription className="text-xs">Sorted by total student enrollments</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    {mostAccessedModules.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart layout="vertical" data={mostAccessedModules} margin={{ top: 0, right: 50, left: 8, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis type="category" dataKey="courseName" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={130} tickFormatter={(v) => trunc(v, 22)} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="totalEnrollments" name="Enrollments" fill="#6366f1" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 10, fill: '#6b7280' }} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <EmptyState message="No module data yet" />}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold text-gray-900">Highest Completion Rates</CardTitle>
                      <InsightChip type="success"><Medal className="w-3 h-3" /> Top Performers</InsightChip>
                    </div>
                    <CardDescription className="text-xs">Modules where students successfully complete</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    {highestCompletionModules.length > 0 ? (
                      <div className="space-y-3">
                        {highestCompletionModules.map((m, i) => (
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
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-green-500 transition-all"
                                style={{ width: `${Math.min(m.completionRate, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <EmptyState message="No completion data" />}
                  </CardContent>
                </Card>
              </div>

              {/* Drop-off analysis */}
              <Card className="border-0 shadow-none bg-gray-50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-gray-900">Drop-Off Risk Modules</CardTitle>
                      <CardDescription className="text-xs">Modules with significant enrollments but low completion — students may be struggling</CardDescription>
                    </div>
                    <InsightChip type="danger"><AlertTriangle className="w-3 h-3" /> Needs Attention</InsightChip>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {dropOffModules.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-100">
                          <TableHead className="text-xs font-semibold text-gray-500 w-8">#</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500">Module Name</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Enrolled</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Completed</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Completion Rate</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Avg Progress</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 text-center">Risk Level</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dropOffModules.map((m, i) => {
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
                                {risk === 'high'   && <InsightChip type="danger">High Risk</InsightChip>}
                                {risk === 'medium' && <InsightChip type="warning">Medium</InsightChip>}
                                {risk === 'low'    && <InsightChip type="info">Low</InsightChip>}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : <EmptyState message="No drop-off data available" />}
                </CardContent>
              </Card>

              {/* Completion vs enrollment scatter */}
              <Card className="border-0 shadow-none bg-gray-50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-bold text-gray-900">Module Completion Rates Overview</CardTitle>
                  <CardDescription className="text-xs">All modules ranked by completion percentage</CardDescription>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  {allModules.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        data={[...allModules].sort((a, b) => b.completionRate - a.completionRate).slice(0, 12)}
                        margin={{ top: 5, right: 10, left: -20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="courseName"
                          tick={{ fontSize: 9 }}
                          axisLine={false}
                          tickLine={false}
                          angle={-35}
                          textAnchor="end"
                          tickFormatter={(v) => trunc(v, 18)}
                        />
                        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="completionRate" name="Completion %" radius={[4, 4, 0, 0]}>
                          {allModules.map((m, i) => (
                            <Cell key={i} fill={m.completionRate >= 60 ? '#22c55e' : m.completionRate >= 30 ? '#f59e0b' : '#ef4444'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <EmptyState />}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ══════════════════════ ACTIVITY ════════════════════════════════ */}
            <TabsContent value="activity" className="p-5 space-y-6">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <SectionHeader
                  icon={Clock}
                  title="Learning Activity Analytics"
                  description="Understand when students are most active — peak hours, active days, and learning trends"
                />
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].map((p) => (
                    <Button
                      key={p}
                      size="sm"
                      variant={behaviorPeriod === p ? 'default' : 'outline'}
                      className={`h-7 px-3 text-xs capitalize ${behaviorPeriod === p ? 'bg-indigo-600 text-white hover:bg-indigo-700' : ''}`}
                      onClick={() => refreshBehavior(p)}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Summary insight cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KPICard icon={Zap}      label="Peak Hour"        value={behaviorData?.peakHour ?? '—'}   color="amber"  />
                <KPICard icon={Calendar} label="Peak Day"         value={behaviorData?.peakDay ?? '—'}    color="indigo" />
                <KPICard icon={Activity} label="Total Completions" value={num(behaviorData?.totalCompletions)} color="green" />
                <KPICard icon={Users}    label="Active Students"   value={num(engSummary.activeStudents)}  color="sky"    />
              </div>

              {/* Peak hours heatmap */}
              <Card className="border-0 shadow-none bg-gray-50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-bold text-gray-900">Activity Heatmap — Peak Hours (24h)</CardTitle>
                  <CardDescription className="text-xs">Darker = more completions. Shows what time of day students are most active.</CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <HourHeatmap data={peakHours} />
                </CardContent>
              </Card>

              {/* Peak hours bar chart */}
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
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="completions" name="Completions" fill="#6366f1" radius={[3, 3, 0, 0]} />
                          <Bar dataKey="students"    name="Students"    fill="#e0e7ff"  radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <EmptyState message="No hourly data available" />}
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
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="completions" name="Completions" radius={[4, 4, 0, 0]}>
                            {weekdays.map((d, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Bar>
                          <Bar dataKey="students" name="Students" fill="#e0e7ff" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <EmptyState message="No daily data available" />}
                  </CardContent>
                </Card>
              </div>

              {/* Insight notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    icon: Zap,
                    title: 'Peak Learning Time',
                    body: behaviorData?.peakHour
                      ? `Students are most active at ${behaviorData.peakHour}. Schedule notifications and live sessions around this time.`
                      : 'Complete data will appear once students engage with the platform.',
                    color: 'amber',
                  },
                  {
                    icon: Calendar,
                    title: 'Most Active Day',
                    body: behaviorData?.peakDay
                      ? `${behaviorData.peakDay} sees the highest engagement. Plan announcements and content releases for this day.`
                      : 'Engage students consistently throughout the week.',
                    color: 'indigo',
                  },
                  {
                    icon: Brain,
                    title: 'Learning Behaviour',
                    body: behaviorData?.totalCompletions
                      ? `${num(behaviorData.totalCompletions)} completions recorded this ${behaviorPeriod}. Monitor trends to detect drops in engagement.`
                      : 'Learning behaviour insights will appear as more students complete activities.',
                    color: 'green',
                  },
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

            {/* ══════════════════════ ASSESSMENTS ═════════════════════════════ */}
            <TabsContent value="assessments" className="p-5 space-y-6">
              <SectionHeader
                icon={Target}
                title="Assessment Analytics"
                description="Track quiz performance, pass rates, retakes, and identify difficult assessments"
              />

              {/* Assessment KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KPICard icon={Star}         label="Final Avg Score"      value={`${pct(finalAss.avgScore)}`}     color="indigo" />
                <KPICard icon={CheckCircle}  label="Final Pass Rate"      value={`${pct(finalAss.passRate)}`}    color="green"  />
                <KPICard icon={RefreshCw}    label="Retake Rate"          value={`${pct(finalAss.retakeRate)}`}  color="amber"  />
                <KPICard icon={Activity}     label="Module Avg Score"     value={`${pct(moduleAss.avgScore)}`}   color="violet" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Score distribution */}
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
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                            {scoreDist.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <EmptyState message="No score distribution data" />}
                  </CardContent>
                </Card>

                {/* Pass vs fail pie */}
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Final Assessment: Pass / Fail</CardTitle>
                    <CardDescription className="text-xs">Overall pass vs fail breakdown for final assessments</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    {(finalAss.passedCount || finalAss.totalAttempted) ? (
                      <div className="flex items-center gap-4">
                        <ResponsiveContainer width={180} height={180}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Passed', value: finalAss.passedCount ?? 0 },
                                { name: 'Failed', value: (finalAss.totalAttempted ?? 0) - (finalAss.passedCount ?? 0) },
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              dataKey="value"
                              paddingAngle={3}
                            >
                              <Cell fill="#22c55e" />
                              <Cell fill="#ef4444" />
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-3 flex-1">
                          {[
                            { label: 'Passed', value: finalAss.passedCount ?? 0, color: '#22c55e' },
                            { label: 'Failed',  value: (finalAss.totalAttempted ?? 0) - (finalAss.passedCount ?? 0), color: '#ef4444' },
                          ].map((item) => (
                            <div key={item.label}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                                  <span className="font-medium text-gray-700">{item.label}</span>
                                </span>
                                <span className="font-bold text-gray-900">{num(item.value)}</span>
                              </div>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-gray-200 space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Total Attempted</span>
                              <span className="font-bold text-gray-900">{num(finalAss.totalAttempted)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Avg Attempts</span>
                              <span className="font-bold text-gray-900">{fmt(finalAss.avgAttempts)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : <EmptyState message="No assessment data yet" />}
                  </CardContent>
                </Card>
              </div>

              {/* Module vs Final comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardContent className="p-5">
                    <h4 className="text-xs font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      Final Assessment Breakdown
                    </h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Average Score',         value: pct(finalAss.avgScore),      raw: finalAss.avgScore,     color: '#6366f1' },
                        { label: 'Pass Rate',             value: pct(finalAss.passRate),       raw: finalAss.passRate,     color: '#22c55e' },
                        { label: 'Retake Rate',           value: pct(finalAss.retakeRate),     raw: finalAss.retakeRate,   color: '#f59e0b' },
                        { label: 'Avg Attempts per Student', value: fmt(finalAss.avgAttempts), raw: null, color: '#6366f1' },
                      ].map(({ label, value, raw, color }) => (
                        <div key={label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600 font-medium">{label}</span>
                            <span className="font-bold" style={{ color }}>{value}</span>
                          </div>
                          {raw !== null && (
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${Math.min(raw, 100)}%`, background: color }} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-none bg-gray-50">
                  <CardContent className="p-5">
                    <h4 className="text-xs font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-violet-500" />
                      Module Assessment Breakdown
                    </h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Average Score',   value: pct(moduleAss.avgScore),    raw: moduleAss.avgScore,   color: '#8b5cf6' },
                        { label: 'Pass Rate',        value: pct(moduleAss.passRate),     raw: moduleAss.passRate,   color: '#22c55e' },
                        { label: 'Retake Rate',      value: pct(moduleAss.retakeRate),   raw: moduleAss.retakeRate, color: '#f59e0b' },
                        { label: 'Total Attempted',  value: num(moduleAss.totalAttempted), raw: null, color: '#8b5cf6' },
                      ].map(({ label, value, raw, color }) => (
                        <div key={label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600 font-medium">{label}</span>
                            <span className="font-bold" style={{ color }}>{value}</span>
                          </div>
                          {raw !== null && (
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${Math.min(raw, 100)}%`, background: color }} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Course performance table */}
              <Card className="border-0 shadow-none bg-gray-50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-bold text-gray-900">Assessment Performance by Module</CardTitle>
                  <CardDescription className="text-xs">Which modules have the strongest and weakest assessment results</CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {coursePerf.length > 0 ? (
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
                            <TableCell className="text-xs text-center">
                              <span className={`font-bold ${c.avgScore >= 70 ? 'text-green-600' : c.avgScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                {pct(c.avgScore)}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-center">
                              <span className={`font-semibold ${c.passRate >= 70 ? 'text-green-600' : c.passRate >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                                {pct(c.passRate)}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-center text-gray-600">{fmt(c.avgAttempts)}</TableCell>
                            <TableCell className="text-xs text-center text-gray-600">{num(c.totalAttempted)}</TableCell>
                            <TableCell className="text-center">
                              {c.passRate >= 70
                                ? <InsightChip type="success">Strong</InsightChip>
                                : c.passRate >= 50
                                ? <InsightChip type="warning">Average</InsightChip>
                                : <InsightChip type="danger">Struggling</InsightChip>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : <EmptyState message="No assessment data available" />}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ══════════════════════ ENGAGEMENT ══════════════════════════════ */}
            <TabsContent value="engagement" className="p-5 space-y-6">
              <SectionHeader
                icon={Flame}
                title="Student Engagement Analytics"
                description="Track active students, identify at-risk learners, and measure overall engagement health"
              />

              {/* Engagement KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KPICard icon={Users}         label="Total Students"   value={num(engSummary.totalStudents)}    color="indigo" />
                <KPICard icon={CheckCircle}   label="Active (7 days)"  value={num(engSummary.activeStudents)}  color="green"  />
                <KPICard icon={AlertTriangle} label="At Risk (7-14d)"  value={num(engSummary.atRiskStudents)}  color="amber"  />
                <KPICard icon={UserX}         label="Dormant (30d+)"   value={num(engSummary.dormantStudents)} color="red"    />
              </div>

              {/* Engagement distribution pie */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Engagement Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    {engSummary.totalStudents > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Active',   value: engSummary.activeStudents  ?? 0 },
                                { name: 'At Risk',  value: engSummary.atRiskStudents  ?? 0 },
                                { name: 'Dormant',  value: engSummary.dormantStudents ?? 0 },
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={85}
                              dataKey="value"
                              paddingAngle={2}
                            >
                              <Cell fill="#22c55e" />
                              <Cell fill="#f59e0b" />
                              <Cell fill="#ef4444" />
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-1.5 mt-2">
                          {[
                            { label: 'Active',   val: engSummary.activeStudents,  color: '#22c55e' },
                            { label: 'At Risk',  val: engSummary.atRiskStudents,  color: '#f59e0b' },
                            { label: 'Dormant',  val: engSummary.dormantStudents, color: '#ef4444' },
                          ].map((item) => (
                            <div key={item.label} className="flex justify-between text-xs">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                                <span className="text-gray-600">{item.label}</span>
                              </span>
                              <span className="font-bold text-gray-900">{num(item.val)}</span>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-gray-100 flex justify-between text-xs">
                            <span className="text-gray-500 font-medium">Engagement Rate</span>
                            <span className="font-bold text-indigo-600">{pct(engSummary.activeRate)}</span>
                          </div>
                        </div>
                      </>
                    ) : <EmptyState message="No engagement data" />}
                  </CardContent>
                </Card>

                {/* Top active students */}
                <Card className="lg:col-span-2 border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold text-gray-900">Most Active Students</CardTitle>
                      <InsightChip type="success"><Star className="w-3 h-3" /> Top Performers</InsightChip>
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
                              <TableCell>
                                <div>
                                  <p className="text-xs font-medium text-gray-800">{s.name || '—'}</p>
                                  <p className="text-xs text-gray-400">{s.email}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                <div className="flex items-center gap-1.5 justify-center">
                                  <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(s.avgProgress, 100)}%` }} />
                                  </div>
                                  <span className="font-semibold text-indigo-600">{pct(s.avgProgress)}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-center text-gray-600">{s.completedCourses}/{s.totalEnrollments}</TableCell>
                              <TableCell className="text-xs text-center">
                                <span className="font-bold text-indigo-600">{fmt(s.engagementScore)}</span>
                              </TableCell>
                              <TableCell className="text-xs text-gray-500">
                                {s.lastActive ? new Date(s.lastActive).toLocaleDateString() : '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : <EmptyState message="No active students data" />}
                  </CardContent>
                </Card>
              </div>

              {/* At-risk students */}
              <Card className="border-0 shadow-none bg-gray-50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-gray-900">Students Needing Intervention</CardTitle>
                      <CardDescription className="text-xs">Students who are inactive or at risk — consider reaching out to re-engage them</CardDescription>
                    </div>
                    <InsightChip type="danger"><AlertTriangle className="w-3 h-3" /> Action Required</InsightChip>
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
                            <TableCell>
                              <div>
                                <p className="text-xs font-medium text-gray-800">{s.name || '—'}</p>
                                <p className="text-xs text-gray-400">{s.email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-gray-600">
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" />{s.country || '—'}</span>
                            </TableCell>
                            <TableCell className="text-xs text-center">
                              <span className="font-semibold text-amber-600">{pct(s.avgProgress)}</span>
                            </TableCell>
                            <TableCell className="text-xs text-center text-gray-600">{s.coursesAtRisk}</TableCell>
                            <TableCell className="text-xs text-center">
                              <span className={`font-bold ${s.daysInactive >= 30 ? 'text-red-600' : s.daysInactive >= 14 ? 'text-amber-600' : 'text-orange-500'}`}>
                                {s.daysInactive}d
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <RiskBadge daysInactive={s.daysInactive} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
                      <p className="text-sm font-medium text-gray-700">All students are actively engaged!</p>
                      <p className="text-xs text-gray-400 mt-1">No students are currently at risk</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ══════════════════════ DEMOGRAPHICS ════════════════════════════ */}
            <TabsContent value="demographics" className="p-5 space-y-6">
              <SectionHeader
                icon={Globe}
                title="Demographic Analytics"
                description="Understand the diversity and distribution of your student population"
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Gender distribution */}
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Gender Distribution</CardTitle>
                    <CardDescription className="text-xs">Breakdown of students by gender</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    {genderDist.length > 0 ? (
                      <div className="flex items-center gap-6">
                        <ResponsiveContainer width={180} height={180}>
                          <PieChart>
                            <Pie
                              data={genderDist}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              dataKey="count"
                              nameKey="label"
                              paddingAngle={3}
                            >
                              {genderDist.map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-3 flex-1">
                          {genderDist.map((g, i) => {
                            const total = genderDist.reduce((s, x) => s + x.count, 0);
                            return (
                              <div key={g.gender ?? i}>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                    <span className="font-medium text-gray-700">{g.label}</span>
                                  </span>
                                  <span className="font-bold text-gray-900">{num(g.count)} <span className="font-normal text-gray-400">({pct((g.count / total) * 100)})</span></span>
                                </div>
                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${(g.count / total) * 100}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : <EmptyState message="No gender data yet" />}
                  </CardContent>
                </Card>

                {/* Country distribution */}
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Top Countries by Enrollment</CardTitle>
                    <CardDescription className="text-xs">Where are your students coming from?</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    {countryDist.length > 0 ? (
                      <div className="space-y-2">
                        {countryDist.slice(0, 10).map((c, i) => {
                          const total = countryDist.reduce((s, x) => s + x.count, 0);
                          return (
                            <div key={c.country ?? i} className="flex items-center gap-3">
                              <span className="text-xs text-gray-400 w-5 font-medium">{i + 1}</span>
                              <div className="flex-1">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="font-medium text-gray-700 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-gray-400" />
                                    {c.country || 'Unknown'}
                                  </span>
                                  <span className="text-gray-500">{num(c.count)} <span className="text-gray-400">({pct((c.count / total) * 100)})</span></span>
                                </div>
                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${(c.count / total) * 100}%`, background: COLORS[i % COLORS.length] }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : <EmptyState message="No country data yet" />}
                  </CardContent>
                </Card>
              </div>

              {/* Registration trend */}
              <Card className="border-0 shadow-none bg-gray-50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-bold text-gray-900">Student Registration Trend — Last 12 Months</CardTitle>
                  <CardDescription className="text-xs">How student sign-ups have grown over time</CardDescription>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  {regTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={regTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gReg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="count" name="New Students" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : <EmptyState message="No registration trend data" />}
                </CardContent>
              </Card>

              {/* Cohort distribution */}
              <Card className="border-0 shadow-none bg-gray-50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-bold text-gray-900">Students by Cohort</CardTitle>
                  <CardDescription className="text-xs">Distribution of fellows across different cohorts</CardDescription>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  {cohortDist.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={cohortDist} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="cohort" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                          {cohortDist.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <EmptyState message="No cohort data available" />}
                </CardContent>
              </Card>
            </TabsContent>

          </div>
        </Tabs>
      </div>
    </div>
  );
}
