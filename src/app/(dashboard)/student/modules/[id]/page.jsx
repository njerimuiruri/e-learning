'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import * as Icons from 'lucide-react';
import moduleService from '@/lib/api/moduleService';
import moduleEnrollmentService from '@/lib/api/moduleEnrollmentService';
import moduleRatingService from '@/lib/api/moduleRatingService';
import Navbar from '@/components/navbar/navbar';
import ProtectedStudentRoute from '@/components/ProtectedStudentRoute';
import LessonViewer from '@/components/student/LessonViewer';

function ModuleLearningContent() {
    const { id: moduleId } = useParams();
    const router = useRouter();
    const openFinalAssessmentOnLoad = useSearchParams().get('showFinalAssessment') === 'true';

    const [moduleData, setModuleData] = useState(null);
    const [enrollment, setEnrollment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Navigation state
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
    const [showFinalAssessment, setShowFinalAssessment] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Action states
    const [completing, setCompleting] = useState(false);
    const [submittingAssessment, setSubmittingAssessment] = useState(false);

    // Lesson assessment answers
    const [lessonAnswers, setLessonAnswers] = useState({});
    const [lessonAssessmentResult, setLessonAssessmentResult] = useState(null);
    const [showLessonAssessment, setShowLessonAssessment] = useState(false);

    // Final assessment
    const [finalAnswers, setFinalAnswers] = useState({});
    const [finalAssessmentResult, setFinalAssessmentResult] = useState(null);


    useEffect(() => {
        if (moduleId) fetchModuleData();
    }, [moduleId, openFinalAssessmentOnLoad]);

    const fetchModuleData = async () => {
        try {
            setLoading(true);
            setError('');

            const [mod, enrollmentData] = await Promise.all([
                moduleService.getModuleById(moduleId),
                moduleEnrollmentService.getMyEnrollmentForModule(moduleId).catch(() => null),
            ]);

            setModuleData(mod);
            setEnrollment(enrollmentData);

            // Resume from last accessed lesson
            if (enrollmentData?.lastAccessedLesson != null) {
                setCurrentLessonIndex(enrollmentData.lastAccessedLesson);
            }

            // Auto-open final assessment if navigated from dashboard with ?showFinalAssessment=true
            const allLessonsDone = enrollmentData?.completedLessons >= enrollmentData?.totalLessons && enrollmentData?.totalLessons > 0;
            if (openFinalAssessmentOnLoad && allLessonsDone && !enrollmentData?.requiresModuleRepeat) {
                setShowFinalAssessment(true);
            }
        } catch (err) {
            setError('Failed to load module');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const currentLesson = moduleData?.lessons?.[currentLessonIndex];
    const lessons = moduleData?.lessons || [];
    const totalLessons = lessons.length;

    const getLessonProgress = useCallback((index) => {
        if (!enrollment?.lessonProgress) return null;
        return enrollment.lessonProgress.find(lp => lp.lessonIndex === index);
    }, [enrollment]);

    const isLessonCompleted = useCallback((index) => {
        return getLessonProgress(index)?.isCompleted || false;
    }, [getLessonProgress]);

    const isLessonAccessible = useCallback((index) => {
        if (index === 0) return true;
        // Can access if previous lesson is completed
        return isLessonCompleted(index - 1);
    }, [isLessonCompleted]);

    // Derive lesson completion count from the lessonProgress array (source of truth).
    // This prevents stale completedLessons counter from causing >100% progress display.
    const completedCount = enrollment?.lessonProgress?.filter(lp => lp.isCompleted).length ?? 0;
    const allLessonsCompleted =
        totalLessons > 0 &&
        completedCount >= totalLessons &&
        !enrollment?.requiresModuleRepeat;
    const safeProgress = Math.min(100, enrollment?.progress || 0);

    const handleCompleteLesson = async () => {
        if (!enrollment) return;
        try {
            setCompleting(true);
            const result = await moduleEnrollmentService.completeLesson(enrollment._id, currentLessonIndex);
            // Backend returns { enrollment, navigateTo, nextLessonIndex } — extract the enrollment
            const updatedEnrollment = result.enrollment ?? result;
            setEnrollment(updatedEnrollment);

            // Check if lesson has assessment
            const lesson = lessons[currentLessonIndex];
            if (lesson?.assessment?.questions?.length > 0) {
                const lessonProg = updatedEnrollment.lessonProgress?.find(lp => lp.lessonIndex === currentLessonIndex);
                if (!lessonProg?.assessmentPassed) {
                    setShowLessonAssessment(true);
                    return;
                }
            }

            // Use navigation hint from backend, or fall back to index-based advance
            const { navigateTo, nextLessonIndex } = result;
            if (navigateTo === 'final_assessment') {
                setShowFinalAssessment(true);
            } else if (navigateTo === 'next_lesson' && nextLessonIndex != null) {
                setCurrentLessonIndex(nextLessonIndex);
            } else if (currentLessonIndex < totalLessons - 1) {
                setCurrentLessonIndex(currentLessonIndex + 1);
            }
        } catch (err) {
            console.error('Failed to complete lesson:', err);
            alert(err.response?.data?.message || 'Failed to mark lesson complete');
        } finally {
            setCompleting(false);
        }
    };

    const handleSubmitLessonAssessment = async () => {
        if (!enrollment) return;
        try {
            setSubmittingAssessment(true);
            const answers = Object.entries(lessonAnswers).map(([idx, val]) => ({
                questionIndex: parseInt(idx),
                answer: String(val),
            }));
            const result = await moduleEnrollmentService.submitLessonAssessment(
                enrollment._id,
                currentLessonIndex,
                answers
            );

            // Update enrollment state directly from result — no extra round-trip
            setEnrollment(result.enrollment ?? result);

            if (result.passed) {
                // ── PASS: auto-navigate, clear panel ─────────────────────────
                setShowLessonAssessment(false);
                setLessonAssessmentResult(null);
                setLessonAnswers({});

                if (result.navigateTo === 'final_assessment') {
                    setShowFinalAssessment(true);
                } else if (result.navigateTo === 'next_lesson' && result.nextLessonIndex != null) {
                    setCurrentLessonIndex(result.nextLessonIndex);
                }
            } else {
                // ── FAIL: keep panel open to show result
                // On lessonResetRequired: panel shows the "redo lesson" message with a Back button.
                // On normal fail: panel shows retry form with remaining attempts.
                setLessonAssessmentResult(result);
                setLessonAnswers({}); // Clear for fresh retry
            }
        } catch (err) {
            console.error('Failed to submit lesson assessment:', err);
            alert(err.response?.data?.message || 'Failed to submit assessment');
        } finally {
            setSubmittingAssessment(false);
        }
    };

    const handleSubmitFinalAssessment = async () => {
        if (!enrollment) return;
        try {
            setSubmittingAssessment(true);
            const answers = Object.entries(finalAnswers).map(([idx, val]) => ({
                questionIndex: parseInt(idx),
                answer: String(val),
            }));
            const result = await moduleEnrollmentService.submitFinalAssessment(enrollment._id, answers);
            setFinalAssessmentResult(result);
            // Use enrollment from result directly — avoids a stale round-trip
            // (requiresModuleRepeat / reset state is guaranteed fresh here)
            setEnrollment(result.enrollment ?? result);
        } catch (err) {
            console.error('Failed to submit final assessment:', err);
            alert(err.response?.data?.message || 'Failed to submit assessment');
        } finally {
            setSubmittingAssessment(false);
        }
    };

    const navigateToLesson = (index) => {
        if (!isLessonAccessible(index) && !isLessonCompleted(index)) return;
        setCurrentLessonIndex(index);
        setShowFinalAssessment(false);
        setShowLessonAssessment(false);
        setLessonAssessmentResult(null);
        setLessonAnswers({});
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-t-4 border-[#021d49] mx-auto mb-4"></div>
                    <p className="text-gray-700 font-semibold">Loading module...</p>
                </div>
            </div>
        );
    }

    if (error || !moduleData) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <Icons.AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{error || 'Module not found'}</h2>
                        <button
                            onClick={() => router.push('/student/modules')}
                            className="mt-4 px-6 py-3 bg-[#021d49] text-white rounded-xl font-bold"
                        >
                            Browse Modules
                        </button>
                    </div>
                </div>
            </>
        );
    }

    // Not enrolled — redirect to the module detail/payment gate page
    if (!enrollment) {
        router.replace(`/modules/${moduleId}`);
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Icons.Loader2 className="w-10 h-10 animate-spin text-[#021d49]" />
            </div>
        );
    }

    // Enrolled - Learning View
    return (
        <>
            <Navbar />
            {/* Full-height flex layout */}
            <div className="flex h-full overflow-hidden bg-gray-100">

                {/* ── PERSISTENT SIDEBAR ──────────────────────────────────────── */}
                {/* Desktop: always visible. Mobile: slide-in overlay */}
                <aside className={`
                    flex-shrink-0 w-72 bg-white border-r border-gray-200 flex flex-col
                    transition-transform duration-300 z-30
                    fixed top-20 left-0 h-[calc(100vh-80px)]
                    lg:relative lg:top-0 lg:h-full lg:translate-x-0
                    ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
                `}>
                    {/* Sidebar top: module title + progress */}
                    <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-gray-100">
                        <div className="flex items-start justify-between gap-2 mb-3">
                            <button
                                onClick={() => router.push('/student')}
                                className="text-gray-400 hover:text-[#021d49] transition-colors flex-shrink-0 mt-0.5"
                                title="Back to dashboard"
                            >
                                <Icons.ArrowLeft className="w-4 h-4" />
                            </button>
                            <p className="text-xs font-bold text-gray-900 leading-snug flex-1 break-words">{moduleData.title}</p>
                            {/* Close button — mobile only */}
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="lg:hidden text-gray-400 hover:text-gray-600 flex-shrink-0"
                            >
                                <Icons.X className="w-4 h-4" />
                            </button>
                        </div>
                        {/* Progress bar */}
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-[#021d49] to-blue-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${safeProgress}%` }}
                                />
                            </div>
                            <span className="text-xs font-bold text-[#021d49] flex-shrink-0 whitespace-nowrap">
                                {completedCount}/{totalLessons}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{safeProgress}% complete</p>
                    </div>

                    {/* Lesson list — scrollable */}
                    <div className="flex-1 overflow-y-auto py-2 px-2">
                        <LessonSidebarList
                            lessons={lessons}
                            currentLessonIndex={currentLessonIndex}
                            showFinalAssessment={showFinalAssessment}
                            isLessonCompleted={isLessonCompleted}
                            isLessonAccessible={isLessonAccessible}
                            getLessonProgress={getLessonProgress}
                            navigateToLesson={navigateToLesson}
                            allLessonsCompleted={allLessonsCompleted}
                            enrollment={enrollment}
                            setShowFinalAssessment={setShowFinalAssessment}
                            setShowLessonAssessment={setShowLessonAssessment}
                        />
                    </div>

                    {/* Discussion Forum link */}
                    <div className="flex-shrink-0 p-3 border-t border-gray-100">
                        <button
                            onClick={() => router.push(`/student/modules/${moduleId}/discussions`)}
                            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition-all"
                        >
                            <Icons.MessageCircle className="w-4 h-4" />
                            Discussion Forum
                        </button>
                    </div>
                </aside>

                {/* Mobile overlay backdrop */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/40 z-20 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
                <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                    {/* Thin top bar: module name + sidebar toggle for mobile */}
                    <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3">
                        {/* Sidebar toggle — visible on mobile, hidden on desktop */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:text-[#021d49] hover:bg-blue-50 transition-colors flex-shrink-0"
                            title="Toggle lesson list"
                        >
                            <Icons.PanelLeft className="w-5 h-5" />
                        </button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-sm font-semibold text-gray-700 truncate hidden lg:block">{moduleData.title}</h1>
                            <h1 className="text-sm font-semibold text-gray-700 truncate lg:hidden">
                                {showFinalAssessment ? 'Final Assessment' : `Lesson ${currentLessonIndex + 1} of ${totalLessons}`}
                            </h1>
                        </div>
                        {/* Progress — desktop only (sidebar already shows it) */}
                        <div className="hidden lg:flex items-center gap-2">
                            <div className="w-28 bg-gray-200 rounded-full h-1.5">
                                <div
                                    className="bg-gradient-to-r from-[#021d49] to-blue-500 h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: `${safeProgress}%` }}
                                />
                            </div>
                            <span className="text-xs font-bold text-[#021d49]">{safeProgress}%</span>
                        </div>
                    </div>

                    {/* Scrollable content area */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden">
                        <div className="max-w-4xl mx-auto px-4 py-5 sm:px-6 sm:py-6">
                            {/* Final Assessment View */}
                            {showFinalAssessment && (
                                <FinalAssessmentPanel
                                    module={moduleData}
                                    enrollment={enrollment}
                                    finalAnswers={finalAnswers}
                                    setFinalAnswers={setFinalAnswers}
                                    finalAssessmentResult={finalAssessmentResult}
                                    submitting={submittingAssessment}
                                    onSubmit={handleSubmitFinalAssessment}
                                    onGoToLessons={() => {
                                        setShowFinalAssessment(false);
                                        setCurrentLessonIndex(0);
                                        setFinalAnswers({});
                                        setFinalAssessmentResult(null);
                                    }}
                                    router={router}
                                />
                            )}

                            {/* Lesson Content View */}
                            {!showFinalAssessment && currentLesson && (
                                <>
                                    {/* Lesson indicator */}
                                    <div className="mb-3 flex items-center gap-2">
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            Lesson {currentLessonIndex + 1} of {totalLessons}
                                        </span>
                                        {isLessonCompleted(currentLessonIndex) && (
                                            <span className="flex items-center gap-1 text-xs text-green-700 font-semibold bg-green-100 px-2.5 py-0.5 rounded-full">
                                                <Icons.CheckCircle className="w-3 h-3" />
                                                Completed
                                            </span>
                                        )}
                                    </div>

                                    {/* Lesson Assessment Results/Form */}
                                    {showLessonAssessment && currentLesson.assessment && (
                                        <LessonAssessmentPanel
                                            assessment={currentLesson.assessment}
                                            lessonAnswers={lessonAnswers}
                                            setLessonAnswers={setLessonAnswers}
                                            result={lessonAssessmentResult}
                                            lessonProgress={getLessonProgress(currentLessonIndex)}
                                            submitting={submittingAssessment}
                                            onSubmit={handleSubmitLessonAssessment}
                                            onBackToLesson={() => {
                                                setShowLessonAssessment(false);
                                                setLessonAssessmentResult(null);
                                                setLessonAnswers({});
                                            }}
                                        />
                                    )}

                                    {/* ── Slide-based Lesson Viewer ─────────────────────── */}
                                    {!showLessonAssessment && currentLesson.slides?.length > 0 && (
                                        <div className="mb-6">
                                            <LessonViewer
                                                lesson={currentLesson}
                                                lessonIndex={currentLessonIndex}
                                                totalLessons={totalLessons}
                                                enrollment={enrollment}
                                                isAlreadyCompleted={isLessonCompleted(currentLessonIndex)}
                                                onLessonComplete={async () => {
                                                    const result = await moduleEnrollmentService.completeLesson(enrollment._id, currentLessonIndex);
                                                    const updatedEnrollment = result.enrollment ?? result;
                                                    setEnrollment(updatedEnrollment);
                                                    // Auto-advance to next lesson
                                                    if (result.navigateTo === 'next_lesson' && result.nextLessonIndex != null) {
                                                        setCurrentLessonIndex(result.nextLessonIndex);
                                                    } else if (result.navigateTo === 'final_assessment') {
                                                        setShowFinalAssessment(true);
                                                    }
                                                }}
                                                onAssessmentComplete={(res) => {
                                                    setEnrollment(res.enrollment ?? res);
                                                    if (res.passed) {
                                                        if (res.navigateTo === 'next_lesson' && res.nextLessonIndex != null) {
                                                            setCurrentLessonIndex(res.nextLessonIndex);
                                                        } else if (res.navigateTo === 'final_assessment') {
                                                            setShowFinalAssessment(true);
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}

                                    {/* Lesson Content */}
                                    {!showLessonAssessment && (!currentLesson.slides || currentLesson.slides.length === 0) && (
                                        <>
                                            {/* Video */}
                                            {currentLesson.videoUrl && (
                                                <div className="bg-black rounded-2xl overflow-hidden mb-6 aspect-video">
                                                    <video
                                                        src={currentLesson.videoUrl}
                                                        controls
                                                        className="w-full h-full"
                                                    />
                                                </div>
                                            )}

                                            {/* Text Content */}
                                            {currentLesson.content && (
                                                <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-6 overflow-x-auto shadow-sm">
                                                    <div className="prose prose-gray max-w-none break-words text-justify
                                                        prose-p:text-gray-700 prose-p:leading-relaxed prose-p:text-justify
                                                        prose-headings:text-gray-900 prose-headings:font-bold prose-headings:text-left
                                                        prose-li:text-gray-700 prose-strong:text-gray-900
                                                        prose-a:text-blue-600"
                                                        dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                                                    />
                                                </div>
                                            )}

                                            {/* Resources */}
                                            {currentLesson.resources?.length > 0 && (
                                                <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 mb-6">
                                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                        <Icons.Paperclip className="w-5 h-5 text-[#021d49]" />
                                                        Lesson Resources
                                                        <span className="ml-auto text-xs font-normal text-gray-400">
                                                            {currentLesson.resources.length} file{currentLesson.resources.length !== 1 ? 's' : ''}
                                                        </span>
                                                    </h3>
                                                    <div className="space-y-2">
                                                        {currentLesson.resources.map((res, idx) => {
                                                            const url = typeof res === 'string' ? res : res.url;
                                                            const name = typeof res === 'string'
                                                                ? (url.split('/').pop() || `Resource ${idx + 1}`)
                                                                : (res.name || url.split('/').pop() || `Resource ${idx + 1}`);
                                                            const ext = (typeof res === 'string' ? res : (res.fileType || res.url))
                                                                ?.split('.').pop()?.toLowerCase() || '';

                                                            // Color by file type
                                                            const iconColor =
                                                                ext === 'pdf' ? 'text-red-600 bg-red-50' :
                                                                ext === 'pptx' || ext === 'ppt' ? 'text-orange-600 bg-orange-50' :
                                                                ext === 'xlsx' || ext === 'xls' ? 'text-green-600 bg-green-50' :
                                                                ext === 'docx' || ext === 'doc' ? 'text-blue-600 bg-blue-50' :
                                                                ext === 'zip' ? 'text-purple-600 bg-purple-50' :
                                                                'text-gray-600 bg-gray-100';

                                                            return (
                                                                <a
                                                                    key={idx}
                                                                    href={url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-[#021d49]/40 hover:bg-blue-50 transition-all group"
                                                                >
                                                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                                                                        <Icons.FileText className="w-4 h-4" />
                                                                    </div>
                                                                    <span className="flex-1 text-sm font-medium text-gray-800 group-hover:text-[#021d49] truncate">
                                                                        {name}
                                                                    </span>
                                                                    <Icons.Download className="w-4 h-4 text-gray-400 group-hover:text-[#021d49] flex-shrink-0" />
                                                                </a>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Tasks */}
                                            {currentLesson.tasks?.length > 0 && (
                                                <div className="bg-white rounded-2xl border-2 border-blue-100 p-6 mb-6">
                                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                        <Icons.CheckSquare className="w-5 h-5 text-blue-600" />
                                                        Tasks
                                                    </h3>
                                                    <ul className="space-y-2">
                                                        {currentLesson.tasks.map((task, ti) => (
                                                            <li key={ti} className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl text-sm text-gray-800">
                                                                <Icons.CheckSquare className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                                                <span>{typeof task === 'string' ? task : task.text || task.value}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Deliverables */}
                                            {currentLesson.deliverables?.length > 0 && (
                                                <div className="bg-white rounded-2xl border-2 border-purple-100 p-6 mb-6">
                                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                        <Icons.Package className="w-5 h-5 text-purple-600" />
                                                        Deliverables
                                                    </h3>
                                                    <ul className="space-y-2">
                                                        {currentLesson.deliverables.map((item, i) => (
                                                            <li key={i} className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl text-sm text-gray-800">
                                                                <Icons.Package className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                                                                <span>{typeof item === 'string' ? item : item.text || item.value}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Evaluation Criteria */}
                                            {currentLesson.evaluationCriteria?.length > 0 && (
                                                <div className="bg-white rounded-2xl border-2 border-amber-100 p-6 mb-6">
                                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                        <Icons.Star className="w-5 h-5 text-amber-600" />
                                                        Evaluation Criteria
                                                    </h3>
                                                    <ul className="space-y-2">
                                                        {currentLesson.evaluationCriteria.map((item, i) => (
                                                            <li key={i} className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl text-sm text-gray-800">
                                                                <Icons.Star className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                                                <span>{typeof item === 'string' ? item : item.text || item.value}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="flex items-center justify-between gap-4 mt-8">
                                                <button
                                                    onClick={() => navigateToLesson(currentLessonIndex - 1)}
                                                    disabled={currentLessonIndex === 0}
                                                    className="flex items-center gap-2 px-6 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:border-[#021d49] hover:text-[#021d49] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    <Icons.ChevronLeft className="w-4 h-4" />
                                                    Previous
                                                </button>

                                                <div className="flex items-center gap-3">
                                                    {!isLessonCompleted(currentLessonIndex) && (
                                                        <button
                                                            onClick={handleCompleteLesson}
                                                            disabled={completing}
                                                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-green-700 transition-all shadow-md disabled:opacity-50"
                                                        >
                                                            {completing ? (
                                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                                            ) : (
                                                                <Icons.CheckCircle className="w-4 h-4" />
                                                            )}
                                                            Mark Complete
                                                        </button>
                                                    )}

                                                    {currentLessonIndex < totalLessons - 1 ? (
                                                        <button
                                                            onClick={() => navigateToLesson(currentLessonIndex + 1)}
                                                            disabled={!isLessonAccessible(currentLessonIndex + 1) && !isLessonCompleted(currentLessonIndex + 1)}
                                                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#021d49] to-blue-700 text-white rounded-xl font-bold hover:from-[#032e6b] hover:to-blue-800 transition-all shadow-md disabled:opacity-30 disabled:cursor-not-allowed"
                                                        >
                                                            Next
                                                            <Icons.ChevronRight className="w-4 h-4" />
                                                        </button>
                                                    ) : allLessonsCompleted ? (
                                                        <button
                                                            onClick={() => { setShowFinalAssessment(true); setShowLessonAssessment(false); }}
                                                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
                                                        >
                                                            <Icons.Target className="w-4 h-4" />
                                                            Final Assessment
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// ── Lesson Sidebar List ──────────────────────────────────────────────────────
function LessonSidebarList({
    lessons, currentLessonIndex, showFinalAssessment,
    isLessonCompleted, isLessonAccessible, getLessonProgress,
    navigateToLesson, allLessonsCompleted, enrollment,
    setShowFinalAssessment, setShowLessonAssessment,
}) {
    return (
        <div className="space-y-1">
            {lessons.map((lesson, idx) => {
                const completed = isLessonCompleted(idx);
                const accessible = isLessonAccessible(idx) || completed;
                const isCurrent = idx === currentLessonIndex && !showFinalAssessment;
                const isLocked = !accessible;
                const lessonProg = getLessonProgress(idx);
                const hasQuiz = lesson.assessmentQuiz?.length > 0 || lesson.assessment?.questions?.length > 0;

                return (
                    <button
                        key={idx}
                        onClick={() => accessible && navigateToLesson(idx)}
                        disabled={isLocked}
                        title={isLocked ? 'Complete the previous lesson first' : ''}
                        className={`w-full text-left rounded-xl transition-all flex items-start gap-3 px-3 py-3 group
                            ${isCurrent
                                ? 'bg-[#021d49] shadow-md'
                                : completed
                                ? 'bg-green-50 hover:bg-green-100 border border-green-200'
                                : accessible
                                ? 'hover:bg-gray-100 border border-transparent'
                                : 'opacity-40 cursor-not-allowed border border-transparent'}
                        `}
                    >
                        {/* Status icon */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5
                            ${isCurrent ? 'bg-white text-[#021d49]'
                              : completed ? 'bg-green-500 text-white'
                              : isLocked ? 'bg-gray-200 text-gray-400'
                              : 'bg-gray-200 text-gray-600'}
                        `}>
                            {completed
                                ? <Icons.CheckCircle className="w-4 h-4" />
                                : isLocked
                                ? <Icons.Lock className="w-3 h-3" />
                                : <span>{idx + 1}</span>
                            }
                        </div>

                        {/* Lesson info */}
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold leading-snug break-words
                                ${isCurrent ? 'text-white'
                                  : completed ? 'text-green-900'
                                  : isLocked ? 'text-gray-400'
                                  : 'text-gray-800'}
                            `}>
                                {lesson.title || `Lesson ${idx + 1}`}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {completed && !isCurrent && (
                                    <span className="text-xs font-semibold text-green-600 flex items-center gap-0.5">
                                        <Icons.Check className="w-3 h-3" /> Done
                                    </span>
                                )}
                                {hasQuiz && (
                                    <span className={`text-xs flex items-center gap-0.5
                                        ${isCurrent ? 'text-blue-200'
                                          : lessonProg?.assessmentPassed ? 'text-green-600'
                                          : 'text-indigo-500'}
                                    `}>
                                        <Icons.FileQuestion className="w-3 h-3" />
                                        {lessonProg?.assessmentPassed ? 'Quiz passed' : 'Has quiz'}
                                    </span>
                                )}
                                {isLocked && (
                                    <span className="text-xs text-gray-400">Complete previous first</span>
                                )}
                            </div>
                        </div>
                    </button>
                );
            })}

            {/* Final Assessment */}
            <div className="pt-2 mt-2 border-t border-gray-100">
                <button
                    onClick={() => { setShowFinalAssessment(true); setShowLessonAssessment(false); }}
                    disabled={!allLessonsCompleted}
                    title={!allLessonsCompleted ? 'Complete all lessons first' : ''}
                    className={`w-full text-left rounded-xl transition-all flex items-start gap-3 px-3 py-3
                        ${showFinalAssessment
                            ? 'bg-indigo-600 shadow-md'
                            : allLessonsCompleted
                                ? enrollment.finalAssessmentPassed
                                    ? 'bg-green-50 hover:bg-green-100 border border-green-200'
                                    : 'bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
                                : 'opacity-40 cursor-not-allowed border border-transparent'}
                    `}
                >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                        ${showFinalAssessment ? 'bg-white text-indigo-600'
                          : enrollment.finalAssessmentPassed ? 'bg-green-500 text-white'
                          : allLessonsCompleted ? 'bg-indigo-200 text-indigo-700'
                          : 'bg-gray-200 text-gray-400'}
                    `}>
                        {enrollment.finalAssessmentPassed
                            ? <Icons.CheckCircle className="w-4 h-4" />
                            : allLessonsCompleted
                            ? <Icons.Target className="w-3.5 h-3.5" />
                            : <Icons.Lock className="w-3 h-3" />
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${showFinalAssessment ? 'text-white' : allLessonsCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                            Final Assessment
                        </p>
                        <p className={`text-xs mt-0.5 ${showFinalAssessment ? 'text-indigo-200' : 'text-gray-400'}`}>
                            {enrollment.finalAssessmentPassed
                                ? `Passed · ${enrollment.finalAssessmentScore?.toFixed(1)}%`
                                : !allLessonsCompleted
                                    ? 'Complete all lessons first'
                                    : `${enrollment.finalAssessmentAttempts || 0}/3 attempts`}
                        </p>
                    </div>
                </button>
            </div>
        </div>
    );
}

// Lesson Assessment Component
function LessonAssessmentPanel({ assessment, lessonAnswers, setLessonAnswers, result, lessonProgress, submitting, onSubmit, onBackToLesson }) {
    if (!assessment) return null;

    const maxAttempts = assessment.maxAttempts || 3;

    const hasResult = result != null;
    const passed = result?.passed;
    const lessonResetRequired = result?.lessonResetRequired;

    // Use backend-returned remainingAttempts (authoritative after increment/reset)
    const remainingFromResult = result?.remainingAttempts;
    const displayRemaining = remainingFromResult !== undefined
        ? remainingFromResult
        : Math.max(0, maxAttempts - (lessonProgress?.assessmentAttempts || 0));

    // Attempt number just submitted:
    // - All exhausted → lessonResetRequired=true, backend resets counter → use maxAttempts
    // - Otherwise: maxAttempts − remainingFromResult (backend computed after increment)
    const attemptJustMade = hasResult && !passed
        ? (lessonResetRequired ? maxAttempts : (remainingFromResult !== undefined ? maxAttempts - remainingFromResult : null))
        : null;

    // Header attempts-used counter: derive from backend result when available
    // (lessonProgress.assessmentAttempts can lag due to Mongoose serialization)
    const attemptsUsed = lessonResetRequired
        ? maxAttempts  // all were used (backend reset to 0, but display what was used)
        : (hasResult && !passed && remainingFromResult !== undefined)
            ? maxAttempts - remainingFromResult
            : (lessonProgress?.assessmentAttempts || 0);

    // Auto-redirect countdown when lesson must be re-done
    const [countdown, setCountdown] = React.useState(5);
    React.useEffect(() => {
        if (!lessonResetRequired) return;
        setCountdown(5);
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) { clearInterval(interval); onBackToLesson(); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [lessonResetRequired]); // eslint-disable-line react-hooks/exhaustive-deps

    const allAnswered = Object.keys(lessonAnswers).length >= (assessment.questions?.length || 0);

    return (
        <div className="bg-white rounded-2xl border-2 border-indigo-200 p-6 sm:p-8 mb-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-100 p-3 rounded-xl">
                    <Icons.FileQuestion className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{assessment.title || 'Lesson Assessment'}</h3>
                    <div className="flex items-center gap-3 mt-0.5 text-sm text-gray-600">
                        <span>Pass score: {assessment.passingScore || 70}%</span>
                        {maxAttempts > 0 && (
                            <span className={`font-medium ${attemptsUsed >= maxAttempts ? 'text-red-600' : 'text-indigo-600'}`}>
                                {attemptsUsed}/{maxAttempts} attempts used
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Case 1: max attempts exhausted → lesson reset required ──── */}
            {lessonResetRequired && (
                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5 mb-6">
                    <div className="flex items-start gap-3 mb-3">
                        <div className="bg-red-100 p-2 rounded-lg flex-shrink-0">
                            <Icons.XCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-red-800 text-lg">
                                Attempt {attemptJustMade} of {maxAttempts} Failed
                            </p>
                            <p className="text-sm text-red-700 mt-0.5">Score: {result.score?.toFixed(1)}%</p>
                        </div>
                    </div>
                    <div className="bg-red-100 rounded-lg p-4 mb-4">
                        <p className="font-semibold text-red-900 mb-1">All {maxAttempts} attempts have been used.</p>
                        <p className="text-sm text-red-800">
                            You must re-complete the lesson content before you can attempt this assessment again. Your lesson progress has been reset.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-red-700 font-medium mb-3">
                        <Icons.Clock className="w-4 h-4" />
                        Returning to lesson in {countdown}s...
                    </div>
                    <button
                        onClick={onBackToLesson}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all"
                    >
                        <Icons.BookOpen className="w-4 h-4" />
                        Back to Lesson Now
                    </button>
                </div>
            )}

            {/* ── Case 2: failed but retries remain ───────────────────────── */}
            {hasResult && !lessonResetRequired && !passed && (
                <div className="mb-6">
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-5">
                        <div className="flex items-center gap-2 mb-1">
                            <Icons.XCircle className="w-5 h-5 text-orange-600" />
                            <span className="font-bold text-orange-800">
                                Attempt {attemptJustMade} of {maxAttempts} Failed
                            </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">Score: {result.score?.toFixed(1)}%</p>
                        {displayRemaining > 0 && (
                            <p className="text-sm font-semibold text-orange-700">
                                {displayRemaining} attempt{displayRemaining !== 1 ? 's' : ''} remaining — try again below
                            </p>
                        )}
                    </div>

                    <div className="space-y-6">
                        {assessment.questions?.map((q, qIdx) => (
                            <QuestionRenderer
                                key={qIdx}
                                question={q}
                                index={qIdx}
                                answer={lessonAnswers[qIdx]}
                                onChange={(val) => setLessonAnswers(prev => ({ ...prev, [qIdx]: val }))}
                            />
                        ))}
                        <button
                            onClick={onSubmit}
                            disabled={submitting || !allAnswered}
                            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting
                                ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                : <Icons.RotateCcw className="w-5 h-5" />}
                            Retry Assessment ({displayRemaining} left)
                        </button>
                    </div>
                </div>
            )}

            {/* ── Case 3: no result yet — first attempt form ───────────────── */}
            {!hasResult && (
                <div className="space-y-6">
                    {assessment.questions?.map((q, qIdx) => (
                        <QuestionRenderer
                            key={qIdx}
                            question={q}
                            index={qIdx}
                            answer={lessonAnswers[qIdx]}
                            onChange={(val) => setLessonAnswers(prev => ({ ...prev, [qIdx]: val }))}
                        />
                    ))}
                    <button
                        onClick={onSubmit}
                        disabled={submitting || !allAnswered}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {submitting
                            ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                            : <Icons.Send className="w-5 h-5" />}
                        Submit Assessment
                    </button>
                </div>
            )}
        </div>
    );
}

// Final Assessment Component
function FinalAssessmentPanel({ module, enrollment, finalAnswers, setFinalAnswers, finalAssessmentResult, submitting, onSubmit, onGoToLessons, router }) {
    const assessment = module.finalAssessment;
    const hasResult = finalAssessmentResult != null;
    const passed = enrollment.finalAssessmentPassed || finalAssessmentResult?.passed;
    const maxAttempts = assessment?.maxAttempts || 3;
    const attempts = enrollment.finalAssessmentAttempts || 0;
    const requiresModuleRepeat = enrollment.requiresModuleRepeat || false;
    const canAttempt = !passed && !requiresModuleRepeat && attempts < maxAttempts;

    // Use backend-returned remainingAttempts when available (authoritative after increment)
    const remainingFromResult = finalAssessmentResult?.remainingAttempts;
    const displayRemaining = remainingFromResult !== undefined
        ? remainingFromResult
        : Math.max(0, maxAttempts - attempts);

    // Attempt number just submitted:
    // • requiresModuleRepeat=true → all maxAttempts were used
    // • Otherwise: maxAttempts − remainingFromResult
    const attemptJustMade = hasResult && !passed
        ? (requiresModuleRepeat ? maxAttempts : (remainingFromResult !== undefined ? maxAttempts - remainingFromResult : attempts))
        : null;

    // Auto-redirect countdown when module must be repeated (triggered only on fresh result)
    const [redirectCountdown, setRedirectCountdown] = React.useState(6);
    React.useEffect(() => {
        if (!requiresModuleRepeat || !hasResult) return;
        setRedirectCountdown(6);
        const interval = setInterval(() => {
            setRedirectCountdown(prev => {
                if (prev <= 1) { clearInterval(interval); onGoToLessons(); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [requiresModuleRepeat, hasResult]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!assessment) {
        return (
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 text-center">
                <Icons.Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Final Assessment</h3>
                <p className="text-gray-600">This module does not have a final assessment.</p>
            </div>
        );
    }

    // Completed & Certificate Earned
    if (enrollment.isCompleted && enrollment.certificateEarned) {
        return (
            <CompletionScreen
                enrollment={enrollment}
                moduleId={module._id}
                router={router}
            />
        );
    }

    return (
        <div className="bg-white rounded-2xl border-2 border-indigo-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <Icons.Target className="w-8 h-8" />
                    <h3 className="text-2xl font-bold">{assessment.title || 'Final Assessment'}</h3>
                </div>
                {assessment.description && <p className="text-indigo-100">{assessment.description}</p>}
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                    <span className="flex items-center gap-1.5">
                        <Icons.CheckCircle className="w-4 h-4" />
                        Pass score: {assessment.passingScore || 70}%
                    </span>
                    <span className={`flex items-center gap-1.5 font-semibold ${attempts >= maxAttempts ? 'text-red-300' : 'text-white'}`}>
                        <Icons.RotateCcw className="w-4 h-4" />
                        {attempts}/{maxAttempts} attempts used
                    </span>
                    {assessment.timeLimit && (
                        <span className="flex items-center gap-1.5">
                            <Icons.Clock className="w-4 h-4" />
                            {assessment.timeLimit} min
                        </span>
                    )}
                    <span className="flex items-center gap-1.5">
                        <Icons.FileQuestion className="w-4 h-4" />
                        {assessment.questions?.length || 0} questions
                    </span>
                </div>
            </div>

            <div className="p-6 sm:p-8">

                {/* ── ALL ATTEMPTS EXHAUSTED → module repeat required ───────── */}
                {requiresModuleRepeat && (
                    <div className="mb-6">
                        {/* Result banner */}
                        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5 mb-4">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="bg-red-100 p-2 rounded-lg flex-shrink-0">
                                    <Icons.XCircle className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-red-800 text-lg">
                                        {hasResult
                                            ? `Attempt ${attemptJustMade} of ${maxAttempts} Failed`
                                            : `All ${maxAttempts} Attempts Used`}
                                    </p>
                                    {hasResult && (
                                        <p className="text-sm text-red-700 mt-0.5">
                                            Score: {(finalAssessmentResult?.score || 0).toFixed(1)}%
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="bg-red-100 rounded-lg p-4">
                                <p className="font-semibold text-red-900 mb-1">
                                    You have failed all {maxAttempts} attempts.
                                </p>
                                <p className="text-sm text-red-800">
                                    Your lesson progress has been reset. You must complete all lessons again before you can attempt the final assessment.
                                </p>
                            </div>
                        </div>

                        {/* Auto-redirect countdown (only after fresh submission) */}
                        {hasResult && (
                            <div className="flex items-center gap-2 text-sm text-red-700 font-medium mb-4 justify-center">
                                <Icons.Clock className="w-4 h-4" />
                                Redirecting to lessons in {redirectCountdown}s...
                            </div>
                        )}

                        <button
                            onClick={onGoToLessons}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-bold text-lg transition-all shadow-md"
                        >
                            <Icons.BookOpen className="w-5 h-5" />
                            Start Module Repeat Now
                        </button>
                    </div>
                )}

                {/* ── FAILED WITH RETRIES REMAINING ────────────────────────── */}
                {hasResult && !passed && !requiresModuleRepeat && (
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-2 mb-1">
                            <Icons.XCircle className="w-5 h-5 text-orange-600" />
                            <span className="font-bold text-orange-800">
                                Attempt {attemptJustMade} of {maxAttempts} Failed
                            </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                            Score: {(finalAssessmentResult?.score || 0).toFixed(1)}%
                        </p>
                        {displayRemaining > 0 && (
                            <p className="text-sm font-semibold text-orange-700">
                                {displayRemaining} attempt{displayRemaining !== 1 ? 's' : ''} remaining — answer the questions below to retry
                            </p>
                        )}
                    </div>
                )}

                {/* ── QUESTION FORM (first attempt or retry) ────────────────── */}
                {canAttempt && (
                    <div className="space-y-6">
                        {assessment.questions?.map((q, qIdx) => (
                            <QuestionRenderer
                                key={qIdx}
                                question={q}
                                index={qIdx}
                                answer={finalAnswers[qIdx]}
                                onChange={(val) => setFinalAnswers(prev => ({ ...prev, [qIdx]: val }))}
                            />
                        ))}

                        <button
                            onClick={onSubmit}
                            disabled={submitting || Object.keys(finalAnswers).length < (assessment.questions?.length || 0)}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                            ) : hasResult ? (
                                <Icons.RotateCcw className="w-5 h-5" />
                            ) : (
                                <Icons.Send className="w-5 h-5" />
                            )}
                            {hasResult
                                ? `Retry Assessment (${displayRemaining} attempt${displayRemaining !== 1 ? 's' : ''} left)`
                                : 'Submit Final Assessment'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Answer evaluation helper ──────────────────────────────────────────────────
function evaluateStudentAnswer(question, studentAnswer) {
    if (!studentAnswer) return false;
    const ca = question.correctAnswer;
    if (ca === undefined || ca === null || ca === '') return false;
    const options = question.options || [];
    const idx = Number(ca);
    if (!isNaN(idx) && Number.isInteger(idx) && idx >= 0 && idx < options.length) {
        return String(studentAnswer).trim() === String(options[idx]).trim();
    }
    return String(studentAnswer).trim().toLowerCase() === String(ca).trim().toLowerCase();
}

function getCorrectText(question) {
    const ca = question.correctAnswer;
    const options = question.options || [];
    const idx = Number(ca);
    if (!isNaN(idx) && Number.isInteger(idx) && idx >= 0 && idx < options.length) return options[idx];
    return String(ca || '');
}

// Question Renderer Component (with immediate per-question feedback)
function QuestionRenderer({ question, index, answer, onChange }) {
    const [checked, setChecked] = React.useState(null); // null | { correct: bool }

    const isMultipleChoice = question.type === 'multiple-choice' || question.type === 'multiple_choice';
    const isTrueFalse = question.type === 'true-false';
    const isEssay = question.type === 'essay' || question.type === 'short-answer';

    const isChecked = checked !== null;
    const isCorrect = checked?.correct;

    const handleSelect = (val) => {
        onChange(val);
        // Auto-check on selection for MC / true-false
        if (isMultipleChoice || isTrueFalse) {
            const correct = evaluateStudentAnswer(question, val);
            setChecked({ correct, answer: val });
        }
    };

    const questionText = question.question || question.text || '';
    const correctOptionText = isChecked ? getCorrectText(question) : null;

    return (
        <div className={`rounded-xl border-2 p-5 transition-all ${
            isChecked
                ? isCorrect ? 'border-green-300 bg-green-50' : 'border-red-200 bg-red-50'
                : 'bg-gray-50 border-gray-200'
        }`}>
            <div className="flex items-start gap-3 mb-4">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white ${
                    isChecked ? (isCorrect ? 'bg-green-500' : 'bg-red-500') : 'bg-[#021d49]'
                }`}>
                    {isChecked ? (isCorrect ? '✓' : '✗') : index + 1}
                </span>
                <div className="flex-1">
                    {/* Optional code snippet */}
                    {question.codeSnippet && (
                        <div className="mb-3 rounded-lg overflow-hidden border border-gray-700">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#2d2d2d]">
                                <span className="text-xs text-gray-300 font-semibold font-mono">{question.codeSnippet.language || 'python'}</span>
                            </div>
                            <pre className="bg-[#1e1e1e] text-green-300 text-xs p-3 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">{question.codeSnippet.code}</pre>
                        </div>
                    )}
                    <p className="font-medium text-gray-900">{questionText}</p>
                    {question.points && (
                        <span className="text-xs text-gray-500">{question.points} point{question.points !== 1 ? 's' : ''}</span>
                    )}
                </div>
            </div>

            {(isMultipleChoice || isTrueFalse) && (
                <div className={`space-y-2 ml-10 ${isMultipleChoice ? '' : 'flex gap-3 space-y-0'}`}>
                    {(isTrueFalse ? ['True', 'False'] : question.options || []).map((option, optIdx) => {
                        const isSelected = answer === option;
                        const isThisCorrect = isChecked && String(option).trim() === String(correctOptionText).trim();
                        const isThisWrong = isChecked && isSelected && !isCorrect;
                        return (
                            <label
                                key={optIdx}
                                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${isTrueFalse ? 'flex-1 justify-center' : ''} ${
                                    isChecked
                                        ? isThisCorrect
                                            ? 'border-green-400 bg-green-100 text-green-900'
                                            : isThisWrong
                                            ? 'border-red-400 bg-red-100 text-red-900'
                                            : 'border-gray-200 bg-white text-gray-400 opacity-60'
                                        : isSelected
                                        ? 'border-[#021d49] bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name={`question-${index}`}
                                    value={option}
                                    checked={isSelected}
                                    onChange={() => !isChecked && handleSelect(option)}
                                    disabled={isChecked}
                                    className="text-[#021d49] flex-shrink-0"
                                />
                                <span className="text-sm font-medium flex-1">{option}</span>
                                {isChecked && isThisCorrect && <span className="text-green-600 text-xs font-bold">✓</span>}
                                {isChecked && isThisWrong && <span className="text-red-500 text-xs font-bold">✗</span>}
                            </label>
                        );
                    })}
                </div>
            )}

            {isEssay && (
                <div className="ml-10 space-y-2">
                    <textarea
                        value={answer || ''}
                        onChange={(e) => !isChecked && onChange(e.target.value)}
                        disabled={isChecked}
                        placeholder="Write your answer here..."
                        rows={4}
                        className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:border-[#021d49] focus:ring-0 outline-none resize-none disabled:bg-white disabled:text-gray-500"
                    />
                    {!isChecked && answer && (
                        <button
                            type="button"
                            onClick={() => {
                                const correct = evaluateStudentAnswer(question, answer);
                                setChecked({ correct, answer });
                            }}
                            className="text-xs px-3 py-1.5 rounded-lg bg-[#021d49] text-white font-semibold hover:bg-blue-800 transition-colors"
                        >
                            Check Answer
                        </button>
                    )}
                </div>
            )}

            {/* Feedback + explanation */}
            {isChecked && (
                <div className={`mt-4 ml-10 rounded-lg p-3 border ${
                    isCorrect ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'
                }`}>
                    <p className={`text-sm font-bold mb-1 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                        {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                        {!isCorrect && correctOptionText && (
                            <span className="font-normal text-gray-700 ml-2">
                                Correct answer: <span className="font-semibold text-green-700">{correctOptionText}</span>
                            </span>
                        )}
                    </p>
                    {question.explanation && (
                        <p className="text-sm text-gray-700 leading-relaxed">{question.explanation}</p>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Star Rating Input ─────────────────────────────────────────────────────────
function StarRatingInput({ value, onChange }) {
    const [hovered, setHovered] = React.useState(0);
    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                        className="focus:outline-none transition-transform hover:scale-110"
                    >
                        <Icons.Star
                            className={`w-9 h-9 transition-colors ${
                                star <= (hovered || value)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-gray-300'
                            }`}
                        />
                    </button>
                ))}
            </div>
            {(hovered || value) > 0 && (
                <span className="text-sm font-semibold text-amber-600">
                    {labels[hovered || value]}
                </span>
            )}
        </div>
    );
}

// ── Completion Screen with Rating Prompt ──────────────────────────────────────
function CompletionScreen({ enrollment, moduleId, router }) {
    const [showRating, setShowRating] = React.useState(false);
    const [rating, setRating] = React.useState(0);
    const [review, setReview] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);
    const [submitted, setSubmitted] = React.useState(false);
    const [existingRating, setExistingRating] = React.useState(null);

    // Check if student has already rated
    React.useEffect(() => {
        moduleRatingService.getMyRating(moduleId)
            .then((res) => {
                if (res?.data) {
                    setExistingRating(res.data);
                    setRating(res.data.rating);
                    setReview(res.data.review || '');
                }
            })
            .catch(() => {});
    }, [moduleId]);

    const handleSubmitRating = async () => {
        if (rating === 0) return;
        try {
            setSubmitting(true);
            await moduleRatingService.submitRating(moduleId, rating, review);
            setSubmitted(true);
            setShowRating(false);
            setExistingRating({ rating, review });
        } catch (err) {
            alert(err?.response?.data?.message || 'Failed to submit rating');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            {/* Certificate Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 p-8 text-center mb-4">
                <div className="bg-green-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Icons.Award className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">Module Completed!</h3>
                <p className="text-gray-600 mb-1">
                    Final Score: <span className="font-bold text-green-700">{enrollment.finalAssessmentScore?.toFixed(1)}%</span>
                </p>
                <p className="text-green-600 font-semibold mb-6">Certificate earned!</p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                        onClick={() => router.push('/student/certificates')}
                        className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all shadow-md"
                    >
                        <Icons.Download className="w-5 h-5" />
                        View Certificate
                    </button>
                    {!submitted && !existingRating && (
                        <button
                            onClick={() => setShowRating(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-6 py-3 rounded-xl font-bold hover:from-amber-500 hover:to-yellow-600 transition-all shadow-md"
                        >
                            <Icons.Star className="w-5 h-5" />
                            Rate This Module
                        </button>
                    )}
                    {(submitted || existingRating) && (
                        <div className="flex items-center gap-2 bg-amber-50 border-2 border-amber-200 px-4 py-2 rounded-xl">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Icons.Star
                                    key={s}
                                    className={`w-5 h-5 ${s <= (existingRating?.rating || rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                                />
                            ))}
                            <span className="text-sm font-semibold text-amber-700 ml-1">Your rating</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Rating Modal */}
            {showRating && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8">
                        <div className="text-center mb-6">
                            <div className="bg-amber-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icons.Star className="w-7 h-7 text-amber-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Rate This Module</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Your feedback helps other students and the instructor.
                            </p>
                        </div>

                        <div className="mb-5">
                            <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                                How would you rate this module?
                            </label>
                            <StarRatingInput value={rating} onChange={setRating} />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Write a review <span className="font-normal text-gray-400">(optional)</span>
                            </label>
                            <textarea
                                value={review}
                                onChange={(e) => setReview(e.target.value)}
                                placeholder="Share what you liked or what could be improved..."
                                rows={3}
                                maxLength={1000}
                                className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:border-amber-400 focus:ring-0 outline-none resize-none"
                            />
                            <p className="text-xs text-gray-400 text-right mt-1">{review.length}/1000</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRating(false)}
                                className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:border-gray-300 transition-all"
                            >
                                Skip
                            </button>
                            <button
                                onClick={handleSubmitRating}
                                disabled={rating === 0 || submitting}
                                className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-white rounded-xl font-bold hover:from-amber-500 hover:to-yellow-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting
                                    ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                    : <Icons.Send className="w-4 h-4" />}
                                Submit Rating
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default function StudentModuleLearningPage() {
    return (
        <ProtectedStudentRoute>
            <ModuleLearningContent />
        </ProtectedStudentRoute>
    );
}
