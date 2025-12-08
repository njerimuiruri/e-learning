# Course Approval & Enrollment Flow Implementation

## 📋 Requirements

1. **When Instructor Creates/Submits a Course:**

   - Email notification sent to admin (faith.muiruri@strathmore.edu)
   - Course appears in admin dashboard for review
   - Admin can approve or reject with feedback

2. **When Admin Approves a Course:**

   - Course status changes to "approved" → "published"
   - Email sent to instructor (course approved notification)
   - Course appears on homepage courses list
   - Course becomes available for enrollment

3. **When Student Enrolls in Course:**

   - If not logged in → Redirect to register/login
   - If logged in → Can enroll
   - After enrollment → Can access course content

4. **Course Visibility:**
   - Only "published" courses show on homepage
   - Student can see course details before enrolling
   - Student can see list of their enrolled courses

## 🔧 Implementation Steps

### Step 1: Update Course Service

- Add method to get pending courses for admin review
- Update approval method to send email to instructor
- Ensure course is published after approval

### Step 2: Add Email Service Methods

- `sendCourseSubmissionNotificationToAdmin()` - When course is submitted
- `sendCourseApprovalEmailToInstructor()` - When course is approved
- `sendCourseRejectionEmailToInstructor()` - When course is rejected

### Step 3: Update Admin Service

- Add method to get pending courses
- Add method to approve course (calls email service)
- Add method to reject course (calls email service)

### Step 4: Update Admin Controller

- Add endpoint to get pending courses
- Add endpoint to approve course
- Add endpoint to reject course

### Step 5: Update Courses Controller

- Ensure submit course endpoint calls email service

### Step 6: Update Enrollment Logic

- Check if student is logged in
- Redirect to login if not
- Create enrollment record if logged in

### Step 7: Frontend Updates

- Update course list to show enrollment button
- Add login redirect on enrollment attempt
- Show enrolled courses on student dashboard

## 📧 Email Templates

### Admin Notification Email

```
Subject: New Course Submission - [Course Title]
Body:
- Course Title
- Instructor Name
- Category
- Description
- Number of Modules
- Link to admin dashboard for review
```

### Instructor Approval Email

```
Subject: Your Course Has Been Approved! 🎉
Body:
- Congratulations message
- Course Title
- Course is now live on platform
- Link to course on homepage
- Can view student enrollments
```

### Instructor Rejection Email

```
Subject: Course Submission - Feedback Required
Body:
- Your course requires updates
- Rejection reason/feedback
- Can resubmit after making changes
- Link to course editor
```

## 🗄️ Database Fields Needed

### Course Schema (may need to add)

- `submittedAt` - ✅ Already exists
- `approvedAt` - ✅ Already exists
- `approvedBy` - ✅ Already exists
- `rejectionReason` - ✅ Already exists
- `status` - ✅ Already exists (draft, submitted, approved, rejected, published)

### Enrollment Schema (check if exists)

- `studentId`
- `courseId`
- `enrolledAt`
- `progress`
- `completedAt`

## 🔄 Data Flow

```
Instructor Creates Course
    ↓
Instructor Submits Course
    ↓
Email to Admin + Dashboard Notification
    ↓
Admin Reviews Course
    ↓
├─ APPROVE → Email to Instructor + Publish Course
│             ↓
│             Course on Homepage
│             ↓
│             Student can See & Enroll
│
└─ REJECT → Email with Feedback
            ↓
            Instructor can Edit & Resubmit
```

## ✅ Current Status

- ✅ Course schema has needed fields
- ✅ Course service has approval methods
- ✅ Admin controller exists
- ✅ Courses controller has submit endpoint
- ❌ Email service methods for course notifications
- ❌ Admin endpoints for pending course management
- ❌ Frontend enrollment flow
- ❌ Student dashboard enrolled courses view

## 🚀 Next Steps

1. Add email service methods for course notifications
2. Add admin service methods for course management
3. Add admin controller endpoints
4. Update courses controller to trigger emails
5. Update frontend with enrollment flow
