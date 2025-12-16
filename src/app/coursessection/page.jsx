"use client";
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Clock, Users, Star, ArrowRight, Layers } from 'lucide-react';
import courseService from '@/lib/api/courseService';
import categoryService from '@/lib/api/categoryService';

const placeholderGradient = 'bg-gradient-to-br from-orange-100 via-white to-orange-50';

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
                // Fetch categories and courses in parallel
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
        // Use dynamic categories from database, fallback to derived categories from courses
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
        <section className="relative py-16 lg:py-24 bg-white overflow-hidden">
            {/* Stylish Background Pattern with Fading Lines */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Vertical Lines */}
                <div className="absolute top-0 left-[10%] w-px h-full bg-gradient-to-b from-transparent via-orange-200 to-transparent opacity-30"></div>
                <div className="absolute top-0 left-[25%] w-px h-full bg-gradient-to-b from-orange-200 via-transparent to-orange-200 opacity-20"></div>
                <div className="absolute top-0 right-[25%] w-px h-full bg-gradient-to-b from-transparent via-orange-200 to-transparent opacity-30"></div>
                <div className="absolute top-0 right-[10%] w-px h-full bg-gradient-to-b from-orange-200 via-transparent to-orange-200 opacity-20"></div>

                {/* Horizontal Lines */}
                <div className="absolute top-[20%] left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent opacity-30"></div>
                <div className="absolute top-[50%] left-0 w-full h-px bg-gradient-to-r from-orange-200 via-transparent to-orange-200 opacity-20"></div>
                <div className="absolute top-[80%] left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent opacity-30"></div>

                {/* Decorative Circles */}
                <div className="absolute top-10 left-20 w-32 h-32 bg-orange-200 rounded-full opacity-10 blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-40 h-40 bg-red-200 rounded-full opacity-10 blur-3xl"></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Section Header */}
                <div className="text-center mb-12">
                    <span className="text-[#f65e14] font-semibold text-sm uppercase tracking-wider">
                        Our Courses
                    </span>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mt-4 mb-6">
                        Explore Our Research Programs
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Master the art of research with our expert-led courses designed to elevate your academic journey
                    </p>
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-6 py-2.5 rounded-full font-medium transition-all duration-300 ${activeCategory === category
                                ? 'bg-[#f65e14] text-white shadow-lg transform scale-105'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Content states */}
                {loading && (
                    <div className="text-center text-gray-600 py-10">Loading courses</div>
                )}
                {error && !loading && (
                    <div className="text-center text-red-600 py-6">{error}</div>
                )}

                {/* Courses Grid */}
                {!loading && !error && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
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
                                    className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-gray-100 hover:border-orange-200"
                                >
                                    {/* Course Image */}
                                    <div className="relative overflow-hidden h-64">
                                        <div className={`absolute top-4 left-4 bg-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold z-10`}>
                                            {category}
                                        </div>
                                        {course.thumbnailUrl ? (
                                            <img
                                                src={course.thumbnailUrl}
                                                alt={course.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className={`w-full h-full ${placeholderGradient}`} />
                                        )}
                                    </div>

                                    {/* Course Content */}
                                    <div className="p-6 space-y-4">
                                        {/* Meta Info */}
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4 text-[#f65e14]" />
                                                <span>{modules.length} modules</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users className="w-4 h-4 text-[#f65e14]" />
                                                <span className="text-xs">{enrollmentCount.toLocaleString()} enrolled</span>
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#f65e14] transition-colors">
                                            {course.title}
                                        </h3>

                                        {/* Rating */}
                                        <div className="flex items-center gap-2">
                                            <div className="flex">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-4 h-4 ${i < Math.floor(rating)
                                                            ? 'fill-orange-500 text-orange-500'
                                                            : 'text-gray-300'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900">
                                                ({rating.toFixed(1)} rating)
                                            </span>
                                        </div>

                                        {/* Instructor */}
                                        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                                            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 font-semibold flex items-center justify-center">
                                                {instructorName?.[0] || '?'}
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">By</p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {instructorName}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Modules / Questions */}
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Layers className="w-4 h-4 text-[#f65e14]" />
                                                <span>{modules.length} modules</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <ArrowRight className="w-4 h-4 text-[#f65e14]" />
                                                <span>{totalQuestions} questions</span>
                                            </div>
                                        </div>

                                        {/* CTA Button */}
                                        <Link
                                            href={`/courses/${course._id}`}
                                            className="w-full bg-[#f65e14] hover:bg-[#e54d03] text-white py-3.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-lg mt-4"
                                        >
                                            View Course
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                        {!filteredCourses.length && (
                            <div className="col-span-full text-center text-gray-600 py-8">No courses available for this category yet.</div>
                        )}
                    </div>
                )}

                {/* Bottom CTA */}
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Explore Endless Knowledge With Us</p>
                    <Link href="/courses" className="text-[#f65e14] font-semibold hover:underline inline-flex items-center gap-2">
                        More Courses Features
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>

            </div>
        </section>
    );
};

export default CoursesSection;
