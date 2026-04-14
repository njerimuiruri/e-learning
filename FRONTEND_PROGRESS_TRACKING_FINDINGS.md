# elearning Frontend: Progress Tracking & Lesson Completion Analysis

## Executive Summary

The frontend has a well-structured progress tracking system that:

- ✅ Fetches enrollment data with lesson progress on load
- ✅ Displays real-time progress bars (X of Y lessons completed)
- ✅ Calls completion APIs and updates local state
- ✅ Shows "My Knowledge Check" after all lessons complete
- ⚠️ **ONLY displays progress on main lesson page** (not updated in module browse cards)
- ⚠️ Progress bar updates only reflect **local state** after API calls, not refetch

---

## 1. API Calls for Lesson Completion

### Service: `moduleEnrollmentService` ([src/lib/api/moduleEnrollmentService.ts](src/lib/api/moduleEnrollmentService.ts))

```typescript
// Primary completion endpoint
async completeLesson(enrollmentId, lessonIndex) {
  const response = await api.put(
    `/${enrollmentId}/lessons/${lessonIndex}/complete`
  );
  return response.data;
}

// Lesson-level assessment submission
async submitLessonAssessment(enrollmentId, lessonIndex, answers) {
  const response = await api.post(
    `/${enrollmentId}/lessons/${lessonIndex}/assessment`,
    { answers }
  );
  return response.data;
}

// Track engagement (time spent, scroll depth)
async trackSlideProgress(
  enrollmentId, lessonIndex, slideIndex,
  timeSpent, scrolledToBottom
) {
  const response = await api.put(
    `/${enrollmentId}/lessons/${lessonIndex}/slides/${slideIndex}/progress`,
    { timeSpent, scrolledToBottom }
  );
  return response.data;
}

// Final module assessment
async submitFinalAssessment(enrollmentId, answers) {
  const response = await api.post(
    `/${enrollmentId}/final-assessment`,
    { answers }
  );
  return response.data;
}
```

**Base URL**: `${API_URL}/module-enrollments`

---

## 2. How Progress is Displayed & Updated

### Primary Component: [src/app/(dashboard)/student/modules/[id]/page.jsx](<src/app/(dashboard)/student/modules/[id]/page.jsx>)

#### 2.1 Real-Time Progress Calculation (Lines 220-225)

```jsx
// Computed locally from enrollment state (recalculates on render)
const completedCount =
  enrollment?.lessonProgress?.filter((lp) => lp.isCompleted).length ?? 0;
const safeProgress =
  totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
```

**KEY POINT**: Progress is calculated **client-side** from current enrollment state, NOT fetched from server.

#### 2.2 Progress Display in Course Outline Sidebar (Lines 568-575)

```jsx
{/* Progress bar in sidebar */}
<div className="flex items-center gap-2">
  <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-200">
    <div
      className="h-full bg-[#021d49] rounded-full transition-all duration-500"
      style={{ width: `${safeProgress}%` }}
    />
  </div>
  <span className="text-xs font-bold text-[#021d49]">{safeProgress}%</span>
</div>
<p className="text-[11px] mt-1">
  {completedCount} of {totalLessons} lessons completed
</p>
```

**Display**: Shows `X of Y lessons completed` text next to animated progress bar

#### 2.3 Individual Lesson Progress Circles

Each lesson shows a circular progress indicator:

- ✅ **Completed**: Blue check circle
- 🔒 **Locked**: Lock icon
- ⏳ **In Progress**: SVG circle with progress percentage
  - Shows `{currentSlidesCompleted} / {totalSlides}`

