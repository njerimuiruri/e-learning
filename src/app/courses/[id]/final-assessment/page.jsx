"use client";
import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Trophy, Clock, Award, Star, CheckCircle2, X,
    AlertCircle, ChevronLeft, Sparkles, Target,
    Zap, FileText, BookOpen, TrendingUp, Home
} from 'lucide-react';
import coursesData from '../../../../data/courses/courses';

const FinalAssessmentPage = () => {
    const router = useRouter();
    const params = useParams();
    const courseId = parseInt(params.id);
    const course = coursesData.find((c) => c.id === courseId);

    const [started, setStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [passed, setPassed] = useState(false);
    const [showCertificate, setShowCertificate] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(3600);

    if (!course || !course.finalAssessment) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
                <div className="text-center bg-white p-12 rounded-2xl shadow-xl max-w-md">
                    <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Assessment Not Found
                    </h1>
                    <p className="text-gray-600 mb-6">
                        We couldn't find the final assessment for this course.
                    </p>
                    <button
                        onClick={() => router.push(`/courses/${courseId}`)}
                        className="bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition"
                    >
                        Back to Course
                    </button>
                </div>
            </div>
        );
    }

    const assessment = course.finalAssessment;

    React.useEffect(() => {
        if (started && !submitted && timeRemaining > 0) {
            const timer = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev <= 1) {
                        handleSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [started, submitted, timeRemaining]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const handleStart = () => {
        setStarted(true);
    };

    const handleAnswer = (questionId, answer) => {
        setAnswers({ ...answers, [questionId]: answer });
    };

    const handleNext = () => {
        if (currentQuestion < assessment.questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const handleSubmit = () => {
        let correct = 0;
        assessment.questions.forEach((q) => {
            if (answers[q.id] == q.correctAnswer) {
                correct++;
            }
        });
        const finalScore = Math.round(
            (correct / assessment.questions.length) * 100
        );
        const hasPassed = finalScore >= assessment.passingScore;

        setScore(finalScore);
        setPassed(hasPassed);
        setSubmitted(true);

        if (hasPassed) {
            setTimeout(() => {
                setShowCertificate(true);
            }, 2000);
        }
    };

    const progress = ((currentQuestion + 1) / assessment.questions.length) * 100;
    const answeredCount = Object.keys(answers).length;

    // Welcome Screen
    if (!started) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-50">
                <div className="max-w-5xl mx-auto px-4 py-12">
                    <div className="mb-8">
                        <button
                            onClick={() => router.push(`/courses/${courseId}`)}
                            className="text-gray-600 hover:text-gray-900 transition flex items-center gap-2 mb-6 bg-white px-4 py-2 rounded-lg shadow-sm"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Back to Course
                        </button>
                    </div>

                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-orange-200">
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-12 text-center relative overflow-hidden">
                            <div className="absolute inset-0">
                                <div className="absolute inset-0 bg-black/10"></div>
                                <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-32 -translate-y-32"></div>
                                <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-48 translate-y-48"></div>
                            </div>
                            <div className="relative z-10">
                                <div className="bg-white/20 backdrop-blur-sm rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
                                    <Trophy className="w-16 h-16 text-white animate-pulse" />
                                </div>
                                <h1 className="text-5xl font-black mb-3">Final Assessment</h1>
                                <p className="text-xl text-orange-100 mb-2">{course.title}</p>
                                <div className="inline-block bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full">
                                    <p className="text-sm font-semibold">
                                        Earn Your Certificate of Completion
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-12">
                            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 border-2 border-orange-200 mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <Sparkles className="w-6 h-6 text-orange-600" />
                                    You're Almost There!
                                </h2>
                                <p className="text-gray-700 text-lg leading-relaxed">
                                    This is your final test to demonstrate everything you've
                                    learned throughout the course. Pass this assessment and you'll
                                    receive your official certificate of completion!
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-blue-500 text-white p-4 rounded-xl shadow-lg">
                                            <BookOpen className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 font-semibold">
                                                Total Questions
                                            </p>
                                            <p className="text-3xl font-black text-gray-900">
                                                {assessment.questions.length}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-200 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-purple-500 text-white p-4 rounded-xl shadow-lg">
                                            <Clock className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 font-semibold">
                                                Time Allowed
                                            </p>
                                            <p className="text-3xl font-black text-gray-900">
                                                60 Minutes
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-200 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-green-500 text-white p-4 rounded-xl shadow-lg">
                                            <Target className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 font-semibold">
                                                Passing Score
                                            </p>
                                            <p className="text-3xl font-black text-gray-900">
                                                {assessment.passingScore}%
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border-2 border-orange-200 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-orange-500 text-white p-4 rounded-xl shadow-lg">
                                            <Award className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 font-semibold">
                                                Certificate
                                            </p>
                                            <p className="text-3xl font-black text-gray-900">
                                                Included
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6 mb-8">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                                    Assessment Guidelines
                                </h3>
                                <ul className="space-y-3 text-gray-700">
                                    <li className="flex gap-3">
                                        <span className="text-yellow-600 font-bold text-xl">•</span>
                                        <span>
                                            You have <strong>60 minutes</strong> to complete all
                                            questions
                                        </span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-yellow-600 font-bold text-xl">•</span>
                                        <span>All questions are multiple choice</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-yellow-600 font-bold text-xl">•</span>
                                        <span>
                                            You can navigate back and forth between questions
                                        </span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-yellow-600 font-bold text-xl">•</span>
                                        <span>Once you submit, you cannot change your answers</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-yellow-600 font-bold text-xl">•</span>
                                        <span>
                                            Score{" "}
                                            <strong>{assessment.passingScore}% or higher</strong> to
                                            pass and earn your certificate
                                        </span>
                                    </li>
                                </ul>
                            </div>

                            <button
                                onClick={handleStart}
                                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-6 rounded-2xl font-black text-2xl hover:from-orange-600 hover:to-red-600 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-3"
                            >
                                <Sparkles className="w-8 h-8" />
                                Begin Assessment
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Results Screen
    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-50">
                {showCertificate && (
                    <CertificateModal
                        course={course}
                        userName="Your Name"
                        completionDate={new Date().toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                        score={score}
                        onClose={() => setShowCertificate(false)}
                        onDownload={() => {
                            alert(
                                "Certificate download would start here. In production, this would generate a PDF certificate."
                            );
                        }}
                    />
                )}

                <div className="max-w-4xl mx-auto px-4 py-12">
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-orange-200">
                        <div
                            className={`${passed
                                ? "bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"
                                : "bg-gradient-to-r from-red-500 via-orange-500 to-pink-500"
                                } text-white p-12 text-center relative overflow-hidden`}
                        >
                            <div className="absolute inset-0 bg-black/10"></div>
                            <div className="relative z-10">
                                {passed ? (
                                    <>
                                        <div className="bg-white/20 backdrop-blur-sm rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
                                            <Trophy className="w-20 h-20 text-white" />
                                        </div>
                                        <h1 className="text-6xl font-black mb-4">Outstanding!</h1>
                                        <p className="text-2xl text-white/90 mb-2">
                                            You Passed the Assessment!
                                        </p>
                                        <div className="inline-block bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full">
                                            <p className="text-sm font-semibold">
                                                🎉 Certificate Ready for Download
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="bg-white/20 backdrop-blur-sm rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
                                            <AlertCircle className="w-20 h-20 text-white" />
                                        </div>
                                        <h1 className="text-6xl font-black mb-4">Keep Going!</h1>
                                        <p className="text-2xl text-white/90 mb-2">
                                            You're Getting There
                                        </p>
                                        <div className="inline-block bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full">
                                            <p className="text-sm font-semibold">
                                                Review the course and try again
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="p-12">
                            <div className="text-center mb-10">
                                <div className="inline-block bg-gradient-to-br from-orange-50 to-red-50 rounded-3xl p-10 border-4 border-orange-300 mb-6 shadow-xl">
                                    <p className="text-gray-600 text-xl mb-3 font-semibold">
                                        Your Final Score
                                    </p>
                                    <p className="text-8xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                        {score}%
                                    </p>
                                </div>

                                {passed ? (
                                    <div className="bg-green-50 border-3 border-green-300 rounded-2xl p-6 mb-6">
                                        <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-3" />
                                        <p className="text-xl font-bold text-gray-900 mb-2">
                                            Congratulations on Completing the Course!
                                        </p>
                                        <p className="text-gray-700">
                                            Your certificate of completion is ready. Download it and
                                            share your achievement!
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-orange-50 border-3 border-orange-300 rounded-2xl p-6 mb-6">
                                        <AlertCircle className="w-16 h-16 text-orange-600 mx-auto mb-3" />
                                        <p className="text-xl font-bold text-gray-900 mb-2">
                                            You Need {assessment.passingScore}% to Pass
                                        </p>
                                        <p className="text-gray-700">
                                            Don't worry! Review the course materials and try the
                                            assessment again.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="grid md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200 text-center shadow-sm">
                                    <CheckCircle2 className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                                    <p className="text-sm text-gray-600 mb-2 font-semibold">
                                        Correct Answers
                                    </p>
                                    <p className="text-4xl font-black text-gray-900">
                                        {Math.round((score / 100) * assessment.questions.length)}/
                                        {assessment.questions.length}
                                    </p>
                                </div>

                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-200 text-center shadow-sm">
                                    <Target className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                                    <p className="text-sm text-gray-600 mb-2 font-semibold">
                                        Passing Score
                                    </p>
                                    <p className="text-4xl font-black text-gray-900">
                                        {assessment.passingScore}%
                                    </p>
                                </div>

                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-200 text-center shadow-sm">
                                    <TrendingUp className="w-10 h-10 text-green-600 mx-auto mb-3" />
                                    <p className="text-sm text-gray-600 mb-2 font-semibold">
                                        Performance
                                    </p>
                                    <p className="text-4xl font-black text-gray-900">
                                        {score >= 90
                                            ? "Excellent"
                                            : score >= 70
                                                ? "Good"
                                                : score >= 50
                                                    ? "Fair"
                                                    : "Needs Work"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                {passed ? (
                                    <>
                                        <button
                                            onClick={() => setShowCertificate(true)}
                                            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-5 rounded-2xl font-bold text-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-xl flex items-center justify-center gap-3"
                                        >
                                            <Award className="w-6 h-6" />
                                            View & Download Certificate
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
                                                setStarted(false);
                                                setCurrentQuestion(0);
                                                setAnswers({});
                                                setSubmitted(false);
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

    // Assessment Screen
    const question = assessment.questions[currentQuestion];

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-50">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-orange-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 rounded-xl">
                                <Trophy className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Final Assessment
                                </h2>
                                <p className="text-sm text-gray-600">{course.title}</p>
                            </div>
                        </div>
                        <div
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl ${timeRemaining < 300
                                ? "bg-red-100 border-2 border-red-300"
                                : "bg-orange-100 border-2 border-orange-300"
                                }`}
                        >
                            <Clock
                                className={`w-6 h-6 ${timeRemaining < 300 ? "text-red-600" : "text-orange-600"
                                    }`}
                            />
                            <span
                                className={`font-black text-xl ${timeRemaining < 300 ? "text-red-900" : "text-orange-900"
                                    }`}
                            >
                                {formatTime(timeRemaining)}
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

                {/* Question Card */}
                <div className="bg-white rounded-2xl shadow-xl p-10 mb-6 border-2 border-orange-200">
                    <div className="mb-8">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0 shadow-lg">
                                {currentQuestion + 1}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500 mb-2 font-semibold">
                                    Question {currentQuestion + 1}
                                </p>
                                <div className="flex gap-2">
                                    {answers[question.id] !== undefined && (
                                        <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-bold border border-green-300">
                                            ✓ Answered
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 leading-snug">
                            {question.question}
                        </h3>
                    </div>

                    <div className="space-y-4">
                        {question.options.map((option, idx) => (
                            <label
                                key={idx}
                                className={`flex items-start gap-5 p-6 border-3 rounded-2xl cursor-pointer transition-all ${answers[question.id] == idx
                                    ? "border-orange-500 bg-gradient-to-r from-orange-50 to-red-50 shadow-lg"
                                    : "border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name={`question-${question.id}`}
                                    value={idx}
                                    onChange={(e) => handleAnswer(question.id, e.target.value)}
                                    checked={answers[question.id] == idx}
                                    className="w-6 h-6 mt-1 text-orange-500 focus:ring-orange-500"
                                />
                                <span className="text-gray-800 flex-1 text-lg font-medium">
                                    {option}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Navigation */}
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

                {/* Question Navigator */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-orange-200">
                    <h3 className="font-bold text-gray-900 mb-6 text-lg flex items-center gap-2">
                        <Target className="w-5 h-5 text-orange-600" />
                        Quick Navigation
                    </h3>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                        {assessment.questions.map((q, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentQuestion(idx)}
                                className={`w-full aspect-square rounded-xl font-bold text-base transition-all shadow-sm ${idx === currentQuestion
                                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-2 border-orange-600 shadow-lg scale-110"
                                    : answers[q.id] !== undefined
                                        ? "bg-green-100 text-green-700 border-2 border-green-300"
                                        : "bg-gray-100 text-gray-600 border-2 border-gray-300 hover:bg-orange-50 hover:border-orange-300"
                                    }`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>
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
    score,
    onClose,
    onDownload,
}) => {
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

                    {/* Certificate Design */}
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 p-12 rounded-2xl border-8 border-orange-300 mb-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-orange-400"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 border-t-4 border-r-4 border-orange-400"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 border-b-4 border-l-4 border-orange-400"></div>
                        <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-orange-400"></div>

                        <div className="text-center relative z-10">
                            <div className="mb-6">
                                <Trophy className="w-20 h-20 text-orange-600 mx-auto mb-4" />
                                <h3 className="text-5xl font-black text-gray-900 mb-2">
                                    Certificate
                                </h3>
                                <p className="text-2xl text-gray-600 font-semibold">
                                    of Completion
                                </p>
                            </div>

                            <div className="my-8">
                                <p className="text-gray-700 text-lg mb-3">
                                    This certifies that
                                </p>
                                <p className="text-4xl font-black text-gray-900 mb-6">
                                    {userName}
                                </p>
                                <p className="text-gray-700 text-lg mb-3">
                                    has successfully completed
                                </p>
                                <p className="text-3xl font-bold text-orange-600 mb-6">
                                    {course.title}
                                </p>
                                <p className="text-gray-700 text-lg mb-2">with a score of</p>
                                <p className="text-5xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-6">
                                    {score}%
                                </p>
                            </div>

                            <div className="border-t-2 border-orange-300 pt-6">
                                <p className="text-gray-600 font-semibold">
                                    Date of Completion
                                </p>
                                <p className="text-xl font-bold text-gray-900">
                                    {completionDate}
                                </p>
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