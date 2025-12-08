"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Users, Star, ArrowRight, BookOpen } from 'lucide-react';
import Navbar from '../../components/navbar/navbar';
import Footer from '../../components/Footer/Footer';
import courseService from '@/lib/api/courseService';


const CoursesPage = () => {
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState('All');
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;
        const fetchCourses = async () => {
            try {
                setLoading(true);
                const data = await courseService.getAllCourses({ status: 'published' });
                if (mounted) {
                    setCourses(Array.isArray(data) ? data : data?.courses || []);
                }
            } catch (err) {
                console.error('Failed to load courses', err);
                if (mounted) setError('Unable to load courses right now.');
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchCourses();
        return () => {
            mounted = false;
        };
    }, []);

    const categories = useMemo(() => {
        const unique = new Set(courses.map((c) => c.category).filter(Boolean));
        return ['All', ...Array.from(unique)];
    }, [courses]);

    const filteredCourses = useMemo(() => {
        if (activeCategory === 'All') return courses;
        return courses.filter((course) => course.category === activeCategory);
    }, [courses, activeCategory]);

    // Navigate to course detail page by ID
    const handleEnrollClick = (course) => {
        router.push(`/courses/${course._id}`);
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white pt-24 pb-12">
                <section className="py-4 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-wrap justify-center gap-3 mb-6">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setActiveCategory(category)}
                                    className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${activeCategory === category
                                        ? 'bg-[#f65e14] text-white shadow-lg scale-105'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                        {loading && (
                            <div className="text-center text-gray-600 py-10">Loading courses...</div>
                        )}
                        {error && !loading && (
                            <div className="text-center text-red-600 py-6">{error}</div>
                        )}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {!loading && !error && filteredCourses.map((course) => {
                                const rating = course.instructorId?.avgRating ?? course.avgRating ?? 0;
                                const modules = course.modules || [];
                                const enrollmentCount = course.enrollmentCount ?? 0;
                                const instructorName = course.instructorId
                                    ? `${course.instructorId.firstName || ''} ${course.instructorId.lastName || ''}`.trim()
                                    : 'Unknown Instructor';
                                return (
                                    <div
                                        key={course._id}
                                        className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group border border-gray-100 hover:border-orange-200 hover:-translate-y-2"
                                    >
                                        <div className="relative overflow-hidden h-64">
                                            {course.thumbnailUrl ? (
                                                <img
                                                    src={course.thumbnailUrl}
                                                    alt={course.title}
                                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-all duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-orange-100 via-white to-orange-50" />
                                            )}
                                            <div className="absolute top-4 left-4 bg-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold z-10">
                                                {course.category || 'General'}
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4 text-[#f65e14]" />
                                                    <span className="font-medium">{modules.length} Modules</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Users className="w-4 h-4 text-[#f65e14]" />
                                                    <span className="text-xs">{enrollmentCount.toLocaleString()} enrolled</span>
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#f65e14] transition-colors line-clamp-2">
                                                {course.title}
                                            </h3>
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
                                            <button
                                                onClick={() => handleEnrollClick(course)}
                                                className="w-full bg-[#f65e14] hover:bg-[#e54d03] text-white py-3.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-lg mt-4"
                                            >
                                                Enroll And Begin
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </div>
            <Footer />
        </>
    );
};

export default CoursesPage;