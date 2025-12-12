'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import courseService from '@/lib/api/courseService';
import ProtectedInstructorRoute from '@/components/ProtectedInstructorRoute';

function InstructorDashboardContent() {
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true);
                setError('');

                // Fetch instructor courses
                const coursesData = await courseService.getInstructorCourses();
                const courses = Array.isArray(coursesData) ? coursesData : coursesData?.courses || [];

                // Calculate stats from courses
                const totalCourses = courses.length;
                const activeStudents = courses.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0);
                const avgRating = courses.length > 0
                    ? (courses.reduce((sum, c) => sum + (c.instructorId?.avgRating || 0), 0) / courses.length)
                    : 0;
                const totalHours = courses.reduce((sum, c) => sum + ((c.modules?.length || 0) * 2), 0);

                // Calculate total questions across all courses
                const getTotalQuestions = (course) => {
                    let totalQuestions = 0;
                    if (course?.modules?.length) {
                        course.modules.forEach((module) => {
                            if (module.lessons?.length) {
                                module.lessons.forEach((lesson) => {
                                    totalQuestions += lesson.questions?.length || 0;
                                });
                            }
                            totalQuestions += module.moduleAssessment?.questions?.length || 0;
                        });
                    }
                    totalQuestions += course?.finalAssessment?.questions?.length || 0;
                    return totalQuestions;
                };

                setDashboardData({
                    courses,
                    activeStudents,
                    avgRating,
                    totalHours,
                    totalCourses,
                    getTotalQuestions
                });
            } catch (err) {
                setError('Failed to load dashboard data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const stats = dashboardData ? [
        {
            label: 'Total Courses',
            value: dashboardData.totalCourses?.toString() || '0',
            icon: 'BookOpen',
            color: 'from-emerald-500 to-teal-600',
            change: '',
            bgColor: 'bg-emerald-50',
            iconColor: 'text-emerald-600'
        },
        {
            label: 'Active Students',
            value: dashboardData.activeStudents?.toLocaleString() || '0',
            icon: 'Users',
            color: 'from-blue-500 to-blue-600',
            change: '',
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600'
        },
        {
            label: 'Avg. Rating',
            value: dashboardData.avgRating?.toFixed(1) || '0.0',
            icon: 'Star',
            color: 'from-yellow-500 to-orange-600',
            change: '',
            bgColor: 'bg-yellow-50',
            iconColor: 'text-yellow-600'
        },
        {
            label: 'Total Content Hours',
            value: dashboardData.totalHours?.toString() || '0',
            icon: 'MessageSquare',
            color: 'from-purple-500 to-purple-600',
            change: '',
            bgColor: 'bg-purple-50',
            iconColor: 'text-purple-600'
        },
    ] : [];

    const recentActivity = dashboardData?.recentActivity || [];

    const upcomingDeadlines = dashboardData?.upcomingDeadlines || [];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-emerald-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading instructor dashboard...</p>
                </div>
            </div>
        );
    }
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-red-600 font-bold">{error}</p>
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
            <main className="pt-20 p-6 lg:p-8">
                <div className="max-w-full">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#16a34a] to-emerald-700 bg-clip-text text-transparent mb-2">
                            Welcome back, {dashboardData?.instructor?.firstName || 'Instructor'}! 👋
                        </h1>
                        <p className="text-gray-600">Here's what's happening with your courses today.</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {stats.map((stat, index) => {
                            const IconComponent = Icons[stat.icon];
                            return (
                                <div key={index} className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all duration-300 group">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`p-3 rounded-lg ${stat.bgColor} shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                            {IconComponent && <IconComponent className={`w-6 h-6 ${stat.iconColor}`} />}
                                        </div>
                                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                                            {stat.change}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                                    <p className="text-sm text-gray-600">{stat.label}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Icons.Zap className="w-5 h-5 text-emerald-600" />
                            Quick Actions
                        </h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <button
                                onClick={() => router.push('/instructor/courses/upload')}
                                className="bg-gradient-to-r from-[#16a34a] to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                            >
                                <Icons.Upload className="w-4 h-4" />
                                Upload Course
                            </button>
                            <button
                                onClick={() => router.push('/instructor/assessments')}
                                className="bg-white hover:bg-emerald-50 text-gray-700 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-gray-200 hover:border-emerald-300"
                            >
                                <Icons.ClipboardList className="w-4 h-4 text-emerald-600" />
                                Create Assessment
                            </button>
                            <button
                                onClick={() => router.push('/instructor/students')}
                                className="bg-white hover:bg-emerald-50 text-gray-700 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-gray-200 hover:border-emerald-300"
                            >
                                <Icons.Users className="w-4 h-4 text-emerald-600" />
                                View Students
                            </button>
                            <button
                                onClick={() => router.push('/instructor/analytics')}
                                className="bg-white hover:bg-emerald-50 text-gray-700 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-gray-200 hover:border-emerald-300"
                            >
                                <Icons.BarChart3 className="w-4 h-4 text-emerald-600" />
                                View Analytics
                            </button>
                        </div>
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid lg:grid-cols-3 gap-6 mb-6">
                        {/* My Courses */}
                        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
                            <div className="p-5 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Icons.BookOpen className="w-5 h-5 text-emerald-600" />
                                        My Courses
                                    </h2>
                                    <button
                                        onClick={() => router.push('/instructor/courses')}
                                        className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1"
                                    >
                                        View All <Icons.ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="space-y-4">
                                    {dashboardData?.courses?.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Icons.BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500 mb-4">You haven't created any courses yet.</p>
                                            <button
                                                onClick={() => router.push('/instructor/courses/upload')}
                                                className="px-6 py-2 bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all"
                                            >
                                                Create Your First Course
                                            </button>
                                        </div>
                                    ) : (
                                        dashboardData.courses.slice(0, 3).map((course) => (
                                            <div key={course._id} className="flex items-start gap-4 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg hover:shadow-md transition-all border border-emerald-100">
                                                <img
                                                    src={course.thumbnailUrl || '/default-course.png'}
                                                    alt={course.title}
                                                    className="w-20 h-20 rounded-lg object-cover"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-gray-900 mb-1">{course.title}</h3>
                                                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mb-2">
                                                        <span className="flex items-center gap-1">
                                                            <Icons.Users className="w-3 h-3" />
                                                            {course.enrollmentCount || 0}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Icons.BookOpen className="w-3 h-3" />
                                                            {course.modules?.length || 0} modules
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Icons.HelpCircle className="w-3 h-3" />
                                                            {dashboardData.getTotalQuestions(course)} questions
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => router.push(`/instructor/courses/${course._id}`)}
                                                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg font-medium transition-colors"
                                                        >
                                                            Manage
                                                        </button>
                                                        <button
                                                            onClick={() => router.push(`/instructor/courses/${course._id}/analytics`)}
                                                            className="px-3 py-1 bg-white hover:bg-gray-50 text-gray-700 text-xs rounded-lg font-medium border border-gray-200 transition-colors"
                                                        >
                                                            Analytics
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                            <div className="p-5 border-b border-gray-200">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Icons.Activity className="w-5 h-5 text-emerald-600" />
                                    Recent Activity
                                </h2>
                            </div>

                            <div className="p-5">
                                <div className="space-y-4">
                                    {recentActivity.map((activity, index) => {
                                        const IconComponent = Icons[activity.icon];
                                        return (
                                            <div key={index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                                <div className="p-2 bg-emerald-50 rounded-lg">
                                                    {IconComponent && <IconComponent className={`w-4 h-4 ${activity.color}`} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-gray-900">{activity.text}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Deadlines */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="p-5 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Icons.Calendar className="w-5 h-5 text-emerald-600" />
                                Upcoming Deadlines
                            </h2>
                        </div>

                        <div className="p-5">
                            <div className="space-y-3">
                                {upcomingDeadlines.map((deadline, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 text-sm">{deadline.title}</h4>
                                            <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                                                <Icons.Clock className="w-3 h-3" />
                                                {deadline.dueDate}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${deadline.status === 'urgent'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {deadline.status === 'urgent' ? 'Urgent' : 'Upcoming'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function InstructorDashboardPage() {
    return (
        <ProtectedInstructorRoute>
            <InstructorDashboardContent />
        </ProtectedInstructorRoute>
    );
}
