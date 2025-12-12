# Course Progression Quick Reference

## Quick Links

- **Logic Functions**: `src/lib/utils/courseProgressionLogic.js`
- **Module Lock Guard**: `src/components/ModuleProgressionGuard.jsx`
- **Final Assessment Lock Guard**: `src/components/FinalAssessmentGuard.jsx`
- **Learning Page**: `src/app/courses/[id]/learn/[moduleId]/[lessonId]/page.jsx`
- **Final Assessment Page**: `src/app/courses/[id]/final-assessment/page.jsx`
- **Full Guide**: `COURSE_PROGRESSION_SYSTEM.md`

## Key Rules

### Module Access

```
canAccessModule(moduleIndex, moduleProgress) → true/false

Module 0: Always accessible (first module)
Module N: Accessible only if Module N-1 assessment passed
```

### Attempt Limits

```
Per Module: 3 attempts max
- Attempt 1-2 Failed → Student can retry
- Attempt 3 Failed → Course must be restarted
```

### Final Assessment Access

```
canAccessFinalAssessment(totalModules, moduleProgress) → true/false

Requirement: ALL modules completed (assessmentPassed = true)
Certificate: Score >= 70%
```

## Code Examples

### 1. Check Module Access

```javascript
import { canAccessModule } from "@/lib/utils/courseProgressionLogic";

const access = canAccessModule(moduleIndex, enrollment.moduleProgress);
if (!access.canAccess) {
  setShowModuleGuard(true); // Show lock screen
  console.log(access.reason); // "Module is locked. Complete..."
}
```

### 2. Check Final Assessment Access

```javascript
import { canAccessFinalAssessment } from "@/lib/utils/courseProgressionLogic";

const totalModules = course.modules?.length || 0;
const access = canAccessFinalAssessment(
  totalModules,
  enrollment.moduleProgress
);

if (!access.canAccess) {
  setShowFinalAssessmentGuard(true);
  console.log(`${access.completedModules}/${totalModules} modules completed`);
}
```

### 3. Get Module Status

```javascript
import { getModuleStatus } from "@/lib/utils/courseProgressionLogic";

const status = getModuleStatus(moduleIndex, moduleProgress);
// Returns: 'locked' | 'in-progress' | 'completed' | 'failed'

if (status === "locked") {
  // Show lock icon in sidebar
} else if (status === "completed") {
  // Show checkmark in sidebar
}
```

### 4. Get Course Progress

```javascript
import { getCourseProgressData } from "@/lib/utils/courseProgressionLogic";

const progress = getCourseProgressData(totalModules, moduleProgress);
console.log(`${progress.completedModules}/${progress.totalModules}`); // "3/5"
console.log(progress.progressPercentage); // 60
console.log(progress.allModulesCompleted); // false/true
```

### 5. Show Module Guard

```jsx
import ModuleProgressionGuard from "@/components/ModuleProgressionGuard";

{
  showModuleGuard && (
    <ModuleProgressionGuard
      moduleIndex={moduleIndex}
      modules={modules}
      enrollment={enrollment}
      onClose={() => {
        setShowModuleGuard(false);
        router.push(`/courses/${courseId}`);
      }}
      onProceed={() => {
        // Navigate to previous module
        const prevModule = modules[moduleIndex - 1];
        router.push(`/courses/${courseId}/learn/${prevModule._id}/0`);
      }}
    />
  );
}
```

### 6. Show Final Assessment Guard

```jsx
import FinalAssessmentGuard from "@/components/FinalAssessmentGuard";

if (showGuard && enrollment && course) {
  return (
    <FinalAssessmentGuard
      course={course}
      enrollment={enrollment}
      onClose={() => router.push(`/courses/${courseId}`)}
    />
  );
}
```

## Enrollment Data Structure

