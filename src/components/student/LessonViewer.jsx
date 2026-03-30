'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Icons from 'lucide-react';
import SlideRenderer from './SlideRenderer';
import { useEngagementTracker } from '@/hooks/useEngagementTracker';
import moduleEnrollmentService from '@/lib/api/moduleEnrollmentService';

/**
 * LessonViewer — Netacad-style slide experience.
 * Phases: intro → slides → assessment
 */
export default function LessonViewer({
  lesson,
  lessonIndex,
  totalLessons,
  enrollment,
  onLessonComplete,
  onAssessmentComplete,
  isAlreadyCompleted = false,
  darkMode = false,
}) {
  const slides = (lesson?.slides || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const hasAssessment = (lesson?.assessmentQuiz || []).length > 0;

  const [phase, setPhase] = useState(isAlreadyCompleted ? 'slides' : 'intro');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(() => {
    // Restore last slide position from localStorage on mount
    if (typeof window === 'undefined' || !enrollment?._id) return 0;
    const saved = localStorage.getItem(`slide-pos-${enrollment._id}-${lessonIndex}`);
    if (saved !== null) {
      const idx = parseInt(saved, 10);
      if (!isNaN(idx) && idx >= 0) return idx;
    }
    return 0;
  });
  const [completedSlides, setCompletedSlides] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});
  const [checkedAnswers, setCheckedAnswers] = useState({});
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [assessmentError, setAssessmentError] = useState('');

  const currentSlide = slides[currentSlideIndex] || null;
  const allSlidesCompleted = slides.length === 0 || completedSlides.size >= slides.length;

  const { containerRef, timeSpent, canProceed, remainingTime, progressPercent, resetTracker, meetsTimeReq, scrolledToBottom } =
    useEngagementTracker({
      minViewingTime: currentSlide?.minViewingTime ?? 15,
      scrollTrackingEnabled: currentSlide?.scrollTrackingEnabled ?? false,
      onSlideComplete: useCallback(
        ({ timeSpent: t, scrolledToBottom: s }) => { handleSlideComplete(currentSlideIndex, t, s); },
        [currentSlideIndex], // eslint-disable-line react-hooks/exhaustive-deps
      ),
    });

  useEffect(() => {
    if (isAlreadyCompleted && slides.length > 0) setCompletedSlides(new Set(slides.map((_, i) => i)));
  }, [isAlreadyCompleted, slides.length]);

  useEffect(() => {
    if (!enrollment) return;
    const lp = enrollment.lessonProgress?.find((l) => l.lessonIndex === lessonIndex);
    if (!lp?.slideProgress) return;
    const done = new Set(lp.slideProgress.filter((sp) => sp.isCompleted).map((sp) => sp.slideIndex));
    setCompletedSlides(done);
  }, [enrollment, lessonIndex]);

  // Restore phase to 'slides' if we have a saved slide position
  useEffect(() => {
    if (!enrollment?._id || isAlreadyCompleted) return;
    const saved = localStorage.getItem(`slide-pos-${enrollment._id}-${lessonIndex}`);
    if (saved !== null) {
      const idx = parseInt(saved, 10);
      if (!isNaN(idx) && idx > 0 && idx < slides.length) setPhase('slides');
    }
  }, [enrollment?._id, lessonIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist slide position
  useEffect(() => {
    if (!enrollment?._id || phase !== 'slides') return;
    localStorage.setItem(`slide-pos-${enrollment._id}-${lessonIndex}`, String(currentSlideIndex));
  }, [currentSlideIndex, phase, enrollment?._id, lessonIndex]);

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    resetTracker();
  }, [currentSlideIndex, resetTracker]);

  const serverReportTimeout = useRef(null);
  const reportSlideProgressToServer = useCallback(
    (slideIndex, time, scrolled) => {
      if (!enrollment?._id) return;
      clearTimeout(serverReportTimeout.current);
      serverReportTimeout.current = setTimeout(async () => {
        try { await moduleEnrollmentService.trackSlideProgress(enrollment._id, lessonIndex, slideIndex, time, scrolled); } catch (_) {}
      }, 500);
    },
    [enrollment?._id, lessonIndex],
  );

  const handleSlideComplete = useCallback((slideIndex, time, scrolled) => {
    setCompletedSlides((prev) => { const next = new Set(prev); next.add(slideIndex); return next; });
    reportSlideProgressToServer(slideIndex, time, scrolled);
  }, [reportSlideProgressToServer]);

  useEffect(() => {
    if (!currentSlide || isAlreadyCompleted) return;
    const interval = setInterval(() => {
      if (timeSpent > 0) reportSlideProgressToServer(currentSlideIndex, 5, scrolledToBottom);
    }, 5000);
    return () => clearInterval(interval);
  }, [currentSlideIndex, timeSpent, scrolledToBottom, currentSlide, isAlreadyCompleted, reportSlideProgressToServer]);

  const goNext = () => { if (currentSlideIndex < slides.length - 1) setCurrentSlideIndex((i) => i + 1); };
  const goPrev = () => { if (currentSlideIndex > 0) setCurrentSlideIndex((i) => i - 1); };

  const handleCompleteLesson = async () => {
    if (!enrollment?._id) return;
    setSubmitting(true);
    try { await moduleEnrollmentService.completeLesson(enrollment._id, lessonIndex); onLessonComplete?.(); }
    catch (err) { console.error('Failed to complete lesson:', err); }
    finally { setSubmitting(false); }
  };

  const submitAssessment = async () => {
    if (!enrollment?._id) return;
    const questions = lesson?.assessmentQuiz || [];
    const formattedAnswers = questions.map((_, i) => ({ questionIndex: Number(i), answer: String(answers[i] ?? '') }));
    setSubmitting(true); setAssessmentError('');
    try {
      const res = await moduleEnrollmentService.submitLessonAssessment(enrollment._id, lessonIndex, formattedAnswers);
      setAssessmentResult(res); onAssessmentComplete?.(res);
    } catch (err) { setAssessmentError(err?.response?.data?.message || 'Failed to submit assessment.'); }
    finally { setSubmitting(false); }
  };

  if (slides.length === 0 && !hasAssessment) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
        <Icons.FileX className="w-10 h-10" />
        <p className="text-sm">This lesson has no content yet.</p>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE: INTRO
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'intro') {
    const outcomes = lesson?.learningOutcomes || [];
    return (
      <div className={`flex-1 overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          {/* Lesson header */}
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                Lesson {lessonIndex + 1} of {totalLessons}
              </span>
              {isAlreadyCompleted && (
                <span className="text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full flex items-center gap-1">
                  <Icons.CheckCircle className="w-3 h-3" /> Completed
                </span>
              )}
            </div>
            <h2 className={`text-2xl md:text-3xl font-bold mb-4 leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {lesson?.title}
            </h2>
            {/* Meta chips */}
            <div className="flex flex-wrap gap-2">
              {slides.length > 0 && (
                <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                  <Icons.Layers className="w-3.5 h-3.5" /> {slides.length} slide{slides.length !== 1 ? 's' : ''}
                </span>
              )}
              {hasAssessment && (
                <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-green-100 text-green-700">
                  <Icons.HelpCircle className="w-3.5 h-3.5" /> Assessment included
                </span>
              )}
              {lesson?.duration && (
                <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                  <Icons.Clock className="w-3.5 h-3.5" /> {lesson.duration}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {lesson?.description && (
            <div className={`border-t pt-6 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className={`prose prose-sm max-w-none leading-relaxed
                prose-p:text-gray-600 prose-headings:font-bold
                prose-li:text-gray-600 prose-a:text-green-600 prose-strong:text-gray-900
                ${darkMode ? 'prose-invert prose-p:text-gray-300' : ''}`}
                dangerouslySetInnerHTML={{ __html: lesson.description }}
              />
            </div>
          )}

          {/* Learning outcomes */}
          {outcomes.length > 0 && (
            <div className={`border-t pt-6 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                  <Icons.Target className="w-4 h-4 text-green-600" />
                </div>
                <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>What you'll learn</p>
              </div>
              <ul className="space-y-2.5">
                {outcomes.map((outcome, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <span className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      dangerouslySetInnerHTML={{ __html: outcome }} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Start button */}
          <div className={`flex justify-end border-t pt-6 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <button
              onClick={() => setPhase('slides')}
              className="flex items-center gap-2 px-7 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              {isAlreadyCompleted ? 'Review Slides' : 'Start Lesson'}
              <Icons.ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE: ASSESSMENT
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'assessment') {
    const questions = lesson?.assessmentQuiz || [];
    const allAnswered = questions.length > 0 && questions.every((_, i) => answers[i]);

    return (
      <div className={`flex-1 overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Assessment header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-t-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setPhase('slides')}
                className="flex items-center gap-1.5 text-sm text-green-100 hover:text-white transition-colors font-medium"
              >
                <Icons.ChevronLeft className="w-4 h-4" /> Back to slides
              </button>
              <span className="text-xs font-bold uppercase tracking-widest text-green-100 bg-white/15 px-3 py-1 rounded-full">
                Lesson Quiz
              </span>
            </div>
            <h3 className="text-xl font-bold mb-3">{lesson?.title} — Assessment</h3>
            <div className="flex flex-wrap gap-3">
              <span className="flex items-center gap-1.5 text-xs text-white/80 bg-white/10 px-3 py-1.5 rounded-lg">
                <Icons.CheckCircle className="w-3.5 h-3.5" /> Pass: {lesson?.quizPassingScore || 70}%
              </span>
              {lesson?.quizMaxAttempts && (
                <span className="flex items-center gap-1.5 text-xs text-white/80 bg-white/10 px-3 py-1.5 rounded-lg">
                  <Icons.RotateCcw className="w-3.5 h-3.5" /> Max {lesson.quizMaxAttempts} attempts
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs text-white/80 bg-white/10 px-3 py-1.5 rounded-lg">
                <Icons.HelpCircle className="w-3.5 h-3.5" /> {questions.length} question{questions.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-b-2xl border border-gray-200 border-t-0 shadow-sm">
            <div className="p-6">
              {assessmentResult ? (
                <AssessmentResult result={assessmentResult} questions={questions} answers={answers} onContinue={onLessonComplete} />
              ) : (
                <div className="space-y-5">
                  {questions.map((q, i) => (
                    <QuestionCard
                      key={i}
                      question={q}
                      index={i}
                      selected={answers[i]}
                      checked={checkedAnswers[i]}
                      onChange={(val) => {
                        setAnswers((prev) => ({ ...prev, [i]: val }));
                        const t = q.type;
                        if (t === 'multiple-choice' || t === 'multiple_choice' || t === 'true-false') {
                          setCheckedAnswers((prev) => ({ ...prev, [i]: { correct: evaluateAnswer(q, val), answer: val } }));
                        }
                      }}
                      onCheck={(val) => setCheckedAnswers((prev) => ({ ...prev, [i]: { correct: evaluateAnswer(q, val), answer: val } }))}
                    />
                  ))}
                  {assessmentError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                      <Icons.AlertCircle className="w-4 h-4 flex-shrink-0" /> {assessmentError}
                    </div>
                  )}
                  <button
                    onClick={submitAssessment}
                    disabled={submitting || !allAnswered}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm text-base"
                  >
                    {submitting ? <Icons.Loader2 className="w-5 h-5 animate-spin" /> : <Icons.Send className="w-5 h-5" />}
                    {submitting ? 'Submitting…' : 'Submit Assessment'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE: SLIDES
  // ═══════════════════════════════════════════════════════════════════════════
  const isLastSlide = currentSlideIndex === slides.length - 1;
  const isSlideComplete = isAlreadyCompleted || completedSlides.has(currentSlideIndex);
  const nextButtonEnabled = isAlreadyCompleted || canProceed || isSlideComplete;
  const engagementDone = meetsTimeReq && (currentSlide?.scrollTrackingEnabled ? scrolledToBottom : true);

  return (
    <div className={`flex flex-col h-full ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>

      {/* ── Thin slide-position bar (kept thin, just position not engagement) ── */}
      <div className={`flex-shrink-0 h-[3px] ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div
          className="h-full bg-green-500 transition-all duration-500 rounded-r-full"
          style={{ width: `${((currentSlideIndex + 1) / slides.length) * 100}%` }}
        />
      </div>

      {/* ── Main slide area ──────────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">

        {/* Left nav arrow */}
        <button
          onClick={goPrev}
          disabled={currentSlideIndex === 0}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-16 w-9 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-r-2xl flex items-center justify-center disabled:opacity-0 disabled:pointer-events-none transition-all shadow-lg hover:shadow-xl hover:w-10 group"
          title="Previous slide"
        >
          <Icons.ChevronLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        {/* Slide content */}
        <div ref={containerRef} className={`h-full overflow-y-auto overflow-x-hidden ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          {currentSlide ? (
            <SlideRenderer
              slide={currentSlide}
              slideNumber={currentSlideIndex + 1}
              totalSlides={slides.length}
              sectionTitle={currentSlide?.sectionTitle || ''}
              darkMode={darkMode}
            />
          ) : (
            <div className={`flex items-center justify-center py-16 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No slide content</div>
          )}
        </div>

        {/* Right nav arrow */}
        <button
          onClick={goNext}
          disabled={!nextButtonEnabled || isLastSlide}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-16 w-9 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-l-2xl flex items-center justify-center disabled:opacity-0 disabled:pointer-events-none transition-all shadow-lg hover:shadow-xl hover:w-10 group"
          title="Next slide"
        >
          <Icons.ChevronRight className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        {/* Engagement ring (top-right corner) */}
        {!isAlreadyCompleted && currentSlide && !isSlideComplete && (
          <div className="absolute top-3 right-10 z-20">
            <EngagementRing
              progressPercent={progressPercent}
              done={engagementDone}
              remainingTime={remainingTime}
              scrollRequired={currentSlide?.scrollTrackingEnabled}
              scrolledToBottom={scrolledToBottom}
              darkMode={darkMode}
            />
          </div>
        )}
        {isSlideComplete && (
          <div className="absolute top-3 right-10 z-20">
            <div className="w-11 h-11 rounded-full bg-green-500 flex items-center justify-center shadow-md shadow-green-500/30">
              <Icons.Check className="w-5 h-5 text-white" strokeWidth={3} />
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────────────────── */}
      <div className={`flex-shrink-0 flex items-center gap-3 px-4 py-3.5 border-t shadow-[0_-2px_8px_rgba(0,0,0,0.06)] ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>

        {/* Overview link */}
        <button
          onClick={() => setPhase('intro')}
          className={`flex items-center gap-1 text-xs font-medium transition-colors flex-shrink-0 ${darkMode ? 'text-gray-400 hover:text-green-400' : 'text-gray-500 hover:text-green-700'}`}
        >
          <Icons.ChevronLeft className="w-3.5 h-3.5" /> Overview
        </button>

        {/* Dot indicators */}
        <div className="flex-1 flex items-center justify-center gap-1.5 overflow-x-auto py-1 px-2">
          {slides.map((_, i) => {
            const isActive = i === currentSlideIndex;
            const isDone = completedSlides.has(i) || isAlreadyCompleted;
            const canJump = isAlreadyCompleted || isDone || i <= currentSlideIndex;
            return (
              <button
                key={i}
                onClick={() => canJump && setCurrentSlideIndex(i)}
                disabled={!canJump}
                title={`Slide ${i + 1}`}
                className={`flex-shrink-0 rounded-full transition-all duration-200 ${
                  isActive ? 'w-6 h-2.5 bg-green-500 shadow-sm shadow-green-400/50'
                  : isDone ? `w-2.5 h-2.5 hover:scale-125 ${darkMode ? 'bg-green-500' : 'bg-green-400 hover:bg-green-500'}`
                  : `w-2.5 h-2.5 cursor-not-allowed ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`
                }`}
              />
            );
          })}
          {hasAssessment && (
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ml-1 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} title="Assessment" />
          )}
        </div>

        {/* Action (right side) */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <span className={`text-xs font-medium tabular-nums ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {currentSlideIndex + 1}/{slides.length}
          </span>
          {/* Next button when not last slide */}
          {!isLastSlide && (
            <button
              onClick={goNext}
              disabled={!nextButtonEnabled}
              className={`flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm hover:shadow-md
                ${nextButtonEnabled
                  ? 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white'
                  : darkMode
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
            >
              Next <Icons.ChevronRight className="w-4 h-4" />
            </button>
          )}
          {isLastSlide && allSlidesCompleted && (
            hasAssessment ? (
              <button
                onClick={() => setPhase('assessment')}
                className="flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold transition-all shadow-sm hover:shadow-md"
              >
                <Icons.HelpCircle className="w-4 h-4" /> Take Quiz
              </button>
            ) : (
              <button
                onClick={handleCompleteLesson}
                disabled={submitting}
                className="flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
              >
                {submitting ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.CheckCircle className="w-4 h-4" />}
                {submitting ? 'Saving…' : 'Complete Lesson'}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ── Engagement Ring ────────────────────────────────────────────────────────────
function EngagementRing({ progressPercent, done, remainingTime, scrollRequired, scrolledToBottom, darkMode = false }) {
  const allDone = done && (!scrollRequired || scrolledToBottom);
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(progressPercent, 100) / 100);

  const tooltipText = allDone
    ? 'Ready to continue'
    : scrollRequired && !scrolledToBottom
      ? 'Scroll to the bottom to continue'
      : `${remainingTime}s reading time remaining`;

  return (
    <div className={`relative w-11 h-11 shadow-lg rounded-full cursor-default select-none ${darkMode ? 'shadow-black/40' : 'shadow-gray-200'}`} title={tooltipText}>
      <svg width="44" height="44" className="-rotate-90">
        <circle cx="22" cy="22" r={r} fill={darkMode ? '#1f2937' : 'white'} stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="3" />
        <circle
          cx="22" cy="22" r={r} fill="none"
          stroke="#16a34a"
          strokeWidth="3"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {allDone
          ? <Icons.CheckCircle className="w-4 h-4 text-green-500" />
          : scrollRequired && !scrolledToBottom
            ? <Icons.ArrowDown className={`w-3.5 h-3.5 animate-bounce ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            : <Icons.BookOpen className={`w-3.5 h-3.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        }
      </div>
    </div>
  );
}

// ── Answer helpers ─────────────────────────────────────────────────────────────
function resolveOptions(question) {
  if (question.type === 'true-false') return ['True', 'False'];
  return question.options || [];
}

function evaluateAnswer(question, studentAnswer) {
  if (!studentAnswer) return false;
  const ca = question.correctAnswer;
  if (ca === undefined || ca === null || ca === '') return false;
  const options = resolveOptions(question);
  const idx = Number(ca);
  if (!isNaN(idx) && Number.isInteger(idx) && idx >= 0 && idx < options.length)
    return String(studentAnswer).trim().toLowerCase() === String(options[idx]).trim().toLowerCase();
  return String(studentAnswer).trim().toLowerCase() === String(ca).trim().toLowerCase();
}

// ── Question Card ──────────────────────────────────────────────────────────────
function QuestionCard({ question, index, selected, checked, onChange, onCheck }) {
  const isMultipleChoice = question.type === 'multiple-choice' || question.type === 'multiple_choice';
  const isTrueFalse = question.type === 'true-false';
  const isShortAnswer = question.type === 'short-answer' || question.type === 'essay';
  const isChecked = !!checked;
  const isCorrect = checked?.correct;

  const getCorrectOptionText = () => {
    const ca = question.correctAnswer;
    const options = resolveOptions(question);
    const idx = Number(ca);
    if (!isNaN(idx) && Number.isInteger(idx) && idx >= 0 && idx < options.length) return options[idx];
    return String(ca);
  };

  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all ${
      isChecked ? (isCorrect ? 'border-green-300' : 'border-red-300') : 'border-gray-200'
    }`}>
      {/* Question header */}
      <div className={`px-5 py-4 ${isChecked ? (isCorrect ? 'bg-green-50' : 'bg-red-50') : 'bg-gray-50'}`}>
        <div className="flex items-start gap-3">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white mt-0.5
            ${isChecked ? (isCorrect ? 'bg-green-500' : 'bg-red-500') : 'bg-green-600'}`}>
            {isChecked ? (isCorrect ? '✓' : '✗') : index + 1}
          </span>
          <div className="flex-1">
            {question.codeSnippet && (
              <div className="mb-3 rounded-xl overflow-hidden border border-gray-700">
                <div className="px-4 py-2 bg-[#2d2d2d] flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  </div>
                  <span className="text-xs text-gray-400 font-mono ml-1">{question.codeSnippet.language || 'python'}</span>
                </div>
                <pre className="bg-[#1e1e1e] text-green-300 text-xs p-4 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">{question.codeSnippet.code}</pre>
              </div>
            )}
            <p className="font-semibold text-gray-900 leading-snug">{question.question}</p>
            {question.points && <span className="text-xs text-gray-400 mt-1 block">{question.points} pt{question.points !== 1 ? 's' : ''}</span>}
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="p-5 bg-white">
        {(isMultipleChoice || isTrueFalse) && (
          <div className={`${isTrueFalse ? 'flex gap-3' : 'space-y-2.5'}`}>
            {(isTrueFalse ? ['True', 'False'] : question.options || []).map((opt, oi) => {
              const isSelected = selected === opt;
              const correctText = isChecked ? getCorrectOptionText() : null;
              const isThisCorrect = correctText && String(opt).trim() === String(correctText).trim();
              const isThisWrong = isChecked && isSelected && !isCorrect;
              return (
                <label key={oi} className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all select-none
                  ${isTrueFalse ? 'flex-1 justify-center' : ''}
                  ${isChecked
                    ? isThisCorrect ? 'border-green-400 bg-green-50 text-green-900'
                      : isThisWrong ? 'border-red-400 bg-red-50 text-red-900'
                      : 'border-gray-200 bg-white text-gray-400 opacity-60'
                    : isSelected ? 'border-green-600 bg-green-50 text-green-800'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-800'
                  }`}>
                  <input
                    type="radio"
                    name={`q-${index}`}
                    value={opt}
                    checked={isSelected}
                    onChange={() => !isChecked && onChange(opt)}
                    disabled={isChecked}
                    className="accent-green-600 flex-shrink-0 w-4 h-4"
                  />
                  <span className="text-sm font-medium flex-1">{opt}</span>
                  {isChecked && isThisCorrect && <Icons.CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                  {isChecked && isThisWrong && <Icons.XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                </label>
              );
            })}
          </div>
        )}

        {isShortAnswer && (
          <div className="space-y-2">
            <textarea
              value={selected || ''}
              onChange={(e) => !isChecked && onChange(e.target.value)}
              disabled={isChecked}
              placeholder="Type your answer here…"
              rows={3}
              className="w-full border-2 border-gray-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-green-500 resize-none disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
            />
            {!isChecked && selected && (
              <button
                type="button"
                onClick={() => onCheck(selected)}
                className="text-sm px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
              >
                Check Answer
              </button>
            )}
          </div>
        )}

        {isChecked && (
          <div className={`mt-4 rounded-xl p-4 border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <p className={`text-sm font-bold mb-1 flex items-center gap-1.5 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
              {isCorrect ? <><Icons.CheckCircle className="w-4 h-4" /> Correct!</> : <><Icons.XCircle className="w-4 h-4" /> Incorrect</>}
              {!isCorrect && getCorrectOptionText() && (
                <span className="font-normal text-gray-600 ml-1">
                  Correct: <span className="font-semibold text-green-700">{getCorrectOptionText()}</span>
                </span>
              )}
            </p>
            {question.explanation && <p className="text-sm text-gray-600 leading-relaxed mt-1">{question.explanation}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Assessment Result ──────────────────────────────────────────────────────────
function AssessmentResult({ result, questions, answers, onContinue }) {
  const passed = result?.passed;
  const score = result?.score ?? 0;

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl p-8 text-center border-2 ${passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
          {passed
            ? <Icons.Trophy className="w-10 h-10 text-green-600" />
            : <Icons.RefreshCcw className="w-10 h-10 text-red-500" />
          }
        </div>
        <h3 className={`text-2xl font-extrabold mb-2 ${passed ? 'text-green-700' : 'text-red-600'}`}>
          {passed ? 'Well done!' : 'Keep trying!'}
        </h3>
        <p className="text-gray-500 mb-1">Your score</p>
        <p className={`text-5xl font-black mb-4 ${passed ? 'text-green-600' : 'text-red-600'}`}>{score}%</p>
        {result?.remainingAttempts !== undefined && !passed && (
          <p className="text-sm text-gray-500 bg-white rounded-lg px-4 py-2 inline-block mb-3">
            {result.remainingAttempts} attempt{result.remainingAttempts !== 1 ? 's' : ''} remaining
          </p>
        )}
        {result?.lessonResetRequired && (
          <div className="text-sm text-red-700 bg-red-100 border border-red-200 rounded-xl p-4 mt-2 text-left">
            <p className="font-semibold mb-1 flex items-center gap-1.5"><Icons.AlertTriangle className="w-4 h-4" /> All attempts used</p>
            <p>Please re-read this lesson to unlock new attempts.</p>
          </div>
        )}
        {passed && (
          <button
            onClick={onContinue}
            className="mt-4 flex items-center gap-2 px-8 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition-all shadow-md mx-auto"
          >
            Continue <Icons.ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {questions.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Answer Review</p>
          {questions.map((q, i) => {
            const studentAnswer = answers?.[i] || '';
            const isCorrect = evaluateAnswer(q, studentAnswer);
            const options = resolveOptions(q);
            const ca = q.correctAnswer;
            const idx = Number(ca);
            const correctText = (!isNaN(idx) && Number.isInteger(idx) && idx >= 0 && idx < options.length) ? options[idx] : String(ca || '');
            return (
              <div key={i} className={`rounded-xl border-2 overflow-hidden ${isCorrect ? 'border-green-200' : 'border-red-200'}`}>
                <div className={`px-4 py-3 flex items-start gap-3 ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white mt-0.5 ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                    {isCorrect ? '✓' : '✗'}
                  </span>
                  <p className="text-sm font-semibold text-gray-900 flex-1">{q.question}</p>
                </div>
                <div className="px-4 pb-4 pt-3 bg-white space-y-1">
                  <p className="text-xs text-gray-600">
                    Your answer: <span className={`font-semibold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{studentAnswer || '(no answer)'}</span>
                  </p>
                  {!isCorrect && correctText && (
                    <p className="text-xs text-gray-600">
                      Correct answer: <span className="font-semibold text-green-700">{correctText}</span>
                    </p>
                  )}
                  {q.explanation && <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg p-2 border border-gray-100">{q.explanation}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
