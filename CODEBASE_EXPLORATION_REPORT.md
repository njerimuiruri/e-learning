# E-Learning Frontend Codebase Exploration Report

## Executive Summary

The e-learning frontend is a Next.js application with two main learning paths:

1. **Courses path** (`/courses/[courseId]/learn/...`) - Traditional course with sequential modules and lessons
2. **Modules path** (`/student/modules/[moduleId]`) - Direct module learning

Both paths enforce strict linear progression through modules and lessons with assessment gating, ensuring students complete content in the prescribed order.

---

## 1. Module Display & Sequence Information

### 1.1 How Modules Are Displayed

#### Course Learning Page (`src/app/courses/[id]/learn/[moduleId]/[lessonId]/page.jsx`)

- **Left Sidebar (Course Outline)**: Shows all modules in course hierarchy
- **Visual Indicators**:
  - Module number (1, 2, 3...)
  - Module title
  - Completion status (checkmark, lock icon, or play icon)
  - Expansion arrow to show lessons

**Module Display Code**:

```jsx
{course.modules.map((m, mIdx) => {
    const modId = `${m._id || mIdx}`;
    const isCurrentModule = modId === `${moduleParam}`;
    const moduleLessons = m.lessons || [];

    return (
        <div key={modId} className="border rounded-lg">
            <button className="...">
                <div className="flex items-center gap-3">
                    {/* Module status indicator */}
                    {moduleCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                        <span>{mIdx + 1}</span>  {/* Module number */}
                    )}
                    <div className="flex-1">
                        <span className="text-xs">Module {mIdx + 1}</span>
                        <span className="text-sm font-bold">{m.title}</span>
                    </div>
                </div>
            </button>

            {/* Lessons under this module */}
            {expandedModules.includes(modId) && (
                <div className="bg-gray-50">
                    {moduleLessons.map((l, lIdx) => (
                        <button
                            className="flex items-center gap-3 p-3"
                            disabled={locked}
                        >
                            <CircleProgress
                                completed={isCompleted}
                                locked={locked}
                            />
                            <span>{l.title}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
})}
```

#### Student Modules Page (`src/app/(dashboard)/student/modules/[id]/page.jsx`)

- **Sidebar Course Outline Tab**: Displays lessons with progress bars
- **Shows**:
  - Intro video entry (if exists)
  - Module progress indicator
  - Lesson list with completion percentage
  - "My Knowledge Check" (final assessment) entry
  - Download module button

### 1.2 Order/Sequence Information

**Module Ordering**:

- ✅ **Modules are ordered sequentially**: `course.modules` array maintains order
- ✅ **Lessons are ordered sequentially**: `module.lessons` array maintains order
- ✅ **Slides are explicitly sorted by order field**:
  ```javascript
  const slides = (lesson?.slides || []).sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
  ```

**Sequence Display Examples**:

- Sidebar shows "Module 1", "Module 2", "Module 3"
- Each module shows lesson count and completion
- Locked modules show lock icon
- Completed modules show green checkmark

---

## 2. Lesson Navigation & Progression Logic

### 2.1 Lesson Navigation UI

#### Navigation Buttons (Courses Path)

Located in `/courses/[id]/learn/[moduleId]/[lessonId]/page.jsx`

**Previous Button**:

- ✅ Always visible when not on first lesson
- ✅ Navigates to `lessons[currentLessonIndex - 1]`
- ✅ Route: `/courses/{courseId}/learn/{moduleParam}/{prevLessonId}`

**Next Button**:

- ✅ Always visible at bottom of lesson
- ✅ First marks lesson as completed
- ✅ Navigates to next lesson if exists
- ✅ Opens module assessment if on last lesson

**Code**:

