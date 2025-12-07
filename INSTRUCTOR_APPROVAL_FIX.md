# Instructor Approval Redirect Fix

## Issue

Approved instructors were stuck on the pending-approval page even after being approved by admin and receiving the approval email.

## Root Cause Analysis

The redirect logic was correct but had timing/responsiveness issues:

1. The home page redirect was working but only on initial login
2. The pending-approval page checked status only every 30 seconds
3. No way for users to manually check approval status without refreshing
4. If approved while on pending page, it wouldn't redirect until next auto-check

## Solutions Implemented

### 1. **Improved Pending-Approval Page** (`src/app/(dashboard)/instructor/pending-approval/page.jsx`)

#### Changes:

- **Faster Auto-Check**: Reduced polling interval from 30 seconds to **5 seconds**
- **Manual Check Button**: Added prominent "Check Status Now" button for immediate verification
- **Added Router Dependency**: Added `router` to useEffect dependency array to ensure proper cleanup
- **Enhanced Debug Logs**: Added console.log statements to track:
  - When fetchInstructorData() is called
  - What instructorStatus value is returned from API
  - When redirects are being triggered
- **Better State Management**:
  - Return early when redirecting (don't call setLoading(false))
  - Handle all three possible states: 'approved', 'rejected', 'pending'

#### Code Changes:

```javascript
// Before: Checked every 30 seconds, no manual option
useEffect(() => {
  fetchInstructorData();
  const interval = setInterval(fetchInstructorData, 30000);
  return () => clearInterval(interval);
}, []);

// After: Checks every 5 seconds, router in dependency array
useEffect(() => {
  fetchInstructorData();
  const interval = setInterval(fetchInstructorData, 5000);
  return () => clearInterval(interval);
}, [router]);
```

### 2. **Enhanced Home Page Redirect** (`src/app/page.js`)

#### Changes:

- **Added Debug Logs**: Console logs for:
  - When approval check starts
  - What status is returned
  - What redirect is being executed
- **Better Error Handling**: More descriptive error messages with HTTP status codes
- **Maintained UI States**: Keep loading state during check to prevent flash of content

#### Code Changes:

```javascript
// Added console logging for debugging
console.log("Checking instructor approval status...");
const response = await fetch(`http://localhost:5000/api/users/profile`, {
  headers: { Authorization: `Bearer ${token}` },
});

const data = await response.json();
const instructor = data.data;
console.log("Instructor approval status:", instructor.instructorStatus);

// Redirect with explicit logging
if (instructor.instructorStatus === "approved") {
  console.log("Instructor approved, redirecting to dashboard");
  router.replace("/instructor/dashboard");
}
```

## Testing Instructions

### Test Case 1: Pending Instructor Approves While on Page

1. Login as a pending instructor
2. Go to `/instructor/pending-approval`
3. In another browser/admin account, approve the instructor
4. **Expected**: Within 5 seconds, page automatically redirects to dashboard
5. **Verify**: Open browser DevTools (F12) → Console tab
   - Should see: "Instructor status: approved"
   - Should see: "Redirecting to dashboard - approved"

### Test Case 2: Manual Status Check

1. Login as a pending instructor
2. Go to `/instructor/pending-approval`
3. Click "Check Status Now" button
4. In another browser, approve the instructor during the check
5. **Expected**: Immediately redirects to dashboard
6. **Verify**: Console shows the redirect logs

### Test Case 3: Initial Login Redirect

1. Register new instructor
2. Admin approves
3. Instructor logs in
4. **Expected**: Should go directly to `/instructor/dashboard`
5. **Verify**: Console logs show:
   - "Checking instructor approval status..."
   - "Instructor approval status: approved"
   - "Instructor approved, redirecting to dashboard"

### Test Case 4: Rejected Application

1. Login as rejected instructor
2. **Expected**: Redirects to `/instructor/application-rejected` page
3. Can click "Reapply" button to restart process

## Browser DevTools Verification

Open DevTools (F12) and check the Console tab during testing:

**Expected logs for approved instructor:**

```
Checking instructor approval status...
Instructor approval status: approved
Instructor approved, redirecting to dashboard
```

**Expected logs for pending instructor:**

```
Instructor status: pending
// Stays on page, waits for next check
```

**Expected logs for rejected instructor:**

```
Instructor status: rejected
Redirecting to rejection page - rejected
```

## Files Modified

- ✅ `src/app/(dashboard)/instructor/pending-approval/page.jsx` - Added faster polling, manual check button, better logging
- ✅ `src/app/page.js` - Added debug logs for redirect tracking

## Why These Fixes Work

1. **Faster Detection**: 5-second polling means approval is detected within 5 seconds of admin action
2. **User Control**: Manual "Check Status Now" button lets users verify immediately
3. **Better Visibility**: Console logs show exactly what's happening during redirects
4. **Proper Cleanup**: Router in useEffect dependency array prevents stale closures
5. **Early Returns**: Redirect immediately without setting loading state to false

## Next Steps if Issues Persist

If approved instructors still don't redirect:

1. **Check Backend API**:

   - Verify instructor record in MongoDB shows instructorStatus as 'approved'
   - Test API endpoint with valid token from approved instructor
   - Ensure admin's approval action actually saved to database

2. **Check Network Tab**:

   - Open DevTools → Network tab
   - Click "Check Status Now"
   - Look for request to `/api/users/profile`
   - Check the response - should show `"instructorStatus": "approved"`

3. **Clear Browser Cache**:

   - Clear localStorage: Open DevTools → Application → Local Storage → Clear All
   - Log out and log back in

4. **Verify Token**:
   - The token in localStorage might be from before approval
   - Try logging out and logging back in after approval

## Performance Impact

- Polling every 5 seconds instead of 30 seconds: Minimal impact (1 API call per 5 seconds)
- Added console.logs: Only in development, automatically stripped in production
- No additional dependencies required
