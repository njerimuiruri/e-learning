"use client";
import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    BookOpen, Users, Clock, Award, ChevronRight, AlertCircle, Star, CheckCircle,
    Sparkles, Lock, Unlock, Video, FileText, Trophy, Target, Zap
} from 'lucide-react';
import coursesData from '../../../../data/courses/courses';
import Navbar from '../../../../components/navbar/navbar';
import Footer from '../../../../components/Footer/Footer';
import { useToast } from '@/components/ui/ToastProvider';

const CourseEnrollmentPage = () => {
    const router = useRouter();
    const params = useParams();
    const courseId = parseInt(params.id);
    const { showToast } = useToast();

    const course = coursesData.find(c => c.id === courseId);
    const [enrolled, setEnrolled] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    if (!course) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900">Course Not Found</h1>
                </div>
            </div>
        );
    }

    const handleEnroll = () => {
        if (!agreedToTerms) {
            showToast('Please agree to the terms and conditions to enroll', { type: 'warning', title: 'Action needed' });
            return;
        }
        setEnrolled(true);
        setTimeout(() => {
            router.push(`/courses/${courseId}/learn/${course.modules[0].id}/${course.modules[0].lessons[0].id}`);
        }, 1000);
    };

    const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;

    return (

        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
                {/* Compact Header */}
                <div className="bg-white border-b border-gray-100 shadow-sm">
                    <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                        <button
                            onClick={() => router.push(`/courses/${courseId}`)}
                            className="flex items-center gap-2 text-gray-600 hover:text-orange-600 font-medium transition-colors"
                        >
                            <ChevronRight className="w-4 h-4 rotate-180" />
                            Back to Course Details
                        </button>
                        <div className="flex items-center gap-2 text-sm">
                            <Sparkles className="w-4 h-4 text-orange-500" />
                            <span className="text-gray-600 font-medium">Free Enrollment</span>
                        </div>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-4 py-8 lg:py-12">
                    {/* Progress Steps */}
                    <div className="mb-8">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-[#021d49] text-white flex items-center justify-center text-sm font-bold">
                                    ✓
                                </div>
                                <div className="w-20 h-1 bg-[#021d49]"></div>
                            </div>
                            <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-[#021d49] text-white flex items-center justify-center text-sm font-bold">
                                    2
                                </div>
                                <div className="w-20 h-1 bg-gray-200"></div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-sm font-bold">
                                3
                            </div>
                        </div>
                        <div className="flex justify-center gap-16 text-xs text-gray-600">
                            <span>Select Course</span>
                            <span className="font-semibold text-orange-600">Review & Enroll</span>
                            <span>Start Learning</span>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-5 gap-8">
                        {/* Main Enrollment Section - 3 columns */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Course Summary Card */}
                            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                                <div className="flex items-start gap-6 mb-6 pb-6 border-b border-gray-100">
                                    <img
                                        src={course.bannerImage}
                                        alt={course.title}
                                        className="w-32 h-32 rounded-xl object-cover shadow-md"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
                                                {course.level}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 fill-orange-500 text-orange-500" />
                                                <span className="text-sm font-bold text-gray-900">{course.rating}</span>
                                            </div>
                                        </div>
                                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
                                        <p className="text-sm text-gray-600">by {course.instructor.name}</p>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                                        <BookOpen className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                                        <div className="text-lg font-bold text-gray-900">{course.modules.length}</div>
                                        <div className="text-xs text-gray-600">Modules</div>
                                    </div>
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <Video className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                                        <div className="text-lg font-bold text-gray-900">{totalLessons}</div>
                                        <div className="text-xs text-gray-600">Lessons</div>
                                    </div>
                                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                                        <Clock className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                                        <div className="text-lg font-bold text-gray-900">{course.duration}</div>
                                        <div className="text-xs text-gray-600">Duration</div>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <Award className="w-5 h-5 text-green-500 mx-auto mb-1" />
                                        <div className="text-lg font-bold text-gray-900">Free</div>
                                        <div className="text-xs text-gray-600">Certificate</div>
                                    </div>
                                </div>
                            </div>

                            {/* What You'll Get */}
                            <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-8 shadow-lg border border-orange-100">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Trophy className="w-6 h-6 text-orange-500" />
                                    What's Included in Your Enrollment
                                </h2>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3 bg-white rounded-lg p-4 border border-orange-100">
                                        <div className="bg-orange-100 rounded-full p-2">
                                            <Video className="w-4 h-4 text-orange-600" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900 text-sm">{course.duration} of Content</div>
                                            <div className="text-xs text-gray-600">On-demand video lessons</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 bg-white rounded-lg p-4 border border-orange-100">
                                        <div className="bg-blue-100 rounded-full p-2">
                                            <FileText className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900 text-sm">Downloadable Resources</div>
                                            <div className="text-xs text-gray-600">PDFs, guides, and materials</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 bg-white rounded-lg p-4 border border-orange-100">
                                        <div className="bg-green-100 rounded-full p-2">
                                            <Award className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900 text-sm">Certificate of Completion</div>
                                            <div className="text-xs text-gray-600">Shareable credential</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 bg-white rounded-lg p-4 border border-orange-100">
                                        <div className="bg-purple-100 rounded-full p-2">
                                            <Unlock className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900 text-sm">Lifetime Access</div>
                                            <div className="text-xs text-gray-600">Learn at your own pace</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Learning Path Preview */}
                            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Target className="w-6 h-6 text-orange-500" />
                                    Your Learning Journey
                                </h2>
                                <div className="space-y-3">
                                    {course.modules.slice(0, 3).map((module, idx) => (
                                        <div key={module.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold flex-shrink-0">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 text-sm">{module.title}</h3>
                                                <p className="text-xs text-gray-600">{module.lessons.length} lessons</p>
                                            </div>
                                            <Lock className="w-5 h-5 text-gray-300" />
                                        </div>
                                    ))}
                                    {course.modules.length > 3 && (
                                        <div className="text-center py-2 text-sm text-gray-600">
                                            + {course.modules.length - 3} more modules
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Terms Agreement */}
                            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={agreedToTerms}
                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                        className="mt-1 w-5 h-5 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                                    />
                                    <div className="text-sm text-gray-700">
                                        <span className="font-semibold text-gray-900">I agree to the terms and conditions</span>
                                        <p className="mt-1 text-xs text-gray-600">
                                            By enrolling, you agree to our course policies, honor code, and commitment to respectful learning.
                                            You'll receive course updates and important notifications via email.
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Sidebar - 2 columns */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Enrollment Action Card - Sticky */}
                            <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-orange-200 sticky top-4">
                                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-center py-3 -mx-6 -mt-6 rounded-t-2xl mb-6">
                                    <Sparkles className="w-5 h-5 inline mr-2" />
                                    <span className="font-bold">Ready to Start Learning?</span>
                                </div>

                                <div className="text-center mb-6">
                                    <div className="text-5xl font-bold text-green-600 mb-2">FREE</div>
                                    <p className="text-sm text-gray-600">No payment required • Instant access</p>
                                </div>

                                {!enrolled ? (
                                    <>
                                        <button
                                            onClick={handleEnroll}
                                            disabled={!agreedToTerms}
                                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg mb-4 flex items-center justify-center gap-2 ${agreedToTerms
                                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white hover:shadow-xl transform hover:-translate-y-0.5'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                }`}
                                        >
                                            <Zap className="w-5 h-5" />
                                            Confirm Enrollment
                                        </button>

                                        {!agreedToTerms && (
                                            <p className="text-xs text-center text-gray-500 mb-4">
                                                Please accept terms to continue
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <button
                                        disabled
                                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl font-bold shadow-lg mb-4"
                                    >
                                        <CheckCircle className="w-5 h-5 inline mr-2" />
                                        Enrolled! Redirecting...
                                    </button>
                                )}

                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                                    <div className="flex items-start gap-2 mb-2">
                                        <CheckCircle className="w-4 h-4 text-orange-600 mt-0.5" />
                                        <span className="text-sm font-semibold text-gray-900">Instant Access</span>
                                    </div>
                                    <p className="text-xs text-gray-600 ml-6">
                                        Start learning immediately after enrollment
                                    </p>
                                </div>
                            </div>

                            {/* Why Enroll Card */}
                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 shadow-lg border border-blue-200">
                                <h3 className="font-bold text-gray-900 mb-4 text-lg">Why Students Love This Course</h3>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-blue-500 rounded-full p-1">
                                            <CheckCircle className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-sm text-gray-700">Practical, hands-on learning experience</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="bg-blue-500 rounded-full p-1">
                                            <CheckCircle className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-sm text-gray-700">Learn at your own pace, anytime</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="bg-blue-500 rounded-full p-1">
                                            <CheckCircle className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-sm text-gray-700">Expert instruction from industry professionals</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="bg-blue-500 rounded-full p-1">
                                            <CheckCircle className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-sm text-gray-700">Join {course.students} active learners</span>
                                    </div>
                                </div>
                            </div>

                            {/* Trust Indicators */}
                            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                        <Users className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900">{course.students}</div>
                                        <div className="text-xs text-gray-600">Students enrolled</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <Star className="w-6 h-6 text-yellow-600 fill-yellow-600" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900">{course.rating}/5 Rating</div>
                                        <div className="text-xs text-gray-600">Highly rated by students</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                        <Trophy className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900">{course.level}</div>
                                        <div className="text-xs text-gray-600">Difficulty level</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>

    );
};

export default CourseEnrollmentPage;