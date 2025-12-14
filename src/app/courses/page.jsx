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
    const [enrollmentsMap, setEnrollmentsMap] = useState({});

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

    // Fetch current user's enrollments to decide between Continue vs Enroll
    useEffect(() => {
        let mounted = true;
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;

        const fetchEnrollments = async () => {
            try {
                const data = await courseService.getStudentEnrollments();
                if (!mounted) return;
                const map = {};
                (data || []).forEach((en) => {
                    const id = en.courseId?._id || en.courseId;
                    if (id) map[id] = en;
                });
                setEnrollmentsMap(map);
            } catch (err) {
                console.log('Unable to load enrollments for continue CTA', err);
            }
        };

        fetchEnrollments();
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

    const computeResume = (course, enrollment) => {
        if (!course?.modules?.length || !enrollment) return null;
        const modules = course.modules;

        const hasLast = typeof enrollment.lastAccessedModule === 'number' && typeof enrollment.lastAccessedLesson === 'number';
        if (hasLast) {
            const mIdx = enrollment.lastAccessedModule;
            const lIdx = enrollment.lastAccessedLesson;
            const mod = modules[mIdx] || modules[0];
            const lesson = mod?.lessons?.[lIdx] || mod?.lessons?.[0];
            return {
                moduleId: mod?._id || `${mIdx}`,
                lessonId: lesson?._id || `${lIdx}`,
            };
        }

        const lessonProgress = enrollment.lessonProgress || [];
        if (lessonProgress.length > 0) {
            const sorted = [...lessonProgress].sort((a, b) => {
                const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
                const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
                return bTime - aTime;
            });
            const latest = sorted[0];
            const mIdx = latest?.moduleIndex ?? 0;
            const lIdx = latest?.lessonIndex ?? 0;
            const mod = modules[mIdx] || modules[0];
            const lesson = mod?.lessons?.[lIdx] || mod?.lessons?.[0];
            return {
                moduleId: mod?._id || `${mIdx}`,
                lessonId: lesson?._id || `${lIdx}`,
            };
        }

        const mod = modules[0];
        const lesson = mod?.lessons?.[0];
        return {
            moduleId: mod?._id || '0',
            lessonId: lesson?._id || '0',
        };
    };

    const handlePrimaryClick = (course) => {
        const enrollment = enrollmentsMap[course._id];
        if (enrollment) {
            const dest = computeResume(course, enrollment);
            if (dest) {
                router.push(`/courses/${course._id}/learn/${dest.moduleId}/${dest.lessonId}`);
            } else {
                router.push(`/courses/${course._id}`);
            }
            return;
        }
        handleEnrollClick(course);
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
                                                onClick={() => handlePrimaryClick(course)}
                                                className="w-full bg-[#f65e14] hover:bg-[#e54d03] text-white py-3.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-lg mt-4"
                                            >
                                                {enrollmentsMap[course._id] ? 'Continue Learning' : 'Enroll And Begin'}
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