# Course Approval System - Visual & Reference Guide

## 🎬 User Journey Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INSTRUCTOR JOURNEY                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  1. Login                    2. Create Course              3. Submit Course   │
│     │                           │                            │                │
│     ▼                           ▼                            ▼                │
│  ┌──────────┐          ┌──────────────────┐        ┌──────────────┐        │
│  │ /login   │ ────────→│ /instructor/     │───────→│ Course card  │        │
│  │          │          │ courses/upload   │        │ "Submit"btn  │        │
│  └──────────┘          └──────────────────┘        └──────────────┘        │
│                                                           │                  │
│                                                      ┌────┴─────┐           │
│                                                      │           │           │
│                                                      ▼           ▼           │
│                                               ┌──────────┐ ┌──────────┐    │
│                                               │APPROVED! │ │REJECTED! │    │
│                                               │Dashboard │ │See reason│    │
│                                               │updated   │ │Can retry │    │
│                                               └──────────┘ └──────────┘    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         ADMIN JOURNEY                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  1. Email Alert        2. View Dashboard         3. Review & Action         │
│     │                     │                         │                        │
│     ▼                     ▼                         ▼                        │
│  ┌──────────┐         ┌──────────────────┐    ┌────────────────┐          │
│  │"New       │────────→│ /admin/courses/  │───→│ Click Approve  │          │
│  │course to  │        │ pending          │    │ or Reject      │          │
│  │review"    │        │                  │    │ + Feedback     │          │
│  └──────────┘        │ Shows:            │    └────────────────┘          │
│                      │ • Title           │         │                       │
│                      │ • Description     │    ┌────┴──────┐               │
│                      │ • Instructor info │    ▼           ▼               │
│                      │ • Modules count   │  ┌──────┐   ┌──────┐          │
│                      │ • Submitted date  │  │Email │   │Email │          │
│                      │                   │  │sent  │   │sent  │          │
│                      │ Action buttons    │  │to    │   │to    │          │
│                      │ • View            │  │instr.│   │instr.│          │
│                      │ • Approve         │  └──────┘   └──────┘          │
│                      │ • Reject          │                                │
│                      └──────────────────┘                                │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📱 UI Flow Diagram

### Instructor Dashboard - My Courses Page

```
┌─────────────────────────────────────────────────┐
│ My Courses                                       │
├─────────────────────────────────────────────────┤
│                                                  │
│ Filters: All | Drafts | Pending | Approved     │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ Course Title                              │   │
│ │ [Draft Badge] • Programming • Beginner    │   │
│ │                                           │   │
│ │ 2 modules, 5 lessons                      │   │
│ │                                           │   │
│ │ [View] [Edit] [Submit]                    │   │
│ └──────────────────────────────────────────┘   │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ Another Course                            │   │
│ │ [Pending Badge] • Design • Intermediate   │   │
│ │                                           │   │
│ │ Submitted on: Jan 15, 2024                │   │
│ │                                           │   │
│ │ [View] [Edit]                             │   │
│ └──────────────────────────────────────────┘   │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ Approved Course                           │   │
│ │ [Approved Badge] • Marketing • Advanced   │   │
│ │                                           │   │
│ │ Approved on: Jan 12, 2024                 │   │
│ │                                           │   │
│ │ [View] [Edit] [Submit] [Publish]          │   │
│ └──────────────────────────────────────────┘   │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ Rejected Course                           │   │
│ │ [Rejected Badge] • Data • Beginner        │   │
│ │                                           │   │
│ │ Feedback: Content needs more examples     │   │
│ │                                           │   │
│ │ [View] [Edit] [Submit]                    │   │
│ └──────────────────────────────────────────┘   │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Admin Pending Courses Page (NEW)

```
┌─────────────────────────────────────────────────────────┐
│ Pending Course Approvals                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Total Pending Courses: 3                    🕐    │   │
│ └───────────────────────────────────────────────────┘   │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ [Thumbnail]                                        │  │
│ │ Course Title                                       │  │
│ │ Course description goes here...                    │  │
│ │ Programming | Beginner | 4 modules                 │  │
│ │                                                    │  │
│ │ Instructor: John Doe                              │  │
│ │ Email: john@email.com                             │  │
│ │ Submitted: Jan 15, 2024 at 10:30 AM               │  │
│ │                                                    │  │
│ │ [View] [Approve] [Reject]                          │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ [Thumbnail]                                        │  │
│ │ Another Course Title                               │  │
│ │ Design and UX fundamentals...                      │  │
│ │ Design | Intermediate | 6 modules                  │  │
│ │                                                    │  │
│ │ Instructor: Jane Smith                            │  │
│ │ Email: jane@email.com                             │  │
│ │ Submitted: Jan 14, 2024 at 02:15 PM               │  │
│ │                                                    │  │
│ │ [View] [Approve] [Reject]                          │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ Pagination: [< Prev] 1 2 3 [Next >]                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Approval Modal

