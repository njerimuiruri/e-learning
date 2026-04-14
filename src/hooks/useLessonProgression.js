import { useState, useCallback, useEffect, useRef } from "react";
import lessonProgressionService from "@/lib/api/lessonProgressionService";
import {
  canAccessLesson,
  isLessonCompleted,
  shouldAutoCompleteLessonOnLastSlide,
  getLessonCompletionInfo,
  validateQuizAnswers,
} from "@/lib/utils/lessonProgressionLogic";

/**
 * useLessonProgression
 * Manages lesson progression logic: access control, quiz submission, completion tracking
 */
export const useLessonProgression = (
  lessonIndex,
  lesson,
  module,
  enrollment,
  onProgressUpdate,
) => {
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check access on mount
  useEffect(() => {
    if (!lesson || !enrollment) {
      setIsInitialized(true);
      return;
    }

    const checkAccess = async () => {
      try {
        const canAccess = canAccessLesson(lessonIndex, enrollment, module);
        if (!canAccess && lessonIndex > 0) {
          setError(
            `You cannot skip lessons. Complete Lesson ${lessonIndex} first.`,
          );
        }
        setIsInitialized(true);
      } catch (err) {
        console.error("Error checking lesson access:", err);
        setIsInitialized(true);
      }
    };

    checkAccess();
  }, [lessonIndex, lesson, enrollment, module]);

  /**
   * Auto-complete lesson if it has no quiz and all slides are viewed
   */
  const handleAutoCompleteLesson = useCallback(async () => {
    if (!lesson || !enrollment) return;

    const hasQuiz = (lesson.assessmentQuiz || []).length > 0;
    if (hasQuiz) return; // Has quiz, manual completion

    try {
      await lessonProgressionService.completeLessonWithoutQuiz(
        enrollment._id,
        lessonIndex,
      );

      onProgressUpdate?.({
        type: "lesson-completed",
        lessonIndex,
        passed: true,
        score: 100,
      });
    } catch (err) {
      console.error("Error auto-completing lesson:", err);
      setError("Failed to mark lesson as complete");
    }
  }, [lesson, enrollment, lessonIndex, onProgressUpdate]);

  /**
   * Submit quiz answers and get evaluation
   */
  const submitQuiz = useCallback(
    async (answers, moduleId) => {
      if (!enrollment || !module || !lesson) {
        setError("Missing enrollment or module data");
        return;
      }

      try {
        // Validate answers
        const quiz = lesson.assessmentQuiz || [];
        const validation = validateQuizAnswers(answers, quiz);
        if (!validation.valid) {
          setError(validation.error);
          return;
        }

        setIsSubmittingQuiz(true);
        setError(null);

        // Submit to backend
        const response = await lessonProgressionService.submitQuiz(
          enrollment._id,
          lessonIndex,
          answers,
          moduleId,
        );

        // Extract evaluation from response
        const evaluation = response.evaluation;
        const passed = evaluation.passed;
        const score = evaluation.percentage;
        const retriesRemaining = response.retriesRemaining;

        // Determine if lesson reset required
        const completion = getLessonCompletionInfo(
          enrollment,
          lessonIndex,
          lesson,
        );
        const maxAttempts = lesson?.quizMaxAttempts ?? 3;
        const lessonResetRequired =
          !passed && completion.attempts >= maxAttempts;

        // Format result for modal
        const formattedResult = {
          passed,
          score,
          percentage: score,
          breakdown: {
            correct: evaluation.questionsCorrect,
            incorrect: evaluation.questionsTotal - evaluation.questionsCorrect,
            total: evaluation.questionsTotal,
          },
          remainingAttempts: retriesRemaining,
          lessonResetRequired,
          details: evaluation,
        };

        setQuizResult(formattedResult);
        setShowResultsModal(true);

        // Call progress callback
        onProgressUpdate?.({
          type: "quiz-submitted",
          lessonIndex,
          passed,
          score,
          attempts: completion.attempts + 1,
          lessonResetRequired,
        });

        return formattedResult;
      } catch (err) {
        console.error("Error submitting quiz:", err);
        const errorMessage =
          err.response?.data?.message ||
          "Failed to submit quiz. Please try again.";
        setError(errorMessage);
        return null;
      } finally {
        setIsSubmittingQuiz(false);
      }
    },
    [enrollment, module, lesson, lessonIndex, onProgressUpdate],
  );

  /**
   * Handle quiz result and navigate
   */
  const handleQuizResult = useCallback(
    (result) => {
      if (result.passed) {
        // Lesson now completed, can move to next
        onProgressUpdate?.({
          type: "lesson-unlocked",
          lessonIndex: lessonIndex + 1,
        });
      } else if (result.lessonResetRequired) {
        // All attempts used, need to restart lesson
        onProgressUpdate?.({
          type: "lesson-reset-required",
          lessonIndex,
        });
      }
    },
    [lessonIndex, onProgressUpdate],
  );

  /**
   * Get lesson status
   */
  const getLessonStatus = useCallback(() => {
    if (!enrollment || !lesson) {
      return {
        canAccess: false,
        isCompleted: false,
        hasQuiz: false,
        attempts: 0,
        score: 0,
        error: "Missing data",
      };
    }

    const canAccess = canAccessLesson(lessonIndex, enrollment, module);
    const isCompleted = isLessonCompleted(enrollment, lessonIndex);
    const hasQuiz = (lesson.assessmentQuiz || []).length > 0;
    const completion = getLessonCompletionInfo(enrollment, lessonIndex, lesson);

    return {
      canAccess,
      isCompleted,
      hasQuiz,
      attempts: completion.attempts,
      maxAttempts: completion.maxAttempts,
      score: completion.score,
      passed: completion.passed,
      canRetry: completion.canRetry,
      error: null,
    };
  }, [enrollment, lesson, lessonIndex, module]);

  /**
   * Retry quiz (reset for next attempt)
   */
  const retryQuiz = useCallback(() => {
    setQuizResult(null);
    setShowResultsModal(false);
    setError(null);
    // Signal UI to reset quiz state
    onProgressUpdate?.({
      type: "quiz-reset",
      lessonIndex,
    });
  }, [lessonIndex, onProgressUpdate]);

  /**
   * Reset lesson completely (called by admin or system when max attempts exceeded)
   */
  const resetLessonCompletely = useCallback(async () => {
    if (!enrollment) return;

    try {
      await lessonProgressionService.resetLessonProgress(
        enrollment._id,
        lessonIndex,
      );
      setQuizResult(null);
      setShowResultsModal(false);
      setError(null);
      onProgressUpdate?.({
        type: "lesson-reset-complete",
        lessonIndex,
      });
    } catch (err) {
      console.error("Error resetting lesson:", err);
      setError("Failed to reset lesson progress");
    }
  }, [enrollment, lessonIndex, onProgressUpdate]);

  return {
    // State
    isSubmittingQuiz,
    quizResult,
    showResultsModal,
    error,
    isInitialized,

    // Methods
    submitQuiz,
    handleQuizResult,
    retryQuiz,
    resetLessonCompletely,
    handleAutoCompleteLesson,
    getLessonStatus,
    setShowResultsModal,
    setError,
  };
};
