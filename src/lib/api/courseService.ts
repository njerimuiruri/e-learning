
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.elearning.arin-africa.org';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true, // send httpOnly auth cookies with requests
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
  // Draft/Review/Publish Workflow
  saveLessonDraft: async (courseId, moduleIndex, lessonIndex, lessonData) => {
    const response = await api.put(`/courses/${courseId}/modules/${moduleIndex}/lessons/${lessonIndex}/draft`, lessonData);
    return response.data;
  },
  submitLessonForReview: async (courseId, moduleIndex, lessonIndex) => {
    const response = await api.put(`/courses/${courseId}/modules/${moduleIndex}/lessons/${lessonIndex}/submit`);
    return response.data;
  },
  approveLesson: async (courseId, moduleIndex, lessonIndex) => {
    const response = await api.put(`/courses/${courseId}/modules/${moduleIndex}/lessons/${lessonIndex}/approve`);
    return response.data;
  },
  saveModuleDraft: async (courseId, moduleIndex, moduleData) => {
    const response = await api.put(`/courses/${courseId}/modules/${moduleIndex}/draft`, moduleData);
    return response.data;
  },
  submitModuleForReview: async (courseId, moduleIndex) => {
    const response = await api.put(`/courses/${courseId}/modules/${moduleIndex}/submit`);
    return response.data;
  },
  approveModule: async (courseId, moduleIndex) => {
    const response = await api.put(`/courses/${courseId}/modules/${moduleIndex}/approve`);
    return response.data;
  },
    // Lock a module for editing
    lockModule: async (courseId, moduleIndex) => {
      const response = await api.post(`/courses/${courseId}/modules/${moduleIndex}/lock`);
      return response.data;
    },

    // Unlock a module after editing
    unlockModule: async (courseId, moduleIndex) => {
      const response = await api.post(`/courses/${courseId}/modules/${moduleIndex}/unlock`);
      return response.data;
    },

    // Lock a lesson for editing
    lockLesson: async (courseId, moduleIndex, lessonIndex) => {
      const response = await api.post(`/courses/${courseId}/modules/${moduleIndex}/lessons/${lessonIndex}/lock`);
      return response.data;
    },

    // Unlock a lesson after editing
    unlockLesson: async (courseId, moduleIndex, lessonIndex) => {
      const response = await api.post(`/courses/${courseId}/modules/${moduleIndex}/lessons/${lessonIndex}/unlock`);
      return response.data;
    },
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

  getInstructorCourseById: async (id) => {
    const response = await api.get(`/courses/instructor/course/${id}`);
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

  // Duplicate getEnrollment removed

  getResumeDestination: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/resume-destination`);
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

  // Lesson-level progress + resume pointer
  updateLessonProgress: async (enrollmentId, moduleIndex, lessonIndex, completed = false) => {
    const response = await api.post(`/courses/enrollment/${enrollmentId}/lesson-progress`, {
      moduleIndex,
      lessonIndex,
      completed,
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

  // Achievements
  getStudentAchievements: async () => {
    const response = await api.get('/courses/student/achievements');
    return response.data;
  },

  // Discussions
  createDiscussion: async (courseId, discussionData) => {
    const response = await api.post(`/courses/${courseId}/discussions`, discussionData);
    return response.data;
  },

  getDiscussions: async (
    courseId: string,
    moduleIndex?: number,
    options: { sortBy?: string; filterByStatus?: string } = {}
  ) => {
    const params: Record<string, any> = {};
    if (moduleIndex !== undefined) params.moduleIndex = moduleIndex;
    if (options.sortBy) params.sortBy = options.sortBy;
    if (options.filterByStatus) params.filterByStatus = options.filterByStatus;

    const response = await api.get(`/courses/${courseId}/discussions`, { params });
    return response.data;
  },

  markDiscussionRead: async (discussionId) => {
    const response = await api.post(`/courses/discussions/${discussionId}/read`);
    return response.data;
  },

  addDiscussionReply: async (discussionId, reply) => {
    const response = await api.post(`/courses/discussions/${discussionId}/reply`, reply);
    return response.data;
  },

  togglePinDiscussion: async (discussionId) => {
    const response = await api.post(`/courses/discussions/${discussionId}/pin`);
    return response.data;
  },

  likeDiscussion: async (discussionId) => {
    const response = await api.post(`/courses/discussions/${discussionId}/like`);
    return response.data;
  },

  incrementDiscussionViews: async (discussionId) => {
    const response = await api.post(`/courses/discussions/${discussionId}/view`);
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

  // Final Assessment
  createFinalAssessment: async (courseId, assessmentData) => {
    const response = await api.post(`/courses/${courseId}/final-assessment`, assessmentData);
    return response.data;
  },

  getFinalAssessment: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/final-assessment`);
    return response.data;
  },

  updateFinalAssessment: async (courseId, assessmentData) => {
    const response = await api.put(`/courses/${courseId}/final-assessment`, assessmentData);
    return response.data;
  },

  // Module Assessment
  submitModuleAssessment: async (enrollmentId, moduleIndex, answers) => {
    const response = await api.post(`/courses/enrollment/${enrollmentId}/module/${moduleIndex}/assessment`, {
      answers,
    });
    return response.data;
  },

  // Final Assessment Submission
  submitFinalAssessment: async (enrollmentId, answers) => {
    const response = await api.post(`/courses/enrollment/${enrollmentId}/final-assessment`, {
      answers,
    });
    return response.data;
  },

  getAssessmentForEnrollment: async (enrollmentId) => {
    const response = await api.get(`/courses/enrollment/${enrollmentId}/assessment`);
    return response.data;
  },

  // Restart Course
  restartCourse: async (enrollmentId) => {
    const response = await api.post(`/courses/enrollment/${enrollmentId}/restart`);
    return response.data;
  },

  // Soft Reset Course (only reset attempts, keep progress)
  softResetCourse: async (enrollmentId) => {
    const response = await api.post(`/courses/enrollment/${enrollmentId}/soft-reset`);
    return response.data;
  },

  // Get Attempt History
  getAttemptHistory: async (enrollmentId) => {
    const response = await api.get(`/courses/enrollment/${enrollmentId}/history`);
    return response.data;
  },

  // Get My Enrollments (alias for consistency)
  getMyEnrollments: async () => {
    const response = await api.get('/courses/student/my-enrollments');
    return response.data;
  },

  // Get specific enrollment by courseId
  getEnrollment: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/enrollment`);
    return response.data;
  },

  // Get final assessment submissions for a course (instructor)
  getCourseSubmissions: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/submissions`);
    return response.data;
  },

  // Submit assessment review with essay grades and feedback (instructor)
  submitAssessmentReview: async (reviewData) => {
    const response = await api.post('/courses/assessment/review', reviewData);
    return response.data;
  },

  // Download certificate
  downloadCertificate: async (certificateId) => {
    const response = await api.get(`/certificates/${certificateId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default courseService;

