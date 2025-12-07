# Quick Code Reference - Replace Dummy Data with Real API Calls

This file shows you EXACTLY what code to change in each file to remove dummy data and use real API calls.

## 1. Student Dashboard (page.jsx)

### BEFORE (Current - Uses Dummy Data):

```javascript
import coursesData, { getStudentProgress } from "@/data/courses/courses";

export default function StudentDashboardPage() {
  const [studentProgress, setStudentProgress] = useState(null);

  useEffect(() => {
    const progress = getStudentProgress(); // ❌ DUMMY DATA
    setStudentProgress(progress);
  }, []);
}
```

### AFTER (Use Real API):

```javascript
import courseService from "@/lib/api/courseService";

export default function StudentDashboardPage() {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await courseService.getStudentDashboard(); // ✅ REAL API
      setStudentData(data);
    } catch (err) {
      setError("Failed to load dashboard");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  // Use studentData instead of studentProgress
  const stats = [
    { label: "XP", value: studentData?.totalXP || 0 },
    { label: "Certificates", value: studentData?.certificates?.length || 0 },
    // ... etc
  ];
}
```

---

## 2. Student Achievements (achievements/page.jsx)

### BEFORE:

```javascript
import coursesData, { getStudentProgress } from '@/data/courses/courses';

const achievements = [
    { id: 1, title: 'First Steps', earned: true, ... },  // ❌ HARDCODED
    // ... more hardcoded achievements
];
```

### AFTER:

```javascript
import courseService from "@/lib/api/courseService";

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const data = await courseService.getStudentDashboard(); // ✅ REAL API
      setAchievements(data.achievements || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Rest of component uses achievements from state
}
```

---

## 3. Student Certificates (certificates/page.jsx)

### BEFORE:

```javascript
const completedCourses = studentProgress?.enrolledCourses
    .filter(ec => ec.status === 'completed')  // ❌ FROM DUMMY DATA
    .map(ec => {
        const course = coursesData.find(c => c.id === ec.courseId);
        return { ...course, ... };
    });
```

### AFTER:

```javascript
import courseService from "@/lib/api/courseService";

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const data = await courseService.getStudentCertificates(); // ✅ REAL API
      setCertificates(data.certificates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimCertificate = async (courseId) => {
    try {
      await courseService.claimCertificate(courseId);
      alert("Certificate claimed!");
      fetchCertificates(); // Refresh
    } catch (err) {
      alert("Failed to claim certificate");
    }
  };

  const handleDownload = async (certificateId) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/certificates/${certificateId}/download`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${certificateId}.pdf`;
      a.click();
    } catch (err) {
      alert("Failed to download");
    }
  };
}
```

---

## 4. Admin Certificates (admin/certificates/page.jsx)

### BEFORE:

```javascript
const studentsData = [
  {
    id: 1,
    name: "Alice Johnson", // ❌ HARDCODED DUMMY DATA
    email: "alice@example.com",
    course: "Master Digital Marketing",
    status: "pending",
    // ...
  },
  // ... more dummy students
];
```

### AFTER:

