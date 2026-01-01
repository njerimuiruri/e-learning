"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    ChevronRight,
    ChevronLeft,
    BookOpen,
    CheckCircle2,
    Clock,
    MessageCircle,
    FileText,
    AlertCircle,
    X,
    Trophy,
    Star,
    Zap,
    Award,
    Target,
    Sparkles,
    Rocket,
    Menu,
    ChevronDown,
} from "lucide-react";
import courseService from "@/lib/api/courseService";
import { noteService } from "@/lib/api/noteService";
import messageService from "@/lib/api/messageService";
import ModuleProgressionGuard from "@/components/ModuleProgressionGuard";
import FinalAssessmentGuard from "@/components/FinalAssessmentGuard";
import { canAccessModule, canAccessFinalAssessment } from "@/lib/utils/courseProgressionLogic";

const CourseLearningPage = () => {
    const router = useRouter();
    const params = useParams();
    const courseId = params.id;
    const moduleParam = params.moduleId;
    const lessonParam = params.lessonId;

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enrollment, setEnrollment] = useState(null);
    const [showModuleGuard, setShowModuleGuard] = useState(false);
    const [showFinalAssessmentGuard, setShowFinalAssessmentGuard] = useState(false);
    const [currentPage, setCurrentPage] = useState("lesson");
    const [answers, setAnswers] = useState({});
    const [note, setNote] = useState("");
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [messageError, setMessageError] = useState("");
    const [completedLessons, setCompletedLessons] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showXPBoost, setShowXPBoost] = useState(false);
    const [totalXP, setTotalXP] = useState(0);
    const [completedModules, setCompletedModules] = useState([]);
    const [expandedModules, setExpandedModules] = useState([]);
    const [notes, setNotes] = useState([]);
    const [showNotesList, setShowNotesList] = useState(false);
    const [showCertificate, setShowCertificate] = useState(false);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                setLoading(true);
                const data = await courseService.getCourseById(courseId);
                setCourse(data);
                setExpandedModules([moduleParam]);
                setCurrentPage("lesson");

                // Fetch enrollment data to check progression
                try {
                    const enrollmentData = await courseService.getEnrollment(courseId);
                    setEnrollment(enrollmentData);
                    // Seed completed lessons from enrollment.lessonProgress
                    const lessonProgress = enrollmentData?.lessonProgress || [];
                    const completed = lessonProgress
                        .filter((lp) => lp.isCompleted && lp.moduleIndex === Number(moduleParam))
                        .map((lp) => lp.lessonIndex);
                    setCompletedLessons(completed);
                } catch (err) {
                    console.log("Not enrolled in this course yet or error fetching enrollment");
                }
            } catch (err) {
                console.error("Failed to load course", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [courseId, moduleParam, lessonParam]);

    const modules = course?.modules || [];
    const moduleIndex = useMemo(
        () => modules.findIndex((m, idx) => `${m._id || idx}` === moduleParam || `${idx}` === moduleParam),
        [modules, moduleParam]
    );

    const activeModule = modules[moduleIndex >= 0 ? moduleIndex : 0];
    const lessons = activeModule
        ? activeModule.lessons && activeModule.lessons.length > 0
            ? activeModule.lessons
            : [
                {
                    _id: activeModule._id || "lesson-0",
                    title: activeModule.title || "Lesson",
                    content: activeModule.content,
                    videoUrl: activeModule.videoUrl,
                    duration: activeModule.duration,
                },
            ]
        : [];

    const lessonIndex = useMemo(
        () => lessons.findIndex((l, idx) => `${l._id || idx}` === lessonParam || `${idx}` === lessonParam),
        [lessons, lessonParam]
    );

    const activeLesson = lessons[lessonIndex >= 0 ? lessonIndex : 0];

    useEffect(() => {
        setCurrentPage("lesson");
    }, [lessonParam]);

    // Keep only the active module expanded
    useEffect(() => {
        if (moduleParam) {
            setExpandedModules([`${moduleParam}`]);
        }
    }, [moduleParam]);

    // Refresh enrollment when module changes to check if it's now unlocked
    useEffect(() => {
        const refreshEnrollmentForModule = async () => {
            if (!enrollment?._id) return;
            try {
                const refreshed = await courseService.getEnrollment(courseId);
                setEnrollment(refreshed);
            } catch (err) {
                console.error("Failed to refresh enrollment on module change", err);
            }
        };
        if (moduleParam && moduleIndex >= 0) {
            refreshEnrollmentForModule();
        }
    }, [moduleParam, courseId, enrollment?._id]);

    // Check module access and show guard if needed
    // Only show guard after enrollment data is available and checked
    useEffect(() => {
        if (!course) return;
        if (moduleIndex < 0) return;
        if (!enrollment) return; // Don't check until enrollment is loaded

        // First module always accessible; others require previous module assessment passed
        const moduleProgress = enrollment?.moduleProgress || [];
        const previousModuleProgress = moduleProgress.find(mp => mp.moduleIndex === moduleIndex - 1);
        const canAccessCurrent = moduleIndex === 0 || (previousModuleProgress?.assessmentPassed === true);

        console.log(`Module ${moduleIndex} access check:`, {
            canAccessCurrent,
            previousModuleIndex: moduleIndex - 1,
            previousModuleProgress,
            previousAssessmentPassed: previousModuleProgress?.assessmentPassed,
            previousIsCompleted: previousModuleProgress?.isCompleted,
            allModuleProgress: moduleProgress,
        });

        setShowModuleGuard(!canAccessCurrent);
    }, [course, moduleIndex, enrollment]);

    const persistLessonProgress = async ({ moduleIdx, lessonIdx, completed = false }) => {
        try {
            if (!enrollment?._id) return;
            await courseService.updateLessonProgress(enrollment._id, moduleIdx, lessonIdx, completed);
            // refresh enrollment snapshot to reflect updated lessonProgress/progress
            const refreshed = await courseService.getEnrollment(courseId);
            setEnrollment(refreshed);
        } catch (err) {
            console.error("Failed to update lesson progress", err);
        }
    };

    useEffect(() => {
        // Record visit to this lesson for resume pointer
        if (enrollment && moduleIndex >= 0 && lessonIndex >= 0) {
            persistLessonProgress({ moduleIdx: moduleIndex, lessonIdx: lessonIndex, completed: false });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enrollment?._id, moduleIndex, lessonIndex]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-gray-700">Loading course...</div>;
    }

    if (!course || !activeModule || !activeLesson) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
                <div className="text-center bg-white p-12 rounded-2xl shadow-xl">
                    <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Lesson Not Found
                    </h1>
                    <p className="text-gray-600 mb-6">
                        We couldn't find the lesson you're looking for.
                    </p>
                    <button
                        onClick={() => router.push(`/courses/${courseId}`)}
                        className="bg-[#021d49] text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition"
                    >
                        Back to Course
                    </button>
                </div>
            </div>
        );
    }

    const handleAnswer = (questionId, answer) => {
        setAnswers({ ...answers, [questionId]: answer });
    };

    const handleNext = async () => {
        if (!completedLessons.includes(lessonIndex)) {
            const newCompletedLessons = [...completedLessons, lessonIndex];
            setCompletedLessons(newCompletedLessons);

            const newXP = totalXP + (activeLesson?.xpReward || 50);
            setTotalXP(newXP);

            await persistLessonProgress({ moduleIdx: moduleIndex, lessonIdx: lessonIndex, completed: true });
        }

        const currentLessonIndex = lessonIndex;
        const nextLesson = lessons[currentLessonIndex + 1];

        if (nextLesson) {
            router.push(`/courses/${courseId}/learn/${moduleParam}/${nextLesson._id || currentLessonIndex + 1}`);
            setAnswers({});
            setCurrentPage("lesson");
        } else {
            setCurrentPage("assessment");
        }
    };

    const handlePrevious = () => {
        const currentLessonIndex = lessonIndex;
        const prevLesson = lessons[currentLessonIndex - 1];

        if (prevLesson) {
            router.push(`/courses/${courseId}/learn/${moduleParam}/${prevLesson._id || currentLessonIndex - 1}`);
            setAnswers({});
            setCurrentPage("lesson");
        }
    };

    const handleLessonClick = (clickedLessonId, clickedModuleId) => {
        const modId = clickedModuleId ?? moduleParam;
        router.push(`/courses/${courseId}/learn/${modId}/${clickedLessonId}`);
        setCurrentPage("lesson");
    };

    const handleModuleClick = (clickedModuleId, clickedModuleLessonId) => {
        router.push(
            `/courses/${courseId}/learn/${clickedModuleId}/${clickedModuleLessonId}`
        );
        setCurrentPage("lesson");
        setAnswers({});
    };

    const toggleModule = (modId) => {
        setExpandedModules([modId]);
    };

    const calculateProgress = () => {
        const totalLessons = modules.reduce((sum, m) => sum + (m?.lessons?.length || 0), 0) || 1;
        const completed = enrollment?.lessonProgress?.filter((lp) => lp.isCompleted)?.length ?? 0;
        return Math.round((completed / totalLessons) * 100);
    };

    const handleModuleComplete = (passed) => {
        if (passed && !completedModules.includes(moduleParam)) {
            const newCompletedModules = [...completedModules, moduleParam];
            setCompletedModules(newCompletedModules);

            const newXP = totalXP + (module.xpReward || 310);
            setTotalXP(newXP);

            setShowXPBoost(true);

            // Check if all modules are completed
            if (newCompletedModules.length === course.modules.length) {
                setTimeout(() => {
                    setShowCertificate(true);
                }, 2000);
            }
        }
    };

    const handleDownloadCertificate = () => {
        // In a real app, this would generate a PDF
        alert(
            "Certificate download would start here. In production, this would generate a PDF certificate."
        );
    };

    const instructorId = course?.instructorId?._id || course?.instructorId?.id || course?.instructorId;
    const instructor = typeof course?.instructorId === 'object' ? course.instructorId : null;

    const handleSendInstructorMessage = async (content) => {
        if (!content?.trim()) {
            setMessageError("Message cannot be empty");
            return;
        }
        if (!instructorId) {
            setMessageError("Instructor information not available");
            return;
        }

        setMessageError("");
        setSendingMessage(true);
        try {
            const result = await messageService.sendMessage({
                receiverId: instructorId,
                content,
                courseId,
                moduleIndex,
            });
            console.log("Message sent successfully:", result);
            setShowMessageModal(false);
            alert("Message sent successfully!");
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || "Failed to send message";
            console.error("Error sending message:", err);
            setMessageError(msg);
        } finally {
            setSendingMessage(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-gray-50">
            {/* Module Progression Guard */}
            {showModuleGuard && (
                <ModuleProgressionGuard
                    moduleIndex={moduleIndex}
                    modules={modules}
                    enrollment={enrollment}
                    onClose={() => {
                        setShowModuleGuard(false);
                        router.push(`/courses/${courseId}`);
                    }}
                    onProceed={() => {
                        // Navigate to previous module
                        if (moduleIndex > 0) {
                            const previousModule = modules[moduleIndex - 1];
                            const previousModuleId = previousModule._id || (moduleIndex - 1);
                            const previousLessonId = previousModule.lessons?.[0]?._id || 0;
                            router.push(`/courses/${courseId}/learn/${previousModuleId}/${previousLessonId}`);
                        }
                    }}
                />
            )}

            {/* Final Assessment Guard */}
            {showFinalAssessmentGuard && currentPage === "final-assessment" && (
                <FinalAssessmentGuard
                    course={course}
                    enrollment={enrollment}
                    onClose={() => {
                        setShowFinalAssessmentGuard(false);
                        setCurrentPage("lesson");
                    }}
                />
            )}

            {showXPBoost && (
                <XPBoostModal
                    xp={activeLesson?.xpReward || activeModule?.xpReward || 50}
                    totalXP={totalXP}
                    onClose={() => setShowXPBoost(false)}
                />
            )}

            {showCertificate && (
                <CertificateModal
                    course={course}
                    userName="Your Name"
                    completionDate={new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })}
                    onClose={() => setShowCertificate(false)}
                    onDownload={handleDownloadCertificate}
                />
            )}

            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <Menu className="w-5 h-5 text-gray-600" />
                            </button>
                            <button
                                onClick={() => router.push(`/courses/${courseId}`)}
                                className="text-gray-600 hover:text-gray-900 transition flex items-center gap-2"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                <span className="hidden sm:inline">Back</span>
                            </button>
                            <div className="border-l border-gray-300 pl-4">
                                <h2 className="text-sm text-gray-600 truncate max-w-xs">
                                    {course?.title}
                                </h2>
                                <p className="text-sm font-semibold text-gray-900 truncate max-w-xs">
                                    {activeModule?.title}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push('/student')}
                                className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-600 transition shadow-md"
                                title="Go to Dashboard"
                            >
                                <BookOpen className="w-4 h-4" />
                                Dashboard
                            </button>
                            <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-2 rounded-full">
                                <Trophy className="w-5 h-5 text-orange-600" />
                                <span className="font-bold text-orange-900">{totalXP} XP</span>
                            </div>
                            <button
                                onClick={() => setShowNotesList(!showNotesList)}
                                className="relative p-2 hover:bg-orange-100 rounded-lg transition bg-orange-50 border-2 border-orange-200"
                                title="View Notes"
                            >
                                <FileText className="w-5 h-5 text-orange-600" />
                                {notes.length > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-[#021d49] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                        {notes.length}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => setShowNoteModal(true)}
                                className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition shadow-md"
                            >
                                <FileText className="w-4 h-4" />
                                Add Note
                            </button>
                            <button
                                onClick={() => router.push(`/courses/${courseId}/discussion?module=${moduleIndex}`)}
                                className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-indigo-700 transition shadow-md"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Module Discussion
                            </button>
                            <button
                                onClick={() => {
                                    if (instructor && instructorId) {
                                        setShowMessageModal(true);
                                    } else {
                                        alert("Instructor information not available. Please refresh the page.");
                                    }
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                                title="Message Instructor"
                                disabled={!instructor || !instructorId}
                            >
                                <MessageCircle className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    </div>
                </div>
                {showNotesList && (
                    <div className="border-t border-gray-200 bg-gray-50 max-w-7xl mx-auto">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-orange-500" />
                                    My Notes ({notes.length})
                                </h3>
                                <button
                                    onClick={() => setShowNoteModal(true)}
                                    className="text-sm bg-[#021d49] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition"
                                >
                                    + Add New Note
                                </button>
                            </div>

                            {notes.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                    <p>No notes yet. Add your first note!</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {notes.map((note, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <span className="text-xs text-gray-500">
                                                    {note.lesson} • {note.timestamp}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        const newNotes = notes.filter((_, i) => i !== idx);
                                                        setNotes(newNotes);
                                                    }}
                                                    className="text-gray-400 hover:text-red-500 transition"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-gray-700 whitespace-pre-wrap">
                                                {note.content}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div
                        className={`lg:col-span-1 ${sidebarOpen ? "block" : "hidden lg:block"
                            }`}
                    >
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-orange-500" />
                                    Progress
                                </h3>
                                <span className="text-lg font-bold text-orange-600">
                                    {calculateProgress()}%
                                </span>
                            </div>

                            <div className="relative w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden">
                                <div
                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500 shadow-lg"
                                    style={{ width: `${calculateProgress()}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-yellow-50 to-blue-50 rounded-xl p-4 mb-6 border border-orange-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-orange-600" />
                                        <span className="text-sm font-semibold text-gray-700">
                                            Total XP
                                        </span>
                                    </div>
                                    <span className="text-xl font-bold text-orange-600">
                                        {totalXP}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {course.modules.map((m, mIdx) => {
                                    const modId = `${m._id || mIdx}`;
                                    const isCurrentModule = modId === `${moduleParam}`;
                                    const moduleLessons = m.lessons || [];
                                    const moduleProgress = enrollment?.moduleProgress || [];
                                    const currentModuleProg = moduleProgress.find(mp => mp.moduleIndex === mIdx);
                                    const previousModuleProgress = moduleProgress.find(mp => mp.moduleIndex === mIdx - 1);
                                    const moduleCompleted = currentModuleProg?.assessmentPassed === true;
                                    const moduleStatus = {
                                        canAccess: mIdx === 0 || (previousModuleProgress?.assessmentPassed === true),
                                    };

                                    return (
                                        <div
                                            key={modId}
                                            className="border border-gray-200 rounded-xl overflow-hidden"
                                        >
                                            <button
                                                onClick={() => toggleModule(modId)}
                                                className={`w-full flex items-center gap-3 p-4 transition-all ${isCurrentModule
                                                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                                                    : "hover:bg-gray-50 bg-gray-50"
                                                    }`}
                                            >
                                                <ChevronDown
                                                    className={`w-5 h-5 transition-transform ${expandedModules.includes(modId)
                                                        ? "rotate-0"
                                                        : "-rotate-90"
                                                        }`}
                                                />
                                                <span
                                                    className={`text-sm font-bold ${isCurrentModule ? "text-white" : "text-gray-900"
                                                        }`}
                                                >
                                                    Module {mIdx + 1}: {m.title}
                                                </span>
                                                {moduleCompleted && (
                                                    <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                                                        <CheckCircle2 className="w-4 h-4" /> Done
                                                    </span>
                                                )}
                                                {!moduleStatus.canAccess && !isCurrentModule && (
                                                    <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">Locked</span>
                                                )}
                                            </button>

                                            {expandedModules.includes(modId) && (
                                                <div className="bg-white space-y-1 p-2 border-t border-gray-200">
                                                    {moduleLessons.map((l, lIdx) => {
                                                        const lessonId = `${l._id || lIdx}`;
                                                        const isCompleted = (enrollment?.lessonProgress?.some(
                                                            (lp) => lp.moduleIndex === mIdx && lp.lessonIndex === lIdx && lp.isCompleted,
                                                        )) || (mIdx === moduleIndex && completedLessons.includes(lIdx));
                                                        const isCurrent = lessonId === `${lessonParam}` && modId === `${moduleParam}`;
                                                        const locked = !moduleStatus.canAccess && !isCompleted && !isCurrent;

                                                        return (
                                                            <button
                                                                key={lessonId}
                                                                onClick={() => !locked && handleLessonClick(lessonId, modId)}
                                                                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${isCurrent
                                                                    ? "bg-orange-50 border-2 border-orange-500"
                                                                    : isCompleted
                                                                        ? "hover:bg-green-50 border-l-4 border-green-500"
                                                                        : locked
                                                                            ? "opacity-50 cursor-not-allowed border-l-4 border-gray-200"
                                                                            : "hover:bg-gray-50 border-l-4 border-gray-200"
                                                                    }`}
                                                                disabled={locked}
                                                            >
                                                                <div
                                                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${isCompleted
                                                                        ? "bg-green-500 text-white"
                                                                        : isCurrent
                                                                            ? "bg-[#021d49] text-white"
                                                                            : locked
                                                                                ? "bg-gray-200 text-gray-500"
                                                                                : "bg-gray-300 text-gray-600"
                                                                        }`}
                                                                >
                                                                    {isCompleted ? (
                                                                        <CheckCircle2 className="w-4 h-4" />
                                                                    ) : (
                                                                        lIdx + 1
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <span
                                                                        className={`text-xs block truncate font-medium ${isCurrent
                                                                            ? "text-orange-900 font-bold"
                                                                            : "text-gray-700"
                                                                            }`}
                                                                    >
                                                                        {l.title}
                                                                    </span>
                                                                </div>
                                                                {locked && (
                                                                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">Locked</span>
                                                                )}
                                                                {l.questions?.length > 0 && (
                                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex-shrink-0">
                                                                        {l.questions.length}Q
                                                                    </span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {module.assessment && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                                        <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
                                            <Award className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-bold text-gray-900 block">
                                                Module Assessment
                                            </span>
                                            <span className="text-xs text-gray-600">
                                                {module.assessment.questions.length} questions •{" "}
                                                {module.assessment.passingScore}% to pass
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        {currentPage === "lesson" && <LessonSection lesson={activeLesson} />}

                        {currentPage === "questions" && (
                            <QuestionsSection
                                lesson={activeLesson}
                                answers={answers}
                                onAnswer={handleAnswer}
                            />
                        )}

                        {currentPage === "assessment" && (
                            <AssessmentSection
                                module={activeModule}
                                moduleIndex={moduleIndex}
                                enrollmentId={enrollment?._id}
                                onComplete={async (passed) => {
                                    handleModuleComplete(passed);
                                    if (passed) {
                                        // Refresh enrollment to get updated moduleProgress
                                        try {
                                            const refreshed = await courseService.getEnrollment(courseId);
                                            setEnrollment(refreshed);
                                        } catch (err) {
                                            console.error("Failed to refresh enrollment", err);
                                        }

                                        const nextModuleIdx = moduleIndex + 1;
                                        const nextModule = course.modules[nextModuleIdx];
                                        if (nextModule) {
                                            const nextModuleId = nextModule._id || nextModuleIdx;
                                            const firstLessonId = nextModule.lessons?.[0]?._id || 0;
                                            router.push(
                                                `/courses/${courseId}/learn/${nextModuleId}/${firstLessonId}`
                                            );
                                        } else {
                                            router.push(`/courses/${courseId}/final-assessment`);
                                        }
                                    }
                                }}
                            />
                        )}

                        {currentPage !== "assessment" && (
                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={handlePrevious}
                                    disabled={lessonIndex <= 0}
                                    className="flex-1 py-4 px-6 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    Previous
                                </button>
                                <button
                                    onClick={() => {
                                        if (
                                            currentPage === "lesson" &&
                                            activeLesson?.questions?.length > 0
                                        ) {
                                            setCurrentPage("questions");
                                        } else {
                                            handleNext();
                                        }
                                    }}
                                    className="flex-1 py-4 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
                                >
                                    Next
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showNoteModal && (
                <NoteModal
                    note={note}
                    setNote={setNote}
                    onClose={() => setShowNoteModal(false)}
                    onSave={async (noteData) => {
                        try {
                            const savedNote = await noteService.createNote(noteData);
                            setNotes([...notes, {
                                _id: savedNote._id,
                                content: savedNote.content,
                                lesson: savedNote.lessonName,
                                timestamp: new Date(savedNote.createdAt).toLocaleString(),
                            }]);
                            alert("✓ Note saved successfully!");
                        } catch (err) {
                            throw err;
                        }
                    }}
                    currentLesson={activeLesson?.title}
                    courseId={courseId}
                    courseName={course?.title}
                    moduleIndex={moduleIndex}
                    moduleName={activeModule?.title}
                    lessonIndex={lessonIndex}
                />
            )}

            {showMessageModal && instructor && (
                <MessageInstructorModal
                    onClose={() => setShowMessageModal(false)}
                    instructor={instructor}
                    onSend={handleSendInstructorMessage}
                    loading={sendingMessage}
                    error={messageError}
                />
            )}
        </div>
    );
};

// XP Boost Modal Component
const XPBoostModal = ({ xp, totalXP, onClose }) => {
    useEffect(() => {
        const audio = new Audio("/sounds/success.mp3");
        audio.play().catch((err) => console.log("Audio play failed:", err));
    }, []);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 rounded-3xl p-12 shadow-2xl max-w-md w-full relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all"
                >
                    <X className="w-6 h-6 text-white" />
                </button>

                <div className="text-center">
                    <Rocket className="w-20 h-20 text-white mx-auto mb-4 animate-pulse" />
                    <h2 className="text-4xl font-bold text-white mb-2">
                        Milestone Unlocked!
                    </h2>
                    <div className="text-8xl font-black text-white my-6 drop-shadow-lg">
                        +{xp} XP
                    </div>
                    <div className="bg-white/20 backdrop-blur rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-center gap-2 text-white">
                            <Trophy className="w-6 h-6" />
                            <span className="text-sm font-semibold">Total XP:</span>
                            <span className="text-2xl font-bold">{totalXP} XP</span>
                        </div>
                    </div>
                    <p className="text-white/90 text-sm mb-6">
                        Keep learning to unlock more rewards!
                    </p>

                    <button
                        onClick={onClose}
                        className="bg-white text-orange-600 px-8 py-3 rounded-full font-bold hover:bg-orange-50 transition-all shadow-lg"
                    >
                        Continue Learning
                    </button>
                </div>
            </div>
        </div>
    );
};

// Certificate Modal Component
const CertificateModal = ({
    course,
    userName,
    completionDate,
    onClose,
    onDownload,
}) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full relative overflow-hidden">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white rounded-full p-2 transition-all shadow-lg"
                >
                    <X className="w-6 h-6 text-gray-700" />
                </button>

                <div className="p-12 bg-gradient-to-br from-orange-50 via-white to-red-50">
                    <div className="border-8 border-double border-orange-500 rounded-2xl p-12 bg-white relative">
                        <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-orange-400"></div>
                        <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-orange-400"></div>
                        <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-orange-400"></div>
                        <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-orange-400"></div>

                        <div className="text-center mb-8">
                            <div className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-full mb-4">
                                <Trophy className="w-6 h-6 inline mr-2" />
                                <span className="font-bold text-lg">
                                    Certificate of Completion
                                </span>
                            </div>
                            <h1 className="text-5xl font-black text-gray-900 mb-2">
                                Congratulations!
                            </h1>
                            <div className="w-32 h-1 bg-gradient-to-r from-orange-500 to-red-500 mx-auto rounded-full"></div>
                        </div>

                        <div className="text-center mb-8 space-y-6">
                            <p className="text-gray-600 text-lg">This is to certify that</p>

                            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border-2 border-orange-200">
                                <p className="text-4xl font-black text-gray-900 mb-2">
                                    {userName || "Student Name"}
                                </p>
                            </div>

                            <p className="text-gray-600 text-lg">
                                has successfully completed
                            </p>

                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold text-gray-900">
                                    {course.title}
                                </h2>
                                <p className="text-gray-600">
                                    in the field of {course.category}
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-8 mt-8">
                                <div className="text-center">
                                    <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">Duration</p>
                                    <p className="font-bold text-gray-900">{course.duration}</p>
                                </div>
                                <div className="text-center">
                                    <Award className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">Level</p>
                                    <p className="font-bold text-gray-900">{course.level}</p>
                                </div>
                                <div className="text-center">
                                    <Star className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">Rating</p>
                                    <p className="font-bold text-gray-900">{course.rating}/5.0</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-around items-end border-t-2 border-gray-200 pt-8 mt-8">
                            <div className="text-center">
                                <div className="mb-2">
                                    <div className="h-16 flex items-center justify-center">
                                        <Sparkles className="w-12 h-12 text-orange-500" />
                                    </div>
                                </div>
                                <div className="border-t-2 border-gray-800 pt-2 w-48">
                                    <p className="font-bold text-gray-900">
                                        {course?.instructor?.name || "Instructor"}
                                    </p>
                                    <p className="text-sm text-gray-600">Course Instructor</p>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="mb-2">
                                    <div className="h-16 flex items-center justify-center">
                                        <Award className="w-12 h-12 text-orange-500" />
                                    </div>
                                </div>
                                <div className="border-t-2 border-gray-800 pt-2 w-48">
                                    <p className="font-bold text-gray-900">Learning Platform</p>
                                    <p className="text-sm text-gray-600">Program Director</p>
                                </div>
                            </div>
                        </div>

                        <div className="text-center mt-8">
                            <p className="text-sm text-gray-600">
                                Completed on{" "}
                                {completionDate ||
                                    new Date().toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 px-12 py-6 flex gap-4">
                    <button
                        onClick={onDownload}
                        className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        <FileText className="w-6 h-6" />
                        Download Certificate
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 className="w-6 h-6" />
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

// Lesson Section Component
const LessonSection = ({ lesson }) => (
    <div className="space-y-6">
        {lesson.type === "video" && lesson.videoUrl && (
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
                <div className="bg-gray-900 aspect-video">
                    <iframe
                        width="100%"
                        height="500"
                        src={lesson.videoUrl}
                        title={lesson.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                    ></iframe>
                </div>
            </div>
        )}

        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
            <div className="mb-6 pb-6 border-b border-gray-200">
                <h2 className="text-3xl font-black text-gray-900 mb-4">
                    {lesson.title}
                </h2>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span className="font-semibold text-gray-700">
                            {lesson.duration}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full">
                        <BookOpen className="w-4 h-4 text-orange-500" />
                        <span className="font-semibold text-gray-700">
                            {lesson.questions?.length || 0} questions
                        </span>
                    </div>
                    {lesson.xpReward && (
                        <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-full">
                            <Zap className="w-4 h-4 text-yellow-600" />
                            <span className="font-bold text-yellow-900">
                                +{lesson.xpReward} XP
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {lesson.content && (
                <div className="mb-8 prose prose-lg max-w-none">
                    <div
                        className="lesson-content"
                        dangerouslySetInnerHTML={{
                            __html: formatLessonContent(lesson.content),
                        }}
                    />
                </div>
            )}

            {lesson.topics && lesson.topics.length > 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200 mb-8">
                    <h3 className="font-bold text-gray-900 text-xl mb-4 flex items-center gap-2">
                        <Star className="w-5 h-5 text-orange-600" />
                        Key Topics Covered
                    </h3>
                    <ul className="space-y-3">
                        {lesson.topics.map((topic, idx) => (
                            <li key={idx} className="flex gap-3 text-gray-700">
                                <span className="text-orange-500 font-bold text-xl flex-shrink-0">
                                    ✓
                                </span>
                                <span className="text-base">{topic}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {lesson.notes && (
                <div className="prose prose-lg max-w-none">
                    <div
                        className="lesson-content"
                        dangerouslySetInnerHTML={{
                            __html: formatLessonNotes(lesson.notes),
                        }}
                    />
                </div>
            )}

            {lesson.type === "document" && lesson.documentUrl && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8">
                    <div className="flex items-start gap-4">
                        <FileText className="w-12 h-12 text-blue-600 flex-shrink-0" />
                        <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900 mb-2">
                                Additional Resources
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Download or view the lesson document for more detailed
                                information.
                            </p>
                            <a
                                href={lesson.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                            >
                                <FileText className="w-5 h-5" />
                                Open Document
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
);

const formatLessonContent = (content) => {
    if (!content) return "";

    return content
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
        .replace(/\sdata-(start|end)="[^"]*"/g, "")
        .trim();
};

const formatLessonNotes = (notes) => {
    if (!notes) return "";

    let formatted = notes
        .trim()
        .replace(
            /^## (.+)$/gm,
            '<h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4 first:mt-0">$1</h2>'
        )
        .replace(
            /^### (.+)$/gm,
            '<h3 class="text-xl font-semibold text-gray-800 mt-6 mb-3">$1</h3>'
        )
        .replace(
            /^#### (.+)$/gm,
            '<h4 class="text-lg font-semibold text-gray-700 mt-4 mb-2">$1</h4>'
        )
        .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>')
        .replace(/^- (.+)$/gm, '<li class="ml-6 mb-2 list-disc">$1</li>')
        .replace(
            /^✓ (.+)$/gm,
            '<li class="flex gap-2 mb-2"><span class="text-green-600 font-bold flex-shrink-0">✓</span><span class="flex-1">$1</span></li>'
        )
        .replace(
            /^❌ (.+)$/gm,
            '<li class="flex gap-2 mb-2"><span class="text-red-600 font-bold flex-shrink-0">❌</span><span class="flex-1">$1</span></li>'
        );

    formatted = formatted.replace(
        /((?:<li class="ml-6[^>]*>.*?<\/li>\s*)+)/gs,
        '<ul class="space-y-2 mb-6 ml-4">$1</ul>'
    );
    formatted = formatted.replace(
        /((?:<li class="flex gap-2[^>]*>.*?<\/li>\s*)+)/gs,
        '<ul class="space-y-2 mb-6">$1</ul>'
    );

    const sections = formatted.split(/\n\n+/);

    const processedSections = sections.map((section) => {
        section = section.trim();
        if (!section) return "";

        if (
            section.startsWith("<h") ||
            section.startsWith("<ul") ||
            section.startsWith("<li")
        ) {
            return section;
        }

        return `<p class="mb-4 text-gray-700 leading-relaxed">${section}</p>`;
    });

    return processedSections.join("\n");
};

const QuestionsSection = ({ lesson, answers, onAnswer }) => {
    // Guard against missing questions
    if (!lesson?.questions || lesson.questions.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
                <p className="text-gray-600 text-center">No questions available for this lesson.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <span className="inline-block bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm px-4 py-2 rounded-full font-bold">
                        <Star className="w-4 h-4 inline mr-1" />
                        Knowledge Check
                    </span>
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-2">
                    Check Your Understanding
                </h2>
                <p className="text-gray-600 text-lg">
                    Answer the following questions to reinforce your learning.
                </p>
            </div>

            <div className="space-y-6">
                {lesson.questions.map((question, idx) => (
                    <div
                        key={question.id || question._id || idx}
                        className="border-2 border-gray-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white"
                    >
                        <p className="font-bold text-gray-900 mb-4 text-lg flex items-start gap-3">
                            <span className="bg-[#021d49] text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                                {idx + 1}
                            </span>
                            {question.question || question.text || 'Question text not available'}
                        </p>

                        {(question.type === "multiple_choice" || question.type === "mcq") && question.options?.length > 0 ? (
                            <div className="space-y-3">
                                {question.options.map((option, optIdx) => {
                                    const questionId = question.id || question._id || idx;
                                    return (
                                        <label
                                            key={optIdx}
                                            className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${answers[questionId] == optIdx
                                                ? "border-orange-500 bg-orange-50"
                                                : "border-gray-200 hover:border-orange-300 hover:bg-gray-50"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name={`question-${questionId}`}
                                                value={optIdx}
                                                onChange={(e) => onAnswer(questionId, e.target.value)}
                                                checked={answers[questionId] == optIdx}
                                                className="w-5 h-5 mt-0.5 text-orange-500 focus:ring-orange-500"
                                            />
                                            <span className="text-gray-700 flex-1">{option}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        ) : (
                            <textarea
                                placeholder="Type your answer here..."
                                value={answers[question.id || question._id || idx] || ""}
                                onChange={(e) => onAnswer(question.id || question._id || idx, e.target.value)}
                                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition-all"
                                rows="5"
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const AssessmentSection = ({ module, moduleIndex, enrollmentId, onComplete }) => {
    const [assessmentAnswers, setAssessmentAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Guard against missing module or assessment - check both assessment and moduleAssessment
    const assessment = module?.moduleAssessment || module?.assessment;

    if (!module || !assessment || !assessment.questions || assessment.questions.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
                <p className="text-gray-600">No assessment available for this module.</p>
            </div>
        );
    }

    const handleAssessmentAnswer = (questionId, answer, index) => {
        // Store both the selected value and its index to support string/number comparisons
        setAssessmentAnswers({ ...assessmentAnswers, [questionId]: { value: answer, index } });
    };

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);

        try {
            // Prepare answers array for backend (prefer actual option text/value to avoid index mismatches)
            const answersArray = assessment.questions.map((q, idx) => {
                const questionId = q.id || q._id || idx;
                const selected = assessmentAnswers[questionId];
                const selectedValue = typeof selected === 'object' && selected !== null ? selected.value : selected;
                const selectedIndex = typeof selected === 'object' && selected !== null ? selected.index : selected;

                if (selectedValue !== undefined && selectedValue !== null) {
                    return selectedValue; // send the option text / typed answer
                }
                if (selectedIndex !== undefined && selectedIndex !== null) {
                    return selectedIndex; // fallback to index if no text captured
                }
                return null;
            });

            // Submit to backend
            const result = await courseService.submitModuleAssessment(enrollmentId, moduleIndex, answersArray);

            // Allow retry on fail; lock on success
            setSubmitted(result.passed);

            if (result.passed) {
                alert(`🎉 Congratulations! You passed with ${result.score}%`);
            } else {
                const attemptsRemaining = result.attemptsRemaining || 0;
                if (result.mustRestartCourse) {
                    alert(`You scored ${result.score}%. You've used all 3 attempts. Please restart the course.`);
                } else {
                    alert(`You scored ${result.score}%. You need ${result.passingScore}% to pass. You have ${attemptsRemaining} attempt(s) remaining.`);
                }
            }

            onComplete(result.passed);
        } catch (error) {
            console.error("Error submitting assessment:", error);
            alert("Failed to submit assessment. Please try again.");
        } finally {
            // Re-enable button if not passed; keep disabled when passed
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <span className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm px-4 py-2 rounded-full font-bold shadow-lg">
                        <Trophy className="w-4 h-4 inline mr-1" />
                        Module Assessment
                    </span>
                </div>
                <h2 className="text-4xl font-black text-gray-900 mb-3">
                    {assessment?.title || "Module Assessment"}
                </h2>
                <p className="text-gray-600 text-lg">
                    Complete all questions to finish this module. Passing score:{" "}
                    <span className="font-bold text-orange-600">
                        {assessment?.passingScore || 70}%
                    </span>
                </p>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-blue-50 rounded-xl p-6 mb-8 border border-orange-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Award className="w-8 h-8 text-orange-600" />
                        <div>
                            <p className="font-bold text-gray-900">Module XP Reward</p>
                            <p className="text-sm text-gray-600">Complete to earn XP</p>
                        </div>
                    </div>
                    <span className="text-3xl font-black text-orange-600">
                        +{module?.xpReward || 0} XP
                    </span>
                </div>
            </div>

            <div className="space-y-6">
                {assessment.questions.map((question, idx) => {
                    const questionId = question.id || question._id || idx;
                    const questionText = question.question || question.text || `Question ${idx + 1}`;

                    // Log question data for debugging
                    console.log('=== QUESTION DEBUG ===');
                    console.log('Question:', question);
                    console.log('Type:', question.type);
                    console.log('Options:', question.options);
                    console.log('Options is array:', Array.isArray(question.options));
                    console.log('Options length:', question.options?.length);

                    // Handle different option formats (force valid visible options)
                    let options = [];
                    const questionType = (question.type || '').toLowerCase().trim();

                    console.log('Question type (normalized):', questionType);

                    // If it's a boolean/true-false style question, ignore provided options and force True/False
                    if (questionType.includes('true') || questionType.includes('false') || questionType === 'boolean') {
                        options = ['True', 'False'];
                        console.log('Setting True/False options based on type');
                    } else {
                        // Otherwise, try to use provided options if they are non-empty
                        if (question.options && Array.isArray(question.options) && question.options.length > 0) {
                            const validOptions = question.options.filter(opt => typeof opt === 'string' && opt.trim() !== '');
                            if (validOptions.length > 0) {
                                options = validOptions;
                                console.log('Using provided options:', options);
                            }
                        }

                        // Fallbacks
                        if (options.length === 0) {
                            if (questionType === 'mcq' || questionType === 'multiple_choice' || questionType === 'multiple choice') {
                                options = ['Option A', 'Option B', 'Option C', 'Option D'];
                                console.log('Setting default MCQ options');
                            } else {
                                options = ['True', 'False'];
                                console.log('Setting default True/False options');
                            }
                        }
                    }

                    console.log('Final options:', options);
                    console.log('======================');

                    return (
                        <div
                            key={questionId}
                            className="border-2 border-gray-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white"
                        >
                            <p className="font-bold text-gray-900 mb-4 text-lg flex items-start gap-3">
                                <span className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                                    {idx + 1}
                                </span>
                                {questionText}
                            </p>

                            {options.length > 0 ? (
                                <div className="space-y-3">
                                    {options.map((option, optIdx) => (
                                        <label
                                            key={optIdx}
                                            className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${assessmentAnswers[questionId] == optIdx
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name={`assessment-q-${questionId}`}
                                                value={option}
                                                onChange={() =>
                                                    handleAssessmentAnswer(questionId, option, optIdx)
                                                }
                                                checked={assessmentAnswers[questionId]?.index == optIdx}
                                                className="w-5 h-5 mt-0.5 text-blue-500 focus:ring-blue-500"
                                            />
                                            <span className="text-gray-700 flex-1">{option}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <textarea
                                    placeholder="Type your answer here..."
                                    value={assessmentAnswers[questionId]?.value || ""}
                                    onChange={(e) => handleAssessmentAnswer(questionId, e.target.value, null)}
                                    className="w-full p-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                                    rows="4"
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            <button
                onClick={handleSubmit}
                disabled={submitted || submitting}
                className="w-full mt-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-5 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
                {submitting ? (
                    <>
                        <Clock className="w-6 h-6 animate-spin" />
                        Submitting...
                    </>
                ) : submitted ? (
                    <>
                        <CheckCircle2 className="w-6 h-6" />
                        Submitted
                    </>
                ) : (
                    <>
                        <Trophy className="w-6 h-6" />
                        Submit Assessment
                    </>
                )}
            </button>
        </div>
    );
};

const NoteModal = ({ note, setNote, onClose, onSave, currentLesson, courseId, courseName, moduleIndex, moduleName, lessonIndex }) => {
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!note.trim()) return;

        setSaving(true);
        try {
            await onSave({
                courseId,
                courseName,
                lessonName: currentLesson,
                content: note,
                moduleIndex,
                moduleName,
                lessonIndex,
            });
            setNote("");
            onClose();
        } catch (error) {
            alert("Failed to save note: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-gray-900 text-2xl flex items-center gap-2">
                        <FileText className="w-6 h-6 text-orange-500" />
                        Add Note
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="mb-4 space-y-2">
                    <label className="text-sm text-gray-600 block">
                        Course:{" "}
                        <span className="font-semibold text-gray-900">{courseName}</span>
                    </label>
                    <label className="text-sm text-gray-600 block">
                        Lesson:{" "}
                        <span className="font-semibold text-gray-900">{currentLesson}</span>
                    </label>
                </div>
                <textarea
                    placeholder="Write your notes here... (Tip: Take notes on key concepts, questions, or ideas to remember)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 mb-6 resize-none"
                    rows="10"
                    autoFocus
                />
                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 py-3 px-4 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!note.trim() || saving}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 font-semibold transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? "Saving..." : "Save Note"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const MessageInstructorModal = ({ onClose, instructor, onSend, loading, error }) => {
    const [message, setMessage] = useState("");
    const instructorName = instructor?.name || instructor?.firstName || "Instructor";

    const handleSend = async () => {
        if (!message.trim()) {
            alert("Please type a message");
            return;
        }
        try {
            await onSend(message);
            setMessage("");
        } catch (err) {
            console.error("Failed to send message:", err);
            // Error will be displayed by parent via error prop
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="font-black text-gray-900 text-2xl flex items-center gap-2">
                            <MessageCircle className="w-6 h-6 text-orange-500" />
                            Message {instructorName}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Send a message to your instructor
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}
                <textarea
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 mb-6"
                    rows="6"
                    disabled={loading}
                />
                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 py-3 px-4 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={loading || !message.trim()}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 font-semibold transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Sending..." : "Send Message"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CourseLearningPage;
