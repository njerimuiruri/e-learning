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
    Play,
    Lock,
    Download,
    FileDown,
    Home,
    ArrowLeft,
} from "lucide-react";
import courseService from "@/lib/api/courseService";
import { noteService } from "@/lib/api/noteService";
import messageService from "@/lib/api/messageService";
import ModuleProgressionGuard from "@/components/ModuleProgressionGuard";
import FinalAssessmentGuard from "@/components/FinalAssessmentGuard";
import { resolveAssetUrl } from "@/lib/utils/resolveAssetUrl";

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
    const [autoOpenAssessment, setAutoOpenAssessment] = useState(false);
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
    const [activeTab, setActiveTab] = useState("outline"); // outline or resources

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

                    // Check if student was in middle of assessment
                    if (enrollmentData.inModuleAssessment && enrollmentData.lastActivityType === 'module_assessment') {
                        setAutoOpenAssessment(true);
                    }

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

    // Auto-open assessment if student was in the middle of one
    useEffect(() => {
        if (autoOpenAssessment && !loading && course) {
            setCurrentPage("assessment");
            setAutoOpenAssessment(false);
        }
    }, [autoOpenAssessment, loading, course]);

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
    useEffect(() => {
        if (!course) return;
        if (moduleIndex < 0) return;
        if (!enrollment) return;

        const moduleProgress = enrollment?.moduleProgress || [];
        const previousModuleProgress = moduleProgress.find(mp => mp.moduleIndex === moduleIndex - 1);
        const canAccessCurrent = moduleIndex === 0 || (previousModuleProgress?.assessmentPassed === true);

        setShowModuleGuard(!canAccessCurrent);
    }, [course, moduleIndex, enrollment]);

    const persistLessonProgress = async ({ moduleIdx, lessonIdx, completed = false }) => {
        try {
            if (!enrollment?._id) return;
            await courseService.updateLessonProgress(enrollment._id, moduleIdx, lessonIdx, completed);
            const refreshed = await courseService.getEnrollment(courseId);
            setEnrollment(refreshed);
        } catch (err) {
            console.error("Failed to update lesson progress", err);
        }
    };

    useEffect(() => {
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
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 flex items-center justify-center">
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
                        className="bg-[#021d49] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#032e6b] transition"
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

            const newXP = totalXP + (activeModule.xpReward || 310);
            setTotalXP(newXP);

            setShowXPBoost(true);

            if (newCompletedModules.length === course.modules.length) {
                setTimeout(() => {
                    setShowCertificate(true);
                }, 2000);
            }
        }
    };

    const handleDownloadCertificate = () => {
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
        <div className="min-h-screen bg-gray-100">
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

            {/* Top Navigation Bar */}
            <div className="bg-[#021d49] text-white shadow-lg sticky top-0 z-50">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push(`/courses/${courseId}`)}
                                className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-lg transition"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                <span className="hidden md:inline font-medium">Exit Course</span>
                            </button>
                            <div className="hidden md:block border-l border-white/20 pl-4">
                                <h1 className="text-lg font-bold truncate max-w-md">{course?.title}</h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                                <Target className="w-5 h-5" />
                                <span className="font-semibold">{calculateProgress()}% Complete</span>
                            </div>
                            <button
                                onClick={() => router.push('/student')}
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition"
                                title="Dashboard"
                            >
                                <Home className="w-5 h-5" />
                                <span className="hidden md:inline font-medium">Dashboard</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex h-[calc(100vh-72px)]">
                {/* Left Sidebar - Course Outline */}
                <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-200 overflow-hidden flex-shrink-0`}>
                    <div className="h-full overflow-y-auto">
                        {/* Tabs */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
                            <div className="flex">
                                <button
                                    onClick={() => setActiveTab("outline")}
                                    className={`flex-1 py-4 px-4 font-semibold text-sm transition ${activeTab === "outline"
                                        ? "text-[#021d49] border-b-2 border-[#021d49] bg-blue-50"
                                        : "text-gray-600 hover:text-gray-900"
                                        }`}
                                >
                                    <BookOpen className="w-4 h-4 inline mr-2" />
                                    Course Outline
                                </button>
                                <button
                                    onClick={() => setActiveTab("resources")}
                                    className={`flex-1 py-4 px-4 font-semibold text-sm transition ${activeTab === "resources"
                                        ? "text-[#021d49] border-b-2 border-[#021d49] bg-blue-50"
                                        : "text-gray-600 hover:text-gray-900"
                                        }`}
                                >
                                    <FileDown className="w-4 h-4 inline mr-2" />
                                    Resources
                                </button>
                            </div>
                        </div>

                        {/* Course Outline Tab */}
                        {activeTab === "outline" && (
                            <div className="p-4">
                                <div className="mb-4">
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold text-gray-700">Your Progress</span>
                                            <span className="text-lg font-bold text-[#021d49]">{calculateProgress()}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-[#021d49] to-blue-600 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${calculateProgress()}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
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
                                                className={`border rounded-lg overflow-hidden ${isCurrentModule ? 'border-[#021d49] ring-2 ring-[#021d49]/20' : 'border-gray-200'}`}
                                            >
                                                <button
                                                    onClick={() => toggleModule(modId)}
                                                    className={`w-full flex items-center gap-3 p-3 transition-all ${isCurrentModule
                                                        ? "bg-[#021d49] text-white"
                                                        : "hover:bg-gray-50 bg-white text-gray-900"
                                                        }`}
                                                >
                                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 ${isCurrentModule ? 'bg-white/20' : 'bg-gray-100'}`}>
                                                        {moduleCompleted ? (
                                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                        ) : (
                                                            <span className={`text-sm font-bold ${isCurrentModule ? 'text-white' : 'text-gray-600'}`}>
                                                                {mIdx + 1}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <div className="text-xs font-semibold opacity-75 mb-1">
                                                            Module {mIdx + 1}
                                                        </div>
                                                        <div className="text-sm font-bold line-clamp-2">
                                                            {m.title}
                                                        </div>
                                                    </div>
                                                    <ChevronDown
                                                        className={`w-5 h-5 transition-transform ${expandedModules.includes(modId) ? "rotate-0" : "-rotate-90"}`}
                                                    />
                                                </button>

                                                {expandedModules.includes(modId) && (
                                                    <div className="bg-gray-50 border-t border-gray-200">
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
                                                                    className={`w-full flex items-center gap-3 p-3 text-left transition-all border-l-4 ${isCurrent
                                                                        ? "bg-blue-50 border-[#021d49]"
                                                                        : isCompleted
                                                                            ? "hover:bg-white border-green-500"
                                                                            : locked
                                                                                ? "opacity-50 cursor-not-allowed border-transparent"
                                                                                : "hover:bg-white border-transparent"
                                                                        }`}
                                                                    disabled={locked}
                                                                >
                                                                    <div
                                                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${isCompleted
                                                                            ? "bg-green-100 text-green-700"
                                                                            : isCurrent
                                                                                ? "bg-[#021d49] text-white"
                                                                                : locked
                                                                                    ? "bg-gray-200 text-gray-500"
                                                                                    : "bg-gray-200 text-gray-600"
                                                                            }`}
                                                                    >
                                                                        {isCompleted ? (
                                                                            <CheckCircle2 className="w-4 h-4" />
                                                                        ) : locked ? (
                                                                            <Lock className="w-3 h-3" />
                                                                        ) : (
                                                                            <Play className="w-3 h-3" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className={`text-sm font-medium truncate ${isCurrent ? 'text-[#021d49]' : 'text-gray-700'}`}>
                                                                            {l.title}
                                                                        </div>
                                                                        {l.duration && (
                                                                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                                                <Clock className="w-3 h-3" />
                                                                                {l.duration}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Resources Tab */}
                        {activeTab === "resources" && (
                            <div className="p-4">
                                <div className="space-y-3">
                                    <h3 className="font-bold text-gray-900 mb-4">Course Resources</h3>

                                    <button
                                        onClick={() => setShowNoteModal(true)}
                                        className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:shadow-md transition"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-[#021d49] text-white flex items-center justify-center">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="font-semibold text-gray-900">Add Note</div>
                                            <div className="text-xs text-gray-600">Take notes as you learn</div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => router.push(`/courses/${courseId}/discussion?module=${moduleIndex}`)}
                                        className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg hover:shadow-md transition"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center">
                                            <MessageCircle className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="font-semibold text-gray-900">Discussion</div>
                                            <div className="text-xs text-gray-600">Ask questions & discuss</div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setShowNotesList(true)}
                                        className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg hover:shadow-md transition"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center">
                                            <BookOpen className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="font-semibold text-gray-900">My Notes ({notes.length})</div>
                                            <div className="text-xs text-gray-600">View all your notes</div>
                                        </div>
                                    </button>

                                    {activeLesson?.documentUrl && (
                                        <a
                                            href={resolveAssetUrl(activeLesson.documentUrl)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg hover:shadow-md transition"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center">
                                                <Download className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="font-semibold text-gray-900">Lesson Materials</div>
                                                <div className="text-xs text-gray-600">Download resources</div>
                                            </div>
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Toggle Sidebar Button */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="fixed left-0 top-1/2 transform -translate-y-1/2 bg-[#021d49] text-white p-2 rounded-r-lg shadow-lg z-40 hover:bg-[#032e6b] transition"
                    style={{ left: sidebarOpen ? '320px' : '0' }}
                >
                    <ChevronRight className={`w-5 h-5 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50">
                    <div className="max-w-5xl mx-auto p-6">
                        {currentPage === "lesson" && <LessonSection lesson={activeLesson} />}

                        {currentPage === "questions" && (
                            <QuestionsSection
                                lesson={activeLesson}
                                answers={answers}
                                onAnswer={handleAnswer}
                                onSubmit={() => {
                                    handleNext();
                                    setAnswers({});
                                }}
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
                                    className="flex-1 py-4 px-6 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
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
                                    className="flex-1 py-4 px-6 bg-gradient-to-r from-[#021d49] to-blue-700 text-white rounded-xl hover:from-[#032e6b] hover:to-blue-800 font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
                                >
                                    {lessonIndex < lessons.length - 1 ? 'Next Lesson' : 'Complete Module'}
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

            {showNotesList && (
                <NotesListModal
                    notes={notes}
                    onClose={() => setShowNotesList(false)}
                    onDelete={(idx) => {
                        const newNotes = notes.filter((_, i) => i !== idx);
                        setNotes(newNotes);
                    }}
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

                <div className="p-12 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                    <div className="border-8 border-double border-[#021d49] rounded-2xl p-12 bg-white relative">
                        <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-blue-400"></div>
                        <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-blue-400"></div>
                        <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-blue-400"></div>
                        <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-blue-400"></div>

                        <div className="text-center mb-8">
                            <div className="inline-block bg-gradient-to-r from-[#021d49] to-blue-700 text-white px-6 py-2 rounded-full mb-4">
                                <Trophy className="w-6 h-6 inline mr-2" />
                                <span className="font-bold text-lg">
                                    Certificate of Completion
                                </span>
                            </div>
                            <h1 className="text-5xl font-black text-gray-900 mb-2">
                                Congratulations!
                            </h1>
                            <div className="w-32 h-1 bg-gradient-to-r from-[#021d49] to-blue-700 mx-auto rounded-full"></div>
                        </div>

                        <div className="text-center mb-8 space-y-6">
                            <p className="text-gray-600 text-lg">This is to certify that</p>

                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
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
                                    <Clock className="w-8 h-8 text-[#021d49] mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">Duration</p>
                                    <p className="font-bold text-gray-900">{course.duration}</p>
                                </div>
                                <div className="text-center">
                                    <Award className="w-8 h-8 text-[#021d49] mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">Level</p>
                                    <p className="font-bold text-gray-900">{course.level}</p>
                                </div>
                                <div className="text-center">
                                    <Star className="w-8 h-8 text-[#021d49] mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">Rating</p>
                                    <p className="font-bold text-gray-900">{course.rating}/5.0</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-around items-end border-t-2 border-gray-200 pt-8 mt-8">
                            <div className="text-center">
                                <div className="mb-2">
                                    <div className="h-16 flex items-center justify-center">
                                        <Sparkles className="w-12 h-12 text-[#021d49]" />
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
                                        <Award className="w-12 h-12 text-[#021d49]" />
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
                        className="flex-1 bg-gradient-to-r from-[#021d49] to-blue-700 text-white py-4 rounded-xl font-bold text-lg hover:from-[#032e6b] hover:to-blue-800 transition-all shadow-lg flex items-center justify-center gap-2"
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
        {/* Lesson Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {lesson.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                        {lesson.duration && (
                            <div className="flex items-center gap-2 text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span>{lesson.duration}</span>
                            </div>
                        )}
                        {lesson.questions?.length > 0 && (
                            <div className="flex items-center gap-2 text-gray-600">
                                <BookOpen className="w-4 h-4" />
                                <span>{lesson.questions.length} questions</span>
                            </div>
                        )}
                        {lesson.xpReward && (
                            <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                                <Zap className="w-4 h-4" />
                                <span className="font-semibold">+{lesson.xpReward} XP</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Video Player */}
        {lesson.type === "video" && lesson.videoUrl && (
            <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg">
                <div className="aspect-video">
                    <iframe
                        width="100%"
                        height="100%"
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

        {/* Lesson Content */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            {lesson.content && (
                <div className="prose prose-lg max-w-none mb-8">
                    <div
                        className="lesson-content"
                        dangerouslySetInnerHTML={{
                            __html: formatLessonContent(lesson.content),
                        }}
                    />
                </div>
            )}

            {lesson.topics && lesson.topics.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 mb-8">
                    <h3 className="font-bold text-gray-900 text-xl mb-4 flex items-center gap-2">
                        <Star className="w-5 h-5 text-[#021d49]" />
                        Key Topics Covered
                    </h3>
                    <ul className="space-y-3">
                        {lesson.topics.map((topic, idx) => (
                            <li key={idx} className="flex gap-3 text-gray-700">
                                <span className="text-[#021d49] font-bold text-xl flex-shrink-0">
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

const QuestionsSection = ({ lesson, answers, onAnswer, onSubmit }) => {
    const [submitting, setSubmitting] = useState(false);
    const [allAnswered, setAllAnswered] = useState(false);

    useEffect(() => {
        if (!lesson?.questions || lesson.questions.length === 0) return;

        // Check if all questions are answered
        const answered = lesson.questions.every(question => {
            const questionId = question.id || question._id;
            return answers[questionId] !== undefined && answers[questionId] !== null && answers[questionId] !== '';
        });
        setAllAnswered(answered);
    }, [answers, lesson?.questions]);

    const handleSubmitQuestions = async () => {
        if (!allAnswered) {
            alert("Please answer all questions before proceeding.");
            return;
        }

        setSubmitting(true);
        try {
            // Questions answered - proceed to next lesson
            if (onSubmit) {
                onSubmit();
            }
        } catch (error) {
            console.error("Error submitting questions:", error);
            alert("Failed to submit. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!lesson?.questions || lesson.questions.length === 0) {
        return (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <p className="text-gray-600 text-center">No questions available for this lesson.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <span className="inline-block bg-gradient-to-r from-[#021d49] to-blue-700 text-white text-sm px-4 py-2 rounded-full font-bold">
                        <Star className="w-4 h-4 inline mr-1" />
                        Knowledge Check
                    </span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Check Your Understanding
                </h2>
                <p className="text-gray-600 text-lg">
                    Answer the following questions to reinforce your learning. You must answer all questions to proceed.
                </p>
            </div>

            <div className="space-y-6">
                {lesson.questions.map((question, idx) => {
                    const questionId = question.id || question._id || idx;
                    const isAnswered = answers[questionId] !== undefined && answers[questionId] !== null && answers[questionId] !== '';

                    return (
                        <div
                            key={questionId}
                            className={`border-2 rounded-xl p-6 transition-all ${isAnswered
                                    ? 'border-green-300 bg-green-50'
                                    : 'border-gray-200 bg-gray-50'
                                }`}
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
                                        return (
                                            <label
                                                key={optIdx}
                                                className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${answers[questionId] == optIdx
                                                    ? "border-[#021d49] bg-blue-50"
                                                    : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`question-${questionId}`}
                                                    value={optIdx}
                                                    onChange={(e) => onAnswer(questionId, e.target.value)}
                                                    checked={answers[questionId] == optIdx}
                                                    className="w-5 h-5 mt-0.5 text-[#021d49] focus:ring-[#021d49]"
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
                                    className="w-full p-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#021d49] transition-all"
                                    rows="5"
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                    <span className="font-semibold">Progress:</span> {Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== '' && answers[k] !== null).length} of {lesson.questions.length} questions answered
                </p>
            </div>

            <div className="flex gap-4">
                <button
                    disabled={true}
                    className="flex-1 py-4 px-6 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Previous
                </button>
                <button
                    onClick={handleSubmitQuestions}
                    disabled={!allAnswered || submitting}
                    className="flex-1 py-4 px-6 bg-gradient-to-r from-[#021d49] to-blue-700 text-white rounded-xl hover:from-[#032e6b] hover:to-blue-800 font-semibold transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? (
                        <>
                            <Clock className="w-5 h-5 animate-spin" />
                            Submitting...
                        </>
                    ) : !allAnswered ? (
                        <>
                            <AlertCircle className="w-5 h-5" />
                            Answer All Questions
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-5 h-5" />
                            Submit & Continue
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

const AssessmentSection = ({ module, moduleIndex, enrollmentId, onComplete }) => {
    const [assessmentAnswers, setAssessmentAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const assessment = module?.moduleAssessment || module?.assessment;

    if (!module || !assessment || !assessment.questions || assessment.questions.length === 0) {
        return (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <p className="text-gray-600">No assessment available for this module.</p>
            </div>
        );
    }

    const handleAssessmentAnswer = (questionId, answer, index) => {
        setAssessmentAnswers({ ...assessmentAnswers, [questionId]: { value: answer, index } });
    };

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);

        try {
            const answersArray = assessment.questions.map((q, idx) => {
                const questionId = q.id || q._id || idx;
                const selected = assessmentAnswers[questionId];
                const selectedValue = typeof selected === 'object' && selected !== null ? selected.value : selected;
                const selectedIndex = typeof selected === 'object' && selected !== null ? selected.index : selected;

                if (selectedValue !== undefined && selectedValue !== null) {
                    return selectedValue;
                }
                if (selectedIndex !== undefined && selectedIndex !== null) {
                    return selectedIndex;
                }
                return null;
            });

            const result = await courseService.submitModuleAssessment(enrollmentId, moduleIndex, answersArray);

            setSubmitted(result.passed);

            if (result.passed) {
                alert(`🎉 Congratulations! You passed with ${result.score}%`);
            } else {
                const attemptsRemaining = result.attemptsRemaining || 0;
                if (result.mustRestartCourse && result.autoRestarted) {
                    // Auto-restart occurred - redirect to the failed module's first lesson
                    alert(`You scored ${result.score}%.\n\n${result.message || 'Your course has been automatically restarted. Your previous progress has been saved for review. You can now start fresh from this module.'}\n\nYou can now begin again with a fresh start!`);
                    // Redirect to the failed module's first lesson
                    window.location.href = `/courses/${courseId}/learn/${moduleParam}/0`;
                } else if (result.mustRestartCourse) {
                    alert(`You scored ${result.score}%. You've used all 3 attempts.\n\nYour course will be automatically restarted to give you another chance. Your previous attempt has been saved for analytics.`);
                } else {
                    alert(`You scored ${result.score}%. You need ${result.passingScore}% to pass.\n\nYou have ${attemptsRemaining} attempt(s) remaining. Keep trying!`);
                }
            }

            onComplete(result.passed);
        } catch (error) {
            console.error("Error submitting assessment:", error);
            alert("Failed to submit assessment. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <span className="inline-block bg-gradient-to-r from-[#021d49] to-blue-700 text-white text-sm px-4 py-2 rounded-full font-bold shadow-lg">
                        <Trophy className="w-4 h-4 inline mr-1" />
                        Module Assessment
                    </span>
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-3">
                    {assessment?.title || "Module Assessment"}
                </h2>
                <p className="text-gray-600 text-lg">
                    Complete all questions to finish this module. Passing score:{" "}
                    <span className="font-bold text-[#021d49]">
                        {assessment?.passingScore || 70}%
                    </span>
                </p>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 mb-8 border border-yellow-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Award className="w-8 h-8 text-[#021d49]" />
                        <div>
                            <p className="font-bold text-gray-900">Module XP Reward</p>
                            <p className="text-sm text-gray-600">Complete to earn XP</p>
                        </div>
                    </div>
                    <span className="text-3xl font-black text-[#021d49]">
                        +{module?.xpReward || 0} XP
                    </span>
                </div>
            </div>

            <div className="space-y-6">
                {assessment.questions.map((question, idx) => {
                    const questionId = question.id || question._id || idx;
                    const questionText = question.question || question.text || `Question ${idx + 1}`;

                    let options = [];
                    const questionType = (question.type || '').toLowerCase().trim();

                    if (questionType.includes('true') || questionType.includes('false') || questionType === 'boolean') {
                        options = ['True', 'False'];
                    } else {
                        if (question.options && Array.isArray(question.options) && question.options.length > 0) {
                            const validOptions = question.options.filter(opt => typeof opt === 'string' && opt.trim() !== '');
                            if (validOptions.length > 0) {
                                options = validOptions;
                            }
                        }

                        if (options.length === 0) {
                            if (questionType === 'mcq' || questionType === 'multiple_choice' || questionType === 'multiple choice') {
                                options = ['Option A', 'Option B', 'Option C', 'Option D'];
                            } else {
                                options = ['True', 'False'];
                            }
                        }
                    }

                    return (
                        <div
                            key={questionId}
                            className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50"
                        >
                            <p className="font-bold text-gray-900 mb-4 text-lg flex items-start gap-3">
                                <span className="bg-[#021d49] text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                                    {idx + 1}
                                </span>
                                {questionText}
                            </p>

                            {options.length > 0 ? (
                                <div className="space-y-3">
                                    {options.map((option, optIdx) => (
                                        <label
                                            key={optIdx}
                                            className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${assessmentAnswers[questionId]?.index == optIdx
                                                ? "border-[#021d49] bg-blue-50"
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
                                                className="w-5 h-5 mt-0.5 text-[#021d49] focus:ring-[#021d49]"
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
                                    className="w-full p-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#021d49] transition-all"
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
                className="w-full mt-8 bg-gradient-to-r from-[#021d49] to-blue-700 hover:from-[#032e6b] hover:to-blue-800 text-white py-5 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
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
                        <FileText className="w-6 h-6 text-[#021d49]" />
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
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#021d49] mb-6 resize-none"
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
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-[#021d49] to-blue-700 text-white rounded-xl hover:from-[#032e6b] hover:to-blue-800 font-semibold transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="font-black text-gray-900 text-2xl flex items-center gap-2">
                            <MessageCircle className="w-6 h-6 text-[#021d49]" />
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
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#021d49] mb-6"
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
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-[#021d49] to-blue-700 text-white rounded-xl hover:from-[#032e6b] hover:to-blue-800 font-semibold transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Sending..." : "Send Message"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const NotesListModal = ({ notes, onClose, onDelete }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="font-black text-gray-900 text-2xl flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-[#021d49]" />
                            My Notes ({notes.length})
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {notes.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p>No notes yet. Start taking notes as you learn!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {notes.map((note, idx) => (
                                <div
                                    key={idx}
                                    className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <span className="text-sm font-semibold text-[#021d49]">
                                                {note.lesson}
                                            </span>
                                            <span className="text-xs text-gray-500 ml-2">
                                                {note.timestamp}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => onDelete(idx)}
                                            className="text-gray-400 hover:text-red-500 transition p-1"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-gray-700 whitespace-pre-wrap text-sm">
                                        {note.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseLearningPage;
