/**
 * Lesson Progression Logic Utilities
 * Handles sequential lesson access, completion tracking, and quiz evaluation
 */

/**
 * Check if a student can access a specific lesson
 * Rules:
 * - Lesson 0 (first lesson) is always accessible
 * - Subsequent lessons require previous lesson completion
 */
export const canAccessLesson = (lessonIndex, enrollment, module) => {
  if (!enrollment || !module) return false;

  // First lesson is always accessible
  if (lessonIndex === 0) return true;

  // Check if previous lesson is completed
  const previousLessonIndex = lessonIndex - 1;
  return isLessonCompleted(enrollment, previousLessonIndex);
};

/**
 * Check if a lesson is marked as completed
 */
export const isLessonCompleted = (enrollment, lessonIndex) => {
  if (!enrollment?.lessonProgress) return false;
  const lessonProgress = enrollment.lessonProgress.find(
    (lp) => lp.lessonIndex === lessonIndex,
  );
  return lessonProgress?.isCompleted ?? false;
};

/**
 * Get lesson lock status and reason
 */
export const getLessonLockStatus = (lessonIndex, enrollment, module) => {
  if (canAccessLesson(lessonIndex, enrollment, module)) {
    return {
      isLocked: false,
      reason: null,
    };
  }

  if (lessonIndex === 0) {
    return {
      isLocked: false,
      reason: null,
    };
  }

  return {
    isLocked: true,
    reason: `Complete Lesson ${lessonIndex} to unlock this lesson`,
  };
};

/**
 * Get lesson completion info
 */
export const getLessonCompletionInfo = (enrollment, lessonIndex, lesson) => {
  const lessonProgress = enrollment?.lessonProgress?.find(
    (lp) => lp.lessonIndex === lessonIndex,
  );

  const hasQuiz = (lesson?.assessmentQuiz || []).length > 0;
  const attempts = lessonProgress?.assessmentAttempts ?? 0;
  const maxAttempts = lesson?.quizMaxAttempts ?? 3;

  return {
    isCompleted: lessonProgress?.isCompleted ?? false,
    hasQuiz,
    attempts,
    maxAttempts,
    retriesRemaining: Math.max(0, maxAttempts - attempts),
    passed: lessonProgress?.assessmentPassed ?? false,
    score: lessonProgress?.lastScore ?? 0,
    canRetry: !!(
      lessonProgress &&
      !lessonProgress.assessmentPassed &&
      attempts < maxAttempts
    ),
  };
};

/**
 * Get quiz evaluation result details
 */
export const formatQuizResult = (evaluation, lessonName) => {
  const { percentage, passed, questionsCorrect, questionsTotal } = evaluation;

  return {
    score: percentage,
    passed,
    message: passed
      ? `Congratulations! You scored ${percentage}% and passed! 🎉`
      : `You scored ${percentage}%. You need to pass to continue. Try again!`,
    details: `${questionsCorrect}/${questionsTotal} questions correct`,
    summary: {
      scorePercentage: percentage,
      questionsCorrect,
      questionsTotal,
      passed,
    },
  };
};

/**
 * Get next incomplete lesson for "Continue Learning"
 */
export const getNextIncompleteLesson = (enrollment, module) => {
  if (!enrollment?.lessonProgress || !module?.lessons) {
    return 0; // Default to first lesson
  }

  const totalLessons = module.lessons.length;

  for (let i = 0; i < totalLessons; i++) {
    // Check if accessible
    const isAccessible = canAccessLesson(i, enrollment, module);
    if (!isAccessible) continue;

    // Check if completed
    const isCompleted = isLessonCompleted(enrollment, i);
    if (!isCompleted) {
      return i;
    }
  }

  // All lessons completed
  return totalLessons - 1;
};

/**
 * Get module progress percentage
 */
export const getModuleProgressPercentage = (enrollment, module) => {
  if (!module?.lessons || module.lessons.length === 0) return 0;

  const totalLessons = module.lessons.length;
  let completedLessons = 0;

  for (let i = 0; i < totalLessons; i++) {
    if (isLessonCompleted(enrollment, i)) {
      completedLessons++;
    }
  }

  return Math.round((completedLessons / totalLessons) * 100);
};

/**
 * Get all lessons status for progress display
 */