```
┌────────────────────────────────────────┐
│ Approve Course                         │
├────────────────────────────────────────┤
│                                        │
│ Course: Web Development Basics         │
│                                        │
│ Approval Notes (Optional):             │
│ ┌────────────────────────────────────┐ │
│ │ Enter any notes for instructor...  │ │
│ │                                    │ │
│ └────────────────────────────────────┘ │
│                                        │
│ [Cancel] [Approve]                     │
└────────────────────────────────────────┘
```

### Rejection Modal

```
┌────────────────────────────────────────┐
│ Reject Course                          │
├────────────────────────────────────────┤
│                                        │
│ Course: Web Development Basics         │
│                                        │
│ Rejection Reason (Required):           │
│ ┌────────────────────────────────────┐ │
│ │ Module 2 content needs more...     │ │
│ │ Please add practical exercises...  │ │
│ │                                    │ │
│ └────────────────────────────────────┘ │
│                                        │
│ [Cancel] [Reject]                      │
└────────────────────────────────────────┘
```

---

## 📧 Email Layouts

### Email 1: Submission Alert (To Admin)

```
╔════════════════════════════════════════════════════════╗
║                                                        ║
║  NEW COURSE SUBMITTED FOR REVIEW                       ║
║                                                        ║
║  From: Course System <noreply@elearning.com>          ║
║  To: faith.muiruri@strathmore.edu                      ║
║  Subject: New Course Submitted by John Doe             ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  A new course has been submitted for review.           ║
║                                                        ║
║  Instructor Details:                                   ║
║  • Name: John Doe                                      ║
║  • Email: john@university.edu                          ║
║  • Institution: University Name                        ║
║                                                        ║
║  Course Details:                                       ║
║  • Title: Web Development Fundamentals                 ║
║  • Category: Programming                               ║
║  • Modules: 8                                          ║
║                                                        ║
║  [VIEW & APPROVE COURSE] ──────────────────────       ║
║  http://localhost:3000/admin/courses/pending           ║
║                                                        ║
║  Please log in to review this course submission.       ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

### Email 2: Approval Confirmation (To Instructor)

```
╔════════════════════════════════════════════════════════╗
║                                                        ║
║  🎉 YOUR COURSE HAS BEEN APPROVED!                     ║
║                                                        ║
║  From: Course System <noreply@elearning.com>          ║
║  To: john@university.edu                              ║
║  Subject: Course Approved - Web Dev Fundamentals      ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  Congratulations!                                      ║
║                                                        ║
║  Your course "Web Development Fundamentals" has been   ║
║  APPROVED by our admin team.                           ║
║                                                        ║
║  Next Steps:                                           ║
║  1. Review your course one more time                   ║
║  2. Publish the course to make it live                 ║
║  3. Start engaging with students                       ║
║                                                        ║
║  [VIEW YOUR COURSE] ───────────────────────           ║
║  http://localhost:3000/courses/[courseId]              ║
║                                                        ║
║  Welcome to the platform!                              ║
║  Best regards,                                         ║
║  E-Learning Platform Team                              ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

### Email 3: Rejection with Feedback (To Instructor)

