'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import moduleEnrollmentService from '@/lib/api/moduleEnrollmentService';

/**
 * useEnrollmentProgress — single source of truth for lesson progression state.
 *
 * Fetches progress from the server on mount and after any mutation.
 * NEVER derives completion state from local React state — only from the DB response.
 *
 * Shape returned by the server (GET /module-enrollments/:id/progress):
 * {
 *   enrollmentId, moduleId,
 *   totalLessons, completedLessons, progress (0-100),
 *   lessonStates: [{ lessonIndex, title, isCompleted, isAccessible, isLocked,
 *                    completedAt, hasQuiz, assessmentPassed, assessmentAttempts }],
 *   nextLessonIndex,        // lowest-index incomplete & accessible lesson, or null
 *   allLessonsCompleted,
 *   requiresModuleRepeat,
 *   finalAssessmentPassed, finalAssessmentAttempts,
 *   isCompleted, certificateEarned, certificatePublicId,
 * }
 */
export function useEnrollmentProgress(enrollmentId) {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Prevent state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetch = useCallback(async () => {
    if (!enrollmentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await moduleEnrollmentService.getProgress(enrollmentId);
      if (mountedRef.current) {
        setProgress(data);
        console.log(
          '[useEnrollmentProgress] Progress fetched from backend | enrollmentId=', enrollmentId,
          '| currentLessonIndex=', data?.currentLessonIndex,
          '| currentSlideIndex=', data?.currentSlideIndex,
          '| nextLessonIndex=', data?.nextLessonIndex,
          '| completedLessons=', data?.completedLessons, '/', data?.totalLessons,
          '| lessonStates=', (data?.lessonStates || []).map(ls => ({
            idx: ls.lessonIndex,
            completed: ls.isCompleted,
            accessible: ls.isAccessible,
            slide: ls.lastAccessedSlide,
            quizPassed: ls.assessmentPassed,
            hasAnswers: !!(ls.lastAnswers && Object.keys(ls.lastAnswers).length),
          })),
        );
      }
    } catch (err) {
      if (mountedRef.current) setError(err?.response?.data?.message ?? 'Failed to load progress');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [enrollmentId]);

  // Fetch on mount and whenever enrollmentId changes
  useEffect(() => {
    fetch();
  }, [fetch]);

  // Derived helpers — all computed from server state, never from local mutations
  const isCompleted = useCallback(
    (lessonIndex) => progress?.lessonStates?.[lessonIndex]?.isCompleted ?? false,
    [progress],
  );

  const isAccessible = useCallback(
    (lessonIndex) => progress?.lessonStates?.[lessonIndex]?.isAccessible ?? (lessonIndex === 0),
    [progress],
  );

  const isLocked = useCallback(
    (lessonIndex) => progress?.lessonStates?.[lessonIndex]?.isLocked ?? (lessonIndex > 0),
    [progress],
  );

  return {
    progress,           // full server response
    loading,
    error,
    refresh: fetch,     // call after any mutation to re-sync from DB

    // Convenience accessors
    isCompleted,
    isAccessible,
    isLocked,

    // Top-level shorthands
    completedLessons: progress?.completedLessons ?? 0,
    totalLessons: progress?.totalLessons ?? 0,
    progressPct: progress?.progress ?? 0,
    nextLessonIndex: progress?.nextLessonIndex ?? 0,
    allLessonsCompleted: progress?.allLessonsCompleted ?? false,
    requiresModuleRepeat: progress?.requiresModuleRepeat ?? false,
    // true = instructor has finished adding all lessons; Final Assessment can unlock
    isContentFinalized: progress?.isContentFinalized ?? false,
  };
}
