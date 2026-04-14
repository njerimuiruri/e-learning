# Lesson Progression - Quick Integration Quickstart

This is the fastest way to integrate lesson progression into your LessonViewer.

## 🚀 30-Minute Integration

### Step 1: Add Imports (2 min)
In `src/components/student/LessonViewer.jsx`, add at the top:

```javascript
import { useLessonProgression } from '@/hooks/useLessonProgression';
import { LessonAccessGuard } from '@/components/LessonAccessGuard';
import {
  canAccessLesson,
  shouldAutoCompleteLessonOnLastSlide,
} from '@/lib/utils/lessonProgressionLogic';
```

### Step 2: Initialize Hook (3 min)
Inside your `LessonViewer` function, after state declarations:

```javascript
const {
  isSubmittingQuiz,
  quizResult,
  showResultsModal,
  submitQuiz,
  retryQuiz,
  setShowResultsModal,
  getLessonStatus,
} = useLessonProgression(
  lessonIndex,
  lesson,
  module,
  enrollment,
  (event) => {
    console.log('Progress event:', event);
    if (event.type === 'lesson-completed' || 
        (event.type === 'quiz-submitted' && event.passed)) {
      onLessonComplete?.({ lessonIndex, passed: true });
    }
  }
);
```

### Step 3: Add Access Guard (2 min)
Right after your existing module/lesson validation, add:

```javascript
// Check access
const canAccess = canAccessLesson(lessonIndex, enrollment, module);

if (!canAccess && lessonIndex > 0) {
  return (
    <LessonAccessGuard
      lessonIndex={lessonIndex}
      lesson={lesson}
      enrollment={enrollment}
      module={module}
      onClose={() => window.history.back()}
      onProceed={(idx) => router.push(`/lessons/${idx}`)}
    />
  );
}
```

### Step 4: Update Quiz Submission (5 min)
Find where you handle quiz submission (usually at end of slides). Replace/modify:

```javascript
// Old code probably looks like:
const handleFinishQuiz = async (answers) => {
  // Calculate score locally
};

// Replace with:
const handleFinishQuiz = async (answers) => {
  const result = await submitQuiz(answers, module._id);
  if (result) {
    // Modal will show automatically via quizResult state
  }
};
```

### Step 5: Wire Up Results Modal (3 min)
Find your QuizResultsModal in the component. Update props:

```javascript
<QuizResultsModal
  isOpen={showResultsModal}
  result={quizResult}
  maxAttempts={lesson?.quizMaxAttempts ?? 3}
  passingScore={lesson?.quizPassingScore ?? 70}
  onContinue={() => {
    setShowResultsModal(false);
    onLessonComplete?.({ lessonIndex, passed: true });
  }}
  onRetry={() => {
    retryQuiz();
  }}
  onReturnToLesson={() => {
    setShowResultsModal(false);
    // Reset quiz UI if needed
  }}
/>
```

### Step 6: Auto-Complete Last Slide (5 min)
Find where you handle the last slide completion. Add:

```javascript
useEffect(() => {
  // When on last slide
  if (currentSlideIndex === slides.length - 1 && allSlidesCompleted) {
    // Auto-complete if no quiz
    if (shouldAutoCompleteLessonOnLastSlide(lesson)) {
      handleAutoCompleteLessonInternally();
    }
  }
}, [currentSlideIndex, allSlidesCompleted, lesson]);

// Add this function:
const handleAutoCompleteLessonInternally = async () => {
  const status = getLessonStatus();
  if (!status.hasQuiz) {
    await lessonProgressionService.completeLessonWithoutQuiz(
      enrollment._id,
      lessonIndex
    );
    onLessonComplete?.({ lessonIndex, passed: true });
  }
};
```

### Step 7: Test (10 min)
1. Go to first lesson - should work ✅
2. Go to second lesson before completing first - should show lock modal ✅
3. Complete first lesson - second should unlock ✅
4. Take quiz - should auto-grade ✅
5. Pass - should show confetti + continue button ✅
6. Fail - should show retry button ✅
7. Try 3 times - should lock lesson ✅

