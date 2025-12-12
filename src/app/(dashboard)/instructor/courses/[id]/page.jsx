'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import * as Icons from 'lucide-react';
import courseService from '@/lib/api/courseService';

export default function InstructorCourseViewPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = params.id;

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedModules, setExpandedModules] = useState([]);
    const [expandedLessons, setExpandedLessons] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandAll, setExpandAll] = useState(false);

    useEffect(() => {
        fetchCourse();
    }, [courseId]);

    const fetchCourse = async () => {
        try {
            setLoading(true);
            const data = await courseService.getInstructorCourseById(courseId);
            setCourse(data);
            // Don't expand all modules by default for large courses
            // Only expand first 3 modules
            setExpandedModules(data.modules?.map((_, idx) => idx < 3 ? idx : null).filter(i => i !== null) || []);
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

    const getTotalQuestions = () => {
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 pt-20 p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading course...</p>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 pt-20 p-6 flex items-center justify-center">
                <div className="text-center">
                    <Icons.AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
                    <button
                        onClick={() => router.push('/instructor/courses')}
                        className="text-emerald-600 hover:underline"
                    >
                        Back to Courses
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 pt-20 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.push('/instructor/courses')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <Icons.ChevronLeft className="w-5 h-5" />
                        Back to My Courses
                    </button>

                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
                                {getStatusBadge(course.status)}
                            </div>
                            <p className="text-gray-600">{course.description}</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => router.push(`/instructor/courses/${courseId}/assessments`)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                            >
                                <Icons.FileText className="w-4 h-4" />
                                Manage Assessments
                            </button>
                            <button
                                onClick={() => router.push(`/instructor/courses/${courseId}/edit`)}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-2"
                            >
                                <Icons.Edit className="w-4 h-4" />
                                Edit Course
                            </button>
                        </div>
                    </div>
                </div>

                {/* Rejection/Approval Feedback */}
                {course.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <Icons.AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-red-900 mb-1">Rejection Feedback</h3>
                                <p className="text-red-700">{course.rejectionReason}</p>
                            </div>
                        </div>
                    </div>
                )}

                {course.approvalFeedback && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <Icons.CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-green-900 mb-1">Approval Feedback</h3>
                                <p className="text-green-700">{course.approvalFeedback}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Course Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <Icons.BookOpen className="w-5 h-5 text-emerald-600" />
                            <div>
                                <p className="text-sm text-gray-600">Modules</p>
                                <p className="text-xl font-bold text-gray-900">{course.modules?.length || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <Icons.Users className="w-5 h-5 text-blue-600" />
                            <div>
                                <p className="text-sm text-gray-600">Enrolled</p>
                                <p className="text-xl font-bold text-gray-900">{course.enrollmentCount || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <Icons.BarChart className="w-5 h-5 text-purple-600" />
                            <div>
                                <p className="text-sm text-gray-600">Level</p>
                                <p className="text-xl font-bold text-gray-900">{course.level || 'Beginner'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <Icons.HelpCircle className="w-5 h-5 text-orange-600" />
                            <div>
                                <p className="text-sm text-gray-600">Questions</p>
                                <p className="text-xl font-bold text-gray-900">{getTotalQuestions()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Final Assessment Section */}
                {course.finalAssessment && (
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-sm border border-purple-200 p-6 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Icons.Award className="w-6 h-6 text-purple-600" />
                            <h2 className="text-xl font-bold text-gray-900">Final Assessment</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 text-sm">
                                <span className="text-gray-700">
                                    <strong>Title:</strong> {course.finalAssessment.title || 'Final Assessment'}
                                </span>
                                <span className="text-gray-700">
                                    <strong>Passing Score:</strong> {course.finalAssessment.passingScore || 70}%
                                </span>
                                <span className="text-gray-700">
                                    <strong>Total Questions:</strong> {course.finalAssessment.questions?.length || 0}
                                </span>
                            </div>
                            <div className="border-t border-purple-200 pt-4">
                                <h3 className="font-semibold text-gray-900 mb-3">Questions:</h3>
                                {course.finalAssessment.questions?.length ? (
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
                                ) : (
                                    <p className="text-sm text-gray-600">No questions added yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Modules Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Icons.Layers className="w-5 h-5 text-emerald-600" />
                            Course Modules ({course?.modules?.length || 0})
                        </h2>
                        <button
                            onClick={handleExpandAll}
                            className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${expandAll
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
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
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    )}

                    {/* Module Count Info */}
                    {(course?.modules?.length || 0) > 10 && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                            This course has <strong>{course.modules.length} modules</strong>. {expandAll ? 'Showing all modules.' : 'Only first 3 modules are expanded by default. Click expand to view more.'}
                        </div>
                    )}

                    {!course.modules || course.modules.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No modules added yet</p>
                    ) : getFilteredModules().length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No modules match your search</p>
                    ) : (
                        <div className="space-y-3">
                            {getFilteredModules().map((module, filteredIndex) => {
                                const moduleIndex = course.modules.indexOf(module);
                                return (
                                    <div key={moduleIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                                        {/* Module Header */}
                                        <button
                                            onClick={() => toggleModule(moduleIndex)}
                                            className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                    {moduleIndex + 1}
                                                </span>
                                                <div className="text-left min-w-0">
                                                    <h3 className="font-semibold text-gray-900 truncate">{module.title}</h3>
                                                    <p className="text-sm text-gray-600">
                                                        {module.lessons?.length || 0} lessons
                                                        {module.moduleAssessment?.questions?.length > 0 &&
                                                            ` • ${module.moduleAssessment.questions.length} assessment questions`
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <Icons.ChevronDown
                                                className={`w-5 h-5 text-gray-600 transition-transform flex-shrink-0 ${expandedModules.includes(moduleIndex) ? 'rotate-180' : ''
                                                    }`}
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
                                                                                    className={`w-4 h-4 text-gray-600 transition-transform flex-shrink-0 ${expandedLessons.includes(lessonKey) ? 'rotate-180' : ''
                                                                                        }`}
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
                                                {module.moduleAssessment && (
                                                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                                                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                            <Icons.FileCheck className="w-4 h-4 text-purple-600" />
                                                            Module Assessment
                                                        </h4>
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-4 text-sm flex-wrap">
                                                                <span className="text-gray-700">
                                                                    <strong>Title:</strong> {module.moduleAssessment.title || 'Module Assessment'}
                                                                </span>
                                                                <span className="text-gray-700">
                                                                    <strong>Passing Score:</strong> {module.moduleAssessment.passingScore || 70}%
                                                                </span>
                                                                <span className="text-gray-700">
                                                                    <strong>Total Questions:</strong> {module.moduleAssessment.questions?.length || 0}
                                                                </span>
                                                            </div>
                                                            {module.moduleAssessment.questions?.length ? (
                                                                <div className="max-h-80 overflow-y-auto space-y-2">
                                                                    {module.moduleAssessment.questions.map((q, idx) => (
                                                                        <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                                                                            <div className="flex items-start justify-between mb-2">
                                                                                <p className="font-medium text-gray-900 flex-1">
                                                                                    {idx + 1}. {q.text}
                                                                                </p>
                                                                                <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium whitespace-nowrap">
                                                                                    {q.type === 'multiple-choice' ? 'Multiple Choice' : q.type === 'true-false' ? 'True/False' : 'Essay'}
                                                                                </span>
                                                                            </div>

                                                                            {q.type === 'multiple-choice' && q.options && q.options.length > 0 && (
                                                                                <ul className="ml-4 mt-2 space-y-1">
                                                                                    {q.options.map((opt, optIdx) => (
                                                                                        <li
                                                                                            key={optIdx}
                                                                                            className={`text-sm p-2 rounded ${q.correctAnswer === opt
                                                                                                ? 'bg-green-50 text-green-800 font-medium'
                                                                                                : 'text-gray-700'
                                                                                                }`}
                                                                                        >
                                                                                            <div className="flex items-center gap-2">
                                                                                                {String.fromCharCode(65 + optIdx)}. {opt}
                                                                                                {q.correctAnswer === opt && (
                                                                                                    <Icons.CheckCircle className="w-4 h-4 text-green-600" />
                                                                                                )}
                                                                                            </div>
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            )}

                                                                            {q.type === 'true-false' && q.correctAnswer && (
                                                                                <div className="ml-4 mt-2 flex items-center gap-2 text-sm">
                                                                                    <span className="text-gray-700">Correct Answer:</span>
                                                                                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                                                                                        {q.correctAnswer}
                                                                                    </span>
                                                                                </div>
                                                                            )}

                                                                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                                                                                <span><strong>Points:</strong> {q.points || 1}</span>
                                                                            </div>

                                                                            {q.explanation && (
                                                                                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                                                                                    <p className="text-gray-700">
                                                                                        <strong className="text-blue-700">Explanation:</strong> {q.explanation}
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-gray-700">No assessment questions added yet.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
