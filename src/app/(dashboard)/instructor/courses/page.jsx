'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import coursesData from '@/data/courses/courses';

export default function InstructorCoursesPage() {
    const router = useRouter();
    const [instructorData, setInstructorData] = useState(null);
    const [instructorCourses, setInstructorCourses] = useState([]);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        // Load instructor data
        const user = localStorage.getItem('user');
        if (user) {
            const userData = JSON.parse(user);
            setInstructorData(userData);

            // Filter courses by instructor email
            const myCourses = coursesData.filter(
                course => course.instructor?.email === userData.email
            );
            setInstructorCourses(myCourses);
        }
    }, []);

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
                            Published
                        </button>
                        <button
                            onClick={() => setFilter('draft')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'draft'
                                    ? 'bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Drafts
                        </button>
                        <button
                            onClick={() => setFilter('pending')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'pending'
                                    ? 'bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Pending Approval
                        </button>
                    </div>
                </div>

                {/* Courses Grid */}
                {instructorCourses.length === 0 ? (
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
                        {instructorCourses.map((course) => (
                            <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all group">
                                {/* Course Image */}
                                <div className="relative h-48 overflow-hidden">
                                    <img
                                        src={course.bannerImage || course.image}
                                        alt={course.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute top-3 right-3">
                                        <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full">
                                            Published
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
                                            {course.level}
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
                                            {course.students}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Icons.Star className="w-3 h-3 text-yellow-500" />
                                            {course.rating}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Icons.BookOpen className="w-3 h-3" />
                                            {course.modules?.length || 0} modules
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => router.push(`/courses/${course.id}`)}
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
                                        <button
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            <Icons.MoreVertical className="w-4 h-4" />
                                        </button>
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