export const getAllLessonsStatus = (enrollment, module) => {
  if (!module?.lessons) return [];

  return module.lessons.map((lesson, index) => ({
    lessonIndex: index,
    title: lesson.title,
    isCompleted: isLessonCompleted(enrollment, index),
    isLocked: !canAccessLesson(index, enrollment, module),
    canAccess: canAccessLesson(index, enrollment, module),
    hasQuiz: (lesson.assessmentQuiz || []).length > 0,
    attempts:
      enrollment?.lessonProgress?.find((lp) => lp.lessonIndex === index)
        ?.assessmentAttempts ?? 0,
    score:
      enrollment?.lessonProgress?.find((lp) => lp.lessonIndex === index)
        ?.lastScore ?? 0,
  }));
};

/**
 * Check if student should auto-complete lesson (no quiz)
 */
export const shouldAutoCompleteLessonOnLastSlide = (lesson) => {
  return (lesson?.assessmentQuiz || []).length === 0;
};

/**
 * Get all slides in a lesson
 */
export const getLessonSlides = (lesson) => {
  return (lesson?.slides || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

/**
 * Get assessment quiz from lesson
 */
export const getLessonQuiz = (lesson) => {
  return lesson?.assessmentQuiz || [];
};

/**
 * Check if lesson allows retry
 */
export const canRetryLesson = (enrollment, lessonIndex, lesson) => {
  const completion = getLessonCompletionInfo(enrollment, lessonIndex, lesson);
  return completion.canRetry;
};

/**
 * Get pass/fail message
 */
export const getPassFailMessage = (passed, studentName, score) => {
  if (passed) {
    return {
      type: "success",
      title: "Congratulations! 🎉",
      message: `${studentName}, you passed with a score of ${score}%!`,
      subMessage: "The next lesson is now unlocked. Keep going!",
      showAnimation: true,
    };
  }

  return {
    type: "error",
    title: "Not Quite There",
    message: `You scored ${score}%. You need to pass to continue.`,
    subMessage: "Review the material and try again.",
    showAnimation: false,
  };
};

/**
 * Validate quiz answers format
 */
export const validateQuizAnswers = (answers, quiz) => {
  if (!answers || typeof answers !== "object") {
    return {
      valid: false,
      error: "Invalid answers format",
    };
  }

  if (Object.keys(answers).length !== quiz.length) {
    return {
      valid: false,
      error: `You must answer all ${quiz.length} questions`,
    };
  }

  return {
    valid: true,
    error: null,
  };
};

/**
 * Get lesson requirements for display
 */
export const getLessonRequirements = (lessonIndex, module, enrollment) => {
  if (lessonIndex === 0) {
    return {
      requiresPreviousCompletion: false,
      requirements: [],
    };
  }

  const previousLesson = module?.lessons?.[lessonIndex - 1];
  const previousCompletion = isLessonCompleted(enrollment, lessonIndex - 1);

  return {
    requiresPreviousCompletion: true,
    previousLessonTitle: previousLesson?.title || `Lesson ${lessonIndex}`,
    isComplete: previousCompletion,
    requirements: [
      `Complete the content in Lesson ${lessonIndex}`,
      previousLesson?.assessmentQuiz?.length > 0
        ? `Pass the quiz (passing score: ${previousLesson.quizPassingScore || 70}%)`
        : `Finish the lesson content`,
    ],
  };
};

/**
 * Check if all lessons are completed (for final assessment)
 */
export const areAllLessonsCompleted = (enrollment, totalLessons) => {
  if (!enrollment?.lessonProgress) return false;

  for (let i = 0; i < totalLessons; i++) {
    if (!isLessonCompleted(enrollment, i)) {
      return false;
    }
  }

  return true;
};

/**
 * Get edge case warnings
 */
export const checkEdgeCases = (enrollment, lessonIndex, lesson, moduleId) => {
  const warnings = [];

  // Page refresh warning
  if (!enrollment) {
    warnings.push({
      type: "error",
      message: "Enrollment information missing. Please refresh the page.",
    });
  }

  // Max attempts reached
  const completion = getLessonCompletionInfo(enrollment, lessonIndex, lesson);
  if (completion.attempts >= completion.maxAttempts && !completion.passed) {
    warnings.push({
      type: "warning",
      message: `You've used all ${completion.maxAttempts} attempts. You must restart the lesson.`,
    });
  }

  // Integrity check - ensure sequential completion
  if (lessonIndex > 0 && !isLessonCompleted(enrollment, lessonIndex - 1)) {
    warnings.push({
      type: "error",
      message: "You cannot skip lessons. Complete the previous lesson first.",
    });
  }

  return warnings;
};
