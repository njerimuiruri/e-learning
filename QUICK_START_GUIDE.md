# Quick Start Guide - Q&A System

## 🚀 Get Started in 5 Minutes

### Step 1: Start the Backend (1 minute)

```bash
cd elearning-backend
npm run start:dev
```

Backend runs on: `http://localhost:3001`

### Step 2: Test an Endpoint (1 minute)

**Using Postman:**

1. Create new request
2. Method: `GET`
3. URL: `http://localhost:3001/questions/admin/dashboard`
4. Headers:
   - Key: `Authorization`
   - Value: `Bearer YOUR_JWT_TOKEN`
5. Send

**Using cURL:**

```bash
curl -X GET http://localhost:3001/questions/admin/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Step 3: Create a Question (1 minute)

**Request:**

```bash
curl -X POST http://localhost:3001/questions/ask \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "your_course_id",
    "questionTitle": "How do I use React hooks?",
    "questionContent": "I am confused about useState and useEffect...",
    "priority": "high",
    "tags": ["react", "hooks", "javascript"]
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Question created successfully",
  "data": {
    "_id": "question123",
    "questionTitle": "How do I use React hooks?",
    "questionCategory": "technical",
    "aiConfidenceScore": 0.85,
    "status": "unanswered",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Step 4: View Dashboard (1 minute)

**Instructor Dashboard:**

```bash
curl -X GET http://localhost:3001/questions/instructor/dashboard \
  -H "Authorization: Bearer INSTRUCTOR_TOKEN"
```

**Admin Dashboard:**

```bash
curl -X GET http://localhost:3001/questions/admin/dashboard \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Step 5: Respond to Question (1 minute)

```bash
curl -X POST http://localhost:3001/questions/question123/respond \
  -H "Authorization: Bearer INSTRUCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "response": "Great question! React hooks allow you to use state...",
    "isPublic": true,
    "studentEmail": "student@example.com",
    "studentName": "John Doe"
  }'
```

---

## 📚 Core API Reference

### Student Asking a Question

```
POST /questions/ask

Body: {
  courseId: string (required),
  questionTitle: string (required),
  questionContent: string (required),
  priority?: "low" | "medium" | "high" | "urgent",
  tags?: string[],
  moduleIndex?: number,
  lessonId?: string
}

Returns: question object with AI categorization
```

### Instructor Responding

```
POST /questions/:questionId/respond

Body: {
  response: string (required),
  isPublic?: boolean,
  studentEmail: string (required),
  studentName: string (required)
}

Returns: question with response added
Note: Automatically sends email to student
```

### View My Questions (Student)

```
GET /questions/student/my-questions

Query:
  courseId?: string
  status?: "unanswered" | "pending" | "answered" | "resolved"
  page?: number (default 1)
  limit?: number (default 10)

Returns: paginated list of questions
```

### View Assigned Questions (Instructor)

```
GET /questions/instructor/dashboard

Query:
  page?: number (default 1)
  limit?: number (default 10)

Returns: questions + performance stats
```

### Admin Dashboard

```
GET /questions/admin/dashboard

Query:
  courseId?: string
  page?: number (default 1)
  limit?: number (default 20)

Returns: all questions + stats + activity + flagged
Note: Admin only
```

### Search Questions

```
GET /questions/search/:courseId

Query:
  q?: string (search term)
  status?: string
  category?: string
  priority?: string
  resolved?: boolean
  page?: number (default 1)
  limit?: number (default 10)

Returns: filtered questions
```

---

## 🔑 Required Headers

All requests require:

```
Authorization: Bearer <YOUR_JWT_TOKEN>
Content-Type: application/json
```

**Get JWT Token:**

1. Log in via `/auth/login`
2. Token returned in response
3. Use in Authorization header

---

## 📊 Question Status Flow

```
unanswered → pending → answered → resolved
     ↓
  (no answer yet)

pending
  ↓
(waiting for response or follow-up)

answered
  ↓
(student can rate/feedback)

resolved
  ↓
(closed/completed)
```

---

## 🏷️ AI Categories (Auto-Assigned)

- **technical** - Bugs, errors, "not working", troubleshooting
- **conceptual** - Explain, understand, theory, "how does"
- **assessment** - Assignment, quiz, exam, grade
- **general** - Everything else

---

## ⭐ Response Ratings

Students can rate instructor responses:

```
POST /questions/questionId/rate

Body: {
  rating: 1-5,
  feedback?: string
}
```

---

## 💡 Frontend Integration Tips

### 1. Store Token Securely

```javascript
// After login
localStorage.setItem("token", response.data.token);

