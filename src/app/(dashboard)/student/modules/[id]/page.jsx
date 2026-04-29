'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import * as Icons from 'lucide-react';
import moduleService from '@/lib/api/moduleService';
import moduleEnrollmentService from '@/lib/api/moduleEnrollmentService';
import { useEnrollmentProgress } from '@/hooks/useEnrollmentProgress';
import moduleRatingService from '@/lib/api/moduleRatingService';
import Navbar from '@/components/navbar/navbar';
import ProtectedStudentRoute from '@/components/ProtectedStudentRoute';
import LessonViewer from '@/components/student/LessonViewer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { resolveAssetUrl } from '@/lib/utils/resolveAssetUrl';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.elearning.arin-africa.org';

function resolveUrl(url) { return resolveAssetUrl(url); }

// Open or download a resource file
async function openResource(url, fileName, isPdf) {
    const fullUrl = resolveUrl(url);
    if (isPdf) {
        window.open(fullUrl, '_blank', 'noopener,noreferrer');
    } else {
        const a = document.createElement('a');
        a.href = fullUrl;
        a.download = fileName || 'download';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

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
    const raw = typeof res === 'string' ? res : res.url;
    const url = resolveAssetUrl(raw);
    const name = typeof res === 'string' ? res : (res.name || res.originalName || '');
    const ext = (res?.fileType || name || url || '').split('.').pop()?.toLowerCase() || '';
    const isPdf = ext === 'pdf';
    const isCloudinary = url?.includes('cloudinary.com');
    return { url, name, ext, isPdf, isCloudinary };
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
    const searchParams = useSearchParams();
    const openFinalAssessmentOnLoad = searchParams.get('showFinalAssessment') === 'true';
    const lessonParamRaw = searchParams.get('lesson');
    const lessonParam = lessonParamRaw !== null ? parseInt(lessonParamRaw, 10) : null;

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
    // One-shot guard: prevents Fast Refresh from re-triggering auto-submit
    const [autoSubmitted, setAutoSubmitted] = useState(false);
    // Randomized order of questions and their options, re-rolled per attempt
    const [assessmentQuestionOrder, setAssessmentQuestionOrder] = useState([]);
    const [assessmentOptionOrders, setAssessmentOptionOrders] = useState({});

    const [showContentComingSoon, setShowContentComingSoon] = useState(false);
    const [showModuleCompletionScreen, setShowModuleCompletionScreen] = useState(false);

    // UI state
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState('outline');
    const [searchQuery, setSearchQuery] = useState('');
    const [darkMode, setDarkMode] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showIntroVideo, setShowIntroVideo] = useState(false); // shown first only if introVideoUrl exists
    // Show module overview when entering without a ?lesson= deep-link (first visit / clicking from module card)
    const [showModuleOverview, setShowModuleOverview] = useState(lessonParam === null && !openFinalAssessmentOnLoad);
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

    // ── Data fetch ─────────────────────────────────────────────────────────────
    useEffect(() => { if (moduleId) fetchModuleData(); }, [moduleId]);

    const fetchModuleData = async () => {
        try {
            setLoading(true); setError('');
            const [mod, enrollmentData] = await Promise.all([
                moduleService.getModuleById(moduleId),
                moduleEnrollmentService.getMyEnrollmentForModule(moduleId).catch(() => null),
            ]);
            setModuleData(mod);
            setEnrollment(enrollmentData);
            console.log('[ModuleLearning] Module loaded | moduleId=', moduleId, '| enrollmentId=', enrollmentData?._id, '| lastAccessedLesson=', enrollmentData?.lastAccessedLesson);
        } catch (err) {
            setError('Failed to load module');
        } finally { setLoading(false); }
    };

    // ── Server-driven progress (single source of truth) ────────────────────────
    // All completion/accessibility state is derived from this hook.
    // The hook re-fetches from the server after every mutation via refresh().
    const {
        progress: enrollmentProgress,
        loading: progressLoading,
        refresh: refreshProgress,
        isCompleted: isLessonCompleted,
        isAccessible: isLessonAccessibleFromServer,
    } = useEnrollmentProgress(enrollment?._id);

    // Pick which lesson to open whenever progress first loads.
    // Runs once: when both module data and the first progress snapshot are available.
    const progressInitialisedRef = useRef(false);
    useEffect(() => {
        if (!enrollmentProgress || !moduleData || progressInitialisedRef.current) return;
        progressInitialisedRef.current = true;

        const { lessonStates, nextLessonIndex, currentLessonIndex: serverLessonIndex, currentSlideIndex: serverSlideIndex, allLessonsCompleted, requiresModuleRepeat } = enrollmentProgress;

        const completedLessonIds = (lessonStates || []).filter(ls => ls.isCompleted).map(ls => ls.lessonIndex);
        console.log('[ModuleLearning] Progress retrieved from backend:', {
            serverLessonIndex,
            serverSlideIndex,
            nextLessonIndex,
            completedLessons: completedLessonIds,
            allLessonsCompleted,
            lessonStates: (lessonStates || []).map(ls => ({
                index: ls.lessonIndex,
                isCompleted: ls.isCompleted,
                assessmentPassed: ls.assessmentPassed,
                lastAccessedSlide: ls.lastAccessedSlide,
                hasLastAnswers: !!(ls.lastAnswers),
            })),
        });

        const canOpen = (idx) => {
            const state = lessonStates?.[idx];
            return !!(state?.isCompleted || state?.isAccessible);
        };

        // ── Best-position resolver ─────────────────────────────────────────────
        // Priority order (most reliable first):
        //  1. serverLessonIndex (currentLessonIndex from GET /progress) — the
        //     backend already applies the correct priority logic: it returns
        //     lastAccessedLesson when still accessible, else nextLessonIndex.
        //     This is ALWAYS the authoritative resume point.
        //  2. nextLessonIndex — fallback for fresh enrollments with no saved position.
        //  3. Highest lesson in lessonStates with any access history.
        //  4. Lesson 0, slide 0 — absolute fallback for brand-new enrollments.
        const bestPosition = (() => {
            // 1. Backend's authoritative currentLessonIndex/currentSlideIndex
            if (Number.isInteger(serverLessonIndex) && lessonStates?.[serverLessonIndex]) {
                const s = lessonStates[serverLessonIndex];
                const slide = Number.isInteger(serverSlideIndex)
                    ? serverSlideIndex
                    : (s.lastAccessedSlide ?? 0);
                console.log(
                    `[ModuleLearning] bestPosition ← serverLessonIndex=${serverLessonIndex} slide=${slide}`,
                );
                return { lesson: serverLessonIndex, slide };
            }
            // 2. Next accessible incomplete lesson (fresh enrollment with no saved position)
            if (nextLessonIndex != null) {
                const slide = lessonStates?.[nextLessonIndex]?.lastAccessedSlide ?? 0;
                console.log(
                    `[ModuleLearning] bestPosition ← nextLessonIndex=${nextLessonIndex} slide=${slide}`,
                );
                return { lesson: nextLessonIndex, slide };
            }
            // 3. Highest lesson with any access history (scan from end)
            if (Array.isArray(lessonStates)) {
                for (let i = lessonStates.length - 1; i >= 0; i--) {
                    const s = lessonStates[i];
                    if (s?.isAccessible || s?.isCompleted || (s?.lastAccessedSlide ?? 0) > 0) {
                        console.log(`[ModuleLearning] bestPosition ← history scan lesson=${i}`);
                        return { lesson: i, slide: s?.lastAccessedSlide ?? 0 };
                    }
                }
            }
            // 4. Absolute fallback — fresh enrollment with zero progress
            console.log('[ModuleLearning] bestPosition ← fallback lesson=0 slide=0');
            return { lesson: 0, slide: 0 };
        })();

        console.log(
            '[ModuleLearning] bestPosition resolved:', bestPosition,
            '| serverLessonIndex=', serverLessonIndex,
            '| serverSlideIndex=', serverSlideIndex,
            '| nextLessonIndex=', nextLessonIndex,
            '| lessonStates[serverLesson]?.lastAccessedSlide=', lessonStates?.[serverLessonIndex]?.lastAccessedSlide,
        );

        if (lessonParam !== null && !isNaN(lessonParam)) {
            // Cross-check the ?lesson URL hint against authoritative server progress.
            // The dashboard may generate a STALE ?lesson= link when the enrollment
            // list data hasn't refreshed — never let a stale param send the student
            // BACKWARD past where the server says they currently are.
            const paramState = lessonStates?.[lessonParam];
            const paramIsCompleted = !!paramState?.isCompleted;
            const paramIsAccessible = !!paramState?.isAccessible;
            const paramHasHistory = (paramState?.lastAccessedSlide ?? 0) > 0;

            console.log(
                `[ModuleLearning] ?lesson=${lessonParam} | completed=${paramIsCompleted} | accessible=${paramIsAccessible} | hasHistory=${paramHasHistory} | bestPosition.lesson=${bestPosition.lesson}`,
            );

            let resolvedLesson;
            let resolvedSlide;

            if (paramIsCompleted) {
                // Completed lesson in URL (stale link) → advance to current position
                resolvedLesson = bestPosition.lesson;
                resolvedSlide = bestPosition.slide;
                console.log(
                    `[ModuleLearning] ?lesson=${lessonParam} already COMPLETED → using bestPosition lesson=${resolvedLesson} slide=${resolvedSlide}`,
                );
            } else if (paramIsAccessible || paramHasHistory) {
                if (lessonParam < bestPosition.lesson) {
                    // STALE backward link — the student is further ahead; use server position
                    resolvedLesson = bestPosition.lesson;
                    resolvedSlide = bestPosition.slide;
                    console.warn(
                        `[ModuleLearning] ?lesson=${lessonParam} is BEHIND serverLessonIndex=${bestPosition.lesson} → ignoring stale URL, using bestPosition lesson=${resolvedLesson} slide=${resolvedSlide}`,
                    );
                } else {
                    // Accessible in-progress or equal-to-server lesson → restore slide
                    resolvedLesson = lessonParam;
                    resolvedSlide = paramState?.lastAccessedSlide ?? 0;
                    console.log(
                        `[ModuleLearning] ?lesson=${lessonParam} ${paramIsAccessible ? 'accessible' : 'locked-but-visited'} → restoring slide=${resolvedSlide}`,
                    );
                }
            } else {
                // Truly locked with no history → fall back to best known position
                resolvedLesson = bestPosition.lesson;
                resolvedSlide = bestPosition.slide;
                console.log(
                    `[ModuleLearning] ?lesson=${lessonParam} locked with no history → bestPosition lesson=${resolvedLesson} slide=${resolvedSlide}`,
                );
            }

            console.log(`[ModuleLearning] FINAL REDIRECT → lesson=${resolvedLesson} (Lesson ${resolvedLesson + 1}) slide=${resolvedSlide} (Slide ${resolvedSlide + 1})`);
            setCurrentLessonIndex(resolvedLesson);
            setLiveSlideIndex(resolvedSlide);
        } else {
            // No URL param — restore directly from server progress.
            const { lesson: restoredLessonIndex, slide: restoredSlideIndex } = bestPosition;

            // Skip the module overview whenever the student has a saved position
            // so they resume immediately without an extra click.
            if (restoredLessonIndex > 0 || restoredSlideIndex > 0) {
                setShowModuleOverview(false);
                console.log(
                    `[ModuleLearning] Auto-resuming — hiding overview | lessonIndex=${restoredLessonIndex} | slideIndex=${restoredSlideIndex}`,
                );
            }

            console.log(
                `[ModuleLearning] FINAL REDIRECT (no URL param) → lesson=${restoredLessonIndex} (Lesson ${restoredLessonIndex + 1}) slide=${restoredSlideIndex} (Slide ${restoredSlideIndex + 1}) | serverLessonIndex=${serverLessonIndex} | serverSlideIndex=${serverSlideIndex}`,
            );
            setCurrentLessonIndex(restoredLessonIndex);
            setLiveSlideIndex(restoredSlideIndex);
        }

        if (openFinalAssessmentOnLoad && allLessonsCompleted && !requiresModuleRepeat
            && (moduleData?.finalAssessment?.questions?.length ?? 0) > 0) {
            setShowFinalAssessment(true);
        }
    }, [enrollmentProgress, moduleData, lessonParam, openFinalAssessmentOnLoad]); // eslint-disable-line react-hooks/exhaustive-deps

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

    // ── Computed ────────────────────────────────────────────────────────────────
    const lessons = moduleData?.lessons || [];
    const totalLessons = lessons.length;
    const currentLesson = lessons[currentLessonIndex];

    // All completion/accessibility values come from the server via the hook.
    // isLessonCompleted and isLessonAccessibleFromServer are already defined above.
    const isLessonAccessible = useCallback(
        (index) => isLessonAccessibleFromServer(index) || isLessonCompleted(index),
        [isLessonAccessibleFromServer, isLessonCompleted],
    );
    const getLessonProgress = useCallback(
        (lessonIndex) => {
            const state = enrollmentProgress?.lessonStates?.[lessonIndex];
            if (!state) return null;
            return {
                isCompleted: !!state.isCompleted,
                assessmentAttempts: state.assessmentAttempts ?? 0,
                assessmentPassed: !!state.assessmentPassed,
                lastAccessedSlide: state.lastAccessedSlide ?? 0,
                lastAnswers: state.lastAnswers ?? null,
            };
        },
        [enrollmentProgress],
    );
    const initialSlideForCurrentLesson = Math.max(
        0,
        Math.min(
            getLessonProgress(currentLessonIndex)?.lastAccessedSlide ?? liveSlideIndex ?? 0,
            Math.max(0, (currentLesson?.slides?.length || 1) - 1),
        ),
    );
    // This log fires on every render — useful to confirm what slide LessonViewer opens with
    if (typeof window !== 'undefined' && currentLesson) {
        console.log(
            `[ModuleLearning] LessonViewer will open | lesson=${currentLessonIndex} (Lesson ${currentLessonIndex + 1}) | initialSlide=${initialSlideForCurrentLesson} (Slide ${initialSlideForCurrentLesson + 1}) | liveSlideIndex=${liveSlideIndex} | lastAccessedSlide(server)=${getLessonProgress(currentLessonIndex)?.lastAccessedSlide ?? 'none'} | assessmentPassed=${getLessonProgress(currentLessonIndex)?.assessmentPassed ?? false} | hasLastAnswers=${!!(getLessonProgress(currentLessonIndex)?.lastAnswers)}`,
        );
    }

    const moveToNextLesson = useCallback((freshProgress) => {
        if (!lessons.length) return;

        if (freshProgress?.allLessonsCompleted && !freshProgress?.requiresModuleRepeat) {
            if ((moduleData?.finalAssessment?.questions?.length ?? 0) > 0) {
                setShowFinalAssessment(true);
            } else {
                setShowContentComingSoon(false);
                setShowModuleCompletionScreen(true);
            }
            return;
        }

        const minForwardIndex = Math.min(currentLessonIndex + 1, Math.max(lessons.length - 1, 0));
        const suggestedIndex = Number.isInteger(freshProgress?.nextLessonIndex)
            ? freshProgress.nextLessonIndex
            : minForwardIndex;
        const nextForwardIndex = Math.max(minForwardIndex, suggestedIndex);

        if (nextForwardIndex < lessons.length && nextForwardIndex !== currentLessonIndex) {
            setCurrentLessonIndex(nextForwardIndex);
            setLiveSlideIndex(0);
            // Write lastAccessedLesson to the DB immediately so that if the student
            // closes the browser right after advancing, they resume at the new lesson
            // (not the completed one) on next login.
            if (enrollment?._id) {
                console.log(
                    `[ModuleLearning] moveToNextLesson → saving lastAccessedLesson=${nextForwardIndex} to backend`,
                );
                moduleEnrollmentService
                    .trackSlideProgress(enrollment._id, nextForwardIndex, 0, 0, false)
                    .catch(() => { });
            }
        } else if ((moduleData?.finalAssessment?.questions?.length ?? 0) > 0) {
            setShowFinalAssessment(true);
        } else {
            setShowContentComingSoon(false);
            setShowModuleCompletionScreen(true);
        }
    }, [currentLessonIndex, lessons.length, moduleData?.finalAssessment, enrollment?._id]);

    // Progress numbers — always from the server snapshot, never derived locally.
    const completedCount = enrollmentProgress?.completedLessons ?? 0;
    const allLessonsCompleted = enrollmentProgress?.allLessonsCompleted ?? false;
    const safeProgress = enrollmentProgress?.progress ?? 0;

    // Only true when the module actually has assessment questions to answer.
    const hasFinalAssessment = (moduleData?.finalAssessment?.questions?.length ?? 0) > 0;

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

    // ── Lesson / assessment handlers ────────────────────────────────────────────
    // Pattern for every mutation:
    //  1. Call the API
    //  2. Call refreshProgress() — re-fetches the authoritative state from the DB
    //  3. Derive navigation from the fresh server response
    // NEVER use the stale enrollment object from the mutation's response to update
    // completion state — that document snapshot may be out of date.

    const handleCompleteLesson = async () => {
        if (!enrollment) return;
        try {
            setCompleting(true);
            // completeLesson now returns fresh progress (same shape as GET /progress)
            const freshProgress = await moduleEnrollmentService.completeLesson(enrollment._id, currentLessonIndex);
            // Sync the hook's state with the server response immediately
            await refreshProgress();

            const lesson = lessons[currentLessonIndex];
            const lessonState = freshProgress?.lessonStates?.[currentLessonIndex];

            // If this lesson has a quiz and it hasn't been passed yet, show the quiz
            if (lesson?.assessmentQuiz?.length > 0 && !lessonState?.assessmentPassed) {
                setShowLessonAssessment(true);
                return;
            }

            moveToNextLesson(freshProgress);
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

            // Always re-fetch authoritative state after a quiz submission
            await refreshProgress();

            if (result.passed) {
                setShowLessonAssessment(false); setLessonAssessmentResult(null); setLessonAnswers({});
                if (result.navigateTo === 'final_assessment') setShowFinalAssessment(true);
                else if (result.navigateTo === 'next_lesson' && result.nextLessonIndex != null) {
                    const nextForwardIndex = Math.max(currentLessonIndex + 1, result.nextLessonIndex);
                    if (nextForwardIndex < totalLessons) setCurrentLessonIndex(nextForwardIndex);
                }
            } else {
                setLessonAssessmentResult(result); setLessonAnswers({});
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit assessment');
        } finally { setSubmittingAssessment(false); }
    };

    // Fisher-Yates shuffle — returns a new shuffled array, does not mutate
    const shuffleArray = (arr) => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };

    const initAssessmentOrder = (questions) => {
        if (!questions || questions.length === 0) return;
        const qOrder = shuffleArray(questions.map((_, i) => i));
        const optOrders = {};
        questions.forEach((q, i) => {
            if ((q.type === 'multiple-choice' || q.type === 'multiple_choice') && q.options?.length > 1) {
                optOrders[i] = shuffleArray(q.options.map((_, oi) => oi));
            }
        });
        setAssessmentQuestionOrder(qOrder);
        setAssessmentOptionOrders(optOrders);
    };

    // When the final assessment panel opens: re-roll question order AND refresh the
    // enrollment object so the backend's allLessonsCompleted check passes.
    useEffect(() => {
        if (showFinalAssessment && !finalAssessmentResult) {
            initAssessmentOrder(moduleData?.finalAssessment?.questions);
            // Refresh enrollment — the backend's submitFinalAssessment checks
            // enrollment.allLessonsCompleted; if this field wasn't synced yet the
            // submission returns 400. A fresh fetch ensures we have the latest state.
            if (moduleId) {
                moduleEnrollmentService.getMyEnrollmentForModule(moduleId)
                    .then(fresh => { if (fresh) setEnrollment(fresh); })
                    .catch(() => { });
            }
        }
    }, [showFinalAssessment]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSubmitFinalAssessment = async () => {
        if (!enrollment) return;
        try {
            setSubmittingAssessment(true);
            const answers = Object.entries(finalAnswers).map(([idx, val]) => ({ questionIndex: parseInt(idx), answer: String(val) }));

            // ── Pre-submit answer summary ──────────────────────────────────────────
            const allQs = moduleData?.finalAssessment?.questions || [];
            console.group('[FinalAssessment] ── Submitting Assessment ──');
            console.log(`Attempt: ${(enrollment.finalAssessmentAttempts || 0) + 1} / ${moduleData?.finalAssessment?.maxAttempts || 3}`);
            console.log(`Questions: ${allQs.length} total | Answers collected: ${answers.length}`);
            console.groupCollapsed('Per-question answer preview (client-side evaluation)');
            answers.forEach(({ questionIndex, answer }) => {
                const q = allQs[questionIndex];
                if (!q) { console.warn(`Q${questionIndex + 1}: question not found`); return; }
                const correctText = resolveCorrectOptionText(q);
                const clientGuess = String(answer).trim().toLowerCase() === correctText.trim().toLowerCase();
                console.log(
                    `Q${questionIndex + 1} [${clientGuess ? '✅' : '❌'}]`,
                    '| Selected:', `"${answer}"`,
                    '| Expected:', `"${correctText}"`,
                    '| Raw stored correctAnswer:', q.correctAnswer,
                );
            });
            console.groupEnd();
            console.groupEnd();

            const result = await moduleEnrollmentService.submitFinalAssessment(enrollment._id, answers);

            // ── Server result ──────────────────────────────────────────────────────
            console.group('[FinalAssessment] ── Server Result ──');
            console.log(`Score: ${result?.score?.toFixed(1)}% | Passed: ${result?.passed} | Passing bar: ${moduleData?.finalAssessment?.passingScore || 70}%`);
            console.log(`Remaining attempts: ${result?.remainingAttempts ?? 'n/a'}`);
            if (result?.results?.length) {
                console.groupCollapsed('Per-question server comparison');
                result.results.forEach(r => {
                    console.log(
                        `Q${r.questionIndex + 1} [${r.isCorrect ? '✅' : '❌'}]`,
                        '| Student:', `"${r.studentAnswer}"`,
                        '| Correct:', `"${r.correctAnswer}"`,
                        '| Points:', r.pointsEarned,
                    );
                });
                console.groupEnd();
            }
            console.groupEnd();
            setFinalAssessmentResult(result);
            // Re-fetch progress and enrollment to get updated attempts, isCompleted, etc.
            await refreshProgress();
            moduleEnrollmentService.getMyEnrollmentForModule(moduleId)
                .then(fresh => { if (fresh) setEnrollment(fresh); })
                .catch(() => { });
        } catch (err) {
            const msg = err.response?.data?.message || '';
            const isLessonsIncomplete = /complete all lessons/i.test(msg);

            await refreshProgress();
            const freshEnrollment = await moduleEnrollmentService.getMyEnrollmentForModule(moduleId).catch(() => null);
            if (freshEnrollment) setEnrollment(freshEnrollment);

            if (isLessonsIncomplete) {
                // Backend says lessons are incomplete. With the backend now recomputing
                // from lessonProgress, this should only fire if lessons are genuinely not
                // done. Answers are preserved so the student can retry via the Submit button.
                console.warn('[FinalAssessment] "Complete all lessons" error received — answers preserved, student must retry manually.');
            } else {
                // Generic error — clear answers and re-randomize for a clean retry.
                setFinalAnswers({});
                initAssessmentOrder(moduleData?.finalAssessment?.questions);
                alert(msg || 'Failed to submit assessment. Please try again.');
            }
        } finally { setSubmittingAssessment(false); }
    };

    // Auto-submit lesson assessment (non-slide path) when all questions answered
    useEffect(() => {
        if (!showLessonAssessment || submittingAssessment || lessonAssessmentResult) return;
        const questions = currentLesson?.assessment?.questions || [];
        if (questions.length === 0) return;
        const allAnswered = questions.every((_, i) => lessonAnswers[i] !== undefined && String(lessonAnswers[i]).trim() !== '');
        if (allAnswered) handleSubmitLessonAssessment();
    }, [lessonAnswers]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-submit final assessment the moment all questions are answered.
    // autoSubmitted guards against Fast Refresh re-firing this effect while
    // submittingAssessment is false (state is reset on hot reload).
    useEffect(() => {
        if (!showFinalAssessment || submittingAssessment || finalAssessmentResult || autoSubmitted) return;
        const questions = moduleData?.finalAssessment?.questions || [];
        if (questions.length === 0) return;
        const allAnswered = questions.every((_, i) => finalAnswers[i] !== undefined && String(finalAnswers[i]).trim() !== '');
        if (allAnswered) { setAutoSubmitted(true); handleSubmitFinalAssessment(); }
    }, [finalAnswers]); // eslint-disable-line react-hooks/exhaustive-deps

    const navigateToLesson = (index) => {
        if (!isLessonAccessible(index) && !isLessonCompleted(index)) return;
        const lp = enrollmentProgress?.lessonStates?.[index];
        const restoredSlide = lp?.lastAccessedSlide ?? 0;
        console.log(
            `[ModuleLearning] Sidebar lesson click | lessonIndex=${index} | restoredSlide=${restoredSlide} | isCompleted=${!!lp?.isCompleted} | assessmentPassed=${!!lp?.assessmentPassed}`,
        );
        setCurrentLessonIndex(index);
        setLiveSlideIndex(restoredSlide);
        setShowFinalAssessment(false);
        setShowLessonAssessment(false);
        setShowModuleOverview(false);
        setShowIntroVideo(false);
        setLessonAssessmentResult(null);
        setLessonAnswers({});
        if (window.innerWidth < 1024) setSidebarCollapsed(true);

        // Persist lastAccessedLesson to backend by pinging slide progress at slide 0
        // (slide 0 is always safe; actual slide is restored by LessonViewer via initialSlideIndex)
        if (enrollment?._id) {
            moduleEnrollmentService.trackSlideProgress(enrollment._id, index, restoredSlide, 0, false)
                .catch(() => { }); // fire-and-forget, non-blocking
        }
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
                            <Icons.FileText className="w-3.5 h-3.5 flex-shrink-0" />
                            Resources
                            {allResources.length > 0 && (
                                <span
                                    title={`${allResources.length} resource${allResources.length !== 1 ? 's' : ''} available`}
                                    className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center bg-emerald-500 text-white leading-none"
                                >
                                    {allResources.length}
                                </span>
                            )}
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
                            {/* Module Overview entry */}
                            <div className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                <button
                                    onClick={() => { setShowModuleOverview(true); setShowFinalAssessment(false); setShowIntroVideo(false); if (window.innerWidth < 1024) setSidebarCollapsed(true); }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors
                                        ${showModuleOverview
                                            ? darkMode ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-[#021d49]'
                                            : darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icons.LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                                    Module Overview
                                </button>
                            </div>
                            {/* Intro Video entry */}
                            {moduleData?.introVideoUrl && (
                                <div className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                    <button
                                        onClick={() => { setShowIntroVideo(true); setShowModuleOverview(false); setShowFinalAssessment(false); if (window.innerWidth < 1024) setSidebarCollapsed(true); }}
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

                            {/* Final Assessment — only shown when the module has questions */}
                            {hasFinalAssessment && (
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
                                        <Icons.Trophy className="w-4 h-4 text-green-600" />
                                        Final Assessment
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        {enrollmentProgress?.finalAssessmentPassed
                                            ? <Icons.CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                            : allLessonsCompleted
                                                ? <Icons.ChevronRight className="w-3.5 h-3.5 text-green-500" />
                                                : <Icons.Lock className="w-3.5 h-3.5 text-gray-400" />
                                        }
                                    </div>
                                </button>
                            </div>
                            )}

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

                            {/* Empty module state */}
                            {lessons.length === 0 && !progressLoading && (
                                <div className={`py-10 text-center px-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <Icons.BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                    <p className="text-sm font-medium">Content coming soon</p>
                                    <p className="text-xs mt-1">Lessons for this module haven't been added yet.</p>
                                </div>
                            )}

                            {/* Lesson list */}
                            {filteredLessons.map(({ lesson, idx }) => {
                                const completed = isLessonCompleted(idx);
                                const accessible = isLessonAccessible(idx);
                                const isCurrent = idx === currentLessonIndex && !showFinalAssessment;
                                const locked = !accessible && !completed;
                                // Slide progress: use the server-side lessonState for completed count
                                const lessonState = enrollmentProgress?.lessonStates?.[idx];
                                const totalSlides = lesson.slides?.length || 0;
                                const completedSlideCount = completed ? totalSlides : 0;
                                // If this is the active lesson, show live slide position
                                const displayedSlideCount = completed
                                    ? totalSlides
                                    : isCurrent ? liveSlideIndex + 1 : completedSlideCount;

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
                                            <p className={`text-sm leading-snug break-words ${isCurrent ? `font-bold ${darkMode ? 'text-[#93c5fd]' : 'text-[#021d49]'}`
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
                                            const { url, name, ext, isPdf, isCloudinary } = resourceHref(res);
                                            if (!url) return null;
                                            const colors = fileIconColor(ext);
                                            const handleClick = async (e) => {
                                                e.preventDefault();
                                                try { await openResource(url, name, isPdf); } catch { window.open(url, '_blank', 'noopener,noreferrer'); }
                                            };
                                            return (
                                                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                                    onClick={handleClick}
                                                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all group cursor-pointer
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
                            {showModuleOverview ? moduleData?.title || 'Module Overview' : showIntroVideo && moduleData?.introVideoUrl ? 'Module Introduction' : showFinalAssessment ? 'Final Assessment' : currentLesson?.title || `Lesson ${currentLessonIndex + 1}`}
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

                    {/* ── MODULE OVERVIEW ── */}
                    {showModuleOverview && !showFinalAssessment && (
                        <ModuleOverviewPanel
                            module={moduleData}
                            lessons={lessons}
                            completedLessonIndices={new Set(
                                (enrollmentProgress?.lessonStates || [])
                                    .filter(state => state?.isCompleted)
                                    .map(state => state.lessonIndex),
                            )}
                            progress={safeProgress}
                            completedCount={completedCount}
                            totalLessons={totalLessons}
                            darkMode={darkMode}
                            onBeginLearning={() => {
                                setShowModuleOverview(false);
                                if (moduleData?.introVideoUrl) {
                                    setShowIntroVideo(true);
                                }
                            }}
                            onGoToLesson={(idx) => {
                                setShowModuleOverview(false);
                                navigateToLesson(idx);
                            }}
                        />
                    )}

                    {/* ── INTRO VIDEO ── */}
                    {!showModuleOverview && showIntroVideo && moduleData?.introVideoUrl && !showFinalAssessment && (
                        <div className={`flex-1 flex flex-col items-center justify-center overflow-y-auto px-4 py-8 ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
                            <div className="w-full max-w-3xl space-y-5">
                                <div>
                                    <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>Module Introduction</p>
                                    <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{moduleData.title}</h2>
                                    {moduleData.description && (
                                        <p className={`text-sm mt-1 line-clamp-3 break-words overflow-hidden ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {moduleData.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}
                                        </p>
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
                    {!showModuleOverview && !showIntroVideo && showFinalAssessment && (
                        <div
                            ref={(el) => {
                                // Scroll to top whenever a result arrives so the student
                                // immediately sees the pass/fail banner, not the mid-question list.
                                if (el && finalAssessmentResult) el.scrollTop = 0;
                            }}
                            className={`flex-1 overflow-y-auto ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}
                        >
                            <div className="max-w-3xl mx-auto px-4 py-8">
                                {/* Show CompletionScreen when:
                                    (a) user clicked "Continue" after passing, OR
                                    (b) revisiting after having already completed the module (no fresh result) */}
                                {(showModuleCompletionScreen || (enrollment?.isCompleted && enrollment?.finalAssessmentPassed && !finalAssessmentResult)) ? (
                                    <CompletionScreen enrollment={enrollment} moduleId={moduleData._id} module={moduleData} router={router} />
                                ) : (
                                    <FinalAssessmentPanel
                                        module={moduleData}
                                        enrollment={enrollment}
                                        finalAnswers={finalAnswers}
                                        setFinalAnswers={setFinalAnswers}
                                        finalAssessmentResult={finalAssessmentResult}
                                        submitting={submittingAssessment}
                                        questionOrder={assessmentQuestionOrder}
                                        optionOrders={assessmentOptionOrders}
                                        onSubmit={handleSubmitFinalAssessment}
                                        onGoToLessons={() => { setShowFinalAssessment(false); setCurrentLessonIndex(0); setFinalAnswers({}); setFinalAssessmentResult(null); setAutoSubmitted(false); setShowModuleCompletionScreen(false); }}
                                        onRetry={() => { setFinalAnswers({}); setFinalAssessmentResult(null); setAutoSubmitted(false); initAssessmentOrder(moduleData?.finalAssessment?.questions); }}
                                        onComplete={() => setShowModuleCompletionScreen(true)}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── CONTENT COMING SOON ── */}
                    {/* Modules without a final assessment complete as soon as all lessons are done. */}
                    {!showModuleOverview && !showIntroVideo && !showFinalAssessment && !showContentComingSoon && showModuleCompletionScreen && allLessonsCompleted && !hasFinalAssessment && (
                        <div className={`flex-1 overflow-y-auto ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
                            <div className="max-w-3xl mx-auto px-4 py-8">
                                <CompletionScreen
                                    enrollment={{ ...(enrollment || {}), isCompleted: true }}
                                    moduleId={moduleData._id}
                                    module={moduleData}
                                    router={router}
                                />
                            </div>
                        </div>
                    )}

                    {!showModuleOverview && !showIntroVideo && !showFinalAssessment && showContentComingSoon && (
                        <div className={`flex-1 flex flex-col items-center justify-center px-6 py-16 text-center ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${darkMode ? 'bg-gray-800' : 'bg-blue-50'}`}>
                                <Icons.Clock className={`w-10 h-10 ${darkMode ? 'text-blue-400' : 'text-[#021d49]'}`} />
                            </div>
                            <h2 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                You're all caught up!
                            </h2>
                            <p className={`text-sm mb-2 max-w-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                You've completed all available lessons in this module.
                            </p>
                            <p className={`text-sm font-semibold max-w-sm ${darkMode ? 'text-blue-400' : 'text-[#021d49]'}`}>
                                Content coming soon — check back later for new lessons.
                            </p>
                            <button
                                onClick={() => { setShowContentComingSoon(false); setCurrentLessonIndex(0); }}
                                className="mt-8 px-6 py-2.5 rounded-xl bg-[#021d49] hover:bg-[#032a66] text-white text-sm font-semibold transition-all"
                            >
                                Review Lessons
                            </button>
                        </div>
                    )}

                    {/* ── FINAL ASSESSMENT CTA BANNER (shown when all lessons done, assessment not yet passed) ── */}
                    {!showModuleOverview && !showIntroVideo && !showFinalAssessment && !showContentComingSoon && allLessonsCompleted && hasFinalAssessment && !enrollment?.finalAssessmentPassed && (
                        <div className="px-4 pt-4 flex-shrink-0">
                            <div className="max-w-3xl mx-auto">
                                <button
                                    onClick={() => { setShowFinalAssessment(true); setShowLessonAssessment(false); }}
                                    className="w-full flex items-center gap-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-2xl px-5 py-4 shadow-lg transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                                        <Icons.Trophy className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-bold text-base">All lessons complete — Take your Final Assessment!</p>
                                        <p className="text-green-100 text-sm mt-0.5">Click here to start. You have up to {moduleData.finalAssessment.maxAttempts || 3} attempts.</p>
                                    </div>
                                    <Icons.ChevronRight className="w-6 h-6 text-white/70 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── LESSON VIEW ── */}
                    {!showModuleOverview && !showIntroVideo && !showFinalAssessment && !showContentComingSoon && !showModuleCompletionScreen && currentLesson && (
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
                                        initialSlideIndex={initialSlideForCurrentLesson}
                                        isAlreadyCompleted={isLessonCompleted(currentLessonIndex)}
                                        assessmentPassed={getLessonProgress(currentLessonIndex)?.assessmentPassed ?? false}
                                        lastAnswers={getLessonProgress(currentLessonIndex)?.lastAnswers ?? null}
                                        darkMode={darkMode}
                                        onSlideChange={(idx) => {
                                            setLiveSlideIndex(idx);
                                            // Persist position immediately on every slide change.
                                            // This guarantees the exact slide is always written even
                                            // if the student closes the browser right after.
                                            console.log(
                                                `[ModuleLearning] onSlideChange FIRED → saving to backend | lessonId=${currentLessonIndex} (Lesson ${currentLessonIndex + 1}) | slideIndex=${idx} (Slide ${idx + 1}) | enrollmentId=${enrollment?._id}`,
                                            );
                                            if (enrollment?._id) {
                                                moduleEnrollmentService
                                                    .trackSlideProgress(enrollment._id, currentLessonIndex, idx, 0, false)
                                                    .then(() => console.log(`[ModuleLearning] Slide position SAVED ✓ | lesson=${currentLessonIndex + 1} slide=${idx + 1}`))
                                                    .catch((err) => console.error(`[ModuleLearning] Slide position SAVE FAILED ✗ | lesson=${currentLessonIndex + 1} slide=${idx + 1} | error=`, err?.message));
                                            }
                                        }}
                                        onLessonComplete={async () => {
                                            console.log(
                                                `[ModuleLearning] onLessonComplete | completing lesson=${currentLessonIndex + 1} | enrollmentId=${enrollment._id}`,
                                            );
                                            try {
                                                const freshProgress = await moduleEnrollmentService.completeLesson(enrollment._id, currentLessonIndex);
                                                console.log(
                                                    `[ModuleLearning] Lesson ${currentLessonIndex + 1} marked complete ✓ | nextLessonIndex=${freshProgress?.nextLessonIndex} | allDone=${freshProgress?.allLessonsCompleted}`,
                                                );
                                                await refreshProgress();
                                                setLiveSlideIndex(0);
                                                moveToNextLesson(freshProgress);
                                            } catch (err) {
                                                console.error('[ModuleLearning] completeLesson FAILED ✗ | lesson=', currentLessonIndex + 1, '| error=', err?.response?.data?.message || err?.message);
                                                await refreshProgress();
                                                setLiveSlideIndex(0);
                                                if (currentLessonIndex < totalLessons - 1) setCurrentLessonIndex(currentLessonIndex + 1);
                                            }
                                        }}
                                        onAssessmentComplete={async (result) => {
                                            console.log(
                                                `[ModuleLearning] onAssessmentComplete | lesson=${currentLessonIndex + 1} | passed=${result?.passed} | score=${result?.score}% | refreshing progress from backend`,
                                            );
                                            await refreshProgress();
                                        }}
                                        onLessonReset={async () => {
                                            // Quiz attempts exhausted — re-sync progress from server
                                            await refreshProgress();
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
                                                <div className={`prose prose-sm max-w-none break-words overflow-hidden mt-2 ${darkMode ? 'prose-invert text-gray-400' : 'text-gray-500'}`}
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
                                                        const { url, name, ext, isPdf, isCloudinary } = resourceHref(res);
                                                        if (!url) return null;
                                                        const colors = fileIconColor(ext);
                                                        const handleClick = async (e) => {
                                                            if (!isCloudinary) return;
                                                            e.preventDefault();
                                                            try { await openResource(url, name, isPdf); } catch { window.open(url, '_blank', 'noopener,noreferrer'); }
                                                        };
                                                        return (
                                                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                                                                onClick={handleClick}
                                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all group cursor-pointer ${darkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-white'}`}
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
                                                    ) : allLessonsCompleted && hasFinalAssessment ? (
                                                        <Button onClick={() => { setShowFinalAssessment(true); setShowLessonAssessment(false); }}
                                                            className="bg-green-600 hover:bg-green-700 text-white gap-2">
                                                            <Icons.Trophy className="w-4 h-4" /> Final Assessment
                                                        </Button>
                                                    ) : allLessonsCompleted ? (
                                                        <Button onClick={() => setShowModuleCompletionScreen(true)}
                                                            className="bg-green-600 hover:bg-green-700 text-white gap-2">
                                                            <Icons.CheckCircle className="w-4 h-4" /> Module Complete
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

// ── Module Overview Panel ──────────────────────────────────────────────────────
function ModuleOverviewPanel({ module: mod, lessons, completedLessonIndices, progress, completedCount, totalLessons, darkMode, onBeginLearning, onGoToLesson }) {
    const stripHtmlLocal = (html) => {
        if (!html) return '';
        return String(html)
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ')
            .trim();
    };

    const dm = darkMode;
    const hasAnyProgress = completedCount > 0;
    const allDone = totalLessons > 0 && completedCount >= totalLessons;
    const nextLessonIndex = (() => {
        for (let i = 0; i < totalLessons; i++) {
            if (!completedLessonIndices.has(i)) return i;
        }
        return 0;
    })();

    const infoSections = [
        { key: 'learningObjectives', label: 'Learning Objectives', icon: 'Target', accent: 'text-blue-600', dot: 'bg-blue-500' },
        { key: 'learningOutcomes', label: 'Expected Outcomes', icon: 'GraduationCap', accent: 'text-emerald-600', dot: 'bg-emerald-500' },
        { key: 'moduleTopics', label: 'Module Content', icon: 'BookOpen', accent: 'text-violet-600', dot: 'bg-violet-500' },
        { key: 'coreReadingMaterials', label: 'Core Reading Materials', icon: 'BookMarked', accent: 'text-amber-600', dot: 'bg-amber-500' },
        { key: 'capstone', label: 'Capstone Project', icon: 'Sparkles', accent: 'text-rose-600', dot: 'bg-rose-500' },
    ].filter(s => stripHtmlLocal(mod?.[s.key]));

    const levelVariant = { beginner: 'secondary', intermediate: 'outline', advanced: 'destructive' }[mod?.level] || 'secondary';
    const levelClass = {
        beginner: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50',
        intermediate: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50',
        advanced: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50',
    }[mod?.level] || 'bg-gray-100 text-gray-600 border-gray-200';

    const base = dm
        ? { bg: 'bg-gray-950', card: 'bg-gray-900 border-gray-800', muted: 'bg-gray-800', text: 'text-gray-100', sub: 'text-gray-400', border: 'border-gray-800' }
        : { bg: 'bg-slate-50', card: 'bg-white border-gray-200', muted: 'bg-slate-50', text: 'text-gray-900', sub: 'text-gray-500', border: 'border-gray-100' };

    return (
        <ScrollArea className={`flex-1 h-full ${base.bg}`}>
            <div className="max-w-3xl mx-auto px-5 py-8 space-y-5">

                {/* ── Hero card ── */}
                <Card className={`border shadow-sm ${base.card}`}>
                    <CardContent className="p-6">
                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <Badge className={`capitalize text-xs font-semibold px-2.5 py-0.5 border ${levelClass}`}>
                                {mod?.level || 'beginner'}
                            </Badge>
                            {mod?.duration && (
                                <Badge variant="outline" className={`gap-1 text-xs font-medium ${dm ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-500'}`}>
                                    <Icons.Clock className="w-3 h-3" />{mod.duration}
                                </Badge>
                            )}
                            {totalLessons > 0 && (
                                <Badge variant="outline" className={`gap-1 text-xs font-medium ${dm ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-500'}`}>
                                    <Icons.BookOpen className="w-3 h-3" />{totalLessons} lesson{totalLessons !== 1 ? 's' : ''}
                                </Badge>
                            )}
                            {allDone && (
                                <Badge className="gap-1 text-xs bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                                    <Icons.CheckCircle2 className="w-3 h-3" />Completed
                                </Badge>
                            )}
                        </div>

                        {/* Title */}
                        <h1 className={`text-2xl font-bold leading-tight tracking-tight mb-3 ${base.text} break-words`}>
                            {mod?.title}
                        </h1>

                        {/* Description */}
                        {mod?.description && (
                            <p className={`text-sm leading-relaxed break-words overflow-hidden whitespace-pre-wrap ${base.sub}`}>
                                {stripHtmlLocal(mod.description)}
                            </p>
                        )}

                        {/* Progress bar */}
                        {hasAnyProgress && (
                            <>
                                <Separator className={`my-4 ${base.border}`} />
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs font-semibold uppercase tracking-wide ${base.sub}`}>Your Progress</span>
                                        <span className={`text-xs font-bold tabular-nums ${base.text}`}>{completedCount} / {totalLessons} lessons · {progress}%</span>
                                    </div>
                                    <Progress value={progress} className="h-2" />
                                </div>
                            </>
                        )}

                        {/* CTA buttons */}
                        <div className="flex flex-col sm:flex-row gap-2 mt-5">
                            <Button
                                onClick={() => onGoToLesson(nextLessonIndex)}
                                className="flex-1 gap-2 bg-[#021d49] hover:bg-[#032a66] text-white font-semibold"
                            >
                                <Icons.Play className="w-4 h-4" />
                                {allDone ? 'Review Module' : hasAnyProgress ? `Continue — Lesson ${nextLessonIndex + 1}` : 'Begin Learning'}
                            </Button>
                            {mod?.introVideoUrl && (
                                <Button
                                    variant="outline"
                                    onClick={onBeginLearning}
                                    className={`flex-1 gap-2 ${dm ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : ''}`}
                                >
                                    <Icons.PlayCircle className="w-4 h-4 text-emerald-600" /> Watch Intro
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* ── Audience + Prerequisites ── */}
                {(mod?.targetAudience?.length > 0 || mod?.prerequisites?.length > 0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {mod?.targetAudience?.length > 0 && (
                            <Card className={`border shadow-sm ${base.card}`}>
                                <CardHeader className="pb-2 pt-4 px-5">
                                    <div className="flex items-center gap-2">
                                        <Icons.Users className={`w-4 h-4 text-blue-500`} />
                                        <span className={`text-xs font-bold uppercase tracking-wider ${base.sub}`}>Who This Is For</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-5 pb-4 pt-1">
                                    <ul className="space-y-2">
                                        {mod.targetAudience.map((item, i) => (
                                            <li key={i} className={`flex items-start gap-2 text-sm leading-snug ${base.text}`}>
                                                <Icons.CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                <span className="flex-1">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                        {mod?.prerequisites?.length > 0 && (
                            <Card className={`border shadow-sm ${base.card}`}>
                                <CardHeader className="pb-2 pt-4 px-5">
                                    <div className="flex items-center gap-2">
                                        <Icons.ListChecks className={`w-4 h-4 text-amber-500`} />
                                        <span className={`text-xs font-bold uppercase tracking-wider ${base.sub}`}>Prerequisites</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-5 pb-4 pt-1">
                                    <ul className="space-y-2">
                                        {mod.prerequisites.map((item, i) => (
                                            <li key={i} className={`flex items-start gap-2 text-sm leading-snug ${base.text}`}>
                                                <Icons.Dot className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0" />
                                                <span className="flex-1">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* ── Rich text info sections ── */}
                {infoSections.length > 0 && (
                    <Card className={`border shadow-sm ${base.card}`}>
                        <CardContent className="p-0 divide-y ${base.border}">
                            {infoSections.map(({ key, label, icon, accent, dot }, idx) => {
                                const IconComp = Icons[icon];
                                const content = mod?.[key];
                                const isHtml = /<[a-z][\s\S]*>/i.test(content);
                                return (
                                    <div key={key} className="px-6 py-5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                                            {IconComp && <IconComp className={`w-4 h-4 flex-shrink-0 ${accent}`} />}
                                            <span className={`text-xs font-bold uppercase tracking-wider ${base.sub}`}>{label}</span>
                                        </div>
                                        {isHtml ? (
                                            <div className={`prose prose-sm max-w-none
                                                prose-p:leading-relaxed prose-p:my-1.5
                                                prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1.5
                                                prose-li:leading-relaxed prose-li:my-0.5
                                                prose-ul:my-2 prose-ol:my-2
                                                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                                                ${dm ? 'prose-invert prose-p:text-gray-300 prose-li:text-gray-300' : 'prose-slate prose-p:text-gray-700'}`}
                                                dangerouslySetInnerHTML={{ __html: content }}
                                            />
                                        ) : (
                                            <p className={`text-sm leading-relaxed ${dm ? 'text-gray-300' : 'text-gray-700'} break-words`}>{content}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                )}

                {/* ── Lesson list ── */}
                {lessons.length > 0 && (
                    <Card className={`border shadow-sm ${base.card}`}>
                        <CardHeader className="pb-0 pt-5 px-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Icons.LayoutList className={`w-4 h-4 ${dm ? 'text-gray-400' : 'text-gray-500'}`} />
                                    <span className={`text-xs font-bold uppercase tracking-wider ${base.sub}`}>Lessons</span>
                                </div>
                                <Badge variant="outline" className={`text-xs ${dm ? 'border-gray-700 text-gray-400' : 'text-gray-400 border-gray-200'}`}>
                                    {completedCount}/{lessons.length} done
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-3 pb-2 px-3">
                            <div className="space-y-1">
                                {lessons.map((lesson, i) => {
                                    const completed = completedLessonIndices.has(i);
                                    const isNext = i === nextLessonIndex && !allDone;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => onGoToLesson(i)}
                                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors group
                                                ${completed
                                                    ? dm ? 'hover:bg-gray-800/70' : 'hover:bg-gray-50'
                                                    : isNext
                                                        ? dm
                                                            ? 'bg-[#021d49]/25 border border-[#021d49]/30 hover:bg-[#021d49]/35'
                                                            : 'bg-[#021d49]/5 border border-[#021d49]/15 hover:bg-[#021d49]/10'
                                                        : dm ? 'hover:bg-gray-800/50' : 'hover:bg-slate-50'
                                                }`}
                                        >
                                            {/* Number / check bubble */}
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-colors
                                                ${completed
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : isNext
                                                        ? 'bg-[#021d49] text-white'
                                                        : dm ? 'bg-gray-800 text-gray-400 border border-gray-700' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {completed ? <Icons.Check className="w-3.5 h-3.5" /> : i + 1}
                                            </div>

                                            {/* Text block */}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-semibold leading-snug truncate ${dm ? 'text-gray-100' : 'text-gray-800'}`}>
                                                    {lesson.title || `Lesson ${i + 1}`}
                                                </p>
                                                {lesson.description && (
                                                    <p className={`text-xs mt-0.5 line-clamp-1 leading-relaxed ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        {stripHtmlLocal(lesson.description)}
                                                    </p>
                                                )}
                                                {/* Pills */}
                                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                    {lesson.slides?.length > 0 && (
                                                        <span className={`inline-flex items-center gap-1 text-[11px] ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                                                            <Icons.Layers className="w-3 h-3" />{lesson.slides.length} slide{lesson.slides.length !== 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                    {lesson.assessmentQuiz?.length > 0 && (
                                                        <span className={`inline-flex items-center gap-1 text-[11px] ${dm ? 'text-violet-400' : 'text-violet-600'}`}>
                                                            <Icons.HelpCircle className="w-3 h-3" />Quiz
                                                        </span>
                                                    )}
                                                    {lesson.duration && (
                                                        <span className={`inline-flex items-center gap-1 text-[11px] ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                                                            <Icons.Clock className="w-3 h-3" />{lesson.duration}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right side */}
                                            <div className="flex-shrink-0">
                                                {completed ? (
                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${dm ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>Done</span>
                                                ) : isNext ? (
                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${dm ? 'bg-blue-900/40 text-blue-300' : 'bg-[#021d49]/10 text-[#021d49]'}`}>Up next</span>
                                                ) : (
                                                    <Icons.ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-60 transition-opacity ${dm ? 'text-gray-400' : 'text-gray-400'}`} />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="pb-6" />
            </div>
        </ScrollArea>
    );
}

// ── Auto-submit status indicator (replaces Submit button) ─────────────────────
function AutoSubmitIndicator({ answered, total, submitting }) {
    const allDone = total > 0 && answered >= total;
    return (
        <div className={`rounded-xl p-3 flex items-center gap-3 ${allDone || submitting ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
            {submitting || allDone ? (
                <>
                    <Icons.Loader2 className="w-4 h-4 animate-spin text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-green-700">
                        {submitting ? 'Evaluating your answers…' : 'All answered — submitting automatically…'}
                    </span>
                </>
            ) : (
                <>
                    <Icons.HelpCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-500">
                        {answered} of {total} answered — submits automatically when complete
                    </span>
                </>
            )}
        </div>
    );
}

// ── Lesson Assessment Panel ────────────────────────────────────────────────────
function LessonAssessmentPanel({ assessment, lessonAnswers, setLessonAnswers, result, lessonProgress, submitting, onBackToLesson }) {
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
                                {displayRemaining > 0 && <p className="text-sm text-orange-700 mt-0.5">{displayRemaining} attempt{displayRemaining !== 1 ? 's' : ''} remaining — answer all questions to retry automatically</p>}
                            </div>
                        </div>
                        <div className="space-y-4">
                            {assessment.questions?.map((q, qIdx) => (
                                <QuestionRenderer key={qIdx} question={q} index={qIdx} answer={lessonAnswers[qIdx]} onChange={(val) => setLessonAnswers(prev => ({ ...prev, [qIdx]: val }))} />
                            ))}
                            <AutoSubmitIndicator answered={Object.keys(lessonAnswers).filter(k => String(lessonAnswers[k]).trim() !== '').length} total={assessment.questions?.length || 0} submitting={submitting} />
                        </div>
                    </>
                )}
                {!hasResult && (
                    <div className="space-y-4">
                        {assessment.questions?.map((q, qIdx) => (
                            <QuestionRenderer key={qIdx} question={q} index={qIdx} answer={lessonAnswers[qIdx]} onChange={(val) => setLessonAnswers(prev => ({ ...prev, [qIdx]: val }))} />
                        ))}
                        <AutoSubmitIndicator answered={Object.keys(lessonAnswers).filter(k => String(lessonAnswers[k]).trim() !== '').length} total={assessment.questions?.length || 0} submitting={submitting} />
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Confetti (copied from QuizResultsModal pattern) ────────────────────────────
const CONFETTI_COLORS_FA = ['#FFD700', '#FF6B6B', '#4ECDC4', '#021d49', '#1e40af', '#FFEAA7', '#DDA0DD', '#FF9A3C', '#98D8C8'];
function FinalAssessmentConfetti({ active }) {
    const styleRef = React.useRef(null);
    const particles = React.useMemo(() => Array.from({ length: 80 }, (_, i) => ({
        left: `${((i * 13) % 100)}%`,
        backgroundColor: CONFETTI_COLORS_FA[i % CONFETTI_COLORS_FA.length],
        width: `${7 + (i % 5) * 2}px`,
        height: `${7 + (i % 4) * 2}px`,
        borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0',
        animationDelay: `${((i * 0.08) % 2.5).toFixed(2)}s`,
        animationDuration: `${(2.8 + (i % 6) * 0.35).toFixed(2)}s`,
        opacity: 0,
    })), []);
    React.useEffect(() => {
        if (!active) { if (styleRef.current?.parentNode) { try { styleRef.current.parentNode.removeChild(styleRef.current); } catch (_) { } styleRef.current = null; } return; }
        if (styleRef.current) return;
        try {
            const style = document.createElement('style');
            style.textContent = `@keyframes fa-cf-fall { 0%{transform:translateY(-10px) rotate(0deg) scale(1);opacity:1;} 85%{opacity:1;} 100%{transform:translateY(105vh) rotate(720deg) scale(0.4);opacity:0;} } .fa-cf-p{animation:fa-cf-fall linear forwards;position:absolute;pointer-events:none;}`;
            document.head.appendChild(style);
            styleRef.current = style;
        } catch (_) { }
        return () => { if (styleRef.current?.parentNode) { try { styleRef.current.parentNode.removeChild(styleRef.current); } catch (_) { } } styleRef.current = null; };
    }, [active]);
    if (!active) return null;
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9999 }}>
            {particles.map((s, i) => <span key={i} className="fa-cf-p" style={s} />)}
        </div>
    );
}

// ── Final Assessment Panel ─────────────────────────────────────────────────────
function FinalAssessmentPanel({ module, enrollment, finalAnswers, setFinalAnswers, finalAssessmentResult, submitting, questionOrder, optionOrders, onSubmit, onGoToLessons, onRetry, onComplete }) {
    const assessment = module.finalAssessment;
    const hasResult = finalAssessmentResult != null;
    const passed = enrollment.finalAssessmentPassed || finalAssessmentResult?.passed;
    const justPassed = hasResult && finalAssessmentResult?.passed;
    const maxAttempts = assessment?.maxAttempts || 3;
    const attempts = enrollment.finalAssessmentAttempts || 0;
    // Cooldown: prefer the value from the just-submitted result, fall back to enrollment
    const cooldownUntil = finalAssessmentResult?.assessmentCooldownUntil
        ? new Date(finalAssessmentResult.assessmentCooldownUntil)
        : enrollment.assessmentCooldownUntil
            ? new Date(enrollment.assessmentCooldownUntil)
            : null;
    const isOnCooldown = cooldownUntil && cooldownUntil > new Date();
    // Allow retry if: not passed, not on cooldown, AND (has attempts left OR cooldown just expired meaning backend will reset the counter)
    const cooldownJustExpired = cooldownUntil !== null && !isOnCooldown;
    const canAttempt = !passed && !isOnCooldown && (attempts < maxAttempts || cooldownJustExpired);
    const remainingFromResult = finalAssessmentResult?.remainingAttempts;
    const displayRemaining = remainingFromResult !== undefined ? remainingFromResult : Math.max(0, maxAttempts - attempts);
    const attemptJustMade = hasResult && !passed ? (remainingFromResult !== undefined ? maxAttempts - remainingFromResult : attempts) : null;

    const ordinal = (n) => {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    const currentAttemptNumber = hasResult
        ? (remainingFromResult !== undefined ? maxAttempts - remainingFromResult : attempts)
        : attempts + 1;

    // Cooldown countdown display
    const [cooldownDisplay, setCooldownDisplay] = React.useState('');
    React.useEffect(() => {
        if (!isOnCooldown) { setCooldownDisplay(''); return; }
        const update = () => {
            const diff = cooldownUntil.getTime() - Date.now();
            if (diff <= 0) { setCooldownDisplay(''); return; }
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            setCooldownDisplay(`${mins}:${String(secs).padStart(2, '0')}`);
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [isOnCooldown, cooldownUntil?.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps

    // Build the ordered list of questions (use questionOrder when available, else original order)
    const allQuestions = assessment?.questions || [];
    const orderedIndices = questionOrder && questionOrder.length === allQuestions.length
        ? questionOrder
        : allQuestions.map((_, i) => i);

    // Result counts — derived from server response (authoritative)
    const resultItems = finalAssessmentResult?.results || [];
    const correctCount = resultItems.filter(r => r.isCorrect).length;
    const incorrectCount = resultItems.length - correctCount;

    if (!assessment) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
                <Icons.Info className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-700 mb-2">No Final Assessment</h3>
                <p className="text-gray-500 text-sm">This module does not have a final assessment.</p>
            </div>
        );
    }

    // Auto-advance to CompletionScreen 3 seconds after passing so the student
    // never gets stuck searching for the Continue button.
    React.useEffect(() => {
        if (!justPassed) return;
        const t = setTimeout(() => onComplete(), 3000);
        return () => clearTimeout(t);
    }, [justPassed]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div>
            <FinalAssessmentConfetti active={justPassed} />
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {justPassed && (
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white text-center space-y-3">
                        <div className="text-4xl">🎉</div>
                        <p className="text-2xl font-bold">Congratulations! You Passed!</p>
                        <p className="text-green-100 text-sm">
                            {ordinal(currentAttemptNumber)} attempt · Score: <strong>{(finalAssessmentResult?.score || 0).toFixed(1)}%</strong> · Certificate being prepared
                        </p>
                        <Button
                            onClick={onComplete}
                            className="bg-white text-green-700 hover:bg-green-50 font-bold px-8 py-2.5 rounded-xl gap-2 shadow-md"
                        >
                            <Icons.ChevronRight className="w-5 h-5" /> Continue to Completion
                        </Button>
                        <p className="text-green-200 text-xs">Continuing automatically in a moment…</p>
                    </div>
                )}
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
                        {hasResult ? (
                            <span className={`flex items-center gap-1.5 font-bold text-base px-3 py-1 rounded-full ${passed ? 'bg-white text-green-700' : 'bg-red-500 text-white'}`}>
                                {passed ? '✓ PASSED' : '✗ FAILED'} — {(finalAssessmentResult?.score || 0).toFixed(1)}%
                            </span>
                        ) : (
                            <span className={`flex items-center gap-1.5 font-semibold ${attempts >= maxAttempts ? 'text-red-300' : 'text-white'}`}>
                                <Icons.RotateCcw className="w-3.5 h-3.5" />
                                {`${maxAttempts - attempts} attempt${maxAttempts - attempts !== 1 ? 's' : ''} remaining`}
                            </span>
                        )}
                        {assessment.timeLimit && <span className="flex items-center gap-1.5"><Icons.Clock className="w-3.5 h-3.5" />{assessment.timeLimit} min</span>}
                        <span className="flex items-center gap-1.5"><Icons.HelpCircle className="w-3.5 h-3.5" />{assessment.questions?.length || 0} questions</span>
                    </div>
                </div>
                <div className="p-6 space-y-6">
                    {/* ── Question form (pre-submit) ── */}
                    {canAttempt && !hasResult && (
                        <div className="space-y-4">
                            <AutoSubmitIndicator
                                answered={Object.keys(finalAnswers).filter(k => String(finalAnswers[k]).trim() !== '').length}
                                total={assessment.questions?.length || 0}
                                submitting={submitting}
                            />
                            {/* Unanswered question locator */}
                            {(() => {
                                const unanswered = orderedIndices
                                    .map((origIdx, displayPos) => ({ num: displayPos + 1, origIdx }))
                                    .filter(({ origIdx }) => finalAnswers[origIdx] === undefined || String(finalAnswers[origIdx]).trim() === '');
                                if (unanswered.length === 0 || submitting) return null;
                                return (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
                                        <Icons.AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-amber-800">
                                                Still need to answer: Question{unanswered.length > 1 ? 's' : ''} {unanswered.map(u => `#${u.num}`).join(', ')}
                                            </p>
                                            <p className="text-xs text-amber-700 mt-0.5">Scroll up to find and answer the highlighted question{unanswered.length > 1 ? 's' : ''}.</p>
                                        </div>
                                    </div>
                                );
                            })()}
                            {orderedIndices.map((origIdx, displayPos) => {
                                const q = allQuestions[origIdx];
                                if (!q) return null;
                                const optOrder = optionOrders?.[origIdx];
                                const shuffledQ = withResolvedAnswer(q,
                                    (optOrder && q.options?.length > 1)
                                        ? { ...q, options: optOrder.map(i => q.options[i]) }
                                        : q
                                );
                                const isUnanswered = finalAnswers[origIdx] === undefined || String(finalAnswers[origIdx]).trim() === '';
                                return (
                                    <div key={origIdx} id={`q-${displayPos}`} className={isUnanswered ? 'ring-2 ring-amber-300 ring-offset-2 rounded-xl' : ''}>
                                        <QuestionRenderer
                                            question={shuffledQ}
                                            index={displayPos}
                                            answer={finalAnswers[origIdx]}
                                            onChange={(val) => setFinalAnswers(prev => ({ ...prev, [origIdx]: val }))}
                                            showCorrectAnswer={false}
                                        />
                                    </div>
                                );
                            })}
                            {/* Manual submit fallback — visible once at least one answer is recorded */}
                            {Object.keys(finalAnswers).some(k => String(finalAnswers[k]).trim() !== '') && (
                                <div className="border-t border-gray-200 pt-4 space-y-2">
                                    <Button
                                        onClick={() => {
                                            const answeredCount = Object.keys(finalAnswers).filter(k => String(finalAnswers[k]).trim() !== '').length;
                                            const total = allQuestions.length;
                                            if (answeredCount < total) {
                                                const unanswered = orderedIndices
                                                    .map((origIdx, dp) => ({ num: dp + 1, origIdx }))
                                                    .filter(({ origIdx }) => finalAnswers[origIdx] === undefined || String(finalAnswers[origIdx]).trim() === '');
                                                if (!window.confirm(`You have answered ${answeredCount} of ${total} questions.\n\nUnanswered: Question${unanswered.length > 1 ? 's' : ''} ${unanswered.map(u => '#' + u.num).join(', ')}\n\nSubmit anyway? Unanswered questions will be marked incorrect.`)) return;
                                            }
                                            onSubmit();
                                        }}
                                        disabled={submitting}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 py-3 font-semibold"
                                    >
                                        {submitting
                                            ? <><Icons.Loader2 className="w-4 h-4 animate-spin" /> Evaluating…</>
                                            : <><Icons.Send className="w-4 h-4" /> Submit Assessment</>
                                        }
                                    </Button>
                                    <p className="text-xs text-center text-gray-400">
                                        Answer all {allQuestions.length} questions and it submits automatically, or click above to submit now.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Unified result summary (always shown after submit — pass OR fail) ── */}
                    {hasResult && (
                        <div className="space-y-5">
                            {/* Score card */}
                            <div className={`rounded-2xl border-2 p-6 ${passed ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-200'}`}>
                                <div className="text-center">
                                    <div className={`text-6xl font-black mb-1 tabular-nums ${passed ? 'text-green-700' : 'text-red-600'}`}>
                                        {(finalAssessmentResult?.score || 0).toFixed(1)}%
                                    </div>
                                    <p className={`text-lg font-bold mt-1 ${passed ? 'text-green-700' : 'text-red-600'}`}>
                                        {passed ? 'You Passed! 🎉' : 'Not Passed Yet'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Attempt {currentAttemptNumber} of {maxAttempts} · Passing score: {assessment.passingScore || 70}%
                                    </p>
                                </div>
                                {resultItems.length > 0 && (
                                    <div className="flex justify-center mt-5 pt-4 border-t border-gray-200 divide-x divide-gray-200">
                                        <div className="text-center flex-1 px-4">
                                            <div className="text-3xl font-bold text-green-600">{correctCount}</div>
                                            <p className="text-xs text-gray-500 mt-0.5">✓ Correct</p>
                                        </div>
                                        <div className="text-center flex-1 px-4">
                                            <div className="text-3xl font-bold text-red-500">{incorrectCount}</div>
                                            <p className="text-xs text-gray-500 mt-0.5">✗ Incorrect</p>
                                        </div>
                                        <div className="text-center flex-1 px-4">
                                            <div className="text-3xl font-bold text-gray-600">{resultItems.length}</div>
                                            <p className="text-xs text-gray-500 mt-0.5">Total</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action buttons */}
                            {passed ? (
                                <Button
                                    onClick={onComplete}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 py-3 text-base font-bold shadow-md"
                                >
                                    <Icons.ChevronRight className="w-5 h-5" /> Continue Learning
                                </Button>
                            ) : (
                                <div className="space-y-3">
                                    {isOnCooldown ? (
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                                            <div className="flex items-start gap-3">
                                                <Icons.Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-bold text-amber-800">All {maxAttempts} attempts used</p>
                                                    <p className="text-sm text-amber-700 mt-0.5">Review lessons and retry when the cooldown expires.</p>
                                                </div>
                                            </div>
                                            {cooldownDisplay && (
                                                <p className="text-base font-mono font-bold text-amber-800 flex items-center gap-2">
                                                    <Icons.Timer className="w-4 h-4" />Retry available in {cooldownDisplay}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex gap-3">
                                            <Button onClick={onGoToLessons} variant="outline" className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 gap-2">
                                                <Icons.BookOpen className="w-4 h-4" /> Review Lessons
                                            </Button>
                                            {displayRemaining > 0 && (
                                                <Button onClick={onRetry} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white gap-2">
                                                    <Icons.RotateCcw className="w-4 h-4" /> Try Again ({displayRemaining} left)
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                    {isOnCooldown && (
                                        <Button onClick={onGoToLessons} variant="outline" className="w-full gap-2 border-amber-300 text-amber-800 hover:bg-amber-50">
                                            <Icons.BookOpen className="w-4 h-4" /> Review Lessons
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Question-by-question review */}
                            <div className="space-y-3">
                                <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Icons.ClipboardList className="w-4 h-4" />
                                    {passed ? 'Answer review — see what you got right:' : 'Your answers this attempt:'}
                                </p>
                                {orderedIndices.map((origIdx, displayPos) => {
                                    const q = allQuestions[origIdx];
                                    if (!q) return null;
                                    const optOrder = optionOrders?.[origIdx];
                                    const shuffledQ = withResolvedAnswer(q,
                                        (optOrder && q.options?.length > 1)
                                            ? { ...q, options: optOrder.map(i => q.options[i]) }
                                            : q
                                    );
                                    return (
                                        <QuestionRenderer
                                            key={origIdx}
                                            question={shuffledQ}
                                            index={displayPos}
                                            answer={finalAnswers[origIdx]}
                                            onChange={() => { }}
                                            showCorrectAnswer={passed}
                                        />
                                    );
                                })}
                            </div>

                            {/* Bottom CTA (pass only) */}
                            {passed && (
                                <div className="flex justify-center pt-2 pb-2">
                                    <Button
                                        onClick={onComplete}
                                        className="bg-green-600 hover:bg-green-700 text-white gap-2 px-10 py-3 text-base font-semibold shadow-md"
                                    >
                                        <Icons.ChevronRight className="w-5 h-5" /> Continue to Module Completion
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Answer evaluation helpers ──────────────────────────────────────────────────
// Resolves a correctAnswer value to the actual option text using the ORIGINAL
// (unshuffled) option list. Handles all storage formats:
//   "Option 3"  → 1-indexed label used by some editors → options[2]
//   "2"         → 0-indexed numeric string             → options[2]
//   "C"         → letter                               → options[2]
//   "Reinforcement Learning" → full text match
// When options are shuffled we pre-resolve and store _resolvedCorrectText on the
// question object so that index-based formats still point to the right option.
function resolveCorrectOptionText(question) {
    // Pre-resolved text wins — set before shuffling so indices still make sense.
    if (question._resolvedCorrectText !== undefined) return question._resolvedCorrectText;

    const ca = String(question.correctAnswer ?? '').trim();
    if (!ca) return '';
    const options = question.options || [];

    // "Option X" (1-indexed) — e.g. "Option 3" → options[2]
    const optionLabelMatch = ca.match(/^[Oo]ption\s*(\d+)$/);
    if (optionLabelMatch) {
        const idx = parseInt(optionLabelMatch[1], 10) - 1;
        if (idx >= 0 && idx < options.length) return options[idx];
    }

    // Pure numeric string (0-indexed) — e.g. "0", "1", "2"
    const numIdx = Number(ca);
    if (!isNaN(numIdx) && Number.isInteger(numIdx) && numIdx >= 0 && numIdx < options.length) {
        return options[numIdx];
    }

    // Single uppercase letter — e.g. "A", "B", "C"
    const letterIdx = ca.length === 1 && ca >= 'A' && ca <= 'Z' ? ca.charCodeAt(0) - 65 : -1;
    if (letterIdx >= 0 && letterIdx < options.length) {
        return options[letterIdx];
    }

    // Already the full option text
    return ca;
}

function evaluateStudentAnswer(question, studentAnswer) {
    if (!studentAnswer) return false;
    const ca = question.correctAnswer;
    if (ca === undefined || ca === null || ca === '') return false;
    const resolved = resolveCorrectOptionText(question);
    return String(studentAnswer).trim().toLowerCase() === resolved.trim().toLowerCase();
}
function getCorrectText(question) {
    return resolveCorrectOptionText(question);
}

// Pre-resolves the correct answer text from the ORIGINAL question options and attaches it
// to the question object so that shuffle doesn't break index-based lookups.
function withResolvedAnswer(originalQ, maybeShuffledQ) {
    const resolved = resolveCorrectOptionText(originalQ);
    return { ...maybeShuffledQ, _resolvedCorrectText: resolved };
}

// ── Question Renderer ──────────────────────────────────────────────────────────
function QuestionRenderer({ question, index, answer, onChange, showCorrectAnswer = true }) {
    const [checked, setChecked] = React.useState(() => {
        // In review mode (showCorrectAnswer=true with an existing answer), pre-populate
        // the checked state so correct/incorrect indicators render immediately without
        // requiring the student to re-click each option.
        if (showCorrectAnswer && answer !== undefined && answer !== null && String(answer).trim() !== '') {
            return { correct: evaluateStudentAnswer(question, answer), answer };
        }
        return null;
    });

    // Reset checked state when the answer is cleared (e.g. on retry after a failed attempt)
    React.useEffect(() => {
        if (answer === undefined || answer === null || String(answer).trim() === '') {
            setChecked(null);
        }
    }, [answer]);

    const qType = String(question.type || '').toLowerCase().trim();
    const isMultipleChoice = ['multiple-choice', 'multiple_choice', 'mcq'].includes(qType)
        || (!['true-false', 'true_false', 'truefalse', 'boolean', 'true/false', 'essay', 'short-answer', 'short_answer', 'text'].includes(qType) && (question.options?.length ?? 0) > 0);
    const isTrueFalse = ['true-false', 'true_false', 'truefalse', 'boolean', 'true/false'].includes(qType);
    const isEssay = ['essay', 'short-answer', 'short_answer', 'text'].includes(qType);
    const isChecked = checked !== null;
    const isCorrect = checked?.correct;

    const handleSelect = (val) => {
        onChange(val);
        if (isMultipleChoice || isTrueFalse) {
            const isCorrectSelection = evaluateStudentAnswer(question, val);
            const qText = (question.question || question.text || '').slice(0, 70);
            console.group(`[Assessment] Q${index + 1}: ${qText}`);
            console.log('Student selected :', `"${val}"`);
            console.log('Correct answer   :', `"${resolveCorrectOptionText(question)}"`, '  (raw stored:', question.correctAnswer, ')');
            console.log('Result           :', isCorrectSelection ? '✅ CORRECT' : '❌ INCORRECT');
            if (question.options?.length) console.log('Options shown    :', question.options);
            console.groupEnd();
            setChecked({ correct: isCorrectSelection, answer: val });
        }
    };

    const questionText = question.question || question.text || '';
    const correctOptionText = isChecked && showCorrectAnswer ? getCorrectText(question) : null;

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
                        const optionLabel = isTrueFalse ? option : String.fromCharCode(65 + optIdx);
                        const isSelected = answer === option;
                        const isThisCorrect = isChecked && showCorrectAnswer && correctOptionText !== null && String(option).trim() === String(correctOptionText).trim();
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
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                                    ${isChecked
                                        ? isThisCorrect ? 'bg-green-600 text-white'
                                            : isThisWrong ? 'bg-red-500 text-white'
                                                : 'bg-gray-200 text-gray-500'
                                        : isSelected ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {optionLabel}
                                </span>
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
                        {!isCorrect && showCorrectAnswer && correctOptionText && <span className="font-normal text-gray-700 ml-2">Correct answer: <span className="font-semibold text-green-700">{correctOptionText}</span></span>}
                    </p>
                    {showCorrectAnswer && question.explanation && <p className="text-sm text-gray-700 leading-relaxed">{question.explanation}</p>}
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
function CompletionScreen({ enrollment, moduleId, module: completedModule, router }) {
    const [showRating, setShowRating] = React.useState(false);
    const [rating, setRating] = React.useState(0);
    const [review, setReview] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);
    const [submitted, setSubmitted] = React.useState(false);
    const [existingRating, setExistingRating] = React.useState(null);
    const [nextModule, setNextModule] = React.useState(null);
    const [loadingNext, setLoadingNext] = React.useState(false);
    const [enrollingNext, setEnrollingNext] = React.useState(false);

    React.useEffect(() => {
        moduleRatingService.getMyRating(moduleId).then((res) => { if (res?.data) { setExistingRating(res.data); setRating(res.data.rating); setReview(res.data.review || ''); } }).catch(() => { });
    }, [moduleId]);

    // Find the next sequential module in the same category
    React.useEffect(() => {
        if (!completedModule?.categoryId || completedModule?.order == null) return;
        setLoadingNext(true);
        moduleService.getAllModules({ limit: 500 })
            .then((res) => {
                const all = Array.isArray(res) ? res : res?.modules || res?.data || [];
                const catId = (completedModule.categoryId?._id || completedModule.categoryId)?.toString();
                const next = all
                    .filter((m) => {
                        const mCatId = (m.categoryId?._id || m.categoryId)?.toString();
                        return mCatId === catId && (m.order || 0) > (completedModule.order || 0) && !m.isOptional;
                    })
                    .sort((a, b) => (a.order || 0) - (b.order || 0))[0] || null;
                setNextModule(next);
            })
            .catch(() => { })
            .finally(() => setLoadingNext(false));
    }, [completedModule?._id]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleContinueToNextModule = async () => {
        if (!nextModule) return;
        try {
            setEnrollingNext(true);
            await moduleEnrollmentService.enrollInModule(nextModule._id);
        } catch { /* already enrolled or other error — proceed anyway */ }
        finally { setEnrollingNext(false); }
        router.push(`/student/modules/${nextModule._id}`);
    };

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

                {/* Next module CTA — or "more content coming soon" if none exists */}
                {loadingNext ? (
                    <div className="flex items-center justify-center gap-2 mb-6 text-gray-400 text-sm">
                        <Icons.Loader2 className="w-4 h-4 animate-spin" /> Checking for next module…
                    </div>
                ) : nextModule ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl px-6 py-5 mb-6 text-left mx-auto max-w-sm shadow-sm">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <Icons.ArrowRight className="w-3.5 h-3.5" /> Up Next
                        </p>
                        <p className="text-sm font-semibold text-gray-900 leading-snug">{nextModule.title}</p>
                        {nextModule.level && (
                            <p className="text-xs text-gray-500 mt-1 capitalize">{nextModule.level} · Module {nextModule.order}</p>
                        )}
                        <Button
                            onClick={handleContinueToNextModule}
                            disabled={enrollingNext}
                            className="w-full mt-4 bg-[#021d49] hover:bg-[#032a66] text-white gap-2 font-semibold"
                        >
                            {enrollingNext
                                ? <><Icons.Loader2 className="w-4 h-4 animate-spin" /> Enrolling…</>
                                : <><Icons.Play className="w-4 h-4" /> Continue to Next Module</>
                            }
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 justify-center bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 mb-6 mx-auto max-w-sm">
                        <Icons.Clock className="w-4 h-4 text-[#021d49] flex-shrink-0" />
                        <p className="text-sm text-[#021d49] font-medium">More content coming soon — check back for new modules!</p>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={() => router.push('/student')} variant="outline" className="gap-2">
                        <Icons.Home className="w-4 h-4" /> Back to Dashboard
                    </Button>
                    <Button onClick={() => router.push('/student/modules')} className="bg-[#021d49] hover:bg-[#032a66] text-white gap-2">
                        <Icons.Layers className="w-4 h-4" /> Explore More Modules
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
