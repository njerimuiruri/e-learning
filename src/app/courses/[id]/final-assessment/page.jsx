"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    AlertCircle,
    Award,
    BookOpen,
    CheckCircle2,
    ChevronLeft,
    Clock,
    FileText,
    Home,
    RefreshCw,
    Sparkles,
    Target,
    TrendingUp,
    Trophy,
    X,
} from "lucide-react";
import courseService from "@/lib/api/courseService";
import FinalAssessmentGuard from "@/components/FinalAssessmentGuard";
import { canAccessFinalAssessment } from "@/lib/utils/courseProgressionLogic";
import { useToast } from "@/components/ui/ToastProvider";


const FinalAssessmentPage = () => {
    const router = useRouter();
    const params = useParams();
    const courseId = params.id;
    const { showToast } = useToast();

    const [course, setCourse] = useState(null);
    const [enrollment, setEnrollment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [showDetailedReview, setShowDetailedReview] = useState(false);
    const [answers, setAnswers] = useState({});
    const [score, setScore] = useState(null);
    const [passed, setPassed] = useState(null);
    const [pendingReview, setPendingReview] = useState(false);
    const [showGuard, setShowGuard] = useState(false);
    const [started, setStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [showCertificate, setShowCertificate] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(3600);
    const [refreshing, setRefreshing] = useState(false);

    const storageKey = typeof window !== "undefined" ? `final_assessment_${courseId}` : null;

    useEffect(() => {
        const ensureEnrollment = async () => {
            try {
                const enrollmentData = await courseService.getEnrollment(courseId);
                setEnrollment(enrollmentData);
                return enrollmentData;
            } catch (err) {
                // Auto-enroll if the student somehow lost enrollment but is trying to take the final
                if (err?.response?.status === 404 || err?.status === 404) {
                    try {
                        const newEnrollment = await courseService.enrollCourse(courseId);
                        setEnrollment(newEnrollment);
                        return newEnrollment;
                    } catch (enrollErr) {
                        console.error("Failed to auto-enroll for final assessment", enrollErr);
                        showToast('Error accessing course enrollment. Please try again.', { type: 'error', title: 'Enrollment Error' });
                    }
                } else {
                    console.log("Could not fetch enrollment data:", err?.message);
                }
                return null;
            }
        };

        const fetchCourse = async () => {
            try {
                setLoading(true);
                const data = await courseService.getCourseById(courseId);
                setCourse(data);

                if (!data.finalAssessment || !data.finalAssessment.questions.length) {
                    router.push(`/courses/${courseId}`);
                    return;
                }

                // Fetch enrollment data to check progression
                const enrollmentData = await ensureEnrollment();

                if (enrollmentData) {
                    const totalModules = data.modules?.length || 0;
                    const moduleProgress = enrollmentData.moduleProgress || [];
                    const access = canAccessFinalAssessment(totalModules, moduleProgress);

                    if (!access.canAccess) {
                        setShowGuard(true);
                    }
                }
            } catch (err) {
                console.error("Failed to load course", err);
                showToast('Failed to load course. Please try again.', { type: 'error', title: 'Load Error' });
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [courseId, router]);

    // Load assessment status from backend - check if student has submitted
    useEffect(() => {
        const fetchAssessmentStatus = async () => {
            if (!enrollment?._id || !course?.finalAssessment) return;

            try {
                // Check enrollment data for final assessment submission
                if (enrollment.finalAssessmentAttempts > 0) {
                    // Student has submitted at least once
                    const results = enrollment.finalAssessmentResults || [];

                    // Reconstruct answers from results
                    const reconstructedAnswers = {};
                    results.forEach((result, idx) => {
                        const question = course?.finalAssessment?.questions?.[idx];
                        if (question) {
                            const questionId = question.id || question._id || idx;
                            reconstructedAnswers[questionId] = result.studentAnswer || result.userAnswer;
                        }
                    });

                    setAnswers(reconstructedAnswers);
                    setScore(enrollment.finalAssessmentScore ?? null);
                    setPassed(enrollment.finalAssessmentPassed ?? null);
                    setPendingReview((enrollment.pendingManualGradingCount || 0) > 0);
                    setSubmitted(true);
                    setStarted(false);
                    setShowDetailedReview(false);
                    setTimeRemaining(3600);
                }
            } catch (err) {
                console.warn("Failed to fetch assessment status", err);
            }
        };

        if (enrollment && course?.finalAssessment) {
            fetchAssessmentStatus();
        }
    }, [enrollment, course?.finalAssessment]);

    // Countdown timer once assessment starts
    useEffect(() => {
        if (!started || submitted) return;

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [started, submitted]);

    const handleStart = () => {
        // If a submission already exists, keep the student on the results screen
        if (submitted) return;

        setStarted(true);
        setSubmitted(false);
        setCurrentQuestion(0);
        setAnswers({});
        setScore(null);
        setPassed(null);
        setPendingReview(false);
        setTimeRemaining(3600);
    };

    const handleRefreshStatus = async () => {
        try {
            setRefreshing(true);
            // Re-fetch enrollment to get latest grading status
            const enrollmentData = await courseService.getEnrollment(courseId);
            setEnrollment(enrollmentData);

            // Update UI based on new enrollment data
            if (enrollmentData.finalAssessmentAttempts > 0) {
                setScore(enrollmentData.finalAssessmentScore ?? score);
                setPassed(enrollmentData.finalAssessmentPassed ?? passed);
                setPendingReview((enrollmentData.pendingManualGradingCount || 0) > 0);
            }
        } catch (err) {
            console.error('Failed to refresh status:', err);
            showToast('Could not refresh status. Please try again.', { type: 'error', title: 'Refresh failed' });
        } finally {
            setRefreshing(false);
        }
    };

    const handleAnswer = (questionId, value) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
    };

    const handlePrevious = () => {
        setCurrentQuestion((prev) => Math.max(prev - 1, 0));
    };

    const handleNext = () => {
        if (!assessment) return;
        setCurrentQuestion((prev) => Math.min(prev + 1, assessment.questions.length - 1));
    };

    const handleSubmit = async () => {
        if (!assessment) return;

        console.log('🎯 Starting assessment submission...');
        console.log('   Enrollment ID:', enrollment?._id);
        console.log('   Course ID:', courseId);
        console.log('   Total questions:', assessment.questions.length);

        const normalizeVal = (val) => {
            if (val === undefined || val === null) return "";
            return String(val).trim().toLowerCase();
        };
        const autoGradable = assessment.questions.filter(
            (q) => (q.type || "").toLowerCase() !== "essay"
        );

        const hasEssay = assessment.questions.some(
            (q) => (q.type || "").toLowerCase() === "essay"
        );

        const total = autoGradable.length;
        let correct = 0;

        autoGradable.forEach((q, idx) => {
            const questionId = q.id || q._id || idx;
            const userAnswer = answers[questionId];
            const correctAnswer = q.correctAnswer;

            if (normalizeVal(userAnswer) === normalizeVal(correctAnswer)) {
                correct++;
            }
        });

        const calculatedScore = total > 0 ? Math.round((correct / total) * 100) : 100;

        // If essays exist, mark as pending review; auto-graded score is provisional
        if (hasEssay) {
            setPendingReview(true);
            setPassed(null);
        } else {
            setPendingReview(false);
            setPassed(calculatedScore >= (assessment.passingScore || 70));
        }

        setScore(calculatedScore);
        setSubmitted(true);

        // Submit to backend API
        try {
            if (enrollment?._id) {
                // Convert answers object to array format expected by backend
                const answersArray = assessment.questions.map((q, idx) => {
                    const questionId = q.id || q._id || idx;
                    return answers[questionId] !== undefined ? answers[questionId] : '';
                });

                console.log('📤 Sending submission to backend...');
                console.log('   API Endpoint: /api/courses/enrollment/' + enrollment._id + '/final-assessment');
                console.log('   Answers count:', answersArray.length);
                console.log('   Has essays:', hasEssay);

                const response = await courseService.submitFinalAssessment(enrollment._id, answersArray);

                console.log('✅ Submission response:', response);
            } else {
                console.warn('⚠️ No enrollment ID, submission may not save to backend');
            }
        } catch (err) {
            console.error("❌ Failed to submit to backend", err);
            console.error("   Error message:", err.message);
            console.error("   Error response:", err.response?.data);
            showToast("Warning: Your submission may not have been saved. Please contact support.", { type: 'warning', title: 'Submission warning' });
        }

        // Save to localStorage as backup
        if (storageKey) {
            try {
                localStorage.setItem(
                    storageKey,
                    JSON.stringify({
                        submitted: true,
                        answers,
                        score: calculatedScore,
                        passed: hasEssay ? null : (calculatedScore >= (assessment.passingScore || 70)),
                        pendingReview: hasEssay,
                        savedAt: new Date().toISOString(),
                    })
                );
            } catch (err) {
                console.warn("Failed to save assessment state", err);
            }
        }
    };

    const assessment = course?.finalAssessment;
    const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
    const progress = assessment ? Math.round(((currentQuestion + 1) / assessment.questions.length) * 100) : 0;


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-red-50 to-blue-50">
                <p className="text-lg text-gray-700">Loading final assessment...</p>
            </div>
        );
    }

    if (!course || !assessment) {
        return null;
    }

    if (showGuard) {
        return <FinalAssessmentGuard course={course} />;
    }

    // Intro screen
    if (!started && !submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-blue-50">
                <div className="max-w-5xl mx-auto px-4 py-16">
                    <div className="bg-white rounded-3xl shadow-2xl p-10 border-4 border-orange-200">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-2xl shadow-lg">
                                <Trophy className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-semibold">Final Assessment</p>
                                <h1 className="text-3xl font-black text-gray-900">{course.title}</h1>
                            </div>
                        </div>

                        <p className="text-gray-700 text-lg leading-relaxed mb-8">
                            Show what you learned across the course. You need a score of {assessment.passingScore}% or higher to pass and earn your certificate.
                        </p>

                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-500 text-white p-4 rounded-xl shadow-lg">
                                        <BookOpen className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 font-semibold">Total Questions</p>
                                        <p className="text-3xl font-black text-gray-900">{assessment.questions.length}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-200 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="bg-purple-500 text-white p-4 rounded-xl shadow-lg">
                                        <Clock className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 font-semibold">Time Allowed</p>
                                        <p className="text-3xl font-black text-gray-900">60 Minutes</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-200 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="bg-green-500 text-white p-4 rounded-xl shadow-lg">
                                        <Target className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 font-semibold">Passing Score</p>
                                        <p className="text-3xl font-black text-gray-900">{assessment.passingScore}%</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border-2 border-orange-200 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="bg-[#021d49] text-white p-4 rounded-xl shadow-lg">
                                        <Award className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 font-semibold">Certificate</p>
                                        <p className="text-3xl font-black text-gray-900">Included</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6 mb-8">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                                <AlertCircle className="w-6 h-6 text-yellow-600" />
                                Assessment Guidelines
                            </h3>
                            <ul className="space-y-2 text-gray-700">
                                <li>You have 60 minutes to complete all questions.</li>
                                <li>Questions include multiple choice, true/false, and open-ended essay questions.</li>
                                <li>For essay questions, your responses will be reviewed by the instructor.</li>
                                <li>You can navigate back and forth between questions.</li>
                                <li>Submit when ready; you cannot change answers after submission.</li>
                            </ul>
                        </div>

                        {submitted ? (
                            <div className="w-full bg-green-50 border-2 border-green-200 text-green-800 py-4 rounded-2xl font-semibold text-center">
                                You already submitted this assessment. View your results below.
                            </div>
                        ) : (
                            <button
                                onClick={handleStart}
                                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-6 rounded-2xl font-black text-2xl hover:from-orange-600 hover:to-red-600 transition-all shadow-xl flex items-center justify-center gap-3"
                            >
                                <Sparkles className="w-8 h-8" />
                                Begin Assessment
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Results screen
    const handleDownloadCertificate = async () => {
        if (!enrollment?.certificateId) {
            showToast("Certificate ID not available. Please contact support.", { type: 'error', title: 'Certificate unavailable' });
            return;
        }

        try {
            // Download the certificate PDF using courseService
            const blob = await courseService.downloadCertificate(enrollment.certificateId);

            // Create blob and download
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `certificate-${enrollment.certificateId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to download certificate:', err);
            showToast('Failed to download certificate. Please try again.', { type: 'error', title: 'Download failed' });
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-blue-50">
                {showCertificate && (
                    <CertificateModal
                        course={course}
                        userName={enrollment?.studentId?.firstName || "Student"}
                        completionDate={new Date(enrollment?.completedAt || Date.now()).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                        score={score}
                        onClose={() => setShowCertificate(false)}
                        onDownload={handleDownloadCertificate}
                    />
                )}

                <div className="max-w-4xl mx-auto px-4 py-12">
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-orange-200">
                        <div
                            className={`${passed === true
                                ? "bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"
                                : passed === false
                                    ? "bg-gradient-to-r from-red-500 via-orange-500 to-pink-500"
                                    : "bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500"} text-white p-12 text-center relative overflow-hidden`}
                        >
                            <div className="absolute inset-0 bg-black/10"></div>
                            <div className="relative z-10">
                                {pendingReview ? (
                                    <>
                                        <div className="bg-white/20 backdrop-blur-sm rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
                                            <Clock className="w-20 h-20 text-white" />
                                        </div>
                                        <h1 className="text-4xl font-black mb-2">Pending Instructor Review</h1>
                                        <p className="text-xl text-white/90 mb-2">Auto-graded score: {score?.toFixed(1)}%</p>
                                        <p className="text-white/90">Essays need review before the final result and certificate.</p>
                                    </>
                                ) : passed ? (
                                    <>
                                        <div className="bg-white/20 backdrop-blur-sm rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
                                            <Trophy className="w-20 h-20 text-white" />
                                        </div>
                                        <h1 className="text-4xl font-black mb-2">You Passed!</h1>
                                        <p className="text-xl text-white/90 mb-2">Score: {score.toFixed(1)}%</p>
                                        <p className="text-white/90">Certificate is ready.</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="bg-white/20 backdrop-blur-sm rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
                                            <AlertCircle className="w-20 h-20 text-white" />
                                        </div>
                                        <h1 className="text-4xl font-black mb-2">Keep Going</h1>
                                        <p className="text-xl text-white/90 mb-2">Score: {score.toFixed(1)}%</p>
                                        <p className="text-white/90">You need {assessment.passingScore}% to pass.</p>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="p-10 bg-white">
                            <div className="grid md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200 text-center shadow-sm">
                                    <CheckCircle2 className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                                    <p className="text-sm text-gray-600 mb-2 font-semibold">Correct Answers</p>
                                    <p className="text-4xl font-black text-gray-900">
                                        {Math.round((score / 100) * assessment.questions.filter((q) => (q.type || "").toLowerCase() !== "essay").length)}/{assessment.questions.filter((q) => (q.type || "").toLowerCase() !== "essay").length || 1}
                                    </p>
                                </div>

                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-200 text-center shadow-sm">
                                    <Target className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                                    <p className="text-sm text-gray-600 mb-2 font-semibold">Passing Score</p>
                                    <p className="text-4xl font-black text-gray-900">{assessment.passingScore}%</p>
                                </div>

                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-200 text-center shadow-sm">
                                    <TrendingUp className="w-10 h-10 text-green-600 mx-auto mb-3" />
                                    <p className="text-sm text-gray-600 mb-2 font-semibold">Performance</p>
                                    <p className="text-4xl font-black text-gray-900">
                                        {score >= 90 ? "Excellent" : score >= 70 ? "Good" : score >= 50 ? "Fair" : "Needs Work"}
                                    </p>
                                </div>
                            </div>

                            {pendingReview && (
                                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 mb-6">
                                    <div className="flex gap-3 items-start mb-3">
                                        <Clock className="w-6 h-6 text-amber-600 mt-1" />
                                        <div className="flex-1">
                                            <p className="font-bold text-amber-900">⏳ Awaiting Instructor Feedback</p>
                                            <p className="text-amber-800 text-sm">
                                                Your essay responses are being reviewed by your instructor.
                                                You'll receive your final grade and certificate once the review is complete.
                                            </p>
                                            <p className="text-amber-700 text-xs mt-2">
                                                💡 Check back soon or you'll be notified when grading is complete.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleRefreshStatus}
                                        disabled={refreshing}
                                        className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                        {refreshing ? 'Checking...' : 'Check for Updates'}
                                    </button>
                                </div>
                            )}

                            {enrollment?.certificateEarned && enrollment?.certificateUrl && (
                                <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-4 mb-6 flex gap-3 items-start">
                                    <Award className="w-6 h-6 text-green-600 mt-1" />
                                    <div>
                                        <p className="font-bold text-green-900">🎉 Certificate Earned!</p>
                                        <p className="text-green-800 text-sm">
                                            Congratulations! Your instructor has reviewed your work and you've passed the course.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Detailed Review Section */}
                            <div className="mb-8">
                                <button
                                    onClick={() => setShowDetailedReview(!showDetailedReview)}
                                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-xl flex items-center justify-center gap-3 mb-4"
                                >
                                    <FileText className="w-6 h-6" />
                                    {showDetailedReview ? 'Hide' : 'View'} Detailed Review
                                </button>

                                {showDetailedReview && (
                                    <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Assessment Review</h3>
                                        <div className="space-y-4">
                                            {assessment.questions.map((q, idx) => {
                                                const userAnswer = answers[q.id || q._id || idx];
                                                const resultFromBackend = enrollment?.finalAssessmentResults?.[idx];

                                                // Use backend result if available, otherwise calculate
                                                const isCorrect = resultFromBackend
                                                    ? resultFromBackend.isCorrect
                                                    : (() => {
                                                        if (q.type === 'essay') return null;
                                                        const normalize = (val) => {
                                                            if (typeof val === "string") return val.trim().toLowerCase();
                                                            if (typeof val === "boolean") return String(val).toLowerCase();
                                                            return val;
                                                        };
                                                        return normalize(userAnswer) === normalize(q.correctAnswer);
                                                    })();

                                                const instructorFeedback = resultFromBackend?.instructorFeedback;
                                                const gradedAt = resultFromBackend?.gradedAt;

                                                const getQuestionTypeIcon = (type) => {
                                                    switch (type) {
                                                        case 'essay': return '📝';
                                                        case 'true-false': return '✓/✗';
                                                        default: return '◆';
                                                    }
                                                };

                                                return (
                                                    <div key={idx} className={`border-2 rounded-xl p-4 ${isCorrect ? 'border-green-300 bg-green-50' : isCorrect === false ? 'border-red-300 bg-red-50' : 'border-yellow-300 bg-yellow-50'}`}>
                                                        <div className="flex items-start gap-3 mb-3">
                                                            <span className="text-2xl">{getQuestionTypeIcon(q.type)}</span>
                                                            <div className="flex-1">
                                                                <p className="font-bold text-gray-900">Question {idx + 1}</p>
                                                                <p className="text-gray-700 mt-1">{q.text}</p>
                                                            </div>
                                                            {isCorrect === true && <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />}
                                                            {isCorrect === false && <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />}
                                                            {isCorrect === null && <Clock className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />}
                                                        </div>

                                                        <div className="bg-white rounded-lg p-3 mb-3">
                                                            <p className="text-sm text-gray-600 font-semibold mb-1">Your Answer:</p>
                                                            <p className="text-gray-900 whitespace-pre-wrap">{userAnswer || '(Not answered)'}</p>
                                                        </div>

                                                        {q.type !== 'essay' && (
                                                            <>
                                                                <div className="bg-white rounded-lg p-3 mb-3">
                                                                    <p className="text-sm text-gray-600 font-semibold mb-1">Correct Answer:</p>
                                                                    <p className="text-green-700 font-semibold">{q.correctAnswer}</p>
                                                                </div>

                                                                {q.explanation && (
                                                                    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                                                                        <p className="text-sm text-gray-600 font-semibold mb-1">Explanation:</p>
                                                                        <p className="text-gray-700">{q.explanation}</p>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}

                                                        {q.type === 'essay' && (
                                                            <div className={`${gradedAt ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-yellow-50 border-l-4 border-yellow-400'} p-3 rounded`}>
                                                                <p className="text-sm text-gray-600 font-semibold mb-1">Status:</p>
                                                                <p className="text-gray-700">
                                                                    {gradedAt
                                                                        ? `Graded by instructor - ${isCorrect ? '✓ Correct' : '✗ Incorrect'}`
                                                                        : 'Awaiting instructor feedback'}
                                                                </p>
                                                                {instructorFeedback && (
                                                                    <div className="mt-3 pt-3 border-t border-blue-300">
                                                                        <p className="text-sm text-gray-600 font-semibold mb-1">Instructor Feedback:</p>
                                                                        <p className="text-gray-800 italic">"{instructorFeedback}"</p>
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
                            </div>

                            <div className="flex gap-4 flex-wrap">
                                {pendingReview ? (
                                    <>
                                        <button
                                            disabled
                                            className="flex-1 bg-gray-200 text-gray-500 py-5 rounded-2xl font-bold text-lg cursor-not-allowed border-2 border-gray-300 flex items-center justify-center gap-3"
                                        >
                                            <Award className="w-6 h-6" />
                                            Certificate after review
                                        </button>
                                        <button
                                            onClick={() => router.push(`/courses/${courseId}`)}
                                            className="flex-1 bg-white border-3 border-gray-300 text-gray-700 py-5 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all shadow-lg flex items-center justify-center gap-3"
                                        >
                                            <Home className="w-6 h-6" />
                                            Back to Course
                                        </button>
                                    </>
                                ) : passed ? (
                                    <>
                                        <button
                                            onClick={() => setShowCertificate(true)}
                                            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-5 rounded-2xl font-bold text-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-xl flex items-center justify-center gap-3"
                                        >
                                            <Award className="w-6 h-6" />
                                            View Certificate
                                        </button>
                                        <button
                                            onClick={() => router.push(`/courses/${courseId}`)}
                                            className="flex-1 bg-white border-3 border-gray-300 text-gray-700 py-5 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all shadow-lg flex items-center justify-center gap-3"
                                        >
                                            <Home className="w-6 h-6" />
                                            Back to Course
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => {
                                                setSubmitted(false);
                                                setStarted(true);
                                                setTimeRemaining(3600);
                                            }}
                                            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-5 rounded-2xl font-bold text-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-xl flex items-center justify-center gap-3"
                                        >
                                            <Sparkles className="w-6 h-6" />
                                            Try Again
                                        </button>
                                        <button
                                            onClick={() => router.push(`/courses/${courseId}`)}
                                            className="flex-1 bg-white border-3 border-gray-300 text-gray-700 py-5 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all shadow-lg flex items-center justify-center gap-3"
                                        >
                                            <BookOpen className="w-6 h-6" />
                                            Review Course
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Assessment screen
    const question = assessment.questions[currentQuestion];
    const questionId = question.id || question._id || currentQuestion;

    const isTrueFalseType = ["true-false", "true_false", "trueFalse", "boolean", "bool"].includes(
        (question.type || "").toLowerCase()
    );

    const options = (() => {
        // For true/false questions, always show explicit True/False choices
        if (isTrueFalseType) return ["True", "False"];

        // If instructor left options empty, fall back to sensible defaults
        if (!question.options || question.options.length === 0) {
            return ["Option 1", "Option 2", "Option 3", "Option 4"]; // generic fallback
        }

        return question.options;
    })();

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-blue-50">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-orange-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 rounded-xl">
                                <Trophy className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Final Assessment</h2>
                                <p className="text-sm text-gray-600">{course.title}</p>
                            </div>
                        </div>
                        <div
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl ${timeRemaining < 300 ? "bg-red-100 border-2 border-red-300" : "bg-orange-100 border-2 border-orange-300"}`}
                        >
                            <Clock className={`w-6 h-6 ${timeRemaining < 300 ? "text-red-600" : "text-orange-600"}`} />
                            <span className={`font-black text-xl ${timeRemaining < 300 ? "text-red-900" : "text-orange-900"}`}>
                                {`${Math.floor(timeRemaining / 60)
                                    .toString()
                                    .padStart(2, "0")}:${(timeRemaining % 60).toString().padStart(2, "0")}`}
                            </span>
                        </div>
                    </div>

                    <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden mb-3">
                        <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500 shadow-lg"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/30"></div>
                        </div>
                    </div>
                    <div className="flex justify-between text-sm font-semibold text-gray-700">
                        <span>
                            Question {currentQuestion + 1} of {assessment.questions.length}
                        </span>
                        <span className="text-orange-600">{answeredCount} answered</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-10 mb-6 border-2 border-orange-200">
                    <div className="mb-8">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0 shadow-lg">
                                {currentQuestion + 1}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500 mb-2 font-semibold">Question {currentQuestion + 1}</p>
                                <div className="flex gap-2">
                                    {answers[questionId] !== undefined && (
                                        <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-bold border border-green-300">
                                            Answered
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 leading-snug">{question.text || question.question}</h3>
                        {question.type === 'essay' && (
                            <p className="text-sm text-gray-600 mt-2 bg-blue-50 border border-blue-200 rounded-lg p-2">
                                📝 Open-ended question - Your response will be reviewed by the instructor
                            </p>
                        )}
                    </div>

                    {question.type === 'essay' ? (
                        // Essay/Open-ended question
                        <div className="space-y-4">
                            <textarea
                                value={answers[questionId] || ''}
                                onChange={(e) => handleAnswer(questionId, e.target.value)}
                                placeholder="Write your detailed answer here..."
                                className="w-full h-48 p-4 border-3 border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none resize-none font-medium text-gray-800"
                            />
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className={`${answers[questionId]?.length > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                                    {answers[questionId]?.length || 0} characters
                                </span>
                            </div>
                        </div>
                    ) : (
                        // Multiple choice / True-False questions
                        <div className="space-y-4">
                            {options.map((option, idx) => {
                                const rawValue = typeof option === "object"
                                    ? option.value ?? option.text ?? option.label ?? option.option
                                    : option;
                                const value = rawValue !== undefined && String(rawValue).trim() !== ""
                                    ? rawValue
                                    : idx; // fallback to stable index when option value is missing/blank

                                const rawLabel = typeof option === "object"
                                    ? option.text ?? option.label ?? option.value ?? option.option ?? ""
                                    : option ?? "";
                                const label = String(rawLabel).trim() !== ""
                                    ? rawLabel
                                    : `Option ${idx + 1}`; // show placeholder when author left option empty

                                const isSelected = answers[questionId] === value;

                                return (
                                    <label
                                        key={idx}
                                        className={`flex items-start gap-5 p-6 border-3 rounded-2xl cursor-pointer transition-all ${isSelected
                                            ? "border-orange-500 bg-gradient-to-r from-orange-50 to-red-50 shadow-lg"
                                            : "border-gray-200 hover:border-orange-300 hover:bg-orange-50"}`}
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${questionId}`}
                                            value={value}
                                            onChange={() => handleAnswer(questionId, String(value))}
                                            checked={isSelected}
                                            className="w-6 h-6 mt-1 text-orange-500 focus:ring-orange-500"
                                        />
                                        <span className="text-gray-800 flex-1 text-lg font-medium">
                                            {label}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex gap-4 mb-6">
                    <button
                        onClick={handlePrevious}
                        disabled={currentQuestion === 0}
                        className="px-8 py-4 bg-white border-3 border-gray-300 rounded-2xl font-bold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg"
                    >
                        <ChevronLeft className="w-6 h-6" />
                        Previous
                    </button>

                    <div className="flex-1"></div>

                    {currentQuestion === assessment.questions.length - 1 ? (
                        <button
                            onClick={handleSubmit}
                            className="px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-black hover:from-green-600 hover:to-emerald-700 transition-all shadow-xl flex items-center gap-3 text-lg"
                        >
                            <CheckCircle2 className="w-6 h-6" />
                            Submit Assessment
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="px-10 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-black hover:from-orange-600 hover:to-red-600 transition-all shadow-xl flex items-center gap-3 text-lg"
                        >
                            Next Question
                            <ChevronLeft className="w-6 h-6 rotate-180" />
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-orange-200">
                    <h3 className="font-bold text-gray-900 mb-6 text-lg flex items-center gap-2">
                        <Target className="w-5 h-5 text-orange-600" />
                        Quick Navigation
                    </h3>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                        {assessment.questions.map((q, idx) => {
                            const navId = q.id || q._id || idx;
                            return (
                                <button
                                    key={navId}
                                    onClick={() => setCurrentQuestion(idx)}
                                    className={`w-full aspect-square rounded-xl font-bold text-base transition-all shadow-sm ${idx === currentQuestion
                                        ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-2 border-orange-600 shadow-lg scale-110"
                                        : answers[navId] !== undefined
                                            ? "bg-green-100 text-green-700 border-2 border-green-300"
                                            : "bg-gray-100 text-gray-600 border-2 border-gray-300 hover:bg-orange-50 hover:border-orange-300"
                                        }`}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div >
    );
};

const CertificateModal = ({ course, userName, completionDate, score, onClose, onDownload }) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                            <Award className="w-8 h-8 text-orange-600" />
                            Your Certificate
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-full"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-red-50 p-12 rounded-2xl border-8 border-orange-300 mb-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-orange-400"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 border-t-4 border-r-4 border-orange-400"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 border-b-4 border-l-4 border-orange-400"></div>
                        <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-orange-400"></div>

                        <div className="text-center relative z-10">
                            <div className="mb-6">
                                <Trophy className="w-20 h-20 text-orange-600 mx-auto mb-4" />
                                <h3 className="text-5xl font-black text-gray-900 mb-2">Certificate</h3>
                                <p className="text-2xl text-gray-600 font-semibold">of Completion</p>
                            </div>

                            <div className="my-8">
                                <p className="text-gray-700 text-lg mb-3">This certifies that</p>
                                <p className="text-4xl font-black text-gray-900 mb-6">{userName}</p>
                                <p className="text-gray-700 text-lg mb-3">has successfully completed</p>
                                <p className="text-3xl font-bold text-orange-600 mb-6">{course.title}</p>
                                <p className="text-gray-700 text-lg mb-2">with a score of</p>
                                <p className="text-5xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-6">{score}%</p>
                            </div>

                            <div className="border-t-2 border-orange-300 pt-6">
                                <p className="text-gray-600 font-semibold">Date of Completion</p>
                                <p className="text-xl font-bold text-gray-900">{completionDate}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={onDownload}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-2xl font-bold text-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-xl flex items-center justify-center gap-3"
                        >
                            <FileText className="w-6 h-6" />
                            Download Certificate
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 bg-white border-3 border-gray-300 text-gray-700 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all shadow-lg flex items-center justify-center gap-3"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinalAssessmentPage;