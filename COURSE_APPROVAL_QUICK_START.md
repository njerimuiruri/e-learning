# Course Approval Workflow - Quick Start Guide

## 🚀 How It Works (In 5 Steps)

### Step 1: Instructor Creates Course

1. Login as instructor at `/login`
2. Go to Instructor Dashboard → Courses → "Create New Course"
3. Fill in course details and upload
4. Course is saved with **DRAFT** status
5. ✅ **Result:** Course appears in "Drafts" on `/instructor/courses`

---

### Step 2: Instructor Submits for Approval

1. Open the course card
2. Click the blue "Submit" button
3. Confirm submission
4. ✅ **Result:**
   - Course status changes to **SUBMITTED**
   - Course moves to "Pending Approval" section
   - **Admin receives email** 📧 about the submission

---

### Step 3: Admin Reviews in Dashboard

1. Login as admin
2. Go to `/admin/courses/pending`
3. See all submitted courses
4. Click "View Details" to inspect course
5. ✅ **Result:** Admin can see all course information including instructor details

---

### Step 4: Admin Approves or Rejects

**To Approve:**

1. Click green "Approve" button
2. Add optional approval notes
3. Click "Approve"
4. ✅ **Result:**
   - Course status → **APPROVED**
   - **Instructor receives email** 📧 confirming approval

**To Reject:**

1. Click red "Reject" button
2. Enter rejection reason (required)
3. Click "Reject"
4. ✅ **Result:**
   - Course status → **REJECTED**
   - **Instructor receives email** 📧 with rejection reason
   - Instructor can see rejection reason in course card

---

### Step 5: Instructor Sees Updates

1. Instructor logs in and goes to `/instructor/courses`
2. **After Approval:** Course appears in "Approved" section with green badge
3. **After Rejection:** Course shows "Rejected" badge with feedback visible
   - Instructor can edit and resubmit

---

## 📊 Course Status Flow

```
┌─────────┐
│ CREATED │ (User uploads course)
└────┬────┘
     │ Auto-save to database with DRAFT status
     ▼
┌─────────┐
│ DRAFT   │ (Instructor can edit)
└────┬────┘
     │ Instructor clicks "Submit"
     ▼
┌──────────────┐
│  SUBMITTED   │ (Waiting for admin review)
└────┬─────┬──┘
     │     │
     │ (Approve)  (Reject)
     ▼     ▼
┌─────────────┐  ┌─────────────┐
│  APPROVED   │  │  REJECTED   │
└─────────────┘  └──────┬──────┘
     │                  │
     │                  │ Instructor edits and resubmits
     │                  ▼
     │            ┌──────────────┐
     │            │  SUBMITTED   │ (Back to review)
     │            └──────────────┘
     │
     │ (Admin publishes)
     ▼
┌──────────────┐
│  PUBLISHED   │ (Students can enroll)
└──────────────┘
```

---

## 📧 Email Notifications

### Email 1: Course Submission (To Admin)

- **Sent when:** Instructor clicks "Submit"
- **To:** Admin email
- **Content:**
  - "New course submitted for review"
  - Instructor name & email
  - Course title & category
  - Number of modules

### Email 2: Course Approved (To Instructor)

- **Sent when:** Admin clicks "Approve"
- **To:** Instructor email
- **Content:**
  - "Your course has been approved!"
  - Course title
  - Link to view course
  - Next steps

### Email 3: Course Rejected (To Instructor)

- **Sent when:** Admin clicks "Reject"
- **To:** Instructor email
- **Content:**
  - "Your course needs revision"
  - Course title
  - **Detailed reason for rejection**
  - How to revise and resubmit

---

## 🧪 Quick Test Checklist

