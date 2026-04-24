const clampPercent = (value) => Math.min(100, Math.max(0, Math.round(Number(value) || 0)));

const toCount = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
};

export function getEnrollmentMetrics(enrollment = {}) {
    const lessonProgress = Array.isArray(enrollment.lessonProgress) ? enrollment.lessonProgress : [];
    const storedTotalLessons = toCount(enrollment.totalLessons);
    const totalLessons = storedTotalLessons || lessonProgress.length;

    const derivedCompletedLessons = lessonProgress.length > 0
        ? lessonProgress.filter((lesson) => lesson?.isCompleted).length
        : toCount(enrollment.completedLessons);

    const cappedCompletedLessons = totalLessons > 0
        ? Math.min(derivedCompletedLessons, totalLessons)
        : derivedCompletedLessons;

    const allLessonsCompleted = totalLessons > 0 && cappedCompletedLessons >= totalLessons;
    const completedLessons = (allLessonsCompleted || enrollment.isCompleted) && totalLessons > 0
        ? totalLessons
        : cappedCompletedLessons;

    const progress = totalLessons > 0
        ? clampPercent((completedLessons / totalLessons) * 100)
        : clampPercent(enrollment.progress);

    return {
        totalLessons,
        completedLessons,
        progress,
        allLessonsCompleted,
    };
}

export function normalizeEnrollment(enrollment = {}) {
    return {
        ...enrollment,
        ...getEnrollmentMetrics(enrollment),
    };
}

export function summarizeEnrollments(enrollments = []) {
    const normalizedEnrollments = enrollments.map(normalizeEnrollment);
    const totalLessons = normalizedEnrollments.reduce((sum, enrollment) => sum + enrollment.totalLessons, 0);
    const completedLessons = normalizedEnrollments.reduce((sum, enrollment) => sum + enrollment.completedLessons, 0);
    const overallProgress = totalLessons > 0
        ? clampPercent((completedLessons / totalLessons) * 100)
        : 0;

    return {
        normalizedEnrollments,
        totalLessons,
        completedLessons,
        overallProgress,
    };
}
