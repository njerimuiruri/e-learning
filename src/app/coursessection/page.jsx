"use client";
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Clock, Users, Star, ArrowRight, Layers, BookOpen, TrendingUp, Award } from 'lucide-react';
import courseService from '@/lib/api/courseService';
import categoryService from '@/lib/api/categoryService';

const placeholderGradient = 'bg-gradient-to-br from-orange-100 via-white to-blue-50';

const CoursesSection = () => {
    const [activeCategory, setActiveCategory] = useState('All');
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dynamicCategories, setDynamicCategories] = useState([]);

    useEffect(() => {
        let mounted = true;
        const fetchData = async () => {
            try {
                setLoading(true);
                const [coursesData, categoriesData] = await Promise.all([
                    courseService.getAllCourses({ status: 'published' }),
                    categoryService.getAllCategories()
                ]);

                if (mounted) {
                    setCourses(Array.isArray(coursesData) ? coursesData : coursesData?.courses || []);
                    setDynamicCategories(Array.isArray(categoriesData) ? categoriesData : []);
                }
            } catch (err) {
                console.error('Failed to load data', err);
                if (mounted) setError('Unable to load courses right now.');
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchData();
        return () => {
            mounted = false;
        };
    }, []);

    const categories = useMemo(() => {
        if (dynamicCategories.length > 0) {
            return ['All', ...dynamicCategories.map(cat => cat.name)];
        }
        const unique = new Set(courses.map((c) => c.category).filter(Boolean));
        return ['All', ...Array.from(unique)];
    }, [dynamicCategories, courses]);

    const filteredCourses = useMemo(() => {
        if (activeCategory === 'All') return courses;
        return courses.filter((course) => course.category === activeCategory);
    }, [courses, activeCategory]);

    const getTotalQuestions = (modules = []) =>
        modules.reduce((sum, mod) => sum + (mod.questions?.length || 0), 0);

    return (
        <section className="relative py-20 lg:py-32 bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-hidden">
            {/* Enhanced Background Pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Animated gradient orbs */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-orange-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                
                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:64px_64px]"></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header with Badge */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                        <Award className="w-4 h-4" />
                        <span>PREMIUM LEARNING EXPERIENCE</span>
                    </div>
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
                        Explore Our Research
                        <span className="block mt-2 bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                            Programs
                        </span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Master the art of research with our expert-led courses designed to elevate your academic journey
                    </p>
                </div>

                {/* Enhanced Category Filter */}
                <div className="flex flex-wrap justify-center gap-3 mb-16">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`group relative px-8 py-3.5 rounded-full font-semibold transition-all duration-300 ${
                                activeCategory === category
                                    ? 'bg-gradient-to-r from-[#021d49] to-[#03275f] text-white shadow-xl shadow-blue-900/30 scale-105'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-orange-300 hover:scale-105'
                            }`}
                        >
                            {activeCategory === category && (
                                <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse"></div>
                            )}
                            <span className="relative">{category}</span>
                        </button>
                    ))}
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                            <BookOpen className="w-6 h-6 text-orange-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="text-center bg-red-50 border border-red-200 rounded-2xl p-8">
                        <div className="text-red-600 font-semibold text-lg">{error}</div>
                    </div>
                )}

                {/* Enhanced Courses Grid */}
                {!loading && !error && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                        {filteredCourses.map((course) => {
                            const rating = course.instructorId?.avgRating ?? course.avgRating ?? 0;
                            const modules = course.modules || [];
                            const totalQuestions = getTotalQuestions(modules);
                            const enrollmentCount = course.enrollmentCount ?? 0;
                            const instructorName = course.instructorId
                                ? `${course.instructorId.firstName || ''} ${course.instructorId.lastName || ''}`.trim()
                                : 'Unknown Instructor';
                            const category = course.category || 'General';
                            
                            return (
                                <div
                                    key={course._id}
                                    className="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-orange-300 hover:-translate-y-2"
                                >
                                    {/* Hover glow effect */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 via-pink-500/0 to-blue-500/0 group-hover:from-orange-500/5 group-hover:via-pink-500/5 group-hover:to-blue-500/5 transition-all duration-500 pointer-events-none"></div>
                                    
                                    {/* Course Image */}
                                    <div className="relative overflow-hidden h-56">
                                        {/* Category Badge */}
                                        <div className="absolute top-4 left-4 bg-gradient-to-r from-[#021d49] to-[#03275f] text-white px-4 py-2 rounded-full text-xs font-bold z-10 shadow-lg backdrop-blur-sm">
                                            {category}
                                        </div>
                                        
                                        {/* Trending Badge for popular courses */}
                                        {enrollmentCount > 100 && (
                                            <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-3 py-1.5 rounded-full text-xs font-bold z-10 shadow-lg flex items-center gap-1">
                                                <TrendingUp className="w-3 h-3" />
                                                Popular
                                            </div>
                                        )}
                                        
                                        {course.thumbnailUrl ? (
                                            <img
                                                src={course.thumbnailUrl}
                                                alt={course.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className={`w-full h-full ${placeholderGradient} flex items-center justify-center`}>
                                                <BookOpen className="w-16 h-16 text-gray-400" />
                                            </div>
                                        )}
                                        
                                        {/* Overlay gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    </div>

                                    {/* Course Content */}
                                    <div className="relative p-6 space-y-4">
                                        {/* Title */}
                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#021d49] transition-colors line-clamp-2 min-h-[3.5rem]">
                                            {course.title}
                                        </h3>

                                        {/* Meta Info */}
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-1.5 text-gray-600">
                                                <Layers className="w-4 h-4 text-orange-500" />
                                                <span className="font-medium">{modules.length} modules</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-gray-600">
                                                <Users className="w-4 h-4 text-blue-500" />
                                                <span className="font-medium">{enrollmentCount.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {/* Rating */}
                                        <div className="flex items-center gap-3 py-3 px-4 bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl">
                                            <div className="flex">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-4 h-4 ${
                                                            i < Math.floor(rating)
                                                                ? 'fill-orange-500 text-orange-500'
                                                                : 'text-gray-300'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-sm font-bold text-gray-900">
                                                {rating.toFixed(1)}
                                            </span>
                                            <span className="text-xs text-gray-500">rating</span>
                                        </div>

                                        {/* Instructor */}
                                        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 text-white font-bold flex items-center justify-center text-lg shadow-md">
                                                {instructorName?.[0] || '?'}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-500 font-medium">Instructor</p>
                                                <p className="text-sm font-bold text-gray-900 truncate">
                                                    {instructorName}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Questions Count */}
                                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                                            <ArrowRight className="w-4 h-4 text-blue-500" />
                                            <span className="font-semibold">{totalQuestions} practice questions</span>
                                        </div>

                                        {/* CTA Button */}
                                        <Link
                                            href={`/courses/${course._id}`}
                                            className="block w-full bg-gradient-to-r from-[#021d49] to-[#03275f] hover:from-[#03275f] hover:to-[#021d49] text-white py-4 rounded-2xl font-bold transition-all duration-300 text-center group-hover:shadow-xl group-hover:shadow-blue-900/30 mt-4"
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                View Course Details
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                                            </span>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {!filteredCourses.length && (
                            <div className="col-span-full text-center py-16">
                                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600 text-lg font-medium">No courses available for this category yet.</p>
                                <p className="text-gray-500 text-sm mt-2">Check back soon for new additions!</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Enhanced Bottom CTA */}
                <div className="text-center bg-gradient-to-r from-orange-50 via-pink-50 to-blue-50 rounded-3xl p-12 border border-orange-200/50">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        Ready to Start Your Learning Journey?
                    </h3>
                    <p className="text-gray-600 mb-6 text-lg">
                        Explore endless knowledge and unlock your full potential
                    </p>
                    <Link 
                        href="/courses" 
                        className="inline-flex items-center gap-3 bg-gradient-to-r from-[#021d49] to-[#03275f] text-white px-10 py-4 rounded-full font-bold hover:shadow-xl hover:shadow-blue-900/30 transition-all duration-300 hover:scale-105"
                    >
                        Browse All Courses
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default CoursesSection;