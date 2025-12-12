# Instructor Course View - Visual Guide

## How to View Lessons and Questions in a Course

### Step 1: Navigate to Instructor Courses

1. Log in as an instructor
2. Go to **Instructor Dashboard → Courses**
3. Select a course to view

### Step 2: View Course Overview

You'll see:

- Course title and status badge
- Course statistics (modules, enrolled students, level, price)
- Final assessment (if applicable)
- **Course Modules section**

### Step 3: Expand a Module

Click on any module to expand it. You'll see:

```
┌─────────────────────────────────────┐
│  Module 1 - Introduction to Topic   │  ← Click to expand
│  5 lessons • 3 assessment questions │
└─────────────────────────────────────┘
```

After clicking, it expands to show:

```
┌─ Module Description ──────────────────┐
│ This module covers the fundamentals...│
└───────────────────────────────────────┘

┌─ Lessons (5) ─────────────────────────┐
│ □ Lesson 1: Getting Started           │
│ □ Lesson 2: Core Concepts             │
│ □ Lesson 3: Practical Applications    │
│ □ Lesson 4: Advanced Topics           │
│ □ Lesson 5: Review & Summary          │
└───────────────────────────────────────┘

┌─ Module Questions (if any) ──────────┐
│ Q1. Which of the following...         │
│ Q2. True or False...                  │
└───────────────────────────────────────┘

┌─ Module Assessment ───────────────────┐
│ Assessment questions...               │
└───────────────────────────────────────┘
```

### Step 4: Expand a Lesson

Click on any lesson within the expanded module:

```
┌─ Lesson 1: Getting Started ───────────┐
│ [Video] Duration: 15 minutes          │  ← Click to expand
└───────────────────────────────────────┘
```

After clicking, it expands to show:

```
┌─ Content ─────────────────────────────┐
│ This lesson introduces you to...      │
└───────────────────────────────────────┘

┌─ Video URL ───────────────────────────┐
│ 🎥 https://example.com/video          │
└───────────────────────────────────────┘

┌─ Topics Covered ──────────────────────┐
│ [Fundamentals] [Basics] [Introduction]│
└───────────────────────────────────────┘

┌─ Lesson Questions (3) ────────────────┐
│ ┌─ Q1. What is...? ──────────────────┐
│ │ Type: multiple-choice | Points: 5  │
│ │ ○ Option A                         │
│ │ ○ Option B ✓ Correct Answer        │
│ │ ○ Option C                         │
│ │ Explanation: ...                   │
│ └────────────────────────────────────┘
│ ┌─ Q2. True or False...? ────────────┐
│ │ Type: true-false | Points: 3       │
│ │ ○ True ✓ Correct Answer            │
│ │ ○ False                            │
│ │ Explanation: ...                   │
│ └────────────────────────────────────┘
│ ┌─ Q3. Essay Question... ────────────┐
│ │ Type: essay | Points: 10           │
│ │ Please explain...                  │
│ │ Explanation: Expected response...  │
│ └────────────────────────────────────┘
└───────────────────────────────────────┘
```

## Color Coding System

### Question Sections

| Section               | Color           | Purpose                               | When Shown                 |
| --------------------- | --------------- | ------------------------------------- | -------------------------- |
| **Lesson Questions**  | 🟧 Orange       | Questions specific to a single lesson | When lesson is expanded    |
| **Module Questions**  | 🟨 Amber/Yellow | Questions for the entire module       | When module is expanded    |
| **Module Assessment** | 🟪 Purple       | Formal assessment for the module      | When module is expanded    |
| **Final Assessment**  | 🟪 Purple       | Formal assessment for the course      | Always visible (if exists) |

## Question Display Features

Each question shows:

- ✅ **Question Number** - Sequential numbering (Q1, Q2, Q3...)
- 📝 **Question Text** - Full text of the question
- 🏷️ **Type** - multiple-choice, essay, true-false
- 🎯 **Points** - Point value for correct answer
- 📋 **Options** - All possible answers (for multiple choice/true-false)
- ✓ **Correct Answer** - Highlighted in green
- 💡 **Explanation** - Detailed explanation of correct answer

## Example Scenario

**Course:** "Web Development Basics"
**Module:** "HTML Fundamentals"

### Expanded View Shows:

```
📚 Module: HTML Fundamentals
├── 📝 Description: Learn the basics of HTML...
├── 📖 Lessons (4)
│   ├── 1. Introduction to HTML ▼
│   │   ├── 📄 Content: HTML is a markup language...
│   │   ├── 🎥 Video: https://...
│   │   ├── ⏱️ Duration: 20 minutes
│   │   ├── 🏷️ Topics: [HTML] [Tags] [Structure]
│   │   └── ❓ Lesson Questions (2)
│   │       ├── Q1. What does HTML stand for?
│   │       │   Type: multiple-choice | Points: 5
│   │       │   Options:
│   │       │   ○ HyperText Markup Language ✓
│   │       │   ○ High Tech Modern Business Logic
│   │       │   Explanation: HTML stands for...
│   │       └── Q2. Is HTML a programming language?
│   │           Type: true-false | Points: 3
│   │           ○ True
│   │           ○ False ✓
│   │           Explanation: HTML is a markup...
│   ├── 2. HTML Tags (collapsed)
│   ├── 3. Forms and Input (collapsed)
│   └── 4. Semantic HTML (collapsed)
├── ❓ Module Questions (1)
│   └── Q1. List 3 semantic HTML elements...
│       Type: essay | Points: 10
├── 📋 Module Assessment (5 questions)
│   └── Multiple questions with options...
```

## Tips for Instructors

1. **Review Before Publishing** - Expand all modules/lessons to review course content and questions
2. **Check Question Accuracy** - Verify correct answers and explanations are accurate
3. **Assess Difficulty** - Review questions to ensure they match course level (Beginner/Intermediate/Advanced)
4. **Organize Content** - Use expand/collapse to navigate large courses efficiently
5. **Search Feature** - Use search to find specific lessons or modules (if > 5 modules)

## Keyboard Shortcuts (if implemented in future)

- `E` - Expand all modules
- `C` - Collapse all modules
- `Ctrl + F` - Search modules and lessons

---

**Note:** All questions must have been properly created during course setup. Questions are read-only in the view page. To edit questions, use the "Edit Course" button.
