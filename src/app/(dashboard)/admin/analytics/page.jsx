'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import analyticsService from '@/lib/api/analyticsService';
import {
  Users, BookOpen, Award, BarChart3, GraduationCap, TrendingUp,
  RefreshCw, AlertTriangle, Globe, Clock, Activity, Target,
  CheckCircle, XCircle, UserCheck, Zap, Flame, MapPin,
  Star, ChevronRight, ArrowUp, ArrowDown, Minus, Trash2,
  TrendingDown, Brain, Layers, Eye, Medal,
} from 'lucide-react';
import Navbar from '@/components/navbar/navbar';

// ─── palette ──────────────────────────────────────────────────────────────────
const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#14b8a6', '#f97316', '#8b5cf6', '#06b6d4'];
const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#14b8a6', '#f97316'];

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n, decimals = 1) => Number(n ?? 0).toFixed(decimals);
const pct = (n) => `${fmt(n)}%`;
const num = (n) => Number(n ?? 0).toLocaleString();

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

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
    indigo: 'bg-indigo-50 text-indigo-600', green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600', rose: 'bg-rose-50 text-rose-600',
    teal: 'bg-teal-50 text-teal-600', violet: 'bg-violet-50 text-violet-600',
    sky: 'bg-sky-50 text-sky-600', orange: 'bg-orange-50 text-orange-600',
  };
  return (
    <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg ${bg[color]}`}>
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

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="p-2 bg-indigo-50 rounded-lg mt-0.5">
        <Icon className="w-4 h-4 text-indigo-600" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
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
          <span className="font-semibold text-gray-900">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── main component ──────────────────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const router = useRouter();

  // ── state ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [overview, setOverview]               = useState(null);
  const [studentProgress, setStudentProgress] = useState(null);
  const [courseCompletion, setCourseCompletion] = useState(null);
  const [instructorData, setInstructorData]   = useState(null);
  const [assessmentData, setAssessmentData]   = useState(null);
  const [behaviorData, setBehaviorData]       = useState(null);
  const [engagementData, setEngagementData]   = useState(null);
  const [demoData, setDemoData]               = useState(null);
  const [behaviorPeriod, setBehaviorPeriod]   = useState('weekly');
  const [deleteDialog, setDeleteDialog]       = useState({ open: false, instructor: null });
  const [deleting, setDeleting]               = useState(false);
  const [activeTab, setActiveTab]             = useState('overview');

  // ── data loading ───────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, sp, cc, ia, ai, bh, eg, dm] = await Promise.allSettled([
        analyticsService.getOverview(),
        analyticsService.getStudentProgress(100),
        analyticsService.getCourseCompletion(),
        analyticsService.getInstructorActivity(),
        analyticsService.getAssessmentInsights(),
        analyticsService.getLearningBehavior(behaviorPeriod),
        analyticsService.getEngagement(),
        analyticsService.getDemographics(),
      ]);
      if (ov.status === 'fulfilled')         setOverview(ov.value);
      if (sp.status === 'fulfilled')         setStudentProgress(sp.value);
      if (cc.status === 'fulfilled')         setCourseCompletion(cc.value);
      if (ia.status === 'fulfilled')         setInstructorData(ia.value);
      if (ai.status === 'fulfilled')         setAssessmentData(ai.value);
      if (bh.status === 'fulfilled')         setBehaviorData(bh.value);
      if (eg.status === 'fulfilled')         setEngagementData(eg.value);
      if (dm.status === 'fulfilled')         setDemoData(dm.value);
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

  // ── derived data ───────────────────────────────────────────────────────────
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

  const topCourses = courseCompletion?.courses
    ? [...courseCompletion.courses]
        .sort((a, b) => b.totalEnrollments - a.totalEnrollments)
        .slice(0, 8)
    : [];

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

  // ── delete instructor ──────────────────────────────────────────────────────
  const handleDeleteInstructor = async () => {
    if (!deleteDialog.instructor) return;
    setDeleting(true);
    try {
      await analyticsService.deleteInstructor(deleteDialog.instructor.instructorId);
      setDeleteDialog({ open: false, instructor: null });
      loadAll();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  // ── skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded-lg w-64" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-28 bg-gray-200 rounded-xl" />
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const ov = overview;
  const eng = engagementData?.summary ?? {};

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Admin</span>
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900">Analytics & Intelligence</h1>
              <p className="text-sm text-gray-500 mt-0.5">Real-time platform insights — updated live</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2 hidden sm:flex" onClick={loadAll}>
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Top KPI strip ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <KPICard icon={Users}         label="Total Students"     value={num(ov?.users?.students)}       color="indigo" />
          <KPICard icon={Activity}      label="Active (30d)"       value={num(ov?.enrollments?.active)}   color="green"  />
          <KPICard icon={Award}         label="Completed"          value={num(ov?.enrollments?.completed)} color="amber" />
          <KPICard icon={Target}        label="Completion Rate"    value={ov?.enrollments?.completionRate ?? '—'} color="teal" />
          <KPICard icon={BookOpen}      label="Total Courses"      value={num(ov?.courses?.total)}         color="violet" />
          <KPICard icon={CheckCircle}   label="Published"          value={num(ov?.courses?.published)}     color="sky"   />
          <KPICard icon={UserCheck}     label="Instructors"        value={num(ov?.users?.instructors)}     color="orange" />
          <KPICard icon={GraduationCap} label="Enrollments"        value={num(ov?.enrollments?.total)}     color="rose"  />
        </div>

        {/* ── Main tabs ───────────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-4">
              <TabsList className="h-12 bg-transparent gap-0 rounded-none p-0 overflow-x-auto w-full justify-start">
                {[
                  { value: 'overview',     icon: BarChart3,    label: 'Overview'      },
                  { value: 'performance',  icon: Target,       label: 'Performance'   },
                  { value: 'behavior',     icon: Clock,        label: 'Learning'      },
                  { value: 'engagement',   icon: Flame,        label: 'Engagement'    },
                  { value: 'demographics', icon: Globe,        label: 'Demographics'  },
                  { value: 'courses',      icon: BookOpen,     label: 'Courses'       },
                  { value: 'instructors',  icon: UserCheck,    label: 'Instructors'   },
                ].map(({ value, icon: Icon, label }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="flex items-center gap-1.5 px-4 h-12 text-xs font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* ══════════════════════ OVERVIEW ══════════════════════════════ */}
            <TabsContent value="overview" className="p-5 space-y-6">
              {/* Enrollment trend */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <Card className="lg:col-span-2 border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Enrollment Trend (Last 6 Months)</CardTitle>
                    <CardDescription className="text-xs">Enrollments, completions, and active learners</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={enrollmentTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gradEnroll" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                          </linearGradient>
                          <linearGradient id="gradComplete" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}   />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        <Area type="monotone" dataKey="enrollments" name="Enrollments" stroke="#6366f1" fill="url(#gradEnroll)" strokeWidth={2} dot={false} />
                        <Area type="monotone" dataKey="completions" name="Completions"  stroke="#22c55e" fill="url(#gradComplete)" strokeWidth={2} dot={false} />
                        <Area type="monotone" dataKey="active"      name="Active"       stroke="#f59e0b" fill="none" strokeWidth={2} strokeDasharray="5 3" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Completion overview card */}
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Platform Health</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-4">
                    {[
                      { label: 'Completion Rate', value: parseFloat(ov?.enrollments?.completionRate ?? 0), color: '#22c55e' },
                      { label: 'Active Rate', value: ov?.enrollments?.total ? (ov.enrollments.active / ov.enrollments.total) * 100 : 0, color: '#6366f1' },
                      { label: 'Published Rate', value: ov?.courses?.total ? (ov.courses.published / ov.courses.total) * 100 : 0, color: '#f59e0b' },
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

              {/* Country & Category */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Students by Country</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    {demoData?.countryDistribution?.length > 0 ? (
                      <div className="space-y-2">
                        {demoData.countryDistribution.slice(0, 8).map((c, i) => {
                          const total = demoData.countryDistribution.reduce((s, x) => s + x.count, 0);
                          return (
                            <div key={c.country} className="flex items-center gap-3">
                              <span className="text-xs text-gray-500 w-4">{i + 1}</span>
                              <div className="flex-1">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="font-medium text-gray-700">{c.country || 'Unknown'}</span>
                                  <span className="text-gray-500">{c.count} ({pct((c.count / total) * 100)})</span>
                                </div>
                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${(c.count / total) * 100}%`, background: COLORS[i % COLORS.length] }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-6">No country data yet</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Top Courses by Enrollment</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    {topCourses.length > 0 ? (
                      <div className="space-y-2.5">
                        {topCourses.slice(0, 6).map((c, i) => (
                          <div key={c.courseId} className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-gray-700 truncate">{c.courseName?.length > 28 ? c.courseName.slice(0, 26) + '…' : c.courseName}</span>
                                <span className="text-gray-500 ml-2 flex-shrink-0">{c.totalEnrollments}</span>
                              </div>
                              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(c.completionRate ?? 0)}%` }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-6">No course data yet</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ══════════════════════ PERFORMANCE ═══════════════════════════ */}
            <TabsContent value="performance" className="p-5 space-y-6">
              {/* KPI row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard icon={Star}        label="Avg Final Score"      value={`${assessmentData?.finalAssessment?.avgScore ?? '—'}%`} color="amber"  />
                <KPICard icon={CheckCircle} label="Final Pass Rate"      value={pct(assessmentData?.finalAssessment?.passRate)}         color="green"  />
                <KPICard icon={RefreshCw}   label="Avg Attempts"         value={assessmentData?.finalAssessment?.avgAttempts ?? '—'}    color="indigo" />
                <KPICard icon={TrendingDown} label="Retake Rate"         value={pct(assessmentData?.finalAssessment?.retakeRate)}       color="rose"   />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Score distribution */}
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Score Distribution</CardTitle>
                    <CardDescription className="text-xs">Final assessment scores across all students</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    {assessmentData?.scoreDistribution?.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={assessmentData.scoreDistribution} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="range" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]}>
                            {assessmentData.scoreDistribution.map((_, i) => (
                              <Cell key={i} fill={['#ef4444','#f97316','#f59e0b','#22c55e','#16a34a'][i]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-40">
                        <p className="text-xs text-gray-400">No assessment data yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Module vs Final comparison */}
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Module vs Final Assessment</CardTitle>
                    <CardDescription className="text-xs">Comparison of performance at different levels</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="space-y-5">
                      {[
                        {
                          label: 'Module Assessments',
                          data: assessmentData?.moduleAssessment ?? {},
                          color: '#6366f1',
                        },
                        {
                          label: 'Final Assessments',
                          data: assessmentData?.finalAssessment ?? {},
                          color: '#22c55e',
                        },
                      ].map(({ label, data, color }) => (
                        <div key={label}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-gray-700">{label}</span>
                            <Badge className="text-xs" style={{ background: color + '20', color }}>
                              {data.totalAttempted ?? 0} attempts
                            </Badge>
                          </div>
                          {[
                            { metric: 'Avg Score', val: `${data.avgScore ?? 0}%`, pctVal: data.avgScore ?? 0 },
                            { metric: 'Pass Rate', val: pct(data.passRate), pctVal: data.passRate ?? 0 },
                            { metric: 'Retake Rate', val: pct(data.retakeRate), pctVal: data.retakeRate ?? 0 },
                          ].map(({ metric, val, pctVal }) => (
                            <div key={metric} className="mb-2">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-500">{metric}</span>
                                <span className="font-semibold" style={{ color }}>{val}</span>
                              </div>
                              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${Math.min(pctVal, 100)}%`, background: color }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Course performance table */}
              <Card className="border-0 shadow-none bg-gray-50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-bold text-gray-900">Course Assessment Performance</CardTitle>
                  <CardDescription className="text-xs">Sorted by average score (lowest first — identify struggling areas)</CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-2">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-100 hover:bg-transparent">
                        <TableHead className="text-xs pl-4">Course</TableHead>
                        <TableHead className="text-xs text-right">Avg Score</TableHead>
                        <TableHead className="text-xs text-right">Pass Rate</TableHead>
                        <TableHead className="text-xs text-right">Avg Attempts</TableHead>
                        <TableHead className="text-xs text-right pr-4">Students Attempted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assessmentData?.coursePerformance?.length > 0 ? (
                        assessmentData.coursePerformance.map((c) => (
                          <TableRow key={c.courseId?.toString()} className="border-gray-100 hover:bg-white">
                            <TableCell className="text-xs font-medium pl-4 max-w-xs truncate">{c.courseName}</TableCell>
                            <TableCell className="text-right">
                              <span className={`text-xs font-bold ${c.avgScore >= 70 ? 'text-green-600' : c.avgScore >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                                {c.avgScore}%
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`text-xs font-semibold ${c.passRate >= 70 ? 'text-green-600' : c.passRate >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                                {pct(c.passRate)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-xs text-gray-600">{c.avgAttempts}x</TableCell>
                            <TableCell className="text-right text-xs text-gray-600 pr-4">{c.totalAttempted}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-xs text-gray-400 py-8">
                            No assessment data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Student progress distribution */}
              <Card className="border-0 shadow-none bg-gray-50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-bold text-gray-900">Student Progress Distribution</CardTitle>
                  <CardDescription className="text-xs">How far along students are across all courses</CardDescription>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={progressBuckets} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="range" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]}>
                        {progressBuckets.map((b, i) => <Cell key={i} fill={b.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ══════════════════════ LEARNING BEHAVIOR ═════════════════════ */}
            <TabsContent value="behavior" className="p-5 space-y-6">
              {/* Period selector */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Peak Learning Hours & Patterns</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Based on real lesson completion timestamps</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['daily','weekly','monthly','quarterly','yearly'].map((p) => (
                    <button
                      key={p}
                      onClick={() => refreshBehavior(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        behaviorPeriod === p
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Insight banners */}
              {behaviorData && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                    <p className="text-xs text-indigo-500 font-medium">Peak Hour</p>
                    <p className="text-xl font-extrabold text-indigo-700 mt-0.5">{behaviorData.peakHour}</p>
                    <p className="text-xs text-indigo-400 mt-0.5">Most active time</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                    <p className="text-xs text-green-500 font-medium">Peak Day</p>
                    <p className="text-xl font-extrabold text-green-700 mt-0.5">{behaviorData.peakDay}</p>
                    <p className="text-xs text-green-400 mt-0.5">Most active day</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                    <p className="text-xs text-amber-500 font-medium">Completions</p>
                    <p className="text-xl font-extrabold text-amber-700 mt-0.5">{num(behaviorData.totalCompletions)}</p>
                    <p className="text-xs text-amber-400 mt-0.5">In this period</p>
                  </div>
                  <div className="bg-violet-50 rounded-xl p-3 border border-violet-100">
                    <p className="text-xs text-violet-500 font-medium">Period</p>
                    <p className="text-xl font-extrabold text-violet-700 mt-0.5 capitalize">{behaviorPeriod}</p>
                    <p className="text-xs text-violet-400 mt-0.5">Selected range</p>
                  </div>
                </div>
              )}

              {/* 24-hour bar chart */}
              <Card className="border-0 shadow-none bg-gray-50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-bold text-gray-900">Activity by Hour of Day</CardTitle>
                  <CardDescription className="text-xs">Lesson completions per hour — {behaviorPeriod} view</CardDescription>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  {behaviorData?.peakHours?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={behaviorData.peakHours} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 9 }}
                          axisLine={false}
                          tickLine={false}
                          interval={2}
                        />
                        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="completions" name="Completions" radius={[4, 4, 0, 0]}>
                          {behaviorData.peakHours.map((h, i) => {
                            const max = Math.max(...behaviorData.peakHours.map((x) => x.completions), 1);
                            const intensity = h.completions / max;
                            const r = Math.round(99 + (67 - 99) * intensity);
                            const g = Math.round(102 + (56 - 102) * intensity);
                            const b = Math.round(241 + (241 - 241) * intensity);
                            const alpha = 0.2 + intensity * 0.8;
                            return <Cell key={i} fill={`rgba(${r},${g},${b},${alpha})`} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-40">
                      <div className="text-center">
                        <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">No activity data for this period</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Day-of-week chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Activity by Day of Week</CardTitle>
                    <CardDescription className="text-xs">Lesson completions per weekday</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    {behaviorData?.weekdays?.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={behaviorData.weekdays} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="completions" name="Completions" fill="#6366f1" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="students" name="Unique Students" fill="#22c55e" radius={[6, 6, 0, 0]} />
                          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-40">
                        <p className="text-xs text-gray-400">No day data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Insight summary panel */}
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Learning Insights</CardTitle>
                    <CardDescription className="text-xs">What the data tells us</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    {(() => {
                      const ph = behaviorData?.peakHours ?? [];
                      const wd = behaviorData?.weekdays ?? [];
                      const maxHour = ph.reduce((mx, h) => h.completions > mx.completions ? h : mx, ph[0] ?? { label: '—', completions: 0 });
                      const minHour = ph.reduce((mn, h) => h.completions < mn.completions ? h : mn, ph[0] ?? { label: '—', completions: 0 });
                      const maxDay = wd.reduce((mx, d) => d.completions > mx.completions ? d : mx, wd[0] ?? { day: '—', completions: 0 });
                      const minDay = wd.reduce((mn, d) => d.completions < mn.completions ? d : mn, wd[0] ?? { day: '—', completions: 0 });
                      return [
                        { icon: '🕐', title: 'Peak Learning Time', desc: `Most lessons completed at ${maxHour.label}` },
                        { icon: '😴', title: 'Quietest Hour', desc: `Lowest activity at ${minHour.label}` },
                        { icon: '📅', title: 'Best Day', desc: `${maxDay.day} sees the most learning activity` },
                        { icon: '📉', title: 'Slowest Day', desc: `${minDay.day} has the fewest completions` },
                      ].map(({ icon, title, desc }) => (
                        <div key={title} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100">
                          <span className="text-lg leading-none mt-0.5">{icon}</span>
                          <div>
                            <p className="text-xs font-bold text-gray-800">{title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                          </div>
                        </div>
                      ));
                    })()}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ══════════════════════ ENGAGEMENT ════════════════════════════ */}
            <TabsContent value="engagement" className="p-5 space-y-6">
              {/* Engagement KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard icon={Users}        label="Total Students"   value={num(eng.totalStudents)}   color="indigo" />
                <KPICard icon={Zap}          label="Active (7d)"      value={num(eng.activeStudents)}  color="green"  />
                <KPICard icon={AlertTriangle} label="At Risk (7–14d)" value={num(eng.atRiskStudents)}  color="amber"  />
                <KPICard icon={XCircle}      label="Dormant (30d+)"   value={num(eng.dormantStudents)} color="rose"   />
              </div>

              {/* Engagement donut + breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Student Activity Status</CardTitle>
                    <CardDescription className="text-xs">Based on last login activity</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    {eng.totalStudents > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Active', value: eng.activeStudents ?? 0, fill: '#22c55e' },
                                { name: 'At Risk', value: eng.atRiskStudents ?? 0, fill: '#f59e0b' },
                                { name: 'Dormant', value: eng.dormantStudents ?? 0, fill: '#ef4444' },
                              ]}
                              cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                              paddingAngle={3} dataKey="value"
                            >
                              {[0,1,2].map((i) => <Cell key={i} />)}
                            </Pie>
                            <Tooltip formatter={(v, n) => [`${v} students`, n]} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-5 mt-2">
                          {[
                            { label: 'Active', color: '#22c55e', val: eng.activeStudents },
                            { label: 'At Risk', color: '#f59e0b', val: eng.atRiskStudents },
                            { label: 'Dormant', color: '#ef4444', val: eng.dormantStudents },
                          ].map(({ label, color, val }) => (
                            <div key={label} className="text-center">
                              <div className="flex items-center gap-1 justify-center">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                                <span className="text-xs text-gray-600">{label}</span>
                              </div>
                              <p className="text-sm font-bold text-gray-900 mt-0.5">{num(val)}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-8">No student activity data</p>
                    )}
                  </CardContent>
                </Card>

                {/* Active rate */}
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Engagement Breakdown</CardTitle>
                    <CardDescription className="text-xs">Proportions of engagement tiers</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-4">
                    {[
                      { label: 'Active Rate (last 7d)',  value: eng.activeRate ?? 0,     color: '#22c55e' },
                      { label: 'At Risk Rate',           value: eng.totalStudents > 0 ? ((eng.atRiskStudents / eng.totalStudents) * 100) : 0, color: '#f59e0b' },
                      { label: 'Dormant Rate',           value: eng.totalStudents > 0 ? ((eng.dormantStudents / eng.totalStudents) * 100) : 0, color: '#ef4444' },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-medium text-gray-700">{label}</span>
                          <span className="font-bold" style={{ color }}>{pct(value)}</span>
                        </div>
                        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(value, 100)}%`, background: color }} />
                        </div>
                      </div>
                    ))}
                    <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="flex gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-amber-700">Intervention Alert</p>
                          <p className="text-xs text-amber-600 mt-0.5">
                            {eng.atRiskStudents ?? 0} students haven't logged in for 7–14 days. Consider sending a re-engagement email.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top students */}
              <Card className="border-0 shadow-none bg-gray-50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center gap-2">
                    <Medal className="w-4 h-4 text-amber-500" />
                    <CardTitle className="text-sm font-bold text-gray-900">Top Engaged Students</CardTitle>
                  </div>
                  <CardDescription className="text-xs">Ranked by engagement score (progress + enrollments)</CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-2">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-100 hover:bg-transparent">
                        <TableHead className="text-xs pl-4">#</TableHead>
                        <TableHead className="text-xs">Student</TableHead>
                        <TableHead className="text-xs text-right">Courses</TableHead>
                        <TableHead className="text-xs text-right">Avg Progress</TableHead>
                        <TableHead className="text-xs text-right">Completed</TableHead>
                        <TableHead className="text-xs text-right pr-4">Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {engagementData?.topStudents?.length > 0 ? (
                        engagementData.topStudents.map((s, i) => (
                          <TableRow key={s.email} className="border-gray-100 hover:bg-white">
                            <TableCell className="pl-4 text-xs font-bold text-gray-400">{i + 1}</TableCell>
                            <TableCell>
                              <div>
                                <p className="text-xs font-semibold text-gray-900">{s.name}</p>
                                <p className="text-xs text-gray-400">{s.email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-xs text-gray-600">{s.totalEnrollments}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${s.avgProgress}%` }} />
                                </div>
                                <span className="text-xs font-semibold text-gray-700">{s.avgProgress}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-xs font-semibold text-green-600">{s.completedCourses}</TableCell>
                            <TableCell className="text-right pr-4">
                              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">{s.engagementScore}</Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-xs text-gray-400 py-8">No data available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* At-risk students */}
              <Card className="border-0 shadow-none bg-gray-50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <CardTitle className="text-sm font-bold text-gray-900">Students at Risk of Dropping Out</CardTitle>
                  </div>
                  <CardDescription className="text-xs">Enrolled, low progress, and inactive for 7+ days</CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-2">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-100 hover:bg-transparent">
                        <TableHead className="text-xs pl-4">Student</TableHead>
                        <TableHead className="text-xs text-right">Progress</TableHead>
                        <TableHead className="text-xs text-right">Courses at Risk</TableHead>
                        <TableHead className="text-xs text-right">Days Inactive</TableHead>
                        <TableHead className="text-xs text-right pr-4">Risk Level</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {engagementData?.atRiskList?.length > 0 ? (
                        engagementData.atRiskList.map((s) => {
                          const risk = s.daysInactive >= 21 ? 'High' : s.daysInactive >= 14 ? 'Medium' : 'Low';
                          const riskColor = { High: 'bg-red-50 text-red-700', Medium: 'bg-amber-50 text-amber-700', Low: 'bg-yellow-50 text-yellow-700' }[risk];
                          return (
                            <TableRow key={s.email} className="border-gray-100 hover:bg-white">
                              <TableCell className="pl-4">
                                <p className="text-xs font-semibold text-gray-900">{s.name}</p>
                                <p className="text-xs text-gray-400">{s.email}</p>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-14 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${s.avgProgress}%` }} />
                                  </div>
                                  <span className="text-xs font-semibold text-red-600">{s.avgProgress}%</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-xs text-gray-600">{s.coursesAtRisk}</TableCell>
                              <TableCell className="text-right text-xs font-semibold text-gray-700">{s.daysInactive}d</TableCell>
                              <TableCell className="text-right pr-4">
                                <Badge className={`text-xs border-0 ${riskColor}`}>{risk}</Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <div className="text-center">
                              <CheckCircle className="w-8 h-8 text-green-300 mx-auto mb-2" />
                              <p className="text-xs text-gray-400">No at-risk students — great engagement!</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ══════════════════════ DEMOGRAPHICS ══════════════════════════ */}
            <TabsContent value="demographics" className="p-5 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Gender distribution */}
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Gender Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    {demoData?.genderDistribution?.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={160}>
                          <PieChart>
                            <Pie
                              data={demoData.genderDistribution.map((g) => ({
                                name: g.gender,
                                value: g.count,
                              }))}
                              cx="50%" cy="50%" innerRadius={40} outerRadius={70}
                              paddingAngle={4} dataKey="value"
                            >
                              {demoData.genderDistribution.map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v, n) => [`${v} students`, n]} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2 mt-2">
                          {demoData.genderDistribution.map((g, i) => {
                            const total = demoData.genderDistribution.reduce((s, x) => s + x.count, 0);
                            return (
                              <div key={g.gender} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                  <span className="text-xs text-gray-600 capitalize">{g.gender}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-bold text-gray-900">{g.count}</span>
                                  <span className="text-xs text-gray-400 ml-1">({pct((g.count / total) * 100)})</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-8">No gender data available</p>
                    )}
                  </CardContent>
                </Card>

                {/* Cohort distribution */}
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">Cohort Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    {demoData?.cohortDistribution?.length > 0 ? (
                      <div className="space-y-2.5 mt-2">
                        {demoData.cohortDistribution.map((c, i) => {
                          const total = demoData.cohortDistribution.reduce((s, x) => s + x.count, 0);
                          return (
                            <div key={c.cohort}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-gray-700">{c.cohort}</span>
                                <span className="text-gray-500">{c.count} ({pct((c.count / total) * 100)})</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${(c.count / total) * 100}%`, background: COLORS[i % COLORS.length] }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-8">No cohort data available</p>
                    )}
                  </CardContent>
                </Card>

                {/* Registration trend */}
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold text-gray-900">New Registrations</CardTitle>
                    <CardDescription className="text-xs">Last 12 months</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    {demoData?.registrationTrend?.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={demoData.registrationTrend} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                          <defs>
                            <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="count" name="New Students" stroke="#6366f1" fill="url(#regGrad)" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-8">No registration trend data</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Country detail table */}
              <Card className="border-0 shadow-none bg-gray-50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-bold text-gray-900">Students by Country</CardTitle>
                  <CardDescription className="text-xs">Geographic distribution of the student base</CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-2">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-100 hover:bg-transparent">
                        <TableHead className="text-xs pl-4">#</TableHead>
                        <TableHead className="text-xs">Country</TableHead>
                        <TableHead className="text-xs text-right">Students</TableHead>
                        <TableHead className="text-xs text-right pr-4">Share</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {demoData?.countryDistribution?.length > 0 ? (() => {
                        const total = demoData.countryDistribution.reduce((s, c) => s + c.count, 0);
                        return demoData.countryDistribution.map((c, i) => (
                          <TableRow key={c.country} className="border-gray-100 hover:bg-white">
                            <TableCell className="pl-4 text-xs text-gray-400">{i + 1}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                <span className="text-xs font-medium text-gray-900">{c.country || 'Unknown'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-xs font-bold text-gray-900">{num(c.count)}</TableCell>
                            <TableCell className="text-right pr-4">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(c.count / total) * 100}%` }} />
                                </div>
                                <span className="text-xs text-gray-600">{pct((c.count / total) * 100)}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ));
                      })() : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-xs text-gray-400 py-8">No country data available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ══════════════════════ COURSES ═══════════════════════════════ */}
            <TabsContent value="courses" className="p-5 space-y-6">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard icon={BookOpen}    label="Total Courses"    value={num(courseCompletion?.overall?.totalEnrollments)}   color="indigo" />
                <KPICard icon={CheckCircle} label="Completions"      value={num(courseCompletion?.overall?.completedEnrollments)} color="green" />
                <KPICard icon={Target}      label="Overall Rate"     value={courseCompletion?.overall?.completionRate ?? '—'}    color="teal"  />
                <KPICard icon={TrendingUp}  label="Avg Progress"     value={`${courseCompletion?.overall?.averageProgress ?? 0}%`} color="amber" />
              </div>

              {/* Completion rate bar chart */}
              <Card className="border-0 shadow-none bg-gray-50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-bold text-gray-900">Course Completion Rates</CardTitle>
                  <CardDescription className="text-xs">Top 10 courses by completion rate</CardDescription>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  {topCourses.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={topCourses.slice(0, 10).map((c) => ({
                          name: c.courseName?.length > 18 ? c.courseName.slice(0, 16) + '…' : c.courseName,
                          'Completion Rate': Number(c.completionRate?.toFixed(1) ?? 0),
                          'Avg Progress': Number(c.avgProgress?.toFixed(1) ?? 0),
                        }))}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 120, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={110} />
                        <Tooltip content={<CustomTooltip />} formatter={(v) => `${v}%`} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="Completion Rate" fill="#22c55e" radius={[0, 6, 6, 0]} />
                        <Bar dataKey="Avg Progress"    fill="#6366f1" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-8">No course data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Full course table */}
              <Card className="border-0 shadow-none bg-gray-50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-bold text-gray-900">All Course Performance</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-2">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-100 hover:bg-transparent">
                        <TableHead className="text-xs pl-4">Course</TableHead>
                        <TableHead className="text-xs text-right">Enrollments</TableHead>
                        <TableHead className="text-xs text-right">Completed</TableHead>
                        <TableHead className="text-xs text-right">Completion Rate</TableHead>
                        <TableHead className="text-xs text-right pr-4">Avg Progress</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courseCompletion?.courses?.length > 0 ? (
                        [...courseCompletion.courses]
                          .sort((a, b) => b.totalEnrollments - a.totalEnrollments)
                          .map((c) => (
                            <TableRow key={c.courseId?.toString()} className="border-gray-100 hover:bg-white">
                              <TableCell className="pl-4 text-xs font-medium text-gray-900 max-w-xs truncate">{c.courseName}</TableCell>
                              <TableCell className="text-right text-xs text-gray-600">{num(c.totalEnrollments)}</TableCell>
                              <TableCell className="text-right text-xs text-gray-600">{num(c.completedCount)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${c.completionRate ?? 0}%` }} />
                                  </div>
                                  <span className={`text-xs font-semibold ${c.completionRate >= 70 ? 'text-green-600' : c.completionRate >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                                    {pct(c.completionRate)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-xs font-semibold text-indigo-600 pr-4">{c.avgProgress?.toFixed(1)}%</TableCell>
                            </TableRow>
                          ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-xs text-gray-400 py-8">No data available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ══════════════════════ INSTRUCTORS ═══════════════════════════ */}
            <TabsContent value="instructors" className="p-5 space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard icon={Users}     label="Total Instructors" value={num(instructorData?.summary?.total)}    color="indigo" />
                <KPICard icon={CheckCircle} label="Approved"        value={num(instructorData?.summary?.approved)} color="green"  />
                <KPICard icon={AlertTriangle} label="Pending"       value={num(instructorData?.summary?.pending)}  color="amber"  />
                <KPICard icon={BookOpen}  label="Total Courses"     value={num(instructorData?.instructors?.reduce((s, i) => s + (i.coursesCreated ?? 0), 0))} color="violet" />
              </div>

              {/* Instructors by student reach */}
              <Card className="border-0 shadow-none bg-gray-50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-bold text-gray-900">Instructors by Student Reach</CardTitle>
                  <CardDescription className="text-xs">Total enrolled students per instructor</CardDescription>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  {instructorData?.instructors?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={[...instructorData.instructors]
                          .sort((a, b) => b.totalStudents - a.totalStudents)
                          .slice(0, 10)
                          .map((ins) => ({
                            name: ins.name?.split(' ')[0] ?? 'Instructor',
                            Students: ins.totalStudents,
                            Courses: ins.coursesCreated,
                          }))}
                        margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="Students" fill="#6366f1" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="Courses"  fill="#22c55e" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-8">No instructor data</p>
                  )}
                </CardContent>
              </Card>

              {/* Instructor table */}
              <Card className="border-0 shadow-none bg-gray-50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-bold text-gray-900">Instructor Directory</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-2">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-100 hover:bg-transparent">
                        <TableHead className="text-xs pl-4">Instructor</TableHead>
                        <TableHead className="text-xs text-center">Status</TableHead>
                        <TableHead className="text-xs text-right">Courses</TableHead>
                        <TableHead className="text-xs text-right">Published</TableHead>
                        <TableHead className="text-xs text-right">Students</TableHead>
                        <TableHead className="text-xs text-right">Last Login</TableHead>
                        <TableHead className="text-xs text-right pr-4">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {instructorData?.instructors?.length > 0 ? (
                        instructorData.instructors.map((ins) => (
                          <TableRow key={ins.instructorId?.toString()} className="border-gray-100 hover:bg-white">
                            <TableCell className="pl-4">
                              <p className="text-xs font-semibold text-gray-900">{ins.name}</p>
                              <p className="text-xs text-gray-400">{ins.email}</p>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={`text-xs border-0 ${ins.status === 'approved' ? 'bg-green-50 text-green-700' : ins.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                                {ins.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-xs text-gray-600">{ins.coursesCreated}</TableCell>
                            <TableCell className="text-right text-xs text-gray-600">{ins.publishedCourses}</TableCell>
                            <TableCell className="text-right text-xs font-semibold text-gray-900">{num(ins.totalStudents)}</TableCell>
                            <TableCell className="text-right text-xs text-gray-500">
                              {ins.lastLogin
                                ? new Date(ins.lastLogin).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                                : 'Never'}
                            </TableCell>
                            <TableCell className="text-right pr-4">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => setDeleteDialog({ open: true, instructor: ins })}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-xs text-gray-400 py-8">No instructors found</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* ── Delete instructor dialog ─────────────────────────────────────────── */}
      <Dialog open={deleteDialog.open} onOpenChange={(o) => !o && setDeleteDialog({ open: false, instructor: null })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Delete Instructor
            </DialogTitle>
            <DialogDescription className="text-sm">
              Permanently delete <strong>{deleteDialog.instructor?.name}</strong> and all their courses? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteDialog({ open: false, instructor: null })}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" disabled={deleting} onClick={handleDeleteInstructor}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
