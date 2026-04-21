'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import adminService from '@/lib/api/adminService';
import useSWR from 'swr';

const fetchDashboard = async () => {
    const [statsData, pendingData, fellowsData, activityData] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getPendingInstructors(),
        adminService.getFellowsAtRisk(),
        adminService.getRecentActivity(50),
    ]);
    return {
        statsRaw: statsData,
        pendingInstructors: pendingData.instructors || [],
        fellowsAtRisk: fellowsData.fellows || [],
        recentActivity: activityData.activities || [],
    };
};

// ─── colour palette ────────────────────────────────────────────────
const STAT_CARDS = [
    { key: 'totalUsers',       label: 'Total Users',       icon: 'Users',        grad: 'from-blue-500 to-blue-600' },
    { key: 'activeUsers',      label: 'Active (30d)',       icon: 'UserCheck',    grad: 'from-green-500 to-green-600' },
    { key: 'totalInstructors', label: 'Instructors',        icon: 'GraduationCap',grad: 'from-purple-500 to-purple-600' },
    { key: 'totalStudents',    label: 'Students',           icon: 'BookOpen',     grad: 'from-yellow-500 to-yellow-600' },
    { key: 'totalFellows',     label: 'Fellows (Total)',    icon: 'Trophy',       grad: 'from-indigo-500 to-indigo-600' },
    { key: 'activeFellows',    label: 'Fellows (Active)',   icon: 'TrendingUp',   grad: 'from-teal-500 to-teal-600' },
    { key: 'publicUsers',      label: 'Public Users',       icon: 'Globe',        grad: 'from-pink-500 to-pink-600' },
    { key: 'enrollments',      label: 'Enrollments',        icon: 'ClipboardList',grad: 'from-emerald-500 to-emerald-600' },
];

const ACTIVITY_COLORS = {
    user_registration:   { bg: 'bg-green-50',   border: 'border-green-200',   icon: 'bg-green-100 text-green-700' },
    instructor_approved: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-100 text-emerald-700' },
    instructor_rejected: { bg: 'bg-red-50',     border: 'border-red-200',     icon: 'bg-red-100 text-red-700' },
    course_approved:     { bg: 'bg-blue-50',    border: 'border-blue-200',    icon: 'bg-blue-100 text-blue-700' },
    course_rejected:     { bg: 'bg-orange-50',  border: 'border-orange-200',  icon: 'bg-orange-100 text-orange-700' },
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function buildTrend(total) {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        return {
            month: MONTHS[d.getMonth()],
            users: Math.round((total / 6) * (0.55 + i * 0.09)),
        };
    });
}

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
            <p className="font-semibold text-gray-700 mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
            ))}
        </div>
    );
};

