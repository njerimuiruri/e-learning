'use client';

import React, { useEffect, useMemo, useState } from 'react';
import * as Icons from 'lucide-react';
import courseService from '@/lib/api/courseService';

export default function CourseManagementPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewMode, setViewMode] = useState('cards');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await courseService.getAllCourses({ page: 1, limit: 200 });
            setCourses(response.courses || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = useMemo(() => ['all', ...new Set((courses || []).map(c => c.category || 'Uncategorized'))], [courses]);

    const filteredCourses = useMemo(() => {
        return (courses || []).filter((course) => {
            const matchesSearch = (course.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (course.instructorId?.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (course.instructorId?.lastName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (course.category || '').toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory = filterCategory === 'all' || course.category === filterCategory;
            const matchesStatus = filterStatus === 'all' || course.status === filterStatus;

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [courses, searchQuery, filterCategory, filterStatus]);

    const stats = useMemo(() => {
        const total = courses.length;
        const published = courses.filter((c) => c.status === 'published').length;
        const draft = courses.filter((c) => c.status !== 'published').length;
        const totalStudents = courses.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0);
        return [
            { label: 'Total Courses', value: total, icon: 'BookOpen', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Published', value: published, icon: 'CheckCircle', color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Other Status', value: draft, icon: 'FileEdit', color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'Total Students', value: totalStudents.toLocaleString(), icon: 'Users', color: 'text-purple-600', bg: 'bg-purple-50' },
        ];
    }, [courses]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'published': return 'bg-green-100 text-green-700 border-green-200';
            case 'approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'submitted': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'draft': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const formatStatus = (status) => {
        return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    };

    const handleDeleteCourse = () => {
        console.log('Deleting course:', courseToDelete?._id);
        setShowDeleteModal(false);
        setCourseToDelete(null);
        alert('Course deleted successfully!');
    };

    const getTotalQuestions = (modules = []) => modules.reduce((sum, module) => sum + (module.questions?.length || 0), 0);

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Course Management</h1>
                            <p className="text-gray-600 text-sm">Manage all courses, modules, and content</p>
                        </div>
                        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            <Icons.Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">Add Course</span>
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                    {stats.map((stat, idx) => {
                        const IconComponent = Icons[stat.icon];
                        return (
                            <div key={idx} className={`${stat.bg} rounded-lg p-4 border border-gray-200`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {IconComponent && <IconComponent className={`w-5 h-5 ${stat.color}`} />}
                                    <p className="text-xs text-gray-600">{stat.label}</p>
                                </div>
                                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search courses, instructors, or categories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat === 'all' ? 'All Categories' : cat}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                        >
                            <option value="all">All Status</option>
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                        </select>
                        <div className="flex gap-2 border border-gray-300 rounded-lg p-1 bg-gray-50">
                            <button
                                onClick={() => setViewMode('cards')}
                                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${viewMode === 'cards'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <Icons.LayoutGrid className="w-4 h-4" />
                                Cards
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${viewMode === 'table'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <Icons.List className="w-4 h-4" />
                                Table
                            </button>
                        </div>
                    </div>
                </div>

                {/* Courses Display */}
                {viewMode === 'cards' ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {loading && (
                            <div className="col-span-full flex items-center justify-center py-10">
                                <Icons.Loader className="w-6 h-6 animate-spin text-blue-600" />
                            </div>
                        )}

                        {!loading && filteredCourses.map((course) => (
                            <div key={course._id || course.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                <div className="relative h-40 overflow-hidden">
                                    {course.thumbnailUrl ? (
                                        <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-blue-200 to-purple-200 flex items-center justify-center text-gray-700 text-sm">
                                            {course.category || 'Course'}
                                        </div>
                                    )}
                                    <span className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(course.status)}`}>
                                        {formatStatus(course.status)}
                                    </span>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                            {course.category || 'Uncategorized'}
                                        </span>
                                        {course.instructorId?.avgRating !== undefined && (
                                            <div className="flex items-center gap-1 text-xs text-gray-600">
                                                <Icons.Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                {course.instructorId?.avgRating?.toFixed?.(1) || '0.0'}
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                                    {course.instructorId && (
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
                                                {course.instructorId.firstName?.[0]}{course.instructorId.lastName?.[0]}
                                            </div>
                                            <span className="text-xs text-gray-600">
                                                {course.instructorId.firstName} {course.instructorId.lastName}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between text-xs text-gray-600 mb-3 pb-3 border-b">
                                        <span className="flex items-center gap-1">
                                            <Icons.BookOpen className="w-3 h-3" />
                                            {course.modules?.length || 0} Modules
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Icons.HelpCircle className="w-3 h-3" />
                                            {getTotalQuestions(course.modules)} Questions
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Icons.Users className="w-3 h-3" />
                                            {(course.enrollmentCount || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSelectedCourse(course)}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            View Details
                                        </button>
                                        <button className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                                            <Icons.Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setCourseToDelete(course);
                                                setShowDeleteModal(true);
                                            }}
                                            className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                                        >
                                            <Icons.Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Course</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Instructor</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Category</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Students</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {loading && (
                                        <tr>
                                            <td colSpan={6} className="py-6 text-center text-sm text-gray-600">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Icons.Loader className="w-4 h-4 animate-spin" />
                                                    Loading courses...
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {!loading && filteredCourses.map((course) => (
                                        <tr key={course._id || course.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-semibold">
                                                        {course.category?.[0] || 'C'}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900 text-sm">{course.title}</div>
                                                        <div className="text-xs text-gray-500">{course.level || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm text-gray-900">
                                                    {course.instructorId ? `${course.instructorId.firstName || ''} ${course.instructorId.lastName || ''}` : 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-500">{course.instructorId?.email || ''}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                                    {course.category || 'Uncategorized'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{(course.enrollmentCount || 0).toLocaleString()}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(course.status)}`}>
                                                    {formatStatus(course.status)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setSelectedCourse(course)}
                                                        className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Icons.Eye className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors" title="Edit">
                                                        <Icons.Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setCourseToDelete(course);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Icons.Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {filteredCourses.length === 0 && (
                    <div className="bg-white rounded-lg p-12 text-center">
                        <Icons.Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
                        <p className="text-gray-600">Try adjusting your search or filter criteria</p>
                    </div>
                )}
            </div>

            {/* Course Detail Modal */}
            {selectedCourse && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl max-w-4xl w-full my-8 shadow-2xl max-h-[90vh] overflow-y-auto">
                        {/* Header with Banner */}
                        <div className="relative h-48 overflow-hidden">
                            {selectedCourse.thumbnailUrl ? (
                                <img src={selectedCourse.thumbnailUrl} alt={selectedCourse.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-200 to-purple-200" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <button
                                onClick={() => setSelectedCourse(null)}
                                className="absolute top-4 right-4 bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 text-white p-2 rounded-lg transition-colors"
                            >
                                <Icons.X className="w-5 h-5" />
                            </button>
                            <div className="absolute bottom-4 left-4 right-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-1 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded text-xs font-medium">
                                        {selectedCourse.category || 'Uncategorized'}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedCourse.status)}`}>
                                        {formatStatus(selectedCourse.status)}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-bold text-white">{selectedCourse.title}</h2>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Course Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Icons.Users className="w-4 h-4 text-blue-600" />
                                        <span className="text-xs text-gray-600">Students</span>
                                    </div>
                                    <p className="text-lg font-bold text-blue-600">{(selectedCourse.enrollmentCount || 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Icons.Star className="w-4 h-4 text-green-600" />
                                        <span className="text-xs text-gray-600">Rating</span>
                                    </div>
                                    <p className="text-lg font-bold text-green-600">{selectedCourse.instructorId?.avgRating?.toFixed?.(1) || '0.0'}</p>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Icons.BookOpen className="w-4 h-4 text-purple-600" />
                                        <span className="text-xs text-gray-600">Modules</span>
                                    </div>
                                    <p className="text-lg font-bold text-purple-600">{selectedCourse.modules?.length || 0}</p>
                                </div>
                                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Icons.HelpCircle className="w-4 h-4 text-orange-600" />
                                        <span className="text-xs text-gray-600">Questions</span>
                                    </div>
                                    <p className="text-lg font-bold text-orange-600">{getTotalQuestions(selectedCourse.modules)}</p>
                                </div>
                            </div>

                            {/* Instructor Info */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Icons.User className="w-4 h-4 text-blue-600" />
                                    Instructor Information
                                </h3>
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                                        {selectedCourse.instructorId?.firstName?.[0]}
                                        {selectedCourse.instructorId?.lastName?.[0]}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">{selectedCourse.instructorId ? `${selectedCourse.instructorId.firstName || ''} ${selectedCourse.instructorId.lastName || ''}` : 'N/A'}</p>
                                        <p className="text-sm text-gray-600 mb-1">{selectedCourse.instructorId?.email || ''}</p>
                                        <p className="text-sm text-gray-700">{selectedCourse.instructorId?.bio || ''}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {selectedCourse.description && (
                                <div className="mb-6">
                                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <Icons.FileText className="w-4 h-4 text-blue-600" />
                                        Course Description
                                    </h3>
                                    <p className="text-sm text-gray-700 leading-relaxed">{selectedCourse.description}</p>
                                </div>
                            )}

                            {/* Modules & Lessons */}
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Icons.List className="w-4 h-4 text-blue-600" />
                                    Course Content ({selectedCourse.modules?.length || 0} Modules, {getTotalQuestions(selectedCourse.modules)} Questions)
                                </h3>
                                <div className="space-y-3">
                                    {(selectedCourse.modules || []).map((module, idx) => (
                                        <div key={`${selectedCourse._id}-module-${idx}`} className="border border-gray-200 rounded-lg overflow-hidden">
                                            <div className="bg-gray-50 p-3 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="font-semibold text-gray-900 text-sm">{module.title}</span>
                                                </div>
                                                <span className="text-xs text-gray-600">{module.questions?.length || 0} questions</span>
                                            </div>
                                            <div className="p-3 bg-white">
                                                {module.description && (
                                                    <p className="text-xs text-gray-600 mb-2">{module.description}</p>
                                                )}
                                                <div className="space-y-1 text-xs text-gray-700">
                                                    <div className="flex items-center gap-2">
                                                        <Icons.HelpCircle className="w-4 h-4 text-gray-400" />
                                                        <span>{module.questions?.length || 0} questions</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Icons.Clock className="w-4 h-4 text-gray-400" />
                                                        <span>{module.duration ? `${module.duration} mins` : 'Self-paced'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Bonuses */}
                            {selectedCourse.bonuses && selectedCourse.bonuses.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Icons.Gift className="w-4 h-4 text-blue-600" />
                                        Course Bonuses
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-2">
                                        {selectedCourse.bonuses.map((bonus, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                                                <Icons.CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                <span>{bonus}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                                    <Icons.Edit className="w-5 h-5" />
                                    Edit Course
                                </button>
                                <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                                    <Icons.Copy className="w-5 h-5" />
                                    Duplicate
                                </button>
                                <button
                                    onClick={() => {
                                        setCourseToDelete(selectedCourse);
                                        setShowDeleteModal(true);
                                        setSelectedCourse(null);
                                    }}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Icons.Trash2 className="w-5 h-5" />
                                    Delete Course
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && courseToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
                        <div className="p-6">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Icons.Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Delete Course?</h3>
                            <p className="text-center text-gray-600 mb-6">
                                Are you sure you want to delete <strong>{courseToDelete.title}</strong>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setCourseToDelete(null);
                                    }}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteCourse}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}