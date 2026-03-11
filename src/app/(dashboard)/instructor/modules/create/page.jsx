'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import moduleService from '@/lib/api/moduleService';
import categoryService from '@/lib/api/categoryService';
import RichTextEditor from '@/components/ui/RichTextEditor';
import BannerUploader from '@/components/ui/BannerUploader';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ─────────────────────────────────────────────────────────────────
// CONFIRM DELETE DIALOG
// ─────────────────────────────────────────────────────────────────
function ConfirmDeleteDialog({ open, title, description, onConfirm, onCancel }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            {/* Dialog */}
            <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <Icons.Trash2 className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{description}</p>
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={onCancel} className="gap-1">
                        <Icons.X className="w-4 h-4" /> Cancel
                    </Button>
                    <Button onClick={onConfirm} className="gap-1 bg-red-600 hover:bg-red-700 text-white">
                        <Icons.Trash2 className="w-4 h-4" /> Delete
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────────

/** Simple bullet list input — used for outcomes, tasks, deliverables, etc. */
function BulletList({ label, hint, values, onChange, placeholder, required }) {
    const add    = ()      => onChange([...values, '']);
    const update = (i, v)  => { const n = [...values]; n[i] = v; onChange(n); };
    const remove = (i)     => onChange(values.filter((_, idx) => idx !== i));

    return (
        <div className="space-y-2">
            <div>
                <Label className="font-semibold">
                    {label}{required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
            </div>
            <div className="space-y-2">
                {values.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center">
                        <span className="text-gray-400 text-sm w-5 text-right flex-shrink-0">{i + 1}.</span>
                        <Input
                            value={item}
                            onChange={e => update(i, e.target.value)}
                            placeholder={placeholder}
                            className="flex-1"
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}>
                            <Icons.X className="w-4 h-4 text-red-400" />
                        </Button>
                    </div>
                ))}
                {values.length === 0 && (
                    <p className="text-sm text-gray-400 italic pl-7">No items yet — click below to add one.</p>
                )}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1 ml-7">
                <Icons.Plus className="w-3 h-3" /> Add item
            </Button>
        </div>
    );
}

/** Resource entry — name, URL, description, type */
function ResourceList({ label, hint, values, onChange }) {
    const blank  = ()         => ({ url: '', name: '', description: '', fileType: '' });
    const add    = ()         => onChange([...values, blank()]);
    const update = (i, f, v) => { const n = [...values]; n[i] = { ...n[i], [f]: v }; onChange(n); };
    const remove = (i)        => onChange(values.filter((_, idx) => idx !== i));

    return (
        <div className="space-y-3">
            <div>
                <Label className="font-semibold">{label}</Label>
                {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
            </div>
            {values.map((r, i) => (
                <div key={i} className="border rounded-xl p-4 space-y-3 bg-gray-50">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Resource {i + 1}</span>
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}>
                            <Icons.Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Name <span className="text-red-500">*</span></Label>
                            <Input value={r.name} onChange={e => update(i, 'name', e.target.value)} placeholder="e.g. ERA5 Reanalysis Dataset" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Type</Label>
                            <Select value={r.fileType} onValueChange={v => update(i, 'fileType', v)}>
                                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="link">Link / URL</SelectItem>
                                    <SelectItem value="pdf">PDF Document</SelectItem>
                                    <SelectItem value="notebook">Code Notebook</SelectItem>
                                    <SelectItem value="dataset">Dataset</SelectItem>
                                    <SelectItem value="video">Video</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">URL / Link (optional)</Label>
                        <Input value={r.url} onChange={e => update(i, 'url', e.target.value)} placeholder="https://..." />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Description (optional)</Label>
                        <Input value={r.description} onChange={e => update(i, 'description', e.target.value)} placeholder="e.g. Rainfall & temperature reanalysis data from ECMWF Copernicus" />
                    </div>
                </div>
            ))}
            {values.length === 0 && (
                <p className="text-sm text-gray-400 italic">No resources yet.</p>
            )}
            <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1">
                <Icons.Plus className="w-3 h-3" /> Add Resource
            </Button>
        </div>
    );
}

