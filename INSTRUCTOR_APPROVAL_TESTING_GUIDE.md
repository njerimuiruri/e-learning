# Instructor Approval Flow - Quick Testing Guide

## What Was Implemented

After an admin approves an instructor:

1. ✅ Approval email is sent with "Click here to log in" button
2. ✅ Button links to your login page
3. ✅ Instructor logs in with their credentials
4. ✅ System checks their approval status from the login response
5. ✅ If approved → Redirected to **Instructor Dashboard**
6. ✅ If pending → Redirected to **Pending Approval page** (polls every 5 seconds for approval)
7. ✅ If rejected → Redirected to **Application Rejected page** (can reapply)

## Step-by-Step Testing

### Phase 1: Instructor Registration

```
1. Go to http://localhost:3000/register
2. Click "Register as Instructor"
3. Fill in:
   - First Name: John
   - Last Name: Doe
   - Email: john@example.com
   - Password: password123
   - Phone: +1234567890
   - Institution: MIT
   - Bio: Experienced educator
   - Upload CV (PDF)
4. Click Register
5. See message: "Instructor registration submitted for approval"
```

### Phase 2: Admin Approval

```
1. Go to http://localhost:5000/admin (or your admin URL)
2. Navigate to "Pending Instructors" or "Instructor Management"
3. Find the instructor "John Doe"
4. Click "Approve" button
5. Confirmation: "Instructor approved successfully"
6. Check email: Approval email should arrive at john@example.com
```

### Phase 3: Instructor Receives Email

The email should contain:

```
Subject: Your Instructor Application Approved

Body:
- Welcome message
- "Great news! Your instructor application has been APPROVED"
- Login credentials (email and password reminder)
- GREEN BUTTON: "Click here to log in"
- "After logging in, you will be redirected to your instructor dashboard."
```

### Phase 4: Click Email Link

```
1. Open the approval email
2. Click the green "Click here to log in" button
3. Browser navigates to: http://localhost:3000/login
```

### Phase 5: Login as Approved Instructor

```
1. You're now on the login page
2. Enter credentials:
   - Email: john@example.com
   - Password: password123
3. Click "Sign In"
4. SUCCESS MESSAGE: "Welcome back, John Doe!"
5. Wait 500ms for redirect...
6. REDIRECTED TO: http://localhost:3000/instructor (Dashboard)
```

### Phase 6: Access Instructor Dashboard

```
1. You should now see:
   - Instructor sidebar on the left
   - Dashboard with stats (Total Courses, Active Students, etc.)
   - Recent activity
   - Upcoming deadlines
2. Navigation works properly
3. Can access:
   - /instructor/courses (Create/manage courses)
   - /instructor/students (View students)
   - /instructor/discussions (View discussions)
   - /instructor/messages (Send messages)
   - /instructor/profile (Edit profile)
```

## Testing Other Status Scenarios

### Scenario A: Pending Instructor Logs In

```
1. Register instructor but DON'T approve
2. Try logging in with their credentials
3. Expected: Redirected to /instructor/pending-approval
4. Message: "Application Under Review"
5. Page shows: "Our admin team is currently reviewing your application"
6. Email: john@example.com
7. Buttons:
   - "Return to Home"
   - "Logout"
8. When admin approves: Page auto-redirects to dashboard (polls every 5 seconds)
```

### Scenario B: Rejected Instructor Logs In

```
1. Register instructor as instructor
2. Admin clicks "Reject" with reason
3. Try logging in with their credentials
4. Expected: Redirected to /instructor/application-rejected
5. Message: "Your Application Was Not Approved"
6. Reason shown: (admin's rejection message)
7. Buttons:
   - "Reapply" (goes to register page)
   - "Logout"
```

## Code Changes Summary

### Backend (NestJS)

**File: `src/auth/auth.service.ts`**

- Removed: Login restriction for non-approved instructors
- Now: Allows all instructors to log in, returns `instructorStatus` in response
- Frontend handles the redirection based on status

### Frontend (Next.js)

**File: `src/app/(auth)/login/page.jsx`**

```javascript
// NEW LOGIC:
if (response.user.role === "instructor") {
  const instructorStatus = response.user.instructorStatus;
  if (instructorStatus === "approved") {
    router.replace("/instructor");
  } else if (instructorStatus === "pending") {
    router.replace("/instructor/pending-approval");
  } else if (instructorStatus === "rejected") {
    router.replace("/instructor/application-rejected");
  }
}
```

**File: `src/app/(dashboard)/instructor/layout.jsx`**

- Fixed: Now checks `user.instructorStatus === 'approved'` (was checking wrong field)

**File: `src/lib/api/redirects.ts`**

- Enhanced: Better helper functions for checking approval status

## Debugging Tips

If something doesn't work:

1. **Check Browser Console:**

   - Open DevTools (F12)
   - Check for JavaScript errors
   - Check Network tab for API calls

2. **Check Backend Logs:**

   ```
   If running NestJS server:
   - Look for "Login successful" message
   - Check if instructorStatus is being returned
   ```

3. **Verify User Data:**

   - Open DevTools → Application → LocalStorage
   - Look for "user" key
   - Check if it contains `instructorStatus` field

4. **Email Not Received:**

   - Check SPAM folder
   - Verify SMTP configuration in backend `.env`
   - Check backend logs for email sending errors

5. **Dashboard Not Loading:**
   - Verify instructor is marked as 'approved' in database
   - Check if authentication token is valid
   - Check browser console for errors

## Expected Behavior Summary

| User Status    | Login | Redirect To                        | Can Access Dashboard         |
| -------------- | ----- | ---------------------------------- | ---------------------------- |
| Approved       | ✅    | `/instructor`                      | ✅ Yes                       |
| Pending        | ✅    | `/instructor/pending-approval`     | ❌ No (shows pending page)   |
| Rejected       | ✅    | `/instructor/application-rejected` | ❌ No (shows rejection page) |
| Not Registered | ❌    | -                                  | -                            |

## Feature Checklist

- [x] Admin can approve instructor applications
- [x] Approval email is sent with login link
- [x] Login link goes to correct frontend URL
- [x] Instructor can log in regardless of approval status
- [x] Login returns `instructorStatus` in response
- [x] Approved instructors redirected to dashboard
- [x] Pending instructors redirected to pending-approval page
- [x] Rejected instructors redirected to application-rejected page
- [x] Pending page auto-refreshes and redirects when approved
- [x] Email has proper branding and instructions
- [x] All pages are properly protected with authentication

## Questions or Issues?

If you encounter any problems:

1. Check the debug tips above
2. Review the INSTRUCTOR_APPROVAL_LOGIN_FLOW.md document
3. Check the modified files listed in that document
