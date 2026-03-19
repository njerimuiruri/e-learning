'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import SlideRenderer from './SlideRenderer';
import { useEngagementTracker } from '@/hooks/useEngagementTracker';
import moduleEnrollmentService from '@/lib/api/moduleEnrollmentService';

/**
 * LessonViewer — slide-show style lesson experience.
 *
 * Phase flow:  intro → slides → assessment (if any)
 *
 * - intro:      Shows lesson title, rendered description, learning outcomes.
 * - slides:     One slide at a time with prev/next navigation + engagement tracking.
 * - assessment: Per-question immediate feedback, then overall result.
 */
export default function LessonViewer({
  lesson,
  lessonIndex,
  totalLessons,
  enrollment,
  onLessonComplete,
  onAssessmentComplete,
  isAlreadyCompleted = false,
}) {
  const slides = (lesson?.slides || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const hasAssessment = (lesson?.assessmentQuiz || []).length > 0;

  // phase: 'intro' | 'slides' | 'assessment'
  const [phase, setPhase] = useState(isAlreadyCompleted ? 'slides' : 'intro');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [completedSlides, setCompletedSlides] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);

  // Assessment state
  const [answers, setAnswers] = useState({});
  const [checkedAnswers, setCheckedAnswers] = useState({});
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [assessmentError, setAssessmentError] = useState('');

  const currentSlide = slides[currentSlideIndex] || null;
  const allSlidesCompleted = slides.length === 0 || completedSlides.size >= slides.length;

  const {
    containerRef,
    timeSpent,
    canProceed,
    remainingTime,
    progressPercent,
    resetTracker,
    meetsTimeReq,
    scrolledToBottom,
  } = useEngagementTracker({
    minViewingTime: currentSlide?.minViewingTime ?? 15,
    scrollTrackingEnabled: currentSlide?.scrollTrackingEnabled ?? false,
    onSlideComplete: useCallback(
      ({ timeSpent: t, scrolledToBottom: s }) => {
        handleSlideComplete(currentSlideIndex, t, s);
      },
      [currentSlideIndex], // eslint-disable-line react-hooks/exhaustive-deps
    ),
  });

  // Mark visited slides complete on mount for already-completed lessons
  useEffect(() => {
    if (isAlreadyCompleted && slides.length > 0) {
      setCompletedSlides(new Set(slides.map((_, i) => i)));
    }
  }, [isAlreadyCompleted, slides.length]);

  // Sync from enrollment slide progress
  useEffect(() => {
    if (!enrollment) return;
    const lp = enrollment.lessonProgress?.find((l) => l.lessonIndex === lessonIndex);
    if (!lp?.slideProgress) return;
    const done = new Set(lp.slideProgress.filter((sp) => sp.isCompleted).map((sp) => sp.slideIndex));
    setCompletedSlides(done);
  }, [enrollment, lessonIndex]);

  // Reset engagement tracker when navigating to a different slide.
  // Skip the initial mount — calling resetTracker() on mount would kill the
  // timer before it ever starts counting for the first slide.
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    resetTracker();
  }, [currentSlideIndex, resetTracker]);

  // ── Server slide progress tracking ────────────────────────────────────────
  const serverReportTimeout = useRef(null);

  const reportSlideProgressToServer = useCallback(
    (slideIndex, time, scrolled) => {
      if (!enrollment?._id) return;
      clearTimeout(serverReportTimeout.current);
      serverReportTimeout.current = setTimeout(async () => {
        try {
          await moduleEnrollmentService.trackSlideProgress(
            enrollment._id,
            lessonIndex,
            slideIndex,
            time,
            scrolled,
          );
        } catch (_) {}
      }, 500);
    },
    [enrollment?._id, lessonIndex],
  );

  const handleSlideComplete = useCallback(
    (slideIndex, time, scrolled) => {
      setCompletedSlides((prev) => {
        const next = new Set(prev);
        next.add(slideIndex);
        return next;
      });
      reportSlideProgressToServer(slideIndex, time, scrolled);
    },
    [reportSlideProgressToServer],
  );

  // Periodic progress updates
  useEffect(() => {
    if (!currentSlide || isAlreadyCompleted) return;
    const interval = setInterval(() => {
      if (timeSpent > 0) reportSlideProgressToServer(currentSlideIndex, 5, scrolledToBottom);
    }, 5000);
    return () => clearInterval(interval);
  }, [currentSlideIndex, timeSpent, scrolledToBottom, currentSlide, isAlreadyCompleted, reportSlideProgressToServer]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const goNext = () => {
    if (currentSlideIndex < slides.length - 1) setCurrentSlideIndex((i) => i + 1);
  };
  const goPrev = () => {
    if (currentSlideIndex > 0) setCurrentSlideIndex((i) => i - 1);
  };

  // ── Complete lesson (no assessment) ──────────────────────────────────────
  const handleCompleteLesson = async () => {
    if (!enrollment?._id) return;
    setSubmitting(true);
    try {
      await moduleEnrollmentService.completeLesson(enrollment._id, lessonIndex);
      onLessonComplete?.();
    } catch (err) {
      console.error('Failed to complete lesson:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Assessment submission ─────────────────────────────────────────────────
  const submitAssessment = async () => {
    if (!enrollment?._id) return;
    const questions = lesson?.assessmentQuiz || [];
    const formattedAnswers = questions.map((_, i) => ({
      questionIndex: Number(i),
      answer: String(answers[i] ?? ''),
    }));
    setSubmitting(true);
    setAssessmentError('');
    try {
      const res = await moduleEnrollmentService.submitLessonAssessment(
        enrollment._id,
        lessonIndex,
        formattedAnswers,
      );
      setAssessmentResult(res);
      onAssessmentComplete?.(res);
    } catch (err) {
      setAssessmentError(err?.response?.data?.message || 'Failed to submit assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Empty lesson guard ────────────────────────────────────────────────────
  if (slides.length === 0 && !hasAssessment) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <p>This lesson has no content yet.</p>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE: INTRO SLIDE
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'intro') {
    const outcomes = lesson?.learningOutcomes || [];
    return (
      <div className="flex flex-col h-full">
        {/* Breadcrumb */}
        <div className="flex-shrink-0 flex items-center justify-between mb-4 px-1">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Lesson {lessonIndex + 1} of {totalLessons}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-xs text-gray-400">Overview</span>
          </div>
        </div>

        {/* Intro card (scrollable) */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Blue top accent */}
          <div className="h-1.5 bg-gradient-to-r from-[#021d49] via-blue-600 to-indigo-500 rounded-t-2xl" />

          <div className="p-8 md:p-10 space-y-8">
            {/* Lesson title */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Lesson Overview</p>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
                {lesson?.title}
              </h2>
            </div>

            {/* Description — rendered as HTML */}
            {lesson?.description && (
              <div
                className="prose prose-gray max-w-none text-gray-700 leading-relaxed
                  prose-p:text-gray-700 prose-p:leading-relaxed
                  prose-strong:text-gray-900"
                dangerouslySetInnerHTML={{ __html: lesson.description }}
              />
            )}

            {/* Divider */}
            {outcomes.length > 0 && (
              <hr className="border-gray-100" />
            )}

            {/* Learning outcomes */}
            {outcomes.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  What you will learn
                </p>
                <ul className="space-y-3">
                  {outcomes.map((outcome, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-0.5 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="text-gray-700 leading-snug">{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Lesson meta */}
            {slides.length > 0 && (
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>{slides.length} slide{slides.length !== 1 ? 's' : ''}</span>
                </div>
                {hasAssessment && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Assessment included</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Start button */}
        <div className="flex-shrink-0 mt-4 flex justify-end">
          <button
            onClick={() => setPhase('slides')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#021d49] to-blue-600 text-white font-semibold rounded-xl hover:from-[#032e6b] hover:to-blue-700 transition-all shadow-md"
          >
            Start Lesson
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE: ASSESSMENT
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'assessment') {
    const questions = lesson?.assessmentQuiz || [];
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between mb-4 px-1">
          <button
            onClick={() => setPhase('slides')}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to slides
          </button>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            Lesson Assessment
          </span>
        </div>

        <div className="flex-1 overflow-y-auto rounded-2xl border border-indigo-200 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-400 rounded-t-2xl" />
          <div className="p-6 md:p-8">
            {/* Score info */}
            <div className="flex flex-wrap gap-3 mb-6 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-indigo-50 rounded-lg px-3 py-2">
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pass score: <strong>{lesson?.quizPassingScore || 70}%</strong>
              </div>
              {lesson?.quizMaxAttempts && (
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Max attempts: <strong>{lesson.quizMaxAttempts}</strong>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {questions.length} question{questions.length !== 1 ? 's' : ''}
              </div>
            </div>

            {assessmentResult ? (
              <AssessmentResult
                result={assessmentResult}
                questions={questions}
                answers={answers}
                onContinue={onLessonComplete}
              />
            ) : (
              <div className="space-y-6">
                {questions.map((q, i) => (
                  <QuestionCard
                    key={i}
                    question={q}
                    index={i}
                    selected={answers[i]}
                    checked={checkedAnswers[i]}
                    onChange={(val) => {
                      setAnswers((prev) => ({ ...prev, [i]: val }));
                      const type = q.type;
                      if (type === 'multiple-choice' || type === 'multiple_choice' || type === 'true-false') {
                        const correct = evaluateAnswer(q, val);
                        setCheckedAnswers((prev) => ({ ...prev, [i]: { correct, answer: val } }));
                      }
                    }}
                    onCheck={(val) => {
                      const correct = evaluateAnswer(q, val);
                      setCheckedAnswers((prev) => ({ ...prev, [i]: { correct, answer: val } }));
                    }}
                  />
                ))}

                {assessmentError && (
                  <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                    {assessmentError}
                  </p>
                )}

                <button
                  onClick={submitAssessment}
                  disabled={submitting || questions.some((_, i) => !answers[i])}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  {submitting ? 'Submitting…' : 'Submit Assessment'}
                </button>
              </div>
            )}
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

  return (
    <div className="flex flex-col h-full">
      {/* ── Top navigation bar ───────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between mb-4 px-1">
        {/* Back to intro */}
        <button
          onClick={() => setPhase('intro')}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Overview
        </button>

        {/* Slide dot indicators */}
        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => (isAlreadyCompleted || completedSlides.has(i) || i <= currentSlideIndex) && setCurrentSlideIndex(i)}
              className={`rounded-full transition-all duration-200 ${
                i === currentSlideIndex
                  ? 'w-5 h-2.5 bg-blue-600'
                  : completedSlides.has(i)
                  ? 'w-2.5 h-2.5 bg-green-400'
                  : 'w-2.5 h-2.5 bg-gray-200'
              }`}
            />
          ))}
          {hasAssessment && (
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-200 ml-1" title="Assessment" />
          )}
        </div>

        {/* Slide counter */}
        <span className="text-xs font-semibold text-gray-400">
          {currentSlideIndex + 1} / {slides.length}
        </span>
      </div>

      {/* ── Slide content (scrollable) ────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto min-h-0"
      >
        {currentSlide ? (
          <SlideRenderer
            slide={currentSlide}
            slideNumber={currentSlideIndex + 1}
            totalSlides={slides.length}
            sectionTitle={lesson?.slidesTitle || ''}
          />
        ) : (
          <div className="text-gray-400 text-sm text-center py-8">No slide content</div>
        )}
      </div>

      {/* ── Engagement status ─────────────────────────────────────────────── */}
      {!isAlreadyCompleted && currentSlide && !isSlideComplete && (
        <div className="flex-shrink-0 mt-3">
          <EngagementBar
            meetsTimeReq={meetsTimeReq}
            scrolledToBottom={currentSlide.scrollTrackingEnabled ? scrolledToBottom : null}
            remainingTime={remainingTime}
            progressPercent={progressPercent}

            scrollTrackingEnabled={currentSlide.scrollTrackingEnabled}
          />
        </div>
      )}

      {/* ── Bottom navigation ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 mt-4 flex items-center justify-between gap-3">
        <button
          onClick={goPrev}
          disabled={currentSlideIndex === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>

        {isLastSlide ? (
          allSlidesCompleted ? (
            hasAssessment ? (
              <button
                onClick={() => setPhase('assessment')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm"
              >
                Take Assessment
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleCompleteLesson}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-semibold hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 transition-all shadow-sm"
              >
                {submitting ? 'Saving…' : 'Complete Lesson'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )
          ) : (
            <button
              disabled={!nextButtonEnabled}
              onClick={goNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#021d49] to-blue-600 text-white text-sm font-semibold hover:from-[#032e6b] hover:to-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )
        ) : (
          <button
            onClick={goNext}
            disabled={!nextButtonEnabled}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#021d49] to-blue-600 text-white text-sm font-semibold hover:from-[#032e6b] hover:to-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EngagementBar({ meetsTimeReq, scrolledToBottom, remainingTime, progressPercent, scrollTrackingEnabled }) {
  return (
    <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-amber-700">Please read this slide carefully</span>
        <span className="text-xs text-amber-600">
          {meetsTimeReq
            ? <span className="text-green-600 font-semibold">✓ Time requirement met</span>
            : `${remainingTime}s remaining`}
        </span>
      </div>
      <div className="w-full h-1.5 bg-amber-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${meetsTimeReq ? 'bg-green-500' : 'bg-amber-500'}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      {scrollTrackingEnabled && (
        <p className={`text-xs mt-2 ${scrolledToBottom ? 'text-green-600' : 'text-amber-600'}`}>
          {scrolledToBottom ? '✓ Scrolled to bottom' : '↓ Scroll to the bottom to continue'}
        </p>
      )}
    </div>
  );
}

// ── Answer evaluation ─────────────────────────────────────────────────────────

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
  if (!isNaN(idx) && Number.isInteger(idx) && idx >= 0 && idx < options.length) {
    return String(studentAnswer).trim().toLowerCase() === String(options[idx]).trim().toLowerCase();
  }
  return String(studentAnswer).trim().toLowerCase() === String(ca).trim().toLowerCase();
}

// ── Question Card ─────────────────────────────────────────────────────────────

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
    <div className={`rounded-xl border-2 p-5 shadow-sm transition-all ${
      isChecked
        ? isCorrect ? 'border-green-300 bg-green-50' : 'border-red-200 bg-red-50'
        : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-start gap-3 mb-4">
        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white ${
          isChecked ? (isCorrect ? 'bg-green-500' : 'bg-red-500') : 'bg-indigo-600'
        }`}>
          {isChecked ? (isCorrect ? '✓' : '✗') : index + 1}
        </span>
        <div className="flex-1">
          {question.codeSnippet && (
            <div className="mb-3 rounded-lg overflow-hidden border border-gray-700">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#2d2d2d]">
                <span className="text-xs text-gray-300 font-semibold font-mono">{question.codeSnippet.language || 'python'}</span>
              </div>
              <pre className="bg-[#1e1e1e] text-green-300 text-xs p-3 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">{question.codeSnippet.code}</pre>
            </div>
          )}
          <p className="font-semibold text-gray-900 leading-snug">{question.question}</p>
          {question.points && (
            <span className="text-xs text-gray-400 mt-0.5 inline-block">{question.points} point{question.points !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {(isMultipleChoice || isTrueFalse) && (
        <div className={`ml-10 ${isTrueFalse ? 'flex gap-3' : 'space-y-2'}`}>
          {(isTrueFalse ? ['True', 'False'] : question.options || []).map((opt, oi) => {
            const isSelected = selected === opt;
            const correctText = isChecked ? getCorrectOptionText() : null;
            const isThisCorrect = correctText && String(opt).trim() === String(correctText).trim();
            const isThisWrong = isChecked && isSelected && !isCorrect;
            return (
              <label
                key={oi}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${isTrueFalse ? 'flex-1 justify-center' : ''} ${
                  isChecked
                    ? isThisCorrect ? 'border-green-400 bg-green-100 text-green-900'
                      : isThisWrong ? 'border-red-400 bg-red-100 text-red-900'
                      : 'border-gray-200 bg-white text-gray-400 opacity-60'
                    : isSelected ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-800'
                }`}
              >
                <input
                  type="radio"
                  name={`q-${index}`}
                  value={opt}
                  checked={isSelected}
                  onChange={() => !isChecked && onChange(opt)}
                  disabled={isChecked}
                  className="accent-indigo-600 flex-shrink-0"
                />
                <span className="text-sm flex-1">{opt}</span>
                {isChecked && isThisCorrect && <span className="text-green-600 text-xs font-bold flex-shrink-0">✓</span>}
                {isChecked && isThisWrong && <span className="text-red-500 text-xs font-bold flex-shrink-0">✗</span>}
              </label>
            );
          })}
        </div>
      )}

      {isShortAnswer && (
        <div className="ml-10 space-y-2">
          <textarea
            value={selected || ''}
            onChange={(e) => !isChecked && onChange(e.target.value)}
            disabled={isChecked}
            placeholder="Type your answer here…"
            rows={3}
            className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:bg-gray-50 disabled:text-gray-500"
          />
          {!isChecked && selected && (
            <button
              type="button"
              onClick={() => onCheck(selected)}
              className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
            >
              Check Answer
            </button>
          )}
        </div>
      )}

      {isChecked && (
        <div className={`mt-4 ml-10 rounded-lg p-3 border ${
          isCorrect ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'
        }`}>
          <p className={`text-sm font-bold mb-1 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
            {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
          </p>
          {question.explanation && (
            <p className="text-sm text-gray-700 leading-relaxed">{question.explanation}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Assessment Result ─────────────────────────────────────────────────────────

function AssessmentResult({ result, questions, answers, onContinue }) {
  const passed = result?.passed;
  const score = result?.score ?? 0;

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl p-6 text-center border-2 ${passed ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-3 ${passed ? 'bg-green-200' : 'bg-red-200'}`}>
          {passed ? '🎉' : '😔'}
        </div>
        <h3 className={`text-2xl font-bold mb-1 ${passed ? 'text-green-700' : 'text-red-600'}`}>
          {passed ? 'Passed!' : 'Not quite yet'}
        </h3>
        <p className="text-gray-700">
          Score: <span className={`font-bold text-xl ${passed ? 'text-green-700' : 'text-red-600'}`}>{score}%</span>
        </p>
        {result?.remainingAttempts !== undefined && !passed && (
          <p className="text-sm text-gray-500 mt-2">Remaining attempts: {result.remainingAttempts}</p>
        )}
        {result?.lessonResetRequired && (
          <p className="text-sm text-red-600 bg-red-100 border border-red-200 rounded-lg p-3 mt-3">
            All attempts used. Please re-read this lesson to unlock new attempts.
          </p>
        )}
        {passed && (
          <button
            onClick={onContinue}
            className="mt-4 px-6 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
          >
            Continue →
          </button>
        )}
      </div>

      {questions.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Answer Review</p>
          {questions.map((q, i) => {
            const studentAnswer = answers?.[i] || '';
            const isCorrect = evaluateAnswer(q, studentAnswer);
            const ca = q.correctAnswer;
            const options = resolveOptions(q);
            const idx = Number(ca);
            const correctText = (!isNaN(idx) && Number.isInteger(idx) && idx >= 0 && idx < options.length) ? options[idx] : String(ca || '');
            return (
              <div key={i} className={`rounded-xl border p-4 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-start gap-3 mb-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                    {isCorrect ? '✓' : '✗'}
                  </span>
                  <p className="text-sm font-semibold text-gray-900 flex-1">{q.question}</p>
                </div>
                <div className="ml-9 space-y-1">
                  <p className="text-xs text-gray-600">
                    Your answer: <span className={`font-semibold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{studentAnswer || '(no answer)'}</span>
                  </p>
                  {!isCorrect && correctText && (
                    <p className="text-xs text-gray-600">
                      Correct answer: <span className="font-semibold text-green-700">{correctText}</span>
                    </p>
                  )}
                  {q.explanation && (
                    <p className="text-xs text-gray-600 mt-1.5 bg-white rounded-lg p-2 border border-gray-200">{q.explanation}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
