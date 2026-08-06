'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as Icons from 'lucide-react';
import moduleEnrollmentService from '@/lib/api/moduleEnrollmentService';
import moduleService from '@/lib/api/moduleService';
import { resolveAssetUrl } from '@/lib/utils/resolveAssetUrl';
import EssayQuestionCard from '@/components/shared/submissions/EssayQuestionCard';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const STATUS_VARIANT = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50',
    passed: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50',
    failed: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50',
};

const TYPE_VARIANT = {
    essay: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-50',
    mcq: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-50',
    mixed: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50',
};

const PAGE_SIZE = 10;

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function initials(name = '') {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function AvatarCell({ name }) {
    return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 select-none">
            {initials(name)}
        </div>
    );
}

export default function AdminSubmissionsPage() {
    const [modulesList, setModulesList] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [filterModule, setFilterModule] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [page, setPage] = useState(1);

    const [viewTarget, setViewTarget] = useState(null);

    useEffect(() => {
        moduleService.getAllModules({ limit: 500 })
            .then(res => {
                const list = Array.isArray(res) ? res : res?.modules || [];
                setModulesList(list);
            })
            .catch(() => {});
    }, []);

    const fetchSubmissions = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = {};
            if (filterModule !== 'all') params.moduleId = filterModule;
            if (filterType !== 'all') params.submissionType = filterType;
            if (filterStatus !== 'all') params.status = filterStatus;
            const res = await moduleEnrollmentService.getAdminSubmissions(params);
            setSubmissions(res.data || []);
            setPage(1);
        } catch (e) {
            setError(e?.response?.data?.message || 'Failed to load submissions.');
        } finally {
            setLoading(false);
        }
    }, [filterModule, filterType, filterStatus]);

    useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

    const tabFiltered = submissions.filter(s => {
        if (activeTab === 'pending') return s.status === 'pending';
        if (activeTab === 'passed') return s.status === 'passed';
        if (activeTab === 'failed') return s.status === 'failed';
        return true;
    });

    const searched = search.trim()
        ? tabFiltered.filter(s =>
            s.studentName?.toLowerCase().includes(search.toLowerCase()) ||
            s.studentEmail?.toLowerCase().includes(search.toLowerCase()) ||
            s.moduleName?.toLowerCase().includes(search.toLowerCase())
        )
        : tabFiltered;

    const totalPages = Math.max(1, Math.ceil(searched.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paginated = searched.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const total = submissions.length;
    const pending = submissions.filter(s => s.status === 'pending').length;
    const passed = submissions.filter(s => s.status === 'passed').length;
    const failed = submissions.filter(s => s.status === 'failed').length;

    const mcqResults = (sub) => (sub?.finalAssessmentResults || []).filter(r => r.questionType !== 'essay');
    const essayResults = (sub) => (sub?.finalAssessmentResults || []).filter(r => r.questionType === 'essay');

    // Patch freshly generated AI insights into the open dialog + underlying list
    const handleInsightsUpdate = (questionIndex, insights) => {
        const patchResults = (results = []) =>
            results.map(r => r.questionIndex === questionIndex ? { ...r, aiInsights: insights } : r);

        setViewTarget(prev => prev && ({ ...prev, finalAssessmentResults: patchResults(prev.finalAssessmentResults) }));
        setSubmissions(prev => prev.map(s =>
            s.enrollmentId === viewTarget?.enrollmentId
                ? { ...s, finalAssessmentResults: patchResults(s.finalAssessmentResults) }
                : s
        ));
    };

    return (
        <div className="min-h-screen bg-gray-50/60 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Icons.FileText className="w-5 h-5 text-indigo-600" /> Essay Submissions
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        View essay submissions and AI-generated insights across all modules. Grading remains with the assigned instructor.
                    </p>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Submissions', value: total, icon: 'Inbox', colorClass: 'bg-indigo-50 text-indigo-600' },
                    { label: 'Pending Review', value: pending, icon: 'Clock', colorClass: 'bg-amber-50 text-amber-600' },
                    { label: 'Passed', value: passed, icon: 'CheckCircle2', colorClass: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Failed', value: failed, icon: 'XCircle', colorClass: 'bg-red-50 text-red-600' },
                ].map(({ label, value, icon, colorClass }) => {
                    const Icon = Icons[icon];
                    return (
                        <Card key={label} className="border-0 shadow-sm">
                            <CardContent className="pt-5 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl ${colorClass}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Filters */}
            <Card className="border-0 shadow-sm">
                <CardContent className="pt-5 pb-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="relative">
                            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search student, email, module..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9 text-sm"
                            />
                        </div>

                        <Select value={filterModule} onValueChange={v => { setFilterModule(v); setPage(1); }}>
                            <SelectTrigger className="text-sm">
                                <SelectValue placeholder="All Modules" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Modules</SelectItem>
                                {modulesList.map(m => (
                                    <SelectItem key={m._id} value={m._id}>
                                        {m.title}{m.level ? ` (${m.level})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filterType} onValueChange={v => { setFilterType(v); setPage(1); }}>
                            <SelectTrigger className="text-sm">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="essay">Essay</SelectItem>
                                <SelectItem value="mcq">MCQ / Auto-graded</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(1); }}>
                            <SelectTrigger className="text-sm">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="pending">Pending Review</SelectItem>
                                <SelectItem value="passed">Passed</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="border-0 shadow-sm overflow-hidden">
                <CardHeader className="pb-0 pt-4 px-6">
                    <div className="flex items-center justify-between">
                        <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setPage(1); }}>
                            <TabsList className="h-9">
                                <TabsTrigger value="all" className="text-xs px-3">All <span className="ml-1.5 bg-gray-200 text-gray-600 rounded-full px-1.5 py-0 text-[10px] font-bold">{total}</span></TabsTrigger>
                                <TabsTrigger value="pending" className="text-xs px-3">Pending <span className="ml-1.5 bg-amber-100 text-amber-700 rounded-full px-1.5 py-0 text-[10px] font-bold">{pending}</span></TabsTrigger>
                                <TabsTrigger value="passed" className="text-xs px-3">Passed <span className="ml-1.5 bg-emerald-100 text-emerald-700 rounded-full px-1.5 py-0 text-[10px] font-bold">{passed}</span></TabsTrigger>
                                <TabsTrigger value="failed" className="text-xs px-3">Failed <span className="ml-1.5 bg-red-100 text-red-700 rounded-full px-1.5 py-0 text-[10px] font-bold">{failed}</span></TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <span className="text-xs text-gray-400">{searched.length} result{searched.length !== 1 ? 's' : ''}</span>
                    </div>
                </CardHeader>

                <CardContent className="p-0 mt-3">
                    {loading && (
                        <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
                            <Icons.Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm">Loading submissions…</span>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="flex items-center justify-center py-16 gap-2 text-red-500">
                            <Icons.AlertCircle className="w-5 h-5" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {!loading && !error && searched.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                <Icons.Inbox className="w-8 h-8 opacity-50" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-500">No submissions found</p>
                                <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or search term.</p>
                            </div>
                        </div>
                    )}

                    {!loading && !error && searched.length > 0 && (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-52">Student</TableHead>
                                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Module</TableHead>
                                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Type</TableHead>
                                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Score</TableHead>
                                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Status</TableHead>
                                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">Submitted</TableHead>
                                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-28 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginated.map(sub => (
                                            <TableRow key={sub.enrollmentId} className="hover:bg-indigo-50/20 transition-colors group">
                                                <TableCell className="py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <AvatarCell name={sub.studentName} />
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-gray-900 text-sm truncate">{sub.studentName}</p>
                                                            <p className="text-xs text-gray-400 truncate">{sub.studentEmail}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="py-3.5">
                                                    <p className="font-medium text-gray-800 text-sm">{sub.moduleName}</p>
                                                    {sub.moduleLevel && (
                                                        <p className="text-xs text-gray-400 capitalize">{sub.moduleLevel}</p>
                                                    )}
                                                </TableCell>

                                                <TableCell className="py-3.5">
                                                    <Badge variant="outline" className={`text-xs capitalize ${TYPE_VARIANT[sub.submissionType] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                        {sub.submissionType}
                                                    </Badge>
                                                </TableCell>

                                                <TableCell className="py-3.5">
                                                    {sub.status === 'pending'
                                                        ? <span className="text-xs text-gray-400 italic">Awaiting</span>
                                                        : <span className="font-bold text-gray-900 text-sm">{sub.score ?? 0}%</span>
                                                    }
                                                </TableCell>

                                                <TableCell className="py-3.5">
                                                    <Badge variant="outline" className={`text-xs capitalize ${STATUS_VARIANT[sub.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                        {sub.status === 'pending' ? 'Pending Review' : sub.status}
                                                    </Badge>
                                                </TableCell>

                                                <TableCell className="py-3.5">
                                                    <span className="text-xs text-gray-500">{formatDate(sub.submittedAt)}</span>
                                                </TableCell>

                                                <TableCell className="py-3.5 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setViewTarget(sub)}
                                                        className="text-xs gap-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                                                    >
                                                        <Icons.Eye className="w-3.5 h-3.5" /> View
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                                    <span className="text-xs text-gray-400">
                                        Page {safePage} of {totalPages}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" className="text-xs"
                                            disabled={safePage <= 1}
                                            onClick={() => setPage(p => Math.max(1, p - 1))}>
                                            <Icons.ChevronLeft className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button variant="outline" size="sm" className="text-xs"
                                            disabled={safePage >= totalPages}
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                                            <Icons.ChevronRight className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* ── View Submission Dialog (read-only, no grading) ── */}
            <Dialog open={!!viewTarget} onOpenChange={open => !open && setViewTarget(null)}>
                <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden">
                    <DialogHeader className="px-6 pt-5 pb-4 border-b border-gray-100">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <DialogTitle className="text-base font-bold text-gray-900">Submission Details</DialogTitle>
                                {viewTarget && (
                                    <p className="text-xs text-gray-400 mt-0.5">{viewTarget.studentName} · {viewTarget.moduleName}</p>
                                )}
                            </div>
                            <Badge variant="outline" className="text-[10px] gap-1 bg-gray-50 text-gray-500 border-gray-200">
                                <Icons.Eye className="w-3 h-3" /> View only
                            </Badge>
                        </div>
                    </DialogHeader>

                    {viewTarget && (
                        <ScrollArea className="max-h-[70vh]">
                            <div className="p-6 space-y-5">
                                {/* Summary strip */}
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        {
                                            label: 'Status',
                                            value: (
                                                <Badge variant="outline" className={`text-xs capitalize ${STATUS_VARIANT[viewTarget.status] || ''}`}>
                                                    {viewTarget.status === 'pending' ? 'Pending' : viewTarget.status}
                                                </Badge>
                                            ),
                                        },
                                        { label: 'Score', value: viewTarget.status === 'pending' ? '' : `${viewTarget.score}%` },
                                        { label: 'Attempts', value: viewTarget.finalAssessmentAttempts ?? 1 },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                                            <p className="text-xs text-gray-500 mb-1.5">{label}</p>
                                            {typeof value === 'string' || typeof value === 'number'
                                                ? <p className="font-bold text-gray-900 text-sm">{value}</p>
                                                : value}
                                        </div>
                                    ))}
                                </div>

                                <Separator />

                                {/* MCQ */}
                                {mcqResults(viewTarget).length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                            <Icons.ListChecks className="w-4 h-4 text-sky-500" />
                                            Auto-graded Questions ({mcqResults(viewTarget).length})
                                        </h3>
                                        <div className="space-y-3">
                                            {mcqResults(viewTarget).map((r, i) => (
                                                <div key={i} className={`rounded-xl border p-4 ${r.isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                                                    <p className="text-xs font-semibold text-gray-500 mb-1">Q{r.questionIndex + 1} · {r.questionType}</p>
                                                    <p className="text-sm text-gray-800 mb-2 font-medium">{r.questionText}</p>
                                                    <div className="flex flex-wrap gap-4 text-xs">
                                                        <span className="flex items-center gap-1">
                                                            <Icons.User className="w-3 h-3 text-gray-400" />
                                                            <span className="font-medium text-gray-700">{r.studentAnswer || '(no answer)'}</span>
                                                        </span>
                                                        {r.correctAnswer && (
                                                            <span className="flex items-center gap-1 text-emerald-700 font-medium">
                                                                <Icons.Check className="w-3 h-3" />
                                                                Correct: {r.correctAnswer}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {r.explanation && (
                                                        <p className="mt-2 text-xs text-gray-500 italic">{r.explanation}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Essay */}
                                {essayResults(viewTarget).length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                            <Icons.FileText className="w-4 h-4 text-violet-500" />
                                            Essay Questions ({essayResults(viewTarget).length})
                                        </h3>
                                        <div className="space-y-4">
                                            {essayResults(viewTarget).map((r) => (
                                                <EssayQuestionCard
                                                    key={r.questionIndex}
                                                    result={r}
                                                    enrollmentId={viewTarget.enrollmentId}
                                                    onInsightsUpdate={handleInsightsUpdate}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-1 flex justify-end">
                                    <p className="text-xs text-gray-400 italic">
                                        Grading is handled by the module's assigned instructor.
                                    </p>
                                </div>
                            </div>
                        </ScrollArea>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