Done! 🎉

---

## 📝 Minimal Example

Here's a complete minimal implementation:

```javascript
'use client';

import { useLessonProgression } from '@/hooks/useLessonProgression';
import { LessonAccessGuard } from '@/components/LessonAccessGuard';
import { canAccessLesson } from '@/lib/utils/lessonProgressionLogic';
import QuizResultsModal from './QuizResultsModal';

export default function LessonViewer({
  lessonIndex,
  lesson,
  module,
  enrollment,
  onLessonComplete,
}) {
  // 1. Check access
  const canAccess = canAccessLesson(lessonIndex, enrollment, module);
  
  if (!canAccess && lessonIndex > 0) {
    return (
      <LessonAccessGuard
        lessonIndex={lessonIndex}
        lesson={lesson}
        enrollment={enrollment}
        module={module}
        onClose={() => history.back()}
        onProceed={(idx) => navigateToLesson(idx)}
      />
    );
  }

  // 2. Initialize progression
  const {
    submitQuiz,
    quizResult,
    showResultsModal,
    setShowResultsModal,
    retryQuiz,
  } = useLessonProgression(
    lessonIndex,
    lesson,
    module,
    enrollment,
    (event) => {
      if (event.passed) {
        onLessonComplete?.({ lessonIndex, passed: true });
      }
    }
  );

  // 3. Handle quiz submit
  const handleSubmitQuiz = async (answers) => {
    await submitQuiz(answers, module._id);
  };

  return (
    <>
      {/* Lesson content */}
      <div className="lesson-slides">
        {/* Slides content... */}
        {hasAssessment && (
          <button onClick={() => handleSubmitQuiz(studentAnswers)}>
            Submit Quiz
          </button>
        )}
      </div>

      {/* Results modal */}
      <QuizResultsModal
        isOpen={showResultsModal}
        result={quizResult}
        onContinue={() => {
          setShowResultsModal(false);
          onLessonComplete?.({ lessonIndex, passed: true });
        }}
        onRetry={() => retryQuiz()}
        onReturnToLesson={() => setShowResultsModal(false)}
      />
    </>
  );
}
```

---

## 🔗 Files Reference

| What | File | Purpose |
|------|------|---------|
| Backend service | `src/progression/lesson-progression.service.ts` | Core logic |
| Backend API | `src/progression/lesson-progression.controller.ts` | Endpoints |
| Frontend hook | `src/hooks/useLessonProgression.js` | Quiz management |
| Frontend API | `src/lib/api/lessonProgressionService.js` | API calls |
| Utilities | `src/lib/utils/lessonProgressionLogic.js` | Helper functions |
| Guard component | `src/components/LessonAccessGuard.jsx` | Lock modal |
| Full guide | `LESSON_PROGRESSION_INTEGRATION_GUIDE.md` | Complete docs |
| Checklist | `LESSON_PROGRESSION_CHECKLIST.md` | All tasks |

---

## ❓ Common Questions

**Q: Do I need to modify the database?**
A: No, the ModuleEnrollment schema already has lessonProgress array.

**Q: Will old progress be lost?**
A: No, I designed it to work with existing data.

**Q: Can I test without deploying backend?**
A: Yes, mock the API responses indev if needed.

**Q: What if quiz has short-answer questions?**
A: They won't auto-grade. Need instructor review (future enhancement).

**Q: How do I debug?**
A: Check browser console for hook logs, and backend logs for API errors.

---

## ⚡ Performance Tips

1. Use `useMemo` for lesson status calculations
2. Don't recalculate progress > once per minute
3. Cache quiz evaluation results
4. Lazy load lesson content

---

## 🆘 if you're stuck

1. Check browser console for errors
2. Check that quiz has questions
3. Verify enrollment._id exists
4. Check module._id passed correctly
5. Look at network tab for API errors
6. See full integration guide if needed

Good luck! 🚀
