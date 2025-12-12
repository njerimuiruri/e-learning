# Visual Architecture - Instructor Course View

## Component Hierarchy

```
InstructorCourseViewPage
│
├── Header Section
│   ├── Back Button
│   ├── Course Title + Status Badge
│   └── Edit Course Button
│
├── Feedback Section (if exists)
│   ├── Rejection Feedback (red)
│   └── Approval Feedback (green)
│
├── Course Info Grid
│   ├── Modules Count
│   ├── Enrolled Students
│   ├── Course Level
│   └── Course Price
│
├── Final Assessment Section (if exists)
│   └── Assessment Questions (purple)
│
└── Course Modules Section
    ├── Header with Expand All/Collapse All
    ├── Search Box (if > 5 modules)
    └── Modules List
        └── For Each Module:
            ├── Module Header (expandable)
            │   ├── Module Number Badge
            │   ├── Title & Description Preview
            │   ├── Lesson Count
            │   └── Assessment Question Count
            │
            └── Module Content (when expanded)
                ├── Description Box (blue)
                │
                ├── Lessons Section (blue gradient)
                │   └── For Each Lesson:
                │       ├── Lesson Header (expandable)
                │       │   ├── Lesson Number Badge
                │       │   ├── Title
                │       │   ├── Lesson Count
                │       │   ├── Duration & Video Badge
                │       │   └── Chevron Icon
                │       │
                │       └── Lesson Content (when expanded)
                │           ├── Content Box
                │           ├── Video URL Box
                │           ├── Duration Display
                │           ├── Topics Tags
                │           └── ✨ LESSON QUESTIONS (orange) ← NEW
                │               └── For Each Question:
                │                   ├── Question Number & Text
                │                   ├── Type & Points
                │                   ├── Options (if multiple-choice)
                │                   ├── Correct Answer ✓
                │                   └── Explanation
                │
                ├── ✨ MODULE QUESTIONS (amber) ← NEW
                │   └── For Each Question:
                │       ├── Question Number & Text
                │       ├── Type & Points
                │       ├── Options
                │       ├── Correct Answer ✓
                │       └── Explanation
                │
                └── Module Assessment (purple, if exists)
                    ├── Assessment Title
                    ├── Passing Score
                    ├── Question Count
                    └── For Each Question:
                        ├── Question Number & Text
                        ├── Type & Points
                        ├── Options
                        ├── Correct Answer ✓
                        └── Explanation
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│         Instructor Course View Page                      │
│    (src/app/(dashboard)/instructor/courses/[id])        │
└────────────────────────┬────────────────────────────────┘
                         │
                ┌────────▼────────┐
                │  useParams()    │
                │   → courseId    │
                └────────┬────────┘
                         │
           ┌─────────────▼─────────────┐
           │  courseService            │
           │  .getCourseById(courseId) │
           └─────────────┬─────────────┘
                         │
         ┌───────────────▼───────────────┐
         │   Course Data Retrieved       │
         │   {                           │
         │     title: "...",            │
         │     modules: [               │
         │       {                       │
         │         title: "...",        │
         │         description: "...",  │
         │         lessons: [           │
         │           {                   │
         │             title: "...",    │
         │             content: "...",  │
         │             questions: [     │ ← NEW
         │               {               │
         │                 text: "...",  │
         │                 type: "...",  │
         │                 points: 5,   │
         │                 options: [...] │
         │               }               │
         │             ]                │
         │           }                   │
         │         ],                    │
         │         questions: [          │ ← NEW
         │           {                   │
         │             text: "...",     │
         │             type: "..."      │
         │           }                   │
         │         ],                    │
         │         moduleAssessment: {  │
         │           questions: [...]   │
         │         }                     │
         │       }                       │
         │     ]                         │
         │   }                           │
         └───────────────┬───────────────┘
                         │
        ┌────────────────▼────────────────┐
        │   State Management              │
        │   ├── course                    │
        │   ├── expandedModules[]         │
        │   ├── expandedLessons[]         │
        │   └── searchTerm                │
        └────────────────┬────────────────┘
                         │
      ┌──────────────────▼──────────────────┐
      │   Render Course Structure           │
      ├──────────────────────────────────────┤
      │  ┌─ Module (expandable)            │
      │  │ ├─ Description                  │
      │  │ ├─ Lessons (expandable)         │
      │  │ │ ├─ Content                    │
      │  │ │ ├─ Video                      │
      │  │ │ └─ ✨ Questions (orange)     │ ← NEW
      │  │ │    └─ Display question info  │
      │  │ │                               │
      │  │ ├─ ✨ Questions (amber)        │ ← NEW
      │  │ │  └─ Display question info   │
      │  │ │                               │
      │  │ └─ Assessment (purple)         │
      │  │    └─ Display question info   │
      │  │                                 │
      │  └─ Module 2 (collapsed)...       │
      └──────────────────────────────────────┘
```

