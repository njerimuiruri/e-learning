import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const courseService = {
  // Public - Get all published courses
  getAllCourses: async (filters = {}) => {
    const response = await api.get('/courses', { params: filters });
    return response.data;
  },

  getCourseById: async (id) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  // Instructor routes
  createCourse: async (courseData) => {
    const response = await api.post('/courses', courseData);
    return response.data;
  },

  getInstructorCourses: async () => {
    const response = await api.get('/courses/instructor/my-courses');
    return response.data;
  },

  updateCourse: async (id, updateData) => {
    const response = await api.put(`/courses/${id}`, updateData);
    return response.data;
  },

  submitCourse: async (id) => {
    const response = await api.post(`/courses/${id}/submit`);
    return response.data;
  },

  // Admin routes
  approveCourse: async (id, feedback) => {
    const response = await api.put(`/courses/${id}/approve`, { feedback });
    return response.data;
  },

  rejectCourse: async (id, reason) => {
    const response = await api.put(`/courses/${id}/reject`, { reason });
    return response.data;
  },

  publishCourse: async (id) => {
    const response = await api.put(`/courses/${id}/publish`);
    return response.data;
  },

  // Enrollment
  enrollCourse: async (courseId) => {
    const response = await api.post(`/courses/${courseId}/enroll`);
    return response.data;
  },

  getStudentEnrollments: async () => {
    const response = await api.get('/courses/student/my-enrollments');
    return response.data;
  },

  // Progress
  updateProgress: async (enrollmentId, moduleIndex, score, answers) => {
    const response = await api.post(`/courses/enrollment/${enrollmentId}/progress`, {
      moduleIndex,
      score,
      answers,
    });
    return response.data;
  },

  getProgress: async (enrollmentId) => {
    const response = await api.get(`/courses/enrollment/${enrollmentId}/progress`);
    return response.data;
  },

  // Certificates
  getStudentCertificates: async () => {
    const response = await api.get('/courses/student/certificates');
    return response.data;
  },

  // Discussions
  createDiscussion: async (courseId, discussionData) => {
    const response = await api.post(`/courses/${courseId}/discussions`, discussionData);
    return response.data;
  },

  getDiscussions: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/discussions`);
    return response.data;
  },

  addDiscussionReply: async (discussionId, reply) => {
    const response = await api.post(`/courses/discussions/${discussionId}/reply`, reply);
    return response.data;
  },

  // Dashboard
  getInstructorDashboard: async () => {
    const response = await api.get('/courses/dashboard/instructor');
    return response.data;
  },

  getStudentDashboard: async () => {
    const response = await api.get('/courses/dashboard/student');
    return response.data;
  },
};

export default courseService;
