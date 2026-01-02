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
    const [activeTab, setActiveTab] = useState('module');
    const [selectedModuleIdx, setSelectedModuleIdx] = useState(null);
    const [showModuleForm, setShowModuleForm] = useState(false);

    // Module Assessment State
    const [moduleAssessments, setModuleAssessments] = useState({});
    const [currentModuleAssessment, setCurrentModuleAssessment] = useState({
        title: '',
        description: '',
        passingScore: 70,
        questions: []
    });

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

    const [activeQuestionTab, setActiveQuestionTab] = useState('final');

    useEffect(() => {
        fetchCourse();
    }, [courseId]);

    // Determine which tab should be active by default
    useEffect(() => {
        if (course && !loading) {
            const hasModuleAssessments = course.modules?.some(m => m.moduleAssessment && m.moduleAssessment.questions?.length > 0);
            // Default to module tab if modules have assessments, otherwise final
            if (hasModuleAssessments) {
                setActiveTab('module');
                setSelectedModuleIdx(0);
            } else {
                setActiveTab('final');
            }
        }
    }, [course, loading]);

    const fetchCourse = async () => {
        try {
            setLoading(true);
            const data = await courseService.getInstructorCourseById(courseId);
            setCourse(data);

            // Initialize module assessments from course data
            if (data.modules) {
                const assessments = {};
                data.modules.forEach((module, idx) => {
                    if (module.moduleAssessment) {
                        assessments[idx] = module.moduleAssessment;
                    }
                });
                setModuleAssessments(assessments);
            }

            if (data.finalAssessment) {
                setFinalAssessment(data.finalAssessment);
            }
        } catch (error) {
            console.error('Error fetching course:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get modules with assessments status
    const getModulesAssessmentStatus = () => {
        if (!course?.modules) return [];
        return course.modules.map((module, idx) => ({
            idx,
            title: module.title,
            hasAssessment: !!(moduleAssessments[idx] && moduleAssessments[idx].questions?.length > 0),
            questionCount: moduleAssessments[idx]?.questions?.length || 0
        }));
    };

    // Determine if there are any module assessments
    const hasAnyModuleAssessments = Object.values(moduleAssessments).some(
        assessment => assessment?.questions?.length > 0
    );

    const handleSelectModule = (idx) => {
        setSelectedModuleIdx(idx);
        if (!moduleAssessments[idx]) {
            setCurrentModuleAssessment({
                title: `${course.modules[idx].title} Assessment`,
                description: '',
                passingScore: 70,
                questions: []
            });
        } else {
            setCurrentModuleAssessment(moduleAssessments[idx]);
        }
        setShowModuleForm(false);
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

        if (activeQuestionTab === 'final') {
            setFinalAssessment(prev => ({
                ...prev,
                questions: [...prev.questions, { ...currentQuestion, id: Date.now() }]
            }));
        } else if (activeQuestionTab === 'module' && selectedModuleIdx !== null) {
            setCurrentModuleAssessment(prev => ({
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
        if (activeQuestionTab === 'final') {
            setFinalAssessment(prev => ({
                ...prev,
                questions: prev.questions.filter(q => q.id !== questionId)
            }));
        } else if (activeQuestionTab === 'module' && selectedModuleIdx !== null) {
            setCurrentModuleAssessment(prev => ({
                ...prev,
                questions: prev.questions.filter(q => q.id !== questionId)
            }));
        }
    };

    const handleSaveModuleAssessment = () => {
        if (selectedModuleIdx === null) return;

        setModuleAssessments(prev => ({
            ...prev,
            [selectedModuleIdx]: { ...currentModuleAssessment }
        }));
    };

    const handleSaveAssessment = async () => {
        if (!course) return;

        setSaving(true);
        try {
            // Prepare update data
            const updateData = {
                finalAssessment: finalAssessment,
                modules: course.modules.map((module, idx) => ({
                    ...module,
                    moduleAssessment: moduleAssessments[idx] || module.moduleAssessment || null
                }))
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

    const modulesStatus = getModulesAssessmentStatus();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 pt-20 p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
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

                {/* Info Banner */}
                {hasAnyModuleAssessments && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
                        <Icons.Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-blue-900">Module Assessments Detected</p>
                            <p className="text-sm text-blue-700 mt-1">
                                {modulesStatus.filter(m => m.hasAssessment).length} of {modulesStatus.length} modules have assessments.
                                Students will take these module assessments before the final assessment.
                            </p>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-gray-200 overflow-x-auto">
                    <button
                        onClick={() => {
                            setActiveTab('module');
                            setActiveQuestionTab('module');
                        }}
                        className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'module'
                            ? 'text-emerald-600 border-b-2 border-emerald-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <Icons.BookOpen className="w-4 h-4 inline mr-2" />
                        Module Assessments ({modulesStatus.filter(m => m.hasAssessment).length})
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('final');
                            setActiveQuestionTab('final');
                        }}
                        className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'final'
                            ? 'text-emerald-600 border-b-2 border-emerald-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <Icons.Award className="w-4 h-4 inline mr-2" />
                        Final Assessment
                    </button>
                </div>

                {/* Module Assessments Tab */}
                {activeTab === 'module' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Module List Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl p-4 border border-gray-200 sticky top-24">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Modules</h2>
                                <div className="space-y-2">
                                    {modulesStatus.map((module) => (
                                        <button
                                            key={module.idx}
                                            onClick={() => handleSelectModule(module.idx)}
                                            className={`w-full text-left p-3 rounded-lg transition-colors border ${selectedModuleIdx === module.idx
                                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">{module.title}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {module.hasAssessment ? (
                                                            <span className="text-emerald-600">
                                                                ✓ {module.questionCount} questions
                                                            </span>
                                                        ) : (
                                                            <span className="text-orange-600">No assessment</span>
                                                        )}
                                                    </p>
                                                </div>
                                                {module.hasAssessment && (
                                                    <Icons.CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-1" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Module Assessment Editor */}
                        <div className="lg:col-span-2 space-y-6">
                            {selectedModuleIdx !== null && (
                                <>
                                    {/* Assessment Settings */}
                                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                                            {course.modules[selectedModuleIdx].title} - Assessment Settings
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                                <input
                                                    type="text"
                                                    value={currentModuleAssessment.title}
                                                    onChange={(e) => setCurrentModuleAssessment(prev => ({ ...prev, title: e.target.value }))}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Passing Score (%)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={currentModuleAssessment.passingScore}
                                                    onChange={(e) => setCurrentModuleAssessment(prev => ({ ...prev, passingScore: parseInt(e.target.value) || 70 }))}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                                <textarea
                                                    value={currentModuleAssessment.description}
                                                    onChange={(e) => setCurrentModuleAssessment(prev => ({ ...prev, description: e.target.value }))}
                                                    rows="3"
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleSaveModuleAssessment}
                                            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                        >
                                            <Icons.Save className="w-4 h-4 inline mr-2" />
                                            Save Module Assessment
                                        </button>
                                    </div>

                                    {/* Add Question Form */}
                                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                                        <h2 className="text-xl font-bold text-gray-900 mb-4">Add Question to This Module</h2>
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
                                                        <option value="essay">Essay</option>
                                                        <option value="true-false">True/False</option>
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

                                            {/* Multiple Choice */}
                                            {currentQuestion.type === 'multiple-choice' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Options *</label>
                                                    <div className="space-y-2">
                                                        {currentQuestion.options.map((option, idx) => (
                                                            <div key={idx} className="flex gap-2 items-center">
                                                                <input
                                                                    type="radio"
                                                                    name="correctAnswer"
                                                                    checked={currentQuestion.correctAnswer === option}
                                                                    onChange={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: option }))}
                                                                    className="w-4 h-4"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={option}
                                                                    onChange={(e) => {
                                                                        const newOptions = [...currentQuestion.options];
                                                                        newOptions[idx] = e.target.value;
                                                                        setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
                                                                    }}
                                                                    placeholder={`Option ${idx + 1}`}
                                                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                                                />
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
                                    {currentModuleAssessment.questions.length > 0 && (
                                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                                Questions ({currentModuleAssessment.questions.length})
                                            </h2>
                                            <div className="space-y-4">
                                                {currentModuleAssessment.questions.map((q, idx) => (
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
                                </>
                            )}

                            {selectedModuleIdx === null && (
                                <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
                                    <Icons.BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">Select a module from the list to create its assessment</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

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
                                            <option value="essay">Essay</option>
                                            <option value="true-false">True/False</option>
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

                                {/* Multiple Choice */}
                                {currentQuestion.type === 'multiple-choice' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Options *</label>
                                        <div className="space-y-2">
                                            {currentQuestion.options.map((option, idx) => (
                                                <div key={idx} className="flex gap-2 items-center">
                                                    <input
                                                        type="radio"
                                                        name="correctAnswer"
                                                        checked={currentQuestion.correctAnswer === option}
                                                        onChange={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: option }))}
                                                        className="w-4 h-4"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={option}
                                                        onChange={(e) => {
                                                            const newOptions = [...currentQuestion.options];
                                                            newOptions[idx] = e.target.value;
                                                            setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
                                                        }}
                                                        placeholder={`Option ${idx + 1}`}
                                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                                    />
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
                                {saving ? 'Saving...' : 'Save All Assessments'}
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
            </div>
        </div>
    );
}
