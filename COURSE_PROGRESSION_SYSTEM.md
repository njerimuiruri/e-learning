# Course Progression System Implementation Guide

## Overview

The course progression system implements a strict sequential module-based learning flow with assessment gating. Students must complete each module's assessment before proceeding to the next module, and must complete all modules before taking the final assessment.

## Architecture

### Core Components

#### 1. **Progression Logic Utility** (`courseProgressionLogic.js`)

Location: `src/lib/utils/courseProgressionLogic.js`

Provides pure functions for checking progression state:

- `canAccessModule()` - Check if student can access a specific module
- `canAccessFinalAssessment()` - Check if student can take final assessment
- `getModuleStatus()` - Get current status of a module (locked/in-progress/completed/failed)
- `getCourseProgressData()` - Get overall course progress statistics
- `getModuleUnlockRequirements()` - Get unlock requirements and attempt info

**Usage:**

```javascript
import {
  canAccessModule,
  canAccessFinalAssessment,
} from "@/lib/utils/courseProgressionLogic";

const access = canAccessModule(moduleIndex, moduleProgress);
if (!access.canAccess) {
  console.log(access.reason); // "Module is locked..."
}
```

#### 2. **Module Progression Guard** (`ModuleProgressionGuard.jsx`)

Location: `src/components/ModuleProgressionGuard.jsx`

Modal component that displays when student tries to access a locked module.

**Features:**

- Shows lock icon and "Module Locked" header
- Displays previous module requirements
- Shows attempt counter (0-3)
- Indicates remaining attempts
- Offers "Go to Previous Module" button to retry assessment
- Includes info about course structure

**Usage in Learning Page:**

```jsx
{
  showModuleGuard && (
    <ModuleProgressionGuard
      moduleIndex={moduleIndex}
      modules={modules}
      enrollment={enrollment}
      onClose={() => setShowModuleGuard(false)}
      onProceed={() => navigateToPreviousModule()}
    />
  );
}
```

#### 3. **Final Assessment Guard** (`FinalAssessmentGuard.jsx`)

Location: `src/components/FinalAssessmentGuard.jsx`

Modal component that displays when student tries to take final assessment without completing all modules.

**Features:**

- Shows lock icon and "Final Assessment Locked" header
- Displays progress meter (e.g., "3/5 modules completed")
- Lists all modules with completion status
- Shows percentage completion
- Explains 70% requirement for certificate
- Includes info about certificate rewards

**Usage in Final Assessment Page:**

```jsx
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

### Data Model

#### Enrollment Schema

```typescript
interface Enrollment {
  studentId: string;
  courseId: string;
  modules: Module[];
  moduleProgress: ModuleProgress[]; // Sequential array
  finalAssessmentAttempts: number; // 0-3 attempts
  finalAssessmentScore: number;
  certificateId?: string;
  certificateEarned: boolean;
}

interface ModuleProgress {
  moduleIndex: number; // Position in course (0-based)
  isCompleted: boolean; // All lessons completed
  assessmentAttempts: number; // Current attempts (0-3)
  assessmentPassed: boolean; // Passed assessment?
  lastScore: number; // Last attempt score
  completedAt?: Date;
}
```

## Progression Flow

### Module Progression

```
Student Enrolls
    ↓
Module 0: Locked? NO → Can Access
    ↓
[Learn Lessons] → [Module Assessment]
    ↓
Module 0: Assessment Passed?
    ├─ YES → Module 0 Completed, Module 1 Unlocked
    ├─ NO (Attempts < 3) → Retry Assessment (same module)
    └─ NO (Attempts = 3) → Course Failed, Must Restart
    ↓
Module 1: Locked? NO → Can Access
    ↓
[Learn Lessons] → [Module Assessment]
    ↓
(Continue for all modules...)
    ↓
All Modules Completed? YES
    ↓
