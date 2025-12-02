"use client";
import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Clock, Users, Star, CheckCircle, Award, BookOpen,
    TrendingUp, Play, ChevronDown, ChevronUp, ArrowLeft,
    Download, Share2, Heart, Sparkles, ArrowRight, Globe,
    FileText, Video, Headphones, Zap, Trophy, Target,
    Laptop, MessageCircle, PlayCircle
} from 'lucide-react';

import coursesData from '../../../data/courses/courses';
import Navbar from '../../../components/navbar/navbar';
import Footer from '../../../components/Footer/Footer';
const CourseDetailPage = () => {
    const router = useRouter();
    const params = useParams();
    const courseId = parseInt(params.id);

    const [expandedModule, setExpandedModule] = useState(1);
    const [activeTab, setActiveTab] = useState("overview");

    const course = coursesData.find((c) => c.id === courseId);
    const otherCourses = coursesData.filter((c) => c.id !== courseId).slice(0, 3);

    if (!course) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-8">
                <div className="text-center bg-white p-12 rounded-2xl shadow-xl">
                    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <BookOpen className="w-10 h-10 text-[#f65e14]" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Course Not Found
                    </h1>
                    <p className="text-lg text-gray-600 mb-8">
                        The course you're looking for doesn't exist.
                    </p>
                    <button
                        onClick={() => router.push("/courses")}
                        className="bg-[#f65e14] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#e54d03] transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                        Browse All Courses
                    </button>
                </div>
            </div>
        );
    }

    const toggleModule = (moduleId) => {
        setExpandedModule(expandedModule === moduleId ? null : moduleId);
    };

    const handleEnrollClick = () => {
        router.push(`/courses/${courseId}/enroll`);
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-blue-50">
                {/* Hero Section - Enhanced E-Learning Layout */}
                <section className="bg-gradient-to-r from-[#f65e14] to-[#ff8243] text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 text-sm text-orange-100 mb-8">
                            <button
                                onClick={() => router.push("/courses")}
                                className="flex items-center gap-1 hover:text-white transition-colors font-medium"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                All Courses
                            </button>
                            <span>/</span>
                            <span className="text-white font-semibold truncate">
                                {course.title}
                            </span>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-8 pb-8">
                            {/* Left: Course Info */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Badge */}
                                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold border border-white/30">
                                    <Sparkles className="w-4 h-4" />
                                    {course.badge}
                                </div>

                                {/* Title */}
                                <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
                                    {course.title}
                                </h1>

                                {/* Description */}
                                <p className="text-lg text-orange-50 leading-relaxed">
                                    {course.description}
                                </p>

                                {/* Stats Bar */}
                                <div className="flex flex-wrap items-center gap-6 py-4">
                                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                                        <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
                                        <span className="font-bold text-white">{course.rating}</span>
                                        <span className="text-orange-100 text-sm">rating</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                                        <Users className="w-5 h-5 text-orange-100" />
                                        <span className="font-bold text-white">
                                            {course.students}
                                        </span>
                                        <span className="text-orange-100 text-sm">students</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                                        <Clock className="w-5 h-5 text-orange-100" />
                                        <span className="font-semibold text-white">
                                            {course.duration}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                                        <TrendingUp className="w-5 h-5 text-orange-100" />
                                        <span className="font-semibold text-white">
                                            {course.level}
                                        </span>
                                    </div>
                                </div>

                                {/* Instructor */}
                                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                                    <img
                                        src={course.instructor.avatar}
                                        alt={course.instructor.name}
                                        className="w-16 h-16 rounded-full border-3 border-white shadow-lg"
                                    />
                                    <div>
                                        <p className="text-sm text-orange-100">Course Instructor</p>
                                        <p className="text-xl font-bold text-white">
                                            {course.instructor.name}
                                        </p>
                                        <p className="text-sm text-orange-100">Expert Educator</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Enrollment Card */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-2xl p-6 shadow-2xl sticky top-8">
                                    {/* Course Preview Image */}
                                    <div className="relative rounded-xl overflow-hidden mb-6 group cursor-pointer shadow-lg">
                                        <img
                                            src={course.bannerImage}
                                            alt={course.title}
                                            className="w-full h-48 object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-center justify-center group-hover:from-black/70 transition-all duration-300">
                                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                                                <Play className="w-7 h-7 text-[#f65e14] ml-1" />
                                            </div>
                                        </div>
                                        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold">
                                            Preview
                                        </div>
                                    </div>

                                    {/* Free Badge */}
                                    <div className="text-center mb-6 bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                                        <p className="text-4xl font-bold text-green-600 mb-1">FREE</p>
                                        <p className="text-sm text-green-700 font-medium">
                                            Full lifetime access • No credit card required
                                        </p>
                                    </div>

                                    {/* Enroll Button */}
                                    <button
                                        onClick={handleEnrollClick}
                                        className="w-full bg-gradient-to-r from-[#f65e14] to-[#ff8243] hover:from-[#e54d03] hover:to-[#f65e14] text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 mb-4"
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            <Zap className="w-5 h-5" />
                                            Enroll Now - Start Learning
                                        </span>
                                    </button>

                                    {/* What's Included */}
                                    <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                                        <p className="text-sm font-bold text-gray-900 mb-3">
                                            This course includes:
                                        </p>
                                        <div className="space-y-2 text-sm text-gray-700">
                                            <div className="flex items-center gap-2">
                                                <Video className="w-4 h-4 text-[#f65e14]" />
                                                <span>{course.duration} video content</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="w-4 h-4 text-[#f65e14]" />
                                                <span>
                                                    {course.modules?.length || 0} comprehensive modules
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Download className="w-4 h-4 text-[#f65e14]" />
                                                <span>Downloadable resources</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Award className="w-4 h-4 text-[#f65e14]" />
                                                <span>Certificate of completion</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Laptop className="w-4 h-4 text-[#f65e14]" />
                                                <span>Access on mobile and desktop</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button className="flex items-center justify-center gap-2 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-[#f65e14] hover:text-[#f65e14] transition-all duration-300 font-medium">
                                            <Heart className="w-4 h-4" />
                                            <span className="text-sm">Save</span>
                                        </button>
                                        <button className="flex items-center justify-center gap-2 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-[#f65e14] hover:text-[#f65e14] transition-all duration-300 font-medium">
                                            <Share2 className="w-4 h-4" />
                                            <span className="text-sm">Share</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tab Navigation */}
                <section className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex gap-8 overflow-x-auto">
                            <button
                                onClick={() => setActiveTab("overview")}
                                className={`py-4 px-2 font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === "overview"
                                    ? "border-[#f65e14] text-[#f65e14]"
                                    : "border-transparent text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab("curriculum")}
                                className={`py-4 px-2 font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === "curriculum"
                                    ? "border-[#f65e14] text-[#f65e14]"
                                    : "border-transparent text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                Curriculum
                            </button>
                            <button
                                onClick={() => setActiveTab("instructor")}
                                className={`py-4 px-2 font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === "instructor"
                                    ? "border-[#f65e14] text-[#f65e14]"
                                    : "border-transparent text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                Instructor
                            </button>
                            <button
                                onClick={() => setActiveTab("reviews")}
                                className={`py-4 px-2 font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === "reviews"
                                    ? "border-[#f65e14] text-[#f65e14]"
                                    : "border-transparent text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                Reviews
                            </button>
                        </div>
                    </div>
                </section>

                {/* Main Content Area */}
                <section className="py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* Left: Main Content */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Overview Tab */}
                                {activeTab === "overview" && (
                                    <>
                                        {/* What You'll Learn */}
                                        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                                    <Target className="w-6 h-6 text-[#f65e14]" />
                                                </div>
                                                <h2 className="text-2xl font-bold text-gray-900">
                                                    What You'll Learn
                                                </h2>
                                            </div>
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                {course.bonuses &&
                                                    course.bonuses.map((bonus, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100"
                                                        >
                                                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                            <span className="text-gray-800 text-sm font-medium">
                                                                {bonus}
                                                            </span>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>

                                        {/* About This Course */}
                                        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <BookOpen className="w-6 h-6 text-blue-600" />
                                                </div>
                                                <h2 className="text-2xl font-bold text-gray-900">
                                                    About This Course
                                                </h2>
                                            </div>
                                            <div className="prose prose-gray max-w-none">
                                                <p className="text-gray-700 leading-relaxed text-base">
                                                    {course.description}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Curriculum Tab */}
                                {activeTab === "curriculum" && (
                                    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                                    Course Curriculum
                                                </h2>
                                                <p className="text-gray-600">
                                                    {course.modules?.length || 0} modules •{" "}
                                                    {course.modules?.reduce(
                                                        (acc, m) => acc + (m.lessons?.length || 0),
                                                        0
                                                    ) || 0}{" "}
                                                    lessons
                                                </p>
                                            </div>
                                            <button className="text-[#f65e14] font-semibold text-sm hover:text-[#e54d03] transition-colors">
                                                Expand All
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            {course.modules &&
                                                course.modules.map((module, index) => (
                                                    <div
                                                        key={module.id}
                                                        className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-[#f65e14] transition-all duration-300"
                                                    >
                                                        {/* Module Header */}
                                                        <button
                                                            onClick={() => toggleModule(module.id)}
                                                            className="w-full bg-gradient-to-r from-gray-50 to-gray-100 hover:from-orange-50 hover:to-orange-100 px-6 py-5 flex items-center justify-between transition-all duration-300 text-left"
                                                        >
                                                            <div className="flex-1 pr-4">
                                                                <div className="flex items-center gap-3 mb-3">
                                                                    <span className="bg-[#f65e14] text-white text-sm font-bold px-3 py-1 rounded-full">
                                                                        Module {index + 1}
                                                                    </span>
                                                                    <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-semibold">
                                                                        {module.lessons?.length || 0} lessons
                                                                    </span>
                                                                </div>
                                                                <h3 className="font-bold text-gray-900 text-lg mb-2">
                                                                    {module.title}
                                                                </h3>
                                                                <p className="text-sm text-gray-600">
                                                                    {module.description}
                                                                </p>
                                                            </div>
                                                            {expandedModule === module.id ? (
                                                                <ChevronUp className="w-6 h-6 text-[#f65e14] flex-shrink-0" />
                                                            ) : (
                                                                <ChevronDown className="w-6 h-6 text-gray-400 flex-shrink-0" />
                                                            )}
                                                        </button>

                                                        {/* Module Content */}
                                                        {expandedModule === module.id && (
                                                            <div className="bg-white border-t-2 border-gray-200">
                                                                {module.lessons && module.lessons.length > 0 ? (
                                                                    <div className="divide-y divide-gray-100">
                                                                        {module.lessons.map((lesson, lessonIndex) => (
                                                                            <div
                                                                                key={lesson.id}
                                                                                className="p-5 hover:bg-orange-50 transition-all duration-200 group"
                                                                            >
                                                                                <div className="flex gap-4">
                                                                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 text-[#f65e14] flex items-center justify-center text-sm font-bold shadow-sm group-hover:shadow-md transition-shadow">
                                                                                        {lessonIndex + 1}
                                                                                    </div>
                                                                                    <div className="flex-1">
                                                                                        <div className="flex items-start justify-between mb-2">
                                                                                            <h4 className="font-semibold text-gray-900 group-hover:text-[#f65e14] transition-colors">
                                                                                                {lesson.title}
                                                                                            </h4>
                                                                                            <PlayCircle className="w-5 h-5 text-gray-400 group-hover:text-[#f65e14] transition-colors" />
                                                                                        </div>
                                                                                        <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                                                                                            <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                                                                                                <Video className="w-3 h-3" />
                                                                                                {lesson.duration}
                                                                                            </div>
                                                                                            {lesson.questions &&
                                                                                                lesson.questions.length > 0 && (
                                                                                                    <div className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded text-blue-700">
                                                                                                        <BookOpen className="w-3 h-3" />
                                                                                                        {lesson.questions.length}{" "}
                                                                                                        questions
                                                                                                    </div>
                                                                                                )}
                                                                                        </div>
                                                                                        {lesson.topics && (
                                                                                            <div className="flex flex-wrap gap-2">
                                                                                                {lesson.topics.map(
                                                                                                    (topic, idx) => (
                                                                                                        <span
                                                                                                            key={idx}
                                                                                                            className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md font-medium"
                                                                                                        >
                                                                                                            {topic}
                                                                                                        </span>
                                                                                                    )
                                                                                                )}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}

                                                                        {/* Assessment */}
                                                                        {module.assessment && (
                                                                            <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-t-2 border-green-200">
                                                                                <div className="flex gap-4">
                                                                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center shadow-md">
                                                                                        <Award className="w-5 h-5" />
                                                                                    </div>
                                                                                    <div className="flex-1">
                                                                                        <h4 className="font-bold text-gray-900 mb-2 text-lg">
                                                                                            {module.assessment.title}
                                                                                        </h4>
                                                                                        <p className="text-sm text-gray-700 mb-3">
                                                                                            Test your knowledge with{" "}
                                                                                            {module.assessment.questions
                                                                                                ?.length || 0}{" "}
                                                                                            questions
                                                                                        </p>
                                                                                        <div className="flex items-center gap-2 text-sm">
                                                                                            <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full font-semibold">
                                                                                                Pass at{" "}
                                                                                                {module.assessment.passingScore}%
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <p className="p-5 text-gray-600 text-sm text-center">
                                                                        No lessons available
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* Instructor Tab */}
                                {activeTab === "instructor" && (
                                    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                                        <div className="flex items-center gap-6 mb-8">
                                            <img
                                                src={course.instructor.avatar}
                                                alt={course.instructor.name}
                                                className="w-24 h-24 rounded-full border-4 border-orange-200 shadow-lg"
                                            />
                                            <div>
                                                <h2 className="text-3xl font-bold text-gray-900 mb-1">
                                                    {course.instructor.name}
                                                </h2>
                                                <p className="text-gray-600 mb-3">
                                                    Expert Instructor & Course Creator
                                                </p>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <div className="flex items-center gap-1">
                                                        <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
                                                        <span className="font-semibold">
                                                            4.9 Instructor Rating
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Users className="w-4 h-4 text-gray-400" />
                                                        <span className="font-semibold">
                                                            45,000+ Students
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="prose prose-gray max-w-none">
                                            <p className="text-gray-700 leading-relaxed">
                                                A passionate educator with over 10 years of experience in
                                                teaching and course creation. Dedicated to helping
                                                students achieve their learning goals through practical,
                                                hands-on instruction.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Reviews Tab */}
                                {activeTab === "reviews" && (
                                    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                            Student Reviews
                                        </h2>
                                        <div className="text-center py-12">
                                            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-600">
                                                Reviews will be available soon
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right: Sidebar */}
                            <div className="lg:col-span-1 space-y-6">
                                {/* Features Card */}
                                <div className="bg-gradient-to-br from-orange-50 to-blue-50 rounded-2xl p-6 shadow-lg border border-orange-100">
                                    <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-[#f65e14]" />
                                        Course Features
                                    </h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center gap-3 bg-white p-3 rounded-lg">
                                            <Trophy className="w-5 h-5 text-yellow-500" />
                                            <span className="text-gray-700 font-medium">
                                                Certificate of Completion
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white p-3 rounded-lg">
                                            <Laptop className="w-5 h-5 text-blue-500" />
                                            <span className="text-gray-700 font-medium">
                                                Access on all devices
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white p-3 rounded-lg">
                                            <Clock className="w-5 h-5 text-purple-500" />
                                            <span className="text-gray-700 font-medium">
                                                Learn at your own pace
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white p-3 rounded-lg">
                                            <Download className="w-5 h-5 text-green-500" />
                                            <span className="text-gray-700 font-medium">
                                                Downloadable resources
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Requirements */}
                                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-[#f65e14]" />
                                        Requirements
                                    </h3>
                                    <ul className="space-y-2 text-sm text-gray-700">
                                        <li className="flex items-start gap-2">
                                            <span className="text-gray-400">•</span>
                                            <span>Basic computer skills</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-gray-400">•</span>
                                            <span>Internet connection</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-gray-400">•</span>
                                            <span>Willingness to learn</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* Target Audience */}
                                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                                    <h3 className="font-bold text-gray-900 mb-4">
                                        Who This Course Is For
                                    </h3>
                                    <ul className="space-y-3 text-sm text-gray-700">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            <span>Beginners starting their journey</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            <span>Professionals looking to upskill</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            <span>Anyone interested in the subject</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Related Courses */}
                {otherCourses.length > 0 && (
                    <section className="py-16 bg-white border-t border-gray-200">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="mb-10">
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                    More Courses You Might Like
                                </h2>
                                <p className="text-gray-600">
                                    Continue your learning journey with these related courses
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {otherCourses.map((otherCourse) => (
                                    <div
                                        key={otherCourse.id}
                                        className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:shadow-2xl hover:border-[#f65e14] transition-all duration-300 cursor-pointer group"
                                        onClick={() => router.push(`/courses/${otherCourse.id}`)}
                                    >
                                        <div className="relative h-48 overflow-hidden">
                                            <img
                                                src={otherCourse.bannerImage || otherCourse.image}
                                                alt={otherCourse.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-full text-xs font-bold text-gray-900 shadow-lg">
                                                {otherCourse.badge}
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        </div>

                                        <div className="p-6">
                                            <h3 className="font-bold text-gray-900 text-lg mb-3 line-clamp-2 group-hover:text-[#f65e14] transition-colors">
                                                {otherCourse.title}
                                            </h3>

                                            <div className="flex items-center gap-4 text-xs text-gray-600 mb-4">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {otherCourse.duration}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
                                                    {otherCourse.rating}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-4 h-4" />
                                                    {otherCourse.students}
                                                </div>
                                            </div>

                                            <button className="w-full bg-gradient-to-r from-gray-100 to-gray-200 group-hover:from-[#f65e14] group-hover:to-[#ff8243] group-hover:text-white text-gray-900 py-3 rounded-lg font-bold transition-all duration-300 text-sm shadow-sm group-hover:shadow-lg">
                                                View Course
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </div>
            <Footer />
        </>

    );
};

export default CourseDetailPage;