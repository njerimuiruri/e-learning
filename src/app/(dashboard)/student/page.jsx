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

            // Separate courses into three categories:
            // 1. In Progress: Still working through modules
            // 2. Pending Assessment: All modules done, haven't taken final assessment
            // 3. Completed: Final assessment taken

            const inProgress = data.enrollments
                ?.filter(enrollment => {
                    // Not completed and either:
                    // - Haven't completed all modules, OR
                    // - Haven't attempted final assessment
                    if (enrollment.isCompleted) return false;
                    const courseData = enrollment.courseId || {};
                    const totalModules = courseData.modules?.length || 0;
                    const completedModules = enrollment.completedModules || 0;
                    // Still working on modules
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

            // Pending Assessment: All modules completed, but hasn't attempted or completed assessment
            const pending = data.enrollments
                ?.filter(enrollment => {
                    if (enrollment.isCompleted) return false; // Not yet fully completed
                    const courseData = enrollment.courseId || {};
                    const totalModules = courseData.modules?.length || 0;
                    const completedModules = enrollment.completedModules || 0;
                    // All modules done, ready for assessment
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

            // Support both shapes: {courses, pagination} or direct array
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
        { label: 'Enrollments', value: dashboardData?.enrollments?.length || '0', icon: 'BookOpen', color: 'text-yellow-600' },
        { label: 'Certificates', value: dashboardData?.certificates?.length || '0', icon: 'Award', color: 'text-blue-600' },
        { label: 'In Progress', value: coursesInProgress?.length || '0', icon: 'Zap', color: 'text-orange-600' },
        { label: 'Ready for Assessment', value: pendingAssessmentCourses?.length || '0', icon: 'Target', color: 'text-purple-600' },
        { label: 'Completed', value: completedCourses?.length || '0', icon: 'CheckCircle', color: 'text-green-600' },
    ];

    if (loading) {
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
                                        <div key={course._id} className="flex flex-col sm:flex-row gap-4 pb-4 last:pb-0 border-b last:border-b-0">
                                            <img
                                                src={course.thumbnailUrl || '/placeholder-course.png'}
                                                alt={course.title}
                                                className="w-full sm:w-36 h-24 sm:h-24 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
                                                onClick={() => router.push(`/courses/${course._id}`)}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h3
                                                    className="font-semibold text-gray-900 mb-2 cursor-pointer hover:text-orange-600 transition-colors text-base"
                                                    onClick={() => router.push(`/courses/${course._id}`)}
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
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-gray-700">{course.progress}% Complete</span>
                                                        {course.finalAssessmentAttempts > 0 && (
                                                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold">
                                                                Final Assessment: {course.finalAssessmentAttempts}/3 attempts
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="text-xs sm:text-sm text-blue-600 font-medium mb-3">
                                                    LAST ACTIVE: {course.lastActive.toUpperCase()}
                                                </div>

                                                <button
                                                    onClick={() => handleContinueLearning(course)}
                                                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium transition-colors text-sm inline-flex items-center justify-center"
                                                >
                                                    Continue Learning
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Pending Assessment Courses */}
                        {pendingAssessmentCourses.length > 0 && (
                            <div className="bg-white rounded-lg border border-purple-200 mb-8">
                                <div className="p-4 sm:p-5 border-b border-purple-200 bg-purple-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Icons.Target className="w-5 h-5 text-purple-600" />
                                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                                                Ready for Final Assessment ({pendingAssessmentCourses.length})
                                            </h2>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">You've completed all modules. Take the final assessment to complete and earn your certificate!</p>
                                </div>

                                <div className="p-4 sm:p-5">
                                    {pendingAssessmentCourses.map((course) => (
                                        <div key={course._id} className="flex flex-col sm:flex-row gap-4 pb-4 last:pb-0 border-b last:border-b-0">
                                            <img
                                                src={course.thumbnailUrl || '/placeholder-course.png'}
                                                alt={course.title}
                                                className="w-full sm:w-36 h-24 sm:h-24 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
                                                onClick={() => router.push(`/courses/${course._id}`)}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h3
                                                    className="font-semibold text-gray-900 mb-2 cursor-pointer hover:text-purple-600 transition-colors text-base"
                                                    onClick={() => router.push(`/courses/${course._id}`)}
                                                >
                                                    {course.title}
                                                </h3>

                                                <div className="mb-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Icons.CheckCircle className="w-4 h-4 text-green-600" />
                                                        <span className="text-sm font-medium text-gray-700">
                                                            All {course.totalModules} modules completed
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-green-500 h-2 rounded-full transition-all"
                                                            style={{ width: '100%' }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                <div className="text-xs sm:text-sm text-purple-600 font-medium mb-3">
                                                    {course.finalAssessmentAttempts > 0 ? (
                                                        <span>Attempts: {course.finalAssessmentAttempts}/3</span>
                                                    ) : (
                                                        <span>📝 Assessment not yet started</span>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => router.push(`/courses/${course._id}/final-assessment`)}
                                                    className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg font-medium transition-colors text-sm inline-flex items-center justify-center gap-2"
                                                >
                                                    <Icons.BookOpen className="w-4 h-4" />
                                                    Take Final Assessment
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
                                            Your Completed Courses ({completedCourses.length}) & Claimed Certificates ({dashboardData?.certificates?.length || 0})
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
                                        <div key={course._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                            <img
                                                src={course.thumbnailUrl || '/placeholder-course.png'}
                                                alt={course.title}
                                                className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => router.push(`/courses/${course._id}`)}
                                            />
                                            <div className="p-3">
                                                <h3 className="font-semibold text-gray-900 mb-2 text-sm line-clamp-2">{course.title}</h3>
                                                <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
                                                    <Icons.Calendar className="w-3 h-3" />
                                                    <span>Completed {course.completedDate}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mb-3 text-xs">
                                                    <Icons.Award className="w-3 h-3 text-green-600" />
                                                    <span className="text-green-600 font-semibold">Score: {course.score.toFixed(1)}%</span>
                                                </div>
                                                {course.hasCertificate && course.certificateUrl ? (
                                                    <button
                                                        onClick={() => window.open(course.certificateUrl, '_blank')}
                                                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                                                    >
                                                        <Icons.Download className="w-4 h-4" />
                                                        Download Certificate
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => router.push(`/courses/${course._id}/final-assessment`)}
                                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
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

                        {/* Show published courses when no enrollments, otherwise keep them available below */}
                        {coursesInProgress.length === 0 && completedCourses.length === 0 ? (
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Published Courses</h2>
                                        <p className="text-sm text-gray-600">Start your learning journey by enrolling in a course</p>
                                    </div>
                                    <button
                                        onClick={() => router.push('/courses')}
                                        className="text-green-600 hover:text-green-700 font-medium text-sm"
                                    >
                                        View All →
                                    </button>
                                </div>
                                {publishedCourses.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Icons.BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Courses Yet</h3>
                                        <p className="text-gray-600 mb-6">Check back soon for new published courses.</p>
                                        <button
                                            onClick={() => router.push('/courses')}
                                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                                        >
                                            Browse Courses
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {publishedCourses.map((course) => {
                                            const enrollment = dashboardData?.enrollments?.find((en) => (en.courseId?._id || en.courseId) === course._id);
                                            const isEnrolled = !!enrollment;

                                            const handlePublishedClick = async () => {
                                                if (!isEnrolled) {
                                                    router.push(`/courses/${course._id}`);
                                                    return;
                                                }
                                                try {
                                                    const fresh = await courseService.getEnrollment(course._id);
                                                    const lastModuleIndex = typeof fresh.lastAccessedModule === 'number' ? fresh.lastAccessedModule : 0;
                                                    const lastLessonIndex = typeof fresh.lastAccessedLesson === 'number' ? fresh.lastAccessedLesson : 0;
                                                    const mod = course.modules?.[lastModuleIndex] || course.modules?.[0];
                                                    const lesson = mod?.lessons?.[lastLessonIndex] || mod?.lessons?.[0];
                                                    const moduleId = mod?._id || lastModuleIndex;
                                                    const lessonId = lesson?._id || lastLessonIndex;
                                                    router.push(`/courses/${course._id}/learn/${moduleId}/${lessonId}`);
                                                } catch (err) {
                                                    console.error('Failed to continue from published list', err);
                                                    router.push(`/courses/${course._id}`);
                                                }
                                            };

                                            return (
                                                <div key={course._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
                                                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                                                    <p className="text-sm text-gray-600 line-clamp-3 mb-3">{course.description}</p>
                                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                                                        <span>{course.category}</span>
                                                        <span className="capitalize">{course.level}</span>
                                                    </div>
                                                    <button
                                                        onClick={handlePublishedClick}
                                                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium text-sm"
                                                    >
                                                        {isEnrolled ? 'Continue Learning' : 'View & Enroll'}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            publishedCourses.length > 0 && (
                                <div className="bg-white rounded-lg border border-gray-200 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Published Courses</h2>
                                        <button
                                            onClick={() => router.push('/courses')}
                                            className="text-green-600 hover:text-green-700 font-medium text-sm"
                                        >
                                            View All →
                                        </button>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {publishedCourses.map((course) => (
                                            <div key={course._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
                                                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                                                <p className="text-sm text-gray-600 line-clamp-3 mb-3">{course.description}</p>
                                                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                                                    <span>{course.category}</span>
                                                    <span className="capitalize">{course.level}</span>
                                                </div>
                                                <button
                                                    onClick={() => router.push(`/courses/${course._id}`)}
                                                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium text-sm"
                                                >
                                                    View & Enroll
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
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


