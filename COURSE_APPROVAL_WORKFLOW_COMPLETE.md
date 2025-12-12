# Course Approval Workflow - Complete Implementation

## Overview

This document describes the complete course creation and approval workflow implemented in the e-learning platform.

## Workflow Steps

### 1. Instructor Creates a Course

**URL:** `/instructor/courses/upload`

**What happens:**

- Instructor fills out course details (title, description, category, level, modules, lessons)
- Course is saved to database with status `DRAFT`
- Instructor can edit/update the course as needed
- Course appears in instructor's "Drafts" section on `/instructor/courses`

**Backend:**

- Endpoint: `POST /api/courses`
- Service: `CourseService.createCourse()`
- Status: `DRAFT`
- No email sent at this stage

**Frontend:**

- File: `src/app/(dashboard)/instructor/courses/upload/page.jsx`
- File: `src/lib/api/courseService.ts`

---

### 2. Instructor Submits Course for Approval

**Trigger:** Instructor clicks "Submit" button on course card (available for DRAFT and REJECTED courses)

**What happens:**

- Course status changes to `SUBMITTED`
- Course appears in "Pending Approval" section on instructor dashboard
- **Admin receives email notification** with:
  - Instructor name and email
  - Course title and category
  - Number of modules
  - Admin dashboard link to review

**Backend:**

- Endpoint: `POST /api/courses/:id/submit`
- Service: `CourseService.submitCourse()`
- Email: Sent by `EmailService.sendCourseSubmissionNotificationToAdmin()`
- To: `faith.muiruri@strathmore.edu` (configured)

**Frontend:**

- File: `src/app/(dashboard)/instructor/courses/page.jsx`
- Service: `courseService.submitCourse()`
- Button: "Submit" button visible on DRAFT and REJECTED courses

---

### 3. Admin Reviews Pending Courses

**URL:** `/admin/courses/pending`

**What admin sees:**

- List of all courses with status `SUBMITTED`
- Course details: title, description, category, level, modules count
- Instructor information: name, email, submission date
- Action buttons: View Details, Approve, Reject

**Dashboard Update:**

- Shows total pending courses count
- Pagination support (10 courses per page)

**Backend:**

- Endpoint: `GET /api/admin/courses/pending` (with pagination)
- Service: `AdminService.getPendingCourses()`

**Frontend:**

- File: `src/app/(dashboard)/admin/courses/pending/page.jsx`
- Service: `adminService.getPendingCourses()`

---

### 4. Admin Approves Course

**Trigger:** Admin clicks "Approve" button and submits approval form

**What happens:**

- Course status changes to `APPROVED`
- `approvedBy` field set to admin user ID
- `approvedAt` timestamp recorded
- **Instructor receives email** with:
  - Notification that course was approved
  - Course title
  - Link to view course
  - Next steps information

**Backend:**

- Endpoint: `PUT /api/admin/courses/:id/approve`
- Service: `AdminService.approvePendingCourse()`
- Email: Sent by `EmailService.sendCourseApprovedEmail()`
- To: Instructor's email address

**Frontend:**

- File: `src/app/(dashboard)/admin/courses/pending/page.jsx`
- Service: `adminService.approveCourse()`
- Modal: Approval confirmation with optional feedback

---

### 5. Admin Rejects Course

**Trigger:** Admin clicks "Reject" button and submits rejection reason

**What happens:**

- Course status changes to `REJECTED`
- Rejection reason stored in database
- `rejectedAt` timestamp recorded
- **Instructor receives email** with:
  - Notification that course was rejected
  - Course title
  - Detailed rejection reason
  - Instructions for resubmission

**Backend:**

- Endpoint: `PUT /api/admin/courses/:id/reject`
- Service: `AdminService.rejectPendingCourse()`
- Email: Sent by `EmailService.sendCourseRejectedEmail()`
- To: Instructor's email address

**Frontend:**

- File: `src/app/(dashboard)/admin/courses/pending/page.jsx`
- Service: `adminService.rejectCourse()`
- Modal: Rejection confirmation with required reason field

---

### 6. Instructor Sees Course Status Update

