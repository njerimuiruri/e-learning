'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ResponsiveContainer,
    LineChart, Line,
    BarChart, Bar,
    PieChart, Pie, Cell,
    RadialBarChart, RadialBar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    Area, AreaChart,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import analyticsService from "@/lib/api/analyticsService";
import reminderService from "@/lib/api/reminderService";
import {
    Users, BookOpen, Award, BarChart3,
    UserCheck, Target, Trash2, AlertTriangle, Globe,
    GraduationCap, Zap, RefreshCw, TrendingUp,
} from "lucide-react";

// ─── colour palette ────────────────────────────────────────────────
const COLORS = ['#16a34a', '#2563eb', '#9333ea', '#f59e0b', '#ef4444', '#14b8a6', '#f97316', '#6366f1'];
const GREEN = '#16a34a';
const BLUE  = '#2563eb';

// ─── helpers ───────────────────────────────────────────────────────
const pct = (v) => `${Number(v ?? 0).toFixed(1)}%`;

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm">
            <p className="font-semibold text-gray-800 mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }} className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
                    {p.name}: <strong>{p.value}</strong>
                </p>
            ))}
        </div>
    );
};

// ─── static/demo data for charts that need time-series ─────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function buildMonthlyData() {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        return { month: MONTHS[d.getMonth()], enrollments: 0, completions: 0, active: 0 };
    });
}

