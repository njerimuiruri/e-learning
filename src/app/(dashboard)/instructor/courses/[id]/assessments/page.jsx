'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import * as Icons from 'lucide-react';
import courseService from '@/lib/api/courseService';

export default function CourseAssessmentsPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = params.id;

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('final');
    const [selectedModule, setSelectedModule] = useState(null);

    // Final Assessment State
    const [finalAssessment, setFinalAssessment] = useState({
        title: 'Final Assessment',
        description: '',
        passingScore: 70,
        questions: []
    });

    // Current Question Form
    const [currentQuestion, setCurrentQuestion] = useState({
        text: '',
        type: 'multiple-choice',
        points: 1,
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: ''
    });

    useEffect(() => {
        fetchCourse();
    }, [courseId]);

    const fetchCourse = async () => {
        try {
            setLoading(true);
            const data = await courseService.getInstructorCourseById(courseId);
            setCourse(data);

            if (data.finalAssessment) {
                setFinalAssessment(data.finalAssessment);
            }
        } catch (error) {
            console.error('Error fetching course:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddQuestion = () => {
        if (!currentQuestion.text.trim()) {
            alert('Please enter question text');
            return;
        }

        if (currentQuestion.type === 'multiple-choice') {
            if (!currentQuestion.options.some(opt => opt.trim())) {
                alert('Please add at least one option');
                return;
            }
            if (!currentQuestion.correctAnswer) {
                alert('Please select the correct answer');
                return;
            }
        }

        if (activeTab === 'final') {
            setFinalAssessment(prev => ({
                ...prev,
                questions: [...prev.questions, { ...currentQuestion, id: Date.now() }]
            }));
        }

        // Reset form
        setCurrentQuestion({
            text: '',
            type: 'multiple-choice',
            points: 1,
            options: ['', '', '', ''],
            correctAnswer: '',
            explanation: ''
        });
    };

    const handleRemoveQuestion = (questionId) => {
        if (activeTab === 'final') {
            setFinalAssessment(prev => ({
                ...prev,
                questions: prev.questions.filter(q => q.id !== questionId)
            }));
        }
    };

    const handleSaveAssessment = async () => {
        if (!course) return;

        setSaving(true);
        try {
            const updateData = {
                finalAssessment: finalAssessment
            };

            await courseService.updateCourse(courseId, updateData);
            alert('Assessment saved successfully!');
        } catch (error) {
            console.error('Error saving assessment:', error);
            alert('Failed to save assessment. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 pt-20 p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading assessments...</p>
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
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.push(`/instructor/courses/${courseId}`)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <Icons.ChevronLeft className="w-5 h-5" />
                        Back to Course
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Manage Assessments</h1>
                    <p className="text-gray-600 mt-2">{course.title}</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('final')}
                        className={`px-4 py-2 font-medium transition-colors ${activeTab === 'final'
                                ? 'text-emerald-600 border-b-2 border-emerald-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <Icons.Award className="w-4 h-4 inline mr-2" />
                        Final Assessment
                    </button>
                    <button
                        onClick={() => setActiveTab('module')}
                        className={`px-4 py-2 font-medium transition-colors ${activeTab === 'module'
                                ? 'text-emerald-600 border-b-2 border-emerald-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <Icons.FileCheck className="w-4 h-4 inline mr-2" />
                        Module Assessments
                    </button>
                </div>

                {/* Final Assessment Tab */}
                {activeTab === 'final' && (
                    <div className="space-y-6">
                        {/* Assessment Settings */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Final Assessment Settings</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={finalAssessment.title}
                                        onChange={(e) => setFinalAssessment(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Passing Score (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={finalAssessment.passingScore}
                                        onChange={(e) => setFinalAssessment(prev => ({ ...prev, passingScore: parseInt(e.target.value) || 70 }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={finalAssessment.description}
                                        onChange={(e) => setFinalAssessment(prev => ({ ...prev, description: e.target.value }))}
                                        rows="3"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Add Question Form */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Question</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Question Text *</label>
                                    <textarea
                                        value={currentQuestion.text}
                                        onChange={(e) => setCurrentQuestion(prev => ({ ...prev, text: e.target.value }))}
                                        rows="2"
                                        placeholder="Enter your question here"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                                        <select
                                            value={currentQuestion.type}
                                            onChange={(e) => setCurrentQuestion(prev => ({ ...prev, type: e.target.value, options: e.target.value === 'multiple-choice' ? ['', '', '', ''] : [] }))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        >
                                            <option value="multiple-choice">Multiple Choice</option>
                                            <option value="true-false">True/False</option>
                                            <option value="essay">Essay</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={currentQuestion.points}
                                            onChange={(e) => setCurrentQuestion(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Multiple Choice Options */}
                                {currentQuestion.type === 'multiple-choice' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Options *</label>
                                        <div className="space-y-2">
                                            {currentQuestion.options.map((option, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                                        value={option}
                                                        onChange={(e) => {
                                                            const newOptions = [...currentQuestion.options];
                                                            newOptions[idx] = e.target.value;
                                                            setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
                                                        }}
                                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                                    />
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="correctAnswer"
                                                            checked={currentQuestion.correctAnswer === option}
                                                            onChange={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: option }))}
                                                            className="w-4 h-4"
                                                        />
                                                        <span className="text-sm">Correct</span>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* True/False */}
                                {currentQuestion.type === 'true-false' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer *</label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="tfAnswer"
                                                    checked={currentQuestion.correctAnswer === 'True'}
                                                    onChange={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: 'True' }))}
                                                />
                                                <span>True</span>
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="tfAnswer"
                                                    checked={currentQuestion.correctAnswer === 'False'}
                                                    onChange={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: 'False' }))}
                                                />
                                                <span>False</span>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {/* Explanation */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Explanation (Optional)</label>
                                    <textarea
                                        value={currentQuestion.explanation}
                                        onChange={(e) => setCurrentQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                                        rows="2"
                                        placeholder="Explain the correct answer"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>

                                <button
                                    onClick={handleAddQuestion}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                >
                                    <Icons.Plus className="w-4 h-4 inline mr-2" />
                                    Add Question
                                </button>
                            </div>
                        </div>

                        {/* Questions List */}
                        {finalAssessment.questions.length > 0 && (
                            <div className="bg-white rounded-xl p-6 border border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">
                                    Questions ({finalAssessment.questions.length})
                                </h2>
                                <div className="space-y-4">
                                    {finalAssessment.questions.map((q, idx) => (
                                        <div key={q.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">{idx + 1}. {q.text}</p>
                                                    <div className="flex gap-2 mt-2">
                                                        <span className="px-2 py-1 text-xs rounded bg-emerald-100 text-emerald-700">
                                                            {q.type === 'multiple-choice' ? 'Multiple Choice' : q.type === 'true-false' ? 'True/False' : 'Essay'}
                                                        </span>
                                                        <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">{q.points} point{q.points !== 1 ? 's' : ''}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveQuestion(q.id)}
                                                    className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors"
                                                >
                                                    <Icons.Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Save Button */}
                        <div className="flex gap-4">
                            <button
                                onClick={handleSaveAssessment}
                                disabled={saving}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Assessment'}
                            </button>
                            <button
                                onClick={() => router.push(`/instructor/courses/${courseId}`)}
                                className="flex-1 border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Module Assessments Tab */}
                {activeTab === 'module' && (
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <p className="text-gray-600">Module assessments management coming soon</p>
                    </div>
                )}
            </div>
        </div>
    );
}