## State Management Flow

```
Initial State:
├── course: null
├── loading: true
├── expandedModules: [0, 1, 2] (first 3)
├── expandedLessons: []
└── searchTerm: ""

On Mount:
├── Call fetchCourse()
└── Update state with course data

User Actions:
├── Click Module
│   └── toggleModule(index)
│       └── Add/remove from expandedModules[]
│
├── Click Lesson
│   └── toggleLesson(lessonKey)
│       └── Add/remove from expandedLessons[]
│
└── Type in Search
    └── Update searchTerm
        └── Filter getFilteredModules()
```

## Color Scheme

```
┌─ Question Type Colors ────────────────────────┐
│                                               │
│  🟧 LESSON QUESTIONS (bg-orange-50)          │
│     Border: border-orange-200                │
│     Icon: text-orange-600                    │
│     Use: Questions within a lesson           │
│     Visibility: When lesson expanded         │
│                                               │
│  🟨 MODULE QUESTIONS (bg-amber-50)           │
│     Border: border-amber-200                 │
│     Icon: text-amber-600                     │
│     Use: Questions at module level           │
│     Visibility: When module expanded         │
│                                               │
│  🟪 ASSESSMENTS (bg-purple-50)               │
│     Border: border-purple-200                │
│     Icon: text-purple-600                    │
│     Use: Formal assessments                  │
│     Visibility: When module expanded         │
│                                               │
│  🟦 CONTENT AREAS (bg-blue-50)               │
│     Border: border-blue-200                  │
│     Use: Lessons list, descriptions          │
│     Visibility: When module expanded         │
│                                               │
└───────────────────────────────────────────────┘
```

## Responsive Layout

```
Desktop (≥1024px):
┌─────────────────────────────────────────────────┐
│  Header                                         │
├─────────────────────────────────────────────────┤
│  Info Grid (4 columns)                          │
├─────────────────────────────────────────────────┤
│  Modules (full width)                           │
│  ├─ Module 1 (full width)                      │
│  │  ├─ Lessons (nested)                        │
│  │  ├─ Questions (nested)                      │
│  │  └─ Assessment (nested)                     │
│  └─ Module 2 (full width)                      │
└─────────────────────────────────────────────────┘

Tablet (768px - 1023px):
┌──────────────────────────────┐
│  Header                      │
├──────────────────────────────┤
│  Info Grid (2 columns)       │
├──────────────────────────────┤
│  Modules (responsive)        │
└──────────────────────────────┘

Mobile (<768px):
┌──────────────────┐
│ Header           │
├──────────────────┤
│ Info (stacked)   │
├──────────────────┤
│ Modules          │
│ (text truncated) │
└──────────────────┘
```

## Question Display Structure

```
┌─ Question Container (bg-white/border) ────────────────┐
│                                                        │
│ Q1. What is HTML?                                     │
│                                                        │
│ Type: multiple-choice | Points: 5                     │
│                                                        │
│ ○ HyperText Markup Language         ✓ Correct Answer │
│ ○ High Tech Modern Business Logic                     │
│ ○ Home Tool for Making Blogs                          │
│                                                        │
│ Explanation: HTML stands for                          │
│ HyperText Markup Language. It is used...              │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## Search and Filter Flow

```
User Types Search Term
        │
        ▼
getFilteredModules()
        │
        ├─ Check module title
        ├─ Check module description
        └─ Check lesson titles in module
        │
        ▼
Return Filtered Array
        │
        ▼
Render Only Matching Modules
        │
        ▼
Lessons within filtered modules still expandable
```

## Performance Optimizations

```
Initial Load:
├── Only first 3 modules expanded
├── Remaining modules collapsed
└── Reduces initial DOM nodes

On Expand:
├── Only that section renders
├── Other sections stay collapsed
└── Efficient memory usage

Search:
├── Filters array in memory
├── Does not make API call
└── Instant results

Rendering:
├── Unique keys on all lists
├── No unnecessary re-renders
└── Smooth expand/collapse

```

## Error Handling Flow

```
┌─ Fetch Course ────────────────┐
│                                │
│ Success                Error   │
│   │                     │      │
│   ▼                     ▼      │
│ setCourse()          console.error()
│ setLoading(false)    setLoading(false)
│                                │
└─────────────┬──────────────────┘
              │
              ▼
    Render Page with Data
         or
    Show Error Message
         or
    Show Course Not Found
```

---

**This diagram shows how the enhanced instructor course view is structured and how data flows through the component.**
