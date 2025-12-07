# Instructor Dashboard - Complete Guide

## Overview

The instructor dashboard is a comprehensive platform for educators to create, manage, and track their courses. It features a beautiful green (#16a34a) gradient theme and provides all necessary tools for effective course management.

## Features Implemented

### 1. **Approval System** ✅

- Instructors must be approved by admin before accessing the dashboard
- Pending approval screen shows when instructor is not yet approved
- Email notification sent when approved (see email template)

### 2. **Main Dashboard** (`/instructor`)

- Overview statistics:
  - Total courses
  - Active students
  - Average rating
  - Pending reviews
- Quick action buttons
- Course list with management options
- Recent activity feed
- Upcoming deadlines tracker

### 3. **Profile Management** (`/instructor/profile`)

- Edit personal information
- Upload profile photo
- Add bio and expertise
- Social media links integration
- Institution details

### 4. **Course Management** (`/instructor/courses`)

- List all instructor's courses
- Filter by status (all, published, draft, pending)
- View course statistics
- Quick actions (view, edit)

### 5. **Course Upload** (`/instructor/courses/upload`)

- 3-step wizard:
  - Step 1: Course details (title, description, category, level, duration, price)
  - Step 2: Add modules and lessons with video support
  - Step 3: Review and submit for approval
- Video upload options:
  - YouTube/Vimeo URL
  - Direct video file upload
- Banner image upload
- Multiple modules support
- Multiple lessons per module

### 6. **Assessments** (`/instructor/assessments`)

- Create quizzes and exams
- Multiple question types:
  - Multiple choice
  - True/False
  - Short answer
- Set passing scores
- View assessment results
- Track student performance

### 7. **Student Responses** (`/instructor/students`)

- View all student submissions
- Filter by course and status
- Review student scores
- Provide personalized feedback
- Statistics dashboard

### 8. **Discussions** (`/instructor/discussions`)

- Two-panel interface (discussion list + detail view)
- View all student questions
- Respond to discussions
- Track answered vs unanswered
- Real-time engagement

### 9. **Email Template**

- Professional HTML email template
- Sent when instructor is approved
- Includes direct dashboard link
- Customizable with instructor details

## File Structure

```
src/
├── app/
│   └── (dashboard)/
│       └── instructor/
│           ├── layout.jsx                 # Main layout with approval check
│           ├── page.jsx                   # Dashboard home
│           ├── profile/
│           │   └── page.jsx              # Profile management
│           ├── courses/
│           │   ├── page.jsx              # Courses list
│           │   └── upload/
│           │       └── page.jsx          # Course upload wizard
│           ├── assessments/
│           │   └── page.jsx              # Assessments management
│           ├── students/
│           │   └── page.jsx              # Student responses
│           └── discussions/
│               └── page.jsx              # Q&A discussions
├── components/
│   └── instructor/
│       └── InstructorSidebar.jsx         # Navigation sidebar
└── templates/
    └── emails/
        ├── instructor-approval.html       # Email template
        └── README.md                      # Email usage guide
```

## Design System

### Color Palette

- **Primary Green**: `#16a34a`
- **Secondary**: `emerald-600`, `emerald-700`
- **Gradients**: `from-[#16a34a] to-emerald-600`
- **Accent Colors**: Blue, Yellow, Purple for different sections

### Typography

- **Headings**: Bold, gradient text effect
- **Body**: Gray scale for readability
- **Icons**: Lucide React icons throughout

### Components

- Rounded corners (`rounded-lg`, `rounded-xl`)
- Shadows for depth (`shadow-sm`, `shadow-lg`)
- Hover effects for interactivity
- Responsive grid layouts

## Usage Guide

### For Instructors

#### Getting Started

1. Register as an instructor at `/register`
2. Wait for admin approval
3. Check email for approval notification
4. Click the link to access dashboard
5. Complete your profile

#### Creating a Course

1. Navigate to "Upload Course" from sidebar or quick actions
2. **Step 1**: Fill in course details
   - Title, description, category
   - Set level and duration
   - Upload banner image
3. **Step 2**: Build course content
   - Create modules
   - Add lessons with videos
   - Can use YouTube URLs or upload files
4. **Step 3**: Review and submit
   - Course goes to admin for approval

#### Managing Students

1. Go to "Student Responses" page
2. Filter by course or status
3. Review submissions
4. Provide feedback using the feedback modal

#### Engaging in Discussions

1. Access "Discussions" page
2. Select a discussion from the list
3. Read student questions
4. Post replies directly

### For Developers

#### Adding New Features

**Add a new page:**

```bash
# Create new directory
mkdir -p src/app/(dashboard)/instructor/new-feature

# Create page
touch src/app/(dashboard)/instructor/new-feature/page.jsx
```

**Add navigation item:**

```javascript
// In InstructorSidebar.jsx
const menuItems = [
  // ... existing items
  {
    icon: "YourIcon",
    label: "New Feature",
    path: "/instructor/new-feature",
  },
];
```

#### Connecting to Backend

**Fetch instructor courses:**

```javascript
useEffect(() => {
  const fetchCourses = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const response = await fetch(`/api/courses/instructor/${user.id}`);
    const courses = await response.json();
    setInstructorCourses(courses);
  };
  fetchCourses();
}, []);
```

**Submit new course:**

```javascript
const handleSubmit = async () => {
  const formData = new FormData();
  formData.append("courseData", JSON.stringify(courseData));

  const response = await fetch("/api/courses/create", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: formData,
  });

  if (response.ok) {
    alert("Course submitted successfully!");
  }
};
```

#### Email Integration

**Send approval email (backend):**

```javascript
const sendApprovalEmail = async (instructor) => {
  const emailHTML = fs
    .readFileSync("templates/emails/instructor-approval.html", "utf8")
    .replace(
      "{{INSTRUCTOR_NAME}}",
      instructor.firstName + " " + instructor.lastName
    )
    .replace("{{EXPERTISE_AREA}}", instructor.expertise)
    .replace("{{INSTRUCTOR_EMAIL}}", instructor.email)
    .replace(
      "{{DASHBOARD_LINK}}",
      `${process.env.APP_URL}/instructor?approved=true`
    );

  await emailService.send({
    to: instructor.email,
    subject: "Your Instructor Application Has Been Approved!",
    html: emailHTML,
  });
};
```

## API Endpoints (Recommended)

### Instructor Management

- `GET /api/instructor/profile` - Get instructor profile
- `PUT /api/instructor/profile` - Update profile
- `GET /api/instructor/courses` - Get instructor's courses
- `POST /api/instructor/courses` - Create new course
- `PUT /api/instructor/courses/:id` - Update course
- `DELETE /api/instructor/courses/:id` - Delete course

### Assessments

- `GET /api/instructor/assessments` - Get all assessments
- `POST /api/instructor/assessments` - Create assessment
- `GET /api/instructor/assessments/:id/responses` - Get student responses

### Discussions

- `GET /api/instructor/discussions` - Get all discussions
- `POST /api/instructor/discussions/:id/reply` - Reply to discussion

## Testing

### Manual Testing Checklist

1. **Approval Flow**

   - [ ] Unapproved instructor sees pending screen
   - [ ] Approved instructor can access dashboard
   - [ ] Logout works correctly

2. **Dashboard**

   - [ ] Stats display correctly
   - [ ] Courses list shows instructor's courses only
   - [ ] Quick actions navigate correctly

3. **Course Upload**

   - [ ] All 3 steps work
   - [ ] Video URL input works
   - [ ] Video file upload works
   - [ ] Module creation works
   - [ ] Lesson addition works
   - [ ] Submit functionality works

4. **Profile**

   - [ ] Edit mode enables/disables inputs
   - [ ] Profile photo upload works
   - [ ] Save updates localStorage

5. **Assessments**

   - [ ] Create modal opens
   - [ ] Questions can be added
   - [ ] Different question types work
   - [ ] Save functionality works

6. **Student Responses**

   - [ ] Filters work
   - [ ] Feedback modal opens
   - [ ] Feedback can be saved

7. **Discussions**
   - [ ] List displays correctly
   - [ ] Selecting discussion shows details
   - [ ] Reply functionality works

## Future Enhancements

### Recommended Features

1. **Analytics Dashboard**

   - Revenue tracking
   - Student engagement metrics
   - Course performance graphs

2. **Live Classes**

   - Video conferencing integration
   - Schedule management
   - Recording storage

3. **Certificate Designer**

   - Custom certificate templates
   - Bulk generation
   - Email delivery

4. **Advanced Assessments**

   - Timed quizzes
   - Randomized questions
   - Plagiarism detection

5. **Notifications**

   - Real-time notifications
   - Email digests
   - Push notifications

6. **Mobile App**
   - React Native version
   - Push notifications
   - Offline mode

## Troubleshooting

### Common Issues

**Issue: Instructor sees pending screen even after approval**

- Check that `approved: true` is set in user object
- Clear localStorage and re-login
- Verify backend returns correct status

**Issue: Courses not showing**

- Check instructor email matches course instructor.email
- Verify coursesData is imported correctly
- Check browser console for errors

**Issue: Video upload not working**

- Check file size limits
- Verify MIME type is video/\*
- Ensure backend accepts multipart/form-data

**Issue: Email template variables not replaced**

- Check all {{VARIABLE}} placeholders are replaced
- Verify email service is configured
- Test with sample data first

## Support

For questions or issues:

- Check this documentation first
- Review the code comments
- Check browser console for errors
- Contact the development team

## License

Part of the E-Learning Platform project.
© 2025 All rights reserved.
