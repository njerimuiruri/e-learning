'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Icons from 'lucide-react';
import SlideRenderer from './SlideRenderer';
import QuizResultsModal from './QuizResultsModal';
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
  onSlideChange,
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
  const [attemptNumber, setAttemptNumber] = useState(1);

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

  // Reset state when lesson changes (lessonIndex prop changes)
  useEffect(() => {
    // Determine initial slide index for this lesson
    let initialSlideIndex = 0;
    if (typeof window !== 'undefined' && enrollment?._id) {
      const saved = localStorage.getItem(`slide-pos-${enrollment._id}-${lessonIndex}`);
      if (saved !== null) {
        const idx = parseInt(saved, 10);
        if (!isNaN(idx) && idx >= 0 && idx < slides.length) {
          initialSlideIndex = idx;
        }
      }
    }
    setCurrentSlideIndex(initialSlideIndex);
    setPhase(isAlreadyCompleted ? 'slides' : 'intro');
    setCompletedSlides(new Set());
    setAnswers({});
    setCheckedAnswers({});
    setAssessmentResult(null);
    setAssessmentError('');
  }, [lessonIndex, slides.length, enrollment?._id, isAlreadyCompleted]);

  useEffect(() => {
    if (!enrollment) return;
    const lp = enrollment.lessonProgress?.find((l) => l.lessonIndex === lessonIndex);
    if (!lp?.slideProgress) return;
    const done = new Set(lp.slideProgress.filter((sp) => sp.isCompleted).map((sp) => sp.slideIndex));
    setCompletedSlides(done);
  }, [enrollment, lessonIndex]);

  // Get passing score and max attempts from lesson
  const passingScore = lesson?.quizPassingScore ?? 70;
  const maxAttempts = lesson?.quizMaxAttempts ?? 3;

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
        try { await moduleEnrollmentService.trackSlideProgress(enrollment._id, lessonIndex, slideIndex, time, scrolled); } catch (_) { }
      }, 500);
    },
    [enrollment?._id, lessonIndex],
  );

  const handleSlideComplete = useCallback((slideIndex, time, scrolled) => {
    setCompletedSlides((prev) => { const next = new Set(prev); next.add(slideIndex); return next; });
    reportSlideProgressToServer(slideIndex, time, scrolled);
  }, [reportSlideProgressToServer]);

  useEffect(() => {
    // Stop the tracker when the student moves to the assessment — avoids a
    // race where a stale save overwrites lessonProgress.isCompleted = true.
    if (!currentSlide || isAlreadyCompleted || phase === 'assessment') return;
    const interval = setInterval(() => {
      if (timeSpent > 0) reportSlideProgressToServer(currentSlideIndex, 5, scrolledToBottom);
    }, 5000);
    return () => clearInterval(interval);
  }, [phase, currentSlideIndex, timeSpent, scrolledToBottom, currentSlide, isAlreadyCompleted, reportSlideProgressToServer]);

  const goNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      const next = currentSlideIndex + 1;
      setCurrentSlideIndex(next);
      onSlideChange?.(next);
    }
  };
  const goPrev = () => {
    if (currentSlideIndex > 0) {
      const prev = currentSlideIndex - 1;
      setCurrentSlideIndex(prev);
      onSlideChange?.(prev);
    }
  };

  const handleCompleteLesson = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onLessonComplete?.();
      // Force a small delay to ensure server has processed the completion
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    catch (err) {
      console.error('Failed to complete lesson:', err);
    }
    finally {
      setSubmitting(false);
    }
  };

  // Mark lesson complete on server before entering the quiz so the backend
  // guard (lessonProgress.isCompleted) is satisfied.
  const handleTakeQuiz = useCallback(async () => {
    if (submitting) return;
    if (enrollment?._id) {
      try {
        await moduleEnrollmentService.completeLesson(enrollment._id, lessonIndex);
      } catch (err) {
        // Non-fatal: log and continue. The assessment pre-call will retry.
        console.warn('[LessonViewer] completeLesson before quiz failed:', err?.response?.data?.message || err?.message);
      }
    }
    setPhase('assessment');
  }, [enrollment?._id, lessonIndex, submitting]);

  // Ref so the Cancel button can abort an in-flight submission
  const abortRef = useRef(null);

  const submitAssessment = useCallback(async () => {
    if (!enrollment?._id || submitting) return;
    const questions = lesson?.assessmentQuiz || [];
    if (questions.length === 0) return;

    // Create a new abort signal for this submission attempt
    const controller = new AbortController();
    abortRef.current = controller;

    setSubmitting(true);
    setAssessmentError('');

    // Helper: reject after `ms` milliseconds with a friendly message
    const withTimeout = (promise, ms) =>
      Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timed out. Please check your connection and try again.')), ms),
        ),
      ]);

    try {
      // Always ensure the lesson is marked complete before submitting the quiz.
      // This is idempotent — safe even if already completed.
      await withTimeout(
        moduleEnrollmentService.completeLesson(enrollment._id, lessonIndex),
        15000,
      ).catch((e) => {
        // Non-fatal — log and continue. The assessment endpoint will catch the
        // "not completed" error itself if this really failed.
        console.warn('[LessonViewer] completeLesson pre-call failed:', e?.response?.data?.message || e?.message);
      });

      if (controller.signal.aborted) return;

      const formattedAnswers = questions.map((_, i) => ({
        questionIndex: Number(i),
        answer: String(answers[i] ?? ''),
      }));

      const res = await withTimeout(
        moduleEnrollmentService.submitLessonAssessment(enrollment._id, lessonIndex, formattedAnswers),
        20000,
      );

      if (controller.signal.aborted) return;

      setAssessmentResult(res);
      onAssessmentComplete?.(res);
    } catch (err) {
      if (controller.signal.aborted) return;
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to submit assessment. Please try again.';
      setAssessmentError(errorMsg);
    } finally {
      if (!controller.signal.aborted) setSubmitting(false);
      abortRef.current = null;
    }
  }, [enrollment?._id, lesson?.assessmentQuiz, answers, lessonIndex, onAssessmentComplete, submitting]);

  const autoSubmitTimeoutRef = useRef(null);

  const handleRetryAssessment = () => {
    setAssessmentResult(null);
    setAnswers({});
    setCheckedAnswers({});
    setAssessmentError('');
    setSubmitting(false);
  };

  // Auto-submit assessment when all questions are answered
  useEffect(() => {
    if (phase !== 'assessment' || submitting || assessmentResult) return;
    const questions = lesson?.assessmentQuiz || [];
    if (questions.length === 0 || !enrollment?._id) return;

    const allAnswered = questions.every((_, i) => answers[i]);
    if (allAnswered) {
      // Clear any pending timeout
      if (autoSubmitTimeoutRef.current) clearTimeout(autoSubmitTimeoutRef.current);

      // Auto-submit after a short delay to ensure checks are rendered
      autoSubmitTimeoutRef.current = setTimeout(() => {
        submitAssessment();
      }, 500);
    }

    return () => {
      if (autoSubmitTimeoutRef.current) clearTimeout(autoSubmitTimeoutRef.current);
    };
  }, [phase, answers, submitting, assessmentResult, lesson?.assessmentQuiz, enrollment?._id]);

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
      <div className={`flex-1 overflow-y-auto overflow-x-hidden ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="px-4 sm:px-6 py-4 space-y-5">
          {/* Lesson header */}
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xs font-semibold text-[#1e40af] bg-blue-100 px-3 py-1 rounded-full">
                Lesson {lessonIndex + 1} of {totalLessons}
              </span>
              {isAlreadyCompleted && (
                <span className="text-xs font-semibold text-[#1e40af] bg-blue-100 px-3 py-1 rounded-full flex items-center gap-1">
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
                <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-100 text-[#1e40af]">
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
            <div className={`border-t pt-4 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className={`prose prose-sm max-w-none leading-relaxed overflow-x-hidden break-words
                prose-p:text-gray-600 prose-p:break-words prose-p:text-left prose-headings:font-bold prose-headings:text-left
                prose-li:text-gray-600 prose-li:text-left prose-a:text-[#1e40af] prose-strong:text-gray-900
                ${darkMode ? 'prose-invert prose-p:text-gray-300' : ''}`}
                dangerouslySetInnerHTML={{ __html: lesson.description }}
              />
            </div>
          )}

          {/* Learning outcomes */}
          {outcomes.length > 0 && (
            <div className={`border-t pt-4 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Icons.Target className="w-4 h-4 text-[#1e40af]" />
                </div>
                <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>What you'll learn</p>
              </div>
              <ul className="space-y-2.5">
                {outcomes.map((outcome, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-[#1e40af] flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
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
          <div className={`flex justify-end border-t pt-4 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <button
              onClick={() => setPhase('slides')}
              className="flex items-center gap-2 px-7 py-3 bg-[#021d49] hover:bg-[#032a66] text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
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
      <div className={`flex-1 overflow-y-auto ${darkMode ? 'bg-gradient-to-b from-gray-900 to-gray-800' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Assessment header - cleaner design */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setPhase('slides')}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${darkMode
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Icons.ChevronLeft className="w-4 h-4" /> Back to lesson
              </button>
              <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg ${darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                }`}>
                📝 Quiz
              </span>
            </div>

            <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {lesson?.title}
            </h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Answer all {questions.length} question{questions.length !== 1 ? 's' : ''} to complete the assessment
            </p>

            {/* Quiz info badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg ${darkMode
                ? 'bg-green-500/10 text-green-300'
                : 'bg-green-50 text-green-700'
                }`}>
                <Icons.Target className="w-3.5 h-3.5" /> Score to pass: {lesson?.quizPassingScore || 70}%
              </div>
              {lesson?.quizMaxAttempts && (
                <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg ${darkMode
                  ? 'bg-orange-500/10 text-orange-300'
                  : 'bg-orange-50 text-orange-700'
                  }`}>
                  <Icons.Zap className="w-3.5 h-3.5" /> {lesson.quizMaxAttempts} attempts allowed
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Progress
              </span>
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {Object.keys(checkedAnswers).length} of {questions.length} answered
              </span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                style={{ width: `${(Object.keys(checkedAnswers).length / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Questions - bigger, cleaner cards */}
          <div className="space-y-6">
            {questions.map((q, i) => (
              <QuestionCard
                key={i}
                question={q}
                index={i}
                selected={answers[i]}
                checked={checkedAnswers[i]}
                totalQuestions={questions.length}
                onChange={(val) => {
                  setAnswers((prev) => ({ ...prev, [i]: val }));
                  const t = q.type;
                  if (t === 'multiple-choice' || t === 'multiple_choice' || t === 'true-false') {
                    setCheckedAnswers((prev) => ({ ...prev, [i]: { correct: evaluateAnswer(q, val), answer: val } }));
                  }
                }}
                onCheck={(val) => setCheckedAnswers((prev) => ({ ...prev, [i]: { correct: evaluateAnswer(q, val), answer: val } }))}
                darkMode={darkMode}
              />
            ))}

            {/* Error message */}
            {assessmentError && (
              <div className={`flex items-start gap-3 p-5 rounded-xl border-2 ${darkMode
                ? 'border-red-500/30 bg-red-500/10'
                : 'border-red-200 bg-red-50'
                }`}>
                <Icons.AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                <div>
                  <p className={`font-semibold ${darkMode ? 'text-red-300' : 'text-red-800'}`}>Error submitting assessment</p>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-red-200' : 'text-red-700'}`}>{assessmentError}</p>
                  <button
                    onClick={() => {
                      setAssessmentError('');
                      if (allAnswered) {
                        setTimeout(() => submitAssessment(), 500);
                      }
                    }}
                    className="text-xs font-semibold mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {/* Loading state - with cancel button */}
            {submitting && !assessmentError && (
              <div className={`flex flex-col items-center justify-center gap-4 py-12 rounded-xl border-2 ${darkMode
                ? 'border-blue-500/30 bg-blue-500/5'
                : 'border-blue-200 bg-blue-50'
                }`}>
                <div className="relative w-12 h-12">
                  <Icons.Loader2 className={`w-12 h-12 animate-spin ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div className="text-center">
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Evaluating your answers...
                  </p>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    This may take a few seconds
                  </p>
                </div>
                <button
                  onClick={() => {
                    abortRef.current?.abort();
                    setSubmitting(false);
                    setAssessmentError('Submission cancelled. All your answers are still saved — click "Try again" to resubmit.');
                  }}
                  className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${darkMode
                    ? 'text-gray-300 border border-gray-600 hover:bg-gray-800'
                    : 'text-gray-700 border border-gray-300 hover:bg-gray-100'
                    }`}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quiz Results Modal */}
        <QuizResultsModal
          isOpen={!!assessmentResult}
          result={assessmentResult}
          passingScore={passingScore}
          maxAttempts={maxAttempts}
          onContinue={onLessonComplete}
          onRetry={handleRetryAssessment}
          onReturnToLesson={() => setPhase('slides')}
          darkMode={darkMode}
        />
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
    <div className={`flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>

      {/* ── Sticky slide-position bar ── */}
      <div className={`sticky top-0 z-10 h-[3px] ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div
          className="h-full bg-[#1e40af] transition-all duration-500 rounded-r-full"
          style={{ width: `${((currentSlideIndex + 1) / slides.length) * 100}%` }}
        />
      </div>

      {/* ── Slide content (full height, scrolls with page) ── */}
      <div ref={containerRef} className={`w-full overflow-x-hidden relative ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Engagement ring (top-right corner) */}
        {!isAlreadyCompleted && currentSlide && !isSlideComplete && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20">
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
          <div className="fixed top-2 right-2 sm:top-3 sm:right-3 z-50 group">
            <div className="w-11 h-11 rounded-full bg-[#021d49] flex items-center justify-center shadow-md hover:bg-[#032a66] transition-colors cursor-pointer" title="Slide completed">
              <Icons.Check className="w-5 h-5 text-white" strokeWidth={3} />
              {/* Tooltip */}
              <div className="absolute top-12 right-0 hidden group-hover:block bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-lg z-50">
                Slide completed ✓
              </div>
            </div>
          </div>
        )}
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

      {/* ── Bottom bar (sticky) ──────────────────────────────────────────────── */}
      <div className={`sticky bottom-0 z-10 flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3 border-t shadow-[0_-2px_8px_rgba(0,0,0,0.08)] ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>

        {/* Prev button */}
        <button
          onClick={() => { if (currentSlideIndex === 0) setPhase('intro'); else goPrev(); }}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl border transition-all flex-shrink-0
            ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          title="Previous slide"
        >
          <Icons.ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{currentSlideIndex === 0 ? 'Overview' : 'Prev'}</span>
        </button>

        {/* Dot indicators */}
        <div className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 overflow-x-auto py-1 px-1 sm:px-2">
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
                className={`flex-shrink-0 rounded-full transition-all duration-200 ${isActive ? 'w-6 h-2.5 bg-[#021d49]'
                  : isDone ? `w-2.5 h-2.5 hover:scale-125 ${darkMode ? 'bg-blue-400' : 'bg-[#1e40af]/60 hover:bg-[#021d49]'}`
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
        <div className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2">
          <span className={`text-xs font-medium tabular-nums ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {currentSlideIndex + 1}/{slides.length}
          </span>

          {/* Status hint for last slide when button might be disabled */}
          {isLastSlide && !nextButtonEnabled && !isSlideComplete && (
            <span className={`text-xs px-2 py-1 rounded-lg ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
              {currentSlide?.scrollTrackingEnabled && !scrolledToBottom ? 'Scroll to bottom' : 'Watch slide...'}
            </span>
          )}

          {/* Next button when not last slide */}
          {!isLastSlide && (
            <button
              onClick={goNext}
              disabled={!nextButtonEnabled}
              className={`flex items-center gap-1 sm:gap-2 text-sm px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all shadow-sm hover:shadow-md
                ${nextButtonEnabled
                  ? 'bg-[#021d49] hover:bg-[#032a66] active:bg-[#043080] text-white'
                  : darkMode
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
            >
              <span className="hidden sm:inline">Next</span>
              <Icons.ChevronRight className="w-4 h-4" />
            </button>
          )}
          {/* Last slide: Take Quiz (just needs current slide done or engagement met) OR Complete Lesson */}
          {isLastSlide && hasAssessment && (
            <button
              onClick={handleTakeQuiz}
              disabled={(!nextButtonEnabled && !isSlideComplete) || submitting}
              className={`flex items-center gap-1 sm:gap-2 text-sm px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all shadow-sm hover:shadow-md
                ${(nextButtonEnabled || isSlideComplete)
                  ? 'bg-[#021d49] hover:bg-[#032a66] active:bg-[#043080] text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              <Icons.HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Take Quiz</span>
            </button>
          )}
          {isLastSlide && !hasAssessment && (
            <button
              onClick={handleCompleteLesson}
              disabled={!nextButtonEnabled || submitting}
              className={`flex items-center gap-1 sm:gap-2 text-sm px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all shadow-sm hover:shadow-md
                ${nextButtonEnabled && !submitting
                  ? 'bg-[#021d49] hover:bg-[#032a66] active:bg-[#043080] text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              {submitting
                ? <><Icons.Loader2 className="w-4 h-4 animate-spin" /><span className="hidden sm:inline">Saving…</span></>
                : <><Icons.CheckCircle className="w-4 h-4" /><span className="hidden sm:inline">Complete Lesson</span></>
              }
            </button>
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
  const ca = question.answer || question.correctAnswer; // Backend uses 'answer', frontend fallback to 'correctAnswer'
  if (ca === undefined || ca === null || ca === '') return false;
  const options = resolveOptions(question);
  const idx = Number(ca);
  if (!isNaN(idx) && Number.isInteger(idx) && idx >= 0 && idx < options.length)
    return String(studentAnswer).trim().toLowerCase() === String(options[idx]).trim().toLowerCase();
  return String(studentAnswer).trim().toLowerCase() === String(ca).trim().toLowerCase();
}

// ── Question Card - REDESIGNED for bigger, cleaner look ──────────────────────
function QuestionCard({ question, index, selected, checked, onChange, onCheck, totalQuestions, darkMode = false }) {
  const isMultipleChoice = question.type === 'multiple-choice' || question.type === 'multiple_choice';
  const isTrueFalse = question.type === 'true-false';
  const isShortAnswer = question.type === 'short-answer' || question.type === 'essay';
  const isChecked = !!checked;
  const isCorrect = checked?.correct;

  const getCorrectOptionText = () => {
    const ca = question.answer || question.correctAnswer;
    const options = resolveOptions(question);
    const idx = Number(ca);
    if (!isNaN(idx) && Number.isInteger(idx) && idx >= 0 && idx < options.length) return options[idx];
    return ca ? String(ca) : '(not specified)';
  };

  return (
    <div className={`overflow-hidden transition-all rounded-2xl border-2 ${isChecked
        ? isCorrect
          ? 'border-green-300 bg-gradient-to-br from-green-50 to-white'
          : 'border-red-300 bg-gradient-to-br from-red-50 to-white'
        : darkMode
          ? 'border-gray-700 bg-gray-800'
          : 'border-gray-300 bg-white'
      }`}>
      {/* Question header - bigger, cleaner */}
      <div className={`px-6 py-5 ${isChecked
          ? isCorrect
            ? 'bg-gradient-to-r from-green-100 to-green-50'
            : 'bg-gradient-to-r from-red-100 to-red-50'
          : darkMode
            ? 'bg-gray-700'
            : 'bg-gray-50'
        }`}>
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 text-white ${isChecked
              ? isCorrect
                ? 'bg-gradient-to-br from-green-500 to-green-600'
                : 'bg-gradient-to-br from-red-500 to-red-600'
              : 'bg-gradient-to-br from-blue-500 to-blue-600'
            }`}>
            {isChecked ? (isCorrect ? '✓' : '✕') : index + 1}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <div></div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0 ${isChecked
                  ? isCorrect
                    ? 'bg-green-200 text-green-800'
                    : 'bg-red-200 text-red-800'
                  : darkMode
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                {isChecked ? (isCorrect ? 'Correct!' : 'Incorrect') : 'Question'}
              </span>
            </div>

            <p className={`text-lg font-bold leading-relaxed mt-3 ${darkMode && !isChecked ? 'text-white' : isChecked ? (isCorrect ? 'text-green-900' : 'text-red-900') : 'text-gray-900'
              }`}>
              {question.question}
            </p>

            {question.points && (
              <p className={`text-xs font-semibold mt-2 ${darkMode && !isChecked ? 'text-gray-400' : 'text-gray-500'
                }`}>
                {question.points} {question.points === 1 ? 'point' : 'points'}
              </p>
            )}
          </div>
        </div>

        {/* Code snippet if exists */}
        {question.codeSnippet && (
          <div className="mt-5 rounded-lg overflow-hidden border border-gray-700">
            <div className="px-3 py-2 bg-[#2d2d2d] flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
              <span className="text-xs text-gray-400 font-mono">{question.codeSnippet.language || 'code'}</span>
            </div>
            <pre className="bg-[#1e1e1e] text-green-400 text-xs p-4 overflow-x-auto font-mono leading-relaxed max-h-48 whitespace-pre-wrap break-words">
              {question.codeSnippet.code}
            </pre>
          </div>
        )}
      </div>

      {/* Options/Answer section - bigger, more spacious */}
      <div className={`px-6 py-6 ${darkMode && !isChecked ? 'bg-gray-800' : 'bg-white'}`}>
        {(isMultipleChoice || isTrueFalse) && (
          <div className={`${isTrueFalse ? 'grid grid-cols-2 gap-4' : 'space-y-3'}`}>
            {(isTrueFalse ? ['True', 'False'] : question.options || []).map((opt, oi) => {
              const isSelected = selected === opt;
              const correctText = isChecked ? getCorrectOptionText() : null;
              const isThisCorrect = correctText && String(opt).trim() === String(correctText).trim();
              const isThisWrong = isChecked && isSelected && !isCorrect;

              return (
                <label key={oi} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all font-medium text-base ${isChecked
                    ? isThisCorrect
                      ? 'border-green-400 bg-green-50 text-green-900'
                      : isThisWrong
                        ? 'border-red-400 bg-red-50 text-red-900'
                        : 'border-gray-200 bg-gray-50 text-gray-500 opacity-50'
                    : isSelected
                      ? 'border-blue-500 bg-blue-50 text-gray-900 shadow-md'
                      : darkMode
                        ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700 text-gray-200'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-800'
                  }`}>
                  <input
                    type="radio"
                    name={`q-${index}`}
                    value={opt}
                    checked={isSelected}
                    onChange={() => !isChecked && onChange(opt)}
                    disabled={isChecked}
                    className="w-5 h-5 accent-blue-600 flex-shrink-0 cursor-pointer"
                  />
                  <span className="flex-1">{opt}</span>
                  {isChecked && isThisCorrect && <Icons.CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />}
                  {isChecked && isThisWrong && <Icons.XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
                </label>
              );
            })}
          </div>
        )}

        {isShortAnswer && (
          <div className="space-y-3">
            <textarea
              value={selected || ''}
              onChange={(e) => !isChecked && onChange(e.target.value)}
              disabled={isChecked}
              placeholder="Type your answer here…"
              rows={4}
              className={`w-full rounded-xl p-4 text-base border-2 focus:outline-none resize-none transition-colors font-medium ${darkMode
                  ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500'
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500'
                }`}
            />
            {!isChecked && selected && (
              <button
                type="button"
                onClick={() => onCheck(selected)}
                className="w-full px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md"
              >
                Check Answer
              </button>
            )}
          </div>
        )}

        {/* Feedback section */}
        {isChecked && (
          <div className={`mt-6 rounded-xl p-5 border-2 ${isCorrect
              ? 'border-green-300 bg-green-50'
              : 'border-red-300 bg-red-50'
            }`}>
            <p className={`font-bold text-base mb-2 flex items-center gap-2 ${isCorrect ? 'text-green-800' : 'text-red-800'
              }`}>
              {isCorrect
                ? <><Icons.CheckCircle className="w-5 h-5" /> Perfect! Well done</>
                : <><Icons.XCircle className="w-5 h-5" /> Not quite right</>
              }
            </p>

            {!isCorrect && getCorrectOptionText() && (
              <p className={`text-sm mb-3 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                Correct answer: <span className="font-bold">{getCorrectOptionText()}</span>
              </p>
            )}

            {question.explanation && (
              <p className={`text-sm leading-relaxed ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                {question.explanation}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Assessment Result ──────────────────────────────────────────────────────────
function AssessmentResult({ result, questions, answers, onContinue, onRetry, passingScore, maxAttempts }) {
  const passed = result?.passed;
  const score = result?.score ?? 0;
  const remainingAttempts = result?.remainingAttempts ?? 0;
  const lessonResetRequired = result?.lessonResetRequired ?? false;

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
        <p className="text-sm text-gray-600 mb-4">
          Pass mark: <span className="font-semibold">{passingScore}%</span>
        </p>
        {!passed && remainingAttempts > 0 && (
          <p className="text-sm text-blue-700 bg-blue-50 rounded-lg px-4 py-2 inline-block mb-4 border border-blue-200">
            {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
          </p>
        )}
        {lessonResetRequired && (
          <div className="text-sm text-red-700 bg-red-100 border border-red-200 rounded-xl p-4 mt-2 text-left">
            <p className="font-semibold mb-1 flex items-center gap-1.5"><Icons.AlertTriangle className="w-4 h-4" /> All attempts used</p>
            <p>Please re-read this lesson to unlock new attempts.</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 justify-center mt-6">
          {passed && (
            <button
              onClick={onContinue}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition-all shadow-md"
            >
              Continue to Next Lesson <Icons.ChevronRight className="w-4 h-4" />
            </button>
          )}
          {!passed && !lessonResetRequired && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md"
            >
              <Icons.RotateCcw className="w-4 h-4" /> Try Again
            </button>
          )}
          {lessonResetRequired && (
            <button
              onClick={() => window.scrollTo(0, 0)}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold transition-all shadow-md"
            >
              <Icons.ChevronUp className="w-4 h-4" /> Return to Lesson
            </button>
          )}
        </div>
      </div>

      {questions.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Answer Review</p>
          {questions.map((q, i) => {
            const studentAnswer = answers?.[i] || '';
            const isCorrect = evaluateAnswer(q, studentAnswer);
            const options = resolveOptions(q);
            const ca = q.answer || q.correctAnswer; // Backend uses 'answer', frontend fallback to 'correctAnswer'
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
