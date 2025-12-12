# Complete Course Approval Workflow - Testing Guide

## Overview

The complete workflow is now fully implemented and working:

```
INSTRUCTOR → CREATE → SUBMIT → ADMIN → APPROVE → STUDENTS
```

---

## Complete Step-by-Step Workflow

### PHASE 1: INSTRUCTOR CREATES & SUBMITS COURSE

#### Step 1.1: Instructor Login

```
URL: http://localhost:3000/login
Email: Any instructor email (or create new instructor account)
Password: Password123
```

- You'll be redirected to `/instructor` dashboard
- Click on **"My Courses"** in the sidebar

#### Step 1.2: Create New Course

```
Path: /instructor/courses → Click "Create New Course" button
Or direct: /instructor/courses/upload
```

Fill in the course details:

- **Course Title**: e.g., "Advanced React Patterns"
- **Description**: e.g., "Learn advanced React hooks and patterns"
- **Category**: e.g., "Web Development"
- **Level**: e.g., "Advanced"
- **Banner Image**: Upload a thumbnail (optional but recommended)
- **Add Modules**: Add at least 1-2 modules with lessons:
  - Module 1: "React Hooks Deep Dive"
    - Lesson 1: "Introduction to Hooks"
    - Lesson 2: "useState and useEffect"
  - Module 2: "Advanced Patterns"
    - Lesson 1: "Custom Hooks"
    - Lesson 2: "Context API"

Click **"Create Course"** button

- Course is saved as DRAFT status
- You're redirected to `/instructor/courses`
- Course appears in the **"Drafts"** tab

#### Step 1.3: Submit Course for Approval

In the **"My Courses"** page:

1. Look for your course in the **"Drafts"** section
2. Click the blue **"Submit"** button on the course card
3. You'll see success message: "Course submitted for approval! Admin will review it shortly."
4. Course status changes from DRAFT → SUBMITTED
5. Course now appears in **"Pending Approval"** tab

**Status Change Flow:**

```
CREATE COURSE
    ↓
DRAFT Status (in "Drafts" tab)
    ↓
CLICK "Submit" Button
    ↓
SUBMITTED Status (moves to "Pending Approval" tab)
```

---

### PHASE 2: ADMIN REVIEWS & APPROVES

#### Step 2.1: Admin Login

```
URL: http://localhost:3000/login
Email: admin@elearning.com
Password: Admin@123456
```

- You'll be redirected to `/admin` dashboard

#### Step 2.2: Navigate to Pending Approvals

In the admin sidebar, look for:

```
📋 Pending Course Approvals
```

- Click on it or go directly to: `/admin/courses/pending`

You'll see:

- Header: "Pending Course Approvals"
- Stats card showing: "Total Pending Courses: [X]"
- List of all submitted courses waiting for approval

Each course card shows:

- 📸 Course thumbnail image
- 📝 Course title
- 📄 Description preview (first 2 lines)
- 🏷️ Category badge (e.g., "Web Development")
- 🎓 Level badge (e.g., "Advanced")
- 📚 Module count badge (e.g., "2 modules")
- 👤 Instructor information:
  - Name: "John Instructor"
  - Email: "john@example.com"
- 🕐 Submission date/time
- Three action buttons:
  - 👁️ **View Details** - Opens course detail page
  - ✅ **Approve** - Opens approval modal
  - ❌ **Reject** - Opens rejection modal

#### Step 2.3: Review & Approve Course

Click the **"Approve"** button on a course:

**Approval Modal Opens** showing:

