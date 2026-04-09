'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import adminService from '@/lib/api/adminService';


function stripHtml(html) {
    if (!html) return '';
    return String(html).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

const STATUS_BADGE = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    published: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
};

export default function AdminModuleDetailPage() {
    const { id } = useParams();
    const router = useRouter();

    const [mod, setMod] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedTopics, setExpandedTopics] = useState([]);
    const [expandedLessons, setExpandedLessons] = useState([]);
    const [expandedDirectLessons, setExpandedDirectLessons] = useState([]);
    const [expandedSlides, setExpandedSlides] = useState({});
    const [showAction, setShowAction] = useState(false);
    const [actionType, setActionType] = useState('approve');
    const [reason, setReason] = useState('');
    const [acting, setActing] = useState(false);
    const [toast, setToast] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Assessment review state
    const [showAssessmentAction, setShowAssessmentAction] = useState(false);
    const [assessmentActionType, setAssessmentActionType] = useState('approve');
    const [assessmentReason, setAssessmentReason] = useState('');
    const [actingAssessment, setActingAssessment] = useState(false);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        if (id) fetchModule();
    }, [id]);

    const fetchModule = async () => {
        try {
            setLoading(true);
            const data = await adminService.getModuleById(id);
            setMod(data);
            setExpandedTopics((data.topics || []).map((_, i) => i));
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to load module');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        if (actionType === 'reject' && !reason.trim()) {
            showToast('Please provide a rejection reason', 'error');
            return;
        }
        setActing(true);
        try {
            if (actionType === 'approve') await adminService.approveModule(id);
            else if (actionType === 'publish') await adminService.publishModule(id);
            else await adminService.rejectModule(id, reason);
            showToast(`Module ${actionType}d successfully!`);
            setShowAction(false);
            setReason('');
            fetchModule();
        } catch (err) {
            showToast(err?.response?.data?.message || `Failed to ${actionType}`, 'error');
        } finally {
            setActing(false);
        }
    };

    const handleAssessmentAction = async () => {
        if (assessmentActionType === 'reject' && !assessmentReason.trim()) {
            showToast('Please provide a rejection reason', 'error');
            return;
        }
        setActingAssessment(true);
        try {
            if (assessmentActionType === 'approve') await adminService.approveAssessment(id);
            else await adminService.rejectAssessment(id, assessmentReason);
            showToast(`Assessment ${assessmentActionType}d successfully!`);
            setShowAssessmentAction(false);
            setAssessmentReason('');
            fetchModule();
        } catch (err) {
            showToast(err?.response?.data?.message || `Failed to ${assessmentActionType} assessment`, 'error');
        } finally {
            setActingAssessment(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await adminService.deleteModule(id);
            router.push('/admin/modules');
        } catch (err) {
            showToast(err?.response?.data?.message || 'Failed to delete module', 'error');
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const toggleTopic = (i) => setExpandedTopics(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
    const toggleLesson = (key) => setExpandedLessons(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]);
    const toggleDirectLesson = (i) => setExpandedDirectLessons(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
    const toggleSlide = (key) => setExpandedSlides(prev => ({ ...prev, [key]: !prev[key] }));

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#021d49] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 font-semibold">Loading module...</p>
            </div>
        </div>
    );

    if (error || !mod) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <Icons.AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Module Not Found</h2>
                <p className="text-gray-500 mb-6">{error}</p>
                <button onClick={() => router.push('/admin/modules')} className="bg-[#021d49] text-white px-6 py-3 rounded-xl font-bold">Back to Modules</button>
            </div>
        </div>
    );

    const instructor = mod.instructorIds?.[0] || mod.instructorId;
    const instructorName = instructor
        ? (`${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || instructor.fullName || instructor.email)
        : (mod.pendingInstructorName || mod.pendingInstructorEmail || null);
    const topics = mod.topics || [];
    const allLessons = mod.lessons || [];
    const caseStudies = mod.caseStudies || [];
    const moduleResources = mod.resources || mod.moduleResources || [];
    const finalAssessment = mod.finalAssessment;

    return (
        <div className="min-h-screen bg-gray-50 pt-4 pb-16 overflow-x-hidden">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-white font-semibold text-sm ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
                    {toast.msg}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                <Icons.Trash2 className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Delete Module</h3>
                                <p className="text-sm text-gray-500">This action cannot be undone.</p>
                            </div>
                        </div>
                        <p className="text-gray-700 text-sm mb-6">
                            Are you sure you want to remove <strong>"{mod.title}"</strong>? The module will be deactivated and hidden from instructors and students.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting} className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:border-gray-300 disabled:opacity-50">
                                Cancel
                            </button>
                            <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-all disabled:opacity-60">
                                {deleting ? 'Deleting...' : 'Delete Module'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assessment Action Modal */}
            {showAssessmentAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 capitalize">{assessmentActionType} Assessment</h3>
                        <p className="text-gray-500 text-sm mb-4">
                            {assessmentActionType === 'approve'
                                ? 'Approve the updated final assessment for this module.'
                                : 'Please provide a reason for rejecting this assessment update.'}
                        </p>
                        {assessmentActionType === 'reject' && (
                            <textarea
                                value={assessmentReason}
                                onChange={e => setAssessmentReason(e.target.value)}
                                placeholder="Reason for rejection..."
                                rows={3}
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm mb-4 focus:ring-2 focus:ring-[#021d49] outline-none"
                            />
                        )}
                        <div className="flex gap-3">
                            <button onClick={() => { setShowAssessmentAction(false); setAssessmentReason(''); }} className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:border-gray-300">Cancel</button>
                            <button
                                onClick={handleAssessmentAction}
                                disabled={actingAssessment}
                                className={`flex-1 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-60 ${assessmentActionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                            >
                                {actingAssessment ? 'Processing...' : `Confirm ${assessmentActionType.charAt(0).toUpperCase() + assessmentActionType.slice(1)}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Modal */}
            {showAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 capitalize">{actionType} Module</h3>
                        <p className="text-gray-500 text-sm mb-4">
                            {actionType === 'approve' && 'This will approve the module for publishing.'}
                            {actionType === 'publish' && mod?.status === 'draft' && 'This will publish the draft module directly, bypassing the submission and approval steps. It will be immediately visible to students.'}
                            {actionType === 'publish' && mod?.status !== 'draft' && 'This will make the module visible to students.'}
                            {actionType === 'reject' && 'Please provide a reason for rejection.'}
                        </p>
                        {actionType === 'reject' && (
                            <textarea
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="Reason for rejection..."
                                rows={3}
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm mb-4 focus:ring-2 focus:ring-[#021d49] outline-none"
                            />
                        )}
                        <div className="flex gap-3">
                            <button onClick={() => { setShowAction(false); setReason(''); }} className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:border-gray-300">Cancel</button>
                            <button
                                onClick={handleAction}
                                disabled={acting}
                                className={`flex-1 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-60 ${actionType === 'approve' ? 'bg-blue-600 hover:bg-blue-700' :
                                        actionType === 'publish' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                            'bg-red-600 hover:bg-red-700'
                                    }`}
                            >
                                {acting ? 'Processing...' : `Confirm ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                {/* Back + Actions Header */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <button onClick={() => router.push('/admin/modules')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium group">
                        <Icons.ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Back to Modules
                    </button>
                    <div className="flex gap-2 flex-wrap">
                        {/* Approve — shown for draft, submitted, rejected */}
                        {['draft', 'submitted', 'rejected'].includes(mod.status) && (
                            <button onClick={() => { setActionType('approve'); setShowAction(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700">
                                <Icons.CheckCircle className="w-4 h-4" /> Approve
                            </button>
                        )}
                        {/* Reject — shown for submitted modules from instructors */}
                        {mod.status === 'submitted' && (
                            <button onClick={() => { setActionType('reject'); setShowAction(true); }} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700">
                                <Icons.XCircle className="w-4 h-4" /> Reject
                            </button>
                        )}
                        {/* Publish — for approved modules, or directly from draft (admin override) */}
                        {['approved', 'draft', 'submitted'].includes(mod.status) && (
                            <button onClick={() => { setActionType('publish'); setShowAction(true); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700">
                                <Icons.Globe className="w-4 h-4" /> Publish
                            </button>
                        )}
                        <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl font-semibold text-sm hover:bg-red-50 hover:border-red-300 transition-colors">
                            <Icons.Trash2 className="w-4 h-4" /> Delete
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT: Main Content */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Hero Banner + Title */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            {(mod.bannerUrl || mod.thumbnailUrl) && (
                                <img src={mod.bannerUrl || mod.thumbnailUrl} alt={mod.title} className="w-full h-56 object-cover" />
                            )}
                            <div className="p-6">
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[mod.status] || 'bg-gray-100 text-gray-600'}`}>
                                        {mod.status?.charAt(0).toUpperCase() + mod.status?.slice(1)}
                                    </span>
                                    {mod.level && (
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${mod.level === 'beginner' ? 'bg-emerald-100 text-emerald-700' : mod.level === 'intermediate' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                            {mod.level}
                                        </span>
                                    )}
                                    {mod.categoryId?.name && (
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">{mod.categoryId.name}</span>
                                    )}
                                </div>
                                <h1 className="text-2xl font-extrabold text-gray-900 mb-3">{mod.title}</h1>
                                {stripHtml(mod.description) && (
                                    <p className="text-gray-600 leading-relaxed">{stripHtml(mod.description)}</p>
                                )}
                                {mod.duration && (
                                    <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                                        <Icons.Clock className="w-4 h-4" />
                                        <span>Duration: <strong className="text-gray-700">{mod.duration}</strong></span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Module Detail Fields */}
                        {[
                            { key: 'capstoneProjectDescription', label: 'Capstone Project Description', icon: Icons.Target, color: 'indigo' },
                            { key: 'welcomeMessage', label: 'Welcome Message', icon: Icons.MessageSquare, color: 'blue' },
                            { key: 'moduleAim', label: 'Module Aim', icon: Icons.Crosshair, color: 'purple' },
                            { key: 'moduleObjectives', label: 'Module Objectives', icon: Icons.ListChecks, color: 'teal' },
                        ].filter(s => stripHtml(mod[s.key])).map(section => (
                            <div key={section.key} className={`bg-white rounded-2xl border border-gray-100 p-6 shadow-sm`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <section.icon className="w-5 h-5 text-[#021d49]" />
                                    <h3 className="font-bold text-gray-900">{section.label}</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <div className="text-gray-700 text-sm leading-relaxed prose max-w-none break-words" dangerouslySetInnerHTML={{ __html: mod[section.key] }} />
                                </div>
                            </div>
                        ))}

                        {/* Learning Outcomes, Target Audience, Prerequisites as lists */}
                        {[
                            { key: 'learningOutcomes', label: 'Learning Outcomes', icon: Icons.Lightbulb, color: 'amber' },
                            { key: 'targetAudience', label: 'Target Audience', icon: Icons.Users, color: 'blue' },
                            { key: 'prerequisites', label: 'Prerequisites', icon: Icons.BookMarked, color: 'rose' },
                        ].filter(s => {
                            const val = mod[s.key];
                            return Array.isArray(val) ? val.length > 0 : stripHtml(val);
                        }).map(section => {
                            const val = mod[section.key];
                            const isArray = Array.isArray(val);
                            return (
                                <div key={section.key} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <section.icon className="w-5 h-5 text-[#021d49]" />
                                        <h3 className="font-bold text-gray-900">{section.label}</h3>
                                    </div>
                                    {isArray ? (
                                        <ul className="space-y-2">
                                            {val.map((item, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                                    <Icons.CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                    <span>{typeof item === 'string' ? item : item.text || item.value || JSON.stringify(item)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <div className="text-gray-700 text-sm leading-relaxed prose max-w-none break-words" dangerouslySetInnerHTML={{ __html: val }} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Topics & Lessons */}
                        {topics.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Icons.BookOpen className="w-5 h-5 text-[#021d49]" />
                                        <h3 className="font-bold text-gray-900">Topics & Lessons ({topics.length} Topics)</h3>
                                    </div>
                                    <button onClick={() => setExpandedTopics(expandedTopics.length ? [] : topics.map((_, i) => i))} className="text-xs text-[#021d49] font-semibold hover:underline">
                                        {expandedTopics.length ? 'Collapse All' : 'Expand All'}
                                    </button>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {topics.map((topic, ti) => {
                                        const isOpen = expandedTopics.includes(ti);
                                        const topicLessons = topic.lessons || [];
                                        return (
                                            <div key={ti}>
                                                <button onClick={() => toggleTopic(ti)} className="w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-50 text-left transition-colors">
                                                    <div className="w-8 h-8 rounded-xl bg-[#021d49] text-white font-bold text-sm flex items-center justify-center flex-shrink-0">{ti + 1}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-gray-900 truncate">{topic.name || topic.title || `Topic ${ti + 1}`}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            {topicLessons.length} {topicLessons.length === 1 ? 'lesson' : 'lessons'}
                                                            {topic.duration && ` · ${topic.duration}`}
                                                        </p>
                                                    </div>
                                                    <Icons.ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                                </button>

                                                {isOpen && (
                                                    <div className="px-6 pb-4 space-y-2 bg-gray-50/50">
                                                        {/* Topic intro/outcomes */}
                                                        {stripHtml(topic.introduction) && (
                                                            <div className="p-3 bg-blue-50 rounded-xl text-sm text-blue-800 mb-3">
                                                                <p className="font-semibold mb-1">Introduction</p>
                                                                <p>{stripHtml(topic.introduction)}</p>
                                                            </div>
                                                        )}
                                                        {topic.learningOutcomes?.length > 0 && (
                                                            <div className="p-3 bg-amber-50 rounded-xl text-sm mb-3">
                                                                <p className="font-semibold text-amber-800 mb-1">Topic Learning Outcomes</p>
                                                                <ul className="space-y-1">
                                                                    {topic.learningOutcomes.map((o, oi) => (
                                                                        <li key={oi} className="text-amber-700 flex items-start gap-1.5">
                                                                            <Icons.CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                                                            <span dangerouslySetInnerHTML={{ __html: typeof o === 'string' ? o : o.text }} />
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {/* Lessons */}
                                                        {topicLessons.map((lesson, li) => {
                                                            const lessonKey = `${ti}-${li}`;
                                                            const isLessonOpen = expandedLessons.includes(lessonKey);
                                                            const hasQuiz = lesson.assessment?.questions?.length > 0;
                                                            const hasTasks = (lesson.tasks?.length > 0) || (lesson.deliverables?.length > 0) || (lesson.evaluationCriteria?.length > 0);
                                                            return (
                                                                <div key={li} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                                                    <button onClick={() => toggleLesson(lessonKey)} className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 text-left">
                                                                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center flex-shrink-0">{li + 1}</div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="font-semibold text-gray-900 text-sm truncate">{lesson.title || `Lesson ${li + 1}`}</p>
                                                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                                                {lesson.duration && <span className="text-xs text-gray-500">{lesson.duration}</span>}
                                                                                {hasQuiz && <span className="text-xs text-indigo-600 font-medium flex items-center gap-1"><Icons.FileQuestion className="w-3 h-3" /> Quiz ({lesson.assessment.questions.length})</span>}
                                                                                {hasTasks && <span className="text-xs text-purple-600 font-medium flex items-center gap-1"><Icons.ClipboardList className="w-3 h-3" /> Tasks</span>}
                                                                                {(lesson.lessonResources || lesson.resources || []).length > 0 && <span className="text-xs text-teal-600 font-medium flex items-center gap-1"><Icons.Paperclip className="w-3 h-3" /> {(lesson.lessonResources || lesson.resources || []).length} Resources</span>}
                                                                            </div>
                                                                        </div>
                                                                        <Icons.ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isLessonOpen ? 'rotate-180' : ''}`} />
                                                                    </button>

                                                                    {isLessonOpen && (
                                                                        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
                                                                            {/* Content */}
                                                                            {stripHtml(lesson.content) && (
                                                                                <div>
                                                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Lesson Content</p>
                                                                                    <div className="overflow-x-auto border border-gray-100 rounded-lg bg-gray-50">
                                                                                        <div className="text-sm text-gray-700 prose max-w-none leading-relaxed break-words p-4" dangerouslySetInnerHTML={{ __html: lesson.content }} />
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {/* Tasks */}
                                                                            {lesson.tasks?.length > 0 && (
                                                                                <div>
                                                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Tasks</p>
                                                                                    <ul className="space-y-1">
                                                                                        {lesson.tasks.map((t, ti2) => (
                                                                                            <li key={ti2} className="flex items-start gap-2 text-sm text-gray-700 bg-blue-50 rounded-lg px-3 py-2">
                                                                                                <Icons.CheckSquare className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                                                                                <span>{typeof t === 'string' ? t : t.text}</span>
                                                                                            </li>
                                                                                        ))}
                                                                                    </ul>
                                                                                </div>
                                                                            )}

                                                                            {/* Deliverables */}
                                                                            {lesson.deliverables?.length > 0 && (
                                                                                <div>
                                                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Deliverables</p>
                                                                                    <ul className="space-y-1">
                                                                                        {lesson.deliverables.map((d, di) => (
                                                                                            <li key={di} className="flex items-start gap-2 text-sm text-gray-700 bg-purple-50 rounded-lg px-3 py-2">
                                                                                                <Icons.Package className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                                                                                                <span>{typeof d === 'string' ? d : d.text}</span>
                                                                                            </li>
                                                                                        ))}
                                                                                    </ul>
                                                                                </div>
                                                                            )}

                                                                            {/* Evaluation Criteria */}
                                                                            {lesson.evaluationCriteria?.length > 0 && (
                                                                                <div>
                                                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Evaluation Criteria</p>
                                                                                    <ul className="space-y-1">
                                                                                        {lesson.evaluationCriteria.map((c, ci) => (
                                                                                            <li key={ci} className="flex items-start gap-2 text-sm text-gray-700 bg-amber-50 rounded-lg px-3 py-2">
                                                                                                <Icons.Star className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                                                                                <span>{typeof c === 'string' ? c : c.text}</span>
                                                                                            </li>
                                                                                        ))}
                                                                                    </ul>
                                                                                </div>
                                                                            )}

                                                                            {/* Quiz */}
                                                                            {hasQuiz && (
                                                                                <div>
                                                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Quiz ({lesson.assessment.questions.length} questions)</p>
                                                                                    <div className="space-y-3">
                                                                                        {lesson.assessment.questions.map((q, qi) => (
                                                                                            <div key={qi} className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                                                                                                <p className="text-sm font-semibold text-gray-900 mb-1">Q{qi + 1}: {q.question || q.text}</p>
                                                                                                <p className="text-xs text-indigo-600 mb-2 capitalize">Type: {q.type} · {q.points || 1} pt{q.points !== 1 ? 's' : ''}</p>
                                                                                                {q.options?.length > 0 && (
                                                                                                    <ul className="space-y-1 mb-2">
                                                                                                        {q.options.map((opt, oi) => (
                                                                                                            <li key={oi} className={`text-xs px-3 py-1.5 rounded-lg ${String(q.correctAnswer) === String(oi) || q.correctAnswer === opt ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'bg-white text-gray-600'}`}>
                                                                                                                {String.fromCharCode(65 + oi)}. {opt}
                                                                                                                {(String(q.correctAnswer) === String(oi) || q.correctAnswer === opt) && ' ✓'}
                                                                                                            </li>
                                                                                                        ))}
                                                                                                    </ul>
                                                                                                )}
                                                                                                {q.type !== 'multiple_choice' && q.correctAnswer && (
                                                                                                    <p className="text-xs text-emerald-700 font-medium">Answer: {q.correctAnswer}</p>
                                                                                                )}
                                                                                                {q.explanation && <p className="text-xs text-gray-500 italic mt-1">Explanation: {q.explanation}</p>}
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {/* Resources */}
                                                                            {(lesson.lessonResources || lesson.resources || []).length > 0 && (
                                                                                <div>
                                                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Resources</p>
                                                                                    <div className="space-y-1">
                                                                                        {(lesson.lessonResources || lesson.resources || []).map((res, ri) => {
                                                                                            const name = typeof res === 'string' ? res : (res.name || res.url);
                                                                                            const url = typeof res === 'string' ? res : res.url;
                                                                                            const ext = (name || url || '').split('.').pop()?.toLowerCase();
                                                                                            const isPdf = ext === 'pdf';
                                                                                            const href = isPdf ? url : url?.replace('/upload/', '/upload/fl_attachment/');
                                                                                            return (
                                                                                                <a key={ri} href={href} target="_blank" rel="noopener noreferrer" {...(!isPdf && { download: name })} className="flex items-center gap-2 p-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-medium transition-colors">
                                                                                                    <Icons.Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
                                                                                                    <span className="truncate">{name}</span>
                                                                                                    {res.fileType && <span className="bg-teal-200 text-teal-800 px-1.5 py-0.5 rounded text-xs ml-auto flex-shrink-0">{res.fileType}</span>}
                                                                                                    {isPdf ? <Icons.ExternalLink className="w-3 h-3 flex-shrink-0" /> : <Icons.Download className="w-3 h-3 flex-shrink-0" />}
                                                                                                </a>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                        {topicLessons.length === 0 && <p className="text-sm text-gray-400 italic py-2">No lessons in this topic yet.</p>}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Direct Lessons (new structure) */}
                        {allLessons.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Icons.BookOpen className="w-5 h-5 text-[#021d49]" />
                                        <h3 className="font-bold text-gray-900">Lessons ({allLessons.length})</h3>
                                    </div>
                                    <button
                                        onClick={() => setExpandedDirectLessons(expandedDirectLessons.length ? [] : allLessons.map((_, i) => i))}
                                        className="text-xs text-[#021d49] font-semibold hover:underline"
                                    >
                                        {expandedDirectLessons.length ? 'Collapse All' : 'Expand All'}
                                    </button>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {allLessons.map((lesson, li) => {
                                        const isOpen = expandedDirectLessons.includes(li);
                                        const slides = lesson.slides || [];
                                        const quiz = lesson.assessmentQuiz || [];
                                        const resources = lesson.lessonResources || lesson.resources || [];
                                        const outcomes = lesson.learningOutcomes || [];
                                        return (
                                            <div key={li}>
                                                {/* Lesson Header */}
                                                <button
                                                    onClick={() => toggleDirectLesson(li)}
                                                    className="w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-50 text-left transition-colors"
                                                >
                                                    <div className="w-8 h-8 rounded-xl bg-[#021d49] text-white font-bold text-sm flex items-center justify-center flex-shrink-0">{li + 1}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-gray-900 truncate">{lesson.title || `Lesson ${li + 1}`}</p>
                                                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                            {slides.length > 0 && (
                                                                <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                                                                    <Icons.Layers className="w-3 h-3" /> {slides.length} slide{slides.length !== 1 ? 's' : ''}
                                                                </span>
                                                            )}
                                                            {quiz.length > 0 && (
                                                                <span className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                                                                    <Icons.FileQuestion className="w-3 h-3" /> {quiz.length} question{quiz.length !== 1 ? 's' : ''}
                                                                </span>
                                                            )}
                                                            {resources.length > 0 && (
                                                                <span className="text-xs text-teal-600 font-medium flex items-center gap-1">
                                                                    <Icons.Paperclip className="w-3 h-3" /> {resources.length} resource{resources.length !== 1 ? 's' : ''}
                                                                </span>
                                                            )}
                                                            {lesson.quizPassingScore && (
                                                                <span className="text-xs text-gray-400">{lesson.quizPassingScore}% pass</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Icons.ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                                </button>

                                                {isOpen && (
                                                    <div className="px-6 pb-6 space-y-5 border-t border-gray-100 pt-4 bg-gray-50/30">

                                                        {/* Description */}
                                                        {stripHtml(lesson.description) && (
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Description</p>
                                                                <div className="overflow-x-auto bg-white rounded-xl border border-gray-100">
                                                                    <div className="text-sm text-gray-700 prose max-w-none leading-relaxed break-words p-4" dangerouslySetInnerHTML={{ __html: lesson.description }} />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Learning Outcomes */}
                                                        {outcomes.length > 0 && (
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Learning Outcomes</p>
                                                                <ul className="space-y-1.5">
                                                                    {outcomes.map((o, oi) => (
                                                                        <li key={oi} className="flex items-start gap-2 text-sm text-gray-700 bg-amber-50 rounded-lg px-3 py-2">
                                                                            <Icons.CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                                                            <span>{typeof o === 'string' ? o : o.text || o.value || JSON.stringify(o)}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}

                                                        {/* Slides */}
                                                        {slides.length > 0 && (
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Slides ({slides.length})</p>
                                                                <div className="space-y-3">
                                                                    {slides.map((slide, si) => {
                                                                        const slideKey = `${li}-${si}`;
                                                                        const slideOpen = expandedSlides[slideKey];
                                                                        const typeLabel = {
                                                                            text: 'Text',
                                                                            image: 'Image',
                                                                            video: 'Video',
                                                                            diagram: 'Diagram',
                                                                            codeSnippet: 'Code Snippet',
                                                                        }[slide.type] || slide.type;
                                                                        const typeColor = {
                                                                            text: 'bg-blue-100 text-blue-700',
                                                                            image: 'bg-emerald-100 text-emerald-700',
                                                                            video: 'bg-purple-100 text-purple-700',
                                                                            diagram: 'bg-orange-100 text-orange-700',
                                                                            codeSnippet: 'bg-gray-800 text-green-300',
                                                                        }[slide.type] || 'bg-gray-100 text-gray-600';
                                                                        return (
                                                                            <div key={si} className="rounded-xl border border-gray-200 overflow-hidden bg-white">
                                                                                <button
                                                                                    onClick={() => toggleSlide(slideKey)}
                                                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                                                                                >
                                                                                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{si + 1}</span>
                                                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${typeColor}`}>{typeLabel}</span>
                                                                                    <span className="text-sm text-gray-700 flex-1 truncate">
                                                                                        {slide.title || (slide.type === 'text' ? stripHtml(slide.content)?.slice(0, 60) : '') || (slide.type === 'codeSnippet' ? (slide.language || 'code') + ' snippet' : '') || `Slide ${si + 1}`}
                                                                                    </span>
                                                                                    <Icons.ChevronDown className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${slideOpen ? 'rotate-180' : ''}`} />
                                                                                </button>
                                                                                {slideOpen && (
                                                                                    <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3">
                                                                                        {slide.type === 'text' && slide.content && (
                                                                                            <div className="overflow-x-auto">
                                                                                                <div className="text-sm text-gray-700 prose max-w-none break-words" dangerouslySetInnerHTML={{ __html: slide.content }} />
                                                                                            </div>
                                                                                        )}
                                                                                        {slide.type === 'image' && (
                                                                                            <>
                                                                                                {slide.imageUrl && <img src={slide.imageUrl} alt={slide.caption || 'Slide image'} className="rounded-lg max-h-64 object-contain border border-gray-100" />}
                                                                                                {slide.caption && <p className="text-xs text-gray-500 italic">{slide.caption}</p>}
                                                                                            </>
                                                                                        )}
                                                                                        {slide.type === 'video' && (
                                                                                            <>
                                                                                                {slide.videoUrl && (
                                                                                                    <a href={slide.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                                                                                                        <Icons.Play className="w-4 h-4" /> {slide.videoUrl}
                                                                                                    </a>
                                                                                                )}
                                                                                                {slide.caption && <p className="text-xs text-gray-500 italic">{slide.caption}</p>}
                                                                                            </>
                                                                                        )}
                                                                                        {slide.type === 'diagram' && (
                                                                                            <>
                                                                                                {slide.diagramUrl && <img src={slide.diagramUrl} alt={slide.caption || 'Diagram'} className="rounded-lg max-h-64 object-contain border border-gray-100" />}
                                                                                                {slide.caption && <p className="text-xs text-gray-500 italic">{slide.caption}</p>}
                                                                                            </>
                                                                                        )}
                                                                                        {slide.type === 'codeSnippet' && (
                                                                                            <div className="space-y-3">
                                                                                                {slide.instructions && (
                                                                                                    <div className="text-xs text-blue-200 bg-blue-950 rounded-lg px-3 py-2 border border-blue-800">
                                                                                                        <span className="font-semibold text-blue-300">Instructions: </span>{slide.instructions}
                                                                                                    </div>
                                                                                                )}
                                                                                                {slide.starterCode && (
                                                                                                    <div>
                                                                                                        <div className="flex items-center justify-between px-3 py-1.5 bg-[#2d2d2d] rounded-t-lg border-b border-gray-600">
                                                                                                            <span className="text-xs text-gray-400 font-semibold">Starter Code · {slide.language || 'python'}</span>
                                                                                                        </div>
                                                                                                        <pre className="bg-[#1e1e1e] text-green-300 text-xs p-4 rounded-b-lg overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">{slide.starterCode}</pre>
                                                                                                    </div>
                                                                                                )}
                                                                                                {slide.expectedOutput && (
                                                                                                    <div>
                                                                                                        <div className="flex items-center px-3 py-1.5 bg-[#2d2d2d] rounded-t-lg border-b border-gray-600">
                                                                                                            <span className="text-xs text-gray-400 font-semibold">Expected Output</span>
                                                                                                        </div>
                                                                                                        <pre className="bg-[#1e1e1e] text-yellow-200 text-xs p-4 rounded-b-lg overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">{slide.expectedOutput}</pre>
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Quiz */}
                                                        {quiz.length > 0 && (
                                                            <div>
                                                                <div className="flex items-center gap-3 mb-3">
                                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Assessment Quiz ({quiz.length} question{quiz.length !== 1 ? 's' : ''})</p>
                                                                    {lesson.quizPassingScore && (
                                                                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">{lesson.quizPassingScore}% to pass</span>
                                                                    )}
                                                                    {lesson.quizMaxAttempts && (
                                                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{lesson.quizMaxAttempts} attempt{lesson.quizMaxAttempts !== 1 ? 's' : ''}</span>
                                                                    )}
                                                                </div>
                                                                <div className="space-y-3">
                                                                    {quiz.map((q, qi) => (
                                                                        <div key={qi} className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                                                                            <p className="text-sm font-semibold text-gray-900 mb-1">Q{qi + 1}: {q.question || q.text}</p>
                                                                            <p className="text-xs text-indigo-600 mb-2 capitalize">
                                                                                Type: {(q.type || 'multiple_choice').replace('_', ' ')} · {q.points || 1} pt{q.points !== 1 ? 's' : ''}
                                                                            </p>
                                                                            {/* Code snippet attached to question */}
                                                                            {q.codeSnippet && (
                                                                                <div className="mb-3 rounded-lg overflow-hidden border border-gray-600">
                                                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#2d2d2d]">
                                                                                        <Icons.Code className="w-3.5 h-3.5 text-gray-400" />
                                                                                        <span className="text-xs text-gray-300 font-semibold">Code · {q.codeSnippet.language || 'python'}</span>
                                                                                    </div>
                                                                                    <pre className="bg-[#1e1e1e] text-green-300 text-xs p-3 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">{q.codeSnippet.code}</pre>
                                                                                </div>
                                                                            )}
                                                                            {q.options?.length > 0 && (
                                                                                <ul className="space-y-1 mb-2">
                                                                                    {q.options.map((opt, oi) => (
                                                                                        <li key={oi} className={`text-xs px-3 py-1.5 rounded-lg ${String(q.correctAnswer) === String(oi) || q.correctAnswer === opt ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'bg-white text-gray-600'}`}>
                                                                                            {String.fromCharCode(65 + oi)}. {opt}
                                                                                            {(String(q.correctAnswer) === String(oi) || q.correctAnswer === opt) && ' ✓'}
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            )}
                                                                            {q.type !== 'multiple_choice' && q.correctAnswer && (
                                                                                <p className="text-xs text-emerald-700 font-medium">Answer: {q.correctAnswer}</p>
                                                                            )}
                                                                            {q.explanation && <p className="text-xs text-gray-500 italic mt-1">Explanation: {q.explanation}</p>}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Resources */}
                                                        {resources.length > 0 && (
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Resources</p>
                                                                <div className="space-y-1.5">
                                                                    {resources.map((res, ri) => {
                                                                        const name = typeof res === 'string' ? res : (res.name || res.url);
                                                                        const url = typeof res === 'string' ? res : res.url;
                                                                        const desc = typeof res === 'object' ? res.description : '';
                                                                        const fileType = typeof res === 'object' ? (res.fileType || res.type) : '';
                                                                        return (
                                                                            <div key={ri} className="flex items-center gap-3 p-2.5 bg-teal-50 rounded-xl border border-teal-100">
                                                                                <Icons.Paperclip className="w-4 h-4 text-teal-600 flex-shrink-0" />
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-sm font-medium text-teal-900 truncate">{name}</p>
                                                                                    {desc && <p className="text-xs text-teal-600 truncate">{desc}</p>}
                                                                                </div>
                                                                                {fileType && <span className="text-xs bg-teal-200 text-teal-800 px-1.5 py-0.5 rounded flex-shrink-0">{fileType}</span>}
                                                                                {url && (() => {
                                                                                    const ext = (name || url || '').split('.').pop()?.toLowerCase();
                                                                                    const isPdf = ext === 'pdf';
                                                                                    const href = isPdf ? url : url.replace('/upload/', '/upload/fl_attachment/');
                                                                                    return (
                                                                                        <a href={href} target="_blank" rel="noopener noreferrer" {...(!isPdf && { download: name })} className="text-teal-600 hover:text-teal-800 flex-shrink-0">
                                                                                            {isPdf ? <Icons.ExternalLink className="w-3.5 h-3.5" /> : <Icons.Download className="w-3.5 h-3.5" />}
                                                                                        </a>
                                                                                    );
                                                                                })()}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Case Studies */}
                        {caseStudies.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                                    <Icons.FlaskConical className="w-5 h-5 text-[#021d49]" />
                                    <h3 className="font-bold text-gray-900">Case Studies ({caseStudies.length})</h3>
                                </div>
                                <div className="p-6 space-y-6">
                                    {caseStudies.map((cs, ci) => (
                                        <div key={ci} className="border border-gray-200 rounded-2xl overflow-hidden">
                                            <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-5 py-3">
                                                <p className="font-bold text-white">Case Study {ci + 1}{cs.title ? `: ${cs.title}` : ''}</p>
                                            </div>
                                            <div className="p-4 space-y-4">
                                                {[
                                                    { key: 'introduction', label: 'Introduction', color: 'blue' },
                                                    { key: 'dataset', label: 'Dataset', color: 'purple' },
                                                    { key: 'aiTask', label: 'AI Task', color: 'indigo' },
                                                    { key: 'keyReadings', label: 'Key Readings', color: 'amber' },
                                                ].filter(s => stripHtml(cs[s.key])).map(section => (
                                                    <div key={section.key} className={`bg-${section.color}-50 rounded-xl p-4 border border-${section.color}-100`}>
                                                        <p className={`font-semibold text-${section.color}-800 text-sm mb-2`}>{section.label}</p>
                                                        <div className="overflow-x-auto">
                                                            <div className={`text-${section.color}-900 text-sm prose max-w-none break-words`} dangerouslySetInnerHTML={{ __html: cs[section.key] }} />
                                                        </div>
                                                        {cs[`${section.key}Resources`]?.length > 0 && (
                                                            <div className="mt-2 space-y-1">
                                                                {cs[`${section.key}Resources`].map((r, ri) => {
                                                                    const url = typeof r === 'string' ? r : r.url;
                                                                    const name = typeof r === 'string' ? r : (r.name || r.url);
                                                                    return url ? (
                                                                        <a key={ri} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                                                                            <Icons.Link className="w-3 h-3" />{name}
                                                                        </a>
                                                                    ) : null;
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Module Resources */}
                        {moduleResources.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Icons.FolderOpen className="w-5 h-5 text-[#021d49]" />
                                    <h3 className="font-bold text-gray-900">Module Resources ({moduleResources.length})</h3>
                                </div>
                                <div className="space-y-2">
                                    {moduleResources.map((res, ri) => {
                                        const url = typeof res === 'string' ? res : res.url;
                                        const name = typeof res === 'string'
                                            ? `Resource ${ri + 1}`
                                            : (res.name || res.originalName || res.url?.split('/').pop() || `Resource ${ri + 1}`);
                                        const desc = typeof res === 'object' ? res.description : '';
                                        const fileType = typeof res === 'object' ? res.fileType : '';
                                        return (
                                            <div key={ri} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-[#021d49]/30 transition-colors">
                                                <div className="w-9 h-9 rounded-lg bg-[#021d49]/10 flex items-center justify-center flex-shrink-0">
                                                    <Icons.FileText className="w-4 h-4 text-[#021d49]" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                                                    {desc && <p className="text-xs text-gray-500 truncate">{desc}</p>}
                                                </div>
                                                {fileType && <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded flex-shrink-0">{fileType}</span>}
                                                {url && (() => {
                                                    const ext = (name || url || '').split('.').pop()?.toLowerCase();
                                                    const isPdf = ext === 'pdf';
                                                    const href = isPdf ? url : url.replace('/upload/', '/upload/fl_attachment/');
                                                    return (
                                                        <a href={href} target="_blank" rel="noopener noreferrer" {...(!isPdf && { download: name })} className="text-[#021d49] hover:text-blue-700 flex-shrink-0">
                                                            {isPdf ? <Icons.ExternalLink className="w-4 h-4" /> : <Icons.Download className="w-4 h-4" />}
                                                        </a>
                                                    );
                                                })()}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Final Assessment */}
                        {finalAssessment && (
                            <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm overflow-hidden">
                                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center gap-3 flex-wrap">
                                    <Icons.Trophy className="w-5 h-5 text-white" />
                                    <h3 className="font-bold text-white">Final Assessment</h3>
                                    <span className="text-indigo-200 text-sm">{finalAssessment.questions?.length || 0} questions</span>
                                    {mod.assessmentReviewStatus === 'pending' && (
                                        <span className="ml-auto flex items-center gap-1.5 bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full">
                                            <Icons.Clock className="w-3 h-3" /> Pending Review
                                        </span>
                                    )}
                                    {mod.assessmentReviewStatus === 'approved' && (
                                        <span className="ml-auto flex items-center gap-1.5 bg-green-400 text-green-900 text-xs font-bold px-2.5 py-1 rounded-full">
                                            <Icons.CheckCircle className="w-3 h-3" /> Approved
                                        </span>
                                    )}
                                    {mod.assessmentReviewStatus === 'rejected' && (
                                        <span className="ml-auto flex items-center gap-1.5 bg-red-400 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                            <Icons.XCircle className="w-3 h-3" /> Rejected
                                        </span>
                                    )}
                                </div>
                                {mod.assessmentReviewStatus === 'pending' && (
                                    <div className="px-6 pt-4 flex gap-2">
                                        <button
                                            onClick={() => { setAssessmentActionType('approve'); setAssessmentReason(''); setShowAssessmentAction(true); }}
                                            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700"
                                        >
                                            <Icons.CheckCircle className="w-4 h-4" /> Approve Assessment
                                        </button>
                                        <button
                                            onClick={() => { setAssessmentActionType('reject'); setAssessmentReason(''); setShowAssessmentAction(true); }}
                                            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700"
                                        >
                                            <Icons.XCircle className="w-4 h-4" /> Reject Assessment
                                        </button>
                                    </div>
                                )}
                                {mod.assessmentReviewStatus === 'rejected' && mod.assessmentRejectionReason && (
                                    <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">
                                        <strong>Rejection reason:</strong> {mod.assessmentRejectionReason}
                                    </div>
                                )}
                                <div className="p-6 space-y-4">
                                    {finalAssessment.title && <p className="font-semibold text-gray-900">{finalAssessment.title}</p>}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-indigo-50 rounded-xl p-3 text-center">
                                            <p className="text-xl font-bold text-indigo-700">{finalAssessment.passingScore || 70}%</p>
                                            <p className="text-xs text-gray-500">Passing Score</p>
                                        </div>
                                        <div className="bg-purple-50 rounded-xl p-3 text-center">
                                            <p className="text-xl font-bold text-purple-700">{finalAssessment.maxAttempts || 3}</p>
                                            <p className="text-xs text-gray-500">Max Attempts</p>
                                        </div>
                                        <div className="bg-blue-50 rounded-xl p-3 text-center">
                                            <p className="text-xl font-bold text-blue-700">{finalAssessment.timeLimit || '—'}</p>
                                            <p className="text-xs text-gray-500">Time Limit (min)</p>
                                        </div>
                                    </div>
                                    {finalAssessment.instructions && (
                                        <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{finalAssessment.instructions}</p>
                                    )}
                                    {finalAssessment.questions?.length > 0 && (
                                        <div className="space-y-3">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Questions</p>
                                            {finalAssessment.questions.map((q, qi) => (
                                                <div key={qi} className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                                                    <p className="text-sm font-semibold text-gray-900 mb-1">Q{qi + 1}: {q.question || q.text}</p>
                                                    <p className="text-xs text-indigo-600 mb-2 capitalize">Type: {q.type} · {q.points || 1} pt{q.points !== 1 ? 's' : ''}</p>
                                                    {q.options?.length > 0 && (
                                                        <ul className="space-y-1 mb-2">
                                                            {q.options.map((opt, oi) => (
                                                                <li key={oi} className={`text-xs px-3 py-1.5 rounded-lg ${String(q.correctAnswer) === String(oi) || q.correctAnswer === opt ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'bg-white text-gray-600'}`}>
                                                                    {String.fromCharCode(65 + oi)}. {opt}
                                                                    {(String(q.correctAnswer) === String(oi) || q.correctAnswer === opt) && ' ✓'}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                    {q.type === 'essay' && q.rubric && <p className="text-xs text-gray-500 italic">Rubric: {q.rubric}</p>}
                                                    {q.explanation && <p className="text-xs text-gray-500 italic mt-1">Explanation: {q.explanation}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Sidebar */}
                    <div className="space-y-4">
                        {/* Quick Stats */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h4 className="font-bold text-gray-900 mb-4 text-sm">Module Summary</h4>
                            <div className="space-y-3 text-sm">
                                {[
                                    { icon: Icons.BookOpen, label: 'Lessons', value: allLessons.length || topics.reduce((acc, t) => acc + (t.lessons?.length || 0), 0) || '—' },
                                    { icon: Icons.Layers, label: 'Total Slides', value: allLessons.reduce((acc, l) => acc + (l.slides?.length || 0), 0) || '—' },
                                    { icon: Icons.FlaskConical, label: 'Case Studies', value: caseStudies.length || '—' },
                                    { icon: Icons.FolderOpen, label: 'Module Resources', value: moduleResources.length || '—' },
                                    { icon: Icons.Trophy, label: 'Final Assessment', value: finalAssessment ? 'Yes' : 'No' },
                                    { icon: Icons.Users, label: 'Enrollments', value: (mod.enrollmentCount || 0).toLocaleString() },
                                ].map(({ icon: Icon, label, value }) => (
                                    <div key={label} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Icon className="w-4 h-4" />
                                            <span>{label}</span>
                                        </div>
                                        <span className="font-semibold text-gray-900">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Instructor */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h4 className="font-bold text-gray-900 mb-3 text-sm">Instructor</h4>
                            {instructor ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#021d49] to-blue-600 text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
                                        {instructorName ? instructorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{instructorName || instructor.email}</p>
                                        {instructor.email && <p className="text-xs text-gray-500">{instructor.email}</p>}
                                    </div>
                                </div>
                            ) : mod.pendingInstructorEmail ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-600 font-bold flex items-center justify-center text-sm flex-shrink-0">
                                        {(mod.pendingInstructorName || mod.pendingInstructorEmail).slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{mod.pendingInstructorName || 'Pending Instructor'}</p>
                                        <p className="text-xs text-amber-600">{mod.pendingInstructorEmail}</p>
                                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                                            <Icons.Clock className="w-3 h-3" /> Awaiting registration
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 text-gray-400">
                                    <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        <Icons.UserX className="w-5 h-5" />
                                    </div>
                                    <p className="text-sm">No instructor assigned</p>
                                </div>
                            )}
                            {/* Created by admin badge */}
                            {mod.createdByRole === 'admin' && (
                                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                                        <Icons.ShieldCheck className="w-3 h-3" /> Created by Admin
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Dates */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h4 className="font-bold text-gray-900 mb-3 text-sm">Dates</h4>
                            <div className="space-y-2 text-sm">
                                {mod.createdAt && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Created</span>
                                        <span className="font-medium text-gray-700">{new Date(mod.createdAt).toLocaleDateString()}</span>
                                    </div>
                                )}
                                {mod.submittedAt && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Submitted</span>
                                        <span className="font-medium text-gray-700">{new Date(mod.submittedAt).toLocaleDateString()}</span>
                                    </div>
                                )}
                                {mod.publishedAt && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Published</span>
                                        <span className="font-medium text-gray-700">{new Date(mod.publishedAt).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Admin Actions */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                            <h4 className="font-bold text-gray-900 text-sm">Admin Actions</h4>
                            {/* Edit button — available for all statuses */}
                            <button onClick={() => router.push(`/admin/modules/${id}/edit`)} className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 border border-gray-200 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors">
                                <Icons.Edit2 className="w-4 h-4" /> Edit Module Content
                            </button>
                            {mod.status === 'submitted' && (
                                <>
                                    <button onClick={() => { setActionType('approve'); setShowAction(true); }} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors">
                                        <Icons.CheckCircle className="w-4 h-4" /> Approve Module
                                    </button>
                                    <button onClick={() => { setActionType('reject'); setShowAction(true); }} className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-700 border border-red-200 rounded-xl font-semibold text-sm hover:bg-red-100 transition-colors">
                                        <Icons.XCircle className="w-4 h-4" /> Reject Module
                                    </button>
                                </>
                            )}
                            {['approved', 'draft', 'submitted'].includes(mod.status) && (
                                <button onClick={() => { setActionType('publish'); setShowAction(true); }} className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors">
                                    <Icons.Globe className="w-4 h-4" /> {mod.status === 'draft' ? 'Publish Directly' : 'Publish Module'}
                                </button>
                            )}
                            {mod.status === 'published' && (
                                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl p-3">
                                    <Icons.CheckCircle className="w-4 h-4" />
                                    <span>Module is live and published</span>
                                </div>
                            )}
                            {mod.status === 'rejected' && (
                                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-xl p-3">
                                    <Icons.XCircle className="w-4 h-4" />
                                    <span>Module has been rejected</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
