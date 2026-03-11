'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import moduleService from '@/lib/api/moduleService';
import authService from '@/lib/api/authService';
import notificationService from '@/lib/api/notificationService';
import ProtectedInstructorRoute from '@/components/ProtectedInstructorRoute';

// shadcn components
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    draft:     { label: 'Draft',     variant: 'secondary', color: 'bg-gray-100 text-gray-700 border-gray-200',        dot: 'bg-gray-400'    },
    submitted: { label: 'Submitted', variant: 'default',   color: 'bg-blue-100 text-blue-700 border-blue-200',        dot: 'bg-blue-500'    },
    approved:  { label: 'Approved',  variant: 'default',   color: 'bg-green-100 text-green-700 border-green-200',     dot: 'bg-green-500'   },
    published: { label: 'Published', variant: 'default',   color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    rejected:  { label: 'Rejected',  variant: 'destructive', color: 'bg-red-100 text-red-700 border-red-200',         dot: 'bg-red-500'     },
};

const getStatus = (s) => STATUS_CONFIG[s] || STATUS_CONFIG.draft;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const initials = (user) => {
    if (!user) return 'IN';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'IN';
};

const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const timeAgo = (d) => {
    if (!d) return '';
    const diff = (Date.now() - new Date(d)) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
};

const QUICK_ACTIONS = [
    { label: 'Create Module',   icon: 'PlusCircle',     href: '/instructor/modules/create', primary: true  },
    { label: 'My Modules',      icon: 'Layers',         href: '/instructor/modules'                        },
    { label: 'Students',        icon: 'Users',          href: '/instructor/students'                       },
    { label: 'Assessments',     icon: 'ClipboardCheck', href: '/instructor/assessments'                    },
    { label: 'Discussions',     icon: 'MessageSquare',  href: '/instructor/discussions'                    },
    { label: 'Messages',        icon: 'Mail',           href: '/instructor/messages'                       },
];

// ─── Module Quick-View Sheet ──────────────────────────────────────────────────
function ModuleSheet({ module, open, onClose, router }) {
    if (!module) return null;
    const st = getStatus(module.status);
    return (
        <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
            <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
                <SheetHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-emerald-50 to-teal-50">
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
                            <Icons.Layers className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <SheetTitle className="text-lg font-bold text-gray-900 leading-tight">{module.title}</SheetTitle>
                            <SheetDescription className="mt-1">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${st.color}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                    {st.label}
                                </span>
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>
                <ScrollArea className="flex-1 px-6 py-4">
                    <div className="space-y-5">
                        {/* Key stats */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Lessons',  value: module.lessons?.length || 0,    icon: 'BookOpen', color: 'text-blue-600',   bg: 'bg-blue-50'    },
                                { label: 'Students', value: module.enrollmentCount || 0,     icon: 'Users',    color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { label: 'Level',    value: module.level || 'N/A',           icon: 'Signal',   color: 'text-purple-600',  bg: 'bg-purple-50'  },
                            ].map((s) => {
                                const I = Icons[s.icon];
                                return (
                                    <div key={s.label} className={`rounded-xl p-3 ${s.bg} text-center`}>
                                        <I className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
                                        <p className="text-lg font-bold text-gray-900 capitalize">{s.value}</p>
                                        <p className="text-xs text-gray-500">{s.label}</p>
                                    </div>
                                );
                            })}
                        </div>

                        <Separator />

                        {/* Details */}
                        <div className="space-y-3 text-sm">
                            {module.category && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Category</span>
                                    <span className="font-medium text-gray-900">{module.category?.name || module.category}</span>
                                </div>
                            )}
                            {module.deliveryMode && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Delivery</span>
                                    <span className="font-medium text-gray-900">{module.deliveryMode}</span>
                                </div>
                            )}
                            {module.duration && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Duration</span>
                                    <span className="font-medium text-gray-900">{module.duration}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-500">Created</span>
                                <span className="font-medium text-gray-900">{formatDate(module.createdAt)}</span>
                            </div>
                        </div>

                        {/* Description preview */}
                        {module.description && (
                            <>
                                <Separator />
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</p>
                                    <div
                                        className="prose prose-sm max-w-none text-gray-700 line-clamp-6"
                                        dangerouslySetInnerHTML={{ __html: module.description }}
                                    />
                                </div>
                            </>
                        )}

                        {/* Lessons preview */}
                        {module.lessons?.length > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Lessons ({module.lessons.length})</p>
                                    <ul className="space-y-1.5">
                                        {module.lessons.slice(0, 5).map((l, i) => (
                                            <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</span>
                                                <span className="truncate">{l.title || `Lesson ${i + 1}`}</span>
                                            </li>
                                        ))}
                                        {module.lessons.length > 5 && (
                                            <li className="text-xs text-gray-400 ml-7">+{module.lessons.length - 5} more lessons</li>
                                        )}
                                    </ul>
                                </div>
                            </>
                        )}
                    </div>
                </ScrollArea>
                <div className="px-6 py-4 border-t bg-gray-50 flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => { onClose(); router.push(`/instructor/modules/${module._id}`); }}>
                        <Icons.ExternalLink className="w-4 h-4 mr-2" /> Manage
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}