```
╔════════════════════════════════════════════════════════╗
║                                                        ║
║  YOUR COURSE NEEDS REVISION                            ║
║                                                        ║
║  From: Course System <noreply@elearning.com>          ║
║  To: john@university.edu                              ║
║  Subject: Revision Needed - Web Dev Fundamentals      ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  Your course "Web Development Fundamentals" has        ║
║  been returned for revision.                           ║
║                                                        ║
║  Feedback from our review team:                        ║
║  ─────────────────────────────────────────            ║
║  Module 2 content needs more practical examples.       ║
║  The JavaScript exercises should be more challenging.  ║
║  Please add more quizzes at the end of each module.    ║
║  ─────────────────────────────────────────            ║
║                                                        ║
║  What to do next:                                      ║
║  1. Review the feedback carefully                      ║
║  2. Make the necessary revisions                       ║
║  3. Resubmit your course for approval                  ║
║                                                        ║
║  [EDIT & RESUBMIT COURSE] ─────────────────           ║
║  http://localhost:3000/instructor/courses              ║
║                                                        ║
║  If you have questions, contact our support team.      ║
║                                                        ║
║  Best regards,                                         ║
║  E-Learning Platform Team                              ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

---

## 🔄 Status Badge Reference

| Status    | Color  | Icon | Meaning                            |
| --------- | ------ | ---- | ---------------------------------- |
| DRAFT     | Yellow | 📝   | Being created/edited by instructor |
| SUBMITTED | Blue   | ⏳   | Waiting for admin review           |
| APPROVED  | Green  | ✅   | Approved, ready to publish         |
| REJECTED  | Red    | ❌   | Needs revision, can resubmit       |
| PUBLISHED | Green  | 🚀   | Live for students to enroll        |

---

## 📊 Data Flow Diagram

```
INSTRUCTOR                  BACKEND DATABASE              ADMIN
    │                             │                         │
    ├─ POST /api/courses ────────→ Course created          │
    │                    DRAFT    │                         │
    │                    status   │                         │
    │                             │                         │
    ├─ POST /api/courses/:id ────→ Course status            │
    │   /submit                   │ changed to              │
    │                    SUBMITTED │ SUBMITTED              │
    │                             │                         │
    │                      Email  │                         │
    │                      sent to│ admin────────────────→ Email received
    │                      admin   │                         │
    │                             │                 GET/    │
    │                             │ /api/admin/courses  │
    │                             │ /pending            │
    │                             │                     │
    │                             │         ┌───────────┴──┐
    │                             │         ▼              ▼
    │                             │    Approve        Reject
    │                             │         │              │
    │          PUT /api/admin/    │         │              │
    │          courses/:id/approve│←────────┤              │
    │          or /reject         │         │              │
    │                    Updated   │         │
    │                    status    │         │
    │                    + Email   │    Email to       Email to
    │                    to instr  │    instructor     instructor
    │                    │         │         │              │
    │◄─────────────────────────────┘         │              │
    │         GET /api/courses/               │              │
    │         instructor/my-courses           │              │
    │                                         │              │
    │         Dashboard updated ◄─────────────┤──────────────┘
    │         with new status
    │
```

---

## 🗂️ File Structure

```
elearning (Frontend)
├── src/
│   ├── app/
│   │   └── (dashboard)/
│   │       ├── admin/
│   │       │   └── courses/
│   │       │       ├── page.jsx (All courses)
│   │       │       └── pending/
│   │       │           └── page.jsx ✨ NEW
│   │       └── instructor/
│   │           └── courses/
│   │               ├── page.jsx (My courses)
│   │               └── upload/
│   │                   └── page.jsx (Create)
│   └── lib/
│       └── api/
│           ├── courseService.ts (Updated)
│           └── adminService.ts (Updated)
│
elearning-backend (Backend)
├── src/
│   ├── courses/
│   │   ├── courses.service.ts (Updated)
│   │   └── courses.controller.ts (Updated)
│   ├── admin/
│   │   ├── admin.service.ts (Updated)
│   │   └── admin.controller.ts (Updated)
│   ├── schemas/
│   │   └── course.schema.ts (No change)
│   └── common/
│       └── services/
│           └── email.service.ts (Already complete)
```

---

## 🎯 Quick Reference

### For Instructors

- **Create course:** `/instructor/courses/upload`
- **My courses:** `/instructor/courses`
- **Submit for review:** Click "Submit" button on course card
- **Check status:** Refresh `/instructor/courses` page

### For Admins

- **Pending courses:** `/admin/courses/pending` ← NEW PAGE
- **All courses:** `/admin/courses`
- **Approve:** Click "Approve" button → Modal → Confirm
- **Reject:** Click "Reject" button → Modal → Enter reason → Confirm

### Email Aliases

- **Admin email:** `faith.muiruri@strathmore.edu` (configured in .env)
- **From:** `noreply@elearning.com` (configured in .env)

---

## ✅ Implementation Checklist

- [x] Database schema has all required fields
- [x] Course creation saves immediately to DB
- [x] Instructor can submit course for approval
- [x] Admin notification email implemented
- [x] Admin pending courses API endpoint created
- [x] Admin pending courses UI dashboard created
- [x] Admin approval endpoint updated with email
- [x] Admin rejection endpoint updated with email
- [x] Instructor approval email implemented
- [x] Instructor rejection email implemented
- [x] Frontend admin service methods added
- [x] Frontend displays course status updates
- [x] Rejection feedback visible to instructor
- [x] Instructor can resubmit rejected courses
- [x] Documentation created
- [x] Testing guide created

---

**STATUS: ✅ COMPLETE AND READY FOR USE**
