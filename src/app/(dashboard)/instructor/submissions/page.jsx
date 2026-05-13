'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, CheckCircle, XCircle, Loader2,
  Eye, FileText, Target, Calendar, User, Check, X,
  ClipboardList, Send, ArrowLeft, Edit3, Star,
  MessageSquare, AlertCircle, BookOpen, RefreshCw,
} from 'lucide-react';
import courseService from '@/lib/api/courseService';
import { useToast } from '@/components/ui/ToastProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/navbar/navbar';

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getEssayIndices(submission) {
  if (!submission) return [];
  return (submission.answers || [])
    .map((a, idx) => {
      const q = submission.questions?.[idx];
      return (a?.questionType === 'essay' || a?.requiresManualGrading || q?.type === 'essay') ? idx : null;
    })
    .filter((idx) => idx !== null);
}

// ── GradeToggle ───────────────────────────────────────────────────────────────

function GradeToggle({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex items-center justify-center gap-2.5 py-3.5 rounded-xl border-2 font-semibold text-sm transition-all
          ${value === true
            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
            : 'border-gray-200 bg-white text-gray-500 hover:border-emerald-300 hover:bg-emerald-50/40'}`}
      >
        <Check className="w-4 h-4" /> Correct
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex items-center justify-center gap-2.5 py-3.5 rounded-xl border-2 font-semibold text-sm transition-all
          ${value === false
            ? 'border-red-500 bg-red-50 text-red-700 shadow-sm'
            : 'border-gray-200 bg-white text-gray-500 hover:border-red-300 hover:bg-red-50/40'}`}
      >
        <X className="w-4 h-4" /> Incorrect
      </button>
    </div>
  );
}

// ── QuestionDot ───────────────────────────────────────────────────────────────

function QuestionDot({ num, graded, correct, active, onClick }) {
  let cls = 'border-2 cursor-pointer transition-all ';
  if (active) {
    cls += 'w-9 h-9 text-sm font-bold border-[#021d49] bg-[#021d49] text-white shadow-lg scale-110';
  } else if (graded) {
    cls += correct
      ? 'w-8 h-8 border-emerald-400 bg-emerald-100 text-emerald-700'
      : 'w-8 h-8 border-red-400 bg-red-100 text-red-700';
  } else {
    cls += 'w-8 h-8 border-gray-300 bg-white text-gray-500 hover:border-blue-300';
  }
  return (
    <button onClick={onClick} className={`rounded-full flex items-center justify-center text-xs font-bold ${cls}`}>
      {graded && !active ? (correct ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />) : num}
    </button>
  );
}

// ── ScorePreview ──────────────────────────────────────────────────────────────

function calcFinalScore(submission, feedback) {
  if (!submission) return 0;
  const autoQuestions  = (submission.questions || []).filter((q) => q.type !== 'essay');
  const essayIndices   = getEssayIndices(submission);
  const autoScore      = submission.autoGradedScore || 0;
  const essayCorrect   = essayIndices.filter((idx) => feedback[idx]?.isCorrect === true).length;
  const totalQ         = autoQuestions.length + essayIndices.length;
  if (totalQ === 0) return autoScore;
  const aw = autoQuestions.length / totalQ;
  const ew = essayIndices.length / totalQ;
  const essayScore = essayIndices.length > 0 ? (essayCorrect / essayIndices.length) * 100 : 0;
  return Math.round(autoScore * aw + essayScore * ew);
}

// ── GradingView ───────────────────────────────────────────────────────────────

