'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import moduleService from '@/lib/api/moduleService';
import categoryService from '@/lib/api/categoryService';
import InstructorSidebar from '@/components/instructor/InstructorSidebar';
import RichTextEditor from '@/components/ui/RichTextEditor';
import VideoUploader from '@/components/ui/VideoUploader';
import ResourceUploader from '@/components/ui/ResourceUploader';
import BannerUploader from '@/components/ui/BannerUploader';

// ========== HELPER: Dynamic String List ==========
function DynamicStringList({ label, values, onChange, placeholder }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            {values.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                    <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                            const updated = [...values];
                            updated[index] = e.target.value;
                            onChange(updated);
                        }}
                        placeholder={placeholder}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                        onClick={() => onChange(values.filter((_, i) => i !== index))}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                        <Icons.Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ))}
            <button
                onClick={() => onChange([...values, ''])}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
                + Add Item
            </button>
        </div>
    );
}

// ========== HELPER: Question Form (used in both lesson & final assessment) ==========
function QuestionForm({ question, onChange }) {
    return (
        <div className="space-y-4 p-5 bg-gray-50 rounded-lg border border-gray-200">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Question Text <span className="text-red-500">*</span></label>
                <textarea
                    value={question.text}
                    onChange={(e) => onChange({ ...question, text: e.target.value })}
                    placeholder="Enter your question"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Type <span className="text-red-500">*</span></label>
                    <select
                        value={question.type}
                        onChange={(e) => onChange({ ...question, type: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="true-false">True/False</option>
                        <option value="essay">Essay</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Points <span className="text-red-500">*</span></label>
                    <input
                        type="number"
                        value={question.points}
                        onChange={(e) => onChange({ ...question, points: parseInt(e.target.value) || 0 })}
                        min="1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
            </div>

            {question.type === 'multiple-choice' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Options</label>
                        {(question.options || ['', '', '', '']).map((option, index) => (
                            <input
                                key={index}
                                type="text"
                                value={option}
                                onChange={(e) => {
                                    const updated = [...(question.options || ['', '', '', ''])];
                                    updated[index] = e.target.value;
                                    onChange({ ...question, options: updated });
                                }}
                                placeholder={`Option ${index + 1}`}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 mb-2"
                            />
                        ))}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Correct Answer <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={question.correctAnswer}
                            onChange={(e) => onChange({ ...question, correctAnswer: e.target.value })}
                            placeholder="Enter the correct option text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                </>
            )}

            {question.type === 'true-false' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Correct Answer <span className="text-red-500">*</span></label>
                    <select
                        value={question.correctAnswer}
                        onChange={(e) => onChange({ ...question, correctAnswer: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="">Select answer</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                    </select>
                </div>
            )}

            {question.type === 'essay' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Rubric (optional)</label>
                    <textarea
                        value={question.rubric || ''}
                        onChange={(e) => onChange({ ...question, rubric: e.target.value })}
                        placeholder="Grading rubric for this essay question..."
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Explanation (optional)</label>
                <textarea
                    value={question.explanation}
                    onChange={(e) => onChange({ ...question, explanation: e.target.value })}
                    placeholder="Explain the correct answer"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
            </div>
        </div>
    );
}

// ========== HELPER: Assessment Section (reusable for lesson & final) ==========
function AssessmentSection({ assessment, onChange, title = 'Assessment', minQuestions = 0 }) {
    const [editingQIndex, setEditingQIndex] = useState(null);
    const [currentQ, setCurrentQ] = useState(null);

    const startAddQuestion = () => {
        setCurrentQ({ text: '', type: 'multiple-choice', points: 10, options: ['', '', '', ''], correctAnswer: '', explanation: '', rubric: '' });
        setEditingQIndex(-1); // -1 = new
    };

    const startEditQuestion = (index) => {
        setCurrentQ({ ...assessment.questions[index] });
        setEditingQIndex(index);
    };

    const saveQuestion = () => {
        if (!currentQ.text.trim()) { alert('Question text is required'); return; }
        if (currentQ.type !== 'essay' && !currentQ.correctAnswer) { alert('Please provide the correct answer'); return; }
        const updated = [...assessment.questions];
        if (editingQIndex === -1) {
            updated.push(currentQ);
        } else {
            updated[editingQIndex] = currentQ;
        }
        onChange({ ...assessment, questions: updated });
        setCurrentQ(null);
        setEditingQIndex(null);
    };

    const deleteQuestion = (index) => {
        if (confirm('Delete this question?')) {
            onChange({ ...assessment, questions: assessment.questions.filter((_, i) => i !== index) });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Icons.ClipboardCheck className="w-5 h-5 text-amber-600" />
                    {title}
                </h4>
                {minQuestions > 0 && (
                    <span className="text-xs text-gray-500">Min {minQuestions} questions required</span>
                )}
            </div>

            {/* Assessment Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Passing Score (%)</label>
                    <input
                        type="number"
                        value={assessment.passingScore}
                        onChange={(e) => onChange({ ...assessment, passingScore: parseInt(e.target.value) || 0 })}
                        min="0" max="100"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Attempts</label>
                    <input
                        type="number"
                        value={assessment.maxAttempts}
                        onChange={(e) => onChange({ ...assessment, maxAttempts: parseInt(e.target.value) || 1 })}
                        min="1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                {assessment.timeLimit !== undefined && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Time Limit (min)</label>
                        <input
                            type="number"
                            value={assessment.timeLimit || ''}
                            onChange={(e) => onChange({ ...assessment, timeLimit: e.target.value ? parseInt(e.target.value) : null })}
                            placeholder="No limit"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                )}
            </div>

            {/* Questions List */}
            {assessment.questions.length > 0 && (
                <div className="space-y-2">
                    {assessment.questions.map((q, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="flex-shrink-0 w-7 h-7 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">
                                    Q{idx + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-gray-900 truncate">{q.text}</p>
                                    <div className="flex gap-2 mt-0.5">
                                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">{q.type}</span>
                                        <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded">{q.points} pts</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0 ml-2">
                                <button onClick={() => startEditQuestion(idx)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded">
                                    <Icons.Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => deleteQuestion(idx)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                                    <Icons.Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Question Form */}
            {currentQ ? (
                <div className="space-y-3">
                    <QuestionForm question={currentQ} onChange={setCurrentQ} />
                    <div className="flex gap-3">
                        <button
                            onClick={() => { setCurrentQ(null); setEditingQIndex(null); }}
                            className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={saveQuestion}
                            className="px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700"
                        >
                            {editingQIndex === -1 ? 'Add Question' : 'Update Question'}
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={startAddQuestion}
                    className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-amber-300 text-amber-700 font-medium rounded-lg hover:bg-amber-50 hover:border-amber-400 transition-colors w-full justify-center"
                >
                    <Icons.Plus className="w-5 h-5" /> Add Question
                </button>
            )}
        </div>
    );
}

// ========== MAIN PAGE COMPONENT ==========
export default function CreateModulePage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);

    // Step 1: Module Overview
    const [moduleData, setModuleData] = useState({
        title: '',
        description: '',
        welcomeMessage: '',
        moduleAim: '',
        moduleObjectives: [''],
        learningOutcomes: [''],
        targetAudience: [''],
        categoryId: '',
        level: 'beginner',
        deliveryMode: '',
        duration: '',
        bannerUrl: '',
        prerequisites: [],
    });

    // Step 2: Lessons (with inline assessments)
    const [lessons, setLessons] = useState([]);
    const [editingLessonIndex, setEditingLessonIndex] = useState(null); // null=list view, -1=new, 0+=editing
    const [currentLesson, setCurrentLesson] = useState(null);

    // Step 3: Final Assessment
    const [finalAssessment, setFinalAssessment] = useState({
        title: 'Module Final Assessment',
        description: '',
        questions: [],
        passingScore: 70,
        maxAttempts: 3,
        timeLimit: null,
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const data = await categoryService.getAllCategories();
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const steps = [
        { number: 1, title: 'Module Overview', icon: 'Info' },
        { number: 2, title: 'Lessons', icon: 'BookOpen' },
        { number: 3, title: 'Final Assessment', icon: 'ClipboardCheck' },
        { number: 4, title: 'Review', icon: 'Eye' },
    ];

    const stripHtml = (html) => {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '').trim();
    };

    // Validation
    const validateStep1 = () => {
        if (!moduleData.title.trim()) return 'Module title is required';
        if (!stripHtml(moduleData.description)) return 'Module description is required';
        if (!moduleData.categoryId) return 'Please select a category';
        return null;
    };

    const validateStep2 = () => {
        if (editingLessonIndex !== null) return 'Please save or cancel the current lesson before proceeding';
        if (lessons.length === 0) return 'Add at least one lesson';
        return null;
    };

    const handleNext = () => {
        let error = null;
        if (currentStep === 1) error = validateStep1();
        if (currentStep === 2) error = validateStep2();
        if (error) { alert(error); return; }
        setCurrentStep(currentStep + 1);
    };

    const handlePrevious = () => setCurrentStep(currentStep - 1);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const payload = {
                ...moduleData,
                lessons: lessons.map(l => ({
                    ...l,
                    resources: (l.resources || []).map(r =>
                        typeof r === 'string'
                            ? { url: r, name: r.split('/').pop() || 'Resource', fileType: r.split('.').pop()?.toLowerCase() || '' }
                            : { url: r.url || r, name: r.name || r.originalName || r.url?.split('/').pop() || 'Resource', fileType: r.type || r.fileType || r.url?.split('.').pop()?.toLowerCase() || '' }
                    ),
                })),
                finalAssessment,
                learningOutcomes: moduleData.learningOutcomes.filter(o => o.trim()),
                targetAudience: moduleData.targetAudience.filter(a => a.trim()),
                moduleObjectives: moduleData.moduleObjectives.filter(o => o.trim()),
            };

            const created = await moduleService.createModule(payload);
            const newModuleId = created?._id || created?.id;
            if (newModuleId) {
                router.push(`/instructor/modules/${newModuleId}`);
            } else {
                router.push('/instructor/modules');
            }
        } catch (error) {
            alert('Error creating module: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    // ===== Lesson Functions (full-page editor, not modal) =====
    const startNewLesson = () => {
        setCurrentLesson({
            title: '',
            description: '',
            content: '',
            videoUrl: '',
            duration: '',
            resources: [],
            order: lessons.length,
            assessment: {
                title: '',
                description: '',
                questions: [],
                passingScore: 70,
                maxAttempts: 3,
            },
        });
        setEditingLessonIndex(-1);
    };

    const startEditLesson = (index) => {
        const lesson = lessons[index];
        setCurrentLesson({
            ...lesson,
            assessment: lesson.assessment || {
                title: `${lesson.title} Assessment`,
                description: '',
                questions: [],
                passingScore: 70,
                maxAttempts: 3,
            },
        });
        setEditingLessonIndex(index);
    };

    const saveLesson = () => {
        if (!currentLesson.title.trim()) { alert('Lesson title is required'); return; }

        // Auto-set assessment title if empty
        const lessonToSave = {
            ...currentLesson,
            assessment: {
                ...currentLesson.assessment,
                title: currentLesson.assessment.title || `${currentLesson.title} Assessment`,
            },
        };

        if (editingLessonIndex === -1) {
            setLessons([...lessons, lessonToSave]);
        } else {
            const updated = [...lessons];
            updated[editingLessonIndex] = lessonToSave;
            setLessons(updated);
        }
        setCurrentLesson(null);
        setEditingLessonIndex(null);
    };

    const cancelLessonEdit = () => {
        setCurrentLesson(null);
        setEditingLessonIndex(null);
    };

    const deleteLesson = (index) => {
        if (confirm('Delete this lesson and its assessment?')) {
            setLessons(lessons.filter((_, i) => i !== index));
        }
    };

    // Check if we're in lesson editor mode
    const isEditingLesson = editingLessonIndex !== null && currentLesson !== null;

    return (
        <>
            <InstructorSidebar />
            <div className="lg:ml-4 min-h-screen bg-gray-50">
                <div className="pt-20 lg:pt-4 px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                            <Icons.PlusCircle className="w-8 h-8 text-emerald-600" />
                            Create New Module
                        </h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Create a focused learning module with lessons and assessments
                        </p>
                    </div>

                    {/* Progress Steps */}
                    <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            {steps.map((step, index) => {
                                const IconComponent = Icons[step.icon];
                                const isActive = currentStep === step.number;
                                const isCompleted = currentStep > step.number;
                                return (
                                    <React.Fragment key={step.number}>
                                        <div className="flex flex-col items-center">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isCompleted ? 'bg-emerald-600 text-white'
                                                : isActive ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                                                    : 'bg-gray-200 text-gray-500'
                                                }`}>
                                                {isCompleted ? <Icons.Check className="w-6 h-6" /> : <IconComponent className="w-6 h-6" />}
                                            </div>
                                            <span className={`mt-2 text-xs font-medium ${isActive ? 'text-emerald-600' : 'text-gray-600'}`}>
                                                {step.title}
                                            </span>
                                        </div>
                                        {index < steps.length - 1 && (
                                            <div className={`flex-1 h-1 mx-4 ${isCompleted ? 'bg-emerald-600' : 'bg-gray-200'}`} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    {/* ===== STEP 1: MODULE OVERVIEW ===== */}
                    {currentStep === 1 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Module Overview</h2>
                                    <p className="text-gray-600">Define your module's identity and learning goals</p>
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Module Title <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={moduleData.title}
                                        onChange={(e) => setModuleData({ ...moduleData, title: e.target.value })}
                                        placeholder="e.g., Introduction to Digital Marketing"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Description - WYSIWYG */}
                                <RichTextEditor
                                    label="Description"
                                    required
                                    value={moduleData.description}
                                    onChange={(val) => setModuleData({ ...moduleData, description: val })}
                                    placeholder="What will students learn in this module? Include an overview of topics covered..."
                                    height={180}
                                />

                                {/* Welcome Message - WYSIWYG */}
                                <RichTextEditor
                                    label="Welcome Message"
                                    value={moduleData.welcomeMessage}
                                    onChange={(val) => setModuleData({ ...moduleData, welcomeMessage: val })}
                                    placeholder="A warm welcome message for students enrolling in this module..."
                                    height={120}
                                />

                                {/* Module Aim - WYSIWYG */}
                                <RichTextEditor
                                    label="Module Aim"
                                    value={moduleData.moduleAim}
                                    onChange={(val) => setModuleData({ ...moduleData, moduleAim: val })}
                                    placeholder="The overarching goal of this module..."
                                    height={120}
                                />

                                {/* Category, Level, Delivery Mode, Duration */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Category <span className="text-red-500">*</span></label>
                                        <select
                                            value={moduleData.categoryId}
                                            onChange={(e) => setModuleData({ ...moduleData, categoryId: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map((cat) => (
                                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Level <span className="text-red-500">*</span></label>
                                        <select
                                            value={moduleData.level}
                                            onChange={(e) => setModuleData({ ...moduleData, level: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        >
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="advanced">Advanced</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Mode</label>
                                        <select
                                            value={moduleData.deliveryMode}
                                            onChange={(e) => setModuleData({ ...moduleData, deliveryMode: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        >
                                            <option value="">Select Mode</option>
                                            <option value="Online">Online</option>
                                            <option value="Blended">Blended</option>
                                            <option value="Self-paced">Self-paced</option>
                                            <option value="Instructor-led">Instructor-led</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                                        <input
                                            type="text"
                                            value={moduleData.duration}
                                            onChange={(e) => setModuleData({ ...moduleData, duration: e.target.value })}
                                            placeholder="e.g., 4 weeks"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Category Info Panel */}
                                {moduleData.categoryId && (() => {
                                    const selectedCat = categories.find(c => c._id === moduleData.categoryId);
                                    if (!selectedCat) return null;
                                    const catFields = [
                                        { key: 'courseDescription', label: 'Course Description' },
                                        { key: 'overallObjectives', label: 'Overall Objectives' },
                                        { key: 'learningOutcomes', label: 'Learning Outcomes' },
                                        { key: 'academicStructure', label: 'Academic Structure' },
                                        { key: 'progressionFramework', label: 'Progression & Certification' },
                                        { key: 'fellowshipLevels', label: 'Fellowship Levels' },
                                    ];
                                    const hasContent = catFields.some(f => selectedCat[f.key]?.replace(/<[^>]*>/g, '').trim());
                                    if (!hasContent) return null;
                                    return (
                                        <details className="bg-emerald-50 border border-emerald-200 rounded-lg">
                                            <summary className="px-4 py-3 cursor-pointer text-sm font-semibold text-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors">
                                                View Category Details: {selectedCat.name}
                                            </summary>
                                            <div className="px-4 pb-4 space-y-3">
                                                {catFields.map(f => {
                                                    if (!selectedCat[f.key]?.replace(/<[^>]*>/g, '').trim()) return null;
                                                    return (
                                                        <div key={f.key}>
                                                            <h5 className="text-xs font-semibold text-emerald-700 mb-1">{f.label}</h5>
                                                            <div className="prose prose-sm max-w-none bg-white rounded-lg p-3 border border-emerald-100" dangerouslySetInnerHTML={{ __html: selectedCat[f.key] }} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </details>
                                    );
                                })()}

                                {/* Banner Image */}
                                <BannerUploader
                                    value={moduleData.bannerUrl}
                                    onChange={(url) => setModuleData({ ...moduleData, bannerUrl: url })}
                                />

                                {/* Module Objectives */}
                                <DynamicStringList
                                    label="Module Objectives"
                                    values={moduleData.moduleObjectives}
                                    onChange={(vals) => setModuleData({ ...moduleData, moduleObjectives: vals })}
                                    placeholder="What specific objectives will this module achieve?"
                                />

                                {/* Learning Outcomes */}
                                <DynamicStringList
                                    label="Expected Learning Outcomes"
                                    values={moduleData.learningOutcomes}
                                    onChange={(vals) => setModuleData({ ...moduleData, learningOutcomes: vals })}
                                    placeholder="What will students be able to do after completing this module?"
                                />

                                {/* Target Audience */}
                                <DynamicStringList
                                    label="Target Audience"
                                    values={moduleData.targetAudience}
                                    onChange={(vals) => setModuleData({ ...moduleData, targetAudience: vals })}
                                    placeholder="Who is this module designed for?"
                                />

                                {/* Navigation */}
                                <div className="flex justify-end pt-6 border-t border-gray-200">
                                    <button onClick={handleNext} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                                        Next: Lessons <Icons.ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== STEP 2: LESSONS (FULL PAGE EDITOR) ===== */}
                    {currentStep === 2 && !isEditingLesson && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Module Lessons</h2>
                                        <p className="text-gray-600">Add lessons with rich content, videos, resources, and assessments</p>
                                    </div>
                                    <button onClick={startNewLesson} className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 shadow-sm">
                                        <Icons.Plus className="w-5 h-5" /> Add Lesson
                                    </button>
                                </div>

                                {lessons.length === 0 ? (
                                    <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                        <Icons.BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No lessons yet</h3>
                                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                            Each lesson includes content, optional video, resources, and an assessment.
                                        </p>
                                        <button onClick={startNewLesson} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700">
                                            <Icons.Plus className="w-5 h-5" /> Add Your First Lesson
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {lessons.map((lesson, index) => (
                                            <div key={index} className="border border-gray-200 rounded-lg p-5 hover:border-emerald-300 hover:shadow-sm transition-all">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold">
                                                                {index + 1}
                                                            </span>
                                                            <h3 className="text-lg font-semibold text-gray-900">{lesson.title}</h3>
                                                        </div>
                                                        {lesson.description && (
                                                            <p className="text-sm text-gray-600 ml-11 mb-2">{lesson.description}</p>
                                                        )}
                                                        <div className="flex flex-wrap items-center gap-3 ml-11 text-xs">
                                                            {lesson.videoUrl && (
                                                                <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
                                                                    <Icons.Video className="w-3.5 h-3.5" /> Video
                                                                </span>
                                                            )}
                                                            {lesson.duration && (
                                                                <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                                                                    <Icons.Clock className="w-3.5 h-3.5" /> {lesson.duration}
                                                                </span>
                                                            )}
                                                            {stripHtml(lesson.content) && (
                                                                <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                                                                    <Icons.FileText className="w-3.5 h-3.5" /> Content
                                                                </span>
                                                            )}
                                                            {lesson.resources?.length > 0 && (
                                                                <span className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-md">
                                                                    <Icons.Paperclip className="w-3.5 h-3.5" /> {lesson.resources.length} resource(s)
                                                                </span>
                                                            )}
                                                            <span className={`flex items-center gap-1 px-2 py-1 rounded-md ${lesson.assessment?.questions?.length > 0
                                                                ? 'bg-amber-50 text-amber-700'
                                                                : 'bg-gray-100 text-gray-500'
                                                                }`}>
                                                                <Icons.ClipboardCheck className="w-3.5 h-3.5" />
                                                                {lesson.assessment?.questions?.length > 0
                                                                    ? `${lesson.assessment.questions.length} question(s)`
                                                                    : 'No assessment'
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 flex-shrink-0 ml-4">
                                                        <button onClick={() => startEditLesson(index)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Edit lesson">
                                                            <Icons.Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => deleteLesson(index)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete lesson">
                                                            <Icons.Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Navigation */}
                                <div className="flex justify-between pt-6 border-t border-gray-200">
                                    <button onClick={handlePrevious} className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
                                        <Icons.ChevronLeft className="w-5 h-5" /> Previous
                                    </button>
                                    <button onClick={handleNext} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                                        Next: Final Assessment <Icons.ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== STEP 2: LESSON EDITOR (FULL PAGE) ===== */}
                    {currentStep === 2 && isEditingLesson && (
                        <div className="space-y-6">
                            {/* Lesson Editor Header */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <button onClick={cancelLessonEdit} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                                            <Icons.ArrowLeft className="w-5 h-5" />
                                        </button>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">
                                                {editingLessonIndex === -1 ? 'Add New Lesson' : `Edit Lesson ${editingLessonIndex + 1}`}
                                            </h2>
                                            <p className="text-sm text-gray-600">
                                                Fill in the lesson content, upload media, and configure the assessment
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={cancelLessonEdit} className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50">
                                            Cancel
                                        </button>
                                        <button onClick={saveLesson} className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700">
                                            <Icons.Check className="w-5 h-5" />
                                            {editingLessonIndex === -1 ? 'Add Lesson' : 'Save Changes'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Lesson Content Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                    <Icons.FileText className="w-5 h-5 text-emerald-600" />
                                    Lesson Content
                                </h3>
                                <div className="space-y-5">
                                    {/* Title */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Lesson Title <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={currentLesson.title}
                                            onChange={(e) => setCurrentLesson({ ...currentLesson, title: e.target.value })}
                                            placeholder="e.g., Introduction to SEO Fundamentals"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                                        <textarea
                                            value={currentLesson.description}
                                            onChange={(e) => setCurrentLesson({ ...currentLesson, description: e.target.value })}
                                            placeholder="Brief description of what this lesson covers"
                                            rows={2}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>

                                    {/* Content - WYSIWYG */}
                                    <RichTextEditor
                                        label="Lesson Content"
                                        value={currentLesson.content}
                                        onChange={(val) => setCurrentLesson({ ...currentLesson, content: val })}
                                        placeholder="Write the main lesson content here. You can add text formatting, images, and media..."
                                        height={300}
                                    />

                                    {/* Duration */}
                                    <div className="max-w-xs">
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration</label>
                                        <input
                                            type="text"
                                            value={currentLesson.duration}
                                            onChange={(e) => setCurrentLesson({ ...currentLesson, duration: e.target.value })}
                                            placeholder="e.g., 30 minutes"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Video Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                    <Icons.Video className="w-5 h-5 text-blue-600" />
                                    Lesson Video
                                    <span className="text-xs font-normal text-gray-500">(optional)</span>
                                </h3>
                                <VideoUploader
                                    value={currentLesson.videoUrl}
                                    onChange={(url) => setCurrentLesson({ ...currentLesson, videoUrl: url })}
                                />
                            </div>

                            {/* Resources Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                    <Icons.Paperclip className="w-5 h-5 text-purple-600" />
                                    Lesson Resources
                                    <span className="text-xs font-normal text-gray-500">(optional)</span>
                                </h3>
                                <ResourceUploader
                                    value={currentLesson.resources || []}
                                    onChange={(resources) => setCurrentLesson({ ...currentLesson, resources })}
                                />
                            </div>

                            {/* Assessment Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                                <AssessmentSection
                                    title="Lesson Assessment"
                                    assessment={currentLesson.assessment}
                                    onChange={(assessment) => setCurrentLesson({ ...currentLesson, assessment })}
                                />
                                <p className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                                    <Icons.Info className="w-3.5 h-3.5" />
                                    Add quiz questions to test student understanding of this lesson. Questions will be automatically tied to this lesson.
                                </p>
                            </div>

                            {/* Bottom Save Bar */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <button onClick={cancelLessonEdit} className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50">
                                        <Icons.X className="w-5 h-5" /> Cancel
                                    </button>
                                    <button onClick={saveLesson} className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 shadow-sm">
                                        <Icons.Check className="w-5 h-5" />
                                        {editingLessonIndex === -1 ? 'Add Lesson to Module' : 'Save Lesson Changes'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== STEP 3: FINAL ASSESSMENT ===== */}
                    {currentStep === 3 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Module Final Assessment</h2>
                                    <p className="text-gray-600">
                                        This is the overall module assessment. Students must pass this to complete the module and earn a certificate.
                                    </p>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Icons.Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-blue-800">
                                            <p>Each lesson also has its own assessment (configured in Step 2). This final assessment covers the entire module.</p>
                                        </div>
                                    </div>
                                </div>

                                <AssessmentSection
                                    title="Final Assessment"
                                    assessment={finalAssessment}
                                    onChange={setFinalAssessment}
                                    minQuestions={3}
                                />

                                {/* Navigation */}
                                <div className="flex justify-between pt-6 border-t border-gray-200">
                                    <button onClick={handlePrevious} className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
                                        <Icons.ChevronLeft className="w-5 h-5" /> Previous
                                    </button>
                                    <button onClick={handleNext} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                                        Next: Review <Icons.ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== STEP 4: REVIEW ===== */}
                    {currentStep === 4 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Submit</h2>
                                    <p className="text-gray-600">Review your module before submitting for approval</p>
                                </div>

                                {/* Summary Card */}
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">
                                    <h3 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                                        <Icons.CheckCircle className="w-5 h-5" /> Module Summary
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div><span className="text-emerald-700">Title:</span> <strong>{moduleData.title}</strong></div>
                                        <div><span className="text-emerald-700">Level:</span> <strong className="capitalize">{moduleData.level}</strong></div>
                                        <div><span className="text-emerald-700">Lessons:</span> <strong>{lessons.length}</strong></div>
                                        <div><span className="text-emerald-700">Final Questions:</span> <strong>{finalAssessment.questions.length}</strong></div>
                                        {moduleData.deliveryMode && <div><span className="text-emerald-700">Delivery:</span> <strong>{moduleData.deliveryMode}</strong></div>}
                                        {moduleData.duration && <div><span className="text-emerald-700">Duration:</span> <strong>{moduleData.duration}</strong></div>}
                                        <div><span className="text-emerald-700">Total Points:</span> <strong>{finalAssessment.questions.reduce((s, q) => s + q.points, 0)}</strong></div>
                                        <div><span className="text-emerald-700">Pass Score:</span> <strong>{finalAssessment.passingScore}%</strong></div>
                                    </div>
                                </div>

                                {/* Banner Preview */}
                                {moduleData.bannerUrl && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Banner</h4>
                                        <img src={moduleData.bannerUrl} alt="Banner" className="w-full h-40 object-cover rounded-lg" />
                                    </div>
                                )}

                                {/* Description Preview */}
                                {stripHtml(moduleData.description) && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                                        <div className="prose prose-sm max-w-none bg-gray-50 rounded-lg p-4 border" dangerouslySetInnerHTML={{ __html: moduleData.description }} />
                                    </div>
                                )}

                                {/* Lessons Preview */}
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Lessons ({lessons.length})</h4>
                                    <div className="space-y-3">
                                        {lessons.map((lesson, idx) => (
                                            <div key={idx} className="p-4 bg-gray-50 rounded-lg border">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="w-7 h-7 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{idx + 1}</span>
                                                    <p className="text-sm font-semibold text-gray-900">{lesson.title}</p>
                                                </div>
                                                <div className="flex flex-wrap gap-2 ml-10 text-xs">
                                                    {lesson.videoUrl && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Video</span>}
                                                    {lesson.duration && <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded">{lesson.duration}</span>}
                                                    {lesson.resources?.length > 0 && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">{lesson.resources.length} resource(s)</span>}
                                                    <span className={`px-2 py-0.5 rounded ${lesson.assessment?.questions?.length > 0
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-gray-200 text-gray-500'
                                                        }`}>
                                                        {lesson.assessment?.questions?.length > 0
                                                            ? `${lesson.assessment.questions.length} assessment question(s)`
                                                            : 'No lesson assessment'
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Checklist */}
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h3 className="font-semibold text-gray-900 mb-4">Submission Checklist</h3>
                                    <div className="space-y-3">
                                        {[
                                            { check: !!moduleData.title && !!stripHtml(moduleData.description), text: 'Title and description provided' },
                                            { check: !!moduleData.categoryId, text: 'Category selected' },
                                            { check: lessons.length > 0, text: 'At least one lesson added' },
                                            { check: lessons.some(l => l.assessment?.questions?.length > 0), text: 'At least one lesson has assessment questions' },
                                            { check: finalAssessment.questions.length >= 3, text: 'Final assessment has at least 3 questions' },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <Icons.CheckCircle className={`w-5 h-5 ${item.check ? 'text-emerald-600' : 'text-gray-300'}`} />
                                                <span className={item.check ? 'text-gray-900' : 'text-gray-500'}>{item.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Icons.Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-blue-800">
                                            <p className="font-semibold mb-1">What happens next?</p>
                                            <p>Your module will be created as a draft. You can then submit it for admin review from the modules list page.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation */}
                                <div className="flex justify-between pt-6 border-t border-gray-200">
                                    <button onClick={handlePrevious} className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
                                        <Icons.ChevronLeft className="w-5 h-5" /> Previous
                                    </button>
                                    <button onClick={handleSubmit} disabled={loading} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
                                        {loading ? (
                                            <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> Creating...</>
                                        ) : (
                                            <><Icons.Send className="w-5 h-5" /> Create Module</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
