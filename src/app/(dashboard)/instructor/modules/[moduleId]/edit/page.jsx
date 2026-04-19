'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import * as Icons from 'lucide-react';
import moduleService from '@/lib/api/moduleService';
import categoryService from '@/lib/api/categoryService';
import { useDraft } from '@/hooks/useDraft';
import InstructorSidebar from '@/components/instructor/InstructorSidebar';
import LessonBuilder from '@/components/instructor/LessonBuilder';
import RichTextEditor from '@/components/ui/RichTextEditor';
import BannerUploader from '@/components/ui/BannerUploader';
import VideoUploader from '@/components/ui/VideoUploader';
import ResourceUploader from '@/components/ui/ResourceUploader';

// ========== HELPER: Dynamic String List ==========
function DynamicStringList({ label, values, onChange, placeholder }) {
    const safeValues = Array.isArray(values) ? values : [];
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            {safeValues.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                    <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                            const updated = [...safeValues];
                            updated[index] = e.target.value;
                            onChange(updated);
                        }}
                        placeholder={placeholder}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <button onClick={() => onChange(safeValues.filter((_, i) => i !== index))} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Icons.Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ))}
            <button onClick={() => onChange([...safeValues, ''])} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                + Add Item
            </button>
        </div>
    );
}

// ========== HELPER: Module Resource List ==========
function ModuleResourceList({ values = [], onChange }) {
    const blank = () => ({ url: '', name: '', description: '', fileType: '' });
    const add    = () => onChange([...values, blank()]);
    const update = (i, f, v) => { const n = [...values]; n[i] = { ...n[i], [f]: v }; onChange(n); };
    const remove = (i) => onChange(values.filter((_, idx) => idx !== i));

    const mapExt = (fileName) => {
        const ext = (fileName || '').split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return 'pdf';
        if (['doc','docx'].includes(ext)) return 'notebook';
        if (['xls','xlsx','csv'].includes(ext)) return 'dataset';
        return 'other';
    };

    const handleUpload = (uploaded) => {
        onChange((uploaded || []).map((r) => ({
            url: r.url || (typeof r === 'string' ? r : ''),
            name: r.name || r.originalName || (typeof r === 'string' ? r.split('/').pop() : '') || 'Resource',
            description: r.description || '',
            fileType: r.fileType || mapExt(r.name || r.originalName || r.url),
        })));
    };

    return (
        <div className="space-y-3">
            <ResourceUploader value={values} onChange={handleUpload} label="Upload module documents" />
            {values.map((r, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Resource {i + 1}</span>
                        <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600">
                            <Icons.Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                            <input type="text" value={r.name} onChange={(e) => update(i, 'name', e.target.value)} placeholder="Resource name" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
                            <input type="text" value={r.url} onChange={(e) => update(i, 'url', e.target.value)} placeholder="https://…" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
                        <input type="text" value={r.description} onChange={(e) => update(i, 'description', e.target.value)} placeholder="Brief description" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
                    </div>
                </div>
            ))}
            <button type="button" onClick={add} className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                <Icons.Plus className="w-4 h-4" /> Add resource manually
            </button>
        </div>
    );
}

