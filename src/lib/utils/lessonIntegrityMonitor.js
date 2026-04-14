/**
 * Lesson Completion Monitor
 * Tracks and enforces lesson completion rules
 * Prevents data corruption from browser dev tools or API manipulation
 */

/**
 * Verify lesson completion is valid
 * Ensures all prerequisites are met before allowing lesson complete status
 */
export const verifyLessonCompletion = (
  enrollment,
  lessonIndex,
  lesson,
  module,
) => {
  const violations = [];

  // Rule 1: Must have lesson progress entry
  const lessonProgress = enrollment.lessonProgress?.find(
    (lp) => lp.lessonIndex === lessonIndex,
  );

  if (
    !lessonProgress &&
    enrollment.lessonProgress?.some((lp) => lp.isCompleted)
  ) {
    // Some lessons are completed but no progress for this lesson
    violations.push({
      severity: "warning",
      message: `Lesson ${lessonIndex} has no progress record but you have other completed lessons`,
    });
  }

  // Rule 2: If has quiz, must have passed it
  const hasQuiz = (lesson?.assessmentQuiz || []).length > 0;
  if (
    hasQuiz &&
    lessonProgress?.isCompleted &&
    !lessonProgress?.assessmentPassed
  ) {
    violations.push({
      severity: "critical",
      message: `Lesson ${lessonIndex} marked complete but quiz not passed`,
      action: "reset",
    });
  }

  // Rule 3: Previous lessons must be completed
  if (lessonIndex > 0 && lessonProgress?.isCompleted) {
    const previousCompleted = enrollment.lessonProgress?.find(
      (lp) => lp.lessonIndex === lessonIndex - 1,
    )?.isCompleted;

    if (!previousCompleted) {
      violations.push({
        severity: "critical",
        message: `Cannot complete lesson ${lessonIndex} before lesson ${
          lessonIndex - 1
        }`,
        action: "reset",
      });
    }
  }

  // Rule 4: Score must be >= passing score if has quiz
  if (hasQuiz && lessonProgress?.isCompleted && lessonProgress?.lastScore) {
    const passingScore = lesson?.quizPassingScore ?? 70;
    if (lessonProgress.lastScore < passingScore) {
      violations.push({
        severity: "critical",
        message: `Lesson ${lessonIndex} score ${
          lessonProgress.lastScore
        }% below passing score ${passingScore}%`,
        action: "reset",
      });
    }
  }

  // Rule 5: Attempts should not exceed max
  if (lessonProgress?.assessmentAttempts) {
    const maxAttempts = lesson?.quizMaxAttempts ?? 3;
    if (lessonProgress.assessmentAttempts > maxAttempts) {
      violations.push({
        severity: "warning",
        message: `Lesson ${lessonIndex} has ${
          lessonProgress.assessmentAttempts
        } attempts, exceeds max of ${maxAttempts}`,
        action: "cap",
      });
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
    hasCritical: violations.some((v) => v.severity === "critical"),
  };
};

/**
 * Validate entire lesson sequence
 * Ensures sequential completion is maintained
 */
export const validateLessonSequence = (enrollment, totalLessons) => {
  const issues = [];

  if (!enrollment.lessonProgress || enrollment.lessonProgress.length === 0) {
    return { isValid: true, issues };
  }

  const sortedProgress = enrollment.lessonProgress
    .slice()
    .sort((a, b) => a.lessonIndex - b.lessonIndex);

  // Check sequential completion
  let lastCompletedIndex = -1;
  for (const lp of sortedProgress) {
    if (lp.isCompleted) {
      // If not the next sequential lesson, that's an issue
      if (lp.lessonIndex > lastCompletedIndex + 1) {
        issues.push({
          severity: "critical",
          message: `Gap in lesson sequence: completed ${lastCompletedIndex}, then lesson ${lp.lessonIndex}`,
          lessonIndex: lp.lessonIndex,
        });
      }
      lastCompletedIndex = lp.lessonIndex;
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    lastCompletedIndex,
  };
};

/**
 * Get integrity report for debugging
 */
export const generateIntegrityReport = (enrollment, module) => {
  const report = {
    timestamp: new Date().toISOString(),
    totalLessons: module.lessons?.length || 0,
    lessonProgress: enrollment.lessonProgress || [],
    completedCount: 0,
    issues: [],
    recommendations: [],
  };

  if (!enrollment.lessonProgress || enrollment.lessonProgress.length === 0) {
    report.recommendations.push("No lesson progress recorded");
    return report;
  }

  // Count completed
  report.completedCount = enrollment.lessonProgress.filter(
    (lp) => lp.isCompleted,
  ).length;

  // Validate each lesson
  for (const lp of enrollment.lessonProgress) {
    const lesson = module.lessons?.[lp.lessonIndex];
    if (!lesson) {
      report.issues.push({
        type: "missing-lesson",
        message: `Progress for non-existent lesson ${lp.lessonIndex}`,
      });
      continue;
    }

    const verification = verifyLessonCompletion(
      enrollment,
      lp.lessonIndex,
      lesson,
      module,
    );
    if (!verification.isValid) {
      report.issues.push(...verification.violations);
    }
  }

  // Validate sequence
  const sequence = validateLessonSequence(enrollment, report.totalLessons);
  if (!sequence.isValid) {
    report.issues.push(...sequence.issues);
  }

  // Generate recommendations
  if (report.issues.length > 0) {
    report.recommendations.push(
      "Contact support: Data integrity issues detected",
    );
  }

  if (report.completedCount === 0) {
    report.recommendations.push("Start with Lesson 1");
  }

  if (report.completedCount === report.totalLessons) {
    report.recommendations.push(
      "All lessons completed! Ready for final assessment",
    );
  }

  return report;
};

/**
 * Auto-repair common integrity issues
 * WARNING: Should only be called in admin context
 */
export const autoRepairIntegrity = (enrollment, module) => {
  const repaired = { ...enrollment };
  let changesCount = 0;

  if (!repaired.lessonProgress) {
    repaired.lessonProgress = [];
  }

  // Fix 1: Remove duplicate entries
  const seen = new Set();
  repaired.lessonProgress = repaired.lessonProgress.filter((lp) => {
    const key = lp.lessonIndex;
    if (seen.has(key)) {
      changesCount++;
      return false;
    }
    seen.add(key);
    return true;
  });

  // Fix 2: Sort by lessonIndex
  repaired.lessonProgress.sort((a, b) => a.lessonIndex - b.lessonIndex);

  // Fix 3: Cap attempts at max
  for (const lp of repaired.lessonProgress) {
    const lesson = module.lessons?.[lp.lessonIndex];
    const maxAttempts = lesson?.quizMaxAttempts ?? 3;
    if (lp.assessmentAttempts > maxAttempts) {
      lp.assessmentAttempts = maxAttempts;
      changesCount++;
    }
  }

  // Fix 4: Remove impossible completions
  let lastValidIndex = -1;
  for (let i = 0; i < repaired.lessonProgress.length; i++) {
    const lp = repaired.lessonProgress[i];
    const lesson = module.lessons?.[lp.lessonIndex];
    const hasQuiz = (lesson?.assessmentQuiz || []).length > 0;

    // If has quiz but not passed, unmark complete
    if (hasQuiz && lp.isCompleted && !lp.assessmentPassed) {
      lp.isCompleted = false;
      lp.completedAt = undefined;
      changesCount++;
    }

    // If marked complete correctly, update lastValidIndex
    if (lp.isCompleted && lp.lessonIndex === lastValidIndex + 1) {
      lastValidIndex = lp.lessonIndex;
    }
  }

  return {
    repaired,
    changesCount,
    needsSaving: changesCount > 0,
  };
};

/**
 * Check if student progress is suspicious
 * Used for fraud detection
 */
export const isSuspiciousProgress = (enrollment, module, timeCreated) => {
  const suspiciousFlags = [];

  const now = new Date();
  const enrollmentAge =
    (now.getTime() - new Date(timeCreated).getTime()) / 1000 / 60; // minutes

  const completedLessons =
    enrollment.lessonProgress?.filter((lp) => lp.isCompleted).length || 0;
  const totalLessons = module.lessons?.length || 0;

  // Flag 1: All lessons completed in very short time
  if (
    completedLessons === totalLessons &&
    completedLessons > 0 &&
    enrollmentAge < 10
  ) {
    suspiciousFlags.push({
      type: "fast-completion",
      message: `All ${totalLessons} lessons completed in ${enrollmentAge}min`,
      riskLevel: "high",
    });
  }

  // Flag 2: Perfect score on all quizzes
  const perfectScores =
    enrollment.lessonProgress?.filter((lp) => lp.lastScore === 100).length || 0;

  if (perfectScores > Math.floor(totalLessons / 2)) {
    suspiciousFlags.push({
      type: "perfect-scores",
      message: `${perfectScores}/${totalLessons} lessons have perfect scores`,
      riskLevel: "medium",
    });
  }

  // Flag 3: Unrealistic completion pattern
  for (let i = 0; i < enrollment.lessonProgress.length - 1; i++) {
    const current = enrollment.lessonProgress[i];
    const next = enrollment.lessonProgress[i + 1];

    if (
      current.completedAt &&
      next.completedAt &&
      new Date(next.completedAt).getTime() -
        new Date(current.completedAt).getTime() <
        30000
    ) {
      // Less than 30 seconds between lessons
      suspiciousFlags.push({
        type: "unrealistic-timing",
        message: `Less than 30s between lessons ${i} and ${i + 1}`,
        riskLevel: "low",
      });
      break;
    }
  }

  return {
    isSuspicious: suspiciousFlags.length > 0,
    flags: suspiciousFlags,
    riskLevel: suspiciousFlags.reduce((max, f) => {
      const levels = { high: 3, medium: 2, low: 1 };
      return Math.max(max, levels[f.riskLevel] || 0);
    }, 0),
  };
};