```javascript
export default function CertificateManagementPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      // You may need to create this endpoint in backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/certificates`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      const data = await response.json();
      setCertificates(data.certificates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCertificate = async (studentId, courseId) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/certificates/issue`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ studentId, courseId }),
        }
      );
      alert("Certificate issued!");
      fetchCertificates();
    } catch (err) {
      alert("Failed to issue certificate");
    }
  };
}
```

---

## 5. Add Delete Button to Any Admin Page

### Pattern to Follow:

```javascript
export default function AdminPage() {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (userId) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeletingId(userId);
      await adminService.deleteUser(userId); // ✅ EXISTING API
      alert("User deleted successfully");
      fetchUsers(); // Refresh the list
    } catch (err) {
      alert("Failed to delete user");
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  // In your JSX:
  return (
    <button
      onClick={() => handleDelete(user._id)}
      disabled={deletingId === user._id}
      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
    >
      <Icons.Trash2 className="w-4 h-4" />
      {deletingId === user._id ? "Deleting..." : "Delete"}
    </button>
  );
}
```

---

## 6. Create Analytics Page (NEW FILE)

**File**: `src/app/(dashboard)/admin/analytics/page.jsx`

```javascript
"use client";

import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import adminService from "@/lib/api/adminService";

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await adminService.getDashboardStats(); // ✅ REAL API EXISTS!
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading analytics...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border">
          <h3 className="text-gray-600 text-sm mb-2">Total Users</h3>
          <p className="text-4xl font-bold">{stats?.totalUsers || 0}</p>
          <p className="text-green-600 text-sm mt-2">
            {stats?.userGrowth || "+0%"}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border">
          <h3 className="text-gray-600 text-sm mb-2">Active Users</h3>
          <p className="text-4xl font-bold">{stats?.activeUsers || 0}</p>
          <p className="text-blue-600 text-sm mt-2">
            {stats?.activeGrowth || "+0%"}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border">
          <h3 className="text-gray-600 text-sm mb-2">Total Students</h3>
          <p className="text-4xl font-bold">{stats?.totalStudents || 0}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border">
          <h3 className="text-gray-600 text-sm mb-2">Total Instructors</h3>
          <p className="text-4xl font-bold">{stats?.totalInstructors || 0}</p>
          <p className="text-yellow-600 text-sm mt-2">
            {stats?.pendingInstructors || 0} pending
          </p>
        </div>
      </div>

      {/* Fellows Section */}
      <div className="bg-white rounded-xl p-6 border mb-8">
        <h2 className="text-xl font-bold mb-4">Fellows Program</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-gray-600 text-sm">Total Fellows</p>
            <p className="text-3xl font-bold">{stats?.totalFellows || 0}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Active Fellows</p>
            <p className="text-3xl font-bold text-green-600">
              {stats?.activeFellows || 0}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Completion Rate</p>
            <p className="text-3xl font-bold text-blue-600">
              {stats?.fellowsPercentage || 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Add charts here using recharts or chart.js */}
    </div>
  );
}
```

---

## 7. Backend: Create Missing Endpoints (If Needed)

### Get All Certificates (Admin)

**File**: `elearning-backend/src/admin/admin.controller.ts`

```typescript
@Get('certificates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
async getAllCertificates() {
  // Implementation in admin.service.ts
  return this.adminService.getAllCertificates();
}
```

**File**: `elearning-backend/src/admin/admin.service.ts`

```typescript
async getAllCertificates() {
  // Get all certificates from enrollments or separate collection
  const certificates = await this.enrollmentModel
    .find({ certificateIssued: true })
    .populate('student', 'firstName lastName email')
    .populate('course', 'title')
    .sort({ certificateDate: -1 })
    .lean();

  return { certificates };
}
```

---

## 8. Common Error Handling Pattern

```javascript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

const fetchData = async () => {
  try {
    setLoading(true);
    setError("");
    const result = await apiCall();
    setData(result);
  } catch (err) {
    setError(err.message || "Failed to load data");
    console.error(err);
  } finally {
    setLoading(false);
  }
};

// In JSX:
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} />;
if (!data) return <EmptyState />;

return <DataDisplay data={data} />;
```

---

## 9. API Base URLs

Make sure your frontend knows where the backend is:

**File**: `.env.local` (in `elearning` folder)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**Usage in code**:

```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
```

---

## Summary of Changes

| File                            | Change                         | API Used                                 |
| ------------------------------- | ------------------------------ | ---------------------------------------- |
| `student/page.jsx`              | Replace `coursesData` with API | `courseService.getStudentDashboard()`    |
| `student/achievements/page.jsx` | Fetch achievements from API    | `courseService.getStudentDashboard()`    |
| `student/certificates/page.jsx` | Fetch certificates from API    | `courseService.getStudentCertificates()` |
| `admin/certificates/page.jsx`   | Fetch all certificates         | Create `GET /admin/certificates`         |
| `admin/analytics/page.jsx`      | NEW - Create analytics page    | `adminService.getDashboardStats()`       |
| `admin/fellows/page.jsx`        | ✅ DONE - Uses real API        | `adminService.getAllFellows()`           |
| `student/profile/page.jsx`      | ✅ DONE - Update profile       | `PUT /users/profile`                     |

---

## Need More Help?

1. See `NEXT_STEPS.md` for detailed implementation guide
2. See `EMAIL_SETUP_GUIDE.md` for email configuration
3. See `IMPLEMENTATION_SUMMARY.md` for overall architecture
4. Check backend API at: http://localhost:3001/api

All the backend APIs you need ALREADY EXIST! You just need to call them from the frontend.
