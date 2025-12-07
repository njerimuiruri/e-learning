# Instructor Approval & Access Control System

## Overview

This system ensures that only **approved instructors** can access the instructor dashboard and related pages. Unapproved instructors are automatically redirected to appropriate pages based on their approval status.

---

## How It Works

### 1. **Login Flow**

When an instructor logs in:

- Frontend checks user role and instructor approval status
- If approved → Redirects to `/instructor/dashboard`
- If pending → Redirects to `/instructor/pending-approval`
- If rejected → Redirects to `/instructor/application-rejected`

### 2. **Approval Status Check**

The system fetches instructor status from:

```
GET /api/users/profile
```

Returns instructor approval status:

- `approved` - Can access all instructor features
- `pending` - Application under review
- `rejected` - Application was denied

### 3. **Protected Routes**

All instructor pages are wrapped with `ProtectedInstructorRoute` component which:

- Verifies instructor is logged in
- Checks approval status
- Redirects if not approved
- Shows loading state while checking

---

## Pages & Routes

### ✅ Public Instructor Pages (No Protection)

- `/instructor/pending-approval` - Pending approval status page
- `/instructor/application-rejected` - Rejection status page

### 🔒 Protected Instructor Pages (Approval Required)

- `/instructor/dashboard` - Main dashboard
- `/instructor/messages` - Messaging with students
- `/instructor/courses` - Course management (when created)
- All other instructor routes

---

## Implementation Details

### Home Page (`src/app/page.js`)

```javascript
useEffect(() => {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  if (token && userStr) {
    const user = JSON.parse(userStr);

    if (user.role === "instructor") {
      // Check approval status and redirect
      checkInstructorApproval(user._id, token);
    }
    // ... other roles
  }
}, [router]);
```

**Logic:**

- Instructor logs in successfully
- Token stored in localStorage
- Home page detects instructor role
- Calls `checkInstructorApproval()` to verify status
- Redirects to appropriate page

### Pending Approval Page (`src/app/(dashboard)/instructor/pending-approval/page.jsx`)

**Features:**

- Shows "Application Under Review" message
- Displays what happens next (3-step process)
- Shows instructor's registered details
- "Check Status Now" button - manually refresh approval status
- Auto-checks every 30 seconds for approval
- Auto-redirects when approved
- Logout button available

**User Experience:**

1. Instructor sees they're pending approval
2. Page auto-updates every 30 seconds
3. When admin approves, email is sent
4. Instructor can click "Check Status Now" or wait for auto-check
5. Page auto-redirects to dashboard when approved

### Application Rejected Page (`src/app/(dashboard)/instructor/application-rejected/page.jsx`)

**Features:**

- Shows rejection message
- Displays rejection reason (from admin feedback)
- "What You Can Do" section with actionable steps
- "Reapply" button to submit new application
- Logout button
- FAQ section
- Support contact information

**User Experience:**

1. Instructor sees application was rejected
2. Reads reason for rejection
3. Reviews feedback
4. Can either reapply or logout

### Protected Route Wrapper (`src/components/ProtectedInstructorRoute.jsx`)

```javascript
export default function ProtectedInstructorRoute({ children }) {
  useEffect(() => {
    const checkAccess = async () => {
      const token = localStorage.getItem("token");
      const authorized = await handleInstructorRedirect(router, token);

      if (authorized) {
        setIsAuthorized(true);
      }
      setIsChecking(false);
    };

    checkAccess();
  }, [router]);

  // Prevents rendering until access verified
}
```

**Usage:**

```javascript
export default function InstructorDashboardPage() {
  return (
    <ProtectedInstructorRoute>
      <InstructorDashboardContent />
    </ProtectedInstructorRoute>
  );
}
```

### Helper Functions (`src/lib/api/redirects.ts`)

```typescript
export const checkInstructorApproval = async (token) => {
  // Fetches instructor status from API
  // Returns: 'approved' | 'pending' | 'rejected' | null
};

export const handleInstructorRedirect = async (router, token) => {
  // Validates token
  // Checks approval status
  // Redirects if needed
  // Returns: true if authorized, false otherwise
};
```

---

## Admin Approval Workflow

### 1. **Instructor Registration**

```
POST /api/auth/register
Body: {
  firstName, lastName, email, password,
  institution, bio, role: "instructor"
}
```

- Status set to `pending` by default
- Registration email sent

### 2. **Admin Reviews Application**

- Admin goes to `/admin/instructors`
- Views pending applications
- Reviews CV, photo, bio
- Can approve or reject

### 3. **Admin Approves**

```
PUT /api/admin/instructors/:id/approve
```

- Status changed to `approved`
- Approval email sent to instructor
- Instructor can now login and access dashboard

### 4. **Instructor Receives Email**

- Approval email with login link
- Instructor logs in
- Auto-redirected to dashboard

---

## Email Templates

### Instructor Approval Email

```
Subject: Your Application Has Been Approved!

Hello [First Name],

Congratulations! Your instructor application has been approved.

You can now access the instructor dashboard and start creating courses.

Login URL: http://localhost:3000/auth/login

[Login Button]

Best regards,
E-Learning Platform Team
```

