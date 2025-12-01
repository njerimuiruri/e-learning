"use client";
import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    BookOpen, Users, Clock, Award, ChevronRight, AlertCircle
} from 'lucide-react';
import coursesData from '../../../../data/courses/courses';

const CourseEnrollmentPage = () => {
    const router = useRouter();
    const params = useParams();
    const courseId = parseInt(params.id);

    const course = coursesData.find(c => c.id === courseId);
    const [enrolled, setEnrolled] = useState(false);

    // Safely default bonuses to an empty array to avoid runtime errors
    const bonuses = course?.bonuses ?? [];

    if (!course) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900">Course Not Found</h1>
                </div>
            </div>
        );
    }

    const handleEnroll = () => {
        setEnrolled(true);
        // Navigate to first module first lesson intro page
        setTimeout(() => {
            router.push(`/courses/${courseId}/learn/${course.modules[0].id}/${course.modules[0].lessons[0].id}`);
        }, 500);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
                    <button
                        onClick={() => router.push(`/courses/${courseId}`)}
                        className="text-gray-600 hover:text-gray-900 font-medium"
                    >
                        ← Back
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Hero Section */}
                        <div className="bg-white rounded-lg p-8 border border-gray-200">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h1 className="text-4xl font-bold text-gray-900 mb-2">{course.title}</h1>
                                    <p className="text-lg text-gray-600">{course.description}</p>
                                </div>
                            </div>

                            {/* Instructor Info */}
                            <div className="flex items-center gap-4 py-6 border-t border-gray-200">
                                <img
                                    src={course.instructor.avatar}
                                    alt={course.instructor.name}
                                    className="w-14 h-14 rounded-full border-2 border-gray-100"
                                />
                                <div>
                                    <p className="text-sm text-gray-600">Course Facilitator</p>
                                    <p className="font-semibold text-gray-900">{course.instructor.name}</p>
                                    <p className="text-xs text-gray-600 mt-1">{course.instructor.bio}</p>
                                </div>
                            </div>
                        </div>

                        {/* Course Overview */}
                        <div className="bg-white rounded-lg p-8 border border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Overview</h2>

                            <div className="grid md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Delivery Mode</h3>
                                    <p className="text-gray-700">{course.courseInfo.deliveryMode}</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Programme</h3>
                                    <p className="text-gray-700">{course.courseInfo.program}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">Welcome Message</h3>
                                <p className="text-gray-700 leading-relaxed">{course.courseInfo.welcome}</p>
                            </div>
                        </div>

                        {/* Expected Learning Outcomes */}
                        <div className="bg-white rounded-lg p-8 border border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Expected Learning Outcomes</h2>
                            <ul className="space-y-3">
                                {course.courseInfo.expectedOutcomes.map((outcome, idx) => (
                                    <li key={idx} className="flex gap-3 text-gray-700">
                                        <span className="text-orange-500 font-bold mt-0.5">✓</span>
                                        <span>{outcome}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Course Structure */}
                        <div className="bg-white rounded-lg p-8 border border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Structure</h2>
                            <div className="space-y-4">
                                {course.modules.map((module, idx) => (
                                    <div key={module.id} className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">Module {idx + 1}: {module.title}</h3>
                                                <p className="text-sm text-gray-600 mt-1">{module.lessons.length} lessons</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Enrollment Card */}
                        <div className="bg-white rounded-lg p-6 border border-gray-200 sticky top-4">
                            <div className="space-y-4 mb-6">
                                <div className="flex items-center gap-3 text-sm text-gray-700">
                                    <Clock className="w-4 h-4 text-orange-500" />
                                    <span>{course.duration}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-700">
                                    <BookOpen className="w-4 h-4 text-orange-500" />
                                    <span>{course.modules.length} Modules</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-700">
                                    <Users className="w-4 h-4 text-orange-500" />
                                    <span>{course.students}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-700">
                                    <Award className="w-4 h-4 text-orange-500" />
                                    <span>Certificate Included</span>
                                </div>
                            </div>

                            {!enrolled ? (
                                <button
                                    onClick={handleEnroll}
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition mb-2"
                                >
                                    Enroll & Start Learning
                                </button>
                            ) : (
                                <button
                                    disabled
                                    className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold"
                                >
                                    ✓ Enrolled - Redirecting...
                                </button>
                            )}

                            <button className="w-full text-orange-500 border border-orange-500 py-2 rounded-lg font-semibold hover:bg-orange-50 transition">
                                Save for Later
                            </button>
                        </div>

                        {/* Course Stats */}
                        <div className="bg-white rounded-lg p-6 border border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-4">Course Stats</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Rating</span>
                                    <span className="font-semibold text-gray-900">{course.rating} / 5</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Level</span>
                                    <span className="font-semibold text-gray-900">{course.level}</span>
                                </div>
                            </div>
                        </div>

                        {/* What You'll Get */}
                        {bonuses.length > 0 && (
                            <div className="bg-white rounded-lg p-6 border border-gray-200">
                                <h3 className="font-semibold text-gray-900 mb-4">What's Included</h3>
                                <ul className="space-y-2">
                                    {bonuses.map((bonus, idx) => (
                                        <li key={idx} className="flex gap-2 text-sm text-gray-700">
                                            <span className="text-orange-500">✓</span>
                                            <span>{bonus}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseEnrollmentPage;