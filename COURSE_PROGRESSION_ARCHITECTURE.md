# Course Progression Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        COURSE PROGRESSION SYSTEM                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          STUDENT JOURNEY                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Enroll  →  Module 0  →  Assess → Pass? → Module 1 → ... → Final   │
│             Learning       ↓                                         │
│             Lessons       Fail (< 3x) → Retry                       │
│             Videos       Fail (3x) → RESTART COURSE                 │
│                                                                       │
│  Complete All Modules → Can Access Final Assessment                 │
│  Final Assessment (70%+) → Certificate Generated                    │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                      ENROLLMENT DATA                                  │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ moduleProgress: [                                              │  │
│  │   { index: 0, attempts: 1, passed: true,  completed: true  }, │  │
│  │   { index: 1, attempts: 0, passed: false, completed: false }, │  │
│  │   { index: 2, attempts: 0, passed: false, completed: false }  │  │
│  │ ]                                                              │  │
│  │ finalAssessmentScore: 0, certificateEarned: false             │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
              ↓
         ┌────┴────┐
         ↓         ↓
    ┌─────────┐  ┌─────────────────────────┐
    │ Backend │  │ Frontend Progression    │
    │ Validate│  │ Logic Functions         │
    └────┬────┘  └──────────┬──────────────┘
         │                  │
         │                  ├─→ canAccessModule()
         │                  │
         │                  ├─→ canAccessFinalAssessment()
         │                  │
         │                  ├─→ getModuleStatus()
         │                  │
         │                  └─→ getCourseProgressData()
         │
         └─────────────────────────────────────┐
                                              ↓
    ┌────────────────────────────────────────────────────────┐
    │            GUARD COMPONENTS                            │
    ├────────────────────────────────────────────────────────┤
    │                                                         │
    │  ModuleProgressionGuard                                │
    │  ├─ Shows: "Module Locked"                            │
    │  ├─ Shows: Attempt counter (e.g., 1/3)               │
    │  ├─ Shows: Previous module requirements               │
    │  └─ Action: "Go to Previous Module"                  │
    │                                                         │
    │  FinalAssessmentGuard                                  │
    │  ├─ Shows: "Final Assessment Locked"                 │
    │  ├─ Shows: Progress (e.g., 3/5 modules)              │
    │  ├─ Shows: Module completion checklist               │
    │  └─ Shows: Percentage to completion                  │
    │                                                         │
    └────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAGE LOAD (Learning Page)                     │
