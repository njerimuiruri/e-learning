'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import * as Icons from 'lucide-react';
import moduleService from '@/lib/api/moduleService';
import moduleRatingService from '@/lib/api/moduleRatingService';
import InstructorSidebar from '@/components/instructor/InstructorSidebar';

export default function ModuleDetailPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const moduleId = params.moduleId;
    const isNewlyCreated = searchParams.get('new') === 'true';

    const [module, setModule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [expandedLessons, setExpandedLessons] = useState({});
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [ratingSummary, setRatingSummary] = useState(null);
    const [recentReviews, setRecentReviews] = useState([]);
    const [dismissedDraftBanner, setDismissedDraftBanner] = useState(false);

    // Final assessment editor state
    const [showAssessmentEditor, setShowAssessmentEditor] = useState(false);
    const [assessmentDraft, setAssessmentDraft] = useState(null);
    const [savingAssessment, setSavingAssessment] = useState(false);
    const [assessmentError, setAssessmentError] = useState('');

    useEffect(() => {
        if (moduleId) fetchModule();
    }, [moduleId]);

    const fetchModule = async () => {
        try {
            setLoading(true);
            const data = await moduleService.getModuleById(moduleId);
            setModule(data);
        } catch (error) {
            console.error('Error fetching module:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRatings = async () => {
        try {
            const [summaryData, reviewsData] = await Promise.all([
                moduleRatingService.getModuleSummary(moduleId),
                moduleRatingService.getModuleReviews(moduleId, 1, 5),
            ]);
            setRatingSummary(summaryData);
            setRecentReviews(reviewsData?.reviews || []);
        } catch (error) {
            console.error('Error fetching ratings:', error);
        }
    };

    useEffect(() => {
        if (moduleId && module?.status === 'published') fetchRatings();
    }, [moduleId, module?.status]);

    const handleSubmitForApproval = async () => {
        try {
            setSubmitting(true);
            await moduleService.submitForApproval(moduleId);
            setShowSubmitConfirm(false);
            await fetchModule();
        } catch (error) {
            alert('Failed to submit: ' + (error.response?.data?.message || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    const openAssessmentEditor = () => {
        const blank = { title: '', instructions: 'Learners must complete this final assessment to pass and receive the certificate.', questions: [], passingScore: 70, maxAttempts: 3, timeLimit: null };
        setAssessmentDraft(module.finalAssessment ? { ...module.finalAssessment } : blank);
        setAssessmentError('');
        setShowAssessmentEditor(true);
    };

    const handleSaveAssessment = async () => {
        if (!assessmentDraft.title?.trim()) {
            setAssessmentError('Assessment title is required.');
            return;
        }
        setSavingAssessment(true);
        setAssessmentError('');
        try {
            await moduleService.setFinalAssessment(moduleId, assessmentDraft);
            setShowAssessmentEditor(false);
            await fetchModule();
        } catch (err) {
            setAssessmentError(err?.response?.data?.message || 'Failed to save assessment.');
        } finally {
            setSavingAssessment(false);
        }
    };

    const toggleLesson = (index) => {
        setExpandedLessons(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const getStatusBadge = (status) => {
        const badges = {
            draft: { color: 'bg-gray-100 text-gray-700 border-gray-300', icon: 'FileEdit', label: 'Draft' },
            submitted: { color: 'bg-blue-100 text-blue-700 border-blue-300', icon: 'Send', label: 'Submitted for Review' },
            approved: { color: 'bg-green-100 text-green-700 border-green-300', icon: 'CheckCircle', label: 'Approved' },
            published: { color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: 'Globe', label: 'Published' },
            rejected: { color: 'bg-red-100 text-red-700 border-red-300', icon: 'XCircle', label: 'Rejected' },
        };
        const badge = badges[status] || badges.draft;
        const IconComponent = Icons[badge.icon];
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-full border ${badge.color}`}>
                <IconComponent className="w-4 h-4" />
                {badge.label}
            </span>
        );
    };

    const normalizeResourceArray = (value) => {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string' && value.trim().length > 0) {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) return parsed;
            } catch {
                return [value];
            }
            return [value];
        }
        return [];
    };

    const getLevelBadge = (level) => {
        const badges = {
            beginner: { color: 'bg-blue-50 text-blue-600 border-blue-200', label: 'Beginner' },
            intermediate: { color: 'bg-purple-50 text-purple-600 border-purple-200', label: 'Intermediate' },
            advanced: { color: 'bg-orange-50 text-orange-600 border-orange-200', label: 'Advanced' },
        };
        const badge = badges[level] || badges.beginner;
        return (
            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border ${badge.color}`}>
                {badge.label}
            </span>
        );
    };

    if (loading) {
        return (
            <>
                <InstructorSidebar />
                <div className="lg:ml-4 min-h-screen bg-gray-50">
                    <div className="pt-20 lg:pt-4 px-4 sm:px-6 lg:px-8 py-8">
                        <div className="flex justify-center items-center py-20">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading module...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!module) {
        return (
            <>
                <InstructorSidebar />
                <div className="lg:ml-4 min-h-screen bg-gray-50">
                    <div className="pt-20 lg:pt-4 px-4 sm:px-6 lg:px-8 py-8">
                        <div className="text-center py-20">
                            <Icons.AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Module not found</h2>
                            <button onClick={() => router.push('/instructor/modules')} className="text-emerald-600 hover:text-emerald-700 font-medium">
                                Back to Modules
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const canEdit = true;
    const canSubmit = module.status === 'draft' || module.status === 'rejected';

    return (
        <>
            <InstructorSidebar />
            <div className="lg:ml-4 min-h-screen bg-gray-50">
                <div className="pt-20 lg:pt-4 px-4 sm:px-6 lg:px-8 py-8">
                    {/* Back button */}
                    <button
                        onClick={() => router.push('/instructor/modules')}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm font-medium"
                    >
                        <Icons.ArrowLeft className="w-4 h-4" /> Back to Modules
                    </button>

                    {/* ── Newly created celebration + submit nudge ──── */}
                    {isNewlyCreated && module.status === 'draft' && !dismissedDraftBanner && (
                        <div className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-xl p-5 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="bg-emerald-100 p-2.5 rounded-xl flex-shrink-0">
                                    <Icons.PartyPopper className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-emerald-900 text-base">Module Created Successfully! 🎉</p>
                                    <p className="text-sm text-emerald-800 mt-1 leading-relaxed">
                                        Your module is saved as a <strong>draft</strong> and is not yet visible to students.
                                        When you're happy with all your content, click <strong>"Submit for Approval"</strong> below
                                        so an admin can review and publish it.
                                    </p>
                                    <div className="flex flex-wrap items-center gap-3 mt-3">
                                        <button
                                            onClick={() => setShowSubmitConfirm(true)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                                        >
                                            <Icons.Send className="w-4 h-4" /> Submit for Approval Now
                                        </button>
                                        <button
                                            onClick={() => setDismissedDraftBanner(true)}
                                            className="text-xs text-emerald-700 hover:text-emerald-900 underline"
                                        >
                                            I'll submit later
                                        </button>
                                    </div>
                                </div>
                                <button onClick={() => setDismissedDraftBanner(true)} className="text-emerald-400 hover:text-emerald-600 flex-shrink-0">
                                    <Icons.X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Draft reminder banner (existing drafts, not newly created) ── */}
                    {module.status === 'draft' && !isNewlyCreated && !dismissedDraftBanner && (
                        <div className="mb-6 bg-amber-50 border-2 border-amber-300 rounded-xl p-5">
                            <div className="flex items-start gap-4">
                                <div className="bg-amber-100 p-2.5 rounded-xl flex-shrink-0">
                                    <Icons.AlertTriangle className="w-6 h-6 text-amber-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-amber-900 text-sm">This module is a Draft — not yet visible to students</p>
                                    <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                                        Review your lessons and content, then click <strong>"Submit for Approval"</strong> to send it to an administrator for review.
                                        Once approved, an admin can publish it for students to enrol.
                                    </p>
                                    <button
                                        onClick={() => setShowSubmitConfirm(true)}
                                        className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors"
                                    >
                                        <Icons.Send className="w-4 h-4" /> Submit for Approval
                                    </button>
                                </div>
                                <button onClick={() => setDismissedDraftBanner(true)} className="text-amber-400 hover:text-amber-600 flex-shrink-0">
                                    <Icons.X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Rejection Banner */}
                    {module.status === 'rejected' && module.rejectionReason && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Icons.XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-red-900 text-sm">Module Rejected</p>
                                    <p className="text-sm text-red-700 mt-1">{module.rejectionReason}</p>
                                    <p className="text-xs text-red-600 mt-2">Please edit the module to address the feedback, then resubmit for approval.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Published – editable banner */}
                    {module.status === 'published' && (
                        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Icons.Globe className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-emerald-900 text-sm">Module is Live — You Can Still Edit</p>
                                    <p className="text-sm text-emerald-700 mt-1">This module is published and visible to students. You can edit its content, add new lessons, or update details. Changes are applied immediately.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submitted Banner */}
                    {module.status === 'submitted' && (
                        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Icons.Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-blue-900 text-sm">Awaiting Admin Review</p>
                                    <p className="text-sm text-blue-700 mt-1">Your module has been submitted and is pending review by an administrator.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Header */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
                        {/* Banner */}
                        {module.bannerUrl ? (
                            <img src={module.bannerUrl} alt={module.title} className="w-full h-48 object-cover" />
                        ) : (
                            <div className="w-full h-48 bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                                <Icons.Layers className="w-20 h-20 text-white opacity-50" />
                            </div>
                        )}

                        <div className="p-6">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-3 mb-3">
                                        {getStatusBadge(module.status)}
                                        {getLevelBadge(module.level)}
                                        {module.categoryId?.name && (
                                            <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md">
                                                {module.categoryId.name}
                                            </span>
                                        )}
                                    </div>
                                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{module.title}</h1>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                        {module.duration && (
                                            <span className="flex items-center gap-1">
                                                <Icons.Clock className="w-4 h-4" /> {module.duration}
                                            </span>
                                        )}
                                        {module.deliveryMode && (
                                            <span className="flex items-center gap-1">
                                                <Icons.Monitor className="w-4 h-4" /> {module.deliveryMode}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Icons.BookOpen className="w-4 h-4" /> {module.lessons?.length || 0} Lessons
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Icons.Users className="w-4 h-4" /> {module.enrollmentCount || 0} Students
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    {canEdit && (
                                        <button
                                            onClick={() => router.push(`/instructor/modules/${moduleId}/edit`)}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            <Icons.Edit2 className="w-4 h-4" /> Edit Module
                                        </button>
                                    )}
                                    {canSubmit && (
                                        <button
                                            onClick={() => setShowSubmitConfirm(true)}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                                        >
                                            <Icons.Send className="w-4 h-4" /> Submit for Approval
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Sections */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Description */}
                            {module.description && (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Icons.FileText className="w-5 h-5 text-emerald-600" /> Description
                                    </h3>
                                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: module.description }} />
                                </div>
                            )}

                            {/* Welcome Message */}
                            {module.welcomeMessage && (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Icons.MessageSquare className="w-5 h-5 text-emerald-600" /> Welcome Message
                                    </h3>
                                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: module.welcomeMessage }} />
                                </div>
                            )}

                            {/* Module Aim */}
                            {module.moduleAim && (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Icons.Target className="w-5 h-5 text-emerald-600" /> Module Aim
                                    </h3>
                                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: module.moduleAim }} />
                                </div>
                            )}

                            {/* Lessons */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Icons.BookOpen className="w-5 h-5 text-emerald-600" /> Lessons ({module.lessons?.length || 0})
                                </h3>
                                {module.lessons?.length > 0 ? (
                                    <div className="space-y-3">
                                        {module.lessons.map((lesson, idx) => (
                                            <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => toggleLesson(idx)}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                            {idx + 1}
                                                        </span>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{lesson.title}</p>
                                                            <div className="flex flex-wrap gap-2 mt-1">
                                                                {lesson.duration && (
                                                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                        <Icons.Clock className="w-3 h-3" /> {lesson.duration}
                                                                    </span>
                                                                )}
                                                                {lesson.videoUrl && (
                                                                    <span className="text-xs text-blue-600 flex items-center gap-1">
                                                                        <Icons.Video className="w-3 h-3" /> Video
                                                                    </span>
                                                                )}
                                                                {(lesson.lessonResources || lesson.resources || []).length > 0 && (
                                                                    <span className="text-xs text-purple-600 flex items-center gap-1">
                                                                        <Icons.Paperclip className="w-3 h-3" /> {(lesson.lessonResources || lesson.resources || []).length} resource(s)
                                                                    </span>
                                                                )}
                                                                {lesson.assessment?.questions?.length > 0 && (
                                                                    <span className="text-xs text-amber-600 flex items-center gap-1">
                                                                        <Icons.HelpCircle className="w-3 h-3" /> {lesson.assessment.questions.length} question(s)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Icons.ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedLessons[idx] ? 'rotate-180' : ''}`} />
                                                </button>
                                                {expandedLessons[idx] && (
                                                    <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-3">
                                                        {lesson.description && (
                                                            <div className="prose prose-sm max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: lesson.description }} />
                                                        )}
                                                        {lesson.content && (
                                                            <div className="prose prose-sm max-w-none bg-white rounded-lg p-4 border" dangerouslySetInnerHTML={{ __html: lesson.content }} />
                                                        )}
                                                        {lesson.videoUrl && (
                                                            <div className="flex items-center gap-2 text-sm text-blue-600">
                                                                <Icons.Video className="w-4 h-4" />
                                                                <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">View Video</a>
                                                            </div>
                                                        )}
                                                        {(lesson.lessonResources || lesson.resources || []).length > 0 && (
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-700 mb-2">Resources:</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {(lesson.lessonResources || lesson.resources || []).map((resource, rIdx) => {
                                                                        const url = typeof resource === 'string' ? resource : resource.url;
                                                                        const name = typeof resource === 'string' ? `Resource ${rIdx + 1}` : (resource.name || resource.originalName || resource.url?.split('/').pop() || `Resource ${rIdx + 1}`);
                                                                        const ext = (name || url || '').split('.').pop()?.toLowerCase();
                                                                        const isPdf = ext === 'pdf';
                                                                        const href = isPdf ? url : url?.replace('/upload/', '/upload/fl_attachment/');
                                                                        return url ? (
                                                                            <a
                                                                                key={rIdx}
                                                                                href={href}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                {...(!isPdf && { download: name })}
                                                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 hover:bg-gray-50"
                                                                            >
                                                                                {isPdf ? <Icons.ExternalLink className="w-3 h-3" /> : <Icons.Download className="w-3 h-3" />}
                                                                                {name}
                                                                            </a>
                                                                        ) : null;
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {lesson.assessment?.questions?.length > 0 && (
                                                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                                                <p className="text-sm font-medium text-amber-900">
                                                                    Lesson Assessment: {lesson.assessment.questions.length} question(s)
                                                                    {lesson.assessment.passingScore && ` | Pass: ${lesson.assessment.passingScore}%`}
                                                                    {lesson.assessment.maxAttempts && ` | Max attempts: ${lesson.assessment.maxAttempts}`}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">No lessons added yet.</p>
                                )}
                            </div>

                            {/* Module Resources */}
                            {(module?.resources?.length > 0 || module?.moduleResources?.length > 0) && (() => {
                                const resources = module?.resources || module?.moduleResources || [];
                                return (
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Icons.FolderOpen className="w-5 h-5 text-emerald-600" /> Module Resources ({resources.length})
                                        </h3>
                                        <div className="space-y-2">
                                            {resources.map((res, idx) => {
                                                const url = typeof res === 'string' ? res : res.url;
                                                const name = typeof res === 'string'
                                                    ? (url?.split('/').pop() || `Resource ${idx + 1}`)
                                                    : (res.name || res.originalName || url?.split('/').pop() || `Resource ${idx + 1}`);
                                                const desc = typeof res === 'object' ? res.description : '';
                                                const fileType = typeof res === 'object' ? (res.fileType || '') : '';
                                                const ext = (fileType || url || '').split('.').pop()?.toLowerCase() || '';
                                                const isPdf = ext === 'pdf';
                                                return url ? (
                                                    <a
                                                        key={idx}
                                                        href={isPdf ? url : url.replace('/upload/', '/upload/fl_attachment/')}
                                                        {...(!isPdf && { download: name })}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-emerald-400/60 hover:bg-emerald-50 transition-all group"
                                                    >
                                                        <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                                            <Icons.FileText className="w-4 h-4 text-emerald-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-sm font-medium text-gray-800 group-hover:text-emerald-800 truncate block">{name}</span>
                                                            {desc && <span className="text-xs text-gray-500 truncate block">{desc}</span>}
                                                        </div>
                                                        {fileType && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded flex-shrink-0">{fileType}</span>}
                                                        {isPdf
                                                            ? <Icons.ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-emerald-700 flex-shrink-0" />
                                                            : <Icons.Download className="w-4 h-4 text-gray-400 group-hover:text-emerald-700 flex-shrink-0" />
                                                        }
                                                    </a>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Final Assessment */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        <Icons.ClipboardCheck className="w-5 h-5 text-emerald-600" /> Final Assessment
                                    </h3>
                                    <button
                                        onClick={openAssessmentEditor}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200"
                                    >
                                        <Icons.Edit2 className="w-3.5 h-3.5" />
                                        {module.finalAssessment ? 'Edit' : 'Add Assessment'}
                                    </button>
                                </div>

                                {module.assessmentReviewStatus === 'pending' && (
                                    <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
                                        <Icons.Clock className="w-4 h-4 flex-shrink-0" />
                                        Assessment update is pending admin review.
                                    </div>
                                )}
                                {module.assessmentReviewStatus === 'rejected' && module.assessmentRejectionReason && (
                                    <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-800">
                                        <Icons.XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <span><strong>Assessment rejected:</strong> {module.assessmentRejectionReason}</span>
                                    </div>
                                )}

                                {module.finalAssessment && module.finalAssessment.questions?.length > 0 ? (
                                    <>
                                        <div className="grid grid-cols-3 gap-4 mb-4">
                                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                                <p className="text-2xl font-bold text-gray-900">{module.finalAssessment.questions.length}</p>
                                                <p className="text-xs text-gray-500">Questions</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                                <p className="text-2xl font-bold text-gray-900">{module.finalAssessment.passingScore || 70}%</p>
                                                <p className="text-xs text-gray-500">Pass Score</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {module.finalAssessment.questions.reduce((s, q) => s + (q.points || 0), 0)}
                                                </p>
                                                <p className="text-xs text-gray-500">Total Points</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {module.finalAssessment.questions.map((q, idx) => (
                                                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                    <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                                        {idx + 1}
                                                    </span>
                                                    <div className="flex-1">
                                                        <p className="text-sm text-gray-900">{q.text}</p>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                            <span className="capitalize">{q.type?.replace('-', ' ')}</span>
                                                            <span>{q.points} pts</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                                        <Icons.ClipboardCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">No final assessment yet.</p>
                                        <p className="text-xs text-gray-400 mt-1">Click "Add Assessment" to create one.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Quick Info */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4">Module Info</h3>
                                <div className="space-y-3 text-sm">
                                    {module.createdAt && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500">Created</span>
                                            <span className="text-gray-900">{new Date(module.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    {module.updatedAt && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500">Updated</span>
                                            <span className="text-gray-900">{new Date(module.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    {module.submittedAt && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500">Submitted</span>
                                            <span className="text-gray-900">{new Date(module.submittedAt).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    {module.approvedAt && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500">Approved</span>
                                            <span className="text-gray-900">{new Date(module.approvedAt).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    {module.publishedAt && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500">Published</span>
                                            <span className="text-gray-900">{new Date(module.publishedAt).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Learning Outcomes */}
                            {normalizeResourceArray(module?.learningOutcomes).length > 0 && (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Icons.Target className="w-4 h-4 text-emerald-600" /> Learning Outcomes
                                    </h3>
                                    <ul className="space-y-2">
                                        {normalizeResourceArray(module?.learningOutcomes).map((outcome, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                                <Icons.Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                <span dangerouslySetInnerHTML={{ __html: outcome }} />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Objectives */}
                            {normalizeResourceArray(module?.moduleObjectives).length > 0 && (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Icons.ListChecks className="w-4 h-4 text-emerald-600" /> Objectives
                                    </h3>
                                    <ul className="space-y-2">
                                        {normalizeResourceArray(module?.moduleObjectives).map((obj, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                                <Icons.Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                {obj}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Target Audience */}
                            {normalizeResourceArray(module?.targetAudience).length > 0 && (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Icons.Users className="w-4 h-4 text-emerald-600" /> Target Audience
                                    </h3>
                                    <ul className="space-y-2">
                                        {normalizeResourceArray(module?.targetAudience).map((audience, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                                <Icons.User className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                                {audience}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Actions Card */}
                            {canEdit && (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Actions</h3>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => router.push(`/instructor/modules/${moduleId}/edit`)}
                                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm"
                                        >
                                            <Icons.Edit2 className="w-4 h-4" /> Edit Module
                                        </button>
                                        {canSubmit && (
                                            <button
                                                onClick={() => setShowSubmitConfirm(true)}
                                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                                            >
                                                <Icons.Send className="w-4 h-4" /> Submit for Approval
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Student Ratings */}
                            {module.status === 'published' && ratingSummary && ratingSummary.totalRatings > 0 && (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Icons.Star className="w-4 h-4 text-amber-500" /> Student Ratings
                                    </h3>

                                    {/* Average score + distribution */}
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="text-center flex-shrink-0">
                                            <p className="text-4xl font-bold text-gray-900 leading-none">
                                                {ratingSummary.avgRating.toFixed(1)}
                                            </p>
                                            <div className="flex justify-center mt-2">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Icons.Star
                                                        key={s}
                                                        className={`w-3.5 h-3.5 ${s <= Math.round(ratingSummary.avgRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {ratingSummary.totalRatings} rating{ratingSummary.totalRatings !== 1 ? 's' : ''}
                                            </p>
                                        </div>

                                        {/* Star distribution bars */}
                                        <div className="flex-1 space-y-1.5">
                                            {[5, 4, 3, 2, 1].map((star) => {
                                                const count = ratingSummary.distribution?.[star] || 0;
                                                const pct = ratingSummary.totalRatings > 0
                                                    ? (count / ratingSummary.totalRatings) * 100
                                                    : 0;
                                                return (
                                                    <div key={star} className="flex items-center gap-1.5">
                                                        <span className="text-xs text-gray-500 w-2 flex-shrink-0">{star}</span>
                                                        <Icons.Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                                                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                                            <div
                                                                className="bg-amber-400 h-1.5 rounded-full transition-all"
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-gray-400 w-3 text-right flex-shrink-0">{count}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Recent reviews */}
                                    {recentReviews.length > 0 && (
                                        <div className="border-t border-gray-100 pt-4 space-y-4">
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recent Reviews</p>
                                            {recentReviews.map((rev, idx) => (
                                                <div key={rev._id || idx}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                                {rev.studentId?.firstName?.[0] || '?'}
                                                            </div>
                                                            <span className="text-xs font-medium text-gray-700">
                                                                {rev.studentId
                                                                    ? `${rev.studentId.firstName} ${rev.studentId.lastName}`
                                                                    : 'Student'}
                                                            </span>
                                                        </div>
                                                        <div className="flex">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <Icons.Star
                                                                    key={s}
                                                                    className={`w-3 h-3 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {rev.review && (
                                                        <p className="text-xs text-gray-600 ml-8 leading-relaxed">{rev.review}</p>
                                                    )}
                                                    <p className="text-xs text-gray-400 ml-8 mt-0.5">
                                                        {new Date(rev.createdAt).toLocaleDateString()}
                                                    </p>
                                                    {idx < recentReviews.length - 1 && (
                                                        <div className="border-b border-gray-50 mt-3" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Final Assessment Editor Modal */}
            {showAssessmentEditor && assessmentDraft && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Icons.ClipboardCheck className="w-5 h-5 text-emerald-600" />
                                {module.finalAssessment ? 'Edit Final Assessment' : 'Add Final Assessment'}
                            </h3>
                            <button onClick={() => setShowAssessmentEditor(false)} className="text-gray-400 hover:text-gray-600">
                                <Icons.X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            {assessmentError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
                                    {assessmentError}
                                </div>
                            )}
                            {/* Title + Time Limit */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">Assessment Title <span className="text-red-500">*</span></label>
                                    <input
                                        value={assessmentDraft.title || ''}
                                        onChange={e => setAssessmentDraft(d => ({ ...d, title: e.target.value }))}
                                        placeholder="e.g. Module Final Assessment"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">Time Limit <span className="text-xs font-normal text-gray-400">(minutes, optional)</span></label>
                                    <input
                                        type="number"
                                        value={assessmentDraft.timeLimit || ''}
                                        onChange={e => setAssessmentDraft(d => ({ ...d, timeLimit: e.target.value ? Number(e.target.value) : null }))}
                                        placeholder="e.g. 120"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>
                            {/* Instructions */}
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-700">Instructions for Learners</label>
                                <textarea
                                    rows={2}
                                    value={assessmentDraft.instructions || ''}
                                    onChange={e => setAssessmentDraft(d => ({ ...d, instructions: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                                />
                            </div>
                            {/* Pass score + attempts */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">Passing Score (%)</label>
                                    <input
                                        type="number" min={0} max={100}
                                        value={assessmentDraft.passingScore ?? 70}
                                        onChange={e => setAssessmentDraft(d => ({ ...d, passingScore: Number(e.target.value) }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">Max Attempts</label>
                                    <input
                                        type="number" min={1}
                                        value={assessmentDraft.maxAttempts ?? 3}
                                        onChange={e => setAssessmentDraft(d => ({ ...d, maxAttempts: Number(e.target.value) }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>
                            {/* Questions */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-gray-700">Questions</p>
                                    <button
                                        onClick={() => setAssessmentDraft(d => ({ ...d, questions: [...(d.questions || []), { text: '', type: 'multiple-choice', points: 1, options: ['', '', '', ''], correctAnswer: '', explanation: '' }] }))}
                                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 border border-purple-200"
                                    >
                                        <Icons.Plus className="w-3 h-3" /> Add Question
                                    </button>
                                </div>
                                {(assessmentDraft.questions || []).length === 0 && (
                                    <p className="text-sm text-gray-400 italic text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">No questions yet.</p>
                                )}
                                {(assessmentDraft.questions || []).map((q, qi) => (
                                    <div key={qi} className="border border-purple-100 rounded-xl p-4 space-y-3 bg-purple-50/20">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">Q{qi + 1}</span>
                                            <button onClick={() => setAssessmentDraft(d => ({ ...d, questions: d.questions.filter((_, i) => i !== qi) }))} className="text-gray-400 hover:text-red-500">
                                                <Icons.Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <textarea
                                            rows={2}
                                            value={q.text}
                                            onChange={e => setAssessmentDraft(d => { const qs = [...d.questions]; qs[qi] = { ...qs[qi], text: e.target.value }; return { ...d, questions: qs }; })}
                                            placeholder="Question text..."
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 outline-none resize-none"
                                        />
                                        <div className="flex gap-3">
                                            <select
                                                value={q.type}
                                                onChange={e => setAssessmentDraft(d => { const qs = [...d.questions]; qs[qi] = { ...qs[qi], type: e.target.value }; return { ...d, questions: qs }; })}
                                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                                            >
                                                <option value="multiple-choice">Multiple Choice</option>
                                                <option value="essay">Essay</option>
                                                <option value="true-false">True / False</option>
                                                <option value="short-answer">Short Answer</option>
                                            </select>
                                            <input
                                                type="number" min={1}
                                                value={q.points}
                                                onChange={e => setAssessmentDraft(d => { const qs = [...d.questions]; qs[qi] = { ...qs[qi], points: Number(e.target.value) }; return { ...d, questions: qs }; })}
                                                placeholder="Pts"
                                                className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                                            />
                                        </div>
                                        {q.type === 'multiple-choice' && (
                                            <div className="space-y-1.5">
                                                <p className="text-xs text-gray-500">Options</p>
                                                {(q.options || ['', '', '', '']).map((opt, oi) => (
                                                    <div key={oi} className="flex gap-2 items-center">
                                                        <span className="text-xs text-gray-400 w-5">{String.fromCharCode(65 + oi)}.</span>
                                                        <input
                                                            value={opt}
                                                            onChange={e => setAssessmentDraft(d => { const qs = [...d.questions]; const opts = [...(qs[qi].options || [])]; opts[oi] = e.target.value; qs[qi] = { ...qs[qi], options: opts }; return { ...d, questions: qs }; })}
                                                            placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                                            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {q.type !== 'essay' && q.type !== 'short-answer' && (
                                            <div className="space-y-1">
                                                <p className="text-xs text-gray-500">Correct Answer</p>
                                                {q.type === 'true-false' ? (
                                                    <select
                                                        value={q.correctAnswer || ''}
                                                        onChange={e => setAssessmentDraft(d => { const qs = [...d.questions]; qs[qi] = { ...qs[qi], correctAnswer: e.target.value }; return { ...d, questions: qs }; })}
                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                                                    >
                                                        <option value="">Select</option>
                                                        <option value="True">True</option>
                                                        <option value="False">False</option>
                                                    </select>
                                                ) : (
                                                    <input
                                                        value={q.correctAnswer || ''}
                                                        onChange={e => setAssessmentDraft(d => { const qs = [...d.questions]; qs[qi] = { ...qs[qi], correctAnswer: e.target.value }; return { ...d, questions: qs }; })}
                                                        placeholder="Correct answer"
                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                                                    />
                                                )}
                                            </div>
                                        )}
                                        {q.type === 'essay' && (
                                            <div className="space-y-1">
                                                <p className="text-xs text-gray-500">Grading Rubric <span className="text-gray-400">(optional)</span></p>
                                                <textarea
                                                    rows={2}
                                                    value={q.rubric || ''}
                                                    onChange={e => setAssessmentDraft(d => { const qs = [...d.questions]; qs[qi] = { ...qs[qi], rubric: e.target.value }; return { ...d, questions: qs }; })}
                                                    placeholder="Describe what a good answer should include..."
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 outline-none resize-none"
                                                />
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            <p className="text-xs text-gray-400">Explanation (optional — shown after submission)</p>
                                            <input
                                                value={q.explanation || ''}
                                                onChange={e => setAssessmentDraft(d => { const qs = [...d.questions]; qs[qi] = { ...qs[qi], explanation: e.target.value }; return { ...d, questions: qs }; })}
                                                placeholder="Shown to learner after submission"
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-200">
                            <button onClick={() => setShowAssessmentEditor(false)} className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 text-sm">
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveAssessment}
                                disabled={savingAssessment}
                                className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 text-sm disabled:opacity-50"
                            >
                                {savingAssessment ? 'Saving...' : 'Save Assessment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Submit Confirmation Modal */}
            {showSubmitConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                <Icons.Send className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Submit for Approval</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                            Are you sure you want to submit this module for admin review?
                        </p>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
                            <p className="text-xs text-amber-800">
                                Once submitted, you won't be able to edit the module until the admin completes the review.
                                Make sure all content, lessons, and assessments are complete.
                            </p>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowSubmitConfirm(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitForApproval}
                                disabled={submitting}
                                className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors text-sm disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : 'Yes, Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
