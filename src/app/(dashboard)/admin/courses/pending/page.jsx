'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import axios from 'axios';

// Create admin API instance directly
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const adminApi = axios.create({
    baseURL: `${API_URL}/api/admin`,
});

// Add token to requests
if (typeof window !== 'undefined') {
    adminApi.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });
}

export default function PendingCoursesPage() {
    const router = useRouter();
    const [pendingCourses, setPendingCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [actionType, setActionType] = useState('approve'); // 'approve' or 'reject'
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    useEffect(() => {
        fetchPendingCourses();
    }, [page]);

    const fetchPendingCourses = async () => {
        try {
            setLoading(true);
            const response = await adminApi.get('/courses/pending', { params: { page, limit: 10 } });
            setPendingCourses(response.data.courses || []);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Error fetching pending courses:', error);
            alert('Failed to load pending courses');
        } finally {
            setLoading(false);
        }
    };

    const handleActionClick = (course, type) => {
        setSelectedCourse(course);
        setActionType(type);
        setFeedback('');
        setShowActionModal(true);
    };

    const handleViewDetails = (course) => {
        setSelectedCourse(course);
        setShowViewModal(true);
    };

    const handleSubmitAction = async () => {
        if (!selectedCourse || !feedback.trim()) {
            alert('Please provide feedback/reason');
            return;
        }

        setSubmitting(true);
        try {
            if (actionType === 'approve') {
                await adminApi.put(`/courses/${selectedCourse._id}/approve`, { feedback });
                alert('Course approved successfully! Instructor has been notified via email.');
            } else {
                await adminApi.put(`/courses/${selectedCourse._id}/reject`, { reason: feedback });
                alert('Course rejected. Instructor has been notified with feedback via email.');
            }
            setShowActionModal(false);
            setSelectedCourse(null);
            setFeedback('');
            fetchPendingCourses();
        } catch (error) {
            console.error('Error processing course:', error);
            alert(`Failed to ${actionType} course. Please try again.`);
        } finally {
            setSubmitting(false);
        }
    };

    const getInstructorInfo = (course) => {
        const instructor = course.instructorId;
        if (typeof instructor === 'object' && instructor) {
            return `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || 'Unknown Instructor';
        }
        return 'Unknown Instructor';
    };

    const getInstructorEmail = (course) => {
        const instructor = course.instructorId;
        if (typeof instructor === 'object' && instructor?.email) {
            return instructor.email;
        }
        return 'N/A';
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 pt-20 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Icons.Clock className="w-8 h-8 text-orange-600" />
                        <h1 className="text-3xl font-bold text-gray-900">
                            Pending Course Approvals
                        </h1>
                    </div>
                    <p className="text-gray-600">
                        Review and approve courses submitted by instructors
                    </p>
                </div>

                {/* Stats Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Total Pending Courses</p>
                            <p className="text-4xl font-bold text-orange-600 mt-1">
                                {pagination?.total || 0}
                            </p>
                        </div>
                        <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
                            <Icons.BookOpen className="w-8 h-8 text-orange-600" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading pending courses...</p>
                        </div>
                    </div>
                ) : pendingCourses.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <Icons.CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
                        <p className="text-gray-600">There are no pending course approvals at this time.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pendingCourses.map((course) => (
                            <div
                                key={course._id}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all"
                            >
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                    {/* Course Info */}
                                    <div className="flex-1">
                                        <div className="flex items-start gap-4">
                                            {course.thumbnailUrl ? (
                                                <img
                                                    src={course.thumbnailUrl}
                                                    alt={course.title}
                                                    className="w-24 h-24 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                                                    <Icons.BookOpen className="w-8 h-8 text-orange-600" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg text-gray-900 mb-2">
                                                    {course.title}
                                                </h3>
                                                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                                    {course.description}
                                                </p>
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                                        {course.category}
                                                    </span>
                                                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                                        {course.level || 'Beginner'}
                                                    </span>
                                                    {course.modules?.length > 0 && (
                                                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                                                            {course.modules.length} modules
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Instructor Info */}
                                                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                                                    <p className="text-gray-600">
                                                        <strong>Instructor:</strong> {getInstructorInfo(course)}
                                                    </p>
                                                    <p className="text-gray-600">
                                                        <strong>Email:</strong> {getInstructorEmail(course)}
                                                    </p>
                                                    <p className="text-gray-600">
                                                        <strong>Submitted:</strong> {formatDate(course.submittedAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-2 md:w-auto">
                                        <button
                                            onClick={() => router.push(`/admin/courses/${course._id}`)}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center justify-center gap-2 whitespace-nowrap"
                                        >
                                            <Icons.Eye className="w-4 h-4" />
                                            View Details
                                        </button>
                                        <button
                                            onClick={() => handleActionClick(course, 'approve')}
                                            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium flex items-center justify-center gap-2 whitespace-nowrap"
                                        >
                                            <Icons.CheckCircle className="w-4 h-4" />
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleActionClick(course, 'reject')}
                                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium flex items-center justify-center gap-2 whitespace-nowrap"
                                        >
                                            <Icons.XCircle className="w-4 h-4" />
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Icons.ChevronLeft className="w-4 h-4" />
                        </button>

                        <div className="flex gap-1">
                            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`px-3 py-2 rounded-lg font-medium transition-colors ${page === p
                                            ? 'bg-orange-600 text-white'
                                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                            disabled={page === pagination.pages}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Icons.ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Action Modal - Enhanced with full course details */}
            {showActionModal && selectedCourse && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6 my-8">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {actionType === 'approve' ? 'Review & Approve Course' : 'Review & Reject Course'}
                            </h2>
                            <button
                                onClick={() => setShowActionModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <Icons.X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Scrollable Content Area */}
                        <div className="max-h-96 overflow-y-auto mb-6 border-b border-gray-200 pb-6">
                            {/* Course Thumbnail */}
                            {selectedCourse.thumbnailUrl && (
                                <div className="mb-6">
                                    <img
                                        src={selectedCourse.thumbnailUrl}
                                        alt={selectedCourse.title}
                                        className="w-full h-48 rounded-lg object-cover"
                                    />
                                </div>
                            )}

                            {/* Course Title and Basic Info */}
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">{selectedCourse.title}</h3>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                        {selectedCourse.category}
                                    </span>
                                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                        {selectedCourse.level || 'Beginner'}
                                    </span>
                                    {selectedCourse.modules?.length > 0 && (
                                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                                            {selectedCourse.modules.length} modules
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Course Description */}
                            <div className="mb-6">
                                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                                <p className="text-gray-700 text-sm leading-relaxed">
                                    {selectedCourse.description}
                                </p>
                            </div>

                            {/* Instructor Information */}
                            <div className="mb-6 bg-blue-50 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-3">Instructor Information</h4>
                                <div className="space-y-2 text-sm">
                                    <p className="text-gray-700">
                                        <strong>Name:</strong> {getInstructorInfo(selectedCourse)}
                                    </p>
                                    <p className="text-gray-700">
                                        <strong>Email:</strong> {getInstructorEmail(selectedCourse)}
                                    </p>
                                    <p className="text-gray-700">
                                        <strong>Submitted:</strong> {formatDate(selectedCourse.submittedAt)}
                                    </p>
                                </div>
                            </div>

                            {/* Modules */}
                            {selectedCourse.modules && selectedCourse.modules.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-semibold text-gray-900 mb-3">Course Modules ({selectedCourse.modules.length})</h4>
                                    <div className="space-y-3">
                                        {selectedCourse.modules.map((module, index) => (
                                            <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center text-sm font-bold">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h5 className="font-medium text-gray-900">{module.title}</h5>
                                                        {module.description && (
                                                            <p className="text-gray-600 text-xs mt-1">{module.description}</p>
                                                        )}
                                                        {module.duration && (
                                                            <p className="text-gray-500 text-xs mt-1">
                                                                Duration: {module.duration} {module.durationUnit || 'minutes'}
                                                            </p>
                                                        )}
                                                        {module.lessons && module.lessons.length > 0 && (
                                                            <p className="text-gray-600 text-xs mt-2 flex items-center gap-1">
                                                                <Icons.BookOpen className="w-3 h-3 inline" />
                                                                {module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Lessons */}
                                                {module.lessons && module.lessons.length > 0 && (
                                                    <div className="bg-white border border-blue-100 rounded-lg p-3">
                                                        <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
                                                            <Icons.BookOpen className="w-3 h-3" /> Lessons ({module.lessons.length})
                                                        </p>
                                                        <div className="space-y-2">
                                                            {module.lessons.map((lesson, lIdx) => (
                                                                <div key={lIdx} className="border border-blue-50 rounded p-2 text-sm">
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

                                                {/* Module Assessment */}
                                                {module.moduleAssessment && (
                                                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                                                        <p className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-1">
                                                            <Icons.FileCheck className="w-3 h-3" /> Module Assessment
                                                        </p>
                                                        <div className="text-xs text-gray-700 space-y-1">
                                                            <p><strong>Title:</strong> {module.moduleAssessment.title || 'Module Assessment'}</p>
                                                            <p><strong>Passing Score:</strong> {module.moduleAssessment.passingScore || 70}%</p>
                                                            <p><strong>Questions:</strong> {module.moduleAssessment.questions?.length || 0}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Final Assessment */}
                            {selectedCourse.finalAssessment && (
                                <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <Icons.Award className="w-4 h-4 text-purple-600" /> Final Assessment
                                    </h4>
                                    <div className="text-sm text-gray-700 space-y-1 mb-3">
                                        <p><strong>Title:</strong> {selectedCourse.finalAssessment.title || 'Final Assessment'}</p>
                                        <p><strong>Passing Score:</strong> {selectedCourse.finalAssessment.passingScore || 70}%</p>
                                        <p><strong>Questions:</strong> {selectedCourse.finalAssessment.questions?.length || 0}</p>
                                    </div>
                                </div>
                            )}

                            {/* Additional Course Info */}
                            {selectedCourse.price !== undefined && (
                                <div className="mb-6 bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-900 mb-2">Pricing</h4>
                                    <p className="text-lg font-bold text-orange-600">
                                        ${selectedCourse.price || 'Free'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Feedback/Reason Section */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {actionType === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason (Required)'}
                            </label>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder={
                                    actionType === 'approve'
                                        ? 'Enter any notes for the instructor...'
                                        : 'Explain why the course is being rejected...'
                                }
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowActionModal(false)}
                                disabled={submitting}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitAction}
                                disabled={submitting || (actionType === 'reject' && !feedback.trim())}
                                className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium text-white disabled:opacity-50 flex items-center justify-center gap-2 ${actionType === 'approve'
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                    }`}
                            >
                                {submitting && <Icons.Loader className="w-4 h-4 animate-spin" />}
                                {actionType === 'approve' ? 'Approve Course' : 'Reject Course'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Details Modal - read-only course preview */}
            {showViewModal && selectedCourse && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full p-6 my-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-gray-400">Course preview</p>
                                <h2 className="text-2xl font-bold text-gray-900">{selectedCourse.title}</h2>
                            </div>
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <Icons.X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto space-y-6">
                            {selectedCourse.thumbnailUrl && (
                                <img
                                    src={selectedCourse.thumbnailUrl}
                                    alt={selectedCourse.title}
                                    className="w-full h-56 object-cover rounded-lg"
                                />
                            )}

                            <div className="flex flex-wrap gap-2">
                                {selectedCourse.category && (
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                        {selectedCourse.category}
                                    </span>
                                )}
                                {selectedCourse.level && (
                                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                        {selectedCourse.level}
                                    </span>
                                )}
                                {selectedCourse.modules?.length > 0 && (
                                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                                        {selectedCourse.modules.length} modules
                                    </span>
                                )}
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                                <p className="text-gray-700 leading-relaxed text-sm">
                                    {selectedCourse.description || 'No description provided.'}
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                <h4 className="font-semibold text-gray-900 mb-3">Instructor</h4>
                                <p className="text-gray-800 text-sm">{getInstructorInfo(selectedCourse)}</p>
                                <p className="text-gray-600 text-sm">{getInstructorEmail(selectedCourse)}</p>
                                <p className="text-gray-500 text-xs">Submitted: {formatDate(selectedCourse.submittedAt)}</p>
                            </div>

                            {selectedCourse.modules?.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900">Modules</h4>
                                    {selectedCourse.modules.map((module, index) => (
                                        <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                                            <div className="flex items-center gap-3">
                                                <span className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center text-sm font-bold">
                                                    {index + 1}
                                                </span>
                                                <div>
                                                    <p className="font-medium text-gray-900">{module.title}</p>
                                                    {module.description && (
                                                        <p className="text-gray-600 text-sm mt-1">{module.description}</p>
                                                    )}
                                                    {module.duration && (
                                                        <p className="text-gray-500 text-xs mt-1">Duration: {module.duration} {module.durationUnit || 'minutes'}</p>
                                                    )}
                                                    {module.lessons?.length > 0 && (
                                                        <p className="text-gray-600 text-xs mt-2">
                                                            <Icons.BookOpen className="w-3 h-3 inline mr-1" />
                                                            {module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Final Assessment */}
                            {selectedCourse.finalAssessment && (
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <Icons.FileCheck className="w-4 h-4 text-purple-600" />
                                        Final Assessment
                                    </h4>
                                    <div className="border border-purple-200 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-blue-50">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h5 className="font-semibold text-gray-900 mb-1">{selectedCourse.finalAssessment.title}</h5>
                                                {selectedCourse.finalAssessment.description && (
                                                    <p className="text-sm text-gray-600 mb-2">{selectedCourse.finalAssessment.description}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-lg ml-3">
                                                <Icons.Award className="w-4 h-4" />
                                                <span className="text-sm font-semibold">{selectedCourse.finalAssessment.passingScore || 70}%</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            <div className="bg-white rounded-lg p-2 border border-purple-200">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Icons.HelpCircle className="w-3 h-3 text-purple-600" />
                                                    <span className="text-xs text-gray-600">Questions</span>
                                                </div>
                                                <p className="text-lg font-bold text-purple-600">{selectedCourse.finalAssessment.questions?.length || 0}</p>
                                            </div>
                                            <div className="bg-white rounded-lg p-2 border border-blue-200">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Icons.Target className="w-3 h-3 text-blue-600" />
                                                    <span className="text-xs text-gray-600">Pass Score</span>
                                                </div>
                                                <p className="text-lg font-bold text-blue-600">{selectedCourse.finalAssessment.passingScore || 70}%</p>
                                            </div>
                                        </div>

                                        {/* Questions Preview */}
                                        {selectedCourse.finalAssessment.questions && selectedCourse.finalAssessment.questions.length > 0 && (
                                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                                <p className="text-xs font-semibold text-gray-700 mb-2">Questions:</p>
                                                {selectedCourse.finalAssessment.questions.map((question, idx) => (
                                                    <div key={idx} className="bg-white rounded p-2 border border-gray-200 text-xs">
                                                        <div className="flex items-start gap-2">
                                                            <span className="w-5 h-5 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                                {idx + 1}
                                                            </span>
                                                            <div className="flex-1">
                                                                <p className="font-medium text-gray-900 mb-1">{question.text}</p>
                                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                                                    {question.type === 'multiple-choice' ? 'Multiple Choice' :
                                                                        question.type === 'true-false' ? 'True/False' :
                                                                            question.type === 'essay' ? 'Essay' : question.type}
                                                                </span>
                                                                {question.points && (
                                                                    <span className="ml-2 text-gray-500">• {question.points} pts</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {selectedCourse.price !== undefined && (
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                    <h4 className="font-semibold text-gray-900 mb-2">Pricing</h4>
                                    <p className="text-lg font-bold text-orange-600">${selectedCourse.price || 'Free'}</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
