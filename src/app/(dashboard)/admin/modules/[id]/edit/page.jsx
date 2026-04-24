'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import * as Icons from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import adminService from '@/lib/api/adminService';
import categoryService from '@/lib/api/categoryService';
import { resolveAssetUrl } from '@/lib/utils/resolveAssetUrl';
import { useDraft } from '@/hooks/useDraft';
import AdminSidebar from '@/components/Admin/AdminSidebar';
import RichTextEditor from '@/components/ui/RichTextEditor';
import BannerUploader from '@/components/ui/BannerUploader';
import VideoUploader from '@/components/ui/VideoUploader';
import ResourceUploader from '@/components/ui/ResourceUploader';
import LessonBuilder from '@/components/instructor/LessonBuilder';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeading({ number, title, subtitle, required }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">
          {title}{required && <span className="text-red-500 ml-1">*</span>}
        </h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function BulletList({ label, hint, values, onChange, placeholder }) {
  const safeValues = Array.isArray(values) ? values : [];
  const add    = ()      => onChange([...safeValues, '']);
  const update = (i, v)  => { const n = [...safeValues]; n[i] = v; onChange(n); };
  const remove = (i)     => onChange(safeValues.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div>
        <Label className="font-semibold">{label}</Label>
        {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
      </div>
      <div className="space-y-2">
        {safeValues.map((item, i) => (
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
        {safeValues.length === 0 && (
          <p className="text-sm text-gray-400 italic pl-7">No items yet — click below to add one.</p>
        )}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1 ml-7">
        <Icons.Plus className="w-3 h-3" /> Add item
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOURCE LIST (module-level files / links)
// ─────────────────────────────────────────────────────────────────────────────

function ResourceList({ label, hint, values = [], onChange }) {
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
      <div>
        <Label className="font-semibold">{label}</Label>
        {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
      </div>
      <div className="mb-3">
        <ResourceUploader value={values} onChange={handleUpload} label="Upload documents" />
      </div>
      {values.map((r, i) => (
        <div key={i} className="border rounded-xl p-4 space-y-3 bg-gray-50/50">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Resource {i + 1}</span>
            <div className="flex items-center gap-1">
              {r.url && (() => {
                const resolvedUrl = resolveAssetUrl(r.url);
                const ext = (r.name || r.url || '').split('.').pop()?.toLowerCase();
                const isPdf = ext === 'pdf';
                return (
                  <a
                    href={resolvedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors rounded"
                    title={isPdf ? 'Open in new tab' : 'Download'}
                  >
                    {isPdf ? <Icons.ExternalLink className="w-4 h-4" /> : <Icons.Download className="w-4 h-4" />}
                  </a>
                );
              })()}
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}>
                <Icons.Trash2 className="w-4 h-4 text-red-400" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input value={r.name} onChange={(e) => update(i, 'name', e.target.value)} placeholder="Resource name" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">URL</Label>
              <Input value={r.url} onChange={(e) => update(i, 'url', e.target.value)} placeholder="https://…" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Description (optional)</Label>
            <Input value={r.description} onChange={(e) => update(i, 'description', e.target.value)} placeholder="Brief description" />
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1">
        <Icons.Plus className="w-3 h-3" /> Add resource manually
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEPS
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'info',     label: 'Module Info', icon: Icons.Info,      desc: 'Title, description, level & details' },
  { id: 'lessons',  label: 'Lessons',     icon: Icons.BookOpen,  desc: 'Build lessons with slides and quizzes' },
  { id: 'review',   label: 'Save',        icon: Icons.Save,      desc: 'Review & save changes' },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminModuleEditPage() {
  const router    = useRouter();
  const { id }    = useParams();

  const [step, setStep]             = useState(0);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [isContentFinalized, setIsContentFinalized] = useState(false);
  const [categories, setCategories] = useState([]);
  const [originalModule, setOriginalModule] = useState(null);

  const [form, setForm] = useState({
    title: '', description: '', capstone: '',
    categoryId: '', level: '', duration: '',
    order: '',
    learningObjectives: '', learningOutcomes: '',
    moduleTopics: '', coreReadingMaterials: '',
    targetAudience: [], prerequisites: [],
    bannerUrl: '',
    introVideoUrl: '',
    moduleResources: [],
    lessons: [],
    isOptional: false,
  });

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const progress   = Math.round(((step + 1) / STEPS.length) * 100);

  // ── Draft autosave ─────────────────────────────────────────────────────────
  const { status: draftStatus, hasDraft, getDraft, discardDraft, saveDraft, savedAgoLabel } = useDraft(
    `module_admin_draft_${id}`,
    form,
    { enabled: !loading, contentType: 'module', entityId: id, title: form.title || 'Module' }
  );
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  // Show restore banner if a draft exists (only after initial data loads)
  useEffect(() => {
    if (!loading && hasDraft) setShowDraftBanner(true);
  }, [loading, hasDraft]);

  // ── Load data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    Promise.all([
      adminService.getModuleById(id),
      categoryService.getAllCategories(),
    ])
      .then(([mod, cats]) => {
        setOriginalModule(mod);
        setIsContentFinalized(mod.isContentFinalized ?? false);
        setCategories(Array.isArray(cats) ? cats : []);

        const catId = typeof mod.categoryId === 'object' ? mod.categoryId?._id : mod.categoryId;

        // Map backend lessons → LessonBuilder format
        const mappedLessons = (mod.lessons || []).map((l, idx) => ({
          title: l.title || '',
          description: l.description || '',
          learningOutcomes: Array.isArray(l.learningOutcomes) ? l.learningOutcomes : [],
          slidesTitle: l.slidesTitle || '',
          slides: Array.isArray(l.slides) ? l.slides : [],
          assessmentQuiz: Array.isArray(l.assessmentQuiz)
            ? l.assessmentQuiz
            : (Array.isArray(l.assessment?.questions) ? l.assessment.questions : []),
          quizPassingScore: l.quizPassingScore ?? l.assessment?.passingScore ?? 70,
          quizMaxAttempts:  l.quizMaxAttempts  ?? l.assessment?.maxAttempts  ?? 3,
          resources: Array.isArray(l.lessonResources)
            ? l.lessonResources
            : (Array.isArray(l.resources) ? l.resources : []),
          _caseStudy: null,
          order: l.order ?? idx,
        }));

        setForm({
          title:                mod.title || '',
          description:          mod.description || '',
          capstone:             mod.capstone || '',
          categoryId:           catId || '',
          level:                mod.level || '',
          duration:             mod.duration || '',
          learningObjectives:   mod.learningObjectives || '',
          learningOutcomes:     mod.learningOutcomes || '',
          moduleTopics:         mod.moduleTopics || '',
          coreReadingMaterials: mod.coreReadingMaterials || '',
          targetAudience:       Array.isArray(mod.targetAudience) ? mod.targetAudience : [],
          prerequisites:        Array.isArray(mod.prerequisites)  ? mod.prerequisites  : [],
          order:                mod.order != null ? mod.order : '',
          bannerUrl:            mod.bannerUrl || '',
          introVideoUrl:        mod.introVideoUrl || '',
          moduleResources:      Array.isArray(mod.moduleResources) ? mod.moduleResources : [],
          lessons:              mappedLessons,
          isOptional:           mod.isOptional ?? false,
        });
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load module data');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // ── Finalize Content ───────────────────────────────────────────────────────

  const handleFinalizeContent = async () => {
    if (isContentFinalized) return;
    if (!confirm('Finalize content? This will notify all enrolled students that the Final Assessment is now available.')) return;
    try {
      setFinalizing(true);
      await adminService.finalizeModuleContent(id);
      setIsContentFinalized(true);
      toast.success('Content finalized — students have been notified.');
    } catch (err) {
      toast.error('Failed to finalize content. Please try again.');
    } finally {
      setFinalizing(false);
    }
  };

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.title || !form.categoryId || !form.level) {
      toast.error('Title, category, and level are required.');
      setStep(0);
      return;
    }
    setSaving(true);
    try {
      // Infer question type from data shape if missing (legacy questions saved without type)
      const inferQType = (q) => {
        if (q.type) return q.type;
        if (Array.isArray(q.options) && q.options.some(Boolean)) return 'multiple-choice';
        if (['True', 'False'].includes(q.answer)) return 'true-false';
        return 'short-answer';
      };

      // Build clean lessons array from LessonBuilder output (strip internal _caseStudy key)
      const cleanLessons = (form.lessons || []).map(({ _caseStudy, resources, lessonResources, ...rest }) => {
        const normalizedQuiz = (rest.assessmentQuiz || []).map((q) => ({
          ...q,
          type: inferQType(q),
          points: q.points ?? 1,
          answer: q.answer ?? '',
        }));
        return {
          ...rest,
          lessonResources: lessonResources || resources || [],
          assessmentQuiz: normalizedQuiz,
        };
      });

      console.group('💾 [AdminSave] Module save payload');
      console.log('moduleId:', id);
      cleanLessons.forEach((lesson) => {
        if (!lesson.assessmentQuiz?.length) return;
        console.group(`📚 Lesson: "${lesson.title}" — ${lesson.assessmentQuiz.length} quiz questions`);
        lesson.assessmentQuiz.forEach((q, i) => {
          console.log(
            `Q${i + 1} | type="${q.type}" | answer="${q.answer}" | options:`,
            q.options || '(none)',
          );
        });
        console.groupEnd();
      });
      console.groupEnd();

      // Send everything in a single updateModule call — lessons are included in UpdateModuleDto
      const { lessons: _lessons, ...metaPayload } = form;
      await adminService.updateModule(id, {
        ...metaPayload,
        lessons: cleanLessons,
        moduleResources: form.moduleResources || [],
      });

      discardDraft();
      toast.success('Module updated successfully!');
      router.push(`/admin/modules/${id}`);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to save module');
    } finally {
      setSaving(false);
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
  };

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <AdminSidebar />
        <div className="lg:ml-4 min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Loading module…</p>
          </div>
        </div>
      </>
    );
  }

  // ── Step content ───────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (STEPS[step].id) {

      // ── Module Info ──────────────────────────────────────────────────────
      case 'info':
        return (
          <div className="space-y-8">

            {/* Banner */}
            <section className="space-y-4">
              <SectionHeading number={1} title="Banner Image" subtitle="Recommended: 1200 × 400 px" />
              <BannerUploader value={form.bannerUrl} onChange={(v) => updateForm('bannerUrl', v)} />
            </section>

            {/* Intro Video */}
            <section className="space-y-4">
              <SectionHeading number={2} title="Module Intro Video" subtitle="Optional — shown to students before they start the first lesson" />
              <VideoUploader value={form.introVideoUrl} onChange={(v) => updateForm('introVideoUrl', v)} />
            </section>

            {/* Basic details */}
            <section className="space-y-5">
              <SectionHeading number={2} title="Basic Details" required />
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3 space-y-1.5">
                    <Label className="font-semibold">Module Title <span className="text-red-500">*</span></Label>
                    <Input
                      value={form.title}
                      onChange={(e) => updateForm('title', e.target.value)}
                      placeholder="e.g. Fundamentals of Climate Change and Policy Context"
                      className="text-base"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Module Order</Label>
                    <Input
                      type="number"
                      min="1"
                      value={form.order}
                      onChange={(e) => updateForm('order', e.target.value === '' ? '' : parseInt(e.target.value))}
                      placeholder="e.g. 1"
                    />
                    <p className="text-xs text-gray-400">Controls sequence (1 = first)</p>
                  </div>
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

                {/* Optional Module Toggle */}
                <div
                  className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer select-none transition-colors ${form.isOptional ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}
                  onClick={() => updateForm('isOptional', !form.isOptional)}
                >
                  <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${form.isOptional ? 'bg-amber-500 border-amber-500' : 'border-gray-300 bg-white'}`}>
                    {form.isOptional && <Icons.Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">Mark as Optional Module</p>
                    <p className="text-xs text-gray-500 mt-0.5">Optional modules are visible to students but not required for course completion. They do not block progression and are tracked separately.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Description */}
            <section className="space-y-4">
              <SectionHeading number={3} title="Module Description" subtitle="Explain what this module covers and why it matters." required />
              <RichTextEditor
                value={form.description}
                onChange={(v) => updateForm('description', v)}
                placeholder="This module introduces learners to…"
                height={200}
              />
            </section>

            {/* Capstone */}
            <section className="space-y-4">
              <SectionHeading number={4} title="Capstone Project" subtitle="Optional — describe the final project learners will complete." />
              <RichTextEditor
                value={form.capstone}
                onChange={(v) => updateForm('capstone', v)}
                placeholder="At the end of this module, learners will design…"
                height={150}
              />
            </section>

            {/* Objectives / Outcomes / Audience / Prerequisites */}
            <section className="space-y-6">
              <SectionHeading number={5} title="Objectives, Outcomes, Audience & Prerequisites" />
              <div className="space-y-2">
                <Label className="font-semibold">Learning Objectives</Label>
                <p className="text-xs text-gray-500">What does this module aim to teach? (The instructor's goals)</p>
                <RichTextEditor
                  value={form.learningObjectives}
                  onChange={(v) => updateForm('learningObjectives', v)}
                  placeholder="e.g. To introduce participants to the fundamental concepts of climate change…"
                  height={160}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Expected Learning Outcomes</Label>
                <p className="text-xs text-gray-500">What will learners be able to do by the end?</p>
                <RichTextEditor
                  value={form.learningOutcomes}
                  onChange={(v) => updateForm('learningOutcomes', v)}
                  placeholder="e.g. Define key concepts related to climate change…"
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
                hint="What should learners already know? (Optional)"
                values={form.prerequisites}
                onChange={(v) => updateForm('prerequisites', v)}
                placeholder="e.g. Basic Python programming"
              />
            </section>

            {/* Module Content */}
            <section className="space-y-4">
              <SectionHeading number={6} title="Module Content" subtitle="List the topics and subject areas covered." />
              <RichTextEditor
                value={form.moduleTopics}
                onChange={(v) => updateForm('moduleTopics', v)}
                placeholder="e.g. 1. Overview of climate change science…"
                height={160}
              />
            </section>

            {/* Core Reading Materials */}
            <section className="space-y-4">
              <SectionHeading number={7} title="Core Reading Materials" subtitle="Required or recommended readings for this module." />
              <RichTextEditor
                value={form.coreReadingMaterials}
                onChange={(v) => updateForm('coreReadingMaterials', v)}
                placeholder="e.g. Houghton, D. D. (2002). Introduction to Climate Change…"
                height={180}
              />
            </section>

            {/* Module Resources */}
            <section className="space-y-4">
              <SectionHeading number={8} title="Module Resources" subtitle="Files and links that apply to the whole module (bibliography, datasets, code repos, recorded lectures)." />
              <ResourceList
                label="Module-Level Resources"
                hint="e.g. Bibliography, online learning links, recorded lectures, code repositories"
                values={form.moduleResources}
                onChange={(v) => updateForm('moduleResources', v)}
              />
            </section>
          </div>
        );

      // ── Lessons ──────────────────────────────────────────────────────────
      case 'lessons':
        return (
          <div className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <Icons.BookOpen className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-blue-700 text-sm">
                Build your lessons below. Each lesson can have <strong>slides</strong> (text, image, video, diagram, or interactive code),
                <strong> resources</strong>, and an optional <strong>quiz</strong> that learners must pass before proceeding.
              </AlertDescription>
            </Alert>
            <LessonBuilder
              lessons={form.lessons}
              onChange={(v) => updateForm('lessons', v)}
              onSaveDraft={saveDraft}
              draftStatus={draftStatus}
            />
          </div>
        );

      // ── Review & Save ────────────────────────────────────────────────────
      case 'review':
        return (
          <div className="space-y-6">
            {originalModule?.status === 'published' ? (
              <Alert className="border-emerald-200 bg-emerald-50">
                <Icons.Globe className="w-4 h-4 text-emerald-600" />
                <AlertDescription className="text-emerald-700 text-sm">
                  This module is <strong>live and published</strong>. Changes will be applied immediately and visible to enrolled students.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-blue-200 bg-blue-50">
                <Icons.Info className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-700 text-sm">
                  Your changes will be saved to the module (status: <strong>{originalModule?.status}</strong>).
                </AlertDescription>
              </Alert>
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: 'Module',
                  value: form.title || '—',
                  sub: `${form.level || '—'} · ${form.duration || '—'}`,
                  Icon: Icons.BookMarked,
                  color: 'blue',
                },
                {
                  label: 'Lessons',
                  value: `${(form.lessons || []).length} lesson${(form.lessons || []).length !== 1 ? 's' : ''}`,
                  sub: `${(form.lessons || []).reduce((a, l) => a + (l.slides || []).length, 0)} total slides`,
                  Icon: Icons.BookOpen,
                  color: 'green',
                },
              ].map(({ label, value, sub, Icon, color }) => (
                <Card key={label}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg bg-${color}-100 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 text-${color}-600`} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase">{label}</p>
                        <p className="font-semibold text-gray-900 mt-0.5">{value}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Validation warnings */}
            {(!form.title || !form.categoryId || !form.level) && (
              <Alert className="border-amber-200 bg-amber-50">
                <Icons.AlertTriangle className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-amber-700 text-sm">
                  <strong>Missing required fields:</strong>{' '}
                  {[
                    !form.title      && 'Module title',
                    !form.categoryId && 'Category',
                    !form.level      && 'Level',
                  ].filter(Boolean).join(', ')}.
                  Go back to Module Info to fill them in.
                </AlertDescription>
              </Alert>
            )}

            {/* Finalize Content */}
            <div className={`border rounded-lg p-4 ${isContentFinalized ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
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
                        ? 'Students have been notified. The Final Assessment is unlocked.'
                        : 'Mark all lessons as complete to unlock the Final Assessment for enrolled students. They will be notified by email.'}
                    </p>
                  </div>
                </div>
                {!isContentFinalized && (
                  <Button
                    size="sm"
                    onClick={handleFinalizeContent}
                    disabled={finalizing}
                    className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-xs"
                  >
                    {finalizing ? <><div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-1.5" /> Finalizing…</> : <><Icons.CheckSquare className="w-3.5 h-3.5 mr-1.5" />Finalize</>}
                  </Button>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ── Layout ─────────────────────────────────────────────────────────────────

  return (
    <>
      <AdminSidebar />
      <div className="lg:ml-4 min-h-screen bg-gray-50">
        <Toaster position="top-right" />

        {/* Draft restore banner */}
        {showDraftBanner && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <Icons.Clock className="w-4 h-4 text-amber-600" />
              <span>You have an unsaved draft for this module.</span>
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

        {/* ── Top header ── */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/modules/${id}`)}>
              <Icons.ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">Edit Module</h1>
                <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">Admin</Badge>
                {originalModule?.status === 'published' && (
                  <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                    <Icons.Globe className="w-3 h-3 mr-1 inline" />Live
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Step {step + 1} of {STEPS.length} —{' '}
                <span className="font-medium text-gray-700">{STEPS[step].label}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden sm:block truncate max-w-xs">
              {originalModule?.title}
            </span>
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
            {(draftStatus === 'saved' || savedAgoLabel) && (
              <span className="text-xs text-emerald-600 hidden sm:flex items-center gap-1">
                <Icons.CheckCircle2 className="w-3 h-3" />
                {savedAgoLabel || 'Saved'}
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={saveDraft}
              disabled={draftStatus === 'saving'}
              className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hidden sm:flex"
            >
              <Icons.Save className="w-3.5 h-3.5" />
              {draftStatus === 'saving' ? 'Saving…' : 'Save Draft'}
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">{progress}%</span>
              <div className="w-32">
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8 flex gap-6">

          {/* ── Left sidebar steps ── */}
          <div className="w-56 flex-shrink-0">
            <div className="sticky top-24 space-y-1">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Steps</p>
              {STEPS.map((s, i) => {
                const done   = i < step;
                const active = i === step;
                return (
                  <button
                    key={s.id}
                    onClick={() => setStep(i)}
                    className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                      active ? 'bg-blue-600 text-white shadow-sm' :
                      done   ? 'bg-green-50 text-green-800 hover:bg-green-100' :
                               'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold ${
                      active ? 'bg-white/20 text-white' :
                      done   ? 'bg-green-200 text-green-700' :
                               'bg-gray-200 text-gray-500'
                    }`}>
                      {done ? <Icons.Check className="w-3 h-3" /> : i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-none">{s.label}</p>
                      <p className={`text-xs mt-1 leading-snug ${active ? 'text-blue-100' : 'text-gray-400'}`}>
                        {s.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Main content area ── */}
          <div className="flex-1 min-w-0">
            <Card>
              <CardContent className="p-8">
                {renderStep()}
              </CardContent>
            </Card>

            {/* ── Navigation ── */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="gap-2"
              >
                <Icons.ChevronLeft className="w-4 h-4" /> Previous
              </Button>

              {step < STEPS.length - 1 ? (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  Next <Icons.ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 min-w-32"
                >
                  {saving ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Saving…</>
                  ) : (
                    <><Icons.Save className="w-4 h-4" /> Save Changes</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
