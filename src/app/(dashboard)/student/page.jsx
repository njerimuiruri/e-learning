'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import courseService from '@/lib/api/courseService';
import Navbar from '@/components/navbar/navbar';
import ProtectedStudentRoute from '@/components/ProtectedStudentRoute';

function StudentDashboardContent() {
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState(null);
    const [coursesInProgress, setCoursesInProgress] = useState([]);
    const [pendingAssessmentCourses, setPendingAssessmentCourses] = useState([]);
    const [completedCourses, setCompletedCourses] = useState([]);
    const [publishedCourses, setPublishedCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError('');
            const [data, published] = await Promise.all([
                courseService.getStudentDashboard(),
                courseService.getAllCourses({ page: 1, limit: 12 }),
            ]);
            setDashboardData(data);

            const inProgress = data.enrollments
                ?.filter(enrollment => {
                    if (enrollment.isCompleted) return false;
                    const courseData = enrollment.courseId || {};
                    const totalModules = courseData.modules?.length || 0;
                    const completedModules = enrollment.completedModules || 0;
                    return completedModules < totalModules;
                })
                .map(enrollment => {
                    const courseData = enrollment.courseId || {};
                    return {
                        _id: courseData._id,
                        title: courseData.title || enrollment.courseTitle || 'Course title not set',
                        description: courseData.description || '',
                        thumbnailUrl: courseData.thumbnailUrl || courseData.bannerImage || '/placeholder-course.png',
                        modules: courseData.modules || [],
                        enrollmentId: enrollment._id,
                        progress: enrollment.progress || 0,
                        lastActive: formatLastActive(enrollment.lastAccessedAt),
                        completedModules: enrollment.completedModules || 0,
                        finalAssessmentAttempts: enrollment.finalAssessmentAttempts || 0,
                        lastAccessedModule: enrollment.lastAccessedModule,
                        lastAccessedLesson: enrollment.lastAccessedLesson,
                    };
                }) || [];
            setCoursesInProgress(inProgress);

            const pending = data.enrollments
                ?.filter(enrollment => {
                    if (enrollment.isCompleted) return false;
                    const courseData = enrollment.courseId || {};
                    const totalModules = courseData.modules?.length || 0;
                    const completedModules = enrollment.completedModules || 0;
                    return completedModules >= totalModules && !enrollment.finalAssessmentAttempted;
                })
                .map(enrollment => {
                    const courseData = enrollment.courseId || {};
                    return {
                        _id: courseData._id,
                        title: courseData.title || enrollment.courseTitle || 'Course title not set',
                        description: courseData.description || '',
                        thumbnailUrl: courseData.thumbnailUrl || courseData.bannerImage || '/placeholder-course.png',
                        modules: courseData.modules || [],
                        enrollmentId: enrollment._id,
                        progress: enrollment.progress || 0,
                        completedModules: enrollment.completedModules || 0,
                        totalModules: courseData.modules?.length || 0,
                        lastActive: formatLastActive(enrollment.lastAccessedAt),
                        finalAssessmentAttempts: enrollment.finalAssessmentAttempts || 0,
                    };
                }) || [];
            setPendingAssessmentCourses(pending);

            const completed = data.enrollments
                ?.filter(enrollment => enrollment.isCompleted)
                .map(enrollment => {
                    const courseData = enrollment.courseId || {};
                    return {
                        _id: courseData._id,
                        title: courseData.title || enrollment.courseTitle || 'Course title not set',
                        description: courseData.description || '',
                        thumbnailUrl: courseData.thumbnailUrl || courseData.bannerImage || '/placeholder-course.png',
                        enrollmentId: enrollment._id,
                        completedDate: formatLastActive(enrollment.completedAt),
                        hasCertificate: enrollment.certificateEarned,
                        certificateUrl: enrollment.certificateUrl,
                        score: enrollment.finalAssessmentScore || enrollment.totalScore || 0,
                    };
                }) || [];
            setCompletedCourses(completed);

            const publishedList = Array.isArray(published)
                ? published
                : Array.isArray(published?.courses)
                    ? published.courses
                    : [];
            setPublishedCourses(publishedList);
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

    const handleContinueLearning = async (course) => {
        try {
            const enrollment = await courseService.getEnrollment(course._id);

            const lessonProgress = enrollment.lessonProgress || [];
            let lastModuleIndex = typeof enrollment.lastAccessedModule === 'number' ? enrollment.lastAccessedModule : null;
            let lastLessonIndex = typeof enrollment.lastAccessedLesson === 'number' ? enrollment.lastAccessedLesson : null;

            if (lastModuleIndex === null || lastLessonIndex === null) {
                if (lessonProgress.length > 0) {
                    const sorted = [...lessonProgress].sort((a, b) => {
                        const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
                        const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
                        return bTime - aTime;
                    });
                    lastModuleIndex = sorted[0]?.moduleIndex ?? 0;
                    lastLessonIndex = sorted[0]?.lessonIndex ?? 0;
                } else {
                    lastModuleIndex = 0;
                    lastLessonIndex = 0;
                }
            }

            const module = course.modules?.[lastModuleIndex] || course.modules?.[0];
            const lesson = module?.lessons?.[lastLessonIndex] || module?.lessons?.[0];

            const moduleId = module?._id || lastModuleIndex;
            const lessonId = lesson?._id || lastLessonIndex;

            router.push(`/courses/${course._id}/learn/${moduleId}/${lessonId}`);
        } catch (err) {
            console.error('Failed to get enrollment details:', err);
            const firstModule = course.modules?.[0];
            const firstLesson = firstModule?.lessons?.[0];
            const moduleId = firstModule?._id || 0;
            const lessonId = firstLesson?._id || 0;
            router.push(`/courses/${course._id}/learn/${moduleId}/${lessonId}`);
        }
    };

    const stats = [
        { label: 'Enrollments', value: dashboardData?.enrollments?.length || '0', icon: 'BookOpen', color: 'from-blue-500 to-blue-600', iconColor: 'text-blue-600', bgColor: 'bg-blue-50' },
        { label: 'In Progress', value: coursesInProgress?.length || '0', icon: 'Zap', color: 'from-purple-500 to-purple-600', iconColor: 'text-purple-600', bgColor: 'bg-purple-50' },
        { label: 'Ready for Assessment', value: pendingAssessmentCourses?.length || '0', icon: 'Target', color: 'from-indigo-500 to-indigo-600', iconColor: 'text-indigo-600', bgColor: 'bg-indigo-50' },
        { label: 'Completed', value: completedCourses?.length || '0', icon: 'CheckCircle', color: 'from-green-500 to-emerald-600', iconColor: 'text-green-600', bgColor: 'bg-green-50' },
        { label: 'Certificates', value: dashboardData?.certificates?.length || '0', icon: 'Award', color: 'from-[#021d49] to-blue-800', iconColor: 'text-[#021d49]', bgColor: 'bg-blue-50' },
    ];

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
                                Welcome back! 👋
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
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`${stat.bgColor} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                                                {IconComponent && <IconComponent className={`w-6 h-6 ${stat.iconColor}`} />}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-3xl sm:text-4xl font-black text-gray-900">{stat.value}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-600">{stat.label}</p>
                                        <div className={`h-1 bg-gradient-to-r ${stat.color} rounded-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                            <button
                                onClick={() => router.push('/courses')}
                                className="bg-gradient-to-r from-[#021d49] to-blue-700 text-white rounded-2xl p-6 hover:from-[#032e6b] hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-4"
                            >
                                <div className="bg-white/20 p-3 rounded-xl">
                                    <Icons.Search className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-lg">Explore Courses</p>
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

                        {/* Pending Assessment Courses - Priority Section */}
                        {pendingAssessmentCourses.length > 0 && (
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl shadow-2xl mb-8 overflow-hidden">
                                <div className="p-6 sm:p-8 text-white">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="bg-white/20 p-3 rounded-xl">
                                            <Icons.Target className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl sm:text-3xl font-bold">
                                                Ready for Final Assessment! 🎯
                                            </h2>
                                            <p className="text-indigo-100 text-sm sm:text-base">
                                                You've completed all modules. Take the final assessment to earn your certificate!
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-6 sm:p-8">
                                    <div className="space-y-6">
                                        {pendingAssessmentCourses.map((course) => (
                                            <div key={course._id} className="flex flex-col sm:flex-row gap-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 hover:shadow-lg transition-all">
                                                <img
                                                    src={course.thumbnailUrl || '/placeholder-course.png'}
                                                    alt={course.title}
                                                    className="w-full sm:w-48 h-32 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0 shadow-md"
                                                    onClick={() => router.push(`/courses/${course._id}`)}
                                                />
                                                <div className="flex-1">
                                                    <h3
                                                        className="font-bold text-xl text-gray-900 mb-3 cursor-pointer hover:text-indigo-600 transition-colors"
                                                        onClick={() => router.push(`/courses/${course._id}`)}
                                                    >
                                                        {course.title}
                                                    </h3>

                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full">
                                                            <Icons.CheckCircle className="w-5 h-5" />
                                                            <span className="text-sm font-bold">
                                                                All {course.totalModules} modules completed
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="w-full bg-green-200 rounded-full h-3 mb-4">
                                                        <div
                                                            className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all shadow-sm"
                                                            style={{ width: '100%' }}
                                                        ></div>
                                                    </div>

                                                    <button
                                                        onClick={() => router.push(`/courses/${course._id}/final-assessment`)}
                                                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-3 text-lg"
                                                    >
                                                        <Icons.BookOpen className="w-5 h-5" />
                                                        Take Final Assessment
                                                        <Icons.ArrowRight className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Courses in Progress */}
                        {coursesInProgress.length > 0 && (
                            <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-100 mb-8 overflow-hidden">
                                <div className="p-6 sm:p-8 border-b-2 border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-[#021d49] text-white p-3 rounded-xl">
                                                <Icons.BookOpen className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900">
                                                    Continue Learning ({coursesInProgress.length})
                                                </h2>
                                                <p className="text-gray-600 text-sm">Keep up the momentum!</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => router.push('/courses')}
                                            className="text-[#021d49] hover:text-blue-700 font-semibold text-sm flex items-center gap-1"
                                        >
                                            View All
                                            <Icons.ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 sm:p-8">
                                    <div className="space-y-6">
                                        {coursesInProgress.map((course) => (
                                            <div key={course._id} className="flex flex-col sm:flex-row gap-6 p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all border-2 border-gray-200 hover:border-[#021d49]/30">
                                                <img
                                                    src={course.thumbnailUrl || '/placeholder-course.png'}
                                                    alt={course.title}
                                                    className="w-full sm:w-48 h-32 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0 shadow-md"
                                                    onClick={() => router.push(`/courses/${course._id}`)}
                                                />
                                                <div className="flex-1">
                                                    <h3
                                                        className="font-bold text-xl text-gray-900 mb-3 cursor-pointer hover:text-[#021d49] transition-colors"
                                                        onClick={() => router.push(`/courses/${course._id}`)}
                                                    >
                                                        {course.title}
                                                    </h3>

                                                    <div className="mb-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-sm font-bold text-gray-700">{course.progress}% Complete</span>
                                                            <span className="text-xs text-gray-500 uppercase font-semibold">Last active: {course.lastActive}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                                            <div
                                                                className="bg-gradient-to-r from-[#021d49] to-blue-600 h-3 rounded-full transition-all shadow-sm"
                                                                style={{ width: `${course.progress}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => handleContinueLearning(course)}
                                                        className="bg-gradient-to-r from-[#021d49] to-blue-700 hover:from-[#032e6b] hover:to-blue-800 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                                                    >
                                                        <Icons.Play className="w-5 h-5" />
                                                        Continue Learning
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Completed Courses */}
                        {completedCourses.length > 0 && (
                            <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-100 mb-8 overflow-hidden">
                                <div className="p-6 sm:p-8 border-b-2 border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-xl">
                                                <Icons.Award className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900">
                                                    Completed Courses ({completedCourses.length})
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
                                    {completedCourses.map((course) => (
                                        <div key={course._id} className="group bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-green-300 transition-all transform hover:-translate-y-1">
                                            <div className="relative">
                                                <img
                                                    src={course.thumbnailUrl || '/placeholder-course.png'}
                                                    alt={course.title}
                                                    className="w-full h-40 object-cover cursor-pointer group-hover:opacity-90 transition-opacity"
                                                    onClick={() => router.push(`/courses/${course._id}`)}
                                                />
                                                <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                                                    <Icons.CheckCircle className="w-3 h-3" />
                                                    Completed
                                                </div>
                                            </div>
                                            <div className="p-5">
                                                <h3 className="font-bold text-gray-900 mb-3 text-base line-clamp-2 group-hover:text-green-600 transition-colors">{course.title}</h3>
                                                <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
                                                    <Icons.Calendar className="w-3 h-3" />
                                                    <span>Completed {course.completedDate}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mb-4 text-xs">
                                                    <Icons.Award className="w-3 h-3 text-green-600" />
                                                    <span className="text-green-600 font-bold">Score: {course.score.toFixed(1)}%</span>
                                                </div>
                                                {course.hasCertificate && course.certificateUrl ? (
                                                    <button
                                                        onClick={() => window.open(course.certificateUrl, '_blank')}
                                                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                                                    >
                                                        <Icons.Download className="w-4 h-4" />
                                                        Download Certificate
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => router.push(`/courses/${course._id}/final-assessment`)}
                                                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all hover:shadow-xl"
                                                        title="Take the final assessment to earn your certificate"
                                                    >
                                                        <Icons.BookOpen className="w-4 h-4" />
                                                        Do Assessment
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Published Courses */}
                        {(coursesInProgress.length === 0 && completedCourses.length === 0 && publishedCourses.length > 0) && (
                            <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-100 p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Start Your Learning Journey</h2>
                                        <p className="text-gray-600">Browse available courses and begin learning today</p>
                                    </div>
                                    <button
                                        onClick={() => router.push('/courses')}
                                        className="text-[#021d49] hover:text-blue-700 font-semibold text-sm flex items-center gap-1"
                                    >
                                        View All
                                        <Icons.ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {publishedCourses.slice(0, 6).map((course) => (
                                        <div key={course._id} className="group border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-[#021d49]/30 transition-all transform hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50">
                                            <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-[#021d49] transition-colors">{course.title}</h3>
                                            <p className="text-sm text-gray-600 line-clamp-3 mb-4">{course.description}</p>
                                            <div className="flex items-center justify-between text-xs text-gray-500 mb-5">
                                                <span className="bg-gray-100 px-3 py-1 rounded-full font-semibold">{course.category}</span>
                                                <span className="capitalize font-semibold">{course.level}</span>
                                            </div>
                                            <button
                                                onClick={() => router.push(`/courses/${course._id}`)}
                                                className="w-full bg-gradient-to-r from-[#021d49] to-blue-700 hover:from-[#032e6b] hover:to-blue-800 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg"
                                            >
                                                Enroll Now
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {coursesInProgress.length === 0 && completedCourses.length === 0 && publishedCourses.length === 0 && (
                            <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-100 p-12 text-center">
                                <Icons.BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                                <h3 className="text-3xl font-bold text-gray-900 mb-3">No Courses Yet</h3>
                                <p className="text-gray-600 mb-8 text-lg">Start your learning journey by exploring our courses</p>
                                <button
                                    onClick={() => router.push('/courses')}
                                    className="bg-gradient-to-r from-[#021d49] to-blue-700 hover:from-[#032e6b] hover:to-blue-800 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-3 text-lg"
                                >
                                    <Icons.Search className="w-6 h-6" />
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

export default function StudentDashboardPage() {
    return (
        <ProtectedStudentRoute>
            <StudentDashboardContent />
        </ProtectedStudentRoute>
    );
}