// ========== HELPER: Question Form ==========
function QuestionForm({ question, onChange }) {
    return (
        <div className="space-y-4 p-5 bg-gray-50 rounded-lg border border-gray-200">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Question Text <span className="text-red-500">*</span></label>
                <textarea value={question.text} onChange={(e) => onChange({ ...question, text: e.target.value })} placeholder="Enter your question" rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Type <span className="text-red-500">*</span></label>
                    <select value={question.type} onChange={(e) => onChange({ ...question, type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="true-false">True/False</option>
                        <option value="essay">Essay</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Points <span className="text-red-500">*</span></label>
                    <input type="number" value={question.points} onChange={(e) => onChange({ ...question, points: parseInt(e.target.value) || 0 })} min="1" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                </div>
            </div>
            {question.type === 'multiple-choice' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Options</label>
                        {(question.options || ['', '', '', '']).map((option, index) => (
                            <input key={index} type="text" value={option} onChange={(e) => { const updated = [...(question.options || ['', '', '', ''])]; updated[index] = e.target.value; onChange({ ...question, options: updated }); }} placeholder={`Option ${index + 1}`} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 mb-2" />
                        ))}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Correct Answer <span className="text-red-500">*</span></label>
                        <input type="text" value={question.correctAnswer} onChange={(e) => onChange({ ...question, correctAnswer: e.target.value })} placeholder="Enter the correct option text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                    </div>
                </>
            )}
            {question.type === 'true-false' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Correct Answer <span className="text-red-500">*</span></label>
                    <select value={question.correctAnswer} onChange={(e) => onChange({ ...question, correctAnswer: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                        <option value="">Select answer</option>
                        <option value="True">True</option>
                        <option value="False">False</option>
                    </select>
                </div>
            )}
            {question.type === 'essay' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Grading Rubric</label>
                    <textarea value={question.rubric || ''} onChange={(e) => onChange({ ...question, rubric: e.target.value })} placeholder="Describe what a good answer should include..." rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                </div>
            )}
        </div>
    );
}

// ========== HELPER: Assessment Section ==========
function AssessmentSection({ assessment, onChange, title = 'Assessment', minQuestions = 0 }) {
    const [editingQIndex, setEditingQIndex] = useState(null);
    const [currentQ, setCurrentQ] = useState(null);

    const startAddQuestion = () => { setCurrentQ({ text: '', type: 'multiple-choice', points: 10, options: ['', '', '', ''], correctAnswer: '', explanation: '', rubric: '' }); setEditingQIndex(-1); };
    const startEditQuestion = (index) => { setCurrentQ({ ...assessment.questions[index] }); setEditingQIndex(index); };
    const saveQuestion = () => {
        if (!currentQ.text.trim()) { alert('Question text is required'); return; }
        if (currentQ.type !== 'essay' && !currentQ.correctAnswer) { alert('Please provide the correct answer'); return; }
        const updated = [...assessment.questions];
        if (editingQIndex === -1) updated.push(currentQ); else updated[editingQIndex] = currentQ;
        onChange({ ...assessment, questions: updated });
        setCurrentQ(null); setEditingQIndex(null);
    };
    const deleteQuestion = (index) => { if (confirm('Delete this question?')) onChange({ ...assessment, questions: assessment.questions.filter((_, i) => i !== index) }); };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Icons.ClipboardCheck className="w-5 h-5 text-amber-600" /> {title}
                </h4>
                {minQuestions > 0 && <span className="text-xs text-gray-500">Min {minQuestions} questions required</span>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Passing Score (%)</label>
                    <input type="number" value={assessment.passingScore} onChange={(e) => onChange({ ...assessment, passingScore: parseInt(e.target.value) || 0 })} min="0" max="100" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Attempts</label>
                    <input type="number" value={assessment.maxAttempts} onChange={(e) => onChange({ ...assessment, maxAttempts: parseInt(e.target.value) || 1 })} min="1" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                </div>
                {assessment.timeLimit !== undefined && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Time Limit (min)</label>
                        <input type="number" value={assessment.timeLimit || ''} onChange={(e) => onChange({ ...assessment, timeLimit: e.target.value ? parseInt(e.target.value) : null })} placeholder="No limit" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                    </div>
                )}
            </div>
            {assessment.questions.length > 0 && (
                <div className="space-y-2">
                    {assessment.questions.map((q, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="flex-shrink-0 w-7 h-7 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">Q{idx + 1}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-gray-900 truncate">{q.text}</p>
                                    <div className="flex gap-2 mt-0.5">
                                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">{q.type}</span>
                                        <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded">{q.points} pts</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0 ml-2">
                                <button onClick={() => startEditQuestion(idx)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"><Icons.Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => deleteQuestion(idx)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Icons.Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {currentQ ? (
                <div className="space-y-3">
                    <QuestionForm question={currentQ} onChange={setCurrentQ} />
                    <div className="flex gap-3">
                        <button onClick={() => { setCurrentQ(null); setEditingQIndex(null); }} className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50">Cancel</button>
                        <button onClick={saveQuestion} className="px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700">
                            {editingQIndex === -1 ? 'Add Question' : 'Update Question'}
                        </button>
                    </div>
                </div>
            ) : (
                <button onClick={startAddQuestion} className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-amber-300 text-amber-700 font-medium rounded-lg hover:bg-amber-50 hover:border-amber-400 transition-colors w-full justify-center">
                    <Icons.Plus className="w-5 h-5" /> Add Question
                </button>
            )}
        </div>
    );
}

// ========== MAIN EDIT PAGE ==========
export default function EditModulePage() {
    const router = useRouter();
    const params = useParams();
    const moduleId = params.moduleId;

    const [initialLoading, setInitialLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [finalizing, setFinalizing] = useState(false);
    const [isContentFinalized, setIsContentFinalized] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [categories, setCategories] = useState([]);
    const [originalModule, setOriginalModule] = useState(null);
    const [error, setError] = useState(null);

    // Step 1: Module Overview
    const [moduleData, setModuleData] = useState({
        title: '', description: '', welcomeMessage: '', moduleAim: '',
        moduleObjectives: [''], learningOutcomes: [''], targetAudience: [''],
        categoryId: '', level: 'beginner', deliveryMode: '', duration: '', order: '', bannerUrl: '', prerequisites: [],
    });

    // Step 1b: Module-level resources
    const [moduleResources, setModuleResources] = useState([]);

    // Step 2: Lessons (LessonBuilder format with slides)
    const [lessons, setLessons] = useState([]);

    // Step 3: Final Assessment
    const [finalAssessment, setFinalAssessment] = useState({
        title: 'Module Final Assessment', description: '', questions: [],
        passingScore: 70, maxAttempts: 3, timeLimit: null,
    });

    const draftData = useMemo(() => ({ moduleData, lessons, finalAssessment, moduleResources }), [moduleData, lessons, finalAssessment, moduleResources]);
    const { status: draftStatus, hasDraft, getDraft, discardDraft, saveDraft, savedAgoLabel, dbError: draftDbError } = useDraft(
        `module_instructor_draft_${moduleId}`,
        draftData,
        { enabled: !initialLoading, contentType: 'module', entityId: moduleId, title: moduleData.title || 'Module' }
    );
    const [showDraftBanner, setShowDraftBanner] = useState(false);

    useEffect(() => {
        if (!initialLoading && hasDraft) setShowDraftBanner(true);
    }, [initialLoading, hasDraft]);

    useEffect(() => { loadModuleData(); }, [moduleId]);

    const loadModuleData = async () => {
        try {
            setInitialLoading(true);
            setError(null);
            const [moduleResult, categoriesResult] = await Promise.all([
                moduleService.getModuleById(moduleId),
                categoryService.getAllCategories(),
            ]);
            setCategories(Array.isArray(categoriesResult) ? categoriesResult : []);
            setOriginalModule(moduleResult);
            setIsContentFinalized(moduleResult.isContentFinalized ?? false);

            const categoryId = typeof moduleResult.categoryId === 'object' ? moduleResult.categoryId._id : moduleResult.categoryId;
            // learningOutcomes is stored as a string in the DB; normalise to string[] for the UI
            const learningOutcomesArr = (() => {
                const raw = moduleResult.learningOutcomes;
                if (Array.isArray(raw) && raw.length > 0) return raw;
                if (typeof raw === 'string' && raw.trim()) return raw.split('\n').filter(Boolean);
                return [''];
            })();

            setModuleData({
                title: moduleResult.title || '', description: moduleResult.description || '',
                welcomeMessage: moduleResult.welcomeMessage || '', moduleAim: moduleResult.moduleAim || '',
                moduleObjectives: moduleResult.moduleObjectives?.length > 0 ? moduleResult.moduleObjectives : [''],
                learningOutcomes: learningOutcomesArr,
                targetAudience: moduleResult.targetAudience?.length > 0 ? moduleResult.targetAudience : [''],
                categoryId: categoryId || '', level: moduleResult.level || 'beginner',
                deliveryMode: moduleResult.deliveryMode || '', duration: moduleResult.duration || '',
                order: moduleResult.order != null ? moduleResult.order : '',
                bannerUrl: moduleResult.bannerUrl || '', prerequisites: moduleResult.prerequisites || [],
            });

            // Load module-level resources
            setModuleResources(Array.isArray(moduleResult.moduleResources) ? moduleResult.moduleResources : []);

            // Map backend lessons → LessonBuilder format (with slides)
            const mappedLessons = (moduleResult.lessons || []).map((lesson, idx) => ({
                title: lesson.title || '',
                description: lesson.description || '',
                learningOutcomes: Array.isArray(lesson.learningOutcomes) ? lesson.learningOutcomes : [],
                slidesTitle: lesson.slidesTitle || '',
                slides: Array.isArray(lesson.slides) ? lesson.slides : [],
                assessmentQuiz: Array.isArray(lesson.assessmentQuiz)
                    ? lesson.assessmentQuiz
                    : (Array.isArray(lesson.assessment?.questions) ? lesson.assessment.questions : []),
                quizPassingScore: lesson.quizPassingScore ?? lesson.assessment?.passingScore ?? 70,
                quizMaxAttempts:  lesson.quizMaxAttempts  ?? lesson.assessment?.maxAttempts  ?? 3,
                resources: Array.isArray(lesson.lessonResources)
                    ? lesson.lessonResources
                    : (Array.isArray(lesson.resources) ? lesson.resources : []),
                _caseStudy: null,
                order: lesson.order ?? idx,
            }));
            setLessons(mappedLessons);

            if (moduleResult.finalAssessment) {
                setFinalAssessment({
                    title: moduleResult.finalAssessment.title || 'Module Final Assessment',
                    description: moduleResult.finalAssessment.description || '',
                    questions: (moduleResult.finalAssessment.questions || []).map(q => ({
                        ...q,
                        type: q.type === 'short-answer' ? 'essay' : q.type,
                    })),
                    passingScore: moduleResult.finalAssessment.passingScore ?? 70,
                    maxAttempts: moduleResult.finalAssessment.maxAttempts ?? 3,
                    timeLimit: moduleResult.finalAssessment.timeLimit || null,
                });
            }
        } catch (err) {
            console.error('Error loading module:', err);
            setError('Failed to load module data. Please try again.');
        } finally {
            setInitialLoading(false);
        }
    };

    const steps = [
        { number: 1, title: 'Module Overview', icon: 'Info' },
        { number: 2, title: 'Lessons', icon: 'BookOpen' },
        { number: 3, title: 'Final Assessment', icon: 'ClipboardCheck' },
        { number: 4, title: 'Review & Save', icon: 'Save' },
    ];

    const stripHtml = (html) => { if (!html) return ''; return html.replace(/<[^>]*>/g, '').trim(); };

    const validateStep1 = () => {
        if (!moduleData.title.trim()) return 'Module title is required';
        if (!stripHtml(moduleData.description)) return 'Module description is required';
        if (!moduleData.categoryId) return 'Please select a category';
        return null;
    };

    const handleFinalizeContent = async () => {
        if (isContentFinalized) return;
        if (!confirm('Finalize content? This will notify all enrolled students that the Final Assessment is now available and no more lessons will be added.')) return;
        try {
            setFinalizing(true);
            await moduleService.finalizeContent(moduleId);
            setIsContentFinalized(true);
        } catch (err) {
            alert('Failed to finalize content. Please try again.');
        } finally {
            setFinalizing(false);
        }
    };

    const handleNext = () => {
        if (currentStep === 1) { const err = validateStep1(); if (err) { alert(err); return; } }
        setCurrentStep(currentStep + 1);
    };
    const handlePrevious = () => setCurrentStep(currentStep - 1);

    const handleSave = async () => {
        try {
            setSaving(true);
            // 1. Update module metadata + lessons in one call
            // Infer question type from data shape if missing (legacy questions saved without type)
            const inferQType = (q) => {
                if (q.type) return q.type;
                if (Array.isArray(q.options) && q.options.some(Boolean)) return 'multiple-choice';
                if (['True', 'False'].includes(q.answer)) return 'true-false';
                return 'short-answer';
            };

            const cleanLessons = lessons.map(({ _caseStudy, resources, ...rest }) => {
                const normalizedQuiz = (rest.assessmentQuiz || []).map((q) => ({
                    ...q,
                    type: inferQType(q),
                    points: q.points ?? 1,
                    answer: q.answer ?? '',
                }));

                if (normalizedQuiz.length > 0) {
                    console.group(`💾 [InstructorSave] Lesson: "${rest.title}" — ${normalizedQuiz.length} quiz questions`);
                    normalizedQuiz.forEach((q, i) => {
                        console.log(
                            `Q${i + 1} | type="${q.type}" | answer="${q.answer}" | options:`,
                            q.options || '(none)',
                        );
                    });
                    console.groupEnd();
                }

                return {
                    ...rest,
                    lessonResources: resources || [],
                    assessmentQuiz: normalizedQuiz,
                };
            });
            const modulePayload = {
                title: moduleData.title, description: moduleData.description,
                welcomeMessage: moduleData.welcomeMessage, moduleAim: moduleData.moduleAim,
                categoryId: moduleData.categoryId, level: moduleData.level,
                deliveryMode: moduleData.deliveryMode, duration: moduleData.duration,
                order: moduleData.order !== '' ? Number(moduleData.order) : undefined,
                bannerUrl: moduleData.bannerUrl,
                learningOutcomes: moduleData.learningOutcomes.filter(o => o.trim()).join('\n'),
                targetAudience: moduleData.targetAudience.filter(a => a.trim()),
                prerequisites: moduleData.prerequisites,
                moduleResources: moduleResources || [],
                lessons: cleanLessons,
            };
            await moduleService.updateModule(moduleId, modulePayload);

            // 2. Update final assessment
            await moduleService.setFinalAssessment(moduleId, finalAssessment);

            discardDraft();
            alert('Module updated successfully!');
            router.push('/instructor/modules');
        } catch (err) {
            console.error('Error saving module:', err);
            alert('Error saving module: ' + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    const handleRestoreDraft = () => {
        const draft = getDraft();
        if (draft?.data) {
            const { moduleData: md, lessons: ls, finalAssessment: fa } = draft.data;
            if (md) setModuleData(md);
            if (ls) setLessons(ls);
            if (fa) setFinalAssessment(fa);
            setShowDraftBanner(false);
        }
    };
    const handleDiscardDraft = () => {
        discardDraft();
        setShowDraftBanner(false);
    };

    // Loading state
    if (initialLoading) {
        return (
            <>
                <InstructorSidebar />
                <div className="lg:ml-4 min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading module data...</p>
                    </div>
                </div>
            </>
        );
    }

    // Error state
    if (error) {
        return (
            <>
                <InstructorSidebar />
                <div className="lg:ml-4 min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center max-w-md">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icons.AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Cannot Load Module</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button onClick={() => router.push('/instructor/modules')} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700">
                            <Icons.ArrowLeft className="w-5 h-5" /> Back to Modules
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <InstructorSidebar />
            <div className="lg:ml-4 min-h-screen bg-gray-50">
                <div className="pt-20 lg:pt-4 px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <button onClick={() => router.push('/instructor/modules')} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-3">
                            <Icons.ArrowLeft className="w-4 h-4" /> Back to Modules
                        </button>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                                <Icons.Edit2 className="w-8 h-8 text-emerald-600" /> Edit Module
                            </h1>
                            {draftStatus === 'unsaved' && (
                                <span className="text-xs text-amber-600 flex items-center gap-1">
                                    <Icons.Circle className="w-2.5 h-2.5 fill-amber-500" />
                                    Unsaved changes
                                </span>
                            )}
                            {draftStatus === 'saving' && (
                                <span className="text-xs text-blue-500 flex items-center gap-1 animate-pulse">
                                    <Icons.Loader2 className="w-3 h-3 animate-spin" />
                                    Saving…
                                </span>
                            )}
                            {draftStatus === 'saved' && (
                                <span className="text-xs text-emerald-600 flex items-center gap-1">
                                    <Icons.CheckCircle2 className="w-3 h-3" />
                                    {savedAgoLabel || 'Saved'}
                                </span>
                            )}
                            {draftStatus === 'error' && (
                                <span
                                    className="text-xs text-red-500 flex items-center gap-1 cursor-help"
                                    title={draftDbError || 'Draft could not be saved — click Save Draft to retry.'}
                                >
                                    <Icons.AlertTriangle className="w-3 h-3" />
                                    {draftDbError || 'Save failed — retry'}
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={saveDraft}
                                disabled={draftStatus === 'saving'}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-emerald-300 text-emerald-700 text-xs font-medium rounded-lg hover:bg-emerald-50 disabled:opacity-50"
                            >
                                <Icons.Save className="w-3.5 h-3.5" />
                                {draftStatus === 'saving' ? 'Saving…' : 'Save Draft'}
                            </button>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                            Editing: <strong>{originalModule?.title}</strong>
                            {originalModule?.status === 'published' && (
                                <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full">Published — changes apply immediately</span>
                            )}
                            {originalModule?.status === 'rejected' && (
                                <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full">Rejected</span>
                            )}
                        </p>
                    </div>

                    {/* Rejection Banner */}
                    {originalModule?.status === 'rejected' && originalModule?.rejectionReason && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Icons.AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-red-900 mb-1">Rejection Reason:</p>
                                    <p className="text-sm text-red-700">{originalModule.rejectionReason}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Draft restore banner */}
                    {showDraftBanner && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg mb-6 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-amber-800">
                                <Icons.Clock className="w-4 h-4 text-amber-600" />
                                <span>You have an unsaved draft. Restore it to continue where you left off.</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={handleDiscardDraft} className="px-3 py-1.5 text-xs border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-100">
                                    Discard
                                </button>
                                <button onClick={handleRestoreDraft} className="px-3 py-1.5 text-xs bg-amber-600 text-white rounded-lg hover:bg-amber-700">
                                    Restore Draft
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Progress Steps */}
                    <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            {steps.map((step, index) => {
                                const IconComponent = Icons[step.icon];
                                const isActive = currentStep === step.number;
                                const isCompleted = currentStep > step.number;
                                return (
                                    <React.Fragment key={step.number}>
                                        <div className="flex flex-col items-center cursor-pointer" onClick={() => setCurrentStep(step.number)}>
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isCompleted ? 'bg-emerald-600 text-white' : isActive ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-gray-200 text-gray-500'}`}>
                                                {isCompleted ? <Icons.Check className="w-6 h-6" /> : <IconComponent className="w-6 h-6" />}
                                            </div>
                                            <span className={`mt-2 text-xs font-medium ${isActive ? 'text-emerald-600' : 'text-gray-600'}`}>{step.title}</span>
                                        </div>
                                        {index < steps.length - 1 && <div className={`flex-1 h-1 mx-4 ${isCompleted ? 'bg-emerald-600' : 'bg-gray-200'}`} />}
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
                                    <p className="text-gray-600">Update your module's identity and learning goals</p>
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="col-span-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Module Title <span className="text-red-500">*</span></label>
                                        <input type="text" value={moduleData.title} onChange={(e) => setModuleData({ ...moduleData, title: e.target.value })} placeholder="e.g., Introduction to Digital Marketing" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Module Order</label>
                                        <input type="number" min="1" value={moduleData.order} onChange={(e) => setModuleData({ ...moduleData, order: e.target.value === '' ? '' : parseInt(e.target.value) })} placeholder="e.g. 1" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                                        <p className="text-xs text-gray-400 mt-1">Controls sequence (1 = first)</p>
                                    </div>
                                </div>
                                <RichTextEditor label="Description" required value={moduleData.description} onChange={(val) => setModuleData({ ...moduleData, description: val })} placeholder="What will students learn..." height={180} />
                                <RichTextEditor label="Welcome Message" value={moduleData.welcomeMessage} onChange={(val) => setModuleData({ ...moduleData, welcomeMessage: val })} placeholder="A warm welcome message..." height={120} />
                                <RichTextEditor label="Module Aim" value={moduleData.moduleAim} onChange={(val) => setModuleData({ ...moduleData, moduleAim: val })} placeholder="The overarching goal..." height={120} />
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Category <span className="text-red-500">*</span></label>
                                        <select value={moduleData.categoryId} onChange={(e) => setModuleData({ ...moduleData, categoryId: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                                            <option value="">Select Category</option>
                                            {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Level <span className="text-red-500">*</span></label>
                                        <select value={moduleData.level} onChange={(e) => setModuleData({ ...moduleData, level: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="advanced">Advanced</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Mode</label>
                                        <select value={moduleData.deliveryMode} onChange={(e) => setModuleData({ ...moduleData, deliveryMode: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                                            <option value="">Select Mode</option>
                                            <option value="Online">Online</option>
                                            <option value="Blended">Blended</option>
                                            <option value="Self-paced">Self-paced</option>
                                            <option value="Instructor-led">Instructor-led</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                                        <input type="text" value={moduleData.duration} onChange={(e) => setModuleData({ ...moduleData, duration: e.target.value })} placeholder="e.g., 4 weeks" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                                    </div>
                                </div>
                                <BannerUploader value={moduleData.bannerUrl} onChange={(url) => setModuleData({ ...moduleData, bannerUrl: url })} />
                                <VideoUploader label="Module Intro Video (optional)" value={moduleData.introVideoUrl || ''} onChange={(url) => setModuleData({ ...moduleData, introVideoUrl: url })} />
                                <DynamicStringList label="Module Objectives" values={moduleData.moduleObjectives} onChange={(vals) => setModuleData({ ...moduleData, moduleObjectives: vals })} placeholder="What specific objectives will this module achieve?" />
                                <DynamicStringList label="Expected Learning Outcomes" values={moduleData.learningOutcomes} onChange={(vals) => setModuleData({ ...moduleData, learningOutcomes: vals })} placeholder="What will students be able to do?" />
                                <DynamicStringList label="Target Audience" values={moduleData.targetAudience} onChange={(vals) => setModuleData({ ...moduleData, targetAudience: vals })} placeholder="Who is this module designed for?" />

                                {/* Module-Level Resources */}
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900 mb-1">Module Resources</h3>
                                    <p className="text-xs text-gray-500 mb-3">Files and links that apply to the whole module (bibliography, datasets, code repos, recorded lectures).</p>
                                    <ModuleResourceList values={moduleResources} onChange={setModuleResources} />
                                </div>

                                <div className="flex justify-end pt-6 border-t border-gray-200">
                                    <button onClick={handleNext} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700">Next: Lessons <Icons.ChevronRight className="w-5 h-5" /></button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== STEP 2: LESSONS (LessonBuilder) ===== */}
                    {currentStep === 2 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Module Lessons</h2>
                                    <p className="text-gray-600 text-sm">Add lessons with slides — text, images, videos, diagrams, and interactive code editors. Each lesson can also have a quiz.</p>
                                </div>
                                <LessonBuilder
                                    lessons={lessons}
                                    onChange={setLessons}
                                    onSaveDraft={saveDraft}
                                    draftStatus={draftStatus}
                                />
                                <div className="flex justify-between pt-6 border-t border-gray-200">
                                    <button onClick={handlePrevious} className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"><Icons.ChevronLeft className="w-5 h-5" /> Previous</button>
                                    <button
                                        type="button"
                                        onClick={saveDraft}
                                        disabled={draftStatus === 'saving'}
                                        className="inline-flex items-center gap-2 px-4 py-2 border border-emerald-300 text-emerald-700 font-medium rounded-lg hover:bg-emerald-50 disabled:opacity-50"
                                    >
                                        <Icons.Save className="w-4 h-4" />
                                        {draftStatus === 'saving' ? 'Saving…' : 'Save Draft'}
                                    </button>
                                    <button onClick={handleNext} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700">Next: Final Assessment <Icons.ChevronRight className="w-5 h-5" /></button>
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
                                    <p className="text-gray-600">Students must pass this to complete the module and earn a certificate.</p>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Icons.Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-blue-800"><p>Each lesson also has its own optional quiz (configured via the lesson builder). This final assessment covers the entire module.</p></div>
                                    </div>
                                </div>
                                <AssessmentSection title="Final Assessment" assessment={finalAssessment} onChange={setFinalAssessment} minQuestions={3} />
                                <div className="flex justify-between pt-6 border-t border-gray-200">
                                    <button onClick={handlePrevious} className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"><Icons.ChevronLeft className="w-5 h-5" /> Previous</button>
                                    <button onClick={handleNext} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700">Next: Review <Icons.ChevronRight className="w-5 h-5" /></button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== STEP 4: REVIEW & SAVE ===== */}
                    {currentStep === 4 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Save</h2>
                                    <p className="text-gray-600">Review your changes before saving</p>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">
                                    <h3 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2"><Icons.CheckCircle className="w-5 h-5" /> Module Summary</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div><span className="text-emerald-700">Title:</span> <strong>{moduleData.title}</strong></div>
                                        <div><span className="text-emerald-700">Level:</span> <strong className="capitalize">{moduleData.level}</strong></div>
                                        <div><span className="text-emerald-700">Lessons:</span> <strong>{lessons.length}</strong></div>
                                        <div><span className="text-emerald-700">Total Slides:</span> <strong>{lessons.reduce((a, l) => a + (l.slides || []).length, 0)}</strong></div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Lessons ({lessons.length})</h4>
                                    <div className="space-y-2">
                                        {lessons.map((lesson, idx) => (
                                            <div key={idx} className="p-3 bg-gray-50 rounded-lg border flex items-center gap-3">
                                                <span className="w-7 h-7 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{idx + 1}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900">{lesson.title || 'Untitled'}</p>
                                                    <p className="text-xs text-gray-500">{(lesson.slides || []).length} slide(s) · {(lesson.assessmentQuiz || []).length} quiz question(s)</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Icons.Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-blue-800">
                                            <p className="font-semibold mb-1">Saving Changes</p>
                                            <p>{originalModule?.status === 'published' ? 'Your changes will be saved and applied to the live module immediately.' : 'Your changes will be saved. You can submit for approval from the modules list page.'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Finalize Content */}
                                <div className={`border rounded-lg p-5 ${isContentFinalized ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            {isContentFinalized
                                                ? <Icons.CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                : <Icons.Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                            }
                                            <div>
                                                <p className={`font-semibold text-sm mb-1 ${isContentFinalized ? 'text-green-800' : 'text-amber-800'}`}>
                                                    {isContentFinalized ? 'Content Finalized' : 'Finalize Content'}
                                                </p>
                                                <p className={`text-xs ${isContentFinalized ? 'text-green-700' : 'text-amber-700'}`}>
                                                    {isContentFinalized
                                                        ? 'Students have been notified that all lessons are complete and the Final Assessment is unlocked.'
                                                        : 'Mark all lessons as complete to unlock the Final Assessment for enrolled students. They will be notified by email.'}
                                                </p>
                                            </div>
                                        </div>
                                        {!isContentFinalized && (
                                            <button
                                                onClick={handleFinalizeContent}
                                                disabled={finalizing}
                                                className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50"
                                            >
                                                {finalizing ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Finalizing…</> : <><Icons.CheckSquare className="w-4 h-4" /> Finalize</>}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between pt-6 border-t border-gray-200">
                                    <button onClick={handlePrevious} className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"><Icons.ChevronLeft className="w-5 h-5" /> Previous</button>
                                    <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                                        {saving ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> Saving...</> : <><Icons.Save className="w-5 h-5" /> Save Changes</>}
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
