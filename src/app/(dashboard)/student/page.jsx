'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import coursesData, { getStudentProgress, getLastAccessedLesson } from '@/data/courses/courses';
import Navbar from '@/components/navbar/navbar';

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

        return `${hours} hrs ${mins} mins left`;
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
        { label: 'XP', value: studentProgress?.totalXP || '0', icon: 'Zap', color: 'text-yellow-600' },
        { label: 'Certificates', value: studentProgress?.totalCertificates || '0', icon: 'Award', color: 'text-blue-600' },
        { label: 'Learning Streak', value: studentProgress?.learningStreak || '0', icon: 'Flame', color: 'text-orange-600' },
        { label: 'Total Learning Hours', value: studentProgress?.totalLearningHours || '0', icon: 'Clock', color: 'text-purple-600' },
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

        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50">
                {/* Main Content */}
                <main className="p-4 sm:p-6 lg:p-8">
                    <div className="max-w-full">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
                            Faith's Dashboard – let's jump back in.
                        </h1>

                        {/* Tabs */}
                        <div className="flex gap-4 sm:gap-8 border-b border-gray-200 mb-6 overflow-x-auto">
                            <button className="pb-3 border-b-2 border-green-600 text-green-700 font-medium whitespace-nowrap text-sm sm:text-base">
                                Learn & Get Certificates
                            </button>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {stats.map((stat, index) => {
                                const IconComponent = Icons[stat.icon];
                                return (
                                    <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow">
                                        <div className="flex items-center gap-2 mb-2">
                                            {IconComponent && <IconComponent className={`w-5 h-5 ${stat.color}`} />}
                                            <span className="text-xs sm:text-sm font-medium text-gray-600">{stat.label}</span>
                                        </div>
                                        <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => router.push('/student/achievements')}
                                className="text-green-600 hover:text-green-700 font-medium text-sm"
                            >
                                View All Achievements →
                            </button>
                        </div>

                        {/* Courses in Progress */}
                        {coursesInProgress.length > 0 && (
                            <div className="bg-white rounded-lg border border-gray-200 mb-8">
                                <div className="p-4 sm:p-5 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                                            Other Courses In Progress ({coursesInProgress.length})
                                        </h2>
                                        <button
                                            onClick={() => router.push('/courses')}
                                            className="text-gray-600 hover:text-gray-900"
                                        >
                                            <Icons.MoreHorizontal className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 sm:p-5">
                                    {coursesInProgress.map((course) => (
                                        <div key={course.id} className="flex flex-col sm:flex-row gap-4 pb-4 last:pb-0">
                                            <img
                                                src={course.image}
                                                alt={course.title}
                                                className="w-full sm:w-36 h-24 sm:h-24 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
                                                onClick={() => router.push(`/courses/${course.id}`)}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h3
                                                    className="font-semibold text-gray-900 mb-2 cursor-pointer hover:text-orange-600 transition-colors text-base"
                                                    onClick={() => router.push(`/courses/${course.id}`)}
                                                >
                                                    {course.title}
                                                </h3>

                                                <div className="mb-2">
                                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                                                        <div
                                                            className="bg-yellow-500 h-2 rounded-full transition-all"
                                                            style={{ width: `${course.progress}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-700">{course.progress}% Complete</span>
                                                </div>

                                                <div className="text-xs sm:text-sm text-blue-600 font-medium mb-3">
                                                    LAST ACTIVE: {course.lastActive.toUpperCase()}
                                                </div>

                                                <button
                                                    onClick={() => handleContinueLearning(course)}
                                                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium transition-colors text-sm inline-flex items-center justify-center"
                                                >
                                                    Continue Learning
                                                    <span className="ml-2 text-xs">{course.timeLeft}</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Completed Courses */}
                        {completedCourses.length > 0 && (
                            <div className="bg-white rounded-lg border border-gray-200">
                                <div className="p-4 sm:p-5 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                                            Your Completed Courses ({completedCourses.length}) & Claimed Certificates ({studentProgress.totalCertificates})
                                        </h2>
                                        <button
                                            onClick={() => router.push('/student/certificates')}
                                            className="text-green-600 hover:text-green-700 font-medium text-sm"
                                        >
                                            View All →
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {completedCourses.map((course) => (
                                        <div key={course.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                            <img
                                                src={course.image}
                                                alt={course.title}
                                                className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => router.push(`/courses/${course.id}`)}
                                            />
                                            <div className="p-3">
                                                <h3 className="font-semibold text-gray-900 mb-2 text-sm">{course.title}</h3>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <button className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-xs">
                                                        <Icons.ThumbsUp className="w-3 h-3" />
                                                        Rate This Course
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => router.push('/student/certificates')}
                                                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors text-sm"
                                                >
                                                    Claim Certificate
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* No Courses Message */}
                        {coursesInProgress.length === 0 && completedCourses.length === 0 && (
                            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                                <Icons.BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Courses Yet</h3>
                                <p className="text-gray-600 mb-6">Start your learning journey by enrolling in a course</p>
                                <button
                                    onClick={() => router.push('/courses')}
                                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                                >
                                    Browse Courses
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>

    );
}