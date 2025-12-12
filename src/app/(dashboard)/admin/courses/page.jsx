'use client';

import React, { useEffect, useMemo, useState } from 'react';
import * as Icons from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const adminApi = axios.create({ baseURL: `${API_URL}/api/admin` });

if (typeof window !== 'undefined') {
    adminApi.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });
}

export default function CourseManagementPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewMode, setViewMode] = useState('cards');
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState(null);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [approvalCourse, setApprovalCourse] = useState(null);
    const [approvalFeedback, setApprovalFeedback] = useState('');
    const [approvalAction, setApprovalAction] = useState('approve');
    const [submitting, setSubmitting] = useState(false);
    const [migrating, setMigrating] = useState(false);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await adminApi.get('/courses', { params: { page: 1, limit: 200 } });
            setCourses(response.data.courses || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
            alert(`Failed to fetch courses: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleMigrateCourses = async () => {
        if (!confirm('This will update all old courses to support the new lessons structure. Continue?')) return;
        setMigrating(true);
        try {
            const response = await adminApi.post('/courses/migrate');
            alert(`Migration completed!\n\nTotal courses: ${response.data.totalCourses}\nMigrated: ${response.data.migratedCourses}\nAlready migrated: ${response.data.alreadyMigrated}`);
            fetchCourses();
        } catch (error) {
            console.error('Migration error:', error);
            alert(`Migration failed: ${error.response?.data?.message || error.message}`);
        } finally {
            setMigrating(false);
        }
    };

    const handleViewCourseDetails = async (course) => {
        try {
            // Fetch full course data including all modules and assessments
            const response = await adminApi.get(`/courses/${course._id}`);
            setSelectedCourse(response.data);
        } catch (error) {
            console.error('Error fetching course details:', error);
            // Fall back to showing the basic course data if detailed fetch fails
            setSelectedCourse(course);
        }
    };

    const handleDeleteCourse = async () => {
        if (!courseToDelete) return;
        try {
            await adminApi.delete(`/courses/${courseToDelete._id}`);
            setCourses((prev) => prev.filter((c) => c._id !== courseToDelete._id));
            setShowDeleteModal(false);
            setCourseToDelete(null);
            alert('Course deleted successfully!');
        } catch (error) {
            console.error('Error deleting course:', error);
            alert(`Failed to delete course: ${error.response?.data?.message || error.message}`);
        }
    };

    const openApprovalModal = (course, action) => {
        setApprovalCourse(course);
        setApprovalAction(action);
        setApprovalFeedback('');
        setShowApprovalModal(true);
    };

    const handleApproveRejectCourse = async () => {
        if (!approvalCourse) return;
        setSubmitting(true);
        try {
            if (approvalAction === 'approve') {
                await adminApi.put(`/courses/${approvalCourse._id}/approve`, { feedback: approvalFeedback });
                alert('Course approved successfully! Instructor has been notified.');
            } else {
                await adminApi.put(`/courses/${approvalCourse._id}/reject`, { reason: approvalFeedback });
                alert('Course rejected. Instructor has been notified with feedback.');
            }
            fetchCourses();
            setShowApprovalModal(false);
            setApprovalCourse(null);
            setApprovalFeedback('');
        } catch (error) {
            alert('Failed to process course. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const categories = useMemo(() => ['all', ...new Set((courses || []).map((c) => c.category || 'Uncategorized'))], [courses]);

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
        const submitted = courses.filter((c) => c.status === 'submitted').length;
        const totalStudents = courses.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0);
        return [
            { label: 'Total Courses', value: total, icon: 'BookOpen', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Published', value: published, icon: 'CheckCircle', color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Pending Approval', value: submitted, icon: 'Clock', color: 'text-orange-600', bg: 'bg-orange-50' },
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

    const formatStatus = (status) => (status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown');

    const getTotalQuestions = (course) => {
        let totalQuestions = 0;

        // Count questions from modules
        if (course?.modules?.length) {
            course.modules.forEach((module) => {
                // Count lesson questions
                if (module.lessons?.length) {
                    module.lessons.forEach((lesson) => {
                        totalQuestions += lesson.questions?.length || 0;
                    });
                }
                // Count module assessment questions
                totalQuestions += module.moduleAssessment?.questions?.length || 0;
            });
        }

        // Count final assessment questions
        totalQuestions += course?.finalAssessment?.questions?.length || 0;

        return totalQuestions;
    };

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
                        <div className="flex gap-2">
                            <button
                                onClick={handleMigrateCourses}
                                disabled={migrating}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Icons.Database className="w-5 h-5" />
                                <span className="hidden sm:inline">{migrating ? 'Migrating...' : 'Migrate Courses'}</span>
                            </button>
                            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                                <Icons.Plus className="w-5 h-5" />
                                <span className="hidden sm:inline">Add Course</span>
                            </button>
                        </div>
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
                            {categories.map((cat) => (
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
                            <option value="submitted">Pending Approval</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
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
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            <div className="col-span-full flex items-center justify-center py-12">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-emerald-600 mx-auto mb-4"></div>
                                    <p className="text-gray-600">Loading courses...</p>
                                </div>
                            </div>
                        ) : filteredCourses.length === 0 ? (
                            <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                                <Icons.BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No Courses</h3>
                                <p className="text-gray-600">No courses match your filters.</p>
                            </div>
                        ) : (
                            filteredCourses.map((course) => (
                                <div key={course._id || course.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all group">
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
                                            <span className={`px-3 py-1 text-white text-xs font-medium rounded-full ${course.status === 'published' ? 'bg-green-500' :
                                                course.status === 'submitted' ? 'bg-blue-500' :
                                                    course.status === 'approved' ? 'bg-emerald-500' :
                                                        course.status === 'rejected' ? 'bg-red-500' :
                                                            'bg-yellow-500'
                                                }`}>
                                                {course.status ? course.status.charAt(0).toUpperCase() + course.status.slice(1) : 'Draft'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                                {course.category}
                                            </span>
                                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                                                {course.level || 'N/A'}
                                            </span>
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
                                                {getTotalQuestions(course)} Questions
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Icons.Users className="w-3 h-3" />
                                                {(course.enrollmentCount || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleViewCourseDetails(course)}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                View Details
                                            </button>
                                            {course.status === 'submitted' && (
                                                <>
                                                    <button
                                                        onClick={() => openApprovalModal(course, 'approve')}
                                                        className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                                                        title="Approve Course"
                                                    >
                                                        <Icons.CheckCircle className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openApprovalModal(course, 'reject')}
                                                        className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                                                        title="Reject Course"
                                                    >
                                                        <Icons.XCircle className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            <button className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                                                <Icons.Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => { setCourseToDelete(course); setShowDeleteModal(true); }}
                                                className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                                            >
                                                <Icons.Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
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
                                                        onClick={() => handleViewCourseDetails(course)}
                                                        className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Icons.Eye className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors" title="Edit">
                                                        <Icons.Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => { setCourseToDelete(course); setShowDeleteModal(true); }}
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

                {filteredCourses.length === 0 && !loading && (
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

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <StatCard icon={<Icons.Users className="w-4 h-4 text-blue-600" />} label="Students" value={(selectedCourse.enrollmentCount || 0).toLocaleString()} />
                                <StatCard icon={<Icons.Star className="w-4 h-4 text-green-600" />} label="Rating" value={selectedCourse.instructorId?.avgRating?.toFixed?.(1) || '0.0'} />
                                <StatCard icon={<Icons.BookOpen className="w-4 h-4 text-purple-600" />} label="Modules" value={selectedCourse.modules?.length || 0} />
                                <StatCard icon={<Icons.HelpCircle className="w-4 h-4 text-orange-600" />} label="Questions" value={getTotalQuestions(selectedCourse)} />
                            </div>

                            <section className="bg-gray-50 rounded-lg p-4 border border-gray-200">
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
                            </section>

                            {selectedCourse.description && (
                                <section>
                                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <Icons.FileText className="w-4 h-4 text-blue-600" /> Course Description
                                    </h3>
                                    <p className="text-sm text-gray-700 leading-relaxed">{selectedCourse.description}</p>
                                </section>
                            )}

                            <section>
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Icons.List className="w-4 h-4 text-blue-600" />
                                    Course Content ({selectedCourse.modules?.length || 0} Modules, {getTotalQuestions(selectedCourse)} Questions)
                                </h3>
                                <div className="space-y-3">
                                    {(selectedCourse.modules || []).map((module, idx) => (
                                        <div key={`${selectedCourse._id}-module-${idx}`} className="border border-gray-200 rounded-lg p-3 bg-white space-y-3">
                                            <div className="flex items-center gap-3">
                                                <span className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center text-sm font-bold">
                                                    {idx + 1}
                                                </span>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{module.title}</p>
                                                            {module.description && (
                                                                <p className="text-xs text-gray-600 mt-0.5">{module.description}</p>
                                                            )}
                                                        </div>
                                                        {module.duration && (
                                                            <span className="text-xs text-gray-600">{module.duration} mins</span>
                                                        )}
                                                    </div>
                                                    {module.lessons && module.lessons.length > 0 && (
                                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                            <Icons.BookOpen className="w-3 h-3" />
                                                            {module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {module.lessons && module.lessons.length > 0 && (
                                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                                    <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
                                                        <Icons.BookOpen className="w-3 h-3" /> Lessons ({module.lessons.length})
                                                    </p>
                                                    <div className="space-y-2">
                                                        {module.lessons.map((lesson, lIdx) => (
                                                            <div key={lIdx} className="bg-white border border-blue-50 rounded p-2 text-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">{lIdx + 1}</span>
                                                                    <span className="font-medium text-gray-900">{lesson.title}</span>
                                                                </div>
                                                                {lesson.content && (
                                                                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{lesson.content}</p>
                                                                )}
                                                                <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                                                    {lesson.duration && <span><strong>Duration:</strong> {lesson.duration}</span>}
                                                                    {lesson.videoUrl && (
                                                                        <a href={lesson.videoUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                                                            Video link
                                                                        </a>
                                                                    )}
                                                                </div>
                                                                {lesson.questions && lesson.questions.length > 0 && (
                                                                    <p className="text-xs text-orange-700 mt-1">{lesson.questions.length} question{lesson.questions.length !== 1 ? 's' : ''}</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {module.moduleAssessment && (
                                                <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3">
                                                    <p className="text-xs font-semibold text-purple-700 mb-3 flex items-center gap-1">
                                                        <Icons.FileCheck className="w-3 h-3" /> Module Assessment
                                                    </p>
                                                    <div className="text-xs text-gray-700 space-y-1 mb-3">
                                                        <p><strong>Title:</strong> {module.moduleAssessment.title || 'Module Assessment'}</p>
                                                        <p><strong>Passing Score:</strong> {module.moduleAssessment.passingScore || 70}%</p>
                                                        <p><strong>Total Questions:</strong> {module.moduleAssessment.questions?.length || 0}</p>
                                                    </div>

                                                    {/* Display Module Assessment Questions */}
                                                    {module.moduleAssessment.questions && module.moduleAssessment.questions.length > 0 && (
                                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                                            {module.moduleAssessment.questions.map((q, qIdx) => (
                                                                <div key={qIdx} className="bg-white rounded p-2 border border-gray-200">
                                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                                        <p className="text-xs font-medium text-gray-900 flex-1">
                                                                            {qIdx + 1}. {q.text}
                                                                        </p>
                                                                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium whitespace-nowrap">
                                                                            {q.type === 'multiple-choice' ? 'Multiple Choice' : q.type === 'true-false' ? 'True/False' : 'Essay'}
                                                                        </span>
                                                                    </div>

                                                                    {/* Multiple Choice Options */}
                                                                    {q.type === 'multiple-choice' && q.options && q.options.length > 0 && (
                                                                        <div className="ml-3 mt-1 space-y-1">
                                                                            {q.options.map((opt, optIdx) => (
                                                                                <div
                                                                                    key={optIdx}
                                                                                    className={`text-xs p-1.5 rounded ${q.correctAnswer === opt
                                                                                        ? 'bg-green-50 text-green-800 font-medium'
                                                                                        : 'text-gray-600'
                                                                                        }`}
                                                                                >
                                                                                    <div className="flex items-center gap-1">
                                                                                        {String.fromCharCode(65 + optIdx)}. {opt}
                                                                                        {q.correctAnswer === opt && (
                                                                                            <Icons.CheckCircle className="w-3 h-3 text-green-600" />
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    {/* True/False Answer */}
                                                                    {q.type === 'true-false' && q.correctAnswer && (
                                                                        <div className="ml-3 mt-1 flex items-center gap-1 text-xs">
                                                                            <span className="text-gray-600">Correct:</span>
                                                                            <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full font-medium">
                                                                                {q.correctAnswer}
                                                                            </span>
                                                                        </div>
                                                                    )}

                                                                    {/* Points and Explanation */}
                                                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                                                                        <span><strong>Points:</strong> {q.points || 1}</span>
                                                                    </div>

                                                                    {q.explanation && (
                                                                        <div className="mt-1 p-1.5 bg-blue-50 border border-blue-200 rounded text-xs">
                                                                            <p className="text-gray-700">
                                                                                <strong className="text-blue-700">Explanation:</strong> {q.explanation}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {selectedCourse.finalAssessment && (
                                <section className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Icons.Award className="w-5 h-5 text-purple-600" /> Final Assessment
                                    </h4>
                                    <div className="text-sm text-gray-700 space-y-2 mb-3">
                                        <p><strong>Title:</strong> {selectedCourse.finalAssessment.title || 'Final Assessment'}</p>
                                        <p><strong>Passing Score:</strong> {selectedCourse.finalAssessment.passingScore || 70}%</p>
                                        <p><strong>Total Questions:</strong> {selectedCourse.finalAssessment.questions?.length || 0}</p>
                                    </div>

                                    {/* Display Questions */}
                                    {selectedCourse.finalAssessment.questions && selectedCourse.finalAssessment.questions.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-sm font-semibold text-gray-800 mb-3">Questions:</p>
                                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                                {selectedCourse.finalAssessment.questions.map((q, qIdx) => (
                                                    <div key={qIdx} className="bg-white rounded-lg p-3 border border-purple-200">
                                                        <div className="flex items-start gap-2">
                                                            <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                                {qIdx + 1}
                                                            </span>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                                    <p className="text-sm font-medium text-gray-900">{q.text}</p>
                                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium whitespace-nowrap">
                                                                        {q.type === 'multiple-choice' ? 'Multiple Choice' :
                                                                            q.type === 'true-false' ? 'True/False' :
                                                                                q.type === 'essay' ? 'Essay' : q.type}
                                                                    </span>
                                                                </div>

                                                                {/* Show options for multiple choice */}
                                                                {q.type === 'multiple-choice' && q.options && (
                                                                    <div className="mt-2 space-y-1">
                                                                        {q.options.map((option, optIdx) => (
                                                                            <div key={optIdx} className={`text-xs flex items-center gap-2 p-2 rounded ${q.correctAnswer === option
                                                                                ? 'bg-green-50 text-green-700 font-medium'
                                                                                : 'bg-gray-50 text-gray-600'
                                                                                }`}>
                                                                                {q.correctAnswer === option && (
                                                                                    <Icons.CheckCircle className="w-3 h-3 text-green-600" />
                                                                                )}
                                                                                <span className="font-semibold">{String.fromCharCode(65 + optIdx)}.</span>
                                                                                <span>{option}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {/* Show correct answer for true/false */}
                                                                {q.type === 'true-false' && (
                                                                    <div className="mt-2">
                                                                        <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded font-medium">
                                                                            Answer: {q.correctAnswer}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {/* Show points */}
                                                                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                                                    <Icons.Star className="w-3 h-3" />
                                                                    <span>{q.points || 1} point{q.points !== 1 ? 's' : ''}</span>
                                                                </div>

                                                                {/* Show explanation if available */}
                                                                {q.explanation && (
                                                                    <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                                                        <p className="text-xs text-blue-800">
                                                                            <span className="font-semibold">Explanation:</span> {q.explanation}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </section>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Approval Modal */}
            {showApprovalModal && approvalCourse && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900">
                                {approvalAction === 'approve' ? 'Approve Course' : 'Reject Course'}
                            </h3>
                            <button onClick={() => setShowApprovalModal(false)} className="text-gray-500 hover:text-gray-700">
                                <Icons.X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{approvalCourse.title}</p>
                        <textarea
                            value={approvalFeedback}
                            onChange={(e) => setApprovalFeedback(e.target.value)}
                            placeholder={approvalAction === 'approve' ? 'Approval notes (optional)' : 'Rejection reason (required)'}
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={4}
                        />
                        <div className="mt-4 flex gap-2 justify-end">
                            <button
                                onClick={() => setShowApprovalModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApproveRejectCourse}
                                disabled={submitting || (approvalAction === 'reject' && !approvalFeedback.trim())}
                                className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 ${approvalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} ${submitting ? 'opacity-60' : ''}`}
                            >
                                {submitting && <Icons.Loader className="w-4 h-4 animate-spin" />}
                                {approvalAction === 'approve' ? 'Approve' : 'Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && courseToDelete && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-lg">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Course</h3>
                        <p className="text-sm text-gray-700 mb-4">Are you sure you want to delete "{courseToDelete.title}"? This action cannot be undone.</p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => { setShowDeleteModal(false); setCourseToDelete(null); }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteCourse}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, label, value }) {
    return (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
                {icon}
                <span className="text-xs text-gray-600">{label}</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
    );
}