function GradingView({ submission, onClose, onSaved }) {
  const { showToast } = useToast();
  const essayIdxs = useMemo(() => getEssayIndices(submission), [submission]);

  const [step, setStep]       = useState(0);      // which essay (0-based)
  const [phase, setPhase]     = useState('grade'); // 'grade' | 'review'
  const [feedback, setFeedback] = useState(() => {
    const init = {};
    essayIdxs.forEach((realIdx) => {
      const a = submission.answers?.[realIdx];
      init[realIdx] = { isCorrect: a?.isCorrect ?? null, feedback: a?.instructorFeedback || '' };
    });
    return init;
  });
  const [saving, setSaving] = useState(false);

  const currentRealIdx  = essayIdxs[step];
  const currentQuestion = submission.questions?.[currentRealIdx];
  const currentAnswer   = submission.answers?.[currentRealIdx];
  const currentFeedback = feedback[currentRealIdx] || { isCorrect: null, feedback: '' };

  const studentAnswer = currentAnswer?.value || currentAnswer?.studentAnswer || currentAnswer?.userAnswer || '(Not answered)';

  const gradedCount   = essayIdxs.filter((idx) => feedback[idx]?.isCorrect !== null && feedback[idx]?.isCorrect !== undefined).length;
  const allGraded     = gradedCount === essayIdxs.length;
  const finalScore    = calcFinalScore(submission, feedback);
  const passed        = finalScore >= (submission.passingScore || 70);

  const updateFb = (field, value) =>
    setFeedback((prev) => ({ ...prev, [currentRealIdx]: { ...prev[currentRealIdx], [field]: value } }));

  const goNext = () => {
    if (step < essayIdxs.length - 1) setStep((s) => s + 1);
    else setPhase('review');
  };

  const goPrev = () => {
    if (phase === 'review') { setPhase('grade'); setStep(essayIdxs.length - 1); }
    else if (step > 0) setStep((s) => s - 1);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const reviewData = {
        enrollmentId: submission.enrollmentId,
        submissionId: submission._id,
        essayFeedback: feedback,
        finalScore,
        passed,
        reviewedAt: new Date().toISOString(),
      };
      await courseService.submitAssessmentReview(reviewData);
      showToast(`Review saved! Final score: ${finalScore}% — ${passed ? 'PASSED' : 'FAILED'}`, { type: 'success' });
      onSaved?.();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to save review', { type: 'error' });
    } finally { setSaving(false); }
  };

  // ── REVIEW PHASE ──────────────────────────────────────────────────
  if (phase === 'review') {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <button onClick={goPrev} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
              <ArrowLeft className="w-4 h-4 text-gray-500" />
            </button>
            <div>
              <p className="font-bold text-gray-900">Review All Answers</p>
              <p className="text-xs text-gray-400">{gradedCount}/{essayIdxs.length} essay questions graded · Final score preview: {finalScore}%</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Summary */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Score preview banner */}
          <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 ${passed ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
            <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center shrink-0 ${passed ? 'border-emerald-400 bg-white' : 'border-red-400 bg-white'}`}>
              <span className={`text-xl font-extrabold ${passed ? 'text-emerald-600' : 'text-red-600'}`}>{finalScore}</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Projected Final Score</p>
              <p className={`text-xs font-semibold mt-0.5 ${passed ? 'text-emerald-700' : 'text-red-700'}`}>
                {passed ? '✓ Will PASS' : '✗ Will NOT PASS'} · Passing score: {submission.passingScore || 70}%
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Auto-graded: {submission.autoGradedScore || 0}% · Essay: {gradedCount}/{essayIdxs.length} graded</p>
            </div>
          </div>

          {/* Auto-graded summary */}
          {submission.questions?.some((q, idx) => q.type !== 'essay') && (
            <Card className="border-gray-100 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-gray-600">
                  <Target className="w-4 h-4 text-blue-500" /> Auto-Graded Questions
                  <Badge className="ml-auto bg-blue-100 text-blue-700 border-0 text-xs">{submission.autoGradedScore || 0}%</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {submission.questions?.map((q, idx) => {
                  const a = submission.answers?.[idx];
                  if (q.type === 'essay') return null;
                  return (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-gray-600">
                      {a?.isCorrect
                        ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        : <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                      <span className="truncate flex-1">{q.text}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Essay grades summary */}
          <Card className="border-gray-100 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-gray-600">
                <Edit3 className="w-4 h-4 text-violet-500" /> Essay Grades Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {essayIdxs.map((realIdx, i) => {
                const q  = submission.questions?.[realIdx];
                const fb = feedback[realIdx];
                const graded = fb?.isCorrect !== null && fb?.isCorrect !== undefined;
                return (
                  <div key={realIdx} className={`p-3.5 rounded-xl border ${
                    !graded ? 'border-amber-200 bg-amber-50'
                    : fb.isCorrect ? 'border-emerald-200 bg-emerald-50'
                    : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        !graded ? 'bg-amber-200 text-amber-700'
                        : fb.isCorrect ? 'bg-emerald-200 text-emerald-700'
                        : 'bg-red-200 text-red-700'}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 line-clamp-2">{q?.text}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {!graded ? (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Ungraded</span>
                          ) : (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${fb.isCorrect ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'}`}>
                              {fb.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                            </span>
                          )}
                          {fb?.feedback && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> Has feedback
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => { setStep(i); setPhase('grade'); }}
                        className="shrink-0 text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1">
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-white px-6 py-4 flex items-center gap-3">
          {!allGraded && (
            <div className="flex items-center gap-2 text-amber-600 text-xs font-medium flex-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {essayIdxs.length - gradedCount} essay question{essayIdxs.length - gradedCount !== 1 ? 's' : ''} not yet graded
            </div>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <Button variant="outline" onClick={goPrev} className="gap-1.5">
              <ChevronLeft className="w-4 h-4" /> Back to Questions
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#021d49] hover:bg-[#032a66] text-white gap-2 px-6"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Submit Final Review'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── GRADING PHASE ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onClose} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </button>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 truncate">{submission.studentName || 'Student'}</p>
            <p className="text-xs text-gray-400">
              Auto-graded: <span className="font-semibold text-gray-600">{submission.autoGradedScore || 0}%</span>
              {' · '}Submitted: <span className="font-semibold text-gray-600">{fmt(submission.submittedAt)}</span>
            </p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Progress row */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500">Essay Question {step + 1} of {essayIdxs.length}</span>
          <span className="text-xs text-gray-400">{gradedCount}/{essayIdxs.length} graded</span>
        </div>
        <div className="flex items-center gap-2">
          {essayIdxs.map((_, i) => (
            <QuestionDot
              key={i}
              num={i + 1}
              active={i === step}
              graded={feedback[essayIdxs[i]]?.isCorrect !== null && feedback[essayIdxs[i]]?.isCorrect !== undefined}
              correct={feedback[essayIdxs[i]]?.isCorrect === true}
              onClick={() => setStep(i)}
            />
          ))}
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full ml-2 overflow-hidden">
            <div
              className="h-full bg-[#021d49] rounded-full transition-all duration-500"
              style={{ width: `${essayIdxs.length > 0 ? (gradedCount / essayIdxs.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main grading area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Question */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Question {step + 1}</span>
            <span className="text-[10px] bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-full">Essay</span>
            {currentFeedback.isCorrect === true && (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full ml-auto">✓ Marked Correct</span>
            )}
            {currentFeedback.isCorrect === false && (
              <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full ml-auto">✗ Marked Incorrect</span>
            )}
          </div>
          <p className="text-base font-bold text-gray-900 leading-snug">{currentQuestion?.text}</p>
        </div>

        {/* Student answer */}
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500">Student Response</span>
          </div>
          <div className="p-4 bg-white max-h-52 overflow-y-auto">
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              {studentAnswer}
            </p>
          </div>
        </div>

        {/* Expected answer (if any) */}
        {currentQuestion?.correctAnswer && (
          <div className="rounded-2xl border border-emerald-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">Expected / Model Answer</span>
            </div>
            <div className="p-4 bg-white">
              <p className="text-sm text-gray-700 leading-relaxed">{currentQuestion.correctAnswer}</p>
            </div>
          </div>
        )}

        <Separator />

        {/* Grade toggle */}
        <div className="space-y-2">
          <p className="text-sm font-bold text-gray-800">Is this answer correct?</p>
          <GradeToggle value={currentFeedback.isCorrect} onChange={(val) => updateFb('isCorrect', val)} />
        </div>

        {/* Feedback */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-800">
            Feedback to Student <span className="text-gray-400 font-normal text-xs">(optional)</span>
          </label>
          <Textarea
            value={currentFeedback.feedback}
            onChange={(e) => updateFb('feedback', e.target.value)}
            placeholder="Provide constructive feedback — what was strong, what was missing, what to review…"
            rows={3}
            className="resize-none rounded-xl border-gray-200 text-sm focus-visible:ring-[#021d49]/30"
          />
          {currentFeedback.feedback.length > 0 && (
            <p className="text-xs text-gray-400 text-right">{currentFeedback.feedback.length} characters</p>
          )}
        </div>

        {/* Previous feedback */}
        {currentAnswer?.instructorFeedback && (
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800">
            <p className="font-semibold mb-0.5">Previous feedback:</p>
            {currentAnswer.instructorFeedback}
          </div>
        )}
      </div>

      {/* Footer navigation */}
      <div className="border-t border-gray-100 bg-white px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" onClick={goPrev} disabled={step === 0 && phase === 'grade'} className="gap-1.5">
            <ChevronLeft className="w-4 h-4" /> Previous
          </Button>

          <div className="text-xs text-gray-400 text-center">
            {currentFeedback.isCorrect === null || currentFeedback.isCorrect === undefined
              ? 'Grade this answer to continue'
              : <span className="text-emerald-600 font-semibold">✓ Graded — move to next</span>}
          </div>

          {step < essayIdxs.length - 1 ? (
            <Button onClick={goNext} className="bg-[#021d49] hover:bg-[#032a66] text-white gap-1.5">
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={goNext}
              className="bg-violet-700 hover:bg-violet-800 text-white gap-2 px-5"
            >
              <ClipboardList className="w-4 h-4" /> Review All
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── main page ──────────────────────────────────────────────────────────────────

export default function SubmissionsPage() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();

  const [courses, setCourses]               = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [submissions, setSubmissions]       = useState([]);
  const [loading, setLoading]               = useState(true);
  const [gradingSubmission, setGradingSubmission] = useState(null);

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await courseService.getInstructorCourses();
      const list = res || [];
      setCourses(list);
      const courseParam = searchParams?.get?.('course');
      if (courseParam) {
        const found = list.find((c) => c._id === courseParam || String(c._id) === courseParam);
        if (found) { setSelectedCourse(found); fetchSubmissions(found._id); return; }
      }
    } catch (err) {
      showToast('Failed to load courses', { type: 'error' });
    } finally { setLoading(false); }
  };

  const fetchSubmissions = async (courseId) => {
    try {
      setLoading(true);
      const res = await courseService.getCourseSubmissions(courseId);
      setSubmissions(res || []);
    } catch (err) {
      showToast('Failed to load submissions: ' + (err?.response?.data?.message || err.message), { type: 'error' });
      setSubmissions([]);
    } finally { setLoading(false); }
  };

  const handleCourseSelect = (course) => { setSelectedCourse(course); fetchSubmissions(course._id); };
  const handleOpenGrading  = (sub) => setGradingSubmission(sub);
  const handleSaved        = () => { setGradingSubmission(null); fetchSubmissions(selectedCourse._id); };

  // ── If grading view is open, show full-page grading ───────────────
  if (gradingSubmission) {
    const essayCount = getEssayIndices(gradingSubmission).length;
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 pt-20 flex flex-col">
          <div className="flex-1 max-w-3xl w-full mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 my-6 flex flex-col overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 6rem)' }}>
            {essayCount === 0 ? (
              // No essay questions — just show a summary
              <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <Target className="w-8 h-8 text-blue-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">No Essay Questions</h2>
                <p className="text-sm text-gray-500 max-w-xs mb-6">
                  This submission has no essay questions requiring manual grading. The assessment was fully auto-graded.
                </p>
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 mb-6 text-left w-full max-w-xs">
                  <p className="font-semibold mb-1">{gradingSubmission.studentName}</p>
                  <p>Auto-graded score: <strong>{gradingSubmission.autoGradedScore || 0}%</strong></p>
                  <p>Status: <strong className="capitalize">{gradingSubmission.status || 'pending'}</strong></p>
                </div>
                <Button variant="outline" onClick={() => setGradingSubmission(null)} className="gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back to Submissions
                </Button>
              </div>
            ) : (
              <GradingView
                submission={gradingSubmission}
                onClose={() => setGradingSubmission(null)}
                onSaved={handleSaved}
              />
            )}
          </div>
        </div>
      </>
    );
  }

  // ── Default view: course select + submissions list ────────────────
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-7 space-y-6">

          {/* Page header */}
          <div className="bg-white border-b border-gray-100 -mx-4 sm:-mx-6 px-4 sm:px-6 py-5 -mt-7 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ClipboardList className="w-5 h-5 text-[#021d49]" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Instructor</span>
                </div>
                <h1 className="text-xl font-extrabold text-gray-900">Student Submissions</h1>
                <p className="text-gray-400 text-sm mt-0.5">Review and grade essay questions from student assessments.</p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchCourses} className="gap-1.5">
                <RefreshCw className="w-4 h-4" /> Refresh
              </Button>
            </div>
          </div>

          {/* Course Selection */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Select a Course</p>
            {loading && courses.length === 0 ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#021d49]" /></div>
            ) : courses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-gray-500 text-sm">No courses found.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {courses.map((course) => (
                  <button
                    key={course._id}
                    onClick={() => handleCourseSelect(course)}
                    className={`text-left p-4 border-2 rounded-2xl transition-all
                      ${selectedCourse?._id === course._id
                        ? 'border-[#021d49] bg-[#021d49]/5 shadow-sm'
                        : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm'}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${
                      selectedCourse?._id === course._id ? 'bg-[#021d49] text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug">{course.title}</h3>
                    {course.category && <p className="text-xs text-gray-400 mt-0.5">{course.category}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Submissions list */}
          {selectedCourse && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Submissions — {selectedCourse.title}
                </p>
                {submissions.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                      {submissions.filter((s) => s.status !== 'reviewed').length} pending
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                      {submissions.filter((s) => s.status === 'reviewed').length} reviewed
                    </span>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#021d49]" /></div>
              ) : submissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-gray-100">
                  <FileText className="w-10 h-10 text-gray-200 mb-3" />
                  <p className="font-semibold text-gray-600 mb-1">No submissions yet</p>
                  <p className="text-xs text-gray-400">Student submissions will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub) => {
                    const essayCount = getEssayIndices(sub).length;
                    const isReviewed = sub.status === 'reviewed';
                    return (
                      <Card key={sub._id} className="border-gray-100 shadow-sm hover:shadow-md transition-all rounded-2xl">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full bg-[#021d49]/10 flex items-center justify-center shrink-0">
                              <span className="text-sm font-bold text-[#021d49]">
                                {(sub.studentName || 'S').slice(0, 1).toUpperCase()}
                              </span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <p className="font-semibold text-gray-900 text-sm">{sub.studentName || 'Student'}</p>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isReviewed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {isReviewed ? '✓ Reviewed' : '⏳ Pending Review'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {fmt(sub.submittedAt)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Target className="w-3 h-3" />
                                  Auto: {sub.autoGradedScore || 0}%
                                </span>
                                {essayCount > 0 && (
                                  <span className="flex items-center gap-1 text-violet-500">
                                    <Edit3 className="w-3 h-3" />
                                    {essayCount} essay{essayCount !== 1 ? 's' : ''} to grade
                                  </span>
                                )}
                                {isReviewed && sub.finalScore !== undefined && (
                                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                    <Star className="w-3 h-3" />
                                    Final: {sub.finalScore}%
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action */}
                            <Button
                              onClick={() => handleOpenGrading(sub)}
                              size="sm"
                              variant={isReviewed ? 'outline' : 'default'}
                              className={`shrink-0 gap-1.5 ${!isReviewed ? 'bg-[#021d49] hover:bg-[#032a66] text-white' : ''}`}
                            >
                              {isReviewed ? <><Eye className="w-3.5 h-3.5" /> View</> : <><Edit3 className="w-3.5 h-3.5" /> Grade</>}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