export default function AdminDashboardPage() {
    const router = useRouter();
    const { data, isLoading: loading, mutate } = useSWR('admin-dashboard', fetchDashboard);

    const statsRaw          = data?.statsRaw ?? null;
    const pendingInstructors = data?.pendingInstructors ?? [];
    const fellowsAtRisk     = data?.fellowsAtRisk ?? [];
    const recentActivity    = data?.recentActivity ?? [];

    const [activityFilter, setActivityFilter] = useState('all');
    const [activityPage, setActivityPage]     = useState(1);
    const activitiesPerPage = 10;

    // ── dialogs ────────────────────────────────────────────────────
    const [approveDialog, setApproveDialog]   = useState({ open: false, instructor: null });
    const [rejectDialog, setRejectDialog]     = useState({ open: false, instructor: null, reason: '' });
    const [reminderDialog, setReminderDialog] = useState({ open: false, fellow: null, message: '' });
    const [actionLoading, setActionLoading]   = useState(false);
    const [toast, setToast]                   = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    // ── derived stat values ─────────────────────────────────────────
    const statValues = statsRaw ? {
        totalUsers:       { value: statsRaw.totalUsers?.toLocaleString() ?? '0',        sub: statsRaw.userGrowth ?? '+0%' },
        activeUsers:      { value: statsRaw.activeUsersLast30Days?.toLocaleString() ?? '0', sub: 'last 30 days' },
        totalInstructors: { value: statsRaw.totalInstructors?.toString() ?? '0',         sub: `${statsRaw.pendingInstructors ?? 0} pending` },
        totalStudents:    { value: statsRaw.totalStudents?.toLocaleString() ?? '0',      sub: '+0 new' },
        totalFellows:     { value: statsRaw.totalFellows?.toString() ?? '0',             sub: 'all time' },
        activeFellows:    { value: statsRaw.activeFellows?.toString() ?? '0',            sub: `${statsRaw.fellowsPercentage ?? 0}%` },
        publicUsers:      { value: statsRaw.publicUsers?.toLocaleString() ?? '0',        sub: 'public' },
        enrollments:      { value: statsRaw.totalEnrollments?.toLocaleString() ?? '0',   sub: 'all time' },
    } : {};

    const trendData = statsRaw ? buildTrend(statsRaw.totalUsers ?? 0) : [];

    // ── filtered / paginated activity ──────────────────────────────
    const filtered = activityFilter === 'all'
        ? recentActivity
        : recentActivity.filter(a => a.type === activityFilter);

    const paginated = filtered.slice(
        (activityPage - 1) * activitiesPerPage,
        activityPage * activitiesPerPage,
    );

    // ── actions ────────────────────────────────────────────────────
    const handleApprove = async () => {
        if (!approveDialog.instructor) return;
        try {
            setActionLoading(true);
            await adminService.approveInstructor(approveDialog.instructor._id);
            showToast(`${approveDialog.instructor.firstName} approved!`);
            setApproveDialog({ open: false, instructor: null });
            mutate();
        } catch (e) {
            showToast(e.message || 'Failed to approve', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectDialog.instructor || !rejectDialog.reason.trim()) return;
        try {
            setActionLoading(true);
            await adminService.rejectInstructor(rejectDialog.instructor._id, rejectDialog.reason);
            showToast(`${rejectDialog.instructor.firstName} rejected`);
            setRejectDialog({ open: false, instructor: null, reason: '' });
            mutate();
        } catch (e) {
            showToast(e.message || 'Failed to reject', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSendReminder = async () => {
        if (!reminderDialog.fellow || !reminderDialog.message.trim()) return;
        try {
            setActionLoading(true);
            await adminService.sendFellowReminder(reminderDialog.fellow._id, reminderDialog.message);
            showToast('Reminder sent!');
            setReminderDialog({ open: false, fellow: null, message: '' });
        } catch (e) {
            showToast(e.message || 'Failed to send reminder', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // ── loading ────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                    <p className="text-gray-500 text-sm">Loading dashboard…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="pt-20 p-6 lg:p-8 max-w-full space-y-6">

                {/* ── Toast ──────────────────────────────────────────── */}
                {toast && (
                    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl text-sm font-medium border animate-in slide-in-from-top-2
                        ${toast.type === 'success'
                            ? 'bg-green-50 text-green-800 border-green-200'
                            : 'bg-red-50 text-red-800 border-red-200'}`}>
                        {toast.type === 'success'
                            ? <Icons.CheckCircle className="w-4 h-4 flex-shrink-0" />
                            : <Icons.AlertCircle className="w-4 h-4 flex-shrink-0" />}
                        {toast.msg}
                        <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">
                            <Icons.X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                {/* ── Header ─────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-500 text-sm mt-1">Platform overview and management</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={mutate}>
                            <Icons.RefreshCw className="w-4 h-4 mr-1" /> Refresh
                        </Button>
                        <Button size="sm" onClick={() => router.push('/admin/analytics')}>
                            <Icons.BarChart3 className="w-4 h-4 mr-1" /> Analytics
                        </Button>
                    </div>
                </div>

                {/* ── Quick Actions ───────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Add Fellows',      icon: 'UserPlus',    path: '/admin/fellows',    color: 'text-blue-600',  hover: 'hover:border-blue-300 hover:bg-blue-50' },
                        { label: 'Add Course',       icon: 'Plus',        path: '/admin/courses/add',color: 'text-green-600', hover: 'hover:border-green-300 hover:bg-green-50' },
                        { label: 'View Analytics',   icon: 'BarChart3',   path: '/admin/analytics',  color: 'text-purple-600',hover: 'hover:border-purple-300 hover:bg-purple-50' },
                        { label: 'Reminders',        icon: 'Bell',        path: '/admin/reminders',  color: 'text-orange-600',hover: 'hover:border-orange-300 hover:bg-orange-50' },
                    ].map(({ label, icon, path, color, hover }) => {
                        const Icon = Icons[icon];
                        return (
                            <button key={label} onClick={() => router.push(path)}
                                className={`bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 text-sm font-medium text-gray-700 transition-all ${hover}`}>
                                <Icon className={`w-5 h-5 ${color}`} />
                                {label}
                            </button>
                        );
                    })}
                </div>

                {/* ── KPI cards ──────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {STAT_CARDS.map(({ key, label, icon, grad }) => {
                        const Icon = Icons[icon];
                        const stat = statValues[key];
                        return (
                            <Card key={key} className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                                <CardContent className="pt-5 pb-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`p-2.5 rounded-lg bg-gradient-to-br ${grad} shadow-sm group-hover:scale-105 transition-transform`}>
                                            {Icon && <Icon className="w-5 h-5 text-white" />}
                                        </div>
                                        <span className="text-xs text-gray-400">{stat?.sub}</span>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">{stat?.value ?? '0'}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* ── Trend chart ────────────────────────────────────── */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">User Growth (Last 6 Months)</CardTitle>
                        <CardDescription>Estimated trend based on current totals</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="users" name="Users" stroke="#2563eb" fill="url(#gUsers)" strokeWidth={2} dot={{ r: 3, fill: '#2563eb' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* ── Tabs: Pending Approvals + Activity + Fellowship ── */}
                <Tabs defaultValue="activity" className="space-y-4">
                    <TabsList className="bg-gray-100 p-1 rounded-lg">
                        <TabsTrigger value="activity">
                            Recent Activity
                        </TabsTrigger>
                        {pendingInstructors.length > 0 && (
                            <TabsTrigger value="pending" className="relative">
                                Pending Approvals
                                <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {pendingInstructors.length}
                                </span>
                            </TabsTrigger>
                        )}
                        {fellowsAtRisk.length > 0 && (
                            <TabsTrigger value="fellows">
                                Fellows at Risk
                            </TabsTrigger>
                        )}
                    </TabsList>

                    {/* ── Activity tab ─────────────────────────────────── */}
                    <TabsContent value="activity">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Icons.Activity className="w-4 h-4 text-blue-600" />
                                            Recent Activities
                                        </CardTitle>
                                        <CardDescription>Registrations, approvals, rejections</CardDescription>
                                    </div>
                                    {/* filter pills */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {[
                                            { id: 'all',                  label: 'All' },
                                            { id: 'user_registration',    label: 'Registrations' },
                                            { id: 'instructor_approved',  label: 'Approved' },
                                            { id: 'instructor_rejected',  label: 'Rejected' },
                                        ].map(f => (
                                            <button key={f.id}
                                                onClick={() => { setActivityFilter(f.id); setActivityPage(1); }}
                                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${activityFilter === f.id
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {paginated.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400">
                                        <Icons.Inbox className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                        <p className="text-sm">No activities yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {paginated.map((activity) => {
                                            const colors = ACTIVITY_COLORS[activity.type] || { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'bg-gray-100 text-gray-600' };
                                            const IconComp = Icons[activity.icon] || Icons.Activity;
                                            // For login/registration events the actor is stored in targetUser;
                                            // for admin/instructor actions it's in performedBy.
                                            const actor = activity.performedBy || activity.targetUser;
                                            const actorEmail = actor?.email || activity.metadata?.email || null;
                                            const actorRole  = actor?.role  || activity.metadata?.role  || null;
                                            const roleBadgeColor = {
                                                admin:      'bg-purple-100 text-purple-700',
                                                instructor: 'bg-blue-100 text-blue-700',
                                                student:    'bg-green-100 text-green-700',
                                                fellow:     'bg-teal-100 text-teal-700',
                                            }[actorRole?.toLowerCase()] || 'bg-gray-100 text-gray-600';
                                            return (
                                                <div key={activity._id}
                                                    className={`flex gap-3 p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
                                                    <div className={`p-2 rounded-lg flex-shrink-0 ${colors.icon}`}>
                                                        <IconComp className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                            {actorEmail && (
                                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                                    <Icons.Mail className="w-3 h-3 flex-shrink-0" />
                                                                    {actorEmail}
                                                                </span>
                                                            )}
                                                            {actorRole && (
                                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${roleBadgeColor}`}>
                                                                    {actorRole}
                                                                </span>
                                                            )}
                                                            {activity.performedBy?.name && (
                                                                <span className="text-xs text-gray-400">({activity.performedBy.name})</span>
                                                            )}
                                                        </div>
                                                        {activity.metadata?.reason && (
                                                            <p className="text-xs text-gray-600 mt-1 bg-white/60 rounded px-2 py-1 border border-gray-200">
                                                                <strong>Reason:</strong> {activity.metadata.reason}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                                                        {new Date(activity.timestamp).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Pagination */}
                                {filtered.length > activitiesPerPage && (
                                    <div className="mt-4 flex items-center justify-between border-t pt-4">
                                        <p className="text-xs text-gray-500">
                                            {Math.min((activityPage - 1) * activitiesPerPage + 1, filtered.length)}–{Math.min(activityPage * activitiesPerPage, filtered.length)} of {filtered.length}
                                        </p>
                                        <div className="flex gap-1">
                                            <Button variant="outline" size="sm" className="h-7 w-7 p-0"
                                                onClick={() => setActivityPage(p => Math.max(1, p - 1))}
                                                disabled={activityPage === 1}>
                                                <Icons.ChevronLeft className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button variant="outline" size="sm" className="h-7 w-7 p-0"
                                                onClick={() => setActivityPage(p => Math.min(Math.ceil(filtered.length / activitiesPerPage), p + 1))}
                                                disabled={activityPage >= Math.ceil(filtered.length / activitiesPerPage)}>
                                                <Icons.ChevronRight className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── Pending Approvals tab ─────────────────────────── */}
                    {pendingInstructors.length > 0 && (
                        <TabsContent value="pending">
                            <Card className="shadow-sm border-orange-200">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2 text-orange-700">
                                        <Icons.UserCog className="w-4 h-4" />
                                        Pending Instructor Approvals
                                    </CardTitle>
                                    <CardDescription>Review and act on new instructor applications</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {pendingInstructors.map(ins => (
                                        <div key={ins._id} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-orange-50 border border-orange-200 rounded-xl p-5">
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                                                    {ins.firstName?.[0]}{ins.lastName?.[0]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-semibold text-gray-900">{ins.firstName} {ins.lastName}</p>
                                                        <span className="text-xs text-gray-400">{new Date(ins.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-500">{ins.email}</p>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {ins.institution && (
                                                            <Badge variant="secondary" className="text-xs">{ins.institution}</Badge>
                                                        )}
                                                        {ins.phoneNumber && (
                                                            <Badge variant="outline" className="text-xs">{ins.phoneNumber}</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 flex-shrink-0">
                                                <Button size="sm" variant="outline"
                                                    onClick={() => router.push(`/admin/instructors/${ins._id}`)}>
                                                    <Icons.Eye className="w-4 h-4 mr-1" /> View
                                                </Button>
                                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() => setApproveDialog({ open: true, instructor: ins })}>
                                                    <Icons.CheckCircle className="w-4 h-4 mr-1" /> Approve
                                                </Button>
                                                <Button size="sm" variant="destructive"
                                                    onClick={() => setRejectDialog({ open: true, instructor: ins, reason: '' })}>
                                                    <Icons.XCircle className="w-4 h-4 mr-1" /> Reject
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {pendingInstructors.length > 3 && (
                                        <Button variant="outline" className="w-full" onClick={() => router.push('/admin/instructors')}>
                                            View All ({pendingInstructors.length}) Pending →
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}

                    {/* ── Fellows at Risk tab ────────────────────────────── */}
                    {fellowsAtRisk.length > 0 && (
                        <TabsContent value="fellows">
                            <Card className="shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2 text-red-700">
                                        <Icons.AlertTriangle className="w-4 h-4" />
                                        Fellowship Monitoring
                                    </CardTitle>
                                    <CardDescription>Fellows with &lt;30 days to deadline and &lt;50% progress</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {fellowsAtRisk.slice(0, 6).map((fellow, i) => (
                                            <div key={i} className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="font-semibold text-gray-900 text-sm">{fellow.firstName} {fellow.lastName}</p>
                                                        <p className="text-xs text-red-600 font-medium">{fellow.daysLeft} days left</p>
                                                    </div>
                                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                                                        {fellow.progress}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-red-200 rounded-full h-1.5">
                                                    <div className="bg-red-600 h-1.5 rounded-full" style={{ width: `${fellow.progress}%` }} />
                                                </div>
                                                <Button size="sm" className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                                                    onClick={() => setReminderDialog({
                                                        open: true,
                                                        fellow,
                                                        message: `Hi ${fellow.firstName}, we noticed you're at ${fellow.progress}% progress with ${fellow.daysLeft} days remaining. Keep going — you're almost there!`,
                                                    })}>
                                                    <Icons.Send className="w-3 h-3 mr-1" /> Send Reminder
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                    <Button variant="outline" className="w-full mt-4"
                                        onClick={() => router.push('/admin/fellows')}>
                                        View All Fellows →
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}
                </Tabs>
            </main>

            {/* ══ Approve Dialog ══════════════════════════════════════ */}
            <Dialog open={approveDialog.open} onOpenChange={o => setApproveDialog({ open: o, instructor: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-green-700">
                            <Icons.CheckCircle className="w-5 h-5" />
                            Approve Instructor
                        </DialogTitle>
                        <DialogDescription>
                            Approve <strong>{approveDialog.instructor?.firstName} {approveDialog.instructor?.lastName}</strong> as an instructor?
                            They will receive a confirmation email and gain access to create courses.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApproveDialog({ open: false, instructor: null })} disabled={actionLoading}>
                            Cancel
                        </Button>
                        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleApprove} disabled={actionLoading}>
                            {actionLoading ? 'Approving…' : 'Yes, Approve'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ══ Reject Dialog ═══════════════════════════════════════ */}
            <Dialog open={rejectDialog.open} onOpenChange={o => setRejectDialog({ open: o, instructor: null, reason: '' })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-700">
                            <Icons.XCircle className="w-5 h-5" />
                            Reject Instructor
                        </DialogTitle>
                        <DialogDescription>
                            Reject <strong>{rejectDialog.instructor?.firstName} {rejectDialog.instructor?.lastName}</strong>?
                            Please provide a reason — it will be sent to the applicant.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Label htmlFor="reject-reason" className="text-sm font-medium">Reason for rejection <span className="text-red-500">*</span></Label>
                        <Textarea
                            id="reject-reason"
                            className="mt-2"
                            rows={3}
                            placeholder="e.g. Incomplete profile, insufficient credentials…"
                            value={rejectDialog.reason}
                            onChange={e => setRejectDialog(d => ({ ...d, reason: e.target.value }))}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialog({ open: false, instructor: null, reason: '' })} disabled={actionLoading}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleReject} disabled={actionLoading || !rejectDialog.reason.trim()}>
                            {actionLoading ? 'Rejecting…' : 'Reject'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ══ Reminder Dialog ═════════════════════════════════════ */}
            <Dialog open={reminderDialog.open} onOpenChange={o => setReminderDialog({ open: o, fellow: null, message: '' })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Icons.Send className="w-5 h-5 text-blue-600" />
                            Send Reminder
                        </DialogTitle>
                        <DialogDescription>
                            Sending to <strong>{reminderDialog.fellow?.firstName} {reminderDialog.fellow?.lastName}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Label htmlFor="reminder-msg" className="text-sm font-medium">Message</Label>
                        <Textarea
                            id="reminder-msg"
                            className="mt-2"
                            rows={4}
                            value={reminderDialog.message}
                            onChange={e => setReminderDialog(d => ({ ...d, message: e.target.value }))}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReminderDialog({ open: false, fellow: null, message: '' })} disabled={actionLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleSendReminder} disabled={actionLoading || !reminderDialog.message.trim()}>
                            {actionLoading ? 'Sending…' : 'Send Reminder'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
