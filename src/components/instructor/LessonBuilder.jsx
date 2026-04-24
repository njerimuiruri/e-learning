'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import RichTextEditor from '@/components/ui/RichTextEditor';
import InteractiveCodeEditor from '@/components/student/InteractiveCodeEditor';
import ResourceUploader from '@/components/ui/ResourceUploader';
import uploadService from '@/lib/api/uploadService';
import { resolveAssetUrl } from '@/lib/utils/resolveAssetUrl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import * as Icons from 'lucide-react';

// Monaco editor — dynamic import avoids SSR issues
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((m) => m.default ?? m.Editor ?? m),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center bg-[#1e1e1e] rounded-lg" style={{ height: 200 }}>
        <span className="text-xs text-gray-500 animate-pulse">Loading editor…</span>
      </div>
    ),
  }
);

/**
 * CodeEditor — Monaco wrapper for writing code (starter code, expected output, quiz snippets).
 * Gives instructors a proper code editor instead of plain textareas.
 */
function CodeEditor({
  value = '',
  onChange,
  language = 'python',
  label,
  hint,
  height = 200,
  readOnly = false,
  placeholder = '',
}) {
  const monacoLang = language === 'r' ? 'r' : 'python';

  return (
    <div className="space-y-1.5">
      {label && (
        <div>
          <Label className="text-xs font-semibold text-gray-600">{label}</Label>
          {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
        </div>
      )}
      <div className="rounded-xl overflow-hidden border border-gray-700 shadow-sm">
        {/* Editor toolbar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#2d2d2d] border-b border-gray-700">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          </div>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">
            {monacoLang === 'r' ? 'R' : 'Python'}
          </span>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(value)}
            className="text-[10px] text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
          >
            <Icons.Copy className="w-3 h-3" /> Copy
          </button>
        </div>
        <MonacoEditor
          height={height}
          language={monacoLang}
          value={value || placeholder}
          onChange={(v) => onChange?.(v ?? '')}
          options={{
            readOnly,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, Consolas, monospace",
            fontLigatures: true,
            lineNumbers: 'on',
            glyphMargin: false,
            folding: true,
            lineDecorationsWidth: 4,
            lineNumbersMinChars: 3,
            renderLineHighlight: 'line',
            scrollbar: { vertical: 'auto', horizontal: 'auto' },
            padding: { top: 10, bottom: 10 },
            wordWrap: 'on',
            automaticLayout: true,
          }}
          theme="vs-dark"
        />
      </div>
    </div>
  );
}

// ─── ImageSlideEditor ─────────────────────────────────────────────────────────
// Upload a file OR paste a URL for an image slide.

function ImageSlideEditor({ slide, onUpdate, disabled }) {
  const fileRef = React.useRef(null);
  const [uploading, setUploading] = React.useState(false);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const url = await uploadService.uploadImage(file);
      onUpdate('imageUrl', url);
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-600">Image</Label>
        <div className="flex gap-2">
          <Input
            type="url"
            value={slide.imageUrl || ''}
            onChange={(e) => onUpdate('imageUrl', e.target.value)}
            disabled={disabled || uploading}
            placeholder="Paste a URL — or upload a file →"
            className="text-sm flex-1"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={disabled || uploading}
            className="flex-shrink-0 gap-1.5"
          >
            {uploading
              ? <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600" /> Uploading…</>
              : <><Icons.Upload className="w-3.5 h-3.5" /> Upload</>
            }
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
        <p className="text-xs text-gray-400">JPEG, PNG, GIF, WebP · Max 10 MB</p>
      </div>
      {slide.imageUrl && (
        <img src={slide.imageUrl} alt="preview" className="max-h-40 rounded-lg border border-gray-200 object-contain bg-gray-50" />
      )}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-600">Caption</Label>
        <Input
          value={slide.imageCaption || ''}
          onChange={(e) => onUpdate('imageCaption', e.target.value)}
          disabled={disabled}
          placeholder="Optional image caption…"
          className="text-sm"
        />
      </div>
    </div>
  );
}

// ─── DiagramSlideEditor ────────────────────────────────────────────────────────
// Extracted as its own component so it can use hooks (useRef) safely.

function DiagramSlideEditor({ slide, onUpdate, disabled }) {
  const fileRef = React.useRef(null);
  const [uploading, setUploading] = React.useState(false);

  const uploadImageFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const url = await uploadService.uploadImage(file);
      onUpdate('imageUrl', url);
    } catch (err) {
      console.error('Diagram image upload failed:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => uploadImageFile(e.target.files?.[0]);

  const handlePaste = (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imgItem = items.find(i => i.type.startsWith('image/'));
    if (imgItem) {
      e.preventDefault();
      uploadImageFile(imgItem.getAsFile());
    }
  };

  return (
    <div className="space-y-3">
      {/* Title */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-600">Diagram Title</Label>
        <Input
          value={slide.imageCaption || ''}
          onChange={(e) => onUpdate('imageCaption', e.target.value)}
          disabled={disabled}
          placeholder="e.g. Neural Network Architecture"
          className="text-sm"
        />
      </div>

      {/* Upload / paste zone */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-600">Diagram Image</Label>
        <div
          onPaste={handlePaste}
          tabIndex={0}
          className="relative rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/40 hover:border-amber-400 focus:border-amber-400 focus:outline-none transition-colors"
        >
          {uploading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 px-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
              <p className="text-sm text-amber-700">Uploading image…</p>
            </div>
          ) : slide.imageUrl ? (
            <div className="p-3 space-y-2">
              <img
                src={slide.imageUrl}
                alt="Diagram preview"
                className="max-h-64 w-full object-contain rounded-lg border border-amber-100 bg-white"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={disabled || uploading}
                  className="text-xs text-amber-700 hover:text-amber-900 underline"
                >
                  Replace image
                </button>
                <span className="text-gray-300">·</span>
                <button
                  type="button"
                  onClick={() => onUpdate('imageUrl', '')}
                  disabled={disabled}
                  className="text-xs text-red-500 hover:text-red-700 underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-8 px-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Icons.ImagePlus className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Upload or paste your diagram</p>
                <p className="text-xs text-gray-400 mt-1">
                  Click to browse · or focus here and press{' '}
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">Ctrl+V</kbd> to paste
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={disabled}
                className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                <Icons.Upload className="w-3.5 h-3.5" /> Browse Image
              </Button>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <p className="text-xs text-gray-400">PNG, JPG, SVG, GIF supported · paste a screenshot with Ctrl+V</p>
      </div>

      {/* Rich-text content alongside the diagram */}
      <div className="space-y-1.5">
        <RichTextEditor
          label="Diagram Content"
          value={slide.content || ''}
          onChange={(val) => onUpdate('content', val)}
          placeholder="Add explanations, notes, or annotations for this diagram…"
          height={160}
        />
      </div>
    </div>
  );
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const SLIDE_TYPES = [
  { value: 'text', label: 'Text', Icon: Icons.FileText, desc: 'Rich text with images & formatting' },
  { value: 'image', label: 'Image', Icon: Icons.Image, desc: 'Image with caption' },
  { value: 'video', label: 'Video', Icon: Icons.Video, desc: 'YouTube or video link' },
  { value: 'diagram', label: 'Diagram', Icon: Icons.BarChart2, desc: 'SVG or diagram image' },
  { value: 'codeSnippet', label: 'Code', Icon: Icons.Code2, desc: 'Interactive Python/R editor' },
];

const QUIZ_TYPES = [
  { value: 'multiple-choice', label: 'Multiple Choice' },
  { value: 'true-false', label: 'True / False' },
  { value: 'short-answer', label: 'Short Answer' },
];

const CS_SECTIONS = [
  { key: 'introduction', label: 'Introduction', Icon: Icons.BookOpen, placeholder: 'Describe the case study background and why it matters...' },
  { key: 'dataset', label: 'Dataset', Icon: Icons.Database, placeholder: 'Describe the datasets used — name, source, what it contains...' },
  { key: 'aiTask', label: 'AI Task', Icon: Icons.BrainCircuit, placeholder: 'Describe the AI/ML approach, algorithms, and expected outputs...' },
  { key: 'keyReadings', label: 'Key Readings', Icon: Icons.ScrollText, placeholder: 'List key papers and reading materials with citations...' },
];

const RESOURCE_TYPES = ['link', 'pdf', 'notebook', 'dataset', 'video', 'other'];

// ─── Factory helpers ────────────────────────────────────────────────────────────

const emptySlide = (type) => ({
  type, order: 0, content: '', imageUrl: '', imageCaption: '',
  videoUrl: '', videoCaption: '', codeLanguage: 'python',
  codeInstructions: '', starterCode: '', expectedOutput: '',
  sectionTitle: '',
  minViewingTime: 15, scrollTrackingEnabled: false,
});

const emptyQuestion = () => ({
  question: '', type: 'multiple-choice',
  options: ['', '', '', ''], answer: '', explanation: '', points: 1,
  codeSnippet: null, // { language: 'python', code: '' } — optional code block shown with the question
});

const emptyCaseStudy = () => ({
  name: '', introduction: '', dataset: '', aiTask: '', keyReadings: '',
});

export const emptyLesson = (idx = 0) => ({
  title: '', description: '', learningOutcomes: [],
  slides: [], assessmentQuiz: [], quizPassingScore: 70, quizMaxAttempts: 3,
  lessonResources: [], _caseStudy: null, order: idx,
});

// ─── Main component ─────────────────────────────────────────────────────────────

export default function LessonBuilder({ lessons = [], onChange, disabled = false, onSaveDraft, draftStatus }) {
  const [expandedLesson, setExpandedLesson] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);

  const update = (newLessons) => onChange?.(newLessons);

  const addLesson = () => {
    const updated = [...lessons, emptyLesson(lessons.length)];
    update(updated);
    setExpandedLesson(updated.length - 1);
  };

  const openDelete = (idx) =>
    setDeleteDialog({ idx, name: lessons[idx].title || `Lesson ${idx + 1}` });

  const doDelete = () => {
    const { idx } = deleteDialog;
    const updated = lessons
      .filter((_, i) => i !== idx)
      .map((l, i) => ({ ...l, order: i }));
    update(updated);
    if (expandedLesson === idx) setExpandedLesson(null);
    else if (expandedLesson > idx) setExpandedLesson(expandedLesson - 1);
    setDeleteDialog(null);
  };

  const updateLesson = (idx, field, value) =>
    update(lessons.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            Lessons
            <Badge variant="secondary" className="text-xs">{lessons.length}</Badge>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Each lesson can have slides, an optional case study, resources, and a quiz.
          </p>
        </div>
        {/* Draft status + manual save */}
        {onSaveDraft && (
          <div className="flex items-center gap-2">
            {draftStatus === 'unsaved' && (
              <span className="text-[10px] text-amber-600 flex items-center gap-1">
                <Icons.Circle className="w-2 h-2 fill-amber-500" />
                Unsaved changes
              </span>
            )}
            {draftStatus === 'saving' && (
              <span className="text-[10px] text-blue-500 flex items-center gap-1 animate-pulse">
                <Icons.Loader2 className="w-2.5 h-2.5 animate-spin" />
                Saving…
              </span>
            )}
            {draftStatus === 'saved' && (
              <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                <Icons.CheckCircle2 className="w-2.5 h-2.5" />
                Saved
              </span>
            )}
            {draftStatus === 'error' && (
              <span className="text-[10px] text-red-500 flex items-center gap-1">
                <Icons.AlertCircle className="w-2.5 h-2.5" />
                Save failed
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSaveDraft}
              disabled={disabled || draftStatus === 'saving'}
              className="h-7 text-xs gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <Icons.Save className="w-3 h-3" />
              Save Draft
            </Button>
          </div>
        )}
        {!disabled && (
          <Button type="button" onClick={addLesson} size="sm" className="gap-1.5">
            <Icons.Plus className="w-3.5 h-3.5" /> Add Lesson
          </Button>
        )}
      </div>

      {/* Empty state */}
      {lessons.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-xl py-12 text-center">
          <Icons.BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">No lessons yet</p>
          <p className="text-xs text-gray-400 mt-1">Click "Add Lesson" to create your first lesson.</p>
        </div>
      )}

      {/* Lesson cards */}
      {lessons.map((lesson, idx) => (
        <LessonCard
          key={idx}
          lesson={lesson}
          idx={idx}
          expanded={expandedLesson === idx}
          onToggle={() => setExpandedLesson(expandedLesson === idx ? null : idx)}
          onChange={(field, value) => updateLesson(idx, field, value)}
          onDelete={() => openDelete(idx)}
          disabled={disabled}
        />
      ))}

      {/* Confirm delete dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteDialog?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the lesson and all its slides, case study, resources,
              and quiz questions. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={doDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Lesson Card ────────────────────────────────────────────────────────────────

function LessonCard({ lesson, idx, expanded, onToggle, onChange, onDelete, disabled }) {
  const slideCount = (lesson.slides || []).length;
  const quizCount = (lesson.assessmentQuiz || []).length;
  const hasCS = !!lesson._caseStudy;
  const resCount = (lesson.lessonResources || lesson.resources || []).length;

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${expanded ? 'shadow-md border-blue-200' : 'border-gray-200 hover:border-gray-300'
      }`}>
      {/* Accordion header */}
      <div
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-colors ${expanded ? 'bg-blue-50' : 'bg-gray-50/70 hover:bg-gray-100/70'
          }`}
        onClick={onToggle}
      >
        <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 transition-colors ${expanded ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
          }`}>
          {idx + 1}
        </span>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm truncate">
            {lesson.title || <span className="text-gray-400 italic font-normal">Untitled Lesson</span>}
          </p>
          <div className="flex flex-wrap gap-2 mt-0.5">
            {slideCount > 0 && (
              <span className="text-xs text-gray-400">{slideCount} slide{slideCount !== 1 ? 's' : ''}</span>
            )}
            {quizCount > 0 && (
              <span className="text-xs text-purple-500">{quizCount} quiz question{quizCount !== 1 ? 's' : ''}</span>
            )}
            {hasCS && (
              <span className="text-xs text-amber-600 font-medium">Case Study</span>
            )}
            {resCount > 0 && (
              <span className="text-xs text-teal-600">{resCount} resource{resCount !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {!disabled && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Icons.Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <Icons.ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-gray-100">
          <Tabs defaultValue="overview" className="p-4">
            <TabsList className="w-full grid grid-cols-5 h-9 mb-5 bg-gray-100">
              <TabsTrigger value="overview" className="text-xs gap-1 data-[state=active]:bg-white">
                <Icons.Info className="w-3 h-3" /> Overview
              </TabsTrigger>
              <TabsTrigger value="slides" className="text-xs gap-1 data-[state=active]:bg-white">
                <Icons.Layers className="w-3 h-3" /> Slides
                {slideCount > 0 && (
                  <Badge className="ml-0.5 h-4 w-4 p-0 text-[9px] bg-blue-100 text-blue-700 border-0 justify-center">
                    {slideCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="casestudy" className="text-xs gap-1 data-[state=active]:bg-white">
                <Icons.FlaskConical className="w-3 h-3" /> Case Study
                {hasCS && (
                  <Badge className="ml-0.5 h-4 w-4 p-0 text-[9px] bg-amber-100 text-amber-700 border-0 justify-center">1</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="resources" className="text-xs gap-1 data-[state=active]:bg-white">
                <Icons.Link className="w-3 h-3" /> Resources
                {resCount > 0 && (
                  <Badge className="ml-0.5 h-4 w-4 p-0 text-[9px] bg-teal-100 text-teal-700 border-0 justify-center">
                    {resCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="quiz" className="text-xs gap-1 data-[state=active]:bg-white">
                <Icons.HelpCircle className="w-3 h-3" /> Quiz
                {quizCount > 0 && (
                  <Badge className="ml-0.5 h-4 w-4 p-0 text-[9px] bg-purple-100 text-purple-700 border-0 justify-center">
                    {quizCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ── Overview ─────────────────────────────────────────────── */}
            <TabsContent value="overview" className="space-y-4 mt-0">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Lesson Title <span className="text-red-500">*</span></Label>
                <Input
                  value={lesson.title}
                  onChange={(e) => onChange('title', e.target.value)}
                  disabled={disabled}
                  placeholder="e.g. Introduction to Climate AI"
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Description</Label>
                <p className="text-xs text-gray-400">Give learners a brief overview of this lesson.</p>
                <RichTextEditor
                  value={lesson.description || ''}
                  onChange={(v) => onChange('description', v)}
                  placeholder="Brief overview of what this lesson covers..."
                  height={150}
                />
              </div>

              <LessonOutcomes
                outcomes={lesson.learningOutcomes || []}
                onChange={(v) => onChange('learningOutcomes', v)}
                disabled={disabled}
              />
            </TabsContent>

            {/* ── Slides ───────────────────────────────────────────────── */}
            <TabsContent value="slides" className="mt-0">
              <SlidesTab
                slides={lesson.slides || []}
                onChange={(v) => onChange('slides', v)}
                disabled={disabled}
              />
            </TabsContent>

            {/* ── Case Study ───────────────────────────────────────────── */}
            <TabsContent value="casestudy" className="mt-0">
              <CaseStudyTab
                caseStudy={lesson._caseStudy}
                onChange={(v) => onChange('_caseStudy', v)}
                disabled={disabled}
              />
            </TabsContent>

            {/* ── Resources ────────────────────────────────────────────── */}
            <TabsContent value="resources" className="mt-0">
              <ResourcesTab
                resources={lesson.lessonResources || lesson.resources || []}
                onChange={(v) => onChange('lessonResources', v)}
                disabled={disabled}
              />
            </TabsContent>

            {/* ── Quiz ─────────────────────────────────────────────────── */}
            <TabsContent value="quiz" className="mt-0">
              <QuizTab
                quiz={lesson.assessmentQuiz || []}
                passingScore={lesson.quizPassingScore ?? 70}
                maxAttempts={lesson.quizMaxAttempts ?? 3}
                onQuizChange={(v) => onChange('assessmentQuiz', v)}
                onPassingScoreChange={(v) => onChange('quizPassingScore', v)}
                onMaxAttemptsChange={(v) => onChange('quizMaxAttempts', v)}
                disabled={disabled}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

// ─── Learning Outcomes ──────────────────────────────────────────────────────────

function LessonOutcomes({ outcomes, onChange, disabled }) {
  const add = () => onChange([...outcomes, '']);
  const update = (i, v) => { const n = [...outcomes]; n[i] = v; onChange(n); };
  const remove = (i) => onChange(outcomes.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs font-semibold">Learning Outcomes</Label>
          <p className="text-xs text-gray-400">What will learners be able to do after this lesson?</p>
        </div>
        {!disabled && (
          <Button type="button" variant="ghost" size="sm" onClick={add} className="h-7 text-xs gap-1 text-blue-600">
            <Icons.Plus className="w-3 h-3" /> Add
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {outcomes.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-gray-300 text-xs w-4 text-right flex-shrink-0">{i + 1}.</span>
            <Input
              value={o}
              onChange={(e) => update(i, e.target.value)}
              disabled={disabled}
              placeholder="e.g. Understand how AI analyses climate data"
              className="flex-1 h-8 text-xs"
            />
            {!disabled && (
              <button type="button" onClick={() => remove(i)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                <Icons.X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        {outcomes.length === 0 && (
          <p className="text-xs text-gray-400 italic pl-6">No outcomes yet.</p>
        )}
      </div>
    </div>
  );
}

// ─── Slides Tab ─────────────────────────────────────────────────────────────────

function SlidesTab({ slides, onChange, disabled }) {
  const [expandedSlide, setExpandedSlide] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const addSlide = (type) => {
    const slide = { ...emptySlide(type), order: slides.length };
    const updated = [...slides, slide];
    onChange(updated);
    setExpandedSlide(updated.length - 1);
  };

  const removeSlide = (idx) => {
    onChange(slides.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i })));
    if (expandedSlide === idx) setExpandedSlide(null);
    else if (expandedSlide > idx) setExpandedSlide(expandedSlide - 1);
  };

  const updateSlide = (idx, field, value) =>
    onChange(slides.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));

  // Move a slide from one position to another, keeping expanded state in sync
  const moveSlide = (from, to) => {
    if (from === to || to < 0 || to >= slides.length) return;
    const updated = [...slides];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    onChange(updated.map((s, i) => ({ ...s, order: i })));
    if (expandedSlide === from) {
      setExpandedSlide(to);
    } else if (expandedSlide !== null) {
      if (from < to && expandedSlide > from && expandedSlide <= to) setExpandedSlide(expandedSlide - 1);
      else if (from > to && expandedSlide >= to && expandedSlide < from) setExpandedSlide(expandedSlide + 1);
    }
  };

  const handleDragStart = (idx) => setDragIndex(idx);
  const handleDragOver = (e, idx) => { e.preventDefault(); setDragOverIndex(idx); };
  const handleDrop = (idx) => {
    if (dragIndex !== null && dragIndex !== idx) moveSlide(dragIndex, idx);
    setDragIndex(null);
    setDragOverIndex(null);
  };
  const handleDragEnd = () => { setDragIndex(null); setDragOverIndex(null); };

  return (
    <div className="space-y-4">
      {/* Slide type picker */}
      {!disabled && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-600">Add a slide:</Label>
          <div className="flex flex-wrap gap-2">
            {SLIDE_TYPES.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => addSlide(value)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <Icon className="w-3.5 h-3.5 text-gray-400" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Slide list */}
      {slides.length === 0 ? (
        <p className="text-xs text-gray-400 italic text-center py-6 border border-dashed border-gray-200 rounded-lg">
          No slides yet. Select a type above to add one.
        </p>
      ) : (
        <div className="space-y-2">
          {slides.map((slide, idx) => (
            <SlideEditor
              key={idx}
              slide={slide}
              idx={idx}
              total={slides.length}
              expanded={expandedSlide === idx}
              onToggle={() => setExpandedSlide(expandedSlide === idx ? null : idx)}
              onUpdate={(field, value) => updateSlide(idx, field, value)}
              onDelete={() => removeSlide(idx)}
              onMoveUp={() => moveSlide(idx, idx - 1)}
              onMoveDown={() => moveSlide(idx, idx + 1)}
              disabled={disabled}
              isDragging={dragIndex === idx}
              isDragOver={dragOverIndex === idx && dragOverIndex !== dragIndex}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Slide Editor ───────────────────────────────────────────────────────────────

function SlideEditor({
  slide, idx, total, expanded, onToggle, onUpdate, onDelete,
  onMoveUp, onMoveDown, disabled,
  isDragging, isDragOver, onDragStart, onDragOver, onDrop, onDragEnd,
}) {
  const typeInfo = SLIDE_TYPES.find((t) => t.value === slide.type) || SLIDE_TYPES[0];
  const { Icon } = typeInfo;

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-all
        ${isDragging ? 'opacity-40 ring-2 ring-blue-400 scale-[0.99]' : ''}
        ${isDragOver ? 'ring-2 ring-blue-500 border-blue-400' : expanded ? 'border-blue-200' : 'border-gray-200'}
      `}
      onDragOver={onDragOver}
      onDrop={(e) => { e.preventDefault(); onDrop(); }}
      onDragEnd={onDragEnd}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={onToggle}
      >
        {/* Drag handle — only this element is draggable */}
        {!disabled && (
          <span
            draggable
            onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
            onClick={(e) => e.stopPropagation()}
            className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0 transition-colors"
            title="Drag to reorder"
          >
            <Icons.GripVertical className="w-4 h-4" />
          </span>
        )}
        <Icon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
        <span className="text-xs font-medium text-gray-700 flex-1">
          Slide {idx + 1} — {typeInfo.label}
        </span>
        {slide.sectionTitle && (
          <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 truncate max-w-[120px]">
            {slide.sectionTitle}
          </span>
        )}
        <span className="text-xs text-gray-400">⏱ {slide.minViewingTime ?? 15}s</span>
        {slide.scrollTrackingEnabled && (
          <Badge className="text-[9px] h-4 px-1.5 bg-blue-100 text-blue-600 border-0">scroll</Badge>
        )}
        {!disabled && (
          <>
            {/* Up / Down arrow buttons for keyboard-friendly reordering */}
            <div className="flex gap-0 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={onMoveUp}
                disabled={idx === 0}
                className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed rounded transition-colors"
                title="Move slide up"
              >
                <Icons.ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={idx === total - 1}
                className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed rounded transition-colors"
                title="Move slide down"
              >
                <Icons.ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-gray-300 hover:text-red-500 p-0.5 rounded transition-colors"
            >
              <Icons.Trash2 className="w-3 h-3" />
            </button>
          </>
        )}
        <Icons.ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`} />
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="p-4 space-y-4 border-t border-gray-100">
          {/* Section title — optional, shown above this slide */}
          <div className="space-y-1.5 py-2 px-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2">
              <Icons.Bookmark className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <Label className="text-xs font-semibold text-blue-700">Section Title</Label>
              <span className="text-[10px] text-blue-400">(optional)</span>
            </div>
            <Input
              value={slide.sectionTitle || ''}
              onChange={(e) => onUpdate('sectionTitle', e.target.value)}
              disabled={disabled}
              placeholder="e.g. Definition of Terms"
              className="w-full h-8 text-sm bg-white"
            />
            {slide.sectionTitle && (
              <p className="text-[10px] text-blue-500 flex items-center gap-1">
                <Icons.Eye className="w-3 h-3" />
                Students will see &ldquo;{slide.sectionTitle}&rdquo; above this slide
              </p>
            )}
          </div>

          {/* Engagement settings */}
          <div className="flex items-center gap-5 py-2 px-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-gray-600">Min viewing time</Label>
              <Input
                type="number" min={5} max={300}
                value={slide.minViewingTime ?? 15}
                onChange={(e) => onUpdate('minViewingTime', parseInt(e.target.value))}
                disabled={disabled}
                className="w-16 h-7 text-xs"
              />
              <span className="text-xs text-gray-400">sec</span>
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={slide.scrollTrackingEnabled ?? false}
                onChange={(e) => onUpdate('scrollTrackingEnabled', e.target.checked)}
                disabled={disabled}
                className="accent-blue-600 w-3 h-3"
              />
              Require scroll to bottom
            </label>
          </div>

          {/* TEXT slide */}
          {slide.type === 'text' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600">Content</Label>
              <RichTextEditor
                value={slide.content || ''}
                onChange={(v) => onUpdate('content', v)}
                placeholder="Enter slide content — use headings, lists, bold text, and insert images directly..."
                height={220}
              />
            </div>
          )}

          {/* IMAGE slide */}
          {slide.type === 'image' && (
            <ImageSlideEditor slide={slide} onUpdate={onUpdate} disabled={disabled} />
          )}

          {/* DIAGRAM slide */}
          {slide.type === 'diagram' && (
            <DiagramSlideEditor slide={slide} onUpdate={onUpdate} disabled={disabled} />
          )}

          {/* VIDEO slide */}
          {slide.type === 'video' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600">Video URL</Label>
                <p className="text-xs text-gray-400">YouTube links are automatically embedded.</p>
                <Input
                  type="url"
                  value={slide.videoUrl || ''}
                  onChange={(e) => onUpdate('videoUrl', e.target.value)}
                  disabled={disabled}
                  placeholder="https://youtube.com/watch?v=..."
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600">Caption</Label>
                <Input
                  value={slide.videoCaption || ''}
                  onChange={(e) => onUpdate('videoCaption', e.target.value)}
                  disabled={disabled}
                  placeholder="Optional caption..."
                  className="text-sm"
                />
              </div>
            </div>
          )}

          {/* CODE SNIPPET slide */}
          {slide.type === 'codeSnippet' && (
            <div className="space-y-4">
              {/* Language picker */}
              <div className="flex items-center gap-3">
                <Label className="text-xs font-semibold text-gray-600 flex-shrink-0">Language</Label>
                <Select
                  value={slide.codeLanguage || 'python'}
                  onValueChange={(v) => onUpdate('codeLanguage', v)}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="r">R</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Instructions — plain textarea is fine here */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600">Instructions</Label>
                <p className="text-xs text-gray-400">Tell students what the exercise asks them to do.</p>
                <Textarea
                  value={slide.codeInstructions || ''}
                  onChange={(e) => onUpdate('codeInstructions', e.target.value)}
                  disabled={disabled}
                  rows={2}
                  placeholder="e.g. Modify the function below to return the correct value…"
                  className="text-sm resize-none"
                />
              </div>

              {/* Starter code — Monaco editor */}
              <CodeEditor
                label="Starter Code"
                hint="The code students will see and edit. Can be as long as needed."
                value={slide.starterCode || ''}
                onChange={(v) => onUpdate('starterCode', v)}
                language={slide.codeLanguage || 'python'}
                height={260}
                readOnly={disabled}
                placeholder={slide.codeLanguage === 'r' ? '# Write starter R code here…' : '# Write starter Python code here…'}
              />

              {/* Expected output — smaller Monaco, plaintext mode */}
              <CodeEditor
                label="Expected Output"
                hint="Optional — shown to students when their output doesn't match."
                value={slide.expectedOutput || ''}
                onChange={(v) => onUpdate('expectedOutput', v)}
                language="plaintext"
                height={100}
                readOnly={disabled}
                placeholder="Expected console output…"
              />

              {/* Live run preview */}
              <div className="border border-green-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border-b border-green-100">
                  <Icons.Play className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-xs font-semibold text-green-700">Live Preview — run & verify before publishing</span>
                </div>
                <div className="p-3">
                  <InteractiveCodeEditor
                    language={slide.codeLanguage || 'python'}
                    instructions={slide.codeInstructions || ''}
                    starterCode={slide.starterCode || ''}
                    expectedOutput={slide.expectedOutput || ''}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Case Study Tab ─────────────────────────────────────────────────────────────

function CaseStudyTab({ caseStudy, onChange, disabled }) {
  const [expandedSection, setExpandedSection] = useState(null);

  const enabled = !!caseStudy;

  const toggle = (checked) => {
    onChange(checked ? emptyCaseStudy() : null);
    setExpandedSection(null);
  };

  const update = (field, value) => onChange({ ...caseStudy, [field]: value });

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-amber-100 bg-amber-50/50">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-amber-900">Include Case Study</p>
          <p className="text-xs text-amber-600">
            Optional. Adds 4 sections: Introduction, Dataset, AI Task, and Key Readings.
            Case studies are reading material — learners are not quizzed on them.
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={toggle} disabled={disabled} />
      </div>

      {enabled ? (
        <div className="space-y-3">
          {/* Case study name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Case Study Name <span className="text-red-500">*</span></Label>
            <Input
              value={caseStudy.name || ''}
              onChange={(e) => update('name', e.target.value)}
              disabled={disabled}
              placeholder="e.g. Drought Early Warning in the Horn of Africa"
            />
          </div>

          {/* 4 sections */}
          {CS_SECTIONS.map(({ key, label, Icon: SectionIcon, placeholder }) => (
            <div key={key} className="border border-amber-100 rounded-xl overflow-hidden">
              <div
                className="flex items-center gap-2.5 px-3 py-2.5 bg-amber-50 cursor-pointer hover:bg-amber-100 transition-colors"
                onClick={() => setExpandedSection(expandedSection === key ? null : key)}
              >
                <SectionIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-sm font-medium text-amber-800 flex-1">{label}</span>
                {caseStudy[key] && caseStudy[key] !== '<p><br></p>' && (
                  <Badge className="text-[9px] h-4 px-1.5 bg-amber-200 text-amber-800 border-0">✓ Added</Badge>
                )}
                <Icons.ChevronDown className={`w-4 h-4 text-amber-400 transition-transform ${expandedSection === key ? 'rotate-180' : ''}`} />
              </div>
              {expandedSection === key && (
                <div className="p-4 border-t border-amber-100">
                  <RichTextEditor
                    value={caseStudy[key] || ''}
                    onChange={(v) => update(key, v)}
                    placeholder={placeholder}
                    height={180}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-sm text-gray-400">
          <Icons.FlaskConical className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p>No case study for this lesson.</p>
          <p className="text-xs mt-1">Use the toggle above to add one.</p>
        </div>
      )}
    </div>
  );
}

// ─── Resources Tab ──────────────────────────────────────────────────────────────

function ResourcesTab({ resources = [], onChange, disabled }) {
  const blank = () => ({ url: '', name: '', description: '', fileType: '' });
  const add = () => onChange([...resources, blank()]);
  const remove = (i) => onChange(resources.filter((_, idx) => idx !== i));
  const update = (i, f, v) => {
    const n = [...resources]; n[i] = { ...n[i], [f]: v }; onChange(n);
  };

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
      <div className="mb-3">
        <ResourceUploader value={resources} onChange={handleUploadResources} label="Upload lesson resources" />
      </div>
      {resources.length === 0 ? (
        <div className="text-center py-10 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
          <Icons.Link className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p>No resources attached to this lesson.</p>
          <p className="text-xs mt-1">Resources can be links, PDFs, notebooks, datasets, and more.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {resources.map((r, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-600">Resource {i + 1}</span>
                <div className="flex items-center gap-1">
                  {r.url && (() => {
                    const resolvedUrl = resolveAssetUrl(r.url);
                    const ext = (r.name || r.url || '').split('.').pop()?.toLowerCase();
                    const isPdf = ext === 'pdf';
                    const href = isPdf ? resolvedUrl : resolvedUrl.replace('/upload/', '/upload/fl_attachment/');
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
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Icons.Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Name <span className="text-red-500">*</span></Label>
                  <Input
                    value={r.name}
                    onChange={(e) => update(i, 'name', e.target.value)}
                    disabled={disabled}
                    placeholder="Resource name"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Type</Label>
                  <Select
                    value={r.fileType || ''}
                    onValueChange={(v) => update(i, 'fileType', v)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOURCE_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">URL <span className="text-gray-400 font-normal">(optional)</span></Label>
                <Input
                  type="url"
                  value={r.url}
                  onChange={(e) => update(i, 'url', e.target.value)}
                  disabled={disabled}
                  placeholder="https://..."
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Description <span className="text-gray-400 font-normal">(optional)</span></Label>
                <Input
                  value={r.description}
                  onChange={(e) => update(i, 'description', e.target.value)}
                  disabled={disabled}
                  placeholder="Brief description of this resource..."
                  className="h-8 text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {!disabled && (
        <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1.5 w-full">
          <Icons.Plus className="w-3.5 h-3.5" /> Add Resource
        </Button>
      )}
    </div>
  );
}

// ─── Quiz helpers ────────────────────────────────────────────────────────────────

/**
 * Infer the question type from its data when `type` is missing (legacy data).
 *  - Has non-empty options array → 'multiple-choice'
 *  - Answer is 'True' or 'False' with no options → 'true-false'
 *  - Anything else → 'short-answer'
 */
function inferQuestionType(q) {
  if (q.type) return q.type;
  const hasOptions = Array.isArray(q.options) && q.options.some(Boolean);
  if (hasOptions) return 'multiple-choice';
  if (['True', 'False'].includes(q.answer)) return 'true-false';
  return 'short-answer';
}

/** Normalize a question from the DB so it always has a type and sensible defaults. */
function normalizeQuestion(q) {
  const type = inferQuestionType(q);
  return {
    ...q,
    type,
    options: type === 'multiple-choice' ? (q.options || ['', '', '', '']) : (q.options || []),
    answer: q.answer ?? '',
    points: q.points ?? 1,
  };
}

// ─── Quiz Tab ───────────────────────────────────────────────────────────────────

function QuizTab({ quiz, passingScore, maxAttempts, onQuizChange, onPassingScoreChange, onMaxAttemptsChange, disabled }) {
  // Normalize all incoming questions so legacy data (missing type) displays correctly.
  const normalizedQuiz = quiz.map(normalizeQuestion);

  const addQ = () => onQuizChange([...normalizedQuiz, emptyQuestion()]);
  const removeQ = (i) => onQuizChange(normalizedQuiz.filter((_, idx) => idx !== i));
  const updateQ = (i, f, v) => {
    const n = [...normalizedQuiz]; n[i] = { ...n[i], [f]: v }; onQuizChange(n);
  };
  const updateOption = (qi, oi, v) => {
    const n = [...normalizedQuiz];
    const opts = [...(n[qi].options || [])];
    opts[oi] = v;
    n[qi] = { ...n[qi], options: opts };
    onQuizChange(n);
  };
  const addOption = (qi) => {
    const n = [...normalizedQuiz];
    n[qi] = { ...n[qi], options: [...(n[qi].options || []), ''] };
    onQuizChange(n);
  };
  const removeOption = (qi, oi) => {
    const n = [...normalizedQuiz];
    n[qi] = { ...n[qi], options: n[qi].options.filter((_, i) => i !== oi) };
    onQuizChange(n);
  };

  return (
    <div className="space-y-4">
      {/* Settings bar */}
      <div className="flex items-center gap-6 p-3 bg-purple-50/50 rounded-xl border border-purple-100">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium text-purple-700">Passing Score</Label>
          <Input
            type="number" min={0} max={100}
            value={passingScore}
            onChange={(e) => onPassingScoreChange(parseInt(e.target.value))}
            disabled={disabled}
            className="w-16 h-7 text-xs"
          />
          <span className="text-xs text-purple-500">%</span>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium text-purple-700">Max Attempts</Label>
          <Input
            type="number" min={1}
            value={maxAttempts}
            onChange={(e) => onMaxAttemptsChange(parseInt(e.target.value))}
            disabled={disabled}
            className="w-16 h-7 text-xs"
          />
        </div>
        <p className="text-xs text-purple-400 ml-auto">Learners must pass before proceeding.</p>
      </div>

      {/* Questions */}
      {quiz.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-purple-100 rounded-xl">
          <Icons.HelpCircle className="w-10 h-10 text-purple-100 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No quiz questions yet.</p>
          <p className="text-xs text-gray-400 mt-1">Quiz is optional — learners won't be tested if left empty.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {normalizedQuiz.map((q, i) => (
            <QuizQuestion
              key={i}
              question={q}
              idx={i}
              onUpdate={(f, v) => updateQ(i, f, v)}
              onUpdateOption={(oi, v) => updateOption(i, oi, v)}
              onAddOption={() => addOption(i)}
              onRemoveOption={(oi) => removeOption(i, oi)}
              onDelete={() => removeQ(i)}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      {!disabled && (
        <Button
          type="button" variant="outline" size="sm" onClick={addQ}
          className="gap-1.5 w-full border-purple-200 text-purple-700 hover:bg-purple-50"
        >
          <Icons.Plus className="w-3.5 h-3.5" /> Add Question
        </Button>
      )}
    </div>
  );
}

// ─── Quiz Question ──────────────────────────────────────────────────────────────

function QuizQuestion({ question, idx, onUpdate, onUpdateOption, onAddOption, onRemoveOption, onDelete, disabled }) {
  // Use the already-normalized type (normalizeQuestion runs in QuizTab before render)
  const isMC = question.type === 'multiple-choice';
  const isTF = question.type === 'true-false';
  const hasCode = !!question.codeSnippet;

  const toggleCode = (enabled) => {
    onUpdate('codeSnippet', enabled ? { language: 'python', code: '' } : null);
  };

  return (
    <div className="border border-purple-100 rounded-xl overflow-hidden bg-purple-50/20">
      {/* Question header */}
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Badge className="bg-purple-100 text-purple-700 border-0 flex-shrink-0 mt-0.5">Q{idx + 1}</Badge>
          <div className="flex-1 space-y-2">
            <Textarea
              value={question.question}
              onChange={(e) => onUpdate('question', e.target.value)}
              disabled={disabled}
              placeholder="Enter question text…"
              rows={2}
              className="text-sm resize-none"
            />
            <div className="flex items-center gap-2">
              <Select value={question.type} onValueChange={(v) => onUpdate('type', v)} disabled={disabled}>
                <SelectTrigger className="flex-1 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUIZ_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number" min={1}
                value={question.points ?? 1}
                onChange={(e) => onUpdate('points', parseInt(e.target.value))}
                disabled={disabled}
                className="w-16 h-7 text-xs"
                title="Points"
              />
              <span className="text-xs text-gray-400">pts</span>
            </div>
          </div>
          {!disabled && (
            <button type="button" onClick={onDelete} className="text-gray-300 hover:text-red-500 mt-1 flex-shrink-0">
              <Icons.X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Code snippet toggle */}
        <div className="flex items-center justify-between pl-10 pr-1 py-2 bg-white rounded-lg border border-purple-100">
          <div className="flex items-center gap-2">
            <Icons.Code2 className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-medium text-gray-600">Attach code snippet to this question</span>
            <span className="text-xs text-gray-400">(students see the code before answering)</span>
          </div>
          <Switch checked={hasCode} onCheckedChange={toggleCode} disabled={disabled} />
        </div>
      </div>

      {/* Code snippet editor — shown when toggled on */}
      {hasCode && (
        <div className="border-t border-purple-100 px-4 pb-4 pt-3 space-y-3 bg-[#1a1a2e]/[0.02]">
          <div className="flex items-center gap-3">
            <Label className="text-xs font-semibold text-gray-600 flex-shrink-0">Code Language</Label>
            <Select
              value={question.codeSnippet.language || 'python'}
              onValueChange={(v) => onUpdate('codeSnippet', { ...question.codeSnippet, language: v })}
              disabled={disabled}
            >
              <SelectTrigger className="w-32 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="r">R</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CodeEditor
            label="Code for this Question"
            hint="This code block is shown to students as part of the question context."
            value={question.codeSnippet.code || ''}
            onChange={(v) => onUpdate('codeSnippet', { ...question.codeSnippet, code: v })}
            language={question.codeSnippet.language || 'python'}
            height={200}
            readOnly={disabled}
            placeholder="# Paste or write the code students should read and analyse…"
          />
        </div>
      )}

      {/* Answer options */}
      <div className="px-4 pb-4 space-y-3">
        {(isMC || isTF) && (
          <div className="ml-10 space-y-1.5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Options — click the radio to mark correct:</p>
            {(isTF ? ['True', 'False'] : question.options || []).map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`q-${idx}-ans`}
                  checked={question.answer === opt}
                  onChange={() => onUpdate('answer', opt)}
                  disabled={disabled}
                  className="accent-purple-600 flex-shrink-0"
                />
                {isTF ? (
                  <span className="text-sm text-gray-700">{opt}</span>
                ) : (
                  <div className="flex-1 flex items-center gap-1.5">
                    <Input
                      value={opt}
                      onChange={(e) => onUpdateOption(oi, e.target.value)}
                      disabled={disabled}
                      placeholder={`Option ${oi + 1}`}
                      className="flex-1 h-7 text-xs"
                    />
                    {!disabled && (question.options || []).length > 2 && (
                      <button type="button" onClick={() => onRemoveOption(oi)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                        <Icons.X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {isMC && !disabled && (question.options || []).length < 6 && (
              <button type="button" onClick={onAddOption} className="text-xs text-purple-500 hover:text-purple-700 mt-1">
                + Add option
              </button>
            )}
          </div>
        )}

        {/* Short answer */}
        {!isMC && !isTF && (
          <div className="ml-10 space-y-1">
            <Label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Correct Answer</Label>
            <Input
              value={question.answer || ''}
              onChange={(e) => onUpdate('answer', e.target.value)}
              disabled={disabled}
              placeholder="Type the expected answer…"
              className="h-7 text-xs"
            />
          </div>
        )}

        {/* Explanation */}
        <div className="ml-10">
          <Input
            value={question.explanation || ''}
            onChange={(e) => onUpdate('explanation', e.target.value)}
            disabled={disabled}
            placeholder="Explanation (shown after answering — optional)"
            className="h-7 text-xs text-gray-500"
          />
        </div>
      </div>
    </div>
  );
}
