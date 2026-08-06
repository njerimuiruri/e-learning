'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import moduleEnrollmentService from '@/lib/api/moduleEnrollmentService';
import { resolveAssetUrl } from '@/lib/utils/resolveAssetUrl';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EssayQuestionCard from '@/components/shared/submissions/EssayQuestionCard';

// ─── helpers ────────────────────────────────────────────────────────────────

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

// ─── PDF generator ───────────────────────────────────────────────────────────

function downloadSubmissionPDF(sub) {
    const essayQs = (sub.finalAssessmentResults || []).filter(r => r.questionType === 'essay');
    const mcqQs = (sub.finalAssessmentResults || []).filter(r => r.questionType !== 'essay');
    const scoreText = sub.status === 'pending' ? 'Awaiting grade' : `${sub.score ?? 0}%`;
    const statusLabel = sub.status === 'pending' ? 'Pending Review' : (sub.status || '');

    const mcqRows = mcqQs.map((r, i) => `
        <div class="question ${r.isCorrect ? 'correct' : 'wrong'}">
            <div class="q-num">Q${r.questionIndex + 1} · ${(r.questionType || 'MCQ').toUpperCase()}</div>
            <div class="q-text">${r.questionText || ''}</div>
            <div class="q-answer">
                <span class="label">Student answer:</span>
                <span class="value">${r.studentAnswer || '(no answer)'}</span>
            </div>
            ${r.correctAnswer ? `<div class="q-answer correct-answer"><span class="label">Correct answer:</span> <span class="value">${r.correctAnswer}</span></div>` : ''}
            ${r.explanation ? `<div class="explanation">${r.explanation}</div>` : ''}
        </div>
    `).join('');

    const essayRows = essayQs.map((r, i) => `
        <div class="question essay-q">
            <div class="q-num">Essay Q${r.questionIndex + 1}</div>
            <div class="q-text">${r.questionText || ''}</div>
            <div class="essay-response">
                <div class="essay-label">Student's Response:</div>
                <div class="essay-body">${(r.studentAnswer || '(no answer provided)').replace(/\n/g, '<br/>')}</div>
            </div>
            ${r.instructorFeedback ? `
                <div class="feedback-box">
                    <div class="feedback-label">Instructor Feedback:</div>
                    <div class="feedback-body">${r.instructorFeedback.replace(/\n/g, '<br/>')}</div>
                </div>
            ` : ''}
        </div>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${sub.studentName}  ${sub.moduleName} Submission</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a1a1a; padding: 48px 56px; line-height: 1.5; }
  .header { border-bottom: 3px solid #16a34a; padding-bottom: 20px; margin-bottom: 28px; }
  .org { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #16a34a; margin-bottom: 6px; }
  .report-title { font-size: 22px; font-weight: 700; color: #111; margin-bottom: 4px; }
  .report-subtitle { font-size: 13px; color: #555; }
  .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
  .meta-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; }
  .meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 600; margin-bottom: 4px; }
  .meta-value { font-size: 15px; font-weight: 700; color: #0f172a; }
  .meta-value.status-pending { color: #b45309; }
  .meta-value.status-passed { color: #15803d; }
  .meta-value.status-failed { color: #b91c1c; }
  .section-title { font-size: 14px; font-weight: 700; color: #334155; border-left: 4px solid #16a34a; padding-left: 12px; margin-bottom: 16px; margin-top: 28px; }
  .question { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
  .question.correct { border-color: #bbf7d0; background: #f0fdf4; }
  .question.wrong { border-color: #fecaca; background: #fef2f2; }
  .question.essay-q { border-color: #ddd6fe; background: #faf5ff; }
  .q-num { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 4px; }
  .q-text { font-size: 13px; font-weight: 600; color: #1e293b; margin-bottom: 10px; }
  .q-answer { font-size: 12px; margin-bottom: 4px; }
  .q-answer .label { font-weight: 600; color: #475569; margin-right: 4px; }
  .q-answer .value { color: #1e293b; }
  .correct-answer .value { color: #15803d; font-weight: 700; }
  .explanation { font-size: 11px; color: #64748b; font-style: italic; margin-top: 6px; }
  .essay-response { background: white; border: 1px solid #e9d5ff; border-radius: 6px; padding: 12px; margin-top: 8px; }
  .essay-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #7c3aed; margin-bottom: 6px; }
  .essay-body { font-size: 13px; color: #1e293b; line-height: 1.7; }
  .feedback-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px; margin-top: 10px; }
  .feedback-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #15803d; margin-bottom: 6px; }
  .feedback-body { font-size: 13px; color: #166534; line-height: 1.6; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
  @media print { body { padding: 24px; } }
</style>
</head>
<body>
<div class="header">
  <div class="org">Arin Africa · E-Learning Platform</div>
  <div class="report-title">Submission Report</div>
  <div class="report-subtitle">Final Assessment  ${sub.moduleName || ''}</div>
</div>

<div class="meta-grid">
  <div class="meta-card">
    <div class="meta-label">Student</div>
    <div class="meta-value">${sub.studentName || ''}</div>
    <div style="font-size:11px;color:#64748b;margin-top:2px;">${sub.studentEmail || ''}</div>
  </div>
  <div class="meta-card">
    <div class="meta-label">Status</div>
    <div class="meta-value status-${sub.status || 'pending'}">${statusLabel}</div>
  </div>
  <div class="meta-card">
    <div class="meta-label">Score</div>
    <div class="meta-value">${scoreText}</div>
  </div>
  <div class="meta-card">
    <div class="meta-label">Submission Type</div>
    <div class="meta-value" style="text-transform:capitalize;">${sub.submissionType || ''}</div>
  </div>
  <div class="meta-card">
    <div class="meta-label">Attempts</div>
    <div class="meta-value">${sub.finalAssessmentAttempts ?? 1}</div>
  </div>
  <div class="meta-card">
    <div class="meta-label">Submitted</div>
    <div class="meta-value" style="font-size:12px;">${formatDate(sub.submittedAt)}</div>
  </div>
</div>

${mcqQs.length > 0 ? `<div class="section-title">Auto-graded Questions (${mcqQs.length})</div>${mcqRows}` : ''}
${essayQs.length > 0 ? `<div class="section-title">Essay Questions (${essayQs.length})</div>${essayRows}` : ''}
${mcqQs.length === 0 && essayQs.length === 0 ? `<p style="color:#64748b;font-style:italic;padding:20px 0;">No detailed question results available.</p>` : ''}

<div class="footer">
  <span>Generated on ${new Date().toLocaleString('en-GB')}</span>
  <span>Arin Africa E-Learning · Confidential</span>
</div>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) {
        alert('Pop-up blocked. Please allow pop-ups for this site and try again.');
        return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 600);
}

// ─── sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, colorClass }) {
    return (
        <Card className="border-0 shadow-sm">
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
}

function AvatarCell({ name }) {
    return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 select-none">
            {initials(name)}
        </div>
    );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function StudentResponsesPage() {
    const router = useRouter();
    const [modulesList, setModulesList] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // filters
    const [filterModule, setFilterModule] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    // pagination
    const [page, setPage] = useState(1);

    // grading modal
    const [gradeTarget, setGradeTarget] = useState(null);
    const [gradePass, setGradePass] = useState(null);
    const [gradeFeedback, setGradeFeedback] = useState('');
    const [gradeScore, setGradeScore] = useState('');
    const [gradeLoading, setGradeLoading] = useState(false);
    const [gradeError, setGradeError] = useState('');

    // view modal
    const [viewTarget, setViewTarget] = useState(null);

    // toast
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        moduleEnrollmentService.getInstructorModulesList()
            .then(res => setModulesList(res.data || []))
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
            const res = await moduleEnrollmentService.getInstructorSubmissions(params);
            setSubmissions(res.data || []);
            setPage(1);
        } catch (e) {
            setError(e?.response?.data?.message || 'Failed to load submissions.');
        } finally {
            setLoading(false);
        }
    }, [filterModule, filterType, filterStatus]);

    useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

    // ── filtering + search ──────────────────────────────────────────────────
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

    // ── grading ─────────────────────────────────────────────────────────────
    const openGradeModal = (sub) => {
        setGradeTarget(sub);
        setGradePass(null);
        setGradeFeedback('');
        setGradeScore('');
        setGradeError('');
    };

    const submitGrade = async () => {
        if (gradePass === null) { setGradeError('Please select Pass or Fail.'); return; }
        if (!gradeFeedback.trim()) { setGradeError('Feedback is required.'); return; }
        setGradeLoading(true);
        setGradeError('');
        try {
            const body = { pass: gradePass, feedback: gradeFeedback.trim() };
            if (gradeScore !== '') body.score = Number(gradeScore);
            await moduleEnrollmentService.gradeEssay(gradeTarget.enrollmentId, body);
            showToast(`Marked as ${gradePass ? 'Pass' : 'Fail'}  student notified.`);
            setGradeTarget(null);
            fetchSubmissions();
        } catch (e) {
            setGradeError(e?.response?.data?.message || 'Grading failed. Try again.');
        } finally {
            setGradeLoading(false);
        }
    };

    // Patch a freshly generated/regenerated AI insights result into both the
    // open "View Submission" dialog and the underlying submissions list, so
    // reopening the dialog later shows the cached result instantly.
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

    const handleMessageStudent = (sub) => {
        try {
            sessionStorage.setItem('instructor_compose_prefill', JSON.stringify({
                studentId: sub.studentId,
                studentName: sub.studentName,
                studentEmail: sub.studentEmail,
                contextType: 'essay',
                contextTitle: `${sub.moduleName}  Final Assessment`,
                contextDetails: `Submission status: ${sub.status}${sub.score != null ? `, score: ${sub.score}%` : ''}`,
            }));
        } catch {}
        router.push('/instructor/messages');
    };

    const essayResults = (sub) => (sub.finalAssessmentResults || []).filter(r => r.questionType === 'essay');
    const mcqResults = (sub) => (sub.finalAssessmentResults || []).filter(r => r.questionType !== 'essay');

    // ── render ───────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 pt-20 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#16a34a] to-emerald-700 bg-clip-text text-transparent mb-1">
                            Student Submissions
                        </h1>
                        <p className="text-gray-500 text-sm">Review, grade, and export final-assessment submissions from your students.</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchSubmissions}
                        className="gap-2 text-gray-600"
                    >
                        <Icons.RefreshCw className="w-4 h-4" />
                        Refresh
                    </Button>
                </div>

                {/* Toast */}
                {toast && (
                    <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium transition-all flex items-center gap-2 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'}`}>
                        {toast.type === 'success' ? <Icons.CheckCircle className="w-4 h-4" /> : <Icons.AlertCircle className="w-4 h-4" />}
                        {toast.msg}
                    </div>
                )}

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total Submissions" value={total} icon={Icons.FileText} colorClass="bg-blue-50 text-blue-600" />
                    <StatCard label="Pending Review" value={pending} icon={Icons.Clock} colorClass="bg-amber-50 text-amber-600" />
                    <StatCard label="Passed" value={passed} icon={Icons.CheckCircle} colorClass="bg-emerald-50 text-emerald-600" />
                    <StatCard label="Failed" value={failed} icon={Icons.XCircle} colorClass="bg-red-50 text-red-600" />
                </div>

                {/* Filters */}
                <Card className="border-0 shadow-sm">
                    <CardContent className="pt-5 pb-4">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                                    placeholder="Search student or module…"
                                    className="pl-9 text-sm"
                                />
                            </div>

                            {/* Module filter */}
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

                            {/* Type filter */}
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

                            {/* Status filter */}
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

                {/* Submissions Table */}
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
                                                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-56 text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginated.map(sub => (
                                                <TableRow key={sub.enrollmentId} className="hover:bg-emerald-50/20 transition-colors group">
                                                    {/* Student */}
                                                    <TableCell className="py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <AvatarCell name={sub.studentName} />
                                                            <div className="min-w-0">
                                                                <p className="font-medium text-gray-900 text-sm truncate">{sub.studentName}</p>
                                                                <p className="text-xs text-gray-400 truncate">{sub.studentEmail}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Module */}
                                                    <TableCell className="py-3.5">
                                                        <p className="font-medium text-gray-800 text-sm">{sub.moduleName}</p>
                                                        {sub.moduleLevel && (
                                                            <p className="text-xs text-gray-400 capitalize">{sub.moduleLevel}</p>
                                                        )}
                                                    </TableCell>

                                                    {/* Type */}
                                                    <TableCell className="py-3.5">
                                                        <Badge variant="outline" className={`text-xs capitalize ${TYPE_VARIANT[sub.submissionType] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                            {sub.submissionType}
                                                        </Badge>
                                                    </TableCell>

                                                    {/* Score */}
                                                    <TableCell className="py-3.5">
                                                        {sub.status === 'pending'
                                                            ? <span className="text-xs text-gray-400 italic">Awaiting</span>
                                                            : <span className="font-bold text-gray-900 text-sm">{sub.score ?? 0}%</span>
                                                        }
                                                    </TableCell>

                                                    {/* Status */}
                                                    <TableCell className="py-3.5">
                                                        <Badge variant="outline" className={`text-xs capitalize ${STATUS_VARIANT[sub.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                            {sub.status === 'pending' ? 'Pending Review' : sub.status}
                                                        </Badge>
                                                    </TableCell>

                                                    {/* Submitted */}
                                                    <TableCell className="py-3.5 text-xs text-gray-500 whitespace-nowrap">
                                                        {formatDate(sub.submittedAt)}
                                                    </TableCell>

                                                    {/* Actions */}
                                                    <TableCell className="py-3.5">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setViewTarget(sub)}
                                                                className="h-7 px-2.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 gap-1"
                                                            >
                                                                <Icons.Eye className="w-3.5 h-3.5" /> View
                                                            </Button>
                                                            {sub.status === 'pending' && (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => openGradeModal(sub)}
                                                                    className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                                                >
                                                                    <Icons.CheckSquare className="w-3.5 h-3.5" /> Mark
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleMessageStudent(sub)}
                                                                className="h-7 px-2.5 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 gap-1"
                                                                title={`Message ${sub.studentName}`}
                                                            >
                                                                <Icons.MessageCircle className="w-3.5 h-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => downloadSubmissionPDF(sub)}
                                                                className="h-7 px-2.5 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 gap-1"
                                                                title="Download PDF report"
                                                            >
                                                                <Icons.FileDown className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                                        <p className="text-xs text-gray-500">
                                            Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, searched.length)} of {searched.length}
                                        </p>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(1)}
                                                disabled={safePage === 1}
                                                className="h-7 w-7 p-0"
                                            >
                                                <Icons.ChevronsLeft className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                disabled={safePage === 1}
                                                className="h-7 w-7 p-0"
                                            >
                                                <Icons.ChevronLeft className="w-3.5 h-3.5" />
                                            </Button>

                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let p;
                                                if (totalPages <= 5) p = i + 1;
                                                else if (safePage <= 3) p = i + 1;
                                                else if (safePage >= totalPages - 2) p = totalPages - 4 + i;
                                                else p = safePage - 2 + i;
                                                return (
                                                    <Button
                                                        key={p}
                                                        variant={p === safePage ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => setPage(p)}
                                                        className={`h-7 w-7 p-0 text-xs ${p === safePage ? 'bg-emerald-600 hover:bg-emerald-700 border-0' : ''}`}
                                                    >
                                                        {p}
                                                    </Button>
                                                );
                                            })}

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                disabled={safePage === totalPages}
                                                className="h-7 w-7 p-0"
                                            >
                                                <Icons.ChevronRight className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(totalPages)}
                                                disabled={safePage === totalPages}
                                                className="h-7 w-7 p-0"
                                            >
                                                <Icons.ChevronsRight className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── View Submission Dialog ─────────────────────────────────────────── */}
            <Dialog open={!!viewTarget} onOpenChange={open => !open && setViewTarget(null)}>
                <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
                    <DialogHeader className="px-6 pt-5 pb-4 border-b border-gray-100">
                        <div className="flex items-start gap-3">
                            {viewTarget && <AvatarCell name={viewTarget.studentName} />}
                            <div className="min-w-0 flex-1">
                                <DialogTitle className="text-base font-bold text-gray-900">
                                    {viewTarget?.studentName}'s Submission
                                </DialogTitle>
                                <p className="text-xs text-gray-400 mt-0.5">{viewTarget?.moduleName}</p>
                            </div>
                            {viewTarget && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => downloadSubmissionPDF(viewTarget)}
                                    className="gap-1.5 text-xs text-gray-500 hover:text-gray-800 shrink-0"
                                >
                                    <Icons.FileDown className="w-4 h-4" /> Download PDF
                                </Button>
                            )}
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

                                {viewTarget.status === 'pending' && (
                                    <div className="pt-1 flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => { setViewTarget(null); openGradeModal(viewTarget); }}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                                        >
                                            <Icons.CheckSquare className="w-4 h-4" /> Mark this submission
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Grade / Mark Dialog ────────────────────────────────────────────── */}
            <Dialog open={!!gradeTarget} onOpenChange={open => !open && setGradeTarget(null)}>
                <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
                    <DialogHeader className="px-6 pt-5 pb-4 border-b border-gray-100">
                        <DialogTitle className="text-base font-bold text-gray-900">Mark Submission</DialogTitle>
                        {gradeTarget && (
                            <p className="text-xs text-gray-400 mt-0.5">{gradeTarget.studentName} · {gradeTarget.moduleName}</p>
                        )}
                    </DialogHeader>

                    {gradeTarget && (
                        <ScrollArea className="max-h-[80vh]">
                            <div className="p-6 space-y-5">
                                {/* Essay questions preview */}
                                {essayResults(gradeTarget).length > 0 && (
                                    <div className="bg-gray-50 rounded-xl p-4 space-y-3 max-h-52 overflow-y-auto">
                                        {essayResults(gradeTarget).map((r, i) => (
                                            <div key={i}>
                                                <p className="text-xs font-semibold text-gray-500 mb-1">Q{r.questionIndex + 1}: {r.questionText}</p>
                                                <div className="bg-white rounded-lg border border-gray-200 p-3 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                                    {r.submissionType === 'pdf' ? (
                                                        r.studentAnswer ? (
                                                            <a href={resolveAssetUrl(r.studentAnswer)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-violet-700 hover:text-violet-900 underline">
                                                                <Icons.FileDown className="w-4 h-4" /> View submitted PDF
                                                            </a>
                                                        ) : '(no file submitted)'
                                                    ) : (r.studentAnswer || '(no answer)')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Pass / Fail */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">Result *</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setGradePass(true)}
                                            className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${gradePass === true ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-emerald-300'}`}
                                        >
                                            <Icons.CheckCircle className="w-5 h-5" /> Pass
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setGradePass(false)}
                                            className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${gradePass === false ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500 hover:border-red-300'}`}
                                        >
                                            <Icons.XCircle className="w-5 h-5" /> Fail
                                        </button>
                                    </div>
                                </div>

                                {/* Score override */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Score <span className="text-gray-400 font-normal text-xs">(optional · 0–100)</span>
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={gradeScore}
                                        onChange={e => setGradeScore(e.target.value)}
                                        placeholder="e.g. 78"
                                        className="text-sm"
                                    />
                                </div>

                                {/* Feedback */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Feedback * <span className="text-gray-400 font-normal text-xs">(sent to student by email)</span>
                                    </label>
                                    <Textarea
                                        value={gradeFeedback}
                                        onChange={e => setGradeFeedback(e.target.value)}
                                        placeholder="Write detailed feedback to help the student understand their result…"
                                        rows={5}
                                        className="text-sm resize-none"
                                    />
                                </div>

                                {gradeError && (
                                    <div className="flex items-center gap-1.5 text-red-600 text-sm">
                                        <Icons.AlertCircle className="w-4 h-4 shrink-0" /> {gradeError}
                                    </div>
                                )}

                                <div className="flex gap-3 justify-end pt-1">
                                    <Button variant="outline" size="sm" onClick={() => setGradeTarget(null)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={submitGrade}
                                        disabled={gradeLoading}
                                        className="bg-gradient-to-r from-[#16a34a] to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white gap-2"
                                    >
                                        {gradeLoading ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.Save className="w-4 h-4" />}
                                        {gradeLoading ? 'Saving…' : 'Save & Notify Student'}
                                    </Button>
                                </div>
                            </div>
                        </ScrollArea>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