Final Assessment Unlocked
```

### Assessment Attempt Limits

**Per Module Assessment:**

- 3 maximum attempts
- Counter increments on each submission
- At 3 failed attempts: Student blocked from module, must restart course

**Final Assessment:**

- Tracks separately in `enrollment.finalAssessmentAttempts`
- Only available after ALL modules completed
- No attempt limit mentioned (check backend implementation)

### Certificate Conditions

```
Final Assessment Passed AND Score >= 70%
    ↓
certificateEarned = true
certificateId = generated
```

## Integration Points

### 1. Student Learning Page

**File:** `src/app/courses/[id]/learn/[moduleId]/[lessonId]/page.jsx`

**Changes Made:**

- Imports: `ModuleProgressionGuard`, `canAccessModule`
- State: Added `enrollment` and `showModuleGuard`
- useEffect: Fetches enrollment data on load
- useEffect: Checks module access and shows guard if locked
- JSX: Renders `ModuleProgressionGuard` modal

**Flow:**

1. Fetch course and enrollment data
2. Calculate moduleIndex from URL params
3. Check if `canAccessModule(moduleIndex, enrollment.moduleProgress)`
4. If locked, show guard modal
5. If accessible, show normal lesson content

### 2. Final Assessment Page

**File:** `src/app/courses/[id]/final-assessment/page.jsx`

**Changes Made:**

- Imports: `FinalAssessmentGuard`, `canAccessFinalAssessment`
- State: Added `enrollment` and `showGuard`
- useEffect: Fetches enrollment and checks final assessment access
- JSX: Shows guard if locked, otherwise shows assessment

**Flow:**

1. Fetch course and enrollment
2. Check if `canAccessFinalAssessment(totalModules, enrollment.moduleProgress)`
3. If not all modules completed, show `FinalAssessmentGuard`
4. If completed, show final assessment form

### 3. Course Service

**File:** `src/lib/api/courseService.ts`

**New Method Added:**

```typescript
getEnrollment: async (courseId) => {
  const response = await api.get(`/courses/${courseId}/enrollment`);
  return response.data;
};
```

Used to fetch current student's enrollment for a course.

## Backend Requirements

The following backend endpoints must implement progression logic:

### 1. GET `/courses/:courseId/enrollment`

Returns student's enrollment with moduleProgress data.

```json
{
  "studentId": "...",
  "courseId": "...",
  "moduleProgress": [
    {
      "moduleIndex": 0,
      "isCompleted": true,
      "assessmentAttempts": 1,
      "assessmentPassed": true,
      "lastScore": 85,
      "completedAt": "2024-01-15T10:30:00Z"
    },
    {
      "moduleIndex": 1,
      "isCompleted": false,
      "assessmentAttempts": 0,
      "assessmentPassed": false,
      "lastScore": 0
    }
  ],
  "finalAssessmentAttempts": 0,
  "finalAssessmentScore": 0,
  "certificateEarned": false
}
```

### 2. POST `/courses/enrollment/:enrollmentId/module/:moduleIndex/assessment`

Submits module assessment.

**Requirements:**

- Check if module is accessible (previous module passed)
- Increment `assessmentAttempts`
- If attempts >= 3 and not passed, mark for restart
- On pass: Set `assessmentPassed = true`, `isCompleted = true`
- Save score in `lastScore`

### 3. POST `/courses/enrollment/:enrollmentId/restart`

Restarts course by resetting all moduleProgress.

**Requirements:**

- Reset all moduleProgress entries to initial state
- Clear assessmentAttempts and scores
- Keep enrollmentId and studentId

### 4. POST `/courses/enrollment/:enrollmentId/final-assessment`

Submits final assessment.

**Requirements:**

- Check if ALL modules are completed with `assessmentPassed = true`
- Return 403 Forbidden if not all modules completed
- Increment `finalAssessmentAttempts`
- On pass (score >= 70%):
  - Set `certificateEarned = true`
  - Generate and save certificate
  - Return certificateId

## UI/UX Flows

### Scenario 1: Student Tries to Access Locked Module

```
Student clicks Module 2 in sidebar
    ↓
canAccessModule(2, moduleProgress) returns {canAccess: false}
    ↓
showModuleGuard = true
    ↓
