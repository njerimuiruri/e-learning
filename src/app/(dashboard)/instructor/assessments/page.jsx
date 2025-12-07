'use client';

import React, { useEffect, useMemo, useState } from 'react';
import * as Icons from 'lucide-react';
import courseService from '@/lib/api/courseService';

export default function AssessmentsPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [questionSaving, setQuestionSaving] = useState(false);

    const [newQuestion, setNewQuestion] = useState({
        courseId: '',
        moduleIndex: '',
        text: '',
        type: 'multiple-choice',
        points: 10,
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: '',
    });

    useEffect(() => {
        fetchInstructorCourses();
    }, []);

    const fetchInstructorCourses = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await courseService.getInstructorCourses();
            setCourses(response || []);
        } catch (err) {
            console.error('Error fetching instructor courses', err);
            setError('Unable to load your assessments. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const assessments = useMemo(() => {
        return courses.flatMap((course) =>
            (course.modules || []).map((module, idx) => ({
                id: `${course._id}-${idx}`,
                courseId: course._id,
                courseTitle: course.title,
                moduleIndex: idx,
                moduleTitle: module.title,
                questions: module.questions || [],
                totalPoints: (module.questions || []).reduce((sum, q) => sum + (q.points || 0), 0),
                status: course.status,
                updatedAt: course.updatedAt,
            }))
        );
    }, [courses]);

    const resetQuestionForm = () => {
        setNewQuestion({
            courseId: '',
            moduleIndex: '',
            text: '',
            type: 'multiple-choice',
            points: 10,
            options: ['', '', '', ''],
            correctAnswer: '',
            explanation: '',
        });
    };

    const handleSaveQuestion = async () => {
        if (!newQuestion.courseId || newQuestion.moduleIndex === '') {
            alert('Select a course and module');
            return;
        }

        if (!newQuestion.text) {
            alert('Question text is required');
            return;
        }

        if (newQuestion.type === 'multiple-choice' && (!newQuestion.correctAnswer || newQuestion.options.some((o) => !o))) {
            alert('Provide all options and select the correct answer');
            return;
        }

        const course = courses.find((c) => c._id === newQuestion.courseId);
        if (!course) return;

        const modules = [...(course.modules || [])];
        const moduleIdx = Number(newQuestion.moduleIndex);
        const targetModule = modules[moduleIdx];

        if (!targetModule) {
            alert('Module not found');
            return;
        }

        const payloadQuestion = {
            text: newQuestion.text,
            type: newQuestion.type,
            points: Number(newQuestion.points) || 0,
            options: newQuestion.type === 'multiple-choice' ? newQuestion.options : undefined,
            correctAnswer: newQuestion.type === 'multiple-choice' ? newQuestion.correctAnswer : newQuestion.type === 'true-false' ? newQuestion.correctAnswer || 'true' : undefined,
            explanation: newQuestion.explanation || undefined,
        };

        const updatedModule = {
            ...targetModule,
            questions: [...(targetModule.questions || []), payloadQuestion],
        };

        modules[moduleIdx] = updatedModule;

        try {
            setQuestionSaving(true);
            await courseService.updateCourse(course._id, { modules });
            await fetchInstructorCourses();
            setShowCreateModal(false);
            resetQuestionForm();
        } catch (err) {
            console.error('Error saving question', err);
            alert(err?.response?.data?.message || 'Failed to save question');
        } finally {
            setQuestionSaving(false);
        }
    };

    const courseOptions = courses.map((course) => ({ value: course._id, label: course.title, modules: course.modules || [] }));
    const selectedCourse = courseOptions.find((c) => c.value === newQuestion.courseId);
    const selectedModules = selectedCourse?.modules || [];

    const handleOptionChange = (index, value) => {
        const nextOptions = [...newQuestion.options];
        nextOptions[index] = value;
        setNewQuestion({ ...newQuestion, options: nextOptions });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 pt-20 p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#16a34a] to-emerald-700 bg-clip-text text-transparent mb-2">
                            Assessments & Quizzes
                        </h1>
                        <p className="text-gray-600">Create and manage course assessments</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-2 bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center gap-2"
                    >
                        <Icons.Plus className="w-4 h-4" />
                        Create Assessment
                    </button>
                </div>

                {/* Assessments List */}
                <div className="grid gap-4">
                    {loading && (
                        <div className="flex items-center justify-center py-10">
                            <Icons.Loader className="w-6 h-6 animate-spin text-emerald-600" />
                        </div>
                    )}

                    {error && !loading && (
                        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-4">
                            {error}
                        </div>
                    )}

                    {!loading && !error && assessments.length === 0 && (
                        <div className="bg-white border border-dashed border-emerald-200 rounded-xl p-8 text-center text-gray-600">
                            <p>No assessments found. Create a course and add questions to its modules.</p>
                        </div>
                    )}

                    {!loading && !error && assessments.map((assessment) => (
                        <div key={assessment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 text-lg mb-2">{assessment.moduleTitle}</h3>
                                    <p className="text-sm text-gray-600 mb-4">Course: {assessment.courseTitle}</p>
                                    <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                                        <span className="flex items-center gap-2">
                                            <Icons.HelpCircle className="w-4 h-4 text-emerald-600" />
                                            {assessment.questions.length} questions
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <Icons.Target className="w-4 h-4 text-emerald-600" />
                                            {assessment.totalPoints} points
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <Icons.BadgeCheck className="w-4 h-4 text-emerald-600" />
                                            Status: {assessment.status}
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <Icons.Clock className="w-4 h-4 text-emerald-600" />
                                            Updated {new Date(assessment.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedAssessment(assessment);
                                            setShowDetailModal(true);
                                        }}
                                        className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
                                    >
                                        View Questions
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Create Assessment Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Add Question to Module</h2>
                                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <Icons.X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                                        <select
                                            value={newQuestion.courseId}
                                            onChange={(e) => setNewQuestion({ ...newQuestion, courseId: e.target.value, moduleIndex: '' })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="">Select course</option>
                                            {courseOptions.map((course) => (
                                                <option key={course.value} value={course.value}>{course.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Module</label>
                                        <select
                                            value={newQuestion.moduleIndex}
                                            onChange={(e) => setNewQuestion({ ...newQuestion, moduleIndex: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            disabled={!selectedModules.length}
                                        >
                                            <option value="">Select module</option>
                                            {selectedModules.map((module, idx) => (
                                                <option key={`${selectedCourse?.value}-${idx}`} value={idx}>{module.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                                    <textarea
                                        value={newQuestion.text}
                                        onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                                        placeholder="Enter your question..."
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
                                        <select
                                            value={newQuestion.type}
                                            onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="multiple-choice">Multiple Choice</option>
                                            <option value="true-false">True/False</option>
                                            <option value="essay">Essay</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
                                        <input
                                            type="number"
                                            value={newQuestion.points}
                                            onChange={(e) => setNewQuestion({ ...newQuestion, points: e.target.value })}
                                            min="1"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>

                                {newQuestion.type === 'multiple-choice' && (
                                    <div className="space-y-3">
                                        <label className="block text-sm font-medium text-gray-700">Answer Options</label>
                                        {newQuestion.options.map((option, idx) => (
                                            <div key={idx} className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="correctAnswer"
                                                    checked={newQuestion.correctAnswer === option}
                                                    onChange={() => setNewQuestion({ ...newQuestion, correctAnswer: option })}
                                                    className="w-4 h-4 text-emerald-600"
                                                />
                                                <input
                                                    type="text"
                                                    value={option}
                                                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                                                    placeholder={`Option ${idx + 1}`}
                                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                                />
                                            </div>
                                        ))}
                                        <p className="text-xs text-gray-500">Select the radio button to mark the correct answer</p>
                                    </div>
                                )}

                                {newQuestion.type === 'true-false' && (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Correct Answer</label>
                                        <div className="flex gap-4">
                                            {['true', 'false'].map((val) => (
                                                <label key={val} className="flex items-center gap-2 text-sm text-gray-700">
                                                    <input
                                                        type="radio"
                                                        name="tf"
                                                        checked={newQuestion.correctAnswer === val}
                                                        onChange={() => setNewQuestion({ ...newQuestion, correctAnswer: val })}
                                                    />
                                                    {val === 'true' ? 'True' : 'False'}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Explanation (optional)</label>
                                    <textarea
                                        value={newQuestion.explanation}
                                        onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                                        placeholder="Why is this the right answer?"
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-6 border-t">
                                    <button
                                        onClick={() => {
                                            resetQuestionForm();
                                            setShowCreateModal(false);
                                        }}
                                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveQuestion}
                                        disabled={questionSaving}
                                        className="px-6 py-2 bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {questionSaving && <Icons.Loader className="w-4 h-4 animate-spin" />}
                                        Save Question
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showDetailModal && selectedAssessment && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">{selectedAssessment.moduleTitle}</h2>
                                <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <Icons.X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {selectedAssessment.questions.length === 0 && (
                                    <p className="text-gray-600">No questions added yet.</p>
                                )}

                                {selectedAssessment.questions.map((q, idx) => (
                                    <div key={`${selectedAssessment.id}-${idx}`} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-semibold text-gray-900">{idx + 1}. {q.text}</p>
                                                <p className="text-xs text-gray-500 mt-1">Type: {q.type} • {q.points} pts</p>
                                                {q.explanation && (
                                                    <p className="text-sm text-gray-600 mt-2">Explanation: {q.explanation}</p>
                                                )}
                                            </div>
                                        </div>
                                        {q.options && q.options.length > 0 && (
                                            <div className="mt-3 space-y-1 text-sm text-gray-700">
                                                {q.options.map((opt, optIdx) => (
                                                    <div key={`${selectedAssessment.id}-${idx}-opt-${optIdx}`} className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${q.correctAnswer === opt ? 'bg-emerald-600' : 'bg-gray-300'}`}></span>
                                                        <span>{opt}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
