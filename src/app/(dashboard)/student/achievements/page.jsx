'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import courseService from '@/lib/api/courseService';
import Navbar from '@/components/navbar/navbar';

export default function AchievementsPage() {
    const router = useRouter();
    const [achievementsData, setAchievementsData] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAchievements();
    }, []);

    const fetchAchievements = async () => {
        try {
            setLoading(true);
            setError('');
            const [achievements, dashboard] = await Promise.all([
                courseService.getStudentAchievements(),
                courseService.getStudentDashboard(),
            ]);
            setAchievementsData(achievements);
            setDashboardData(dashboard);
        } catch (err) {
            setError('Failed to load achievements');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Calculate metrics
    const totalXP = achievementsData?.totalXp || achievementsData?.totalPoints || 0;
    const achievements = achievementsData?.achievements || [];

    const moduleCompletions = achievements.filter(a => a.type === 'module_completion');
    const courseCompletions = achievements.filter(a => a.type === 'course_completion');
    const xpBoosts = achievements.filter(a => a.type === 'xp_boost');

    const inProgressCourses = dashboardData?.enrollments?.filter(e => !e.isCompleted).map(e => ({
        _id: e._id,
        title: e.courseId?.title || 'Untitled Course',
        progress: Math.round(e.progress || 0)
    })) || [];

    const completedCoursesCount = dashboardData?.enrollments?.filter(e => e.isCompleted).length || 0;

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pt-16">
                    <div className="text-center">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-t-4 border-[#021d49] mx-auto mb-4"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Icons.Trophy className="w-8 h-8 text-[#021d49]" />
                            </div>
                        </div>
                        <p className="text-gray-700 font-semibold text-lg">Loading your achievements...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 pt-16">
                <main className="p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="mb-8">
                            <button
                                onClick={() => router.push('/student')}
                                className="flex items-center gap-2 text-gray-600 hover:text-[#021d49] mb-6 font-semibold transition-colors group"
                            >
                                <div className="bg-white p-2 rounded-lg group-hover:bg-[#021d49] group-hover:text-white transition-all shadow-sm">
                                    <Icons.ChevronLeft className="w-5 h-5" />
                                </div>
                                <span className="text-sm">Back to Dashboard</span>
                            </button>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="bg-gradient-to-r from-[#021d49] to-blue-700 p-4 rounded-2xl shadow-lg">
                                    <Icons.Trophy className="w-10 h-10 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl sm:text-5xl font-black text-gray-900 mb-2">
                                        Your Achievements
                                    </h1>
                                    <p className="text-gray-600 text-lg">
                                        Track your learning progress and XP boosts earned
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                            {/* Total XP Card */}
                            <div className="group bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 cursor-pointer">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl group-hover:scale-110 transition-transform">
                                        <Icons.Zap className="w-10 h-10" />
                                    </div>
                                    <span className="text-5xl font-black">{totalXP}</span>
                                </div>
                                <p className="text-yellow-100 text-sm font-semibold mb-1">Total XP Earned</p>
                                <div className="h-1 bg-white/30 rounded-full mt-3"></div>
                            </div>

                            {/* Module Completions Card */}
                            <div className="group bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 cursor-pointer">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl group-hover:scale-110 transition-transform">
                                        <Icons.BookOpen className="w-10 h-10" />
                                    </div>
                                    <span className="text-5xl font-black">{moduleCompletions.length}</span>
                                </div>
                                <p className="text-blue-100 text-sm font-semibold mb-1">Modules Completed</p>
                                <div className="h-1 bg-white/30 rounded-full mt-3"></div>
                            </div>

                            {/* Course Completions Card */}
                            <div className="group bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 cursor-pointer">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl group-hover:scale-110 transition-transform">
                                        <Icons.Award className="w-10 h-10" />
                                    </div>
                                    <span className="text-5xl font-black">{courseCompletions.length}</span>
                                </div>
                                <p className="text-green-100 text-sm font-semibold mb-1">Courses Completed</p>
                                <div className="h-1 bg-white/30 rounded-full mt-3"></div>
                            </div>
                        </div>

                        {/* Achievement Timeline */}
                        <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 shadow-lg mb-8">
                            <div className="flex items-center gap-3 mb-6">
                                <Icons.List className="w-6 h-6 text-[#021d49]" />
                                <h2 className="text-2xl font-bold text-gray-900">Achievement Timeline</h2>
                            </div>

                            {achievements.length > 0 ? (
                                <div className="space-y-4">
                                    {achievements.map((achievement, index) => (
                                        <div
                                            key={achievement._id || index}
                                            className="group flex items-start gap-4 p-6 rounded-xl border-2 border-gray-100 hover:border-[#021d49] hover:shadow-lg transition-all"
                                        >
                                            {/* Icon */}
                                            <div className={`p-4 rounded-xl ${achievement.type === 'course_completion'
                                                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                                : achievement.type === 'module_completion'
                                                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                                    : 'bg-gradient-to-br from-yellow-400 to-orange-500'
                                                } text-white shadow-md group-hover:scale-110 transition-transform`}>
                                                {achievement.type === 'course_completion' ? (
                                                    <Icons.Award className="w-6 h-6" />
                                                ) : achievement.type === 'module_completion' ? (
                                                    <Icons.BookCheck className="w-6 h-6" />
                                                ) : (
                                                    <Icons.Zap className="w-6 h-6" />
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="font-bold text-lg text-gray-900 mb-1">
                                                            {achievement.title || 'Achievement Unlocked'}
                                                        </h3>
                                                        <p className="text-gray-600 text-sm mb-2">
                                                            {achievement.description || achievement.moduleTitle || 'Great work!'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(achievement.createdAt).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 px-4 py-2 rounded-full font-bold">
                                                        <Icons.Zap className="w-4 h-4" />
                                                        <span>+{achievement.xpAwarded} XP</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Icons.Trophy className="w-16 h-16 text-gray-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No Achievements Yet</h3>
                                    <p className="text-gray-600 mb-8 text-lg">Complete modules and courses to earn XP boosts!</p>
                                    <button
                                        onClick={() => router.push('/courses')}
                                        className="bg-gradient-to-r from-[#021d49] to-blue-700 hover:from-[#032e6b] hover:to-blue-800 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-3 text-lg"
                                    >
                                        <Icons.BookOpen className="w-6 h-6" />
                                        Start Learning
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Courses in Progress */}
                        {inProgressCourses.length > 0 && (
                            <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 shadow-lg">
                                <div className="flex items-center gap-3 mb-6">
                                    <Icons.TrendingUp className="w-6 h-6 text-[#021d49]" />
                                    <h2 className="text-2xl font-bold text-gray-900">Continue Learning</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {inProgressCourses.map((course) => (
                                        <div
                                            key={course._id}
                                            className="group p-6 rounded-xl border-2 border-blue-100 hover:border-[#021d49] hover:shadow-lg transition-all cursor-pointer"
                                            onClick={() => router.push(`/courses/${course._id}`)}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-bold text-gray-900 group-hover:text-[#021d49] transition-colors">
                                                    {course.title}
                                                </h3>
                                                <span className="text-blue-600 font-bold text-lg">{course.progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-[#021d49] to-blue-700 h-2 rounded-full transition-all"
                                                    style={{ width: `${course.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}