ModuleProgressionGuard displays:
    - "Module Locked"
    - "Previous module assessment not passed"
    - Shows Module 1 assessment stats
    - "Attempts: 1/3"
    ↓
User clicks "Go to Previous Module"
    ↓
Navigates to Module 1 first lesson to retry assessment
```

### Scenario 2: Student Completes Module Assessment

```
Student submits Module 0 assessment (attempt 1)
    ↓
Backend: assessmentAttempts: 1, assessmentPassed: true
    ↓
Backend: Module 1 now accessible
    ↓
Frontend: Sidebar highlights Module 1 as accessible
    ↓
"Module 1 Assessment" button appears in sidebar
    ↓
Student can click Module 1 to proceed
```

### Scenario 3: Student Exhausts Attempts (3 fails)

```
Student submits Module 1 assessment (attempt 3)
    ↓
Backend: assessmentAttempts: 3, assessmentPassed: false
    ↓
ModuleProgressionGuard displays:
    - "Module Failed"
    - "You have exhausted your 3 attempts"
    - "To continue, you must restart the course"
    ↓
Course Restart Dialog appears
    ↓
On restart: All moduleProgress reset to initial state
```

### Scenario 4: Student Tries Final Assessment Without All Modules

```
Student tries to navigate to /courses/:id/final-assessment
    ↓
Frontend: canAccessFinalAssessment(5, moduleProgress)
    ├─ moduleProgress shows only 3 modules completed
    └─ Returns {canAccess: false, completedModules: 3}
    ↓
FinalAssessmentGuard displays:
    - "Final Assessment Locked"
    - "3/5 modules completed (60%)"
    - List of modules with check marks
    - "Complete all modules first"
    ↓
User sees clear path to completion
```

### Scenario 5: Student Passes Final Assessment (70%+)

```
Student submits final assessment with 75% score
    ↓
Backend:
    - Checks score >= 70% ✓
    - Sets certificateEarned = true
    - Generates certificate PDF
    - Returns certificate download link
    ↓
Frontend: Shows success modal
    - "🎉 Congratulations!"
    - Certificate preview
    - Download button
    ↓
User downloads certificate
```

## Testing Checklist

- [ ] Student cannot access Module 1 without passing Module 0 assessment
- [ ] Student sees ModuleProgressionGuard with correct message
- [ ] Student can click "Go to Previous Module" from guard
- [ ] Student can retry assessment in same module (up to 3 times)
- [ ] Student cannot take final assessment before all modules complete
- [ ] Final assessment guard shows correct progress (e.g., "3/5 modules")
- [ ] Student can take final assessment after all modules completed
- [ ] Certificate generated on 70%+ final assessment score
- [ ] Course restart clears all moduleProgress
- [ ] Sidebar shows correct module lock/unlock status visually
- [ ] Enrollment data fetches correctly without errors

## Error Handling

### Network Errors

- If enrollment fetch fails: Silently continue (shows empty guard but lets student attempt)
- If assessment submission fails: Show error toast, keep page open

### Data Inconsistencies

- If moduleProgress array doesn't exist: Initialize as empty array
- If moduleIndex out of range: Show "Module Not Found"

### Edge Cases

- Course with 0 modules: Show message, redirect to courses list
- Course with no final assessment: Can skip to courses list
- Student not enrolled: Redirect to enrollment prompt

## Performance Considerations

1. **Lazy Loading**: Final assessment guard only renders when needed
2. **Memoization**: useEffect dependencies properly specified
3. **API Calls**: Enrollment fetched once on page load
4. **Conditional Rendering**: Guards don't render if conditions met

## Future Enhancements

1. **Adaptive Difficulty**: Increase difficulty on retries
2. **Time Limits**: Add countdown timer for assessments
3. **Hints System**: Provide hints after first failed attempt
4. **Partial Credit**: Track partial scores, not just pass/fail
5. **Analytics Dashboard**: Show student progress across cohort
6. **Peer Comparison**: Anonymous leaderboard (opt-in)
7. **Early Access**: Instructor ability to unlock modules early
