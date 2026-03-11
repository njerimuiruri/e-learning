'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import moduleService from '@/lib/api/moduleService';

// shadcn components
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CFG = {
    draft:     { label: 'Draft',     dot: 'bg-gray-400',    pill: 'bg-gray-100 text-gray-700 border-gray-300'       },
    submitted: { label: 'Submitted', dot: 'bg-blue-500',    pill: 'bg-blue-100 text-blue-700 border-blue-300'       },
    approved:  { label: 'Approved',  dot: 'bg-green-500',   pill: 'bg-green-100 text-green-700 border-green-300'    },
    published: { label: 'Published', dot: 'bg-emerald-500', pill: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    rejected:  { label: 'Rejected',  dot: 'bg-red-500',     pill: 'bg-red-100 text-red-700 border-red-300'          },
};

const LEVEL_CFG = {
    beginner:     { label: 'Beginner',     icon: 'GraduationCap', color: 'bg-blue-50 text-blue-600 border-blue-200'     },
    intermediate: { label: 'Intermediate', icon: 'Zap',           color: 'bg-purple-50 text-purple-600 border-purple-200' },
    advanced:     { label: 'Advanced',     icon: 'Trophy',        color: 'bg-orange-50 text-orange-600 border-orange-200' },
};

const STATUS_TABS = [
    { key: 'all',       label: 'All',       icon: 'Layers'      },
    { key: 'published', label: 'Published', icon: 'CheckCircle' },
    { key: 'draft',     label: 'Drafts',    icon: 'FilePen'     },
    { key: 'submitted', label: 'Submitted', icon: 'Send'        },
    { key: 'approved',  label: 'Approved',  icon: 'ThumbsUp'    },
    { key: 'rejected',  label: 'Rejected',  icon: 'XCircle'     },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const stripHtml = (html) => {
    if (!html || typeof window === 'undefined') return '';
    try {
        const d = document.createElement('div');
        d.innerHTML = html;
        return d.textContent?.trim() || '';
    } catch { return ''; }
};

const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ─── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ status }) {
    const c = STATUS_CFG[status] || STATUS_CFG.draft;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
}