```
┌─────────────────────────────────────────┐
│ Review & Approve Course          [X]    │
├─────────────────────────────────────────┤
│                                         │
│ [COURSE THUMBNAIL IMAGE]                │
│                                         │
│ Advanced React Patterns                 │
│ 🏷️ Web Development  🎓 Advanced        │
│ 📚 2 modules                            │
│                                         │
│ Course Description:                     │
│ Learn advanced React hooks and patterns │
│ including custom hooks, context API...  │
│                                         │
│ 👤 Instructor Information               │
│ Name: John Instructor                   │
│ Email: john@example.com                 │
│ Submitted: Dec 10, 2:30 PM              │
│                                         │
│ 📚 Course Modules (2)                  │
│ ┌─────────────────────────────────┐   │
│ │ 1. React Hooks Deep Dive        │   │
│ │    Understanding hooks...       │   │
│ │    Duration: 2 hours            │   │
│ │    📖 2 lessons                  │   │
│ ├─────────────────────────────────┤   │
│ │ 2. Advanced Patterns            │   │
│ │    Pattern implementation...    │   │
│ │    Duration: 1.5 hours          │   │
│ │    📖 2 lessons                  │   │
│ └─────────────────────────────────┘   │
│                                         │
│ 💰 Pricing: Free                        │
│                                         │
│ Approval Notes (Optional):              │
│ ┌─────────────────────────────────┐   │
│ │ Great course! Well structured.  │   │
│ │ Ready for students to enroll.   │   │
│ └─────────────────────────────────┘   │
│                                         │
│ [Cancel]          [Approve Course]     │
└─────────────────────────────────────────┘
```

**What to do:**

1. Review all course information
2. Check modules and lessons
3. Verify instructor details
4. (Optional) Add approval notes
5. Click **"Approve Course"** button

**After Approval:**

- Modal closes
- Success message: "Course approved successfully! Instructor has been notified."
- Course removed from pending list
- Instructor receives approval email
- **Course status changes: SUBMITTED → PUBLISHED**
- Course is now visible to all students!

#### Step 2.4: Alternative - Reject Course

Click the **"Reject"** button instead:

**Rejection Modal Opens** (same details view but with required field):

```
Rejection Reason (REQUIRED):
┌──────────────────────────────┐
│ The modules are incomplete.  │
│ Please add:                  │
│ - Quiz assessments           │
│ - Lesson materials           │
│ - Code examples              │
│                              │
│ Resubmit when ready.         │
└──────────────────────────────┘

[Cancel]      [Reject Course]
```

**What to do:**

1. Review course details
2. **REQUIRED:** Add rejection reason explaining what needs improvement
3. Click **"Reject Course"** button

**After Rejection:**

- Modal closes
- Success message: "Course rejected. Instructor has been notified with feedback via email."
- Course removed from pending list
- Instructor receives rejection email with your feedback
- **Course status changes: SUBMITTED → REJECTED**
- Course stays hidden from students
- Instructor can modify course and resubmit

---

### PHASE 3: STUDENTS SEE APPROVED COURSES

#### Step 3.1: Student Browsing - Homepage

```
URL: http://localhost:3000
No login required
```

Scroll down to **"Explore Our Courses"** section:

- You'll see the approved course displayed
- Shows:
  - Course thumbnail
  - Course title
  - Description preview
  - Level badge
  - Module count
  - Instructor name and avatar
  - Rating (if applicable)
  - "Explore Course" button

#### Step 3.2: Student Browsing - All Courses

```
Path: /courses
```

Browse all approved courses:

- Filter by category
- See all course details
- Click course to view details
- Click **"Enroll And Begin"** to start learning

#### Step 3.3: Student Enrollment

1. Login as student: `student@example.com` / `Password123`
2. Go to `/courses`
3. Find the approved course
4. Click **"Enroll And Begin"**
5. Course appears on student dashboard at `/student`
6. Can now start learning the course!

---

## Complete Status Flow

