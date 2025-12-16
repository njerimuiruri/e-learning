# Assessment Navigation - Visual Flow Diagrams

## Instructor Assessment Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│         Instructor Opens Assessment Page                     │
│         /instructor/courses/[id]/assessments                │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
        ┌─────────────────────────┐
        │ Fetch Course Data        │
        │ - Modules[]             │
        │ - moduleAssessment      │
        │ - finalAssessment       │
        └────────────┬────────────┘
                     │
                     ▼
      ┌──────────────────────────────┐
      │ Determine Smart Default Tab   │
      │                              │
      │ if (any module has          │
      │     assessment.questions)    │
      │   → Show Module Tab          │
      │ else                         │
      │   → Show Final Tab           │
      └───────────┬──────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
    ┌────────┐          ┌────────┐
    │ Module │          │ Final  │
    │ Tab    │          │ Tab    │
    └───┬────┘          └────┬───┘
        │                    │
        ├─ Sidebar           └─ Settings Form
        │  (Module List)        - Title
        │                       - Passing Score
        │  ┌─────────────┐      - Description
        │  │ Module 1 ✓ 5│
        │  ├─────────────┤   Add Questions
        │  │ Module 2 ○  │   - Question Type
        │  ├─────────────┤   - Points
        │  │ Module 3 ✓ 3│   - Options/Answer
        │  └─────────────┘
        │       ↓
        │   Click Module
        │       ↓
        │   ┌──────────────┐
        │   │ Module Editor│
        │   │ - Settings   │
        │   │ - Questions  │
        │   │ - Save Btn   │
        │   └──────────────┘
        │
        ├─ Save Module Assessment (blue btn)
        │       ↓
        │   Saves to state
        │
        └─ Save All Assessments (green btn)
               ↓
           Updates database
           with all data
```

## Assessment Configuration States

### State 1: Module-Focused (Some/All Modules Have Assessments)

```
┌─────────────────────────────────────┐
│ Course: Advanced Python Course      │
├─────────────────────────────────────┤
│                                     │
│ Module Assessments (3 configured)   │
│ ✓ Module 1: Basics (5 Q)            │
│ ✓ Module 2: Functions (4 Q)         │
│ ○ Module 3: Advanced                │
│ ✓ Module 4: OOP (6 Q)               │
│                                     │
│ Final Assessment                    │
│ ✓ Final Exam (15 Q)                 │
│                                     │
└─────────────────────────────────────┘

Student Path:
Module 1 Assessment → Module 2 Assessment →
(skip 3) → Module 4 Assessment → Final Assessment
```

### State 2: Final-Focused (No Module Assessments)

```
┌──────────────────────────────────────┐
│ Course: Quick Introduction Course    │
├──────────────────────────────────────┤
│                                      │
│ Module Assessments (0 configured)    │
│ ○ Module 1: Welcome                  │
│ ○ Module 2: Getting Started          │
│ ○ Module 3: Next Steps               │
│                                      │
│ Final Assessment                     │
│ ✓ Final Quiz (10 Q)                  │
│                                      │
└──────────────────────────────────────┘

Student Path:
Complete all modules → Final Assessment
```

### State 3: Selective Assessment (Mix of Modules)

```
┌──────────────────────────────────────┐
│ Course: Data Science Fundamentals    │
├──────────────────────────────────────┤
│                                      │
│ Module Assessments (2 configured)    │
│ ✓ Module 1: Statistics (8 Q)         │
│ ○ Module 2: Tools                    │
│ ✓ Module 3: Visualization (7 Q)      │
│ ○ Module 4: Practice                 │
│                                      │
│ Final Assessment                     │
│ ✓ Capstone Project (5 Q)             │
│                                      │
└──────────────────────────────────────┘

