# Module Discussions Feature - Complete Implementation Summary

## 🎯 Feature Overview

Instructors and enrolled students can now pose questions, start discussions, and have threaded conversations within specific course modules. Email notifications are sent automatically to relevant parties (batched for large enrollments), and unread indicators help track new replies.

---

## 📍 Where to Access the Feature

### **For Students:**

1. **Enroll in a course** (if not already enrolled)
2. **Click "Learn"** to enter the course learning page
3. In the **lesson header**, click **"Module Discussion"** button (purple with chat icon)
4. You'll land on `/courses/<courseId>/discussion?module=<moduleIndex>`
5. **Start a discussion** to ask the instructor/class a question
6. **Reply to discussions** to participate in conversations
7. When instructor replies, you get an **email notification** and see an **unread badge**

### **For Instructors:**

1. Go to **"My Courses"** (instructor dashboard)
2. **Enter a course** and click **"Learn"**
3. In the **lesson header**, click **"Module Discussion"** button
4. Select a **module** from the left sidebar
5. **Start a discussion** — all enrolled students automatically get an email
6. **Reply to student questions** — students get email notifications and unread badges
7. View **unread reply count** via the red badge next to discussion title

---

## 🛠️ Technical Architecture

### **Backend Changes** (NestJS)

#### 1. **Discussion Schema** (`src/schemas/discussion.schema.ts`)

```typescript
- studentId (optional) - for student-authored discussions
- instructorId (required) - course instructor
- createdById (required) - who started the discussion
- createdByRole (required) - "student" or "instructor"
- moduleIndex (required) - which module this discussion is for
- moduleTitle (optional) - auto-captured from course modules
- title (required) - discussion topic
- content (required) - initial message
- replies[] - threaded responses, each with authorRole
- lastRead[] - per-user last-read timestamp for unread tracking
- status - "open", "resolved", or "closed"
```

#### 2. **API Endpoints** (`src/courses/courses.controller.ts`)

| Method | Endpoint                                     | Auth               | Description                                             |
| ------ | -------------------------------------------- | ------------------ | ------------------------------------------------------- |
| POST   | `/api/courses/:id/discussions`               | Student/Instructor | Create discussion (checks enrollment/instructor status) |
| GET    | `/api/courses/:id/discussions?moduleIndex=0` | Student/Instructor | List discussions for module (includes unreadCount)      |
| POST   | `/api/courses/discussions/:id/reply`         | Student/Instructor | Add reply to discussion                                 |
| POST   | `/api/courses/discussions/:id/read`          | Student/Instructor | Mark discussion as read (clears unread badge)           |

#### 3. **Service Logic** (`src/courses/courses.service.ts`)

- **createDiscussion**: Validates enrollment/instructor, captures module title, sends batched emails
- **getCoursesDiscussions**: Calculates `hasUnread` and `unreadCount` per user based on lastRead timestamps
- **addDiscussionReply**: Validates author role, sends email notifications
- **sendBatchedEmails**: Chunks email sends (30 per batch with 800ms delays) to prevent SMTP throttling
- **markDiscussionRead**: Updates user's lastReadAt for a discussion

#### 4. **Email Notifications**

**Triggered by:**

- Instructor starts discussion → emails all enrolled students
- Student starts discussion → emails course instructor
- Any reply (student/instructor) → emails the opposite side

**Batching:**

- Batch size: 30 recipients per batch
- Delay between batches: 800ms
- Prevents SMTP server overload on large courses

---

### **Frontend Changes** (Next.js)

#### 1. **Discussion Page** (`src/app/courses/[id]/discussion/page.jsx`)

**Features:**

- Module selector (left sidebar)
- Start discussion form (title + content)
- Discussion list with replies
- Unread badge (red, bell icon, shows count)
- "Mark read" link per discussion
- Toast notifications (success/error, 2.5s auto-dismiss)

**State Management:**

- `discussions`: current module's threads
- `selectedModule`: active module index
- `newDiscussion`: form state (title, content)
- `replyMap`: per-discussion reply text
- `toast`: feedback messages

**Query Params:**

- `?module=0` — lands on specific module's discussions

#### 2. **Learning Page Entry Point** (`src/app/courses/[id]/learn/[moduleId]/[lessonId]/page.jsx`)

Added **"Module Discussion"** button in lesson header that navigates to:

