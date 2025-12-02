'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import coursesData, { getStudentProgress } from '@/data/courses/courses';

export default function CertificatesPage() {
    const router = useRouter();
    const [studentProgress, setStudentProgress] = useState(null);
    const [completedCourses, setCompletedCourses] = useState([]);

    useEffect(() => {
        const progress = getStudentProgress();
        setStudentProgress(progress);

        const completed = progress.enrolledCourses
            .filter(ec => ec.status === 'completed')
            .map(ec => {
                const course = coursesData.find(c => c.id === ec.courseId);
                return {
                    ...course,
                    completedDate: formatDate(ec.lastAccessedDate),
                    hasCertificate: ec.certificateEarned,
                };
            });
        setCompletedCourses(completed);
    }, []);

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (!studentProgress) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading certificates...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white py-12 px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <Icons.Award className="w-10 h-10" />
                        <h1 className="text-4xl font-black">Your Certificates</h1>
                    </div>
                    <p className="text-orange-100 text-lg">View and claim your course completion certificates</p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-6">
                        <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30">
                            <div className="flex items-center gap-2">
                                <Icons.Award className="w-6 h-6" />
                                <div>
                                    <p className="text-xs opacity-90">Total Certificates</p>
                                    <p className="text-2xl font-bold">{studentProgress.totalCertificates}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30">
                            <div className="flex items-center gap-2">
                                <Icons.CheckCircle className="w-6 h-6" />
                                <div>
                                    <p className="text-xs opacity-90">Completed Courses</p>
                                    <p className="text-2xl font-bold">{studentProgress.totalCoursesCompleted}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-8 py-12">
                {completedCourses.length > 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900">
                                Completed Courses ({completedCourses.length})
                            </h2>
                            <p className="text-gray-600 mt-1">Claim your certificates below</p>
                        </div>

                        <div className="p-6">
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {completedCourses.map((course) => (
                                    <div key={course.id} className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-orange-300 hover:shadow-lg transition-all">
                                        <div className="relative">
                                            <img
                                                src={course.image}
                                                alt={course.title}
                                                className="w-full h-40 object-cover cursor-pointer"
                                                onClick={() => router.push(`/courses/${course.id}`)}
                                            />
                                            {course.hasCertificate && (
                                                <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                    <Icons.CheckCircle className="w-3 h-3" />
                                                    Completed
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                                            <p className="text-sm text-gray-600 mb-4">Completed: {course.completedDate}</p>

                                            <div className="space-y-2">
                                                <button className="w-full text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center justify-center gap-1 py-2">
                                                    <Icons.ThumbsUp className="w-4 h-4" />
                                                    Rate This Course
                                                </button>

                                                {course.hasCertificate ? (
                                                    <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 rounded-lg font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                                                        <Icons.Download className="w-4 h-4" />
                                                        Claim Certificate
                                                    </button>
                                                ) : (
                                                    <button
                                                        disabled
                                                        className="w-full bg-gray-200 text-gray-500 py-3 rounded-lg font-bold cursor-not-allowed"
                                                    >
                                                        Certificate Unavailable
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                        <Icons.Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Certificates Yet</h3>
                        <p className="text-gray-600 mb-6">Complete courses to earn certificates and showcase your achievements</p>
                        <button
                            onClick={() => router.push('/courses')}
                            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-lg"
                        >
                            Browse Courses
                        </button>
                    </div>
                )}

                {/* Certificate Benefits */}
                <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Why Certificates Matter</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="flex items-start gap-3">
                            <div className="bg-blue-500 p-2 rounded-lg">
                                <Icons.Briefcase className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">Career Boost</h4>
                                <p className="text-sm text-gray-600">Add certificates to your resume and LinkedIn profile</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-green-500 p-2 rounded-lg">
                                <Icons.TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">Skill Validation</h4>
                                <p className="text-sm text-gray-600">Prove your expertise to employers and clients</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-purple-500 p-2 rounded-lg">
                                <Icons.Star className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">Recognition</h4>
                                <p className="text-sm text-gray-600">Showcase your learning achievements publicly</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}