**Where:** `/instructor/courses` dashboard

**After Approval:**

- Course moves from "Pending Approval" to "Approved" section
- Status badge shows "Approved"
- Instructor receives email confirmation

**After Rejection:**

- Course stays in dashboard but shows "Rejected" status
- Rejection feedback visible in course card
- "Submit" button re-appears to allow resubmission after edits

---

### 7. Admin Publishes Course (Optional)

**Note:** This is separate from approval. After approval, admin can publish.

**What happens:**

- Course becomes visible to students on the platform
- Status changes to `PUBLISHED`
- Students can enroll in the course

---

## Database Schema Changes

### Course Schema Fields

```typescript
// Existing fields
title: string
description: string
category: string
instructorId: ObjectId (ref: User)
level: CourseLevel enum
status: CourseStatus enum (DRAFT | SUBMITTED | APPROVED | REJECTED | PUBLISHED | ARCHIVED)
modules: Module[]
thumbnailUrl?: string

// Approval workflow fields
approvedBy?: ObjectId (ref: User)  // Admin who approved
approvedAt?: Date
submittedAt?: Date
rejectionReason?: string
rejectedAt?: Date
```

---

## API Endpoints

### Course Endpoints (Instructor)

```
POST   /api/courses                    Create course (status: DRAFT)
GET    /api/courses/instructor/my-courses    Get instructor's courses
PUT    /api/courses/:id               Update course
POST   /api/courses/:id/submit        Submit for approval (status: SUBMITTED)
```

### Course Endpoints (via CourseController)

```
PUT    /api/courses/:id/approve       Approve course (status: APPROVED)
PUT    /api/courses/:id/reject        Reject course (status: REJECTED)
PUT    /api/courses/:id/publish       Publish course (status: PUBLISHED)
```

### Admin Endpoints

```
GET    /api/admin/courses/pending              Get pending courses
GET    /api/admin/courses                     Get all courses (filterable by status)
PUT    /api/admin/courses/:id/approve         Approve pending course
PUT    /api/admin/courses/:id/reject          Reject pending course
```

---

## Email Templates

### 1. Course Submission Notification (To Admin)

**Trigger:** When instructor submits course
**Template:** `sendCourseSubmissionNotificationToAdmin()`
**Content:**

- Instructor name and email
- Course title
- Course category
- Number of modules
- Link to admin dashboard

### 2. Course Approval Notification (To Instructor)

**Trigger:** When admin approves course
**Template:** `sendCourseApprovedEmail()`
**Content:**

- Congratulations message
- Course title
- Instructions to view course
- Next steps for publishing

### 3. Course Rejection Notification (To Instructor)

**Trigger:** When admin rejects course
**Template:** `sendCourseRejectedEmail()`
**Content:**

- Rejection message
- Course title
- Detailed rejection reason
- Instructions for revising and resubmitting

---

## Frontend Pages & Components

### Instructor Pages

1. **`/instructor/courses/upload`** - Create new course

   - Multi-step form
   - Uploads course to database with DRAFT status

2. **`/instructor/courses`** - My Courses Dashboard
   - Filters: All, Drafts, Pending Approval, Approved, Published
   - Actions: View, Edit, Submit
   - Shows rejection feedback if rejected

### Admin Pages

1. **`/admin/courses`** - All Courses

   - View all courses with any status
   - Filter by status, category, instructor
   - Approve/Reject from this view (if status is SUBMITTED)

2. **`/admin/courses/pending`** - Pending Courses (NEW)
   - Dedicated view for courses awaiting approval
   - Cleaner interface focused on approval workflow
   - Instructor information clearly displayed
   - Modal confirmation for approve/reject with optional feedback

---

## Testing the Workflow

### End-to-End Test Steps

1. **Login as Instructor**

   - Navigate to `/instructor/courses/upload`
   - Fill in course details
   - Create course
   - Verify course appears in `/instructor/courses` with "Draft" status

2. **Submit Course**

   - Click "Submit" button on course card
   - Verify status changes to "Pending Approval"
   - Check admin email for submission notification