```javascript
const handlePrevious = () => {
  const currentLessonIndex = lessonIndex;
  const prevLesson = lessons[currentLessonIndex - 1];

  if (prevLesson) {
    router.push(
      `/courses/${courseId}/learn/${moduleParam}/${prevLesson._id || currentLessonIndex - 1}`,
    );
    setAnswers({});
    setCurrentPage("lesson");
  }
};

const handleNext = async () => {
  // Mark lesson complete if not already
  if (!completedLessons.includes(lessonIndex)) {
    const newCompletedLessons = [...completedLessons, lessonIndex];
    setCompletedLessons(newCompletedLessons);

    const newXP = totalXP + (activeLesson?.xpReward || 50);
    setTotalXP(newXP);

    // Persist to server
    await persistLessonProgress({
      moduleIdx: moduleIndex,
      lessonIdx: lessonIndex,
      completed: true,
    });
  }

  const currentLessonIndex = lessonIndex;
  const nextLesson = lessons[currentLessonIndex + 1];

  if (nextLesson) {
    // Navigate to next lesson
    router.push(
      `/courses/${courseId}/learn/${moduleParam}/${nextLesson._id || currentLessonIndex + 1}`,
    );
    setAnswers({});
    setCurrentPage("lesson");
  } else {
    // Last lesson - open module assessment
    setCurrentPage("assessment");
  }
};
```

#### Navigation in Student Modules Path

```javascript
const navigateToLesson = (index) => {
  // Access control check
  if (!isLessonAccessible(index) && !isLessonCompleted(index)) return;

  setCurrentLessonIndex(index);
  setShowFinalAssessment(false);
  setShowLessonAssessment(false);
};

// Lesson accessibility logic
const isLessonCompleted = (index) =>
  getLessonProgress(index)?.isCompleted || false;

const isLessonAccessible = (index) =>
  index === 0 || isLessonCompleted(index - 1);
```

### 2.2 Progression Logic & Conditions

#### Lesson Progression Constraints

**File**: `src/lib/utils/courseProgressionLogic.js`

**Access Control**:

```javascript
export function canAccessModule(moduleIndex, moduleProgress = []) {
  // First module (index 0) is always accessible
  if (moduleIndex === 0) {
    return { canAccess: true, reason: "First module is always accessible" };
  }

  // Check if previous module is completed and assessment passed
  const previousModuleProgress = moduleProgress.find(
    (mp) => mp.moduleIndex === moduleIndex - 1,
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
      reason: `Module ${moduleIndex} is locked.`,
    };
  }

  return { canAccess: true, reason: "Module is accessible" };
}
```

#### Conditions That Prevent Moving to Next Lesson

1. **Module Lock (Cannot even enter module)**:
   - Previous module assessment not passed
   - Shown by `ModuleProgressionGuard` component
2. **Lesson not yet completed within module**:
   - Student can move forward but lesson marked incomplete
   - Next button still works
3. **Module Assessment not passed**:
   - Prevents moving to next module
   - Shows `ModuleProgressionGuard` when attempting
   - 3 attempts per assessment
   - After 3 failures: module permanently locked

4. **Slide Requirements not met**:
   - Within `LessonViewer`, slides can have:
     - `minViewingTime`: Must watch minimum seconds
     - `scrollTrackingEnabled`: Must scroll to bottom
   - Engagement tracker tracks these
   - Can still proceed but tracked

### 2.3 "Next" Button Behavior Details

**What happens when Next is clicked**:

1. ✅ **Mark current lesson complete** (if not already):

   ```javascript
   await persistLessonProgress({
     moduleIdx: moduleIndex,
     lessonIdx: lessonIndex,
     completed: true,
   });
   ```

2. ✅ **Award XP**:

   ```javascript
   const newXP = totalXP + (activeLesson?.xpReward || 50);
   setTotalXP(newXP);
   ```

3. ✅ **Get next lesson**:

   ```javascript
   const nextLesson = lessons[currentLessonIndex + 1];
   ```

