'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import coursesData, { getStudentProgress, getLastAccessedLesson } from '@/data/courses/courses';

export default function StudentDashboardPage() {
    const router = useRouter();
    const [studentProgress, setStudentProgress] = useState(null);
    const [coursesInProgress, setCoursesInProgress] = useState([]);
    const [completedCourses, setCompletedCourses] = useState([]);

    useEffect(() => {
        const progress = getStudentProgress();
        setStudentProgress(progress);

        const inProgress = progress.enrolledCourses
            .filter(ec => ec.status === 'in_progress')
            .map(ec => {
                const course = coursesData.find(c => c.id === ec.courseId);
                const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
                const timeRemaining = calculateTimeRemaining(course, ec.completedLessons);

                return {
                    ...course,
                    progress: ec.progress,
                    lastActive: formatLastActive(ec.lastAccessedDate),
                    timeLeft: timeRemaining,
                    lessons: totalLessons,
                    completedLessons: ec.completedLessons.length,
                    currentModule: ec.currentModule,
                    currentLesson: ec.currentLesson,
                };
            });
        setCoursesInProgress(inProgress);

        const completed = progress.enrolledCourses
            .filter(ec => ec.status === 'completed')
            .map(ec => {
                const course = coursesData.find(c => c.id === ec.courseId);
                return {
                    ...course,
                    completedDate: formatLastActive(ec.lastAccessedDate),
                    hasCertificate: ec.certificateEarned,
                };
            });
        setCompletedCourses(completed);
    }, []);

    const calculateTimeRemaining = (course, completedLessons = []) => {
        const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
        const remaining = totalLessons - completedLessons.length;
        const avgMinutesPerLesson = 20;
        const totalMinutes = remaining * avgMinutesPerLesson;

        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;

        return `${hours} hr${hours !== 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''} left`;
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

    const handleContinueLearning = (course) => {
        const lastLesson = getLastAccessedLesson(course.id);
        router.push(`/courses/${course.id}/learn/${lastLesson.moduleId}/${lastLesson.lessonId}`);
    };

    const stats = [
        {
            title: 'Enrolled Courses',
            value: studentProgress?.enrolledCourses?.length || '0',
            icon: 'BookOpen',
            color: 'from-orange-400 to-pink-500',
            bgColor: 'bg-orange-50'
        },
        {
            title: 'Completed',
            value: studentProgress?.totalCoursesCompleted || '0',
            icon: 'Award',
            color: 'from-green-400 to-emerald-500',
            bgColor: 'bg-green-50'
        },
        {
            title: 'Certificates',
            value: studentProgress?.totalCertificates || '0',
            icon: 'Star',
            color: 'from-yellow-400 to-orange-500',
            bgColor: 'bg-yellow-50'
        },
        {
            title: 'Hours Learned',
            value: studentProgress?.totalLearningHours?.toFixed(1) || '0',
            icon: 'Clock',
            color: 'from-blue-400 to-purple-500',
            bgColor: 'bg-blue-50'
        },
    ];

    if (!studentProgress) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white py-12 px-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-4xl font-black mb-2">Welcome back, Faith!</h1>
                    <p className="text-orange-100 text-lg">Continue your learning journey</p>

                    {/* Quick Stats */}
                    <div className="flex items-center gap-4 mt-6">
                        <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30">
                            <div className="flex items-center gap-2">
                                {Icons.Trophy ? <Icons.Trophy className="w-6 h-6" /> : null}
                                <div>
                                    <p className="text-xs opacity-90">XP</p>
                                    <p className="text-2xl font-bold">{studentProgress.totalXP}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30">
                            <div className="flex items-center gap-2">
                                {Icons.Fire ? <Icons.Fire className="w-6 h-6" /> : null}
                                <div>
                                    <p className="text-xs opacity-90">Streak</p>
                                    <p className="text-2xl font-bold">{studentProgress.learningStreak}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-8 py-12">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                    {stats.map((stat, index) => {
                        const IconComponent = Icons[stat.icon];
                        return (
                            <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                                <div className={`${stat.bgColor} p-3 rounded-xl mb-4 inline-block`}>
                                    {IconComponent && (
                                        <IconComponent
                                            className={`w-6 h-6 bg-gradient-to-br ${stat.color} bg-clip-text`}
                                            style={{ WebkitTextFillColor: 'transparent' }}
                                        />
                                    )}
                                </div>
                                <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
                                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Courses in Progress */}
                {coursesInProgress.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Courses In Progress ({coursesInProgress.length})
                                </h2>
                                <button
                                    onClick={() => router.push('/courses')}
                                    className="text-orange-600 hover:text-orange-700 font-semibold text-sm flex items-center gap-1"
                                >
                                    View All
                                    {Icons.ChevronRight ? <Icons.ChevronRight className="w-4 h-4" /> : null}
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {coursesInProgress.map((course) => (
                                <div
                                    key={course.id}
                                    className="flex gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-all border-2 border-transparent hover:border-orange-200"
                                >
                                    <img
                                        src={course.image}
                                        alt={course.title}
                                        className="w-24 h-24 rounded-xl object-cover shadow-md cursor-pointer"
                                        onClick={() => router.push(`/courses/${course.id}`)}
                                    />
                                    <div className="flex-1">
                                        <h3
                                            className="font-bold text-gray-900 mb-2 hover:text-orange-600 cursor-pointer"
                                            onClick={() => router.push(`/courses/${course.id}`)}
                                        >
                                            {course.title}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                            <span className="flex items-center gap-1">
                                                {Icons.Clock ? <Icons.Clock className="w-4 h-4" /> : null}
                                                {course.timeLeft}
                                            </span>
                                            <span>LAST ACTIVE: {course.lastActive.toUpperCase()}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs text-gray-600">{course.progress}% Complete</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-gradient-to-r from-orange-400 to-pink-500 h-2 rounded-full transition-all"
                                                        style={{ width: `${course.progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleContinueLearning(course)}
                                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                                            >
                                                Continue
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* No Courses Message */}
                {coursesInProgress.length === 0 && completedCourses.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                        {Icons.BookOpen ? <Icons.BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" /> : null}
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Courses Yet</h3>
                        <p className="text-gray-600 mb-6">Start your learning journey by enrolling in a course</p>
                        <button
                            onClick={() => router.push('/courses')}
                            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-lg"
                        >
                            Browse Courses
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}