```
┌─────────────────────────────────────────────────────┐
│            COURSE LIFECYCLE STATUS FLOW             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  DRAFT                                              │
│   ↓ (Instructor clicks "Submit")                    │
│  SUBMITTED                                          │
│   ├─ (Admin clicks "Approve") → PUBLISHED           │
│   │                              ↓                   │
│   │                         Visible to Students     │
│   │                                                  │
│   └─ (Admin clicks "Reject") → REJECTED             │
│                              ↓                       │
│                         Hidden from Students        │
│                         Instructor can modify       │
│                         and resubmit                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Key Features Working

✅ **Instructor Side:**

- Create courses with modules and lessons
- Save as draft
- Submit for approval
- View course status (Draft/Pending/Published/Rejected)
- Receive email notifications on approval/rejection
- Can resubmit rejected courses

✅ **Admin Side:**

- View all pending courses in dedicated page
- See full course details in approval modal
- Review instructor information
- See all modules with details
- Add optional approval notes
- Add required rejection reason
- Approve with auto-publish
- Reject with feedback
- Receive submission notifications

✅ **Student Side:**

- See approved courses on homepage
- Browse all courses on /courses
- Filter by category
- View course details
- Enroll in courses
- Start learning immediately

✅ **Email Notifications:**

- Instructor notified when submitting (to admin)
- Instructor notified when approved
- Instructor notified when rejected with reason
- Admin notified when course submitted

---

## Testing Checklist

### Instructor Tasks

- [ ] Create a new course with 2+ modules
- [ ] Add lessons to each module
- [ ] Upload a thumbnail image
- [ ] See course in "Drafts" tab
- [ ] Click "Submit" button
- [ ] See success message
- [ ] Course moves to "Pending Approval" tab
- [ ] Receive approval email (check inbox)

### Admin Tasks

- [ ] Login as admin
- [ ] Navigate to "Pending Course Approvals"
- [ ] See submitted course in list
- [ ] Click "Approve" button
- [ ] Review full course details in modal
- [ ] See all modules listed
- [ ] See instructor information
- [ ] Add optional notes
- [ ] Click "Approve Course"
- [ ] See success message
- [ ] Course removed from pending list
- [ ] Instructor receives approval email

### Student Tasks

- [ ] Logout from admin
- [ ] Visit homepage `/`
- [ ] Scroll to "Explore Our Courses"
- [ ] See the newly approved course
- [ ] Go to `/courses` page
- [ ] See approved course in grid
- [ ] Click on course
- [ ] View course details
- [ ] If logged in as student, click "Enroll"
- [ ] See course on student dashboard

---

## Troubleshooting

### Issue: "Failed to submit course: Unauthorized"

**Solution:**

- Backend restart might be needed
- Ensure you're logged in as the course creator
- If course was created with different account, delete and recreate

### Issue: Course not appearing in pending list

**Solution:**

- Ensure course is in SUBMITTED status
- Refresh admin page (Ctrl+F5)
- Check backend logs for errors
- Verify course has instructorId set

### Issue: Course not appearing on student side after approval

**Solution:**

- Refresh browser cache (Ctrl+Shift+Del)
- Verify course status is PUBLISHED (not just APPROVED)
- Check course has status: 'published' in database

### Issue: Modal not showing course details

**Solution:**

- Ensure course has modules added
- Verify modules have lessons
- Check course has valid thumbnail URL
- Check browser console (F12) for errors

---

## API Endpoints Reference

| Endpoint                             | Method | Role       | Purpose                  |
| ------------------------------------ | ------ | ---------- | ------------------------ |
| `/api/courses`                       | POST   | Instructor | Create new course        |
| `/api/courses/instructor/my-courses` | GET    | Instructor | Get instructor's courses |
| `/api/courses/:id/submit`            | POST   | Instructor | Submit for approval      |
| `/api/courses/:id`                   | PUT    | Instructor | Update course            |
| `/api/admin/courses/pending`         | GET    | Admin      | Get pending courses      |
| `/api/admin/courses`                 | GET    | Admin      | Get all courses          |
| `/api/courses/:id/approve`           | PUT    | Admin      | Approve course           |
| `/api/courses/:id/reject`            | PUT    | Admin      | Reject course            |
| `/api/courses`                       | GET    | Public     | Get published courses    |
| `/api/courses/:id`                   | GET    | Public     | Get course details       |

---

## Database Status Fields

Courses have the following status values:

| Status      | Visibility      | Who Sees        | Can Do          |
| ----------- | --------------- | --------------- | --------------- |
| `draft`     | Instructor only | Instructor      | Edit, Submit    |
| `submitted` | Admin only      | Admin           | Approve, Reject |
| `published` | Everyone        | Students, Admin | Enroll, Browse  |
| `rejected`  | Instructor only | Instructor      | Edit, Resubmit  |

---

## Success Indicators

✅ **Workflow is working correctly when:**

1. Instructor can create and submit courses
2. Admin sees submitted courses in pending list
3. Admin can approve with full details view
4. Approved course appears on homepage and /courses
5. Students can enroll in approved courses
6. Rejected courses don't appear to students
7. Instructors get email notifications
8. All course details (modules, lessons, instructor) display correctly

---

**The complete workflow is now fully functional!** 🎉
