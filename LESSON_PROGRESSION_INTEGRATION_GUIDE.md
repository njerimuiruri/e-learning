# Lesson Progression & Assessment System - Integration Guide

This guide explains how to integrate the lesson progression system into your existing components.

## Overview

The system provides:

- ✅ Sequential lesson access (students must complete lessons in order)
- ✅ Auto-pass lessons without quizzes
- ✅ Real-time quiz scoring with pass/fail logic
- ✅ Attempt tracking (max 3 attempts per lesson)
- ✅ Celebratory animations on pass
- ✅ Continue Learning navigation
- ✅ Progress tracking and persistence
- ✅ Edge case handling

## Backend Services

### LessonProgressionService (Backend)

**Location:** `src/progression/lesson-progression.service.ts`

**Key Methods:**

- `canAccessLesson(enrollmentId, lessonIndex)` - Check if lesson is accessible
- `evaluateQuiz(enrollmentId, lessonIndex, answers, moduleId)` - Grade quiz answers
- `markLessonCompleted(enrollmentId, lessonIndex)` - Mark lesson complete (no quiz)
- `getNextIncompleteLesson(enrollmentId, totalLessons)` - Get next lesson for Continue Learning
- `getLessonProgressSummary(enrollmentId, totalLessons)` - Get all lessons status
- `resetLessonProgress(enrollmentId, lessonIndex)` - Reset for retry

### LessonProgressionController (Backend)

**Location:** `src/progression/lesson-progression.controller.ts`

**Endpoints:**

```
GET  /lessons/progression/:enrollmentId/can-access/:lessonIndex
POST /lessons/progression/:enrollmentId/evaluate-quiz/:lessonIndex
POST /lessons/progression/:enrollmentId/complete/:lessonIndex
GET  /lessons/progression/:enrollmentId/next-lesson/:totalLessons
GET  /lessons/progression/:enrollmentId/summary/:totalLessons
POST /lessons/progression/:enrollmentId/reset/:lessonIndex
```

## Frontend Services

### lessonProgressionService (API Client)

**Location:** `src/lib/api/lessonProgressionService.js`

**Methods:**

- `canAccessLesson(enrollmentId, lessonIndex)`
- `submitQuiz(enrollmentId, lessonIndex, answers, moduleId)`
- `completeLessonWithoutQuiz(enrollmentId, lessonIndex)`
- `getNextIncompleteLesson(enrollmentId, totalLessons)`
- `getLessonProgressSummary(enrollmentId, totalLessons)`
- `resetLessonProgress(enrollmentId, lessonIndex)`

### Utilities

**Location:** `src/lib/utils/lessonProgressionLogic.js`

**Key Functions:**

- `canAccessLesson(lessonIndex, enrollment, module)` - Check access locally
- `isLessonCompleted(enrollment, lessonIndex)` - Check completion status
- `getLessonCompletionInfo(enrollment, lessonIndex, lesson)` - Get all completion details
- `getNextIncompleteLesson(enrollment, module)` - Get next lesson
- `formatQuizResult(evaluation, lessonName)` - Format quiz results
- `getAllLessonsStatus(enrollment, module)` - Get all lessons status
- `shouldAutoCompleteLessonOnLastSlide(lesson)` - Check auto-complete condition

## Frontend Hooks

### useLessonProgression

**Location:** `src/hooks/useLessonProgression.js`

**Usage in LessonViewer:**

```javascript
const {
  isSubmittingQuiz,
  quizResult,
  showResultsModal,
  error,
  isInitialized,
  submitQuiz,
  handleQuizResult,
  retryQuiz,
  resetLessonCompletely,
  handleAutoCompleteLesson,
  getLessonStatus,
  setShowResultsModal,
} = useLessonProgression(
  lessonIndex,
  lesson,
  module,
  enrollment,
  onProgressUpdate,
);
```

**Event Callbacks:**

- `'lesson-completed'` - Lesson auto-completed (no quiz)
- `'quiz-submitted'` - Quiz submitted with result
- `'lesson-unlocked'` - Next lesson unlocked
- `'lesson-reset-required'` - Max attempts exceeded
- `'quiz-reset'` - Reset for retry
- `'lesson-reset-complete'` - Full lesson reset done

### useContinueLearning

**Location:** `src/hooks/useContinueLearning.js`