// ─── Main dashboard content ───────────────────────────────────────────────────
function InstructorDashboardContent() {
    const router = useRouter();
    const [modules, setModules] = useState([]);
    const [stats, setStats] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [selectedModule, setSelectedModule] = useState(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const u = authService.getCurrentUser();
        setUser(u);

        const fetchData = async () => {
            try {
                setLoading(true);
                const [modulesData, statsData] = await Promise.all([
                    moduleService.getInstructorModules(),
                    moduleService.getInstructorStats(),
                ]);
                setModules(Array.isArray(modulesData) ? modulesData : modulesData?.modules || []);
                setStats(statsData);

                // notifications (non-blocking)
                try {
                    const notifData = await notificationService.getMyNotifications(10);
                    setNotifications(Array.isArray(notifData) ? notifData : notifData?.notifications || []);
                } catch { /* ignore */ }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const openSheet = (mod) => { setSelectedModule(mod); setSheetOpen(true); };
    const closeSheet = () => { setSheetOpen(false); setTimeout(() => setSelectedModule(null), 300); };

    const totalLessons = modules.reduce((s, m) => s + (m.lessons?.length || 0), 0);

    const statusBreakdown = stats?.modulesByStatus || {};
    const statusTotal = Object.values(statusBreakdown).reduce((s, v) => s + v, 0) || 1;

    const greetingTime = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-3">
                    <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-gray-500">Loading your dashboard…</p>
                </div>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-gray-50/60 p-4 sm:p-6 lg:p-8 space-y-6">

                {/* ── HERO HEADER ─────────────────────────────────────────── */}
                <Card className="overflow-hidden border-0 shadow-md">
                    <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="w-16 h-16 border-2 border-white/30 shadow-lg">
                                    <AvatarImage src={user?.profilePicture} alt={user?.firstName} />
                                    <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                                        {initials(user)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-emerald-100 text-sm font-medium">{greetingTime()},</p>
                                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                                        {user?.firstName} {user?.lastName}
                                    </h1>
                                    <p className="text-emerald-200 text-sm mt-0.5">{today}</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => router.push('/instructor/modules/create')}
                                className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shadow-md shrink-0"
                            >
                                <Icons.PlusCircle className="w-4 h-4 mr-2" />
                                New Module
                            </Button>
                        </div>

                        {/* inline mini-stats in hero */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                            {[
                                { label: 'Modules',         value: stats?.totalModules ?? modules.length,   icon: 'Layers'      },
                                { label: 'Students',        value: stats?.totalStudents ?? 0,               icon: 'Users'       },
                                { label: 'Completion Rate', value: `${stats?.completionRate ?? 0}%`,        icon: 'TrendingUp'  },
                                { label: 'Total Lessons',   value: totalLessons,                            icon: 'BookOpen'    },
                            ].map((s) => {
                                const I = Icons[s.icon];
                                return (
                                    <div key={s.label} className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/20">
                                        <div className="flex items-center gap-2 mb-1">
                                            <I className="w-4 h-4 text-emerald-200" />
                                            <span className="text-emerald-200 text-xs">{s.label}</span>
                                        </div>
                                        <p className="text-2xl font-bold text-white">{s.value}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </Card>

                {/* ── TABS ───────────────────────────────────────────────── */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
                    <TabsList className="bg-white border shadow-sm h-11 p-1 rounded-xl">
                        <TabsTrigger value="overview"  className="rounded-lg gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                            <Icons.LayoutDashboard className="w-4 h-4" /> Overview
                        </TabsTrigger>
                        <TabsTrigger value="modules"   className="rounded-lg gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                            <Icons.Layers className="w-4 h-4" /> My Modules
                            {modules.length > 0 && (
                                <span className="ml-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-1.5 py-0.5 rounded-full data-[state=active]:bg-white/20 data-[state=active]:text-white">
                                    {modules.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="activity"  className="rounded-lg gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                            <Icons.Bell className="w-4 h-4" /> Activity
                            {notifications.filter(n => !n.isRead).length > 0 && (
                                <span className="ml-1 bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                                    {notifications.filter(n => !n.isRead).length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* ═══ OVERVIEW TAB ═══════════════════════════════════ */}
                    <TabsContent value="overview" className="space-y-6 mt-0">

                        {/* Quick Actions */}
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                        <Icons.Zap className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <CardTitle className="text-base">Quick Actions</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                    {QUICK_ACTIONS.map((action) => {
                                        const I = Icons[action.icon];
                                        return (
                                            <Tooltip key={action.label}>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        onClick={() => router.push(action.href)}
                                                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all hover:scale-105 hover:shadow-md ${
                                                            action.primary
                                                                ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-emerald-600 shadow-md'
                                                                : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                                                        }`}
                                                    >
                                                        <I className={`w-6 h-6 ${action.primary ? 'text-white' : 'text-emerald-600'}`} />
                                                        <span className="text-xs font-semibold text-center leading-tight">{action.label}</span>
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent>{action.label}</TooltipContent>
                                            </Tooltip>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Recent Modules (left 2 cols) */}
                            <div className="lg:col-span-2 space-y-4">
                                <Card className="shadow-sm">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <Icons.Layers className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base">Recent Modules</CardTitle>
                                                    <CardDescription>Your latest created modules</CardDescription>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => setActiveTab('modules')} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs">
                                                View all <Icons.ArrowRight className="w-3 h-3 ml-1" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        {modules.length === 0 ? (
                                            <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                                <Icons.Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                <p className="text-gray-500 text-sm mb-4">No modules yet. Create your first one!</p>
                                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => router.push('/instructor/modules/create')}>
                                                    <Icons.PlusCircle className="w-4 h-4 mr-1" /> Create Module
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {modules.slice(0, 4).map((mod) => {
                                                    const st = getStatus(mod.status);
                                                    return (
                                                        <div
                                                            key={mod._id}
                                                            className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition-all cursor-pointer group"
                                                            onClick={() => openSheet(mod)}
                                                        >
                                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                                <Icons.Layers className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <p className="font-semibold text-gray-900 text-sm truncate">{mod.title}</p>
                                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border flex-shrink-0 ${st.color}`}>
                                                                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                                                        {st.label}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                                    <span className="flex items-center gap-1"><Icons.BookOpen className="w-3 h-3" />{mod.lessons?.length || 0} lessons</span>
                                                                    <span className="flex items-center gap-1"><Icons.Users className="w-3 h-3" />{mod.enrollmentCount || 0} students</span>
                                                                    <span className="capitalize flex items-center gap-1"><Icons.Signal className="w-3 h-3" />{mod.level}</span>
                                                                </div>
                                                            </div>
                                                            <Icons.ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right column */}
                            <div className="space-y-4">
                                {/* Status Overview */}
                                <Card className="shadow-sm">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                                <Icons.PieChart className="w-4 h-4 text-purple-600" />
                                            </div>
                                            <CardTitle className="text-base">Status Overview</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        {Object.keys(statusBreakdown).length === 0 ? (
                                            <p className="text-sm text-gray-400 text-center py-4">No modules yet</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {Object.entries(statusBreakdown).map(([status, count]) => {
                                                    const st = getStatus(status);
                                                    const pct = Math.round((count / statusTotal) * 100);
                                                    const progressColor = {
                                                        draft: 'bg-gray-400', submitted: 'bg-blue-500', approved: 'bg-green-500', published: 'bg-emerald-500', rejected: 'bg-red-500',
                                                    }[status] || 'bg-gray-400';
                                                    return (
                                                        <div key={status}>
                                                            <div className="flex items-center justify-between mb-1.5">
                                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${st.color}`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                                                    {st.label}
                                                                </span>
                                                                <span className="text-sm font-bold text-gray-900">{count}</span>
                                                            </div>
                                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                <div className={`h-full rounded-full transition-all ${progressColor}`} style={{ width: `${pct}%` }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Content stats card */}
                                <Card className="shadow-sm bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-0">
                                    <CardContent className="p-5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                                <Icons.BarChart3 className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white">Content Hours</p>
                                                <p className="text-emerald-200 text-xs">Total teaching content</p>
                                            </div>
                                        </div>
                                        <p className="text-4xl font-bold text-white">{stats?.totalContentHours ?? 0}</p>
                                        <p className="text-emerald-200 text-sm mt-1">hours of content</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ═══ MODULES TAB ════════════════════════════════════ */}
                    <TabsContent value="modules" className="mt-0">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                            <Icons.Layers className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <div>
                                            <CardTitle>All Modules</CardTitle>
                                            <CardDescription>{modules.length} module{modules.length !== 1 ? 's' : ''} created</CardDescription>
                                        </div>
                                    </div>
                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => router.push('/instructor/modules/create')}>
                                        <Icons.PlusCircle className="w-4 h-4 mr-2" /> Create
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {modules.length === 0 ? (
                                    <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                        <Icons.Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-600 font-medium mb-2">No modules yet</p>
                                        <p className="text-gray-400 text-sm mb-5">Create your first module to get started.</p>
                                        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => router.push('/instructor/modules/create')}>
                                            <Icons.PlusCircle className="w-4 h-4 mr-2" /> Create Your First Module
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border overflow-hidden">
                                        {/* Table header */}
                                        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            <div className="col-span-5">Module</div>
                                            <div className="col-span-2 text-center">Status</div>
                                            <div className="col-span-1 text-center hidden sm:block">Level</div>
                                            <div className="col-span-2 text-center hidden md:block">Students</div>
                                            <div className="col-span-2 text-right">Actions</div>
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {modules.map((mod) => {
                                                const st = getStatus(mod.status);
                                                return (
                                                    <div key={mod._id} className="grid grid-cols-12 gap-2 px-4 py-3.5 items-center hover:bg-gray-50/80 transition-colors">
                                                        <div className="col-span-5 flex items-center gap-3 min-w-0">
                                                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                                                                <Icons.Layers className="w-4 h-4 text-white" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-gray-900 text-sm truncate">{mod.title}</p>
                                                                <p className="text-xs text-gray-400">{mod.lessons?.length || 0} lessons · {formatDate(mod.createdAt)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="col-span-2 flex justify-center">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${st.color}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                                                {st.label}
                                                            </span>
                                                        </div>
                                                        <div className="col-span-1 text-center hidden sm:block">
                                                            <span className="text-xs text-gray-600 capitalize">{mod.level}</span>
                                                        </div>
                                                        <div className="col-span-2 text-center hidden md:block">
                                                            <span className="text-sm font-semibold text-gray-700">{mod.enrollmentCount || 0}</span>
                                                        </div>
                                                        <div className="col-span-2 flex items-center justify-end gap-1">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-emerald-50" onClick={() => openSheet(mod)}>
                                                                        <Icons.Eye className="w-4 h-4 text-gray-500" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Quick View</TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-emerald-50" onClick={() => router.push(`/instructor/modules/${mod._id}`)}>
                                                                        <Icons.ExternalLink className="w-4 h-4 text-emerald-600" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Manage</TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ═══ ACTIVITY TAB ═══════════════════════════════════ */}
                    <TabsContent value="activity" className="mt-0">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                        <Icons.Bell className="w-4 h-4 text-orange-600" />
                                    </div>
                                    <div>
                                        <CardTitle>Recent Activity</CardTitle>
                                        <CardDescription>Your latest notifications and updates</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {notifications.length === 0 ? (
                                    <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                        <Icons.BellOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 text-sm">No recent activity</p>
                                    </div>
                                ) : (
                                    <ScrollArea className="max-h-[500px]">
                                        <div className="space-y-1">
                                            {notifications.map((notif, idx) => (
                                                <div key={notif._id || idx}>
                                                    <div className={`flex items-start gap-4 p-4 rounded-xl transition-colors ${!notif.isRead ? 'bg-emerald-50 border border-emerald-100' : 'hover:bg-gray-50'}`}>
                                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${!notif.isRead ? 'bg-emerald-600' : 'bg-gray-200'}`}>
                                                            <Icons.Bell className={`w-4 h-4 ${!notif.isRead ? 'text-white' : 'text-gray-500'}`} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm font-medium ${!notif.isRead ? 'text-gray-900' : 'text-gray-700'}`}>{notif.title || notif.message}</p>
                                                            {notif.message && notif.title && (
                                                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                                            )}
                                                            <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                                                        </div>
                                                        {!notif.isRead && (
                                                            <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-2" />
                                                        )}
                                                    </div>
                                                    {idx < notifications.length - 1 && <Separator className="my-0.5" />}
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Module Quick-View Sheet */}
                <ModuleSheet module={selectedModule} open={sheetOpen} onClose={closeSheet} router={router} />
            </div>
        </TooltipProvider>
    );
}

export default function InstructorDashboardPage() {
    return (
        <ProtectedInstructorRoute>
            <InstructorDashboardContent />
        </ProtectedInstructorRoute>
    );
}