// ─── Level badge ──────────────────────────────────────────────────────────────
function LevelBadge({ level }) {
    const c = LEVEL_CFG[level] || LEVEL_CFG.beginner;
    const I = Icons[c.icon];
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md border ${c.color}`}>
            <I className="w-3 h-3" /> {c.label}
        </span>
    );
}

// ─── Module Card ──────────────────────────────────────────────────────────────
function ModuleCard({ module, onView, onEdit, onSubmit, onDelete }) {
    const desc = stripHtml(module.description);
    const completionRate = module.completionRate || 0;
    const topicsCount = module.topics?.length || 0;
    const lessonsCount = module.lessons?.length || 0;

    return (
        <Card className="overflow-hidden group hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-emerald-200 flex flex-col">
            {/* Banner */}
            <div className="relative h-40 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 overflow-hidden flex-shrink-0">
                {module.bannerUrl ? (
                    <img src={module.bannerUrl} alt={module.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-30">
                        <Icons.Layers className="w-20 h-20 text-white" />
                    </div>
                )}
                {/* overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                {/* status in top-right */}
                <div className="absolute top-3 right-3">
                    <StatusPill status={module.status} />
                </div>
                {/* level in bottom-left */}
                <div className="absolute bottom-3 left-3">
                    <LevelBadge level={module.level} />
                </div>
            </div>

            <CardContent className="p-5 flex-1 flex flex-col">
                {/* Title + category */}
                <div className="mb-3">
                    <h3 className="font-bold text-gray-900 text-base line-clamp-2 leading-snug mb-1">{module.title}</h3>
                    {(module.categoryId?.name || module.category?.name) && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Icons.Tag className="w-3 h-3" />
                            {module.categoryId?.name || module.category?.name}
                        </span>
                    )}
                </div>

                {/* Description */}
                {desc && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{desc}</p>
                )}

                {/* Rejection reason */}
                {module.status === 'rejected' && module.rejectionReason && (
                    <Alert className="mb-3 border-red-200 bg-red-50 py-2 px-3">
                        <AlertDescription className="text-xs text-red-700">
                            <strong>Rejected:</strong> {module.rejectionReason}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mb-4 py-3 border-y border-gray-100">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex flex-col items-center gap-0.5 cursor-default">
                                <span className="text-base font-bold text-gray-900">{topicsCount || lessonsCount}</span>
                                <span className="text-[10px] text-gray-400 font-medium">{topicsCount > 0 ? 'Topics' : 'Lessons'}</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>{topicsCount > 0 ? `${topicsCount} topic(s) · ${lessonsCount} lesson(s)` : `${lessonsCount} lesson(s)`}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex flex-col items-center gap-0.5 cursor-default">
                                <span className="text-base font-bold text-gray-900">{module.enrollmentCount || 0}</span>
                                <span className="text-[10px] text-gray-400 font-medium">Students</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>{module.enrollmentCount || 0} enrolled students</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex flex-col items-center gap-0.5 cursor-default">
                                <span className="text-base font-bold text-gray-900">{completionRate}%</span>
                                <span className="text-[10px] text-gray-400 font-medium">Completed</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>Average completion rate</TooltipContent>
                    </Tooltip>
                </div>

                {/* Completion progress bar */}
                {completionRate > 0 && (
                    <div className="mb-4">
                        <Progress value={completionRate} className="h-1.5" />
                    </div>
                )}

                {/* Date */}
                <p className="text-[11px] text-gray-400 mb-4 flex items-center gap-1">
                    <Icons.Calendar className="w-3 h-3" /> Created {formatDate(module.createdAt)}
                </p>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                    <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => onView(module)}
                    >
                        <Icons.ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Manage
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="px-2.5">
                                <Icons.MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => onView(module)} className="gap-2">
                                <Icons.Eye className="w-4 h-4 text-gray-500" /> View Details
                            </DropdownMenuItem>
                            {(module.status === 'draft' || module.status === 'rejected') && (
                                <DropdownMenuItem onClick={() => onEdit(module)} className="gap-2">
                                    <Icons.Pencil className="w-4 h-4 text-blue-500" /> Edit Module
                                </DropdownMenuItem>
                            )}
                            {module.status === 'draft' && (
                                <DropdownMenuItem onClick={() => onSubmit(module)} className="gap-2">
                                    <Icons.Send className="w-4 h-4 text-emerald-500" /> Submit for Review
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onDelete(module)} className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50">
                                <Icons.Trash2 className="w-4 h-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InstructorModulesPage() {
    const router = useRouter();
    const [modules, setModules] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

    // Dialog states
    const [deleteTarget, setDeleteTarget] = useState(null);   // module to delete
    const [submitTarget, setSubmitTarget] = useState(null);   // module to submit
    const [detailModule, setDetailModule] = useState(null);   // module for detail dialog
    const [actionLoading, setActionLoading] = useState(false);

    const fetchModules = async () => {
        try {
            setLoading(true);
            const [modulesData, statsData] = await Promise.all([
                moduleService.getInstructorModules(),
                moduleService.getInstructorStats().catch(() => null),
            ]);
            setModules(Array.isArray(modulesData) ? modulesData : modulesData?.modules || []);
            setStats(statsData);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load modules');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchModules(); }, []);

    // Derived counts
    const counts = useMemo(() => ({
        all:       modules.length,
        published: modules.filter(m => m.status === 'published').length,
        draft:     modules.filter(m => m.status === 'draft').length,
        submitted: modules.filter(m => m.status === 'submitted').length,
        approved:  modules.filter(m => m.status === 'approved').length,
        rejected:  modules.filter(m => m.status === 'rejected').length,
    }), [modules]);

    // Filtered modules
    const filtered = useMemo(() => {
        let list = activeTab === 'all' ? modules : modules.filter(m => m.status === activeTab);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(m =>
                m.title?.toLowerCase().includes(q) ||
                stripHtml(m.description).toLowerCase().includes(q) ||
                m.level?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [modules, activeTab, search]);

    // Stats for top cards
    const totalStudents = stats?.totalStudents ?? modules.reduce((s, m) => s + (m.enrollmentCount || 0), 0);
    const avgCompletion = modules.length
        ? Math.round(modules.reduce((s, m) => s + (m.completionRate || 0), 0) / modules.length)
        : 0;
    const totalLessons = modules.reduce((s, m) => s + (m.lessons?.length || 0), 0);

    // Actions
    const handleDelete = async () => {
        if (!deleteTarget) return;
        setActionLoading(true);
        try {
            await moduleService.deleteModule(deleteTarget._id);
            setModules(prev => prev.filter(m => m._id !== deleteTarget._id));
            toast.success(`"${deleteTarget.title}" deleted successfully`);
            setDeleteTarget(null);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to delete module');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!submitTarget) return;
        setActionLoading(true);
        try {
            await moduleService.submitForApproval(submitTarget._id);
            setModules(prev => prev.map(m => m._id === submitTarget._id ? { ...m, status: 'submitted' } : m));
            toast.success(`"${submitTarget.title}" submitted for review!`);
            setSubmitTarget(null);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to submit module');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <TooltipProvider>
            <Toaster position="top-right" toastOptions={{ duration: 3500 }} />

            <div className="min-h-screen bg-gray-50/60 p-4 sm:p-6 lg:p-8 space-y-6">

                {/* ── HEADER ─────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                            <Icons.Layers className="w-7 h-7 text-emerald-600" /> My Modules
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">Create and manage your learning modules</p>
                    </div>
                    <Button
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md"
                        onClick={() => router.push('/instructor/modules/create')}
                    >
                        <Icons.PlusCircle className="w-4 h-4 mr-2" /> Create Module
                    </Button>
                </div>

                {/* ── INFO BANNER ─────────────────────────────────────────── */}
                <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-none">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <Icons.BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-sm mb-1">Module-Based Learning System</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Create focused learning modules structured as <strong>Module → Topic → Lesson</strong>.
                                    Each module includes a final assessment and generates a certificate upon completion.
                                    Modules progress from <span className="text-blue-600 font-medium">Beginner</span> → <span className="text-purple-600 font-medium">Intermediate</span> → <span className="text-orange-600 font-medium">Advanced</span>.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ── STATS CARDS ─────────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Modules',  value: modules.length,   icon: 'Layers',     bg: 'bg-emerald-50', ic: 'text-emerald-600', border: 'border-emerald-100' },
                        { label: 'Total Students', value: totalStudents,    icon: 'Users',      bg: 'bg-blue-50',    ic: 'text-blue-600',    border: 'border-blue-100'    },
                        { label: 'Total Lessons',  value: totalLessons,     icon: 'BookOpen',   bg: 'bg-purple-50',  ic: 'text-purple-600',  border: 'border-purple-100'  },
                        { label: 'Avg Completion', value: `${avgCompletion}%`, icon: 'TrendingUp', bg: 'bg-amber-50', ic: 'text-amber-600', border: 'border-amber-100'  },
                    ].map((s) => {
                        const I = Icons[s.icon];
                        return (
                            <Card key={s.label} className={`border ${s.border} shadow-sm`}>
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                                        <I className={`w-5 h-5 ${s.ic}`} />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-gray-900">{s.value}</p>
                                        <p className="text-xs text-gray-500">{s.label}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* ── FILTERS ─────────────────────────────────────────────── */}
                <Card className="shadow-sm">
                    <CardContent className="p-4 space-y-4">
                        {/* Search + view toggle */}
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search by title, description, level…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            {search && (
                                <Button variant="ghost" size="icon" onClick={() => setSearch('')} className="shrink-0">
                                    <Icons.X className="w-4 h-4" />
                                </Button>
                            )}
                            <div className="flex border rounded-md overflow-hidden shrink-0">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={`px-3 py-2 transition-colors ${viewMode === 'grid' ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                                        >
                                            <Icons.LayoutGrid className="w-4 h-4" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Grid view</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={`px-3 py-2 transition-colors ${viewMode === 'list' ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                                        >
                                            <Icons.List className="w-4 h-4" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>List view</TooltipContent>
                                </Tooltip>
                            </div>
                        </div>

                        {/* Status tabs */}
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="h-auto flex-wrap bg-gray-100 p-1 rounded-xl gap-1">
                                {STATUS_TABS.map((tab) => {
                                    const I = Icons[tab.icon];
                                    return (
                                        <TabsTrigger
                                            key={tab.key}
                                            value={tab.key}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                                        >
                                            <I className="w-3.5 h-3.5" />
                                            {tab.label}
                                            <span className="ml-1 bg-white/20 text-current text-[10px] font-bold px-1.5 py-0.5 rounded-full data-[state=inactive]:bg-gray-200 data-[state=inactive]:text-gray-600">
                                                {counts[tab.key]}
                                            </span>
                                        </TabsTrigger>
                                    );
                                })}
                            </TabsList>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* ── MODULE LIST / GRID ───────────────────────────────────── */}
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="text-center space-y-3">
                            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-sm text-gray-500">Loading modules…</p>
                        </div>
                    </div>
                ) : filtered.length === 0 ? (
                    <Card className="shadow-sm">
                        <CardContent className="py-20 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Icons.Layers className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                {search || activeTab !== 'all' ? 'No modules match your filters' : 'No modules yet'}
                            </h3>
                            <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
                                {search || activeTab !== 'all'
                                    ? 'Try adjusting your search or tab filter.'
                                    : 'Create your first module and start teaching today.'}
                            </p>
                            {activeTab === 'all' && !search && (
                                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => router.push('/instructor/modules/create')}>
                                    <Icons.PlusCircle className="w-4 h-4 mr-2" /> Create Your First Module
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : viewMode === 'grid' ? (
                    /* ─── GRID VIEW ─── */
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filtered.map((mod) => (
                            <ModuleCard
                                key={mod._id}
                                module={mod}
                                onView={(m) => router.push(`/instructor/modules/${m._id}`)}
                                onEdit={(m) => router.push(`/instructor/modules/${m._id}/edit`)}
                                onSubmit={(m) => setSubmitTarget(m)}
                                onDelete={(m) => setDeleteTarget(m)}
                            />
                        ))}
                    </div>
                ) : (
                    /* ─── LIST VIEW ─── */
                    <Card className="shadow-sm overflow-hidden">
                        {/* header row */}
                        <div className="grid grid-cols-12 px-5 py-3 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            <div className="col-span-5">Module</div>
                            <div className="col-span-2 text-center">Status</div>
                            <div className="col-span-1 text-center hidden sm:block">Level</div>
                            <div className="col-span-1 text-center hidden md:block">Students</div>
                            <div className="col-span-1 text-center hidden lg:block">Lessons</div>
                            <div className="col-span-2 text-right">Actions</div>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {filtered.map((mod) => (
                                <div key={mod._id} className="grid grid-cols-12 px-5 py-4 items-center hover:bg-gray-50 transition-colors">
                                    <div className="col-span-5 flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                                            {mod.bannerUrl
                                                ? <img src={mod.bannerUrl} alt="" className="w-full h-full object-cover" />
                                                : <Icons.Layers className="w-5 h-5 text-white" />
                                            }
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 text-sm truncate">{mod.title}</p>
                                            <p className="text-xs text-gray-400 truncate">{formatDate(mod.createdAt)}</p>
                                        </div>
                                    </div>
                                    <div className="col-span-2 flex justify-center">
                                        <StatusPill status={mod.status} />
                                    </div>
                                    <div className="col-span-1 hidden sm:flex justify-center">
                                        <LevelBadge level={mod.level} />
                                    </div>
                                    <div className="col-span-1 text-center hidden md:block">
                                        <span className="text-sm font-semibold text-gray-700">{mod.enrollmentCount || 0}</span>
                                    </div>
                                    <div className="col-span-1 text-center hidden lg:block">
                                        <span className="text-sm font-semibold text-gray-700">{mod.lessons?.length || 0}</span>
                                    </div>
                                    <div className="col-span-2 flex items-center justify-end gap-1">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-emerald-50" onClick={() => router.push(`/instructor/modules/${mod._id}`)}>
                                                    <Icons.ExternalLink className="w-4 h-4 text-emerald-600" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Manage</TooltipContent>
                                        </Tooltip>
                                        {(mod.status === 'draft' || mod.status === 'rejected') && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50" onClick={() => router.push(`/instructor/modules/${mod._id}/edit`)}>
                                                        <Icons.Pencil className="w-4 h-4 text-blue-500" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Edit</TooltipContent>
                                            </Tooltip>
                                        )}
                                        {mod.status === 'draft' && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-emerald-50" onClick={() => setSubmitTarget(mod)}>
                                                        <Icons.Send className="w-4 h-4 text-emerald-500" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Submit for Review</TooltipContent>
                                            </Tooltip>
                                        )}
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50" onClick={() => setDeleteTarget(mod)}>
                                                    <Icons.Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Delete</TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="px-5 py-3 border-t bg-gray-50 flex items-center justify-between text-xs text-gray-500">
                            <span>Showing {filtered.length} of {modules.length} modules</span>
                        </div>
                    </Card>
                )}

                {/* ── DELETE CONFIRM ───────────────────────────────────────── */}
                <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                <Icons.AlertTriangle className="w-5 h-5" /> Delete Module?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete <strong>"{deleteTarget?.title}"</strong>?
                                This will permanently remove the module and all its topics, lessons, and assessments. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                disabled={actionLoading}
                                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            >
                                {actionLoading ? (
                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> Deleting…</>
                                ) : (
                                    <><Icons.Trash2 className="w-4 h-4 mr-2" /> Delete Module</>
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* ── SUBMIT CONFIRM ───────────────────────────────────────── */}
                <Dialog open={!!submitTarget} onOpenChange={(v) => !v && setSubmitTarget(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Icons.Send className="w-5 h-5 text-emerald-600" /> Submit for Review
                            </DialogTitle>
                            <DialogDescription>
                                You're about to submit <strong>"{submitTarget?.title}"</strong> for admin review.
                                Once submitted, the module will be locked from editing until reviewed.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 my-2">
                            <div className="flex items-start gap-3">
                                <Icons.Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-emerald-800 space-y-1">
                                    <p className="font-medium">What happens next?</p>
                                    <ul className="text-xs space-y-0.5 text-emerald-700 list-disc list-inside">
                                        <li>Admin will review your module content</li>
                                        <li>You'll be notified once reviewed</li>
                                        <li>Approved modules will be published for students</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setSubmitTarget(null)} disabled={actionLoading}>
                                Cancel
                            </Button>
                            <Button
                                className="bg-emerald-600 hover:bg-emerald-700"
                                onClick={handleSubmit}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> Submitting…</>
                                ) : (
                                    <><Icons.Send className="w-4 h-4 mr-2" /> Submit Module</>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}
