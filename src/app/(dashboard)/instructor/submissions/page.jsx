'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import courseService from '@/lib/api/courseService';
import { useToast } from '@/components/ui/ToastProvider';

export default function SubmissionsPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reviewModal, setReviewModal] = useState(false);
    const [feedback, setFeedback] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchInstructorCourses();
    }, []);

    const fetchInstructorCourses = async () => {
        try {
            setLoading(true);
            const response = await courseService.getInstructorCourses();
            setCourses(response || []);
        } catch (err) {
            console.error('Error fetching instructor courses', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubmissions = async (courseId) => {
        try {
            setLoading(true);
            console.log('Fetching submissions for course:', courseId);
            const response = await courseService.getCourseSubmissions(courseId);
            console.log('Submissions response:', response);
            setSubmissions(response || []);

            if (!response || response.length === 0) {
                console.log('No submissions found for this course');
            }
        } catch (err) {
            console.error('Error fetching submissions:', err);
            console.error('Error details:', err.response?.data || err.message);
            showToast('Failed to fetch submissions: ' + (err.response?.data?.message || err.message), { type: 'error', title: 'Load failed' });
            setSubmissions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCourseSelect = (course) => {
        setSelectedCourse(course);
        fetchSubmissions(course._id);
    };

    const handleReviewSubmission = (submission) => {
        setSelectedSubmission(submission);
        setReviewModal(true);

        // Initialize feedback state for each essay question
        const initialFeedback = {};
        submission.answers?.forEach((answer, idx) => {
            const question = submission.questions?.[idx];
            const answerType = answer?.questionType || question?.type;

            // Include essay questions that need grading
            if (answerType === 'essay' || answer?.requiresManualGrading) {
                initialFeedback[idx] = {
                    isCorrect: answer.isCorrect ?? null,
                    feedback: answer.instructorFeedback || '',
                };
            }
        });
        setFeedback(initialFeedback);
    };

    const handleSaveReview = async () => {
        if (!selectedSubmission) return;

        try {
            setSaving(true);

            // Calculate final score including essay grades
            const autoGradedQuestions = selectedSubmission.questions.filter(q => q.type !== 'essay');
            const essayQuestions = selectedSubmission.questions.filter(q => q.type === 'essay');

            const autoScore = selectedSubmission.autoGradedScore || 0;
            const autoGradedWeight = autoGradedQuestions.length;
            const essayWeight = essayQuestions.length;

            let essayCorrect = 0;
            Object.values(feedback).forEach(fb => {
                if (fb.isCorrect) essayCorrect++;
            });

            const totalQuestions = autoGradedWeight + essayWeight;
            const essayScore = essayWeight > 0 ? (essayCorrect / essayWeight) * 100 : 0;

            // Weighted average of auto-graded and essay scores
            let finalScore;
            if (totalQuestions > 0) {
                const autoWeight = autoGradedWeight / totalQuestions;
                const esWeight = essayWeight / totalQuestions;
                finalScore = Math.round((autoScore * autoWeight) + (essayScore * esWeight));
            } else {
                finalScore = autoScore;
            }

            const passed = finalScore >= (selectedSubmission.passingScore || 70);

            const reviewData = {
                enrollmentId: selectedSubmission.enrollmentId,
                submissionId: selectedSubmission._id,
                essayFeedback: feedback,
                finalScore,
                passed,
                reviewedAt: new Date().toISOString(),
            };

            // Mock API call - replace with actual endpoint
            await courseService.submitAssessmentReview(reviewData);

            showToast(`Review saved! Final score: ${finalScore}% - ${passed ? 'PASSED' : 'FAILED'}`, { type: 'success', title: 'Review saved' });
            setReviewModal(false);
            fetchSubmissions(selectedCourse._id);
        } catch (err) {
            console.error('Error saving review', err);
            showToast('Failed to save review. Please try again.', { type: 'error', title: 'Save failed' });
        } finally {
            setSaving(false);
        }
    };

    const updateFeedback = (questionIdx, field, value) => {
        setFeedback(prev => ({
            ...prev,
            [questionIdx]: {
                ...prev[questionIdx],
                [field]: value,
            }
        }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 pt-20 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent mb-2">
                        Student Submissions
                    </h1>
                    <p className="text-gray-600">Review and grade student final assessment submissions</p>
                </div>

                {/* Course Selection */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="font-bold text-gray-900 mb-4">Select Course</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {loading && courses.length === 0 ? (
                            <div className="col-span-full flex justify-center py-8">
                                <Icons.Loader className="w-6 h-6 animate-spin text-blue-600" />
                            </div>
                        ) : courses.length === 0 ? (
                            <p className="col-span-full text-gray-600">No courses found.</p>
                        ) : (
                            courses.map((course) => (
                                <button
                                    key={course._id}
                                    onClick={() => handleCourseSelect(course)}
                                    className={`text-left p-4 border-2 rounded-lg transition-all ${selectedCourse?._id === course._id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <h3 className="font-semibold text-gray-900 mb-1">{course.title}</h3>
                                    <p className="text-sm text-gray-600">{course.category}</p>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Submissions List */}
                {selectedCourse && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="font-bold text-gray-900 mb-4">
                            Submissions for {selectedCourse.title}
                        </h2>

                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Icons.Loader className="w-6 h-6 animate-spin text-blue-600" />
                            </div>
                        ) : submissions.length === 0 ? (
                            <div className="text-center py-8 text-gray-600">
                                <Icons.FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>No submissions yet for this course.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {submissions.map((submission) => (
                                    <div
                                        key={submission._id}
                                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900">
                                                    {submission.studentName || 'Student'}
                                                </h3>
                                                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                                                    <span className="flex items-center gap-1">
                                                        <Icons.Calendar className="w-4 h-4" />
                                                        {new Date(submission.submittedAt).toLocaleDateString()}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Icons.Target className="w-4 h-4" />
                                                        Auto-graded: {submission.autoGradedScore || 0}%
                                                    </span>
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs font-semibold ${submission.status === 'reviewed'
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-amber-100 text-amber-700'
                                                            }`}
                                                    >
                                                        {submission.status === 'reviewed' ? 'Reviewed' : 'Pending Review'}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleReviewSubmission(submission)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                                            >
                                                <Icons.Eye className="w-4 h-4" />
                                                Review
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Review Modal */}
                {reviewModal && selectedSubmission && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        Review Submission
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Student: {selectedSubmission.studentName || 'Student'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setReviewModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <Icons.X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {selectedSubmission.answers?.map((answer, idx) => {
                                    const question = selectedSubmission.questions?.[idx];
                                    if (!question) return null;

                                    const answerType = answer?.questionType || question.type || 'multiple-choice';
                                    const isEssay = answerType === 'essay' || answer?.requiresManualGrading;
                                    const isAutoGraded = !isEssay;
                                    const studentAnswer = answer?.value || answer?.studentAnswer || answer?.userAnswer;

                                    return (
                                        <div
                                            key={idx}
                                            className={`border-2 rounded-lg p-4 ${isEssay
                                                    ? answer?.gradedAt
                                                        ? answer?.isCorrect
                                                            ? 'border-green-300 bg-green-50'
                                                            : 'border-red-300 bg-red-50'
                                                        : 'border-amber-300 bg-amber-50'
                                                    : answer?.isCorrect
                                                        ? 'border-green-300 bg-green-50'
                                                        : 'border-red-300 bg-red-50'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-sm font-semibold text-gray-500">
                                                            Question {idx + 1}
                                                        </span>
                                                        <span className="text-xs px-2 py-1 bg-gray-200 rounded">
                                                            {answerType}
                                                        </span>
                                                        {isEssay && answer?.gradedAt && (
                                                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                                                Already Graded
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="font-semibold text-gray-900 mb-3">
                                                        {question.text}
                                                    </p>
                                                </div>
                                                {isAutoGraded && (
                                                    answer?.isCorrect ? (
                                                        <Icons.CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                                                    ) : (
                                                        <Icons.XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                                                    )
                                                )}
                                            </div>

                                            <div className="bg-white rounded-lg p-3 mb-3">
                                                <p className="text-sm text-gray-600 font-semibold mb-1">
                                                    Student Answer:
                                                </p>
                                                <p className="text-gray-900 whitespace-pre-wrap">{studentAnswer || '(Not answered)'}</p>
                                            </div>

                                            {isAutoGraded && question.correctAnswer && (
                                                <div className="bg-white rounded-lg p-3">
                                                    <p className="text-sm text-gray-600 font-semibold mb-1">
                                                        Correct Answer:
                                                    </p>
                                                    <p className="text-green-700 font-semibold">
                                                        {question.correctAnswer}
                                                    </p>
                                                </div>
                                            )}

                                            {answer?.instructorFeedback && (
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                                                    <p className="text-sm text-blue-700 font-semibold mb-1">
                                                        Previous Feedback:
                                                    </p>
                                                    <p className="text-blue-900">{answer.instructorFeedback}</p>
                                                </div>
                                            )}

                                            {isEssay && (
                                                <div className="mt-4 space-y-4 bg-white rounded-lg p-4">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700 mb-2">
                                                            Grade this answer:
                                                        </p>
                                                        <div className="flex gap-4">
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="radio"
                                                                    name={`grade-${idx}`}
                                                                    checked={feedback[idx]?.isCorrect === true}
                                                                    onChange={() =>
                                                                        updateFeedback(idx, 'isCorrect', true)
                                                                    }
                                                                    className="w-4 h-4 text-green-600"
                                                                />
                                                                <span className="text-green-700 font-semibold">
                                                                    Correct
                                                                </span>
                                                            </label>
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="radio"
                                                                    name={`grade-${idx}`}
                                                                    checked={feedback[idx]?.isCorrect === false}
                                                                    onChange={() =>
                                                                        updateFeedback(idx, 'isCorrect', false)
                                                                    }
                                                                    className="w-4 h-4 text-red-600"
                                                                />
                                                                <span className="text-red-700 font-semibold">
                                                                    Incorrect
                                                                </span>
                                                            </label>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                            Feedback (Optional):
                                                        </label>
                                                        <textarea
                                                            value={feedback[idx]?.feedback || ''}
                                                            onChange={(e) =>
                                                                updateFeedback(idx, 'feedback', e.target.value)
                                                            }
                                                            placeholder="Provide feedback to the student..."
                                                            rows={3}
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-3">
                                <button
                                    onClick={() => setReviewModal(false)}
                                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveReview}
                                    disabled={saving}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving && <Icons.Loader className="w-4 h-4 animate-spin" />}
                                    Save Review & Update Status
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
