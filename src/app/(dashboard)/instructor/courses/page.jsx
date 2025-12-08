'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import courseService from '@/lib/api/courseService';

export default function InstructorCoursesPage() {
    const router = useRouter();
    const [instructorData, setInstructorData] = useState(null);
    const [instructorCourses, setInstructorCourses] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState({});

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const user = localStorage.getItem('user');
            if (user) {
                const userData = JSON.parse(user);
                setInstructorData(userData);

                const data = await courseService.getInstructorCourses();
                setInstructorCourses(Array.isArray(data) ? data : data?.courses || []);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitCourse = async (courseId) => {
        try {
            setSubmitting(prev => ({ ...prev, [courseId]: true }));
            await courseService.submitCourse(courseId);
            alert('Course submitted for approval! Admin will review it shortly.');
            fetchCourses();
        } catch (error) {
            alert('Failed to submit course. Please try again.');
        } finally {
            setSubmitting(prev => ({ ...prev, [courseId]: false }));
        }
    };

    const getFilteredCourses = () => {
        if (filter === 'all') return instructorCourses;
        return instructorCourses.filter(c => c.status === filter);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 pt-20 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#16a34a] to-emerald-700 bg-clip-text text-transparent mb-2">
                            My Courses
                        </h1>
                        <p className="text-gray-600">Manage and track your courses</p>
                    </div>
                    <button
                        onClick={() => router.push('/instructor/courses/upload')}
                        className="px-6 py-2 bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center gap-2 shadow-md"
                    >
                        <Icons.Plus className="w-4 h-4" />
                        Create New Course
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'all'
                                    ? 'bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All Courses ({instructorCourses.length})
                        </button>
                        <button
                            onClick={() => setFilter('published')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'published'
                                    ? 'bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Published ({instructorCourses.filter(c => c.status === 'published').length})
                        </button>
                        <button
                            onClick={() => setFilter('draft')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'draft'
                                    ? 'bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Drafts ({instructorCourses.filter(c => c.status === 'draft').length})
                        </button>
                        <button
                            onClick={() => setFilter('submitted')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'submitted'
                                    ? 'bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Pending Approval ({instructorCourses.filter(c => c.status === 'submitted').length})
                        </button>
                        <button
                            onClick={() => setFilter('approved')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'approved'
                                    ? 'bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Approved ({instructorCourses.filter(c => c.status === 'approved').length})
                        </button>
                    </div>
                </div>

                {/* Courses Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-emerald-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading your courses...</p>
                        </div>
                    </div>
                ) : getFilteredCourses().length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <Icons.BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Courses Yet</h3>
                        <p className="text-gray-600 mb-6">Start creating your first course to share your knowledge with students.</p>
                        <button
                            onClick={() => router.push('/instructor/courses/upload')}
                            className="px-6 py-3 bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all inline-flex items-center gap-2"
                        >
                            <Icons.Plus className="w-5 h-5" />
                            Create Your First Course
                        </button>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {getFilteredCourses().map((course) => (
                            <div key={course._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all group">
                                {/* Course Image */}
                                <div className="relative h-48 overflow-hidden">
                                    {course.thumbnailUrl ? (
                                        <img
                                            src={course.thumbnailUrl}
                                            alt={course.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-50"></div>
                                    )}
                                    <div className="absolute top-3 right-3">
                                        <span className={`px-3 py-1 text-white text-xs font-medium rounded-full ${
                                            course.status === 'published' ? 'bg-green-500' :
                                            course.status === 'submitted' ? 'bg-blue-500' :
                                            course.status === 'approved' ? 'bg-emerald-500' :
                                            course.status === 'rejected' ? 'bg-red-500' :
                                            'bg-yellow-500'
                                        }`}>
                                            {course.status ? course.status.charAt(0).toUpperCase() + course.status.slice(1) : 'Draft'}
                                        </span>
                                    </div>
                                </div>

                                {/* Course Info */}
                                <div className="p-5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                            {course.category}
                                        </span>
                                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                                            {course.level || 'Beginner'}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                                        {course.title}
                                    </h3>

                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                        {course.description}
                                    </p>

                                    {/* Stats */}
                                    <div className="flex items-center gap-4 mb-4 text-xs text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <Icons.Users className="w-3 h-3" />
                                            {(course.enrollmentCount || 0).toLocaleString()} enrolled
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Icons.BookOpen className="w-3 h-3" />
                                            {(course.modules?.length || 0)} modules
                                        </span>
                                    </div>

                                    {/* Rejection Reason if rejected */}
                                    {course.status === 'rejected' && course.rejectionReason && (
                                        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                            <strong>Feedback:</strong> {course.rejectionReason}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => router.push(`/courses/${course._id}`)}
                                            className="flex-1 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                        >
                                            <Icons.Eye className="w-4 h-4" />
                                            View
                                        </button>
                                        <button
                                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                        >
                                            <Icons.Edit className="w-4 h-4" />
                                            Edit
                                        </button>
                                        {(course.status === 'draft' || course.status === 'rejected') && (
                                            <button
                                                onClick={() => handleSubmitCourse(course._id)}
                                                disabled={submitting[course._id]}
                                                className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                <Icons.Upload className="w-4 h-4" />
                                                {submitting[course._id] ? 'Submitting...' : 'Submit'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