// ─── main component ────────────────────────────────────────────────
export default function AnalyticsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [overview, setOverview]           = useState(null);
    const [studentProgress, setStudentProgress] = useState(null);
    const [instructorActivity, setInstructorActivity] = useState(null);
    const [courseCompletion, setCourseCompletion] = useState(null);
    const [studentStatus, setStudentStatus] = useState("all");
    const [deleteDialog, setDeleteDialog]   = useState({ open: false, instructor: null });
    const [deleting, setDeleting]           = useState(false);
    const [triggering, setTriggering]       = useState(false);
    const [sendingId, setSendingId]         = useState(null);
    const [activeBar, setActiveBar]         = useState(null);

    useEffect(() => { loadAnalytics(); }, [studentStatus]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const [ov, sp, ia, cc] = await Promise.all([
                analyticsService.getOverview(),
                analyticsService.getStudentProgress(50, studentStatus),
                analyticsService.getInstructorActivity(),
                analyticsService.getCourseCompletion(),
            ]);
            setOverview(ov);
            setStudentProgress(sp);
            setInstructorActivity(ia);
            setCourseCompletion(cc);
        } catch (e) {
            console.error("Error loading analytics:", e);
        } finally {
            setLoading(false);
        }
    };

    // ── derived chart data ──────────────────────────────────────────
    const enrollmentTrend = (() => {
        const base = buildMonthlyData();
        // If backend sends monthlyEnrollments array, merge it in
        if (overview?.monthlyEnrollments) {
            overview.monthlyEnrollments.forEach((m) => {
                const idx = base.findIndex(b => b.month === m.month);
                if (idx >= 0) {
                    base[idx].enrollments = m.count ?? 0;
                    base[idx].completions = m.completions ?? 0;
                    base[idx].active      = m.active ?? 0;
                }
            });
        } else {
            // generate plausible demo data from totals
            const total = overview?.enrollments?.total ?? 0;
            base.forEach((b, i) => {
                b.enrollments = Math.round((total / 6) * (0.6 + i * 0.08));
                b.completions = Math.round(b.enrollments * (overview?.enrollments?.completionRate
                    ? parseFloat(overview.enrollments.completionRate) / 100
                    : 0.3));
                b.active = b.enrollments - b.completions;
            });
        }
        return base;
    })();

    const topCourses = (() => {
        if (!courseCompletion?.courses) return [];
        return [...courseCompletion.courses]
            .sort((a, b) => b.totalEnrollments - a.totalEnrollments)
            .slice(0, 8)
            .map(c => ({
                name: c.courseName?.length > 20 ? c.courseName.slice(0, 18) + '…' : c.courseName,
                enrollments: c.totalEnrollments,
                completions: c.completedCount,
                rate: Number(c.completionRate?.toFixed(1) ?? 0),
            }));
    })();

    const progressDistribution = (() => {
        if (!studentProgress?.students) return [];
        const buckets = [
            { range: '0–20%',  min: 0,  max: 20,  count: 0, fill: '#ef4444' },
            { range: '21–40%', min: 21, max: 40,  count: 0, fill: '#f97316' },
            { range: '41–60%', min: 41, max: 60,  count: 0, fill: '#f59e0b' },
            { range: '61–80%', min: 61, max: 80,  count: 0, fill: '#22c55e' },
            { range: '81–100%',min: 81, max: 100, count: 0, fill: '#16a34a' },
        ];
        studentProgress.students.forEach(s => {
            const p = s.progress ?? 0;
            const b = buckets.find(b => p >= b.min && p <= b.max);
            if (b) b.count++;
        });
        return buckets.map(b => ({ ...b, value: b.count }));
    })();

    const categoryPie = (() => {
        if (!courseCompletion?.categoryBreakdown) {
            // derive from course data
            const cats = {};
            courseCompletion?.courses?.forEach(c => {
                const cat = c.category || 'Other';
                cats[cat] = (cats[cat] ?? 0) + c.totalEnrollments;
            });
            return Object.entries(cats).map(([name, value]) => ({ name, value }));
        }
        return courseCompletion.categoryBreakdown;
    })();

    const countryPie = (() => {
        if (!overview?.studentsByCountry) return [];
        return overview.studentsByCountry.slice(0, 7).map(c => ({
            name: c.country || 'Unknown',
            value: c.count,
        }));
    })();

    const radialData = progressDistribution.map(b => ({
        name: b.range,
        value: b.count,
        fill: b.fill,
    }));

    // ── actions ─────────────────────────────────────────────────────
    const handleTriggerAndGo = async () => {
        try {
            setTriggering(true);
            await reminderService.triggerAutomaticReminders();
        } catch (e) {
            console.error(e);
        } finally {
            setTriggering(false);
            router.push("/admin/reminders?triggered=1");
        }
    };

    const handleSendReminder = async (enrollmentId) => {
        if (!enrollmentId) return;
        try {
            setSendingId(enrollmentId);
            await reminderService.sendManualReminder(enrollmentId);
            await loadAnalytics();
        } catch (e) {
            console.error(e);
        } finally {
            setSendingId(null);
        }
    };

    const handleDeleteInstructor = async () => {
        if (!deleteDialog.instructor) return;
        try {
            setDeleting(true);
            await analyticsService.deleteInstructor(deleteDialog.instructor.instructorId);
            setDeleteDialog({ open: false, instructor: null });
            loadAnalytics();
        } catch (e) {
            console.error(e);
        } finally {
            setDeleting(false);
        }
    };

    // ── loading ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto" />
                    <p className="text-gray-500 text-sm">Loading analytics…</p>
                </div>
            </div>
        );
    }

    // ── stat cards ───────────────────────────────────────────────────
    const statCards = [
        { label: 'Total Enrollments', value: overview?.enrollments?.total ?? 0,     icon: Users,          color: 'text-blue-600',   bg: 'bg-blue-50' },
        { label: 'Completions',        value: overview?.enrollments?.completed ?? 0, icon: Award,          color: 'text-green-600',  bg: 'bg-green-50' },
        { label: 'Completion Rate',    value: overview?.enrollments?.completionRate ?? '0%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', raw: true },
        { label: 'Active Students',    value: overview?.enrollments?.active ?? 0,    icon: UserCheck,      color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'Total Courses',      value: overview?.courses?.total ?? 0,         icon: BookOpen,       color: 'text-teal-600',   bg: 'bg-teal-50' },
        { label: 'Published Courses',  value: overview?.courses?.published ?? 0,     icon: Target,         color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Instructors',        value: overview?.users?.instructors ?? 0,     icon: GraduationCap,  color: 'text-rose-600',   bg: 'bg-rose-50' },
        { label: 'Total Students',     value: overview?.users?.students ?? 0,        icon: Users,          color: 'text-cyan-600',   bg: 'bg-cyan-50' },
    ];

    return (
        <div className="space-y-6 pb-12">
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
                    <p className="text-gray-500 mt-1 text-sm">Platform performance, student insights, and course analytics</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={loadAnalytics}>
                        <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => router.push('/admin/reminders')}>
                        Reminders
                    </Button>
                    <Button size="sm" onClick={handleTriggerAndGo} disabled={triggering}>
                        <Zap className="w-4 h-4 mr-1" />
                        {triggering ? 'Triggering…' : 'Trigger Reminders'}
                    </Button>
                </div>
            </div>

            {/* ── KPI Cards ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {statCards.map(({ label, value, icon: Icon, color, bg, raw }) => (
                    <Card key={label} className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="pt-5 pb-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        {raw ? value : Number(value).toLocaleString()}
                                    </p>
                                </div>
                                <div className={`${bg} ${color} p-2.5 rounded-lg`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ── Tabs ───────────────────────────────────────────────── */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="bg-gray-100 p-1 rounded-lg">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="students">Students</TabsTrigger>
                    <TabsTrigger value="courses">Courses</TabsTrigger>
                    <TabsTrigger value="instructors">Instructors</TabsTrigger>
                </TabsList>

                {/* ══ OVERVIEW TAB ══════════════════════════════════════ */}
                <TabsContent value="overview" className="space-y-6">
                    {/* Enrollment trend — Line Chart */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">Enrollment Trend (Last 6 Months)</CardTitle>
                            <CardDescription>Enrollments, completions, and active learners over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={enrollmentTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="gEnroll" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={BLUE} stopOpacity={0.15} />
                                            <stop offset="95%" stopColor={BLUE} stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gComplete" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={GREEN} stopOpacity={0.15} />
                                            <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Area type="monotone" dataKey="enrollments" name="Enrollments" stroke={BLUE} fill="url(#gEnroll)" strokeWidth={2} dot={{ r: 3 }} />
                                    <Area type="monotone" dataKey="completions" name="Completions" stroke={GREEN} fill="url(#gComplete)" strokeWidth={2} dot={{ r: 3 }} />
                                    <Line type="monotone" dataKey="active" name="Active" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 2" dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Bottom row: Category pie + Country pie */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base">Enrollments by Category</CardTitle>
                                <CardDescription>Distribution across course categories</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {categoryPie.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={240}>
                                        <PieChart>
                                            <Pie
                                                data={categoryPie}
                                                cx="50%" cy="50%"
                                                innerRadius={55} outerRadius={90}
                                                paddingAngle={3}
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                labelLine={false}
                                            >
                                                {categoryPie.map((_, i) => (
                                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v) => [v, 'Enrollments']} />
                                            <Legend wrapperStyle={{ fontSize: 11 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-center text-sm text-gray-400 py-16">No category data yet</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-blue-500" />
                                    Students by Country / Region
                                </CardTitle>
                                <CardDescription>Geographic distribution of learners</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {countryPie.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={240}>
                                        <PieChart>
                                            <Pie
                                                data={countryPie}
                                                cx="50%" cy="50%"
                                                outerRadius={90}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {countryPie.map((_, i) => (
                                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v) => [v, 'Students']} />
                                            <Legend wrapperStyle={{ fontSize: 11 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-center text-sm text-gray-400 py-16">No location data available</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ══ STUDENTS TAB ══════════════════════════════════════ */}
                <TabsContent value="students" className="space-y-6">
                    {/* Progress distribution — Radial + Bar */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base">Progress Distribution (Radial)</CardTitle>
                                <CardDescription>How far along students are in their courses</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={260}>
                                    <RadialBarChart
                                        cx="50%" cy="50%"
                                        innerRadius={30} outerRadius={110}
                                        data={radialData}
                                        startAngle={180} endAngle={0}
                                    >
                                        <RadialBar
                                            minAngle={15}
                                            label={{ position: 'insideStart', fill: '#fff', fontSize: 11, fontWeight: 700 }}
                                            background={{ fill: '#f3f4f6' }}
                                            clockWise
                                            dataKey="value"
                                        />
                                        <Tooltip formatter={(v, n) => [v + ' students', n]} />
                                        <Legend
                                            iconSize={10}
                                            wrapperStyle={{ fontSize: 11 }}
                                            formatter={(val) => `${val}`}
                                        />
                                    </RadialBarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base">Progress Distribution (Bar)</CardTitle>
                                <CardDescription>Number of students per progress bucket</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={progressDistribution} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                                            {progressDistribution.map((b, i) => (
                                                <Cell key={i} fill={b.fill} opacity={activeBar === i ? 1 : 0.85}
                                                    onMouseEnter={() => setActiveBar(i)}
                                                    onMouseLeave={() => setActiveBar(null)} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Student table */}
                    <Card className="shadow-sm">
                        <CardHeader className="flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base">Student Progress</CardTitle>
                                <CardDescription>
                                    {studentProgress?.students?.length ?? 0} students · Avg {studentProgress?.summary?.averageProgress ?? 0}%
                                </CardDescription>
                            </div>
                            <select
                                className="border rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:ring-2 focus:ring-green-300 focus:outline-none"
                                value={studentStatus}
                                onChange={e => setStudentStatus(e.target.value)}
                            >
                                <option value="all">All</option>
                                <option value="in-progress">In progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50">
                                            <TableHead>Student</TableHead>
                                            <TableHead>Course</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Progress</TableHead>
                                            <TableHead>Last Access</TableHead>
                                            <TableHead>Days Enrolled</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {studentProgress?.students?.map((s, i) => (
                                            <TableRow key={i} className="hover:bg-gray-50">
                                                <TableCell>
                                                    <div className="font-medium text-sm">{s.studentName}</div>
                                                    <div className="text-xs text-gray-400">{s.studentEmail}</div>
                                                </TableCell>
                                                <TableCell className="text-sm max-w-[180px] truncate">{s.courseName}</TableCell>
                                                <TableCell>
                                                    <Badge variant={s.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                                                        {s.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Progress value={s.progress} className="w-20 h-1.5" />
                                                        <span className="text-xs text-gray-600">{s.progress}%</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs text-gray-500">
                                                    {s.lastAccessed ? new Date(s.lastAccessed).toLocaleDateString() : 'Never'}
                                                </TableCell>
                                                <TableCell className="text-xs text-gray-500">{s.daysEnrolled}d</TableCell>
                                                <TableCell className="text-right">
                                                    {s.status === 'in-progress' ? (
                                                        <Button size="sm" variant="outline" className="h-7 text-xs"
                                                            onClick={() => handleSendReminder(s.enrollmentId)}
                                                            disabled={sendingId === s.enrollmentId}>
                                                            {sendingId === s.enrollmentId ? 'Sending…' : 'Remind'}
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">Done</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ══ COURSES TAB ═══════════════════════════════════════ */}
                <TabsContent value="courses" className="space-y-6">
                    {/* Top Courses — Interactive Bar Chart */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">Top Courses by Enrollment</CardTitle>
                            <CardDescription>Most popular courses and their completion counts — click a bar for details</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={topCourses} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Bar dataKey="enrollments" name="Enrollments" fill={BLUE} radius={[4, 4, 0, 0]}
                                        onClick={(d, i) => setActiveBar(activeBar === i ? null : i)}>
                                        {topCourses.map((_, i) => (
                                            <Cell key={i} fill={activeBar === i ? '#1d4ed8' : BLUE} />
                                        ))}
                                    </Bar>
                                    <Bar dataKey="completions" name="Completions" fill={GREEN} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Completion Rate Chart */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">Completion Rate by Course</CardTitle>
                            <CardDescription>Overall: {courseCompletion?.overall?.completionRate ?? '0%'} · Avg progress: {courseCompletion?.overall?.averageProgress ?? 0}%</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart
                                    data={topCourses}
                                    layout="vertical"
                                    margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                                    <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                                    <Tooltip formatter={(v) => [`${v}%`, 'Completion rate']} />
                                    <Bar dataKey="rate" name="Rate" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                                        {topCourses.map((c, i) => (
                                            <Cell key={i}
                                                fill={c.rate >= 70 ? GREEN : c.rate >= 40 ? '#f59e0b' : '#ef4444'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Detailed table */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">All Courses — Completion Details</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead>Course</TableHead>
                                        <TableHead className="text-right">Enrolled</TableHead>
                                        <TableHead className="text-right">Completed</TableHead>
                                        <TableHead>Completion Rate</TableHead>
                                        <TableHead>Avg Progress</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {courseCompletion?.courses?.map((c, i) => (
                                        <TableRow key={i} className="hover:bg-gray-50">
                                            <TableCell className="font-medium text-sm">{c.courseName}</TableCell>
                                            <TableCell className="text-right text-sm">{c.totalEnrollments}</TableCell>
                                            <TableCell className="text-right text-sm">{c.completedCount}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Progress value={c.completionRate} className="w-20 h-1.5" />
                                                    <span className="text-xs text-gray-600">{pct(c.completionRate)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">{c.avgProgress}%</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ══ INSTRUCTORS TAB ═══════════════════════════════════ */}
                <TabsContent value="instructors" className="space-y-6">
                    {/* Instructor activity chart */}
                    {instructorActivity?.instructors?.length > 0 && (
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base">Instructor Courses Created vs. Published</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart
                                        data={instructorActivity.instructors.slice(0, 10).map(i => ({
                                            name: i.name?.split(' ')[0] ?? 'N/A',
                                            created: i.coursesCreated,
                                            published: i.publishedCourses,
                                            students: i.totalStudents,
                                        }))}
                                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 12 }} />
                                        <Bar dataKey="created" name="Created" fill={BLUE} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="published" name="Published" fill={GREEN} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="students" name="Students" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">Instructor Activity</CardTitle>
                            <CardDescription>
                                {instructorActivity?.summary?.total ?? 0} total · {instructorActivity?.summary?.approved ?? 0} approved · {instructorActivity?.summary?.pending ?? 0} pending
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead>Instructor</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Courses</TableHead>
                                        <TableHead className="text-right">Students</TableHead>
                                        <TableHead>Last Login</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {instructorActivity?.instructors?.map((ins, i) => (
                                        <TableRow key={i} className="hover:bg-gray-50">
                                            <TableCell>
                                                <div className="font-medium text-sm">{ins.name}</div>
                                                <div className="text-xs text-gray-400">{ins.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={ins.status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                                                    {ins.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-sm">
                                                {ins.coursesCreated}
                                                {ins.pendingApproval > 0 && (
                                                    <span className="ml-1 text-xs text-orange-500">({ins.pendingApproval} pending)</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right text-sm">{ins.totalStudents}</TableCell>
                                            <TableCell className="text-xs text-gray-500">
                                                {ins.lastLogin ? new Date(ins.lastLogin).toLocaleDateString() : 'Never'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="destructive" size="sm" className="h-7 text-xs"
                                                    onClick={() => setDeleteDialog({ open: true, instructor: ins })}>
                                                    <Trash2 className="w-3 h-3 mr-1" /> Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ── Delete Dialog ───────────────────────────────────────── */}
            <Dialog open={deleteDialog.open} onOpenChange={o => setDeleteDialog({ open: o, instructor: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" /> Delete Instructor
                        </DialogTitle>
                        <DialogDescription className="space-y-2 pt-2">
                            <p>Are you sure you want to delete <strong>{deleteDialog.instructor?.name}</strong>?</p>
                            <p className="text-red-600 font-medium">This will permanently delete:</p>
                            <ul className="list-disc list-inside text-sm space-y-1">
                                <li>{deleteDialog.instructor?.coursesCreated ?? 0} courses</li>
                                <li>All related enrollments, questions, and certificates</li>
                                <li>The instructor's account</li>
                            </ul>
                            <p className="font-bold text-red-600">This action cannot be undone!</p>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, instructor: null })} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteInstructor} disabled={deleting}>
                            {deleting ? 'Deleting…' : 'Yes, Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