```
/courses/<courseId>/discussion?module=<moduleIndex>
```

#### 3. **API Service** (`src/lib/api/courseService.ts`)

```javascript
getDiscussions(courseId, moduleIndex); // GET /api/courses/:id/discussions
createDiscussion(courseId, discussionData); // POST /api/courses/:id/discussions
addDiscussionReply(discussionId, reply); // POST /api/courses/discussions/:id/reply
markDiscussionRead(discussionId); // POST /api/courses/discussions/:id/read
```

---

## 📧 Email Notification Flow

### **Scenario 1: Student Starts Discussion**

```
Student opens discussion page
Student fills title + content
Student clicks "Start discussion"
  ↓
Backend validates enrollment
Backend captures module title
Backend saves discussion
Backend fetches instructor email
Backend sends email to instructor with link to discussion
Toast shows "Discussion started"
```

### **Scenario 2: Instructor Starts Discussion**

```
Instructor clicks "Start discussion"
Backend validates instructor ownership
Backend saves discussion
Backend fetches all enrolled students (batched)
Backend sends email to each batch (30 at a time, 800ms delays)
All students see discussion on next load + unread badge
Toast shows "Discussion started"
```

### **Scenario 3: Reply Posted**

```
User types reply + clicks "Send reply"
Backend validates user role + course enrollment
Backend appends reply to discussion
Backend sends email (instructor or students, depending on author)
Discussion reload shows unread badge with count
Toast shows "Reply posted"
```

### **Scenario 4: User Marks as Read**

```
User clicks "Mark read" link
Backend updates lastReadAt for that discussion
Discussion unread badge disappears on reload
Toast shows "Marked as read"
```

---

## ✅ Environment Requirements

For email notifications to work, ensure these are set in `.env`:

```env
SMTP_HOST=smtp.mailtrap.io          # or your SMTP provider
SMTP_PORT=2525                      # or appropriate port
SMTP_USER=your_username             # SMTP auth user
SMTP_PASS=your_password             # SMTP auth password
SMTP_FROM_EMAIL=noreply@elearning.com
FRONTEND_URL=http://localhost:3000  # or production domain
```

---

## 🧪 Quick Test Scenarios

### **Test 1: Student-Initiated Discussion**

1. **As Student A:** Open course, click "Learn", then "Module Discussion"
2. Start a discussion with title "How to interpret results?"
3. **As Instructor:** Check email inbox — should see notification with link
4. Click email link or navigate to `/courses/<courseId>/discussion?module=0`
5. **As Instructor:** Reply "Great question! Here's how..."
6. **As Student A:** Refresh discussion page — should see red "1" unread badge
7. Click "Mark read" — badge clears

### **Test 2: Instructor-Initiated Discussion**

1. **As Instructor:** Open course, click "Learn", then "Module Discussion"
2. Start discussion "Module 1 Assignment Review"
3. **As Students A, B, C:** Check emails (may take 1-2s for first batch)
4. All students see discussion with unread indicator on next page load
5. **As Student A:** Click "Mark read" to clear badge

### **Test 3: Large Class (50+ students)**

1. **As Instructor:** Start discussion in a course with 50+ enrollments
2. Watch backend log — should show batching:
   ```
   [Batch 1/2] Sending to 30 students...
   [Waiting 800ms...]
   [Batch 2/2] Sending to 20 students...
   ```
3. Students receive emails at staggered times (good SMTP practice)

### **Test 4: Reply Chain**

1. **As Student:** Reply to instructor's discussion
2. Instructor gets email notification
3. **As Instructor:** Reply to student's reply
4. Student sees unread badge
5. Both can keep replying indefinitely

---

## 🎨 UI/UX Details

### **Module Discussion Page Layout**

```
┌─ Module Selector (left) ────┬── Discussions (right) ────────┐
│ ☑ Module 1                 │ Start Discussion               │
│ ☐ Module 2                 │ ┌─────────────────────────────┐│
│ ☐ Module 3                 │ │ Title: _______________       ││
│                            │ │ Content: ______________      ││
│                            │ │ [Start discussion] button    ││
│                            │ └─────────────────────────────┘│
│                            │                                 │
│                            │ Discussions List:              │
│                            │ ┌─────────────────────────────┐│
│                            │ │ Student question title   🔴 1││
│                            │ │ [instructor] Instructor      ││
│                            │ │                              ││
│                            │ │ Instructor: Best practice... ││
│                            │ │                              ││
│                            │ │ ↳ Student: Thank you! One... ││
│                            │ │   [Mark read] 1 replies      ││
│                            │ │                              ││
│                            │ │ Reply: _______________      ││
│                            │ │ [Send reply] button          ││
│                            │ └─────────────────────────────┘│
└────────────────────────────┴──────────────────────────────────┘
```

