# Frontend Integration Guide - Q&A System

## Quick Start for Frontend Developers

This guide shows how to integrate the AI-powered Q&A system into your Next.js/React frontend.

---

## 📋 API Endpoints Reference

### Base URL

```
http://localhost:3001/questions
```

### Authentication

All requests require JWT token in Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## 🎓 Student Features

### 1. Ask a Question

**Endpoint:** `POST /questions/ask`

**Request:**

```javascript
const askQuestion = async (courseId, questionData) => {
  const response = await fetch("/api/questions/ask", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      courseId,
      questionTitle: "How do I use async/await?",
      questionContent:
        "I'm confused about how async/await works in JavaScript...",
      priority: "high", // low, medium, high, urgent
      tags: ["javascript", "async", "promises"],
      moduleIndex: 2,
      lessonId: "lesson123",
    }),
  });
  return response.json();
};
```

**Response:**

```javascript
{
  success: true,
  message: "Question created successfully",
  data: {
    _id: "question123",
    studentId: "user123",
    courseId: "course123",
    questionTitle: "How do I use async/await?",
    questionCategory: "technical",
    aiConfidenceScore: 0.75,
    aiSuggestedAnswer: "Based on your technical question, please check...",
    status: "unanswered",
    createdAt: "2024-01-15T10:30:00Z"
  }
}
```

### 2. View My Questions

**Endpoint:** `GET /questions/student/my-questions`

**Query Parameters:**

- `courseId` (optional) - Filter by course
- `status` (optional) - unanswered, pending, answered, resolved
- `page` (default: 1)
- `limit` (default: 10)

**Request:**