4. ✅ **Navigate or show assessment**:
   - If next lesson exists: `/courses/{courseId}/learn/{moduleId}/{nextLessonId}`
   - If last lesson: Show module assessment view

### 2.4 Sidebar Navigation

**Features**:

- Click any lesson in current module (no restrictions)
- Lock icon on lessons in locked modules
- Green checkmark on completed lessons
- Blue highlight on current lesson
- Lesson duration displayed below title
- Overall progress bar at top

---

## 3. Category Browsing & Module Fetching

### 3.1 Category Browsing Page

**File**: `src/app/modules/page.jsx`

#### Page Flow

```
1. Load published modules + all categories (parallel)
2. Display category buttons in a grid
3. User selects category → filters modules
4. Show detailed category panel with info + access controls
5. Display filtered module cards
```

#### Category Selection UI

```jsx
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
  {/* All Categories button */}
  <button
    onClick={() => setActiveCategory(null)}
    className={activeCategory ? "bg-white" : "bg-[#021d49] text-white"}
  >
    <Layers className="w-4 h-4" />
    <p>All Categories</p>
    <p className="text-xs">{modules.length} modules</p>
  </button>

  {/* Category buttons */}
  {categories.map((cat) => {
    const catModCount = modules.filter(
      (m) => (m.categoryId?._id || m.categoryId) === cat._id,
    ).length;

    return (
      <button
        onClick={() => handleCategorySelect(cat._id)}
        className={isActive ? "bg-[#021d49] text-white" : "bg-white"}
      >
        <BookOpen className="w-4 h-4" />
        <p>{cat.name}</p>
        <p className="text-xs">{catModCount} modules</p>
        {/* Access badges */}
        {isPaid && <span>KES {price}</span>}
        {isFellowOnly && <span>Fellows Only</span>}
      </button>
    );
  })}
</div>
```

### 3.2 How Modules are Fetched by Category

**API Calls**:

1. **Load all published modules**:

   ```javascript
   const modulesData = await moduleService.getAllModules({
     status: "published",
   });
   ```

   - From: `src/lib/api/moduleService.ts`
   - Returns: Array of all published modules

2. **Load all categories**:

   ```javascript
   const categoriesData = await categoryService.getAllCategories();
   ```

   - From: `src/lib/api/categoryService.ts`
   - Returns: Array of all categories

3. **Get category details** (on category select):

   ```javascript
   const categoryFull = await categoryService.getCategoryById(activeCategory);
   ```

4. **Filter locally** (no backend filtering):
   ```javascript
   const filteredModules = useMemo(() => {
     let list = modules;

     // Filter by category
     if (activeCategory) {
       list = list.filter(
         (m) => (m.categoryId?._id || m.categoryId) === activeCategory,
       );
     }

     // Filter by level
     if (activeLevel !== "all") {
       list = list.filter((m) => m.level === activeLevel);
     }

     // Filter by search
     if (searchQuery.trim()) {
       const q = searchQuery.toLowerCase();
       list = list.filter(
         (m) =>
           m.title?.toLowerCase().includes(q) ||
           m.description?.toLowerCase().includes(q),
       );
     }

     return list;
   }, [modules, activeCategory, activeLevel, searchQuery]);
   ```

### 3.3 Module Fetching Implementation

**moduleService.ts** Methods:

```typescript
// Get all published modules (with optional filters)
async getAllModules(filters: {
    category?: string;
    level?: string;
    search?: string;
    page?: number;
    limit?: number
} = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.level) params.append('level', filters.level);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const response = await api.get(`/?${params.toString()}`);
    return response.data;
}

// Get single module by ID (includes lessons, slides, etc.)
async getModuleById(moduleId) {
    const response = await api.get(`/${moduleId}`);
    return response.data;
}

// Get modules by category and level
async getModulesByLevelAndCategory(categoryId, level) {
    const response = await api.get(`/category/${categoryId}/level/${level}`);
    return response.data;
}
```

### 3.4 Category System Design