- [ ] **Create Course**: Instructor creates course → saves to DB with DRAFT status
- [ ] **Submit Course**: Click submit → status changes to SUBMITTED
- [ ] **Admin Email**: Admin receives submission email ✓
- [ ] **Admin Dashboard**: Course appears in `/admin/courses/pending`
- [ ] **Approve**: Admin approves → instructor receives approval email ✓
- [ ] **Instructor Dashboard**: Approved course appears in "Approved" section
- [ ] **Reject**: Admin rejects with reason → instructor receives rejection email ✓
- [ ] **Rejection Feedback**: Instructor sees rejection reason on course card
- [ ] **Resubmit**: Instructor can edit rejected course and resubmit

---

## 🔗 Important URLs

### Instructor URLs

- Dashboard: `http://localhost:3000/instructor/dashboard`
- My Courses: `http://localhost:3000/instructor/courses`
- Create Course: `http://localhost:3000/instructor/courses/upload`

### Admin URLs

- Admin Dashboard: `http://localhost:3000/admin/dashboard`
- All Courses: `http://localhost:3000/admin/courses`
- **Pending Courses** (NEW): `http://localhost:3000/admin/courses/pending`

### Course View

- Course Details: `http://localhost:3000/courses/:id`

---

## 🐛 Troubleshooting

### Course not saving

```
❌ Problem: Instructor creates course but it doesn't appear
✅ Solution:
   - Check Network tab → POST /api/courses should return 200
   - Verify instructor is logged in (check localStorage token)
   - Check backend logs for errors
```

### Admin not receiving email

```
❌ Problem: Course submitted but admin doesn't get email
✅ Solution:
   - Check backend .env has correct SMTP settings
   - Verify ADMIN_EMAIL in .env
   - Check email spam folder
   - Verify FRONTEND_URL in .env is correct
```

### Instructor not receiving approval email

```
❌ Problem: Admin approves but instructor doesn't get email
✅ Solution:
   - Check instructor email in database is correct
   - Verify SMTP configuration
   - Check backend logs for email errors
   - Try with different email service if Mailtrap fails
```

### Pending courses page is empty

```
❌ Problem: No courses showing in /admin/courses/pending
✅ Solution:
   - Instructor must submit course (not just create it)
   - Check course status is "submitted" in database
   - Refresh page
   - Check browser Network tab for GET /api/admin/courses/pending
```

---

## 📋 Data Structure

### Course Object (Key Fields)

```javascript
{
  _id: "courseId",
  title: "Course Title",
  description: "Course description",
  category: "Programming",
  instructorId: "instructorUserId",
  status: "draft|submitted|approved|rejected|published",
  modules: [],

  // Approval workflow fields
  submittedAt: "2024-01-15T10:30:00Z",
  approvedBy: "adminUserId",
  approvedAt: "2024-01-15T14:30:00Z",
  rejectionReason: "Modules content needs improvement",
  rejectedAt: "2024-01-15T14:30:00Z"
}
```

---

## 🔐 Permissions

| Role           | Can Do                                                                  |
| -------------- | ----------------------------------------------------------------------- |
| **Instructor** | Create courses, Submit for approval, Edit own courses, View own courses |
| **Admin**      | View all courses, Approve courses, Reject courses, Publish courses      |
| **Student**    | View published courses, Enroll in courses                               |

---

## 💾 API Endpoints Summary

### Create & Submit Course

```
POST /api/courses                    Create course (DRAFT)
POST /api/courses/:id/submit        Submit for approval (SUBMITTED)
```

### Admin Actions

```
GET  /api/admin/courses/pending              Get pending courses
PUT  /api/admin/courses/:id/approve          Approve course
PUT  /api/admin/courses/:id/reject           Reject course
```

### View Courses

```
GET  /api/courses/instructor/my-courses     Get instructor's courses
GET  /api/admin/courses                     Get all courses
GET  /api/courses/:id                       Get course details
```

---

## ✨ Key Features

✅ Automatic database persistence on course creation
✅ One-click submission workflow
✅ Email notifications at each step
✅ Dedicated admin review dashboard
✅ Rejection feedback system
✅ Resubmission capability
✅ Real-time status updates
✅ Full audit trail (timestamps for all changes)

---

**Ready to test? Start with the Quick Test Checklist above! 🎯**
