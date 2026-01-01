'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Users, Star, ArrowRight, Loader } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import courseService from '@/lib/api/courseService';
import { useRouter } from 'next/navigation';

export default function FeaturedCoursesComponent() {
    const router = useRouter();
    const { showToast } = useToast();
    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [categories, setCategories] = useState(['All']);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await courseService.getAllCourses({
                limit: 6,
                page: 1,
            });

            const coursesList = response.courses || [];
            setCourses(coursesList);

            // Extract unique categories
            const uniqueCategories = ['All', ...new Set(coursesList.map(c => c.category))];
            setCategories(uniqueCategories);
            setFilteredCourses(coursesList);
        } catch (error) {
            console.error('Error fetching courses:', error);
            // Fallback to demo data
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryFilter = (category) => {
        setActiveCategory(category);
        if (category === 'All') {
            setFilteredCourses(courses);
        } else {
            setFilteredCourses(courses.filter(c => c.category === category));
        }
    };

    const handleEnrollClick = (courseId) => {
        const token = localStorage.getItem('token');
        if (!user) {
            router.push('/login');
            return;
        }

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role === 'student') {
            router.push(`/student/courses/${courseId}`);
        } else {
            showToast('Only students can enroll in courses', { type: 'warning', title: 'Heads up' });
        }
    };

    return (
        <section className="relative py-16 lg:py-24 bg-white overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-[10%] w-px h-full bg-gradient-to-b from-transparent via-orange-200 to-transparent opacity-30"></div>
                <div className="absolute top-0 right-[10%] w-px h-full bg-gradient-to-b from-orange-200 via-transparent to-orange-200 opacity-20"></div>
                <div className="absolute top-[20%] left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent opacity-30"></div>
                <div className="absolute bottom-20 right-20 w-40 h-40 bg-red-200 rounded-full opacity-10 blur-3xl"></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <span className="text-[#021d49] font-semibold text-sm uppercase tracking-wider">Featured Courses</span>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mt-4 mb-6">
                        Explore Our Courses
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Learn from expert instructors and advance your skills
                    </p>
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-3 justify-center mb-12">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => handleCategoryFilter(category)}
                            className={`px-6 py-2 rounded-full font-medium transition-all ${activeCategory === category
                                ? 'bg-[#021d49] text-white shadow-lg'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader size={40} className="animate-spin text-[#021d49]" />
                    </div>
                ) : filteredCourses.length > 0 ? (
                    <>
                        {/* Courses Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                            {filteredCourses.map(course => (
                                <div
                                    key={course._id}
                                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                                >
                                    {/* Course Image */}
                                    <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden">
                                        {course.thumbnailUrl ? (
                                            <img
                                                src={course.thumbnailUrl}
                                                alt={course.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white">
                                                <span className="text-center px-4">
                                                    {course.category}
                                                </span>
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4 bg-[#021d49] text-white px-3 py-1 rounded-full text-xs font-semibold">
                                            {course.level}
                                        </div>
                                    </div>

                                    {/* Course Content */}
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                                            {course.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                            {course.description}
                                        </p>

                                        {/* Course Meta */}
                                        <div className="space-y-2 mb-6 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Clock size={16} />
                                                <span>{course.modules?.length || 0} modules</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users size={16} />
                                                <span>{course.enrollmentCount || 0}+ enrolled</span>
                                            </div>
                                            {course.avgRating && (
                                                <div className="flex items-center gap-2">
                                                    <Star size={16} className="fill-yellow-400 text-yellow-400" />
                                                    <span>{course.avgRating.toFixed(1)} rating</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Instructor Info */}
                                        {course.instructorId && (
                                            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                                                <div className="w-10 h-10 bg-[#021d49] rounded-full flex items-center justify-center text-white font-bold">
                                                    {course.instructorId.firstName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {course.instructorId.firstName} {course.instructorId.lastName}
                                                    </p>
                                                    <p className="text-xs text-gray-600">Instructor</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Button */}
                                        <button
                                            onClick={() => handleEnrollClick(course._id)}
                                            className="w-full bg-[#021d49] hover:bg-orange-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 group"
                                        >
                                            Explore Course
                                            <ArrowRight
                                                size={18}
                                                className="group-hover:translate-x-1 transition-transform"
                                            />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* View All Button */}
                        {filteredCourses.length > 0 && (
                            <div className="text-center">
                                <button
                                    onClick={() => router.push('/courses')}
                                    className="inline-flex items-center gap-2 px-8 py-3 bg-[#021d49] text-white rounded-lg font-semibold hover:bg-orange-700 transition-all"
                                >
                                    View All Courses
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-600 text-lg">No courses available at this time.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