/** Quiz question builder for lessons */
function QuizBuilder({ questions, onChange }) {
    const blank = () => ({ question: '', type: 'multiple-choice', options: ['', '', '', ''], answer: '', explanation: '', points: 1 });
    const add    = ()         => onChange([...questions, blank()]);
    const remove = (i)        => onChange(questions.filter((_, idx) => idx !== i));
    const update = (i, f, v) => { const n = [...questions]; n[i] = { ...n[i], [f]: v }; onChange(n); };
    const updateOption = (qi, oi, v) => {
        const n = [...questions];
        const opts = [...(n[qi].options || [])];
        opts[oi] = v;
        n[qi] = { ...n[qi], options: opts };
        onChange(n);
    };
    const addOption    = (qi) => { const n = [...questions]; n[qi] = { ...n[qi], options: [...(n[qi].options || []), ''] }; onChange(n); };
    const removeOption = (qi, oi) => { const n = [...questions]; n[qi] = { ...n[qi], options: n[qi].options.filter((_, idx) => idx !== oi) }; onChange(n); };

    return (
        <div className="space-y-4">
            <div>
                <Label className="font-semibold">Assessment Quiz</Label>
                <p className="text-xs text-gray-500 mt-0.5">These questions test the learner's understanding of this specific lesson. Learners must pass before moving on.</p>
            </div>

            {questions.map((q, i) => (
                <div key={i} className="border-2 border-blue-100 rounded-xl p-4 space-y-4 bg-blue-50/20">
                    <div className="flex justify-between items-center">
                        <Badge className="bg-blue-100 text-blue-700">Question {i + 1}</Badge>
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}>
                            <Icons.Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs">Question Text <span className="text-red-500">*</span></Label>
                        <Textarea value={q.question} onChange={e => update(i, 'question', e.target.value)} placeholder="Type your question here..." rows={2} />
                    </div>

                    <div className="flex gap-3 items-end">
                        <div className="flex-1 space-y-1">
                            <Label className="text-xs">Question Type</Label>
                            <Select value={q.type} onValueChange={v => update(i, 'type', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                    <SelectItem value="true-false">True / False</SelectItem>
                                    <SelectItem value="short-answer">Short Answer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-28 space-y-1">
                            <Label className="text-xs">Points</Label>
                            <Input type="number" value={q.points} onChange={e => update(i, 'points', Number(e.target.value))} min={1} />
                        </div>
                    </div>

                    {q.type === 'multiple-choice' && (
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-500">Answer Options</Label>
                            {(q.options || []).map((opt, oi) => (
                                <div key={oi} className="flex gap-2 items-center">
                                    <span className="text-xs text-gray-400 w-6">{String.fromCharCode(65 + oi)}.</span>
                                    <Input value={opt} onChange={e => updateOption(i, oi, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + oi)}`} className="flex-1" />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(i, oi)}>
                                        <Icons.X className="w-3 h-3 text-red-400" />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="ghost" size="sm" onClick={() => addOption(i)} className="gap-1 text-xs ml-6">
                                <Icons.Plus className="w-3 h-3" /> Add option
                            </Button>
                        </div>
                    )}

                    {q.type === 'true-false' ? (
                        <div className="space-y-1">
                            <Label className="text-xs">Correct Answer</Label>
                            <Select value={q.answer} onValueChange={v => update(i, 'answer', v)}>
                                <SelectTrigger><SelectValue placeholder="Select correct answer" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="True">True</SelectItem>
                                    <SelectItem value="False">False</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <Label className="text-xs">Correct Answer</Label>
                            <Input value={q.answer} onChange={e => update(i, 'answer', e.target.value)} placeholder="Type the correct answer" />
                        </div>
                    )}

                    <div className="space-y-1">
                        <Label className="text-xs">Explanation (shown after answering — optional)</Label>
                        <Input value={q.explanation} onChange={e => update(i, 'explanation', e.target.value)} placeholder="e.g. Problem scoping defines the research boundaries..." />
                    </div>
                </div>
            ))}

            {questions.length === 0 && (
                <div className="border-2 border-dashed border-blue-200 rounded-xl p-6 text-center text-sm text-gray-400">
                    No quiz questions yet. Add at least one question for this lesson.
                </div>
            )}

            <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1 border-blue-300 text-blue-700 hover:bg-blue-50">
                <Icons.Plus className="w-3 h-3" /> Add Question
            </Button>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// LESSON EDITOR — full page view
// ─────────────────────────────────────────────────────────────────
function LessonEditorPage({ lesson, onChange, onBack, lessonNumber, topicName }) {
    const update = (field, value) => onChange({ ...lesson, [field]: value });

    return (
        <div className="space-y-0">
            {/* Breadcrumb bar */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 p-4 bg-gray-50 rounded-xl border">
                <Icons.Layers className="w-4 h-4 text-blue-500" />
                <span className="text-blue-600 font-medium">{topicName}</span>
                <Icons.ChevronRight className="w-4 h-4" />
                <Icons.BookOpen className="w-4 h-4 text-green-500" />
                <span className="text-green-700 font-medium">
                    {lesson.lessonName || `Lesson ${lessonNumber}`}
                </span>
            </div>

            <div className="space-y-8">
                {/* ── Basic info ─────────────────────── */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">1</div>
                        <h3 className="font-semibold text-gray-800">Lesson Details</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>Lesson Name <span className="text-red-500">*</span></Label>
                            <Input
                                value={lesson.lessonName}
                                onChange={e => update('lessonName', e.target.value)}
                                placeholder="e.g. Phase Overview, Literature Review Tasks"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Duration / Timeline</Label>
                            <Input
                                value={lesson.duration || ''}
                                onChange={e => update('duration', e.target.value)}
                                placeholder="e.g. Weeks 1–6"
                            />
                        </div>
                    </div>
                </section>

                {/* ── Lesson Content (WYSIWYG) ────────── */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">2</div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Lesson Content</h3>
                            <p className="text-xs text-gray-500">Write the main lesson body. This is what learners read/watch.</p>
                        </div>
                    </div>
                    <RichTextEditor
                        value={lesson.lessonContent || ''}
                        onChange={v => update('lessonContent', v)}
                        placeholder="Write the full lesson content here — explain concepts, provide context, include examples..."
                    />
                </section>

                {/* ── Tasks ──────────────────────────── */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-sm">3</div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Tasks</h3>
                            <p className="text-xs text-gray-500">What should the learner DO in this lesson?</p>
                        </div>
                    </div>
                    <BulletList
                        label="Task List"
                        hint="List clear, actionable things learners must do (e.g. read, write, analyse, submit)."
                        values={lesson.tasks || []}
                        onChange={v => update('tasks', v)}
                        placeholder="e.g. Read provided research papers on climate resilience AI projects"
                    />
                </section>

                {/* ── Deliverables ────────────────────── */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">4</div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Deliverables</h3>
                            <p className="text-xs text-gray-500">What should the learner submit or produce at the end of this lesson?</p>
                        </div>
                    </div>
                    <BulletList
                        label="Deliverable List"
                        hint="These are the outputs learners must hand in (documents, reports, datasets, etc.)."
                        values={lesson.deliverables || []}
                        onChange={v => update('deliverables', v)}
                        placeholder="e.g. Written problem statement (5–10 pages)"
                    />
                </section>

                {/* ── Evaluation Criteria ─────────────── */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <div className="w-7 h-7 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold text-sm">5</div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Evaluation Criteria</h3>
                            <p className="text-xs text-gray-500">How will the learner's work be assessed? List the grading criteria.</p>
                        </div>
                    </div>
                    <BulletList
                        label="Criteria List"
                        hint="e.g. Relevance and clarity of problem statement, Quality of literature review."
                        values={lesson.evaluationCriteria || []}
                        onChange={v => update('evaluationCriteria', v)}
                        placeholder="e.g. Completeness and clarity of the problem statement"
                    />
                </section>

                {/* ── Quiz ───────────────────────────── */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">6</div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Assessment Quiz</h3>
                            <p className="text-xs text-gray-500">Learners must pass this quiz before moving to the next lesson.</p>
                        </div>
                    </div>
                    <QuizBuilder
                        questions={lesson.assessmentQuiz || []}
                        onChange={v => update('assessmentQuiz', v)}
                    />
                </section>

                {/* ── Lesson Resources ───────────────── */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">7</div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Lesson Resources</h3>
                            <p className="text-xs text-gray-500">Attach PDFs, datasets, code notebooks, or external links for this lesson.</p>
                        </div>
                    </div>
                    <ResourceList
                        label="Resources"
                        hint="These files and links will be available to learners inside this lesson."
                        values={lesson.lessonResources || []}
                        onChange={v => update('lessonResources', v)}
                    />
                </section>
            </div>

            {/* Done button */}
            <div className="pt-8 flex justify-end">
                <Button onClick={onBack} className="gap-2 bg-green-600 hover:bg-green-700">
                    <Icons.CheckCircle className="w-4 h-4" /> Done — Back to Topic
                </Button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// TOPIC EDITOR — full page view
// ─────────────────────────────────────────────────────────────────
function TopicEditorPage({ topic, onChange, onBack, topicNumber }) {
    const [editingLesson, setEditingLesson] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null); // { index, name }
    const update = (field, value) => onChange({ ...topic, [field]: value });

    const blankLesson = () => ({
        lessonName: '',
        lessonContent: '',
        tasks: [],
        deliverables: [],
        evaluationCriteria: [],
        assessmentQuiz: [],
        lessonResources: [],
        duration: '',
        order: (topic.lessons || []).length,
    });

    const addLesson = () => {
        const updated = [...(topic.lessons || []), blankLesson()];
        update('lessons', updated);
        setEditingLesson(updated.length - 1);
    };
    const removeLesson = (i) => {
        update('lessons', topic.lessons.filter((_, idx) => idx !== i));
        if (editingLesson === i) setEditingLesson(null);
        setConfirmDelete(null);
    };
    const updateLesson = (i, updated) => {
        const n = [...topic.lessons];
        n[i] = updated;
        update('lessons', n);
    };

    // ── Viewing a specific lesson ──
    if (editingLesson !== null) {
        return (
            <LessonEditorPage
                lesson={topic.lessons[editingLesson]}
                lessonNumber={editingLesson + 1}
                topicName={topic.topicName || `Topic ${topicNumber}`}
                onChange={updated => updateLesson(editingLesson, updated)}
                onBack={() => setEditingLesson(null)}
            />
        );
    }

    return (
        <div className="space-y-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 p-4 bg-gray-50 rounded-xl border">
                <Icons.Layers className="w-4 h-4 text-blue-500" />
                <span className="text-blue-700 font-medium">
                    {topic.topicName || `Topic ${topicNumber}`}
                </span>
            </div>

            {/* ── Topic details ────────────────────── */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">1</div>
                    <h3 className="font-semibold text-gray-800">Topic Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label>Topic Name <span className="text-red-500">*</span></Label>
                        <Input
                            value={topic.topicName}
                            onChange={e => update('topicName', e.target.value)}
                            placeholder="e.g. Phase 1 – Problem Scoping & Literature Review"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label>Duration</Label>
                        <Input
                            value={topic.duration || ''}
                            onChange={e => update('duration', e.target.value)}
                            placeholder="e.g. 4 weeks, Weeks 1–6"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <Label>Topic Introduction</Label>
                    <p className="text-xs text-gray-500">Explain what this topic covers and what learners will gain from it.</p>
                    <RichTextEditor
                        value={topic.introduction || ''}
                        onChange={v => update('introduction', v)}
                        placeholder="This topic introduces learners to..."
                    />
                </div>

                <BulletList
                    label="Topic Learning Outcomes"
                    hint="What should learners know or be able to do after completing this topic?"
                    values={topic.topicOutcomes || []}
                    onChange={v => update('topicOutcomes', v)}
                    placeholder="e.g. Define a clear climate-related research problem"
                />
            </section>

            <Separator />

            {/* ── Lessons ─────────────────────────── */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">2</div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Lessons in this Topic</h3>
                            <p className="text-xs text-gray-500">Each lesson has its own content, tasks, deliverables, quiz, and resources.</p>
                        </div>
                    </div>
                    <Badge variant="secondary">{(topic.lessons || []).length} lesson{(topic.lessons || []).length !== 1 ? 's' : ''}</Badge>
                </div>

                {/* Lesson cards */}
                <div className="space-y-3">
                    {(topic.lessons || []).map((lesson, i) => (
                        <div key={i} className="border rounded-xl p-4 bg-white hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                                        <Icons.BookOpen className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-800 truncate">
                                            {lesson.lessonName || <span className="text-gray-400 italic">Untitled Lesson</span>}
                                        </p>
                                        <div className="flex gap-3 mt-1 text-xs text-gray-500">
                                            {lesson.duration && <span className="flex items-center gap-1"><Icons.Clock className="w-3 h-3" />{lesson.duration}</span>}
                                            <span className="flex items-center gap-1"><Icons.ListChecks className="w-3 h-3" />{(lesson.tasks || []).length} tasks</span>
                                            <span className="flex items-center gap-1"><Icons.FileText className="w-3 h-3" />{(lesson.deliverables || []).length} deliverables</span>
                                            <span className="flex items-center gap-1"><Icons.HelpCircle className="w-3 h-3" />{(lesson.assessmentQuiz || []).length} quiz questions</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingLesson(i)}
                                        className="gap-1"
                                    >
                                        <Icons.Pencil className="w-3.5 h-3.5" /> Edit
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setConfirmDelete({ index: i, name: lesson.lessonName || `Lesson ${i + 1}` })}
                                    >
                                        <Icons.Trash2 className="w-4 h-4 text-red-400" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {(topic.lessons || []).length === 0 && (
                        <div className="border-2 border-dashed border-green-200 rounded-xl p-8 text-center">
                            <Icons.BookOpen className="w-10 h-10 text-green-300 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-600">No lessons yet</p>
                            <p className="text-xs text-gray-400 mt-1">Add the first lesson to this topic using the button below.</p>
                        </div>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        onClick={addLesson}
                        className="w-full gap-2 border-dashed border-2 border-green-300 text-green-700 hover:bg-green-50 h-11"
                    >
                        <Icons.Plus className="w-4 h-4" /> Add Lesson to "{topic.topicName || `Topic ${topicNumber}`}"
                    </Button>
                </div>
            </section>

            {/* Back button */}
            <div className="pt-4 flex justify-end">
                <Button onClick={onBack} variant="outline" className="gap-2">
                    <Icons.ArrowLeft className="w-4 h-4" /> Back to all Topics
                </Button>
            </div>

            {/* Delete lesson confirmation dialog */}
            <ConfirmDeleteDialog
                open={confirmDelete !== null}
                title={`Delete "${confirmDelete?.name}"?`}
                description="This lesson and all its content (tasks, deliverables, quiz questions, and resources) will be permanently removed. This cannot be undone."
                onConfirm={() => removeLesson(confirmDelete.index)}
                onCancel={() => setConfirmDelete(null)}
            />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// TOPICS STEP — top-level list of topics
// ─────────────────────────────────────────────────────────────────
function TopicsStep({ topics, onChange }) {
    const [editingTopic, setEditingTopic] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null); // { index, name }

    const blankTopic = () => ({
        topicName: '',
        introduction: '',
        topicOutcomes: [],
        duration: '',
        lessons: [],
        order: topics.length,
    });

    const addTopic = () => {
        const updated = [...topics, blankTopic()];
        onChange(updated);
        setEditingTopic(updated.length - 1);
    };
    const removeTopic = (i) => {
        onChange(topics.filter((_, idx) => idx !== i));
        if (editingTopic === i) setEditingTopic(null);
        setConfirmDelete(null);
    };
    const updateTopic = (i, updated) => { const n = [...topics]; n[i] = updated; onChange(n); };

    // ── Viewing a specific topic ──
    if (editingTopic !== null) {
        return (
            <TopicEditorPage
                topic={topics[editingTopic]}
                topicNumber={editingTopic + 1}
                onChange={updated => updateTopic(editingTopic, updated)}
                onBack={() => setEditingTopic(null)}
            />
        );
    }

    // ── Topic list view ──
    return (
        <div className="space-y-5">
            <ConfirmDeleteDialog
                open={!!confirmDelete}
                title={`Delete "${confirmDelete?.name || 'this topic'}"?`}
                description="This will permanently remove the topic and all its lessons, tasks, deliverables, and quiz questions. This cannot be undone."
                onConfirm={() => removeTopic(confirmDelete.index)}
                onCancel={() => setConfirmDelete(null)}
            />

            <Alert className="border-blue-200 bg-blue-50">
                <Icons.Info className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-700 text-sm">
                    <strong>Topics</strong> are the main phases or sections of your module (e.g. "Phase 1 – Problem Scoping"). Each topic contains one or more <strong>lessons</strong> with content, tasks, deliverables, and a quiz.
                </AlertDescription>
            </Alert>

            <div className="space-y-3">
                {topics.map((topic, i) => {
                    const lessonCount = (topic.lessons || []).length;
                    const totalQuestions = (topic.lessons || []).reduce((a, l) => a + (l.assessmentQuiz?.length || 0), 0);
                    return (
                        <div key={i} className="border-2 border-blue-100 rounded-xl p-5 bg-white hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <Icons.Layers className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-800 truncate">
                                            {topic.topicName || <span className="text-gray-400 italic">Untitled Topic {i + 1}</span>}
                                        </p>
                                        {topic.duration && <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><Icons.Clock className="w-3 h-3" />{topic.duration}</p>}
                                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                            <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                                                <Icons.BookOpen className="w-3 h-3" />{lessonCount} lesson{lessonCount !== 1 ? 's' : ''}
                                            </span>
                                            <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                                                <Icons.HelpCircle className="w-3 h-3" />{totalQuestions} quiz question{totalQuestions !== 1 ? 's' : ''}
                                            </span>
                                            <span className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                                                <Icons.Target className="w-3 h-3" />{(topic.topicOutcomes || []).length} outcome{(topic.topicOutcomes || []).length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <Button
                                        type="button"
                                        variant="default"
                                        size="sm"
                                        onClick={() => setEditingTopic(i)}
                                        className="gap-1 bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Icons.Pencil className="w-3.5 h-3.5" /> Open & Edit
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setConfirmDelete({ index: i, name: topic.topicName || `Topic ${i + 1}` })}
                                        className="text-red-400 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Icons.Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {topics.length === 0 && (
                    <div className="border-2 border-dashed border-blue-200 rounded-xl p-12 text-center">
                        <Icons.Layers className="w-14 h-14 text-blue-200 mx-auto mb-3" />
                        <p className="text-base font-semibold text-gray-600">No topics yet</p>
                        <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                            Start by adding your first topic. For example: "Phase 1 – Problem Scoping & Literature Review".
                        </p>
                    </div>
                )}

                <Button
                    type="button"
                    variant="outline"
                    onClick={addTopic}
                    className="w-full gap-2 border-dashed border-2 border-blue-300 text-blue-700 hover:bg-blue-50 h-12 text-sm font-medium"
                >
                    <Icons.Plus className="w-5 h-5" /> Add New Topic
                </Button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// CASE STUDIES STEP
// ─────────────────────────────────────────────────────────────────
const CS_TYPES = ['Introduction', 'Dataset', 'AI Task', 'Key Readings'];

function CaseStudiesStep({ caseStudies, onChange }) {
    const [editingCS, setEditingCS] = useState(null);

    const blankCS = () => ({
        caseStudyName: '',
        note: 'Case studies do not have quizzes; they only provide content.',
        lessons: CS_TYPES.map(t => ({ lessonType: t, content: '', resources: [] })),
    });

    const addCS    = () => { const u = [...caseStudies, blankCS()]; onChange(u); setEditingCS(u.length - 1); };
    const removeCS = (i) => { onChange(caseStudies.filter((_, idx) => idx !== i)); if (editingCS === i) setEditingCS(null); };
    const updateCS = (i, updated) => { const n = [...caseStudies]; n[i] = updated; onChange(n); };
    const updateCSLesson = (csIndex, lIndex, field, value) => {
        const n = [...caseStudies];
        const ls = [...n[csIndex].lessons];
        ls[lIndex] = { ...ls[lIndex], [field]: value };
        n[csIndex] = { ...n[csIndex], lessons: ls };
        onChange(n);
    };
    const updateCSLessonResources = (csIndex, lIndex, resources) => updateCSLesson(csIndex, lIndex, 'resources', resources);

    // ── Editing a specific case study ──
    if (editingCS !== null) {
        const cs = caseStudies[editingCS];
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-sm p-4 bg-gray-50 rounded-xl border">
                    <Icons.FlaskConical className="w-4 h-4 text-amber-500" />
                    <span className="text-amber-700 font-medium">{cs.caseStudyName || `Case Study ${editingCS + 1}`}</span>
                    <Badge className="bg-amber-100 text-amber-700 text-xs ml-auto">Content Only — No Quiz</Badge>
                </div>

                <Alert className="border-amber-200 bg-amber-50">
                    <Icons.Info className="w-4 h-4 text-amber-600" />
                    <AlertDescription className="text-amber-700 text-sm">
                        Case studies are reading/reference material. They have 4 fixed sections: <strong>Introduction, Dataset, AI Task, Key Readings</strong>. Learners view them but are not quizzed.
                    </AlertDescription>
                </Alert>

                <div className="space-y-1">
                    <Label>Case Study Name <span className="text-red-500">*</span></Label>
                    <Input
                        value={cs.caseStudyName}
                        onChange={e => updateCS(editingCS, { ...cs, caseStudyName: e.target.value })}
                        placeholder="e.g. Drought Early Warning in the Horn of Africa"
                    />
                </div>

                <div className="space-y-4">
                    {CS_TYPES.map((type, li) => {
                        const lessonData = cs.lessons[li] || { lessonType: type, content: '', resources: [] };
                        const icons = { Introduction: Icons.BookOpen, Dataset: Icons.Database, 'AI Task': Icons.BrainCircuit, 'Key Readings': Icons.ScrollText };
                        const SectionIcon = icons[type] || Icons.FileText;
                        return (
                            <div key={type} className="border rounded-xl overflow-hidden">
                                <div className="flex items-center gap-3 p-3 bg-amber-50 border-b">
                                    <SectionIcon className="w-4 h-4 text-amber-600" />
                                    <span className="font-semibold text-sm text-amber-800">{type}</span>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Content</Label>
                                        <RichTextEditor
                                            value={lessonData.content || ''}
                                            onChange={v => updateCSLesson(editingCS, li, 'content', v)}
                                            placeholder={
                                                type === 'Introduction'  ? 'Describe the case study background and why it matters...' :
                                                type === 'Dataset'       ? 'List and describe the datasets used (name, source, what it contains)...' :
                                                type === 'AI Task'       ? 'Describe the AI/ML approach for this case study (algorithms, objectives, expected outputs)...' :
                                                'List key academic papers and reading materials with full citations...'
                                            }
                                        />
                                    </div>
                                    <ResourceList
                                        label={type === 'Dataset' ? 'Dataset Links' : type === 'Key Readings' ? 'Paper / Reading Links' : 'Links & Resources'}
                                        values={lessonData.resources || []}
                                        onChange={r => updateCSLessonResources(editingCS, li, r)}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={() => setEditingCS(null)} className="gap-2 bg-amber-600 hover:bg-amber-700">
                        <Icons.CheckCircle className="w-4 h-4" /> Done — Back to Case Studies
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <Alert className="border-amber-200 bg-amber-50">
                <Icons.FlaskConical className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-amber-700 text-sm">
                    <strong>Case Studies</strong> are optional real-world examples for learners to reference. Each has 4 sections: Introduction, Dataset, AI Task, and Key Readings. They do <strong>not</strong> have quizzes.
                </AlertDescription>
            </Alert>

            <div className="space-y-3">
                {caseStudies.map((cs, i) => (
                    <div key={i} className="border-2 border-amber-100 rounded-xl p-5 bg-white hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                    <Icons.FlaskConical className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">
                                        {cs.caseStudyName || <span className="text-gray-400 italic">Untitled Case Study {i + 1}</span>}
                                    </p>
                                    <p className="text-xs text-amber-600 mt-0.5">4 sections: Introduction · Dataset · AI Task · Key Readings</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="default" size="sm" onClick={() => setEditingCS(i)} className="gap-1 bg-amber-500 hover:bg-amber-600">
                                    <Icons.Pencil className="w-3.5 h-3.5" /> Open & Edit
                                </Button>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeCS(i)}>
                                    <Icons.Trash2 className="w-4 h-4 text-red-400" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}

                {caseStudies.length === 0 && (
                    <div className="border-2 border-dashed border-amber-200 rounded-xl p-12 text-center">
                        <Icons.FlaskConical className="w-14 h-14 text-amber-200 mx-auto mb-3" />
                        <p className="text-base font-semibold text-gray-600">No case studies yet</p>
                        <p className="text-sm text-gray-400 mt-1">Case studies are optional. Add one if your module includes real-world examples.</p>
                    </div>
                )}

                <Button type="button" variant="outline" onClick={addCS} className="w-full gap-2 border-dashed border-2 border-amber-300 text-amber-700 hover:bg-amber-50 h-12">
                    <Icons.Plus className="w-5 h-5" /> Add Case Study
                </Button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// FINAL ASSESSMENT STEP
// ─────────────────────────────────────────────────────────────────
function FinalAssessmentStep({ assessment, onChange }) {
    const update = (field, value) => onChange({ ...assessment, [field]: value });
    const blank  = () => ({ text: '', type: 'multiple-choice', points: 1, options: ['', '', '', ''], correctAnswer: '', explanation: '', rubric: '' });

    const addQ    = ()         => update('questions', [...(assessment.questions || []), blank()]);
    const removeQ = (i)        => update('questions', assessment.questions.filter((_, idx) => idx !== i));
    const updateQ = (i, f, v) => { const n = [...assessment.questions]; n[i] = { ...n[i], [f]: v }; update('questions', n); };
    const updateOption = (qi, oi, v) => {
        const n = [...assessment.questions];
        const opts = [...(n[qi].options || [])];
        opts[oi] = v;
        n[qi] = { ...n[qi], options: opts };
        update('questions', n);
    };

    return (
        <div className="space-y-6">
            <Alert className="border-purple-200 bg-purple-50">
                <Icons.Lock className="w-4 h-4 text-purple-600" />
                <AlertDescription className="text-purple-700 text-sm">
                    This is the <strong>module-level final assessment</strong>. Learners must pass it to receive their certificate and unlock the next module or level. It is separate from individual lesson quizzes.
                </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label>Assessment Title <span className="text-red-500">*</span></Label>
                    <Input value={assessment.title || ''} onChange={e => update('title', e.target.value)} placeholder="e.g. Capstone Final Assessment" />
                </div>
                <div className="space-y-1">
                    <Label>Time Limit (minutes, optional)</Label>
                    <Input type="number" value={assessment.timeLimit || ''} onChange={e => update('timeLimit', Number(e.target.value))} placeholder="e.g. 120" />
                </div>
            </div>

            <div className="space-y-1">
                <Label>Instructions for Learners</Label>
                <Textarea value={assessment.instructions || ''} onChange={e => update('instructions', e.target.value)} placeholder="e.g. Learners must complete this final assessment to pass and receive the certificate. Learners cannot access the next module or level until this assessment is passed." rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label>Passing Score (%)</Label>
                    <Input type="number" value={assessment.passingScore || 70} onChange={e => update('passingScore', Number(e.target.value))} min={0} max={100} />
                </div>
                <div className="space-y-1">
                    <Label>Max Attempts</Label>
                    <Input type="number" value={assessment.maxAttempts || 3} onChange={e => update('maxAttempts', Number(e.target.value))} min={1} />
                </div>
            </div>

            <Separator />

            <div className="space-y-4">
                <div>
                    <h3 className="font-semibold text-gray-800">Questions</h3>
                    <p className="text-xs text-gray-500">Add all questions for the final assessment. Supports multiple choice, essays, and true/false.</p>
                </div>

                {(assessment.questions || []).map((q, i) => (
                    <div key={i} className="border-2 border-purple-100 rounded-xl p-4 space-y-4 bg-purple-50/20">
                        <div className="flex justify-between items-center">
                            <Badge className="bg-purple-100 text-purple-700">Question {i + 1}</Badge>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeQ(i)}>
                                <Icons.Trash2 className="w-4 h-4 text-red-400" />
                            </Button>
                        </div>
                        <Textarea value={q.text} onChange={e => updateQ(i, 'text', e.target.value)} placeholder="Question text..." rows={2} />
                        <div className="flex gap-3">
                            <Select value={q.type} onValueChange={v => updateQ(i, 'type', v)}>
                                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                    <SelectItem value="essay">Essay</SelectItem>
                                    <SelectItem value="true-false">True / False</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input type="number" className="w-28" value={q.points} onChange={e => updateQ(i, 'points', Number(e.target.value))} placeholder="Points" min={1} />
                        </div>
                        {q.type === 'multiple-choice' && (
                            <div className="space-y-2">
                                <Label className="text-xs text-gray-500">Options</Label>
                                {(q.options || []).map((opt, oi) => (
                                    <div key={oi} className="flex gap-2 items-center">
                                        <span className="text-xs text-gray-400 w-6">{String.fromCharCode(65 + oi)}.</span>
                                        <Input value={opt} onChange={e => updateOption(i, oi, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + oi)}`} />
                                    </div>
                                ))}
                            </div>
                        )}
                        {q.type !== 'essay' && (
                            <div className="space-y-1">
                                <Label className="text-xs">Correct Answer</Label>
                                {q.type === 'true-false' ? (
                                    <Select value={q.correctAnswer || ''} onValueChange={v => updateQ(i, 'correctAnswer', v)}>
                                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="True">True</SelectItem>
                                            <SelectItem value="False">False</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input value={q.correctAnswer || ''} onChange={e => updateQ(i, 'correctAnswer', e.target.value)} placeholder="Correct answer" />
                                )}
                            </div>
                        )}
                        {q.type === 'essay' && (
                            <div className="space-y-1">
                                <Label className="text-xs">Grading Rubric (used for AI-assisted grading)</Label>
                                <Textarea value={q.rubric || ''} onChange={e => updateQ(i, 'rubric', e.target.value)} placeholder="Describe what a good essay answer should include..." rows={3} />
                            </div>
                        )}
                        <div className="space-y-1">
                            <Label className="text-xs">Explanation (optional)</Label>
                            <Input value={q.explanation || ''} onChange={e => updateQ(i, 'explanation', e.target.value)} placeholder="Shown to learner after submission" />
                        </div>
                    </div>
                ))}

                {(assessment.questions || []).length === 0 && (
                    <div className="border-2 border-dashed border-purple-200 rounded-xl p-8 text-center text-sm text-gray-400">
                        No questions yet. Add at least one for the final assessment.
                    </div>
                )}
                <Button type="button" variant="outline" size="sm" onClick={addQ} className="gap-1 border-purple-300 text-purple-700 hover:bg-purple-50">
                    <Icons.Plus className="w-3 h-3" /> Add Question
                </Button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// STEPS CONFIG
// ─────────────────────────────────────────────────────────────────
const STEPS = [
    { id: 'info',       label: 'Module Info',       icon: Icons.Info,            desc: 'Title, description, level, outcomes' },
    { id: 'topics',     label: 'Topics & Lessons',  icon: Icons.Layers,          desc: 'Phases, lessons, tasks, quizzes' },
    { id: 'casestudies',label: 'Case Studies',      icon: Icons.FlaskConical,    desc: 'Optional real-world examples' },
    { id: 'resources',  label: 'Module Resources',  icon: Icons.Link,            desc: 'Bibliography, datasets, links' },
    { id: 'assessment', label: 'Final Assessment',  icon: Icons.ClipboardCheck,  desc: 'Certificate-granting assessment' },
    { id: 'review',     label: 'Review & Submit',   icon: Icons.Send,            desc: 'Check everything before saving' },
];

// ─────────────────────────────────────────────────────────────────
// DEFAULT FORM STATE
// ─────────────────────────────────────────────────────────────────
const defaultForm = {
    title: '',
    description: '',
    capstone: '',
    categoryId: '',
    level: '',
    duration: '',
    learningOutcomes: [],
    targetAudience: [],
    prerequisites: [],
    bannerUrl: '',
    moduleResources: [],
    topics: [],
    caseStudies: [],
    finalAssessment: {
        title: '',
        instructions: 'Learners must complete this final assessment to pass and receive the certificate. Learners cannot access the next module or level until this assessment is passed.',
        questions: [],
        passingScore: 70,
        maxAttempts: 3,
        timeLimit: null,
    },
};

// ─────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────
export default function CreateModulePage() {
    const router = useRouter();
    const [step, setStep]           = useState(0);
    const [form, setForm]           = useState(defaultForm);
    const [categories, setCategories] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        categoryService.getAllCategories()
            .then(d => setCategories(d || []))
            .catch(() => {});
    }, []);

    const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
    const progress   = Math.round(((step + 1) / STEPS.length) * 100);

    const handleSubmit = async () => {
        if (!form.title || !form.description || !form.categoryId || !form.level) {
            toast.error('Please fill in all required fields in Module Info.');
            setStep(0);
            return;
        }
        setSubmitting(true);
        try {
            await moduleService.createModule(form);
            toast.success('Module created successfully!');
            router.push('/instructor/modules');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to create module');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Step content ──────────────────────────────────────────
    const renderStep = () => {
        switch (STEPS[step].id) {

            // ── Module Info ──────────────────────────────────
            case 'info':
                return (
                    <div className="space-y-8">
                        {/* Basic */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">1</div>
                                <h3 className="font-semibold text-gray-800">Basic Information</h3>
                            </div>
                            <div className="space-y-1">
                                <Label>Module Title <span className="text-red-500">*</span></Label>
                                <Input value={form.title} onChange={e => updateForm('title', e.target.value)} placeholder="e.g. Leveraging AI for Climate Resilience Capstone" className="text-base" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label>Category <span className="text-red-500">*</span></Label>
                                    <Select value={form.categoryId} onValueChange={v => updateForm('categoryId', v)}>
                                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                        <SelectContent>
                                            {categories.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Level <span className="text-red-500">*</span></Label>
                                    <Select value={form.level} onValueChange={v => updateForm('level', v)}>
                                        <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="beginner">Beginner</SelectItem>
                                            <SelectItem value="intermediate">Intermediate</SelectItem>
                                            <SelectItem value="advanced">Advanced</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label>Total Duration</Label>
                                <Input value={form.duration} onChange={e => updateForm('duration', e.target.value)} placeholder="e.g. 6–9 months" />
                            </div>
                        </section>

                        {/* Introduction */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">2</div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">Introduction / Description <span className="text-red-500">*</span></h3>
                                    <p className="text-xs text-gray-500">Explain what this module is about and why it matters.</p>
                                </div>
                            </div>
                            <RichTextEditor
                                value={form.description}
                                onChange={v => updateForm('description', v)}
                                placeholder="This module teaches learners how to leverage AI and ML techniques to address climate resilience challenges..."
                            />
                        </section>

                        {/* Capstone */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">3</div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">Capstone Project Description</h3>
                                    <p className="text-xs text-gray-500">Describe the final project learners will design and submit.</p>
                                </div>
                            </div>
                            <RichTextEditor
                                value={form.capstone}
                                onChange={v => updateForm('capstone', v)}
                                placeholder="At the end of this module, learners will design an AI-driven solution for a climate resilience problem..."
                            />
                        </section>

                        {/* Lists */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">4</div>
                                <h3 className="font-semibold text-gray-800">Outcomes, Audience & Prerequisites</h3>
                            </div>
                            <BulletList label="Learning Outcomes" hint="What will learners achieve by the end of this module?" values={form.learningOutcomes} onChange={v => updateForm('learningOutcomes', v)} placeholder="e.g. Develop and validate AI/ML models for climate challenges" />
                            <BulletList label="Target Audience" hint="Who is this module designed for?" values={form.targetAudience} onChange={v => updateForm('targetAudience', v)} placeholder="e.g. Climate researchers, Graduate students" />
                            <BulletList label="Prerequisites" hint="What should learners already know before taking this module?" values={form.prerequisites} onChange={v => updateForm('prerequisites', v)} placeholder="e.g. Basic Python programming" />
                        </section>

                        {/* Banner */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">5</div>
                                <h3 className="font-semibold text-gray-800">Module Banner Image</h3>
                            </div>
                            <BannerUploader value={form.bannerUrl} onChange={v => updateForm('bannerUrl', v)} />
                        </section>
                    </div>
                );

            case 'topics':
                return <TopicsStep topics={form.topics} onChange={v => updateForm('topics', v)} />;

            case 'casestudies':
                return <CaseStudiesStep caseStudies={form.caseStudies} onChange={v => updateForm('caseStudies', v)} />;

            case 'resources':
                return (
                    <div className="space-y-5">
                        <Alert className="border-teal-200 bg-teal-50">
                            <Icons.Link className="w-4 h-4 text-teal-600" />
                            <AlertDescription className="text-teal-700 text-sm">
                                These resources apply to the <strong>whole module</strong> — not a specific lesson. Use this for bibliography, recommended reading lists, datasets, code repositories, and recorded lectures.
                            </AlertDescription>
                        </Alert>
                        <ResourceList
                            label="Module-Level Resources"
                            hint="e.g. Bibliography, online learning links, recorded lectures, code repositories"
                            values={form.moduleResources}
                            onChange={v => updateForm('moduleResources', v)}
                        />
                    </div>
                );

            case 'assessment':
                return <FinalAssessmentStep assessment={form.finalAssessment} onChange={v => updateForm('finalAssessment', v)} />;

            case 'review':
                return (
                    <div className="space-y-5">
                        <Alert className="border-green-200 bg-green-50">
                            <Icons.CheckCircle className="w-4 h-4 text-green-600" />
                            <AlertDescription className="text-green-700 text-sm">
                                Review your module before creating it. It will be saved as a <strong>draft</strong> — you can edit and submit for approval later.
                            </AlertDescription>
                        </Alert>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Title', value: form.title || '—' },
                                { label: 'Level / Duration', value: `${form.level || '—'} · ${form.duration || '—'}` },
                                { label: 'Topics', value: `${form.topics.length} topic${form.topics.length !== 1 ? 's' : ''} · ${form.topics.reduce((a, t) => a + (t.lessons?.length || 0), 0)} total lessons` },
                                { label: 'Case Studies', value: `${form.caseStudies.length} case stud${form.caseStudies.length !== 1 ? 'ies' : 'y'}` },
                                { label: 'Module Resources', value: `${form.moduleResources.length} resource${form.moduleResources.length !== 1 ? 's' : ''}` },
                                { label: 'Final Assessment', value: `${form.finalAssessment?.questions?.length || 0} questions · Pass: ${form.finalAssessment?.passingScore || 70}%` },
                                { label: 'Learning Outcomes', value: `${form.learningOutcomes.length} outcome${form.learningOutcomes.length !== 1 ? 's' : ''}` },
                                { label: 'Target Audience', value: form.targetAudience.join(', ') || '—' },
                            ].map(({ label, value }) => (
                                <Card key={label}>
                                    <CardContent className="pt-4">
                                        <p className="text-xs text-gray-500 uppercase font-semibold">{label}</p>
                                        <p className="font-medium text-gray-800 mt-1 capitalize">{value}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        {form.learningOutcomes.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-gray-600">Learning Outcomes</p>
                                {form.learningOutcomes.map((o, i) => (
                                    <div key={i} className="flex items-start gap-2 text-sm">
                                        <Icons.CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span>{o}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster position="top-right" />

            {/* ── Top header ─────────────────────────────── */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <Icons.ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Create New Module</h1>
                        <p className="text-sm text-gray-500">
                            Step {step + 1} of {STEPS.length} — <span className="font-medium text-gray-700">{STEPS[step].label}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">{progress}% complete</span>
                    <div className="w-36">
                        <Progress value={progress} className="h-2" />
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8 flex gap-6">

                {/* ── Left sidebar: step list ─────────── */}
                <div className="w-60 flex-shrink-0">
                    <div className="sticky top-24 space-y-1">
                        <p className="text-xs font-semibold text-gray-400 uppercase px-3 mb-2">Steps</p>
                        {STEPS.map((s, i) => {
                            const Icon = s.icon;
                            const done   = i < step;
                            const active = i === step;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => setStep(i)}
                                    className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                                        active ? 'bg-blue-600 text-white shadow-sm' :
                                        done   ? 'bg-green-50 text-green-800 hover:bg-green-100' :
                                                 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        {done
                                            ? <Icons.CheckCircle className="w-4 h-4 text-green-600" />
                                            : <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-400'}`} />
                                        }
                                    </div>
                                    <div>
                                        <p className={`text-sm font-medium leading-tight ${active ? 'text-white' : ''}`}>{s.label}</p>
                                        <p className={`text-xs mt-0.5 leading-tight ${active ? 'text-blue-100' : 'text-gray-400'}`}>{s.desc}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Main content area ──────────────── */}
                <div className="flex-1 min-w-0">
                    <Card className="shadow-sm">
                        <CardHeader className="border-b bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                {React.createElement(STEPS[step].icon, { className: 'w-6 h-6 text-blue-600' })}
                                <div>
                                    <CardTitle className="text-lg">{STEPS[step].label}</CardTitle>
                                    <p className="text-sm text-gray-500 mt-0.5">{STEPS[step].desc}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 pb-8">
                            {renderStep()}
                        </CardContent>
                    </Card>

                    {/* ── Navigation ─────────────────── */}
                    <div className="flex justify-between mt-5">
                        <Button variant="outline" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="gap-2">
                            <Icons.ArrowLeft className="w-4 h-4" /> Previous
                        </Button>
                        {step < STEPS.length - 1 ? (
                            <Button onClick={() => setStep(s => s + 1)} className="gap-2">
                                Next: {STEPS[step + 1].label} <Icons.ArrowRight className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Button onClick={handleSubmit} disabled={submitting} className="gap-2 bg-green-600 hover:bg-green-700">
                                {submitting
                                    ? <><Icons.Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                                    : <><Icons.Send className="w-4 h-4" /> Create Module</>
                                }
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
