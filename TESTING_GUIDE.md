# Quick Testing Guide - Instructor Approval Fix

## Prerequisites

- ✅ Backend running on http://localhost:5000
- ✅ Frontend running on http://localhost:3000
- ✅ One admin account for approvals
- ✅ Browser with DevTools (F12)

---

## 🎯 Test Scenario 1: Immediate Approval Check

**Time Required**: 2 minutes

### Steps:

1. **Open DevTools** (F12) and go to Console tab
2. **Login as pending instructor** at http://localhost:3000/auth/login
3. You should see console logs:
   ```
   Checking instructor approval status...
   Instructor approval status: pending
   Instructor pending, redirecting to pending-approval
   ```
4. **Click "Check Status Now"** button on pending-approval page
5. **In another browser tab**, open admin dashboard
6. **Approve the instructor** quickly
7. **Back on pending page**, click "Check Status Now" again
8. **Expected**: Redirects to dashboard within 1 second
9. **Verify console shows**:
   ```
   Instructor status: approved
   Redirecting to dashboard - approved
   ```

✅ **Test Passes If**: Redirects to `/instructor/dashboard` immediately after approval

---

## 🎯 Test Scenario 2: Automatic Detection (No Manual Click)

**Time Required**: 3 minutes

### Steps:

1. **Login as pending instructor**
2. **Go to pending-approval page** - watch the console
3. **Note the time**, count seconds
4. **In another browser**, go to admin and approve the instructor
5. **Back on pending page** - just wait, don't click anything
6. **Within 5 seconds**, should automatically redirect
7. **Check console** for logs showing auto-redirect

✅ **Test Passes If**: Automatic redirect happens within 5 seconds

---

## 🎯 Test Scenario 3: Fresh Login After Approval

**Time Required**: 5 minutes

### Steps:

1. **Register a new instructor account** at http://localhost:3000/auth/register
   - Choose "Instructor" role
   - Fill all fields
   - Submit
2. **Go to admin dashboard**, find the new instructor
3. **Click approve**
4. **Check email** - should receive approval notification
5. **Logout** (clear token)
6. **Login again** with the instructor credentials
7. **Expected**: Should NOT go to pending-approval page
8. **Expected**: Should go directly to `/instructor/dashboard`
9. **Check console logs**:
   ```
   Checking instructor approval status...
   Instructor approval status: approved
   Instructor approved, redirecting to dashboard
   ```

✅ **Test Passes If**: Direct redirect to dashboard on first login after approval

---

## 🎯 Test Scenario 4: Rejected Application

**Time Required**: 2 minutes

### Steps:

1. **Create or have a rejected instructor** in admin
2. **Login as rejected instructor**
3. **Expected**: Redirects to `/instructor/application-rejected` page
4. **Check page** shows rejection reason
5. **Click "Apply Again"** button
6. **Expected**: Takes to registration page with option to reapply
7. **Check console logs**:
   ```
   Instructor status: rejected
   Redirecting to rejection page - rejected
   ```

✅ **Test Passes If**: Rejected instructors see rejection page with reapply option

---

## 🔧 Debugging Console Logs

### Open DevTools

Press `F12` → Click "Console" tab

### What you should see:

**On Home Page (Initial Load)**:

```
Checking instructor approval status...
Instructor approval status: pending
Instructor pending, redirecting to pending-approval
```

**On Pending-Approval Page (Auto-Check)**:

```
Instructor status: pending
Instructor status: pending
Instructor status: pending
... (every 5 seconds)
Instructor status: approved ← When instructor is approved!
Redirecting to dashboard - approved
```

**On Manual Check**:

```
Instructor status: [whatever the current status is]
Redirecting to [appropriate page]
```

---

## 🌐 Network Tab Verification

1. Open DevTools → **Network** tab
2. Click "Check Status Now"
3. Look for request to: `api/users/profile`
4. Click on it, go to **Response** tab
5. Should show:

```json
{
  "data": {
    "_id": "...",
    "email": "...",
    "instructorStatus": "approved",
    ...
  }
}
```

✅ **Network Check Passes If**: API returns `"instructorStatus": "approved"` or `"pending"` or `"rejected"`

---

## 🧹 Clear Cache (If Needed)

If you see stale data or old behavior:

1. **DevTools** → **Application** tab
2. **Local Storage** → click on http://localhost:3000
3. **Delete** both keys:
   - `token`
   - `user`
4. **Close DevTools**
5. **Refresh page** (Ctrl+R)
6. **Login again**

---

## ✅ Success Checklist

After all tests pass:

- [ ] Test 1: Manual check redirects within 1 second ✅
- [ ] Test 2: Auto-check redirects within 5 seconds ✅
- [ ] Test 3: Fresh login goes directly to dashboard ✅
- [ ] Test 4: Rejected instructors see rejection page ✅
- [ ] Console logs appear as expected ✅
- [ ] No errors in console ✅
- [ ] Network requests show correct API responses ✅
- [ ] Page doesn't flash or flicker during redirect ✅

---

## ❌ Troubleshooting

**Q: Page doesn't redirect even after approval**

- A: Check console for error messages
- A: Click "Check Status Now" to force immediate check
- A: Clear localStorage (DevTools → Application → Clear All)
- A: Verify admin actually approved in admin panel

**Q: Console shows "Instructor status: pending" even after approval**

- A: The API didn't receive the approval yet
- A: Refresh page or wait 5 seconds for next auto-check
- A: Check MongoDB - is instructorStatus actually changed?

**Q: Getting 401 Unauthorized error**

- A: Token expired or invalid
- A: Clear localStorage and login again
- A: Check if token exists: DevTools → Application → Local Storage → token

**Q: Page redirects then comes back**

- A: Middleware might be redirecting back
- A: Check src/middleware.js for conflicting rules
- A: Clear browser cache completely

**Q: Can't see console logs**

- A: Make sure you're in Console tab (not Sources or Network)
- A: Refresh page (Ctrl+R)
- A: Check if logs are from this session (not previous)

---

## 📞 Need Help?

1. **Check logs first** - DevTools Console has all info
2. **Check Network tab** - See actual API responses
3. **Clear cache** - Sometimes old data causes issues
4. **Restart browser** - Fresh start often helps
5. **Check backend** - Make sure NestJS is running

---

**Last Updated**: 2024
**Created For**: Testing Instructor Approval Redirect Fix
**Expected Result**: 100% of tests pass ✅