```javascript
const getMyQuestions = async (courseId, status, page = 1) => {
  const params = new URLSearchParams({
    ...(courseId && { courseId }),
    ...(status && { status }),
    page,
    limit: 10,
  });

  const response = await fetch(
    `/api/questions/student/my-questions?${params}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.json();
};
```

**Response:**

```javascript
{
  data: [
    {
      _id: "question123",
      questionTitle: "How do I use async/await?",
      status: "answered",
      respondedAt: "2024-01-15T11:00:00Z",
      studentRating: 5,
      helpfulCount: 3,
      createdAt: "2024-01-15T10:30:00Z"
    }
  ],
  pagination: {
    page: 1,
    limit: 10,
    total: 25,
    pages: 3
  }
}
```

### 3. View Question Details with Conversation

**Endpoint:** `GET /questions/:questionId`

**Request:**

```javascript
const getQuestion = async (questionId) => {
  const response = await fetch(`/api/questions/${questionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};
```

**Response:**

```javascript
{
  _id: "question123",
  questionTitle: "How do I use async/await?",
  questionContent: "I'm confused about...",
  instructorResponse: "Great question! Here's how async/await works...",
  conversationThread: [
    {
      senderId: "instructor1",
      senderType: "instructor",
      message: "Great question! Here's how async/await works...",
      createdAt: "2024-01-15T11:00:00Z"
    },
    {
      senderId: "student1",
      senderType: "student",
      message: "Thank you! But can you clarify the example with promises?",
      createdAt: "2024-01-15T11:30:00Z"
    }
  ],
  studentRating: 5,
  studentFeedback: "This was very helpful!"
}
```

### 4. Add Follow-Up Message

**Endpoint:** `POST /questions/:questionId/follow-up`

**Request:**

```javascript
const addFollowUp = async (questionId, message) => {
  const response = await fetch(`/api/questions/${questionId}/follow-up`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });
  return response.json();
};
```

### 5. Rate an Answer

**Endpoint:** `POST /questions/:questionId/rate`

**Request:**

```javascript
const rateAnswer = async (questionId, rating, feedback) => {
  const response = await fetch(`/api/questions/${questionId}/rate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      rating, // 1-5
      feedback: "Optional feedback text",
    }),
  });
  return response.json();
};
```

### 6. Mark Answer as Helpful

**Endpoint:** `POST /questions/:questionId/helpful`

**Request:**

```javascript
const markHelpful = async (questionId, isHelpful) => {
  const response = await fetch(`/api/questions/${questionId}/helpful`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ isHelpful: true }),
  });
  return response.json();
};
```

---

## 👨‍🏫 Instructor Features

### 1. View Dashboard

**Endpoint:** `GET /questions/instructor/dashboard`

**Request:**

```javascript
const getInstructorDashboard = async (page = 1) => {
  const response = await fetch(
    `/api/questions/instructor/dashboard?page=${page}&limit=10`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.json();
};
```

**Response:**

```javascript
{
  data: [
    {
      _id: "question123",
      questionTitle: "How do I use async/await?",
      status: "unanswered",
      priority: "high",
      studentId: { name: "John Doe", email: "john@example.com" },
      createdAt: "2024-01-15T10:30:00Z"
    }
  ],
  stats: {
    byStatus: [
      { _id: "unanswered", count: 5 },
      { _id: "answered", count: 12 }
    ],
    avgRating: 4.5,
    avgResponseTime: 2.3
  },
  pagination: { page: 1, limit: 10, total: 17, pages: 2 }
}
```

### 2. View Course Questions

**Endpoint:** `GET /questions/instructor/course/:courseId`

**Query Parameters:**

- `status` (optional) - Filter by status
- `page` (default: 1)
- `limit` (default: 10)

**Request:**

```javascript
const getCourseQuestions = async (courseId, status, page = 1) => {
  const params = new URLSearchParams({
    ...(status && { status }),
    page,
    limit: 10,
  });

  const response = await fetch(
    `/api/questions/instructor/course/${courseId}?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.json();
};
```

### 3. Respond to a Question

**Endpoint:** `POST /questions/:questionId/respond`

**Request:**

```javascript
const respondToQuestion = async (
  questionId,
  response,
  studentEmail,
  studentName
) => {
  const result = await fetch(`/api/questions/${questionId}/respond`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      response: "Here's my detailed answer to your question...",
      isPublic: true, // Make visible to all students
      studentEmail,
      studentName,
    }),
  });
  return result.json();
};
```

**Note:** This automatically sends an email to the student!

### 4. Mark as Resolved

**Endpoint:** `PUT /questions/:questionId/resolve`

**Request:**

```javascript
const resolveQuestion = async (questionId) => {
  const response = await fetch(`/api/questions/${questionId}/resolve`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};
```

---

## 🛡️ Admin Features

### 1. Monitor All Activity

**Endpoint:** `GET /questions/admin/dashboard`

**Query Parameters:**

- `courseId` (optional) - Filter by course
- `page` (default: 1)
- `limit` (default: 20)

**Request:**

```javascript
const getAdminDashboard = async (courseId, page = 1) => {
  const params = new URLSearchParams({
    ...(courseId && { courseId }),
    page,
    limit: 20,
  });

  const response = await fetch(`/api/questions/admin/dashboard?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};
```

**Response:**

```javascript
{
  questions: [...],
  systemStats: {
    total: 150,
    byStatus: {
      unanswered: 10,
      pending: 5,
      answered: 100,
      resolved: 35
    },
    byCategory: {
      technical: 50,
      conceptual: 40,
      assessment: 30,
      general: 30
    },
    byPriority: {
      low: 20,
      medium: 80,
      high: 40,
      urgent: 10
    },
    avgResponseTime: 2.5,
    avgRating: 4.3
  },
  recentActivity: [...],
  flaggedQuestions: [...]
}
```

### 2. Search Questions

**Endpoint:** `GET /questions/search/:courseId`

**Query Parameters:**

- `q` - Search term
- `status` - Filter by status
- `category` - Filter by category
- `priority` - Filter by priority
- `resolved` - Filter by resolution
- `page` (default: 1)
- `limit` (default: 10)

**Request:**

```javascript
const searchQuestions = async (courseId, searchTerm, filters = {}) => {
  const params = new URLSearchParams({
    q: searchTerm,
    ...filters,
    page: 1,
    limit: 10,
  });

  const response = await fetch(`/api/questions/search/${courseId}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};
```

### 3. Flag Question

**Endpoint:** `POST /questions/:questionId/flag`

**Request:**

```javascript
const flagQuestion = async (questionId, reason, notes) => {
  const response = await fetch(`/api/questions/${questionId}/flag`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reason: "duplicate", // or "inappropriate", "spam", etc
      notes: "This is a duplicate of question #123",
    }),
  });
  return response.json();
};
```

### 4. Find Similar Questions

**Endpoint:** `GET /questions/:questionId/similar`

**Request:**

```javascript
const getSimilarQuestions = async (questionId) => {
  const response = await fetch(`/api/questions/${questionId}/similar`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};
```

---

## 🎨 React Component Examples

### StudentQuestionForm Component

```jsx
import React, { useState } from "react";

const StudentQuestionForm = ({ courseId, onSuccess }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("medium");
  const [tags, setTags] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
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
          priority,
          tags: tags.split(",").map((t) => t.trim()),
        }),
      });

      const data = await response.json();
      setSuggestion(data.data.aiSuggestedAnswer);

      if (response.ok) {
        alert("Question asked successfully!");
        setTitle("");
        setContent("");
        setTags("");
        onSuccess?.(data.data);
      }
    } catch (error) {
      alert("Error asking question: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Ask a Question</h2>

      <div className="mb-4">
        <label className="block font-semibold mb-2">Question Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
          placeholder="What's your question?"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-2">Details *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={6}
          className="w-full border rounded px-3 py-2"
          placeholder="Provide more context about your question..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block font-semibold mb-2">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-2">Tags</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="javascript, async, promises"
          />
        </div>
      </div>

      {suggestion && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
          <p className="font-semibold text-blue-900">AI Suggestion:</p>
          <p className="text-blue-800">{suggestion}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Ask Question"}
      </button>
    </form>
  );
};

export default StudentQuestionForm;
```

### InstructorDashboard Component

```jsx
import React, { useState, useEffect } from "react";

const InstructorDashboard = () => {
  const [questions, setQuestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState("unanswered");
  const [loading, setLoading] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  useEffect(() => {
    fetchQuestions();
  }, [status]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/questions/instructor/dashboard?status=${status}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      const data = await response.json();
      setQuestions(data.data);
      setStats(data.stats);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (questionId, response) => {
    try {
      const result = await fetch(`/api/questions/${questionId}/respond`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          response,
          isPublic: true,
          studentEmail: selectedQuestion.studentId.email,
          studentName: selectedQuestion.studentId.name,
        }),
      });

      if (result.ok) {
        alert("Response sent!");
        setSelectedQuestion(null);
        fetchQuestions();
      }
    } catch (error) {
      alert("Error sending response: " + error.message);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Questions Dashboard</h1>

      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded">
            <p className="text-gray-600">Unanswered</p>
            <p className="text-2xl font-bold">
              {stats.byStatus.find((s) => s._id === "unanswered")?.count || 0}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded">
            <p className="text-gray-600">Avg Response Time</p>
            <p className="text-2xl font-bold">
              {stats.avgResponseTime?.toFixed(1)}h
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <p className="text-gray-600">Avg Rating</p>
            <p className="text-2xl font-bold">
              {stats.avgRating?.toFixed(1)}/5
            </p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <label className="mr-4">Filter by Status:</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="unanswered">Unanswered</option>
          <option value="pending">Pending</option>
          <option value="answered">Answered</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div
              key={q._id}
              className="border rounded p-4 hover:shadow-lg cursor-pointer"
              onClick={() => setSelectedQuestion(q)}
            >
              <h3 className="font-bold text-lg">{q.questionTitle}</h3>
              <p className="text-gray-600">{q.studentId?.name}</p>
              <span
                className={`badge ${
                  q.priority === "high" ? "bg-red-100" : "bg-blue-100"
                }`}
              >
                {q.priority}
              </span>
            </div>
          ))}
        </div>
      )}

      {selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-2xl font-bold mb-4">
              {selectedQuestion.questionTitle}
            </h2>
            <p className="mb-4">{selectedQuestion.questionContent}</p>

            <textarea
              placeholder="Write your response..."
              rows={6}
              className="w-full border rounded px-3 py-2 mb-4"
              id="response"
            />

            <button
              onClick={() =>
                handleRespond(
                  selectedQuestion._id,
                  document.getElementById("response").value
                )
              }
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Send Response
            </button>

            <button
              onClick={() => setSelectedQuestion(null)}
              className="ml-2 px-4 py-2 border rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorDashboard;
```

### AdminMonitoringDashboard Component

```jsx
import React, { useState, useEffect } from "react";

const AdminMonitoringDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/questions/admin/dashboard", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await response.json();
      setDashboard(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !dashboard) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Monitoring Dashboard</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded">
          <p className="text-gray-600">Total Questions</p>
          <p className="text-2xl font-bold">{dashboard.systemStats.total}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded">
          <p className="text-gray-600">Unanswered</p>
          <p className="text-2xl font-bold">
            {dashboard.systemStats.byStatus.unanswered}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <p className="text-gray-600">Resolved</p>
          <p className="text-2xl font-bold">
            {dashboard.systemStats.byStatus.resolved}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded">
          <p className="text-gray-600">Flagged</p>
          <p className="text-2xl font-bold">
            {dashboard.flaggedQuestions.length}
          </p>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Category Distribution</h2>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {Object.entries(dashboard.systemStats.byCategory).map(
          ([category, count]) => (
            <div key={category} className="bg-purple-50 p-4 rounded">
              <p className="capitalize">{category}</p>
              <p className="text-2xl font-bold">{count}</p>
            </div>
          )
        )}
      </div>

      <h2 className="text-xl font-bold mb-4">Flagged Questions</h2>
      <div className="space-y-2">
        {dashboard.flaggedQuestions.map((q) => (
          <div key={q._id} className="border-l-4 border-red-500 p-4 bg-red-50">
            <p className="font-bold">{q.questionTitle}</p>
            <p className="text-sm text-gray-600">{q.adminNotes}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminMonitoringDashboard;
```

---

## 🔌 Setting Up in Next.js

### Create API Routes

Create `pages/api/questions/[...slug].ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

const API_URL = "http://localhost:3001";

export default async function handler(req, res) {
  const { slug } = req.query;
  const path = slug.join("/");
  const token = req.headers.authorization?.split(" ")[1];

  try {
    const response = await fetch(`${API_URL}/questions/${path}`, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

## 📱 Status Options

- `unanswered` - Question asked but no instructor response yet
- `pending` - Waiting for instructor to respond
- `answered` - Instructor has responded
- `resolved` - Question marked as complete/helpful

---

## 🎯 Priority Levels

- `low` - Can be answered when time permits
- `medium` - Should be answered within 24-48 hours
- `high` - Should be answered within a few hours
- `urgent` - Needs immediate attention

---

## 📊 Question Categories (Auto-Assigned by AI)

- `technical` - Bug reports, errors, "not working" issues
- `conceptual` - Understanding concepts, theory, "explain" requests
- `assessment` - Assignment, quiz, exam, grade related
- `general` - Anything else

---

## 🔐 Authentication

All requests require valid JWT token. Token must be included in Authorization header:

```javascript
const token = localStorage.getItem("token"); // or from cookies

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};
```

---

## 📧 Email Templates

When students ask questions and instructors respond, emails are automatically sent with:

1. **Question Notification Email** - Sent to instructor

   - Student name
   - Question title and preview
   - Priority level
   - Direct link to answer

2. **Response Notification Email** - Sent to student
   - Full instructor response
   - Option to rate the answer
   - Link to view conversation

---

## ⚠️ Common Issues & Solutions

### Issue: CORS Error

**Solution:** Make sure the API URL is correctly configured and the backend is running on the expected port.

### Issue: Authentication Failed

**Solution:** Verify the JWT token is being sent correctly in the Authorization header.

### Issue: Email Not Sent

**Solution:** Check that SMTP configuration is correct in `.env` and email service is running.

### Issue: Question Not Created

**Solution:** Verify all required fields are provided (courseId, questionTitle, questionContent).

---

## 🧪 Testing Checklist

- [ ] Create a question as student
- [ ] Verify email sent to instructor
- [ ] Respond to question as instructor
- [ ] Verify email sent to student
- [ ] Rate the response as student
- [ ] View instructor dashboard
- [ ] View admin dashboard
- [ ] Search questions
- [ ] Flag a question
- [ ] Mark as helpful

---

## 📞 API Response Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## 🚀 Deployment

When deploying to production:

1. Update `FRONTEND_URL` in `.env` to your production domain
2. Update email templates with production links
3. Configure SMTP with production email account
4. Test email delivery end-to-end
5. Set up monitoring for API health
6. Consider adding rate limiting on asking/responding

---

**Status: ✅ READY FOR INTEGRATION**

All backend APIs are complete and ready for frontend integration. Follow the examples above to get started!
