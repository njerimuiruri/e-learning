# Instructor Approval and Login Flow Implementation

## Overview

This document describes the complete flow for handling instructor approval by admins and the subsequent login redirection to the instructor dashboard.

## Complete Flow

### 1. **Admin Approval Process**

When an admin approves an instructor application:

- Admin navigates to the admin dashboard and approves the instructor
- The `AdminService.approveInstructor()` method is called
- The instructor's `instructorStatus` is updated from `'pending'` to `'approved'`
- An approval email is sent to the instructor via `EmailService.sendInstructorApprovalEmail()`

### 2. **Email Sent to Instructor**

The approval email includes:

- A welcome message
- Login credentials (email and instructions to use registered password)
- A **"Click here to log in"** button that links to `http://localhost:3000/login`
- Message stating: "After logging in, you will be redirected to your instructor dashboard."

**Email Configuration:**

- `FRONTEND_URL` is set to `http://localhost:3000` in the backend `.env` file
- The email service properly constructs the login URL using this configuration
- File: `elearning-backend/src/common/services/email.service.ts`

### 3. **Login Page Behavior**

When an instructor clicks the login link and logs in:

- The login page (`elearning/src/app/(auth)/login/page.jsx`) now checks the instructor's approval status
- The response from the backend includes the `instructorStatus` field

**Login Flow Logic:**

```javascript
if (response.user.role === "instructor") {
  const instructorStatus = response.user.instructorStatus;
  if (instructorStatus === "approved") {
    router.replace("/instructor"); // Go to dashboard
  } else if (instructorStatus === "pending") {
    router.replace("/instructor/pending-approval"); // Show pending page
  } else if (instructorStatus === "rejected") {
    router.replace("/instructor/application-rejected"); // Show rejection page
  }
}
```

### 4. **Backend Login Modifications**

File: `elearning-backend/src/auth/auth.service.ts`

**Changes Made:**

- Removed the restriction that prevented non-approved instructors from logging in
- Now allows all instructors to log in regardless of approval status
- The login response includes the full user object with `instructorStatus` field
- Frontend handles the redirection based on this status

**This allows:**

- ✅ Approved instructors → Access instructor dashboard
- ✅ Pending instructors → See pending approval page
- ✅ Rejected instructors → See rejection page and reapply option

### 5. **Redirect Helper Functions**

File: `elearning/src/lib/api/redirects.ts`

**Key Functions:**

- `handleInstructorRedirect()` - Checks approval status from API
- `redirectBasedOnInstructorStatus()` - New helper for redirect logic based on status string

### 6. **Instructor Layout Protection**

File: `elearning/src/app/(dashboard)/instructor/layout.jsx`

**Updates:**

- Fixed the approval status check to use `instructorStatus` field instead of `approved`
- Checks: `user.instructorStatus === 'approved'`
- Shows pending approval message if not approved

### 7. **Protected Routes**

#### Instructor Dashboard (`/instructor`)

- Protected by `ProtectedInstructorRoute` component
- Only accessible if `instructorStatus === 'approved'`
- Uses the `handleInstructorRedirect()` helper function

#### Pending Approval Page (`/instructor/pending-approval`)

- Shows when instructor status is `'pending'`
- Displays message that admin team is reviewing
- Polls for approval status changes every 5 seconds
- Auto-redirects to dashboard when approved

#### Application Rejected Page (`/instructor/application-rejected`)

- Shows when instructor status is `'rejected'`
- Offers option to reapply or logout

## Database Schema

The user schema includes:

- `instructorStatus: enum` with values: `'pending'`, `'approved'`, `'rejected'`
- Default value: `'pending'` when instructor registers

File: `elearning-backend/src/schemas/user.schema.ts`

## Testing the Complete Flow

### Step 1: Register as Instructor

1. Go to `/register`
2. Fill in instructor details and register
3. You'll see a message: "Your account is pending approval"

### Step 2: Admin Approves Instructor

1. Log in as admin to `/admin`
2. Navigate to pending instructors
3. Click "Approve" button
4. Approval email is sent to instructor's email

### Step 3: Instructor Clicks Email Link

1. Open the approval email
2. Click "Click here to log in" button
3. You're redirected to `/login` page

### Step 4: Instructor Logs In

1. Enter email and password
2. System checks `instructorStatus` from login response
3. If `'approved'` → Redirected to `/instructor` dashboard ✅
4. If `'pending'` → Redirected to `/instructor/pending-approval`
5. If `'rejected'` → Redirected to `/instructor/application-rejected`

## Files Modified

1. **Frontend Changes:**

   - `elearning/src/app/(auth)/login/page.jsx` - Updated redirect logic
   - `elearning/src/lib/api/redirects.ts` - Enhanced helper functions
   - `elearning/src/app/(dashboard)/instructor/layout.jsx` - Fixed approval check

2. **Backend Changes:**
   - `elearning-backend/src/auth/auth.service.ts` - Removed login restriction for instructors

## Environment Configuration

**Backend `.env` file:**

```
FRONTEND_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=faith.muiruri@strathmore.edu
SMTP_FROM_EMAIL=faith.muiruri@strathmore.edu
```

## Email Template

The instructor approval email includes:

- ✅ Welcome message
- ✅ Login link button
- ✅ Instructions about dashboard redirection
- ✅ Support contact information

## Security Considerations

1. **Password Protection:** Instructors log in with their registered password
2. **Token-based Auth:** JWT tokens protect API endpoints
3. **Status-based Access:** Frontend and backend both verify approval status
4. **Email Verification:** Email notification proves ownership of email address

## Future Enhancements

1. Add email verification token for additional security
2. Implement SMS notifications for approvals
3. Add admin notes/comments in approval/rejection flow
4. Implement automatic email reminders for pending instructors
5. Add analytics dashboard showing approval metrics
