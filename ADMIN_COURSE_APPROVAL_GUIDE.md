# Admin Course Approval Guide

## How to Access Course Approvals

### Step 1: Login as Admin

- Navigate to the login page
- Enter admin credentials: `admin@elearning.com` / `Admin@123456`
- You'll be redirected to the admin dashboard at `/admin`

### Step 2: Access Pending Course Approvals

You have two ways to access pending approvals:

#### Option 1: Using the Sidebar Menu (Recommended)

1. Look at the left sidebar
2. Find **"Pending Course Approvals"** menu item (with a clock icon)
3. Click on it
4. You'll see all courses waiting for your approval

#### Option 2: Direct URL

- Navigate directly to: `/admin/courses/pending`

### Step 3: Review Course Details

When you see the pending courses list, each course card shows:

- ✅ Course thumbnail image
- ✅ Course title and description
- ✅ Category and level badges
- ✅ Number of modules
- ✅ Instructor name and email
- ✅ Submission date

### Step 4: Approve or Reject a Course

For each pending course, you have three action buttons:

1. **View Details Button**

   - Opens the complete course detail page
   - Shows all course information and modules

2. **Approve Button** (Green)

   - Click to approve the course
   - A modal opens showing:
     - Complete course information
     - All modules with their details
     - Instructor information
     - Text area for optional approval notes
   - Add any notes you want to send to the instructor
   - Click "Approve Course" to confirm
   - Instructor will receive approval email

3. **Reject Button** (Red)
   - Click to reject the course
   - A modal opens with same detailed view
   - **Rejection reason is REQUIRED**
   - Add explanation for why the course is being rejected
   - Click "Reject Course" to confirm
   - Instructor receives rejection email with your feedback

## What Happens After Approval

1. **Course Status Changes**: SUBMITTED → PUBLISHED
2. **Course Appears on Student Side**:
   - Homepage "Featured Courses" section
   - `/courses` Browse page
   - Students can now enroll
3. **Instructor Receives Email**: Approval confirmation
4. **Course Removed from Pending List**

## What Happens After Rejection

1. **Course Status Changes**: SUBMITTED → REJECTED
2. **Course Stays Hidden**: NOT visible to students
3. **Instructor Notified**: Rejection email with your feedback
4. **Instructor Can Resubmit**: After making changes

## Key Information Shown in Approval Modal

### Course Details Section

- Thumbnail image
- Title
- Description
- Category, Level, Module count badges

### Modules Section

Shows all modules with:

- Module number
- Title and description
- Duration and unit
- Number of lessons

### Instructor Information

- Full name
- Email address
- Submission date/time

### Pricing (if applicable)

- Course price or "Free"

## Admin Course Management Page

You can also manage all courses (approved and rejected) at:

- `/admin/courses` - Shows all courses in system
- Can view all course details
- Can see instructor information
- See enrollment statistics

## Tips

1. **Always review module content** before approving
2. **Check instructor information** is valid
3. **Add helpful feedback** in approval notes for rejected courses
4. **Check course thumbnails** are appropriate
5. **Verify course has at least 1 module** before approving

## Troubleshooting

### I can't see the "Pending Course Approvals" link

- Make sure you're logged in as admin
- Refresh the page
- Check that your browser cache is cleared

### The modal doesn't show course details

- Ensure instructor submitted a complete course
- Check browser console for errors
- Verify all course modules are saved

### Approval button doesn't work

- Check that you have stable internet connection
- Verify you're still logged in (check token in localStorage)
- Try refreshing the page and try again