**Code**: [Lines 100-130](<src/app/(dashboard)/student/modules/[id]/page.jsx#L100-L130>)

### Module Browse Page: [src/app/(dashboard)/student/modules/page.jsx](<src/app/(dashboard)/student/modules/page.jsx>)

#### Progress Display on Cards (Lines 700-710)

```jsx
{
  isEnrolled && (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-gray-500">Your progress</span>
        <span className="text-[10px] font-bold text-[#021d49]">
          {Math.min(100, Math.round(enrollment.progress || 0))}%
        </span>
      </div>
      <Progress
        value={Math.min(100, Math.round(enrollment.progress || 0))}
        className="h-1.5"
      />
    </div>
  );
}
```

**KEY ISSUE**: Uses `enrollment.progress` field directly from API response, **NOT** recalculated.

---

## 3. Components Showing Lesson Progress ("X of Y Lessons Completed")

### Main Lesson Page Sidebar

**Component**: [src/app/(dashboard)/student/modules/[id]/page.jsx#L570](<src/app/(dashboard)/student/modules/[id]/page.jsx#L570>)

Shows:

- Progress percentage (0-100%)
- Completion text: `{completedCount} of {totalLessons} lessons completed`

### Module Progression Guard

**Component**: [src/components/ModuleProgressionGuard.jsx](src/components/ModuleProgressionGuard.jsx)

- Checks module unlock requirements
- Uses `moduleProgress` from enrollment to determine access
- Used on multi-module courses

### Final Assessment Guard

**Component**: [src/components/FinalAssessmentGuard.jsx](src/components/FinalAssessmentGuard.jsx)

- Shows course progress chart when final assessment locked
- Displays module completion status: `Module 1: ✓ Completed`, `Module 2: ⏳ In Progress`
- Shows completion percentage

---

## 4. "My Knowledge Check" (Final Assessment)

**Location**: [src/app/(dashboard)/student/modules/[id]/page.jsx#L550-565](<src/app/(dashboard)/student/modules/[id]/page.jsx#L550-565>)

```jsx
{
  /* My Knowledge Check - UNLOCKED AFTER ALL LESSONS COMPLETE */
}
<button
  onClick={() => {
    if (allLessonsCompleted) {
      setShowFinalAssessment(true);
      setShowLessonAssessment(false);
      if (window.innerWidth < 1024) setSidebarCollapsed(true);
    }
  }}
  disabled={!allLessonsCompleted}
  className={`w-full flex items-center justify-between px-4 py-3.5 text-sm font-bold 
    transition-colors disabled:opacity-40 disabled:cursor-not-allowed
    ${
      showFinalAssessment
        ? "bg-blue-50 text-green-700"
        : "text-gray-800 hover:bg-gray-50"
    }`}
>
  <span className="flex items-center gap-2">
    <Icons.BarChart2 className="w-4 h-4 text-green-600" />
    My Knowledge Check
  </span>
  <div className="flex items-center gap-1.5">
    {enrollment?.finalAssessmentPassed && (
      <Icons.CheckCircle className="w-3.5 h-3.5 text-green-500" />
    )}
    <Icons.RefreshCw className="w-3.5 h-3.5 text-gray-400" />
  </div>
</button>;
```

**Unlock Condition**: `allLessonsCompleted` = all lessons have `isCompleted === true`

---

## 5. State Management for Progress

### Data State in Main Lesson Page (Lines 113-130)

```jsx
// Enrollment data (from API)
const [enrollment, setEnrollment] = useState(null);
const [moduleData, setModuleData] = useState(null);

// Lesson progress state
const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
const [liveSlideIndex, setLiveSlideIndex] = useState(0);
const [showLessonAssessment, setShowLessonAssessment] = useState(false);
const [showFinalAssessment, setShowFinalAssessment] = useState(false);
```

### Progress Update Flow

1. **On Mount** ([Line 146](<src/app/(dashboard)/student/modules/[id]/page.jsx#L146>)): Fetch enrollment

   ```jsx
   useEffect(() => {
     if (moduleId) fetchModuleData();
   }, [moduleId]);
   ```

2. **On Completion** ([Lines 234-260](<src/app/(dashboard)/student/modules/[id]/page.jsx#L234-L260>)):

   ```jsx
   const handleCompleteLesson = async () => {
     try {
       setCompleting(true);
       const result = await moduleEnrollmentService.completeLesson(
         enrollment._id,
         currentLessonIndex,
       );
       // ✅ Update state with returned enrollment data
       const updatedEnrollment = result.enrollment ?? result;
       setEnrollment(updatedEnrollment);

       // Navigate to next lesson or assessment
       if (result.navigateTo === "final_assessment")
         setShowFinalAssessment(true);
     } catch (err) {
       alert(err.response?.data?.message || "Failed to mark lesson complete");
     } finally {
       setCompleting(false);
     }
   };
   ```

3. **Progress Recalculates** Automatically when `enrollment` state updates

### Slide Progress Tracking (LessonViewer Component)

**Component**: [src/components/student/LessonViewer.jsx](src/components/student/LessonViewer.jsx)

Uses custom hook: `useEngagementTracker` ([src/hooks/useEngagementTracker.js](src/hooks/useEngagementTracker.js))

```jsx
// Tracks per-slide engagement
const {
  containerRef,
  timeSpent,
  canProceed,
  remainingTime,
  progressPercent,
  resetTracker,
} = useEngagementTracker({
  minViewingTime: currentSlide?.minViewingTime ?? 15,
  scrollTrackingEnabled: currentSlide?.scrollTrackingEnabled ?? false,
  onSlideComplete: ({ timeSpent: t, scrolledToBottom: s }) => {
    handleSlideComplete(currentSlideIndex, t, s);
  },
});

const handleSlideComplete = useCallback(
  (slideIndex, time, scrolled) => {
    setCompletedSlides((prev) => {
      const next = new Set(prev);
      next.add(slideIndex);
      return next;
    });
    reportSlideProgressToServer(slideIndex, time, scrolled);
  },
  [reportSlideProgressToServer],
);
```

**When Called**: Every time a slide meets requirements (time + scroll):

- Sets slide as completed locally
- Calls `trackSlideProgress()` API with delay/debounce
- Also called every 5 seconds while on a slide

---

## 6. How Frontend Fetches and Displays Progress

### Initial Load: [Lines 156-175](<src/app/(dashboard)/student/modules/[id]/page.jsx#L156-L175>)

```jsx
const fetchModuleData = async () => {
  try {
    setLoading(true);
    setError("");

    const [mod, enrollmentData] = await Promise.all([
      moduleService.getModuleById(moduleId),
      moduleEnrollmentService
        .getMyEnrollmentForModule(moduleId)
        .catch(() => null), // Optional - student can view before enrolling
    ]);

    setModuleData(mod);
    setEnrollment(enrollmentData);

    // Restore last accessed lesson
    if (enrollmentData?.lastAccessedLesson != null)
      setCurrentLessonIndex(enrollmentData.lastAccessedLesson);
  } catch (err) {
    setError("Failed to load module");
  } finally {
    setLoading(false);
  }
};
```

**API Endpoints Called**:

- `GET /modules/${moduleId}` — Module metadata + lessons/slides
- `GET /module-enrollments/modules/${moduleId}/my-enrollment` — Student's progress

### Progress Data Structure Received

```typescript
interface ModuleEnrollment {
  _id: string;
  moduleId: string;
  studentId: string;

  // Progress fields
  progress: number; // 0-100%
  completedLessons: number; // Count of completed
  totalLessons: number; // Total in module

  // Detailed lesson tracking
  lessonProgress: {
    lessonIndex: number;
    isCompleted: boolean;
    assessmentPassed: boolean;
    slideProgress: {
      slideIndex: number;
      isCompleted: boolean;
      timeSpent: number;
      scrolledToBottom: boolean;
    }[];
  }[];

  // Module-level assessment
  finalAssessmentPassed: boolean;
  isCompleted: boolean;

  // State flags
  lastAccessedLesson: number;
  requiresModuleRepeat: boolean;
}
```

---

## 7. What Triggers API Calls for Completion

### Trigger 1: Mark Lesson Complete Button

**When**: Student clicks "Mark as complete" button after viewing content
**Code**: [Line 234](<src/app/(dashboard)/student/modules/[id]/page.jsx#L234>)
**API Called**: `PUT /module-enrollments/{enrollmentId}/lessons/{lessonIndex}/complete`
**State Update**: `setEnrollment(result.enrollment)` → Progress recalculates

### Trigger 2: Submit Lesson Assessment

**When**: Student takes and submits lesson quiz
**Code**: [Lines 274-290](<src/app/(dashboard)/student/modules/[id]/page.jsx#L274-L290>)
**API Called**: `POST /module-enrollments/{enrollmentId}/lessons/{lessonIndex}/assessment`
**State Update**: `setEnrollment(result.enrollment)` → Reflects pass/fail

### Trigger 3: Track Slide Progress

**When**: Student views each slide for required duration + scroll
**Code**: [LessonViewer.jsx Lines 108-122](src/components/student/LessonViewer.jsx#L108-L122)
**API Called**: `PUT /module-enrollments/{enrollmentId}/lessons/{lessonIndex}/slides/{slideIndex}/progress`
**State Update**: Slide marked complete locally, no enrollment refetch

### Trigger 4: Submit Final Assessment

**When**: Student completes all lessons and submits final exam
**Code**: [Lines 318-330](<src/app/(dashboard)/student/modules/[id]/page.jsx#L318-L330>)
**API Called**: `POST /module-enrollments/{enrollmentId}/final-assessment`
**State Update**: `setEnrollment(result.enrollment)` → `isCompleted = true`

---

## 8. After Completion: Does Frontend Refetch Progress?

### ❌ **NO** — Progress NOT Refetched from Server

**Current Behavior**:

1. Student marks lesson complete → API call
2. Backend returns updated `enrollment` object
3. Frontend updates local state: `setEnrollment(result.enrollment)`
4. Progress bar updates from NEW enrollment data
5. **Does NOT** call `getMyEnrollmentForModule()` again
6. **Does NOT** make separate progress fetch

**Why This Works (Mostly)**:

- Backend returns full `enrollment` object in completion response
- Contains updated `lessonProgress` array
- Frontend can recalculate progress from returned data immediately

**Potential Issue**:

- If API response is incomplete or delayed, frontend shows stale data
- No background sync or polling to verify server state

### Code Evidence

```jsx
const result = await moduleEnrollmentService.completeLesson(
  enrollment._id,
  currentLessonIndex,
);
const updatedEnrollment = result.enrollment ?? result;
setEnrollment(updatedEnrollment); // ← Uses returned data, NO refetch
```

---

## 9. Custom Hooks for Progress

### `useEngagementTracker.js` - [src/hooks/useEngagementTracker.js](src/hooks/useEngagementTracker.js)

**Purpose**: Track time spent + scroll depth on slides

**Return Values**:

```typescript
{
  containerRef: RefObject,           // Attach to scrollable div
  timeSpent: number,                 // Seconds spent on slide
  scrolledToBottom: boolean,         // 90%+ scrolled
  meetsTimeReq: boolean,             // timeSpent >= minViewingTime
  canProceed: boolean,               // Both time + scroll satisfied
  resetTracker: () => void,          // Call when changing slides
  remainingTime: number,             // Seconds until complete
  progressPercent: number,           // Visual progress (0-100)
}
```

**Bug Fixed** (in code comments):

- Previous version had timer restart issue due to React skipping re-runs
- Fixed by using `timerKey` counter to force effect re-run on reset

---

## 10. Progression Logic (Module → Module Access)

### `courseProgressionLogic.js` - [src/lib/utils/courseProgressionLogic.js](src/lib/utils/courseProgressionLogic.js)

Used by guard components to control access:

```javascript
// Check if student can access a module
canAccessModule(moduleIndex, moduleProgress)
  → Returns { canAccess, reason }
  → First module always accessible
  → Others require previous module + assessment passed

// Check if student can take final assessment
canAccessFinalAssessment(totalModules, moduleProgress)
  → All modules must have assessmentPassed = true

// Get unlock requirements
getModuleUnlockRequirements(moduleIndex, modules, moduleProgress)
  → Returns { required, message, attempts, remainingAttempts }

// Get module status
getModuleStatus(moduleIndex, moduleProgress)
  → Returns 'locked' | 'in-progress' | 'completed' | 'failed'
```

---

## 11. Missing/Stale Progress Updates

### Issues Found

#### Issue 1: Browse Page Progress Not Updated on Page Focus

**Location**: [src/app/(dashboard)/student/modules/page.jsx](<src/app/(dashboard)/student/modules/page.jsx>)

```jsx
const fetchInitialData = async () => {
  const enrollments = await moduleEnrollmentService.getMyEnrollments();
  setMyEnrollments(enrollList);
};

useEffect(() => {
  fetchInitialData();
}, []); // ← Only on initial mount
```

**Problem**:

- Enrollments fetched once on mount
- If user completes a lesson, goes back to browse page, progress shows OLD value
- No refetch on page visibility or focus

**Fix Needed**:

```jsx
// Add visibility listener
useEffect(() => {
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      fetchInitialData(); // Refetch on tab focus
    }
  };
  document.addEventListener("visibilitychange", handleVisibilityChange);
  return () =>
    document.removeEventListener("visibilitychange", handleVisibilityChange);
}, []);
```

#### Issue 2: Enrollment Object Inconsistency

**Location**: Multiple places read `enrollment.progress` field

**Problem**:

- Some code uses `enrollment.progress` (0-100% from backend)
- Some code calculates `(completedLessons / totalLessons) * 100`
- If backend calculation differs from frontend, displays misalign

**Evidence**:

```jsx
// Browse page (uses server value)
{Math.round(enrollment.progress || 0)}%

// Lesson page (recalculates)
const safeProgress = totalLessons > 0
  ? Math.round((completedCount / totalLessons) * 100)
  : 0;
```

---

## 12. Summary: Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                 FRONTEND PROGRESS FLOW                       │
└─────────────────────────────────────────────────────────────┘

1. STUDENT LOADS LESSON PAGE
   ├─ GET /modules/:moduleId
   ├─ GET /module-enrollments/modules/:moduleId/my-enrollment
   └─ setEnrollment(data) → Progress calculated locally

2. SIDEBAR DISPLAYS PROGRESS
   ├─ Progress bar: (completedLessons / totalLessons) * 100%
   └─ Text: "{completedCount} of {totalLessons} lessons completed"

3. STUDENT VIEWS SLIDES
   ├─ useEngagementTracker tracks time + scroll
   ├─ On slide complete: PUT /.../.../slides/.../progress
   └─ Updates local slideProgress, NO enrollment refetch

4. STUDENT MARKS LESSON COMPLETE
   ├─ Click "Mark as Complete"
   ├─ PUT /module-enrollments/:id/lessons/:idx/complete
   ├─ Backend returns updated enrollment object
   ├─ setEnrollment(result.enrollment)
   ├─ Progress bar updates automatically
   └─ If assessment needed: show quiz modal

5. STUDENT COMPLETES ALL LESSONS
   ├─ "My Knowledge Check" button becomes enabled
   ├─ Shows lock icon until all lessons done
   └─ Reflects enrollment.finalAssessmentPassed status

6. STUDENT SUBMITS FINAL ASSESSMENT
   ├─ POST /module-enrollments/:id/final-assessment
   ├─ Backend sets isCompleted = true
   ├─ setEnrollment(result.enrollment)
   └─ Shows completion screen

7. STUDENT GOES TO BROWSE PAGE
   ├─ fetchInitialData() on mount only
   ├─ Displays myEnrollments[].progress from initial fetch
   ├─ ❌ Does NOT refetch if student just completed
   └─ Shows STALE progress value!
```

---

## Reference Files

| File                                                                                                     | Purpose                                   |
| -------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| [src/lib/api/moduleEnrollmentService.ts](src/lib/api/moduleEnrollmentService.ts)                         | API calls for enrollment & completion     |
| [src/app/(dashboard)/student/modules/[id]/page.jsx](<src/app/(dashboard)/student/modules/[id]/page.jsx>) | Main lesson viewer page + sidebar         |
| [src/app/(dashboard)/student/modules/page.jsx](<src/app/(dashboard)/student/modules/page.jsx>)           | Browse modules, display progress on cards |
| [src/components/student/LessonViewer.jsx](src/components/student/LessonViewer.jsx)                       | Lesson slides + assessment rendering      |
| [src/hooks/useEngagementTracker.js](src/hooks/useEngagementTracker.js)                                   | Track time spent & scroll depth           |
| [src/lib/utils/courseProgressionLogic.js](src/lib/utils/courseProgressionLogic.js)                       | Module unlock/access rules                |
| [src/components/ModuleProgressionGuard.jsx](src/components/ModuleProgressionGuard.jsx)                   | Guard for module access                   |
| [src/components/FinalAssessmentGuard.jsx](src/components/FinalAssessmentGuard.jsx)                       | Guard for final assessment                |