```typescript
// What you get from courseService.getEnrollment(courseId)
{
    _id: "enrollment123",
    studentId: "student456",
    courseId: "course789",

    moduleProgress: [
        {
            moduleIndex: 0,
            isCompleted: true,
            assessmentAttempts: 1,      // Current attempt count
            assessmentPassed: true,      // Did they pass?
            lastScore: 85,
            completedAt: "2024-01-15..."
        },
        {
            moduleIndex: 1,
            isCompleted: false,
            assessmentAttempts: 2,      // Retrying module 2
            assessmentPassed: false,
            lastScore: 45
        },
        {
            moduleIndex: 2,
            isCompleted: false,
            assessmentAttempts: 0,      // Not started yet
            assessmentPassed: false,
            lastScore: 0
        }
    ],

    finalAssessmentAttempts: 0,
    finalAssessmentScore: 0,
    certificateEarned: false,
    certificateId: null
}
```

## Common Patterns

### Pattern 1: Check Access on Page Load

```jsx
useEffect(() => {
  const fetchData = async () => {
    const course = await courseService.getCourseById(courseId);
    const enrollment = await courseService.getEnrollment(courseId);

    const access = canAccessModule(moduleIndex, enrollment.moduleProgress);
    setShowGuard(!access.canAccess);
  };
  fetchData();
}, [courseId, moduleIndex]);
```

### Pattern 2: Show Sidebar Lock Status

```jsx
{
  modules.map((mod, idx) => {
    const status = getModuleStatus(idx, enrollment.moduleProgress);
    return (
      <div key={idx}>
        {status === "locked" && <Lock size={16} />}
        {status === "completed" && <CheckCircle size={16} />}
        {status === "in-progress" && <Play size={16} />}
        <span>{mod.title}</span>
      </div>
    );
  });
}
```

### Pattern 3: Show Progress Bar

```jsx
const { completedModules, totalModules, progressPercentage } =
  getCourseProgressData(course.modules.length, enrollment.moduleProgress);

<div>
  <div className="progress-bar" style={{ width: `${progressPercentage}%` }} />
  <span>
    {completedModules}/{totalModules}
  </span>
</div>;
```

## FAQ

**Q: Can a student skip a module?**
A: No. Frontend enforces sequential access. Backend should also validate.

**Q: What happens if a student fails 3 times?**
A: They're blocked from proceeding. They must restart the entire course to try again.

**Q: Can they start final assessment while still on Module 2?**
A: No. Frontend shows guard. Backend should reject if not all modules passed.

**Q: Is the final assessment attempt limited?**
A: Not currently. Backend tracks attempts in `finalAssessmentAttempts` but doesn't enforce a limit. Can be added.

**Q: Does certificate auto-generate?**
A: Backend generates on 70%+ score. Frontend shows success modal and download link.

**Q: Can instructors bypass progression for testing?**
A: Not implemented yet. Would need admin flag in backend.

## Debugging

### Check Enrollment State

```javascript
// In browser console during development
const enrollment = await courseService.getEnrollment(courseId);
console.table(enrollment.moduleProgress);
// Shows: moduleIndex, assessmentAttempts, assessmentPassed, lastScore
```

### Test Module Unlock

```javascript
// Manually set enrollment for testing (development only!)
const testEnrollment = {
  moduleProgress: [
    { moduleIndex: 0, assessmentPassed: true, assessmentAttempts: 1 },
    { moduleIndex: 1, assessmentPassed: false, assessmentAttempts: 0 },
  ],
};
console.log(canAccessModule(1, testEnrollment.moduleProgress)); // true
console.log(canAccessModule(2, testEnrollment.moduleProgress)); // false
```

### Test Final Assessment Lock

```javascript
const testEnrollment = {
  moduleProgress: [
    { moduleIndex: 0, assessmentPassed: true },
    { moduleIndex: 1, assessmentPassed: false },
    { moduleIndex: 2, assessmentPassed: true },
  ],
};
const totalModules = 3;
const access = canAccessFinalAssessment(
  totalModules,
  testEnrollment.moduleProgress
);
console.log(access); // {canAccess: false, completedModules: 2}
```

## Performance Tips

1. **Fetch enrollment once** at page load, not in every render
2. **Memoize progression checks** if called frequently
3. **Use conditional rendering** to avoid rendering guards unnecessarily
4. **Lazy load** guard components only when needed

## Next Steps

1. **Backend Implementation**: Ensure endpoints return proper moduleProgress data
2. **Testing**: Test all scenarios in checklist
3. **Styling**: Customize guard modals to match your theme
4. **Analytics**: Track progression attempts and completion rates
5. **Documentation**: Add screenshots to user help docs