**Usage:**

```javascript
const {
  getNextLesson,
  navigateToNextLesson,
  getProgressSummary,
  getServerNextLesson,
  loading,
  error,
} = useContinueLearning(enrollment, module);
```

## Frontend Components

### LessonAccessGuard

**Location:** `src/components/LessonAccessGuard.jsx`

Displays when student tries to access a locked lesson. Shows:

- Why the lesson is locked
- Requirements to unlock
- Button to go to previous lesson

**Usage:**

```javascript
<LessonAccessGuard
  lessonIndex={currentLessonIndex}
  lesson={currentLesson}
  enrollment={enrollment}
  module={module}
  onClose={() => setShowGuard(false)}
  onProceed={(lessonIndex) => setCurrentLessonIndex(lessonIndex)}
/>
```

### QuizResultsModal (Updated)

**Location:** `src/components/student/QuizResultsModal.jsx`

Already supports:

- Confetti animation on pass
- Score visualization
- Attempt tracking
- Pass/fail messaging
- Retry / Continue buttons

## Integration Steps

### Step 1: Update LessonViewer Component

In `src/components/student/LessonViewer.jsx`:

```javascript
import { useLessonProgression } from '@/hooks/useLessonProgression';
import { useContinueLearning } from '@/hooks/useContinueLearning';
import { LessonAccessGuard } from '@/components/LessonAccessGuard';
import {
  canAccessLesson,
  shouldAutoCompleteLessonOnLastSlide,
  getLessonCompletionInfo,
} from '@/lib/utils/lessonProgressionLogic';

export default function LessonViewer({
  lesson,
  lessonIndex,
  totalLessons,
  enrollment,
  module,
  onLessonComplete,
  ...props
}) {
  // Check access
  const canAccess = canAccessLesson(lessonIndex, enrollment, module);

  if (!canAccess && lessonIndex > 0) {
    return (
      <LessonAccessGuard
        lessonIndex={lessonIndex}
        lesson={lesson}
        enrollment={enrollment}
        module={module}
        onClose={() => {...}}
        onProceed={(idx) => {...}}
      />
    );
  }

  // Use lesson progression hook
  const {
    isSubmittingQuiz,
    quizResult,
    showResultsModal,
    submitQuiz,
    handleQuizResult,
    retryQuiz,
  } = useLessonProgression(
    lessonIndex,
    lesson,
    module,
    enrollment,
    (event) => {
      if (event.type === 'lesson-completed') {
        onLessonComplete?.({ lessonIndex, passed: true });
      } else if (event.type === 'quiz-submitted') {
        if (event.passed) {
          onLessonComplete?.({ lessonIndex, passed: true });
        }
      }
    }
  );

  const handleQuizSubmit = async (answers) => {
    const result = await submitQuiz(answers, module._id);
    if (result) {
      handleQuizResult(result);
    }
  };

  const handleOnLastSlide = async () => {
    // Auto-complete if no quiz
    if (shouldAutoCompleteLessonOnLastSlide(lesson)) {
      // The hook handles this
    }
  };

  return (
    <>
      <LessonAccessGuard {...} />

      {/* ... existing content ... */}

      <QuizResultsModal
        isOpen={showResultsModal}
        result={quizResult}
        maxAttempts={lesson?.quizMaxAttempts ?? 3}
        passingScore={lesson?.quizPassingScore ?? 70}
        onContinue={() => {
          setShowResultsModal(false);
          onLessonComplete?.({ lessonIndex, passed: true });
        }}
        onRetry={retryQuiz}
        onReturnToLesson={() => {
          setShowResultsModal(false);
          // Reset quiz UI
        }}
      />
    </>
  );
}
```

### Step 2: Add Continue Learning Button

In your course/module view:

```javascript
const { getNextLesson, navigateToNextLesson, getProgressSummary } =
  useContinueLearning(enrollment, module);

const handleContinueLearning = () => {
  const nextLesson = getNextLesson();
  navigateToNextLesson((lessonIndex) => {
    router.push(
      `/courses/${courseId}/modules/${moduleId}/lesson/${lessonIndex}`,
    );
  });
};

// In JSX:
<button onClick={handleContinueLearning}>Continue Learning</button>;
```

### Step 3: Display Progress Bar

