'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import * as Icons from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const adminApi = axios.create({
    baseURL: `${API_URL}/api/admin`,
});

if (typeof window !== 'undefined') {
    adminApi.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });
}

export default function AdminCourseDetailPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = params.id;

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedModules, setExpandedModules] = useState([]);
    const [expandedLessons, setExpandedLessons] = useState([]);
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionType, setActionType] = useState('approve');
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [addingComment, setAddingComment] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandAll, setExpandAll] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchCourse();
    }, [courseId]);

    const fetchCourse = async () => {
        try {
            setLoading(true);
            const response = await adminApi.get(`/courses/${courseId}`);
            setCourse(response.data);
            // Expand all modules by default
            setExpandedModules(response.data.modules?.map((_, idx) => idx) || []);
            // Load comments if any
            if (response.data.comments) {
                setComments(response.data.comments);
            }
        } catch (error) {
            console.error('Error fetching course:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleModule = (index) => {
        setExpandedModules(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const toggleLesson = (lessonKey) => {
        setExpandedLessons(prev =>
            prev.includes(lessonKey) ? prev.filter(k => k !== lessonKey) : [...prev, lessonKey]
        );
    };

    const handleExpandAll = () => {
        if (expandAll) {
            setExpandedModules([]);
            setExpandedLessons([]);
        } else {
            setExpandedModules(course?.modules?.map((_, idx) => idx) || []);
        }
        setExpandAll(!expandAll);
    };

    const getFilteredModules = () => {
        if (!searchTerm.trim()) return course?.modules || [];

        return (course?.modules || []).filter(module =>
            module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            module.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            module.lessons?.some(lesson =>
                lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lesson.content?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        setAddingComment(true);
        try {
            // For now, just add to local state
            // You can add a backend endpoint later to save comments
            const comment = {
                text: newComment,
                author: 'Admin',
                timestamp: new Date().toISOString(),
            };
            setComments([...comments, comment]);
            setNewComment('');
            alert('Comment added successfully (currently stored locally)');
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Failed to add comment');
        } finally {
            setAddingComment(false);
        }
    };

    const handleActionClick = (type) => {
        setActionType(type);
        setFeedback('');
        setShowActionModal(true);
    };

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        setDeleting(true);
        try {
            const response = await adminApi.delete(`/courses/${courseId}`);
            console.log('Course deleted successfully:', response.data);
            setShowDeleteModal(false);
            // Show success and redirect
            alert('Course deleted successfully!');
            // Use replace to ensure navigation happens
            router.replace('/admin/courses/pending');
        } catch (error) {
            console.error('Error deleting course:', error.response?.data || error.message);
            alert(`Failed to delete course: ${error.response?.data?.message || error.message}`);
            setDeleting(false);
        }
    };

    const handleSubmitAction = async () => {
        if (actionType === 'reject' && !feedback.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        setSubmitting(true);
        try {
            if (actionType === 'approve') {
                await adminApi.put(`/courses/${courseId}/approve`, { feedback: feedback || undefined });
                alert('Course approved successfully!');
            } else if (actionType === 'reject') {
                await adminApi.put(`/courses/${courseId}/reject`, { reason: feedback });
                alert('Course rejected successfully!');
            } else if (actionType === 'publish') {
                await adminApi.put(`/courses/${courseId}/publish`);
                alert('Course published successfully!');
            }
            setShowActionModal(false);
            router.push('/admin/courses/pending');
        } catch (error) {
            console.error('Error processing course:', error);
            alert(`Failed to ${actionType} course. Please try again.`);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending Review' },
            approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
            published: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Published' },
            rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
        };
        const badge = badges[status] || badges.draft;
        return (
            <span className={`${badge.bg} ${badge.text} px-3 py-1 rounded-full text-sm font-medium`}>
                {badge.label}
            </span>
        );
    };

    const getInstructorInfo = () => {
        const instructor = course?.instructorId;
        if (typeof instructor === 'object' && instructor) {
            return {
                name: `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || 'Unknown',
                email: instructor.email || 'N/A',
                institution: instructor.institution || 'N/A',
            };
        }
        return { name: 'Unknown', email: 'N/A', institution: 'N/A' };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 pt-20 p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading course details...</p>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 pt-20 p-6 flex items-center justify-center">
                <div className="text-center">
                    <Icons.AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
                    <button
                        onClick={() => router.push('/admin/courses/pending')}
                        className="text-blue-600 hover:underline"
                    >
                        Back to Pending Courses
                    </button>
                </div>
            </div>
        );
    }

    const instructorInfo = getInstructorInfo();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 pt-20 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.push('/admin/courses/pending')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <Icons.ChevronLeft className="w-5 h-5" />
                        Back to Pending Courses
                    </button>

                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
                                {getStatusBadge(course.status)}
                            </div>
                            <p className="text-gray-600 mb-4">{course.description}</p>

                            {/* New course details section */}
                            <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900 mb-2">Course Details</h2>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div><strong>Welcome Message:</strong> <span className="text-gray-700">{course.welcomeMessage || '-'}</span></div>
                                    <div><strong>Audience Description:</strong> <span className="text-gray-700">{course.audienceDescription || '-'}</span></div>
                                    <div><strong>Delivery Mode:</strong> <span className="text-gray-700">{course.deliveryMode || '-'}</span></div>
                                    <div><strong>Course Aim:</strong> <span className="text-gray-700">{course.courseAim || '-'}</span></div>
                                    <div><strong>Course Objective:</strong> <span className="text-gray-700">{course.courseObjective || '-'}</span></div>
                                    <div><strong>Expected Learning Outcomes:</strong> <span className="text-gray-700">{course.expectedLearningOutcomes || '-'}</span></div>
                                    <div><strong>Brief Content:</strong> <span className="text-gray-700">{course.briefContent || '-'}</span></div>
                                    <div><strong>Teaching & Learning Methods:</strong> <span className="text-gray-700">{course.teachingLearningMethods || '-'}</span></div>
                                    <div><strong>Resources / Materials:</strong> <span className="text-gray-700">{course.resourcesMaterials || '-'}</span></div>
                                    <div><strong>Assessment Plan:</strong> <span className="text-gray-700">{course.assessmentPlan || '-'}</span></div>
                                    <div><strong>Supporting Technologies:</strong> <span className="text-gray-700">{course.supportingTechnologies || '-'}</span></div>
                                    <div><strong>Core Texts:</strong> <span className="text-gray-700">{course.coreTexts || '-'}</span></div>
                                    <div><strong>Additional Readings:</strong> <span className="text-gray-700">{course.additionalReadings || '-'}</span></div>
                                </div>
                            </div>
                            {/* Instructor Info */}
                            <div className="bg-blue-50 rounded-lg p-4 inline-block">
                                <div className="flex items-center gap-3">
                                    <Icons.User className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <p className="font-medium text-gray-900">{instructorInfo.name}</p>
                                        <p className="text-sm text-gray-600">{instructorInfo.email}</p>
                                        {instructorInfo.institution !== 'N/A' && (
                                            <p className="text-sm text-gray-600">{instructorInfo.institution}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {course.status === 'pending' && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleActionClick('approve')}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
                                >
                                    <Icons.CheckCircle className="w-4 h-4" />
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleActionClick('reject')}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center gap-2"
                                >
                                    <Icons.XCircle className="w-4 h-4" />
                                    Reject
                                </button>
                                <button
                                    onClick={handleDeleteClick}
                                    className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-950 transition-all flex items-center gap-2"
                                >
                                    <Icons.Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        )}
                        {course.status === 'approved' && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleActionClick('publish')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                                >
                                    <Icons.Upload className="w-4 h-4" />
                                    Publish
                                </button>
                                <button
                                    onClick={handleDeleteClick}
                                    className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-950 transition-all flex items-center gap-2"
                                >
                                    <Icons.Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        )}
                        {course.status === 'published' && (
                            <button
                                onClick={handleDeleteClick}
                                className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-950 transition-all flex items-center gap-2"
                            >
                                <Icons.Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        )}
                    </div>
                </div>

                {/* Comments Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Icons.MessageSquare className="w-5 h-5 text-blue-600" />
                        Comments & Feedback
                    </h2>

                    {/* Existing Comments */}
                    {comments.length > 0 && (
                        <div className="space-y-3 mb-4">
                            {comments.map((comment, idx) => (
                                <div key={idx} className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-start justify-between mb-1">
                                        <span className="font-medium text-sm text-gray-900">{comment.author}</span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(comment.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700">{comment.text}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add New Comment */}
                    <div>
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment or suggestion for the instructor..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows="3"
                        />
                        <button
                            onClick={handleAddComment}
                            disabled={addingComment || !newComment.trim()}
                            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Icons.Send className="w-4 h-4" />
                            {addingComment ? 'Adding...' : 'Add Comment'}
                        </button>
                        <p className="text-xs text-gray-500 mt-1">
                            Note: Comments are currently stored locally and won't be sent to the instructor unless you approve/reject.
                        </p>
                    </div>
                </div>

                {/* Course Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <Icons.BookOpen className="w-5 h-5 text-blue-600" />
                            <div>
                                <p className="text-sm text-gray-600">Modules</p>
                                <p className="text-xl font-bold text-gray-900">{course.modules?.length || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <Icons.BarChart className="w-5 h-5 text-purple-600" />
                            <div>
                                <p className="text-sm text-gray-600">Level</p>
                                <p className="text-xl font-bold text-gray-900 capitalize">{course.level || 'Beginner'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <Icons.Tag className="w-5 h-5 text-green-600" />
                            <div>
                                <p className="text-sm text-gray-600">Category</p>
                                <p className="text-xl font-bold text-gray-900">{course.category || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <Icons.DollarSign className="w-5 h-5 text-yellow-600" />
                            <div>
                                <p className="text-sm text-gray-600">Price</p>
                                {course.status === 'submitted' ? (
                                    <div>
                                        <input
                                            type="number"
                                            value={course.price || ''}
                                            onChange={e => setCourse(prev => ({ ...prev, price: e.target.value }))}
                                            placeholder="Set price (USD)"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                        />
                                        <button
                                            className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                                            onClick={async () => {
                                                try {
                                                    await adminApi.put(`/courses/${courseId}/set-price`, { price: course.price });
                                                    alert('Price set successfully!');
                                                    fetchCourse();
                                                } catch (err) {
                                                    alert('Failed to set price');
                                                }
                                            }}
                                        >
                                            Set Price
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-xl font-bold text-gray-900">${course.price || 0}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Final Assessment Section */}
                {course.finalAssessment && course.finalAssessment.questions?.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Icons.Award className="w-6 h-6 text-purple-600" />
                            <h2 className="text-xl font-bold text-gray-900">Final Assessment</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 text-sm">
                                <span className="text-gray-600">
                                    <strong>Title:</strong> {course.finalAssessment.title || 'Final Assessment'}
                                </span>
                                <span className="text-gray-600">
                                    <strong>Passing Score:</strong> {course.finalAssessment.passingScore || 70}%
                                </span>
                                <span className="text-gray-600">
                                    <strong>Questions:</strong> {course.finalAssessment.questions.length}
                                </span>
                            </div>
                            <div className="border-t border-gray-200 pt-4">
                                <h3 className="font-semibold text-gray-900 mb-3">Questions:</h3>
                                <div className="space-y-3">
                                    {course.finalAssessment.questions.map((q, idx) => (
                                        <div key={idx} className="bg-gray-50 rounded-lg p-4">
                                            <p className="font-medium text-gray-900 mb-2">
                                                {idx + 1}. {q.text}
                                            </p>
                                            <div className="text-sm space-y-1">
                                                <p className="text-gray-600">
                                                    <strong>Type:</strong> {q.type}
                                                </p>
                                                {q.options && q.options.length > 0 && (
                                                    <div>
                                                        <strong className="text-gray-600">Options:</strong>
                                                        <ul className="ml-4 mt-1 space-y-1">
                                                            {q.options.map((opt, optIdx) => (
                                                                <li key={optIdx} className="text-gray-700">
                                                                    {opt}
                                                                    {q.correctAnswer === opt && (
                                                                        <span className="ml-2 text-green-600 font-medium">✓ Correct</span>
                                                                    )}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {q.explanation && (
                                                    <p className="text-gray-600">
                                                        <strong>Explanation:</strong> {q.explanation}
                                                    </p>
                                                )}
                                                <p className="text-gray-600">
                                                    <strong>Points:</strong> {q.points || 1}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modules Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Icons.Layers className="w-5 h-5 text-blue-600" />
                            Course Modules ({course?.modules?.length || 0})
                        </h2>
                        <button
                            onClick={handleExpandAll}
                            className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${expandAll
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {expandAll ? (
                                <>
                                    <Icons.ChevronUp className="w-4 h-4" />
                                    Collapse All
                                </>
                            ) : (
                                <>
                                    <Icons.ChevronDown className="w-4 h-4" />
                                    Expand All
                                </>
                            )}
                        </button>
                    </div>

                    {/* Search */}
                    {(course?.modules?.length || 0) > 5 && (
                        <div className="mb-4 relative">
                            <Icons.Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search modules and lessons..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}

                    {/* Module Count Info */}
                    {(course?.modules?.length || 0) > 10 && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                            This course has <strong>{course.modules.length} modules</strong>. {expandAll ? 'Showing all modules.' : 'Click expand to view modules.'}
                        </div>
                    )}

                    {!course.modules || course.modules.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No modules added yet</p>
                    ) : getFilteredModules().length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No modules match your search</p>
                    ) : (
                        <div className="space-y-8">
                            {(() => {
                                // Group modules by uploadedBy
                                const modules = getFilteredModules();
                                const groups = {};
                                modules.forEach((mod) => {
                                    const uploader = mod.uploadedBy && typeof mod.uploadedBy === 'object'
                                        ? `${mod.uploadedBy.firstName || ''} ${mod.uploadedBy.lastName || ''}`.trim() || 'Unknown'
                                        : 'Unknown';
                                    if (!groups[uploader]) groups[uploader] = [];
                                    groups[uploader].push(mod);
                                });
                                return Object.entries(groups).map(([uploader, mods]) => (
                                    <div key={uploader}>
                                        <div className="mb-2 flex items-center gap-2">
                                            <Icons.User className="w-4 h-4 text-blue-600" />
                                            <span className="font-semibold text-blue-900">{uploader === 'Unknown' ? 'Unknown Instructor' : uploader}</span>
                                        </div>
                                        <div className="space-y-3">
                                            {mods.map((module) => {
                                                const moduleIndex = course.modules.indexOf(module);
                                                return (
                                                    <div key={moduleIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                                                        {/* Module Header */}
                                                        <button
                                                            onClick={() => toggleModule(moduleIndex)}
                                                            className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                                    {moduleIndex + 1}
                                                                </span>
                                                                <div className="text-left">
                                                                    <h3 className="font-semibold text-gray-900">{module.title}</h3>
                                                                    <p className="text-sm text-gray-600">
                                                                        {module.lessons?.length || 0} lessons
                                                                        {module.moduleAssessment?.questions?.length > 0 &&
                                                                            ` • ${module.moduleAssessment.questions.length} assessment questions`
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Icons.ChevronDown
                                                                className={`w-5 h-5 text-gray-600 transition-transform ${expandedModules.includes(moduleIndex) ? 'rotate-180' : ''}`}
                                                            />
                                                        </button>

                                                        {/* Module Content */}
                                                        {expandedModules.includes(moduleIndex) && (
                                                            <div className="p-4 space-y-4">
                                                                {/* Module Description */}
                                                                {module.description && (
                                                                    <div className="bg-blue-50 rounded-lg p-3">
                                                                        <p className="text-sm text-gray-700">{module.description}</p>
                                                                    </div>
                                                                )}

                                                                {/* Module Video if exists */}
                                                                {module.videoUrl && (
                                                                    <div className="bg-purple-50 rounded-lg p-3">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <Icons.Video className="w-4 h-4 text-purple-600" />
                                                                            <span className="font-medium text-sm text-gray-900">Module Video</span>
                                                                        </div>
                                                                        <a
                                                                            href={module.videoUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                                                        >
                                                                            <Icons.ExternalLink className="w-3 h-3" />
                                                                            {module.videoUrl}
                                                                        </a>
                                                                    </div>
                                                                )}

                                                                {/* Lessons */}
                                                                {module.lessons && module.lessons.length > 0 ? (
                                                                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4">
                                                                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                                            <Icons.BookOpen className="w-4 h-4 text-blue-600" />
                                                                            Lessons ({module.lessons.length})
                                                                        </h4>
                                                                        <div className="space-y-2">
                                                                            {module.lessons.map((lesson, lessonIndex) => {
                                                                                const lessonKey = `${moduleIndex}-${lessonIndex}`;
                                                                                return (
                                                                                    <div key={lessonIndex} className="bg-white border border-blue-200 rounded-lg overflow-hidden hover:border-blue-300 transition-colors">
                                                                                        <button
                                                                                            onClick={() => toggleLesson(lessonKey)}
                                                                                            className="w-full p-4 flex items-center justify-between hover:bg-blue-50/50 transition-colors"
                                                                                        >
                                                                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                                                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                                                                                                    {lessonIndex + 1}
                                                                                                </span>
                                                                                                <div className="flex-1 min-w-0 text-left">
                                                                                                    <span className="font-medium text-gray-900 block truncate">{lesson.title}</span>
                                                                                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                                                                        <Icons.FileText className="w-3 h-3" />
                                                                                                        <span>Lesson {lessonIndex + 1}</span>
                                                                                                        {lesson.duration && (
                                                                                                            <>
                                                                                                                <span>•</span>
                                                                                                                <Icons.Clock className="w-3 h-3" />
                                                                                                                <span>{lesson.duration}</span>
                                                                                                            </>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                                                                                                {lesson.videoUrl && (
                                                                                                    <div className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium flex items-center gap-1">
                                                                                                        <Icons.Video className="w-3 h-3" />
                                                                                                        <span>Video</span>
                                                                                                    </div>
                                                                                                )}
                                                                                                <Icons.ChevronDown
                                                                                                    className={`w-4 h-4 text-gray-600 transition-transform flex-shrink-0 ${expandedLessons.includes(lessonKey) ? 'rotate-180' : ''}`}
                                                                                                />
                                                                                            </div>
                                                                                        </button>
                                                                                        {expandedLessons.includes(lessonKey) && (
                                                                                            <div className="p-4 bg-blue-50/50 border-t border-blue-200 space-y-3">
                                                                                                {lesson.content && (
                                                                                                    <div className="bg-white rounded p-3">
                                                                                                        <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Content</p>
                                                                                                        <p className="text-sm text-gray-700 leading-relaxed">{lesson.content}</p>
                                                                                                    </div>
                                                                                                )}
                                                                                                {lesson.videoUrl && (
                                                                                                    <div className="bg-white rounded p-3">
                                                                                                        <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-1">
                                                                                                            <Icons.Video className="w-3 h-3 text-purple-600" />
                                                                                                            Video URL
                                                                                                        </p>
                                                                                                        <a
                                                                                                            href={lesson.videoUrl}
                                                                                                            target="_blank"
                                                                                                            rel="noopener noreferrer"
                                                                                                            className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 break-all"
                                                                                                        >
                                                                                                            <Icons.ExternalLink className="w-3 h-3 flex-shrink-0" />
                                                                                                            {lesson.videoUrl}
                                                                                                        </a>
                                                                                                    </div>
                                                                                                )}
                                                                                                {lesson.duration && (
                                                                                                    <div className="bg-white rounded p-3 flex items-center gap-2">
                                                                                                        <Icons.Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                                                                                        <span className="text-sm text-gray-700">
                                                                                                            <strong>Duration:</strong> {lesson.duration}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                )}
                                                                                                {lesson.topics && lesson.topics.length > 0 && (
                                                                                                    <div className="bg-white rounded p-3">
                                                                                                        <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Topics Covered</p>
                                                                                                        <div className="flex flex-wrap gap-2">
                                                                                                            {lesson.topics.map((topic, topicIdx) => (
                                                                                                                <span key={topicIdx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                                                                                    {topic}
                                                                                                                </span>
                                                                                                            ))}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                )}

                                                                                                {/* Lesson Questions */}
                                                                                                {lesson.questions && lesson.questions.length > 0 && (
                                                                                                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                                                                                                        <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                                                                                                            <Icons.HelpCircle className="w-4 h-4 text-orange-600" />
                                                                                                            Lesson Questions ({lesson.questions.length})
                                                                                                        </p>
                                                                                                        <div className="space-y-2">
                                                                                                            {lesson.questions.map((q, qIdx) => (
                                                                                                                <div key={qIdx} className="bg-white rounded p-2 text-sm border border-orange-100">
                                                                                                                    <p className="font-medium text-gray-900 mb-1">
                                                                                                                        Q{qIdx + 1}. {q.text}
                                                                                                                    </p>
                                                                                                                    <p className="text-xs text-gray-600 mb-1">
                                                                                                                        <strong>Type:</strong> {q.type} | <strong>Points:</strong> {q.points || 1}
                                                                                                                    </p>
                                                                                                                    {q.options && q.options.length > 0 && (
                                                                                                                        <ul className="ml-3 mt-1 space-y-0.5 text-xs">
                                                                                                                            {q.options.map((opt, optIdx) => (
                                                                                                                                <li key={optIdx} className="text-gray-700">
                                                                                                                                    • {opt}
                                                                                                                                    {q.correctAnswer === opt && (
                                                                                                                                        <span className="ml-2 text-green-600 font-medium">✓ Correct Answer</span>
                                                                                                                                    )}
                                                                                                                                </li>
                                                                                                                            ))}
                                                                                                                        </ul>
                                                                                                                    )}
                                                                                                                    {q.explanation && (
                                                                                                                        <p className="text-xs text-gray-600 mt-1 italic">
                                                                                                                            <strong>Explanation:</strong> {q.explanation}
                                                                                                                        </p>
                                                                                                                    )}
                                                                                                                </div>
                                                                                                            ))}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                                                        <p className="text-sm text-yellow-800 flex items-center gap-2">
                                                                            <Icons.AlertCircle className="w-4 h-4" />
                                                                            No lessons added to this module yet
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                {/* Module-Level Questions */}
                                                                {module.questions && module.questions.length > 0 && (
                                                                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                                                                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                                                            <Icons.HelpCircle className="w-4 h-4 text-amber-600" />
                                                                            Module Questions ({module.questions.length})
                                                                        </h4>
                                                                        <div className="space-y-2">
                                                                            {module.questions.map((q, idx) => (
                                                                                <div key={idx} className="bg-white rounded p-3 text-sm border border-amber-100">
                                                                                    <p className="font-medium text-gray-900 mb-1">
                                                                                        Q{idx + 1}. {q.text}
                                                                                    </p>
                                                                                    <p className="text-xs text-gray-600 mb-1">
                                                                                        <strong>Type:</strong> {q.type} | <strong>Points:</strong> {q.points || 1}
                                                                                    </p>
                                                                                    {q.options && q.options.length > 0 && (
                                                                                        <ul className="ml-4 mt-1 space-y-0.5 text-xs">
                                                                                            {q.options.map((opt, optIdx) => (
                                                                                                <li key={optIdx} className="text-gray-700">
                                                                                                    {opt}
                                                                                                    {q.correctAnswer === opt && (
                                                                                                        <span className="ml-2 text-green-600 font-medium">✓ Correct</span>
                                                                                                    )}
                                                                                                </li>
                                                                                            ))}
                                                                                        </ul>
                                                                                    )}
                                                                                    {q.explanation && (
                                                                                        <p className="text-xs text-gray-600 mt-1 italic">
                                                                                            <strong>Explanation:</strong> {q.explanation}
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Module Assessment */}
                                                                {module.moduleAssessment && module.moduleAssessment.questions?.length > 0 && (
                                                                    <div className="bg-purple-50 rounded-lg p-4">
                                                                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                                                            <Icons.FileCheck className="w-4 h-4 text-purple-600" />
                                                                            Module Assessment
                                                                        </h4>
                                                                        <div className="space-y-3">
                                                                            <div className="flex items-center gap-4 text-sm">
                                                                                <span className="text-gray-600">
                                                                                    <strong>Title:</strong> {module.moduleAssessment.title || 'Module Assessment'}
                                                                                </span>
                                                                                <span className="text-gray-600">
                                                                                    <strong>Passing Score:</strong> {module.moduleAssessment.passingScore || 70}%
                                                                                </span>
                                                                                <span className="text-gray-600">
                                                                                    <strong>Questions:</strong> {module.moduleAssessment.questions.length}
                                                                                </span>
                                                                            </div>
                                                                            <div className="space-y-2">
                                                                                {module.moduleAssessment.questions.map((q, idx) => (
                                                                                    <div key={idx} className="bg-white rounded p-3 text-sm">
                                                                                        <p className="font-medium text-gray-900 mb-1">
                                                                                            {idx + 1}. {q.text}
                                                                                        </p>
                                                                                        <p className="text-gray-600 text-xs">
                                                                                            Type: {q.type} | Points: {q.points || 1}
                                                                                        </p>
                                                                                        {q.options && q.options.length > 0 && (
                                                                                            <ul className="ml-4 mt-1 space-y-0.5 text-xs">
                                                                                                {q.options.map((opt, optIdx) => (
                                                                                                    <li key={optIdx} className="text-gray-700">
                                                                                                        {opt}
                                                                                                        {q.correctAnswer === opt && (
                                                                                                            <span className="ml-2 text-green-600 font-medium">✓</span>
                                                                                                        )}
                                                                                                    </li>
                                                                                                ))}
                                                                                            </ul>
                                                                                        )}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    )}
                </div>

                {/* Action Modal */}
                {showActionModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-md w-full p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                {actionType === 'approve' ? 'Approve Course' : actionType === 'reject' ? 'Reject Course' : 'Publish Course'}
                            </h3>

                            {actionType !== 'publish' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {actionType === 'approve' ? 'Feedback (Optional)' : 'Reason for Rejection *'}
                                    </label>
                                    <textarea
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        placeholder={actionType === 'approve'
                                            ? 'Provide positive feedback or suggestions...'
                                            : 'Explain why this course is being rejected...'
                                        }
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        rows="4"
                                        required={actionType === 'reject'}
                                    />
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowActionModal(false)}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitAction}
                                    disabled={submitting || (actionType === 'reject' && !feedback.trim())}
                                    className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                                        actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                                            'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {submitting ? 'Processing...' : actionType === 'approve' ? 'Approve' : actionType === 'reject' ? 'Reject' : 'Publish'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-md w-full p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                    <Icons.AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Delete Course</h3>
                            </div>

                            <p className="text-gray-600 mb-2">
                                Are you sure you want to delete <strong>"{course?.title}"</strong>?
                            </p>

                            <p className="text-sm text-red-600 mb-6 flex items-center gap-2">
                                <Icons.AlertCircle className="w-4 h-4" />
                                This action cannot be undone. All course data, modules, lessons, and questions will be permanently deleted.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={deleting}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    disabled={deleting}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {deleting ? (
                                        <>
                                            <Icons.Loader className="w-4 h-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Icons.Trash2 className="w-4 h-4" />
                                            Delete Course
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}