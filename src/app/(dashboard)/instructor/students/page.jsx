'use client';

import React, { useState, useEffect, useCallback } from 'react';
import * as Icons from 'lucide-react';
import moduleEnrollmentService from '@/lib/api/moduleEnrollmentService';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function initials(name = '') {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function statusBadge(status) {
    const map = {
        pending: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
        passed: 'bg-green-100 text-green-700 border border-green-200',
        failed: 'bg-red-100 text-red-700 border border-red-200',
    };
    return map[status] || 'bg-gray-100 text-gray-600 border border-gray-200';
}

function typeBadge(type) {
    const map = {
        essay: 'bg-purple-100 text-purple-700',
        mcq: 'bg-blue-100 text-blue-700',
        mixed: 'bg-indigo-100 text-indigo-700',
    };
    return map[type] || 'bg-gray-100 text-gray-600';
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function StudentResponsesPage() {
    const [modules, setModules] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // filters
    const [filterModule, setFilterModule] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // grading modal
    const [gradeTarget, setGradeTarget] = useState(null); // the submission row
    const [gradePass, setGradePass] = useState(null);     // true | false | null
    const [gradeFeedback, setGradeFeedback] = useState('');
    const [gradeScore, setGradeScore] = useState('');
    const [gradeLoading, setGradeLoading] = useState(false);
    const [gradeError, setGradeError] = useState('');

    // view-answers modal (MCQ / read-only)
    const [viewTarget, setViewTarget] = useState(null);

    // toast
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ── fetch modules for dropdown ──────────────────────────────────────────
    useEffect(() => {
        moduleEnrollmentService.getInstructorModulesList()
            .then(res => setModules(res.data || []))
            .catch(() => {});
    }, []);

    // ── fetch submissions ───────────────────────────────────────────────────
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
        } catch (e) {
            setError(e?.response?.data?.message || 'Failed to load submissions.');
        } finally {
            setLoading(false);
        }
    }, [filterModule, filterType, filterStatus]);

    useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

    // ── stats ───────────────────────────────────────────────────────────────
    const total = submissions.length;
    const pending = submissions.filter(s => s.status === 'pending').length;
    const passed = submissions.filter(s => s.status === 'passed').length;
    const failed = submissions.filter(s => s.status === 'failed').length;

    // ── grading logic ───────────────────────────────────────────────────────
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
            const body = {
                pass: gradePass,
                feedback: gradeFeedback.trim(),
            };
            if (gradeScore !== '') body.score = Number(gradeScore);
            await moduleEnrollmentService.gradeEssay(gradeTarget.enrollmentId, body);
            showToast(`Marked as ${gradePass ? 'Pass' : 'Fail'} — student notified.`);
            setGradeTarget(null);
            fetchSubmissions();
        } catch (e) {
            setGradeError(e?.response?.data?.message || 'Grading failed. Try again.');
        } finally {
            setGradeLoading(false);
        }
    };

    // ── MCQ results for an essay question ──────────────────────────────────
    const essayResults = (sub) =>
        (sub.finalAssessmentResults || []).filter(r => r.questionType === 'essay');
    const mcqResults = (sub) =>
        (sub.finalAssessmentResults || []).filter(r => r.questionType !== 'essay');

    // ────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 pt-20 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-[#16a34a] to-emerald-700 bg-clip-text text-transparent mb-1">
                        Student Submissions
                    </h1>
                    <p className="text-gray-500 text-sm">Review and mark final-assessment submissions from your enrolled students.</p>
                </div>

                {/* Toast */}
                {toast && (
                    <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>
                        {toast.msg}
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Module</label>
                            <select
                                value={filterModule}
                                onChange={e => setFilterModule(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="all">All Modules</option>
                                {modules.map(m => (
                                    <option key={m._id} value={m._id}>
                                        {m.title} {m.level ? `(${m.level})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Submission Type</label>
                            <select
                                value={filterType}
                                onChange={e => setFilterType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="all">All Types</option>
                                <option value="essay">Essay</option>
                                <option value="mcq">MCQ / Auto-graded</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="all">All Statuses</option>
                                <option value="pending">Pending Review</option>
                                <option value="passed">Passed</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={fetchSubmissions}
                                className="w-full px-4 py-2 bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
                            >
                                <Icons.RefreshCw className="w-4 h-4" />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total', value: total, icon: Icons.FileText, color: 'blue' },
                        { label: 'Pending Review', value: pending, icon: Icons.Clock, color: 'yellow' },
                        { label: 'Passed', value: passed, icon: Icons.CheckCircle, color: 'green' },
                        { label: 'Failed', value: failed, icon: Icons.XCircle, color: 'red' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-lg bg-${color}-50`}>
                                    <Icon className={`w-5 h-5 text-${color}-600`} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                                    <p className="text-xs text-gray-500">{label}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900">Submissions</h2>
                        <span className="text-sm text-gray-400">{total} result{total !== 1 ? 's' : ''}</span>
                    </div>

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

                    {!loading && !error && submissions.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
                            <Icons.Inbox className="w-10 h-10 opacity-40" />
                            <p className="text-sm">No submissions found for the selected filters.</p>
                        </div>
                    )}

                    {!loading && !error && submissions.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        {['Student', 'Module', 'Type', 'Score', 'Status', 'Submitted', 'Actions'].map(h => (
                                            <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {submissions.map(sub => (
                                        <tr key={sub.enrollmentId} className="hover:bg-gray-50/60 transition-colors">
                                            {/* Student */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                        {initials(sub.studentName)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{sub.studentName}</p>
                                                        <p className="text-xs text-gray-400">{sub.studentEmail}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Module */}
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-gray-800">{sub.moduleName}</p>
                                                {sub.moduleLevel && (
                                                    <p className="text-xs text-gray-400 capitalize">{sub.moduleLevel}</p>
                                                )}
                                            </td>

                                            {/* Type */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${typeBadge(sub.submissionType)}`}>
                                                    {sub.submissionType}
                                                </span>
                                            </td>

                                            {/* Score */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                {sub.status === 'pending'
                                                    ? <span className="text-gray-400 italic text-xs">Awaiting grade</span>
                                                    : <span className="font-bold text-gray-900">{sub.score ?? 0}%</span>
                                                }
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusBadge(sub.status)}`}>
                                                    {sub.status === 'pending' ? 'Pending Review' : sub.status}
                                                </span>
                                            </td>

                                            {/* Submitted */}
                                            <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-500">
                                                {formatDate(sub.submittedAt)}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setViewTarget(sub)}
                                                        className="px-3 py-1.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors flex items-center gap-1"
                                                    >
                                                        <Icons.Eye className="w-3.5 h-3.5" /> View
                                                    </button>
                                                    {sub.status === 'pending' && (
                                                        <button
                                                            onClick={() => openGradeModal(sub)}
                                                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1"
                                                        >
                                                            <Icons.CheckSquare className="w-3.5 h-3.5" /> Mark
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ── View Answers Modal ─────────────────────────────────────────────── */}
            {viewTarget && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        {/* header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                            <div>
                                <h2 className="font-bold text-gray-900">{viewTarget.studentName}'s Submission</h2>
                                <p className="text-xs text-gray-400">{viewTarget.moduleName}</p>
                            </div>
                            <button onClick={() => setViewTarget(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <Icons.X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* body */}
                        <div className="p-6 overflow-y-auto space-y-5">
                            {/* summary strip */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-gray-50 rounded-xl p-3 text-center">
                                    <p className="text-xs text-gray-500 mb-1">Status</p>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusBadge(viewTarget.status)}`}>
                                        {viewTarget.status === 'pending' ? 'Pending' : viewTarget.status}
                                    </span>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3 text-center">
                                    <p className="text-xs text-gray-500 mb-1">Score</p>
                                    <p className="font-bold text-gray-900">{viewTarget.status === 'pending' ? '—' : `${viewTarget.score}%`}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3 text-center">
                                    <p className="text-xs text-gray-500 mb-1">Attempts</p>
                                    <p className="font-bold text-gray-900">{viewTarget.finalAssessmentAttempts}</p>
                                </div>
                            </div>

                            {/* MCQ answers */}
                            {mcqResults(viewTarget).length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                        <Icons.ListChecks className="w-4 h-4 text-blue-500" /> Auto-graded Questions
                                    </h3>
                                    <div className="space-y-3">
                                        {mcqResults(viewTarget).map((r, i) => (
                                            <div key={i} className={`rounded-xl border p-4 ${r.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                                                <p className="text-xs font-semibold text-gray-500 mb-1">Q{r.questionIndex + 1} · {r.questionType}</p>
                                                <p className="text-sm text-gray-800 mb-2">{r.questionText}</p>
                                                <div className="flex gap-4 text-xs">
                                                    <span className="flex items-center gap-1">
                                                        <Icons.User className="w-3 h-3 text-gray-400" />
                                                        <span className="font-medium">{r.studentAnswer || '(no answer)'}</span>
                                                    </span>
                                                    {r.correctAnswer && (
                                                        <span className="flex items-center gap-1 text-green-700">
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

                            {/* Essay answers */}
                            {essayResults(viewTarget).length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                        <Icons.FileText className="w-4 h-4 text-purple-500" /> Essay Questions
                                    </h3>
                                    <div className="space-y-4">
                                        {essayResults(viewTarget).map((r, i) => (
                                            <div key={i} className="rounded-xl border border-purple-200 bg-purple-50 p-4">
                                                <p className="text-xs font-semibold text-purple-600 mb-1">Essay Q{r.questionIndex + 1}</p>
                                                <p className="text-sm font-medium text-gray-800 mb-3">{r.questionText}</p>
                                                <div className="bg-white rounded-lg border border-purple-100 p-3">
                                                    <p className="text-xs text-gray-500 mb-1 font-medium">Student's Answer:</p>
                                                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{r.studentAnswer || '(no answer provided)'}</p>
                                                </div>
                                                {r.instructorFeedback && (
                                                    <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                                                        <p className="text-xs text-green-700 font-semibold mb-1">Instructor Feedback:</p>
                                                        <p className="text-sm text-green-800">{r.instructorFeedback}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {viewTarget.status === 'pending' && (
                                <div className="pt-2 flex justify-end">
                                    <button
                                        onClick={() => { setViewTarget(null); openGradeModal(viewTarget); }}
                                        className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
                                    >
                                        <Icons.CheckSquare className="w-4 h-4" /> Mark this submission
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Grade / Mark Modal ─────────────────────────────────────────────── */}
            {gradeTarget && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                        {/* header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="font-bold text-gray-900">Mark Submission</h2>
                                <p className="text-xs text-gray-400">{gradeTarget.studentName} · {gradeTarget.moduleName}</p>
                            </div>
                            <button onClick={() => setGradeTarget(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <Icons.X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Essay questions preview */}
                            {essayResults(gradeTarget).length > 0 && (
                                <div className="bg-gray-50 rounded-xl p-4 space-y-3 max-h-56 overflow-y-auto">
                                    {essayResults(gradeTarget).map((r, i) => (
                                        <div key={i}>
                                            <p className="text-xs font-semibold text-gray-500">Q{r.questionIndex + 1}: {r.questionText}</p>
                                            <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap leading-relaxed bg-white rounded-lg border border-gray-200 p-3">
                                                {r.studentAnswer || '(no answer)'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Pass / Fail selection */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Result *</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setGradePass(true)}
                                        className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${gradePass === true ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-green-300'}`}
                                    >
                                        <Icons.CheckCircle className="w-5 h-5" /> Pass
                                    </button>
                                    <button
                                        onClick={() => setGradePass(false)}
                                        className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${gradePass === false ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500 hover:border-red-300'}`}
                                    >
                                        <Icons.XCircle className="w-5 h-5" /> Fail
                                    </button>
                                </div>
                            </div>

                            {/* Optional score override */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Score (optional) <span className="text-gray-400 font-normal">— 0–100, defaults to 100 for Pass / 0 for Fail</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={gradeScore}
                                    onChange={e => setGradeScore(e.target.value)}
                                    placeholder="e.g. 78"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>

                            {/* Feedback */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Feedback * <span className="text-gray-400 font-normal">(sent to student by email)</span></label>
                                <textarea
                                    value={gradeFeedback}
                                    onChange={e => setGradeFeedback(e.target.value)}
                                    placeholder="Write detailed feedback to help the student understand their result…"
                                    rows={5}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                                />
                            </div>

                            {gradeError && (
                                <p className="text-sm text-red-600 flex items-center gap-1.5">
                                    <Icons.AlertCircle className="w-4 h-4" /> {gradeError}
                                </p>
                            )}

                            <div className="flex gap-3 justify-end pt-1">
                                <button
                                    onClick={() => setGradeTarget(null)}
                                    className="px-5 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitGrade}
                                    disabled={gradeLoading}
                                    className="px-6 py-2 bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-60 flex items-center gap-2"
                                >
                                    {gradeLoading ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.Save className="w-4 h-4" />}
                                    {gradeLoading ? 'Saving…' : 'Save & Notify Student'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