### **Unread Badge**

- Location: Top right of discussion card
- Color: Red background, white text
- Icon: 🔔 Bell
- Format: "🔔 2" (shows count of unread replies)
- Action: Click "Mark read" to dismiss

### **Toast Notifications**

- Position: Top-right corner
- Success: Green background ("Discussion started", "Reply posted", "Marked as read")
- Error: Red background ("Failed to start discussion", "Could not post reply")
- Duration: Auto-dismisses after 2.5 seconds

---

## 🔒 Security & Permissions

| Action                      | Student       | Instructor | Admin    |
| --------------------------- | ------------- | ---------- | -------- |
| View own module discussions | ✅ (enrolled) | ✅         | ✅       |
| Start discussion            | ✅ (enrolled) | ✅ (owner) | ✅       |
| Reply to discussion         | ✅ (enrolled) | ✅ (owner) | ✅       |
| Mark as read                | ✅ (own)      | ✅ (own)   | ✅ (own) |
| See unread count            | ✅ (own)      | ✅ (own)   | ✅ (own) |

**Validation:**

- Student discussions: Enrollment required (`enrollmentModel.findOne`)
- Instructor discussions: Course instructor check (`course.instructorId === userId`)
- Replies: Author role validated (student = enrolled, instructor = course owner)

---

## 📊 Data Model

```typescript
Discussion {
  _id: ObjectId
  courseId: ObjectId        // Reference to course
  instructorId: ObjectId    // Course instructor
  studentId?: ObjectId      // Author if student (optional)
  createdById: ObjectId     // Who created this
  createdByRole: "student" | "instructor"
  moduleIndex: number
  moduleTitle?: string
  title: string
  content: string
  replies: [
    {
      authorId: ObjectId
      authorName: string
      authorRole: "student" | "instructor"
      content: string
      likes: number
      createdAt: Date
    }
  ]
  lastRead: [
    {
      userId: ObjectId
      lastReadAt: Date
    }
  ]
  status: "open" | "resolved" | "closed"
  views: number
  likes: number
  createdAt: Date
  updatedAt: Date
}
```

---

## 🚀 Future Enhancements

1. **Mark discussion as resolved** — instructor can flag discussions as answered
2. **Discussion search** — search across all discussions by keyword
3. **Mention notifications** — @mention to notify specific users
4. **Discussion categories** — tag discussions (question, announcement, resource)
5. **Pinned discussions** — instructor can pin important threads
6. **Typing indicators** — real-time "user is typing..."
7. **Discussion analytics** — most active modules/topics
8. **Offline mode** — cache discussions for offline viewing

---

## 📋 Summary of Changes

| File                               | Change                                                          | Impact                                                 |
| ---------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| `schemas/discussion.schema.ts`     | Added `createdById`, `createdByRole`, `lastRead`, `moduleTitle` | Support instructor/student authoring + unread tracking |
| `courses.service.ts`               | Enhanced permissions, added batching, unread calculation        | Secure + scalable + feature-complete                   |
| `courses.controller.ts`            | Added `/read` endpoint, pass userId to GET                      | Full unread tracking                                   |
| `courses/[id]/discussion/page.jsx` | New UI page                                                     | Complete student/instructor interface                  |
| `courses/[id]/learn/.../page.jsx`  | Added "Module Discussion" button                                | Easy access from lessons                               |
| `courseService.ts`                 | Added API methods                                               | Frontend-backend integration                           |

---

## ✨ Status

**Implementation: COMPLETE** ✅

- Backend: All endpoints tested and working
- Frontend: UI built and integrated
- Emails: Batching logic implemented
- Unread tracking: Database + UI indicators ready
- Error handling: Toast feedback on all actions

**Ready for:** Production testing, SMTP configuration, and end-to-end validation

---

**Last Updated:** December 15, 2025  
**Feature Version:** 1.0.0  
**Test Status:** Ready for QA