// Use in requests
const headers = {
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
};
```

### 2. Create Question

```javascript
const askQuestion = async (courseId, title, content) => {
  const response = await fetch("/api/questions/ask", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      courseId,
      questionTitle: title,
      questionContent: content,
      priority: "medium",
    }),
  });
  return response.json();
};
```

### 3. Show Instructor Dashboard

```javascript
const showInstructorDashboard = async () => {
  const response = await fetch("/api/questions/instructor/dashboard", {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  const data = await response.json();
  // Render data.data (questions) and data.stats (metrics)
};
```

### 4. Handle Pagination

```javascript
const page = 1;
const limit = 10;
const url = `/api/questions/student/my-questions?page=${page}&limit=${limit}`;
const response = await fetch(url, { headers });
const { data, pagination } = await response.json();
// pagination: { page, limit, total, pages }
```

---

## 🐛 Testing Checklist

- [ ] Can create question as student
- [ ] Question gets AI category
- [ ] Email sent to instructor
- [ ] Instructor can view dashboard
- [ ] Instructor can respond
- [ ] Student gets email with response
- [ ] Student can see answer in dashboard
- [ ] Student can rate response
- [ ] Admin can see all questions
- [ ] Admin can flag questions
- [ ] Search works with filters
- [ ] Pagination works correctly

---

## ⚠️ Common Errors & Solutions

### Error: "Invalid token"

**Solution:** Make sure token is:

- Valid JWT from login
- Included in Authorization header
- Has Bearer prefix: `Bearer TOKEN`

### Error: "Unauthorized"

**Solution:** Check user role:

- Student: accessing student endpoints ✅
- Instructor: accessing instructor endpoints ✅
- Admin: accessing admin endpoints ✅

### Error: "Question not found"

**Solution:** Verify:

- questionId is correct
- Question belongs to your course
- Question hasn't been deleted

### Error: "Email not sent"

**Solution:** Check:

- SMTP configuration in `.env`
- Email address is valid
- Network connection to SMTP server

### Error: "MongoDB connection failed"

**Solution:** Verify:

- MongoDB is running
- MONGODB_URI in `.env` is correct
- Database exists

---

## 📈 Performance Tips

1. **Use Pagination**

   - Always include page and limit
   - Prevents loading huge datasets

2. **Use Status Filters**

   - Filter by status to reduce results
   - Better dashboard performance

3. **Use Indices**

   - Queries automatically use 7 indices
   - No need for additional tuning

4. **Cache Results**
   - Cache dashboard data for 5-10 minutes
   - Reduces API calls

---

## 📝 Sample Workflow

### 1. Student Path

```
1. Student logs in
2. Goes to course page
3. Clicks "Ask Question"
4. Fills: title, content, priority, tags
5. Submits
6. Question created with AI suggestion
7. Instructor receives email
8. Student sees question in "My Questions"
9. Student waits for response
10. When responded, gets email notification
11. Sees response in dashboard
12. Rates the response
```

### 2. Instructor Path

```
1. Instructor logs in
2. Goes to "Questions Dashboard"
3. Sees list of unanswered questions
4. Clicks on a question
5. Reads full question and AI suggestion
6. Writes response
7. Submits
8. Student automatically receives email
9. Response appears in their dashboard
10. Instructor sees stats on dashboard
```

### 3. Admin Path

```
1. Admin logs in
2. Goes to "Monitoring Dashboard"
3. Sees system stats
4. Sees recent activity
5. Sees flagged questions
6. Can click to view details
7. Can flag any question
```

---

## 🔗 Important Links

**Documentation:**

- Implementation: `/QA_SYSTEM_IMPLEMENTATION.md`
- Frontend Guide: `/QA_FRONTEND_INTEGRATION_GUIDE.md`
- Checklist: `/Q&A_SYSTEM_COMPLETE_IMPLEMENTATION_CHECKLIST.md`

**API Endpoints:**

- Base: `http://localhost:3001/questions`
- Auth: `Bearer YOUR_JWT_TOKEN`

**Database:**

- Collection: `questionanswers`
- Fields: 20
- Indices: 7

---

## 💻 Backend Stack

- **Framework:** NestJS
- **Database:** MongoDB
- **Auth:** JWT
- **Email:** SMTP (Gmail/Mailtrap)
- **Language:** TypeScript

---

## 🎯 Next Steps

1. ✅ Backend started and running
2. ✅ API endpoints tested
3. ⏳ Create frontend components
4. ⏳ Build frontend pages
5. ⏳ Test end-to-end
6. ⏳ Deploy to production

---

## 📞 Need Help?

**Check Documentation:**

1. Read `QA_SYSTEM_IMPLEMENTATION.md` for system details
2. Read `QA_FRONTEND_INTEGRATION_GUIDE.md` for API usage
3. Review code comments in service/controller

**Test with Postman:**

1. Import example requests
2. Test with sample data
3. Verify all endpoints work

**Debug Issues:**

1. Check browser console for errors
2. Check backend logs for issues
3. Verify database has data
4. Check email logs

---

**Status: ✅ READY TO USE**

Backend is running and all endpoints are functional!