Student Path:
Module 1 → (skip 2) → Module 3 →
(skip 4) → Final Assessment
```

## UI Component Layout

### Module Assessments Tab

```
┌────────────────────────────────────────────────┐
│ Module Assessments          Final Assessment   │
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────────┐    ┌────────────────────┐  │
│  │   Modules    │    │  Module 1 Editor   │  │
│  │              │    │  ───────────────   │  │
│  │ • Module 1 ✓ │    │  Settings:         │  │
│  │ • Module 2 ○ │───▶  - Title           │  │
│  │ • Module 3 ✓ │    │  - Passing Score   │  │
│  │ • Module 4 ○ │    │  - Description     │  │
│  │              │    │                    │  │
│  └──────────────┘    │ Add Questions:     │  │
│                      │ [Question Form]    │  │
│                      │                    │  │
│  ┌────────────────┐  │ [Save Module]      │  │
│  │ Info Banner    │  │ [Save All]         │  │
│  │ 3 of 4 modules │  └────────────────────┘  │
│  │ configured     │                         │
│  └────────────────┘                         │
│                                              │
└────────────────────────────────────────────────┘
```

### Final Assessment Tab

```
┌────────────────────────────────────────────────┐
│ Module Assessments          Final Assessment   │
├────────────────────────────────────────────────┤
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │ Final Assessment Settings               │  │
│  │ ─────────────────────────────────────── │  │
│  │ Title: [Final Exam            ]         │  │
│  │ Passing Score: [70          ]%          │  │
│  │ Description: [              ]           │  │
│  │                             [Save]      │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │ Add Question Form                       │  │
│  │ ─────────────────────────────────────── │  │
│  │ Question Type: [Multiple Choice ▼]     │  │
│  │ Points: [5    ]                         │  │
│  │ Question: [                 ]           │  │
│  │ Options: □ [  ] □ [  ] □ [  ] □ [  ]  │  │
│  │                         [Add Question] │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │ Questions Added (5)                     │  │
│  │ ─────────────────────────────────────── │  │
│  │ 1. Question text... [5 pts] [Delete]   │  │
│  │ 2. Question text... [3 pts] [Delete]   │  │
│  │ ...                                     │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│                    [Save All Assessments]    │
└────────────────────────────────────────────────┘
```

## Student Assessment Flow

### Flow for Full Module Assessment Course

```
┌──────────────────────────────────────────┐
│ Student Enrolls in Course                │
└────────────────┬─────────────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ View Dashboard  │
        │ Course Progress │
        └────────┬────────┘
                 │
                 ▼
        ┌──────────────────┐
        │ View Module 1    │
        │ Complete Lessons │
        │ [All Done]       │
        └────────┬─────────┘
                 │
                 ▼
        ┌──────────────────────┐
        │ Module 1 Assessment  │
        │ Quiz Available ⚠️     │
        │ [Take Assessment]    │
        └────────┬─────────────┘
                 │
        ┌────────┴────────┐
        │                 │
    Pass ▼             Fail ▼
    ✓ 85%           ✗ 62% (need 70%)
        │                 │
        └─────────┬───────┘
                  │
        ┌─────────▼─────────┐
        │ Continue to       │
        │ Module 2          │
        └────────┬──────────┘
                 │
                 ▼
        ┌──────────────────────┐
        │ (No Assessment)      │
        │ Auto-Continue        │
        └────────┬─────────────┘
                 │
                 ▼
        ┌──────────────────────┐
        │ Module 3 Assessment  │
        │ Quiz Available       │
        │ [Take Assessment]    │
        └────────┬─────────────┘
                 │
        ┌────────┴────────┐
        │                 │
    Pass ▼             Fail ▼
        │                 │
        └─────────┬───────┘
                  │
        ┌─────────▼──────────┐
        │ All Modules Done   │
        │ Final Assessment   │
        │ [Take Final]       │
        └────────┬───────────┘
                 │
        ┌────────┴────────┐
        │                 │
    Pass ▼             Fail ▼
    ✓ 88%           ✗ 65%
        │                 │
        ▼                 ▼
    ✅ Course          🔄 Retake
    Complete
```

## Data Model Flow

### Before (Only Final Assessment)

```
Course Document
├─ title
├─ description
├─ modules[]
│  └─ [Module data]
│     ├─ title
│     ├─ lessons
│     └─ (no assessment)
└─ finalAssessment
   └─ questions[]
```

### After (Module + Final Assessment)

```
Course Document
├─ title
├─ description
├─ modules[]
│  ├─ Module 1
│  │  ├─ title
│  │  ├─ lessons
│  │  └─ moduleAssessment (NEW)
│  │     ├─ title
│  │     ├─ passingScore
│  │     └─ questions[]
│  │
│  ├─ Module 2
│  │  ├─ title
│  │  ├─ lessons
│  │  └─ moduleAssessment: null (no assessment)
│  │
│  └─ Module 3
│     ├─ title
│     ├─ lessons
│     └─ moduleAssessment
│        └─ questions[]
│
└─ finalAssessment
   └─ questions[]
```

## State Transition Diagram

```
Initial Load
    │
    ▼
┌─────────────────────────┐
│ Fetch Course            │
│ + Load Data             │
└────────────┬────────────┘
             │
             ▼
┌──────────────────────────────┐
│ Check Module Assessments     │
│ hasAnyModuleAssessments?     │
└───────┬──────────────────────┘
        │
    ┌───┴───┐
    │       │
  true    false
    │       │
    ▼       ▼
┌─────┐ ┌───────┐
│Mod  │ │Final  │
│Tab  │ │Tab    │
└──┬──┘ └───┬───┘
   │        │
   ▼        ▼
┌─────────────────────┐
│ User Interaction    │
│                     │
│ • Select Module     │
│ • Add Questions     │
│ • Save Module       │
│ • Switch Tabs       │
│ • Save All          │
│                     │
└──────────┬──────────┘
           │
           ▼
   ┌───────────────┐
   │ Update State  │
   │ (Local)       │
   └───────┬───────┘
           │
           ▼
   ┌───────────────────┐
   │ Save All Assessments
   │ (Database Update) │
   └───────┬───────────┘
           │
           ▼
   ┌──────────────────┐
   │ Success Message  │
   │ ✓ Saved!         │
   └──────────────────┘
```

## Feature Comparison Matrix

```
╔════════════════════════╦════════════╦═════════════════════════╗
║ Feature                ║ Before     ║ After                   ║
╠════════════════════════╬════════════╬═════════════════════════╣
║ Module Assessments     ║ ❌ None    ║ ✅ Full Support         ║
║ Selective Modules      ║ ❌ N/A     ║ ✅ Some/All/None        ║
║ Smart Tab Selection    ║ ❌ No      ║ ✅ Auto-selected        ║
║ Assessment Status View ║ ❌ No      ║ ✅ Sidebar Indicators   ║
║ Module-Specific Config ║ ❌ No      ║ ✅ Custom per Module    ║
║ Final Assessment Only  ║ ✅ Yes     ║ ✅ Still Supported      ║
║ Mixed Approach         ║ ❌ No      ║ ✅ Yes                  ║
║ Question Reuse         ║ ❌ No      ║ 🔄 Future Enhancement  ║
╚════════════════════════╩════════════╩═════════════════════════╝
```

---

**Diagram Version**: 1.0
**Created**: December 15, 2025
**Updated**: December 15, 2025