**Category Model**:

- `_id`: Unique identifier
- `name`: Display name
- `description`: Short description
- `courseDescription`: Detailed programme description
- `overallObjectives`: Learning objectives
- `learningOutcomes`: Expected outcomes
- `price`: One-time cost
- `accessType`: 'free' | 'paid' | 'restricted'
- `isPaid`: Boolean flag

**Access Control Logic**:

```javascript
function resolveAccess(cat) {
  if (!cat) return { isPaid: false, isFellowOnly: false, isRestricted: false };

  const at = cat.accessType?.toLowerCase();
  if (at === "free")
    return { isPaid: false, isFellowOnly: true, isRestricted: false };
  if (at === "restricted")
    return { isPaid: true, isFellowOnly: false, isRestricted: true };
  if (cat.isPaid === true || at === "paid")
    return { isPaid: true, isFellowOnly: false, isRestricted: false };

  return { isPaid: false, isFellowOnly: false, isRestricted: false };
}
```

**Module-to-Category Relationship**:

- Each module has: `categoryId` (string or populated object)
- Filtering: `m.categoryId?._id || m.categoryId === activeCategory`
- Modules can belong to only ONE category

### 3.5 Category Information Panel

When category selected, displays:

- Category title
- Description with HTML stripping
- Full course description (HTML)
- Overall objectives
- Learning outcomes
- Module count
- Pricing badge
- Access badge (Fellows/Restricted/Free)

---

## 4. Component Architecture

### Key Components

| Component                | Location                                            | Purpose                                     |
| ------------------------ | --------------------------------------------------- | ------------------------------------------- |
| `LessonViewer`           | `src/components/student/LessonViewer.jsx`           | Netacad-style slide viewer with progression |
| `SlideRenderer`          | `src/components/student/SlideRenderer.jsx`          | Renders individual slide types              |
| `ModuleProgressionGuard` | `src/components/ModuleProgressionGuard.jsx`         | Modal showing module lock requirements      |
| `FinalAssessmentGuard`   | `src/components/FinalAssessmentGuard.jsx`           | Final assessment access control             |
| `StudentSidebar`         | `src/components/student/StudentSidebar.jsx`         | Student profile & navigation sidebar        |
| `CircleProgress`         | `src/app/(dashboard)/student/modules/[id]/page.jsx` | Circular progress indicator for lessons     |

### Data Flow

```
Category Browse Page
├── moduleService.getAllModules()
├── categoryService.getAllCategories()
└── categoryService.getCategoryById(id) [on select]
    ↓
Filter locally by:
├── Category ID
├── Level (beginner/intermediate/advanced)
└── Search query
    ↓
Course Learning Page
├── courseService.getCourseById(courseId)
├── courseService.getEnrollment(courseId)
└── Render sidebar with module/lesson structure
    ↓
Lesson Page
├── Load lesson slides (sorted by order)
├── LessonViewer component
│   ├── Intro phase
│   ├── Slide phase (with engagement tracking)
│   └── Assessment phase
└── Navigation (Previous/Next)
```

---

## 5. File Structure Summary

### Core Lesson/Module Files

