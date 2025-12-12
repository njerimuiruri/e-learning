# Admin Course Management - Diagnostic Guide

## The Issue

The admin dashboard shows "No courses found" when clicking on Course Management.

## Root Cause

**You are likely NOT logged in as an ADMIN user.**

The admin courses endpoint (`/api/admin/courses`) requires the user to have the role `admin`. If you're logged in as `instructor` or `student`, you will get a "Forbidden" error.

## Solution

### Step 1: Run the Admin Seeding Script

First, create the default admin user by running the seeding script:

```bash
cd c:\Users\HP\Desktop\Projects\Arin\elearning-backend
npm run build
npx nest start:seed
```

Or if that doesn't work, use:

```bash
npx ts-node src/seeds/admin.seed.ts
```

This will create an admin user with:

- **Email:** `admin@elearning.com`
- **Password:** `Admin@123456`

### Step 2: Logout from Current Account

1. Go to the login page
2. Click your profile icon (top right)
3. Click "Logout"

### Step 3: Login as Admin

1. Go to login page: `http://localhost:3000/login`
2. Enter:
   - **Email:** `admin@elearning.com`
   - **Password:** `Admin@123456`
3. Click Login

### Step 4: You Will Be Redirected to Admin Dashboard

After logging in as admin, you'll automatically be redirected to `/admin`

### Step 5: Click "Course Management"

Once on the admin dashboard, click on "Course Management" or navigate to `/admin/courses`

You should now see:

- ✅ All courses created by instructors
- ✅ Courses in all statuses (DRAFT, SUBMITTED, APPROVED, REJECTED, PUBLISHED)
- ✅ Instructor information
- ✅ Course thumbnails
- ✅ Approve/Reject buttons

## Verification

If you still see "No courses found", it means:

1. **No courses have been created yet** - Have an instructor create a course first
2. **Courses are in DRAFT status** - They won't appear yet. The instructor needs to SUBMIT the course
3. **API is failing** - Check browser console for errors:
   - Right-click → Inspect → Console tab
   - Look for red error messages
   - Screenshot and share the error

## Testing Workflow

1. **Login as Admin** (email: `admin@elearning.com`)
2. **Open instructor account in another browser/incognito window**
3. **Instructor creates a course:**
   - Go to `/instructor/courses/upload`
   - Fill in course details
   - Add modules and lessons
   - Upload a thumbnail image
   - Click "Create Course"
   - Course saved as DRAFT ✅
4. **Instructor submits course:**
   - Go to `/instructor/courses`
   - Click "Submit" on the course
   - Admin receives email
   - Course status changes to SUBMITTED
5. **Admin reviews:**
   - Go to `/admin/courses`
   - You should now SEE the course!
   - Click "Approve" or "Reject"
   - Instructor receives email ✅

## API Endpoints

### Admin Only Endpoints (Require admin@elearning.com login)

```
GET    /api/admin/courses              - Get ALL courses
GET    /api/admin/courses/pending      - Get pending courses only
PUT    /api/admin/courses/:id/approve  - Approve course
PUT    /api/admin/courses/:id/reject   - Reject course
```

### Public/Protected Endpoints (Any authenticated user)

```
GET    /api/courses                           - Only published courses
GET    /api/courses/:id                       - Course details
POST   /api/courses                           - Create course (instructor only)
GET    /api/courses/instructor/my-courses     - My courses (instructor only)
POST   /api/courses/:id/submit                - Submit for approval
```

## Common Errors

### Error: "Cannot read properties of undefined"

**Cause:** Not logged in as admin  
**Fix:** Login with `admin@elearning.com`

### Error: "Forbidden resource"

**Cause:** JWT token invalid or wrong role  
**Fix:** Logout and login again as admin

### "No courses found" but instructor created one

**Cause:** Course is in DRAFT status  
**Fix:** Instructor must click "Submit" to change to SUBMITTED status

### Admin receives no email

**Cause:** Email service not configured or course submitted before admin exists  
**Fix:** Create admin user, then have instructor submit course

## User Roles

| Role           | Email Example            | Access                                                |
| -------------- | ------------------------ | ----------------------------------------------------- |
| **Admin**      | `admin@elearning.com`    | Admin dashboard, all courses, approve/reject          |
| **Instructor** | `instructor@example.com` | Create courses, submit for approval, view own courses |
| **Student**    | `student@example.com`    | Browse published courses, enroll, view progress       |

## Database Check

If seeding script fails, you might need to:

1. Check MongoDB is running
2. Check MongoDB connection string in `.env`:
   ```
   MONGODB_URI=mongodb+srv://...
   ```
3. Verify the database exists and is accessible

## Still Not Working?

1. Check browser console for JavaScript errors
2. Check backend logs for API errors
3. Verify admin user was created:
   - Connect to MongoDB
   - Check `users` collection for email: `admin@elearning.com`
4. Share error message and screenshots

---

**Summary:** Login with admin credentials, then the Course Management page will show all instructor-created courses. 🎯