3. **Login as Admin**

   - Navigate to `/admin/courses/pending`
   - Verify course appears in the pending list
   - Click "Approve" or "Reject" button

4. **Test Approval**

   - Fill in optional feedback
   - Click "Approve"
   - Verify course status changes to "Approved"
   - Check instructor email for approval notification

5. **Test Rejection**
   - Submit another course as instructor
   - As admin, click "Reject"
   - Fill in rejection reason (required)
   - Click "Reject"
   - Verify instructor email received rejection notification
   - Verify instructor can see rejection reason in course card
   - Verify "Submit" button reappears to resubmit course

---

## Key Features

✅ **Automatic Email Notifications**

- Admin notified when course submitted
- Instructor notified when course approved
- Instructor notified when course rejected with reason

✅ **Role-Based Access**

- Instructors can only see and manage their own courses
- Admins have full visibility and control
- Protected routes with JWT authentication

✅ **Status Tracking**

- Clear status indicators throughout UI
- Timestamps for all state transitions
- Rejection feedback stored and displayed

✅ **User-Friendly Workflow**

- Simple one-click approval/rejection
- Modal confirmations prevent accidents
- Clear feedback messages
- Pagination for large course lists

✅ **Database Integrity**

- Proper relationships maintained
- Indexes on frequently queried fields
- Timestamps for audit trail

---

## Environment Setup

### Email Configuration (Backend .env)

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_user
SMTP_PASS=your_password
SMTP_FROM_EMAIL=noreply@elearning.com
FRONTEND_URL=http://localhost:3000
ADMIN_EMAIL=faith.muiruri@strathmore.edu
```

### Frontend Configuration (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Troubleshooting

### Courses not saving to database

- Check backend logs for errors
- Verify instructor is authenticated (JWT token valid)
- Check MongoDB connection and permissions

### Emails not sending

- Verify SMTP credentials in .env
- Check email service logs
- Ensure FRONTEND_URL is correct in .env
- Test email configuration separately

### Admin can't see pending courses

- Verify admin has ADMIN role in database
- Check JWT token is valid
- Navigate directly to `/admin/courses/pending`
- Check browser console for API errors

### Instructor not receiving approval email

- Verify instructor email is correct in database
- Check email configuration (see above)
- Check spam/junk folder
- Verify email service logs

---

## Future Enhancements

1. **Course Preview**: Show course preview before approving
2. **Bulk Actions**: Approve/reject multiple courses at once
3. **Templates**: Save course templates for faster creation
4. **Notifications Dashboard**: In-app notifications instead of/in addition to email
5. **Analytics**: Track course approval times and rejection rates
6. **Comments**: Allow admin to add comments during review
7. **Scheduled Publishing**: Allow courses to be scheduled for future publication
8. **Revision Tracking**: Track course revision history

---

## Files Modified

### Backend

- `src/courses/courses.service.ts` - Added email notifications to approve/reject
- `src/admin/admin.service.ts` - Added course management methods
- `src/admin/admin.controller.ts` - Updated course endpoints
- `src/common/services/email.service.ts` - Email templates (already existed)

### Frontend

- `src/lib/api/adminService.ts` - Added course management methods
- `src/app/(dashboard)/admin/courses/pending/page.jsx` - New pending courses page

### No Changes Required

- `src/schemas/course.schema.ts` - Schema already had all necessary fields
- `src/courses/courses.controller.ts` - Endpoints already existed
- `src/app/(dashboard)/instructor/courses/page.jsx` - Already working correctly
- `src/app/(dashboard)/instructor/courses/upload/page.jsx` - Already working correctly

---

## Summary

The complete workflow is now implemented with:

1. ✅ Course creation saved immediately to database
2. ✅ Instructor can submit courses for approval
3. ✅ Admin receives email when course is submitted
4. ✅ Admin can view all pending courses in dedicated dashboard
5. ✅ Admin can approve/reject with feedback
6. ✅ Instructor receives email when course is approved/rejected
7. ✅ Course status updates appear immediately on instructor dashboard
8. ✅ Complete audit trail with timestamps

All email notifications are working, database persistence is verified, and the UI provides clear feedback at each step.