```
src/
├── app/
│   ├── modules/
│   │   └── page.jsx                    ← Category browsing
│   ├── courses/
│   │   └── [id]/
│   │       ├── page.jsx                ← Course overview
│   │       ├── learn/
│   │       │   └── [moduleId]/
│   │       │       └── [lessonId]/
│   │       │           └── page.jsx    ← Main course lesson viewer
│   │       └── final-assessment/
│   │           └── page.jsx            ← Final assessment
│   └── (dashboard)/
│       └── student/
│           └── modules/
│               └── [id]/
│                   └── page.jsx        ← Alternative module viewer
├── components/
│   ├── student/
│   │   ├── LessonViewer.jsx            ← Slide viewer component
│   │   ├── SlideRenderer.jsx           ← Slide rendering engine
│   │   └── StudentSidebar.jsx          ← Navigation sidebar
│   ├── ModuleProgressionGuard.jsx      ← Lock modal
│   └── FinalAssessmentGuard.jsx        ← Final assessment gate
├── lib/
│   ├── api/
│   │   ├── courseService.ts            ← Course API methods
│   │   ├── moduleService.ts            ← Module API methods
│   │   ├── categoryService.ts          ← Category API methods
│   │   ├── moduleEnrollmentService.ts  ← Enrollment/progress API
│   │   └── moduleRatingService.ts      ← Rating API
│   ├── utils/
│   │   └── courseProgressionLogic.js   ← Progression rules
│   └── hooks/
│       └── useEngagementTracker.js     ← Slide engagement tracking
└── utils/
    └── [various utilities]
```

---

## 6. Key Data Models

### Module Object

```javascript
{
  _id: string,
  title: string,
  description: string,
  level: 'beginner' | 'intermediate' | 'advanced',
  categoryId: string | Category,
  lessons: Lesson[],        // Ordered array
  assessmentQuiz?: Quiz[],  // Module assessment
  introVideoUrl?: string,
  xpReward: number,
  status: 'draft' | 'submitted' | 'approved' | 'published'
}
```

### Lesson Object

```javascript
{
  _id: string,
  title: string,
  description: string,
  slides: Slide[],          // Will be sorted by order
  assessmentQuiz?: Quiz[],
  assessment?: Assessment,
  videoUrl?: string,
  content?: string,
  duration?: string,
  xpReward?: number,
  order?: number
}
```

### Slide Object

```javascript
{
  _id: string,
  type: 'text' | 'image' | 'video' | 'diagram' | 'codeSnippet',
  order: number,            // For sorting
  content?: string,
  imageUrl?: string,
  videoUrl?: string,
  minViewingTime?: number,  // Seconds
  scrollTrackingEnabled?: boolean
}
```

### Enrollment Object

```javascript
{
  _id: string,
  userId: string,
  courseId: string,
  isCompleted: boolean,
  moduleProgress: {
    moduleIndex: number,
    assessmentPassed: boolean,
    assessmentAttempts: number
  }[],
  lessonProgress: {
    lessonIndex: number,
    moduleIndex: number,
    isCompleted: boolean,
    slideProgress: {
      slideIndex: number,
      isCompleted: boolean,
      timeSpent: number,
      scrolledToBottom: boolean
    }[]
  }[]
}
```

---

## 7. Navigation Routes

### Public Routes

- `/modules` - Browse modules by category
- `/courses/[id]` - Course overview
- `/courses/[id]/checkout` - Purchase/enroll

### Authenticated Routes (Student)

- `/courses/[id]/learn/[moduleId]/[lessonId]` - Main course lesson viewer
- `/student/modules/[id]` - Alternative module viewer
- `/courses/[id]/final-assessment` - Final assessment page
- `/student/modules` - My enrolled modules

### Query Parameters

- `/courses/[id]/learn/...?showFinalAssessment=true` - Auto-open final assessment

---

## Summary of Findings

### ✅ Module Display

- Modules shown in sequential order with numbering (Module 1, 2, 3)
- Each module displays lessons in order
- Slides are explicitly sorted by `order` field
- Completion indicators (checkmark, lock, play icon) clearly show status

### ✅ Lesson Navigation

- **Next button**: Marks lesson complete, adds XP, navigates to next lesson or opens assessment
- **Previous button**: Navigates to previous lesson (always available)
- **Sidebar**: Click any lesson to navigate (within same module)
- **Progression**: Strictly linear - must complete previous module to unlock next

### ✅ Category Browsing

- Fetch modules with `moduleService.getAllModules()`
- Filter by category locally (no backend filtering)
- Categories show module count
- Pricing and access badges displayed
- Detailed category panel shows rich content
- Module count accurate and dynamically calculated
