'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import moduleEnrollmentService from '@/lib/api/moduleEnrollmentService';
import progressionService from '@/lib/api/progressionService';
import moduleService from '@/lib/api/moduleService';
import Navbar from '@/components/navbar/navbar';
import ProtectedStudentRoute from '@/components/ProtectedStudentRoute';

function StudentDashboardContent() {
    const router = useRouter();
    const [enrollments, setEnrollments] = useState([]);
    const [progressions, setProgressions] = useState([]);
    const [availableModules, setAvailableModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError('');
            const [enrollmentData, progressionData, modulesData] = await Promise.all([
                moduleEnrollmentService.getMyEnrollments(),
                progressionService.getMyProgressions().catch(() => []),
                moduleService.getAllModules({ limit: 12 }).catch(() => ({ modules: [] })),
            ]);

            const list = Array.isArray(enrollmentData) ? enrollmentData : enrollmentData?.enrollments || [];
            setEnrollments(list);
            const progList = Array.isArray(progressionData) ? progressionData : progressionData?.progressions || [];
            setProgressions(progList);

            // Filter out modules the student is already enrolled in
            const enrolledIds = new Set(list.map(e => e.moduleId?._id?.toString() || e.moduleId?.toString()));
            const allMods = Array.isArray(modulesData) ? modulesData : modulesData?.modules || [];
            setAvailableModules(allMods.filter(m => !enrolledIds.has(m._id?.toString())).slice(0, 6));
        } catch (err) {
            setError('Failed to load dashboard data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatLastActive = (date) => {
        if (!date) return 'Never';
        const now = new Date();
        const lastAccessed = new Date(date);
        const diffTime = Math.abs(now - lastAccessed);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return '1 day ago';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    };

    // Categorize enrollments
    const modulesInProgress = enrollments.filter(e => {
        if (e.isCompleted) return false;
        const hasPendingReview = (e.pendingManualGradingCount || 0) > 0;
        const hasSubmittedFinal = (e.finalAssessmentAttempts || 0) > 0;
        if (hasSubmittedFinal && hasPendingReview) return false;
        if (e.completedLessons >= e.totalLessons && e.totalLessons > 0 && !hasSubmittedFinal) return false;
        return true;
    });

    const pendingAssessmentModules = enrollments.filter(e => {
        if (e.isCompleted) return false;
        const hasSubmittedFinal = (e.finalAssessmentAttempts || 0) > 0;
        const hasPendingReview = (e.pendingManualGradingCount || 0) > 0;
        const allLessonsDone = e.completedLessons >= e.totalLessons && e.totalLessons > 0;

        return (allLessonsDone && !hasSubmittedFinal) ||
            (hasSubmittedFinal && !e.finalAssessmentPassed && !e.isCompleted) ||
            (hasSubmittedFinal && hasPendingReview);
    });

    const completedModules = enrollments.filter(e => e.isCompleted && e.certificateEarned);

    // Stats
    const avgProgress = modulesInProgress.length > 0
        ? Math.round(modulesInProgress.reduce((sum, e) => sum + (e.progress || 0), 0) / modulesInProgress.length)
        : 0;

    const totalLessonsCompleted = enrollments.reduce((sum, e) => sum + (e.completedLessons || 0), 0);
    const totalLessonsAll = enrollments.reduce((sum, e) => sum + (e.totalLessons || 0), 0);
    const certificatesEarned = completedModules.length;

    const assessmentsWithAttempts = enrollments.filter(e => (e.finalAssessmentAttempts || 0) > 0);
    const bestFinalScore = assessmentsWithAttempts.length
        ? Math.max(...assessmentsWithAttempts.map(e => e.finalAssessmentScore || 0))
        : 0;

    const stats = [
        {
            label: 'Total Enrollments',
            value: enrollments.length || '0',
            icon: 'BookOpen',
            color: 'from-blue-500 to-blue-600',
            iconColor: 'text-blue-600',
            bgColor: 'bg-blue-50',
            subtext: 'Active modules'
        },
        {
            label: 'In Progress',
            value: modulesInProgress.length || '0',
            icon: 'Zap',
            color: 'from-purple-500 to-purple-600',
            iconColor: 'text-purple-600',
            bgColor: 'bg-purple-50',
            subtext: avgProgress > 0 ? `${avgProgress}% avg progress` : 'Get started'
        },
        {
            label: 'Ready for Assessment',
            value: pendingAssessmentModules.length || '0',
            icon: 'Target',
            color: 'from-indigo-500 to-indigo-600',
            iconColor: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            subtext: pendingAssessmentModules.length > 0 ? 'Take assessment!' : 'Complete lessons first'
        },
        {
            label: 'Completed',
            value: completedModules.length || '0',
            icon: 'CheckCircle',
            color: 'from-green-500 to-emerald-600',
            iconColor: 'text-green-600',
            bgColor: 'bg-green-50',
            subtext: `${totalLessonsCompleted}/${totalLessonsAll} lessons`
        },
        {
            label: 'Certificates Earned',
            value: certificatesEarned,
            icon: 'Award',
            color: 'from-[#021d49] to-blue-800',
            iconColor: 'text-[#021d49]',
            bgColor: 'bg-blue-50',
            subtext: 'Achievements'
        },
    ];

    const getLevelBadge = (level) => {
        const badges = {
            beginner: { color: 'bg-green-100 text-green-700', label: 'Beginner' },
            intermediate: { color: 'bg-yellow-100 text-yellow-700', label: 'Intermediate' },
            advanced: { color: 'bg-red-100 text-red-700', label: 'Advanced' },
        };
        return badges[level] || badges.beginner;
    };

    const getAssessmentStatus = (enrollment) => {
        const hasSubmittedFinal = (enrollment.finalAssessmentAttempts || 0) > 0;
        const hasPendingReview = (enrollment.pendingManualGradingCount || 0) > 0;
        const canRetry = hasSubmittedFinal && !enrollment.finalAssessmentPassed && enrollment.finalAssessmentAttempts < 3;

        if (hasPendingReview) return 'pending_review';
        if (enrollment.requiresModuleRepeat) return 'repeat_required';
        if (!hasSubmittedFinal) return 'ready';
        if (canRetry) return 'retry';
        if (hasSubmittedFinal && enrollment.finalAssessmentAttempts >= 3 && !enrollment.finalAssessmentPassed) return 'failed';
        return 'ready';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="text-center">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-t-4 border-[#021d49] mx-auto mb-4"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Icons.BookOpen className="w-8 h-8 text-[#021d49]" />
                        </div>
                    </div>
                    <p className="text-gray-700 font-semibold text-lg">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
                <main className="p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Welcome Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                                Welcome back!
                            </h1>
                            <p className="text-gray-600 text-lg">
                                Continue your learning journey and achieve your goals
                            </p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
                            {stats.map((stat, index) => {
                                const IconComponent = Icons[stat.icon];
                                return (
                                    <div
                                        key={index}
                                        className="group bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-[#021d49]/20 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className={`${stat.bgColor} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                                                {IconComponent && <IconComponent className={`w-6 h-6 ${stat.iconColor}`} />}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-3xl sm:text-4xl font-black text-gray-900 mb-0.5">{stat.value}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-700 mb-1.5">{stat.label}</p>
                                        <p className="text-xs text-gray-500 font-medium">{stat.subtext}</p>
                                        <div className={`h-1.5 bg-gradient-to-r ${stat.color} rounded-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-sm`}></div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Achievements Summary */}
                        <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-100 mb-8 overflow-hidden">
                            <div className="p-6 sm:p-8 border-b-2 border-gray-100 bg-gradient-to-r from-amber-50 to-yellow-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-amber-500 text-white p-3 rounded-xl">
                                            <Icons.Trophy className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">Your Achievements</h2>
                                            <p className="text-gray-600 text-sm">See what you've accomplished so far</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[{
                                    title: 'Modules Completed',
                                    value: completedModules.length,
                                    icon: 'CheckCircle',
                                    badge: `${totalLessonsCompleted}/${totalLessonsAll} lessons`,
                                    color: 'from-emerald-500 to-green-600'
                                }, {
                                    title: 'Assessments Taken',
                                    value: assessmentsWithAttempts.length,
                                    icon: 'Target',
                                    badge: assessmentsWithAttempts.length > 0 ? 'Keep the streak going' : 'Start your first assessment',
                                    color: 'from-indigo-500 to-purple-600'
                                }, {
                                    title: 'Best Final Score',
                                    value: `${bestFinalScore.toFixed ? bestFinalScore.toFixed(1) : bestFinalScore}%`,
                                    icon: 'Award',
                                    badge: bestFinalScore > 0 ? 'Great job!' : 'No score yet',
                                    color: 'from-blue-500 to-blue-700'
                                }, {
                                    title: 'Certificates',
                                    value: certificatesEarned,
                                    icon: 'Medal',
                                    badge: certificatesEarned > 0 ? 'Earned certificates' : 'Complete a module to earn one',
                                    color: 'from-amber-500 to-orange-600'
                                }].map((card, idx) => {
                                    const Icon = Icons[card.icon];
                                    return (
                                        <div key={idx} className="group border-2 border-gray-100 bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 hover:border-amber-200 hover:shadow-xl transition-all duration-200">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`p-3 rounded-xl text-white bg-gradient-to-r ${card.color}`}>
                                                    {Icon && <Icon className="w-5 h-5" />}
                                                </div>
                                                <span className="text-xs font-semibold text-gray-500">{card.title}</span>
                                            </div>
                                            <p className="text-3xl font-black text-gray-900 mb-2">{card.value}</p>
                                            <p className="text-sm text-gray-600 font-semibold flex items-center gap-2">
                                                <Icons.Sparkles className="w-4 h-4 text-amber-500" />
                                                {card.badge}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Level Progression */}
                        {progressions.length > 0 && (
                            <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-100 mb-8 overflow-hidden">
                                <div className="p-6 sm:p-8 border-b-2 border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-purple-600 text-white p-3 rounded-xl">
                                            <Icons.TrendingUp className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">Level Progression</h2>
                                            <p className="text-gray-600 text-sm">Your progress across categories</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {progressions.map((prog, idx) => {
                                        const categoryName = prog.categoryId?.name || prog.categoryName || 'Category';
                                        const levels = ['beginner', 'intermediate', 'advanced'];
                                        const currentLevelIndex = levels.indexOf(prog.currentLevel || 'beginner');

                                        return (
                                            <div key={idx} className="border-2 border-gray-200 rounded-2xl p-5 hover:border-purple-300 hover:shadow-lg transition-all">
                                                <h3 className="font-bold text-gray-900 mb-3">{categoryName}</h3>
                                                <div className="space-y-2">
                                                    {levels.map((level, li) => {
                                                        const isUnlocked = li <= currentLevelIndex;
                                                        const isCurrent = li === currentLevelIndex;
                                                        const levelData = prog.levels?.[level] || {};
                                                        return (
                                                            <div key={level} className={`flex items-center gap-3 p-2 rounded-lg ${isCurrent ? 'bg-purple-50 border border-purple-200' : isUnlocked ? 'bg-green-50' : 'bg-gray-50'}`}>
                                                                {isUnlocked ? (
                                                                    <Icons.CheckCircle className={`w-5 h-5 ${isCurrent ? 'text-purple-600' : 'text-green-600'}`} />
                                                                ) : (
                                                                    <Icons.Lock className="w-5 h-5 text-gray-400" />
                                                                )}
                                                                <span className={`text-sm font-medium capitalize ${isUnlocked ? 'text-gray-900' : 'text-gray-400'}`}>
                                                                    {level}
                                                                </span>
                                                                {isCurrent && (
                                                                    <span className="ml-auto text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                                                                        Current
                                                                    </span>
                                                                )}
                                                                {isUnlocked && !isCurrent && (
                                                                    <span className="ml-auto text-xs font-bold text-green-600">
                                                                        {levelData.completedModules || 0} done
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                            <button
                                onClick={() => router.push('/student/modules')}
                                className="bg-gradient-to-r from-[#021d49] to-blue-700 text-white rounded-2xl p-6 hover:from-[#032e6b] hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-4"
                            >
                                <div className="bg-white/20 p-3 rounded-xl">
                                    <Icons.Search className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-lg">Browse Modules</p>
                                    <p className="text-sm text-blue-100">Discover new learning</p>
                                </div>
                            </button>

                            <button
                                onClick={() => router.push('/student/certificates')}
                                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl p-6 hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-4"
                            >
                                <div className="bg-white/20 p-3 rounded-xl">
                                    <Icons.Award className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-lg">My Certificates</p>
                                    <p className="text-sm text-purple-100">View achievements</p>
                                </div>
                            </button>

                            <button
                                onClick={() => router.push('/student/achievements')}
                                className="bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl p-6 hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-4"
                            >
                                <div className="bg-white/20 p-3 rounded-xl">
                                    <Icons.Trophy className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-lg">Achievements</p>
                                    <p className="text-sm text-green-100">Track progress</p>
                                </div>
                            </button>
                        </div>

                        {/* ─── Discover New Modules ─────────────────────── */}
                        {availableModules.length > 0 && (
                            <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-100 mb-8 overflow-hidden">
                                <div className="p-6 sm:p-8 border-b-2 border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-indigo-600 text-white p-3 rounded-xl">
                                                <Icons.Compass className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900">Discover New Modules</h2>
                                                <p className="text-gray-600 text-sm">Expand your knowledge with these available modules</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => router.push('/student/modules')}
                                            className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm flex items-center gap-1"
                                        >
                                            See All
                                            <Icons.ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {availableModules.map((mod) => {
                                        const levelBadge = getLevelBadge(mod.level);
                                        const categoryName = mod.categoryId?.name || '';
                                        const instructorIds = mod.instructorIds || [];
                                        const lead = instructorIds[0];
                                        const instructorName = lead
                                            ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.email || 'Instructor'
                                            : 'Instructor';
                                        const cat = mod.categoryId;
                                        const isPaid = cat?.isPaid === true || cat?.accessType === 'paid';
                                        const isFellowOnly = cat?.accessType === 'free';
                                        const catPrice = cat?.price;

                                        return (
                                            <div
                                                key={mod._id}
                                                className="group bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-indigo-300 hover:shadow-xl transition-all transform hover:-translate-y-1 flex flex-col"
                                            >
                                                {/* Thumbnail */}
                                                <div
                                                    className="w-full h-36 overflow-hidden cursor-pointer flex-shrink-0"
                                                    onClick={() => router.push(`/modules/${mod._id}`)}
                                                >
                                                    {mod.bannerUrl || mod.thumbnailUrl ? (
                                                        <img
                                                            src={mod.bannerUrl || mod.thumbnailUrl}
                                                            alt={mod.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
                                                            <Icons.Layers className="w-12 h-12 text-indigo-400" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="p-4 flex flex-col flex-1">
                                                    {/* Badges */}
                                                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                                        {mod.level && (
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${levelBadge.color}`}>
                                                                {levelBadge.label}
                                                            </span>
                                                        )}
                                                        {isFellowOnly && (
                                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
                                                                <Icons.Award className="w-3 h-3" /> Fellows Only
                                                            </span>
                                                        )}
                                                        {isPaid && !isFellowOnly && (
                                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                                                                {catPrice ? `$${catPrice.toLocaleString()}` : 'Paid'}
                                                            </span>
                                                        )}
                                                        {!isPaid && !isFellowOnly && (
                                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Free</span>
                                                        )}
                                                    </div>

                                                    {/* Title */}
                                                    <h3
                                                        className="font-bold text-gray-900 text-sm mb-1 line-clamp-2 cursor-pointer group-hover:text-indigo-600 transition-colors leading-snug"
                                                        onClick={() => router.push(`/modules/${mod._id}`)}
                                                    >
                                                        {mod.title}
                                                    </h3>

                                                    {/* Category + Instructor */}
                                                    <p className="text-xs text-gray-500 mb-1 truncate">
                                                        {categoryName && <span className="font-medium">{categoryName} · </span>}
                                                        {instructorName}
                                                    </p>

                                                    {/* Lesson count */}
                                                    <p className="text-xs text-gray-400 mb-3">
                                                        {(mod.lessons?.length || 0)} {mod.lessons?.length === 1 ? 'lesson' : 'lessons'}
                                                    </p>

                                                    <button
                                                        onClick={() => router.push(`/modules/${mod._id}`)}
                                                        className="mt-auto w-full bg-gradient-to-r from-[#021d49] to-blue-700 hover:from-[#032e6b] hover:to-blue-800 text-white py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                                                    >
                                                        <Icons.Eye className="w-4 h-4" />
                                                        View Details
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Pending Assessment Modules */}
                        {pendingAssessmentModules.length > 0 && (
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl shadow-2xl mb-8 overflow-hidden">
                                <div className="p-6 sm:p-8 text-white">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="bg-white/20 p-3 rounded-xl">
                                            <Icons.Target className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl sm:text-3xl font-bold">
                                                Final Assessment Status
                                            </h2>
                                            <p className="text-indigo-100 text-sm sm:text-base">
                                                Complete your learning journey with the final assessment
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-6 sm:p-8">
                                    <div className="space-y-6">
                                        {pendingAssessmentModules.map((enrollment) => {
                                            const mod = enrollment.moduleId || {};
                                            const status = getAssessmentStatus(enrollment);
                                            const levelBadge = getLevelBadge(mod.level);

                                            const statusConfig = {
                                                ready: {
                                                    badge: { bg: 'bg-green-100', text: 'text-green-700', icon: 'CheckCircle', label: 'Ready for Assessment' },
                                                    action: { text: 'Take Final Assessment', icon: 'BookOpen', onClick: () => router.push(`/student/modules/${mod._id}?showFinalAssessment=true`) }
                                                },
                                                pending_review: {
                                                    badge: { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'Clock', label: 'Waiting for Instructor Review' },
                                                    action: { text: 'View Submission', icon: 'Eye', onClick: () => router.push(`/student/modules/${mod._id}`) }
                                                },
                                                retry: {
                                                    badge: { bg: 'bg-orange-100', text: 'text-orange-700', icon: 'RefreshCw', label: `Retry Available (${enrollment.finalAssessmentAttempts}/3 attempts)` },
                                                    action: { text: 'Retry Assessment', icon: 'RotateCcw', onClick: () => router.push(`/student/modules/${mod._id}?showFinalAssessment=true`) }
                                                },
                                                repeat_required: {
                                                    badge: { bg: 'bg-red-100', text: 'text-red-700', icon: 'AlertTriangle', label: 'Module Repeat Required' },
                                                    action: { text: 'Repeat Module', icon: 'RotateCcw', onClick: () => router.push(`/student/modules/${mod._id}`) }
                                                },
                                                failed: {
                                                    badge: { bg: 'bg-red-100', text: 'text-red-700', icon: 'XCircle', label: 'All attempts used - Contact instructor' },
                                                    action: { text: 'View Results', icon: 'FileText', onClick: () => router.push(`/student/modules/${mod._id}`) }
                                                }
                                            };

                                            const config = statusConfig[status] || statusConfig.ready;
                                            const BadgeIcon = Icons[config.badge.icon];
                                            const ActionIcon = Icons[config.action.icon];

                                            return (
                                                <div key={enrollment._id} className="flex flex-col sm:flex-row gap-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 hover:shadow-lg transition-all">
                                                    {mod.bannerUrl ? (
                                                        <img
                                                            src={mod.bannerUrl}
                                                            alt={mod.title}
                                                            className="w-full sm:w-48 h-32 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0 shadow-md"
                                                            onClick={() => router.push(`/student/modules/${mod._id}`)}
                                                        />
                                                    ) : (
                                                        <div
                                                            className="w-full sm:w-48 h-32 rounded-xl bg-gradient-to-br from-indigo-200 to-purple-200 flex items-center justify-center flex-shrink-0 shadow-md cursor-pointer"
                                                            onClick={() => router.push(`/student/modules/${mod._id}`)}
                                                        >
                                                            <Icons.Layers className="w-12 h-12 text-indigo-500" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h3
                                                                className="font-bold text-xl text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors"
                                                                onClick={() => router.push(`/student/modules/${mod._id}`)}
                                                            >
                                                                {mod.title || 'Module'}
                                                            </h3>
                                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${levelBadge.color}`}>
                                                                {levelBadge.label}
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-3 mb-4">
                                                            <div className={`flex items-center gap-2 ${config.badge.bg} ${config.badge.text} px-4 py-2 rounded-full`}>
                                                                <BadgeIcon className="w-5 h-5" />
                                                                <span className="text-sm font-bold">{config.badge.label}</span>
                                                            </div>
                                                            {enrollment.finalAssessmentScore > 0 && status !== 'ready' && (
                                                                <div className="flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full">
                                                                    <Icons.Award className="w-4 h-4" />
                                                                    <span className="text-xs font-bold">
                                                                        Score: {enrollment.finalAssessmentScore.toFixed(1)}%
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="w-full bg-green-200 rounded-full h-3 mb-4">
                                                            <div
                                                                className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all shadow-sm"
                                                                style={{ width: '100%' }}
                                                            ></div>
                                                        </div>

                                                        {status === 'pending_review' && (
                                                            <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded">
                                                                <p className="text-sm text-amber-800">
                                                                    <strong>Final Assessment Done - Waiting for Review</strong><br />
                                                                    Your instructor is reviewing your essay responses. You'll be notified once grading is complete.
                                                                </p>
                                                            </div>
                                                        )}
                                                        {status === 'repeat_required' && (
                                                            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded">
                                                                <p className="text-sm text-red-800">
                                                                    <strong>Maximum Attempts Reached — Module Repeat Required</strong><br />
                                                                    You have used all your assessment attempts. You must redo all lessons before you can attempt the final assessment again.
                                                                </p>
                                                            </div>
                                                        )}

                                                        <button
                                                            onClick={config.action.onClick}
                                                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-3 text-lg"
                                                        >
                                                            <ActionIcon className="w-5 h-5" />
                                                            {config.action.text}
                                                            <Icons.ArrowRight className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Modules in Progress */}
                        {modulesInProgress.length > 0 && (
                            <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-100 mb-8 overflow-hidden">
                                <div className="p-6 sm:p-8 border-b-2 border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-[#021d49] text-white p-3 rounded-xl">
                                                <Icons.BookOpen className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900">
                                                    Continue Learning ({modulesInProgress.length})
                                                </h2>
                                                <p className="text-gray-600 text-sm">Keep up the momentum!</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => router.push('/student/modules')}
                                            className="text-[#021d49] hover:text-blue-700 font-semibold text-sm flex items-center gap-1"
                                        >
                                            Browse All
                                            <Icons.ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 sm:p-8">
                                    <div className="space-y-6">
                                        {modulesInProgress.map((enrollment) => {
                                            const mod = enrollment.moduleId || {};
                                            const categoryName = mod.categoryId?.name || '';
                                            const levelBadge = getLevelBadge(mod.level);

                                            return (
                                                <div key={enrollment._id} className="flex flex-col sm:flex-row gap-6 p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all border-2 border-gray-200 hover:border-[#021d49]/30">
                                                    {mod.bannerUrl ? (
                                                        <img
                                                            src={mod.bannerUrl}
                                                            alt={mod.title}
                                                            className="w-full sm:w-48 h-32 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0 shadow-md"
                                                            onClick={() => router.push(`/student/modules/${mod._id}`)}
                                                        />
                                                    ) : (
                                                        <div
                                                            className="w-full sm:w-48 h-32 rounded-xl bg-gradient-to-br from-blue-200 to-indigo-200 flex items-center justify-center flex-shrink-0 shadow-md cursor-pointer"
                                                            onClick={() => router.push(`/student/modules/${mod._id}`)}
                                                        >
                                                            <Icons.Layers className="w-12 h-12 text-blue-500" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h3
                                                                className="font-bold text-xl text-gray-900 cursor-pointer hover:text-[#021d49] transition-colors"
                                                                onClick={() => router.push(`/student/modules/${mod._id}`)}
                                                            >
                                                                {mod.title || 'Module'}
                                                            </h3>
                                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${levelBadge.color}`}>
                                                                {levelBadge.label}
                                                            </span>
                                                            {categoryName && (
                                                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                                                    {categoryName}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="mb-4">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-bold text-gray-700">{enrollment.progress || 0}% Complete</span>
                                                                    {enrollment.progress >= 75 && (
                                                                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">Almost there!</span>
                                                                    )}
                                                                    {enrollment.progress >= 50 && enrollment.progress < 75 && (
                                                                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">Halfway!</span>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs text-gray-500 uppercase font-semibold">Last active: {formatLastActive(enrollment.lastAccessedAt)}</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                                                                <div
                                                                    className={`h-3 rounded-full transition-all shadow-sm ${enrollment.progress >= 75
                                                                        ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                                                        : enrollment.progress >= 50
                                                                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                                                                            : 'bg-gradient-to-r from-[#021d49] to-blue-600'
                                                                        }`}
                                                                    style={{ width: `${enrollment.progress || 0}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>

                                                        {/* Lesson Progress */}
                                                        <div className="mb-4 bg-white p-4 rounded-xl border-2 border-gray-200">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Lesson Progress</span>
                                                                <span className="text-xs font-bold text-[#021d49]">
                                                                    {enrollment.completedLessons || 0} / {enrollment.totalLessons || 0} Lessons
                                                                </span>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                {Array.from({ length: enrollment.totalLessons || 0 }).map((_, idx) => {
                                                                    const lessonProg = enrollment.lessonProgress?.find(lp => lp.lessonIndex === idx);
                                                                    const isCompleted = lessonProg?.isCompleted || false;
                                                                    const isCurrent = idx === (enrollment.lastAccessedLesson || 0) && !isCompleted;
                                                                    return (
                                                                        <div
                                                                            key={idx}
                                                                            className={`h-2 flex-1 rounded-full transition-all ${isCompleted
                                                                                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                                                                : isCurrent
                                                                                    ? 'bg-gradient-to-r from-blue-400 to-indigo-500 animate-pulse'
                                                                                    : 'bg-gray-300'
                                                                                }`}
                                                                            title={`Lesson ${idx + 1}`}
                                                                        ></div>
                                                                    );
                                                                })}
                                                            </div>
                                                            <div className="flex items-center gap-4 mt-3 text-xs">
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-600"></div>
                                                                    <span className="text-gray-600 font-medium">Completed</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                                                                    <span className="text-gray-600 font-medium">Current</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                                                                    <span className="text-gray-600 font-medium">Pending</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={() => router.push(`/student/modules/${mod._id}`)}
                                                                className="flex-1 bg-gradient-to-r from-[#021d49] to-blue-700 hover:from-[#032e6b] hover:to-blue-800 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                                            >
                                                                <Icons.Play className="w-5 h-5" />
                                                                Continue Learning
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Completed Modules */}
                        {completedModules.length > 0 && (
                            <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-100 mb-8 overflow-hidden">
                                <div className="p-6 sm:p-8 border-b-2 border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-xl">
                                                <Icons.Award className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900">
                                                    Completed Modules ({completedModules.length})
                                                </h2>
                                                <p className="text-gray-600 text-sm">Congratulations on your achievements!</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => router.push('/student/certificates')}
                                            className="text-green-600 hover:text-green-700 font-semibold text-sm flex items-center gap-1"
                                        >
                                            View Certificates
                                            <Icons.ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {completedModules.map((enrollment) => {
                                        const mod = enrollment.moduleId || {};
                                        const levelBadge = getLevelBadge(mod.level);

                                        return (
                                            <div key={enrollment._id} className="group bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-green-300 transition-all transform hover:-translate-y-1">
                                                <div className="relative">
                                                    {mod.bannerUrl ? (
                                                        <img
                                                            src={mod.bannerUrl}
                                                            alt={mod.title}
                                                            className="w-full h-40 object-cover cursor-pointer group-hover:opacity-90 transition-opacity"
                                                            onClick={() => router.push(`/student/modules/${mod._id}`)}
                                                        />
                                                    ) : (
                                                        <div
                                                            className="w-full h-40 bg-gradient-to-br from-green-200 to-emerald-200 flex items-center justify-center cursor-pointer"
                                                            onClick={() => router.push(`/student/modules/${mod._id}`)}
                                                        >
                                                            <Icons.Layers className="w-16 h-16 text-green-500" />
                                                        </div>
                                                    )}
                                                    <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                                                        <Icons.CheckCircle className="w-3 h-3" />
                                                        Completed
                                                    </div>
                                                    <div className="absolute top-3 left-3">
                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${levelBadge.color}`}>
                                                            {levelBadge.label}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="p-5">
                                                    <h3 className="font-bold text-gray-900 mb-3 text-base line-clamp-2 group-hover:text-green-600 transition-colors">{mod.title || 'Module'}</h3>
                                                    <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
                                                        <Icons.Calendar className="w-3 h-3" />
                                                        <span>Completed {formatLastActive(enrollment.completedAt)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-4 text-xs">
                                                        <Icons.Award className="w-3 h-3 text-green-600" />
                                                        <span className="text-green-600 font-bold">Score: {(enrollment.finalAssessmentScore || 0).toFixed(1)}%</span>
                                                    </div>
                                                    {enrollment.certificatePublicId ? (
                                                        <button
                                                            onClick={() => router.push('/student/certificates')}
                                                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                                                        >
                                                            <Icons.Download className="w-4 h-4" />
                                                            View Certificate
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => router.push(`/student/modules/${mod._id}`)}
                                                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                                                        >
                                                            <Icons.Eye className="w-4 h-4" />
                                                            View Module
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {enrollments.length === 0 && (
                            <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-100 p-12 text-center">
                                <Icons.BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                                <h3 className="text-3xl font-bold text-gray-900 mb-3">No Modules Yet</h3>
                                <p className="text-gray-600 mb-8 text-lg">Start your learning journey by exploring our modules</p>
                                <button
                                    onClick={() => router.push('/student/modules')}
                                    className="bg-gradient-to-r from-[#021d49] to-blue-700 hover:from-[#032e6b] hover:to-blue-800 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-3 text-lg"
                                >
                                    <Icons.Search className="w-6 h-6" />
                                    Browse Modules
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}

export default function StudentDashboardPage() {
    return (
        <ProtectedStudentRoute>
            <StudentDashboardContent />
        </ProtectedStudentRoute>
    );
}