### Instructor Rejection Email

```
Subject: Application Status Update

Hello [First Name],

Thank you for your application. Unfortunately, it was not approved at this time.

Reason: [Rejection Reason]

You can submit a new application with improved credentials.

[Reapply Button]

Best regards,
E-Learning Platform Team
```

---

## Access Control Rules

### Who Can Access What?

| Route                              | Admin | Approved Instructor | Pending Instructor | Rejected Instructor | Student |
| ---------------------------------- | ----- | ------------------- | ------------------ | ------------------- | ------- |
| `/`                                | ✅    | ✅                  | ✅                 | ✅                  | ✅      |
| `/auth/login`                      | ✅    | ✅                  | ✅                 | ✅                  | ✅      |
| `/admin/*`                         | ✅    | ❌                  | ❌                 | ❌                  | ❌      |
| `/instructor/dashboard`            | ❌    | ✅                  | ❌                 | ❌                  | ❌      |
| `/instructor/messages`             | ❌    | ✅                  | ❌                 | ❌                  | ❌      |
| `/instructor/pending-approval`     | ❌    | ❌                  | ✅                 | ❌                  | ❌      |
| `/instructor/application-rejected` | ❌    | ❌                  | ❌                 | ✅                  | ❌      |
| `/student/*`                       | ❌    | ❌                  | ❌                 | ❌                  | ✅      |

---

## Testing the Feature

### 1. **Test Pending Approval Flow**

```
1. Create new instructor account
2. Don't approve yet
3. Try to login as instructor
4. Should see pending-approval page
5. Click "Check Status Now" - should still be pending
6. As admin, approve the instructor
7. Instructor clicks "Check Status Now"
8. Should redirect to dashboard
```

### 2. **Test Rejection Flow**

```
1. Create instructor account
2. As admin, reject with reason
3. Instructor logs in
4. Should see rejection page with reason
5. Click "Reapply" button
6. Should go to registration page
```

### 3. **Test Approved Instructor**

```
1. Create instructor account
2. As admin, approve
3. Instructor logs in
4. Should auto-redirect to dashboard
5. Can access /instructor/messages
6. Cannot access /admin routes
```

### 4. **Test Direct URL Access**

```
1. Login as pending instructor
2. Try to visit /instructor/dashboard directly
3. Should redirect to pending-approval page
4. After approval, can access dashboard
```

---

## Database Fields

### User Collection - Instructor Fields

```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String,
  password: String (hashed),
  role: "instructor",
  instructorStatus: "pending" | "approved" | "rejected",
  rejectionReason?: String,
  institution: String,
  bio: String,
  cvUrl?: String,
  profilePhotoUrl?: String,
  createdAt: Date,
  updatedAt: Date,
  approvedBy?: ObjectId (Admin ID),
  approvedAt?: Date,
  rejectedAt?: Date
}
```

---

## Configuration

### Environment Variables

```
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:5000
```

### API Endpoints Used

```
GET  /api/users/profile             - Get current user profile
POST /api/auth/register             - Register as instructor
POST /api/auth/login                - Login
PUT  /api/admin/instructors/:id/approve  - Admin approve
PUT  /api/admin/instructors/:id/reject   - Admin reject
```

---

## Security Considerations

1. ✅ **Token Validation** - All requests checked for valid JWT
2. ✅ **Server-Side Verification** - Backend verifies instructor status
3. ✅ **Role-Based Access** - Different pages for different statuses
4. ✅ **Email Verification** - Notifications sent to registered email
5. ✅ **Logout Available** - Users can logout anytime
6. ✅ **Session Management** - Tokens expire after set time

---

## Troubleshooting

### Issue: Instructor Stuck on Pending Page

**Solution:**

- Check if admin has approved in database
- Click "Check Status Now" button
- Hard refresh page (Ctrl+F5)
- Check email for approval notification

### Issue: Approved Instructor Can't Access Dashboard

**Solution:**

- Logout and login again
- Clear localStorage and cookies
- Check if token is valid
- Verify backend API is running

### Issue: Auto-Check Not Working

**Solution:**

- Browser console may show errors
- Check network tab for failed requests
- Verify API URL is correct
- Check backend is accessible

---

## Future Enhancements

1. **WebSocket Notifications** - Real-time approval notifications
2. **Email Verification** - Verify instructor email before approval
3. **Document Verification** - Verify uploaded documents
4. **Phone Verification** - Phone number verification
5. **Background Check** - Automated background checks
6. **Rating System** - Rate approved instructors
7. **Appeal Process** - Appeal rejected applications
8. **Admin Dashboard** - Track approval metrics

---

## Summary

The instructor approval system ensures:

- ✅ Only approved instructors access dashboards
- ✅ Pending instructors see status page
- ✅ Rejected instructors can reapply
- ✅ Auto-redirects on approval
- ✅ Email notifications sent
- ✅ Admin full control
- ✅ Secure and scalable
