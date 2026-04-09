'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import moduleService from '@/lib/api/moduleService';
import categoryService from '@/lib/api/categoryService';
import { useDraft } from '@/hooks/useDraft';
import RichTextEditor from '@/components/ui/RichTextEditor';
import BannerUploader from '@/components/ui/BannerUploader';
import VideoUploader from '@/components/ui/VideoUploader';
import ResourceUploader from '@/components/ui/ResourceUploader';
import LessonBuilder from '@/components/instructor/LessonBuilder';
import InteractiveCodeEditor from '@/components/student/InteractiveCodeEditor';
import ModuleStudentPreview from '@/components/shared/ModuleStudentPreview';

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
import { Dialog, DialogContent } from '@/components/ui/dialog';

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Numbered bullet list (outcomes, tasks, prerequisites, etc.) */
function BulletList({ label, hint, values, onChange, placeholder, required }) {
  const add = () => onChange([...values, '']);
  const update = (i, v) => { const n = [...values]; n[i] = v; onChange(n); };
  const remove = (i) => onChange(values.filter((_, idx) => idx !== i));

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
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              className="flex-1"
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}>
              <Icons.X className="w-4 h-4 text-gray-400 hover:text-red-500" />
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
function ResourceList({ label, hint, values = [], onChange }) {
  const blank = () => ({ url: '', name: '', description: '', fileType: '' });
  const add = () => onChange([...values, blank()]);
  const update = (i, f, v) => { const n = [...values]; n[i] = { ...n[i], [f]: v }; onChange(n); };
  const remove = (i) => onChange(values.filter((_, idx) => idx !== i));

  const mapExtensionToType = (fileName) => {
    const ext = (fileName || '').split('.').pop()?.toLowerCase();
    if (!ext) return 'other';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'notebook';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'dataset';
    if (['ppt', 'pptx'].includes(ext)) return 'dataset';
    return 'other';
  };

  const handleUploadResources = (uploadedResources) => {
    const mapped = (uploadedResources || []).map((r) => ({
      url: r.url || (typeof r === 'string' ? r : ''),
      name: r.name || r.originalName || (typeof r === 'string' ? r.split('/').pop() : '') || 'Resource',
      description: r.description || '',
      fileType: r.fileType || mapExtensionToType(r.name || r.originalName || r.url),
    }));
    onChange(mapped);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="font-semibold">{label}</Label>
        {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
      </div>
      <div className="mb-3">
        <ResourceUploader value={values} onChange={handleUploadResources} label="Upload documents" />
      </div>
      {values.map((r, i) => (
        <div key={i} className="border rounded-xl p-4 space-y-3 bg-gray-50/50">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Resource {i + 1}</span>
            <div className="flex items-center gap-1">
              {r.url && (() => {
                const ext = (r.name || r.url || '').split('.').pop()?.toLowerCase();
                const isPdf = ext === 'pdf';
                const href = isPdf ? r.url : r.url.replace('/upload/', '/upload/fl_attachment/');
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    {...(!isPdf && { download: r.name })}
                    className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                    title={isPdf ? 'Open PDF' : 'Download'}
                  >
                    {isPdf
                      ? <Icons.ExternalLink className="w-3.5 h-3.5" />
                      : <Icons.Download className="w-3.5 h-3.5" />
                    }
                  </a>
                );
              })()}
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}>
                <Icons.Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Name <span className="text-red-500">*</span></Label>
              <Input value={r.name} onChange={(e) => update(i, 'name', e.target.value)} placeholder="e.g. ERA5 Reanalysis Dataset" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Type</Label>
              <Select value={r.fileType} onValueChange={(v) => update(i, 'fileType', v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {['link', 'pdf', 'notebook', 'dataset', 'video', 'other'].map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">URL <span className="text-gray-400 font-normal">(optional)</span></Label>
            <Input value={r.url} onChange={(e) => update(i, 'url', e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Description <span className="text-gray-400 font-normal">(optional)</span></Label>
            <Input value={r.description} onChange={(e) => update(i, 'description', e.target.value)} placeholder="Brief description..." />
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

// ─────────────────────────────────────────────────────────────────────────────
// FINAL ASSESSMENT STEP
// ─────────────────────────────────────────────────────────────────────────────

function FinalAssessmentStep({ assessment, onChange }) {
  const update = (field, value) => onChange({ ...assessment, [field]: value });
  const blank = () => ({ text: '', type: 'multiple-choice', points: 1, options: ['', '', '', ''], correctAnswer: '', explanation: '', rubric: '' });

  const addQ = () => update('questions', [...(assessment.questions || []), blank()]);
  const removeQ = (i) => update('questions', assessment.questions.filter((_, idx) => idx !== i));
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
          This is the <strong>module-level final assessment</strong>. It is separate from individual lesson quizzes.
          <strong> This step is optional</strong> — you can skip it now and add or edit the final assessment later from the module detail page.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Assessment Title <span className="text-red-500">*</span></Label>
          <Input value={assessment.title || ''} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Module Final Assessment" />
        </div>
        <div className="space-y-1.5">
          <Label>Time Limit <span className="text-gray-400 font-normal text-xs">(minutes, optional)</span></Label>
          <Input type="number" value={assessment.timeLimit || ''} onChange={(e) => update('timeLimit', Number(e.target.value))} placeholder="e.g. 120" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Instructions for Learners</Label>
        <Textarea
          value={assessment.instructions || ''}
          onChange={(e) => update('instructions', e.target.value)}
          placeholder="Instructions shown to learners before they begin..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Passing Score (%)</Label>
          <Input type="number" value={assessment.passingScore || 70} onChange={(e) => update('passingScore', Number(e.target.value))} min={0} max={100} />
        </div>
        <div className="space-y-1.5">
          <Label>Max Attempts</Label>
          <Input type="number" value={assessment.maxAttempts || 3} onChange={(e) => update('maxAttempts', Number(e.target.value))} min={1} />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-800">Questions</h3>
          <p className="text-xs text-gray-500 mt-0.5">Supports multiple choice, true/false, and essay questions.</p>
        </div>

        {(assessment.questions || []).map((q, i) => (
          <div key={i} className="border-2 border-purple-100 rounded-xl p-4 space-y-4 bg-purple-50/20">
            <div className="flex justify-between items-center">
              <Badge className="bg-purple-100 text-purple-700 border-0">Question {i + 1}</Badge>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeQ(i)}>
                <Icons.Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
              </Button>
            </div>
            <Textarea value={q.text} onChange={(e) => updateQ(i, 'text', e.target.value)} placeholder="Question text..." rows={2} />
            <div className="flex gap-3">
              <Select value={q.type} onValueChange={(v) => updateQ(i, 'type', v)}>
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                  <SelectItem value="essay">Essay</SelectItem>
                  <SelectItem value="true-false">True / False</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" className="w-28" value={q.points} onChange={(e) => updateQ(i, 'points', Number(e.target.value))} placeholder="Points" min={1} />
            </div>
            {q.type === 'multiple-choice' && (
              <div className="space-y-2">
                <Label className="text-xs text-gray-500">Options</Label>
                {(q.options || []).map((opt, oi) => (
                  <div key={oi} className="flex gap-2 items-center">
                    <span className="text-xs text-gray-400 w-6">{String.fromCharCode(65 + oi)}.</span>
                    <Input value={opt} onChange={(e) => updateOption(i, oi, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + oi)}`} />
                  </div>
                ))}
              </div>
            )}
            {q.type !== 'essay' && (
              <div className="space-y-1.5">
                <Label className="text-xs">Correct Answer</Label>
                {q.type === 'true-false' ? (
                  <Select value={q.correctAnswer || ''} onValueChange={(v) => updateQ(i, 'correctAnswer', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="True">True</SelectItem>
                      <SelectItem value="False">False</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={q.correctAnswer || ''} onChange={(e) => updateQ(i, 'correctAnswer', e.target.value)} placeholder="Correct answer" />
                )}
              </div>
            )}
            {q.type === 'essay' && (
              <div className="space-y-1.5">
                <Label className="text-xs">Grading Rubric <span className="text-gray-400 font-normal">(used for AI-assisted grading)</span></Label>
                <Textarea value={q.rubric || ''} onChange={(e) => updateQ(i, 'rubric', e.target.value)} placeholder="Describe what a good essay answer should include..." rows={3} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Explanation <span className="text-gray-400 font-normal">(optional — shown after submission)</span></Label>
              <Input value={q.explanation || ''} onChange={(e) => updateQ(i, 'explanation', e.target.value)} placeholder="Shown to learner after submission" />
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

// ─────────────────────────────────────────────────────────────────────────────
// MODULE PREVIEW
// ─────────────────────────────────────────────────────────────────────────────

// ModulePreview and PreviewSlide are now in @/components/shared/ModuleStudentPreview
// kept as a thin wrapper so the existing {showPreview && <ModulePreview .../>} call still works
function ModulePreview({ form, onClose }) {
  return <ModuleStudentPreview module={form} onClose={onClose} />;
}


// ─────────────────────────────────────────────────────────────────────────────
// STEPS CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'info', label: 'Module Info', icon: Icons.Info, desc: 'Title, description, level, outcomes' },
  { id: 'lessons', label: 'Lessons', icon: Icons.BookOpen, desc: 'Build lessons with slides and quizzes' },
  { id: 'resources', label: 'Module Resources', icon: Icons.Link, desc: 'Bibliography, datasets, links' },
  { id: 'assessment', label: 'Final Assessment', icon: Icons.ClipboardCheck, desc: 'Certificate-granting assessment' },
  { id: 'review', label: 'Review & Preview', icon: Icons.Eye, desc: 'Preview as student & submit' },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Strip HTML tags — used before sending WYSIWYG content to the API */
const stripHtml = (html) => (html || '').replace(/<[^>]*>/g, '').trim();

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT FORM STATE
// ─────────────────────────────────────────────────────────────────────────────

const defaultForm = {
  title: '',
  description: '',
  capstone: '',
  categoryId: '',
  level: '',
  duration: '',
  learningObjectives: '',
  learningOutcomes: '',
  moduleTopics: '',
  targetAudience: [],
  prerequisites: [],
  coreReadingMaterials: '',
  bannerUrl: '',
  introVideoUrl: '',
  moduleResources: [],
  lessons: [],
  finalAssessment: {
    title: '',
    instructions: 'Learners must complete this final assessment to pass and receive the certificate.',
    questions: [],
    passingScore: 70,
    maxAttempts: 3,
    timeLimit: null,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function CreateModulePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(defaultForm);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [savingModuleDraft, setSavingModuleDraft] = useState(false);

  // Track whether this draft was already persisted as a real module (status:'draft')
  // Must start null on both server and client to avoid hydration mismatch;
  // the real value is loaded in useEffect after mount.
  const [savedModuleId, setSavedModuleId] = useState(null);

  const { status: draftStatus, hasDraft, getDraft, discardDraft, saveDraft, savedAgoLabel } = useDraft(
    'module_instructor_draft_new',
    form,
    { contentType: 'module', title: form.title || 'New Module' }
  );
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  useEffect(() => {
    if (hasDraft) setShowDraftBanner(true);
  }, [hasDraft]);

  useEffect(() => {
    // Read localStorage only after mount (safe from hydration mismatch)
    try {
      const stored = localStorage.getItem('instructor_draft_module_id');
      if (stored) setSavedModuleId(stored);
    } catch { }
  }, []);

  useEffect(() => {
    categoryService.getAllCategories()
      .then((d) => setCategories(d || []))
      .catch(() => { });
  }, []);

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  // Extract case studies from lessons before submitting
  const buildPayload = () => {
    const caseStudies = (form.lessons || [])
      .filter((l) => l._caseStudy && l._caseStudy.name)
      .map((l) => ({
        caseStudyName: l._caseStudy.name,
        lessons: [
          { lessonType: 'Introduction', content: l._caseStudy.introduction || '', resources: [] },
          { lessonType: 'Dataset', content: l._caseStudy.dataset || '', resources: [] },
          { lessonType: 'AI Task', content: l._caseStudy.aiTask || '', resources: [] },
          { lessonType: 'Key Readings', content: l._caseStudy.keyReadings || '', resources: [] },
        ],
      }));

    const cleanLessons = (form.lessons || []).map(({ _caseStudy, ...rest }) => rest);
    return {
      ...form,
      learningObjectives: stripHtml(form.learningObjectives),
      learningOutcomes: stripHtml(form.learningOutcomes),
      moduleTopics: stripHtml(form.moduleTopics),
      coreReadingMaterials: stripHtml(form.coreReadingMaterials),
      lessons: cleanLessons,
      caseStudies,
    };
  };

  // Save as a real draft module in the DB so it shows up in My Modules → Drafts
  const handleSaveDraft = async () => {
    saveDraft(); // persist to draft store (for restore banner)
    setSavingModuleDraft(true);
    try {
      const payload = buildPayload();
      let moduleId = savedModuleId;
      if (moduleId) {
        await moduleService.updateModule(moduleId, payload);
      } else {
        const created = await moduleService.createModule(payload);
        moduleId = created?._id || created?.id;
        if (moduleId) {
          setSavedModuleId(moduleId);
          try { localStorage.setItem('instructor_draft_module_id', moduleId); } catch { }
        }
      }
      toast.success('Draft saved! You can find it under My Modules → Drafts.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save draft');
    } finally {
      setSavingModuleDraft(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.categoryId || !form.level) {
      toast.error('Please fill in all required fields in Module Info.');
      setStep(0);
      return;
    }
    setSubmitting(true);
    try {
      let newId;
      const payload = buildPayload();
      if (savedModuleId) {
        // Update the existing draft module instead of creating a duplicate
        await moduleService.updateModule(savedModuleId, payload);
        newId = savedModuleId;
      } else {
        const created = await moduleService.createModule(payload);
        newId = created?._id || created?.id;
      }
      discardDraft();
      try { localStorage.removeItem('instructor_draft_module_id'); } catch { }
      setSavedModuleId(null);
      toast.success('Module created successfully!');
      // Small delay lets React flush state updates and Quill disable itself
      // before navigation tears down the DOM (prevents removeChild errors).
      setTimeout(() => {
        if (newId) {
          router.push(`/instructor/modules/${newId}?new=true`);
        } else {
          router.push('/instructor/modules');
        }
      }, 100);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create module');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestoreDraft = () => {
    const draft = getDraft();
    if (draft?.data) {
      setForm(draft.data);
      setShowDraftBanner(false);
      toast.success('Draft restored!');
    }
  };
  const handleDiscardDraft = () => {
    discardDraft();
    setShowDraftBanner(false);
    setSavedModuleId(null);
    try { localStorage.removeItem('instructor_draft_module_id'); } catch { }
  };

  // ── Step content ─────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (STEPS[step].id) {

      // ── Module Info ────────────────────────────────────────────────────────
      case 'info':
        return (
          <div className="space-y-8">
            {/* Basic details */}
            <section className="space-y-5">
              <SectionHeading number={1} title="Basic Details" />
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="font-semibold">Module Title <span className="text-red-500">*</span></Label>
                  <Input
                    value={form.title}
                    onChange={(e) => updateForm('title', e.target.value)}
                    placeholder="e.g. Leveraging AI for Climate Resilience"
                    className="text-base"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Category <span className="text-red-500">*</span></Label>
                    <Select value={form.categoryId} onValueChange={(v) => updateForm('categoryId', v)}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Level <span className="text-red-500">*</span></Label>
                    <Select value={form.level} onValueChange={(v) => updateForm('level', v)}>
                      <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Total Duration</Label>
                    <Input
                      value={form.duration}
                      onChange={(e) => updateForm('duration', e.target.value)}
                      placeholder="e.g. 6–9 months"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Description */}
            <section className="space-y-4">
              <SectionHeading number={2} title="Module Description" subtitle="Explain what this module is about and why it matters." required />
              <RichTextEditor
                value={form.description}
                onChange={(v) => updateForm('description', v)}
                placeholder="This module teaches learners how to leverage AI and ML techniques..."
                height={200}
              />
            </section>

            {/* Capstone */}
            <section className="space-y-4">
              <SectionHeading number={3} title="Capstone Project" subtitle="Optional — describe the final project learners will design and submit." />
              <RichTextEditor
                value={form.capstone}
                onChange={(v) => updateForm('capstone', v)}
                placeholder="At the end of this module, learners will design an AI-driven solution..."
                height={150}
              />
            </section>

            {/* Objectives / Outcomes / Audience / Prerequisites */}
            <section className="space-y-6">
              <SectionHeading number={4} title="Objectives, Outcomes, Audience & Prerequisites" />
              <div className="space-y-2">
                <Label className="font-semibold">Learning Objectives</Label>
                <p className="text-xs text-gray-500">What does this module aim to teach? (The instructor's goals)</p>
                <RichTextEditor
                  value={form.learningObjectives}
                  onChange={(v) => updateForm('learningObjectives', v)}
                  placeholder="e.g. To introduce participants to the fundamental concepts of climate change..."
                  height={160}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Expected Learning Outcomes</Label>
                <p className="text-xs text-gray-500">What will learners be able to do by the end of this module?</p>
                <RichTextEditor
                  value={form.learningOutcomes}
                  onChange={(v) => updateForm('learningOutcomes', v)}
                  placeholder="e.g. Define key concepts related to climate change..."
                  height={160}
                />
              </div>
              <BulletList
                label="Target Audience"
                hint="Who is this module designed for? (Optional)"
                values={form.targetAudience}
                onChange={(v) => updateForm('targetAudience', v)}
                placeholder="e.g. Climate researchers, Graduate students"
              />
              <BulletList
                label="Prerequisites"
                hint="What should learners already know before starting? (Optional)"
                values={form.prerequisites}
                onChange={(v) => updateForm('prerequisites', v)}
                placeholder="e.g. Basic Python programming"
              />
            </section>

            {/* Module Content / Topics */}
            <section className="space-y-4">
              <SectionHeading number={5} title="Module Content" subtitle="List the topics and subject areas covered in this module." />
              <RichTextEditor
                value={form.moduleTopics}
                onChange={(v) => updateForm('moduleTopics', v)}
                placeholder="e.g. 1. Overview of climate change science and fundamentals of climate&#10;2. Key concepts and terminologies..."
                height={160}
              />
            </section>

            {/* Core Reading Materials */}
            <section className="space-y-4">
              <SectionHeading number={6} title="Core Reading Materials" subtitle="Add required or recommended readings for this module." />
              <RichTextEditor
                value={form.coreReadingMaterials}
                onChange={(v) => updateForm('coreReadingMaterials', v)}
                placeholder="e.g. Houghton, D. D. (2002). Introduction to Climate Change. World Meteorological Organization, Geneva."
                height={180}
              />
            </section>

            {/* Banner */}
            <section className="space-y-4">
              <SectionHeading number={7} title="Banner Image" />
              <BannerUploader value={form.bannerUrl} onChange={(v) => updateForm('bannerUrl', v)} />
            </section>

            {/* Intro Video */}
            <section className="space-y-4">
              <SectionHeading number={8} title="Module Intro Video" subtitle="Optional — shown to students before they start the first lesson" />
              <VideoUploader value={form.introVideoUrl} onChange={(v) => updateForm('introVideoUrl', v)} />
            </section>
          </div>
        );

      // ── Lessons ────────────────────────────────────────────────────────────
      case 'lessons':
        return (
          <div className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <Icons.BookOpen className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-blue-700 text-sm">
                Build your lessons below. Each lesson can have <strong>slides</strong> (text, image, video, diagram, or interactive code),
                an optional <strong>case study</strong>, <strong>resources</strong>, and an optional <strong>quiz</strong> that learners must pass before proceeding.
              </AlertDescription>
            </Alert>
            <LessonBuilder
              lessons={form.lessons || []}
              onChange={(v) => updateForm('lessons', v)}
              onSaveDraft={handleSaveDraft}
              draftStatus={savingModuleDraft ? 'saving' : draftStatus}
            />
          </div>
        );

      // ── Module Resources ───────────────────────────────────────────────────
      case 'resources':
        return (
          <div className="space-y-5">
            <Alert className="border-teal-200 bg-teal-50">
              <Icons.Link className="w-4 h-4 text-teal-600" />
              <AlertDescription className="text-teal-700 text-sm">
                These resources apply to the <strong>whole module</strong>, not a specific lesson. Use this for
                bibliography, recommended reading lists, datasets, code repositories, and recorded lectures.
                Lesson-specific resources can be added inside each lesson.
              </AlertDescription>
            </Alert>
            <ResourceList
              label="Module-Level Resources"
              hint="e.g. Bibliography, online learning links, recorded lectures, code repositories"
              values={form.moduleResources}
              onChange={(v) => updateForm('moduleResources', v)}
            />
          </div>
        );

      // ── Final Assessment ───────────────────────────────────────────────────
      case 'assessment':
        return <FinalAssessmentStep assessment={form.finalAssessment} onChange={(v) => updateForm('finalAssessment', v)} />;

      // ── Review & Preview ───────────────────────────────────────────────────
      case 'review':
        return (
          <div className="space-y-6">
            <Alert className="border-green-200 bg-green-50">
              <Icons.CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-700 text-sm">
                Your module will be saved as a <strong>draft</strong>. You can edit it and submit for approval later.
              </AlertDescription>
            </Alert>

            {/* Preview button */}
            <div className="p-5 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/30 text-center space-y-3">
              <Icons.Eye className="w-10 h-10 text-blue-300 mx-auto" />
              <div>
                <p className="font-semibold text-gray-800">Preview as a Student</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  See exactly how your module and lessons will appear to learners.
                </p>
              </div>
              <Button onClick={() => setShowPreview(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Icons.Eye className="w-4 h-4" /> Open Student Preview
              </Button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: 'Module',
                  value: form.title || '—',
                  sub: `${form.level || '—'} · ${form.duration || '—'}`,
                  icon: Icons.BookMarked,
                  color: 'blue',
                },
                {
                  label: 'Lessons',
                  value: `${(form.lessons || []).length} lesson${(form.lessons || []).length !== 1 ? 's' : ''}`,
                  sub: `${(form.lessons || []).reduce((a, l) => a + (l.slides || []).length, 0)} total slides`,
                  icon: Icons.BookOpen,
                  color: 'green',
                },
                {
                  label: 'Module Resources',
                  value: `${(form.moduleResources || []).length} resource${(form.moduleResources || []).length !== 1 ? 's' : ''}`,
                  sub: 'Module-level materials',
                  icon: Icons.Link,
                  color: 'teal',
                },
                {
                  label: 'Final Assessment',
                  value: `${(form.finalAssessment?.questions || []).length} question${(form.finalAssessment?.questions || []).length !== 1 ? 's' : ''}`,
                  sub: `Pass: ${form.finalAssessment?.passingScore || 70}%`,
                  icon: Icons.ClipboardCheck,
                  color: 'purple',
                },
              ].map(({ label, value, sub, icon: Icon, color }) => (
                <Card key={label} className={`border-${color}-100`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg bg-${color}-100 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 text-${color}-600`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                        <p className="font-semibold text-gray-900 mt-0.5 break-words leading-snug">{value}</p>
                        <p className="text-xs text-gray-500 mt-0.5 break-words">{sub}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Learning outcomes preview */}
            {form.learningOutcomes && form.learningOutcomes.length > 0 && form.learningOutcomes !== '<p><br></p>' && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-600">Module Learning Outcomes</p>
                <div className="border rounded-xl p-4 bg-gray-50/50">
                  <div
                    className="prose prose-sm max-w-none text-gray-700 [&_p]:leading-relaxed [&_p]:mb-2 [&_ul]:pl-4 [&_li]:mb-1"
                    dangerouslySetInnerHTML={{ __html: form.learningOutcomes }}
                  />
                </div>
              </div>
            )}

            {/* Validation warnings */}
            {(!form.title || !form.description || !form.categoryId || !form.level) && (
              <Alert className="border-amber-200 bg-amber-50">
                <Icons.AlertTriangle className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-amber-700 text-sm">
                  <strong>Missing required fields:</strong>{' '}
                  {[
                    !form.title && 'Module title',
                    !form.description && 'Description',
                    !form.categoryId && 'Category',
                    !form.level && 'Level',
                  ].filter(Boolean).join(', ')}.
                  Go back to Module Info to fill them in.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Preview modal */}
      {showPreview && (
        <ModulePreview form={form} onClose={() => setShowPreview(false)} />
      )}

      {/* ── Top header + draft banner (sticky together below fixed app navbar) */}
      <div className="sticky top-24 z-10">
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <Icons.ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Create New Module</h1>
              <p className="text-sm text-gray-500">
                Step {step + 1} of {STEPS.length} —{' '}
                <span className="font-medium text-gray-700">{STEPS[step].label}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(true)}
              className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Icons.Eye className="w-4 h-4" /> Preview
            </Button>
            {draftStatus === 'unsaved' && (
              <span className="text-xs text-amber-600 hidden sm:flex items-center gap-1">
                <Icons.Circle className="w-2.5 h-2.5 fill-amber-500" />
                Unsaved changes
              </span>
            )}
            {draftStatus === 'saving' && (
              <span className="text-xs text-blue-500 hidden sm:flex items-center gap-1 animate-pulse">
                <Icons.Loader2 className="w-3 h-3 animate-spin" />
                Saving…
              </span>
            )}
            {draftStatus === 'saved' && (
              <span className="text-xs text-emerald-600 hidden sm:flex items-center gap-1">
                <Icons.CheckCircle2 className="w-3 h-3" />
                {savedAgoLabel || 'Saved'}
              </span>
            )}
            {draftStatus === 'local_only' && (
              <span className="text-xs text-orange-500 hidden sm:flex items-center gap-1" title="Saved on this device only. Use 'Save Draft' to save to your account.">
                <Icons.AlertTriangle className="w-3 h-3" />
                Saved locally only
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={draftStatus === 'saving' || savingModuleDraft}
              className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hidden sm:flex"
            >
              {savingModuleDraft
                ? <><Icons.Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                : <><Icons.Save className="w-3.5 h-3.5" /> Save Draft</>
              }
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">{progress}%</span>
              <div className="w-32">
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Draft restore banner — inside the sticky wrapper so it's never hidden */}
        {showDraftBanner && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <Icons.Clock className="w-4 h-4 text-amber-600" />
              <span>You have an unsaved draft. Restore it to continue where you left off.</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleDiscardDraft} className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100">
                Discard
              </Button>
              <Button size="sm" onClick={handleRestoreDraft} className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white">
                Restore Draft
              </Button>
            </div>
          </div>
        )}

        {/* Saved-to-modules banner — shows after first Save Draft */}
        {savedModuleId && !showDraftBanner && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 flex items-center gap-2 text-sm text-emerald-800">
            <Icons.CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Draft saved to <strong>My Modules → Drafts</strong>. You can return and continue editing any time.</span>
            <button
              onClick={() => router.push('/instructor/modules')}
              className="ml-auto text-xs text-emerald-700 underline hover:text-emerald-900"
            >
              View in My Modules
            </button>
          </div>
        )}
      </div>{/* end sticky wrapper */}

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-6">

        {/* ── Left sidebar ──────────────────────────────────────────── */}
        <div className="w-56 flex-shrink-0">
          <div className="sticky top-24 space-y-1">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Steps</p>
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = i < step;
              const active = i === step;
              return (
                <button
                  key={s.id}
                  onClick={() => setStep(i)}
                  className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all ${active ? 'bg-blue-600 text-white shadow-sm' :
                    done ? 'bg-green-50 text-green-800 hover:bg-green-100' :
                      'text-gray-500 hover:bg-gray-100'
                    }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {done
                      ? <Icons.CheckCircle className="w-4 h-4 text-green-500" />
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

        {/* ── Main content ──────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-gray-50/50 py-4">
              <div className="flex items-center gap-3">
                {React.createElement(STEPS[step].icon, { className: 'w-5 h-5 text-blue-600' })}
                <div>
                  <CardTitle className="text-base">{STEPS[step].label}</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">{STEPS[step].desc}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 pb-8">
              {renderStep()}
            </CardContent>
          </Card>

          {/* ── Navigation ─────────────────────────────────────────── */}
          <div className="flex justify-between mt-5">
            <Button
              variant="outline"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="gap-2"
            >
              <Icons.ArrowLeft className="w-4 h-4" /> Previous
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} className="gap-2">
                Next: {STEPS[step + 1].label} <Icons.ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
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

// ─────────────────────────────────────────────────────────────────────────────
// Small helper component for section headings
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeading({ number, title, subtitle, required }) {
  return (
    <div className="flex items-start gap-2.5 border-b pb-2">
      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-gray-800">
          {title}
          {required && <span className="text-red-500 ml-1">*</span>}
        </h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
