'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import * as Icons from 'lucide-react';
import moduleService from '@/lib/api/moduleService';
import moduleEnrollmentService from '@/lib/api/moduleEnrollmentService';
import moduleRatingService from '@/lib/api/moduleRatingService';
import Navbar from '@/components/navbar/navbar';
import ProtectedStudentRoute from '@/components/ProtectedStudentRoute';
import LessonViewer from '@/components/student/LessonViewer';
import { Button } from '@/components/ui/button';

// ── Smart video player (handles YouTube, Vimeo, and direct files) ─────────────
function VideoPlayer({ url, className = '' }) {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
    if (ytMatch) {
        return (
            <iframe
                src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                className={`w-full aspect-video rounded-xl ${className}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                frameBorder="0"
            />
        );
    }
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
        return (
            <iframe
                src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
                className={`w-full aspect-video rounded-xl ${className}`}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                frameBorder="0"
            />
        );
    }
    // Direct video file
    return <video src={url} controls className={`w-full max-h-[420px] object-contain ${className}`} />;
}

// ── Resource helpers ───────────────────────────────────────────────────────────
function resourceHref(res) {
    const url = typeof res === 'string' ? res : res.url;
    const name = typeof res === 'string' ? res : (res.name || res.originalName || '');
    const ext = (res?.fileType || name || url || '').split('.').pop()?.toLowerCase() || '';
    const isPdf = ext === 'pdf';
    return { url, name, ext, isPdf, href: isPdf ? url : url?.replace('/upload/', '/upload/fl_attachment/') };
}

function fileIconColor(ext) {
    if (ext === 'pdf') return { bg: 'bg-red-100', text: 'text-red-600' };
    if (['xlsx', 'xls', 'csv'].includes(ext)) return { bg: 'bg-green-100', text: 'text-green-600' };
    if (['docx', 'doc'].includes(ext)) return { bg: 'bg-blue-100', text: 'text-blue-600' };
    if (['pptx', 'ppt'].includes(ext)) return { bg: 'bg-orange-100', text: 'text-orange-600' };
    return { bg: 'bg-gray-100', text: 'text-gray-500' };
}

// ── Circular lesson progress indicator ────────────────────────────────────────
function CircleProgress({ completed, progress, total, locked }) {
    if (completed) {
        return (
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Icons.Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </div>
        );
    }
    if (locked) {
        return (
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 flex items-center justify-center flex-shrink-0">
                <Icons.Lock className="w-3 h-3 text-gray-400" />
            </div>
        );
    }
    const pct = total > 0 ? (progress / total) * 100 : 0;
    const r = 9;
    const circumference = 2 * Math.PI * r;
    return (
        <svg width="24" height="24" className="flex-shrink-0 -rotate-90">
            <circle cx="12" cy="12" r={r} fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
            <circle cx="12" cy="12" r={r} fill="none"
                stroke="#021d49"
                strokeWidth="2.5"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - pct / 100)}
                strokeLinecap="round"
            />
        </svg>
    );
}

// ── Main content ───────────────────────────────────────────────────────────────
function ModuleLearningContent() {
    const { id: moduleId } = useParams();
    const router = useRouter();
    const openFinalAssessmentOnLoad = useSearchParams().get('showFinalAssessment') === 'true';

    // Data state
    const [moduleData, setModuleData] = useState(null);
    const [enrollment, setEnrollment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
    const [liveSlideIndex, setLiveSlideIndex] = useState(0);
    const [showFinalAssessment, setShowFinalAssessment] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [submittingAssessment, setSubmittingAssessment] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadError, setDownloadError] = useState('');
    const [lessonAnswers, setLessonAnswers] = useState({});
    const [lessonAssessmentResult, setLessonAssessmentResult] = useState(null);
    const [showLessonAssessment, setShowLessonAssessment] = useState(false);
    const [finalAnswers, setFinalAnswers] = useState({});
    const [finalAssessmentResult, setFinalAssessmentResult] = useState(null);

    // UI state
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState('outline');
    const [searchQuery, setSearchQuery] = useState('');
    const [darkMode, setDarkMode] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showIntroVideo, setShowIntroVideo] = useState(false); // shown first only if introVideoUrl exists
    const containerRef = useRef(null);

    // Fullscreen
    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await containerRef.current?.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (_) { }
    };
    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    // Data fetch
    useEffect(() => { if (moduleId) fetchModuleData(); }, [moduleId, openFinalAssessmentOnLoad]);

    const fetchModuleData = async () => {
        try {
            setLoading(true); setError('');
            const [mod, enrollmentData] = await Promise.all([
                moduleService.getModuleById(moduleId),
                moduleEnrollmentService.getMyEnrollmentForModule(moduleId).catch(() => null),
            ]);
            setModuleData(mod);
            setEnrollment(enrollmentData);
            if (mod?.introVideoUrl) setShowIntroVideo(true); // only show intro screen if video exists
            if (enrollmentData?.lastAccessedLesson != null) setCurrentLessonIndex(enrollmentData.lastAccessedLesson);
            const allDone = enrollmentData?.completedLessons >= enrollmentData?.totalLessons && enrollmentData?.totalLessons > 0;
            if (openFinalAssessmentOnLoad && allDone && !enrollmentData?.requiresModuleRepeat) setShowFinalAssessment(true);
        } catch (err) {
            setError('Failed to load module');
        } finally { setLoading(false); }
    };

    const handleDownload = async () => {
        if (downloading) return;
        setDownloading(true); setDownloadProgress(0); setDownloadError('');
        try {
            await moduleService.downloadModuleZip(moduleId, moduleData?.title || 'module', (pct) => setDownloadProgress(pct));
        } catch {
            setDownloadError('Download failed. Please try again.');
            setTimeout(() => setDownloadError(''), 4000);
        } finally { setDownloading(false); setDownloadProgress(0); }
    };

    // Computed
    const lessons = moduleData?.lessons || [];
    const totalLessons = lessons.length;
    const currentLesson = lessons[currentLessonIndex];

    const getLessonProgress = useCallback((index) => {
        if (!enrollment?.lessonProgress) return null;
        return enrollment.lessonProgress.find(lp => lp.lessonIndex === index);
    }, [enrollment]);

    const isLessonCompleted = useCallback((index) => getLessonProgress(index)?.isCompleted || false, [getLessonProgress]);
    const isLessonAccessible = useCallback((index) => index === 0 || isLessonCompleted(index - 1), [isLessonCompleted]);

    const completedCount = enrollment?.lessonProgress?.filter(lp => lp.isCompleted).length ?? 0;
    const allLessonsCompleted = totalLessons > 0 && completedCount >= totalLessons && !enrollment?.requiresModuleRepeat;
    // Compute progress locally so it updates in real-time as lessons are completed
    const safeProgress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    // All resources for resources tab
    const allResources = useMemo(() => {
        if (!moduleData) return [];
        const items = [];
        const modRes = moduleData.resources || moduleData.moduleResources || [];
        modRes.forEach(r => r && items.push({ res: r, source: 'Module Resources' }));
        lessons.forEach((l, li) => {
            const lRes = l.lessonResources || l.resources || [];
            lRes.forEach(r => r && items.push({ res: r, source: l.title || `Lesson ${li + 1}` }));
        });
        return items.filter(item => typeof item.res === 'string' ? item.res : item.res?.url);
    }, [moduleData, lessons]);

    const filteredResources = useMemo(() => {
        if (!searchQuery.trim()) return allResources;
        const q = searchQuery.toLowerCase();
        return allResources.filter(({ res, source }) => {
            const name = typeof res === 'string' ? res : (res.name || res.originalName || '');
            return name.toLowerCase().includes(q) || source.toLowerCase().includes(q);
        });
    }, [allResources, searchQuery]);

    const filteredLessons = useMemo(() => {
        if (!moduleData) return [];
        if (!searchQuery.trim() || activeTab !== 'outline') return lessons.map((l, i) => ({ lesson: l, idx: i }));
        const q = searchQuery.toLowerCase();
        return lessons.map((l, i) => ({ lesson: l, idx: i })).filter(({ lesson }) =>
            (lesson.title || '').toLowerCase().includes(q)
        );
    }, [moduleData, lessons, searchQuery, activeTab]);

    // Lesson action handlers
    const handleCompleteLesson = async () => {
        if (!enrollment) return;
        try {
            setCompleting(true);
            const result = await moduleEnrollmentService.completeLesson(enrollment._id, currentLessonIndex);
            const updatedEnrollment = result.enrollment ?? result;
            setEnrollment(updatedEnrollment);
            const lesson = lessons[currentLessonIndex];
            if (lesson?.assessment?.questions?.length > 0) {
                const lp = updatedEnrollment.lessonProgress?.find(lp => lp.lessonIndex === currentLessonIndex);
                if (!lp?.assessmentPassed) { setShowLessonAssessment(true); return; }
            }
            const { navigateTo, nextLessonIndex } = result;
            if (navigateTo === 'final_assessment') setShowFinalAssessment(true);
            else if (navigateTo === 'next_lesson' && nextLessonIndex != null) setCurrentLessonIndex(nextLessonIndex);
            else if (currentLessonIndex < totalLessons - 1) setCurrentLessonIndex(currentLessonIndex + 1);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to mark lesson complete');
        } finally { setCompleting(false); }
    };

    const handleSubmitLessonAssessment = async () => {
        if (!enrollment) return;
        try {
            setSubmittingAssessment(true);
            const answers = Object.entries(lessonAnswers).map(([idx, val]) => ({ questionIndex: parseInt(idx), answer: String(val) }));
            const result = await moduleEnrollmentService.submitLessonAssessment(enrollment._id, currentLessonIndex, answers);
            setEnrollment(result.enrollment ?? result);
            if (result.passed) {
                setShowLessonAssessment(false); setLessonAssessmentResult(null); setLessonAnswers({});
                if (result.navigateTo === 'final_assessment') setShowFinalAssessment(true);
                else if (result.navigateTo === 'next_lesson' && result.nextLessonIndex != null) setCurrentLessonIndex(result.nextLessonIndex);
            } else {
                setLessonAssessmentResult(result); setLessonAnswers({});
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit assessment');
        } finally { setSubmittingAssessment(false); }
    };

    const handleSubmitFinalAssessment = async () => {
        if (!enrollment) return;
        try {
            setSubmittingAssessment(true);
            const answers = Object.entries(finalAnswers).map(([idx, val]) => ({ questionIndex: parseInt(idx), answer: String(val) }));
            const result = await moduleEnrollmentService.submitFinalAssessment(enrollment._id, answers);
            setFinalAssessmentResult(result);
            setEnrollment(result.enrollment ?? result);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit assessment');
        } finally { setSubmittingAssessment(false); }
    };

    const navigateToLesson = (index) => {
        if (!isLessonAccessible(index) && !isLessonCompleted(index)) return;
        setCurrentLessonIndex(index);
        setLiveSlideIndex(0); // reset slide position for new lesson
        setShowFinalAssessment(false);
        setShowLessonAssessment(false);
        setLessonAssessmentResult(null);
        setLessonAnswers({});
        if (window.innerWidth < 1024) setSidebarCollapsed(true);
    };

    // Loading / error states
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4">
                <div className="w-10 h-10 rounded-full border-4 border-green-200 border-t-green-600 animate-spin" />
                <p className="text-sm font-medium text-gray-500">Loading your lesson…</p>
            </div>
        );
    }
    if (error || !moduleData) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center max-w-md px-6">
                        <Icons.AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">{error || 'Module not found'}</h2>
                        <Button onClick={() => router.push('/student/modules')} className="mt-4 bg-green-600 hover:bg-green-700">
                            Browse Modules
                        </Button>
                    </div>
                </div>
            </>
        );
    }
    if (!enrollment) {
        router.replace(`/modules/${moduleId}`);
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Icons.Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>;
    }

    const lessonRes = currentLesson ? (currentLesson.lessonResources || currentLesson.resources || []) : [];
    const moduleRes = moduleData?.resources || moduleData?.moduleResources || [];
    const hasSlides = !showLessonAssessment && (currentLesson?.slides?.length > 0);

    // ── RENDER ─────────────────────────────────────────────────────────────────
    return (
        <>
            <Navbar />
            <div
                ref={containerRef}
                className={`flex overflow-hidden transition-colors duration-200 ${darkMode ? 'bg-gray-950' : 'bg-gray-100'}`}
                style={{ height: isFullscreen ? '100vh' : 'calc(100vh - 80px)' }}
            >
                {/* ══════════════════════════════════════════════════════
                    SIDEBAR
                ══════════════════════════════════════════════════════ */}
                <aside className={`
                    flex flex-col border-r overflow-hidden transition-all duration-300
                    fixed top-[80px] bottom-0 left-0 z-20
                    lg:relative lg:top-auto lg:bottom-auto lg:left-auto lg:z-auto lg:flex-shrink-0
                    ${sidebarCollapsed
                        ? '-translate-x-full lg:translate-x-0 lg:w-0'
                        : 'translate-x-0 w-[280px] lg:w-[300px]'}
                    ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}
                `}>
                    {/* Tabs */}
                    <div className={`flex flex-shrink-0 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <button
                            onClick={() => setActiveTab('outline')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap
                                ${activeTab === 'outline'
                                    ? `border-[#021d49] ${darkMode ? 'text-blue-300' : 'text-[#021d49]'}`
                                    : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`
                                }`}
                        >
                            <Icons.LayoutList className="w-3.5 h-3.5 flex-shrink-0" /> Course Outline
                        </button>
                        <button
                            onClick={() => setActiveTab('resources')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap
                                ${activeTab === 'resources'
                                    ? `border-[#021d49] ${darkMode ? 'text-blue-300' : 'text-[#021d49]'}`
                                    : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`
                                }`}
                        >
                            <Icons.FileText className="w-3.5 h-3.5 flex-shrink-0" /> Resources
                        </button>
                    </div>

                    {/* Search */}
                    <div className={`px-3 py-2.5 flex-shrink-0 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                            <Icons.Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder={activeTab === 'outline' ? 'Search course outline' : 'Search Resources'}
                                className={`flex-1 text-xs outline-none bg-transparent ${darkMode ? 'text-gray-200 placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}`}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                                    <Icons.X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── COURSE OUTLINE TAB ── */}
                    {activeTab === 'outline' && (
                        <div className="flex-1 overflow-y-auto">
                            {/* Intro Video entry */}
                            {moduleData?.introVideoUrl && (
                                <div className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                    <button
                                        onClick={() => { setShowIntroVideo(true); setShowFinalAssessment(false); if (window.innerWidth < 1024) setSidebarCollapsed(true); }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors
                                            ${showIntroVideo
                                                ? darkMode ? 'bg-blue-900/20 text-green-400' : 'bg-blue-50 text-green-700'
                                                : darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Icons.PlayCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                        Module Intro Video
                                    </button>
                                </div>
                            )}

                            {/* My Knowledge Check */}
                            <div className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                <button
                                    onClick={() => {
                                        if (allLessonsCompleted) {
                                            setShowFinalAssessment(true);
                                            setShowLessonAssessment(false);
                                            if (window.innerWidth < 1024) setSidebarCollapsed(true);
                                        }
                                    }}
                                    disabled={!allLessonsCompleted}
                                    className={`w-full flex items-center justify-between px-4 py-3.5 text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                                        ${showFinalAssessment
                                            ? darkMode ? 'bg-green-900/30 text-green-400' : 'bg-blue-50 text-green-700'
                                            : darkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-800 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <Icons.BarChart2 className="w-4 h-4 text-green-600" />
                                        My Knowledge Check
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        {enrollment?.finalAssessmentPassed && <Icons.CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                                        <Icons.RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                                    </div>
                                </button>
                            </div>

                            {/* Module info + progress */}
                            <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <p className={`text-xs font-bold uppercase tracking-wide truncate mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {moduleData.title}
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                        <div className="h-full bg-[#021d49] rounded-full transition-all duration-500" style={{ width: `${safeProgress}%` }} />
                                    </div>
                                    <span className="text-xs font-bold text-[#021d49] flex-shrink-0">{safeProgress}%</span>
                                </div>
                                <p className={`text-[11px] mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {completedCount} of {totalLessons} lessons completed
                                </p>
                            </div>

                            {/* Lesson list */}
                            {filteredLessons.map(({ lesson, idx }) => {
                                const completed = isLessonCompleted(idx);
                                const accessible = isLessonAccessible(idx) || completed;
                                const isCurrent = idx === currentLessonIndex && !showFinalAssessment;
                                const locked = !accessible;
                                const lp = enrollment?.lessonProgress?.find(lp => lp.lessonIndex === idx);
                                const completedSlideCount = lp?.slideProgress?.filter(sp => sp.isCompleted).length || 0;
                                const totalSlides = lesson.slides?.length || 0;
                                // If lesson is completed, show total slides; otherwise show live position or server count
                                const displayedSlideCount = completed
                                    ? totalSlides
                                    : isCurrent ? Math.max(completedSlideCount, liveSlideIndex + 1) : completedSlideCount;

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => accessible && navigateToLesson(idx)}
                                        disabled={locked}
                                        className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b transition-colors disabled:cursor-not-allowed
                                            ${darkMode ? 'border-gray-800' : 'border-gray-100'}
                                            ${isCurrent
                                                ? darkMode ? 'bg-blue-900/20' : 'bg-blue-50'
                                                : accessible
                                                    ? darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                                                    : 'opacity-40'
                                            }`}
                                    >
                                        <div className="mt-0.5">
                                            <CircleProgress completed={completed} progress={displayedSlideCount} total={totalSlides} isCurrent={isCurrent} locked={locked} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm leading-snug ${isCurrent ? `font-bold ${darkMode ? 'text-[#93c5fd]' : 'text-[#021d49]'}`
                                                    : completed ? darkMode ? 'font-medium text-gray-300' : 'font-medium text-gray-700'
                                                        : locked ? 'text-gray-400'
                                                            : darkMode ? 'font-medium text-gray-300' : 'font-medium text-gray-600'
                                                }`}>
                                                {lesson.title || `Lesson ${idx + 1}`}
                                            </p>
                                            {totalSlides > 0 && (
                                                <p className={`text-[11px] mt-0.5 ${isCurrent ? 'text-[#1e40af]' : 'text-gray-400'}`}>
                                                    {displayedSlideCount} / {totalSlides}
                                                </p>
                                            )}
                                        </div>
                                        {isCurrent && <Icons.ChevronRight className="w-3.5 h-3.5 text-[#1e40af] flex-shrink-0 mt-1" />}
                                    </button>
                                );
                            })}

                            {filteredLessons.length === 0 && searchQuery && (
                                <div className={`py-10 text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    No lessons match "{searchQuery}"
                                </div>
                            )}

                            {/* Download module */}
                            <div className="p-3">
                                <button
                                    onClick={handleDownload}
                                    disabled={downloading}
                                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all disabled:opacity-50
                                        ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {downloading
                                        ? <><Icons.Loader2 className="w-3.5 h-3.5 animate-spin" /><span className="flex-1 text-left">{downloadProgress > 0 ? `${downloadProgress}%` : 'Preparing…'}</span></>
                                        : <><Icons.Download className="w-3.5 h-3.5" />Download Module</>
                                    }
                                </button>
                                {downloadError && <p className="text-xs text-red-500 mt-1.5 text-center">{downloadError}</p>}
                            </div>
                        </div>
                    )}

                    {/* ── RESOURCES TAB ── */}
                    {activeTab === 'resources' && (
                        <div className="flex-1 overflow-y-auto p-3">
                            {filteredResources.length === 0 ? (
                                <div className={`py-10 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <Icons.FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                    <p className="text-sm">{searchQuery ? `No results for "${searchQuery}"` : 'No resources available'}</p>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className={`text-xs font-bold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Course Resources
                                        </p>
                                        <span className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {filteredResources.length} file{filteredResources.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="space-y-1.5">
                                        {filteredResources.map(({ res, source }, i) => {
                                            const { url, name, ext, isPdf, href } = resourceHref(res);
                                            if (!url) return null;
                                            const colors = fileIconColor(ext);
                                            return (
                                                <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                                                    {...(!isPdf && { download: name })}
                                                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all group
                                                        ${darkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                                                >
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                                                        <Icons.FileText className={`w-4 h-4 ${colors.text}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-xs font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                                            {name || `Resource ${i + 1}`}
                                                        </p>
                                                        <p className={`text-[11px] truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{source}</p>
                                                    </div>
                                                    {isPdf
                                                        ? <Icons.ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-green-600 flex-shrink-0" />
                                                        : <Icons.Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-green-600 flex-shrink-0" />
                                                    }
                                                </a>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </aside>

                {/* Mobile backdrop */}
                {!sidebarCollapsed && (
                    <div className="fixed inset-0 bg-black/40 z-10 lg:hidden" onClick={() => setSidebarCollapsed(true)} />
                )}

                {/* ══════════════════════════════════════════════════════
                    MAIN CONTENT
                ══════════════════════════════════════════════════════ */}
                <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

                    {/* Top bar */}
                    <div className={`flex-shrink-0 flex items-center gap-2 px-3 py-2.5 border-b ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                        {/* Back to modules */}
                        <button
                            onClick={() => router.push('/student/modules')}
                            className={`flex items-center gap-1 p-1.5 rounded-lg transition-colors flex-shrink-0 ${darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-green-400' : 'text-gray-500 hover:bg-gray-100 hover:text-green-700'}`}
                            title="Back to My Modules"
                        >
                            <Icons.ArrowLeft className="w-4 h-4" />
                        </button>
                        <div className={`w-px h-5 flex-shrink-0 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
                            title="Toggle sidebar"
                        >
                            <Icons.PanelLeft className="w-4 h-4" />
                        </button>
                        <div className={`w-px h-5 flex-shrink-0 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                        <p className={`flex-1 text-sm font-semibold truncate ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                            {showIntroVideo && moduleData?.introVideoUrl ? 'Module Introduction' : showFinalAssessment ? 'Final Assessment' : currentLesson?.title || `Lesson ${currentLessonIndex + 1}`}
                        </p>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-yellow-400' : 'text-gray-500 hover:bg-gray-100'}`}
                                title={darkMode ? 'Light mode' : 'Dark mode'}
                            >
                                {darkMode ? <Icons.Sun className="w-4 h-4" /> : <Icons.Moon className="w-4 h-4" />}
                            </button>
                            <div className={`w-px h-5 mx-0.5 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                            <button
                                onClick={toggleFullscreen}
                                className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'text-gray-500 hover:bg-gray-100'}`}
                                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                            >
                                {isFullscreen ? <Icons.Minimize2 className="w-4 h-4" /> : <Icons.Maximize2 className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* ── INTRO VIDEO ── */}
                    {showIntroVideo && moduleData?.introVideoUrl && !showFinalAssessment && (
                        <div className={`flex-1 flex flex-col items-center justify-center overflow-y-auto px-4 py-8 ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
                            <div className="w-full max-w-3xl space-y-5">
                                <div>
                                    <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>Module Introduction</p>
                                    <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{moduleData.title}</h2>
                                    {moduleData.description && (
                                        <p className={`text-sm mt-1 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                                            dangerouslySetInnerHTML={{ __html: moduleData.description.replace(/<[^>]*>/g, ' ').trim() }} />
                                    )}
                                </div>
                                <div className="rounded-2xl overflow-hidden bg-black shadow-xl border border-gray-200">
                                    <VideoPlayer url={moduleData.introVideoUrl} />
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => setShowIntroVideo(false)}
                                        className="flex items-center gap-2 px-7 py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
                                    >
                                        Continue to Lessons
                                        <Icons.ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── FINAL ASSESSMENT ── */}
                    {!showIntroVideo && showFinalAssessment && (
                        <div className={`flex-1 overflow-y-auto ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
                            <div className="max-w-3xl mx-auto px-4 py-8">
                                <FinalAssessmentPanel
                                    module={moduleData}
                                    enrollment={enrollment}
                                    finalAnswers={finalAnswers}
                                    setFinalAnswers={setFinalAnswers}
                                    finalAssessmentResult={finalAssessmentResult}
                                    submitting={submittingAssessment}
                                    onSubmit={handleSubmitFinalAssessment}
                                    onGoToLessons={() => { setShowFinalAssessment(false); setCurrentLessonIndex(0); setFinalAnswers({}); setFinalAssessmentResult(null); }}
                                    router={router}
                                />
                            </div>
                        </div>
                    )}

                    {/* ── LESSON VIEW ── */}
                    {!showIntroVideo && !showFinalAssessment && currentLesson && (
                        <>
                            {/* Slide-based lesson: scrollable LessonViewer */}
                            {hasSlides && (
                                <div className="flex-1 overflow-y-auto">
                                    <LessonViewer
                                        key={currentLessonIndex}
                                        lesson={currentLesson}
                                        lessonIndex={currentLessonIndex}
                                        totalLessons={totalLessons}
                                        enrollment={enrollment}
                                        isAlreadyCompleted={isLessonCompleted(currentLessonIndex)}
                                        darkMode={darkMode}
                                        onSlideChange={(idx) => setLiveSlideIndex(idx)}
                                        onLessonComplete={async () => {
                                            try {
                                                const result = await moduleEnrollmentService.completeLesson(enrollment._id, currentLessonIndex);
                                                const upd = result.enrollment ?? result;
                                                setEnrollment(upd);
                                                setLiveSlideIndex(0);
                                                if (result.navigateTo === 'next_lesson' && result.nextLessonIndex != null) {
                                                    setCurrentLessonIndex(result.nextLessonIndex);
                                                } else if (result.navigateTo === 'final_assessment') {
                                                    setShowFinalAssessment(true);
                                                } else if (currentLessonIndex < totalLessons - 1) {
                                                    // Fallback: advance to next lesson
                                                    setCurrentLessonIndex(currentLessonIndex + 1);
                                                } else {
                                                    setShowFinalAssessment(true);
                                                }
                                            } catch (err) {
                                                console.error('Failed to complete lesson:', err);
                                            }
                                        }}
                                        onAssessmentComplete={(res) => {
                                            // Only update enrollment state — navigation is triggered by
                                            // the modal's "Continue" button (via onLessonComplete below).
                                            setEnrollment(res.enrollment ?? res);
                                        }}
                                    />
                                </div>
                            )}

                            {/* Non-slide lesson: scrollable content */}
                            {!hasSlides && (
                                <div className={`flex-1 overflow-y-auto ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
                                    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

                                        {/* Lesson header card */}
                                        <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <span className="text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                                                    Lesson {currentLessonIndex + 1} of {totalLessons}
                                                </span>
                                                {isLessonCompleted(currentLessonIndex) && (
                                                    <span className="text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                                                        <Icons.CheckCircle className="w-3 h-3" /> Completed
                                                    </span>
                                                )}
                                            </div>
                                            <h1 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {currentLesson.title || `Lesson ${currentLessonIndex + 1}`}
                                            </h1>
                                            {currentLesson.description && (
                                                <div className={`prose prose-sm max-w-none text-gray-500 mt-2 ${darkMode ? 'prose-invert' : ''}`}
                                                    dangerouslySetInnerHTML={{ __html: currentLesson.description }} />
                                            )}
                                            <div className="flex items-center gap-2 mt-4 flex-wrap">
                                                {currentLesson.duration && (
                                                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                                                        <Icons.Clock className="w-3 h-3" /> {currentLesson.duration}
                                                    </span>
                                                )}
                                                {(currentLesson.assessmentQuiz?.length > 0 || currentLesson.assessment?.questions?.length > 0) && (
                                                    <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-green-700 px-2 py-1 rounded-lg font-medium">
                                                        <Icons.HelpCircle className="w-3 h-3" /> Quiz included
                                                    </span>
                                                )}
                                                {lessonRes.length > 0 && (
                                                    <span className="inline-flex items-center gap-1 text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-lg font-medium">
                                                        <Icons.Paperclip className="w-3 h-3" /> {lessonRes.length} resource{lessonRes.length !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Lesson Assessment */}
                                        {showLessonAssessment && currentLesson.assessment && (
                                            <LessonAssessmentPanel
                                                assessment={currentLesson.assessment}
                                                lessonAnswers={lessonAnswers}
                                                setLessonAnswers={setLessonAnswers}
                                                result={lessonAssessmentResult}
                                                lessonProgress={getLessonProgress(currentLessonIndex)}
                                                submitting={submittingAssessment}
                                                onSubmit={handleSubmitLessonAssessment}
                                                onBackToLesson={() => { setShowLessonAssessment(false); setLessonAssessmentResult(null); setLessonAnswers({}); }}
                                            />
                                        )}

                                        {/* Video */}
                                        {!showLessonAssessment && currentLesson.videoUrl && (
                                            <div className="bg-black rounded-2xl overflow-hidden aspect-video shadow-md">
                                                <video src={currentLesson.videoUrl} controls className="w-full h-full" />
                                            </div>
                                        )}

                                        {/* Reading content */}
                                        {!showLessonAssessment && currentLesson.content && (
                                            <div className={`rounded-2xl border shadow-sm overflow-hidden ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                                                <div className={`flex items-center gap-2 px-5 py-3 border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                                                    <Icons.BookOpen className="w-4 h-4 text-gray-400" />
                                                    <span className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Reading</span>
                                                </div>
                                                <div className="p-6 sm:p-8">
                                                    <div className={`prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-a:text-green-600 ${darkMode ? 'prose-invert' : 'prose-slate'}`}
                                                        dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                                                </div>
                                            </div>
                                        )}

                                        {/* Tasks */}
                                        {!showLessonAssessment && currentLesson.tasks?.length > 0 && (
                                            <div className={`rounded-2xl border shadow-sm overflow-hidden ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-blue-100'}`}>
                                                <div className="flex items-center gap-2 px-5 py-3 border-b bg-blue-50 border-blue-50">
                                                    <Icons.CheckSquare className="w-4 h-4 text-blue-500" />
                                                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Tasks</span>
                                                </div>
                                                <div className="p-5 space-y-2">
                                                    {currentLesson.tasks.map((task, ti) => (
                                                        <div key={ti} className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl text-sm text-gray-700">
                                                            <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                <Icons.Check className="w-3 h-3 text-blue-700" />
                                                            </div>
                                                            <span>{typeof task === 'string' ? task : task.text || task.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Resources (lesson + module) */}
                                        {!showLessonAssessment && (lessonRes.length > 0 || moduleRes.length > 0) && (
                                            <div className={`rounded-2xl border shadow-sm overflow-hidden ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                                                <div className={`flex items-center gap-2 px-5 py-3 border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                                                    <Icons.FolderOpen className="w-4 h-4 text-gray-400" />
                                                    <span className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Resources</span>
                                                </div>
                                                <div className="p-4 space-y-2">
                                                    {[...lessonRes, ...moduleRes].map((res, idx) => {
                                                        const { url, name, ext, isPdf, href } = resourceHref(res);
                                                        if (!url) return null;
                                                        const colors = fileIconColor(ext);
                                                        return (
                                                            <a key={idx} href={href} target="_blank" rel="noopener noreferrer"
                                                                {...(!isPdf && { download: name })}
                                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all group ${darkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-white'}`}
                                                            >
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                                                                    <Icons.FileText className={`w-4 h-4 ${colors.text}`} />
                                                                </div>
                                                                <span className={`flex-1 text-sm font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{name || `Resource ${idx + 1}`}</span>
                                                                {isPdf
                                                                    ? <Icons.ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-green-600 flex-shrink-0" />
                                                                    : <Icons.Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-green-600 flex-shrink-0" />
                                                                }
                                                            </a>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Navigation */}
                                        {!showLessonAssessment && (
                                            <div className="flex items-center justify-between gap-3 pb-8">
                                                <Button variant="outline" onClick={() => navigateToLesson(currentLessonIndex - 1)} disabled={currentLessonIndex === 0} className="gap-2">
                                                    <Icons.ChevronLeft className="w-4 h-4" /> Previous
                                                </Button>
                                                <div className="flex items-center gap-2">
                                                    {!isLessonCompleted(currentLessonIndex) && (
                                                        <Button onClick={handleCompleteLesson} disabled={completing} className="bg-green-600 hover:bg-green-700 text-white gap-2 px-6">
                                                            {completing ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.CheckCircle className="w-4 h-4" />}
                                                            {completing ? 'Marking…' : 'Complete Lesson'}
                                                        </Button>
                                                    )}
                                                    {currentLessonIndex < totalLessons - 1 ? (
                                                        <Button onClick={() => navigateToLesson(currentLessonIndex + 1)}
                                                            disabled={!isLessonAccessible(currentLessonIndex + 1) && !isLessonCompleted(currentLessonIndex + 1)}
                                                            className="bg-green-600 hover:bg-green-700 text-white gap-2">
                                                            Next Lesson <Icons.ChevronRight className="w-4 h-4" />
                                                        </Button>
                                                    ) : allLessonsCompleted ? (
                                                        <Button onClick={() => { setShowFinalAssessment(true); setShowLessonAssessment(false); }}
                                                            className="bg-green-600 hover:bg-green-700 text-white gap-2">
                                                            <Icons.Trophy className="w-4 h-4" /> Final Assessment
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

// ── Lesson Assessment Panel ────────────────────────────────────────────────────
function LessonAssessmentPanel({ assessment, lessonAnswers, setLessonAnswers, result, lessonProgress, submitting, onSubmit, onBackToLesson }) {
    if (!assessment) return null;
    const maxAttempts = assessment.maxAttempts || 3;
    const hasResult = result != null;
    const passed = result?.passed;
    const lessonResetRequired = result?.lessonResetRequired;
    const remainingFromResult = result?.remainingAttempts;
    const displayRemaining = remainingFromResult !== undefined ? remainingFromResult : Math.max(0, maxAttempts - (lessonProgress?.assessmentAttempts || 0));
    const attemptJustMade = hasResult && !passed ? (lessonResetRequired ? maxAttempts : (remainingFromResult !== undefined ? maxAttempts - remainingFromResult : null)) : null;
    const attemptsUsed = lessonResetRequired ? maxAttempts : (hasResult && !passed && remainingFromResult !== undefined ? maxAttempts - remainingFromResult : (lessonProgress?.assessmentAttempts || 0));
    const [countdown, setCountdown] = React.useState(5);
    React.useEffect(() => {
        if (!lessonResetRequired) return;
        setCountdown(5);
        const interval = setInterval(() => { setCountdown(p => { if (p <= 1) { clearInterval(interval); onBackToLesson(); return 0; } return p - 1; }); }, 1000);
        return () => clearInterval(interval);
    }, [lessonResetRequired]); // eslint-disable-line react-hooks/exhaustive-deps
    const allAnswered = Object.keys(lessonAnswers).length >= (assessment.questions?.length || 0);

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100 bg-blue-50">
                <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0">
                    <Icons.HelpCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{assessment.title || 'Lesson Assessment'}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Pass score: {assessment.passingScore || 70}% · {attemptsUsed}/{maxAttempts} attempts used</p>
                </div>
                <Button variant="ghost" size="sm" onClick={onBackToLesson} className="text-gray-500">
                    <Icons.X className="w-4 h-4" />
                </Button>
            </div>
            <div className="p-6 space-y-6">
                {lessonResetRequired && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <Icons.XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                            <div>
                                <p className="font-bold text-red-800">Attempt {attemptJustMade} of {maxAttempts} Failed</p>
                                <p className="text-sm text-red-600">Score: {result.score?.toFixed(1)}%</p>
                            </div>
                        </div>
                        <p className="text-sm text-red-700 mb-4">All attempts used. You must re-complete the lesson before retrying the assessment.</p>
                        <div className="flex items-center gap-2 text-sm text-red-600 mb-4">
                            <Icons.Clock className="w-4 h-4" /> Returning to lesson in {countdown}s…
                        </div>
                        <Button onClick={onBackToLesson} className="w-full bg-red-600 hover:bg-red-700 text-white gap-2">
                            <Icons.BookOpen className="w-4 h-4" /> Back to Lesson
                        </Button>
                    </div>
                )}
                {hasResult && !lessonResetRequired && !passed && (
                    <>
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                            <Icons.AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-orange-800">Attempt {attemptJustMade} of {maxAttempts} — Score: {result.score?.toFixed(1)}%</p>
                                {displayRemaining > 0 && <p className="text-sm text-orange-700 mt-0.5">{displayRemaining} attempt{displayRemaining !== 1 ? 's' : ''} remaining</p>}
                            </div>
                        </div>
                        <div className="space-y-4">
                            {assessment.questions?.map((q, qIdx) => (
                                <QuestionRenderer key={qIdx} question={q} index={qIdx} answer={lessonAnswers[qIdx]} onChange={(val) => setLessonAnswers(prev => ({ ...prev, [qIdx]: val }))} />
                            ))}
                            <Button onClick={onSubmit} disabled={submitting || !allAnswered} className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2 h-12 text-base">
                                {submitting ? <Icons.Loader2 className="w-5 h-5 animate-spin" /> : <Icons.RotateCcw className="w-5 h-5" />}
                                Retry ({displayRemaining} left)
                            </Button>
                        </div>
                    </>
                )}
                {!hasResult && (
                    <div className="space-y-4">
                        {assessment.questions?.map((q, qIdx) => (
                            <QuestionRenderer key={qIdx} question={q} index={qIdx} answer={lessonAnswers[qIdx]} onChange={(val) => setLessonAnswers(prev => ({ ...prev, [qIdx]: val }))} />
                        ))}
                        <Button onClick={onSubmit} disabled={submitting || !allAnswered} className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 h-12 text-base">
                            {submitting ? <Icons.Loader2 className="w-5 h-5 animate-spin" /> : <Icons.Send className="w-5 h-5" />}
                            Submit Assessment
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Final Assessment Panel ─────────────────────────────────────────────────────
function FinalAssessmentPanel({ module, enrollment, finalAnswers, setFinalAnswers, finalAssessmentResult, submitting, onSubmit, onGoToLessons, router }) {
    const assessment = module.finalAssessment;
    const hasResult = finalAssessmentResult != null;
    const passed = enrollment.finalAssessmentPassed || finalAssessmentResult?.passed;
    const maxAttempts = assessment?.maxAttempts || 3;
    const attempts = enrollment.finalAssessmentAttempts || 0;
    const requiresModuleRepeat = enrollment.requiresModuleRepeat || false;
    const canAttempt = !passed && !requiresModuleRepeat && attempts < maxAttempts;
    const remainingFromResult = finalAssessmentResult?.remainingAttempts;
    const displayRemaining = remainingFromResult !== undefined ? remainingFromResult : Math.max(0, maxAttempts - attempts);
    const attemptJustMade = hasResult && !passed ? (requiresModuleRepeat ? maxAttempts : (remainingFromResult !== undefined ? maxAttempts - remainingFromResult : attempts)) : null;
    const [redirectCountdown, setRedirectCountdown] = React.useState(6);
    React.useEffect(() => {
        if (!requiresModuleRepeat || !hasResult) return;
        setRedirectCountdown(6);
        const interval = setInterval(() => { setRedirectCountdown(p => { if (p <= 1) { clearInterval(interval); onGoToLessons(); return 0; } return p - 1; }); }, 1000);
        return () => clearInterval(interval);
    }, [requiresModuleRepeat, hasResult]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!assessment) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
                <Icons.Info className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-700 mb-2">No Final Assessment</h3>
                <p className="text-gray-500 text-sm">This module does not have a final assessment.</p>
            </div>
        );
    }

    if (enrollment.isCompleted && enrollment.certificateEarned) {
        return <CompletionScreen enrollment={enrollment} moduleId={module._id} router={router} />;
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Icons.Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">{assessment.title || 'Final Assessment'}</h3>
                        {assessment.description && <p className="text-green-100 text-sm mt-0.5">{assessment.description}</p>}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-green-100">
                    <span className="flex items-center gap-1.5"><Icons.CheckCircle className="w-3.5 h-3.5" />Pass: {assessment.passingScore || 70}%</span>
                    <span className={`flex items-center gap-1.5 font-semibold ${attempts >= maxAttempts ? 'text-red-300' : 'text-white'}`}>
                        <Icons.RotateCcw className="w-3.5 h-3.5" />{attempts}/{maxAttempts} attempts
                    </span>
                    {assessment.timeLimit && <span className="flex items-center gap-1.5"><Icons.Clock className="w-3.5 h-3.5" />{assessment.timeLimit} min</span>}
                    <span className="flex items-center gap-1.5"><Icons.HelpCircle className="w-3.5 h-3.5" />{assessment.questions?.length || 0} questions</span>
                </div>
            </div>
            <div className="p-6 space-y-6">
                {requiresModuleRepeat && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-4">
                        <div className="flex items-start gap-3">
                            <Icons.XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-red-800">{hasResult ? `Attempt ${attemptJustMade} of ${maxAttempts} Failed` : `All ${maxAttempts} Attempts Used`}</p>
                                {hasResult && <p className="text-sm text-red-600 mt-0.5">Score: {(finalAssessmentResult?.score || 0).toFixed(1)}%</p>}
                                <p className="text-sm text-red-700 mt-2">Your progress has been reset. Complete all lessons again to unlock the final assessment.</p>
                            </div>
                        </div>
                        {hasResult && <p className="text-sm text-red-600 flex items-center gap-1.5"><Icons.Clock className="w-4 h-4" />Redirecting in {redirectCountdown}s…</p>}
                        <Button onClick={onGoToLessons} className="w-full bg-red-600 hover:bg-red-700 text-white gap-2">
                            <Icons.BookOpen className="w-4 h-4" />Restart Module
                        </Button>
                    </div>
                )}
                {hasResult && !passed && !requiresModuleRepeat && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                        <Icons.AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-orange-800">Attempt {attemptJustMade} of {maxAttempts} — Score: {(finalAssessmentResult?.score || 0).toFixed(1)}%</p>
                            {displayRemaining > 0 && <p className="text-sm text-orange-700 mt-0.5">{displayRemaining} attempt{displayRemaining !== 1 ? 's' : ''} remaining</p>}
                        </div>
                    </div>
                )}
                {canAttempt && (
                    <div className="space-y-4">
                        {assessment.questions?.map((q, qIdx) => (
                            <QuestionRenderer key={qIdx} question={q} index={qIdx} answer={finalAnswers[qIdx]} onChange={(val) => setFinalAnswers(prev => ({ ...prev, [qIdx]: val }))} />
                        ))}
                        <Button
                            onClick={onSubmit}
                            disabled={submitting || Object.keys(finalAnswers).length < (assessment.questions?.length || 0)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 h-12 text-base"
                        >
                            {submitting ? <Icons.Loader2 className="w-5 h-5 animate-spin" /> : hasResult ? <Icons.RotateCcw className="w-5 h-5" /> : <Icons.Send className="w-5 h-5" />}
                            {hasResult ? `Retry (${displayRemaining} attempt${displayRemaining !== 1 ? 's' : ''} left)` : 'Submit Final Assessment'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Answer evaluation helpers ──────────────────────────────────────────────────
function evaluateStudentAnswer(question, studentAnswer) {
    if (!studentAnswer) return false;
    const ca = question.correctAnswer;
    if (ca === undefined || ca === null || ca === '') return false;
    const options = question.options || [];
    const idx = Number(ca);
    if (!isNaN(idx) && Number.isInteger(idx) && idx >= 0 && idx < options.length) return String(studentAnswer).trim() === String(options[idx]).trim();
    return String(studentAnswer).trim().toLowerCase() === String(ca).trim().toLowerCase();
}
function getCorrectText(question) {
    const ca = question.correctAnswer;
    const options = question.options || [];
    const idx = Number(ca);
    if (!isNaN(idx) && Number.isInteger(idx) && idx >= 0 && idx < options.length) return options[idx];
    return String(ca || '');
}

// ── Question Renderer ──────────────────────────────────────────────────────────
function QuestionRenderer({ question, index, answer, onChange }) {
    const [checked, setChecked] = React.useState(null);
    const isMultipleChoice = question.type === 'multiple-choice' || question.type === 'multiple_choice';
    const isTrueFalse = question.type === 'true-false';
    const isEssay = question.type === 'essay' || question.type === 'short-answer';
    const isChecked = checked !== null;
    const isCorrect = checked?.correct;

    const handleSelect = (val) => {
        onChange(val);
        if (isMultipleChoice || isTrueFalse) setChecked({ correct: evaluateStudentAnswer(question, val), answer: val });
    };

    const questionText = question.question || question.text || '';
    const correctOptionText = isChecked ? getCorrectText(question) : null;

    return (
        <div className={`rounded-xl border-2 p-5 transition-all ${isChecked ? (isCorrect ? 'border-green-300 bg-blue-50' : 'border-red-200 bg-red-50') : 'bg-white border-gray-200'}`}>
            <div className="flex items-start gap-3 mb-4">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white
                    ${isChecked ? (isCorrect ? 'bg-blue-500' : 'bg-red-500') : 'bg-green-600'}`}>
                    {isChecked ? (isCorrect ? '✓' : '✗') : index + 1}
                </span>
                <div className="flex-1">
                    {question.codeSnippet && (
                        <div className="mb-3 rounded-lg overflow-hidden border border-gray-700">
                            <div className="px-3 py-1.5 bg-[#2d2d2d] text-xs text-gray-300 font-mono font-semibold">{question.codeSnippet.language || 'python'}</div>
                            <pre className="bg-[#1e1e1e] text-green-300 text-xs p-3 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">{question.codeSnippet.code}</pre>
                        </div>
                    )}
                    <p className="font-medium text-gray-900">{questionText}</p>
                    {question.points && <span className="text-xs text-gray-400">{question.points} pt{question.points !== 1 ? 's' : ''}</span>}
                </div>
            </div>

            {(isMultipleChoice || isTrueFalse) && (
                <div className={`ml-10 ${isTrueFalse ? 'flex gap-3' : 'space-y-2'}`}>
                    {(isTrueFalse ? ['True', 'False'] : question.options || []).map((option, optIdx) => {
                        const isSelected = answer === option;
                        const isThisCorrect = isChecked && String(option).trim() === String(correctOptionText).trim();
                        const isThisWrong = isChecked && isSelected && !isCorrect;
                        return (
                            <label key={optIdx} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none
                                ${isTrueFalse ? 'flex-1 justify-center' : ''}
                                ${isChecked
                                    ? isThisCorrect ? 'border-green-400 bg-green-100 text-green-900'
                                        : isThisWrong ? 'border-red-400 bg-red-100 text-red-900'
                                            : 'border-gray-200 bg-white text-gray-400 opacity-60'
                                    : isSelected ? 'border-green-600 bg-blue-50 text-green-800' : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}>
                                <input type="radio" name={`q-${index}`} value={option} checked={isSelected} onChange={() => !isChecked && handleSelect(option)} disabled={isChecked} className="accent-green-600 flex-shrink-0" />
                                <span className="text-sm font-medium flex-1">{option}</span>
                                {isChecked && isThisCorrect && <Icons.Check className="w-4 h-4 text-green-600 flex-shrink-0" />}
                                {isChecked && isThisWrong && <Icons.X className="w-4 h-4 text-red-500 flex-shrink-0" />}
                            </label>
                        );
                    })}
                </div>
            )}

            {isEssay && (
                <div className="ml-10 space-y-2">
                    <textarea value={answer || ''} onChange={(e) => !isChecked && onChange(e.target.value)} disabled={isChecked} placeholder="Write your answer here…" rows={4}
                        className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:border-green-500 outline-none resize-none disabled:bg-white disabled:text-gray-500 transition-colors" />
                    {!isChecked && answer && (
                        <Button type="button" size="sm" onClick={() => setChecked({ correct: evaluateStudentAnswer(question, answer), answer })} className="bg-green-600 hover:bg-green-700 text-white">
                            Check Answer
                        </Button>
                    )}
                </div>
            )}

            {isChecked && (
                <div className={`mt-4 ml-10 rounded-xl p-3 border ${isCorrect ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'}`}>
                    <p className={`text-sm font-bold mb-1 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                        {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                        {!isCorrect && correctOptionText && <span className="font-normal text-gray-700 ml-2">Correct answer: <span className="font-semibold text-green-700">{correctOptionText}</span></span>}
                    </p>
                    {question.explanation && <p className="text-sm text-gray-700 leading-relaxed">{question.explanation}</p>}
                </div>
            )}
        </div>
    );
}

// ── Star Rating ────────────────────────────────────────────────────────────────
function StarRatingInput({ value, onChange }) {
    const [hovered, setHovered] = React.useState(0);
    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => onChange(star)} onMouseEnter={() => setHovered(star)} onMouseLeave={() => setHovered(0)} className="focus:outline-none transition-transform hover:scale-110">
                        <Icons.Star className={`w-9 h-9 transition-colors ${star <= (hovered || value) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                    </button>
                ))}
            </div>
            {(hovered || value) > 0 && <span className="text-sm font-semibold text-amber-600">{labels[hovered || value]}</span>}
        </div>
    );
}

// ── Completion Screen ──────────────────────────────────────────────────────────
function CompletionScreen({ enrollment, moduleId, router }) {
    const [showRating, setShowRating] = React.useState(false);
    const [rating, setRating] = React.useState(0);
    const [review, setReview] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);
    const [submitted, setSubmitted] = React.useState(false);
    const [existingRating, setExistingRating] = React.useState(null);

    React.useEffect(() => {
        moduleRatingService.getMyRating(moduleId).then((res) => { if (res?.data) { setExistingRating(res.data); setRating(res.data.rating); setReview(res.data.review || ''); } }).catch(() => { });
    }, [moduleId]);

    const handleSubmitRating = async () => {
        if (rating === 0) return;
        try {
            setSubmitting(true);
            await moduleRatingService.submitRating(moduleId, rating, review);
            setSubmitted(true); setShowRating(false); setExistingRating({ rating, review });
        } catch (err) {
            alert(err?.response?.data?.message || 'Failed to submit rating');
        } finally { setSubmitting(false); }
    };

    return (
        <>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-10 text-center shadow-sm mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-5 shadow-lg">
                    <Icons.Award className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">Module Completed!</h3>
                <p className="text-gray-500 mb-6">Congratulations on finishing this module.</p>
                {enrollment.finalAssessmentScore != null && (
                    <div className="inline-flex items-center gap-2 bg-white border border-green-200 rounded-xl px-5 py-3 mb-6 shadow-sm">
                        <Icons.Trophy className="w-5 h-5 text-amber-500" />
                        <span className="text-sm font-semibold text-gray-700">Final Score: <span className="text-green-700 font-bold">{enrollment.finalAssessmentScore?.toFixed(1)}%</span></span>
                    </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={() => router.push('/student')} variant="outline" className="gap-2">
                        <Icons.Home className="w-4 h-4" /> Back to Dashboard
                    </Button>
                    {!existingRating && !submitted && (
                        <Button onClick={() => setShowRating(true)} className="bg-amber-500 hover:bg-amber-600 text-white gap-2">
                            <Icons.Star className="w-4 h-4" /> Rate this Module
                        </Button>
                    )}
                    {(existingRating || submitted) && (
                        <div className="flex items-center gap-1 justify-center text-amber-500">
                            {[1, 2, 3, 4, 5].map(s => <Icons.Star key={s} className={`w-5 h-5 ${s <= rating ? 'fill-amber-400' : ''}`} />)}
                        </div>
                    )}
                </div>
            </div>

            {showRating && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h4 className="text-base font-bold text-gray-900 mb-5 text-center">Rate this Module</h4>
                    <div className="mb-5 text-center">
                        <p className="text-sm font-semibold text-gray-700 mb-3">How would you rate this module?</p>
                        <StarRatingInput value={rating} onChange={setRating} />
                    </div>
                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Write a review <span className="font-normal text-gray-400">(optional)</span></label>
                        <textarea value={review} onChange={(e) => setReview(e.target.value)} placeholder="Share what you liked or what could be improved…" rows={3} maxLength={1000}
                            className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:border-green-500 outline-none resize-none transition-colors" />
                        <p className="text-xs text-gray-400 text-right mt-1">{review.length}/1000</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setShowRating(false)} className="flex-1">Skip</Button>
                        <Button onClick={handleSubmitRating} disabled={rating === 0 || submitting} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white gap-2">
                            {submitting ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.Send className="w-4 h-4" />}
                            Submit
                        </Button>
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