└─────────────────────────────────────────────────────────────────┘
            ↓
    ┌───────────────┐
    │ GET /courses  │  (Fetch course details, modules, lessons)
    └───────┬───────┘
            ↓
    ┌──────────────────┐
    │ GET /enrollment  │  (Fetch student's moduleProgress)
    └──────┬───────────┘
           ↓
    ┌──────────────────────────────────────┐
    │ canAccessModule(moduleIndex, prog)   │
    └──────┬──────────────────────────────┘
           ├─→ YES: Show lesson content
           └─→ NO: Show ModuleProgressionGuard
                   ├─ Show attempt counter
                   ├─ Show lock reason
                   └─ Offer retry option
```

## Module Progression State Machine

```
                    ┌─────────────────────┐
                    │   FIRST ENROLL      │
                    │ (moduleProgress: [])│
                    └──────────┬──────────┘
                              ↓
                    ┌─────────────────────┐
                    │  Module 0: START    │
                    │  Attempt: 0         │
                    │  Status: IN-PROGRESS│
                    └──────────┬──────────┘
                              ↓
                    ┌─────────────────────┐
                    │ Submit Assessment   │
                    │ Attempt → 1         │
                    └──────────┬──────────┘
                              ↓
                    ┌─────────────────────┐
                    │   PASSED?           │
                    └─┬───────────────────┤
                      │ YES               │ NO
                      ↓                   ↓
            ┌──────────────────┐  ┌───────────────┐
            │ Module 0 DONE    │  │ Attempt = 2   │
            │ Module 1 UNLOCK  │  │ Show Retry    │
            │ Status: COMPLETED│  │ (can retry)   │
            └──────────┬───────┘  └─────┬─────────┘
                       ↓                ↓
              ┌──────────────────┐  ┌─────────────┐
              │ Module 1: START  │  │ SUBMIT      │
              │ Attempt: 0       │  │ (attempt=3) │
              │ Status: LOCKED   │  └──────┬──────┘
              │ (not yet)        │         ↓
              └──────────────────┘  ┌─────────────┐
                       ↓            │ FAILED?     │
              ┌──────────────────┐  └──────┬──────┘
              │ Can User Access? │         │
              │ (Module 0 PASSED)│    YES  │
              │ Yes → Show       │         ↓
              └────────────────┬─┘  ┌─────────────────┐
                              ↓     │ Max Attempts    │
              ┌──────────────────┐  │ FAILED BLOCKED  │
              │ Show Lesson      │  │ Status: FAILED  │
              │ Content          │  │ Must RESTART    │
              │ (Ready to Learn) │  │ COURSE          │
              └──────────────────┘  └─────────────────┘
```

## Final Assessment Access State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│ FINAL ASSESSMENT ACCESS CHECK                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Check: moduleProgress[0].assessmentPassed == true? ─┐            │
│        moduleProgress[1].assessmentPassed == true? ─┤            │
│        moduleProgress[2].assessmentPassed == true? ─┤ ALL?       │
│        ...                                          ─┘            │
│                                                   ↓              │
│                          ┌─────────────────────────────┐         │
│                          │ NO (Any failed or pending)  │         │
│                          └────────────┬────────────────┘         │
│                                      ↓                           │
│                      ┌────────────────────────────┐              │
│                      │ Show FinalAssessmentGuard  │              │
│                      │ ├─ Progress: 3/5 modules  │              │
│                      │ ├─ Percentage: 60%        │              │
│                      │ ├─ Checklist: ✓✓✗✗✗       │              │
│                      │ └─ "Go Back" button        │              │
│                      └────────────────────────────┘              │
│                                                                  │
│                          ┌─────────────────────────────┐         │
│                          │ YES (All modules completed) │         │
│                          └────────────┬────────────────┘         │
│                                      ↓                           │
│                      ┌────────────────────────────┐              │
│                      │ Show Final Assessment Form │              │
│                      │ ├─ Questions: 10           │              │
│                      │ ├─ Time limit: None        │              │
│                      │ └─ Passing: 70%            │              │
│                      └────────────┬───────────────┘              │
│                                  ↓                               │
│                    ┌──────────────────────────┐                  │
│                    │ Submit Assessment        │                  │
│                    │ Calculate Score          │                  │
│                    └──────────┬───────────────┘                  │
│                              ↓                                   │
│                    ┌──────────────────────────┐                  │
│                    │ Score >= 70%?            │                  │
│                    └────┬─────────────────┬───┘                  │
│                         │ YES             │ NO                   │
│                         ↓                 ↓                       │
│              ┌──────────────────┐  ┌─────────────┐              │
│              │ Generate         │  │ Show Failed │              │
│              │ Certificate      │  │ Message     │              │
│              │ certificateId:.. │  │ Can Retry?  │              │
│              │ certificateEarned│  │ (if allowed)│              │
│              │ Download PDF     │  └─────────────┘              │
│              └──────────────────┘                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Attempt Management Flow

```
┌────────────────────────────────────────────────────────────────┐
│ ASSESSMENT ATTEMPT MANAGEMENT                                   │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Initial State:                                                  │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ assessmentAttempts: 0                                   │   │
│ │ assessmentPassed: false                                 │   │
│ │ isCompleted: false                                      │   │
│ │ lastScore: 0                                            │   │
│ └─────────────────────────────────────────────────────────┘   │
│              ↓                                                   │
│ First Submission:                                               │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Student: "I'll attempt this assessment"                │   │
│ │ Click: "Submit Assessment"                             │   │
│ │ UI: "Processing... calculating score..."              │   │
│ │ Backend: Calculate answer against key                  │   │
│ │ Result: Score = 35% (FAILED)                           │   │
│ └──────────────────────────┬────────────────────────────┘   │
│                            ↓                                    │
│ Update State: assessmentAttempts: 1, lastScore: 35            │
│              ├─ Can retry? YES                                │
│              ├─ Show: "Try again! You have 2 attempts left"  │
│              └─ Button: "Retry Assessment"                    │
│                            ↓                                    │
│ Second Submission:                                              │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ assessmentAttempts: 2, lastScore: 45% (FAILED)         │   │
│ │ Show: "Try again! You have 1 attempt left"             │   │
│ │ Warning badge: "Last Attempt"                          │   │
│ └──────────────────────────┬────────────────────────────┘   │
│                            ↓                                    │
│ Third Submission:                                               │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ assessmentAttempts: 3, lastScore: 55% (FAILED)         │   │
│ │ assessmentPassed: false                                 │   │
│ │ Show: "❌ Failed - You've used all 3 attempts"         │   │
│ │ Show: "Module Locked - Course must be restarted"       │   │
│ │ Button: "Restart Course"                               │   │
│ └──────────────────────────┬────────────────────────────┘   │
│                            ↓                                    │
│ SUCCESS SCENARIO:                                               │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ assessmentAttempts: 2, lastScore: 75% (PASSED)         │   │
│ │ assessmentPassed: true                                  │   │
│ │ isCompleted: true                                       │   │
│ │ Show: "✅ Passed! Module Unlocked"                      │   │
│ │ Show: "Next Module Unlocked"                            │   │
│ │ Next: Can proceed to Module N+1                         │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│              Learning Page Component Tree                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CourseLearningPage                                             │
│  │                                                              │
│  ├─ State: enrollment, moduleProgress, currentPage             │
│  │                                                              │
│  ├─ useEffect: Fetch enrollment                                │
│  │  └─ Calls: courseService.getEnrollment(courseId)            │
│  │                                                              │
│  ├─ useEffect: Check module access                             │
│  │  └─ Calls: canAccessModule(moduleIndex, moduleProgress)    │
│  │     ├─ If locked: setShowModuleGuard(true)                 │
│  │     └─ If accessible: setShowModuleGuard(false)            │
│  │                                                              │
│  ├─ Render: ModuleProgressionGuard (conditional)              │
│  │  ├─ Props: moduleIndex, modules, enrollment                │
│  │  ├─ onClose: Close guard                                   │
│  │  └─ onProceed: Navigate to previous module                 │
│  │                                                              │
│  └─ Render: Main Content (when not locked)                    │
│     ├─ LessonSection: Lesson content                          │
│     ├─ QuestionsSection: Knowledge check                      │
│     └─ AssessmentSection: Module assessment                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Final Assessment Page Component Tree

```
┌─────────────────────────────────────────────────────────────────┐
│          Final Assessment Page Component Tree                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FinalAssessmentPage                                            │
│  │                                                              │
│  ├─ State: enrollment, course, showGuard, submitted            │
│  │                                                              │
│  ├─ useEffect: Fetch course and enrollment                     │
│  │  └─ Check: canAccessFinalAssessment(totalModules, prog)     │
│  │     ├─ If locked: setShowGuard(true)                       │
│  │     └─ If accessible: setShowGuard(false)                  │
│  │                                                              │
│  ├─ Render: FinalAssessmentGuard (conditional, if showGuard)   │
│  │  ├─ Props: course, enrollment                              │
│  │  └─ onClose: router.push(/courses/:id)                    │
│  │                                                              │
│  └─ Render: Assessment Form (when showGuard is false)          │
│     ├─ Questions: course.finalAssessment.questions             │
│     ├─ Submit: handleSubmit()                                  │
│     └─ Results: Show score and certificate                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Types & Interfaces

```typescript
// ┌─────────────────────────────────────────────────────────┐
// │ ModuleProgress - Individual module tracking             │
// ├─────────────────────────────────────────────────────────┤
interface ModuleProgress {
  moduleIndex: number; // 0, 1, 2, ...
  isCompleted: boolean; // true when lessons done
  assessmentAttempts: number; // 0, 1, 2, 3
  assessmentPassed: boolean; // true if score passed
  lastScore: number; // 0-100
  completedAt?: Date;
}

// ┌─────────────────────────────────────────────────────────┐
// │ Enrollment - Student course enrollment                  │
// ├─────────────────────────────────────────────────────────┤
interface Enrollment {
  _id: string; // MongoDB ID
  studentId: string;
  courseId: string;
  moduleProgress: ModuleProgress[]; // Array of modules
  finalAssessmentAttempts: number; // 0-3
  finalAssessmentScore: number; // 0-100
  certificateId?: string;
  certificateEarned: boolean;
}

// ┌─────────────────────────────────────────────────────────┐
// │ AccessResult - Progression check result                 │
// ├─────────────────────────────────────────────────────────┤
interface AccessResult {
  canAccess: boolean; // true/false
  reason: string; // "Module X is locked..."
  completedModules?: number; // For final assessment
}
```

## Error Handling Flow

```
┌──────────────────────────────────────────────────────┐
│ Error Scenario: Enrollment fetch fails               │
├──────────────────────────────────────────────────────┤
│                                                      │
│ courseService.getEnrollment()                       │
│ └─→ Network error or 404                            │
│                                                      │
│ Catch block: console.log("enrollment error")        │
│ Fallback: enrollment = null                         │
│                                                      │
│ Result:                                             │
│ ├─ showModuleGuard = false (not shown)             │
│ ├─ Student can view lesson                         │
│ ├─ Backend will validate access on submission      │
│ └─ No UI crashes                                   │
│                                                      │
│ Benefit: Graceful degradation if server offline   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## Performance Optimizations

```
┌──────────────────────────────────────────────────────┐
│ Optimization Strategies Implemented                   │
├──────────────────────────────────────────────────────┤
│                                                      │
│ 1. Lazy Loading                                     │
│    └─ Guards only render when needed                │
│                                                      │
│ 2. Conditional Rendering                           │
│    └─ Main content not rendered if guard showing    │
│                                                      │
│ 3. Single Enrollment Fetch                         │
│    └─ Loaded once on page mount, not per render    │
│                                                      │
│ 4. Pure Functions                                  │
│    └─ progressionLogic functions have no side      │
│       effects (fast, testable, cacheable)          │
│                                                      │
│ 5. Dependency Optimization                         │
│    └─ useEffect dependencies properly specified     │
│       (prevents unnecessary re-checks)              │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

This diagram shows the complete flow and relationships between all components in the course progression system.
