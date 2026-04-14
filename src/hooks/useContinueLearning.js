import { useState, useCallback } from "react";
import lessonProgressionService from "@/lib/api/lessonProgressionService";
import {
  getNextIncompleteLesson,
  getModuleProgressPercentage,
  getAllLessonsStatus,
} from "@/lib/utils/lessonProgressionLogic";

/**
 * useContinueLearning
 * Manages "Continue Learning" functionality
 * Always takes to next incomplete, accessible lesson
 */
export const useContinueLearning = (enrollment, module) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get the next lesson to continue with
   */
  const getNextLesson = useCallback(() => {
    try {
      if (!enrollment || !module?.lessons) {
        return {
          lessonIndex: 0,
          reason: "Start from beginning",
        };
      }

      const nextIndex = getNextIncompleteLesson(enrollment, module);
      const totalLessons = module.lessons.length;

      if (nextIndex === null || nextIndex >= totalLessons - 1) {
        return {
          lessonIndex: totalLessons - 1,
          reason: "All lessons completed",
          allCompleted: true,
        };
      }

      return {
        lessonIndex: nextIndex,
        reason: `Continue with Lesson ${nextIndex + 1}`,
        allCompleted: false,
      };
    } catch (err) {
      console.error("Error getting next lesson:", err);
      return {
        lessonIndex: 0,
        reason: "Error getting lesson",
        error: err.message,
      };
    }
  }, [enrollment, module]);

  /**
   * Navigate to the next lesson
   */
  const navigateToNextLesson = useCallback(
    async (onNavigate) => {
      const nextLesson = getNextLesson();

      if (nextLesson.error) {
        setError(nextLesson.error);
        return null;
      }

      onNavigate?.(nextLesson.lessonIndex);
      return nextLesson;
    },
    [getNextLesson],
  );

  /**
   * Get progress summary
   */
  const getProgressSummary = useCallback(() => {
    if (!enrollment || !module) {
      return {
        completedLessons: 0,
        totalLessons: 0,
        progressPercentage: 0,
        allCompleted: false,
      };
    }

    const totalLessons = module.lessons?.length || 0;
    const progressPercentage = getModuleProgressPercentage(enrollment, module);
    const lessonsStatus = getAllLessonsStatus(enrollment, module);
    const completedLessons = lessonsStatus.filter(
      (ls) => ls.isCompleted,
    ).length;

    return {
      completedLessons,
      totalLessons,
      progressPercentage,
      allCompleted: completedLessons === totalLessons,
      lessons: lessonsStatus,
    };
  }, [enrollment, module]);

  /**
   * Get server-side next lesson (for API call)
   */
  const getServerNextLesson = useCallback(
    async (enrollmentId, totalLessons) => {
      try {
        setLoading(true);
        setError(null);

        const response = await lessonProgressionService.getNextIncompleteLesson(
          enrollmentId,
          totalLessons,
        );

        return response;
      } catch (err) {
        console.error("Error fetching next lesson from server:", err);
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    getNextLesson,
    navigateToNextLesson,
    getProgressSummary,
    getServerNextLesson,
    loading,
    error,
  };
};
