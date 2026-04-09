'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

    // Auto-select course when `?course=` is present in URL
    const searchParams = useSearchParams();

    const fetchInstructorCourses = async () => {
        try {
            setLoading(true);
            const response = await courseService.getInstructorCourses();
            setCourses(response || []);
            const courseParam = searchParams?.get?.('course');
            if (courseParam) {
                const found = (response || []).find(c => c._id === courseParam || String(c._id) === courseParam);
                if (found) {
                    setSelectedCourse(found);
                    fetchSubmissions(found._id);
                }
            }
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
                                        Student: {selectedSubmission.studentName || 'Student'} | Auto-graded: {selectedSubmission.autoGradedScore || 0}%
                                    </p>
                                </div>
                                <button
                                    onClick={() => setReviewModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <Icons.X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Essays Grading Summary */}
                            {selectedSubmission.answers?.some((a, idx) => {
                                const q = selectedSubmission.questions?.[idx];
                                return (a?.questionType === 'essay' || a?.requiresManualGrading || q?.type === 'essay');
                            }) && (
                                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200 p-6">
                                        <div className="mb-4">
                                            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                                                <Icons.CheckSquare className="w-5 h-5 text-purple-600" />
                                                Essay Questions Grading Checklist
                                            </h3>
                                            <p className="text-sm text-gray-600">Complete grading for all essay questions below</p>
                                        </div>
                                        <div className="space-y-2">
                                            {selectedSubmission.answers?.map((answer, idx) => {
                                                const question = selectedSubmission.questions?.[idx];
                                                const answerType = answer?.questionType || question?.type;
                                                const isEssay = answerType === 'essay' || answer?.requiresManualGrading;

                                                if (!isEssay) return null;

                                                const isGraded = feedback[idx]?.isCorrect !== null && feedback[idx]?.isCorrect !== undefined;

                                                return (
                                                    <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg ${isGraded ? 'bg-green-100 border border-green-300' : 'bg-white border border-amber-200'}`}>
                                                        {isGraded ? (
                                                            <>
                                                                <Icons.CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-semibold text-gray-900">Question {idx + 1}</p>
                                                                    <p className="text-xs text-gray-600">{feedback[idx]?.isCorrect ? '✓ Marked as Correct' : '✗ Marked as Incorrect'}</p>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Icons.Circle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-semibold text-gray-900">Question {idx + 1}</p>
                                                                    <p className="text-xs text-amber-600">Pending grading...</p>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

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
                                            className={`border-2 rounded-lg p-6 ${isEssay
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
                                            <div className="flex items-start justify-between mb-4 gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                                                        <span className="text-sm font-semibold text-gray-700 bg-white px-3 py-1 rounded-full flex-shrink-0">
                                                            Question {idx + 1}
                                                        </span>
                                                        {isEssay ? (
                                                            <span className="text-xs px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold flex-shrink-0">
                                                                ✏️ Essay Question
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs px-2 py-1 bg-gray-200 rounded flex-shrink-0">
                                                                {answerType}
                                                            </span>
                                                        )}
                                                        {isEssay && answer?.gradedAt && (
                                                            <span className={`text-xs px-3 py-1 rounded-full font-semibold flex-shrink-0 ${answer?.isCorrect
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-red-100 text-red-700'
                                                                }`}>
                                                                {answer?.isCorrect ? '✓ Graded as Correct' : '✗ Graded as Incorrect'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="font-bold text-gray-900 mb-3 text-lg break-words whitespace-normal">
                                                        {question.text}
                                                    </p>
                                                </div>
                                                {isAutoGraded && (
                                                    answer?.isCorrect ? (
                                                        <Icons.CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                                                    ) : (
                                                        <Icons.XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                                                    )
                                                )}
                                            </div>

                                            <div className={`rounded-lg p-4 mb-4 ${isEssay ? 'bg-white border-2 border-purple-200' : 'bg-white'}`}>
                                                <p className="text-sm text-gray-600 font-semibold mb-2">
                                                    📝 Student Answer:
                                                </p>
                                                <div className={`text-gray-900 whitespace-pre-wrap break-words p-3 rounded overflow-x-auto ${isEssay ? 'bg-purple-50 border border-purple-100 min-h-[150px] max-h-[400px] overflow-y-auto' : 'bg-gray-50 max-h-[200px] overflow-y-auto'}`}>
                                                    {studentAnswer || '(Not answered)'}
                                                </div>
                                            </div>

                                            {isAutoGraded && question.correctAnswer && (
                                                <div className="bg-white rounded-lg p-3">
                                                    <p className="text-sm text-gray-600 font-semibold mb-1">
                                                        Correct Answer:
                                                    </p>
                                                    <p className="text-green-700 font-semibold break-words whitespace-normal">
                                                        {question.correctAnswer}
                                                    </p>
                                                </div>
                                            )}

                                            {answer?.instructorFeedback && (
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                                                    <p className="text-sm text-blue-700 font-semibold mb-1">
                                                        Previous Feedback:
                                                    </p>
                                                    <p className="text-blue-900 break-words whitespace-normal">{answer.instructorFeedback}</p>
                                                </div>
                                            )}

                                            {isEssay && (
                                                <div className="mt-6 space-y-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-5 border-2 border-purple-200">
                                                    <div className="border-b border-purple-200 pb-3">
                                                        <p className="text-sm font-bold text-purple-900 mb-1">
                                                            ⭐ Grade This Essay
                                                        </p>
                                                        <p className="text-xs text-purple-700">
                                                            Review the student's answer and determine if it meets the expected criteria
                                                        </p>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <p className="text-sm font-bold text-gray-900">
                                                            Is this answer correct?
                                                        </p>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-lg border-2 transition ${feedback[idx]?.isCorrect === true
                                                                ? 'border-green-500 bg-green-100'
                                                                : 'border-gray-300 bg-white hover:border-green-300'
                                                                }`}>
                                                                <input
                                                                    type="radio"
                                                                    name={`grade-${idx}`}
                                                                    checked={feedback[idx]?.isCorrect === true}
                                                                    onChange={() =>
                                                                        updateFeedback(idx, 'isCorrect', true)
                                                                    }
                                                                    className="w-5 h-5 text-green-600"
                                                                />
                                                                <span className={`font-bold ${feedback[idx]?.isCorrect === true ? 'text-green-700' : 'text-gray-700'}`}>
                                                                    ✓ Correct
                                                                </span>
                                                            </label>
                                                            <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-lg border-2 transition ${feedback[idx]?.isCorrect === false
                                                                ? 'border-red-500 bg-red-100'
                                                                : 'border-gray-300 bg-white hover:border-red-300'
                                                                }`}>
                                                                <input
                                                                    type="radio"
                                                                    name={`grade-${idx}`}
                                                                    checked={feedback[idx]?.isCorrect === false}
                                                                    onChange={() =>
                                                                        updateFeedback(idx, 'isCorrect', false)
                                                                    }
                                                                    className="w-5 h-5 text-red-600"
                                                                />
                                                                <span className={`font-bold ${feedback[idx]?.isCorrect === false ? 'text-red-700' : 'text-gray-700'}`}>
                                                                    ✗ Incorrect
                                                                </span>
                                                            </label>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-900 mb-2">
                                                            💬 Feedback to Student (Optional)
                                                        </label>
                                                        <p className="text-xs text-gray-600 mb-2">
                                                            Provide constructive feedback about their answer
                                                        </p>
                                                        <textarea
                                                            value={feedback[idx]?.feedback || ''}
                                                            onChange={(e) =>
                                                                updateFeedback(idx, 'feedback', e.target.value)
                                                            }
                                                            placeholder="Example: Great effort! Your explanation of the concept is clear, but you missed mentioning... Consider reviewing the section on..."
                                                            rows={4}
                                                            className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium text-gray-900"
                                                        />
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {feedback[idx]?.feedback?.length || 0} characters
                                                        </p>
                                                    </div>

                                                    {answer?.instructorFeedback && (
                                                        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                                                            <p className="text-xs font-bold text-blue-700 mb-1">
                                                                📌 Previous Feedback:
                                                            </p>
                                                            <p className="text-sm text-blue-900">{answer.instructorFeedback}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-blue-50 border-t-2 border-gray-200 p-6">
                                <div className="mb-4">
                                    {(() => {
                                        const essayQuestions = selectedSubmission.answers?.filter((a, idx) => {
                                            const q = selectedSubmission.questions?.[idx];
                                            return a?.questionType === 'essay' || a?.requiresManualGrading || q?.type === 'essay';
                                        }) || [];

                                        const gradedCount = essayQuestions.filter((_, idx) => {
                                            const actualIdx = selectedSubmission.answers.findIndex((a, i) => {
                                                const q = selectedSubmission.questions?.[i];
                                                return i >= 0 && (a?.questionType === 'essay' || a?.requiresManualGrading || q?.type === 'essay') &&
                                                    selectedSubmission.answers.indexOf(a) - selectedSubmission.answers.filter((x, j) => {
                                                        const qx = selectedSubmission.questions?.[j];
                                                        return j < i && (x?.questionType === 'essay' || x?.requiresManualGrading || qx?.type === 'essay');
                                                    }).length === essayQuestions.indexOf(a);
                                            });
                                            return feedback[idx]?.isCorrect !== null && feedback[idx]?.isCorrect !== undefined;
                                        }).length;

                                        const allGraded = essayQuestions.length === 0 || essayQuestions.every((_, idx) => {
                                            const actualQuestionIdx = selectedSubmission.answers.indexOf(selectedSubmission.answers.filter((a, i) => {
                                                const q = selectedSubmission.questions?.[i];
                                                return (a?.questionType === 'essay' || a?.requiresManualGrading || q?.type === 'essay');
                                            })[idx]);
                                            return feedback[actualQuestionIdx]?.isCorrect !== null && feedback[actualQuestionIdx]?.isCorrect !== undefined;
                                        });

                                        return (
                                            <div className={`p-3 rounded-lg border-l-4 ${allGraded ? 'bg-green-50 border-green-400' : 'bg-yellow-50 border-yellow-400'}`}>
                                                <p className={`text-sm font-bold ${allGraded ? 'text-green-700' : 'text-yellow-700'}`}>
                                                    {allGraded ? '✓ All essays graded' : `⏳ ${essayQuestions.length} essay${essayQuestions.length !== 1 ? 's' : ''} need grading`}
                                                </p>
                                            </div>
                                        );
                                    })()}
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setReviewModal(false)}
                                        className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveReview}
                                        disabled={saving}
                                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 font-semibold flex items-center gap-2 transition"
                                    >
                                        {saving && <Icons.Loader className="w-4 h-4 animate-spin" />}
                                        <Icons.Save className="w-4 h-4" />
                                        Save Review & Update Status
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