```javascript
import { getModuleProgressPercentage } from '@/lib/utils/lessonProgressionLogic';

const progress = getModuleProgressPercentage(enrollment, module);

<div className="w-full bg-gray-200 rounded h-2">
  <div
    className="bg-blue-600 h-2 rounded transition-all"
    style={{ width: `${progress}%` }}
  />
</div>
<p className="text-sm text-gray-600 mt-2">{progress}% Complete</p>
```

### Step 4: Display Lesson Status

```javascript
import { getAllLessonsStatus } from "@/lib/utils/lessonProgressionLogic";

const lessonsStatus = getAllLessonsStatus(enrollment, module);

{
  lessonsStatus.map((lesson, idx) => (
    <div key={idx} className="p-4 border rounded">
      <h3>{lesson.title}</h3>
      <p>
        {lesson.isLocked
          ? "🔒 Locked"
          : lesson.isCompleted
            ? "✅ Completed"
            : "📖 In Progress"}
      </p>
      {lesson.hasQuiz && (
        <p className="text-sm text-gray-600">
          Attempts: {lesson.attempts}/3 | Score: {lesson.score}%
        </p>
      )}
    </div>
  ));
}
```

## Edge Cases Handled

### ✅ Page Refresh

- Progress persists via database
- Page refresh doesn't reset quiz answers
- Enrollment data synced

### ✅ Completed Lessons

- Stay completed even after refresh
- Cannot be accessed again (read-only)

### ✅ No Skipping

- Lessons locked until prerequisites met
- Sequential access enforced

### ✅ Quiz Logic

- No submit button needed (real-time scoring)
- Auto-evaluated on completion
- Max 3 attempts per lesson

### ✅ Max Attempts

- After 3 failed attempts, lesson locked
- Student must retry entire lesson
- Attempts reset when lesson restarted

## Testing Checklist

- [ ] First lesson is accessible
- [ ] Second lesson locked until first completed
- [ ] Quiz auto-evaluates on completion
- [ ] Pass shows confetti and "Continue" button
- [ ] Fail shows retry button and remaining attempts
- [ ] Max 3 attempts enforced
- [ ] Lesson without quiz auto-completes on last slide
- [ ] Continue Learning button navigates to next incomplete
- [ ] Progress bar updates correctly
- [ ] Page refresh maintains progress
- [ ] Cannot access future lessons by URL manipulation
- [ ] Quiz answers saved in database

## Database Fields Reference

### ModuleEnrollment.lessonProgress

```javascript
{
  lessonIndex: number,
  isCompleted: boolean,
  completedAt: Date,
  slideProgress: SlideProgress[],
  completedSlides: number,
  assessmentAttempts: number,          // 0-3
  assessmentPassed: boolean,
  lastScore: number,                   // 0-100
}
```

## API Response Examples

### POST /lessons/progression/:enrollmentId/evaluate-quiz/:lessonIndex

**Request:**

```json
{
  "answers": {
    "0": "option-a",
    "1": "true",
    "2": "answer"
  },
  "moduleId": "507f1f77bcf86cd799439011"
}
```

**Response:**

```json
{
  "evaluation": {
    "score": 7,
    "maxScore": 10,
    "percentage": 70,
    "passed": true,
    "questionsCorrect": 7,
    "questionsTotal": 10,
    "answers": [...]
  },
  "lessonNowCompleted": true,
  "canRetry": false,
  "retriesRemaining": 0
}
```

## Troubleshooting

### Issue: Lesson not unlocking after passing

- Check `assessmentPassed` is true in database
- Verify `isCompleted` is true
- Check next lesson's `canAccess` logic

### Issue: Quiz submissions failing

- Verify moduleId is passed
- Check answers format matches quiz structure
- Ensure token is valid

### Issue: Progress not saving

- Check enrollment.\_id exists
- Verify lessonProgressionService API URL
- Check database connection

### Issue: Confetti not showing

- Ensure Confetti component rendered
- Check z-index not overridden
- Verify `passed` property is true

## Future Enhancements

1. **Lesson Videos Tracking** - Track video view time
2. **Practice Questions** - Before main quiz
3. **Certificates** - Auto-generate on course completion
4. **Leaderboards** - Based on scores and completion time
5. **Achievements/Badges** - For milestones
6. **Spaced Repetition** - Remind students to review
7. **Adaptive Difficulty** - Adjust quiz based on performance
