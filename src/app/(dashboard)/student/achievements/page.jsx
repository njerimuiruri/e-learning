'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import courseService from '@/lib/api/courseService';
import Navbar from '@/components/navbar/navbar';

export default function AchievementsPage() {
    const router = useRouter();
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
            const data = await courseService.getStudentDashboard();
            setDashboardData(data);
        } catch (err) {
            setError('Failed to load achievements');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Calculate metrics at component level for use in JSX
    const totalLessonsCompleted = dashboardData?.enrollments?.reduce(
        (sum, e) => sum + (e.completedModules?.length || 0),
        0
    ) || 0;
    
    const inProgressCourses = dashboardData?.enrollments?.filter(e => !e.isCompleted).map(e => ({
        _id: e._id,
        title: e.courseId?.title || 'Untitled Course',
        progress: Math.round(e.progress || 0)
    })) || [];

    const completedCoursesCount = dashboardData?.enrollments?.filter(e => e.isCompleted).length || 0;

    if (!dashboardData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-500 mx-auto mb-4\"></div>
                    <p className="text-gray-600">Loading achievements...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 pt-16">
                <main className="p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden">
                    <div className="max-w-7xl mx-auto w-full">
                        {/* Header */}
                        <div className="mb-8">
                            <button
                                onClick={() => router.push('/student')}
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                            >
                                <Icons.ChevronLeft className="w-5 h-5" />
                                <span className="text-sm font-medium">Back to Dashboard</span>
                            </button>
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                                Your Progress
                            </h1>
                            <p className="text-gray-600">
                                Track your learning progress and XP points earned
                            </p>
                        </div>

                        {/* XP Boost & Current Courses Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Current XP Boost Card */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                                            <Icons.Zap className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">XP Boost Points</h3>
                                            <p className="text-sm text-gray-600">Your current progress</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black text-gray-900">{totalLessonsCompleted * 10}</span>
                                        <span className="text-lg text-gray-600">XP</span>
                                    </div>
                                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
                                        <div className="flex items-center justify-between text-sm mb-1">
                                            <span className="text-gray-700 font-medium">Modules Completed</span>
                                            <span className="text-gray-900 font-bold">{totalLessonsCompleted}</span>
                                        </div>
                                        <p className="text-xs text-gray-600">+10 XP per module</p>
                                    </div>
                                </div>
                            </div>

                            {/* Courses Started Card */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                            <Icons.BookOpen className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">Courses Started</h3>
                                            <p className="text-sm text-gray-600">Currently learning</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {inProgressCourses.length > 0 ? (
                                        <>
                                            <div className="flex items-baseline gap-2 mb-3">
                                                <span className="text-4xl font-black text-gray-900">{inProgressCourses.length}</span>
                                                <span className="text-lg text-gray-600">Active</span>
                                            </div>
                                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                                {inProgressCourses.map((course) => (
                                                    <div key={course._id} className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-gray-900 font-medium truncate flex-1">{course.title}</span>
                                                            <span className="text-blue-600 font-bold ml-2">{course.progress}%</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-4">
                                            <Icons.GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600">No courses in progress</p>
                                            <p className="text-xs text-gray-500 mt-1">Start a course to see it here!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}


