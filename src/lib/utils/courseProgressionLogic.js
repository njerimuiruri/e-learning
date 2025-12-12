/**
 * Course Progression Logic
 * Handles the sequential flow of modules and assessments
 */

/**
 * Check if a student can access a specific module
 * @param {number} moduleIndex - Index of the module to check
 * @param {Array} moduleProgress - Student's module progress array
 * @returns {Object} { canAccess: boolean, reason: string }
 */
export function canAccessModule(moduleIndex, moduleProgress = []) {
  // First module (index 0) is always accessible
  if (moduleIndex === 0) {
    return { canAccess: true, reason: "First module is always accessible" };
  }

  // Check if previous module is completed and assessment passed
  const previousModuleProgress = moduleProgress.find(
    (mp) => mp.moduleIndex === moduleIndex - 1
  );

  if (!previousModuleProgress) {
    return {
      canAccess: false,
      reason: "Previous module must be completed first",
    };
  }

  if (!previousModuleProgress.assessmentPassed) {
    return {
      canAccess: false,
      reason: `Module ${moduleIndex} is locked. Complete and pass the assessment in Module ${moduleIndex} first.`,
    };
  }

  return { canAccess: true, reason: "Module is accessible" };
}

/**
 * Check if a student can take the final assessment
 * @param {number} totalModules - Total number of modules in the course
 * @param {Array} moduleProgress - Student's module progress array
 * @returns {Object} { canAccess: boolean, completedModules: number, reason: string }
 */
export function canAccessFinalAssessment(totalModules, moduleProgress = []) {
  const completedModules = moduleProgress.filter(
    (mp) => mp.assessmentPassed
  ).length;

  if (completedModules < totalModules) {
    return {
      canAccess: false,
      completedModules,
      reason: `Complete all ${totalModules} modules first. You've completed ${completedModules}/${totalModules}.`,
    };
  }

  return {
    canAccess: true,
    completedModules,
    reason: "All modules completed. Final assessment is available.",
  };
}

/**
 * Get module status
 * @param {number} moduleIndex - Index of the module
 * @param {Array} moduleProgress - Student's module progress array
 * @returns {string} Status: 'locked', 'in-progress', 'completed', 'failed'
 */
export function getModuleStatus(moduleIndex, moduleProgress = []) {
  const progress = moduleProgress.find((mp) => mp.moduleIndex === moduleIndex);

  if (!progress) {
    // Module hasn't been started
    if (moduleIndex === 0) return "in-progress";

    const previousProgress = moduleProgress.find(
      (mp) => mp.moduleIndex === moduleIndex - 1
    );
    if (!previousProgress || !previousProgress.assessmentPassed) {
      return "locked";
    }
    return "in-progress";
  }

  if (progress.assessmentPassed) {
    return "completed";
  }

  if (progress.assessmentAttempts >= 3) {
    return "failed";
  }

  return "in-progress";
}

/**
 * Get visual progress data for the course
 * @param {number} totalModules - Total number of modules
 * @param {Array} moduleProgress - Student's module progress array
 * @returns {Object} Overall course progress data
 */
export function getCourseProgressData(totalModules, moduleProgress = []) {
  const completedModules = moduleProgress.filter(
    (mp) => mp.assessmentPassed
  ).length;
  const lockedModules = moduleProgress.filter(
    (mp) => mp.assessmentAttempts >= 3 && !mp.assessmentPassed
  ).length;
  const inProgressModules = totalModules - completedModules - lockedModules;

  return {
    totalModules,
    completedModules,
    lockedModules,
    inProgressModules,
    progressPercentage: Math.round((completedModules / totalModules) * 100),
    allModulesCompleted: completedModules === totalModules,
  };
}

/**
 * Get module unlock requirements
 * @param {number} moduleIndex - Index of the module
 * @param {Array} modules - All course modules
 * @param {Array} moduleProgress - Student's module progress array
 * @returns {Object} Unlock requirements
 */
export function getModuleUnlockRequirements(
  moduleIndex,
  modules,
  moduleProgress = []
) {
  if (moduleIndex === 0) {
    return { required: false, message: "" };
  }

  const previousModule = modules[moduleIndex - 1];
  const previousProgress = moduleProgress.find(
    (mp) => mp.moduleIndex === moduleIndex - 1
  );

  if (!previousProgress) {
    return {
      required: true,
      message: `Unlock requirement: Complete and pass the assessment in "${
        previousModule?.title || `Module ${moduleIndex}`
      }"`,
    };
  }

  if (!previousProgress.assessmentPassed) {
    return {
      required: true,
      message: `This module is locked. You must pass the assessment in "${
        previousModule?.title || `Module ${moduleIndex}`
      }" to unlock this module.`,
      attempts: previousProgress.assessmentAttempts,
      remainingAttempts: Math.max(0, 3 - previousProgress.assessmentAttempts),
    };
  }

  return { required: false, message: "" };
}
